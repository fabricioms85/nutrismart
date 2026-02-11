
import { supabase } from './supabaseClient';
import { TABLE_MEALS } from './mealService';

import { DailyStats } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

export const TABLE_DAILY_LOGS = 'daily_logs';

export interface WeeklyStatEntry {
    date: string;
    stats: DailyStats;
}

export async function getWeeklyStats(userId: string): Promise<WeeklyStatEntry[]> {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const dateLimit = getLocalDateString(sevenDaysAgo);

    // Fetch Meals (date column is YYYY-MM-DD)
    const { data: meals, error: mealsError } = await supabase
        .from(TABLE_MEALS)
        .select('*')
        .eq('user_id', userId)
        .gte('date', dateLimit);

    if (mealsError) {
        console.error('Error fetching meals for stats:', mealsError);
    }

    // Fetch Daily Logs (Water)
    const { data: logs, error: logsError } = await supabase
        .from(TABLE_DAILY_LOGS)
        .select('*')
        .eq('user_id', userId)
        .gte('date', dateLimit);

    if (logsError) {
        console.error('Error fetching daily logs for stats:', logsError);
    }

    const statsMap: Record<string, DailyStats> = {};

    // Initialize last 7 days (local timezone)
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = getLocalDateString(d);
        statsMap[dateStr] = {
            caloriesConsumed: 0,
            caloriesBurned: 0,
            proteinConsumed: 0,
            carbsConsumed: 0,
            fatsConsumed: 0,
            waterConsumed: 0
        };
    }

    // Aggregate Meals (meal.date is already YYYY-MM-DD in local time)
    meals?.forEach((meal: any) => {
        const dateStr = meal.date && String(meal.date).match(/^\d{4}-\d{2}-\d{2}$/) ? meal.date : getLocalDateString(new Date(meal.date));
        if (statsMap[dateStr]) {
            statsMap[dateStr].caloriesConsumed += meal.calories || 0;
            statsMap[dateStr].proteinConsumed += meal.protein || 0;
            statsMap[dateStr].carbsConsumed += meal.carbs || 0;
            statsMap[dateStr].fatsConsumed += meal.fats || 0;
        }
    });

    // Aggregate Daily Logs (Water) - log.date is YYYY-MM-DD
    logs?.forEach((log: any) => {
        const dateStr = log.date && String(log.date).match(/^\d{4}-\d{2}-\d{2}$/) ? log.date : getLocalDateString(new Date(log.date));
        if (statsMap[dateStr]) {
            statsMap[dateStr].waterConsumed += log.water_consumed || 0;
        }
    });

    // Sort by date ascending
    return Object.entries(statsMap)
        .map(([date, stats]) => ({ date, stats }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
