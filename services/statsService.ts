
import { supabase } from './supabaseClient';
import { TABLE_MEALS } from './mealService';

import { DailyStats } from '../types';

export const TABLE_DAILY_LOGS = 'daily_logs';

export interface WeeklyStatEntry {
    date: string;
    stats: DailyStats;
}

/** Get local date string YYYY-MM-DD for a date (avoids UTC shift). */
function toLocalDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Returns stats (meals, water) for the last N days. Same shape as getWeeklyStats.
 * Use this when the UI period is 7, 14, 30 or 90 days.
 */
export async function getStatsForPeriod(userId: string, days: number): Promise<WeeklyStatEntry[]> {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    const dateFrom = toLocalDateStr(start);

    const { data: meals, error: mealsError } = await supabase
        .from(TABLE_MEALS)
        .select('*')
        .eq('user_id', userId)
        .gte('date', dateFrom);

    if (mealsError) {
        console.error('Error fetching meals for stats:', mealsError);
    }

    const { data: logs, error: logsError } = await supabase
        .from(TABLE_DAILY_LOGS)
        .select('*')
        .eq('user_id', userId)
        .gte('date', dateFrom);

    if (logsError) {
        console.error('Error fetching daily logs for stats:', logsError);
    }

    const statsMap: Record<string, DailyStats> = {};
    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = toLocalDateStr(d);
        statsMap[dateStr] = {
            caloriesConsumed: 0,
            caloriesBurned: 0,
            proteinConsumed: 0,
            carbsConsumed: 0,
            fatsConsumed: 0,
            waterConsumed: 0
        };
    }

    meals?.forEach((meal: any) => {
        const dateStr = typeof meal.date === 'string' ? meal.date.split('T')[0] : new Date(meal.date).toISOString().split('T')[0];
        if (statsMap[dateStr]) {
            statsMap[dateStr].caloriesConsumed += meal.calories || 0;
            statsMap[dateStr].proteinConsumed += meal.macro_protein ?? meal.macros?.protein ?? meal.protein ?? 0;
            statsMap[dateStr].carbsConsumed += meal.macro_carbs ?? meal.macros?.carbs ?? meal.carbs ?? 0;
            statsMap[dateStr].fatsConsumed += meal.macro_fats ?? meal.macros?.fats ?? meal.fats ?? 0;
        }
    });

    logs?.forEach((log: any) => {
        const dateStr = typeof log.date === 'string' ? log.date.split('T')[0] : new Date(log.date).toISOString().split('T')[0];
        if (statsMap[dateStr]) {
            statsMap[dateStr].waterConsumed += log.water_consumed || 0;
        }
    });

    return Object.entries(statsMap)
        .map(([date, stats]) => ({ date, stats }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getWeeklyStats(userId: string): Promise<WeeklyStatEntry[]> {
    return getStatsForPeriod(userId, 7);
}
