
import { supabase } from './supabaseClient';
import { TABLE_DAILY_LOGS } from './statsService';

export async function logSymptom(userId: string, symptom: string, severity: number, notes?: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    // First check if a log exists for today
    const { data: existingLog } = await supabase
        .from(TABLE_DAILY_LOGS)
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    const symptomEntry = `Symptom: ${symptom} (Severity: ${severity})${notes ? ` - ${notes}` : ''}`;

    if (existingLog) {
        // Append to existing notes
        const newNotes = existingLog.notes
            ? `${existingLog.notes}\n${symptomEntry}`
            : symptomEntry;

        const { error } = await supabase
            .from(TABLE_DAILY_LOGS)
            .update({ notes: newNotes })
            .eq('id', existingLog.id);

        if (error) {
            throw new Error(`Falha ao registrar sintoma (atualização): ${error.message}`);
        }
    } else {
        // Create new log
        const { error } = await supabase
            .from(TABLE_DAILY_LOGS)
            .insert({
                user_id: userId,
                date: today,
                notes: symptomEntry,
                water_consumed: 0 // Default
            });

        if (error) {
            throw new Error(`Falha ao registrar sintoma: ${error.message}`);
        }
    }


    return true;
}

export async function getDailyLog(userId: string, date: string) {
    const { data } = await supabase
        .from(TABLE_DAILY_LOGS)
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();
    return data;
}

export async function updateWaterConsumed(userId: string, date: string, amount: number): Promise<boolean> {
    const existingLog = await getDailyLog(userId, date);

    if (existingLog) {
        const { error } = await supabase
            .from(TABLE_DAILY_LOGS)
            .update({ water_consumed: amount })
            .eq('id', existingLog.id);

        if (error) {
            throw new Error(`Falha ao atualizar consumo de água: ${error.message}`);
        }
    } else {
        const { error } = await supabase
            .from(TABLE_DAILY_LOGS)
            .insert({
                user_id: userId,
                date: date,
                water_consumed: amount,
                notes: ''
            });

        if (error) {
            throw new Error(`Falha ao registrar consumo de água: ${error.message}`);
        }
    }
    return true;
}
