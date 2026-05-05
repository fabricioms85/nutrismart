
import { supabase } from './supabaseClient';
import { Meal } from '../types';

export const TABLE_MEALS = 'meals';

// Helper to map DB row to Meal object
function mapToMeal(row: any): Meal {
    return {
        id: row.id,
        name: row.name,
        time: row.time,
        date: row.date,
        calories: row.calories,
        weight: row.weight_grams,
        ingredients: row.ingredients, // JSONB usually returned as object
        macros: {
            protein: row.macro_protein || 0,
            carbs: row.macro_carbs || 0,
            fats: row.macro_fats || 0,
        },
        type: row.meal_type,
        image: row.image_url,
    };
}

// Helper to map Meal object to DB row
// IMPORTANT: macro_protein, macro_carbs, macro_fats and calories are INTEGER in Postgres.
// Always round to avoid "invalid input syntax for type integer" errors.
function mapToDBMeal(meal: Partial<Meal>): any {
    const dbRow: any = {};
    if (meal.name !== undefined) dbRow.name = meal.name;
    if (meal.time !== undefined) dbRow.time = meal.time;
    if (meal.date !== undefined) dbRow.date = meal.date;
    if (meal.calories !== undefined) dbRow.calories = Math.round(Number(meal.calories));
    if (meal.weight !== undefined) dbRow.weight_grams = Math.round(Number(meal.weight));
    if (meal.ingredients !== undefined) dbRow.ingredients = meal.ingredients;
    if (meal.type !== undefined) dbRow.meal_type = meal.type;
    if (meal.image !== undefined) dbRow.image_url = meal.image;

    if (meal.macros) {
        if (meal.macros.protein !== undefined) dbRow.macro_protein = Math.round(Number(meal.macros.protein));
        if (meal.macros.carbs !== undefined) dbRow.macro_carbs = Math.round(Number(meal.macros.carbs));
        if (meal.macros.fats !== undefined) dbRow.macro_fats = Math.round(Number(meal.macros.fats));
    }

    return dbRow;
}

export async function getMeals(userId: string, date?: string): Promise<Meal[]> {
    let query = supabase.from(TABLE_MEALS).select('*').eq('user_id', userId);

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching meals:', error);
        return [];
    }
    return data.map(mapToMeal);
}

export async function addMeal(userId: string, meal: Omit<Meal, 'id'>): Promise<Meal | null> {
    const dbRow = mapToDBMeal(meal);
    const { data, error } = await supabase
        .from(TABLE_MEALS)
        .insert({ ...dbRow, user_id: userId })
        .select()
        .single();

    if (error) {
        throw new Error(`Falha ao adicionar refeição: ${error.message}`);
    }
    return mapToMeal(data);
}

export async function updateMeal(mealId: string, updates: Partial<Meal>): Promise<Meal> {
    const dbUpdates = mapToDBMeal(updates);
    console.log('[mealService.updateMeal] id:', mealId, 'payload:', dbUpdates);

    const { data, error } = await supabase
        .from(TABLE_MEALS)
        .update(dbUpdates)
        .eq('id', mealId)
        .select()
        .single();

    if (error) {
        console.error('[mealService.updateMeal] Supabase error:', error);
        throw new Error(`Falha ao atualizar refeição: ${error.message}`);
    }

    if (!data) {
        console.error('[mealService.updateMeal] Nenhuma linha retornada — RLS pode estar bloqueando o update');
        throw new Error('Atualização não surtiu efeito. Verifique as permissões.');
    }

    console.log('[mealService.updateMeal] Sucesso. Dados retornados:', data);
    return mapToMeal(data);
}

export async function deleteMeal(mealId: string): Promise<boolean> {
    const { error } = await supabase
        .from(TABLE_MEALS)
        .delete()
        .eq('id', mealId);

    if (error) {
        throw new Error(`Falha ao excluir refeição: ${error.message}`);
    }
    return true;
}

export async function getMealsPaginated(
    userId: string,
    options: {
        dateFrom?: string;
        dateTo?: string;
        limit: number;
        offset: number;
    }
): Promise<{ data: Meal[]; hasMore: boolean }> {
    let query = supabase
        .from(TABLE_MEALS)
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
        console.error('Error fetching meals paginated:', error);
        return { data: [], hasMore: false };
    }

    const meals = data ? data.map(mapToMeal) : [];
    const hasMore = (count ?? 0) > options.offset + meals.length;

    return { data: meals, hasMore };
}
