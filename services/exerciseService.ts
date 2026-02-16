
import { supabase } from './supabaseClient';
import { Exercise } from '../types';

export const TABLE_EXERCISES = 'exercises';

// Helper to map DB row to Exercise object
function mapToExercise(row: any): Exercise {
    return {
        id: row.id,
        name: row.name,
        durationMinutes: row.duration_minutes,
        caloriesBurned: row.calories_burned,
        intensity: row.intensity,
        time: row.time,
        date: row.date,
    };
}

// Helper to map Exercise object to DB row
function mapToDBExercise(exercise: Partial<Exercise>): any {
    const dbRow: any = {};
    if (exercise.name !== undefined) dbRow.name = exercise.name;
    if (exercise.durationMinutes !== undefined) dbRow.duration_minutes = exercise.durationMinutes;
    if (exercise.caloriesBurned !== undefined) dbRow.calories_burned = exercise.caloriesBurned;
    if (exercise.intensity !== undefined) dbRow.intensity = exercise.intensity;
    if (exercise.time !== undefined) dbRow.time = exercise.time;
    if (exercise.date !== undefined) dbRow.date = exercise.date;
    return dbRow;
}

export async function getExercises(userId: string, date?: string): Promise<Exercise[]> {
    let query = supabase.from(TABLE_EXERCISES).select('*').eq('user_id', userId);

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching exercises:', error);
        return [];
    }
    return data ? data.map(mapToExercise) : [];
}

/** Returns all exercises between dateFrom and dateTo (inclusive). Used for period totals (e.g. Progress). */
export async function getExercisesInPeriod(userId: string, dateFrom: string, dateTo: string): Promise<Exercise[]> {
    const { data, error } = await supabase
        .from(TABLE_EXERCISES)
        .select('*')
        .eq('user_id', userId)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching exercises in period:', error);
        return [];
    }
    return data ? data.map(mapToExercise) : [];
}

export async function addExercise(userId: string, exercise: Omit<Exercise, 'id'>): Promise<Exercise | null> {
    const dbRow = mapToDBExercise(exercise);
    const { data, error } = await supabase
        .from(TABLE_EXERCISES)
        .insert({ ...dbRow, user_id: userId })
        .select()
        .single();

    if (error) {
        throw new Error(`Falha ao adicionar exercício: ${error.message}`);
    }
    return mapToExercise(data);
}

export async function updateExercise(exerciseId: string, updates: Partial<Exercise>): Promise<boolean> {
    const dbUpdates = mapToDBExercise(updates);
    const { error } = await supabase
        .from(TABLE_EXERCISES)
        .update(dbUpdates)
        .eq('id', exerciseId);

    if (error) {
        throw new Error(`Falha ao atualizar exercício: ${error.message}`);
    }
    return true;
}

export async function deleteExercise(exerciseId: string): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE_EXERCISES)
        .delete()
        .eq('id', exerciseId);

    if (error) {
        throw new Error(`Falha ao excluir exercício: ${error.message}`);
    }
    return true;
}

export async function getExercisesPaginated(
    userId: string,
    options: {
        dateFrom?: string;
        dateTo?: string;
        limit: number;
        offset: number;
    }
): Promise<{ data: Exercise[]; hasMore: boolean }> {
    let query = supabase
        .from(TABLE_EXERCISES)
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(options.offset, options.offset + options.limit - 1);

    if (options.dateFrom) {
        query = query.gte('date', options.dateFrom);
    }
    if (options.dateTo) {
        query = query.lte('date', options.dateTo);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching exercises paginated:', error);
        return { data: [], hasMore: false };
    }

    const exercises = data ? data.map(mapToExercise) : [];
    const hasMore = (count ?? 0) > options.offset + exercises.length;

    return { data: exercises, hasMore };
}
