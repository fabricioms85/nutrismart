import { supabase } from './supabaseClient';
import type { User, Meal, Exercise, DailyStats } from '../types';

// ============ PROFILE FUNCTIONS ============

export async function getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return {
        name: data.name,
        email: data.email,
        avatarUrl: data.avatar_url,
        dailyCalorieGoal: data.daily_calorie_goal,
        dailyWaterGoal: data.daily_water_goal,
        weight: data.weight,
        height: data.height,
        age: data.age,
        gender: data.gender,
        goal: data.goal,
        activityLevel: data.activity_level,
        onboardingCompleted: data.onboarding_completed || false,
        macros: {
            protein: data.macro_protein,
            carbs: data.macro_carbs,
            fats: data.macro_fats,
        },
    };
}


export async function updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.dailyCalorieGoal !== undefined) dbUpdates.daily_calorie_goal = updates.dailyCalorieGoal;
    if (updates.dailyWaterGoal !== undefined) dbUpdates.daily_water_goal = updates.dailyWaterGoal;
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
    if (updates.height !== undefined) dbUpdates.height = updates.height;
    if (updates.age !== undefined) dbUpdates.age = updates.age;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.goal !== undefined) dbUpdates.goal = updates.goal;
    if (updates.activityLevel !== undefined) dbUpdates.activity_level = updates.activityLevel;
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
    if (updates.macros) {
        dbUpdates.macro_protein = updates.macros.protein;
        dbUpdates.macro_carbs = updates.macros.carbs;
        dbUpdates.macro_fats = updates.macros.fats;
    }

    const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId);

    if (error) {
        console.error('Error updating profile:', error);
        return false;
    }

    return true;
}

// Complete onboarding with all data
export interface OnboardingData {
    weight: number;
    height: number;
    age: number;
    gender: 'masculino' | 'feminino' | 'outro';
    goal: string;
    activityLevel: string;
    dailyCalorieGoal: number;
    dailyWaterGoal: number;
    macros: {
        protein: number;
        carbs: number;
        fats: number;
    };
}

export async function completeOnboarding(userId: string, data: OnboardingData): Promise<boolean> {
    const { error } = await supabase
        .from('profiles')
        .update({
            weight: data.weight,
            height: data.height,
            age: data.age,
            gender: data.gender,
            goal: data.goal,
            activity_level: data.activityLevel,
            daily_calorie_goal: data.dailyCalorieGoal,
            daily_water_goal: data.dailyWaterGoal,
            macro_protein: data.macros.protein,
            macro_carbs: data.macros.carbs,
            macro_fats: data.macros.fats,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    if (error) {
        console.error('Error completing onboarding:', error);
        return false;
    }

    // Also add initial weight entry
    await addWeightEntry(userId, data.weight);

    return true;
}


// ============ MEALS FUNCTIONS ============

export async function getMeals(userId: string, date?: string): Promise<Meal[]> {
    let query = supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching meals:', error);
        return [];
    }

    return data.map((meal) => ({
        id: meal.id,
        name: meal.name,
        time: meal.time,
        date: meal.date,
        calories: meal.calories,
        weight: meal.weight_grams,
        ingredients: meal.ingredients || [],
        macros: {
            protein: meal.macro_protein,
            carbs: meal.macro_carbs,
            fats: meal.macro_fats,
        },
        type: meal.meal_type as Meal['type'],
        image: meal.image_url,
    }));
}

export async function getTodayMeals(userId: string): Promise<Meal[]> {
    const today = new Date().toISOString().split('T')[0];
    return getMeals(userId, today);
}

export async function addMeal(userId: string, meal: Omit<Meal, 'id'>): Promise<Meal | null> {
    // Validate input
    if (!userId) {
        console.error('addMeal: userId is required');
        return null;
    }

    if (!meal.name || meal.name.trim() === '') {
        console.error('addMeal: meal name is required');
        return null;
    }

    const mealData = {
        user_id: userId,
        name: meal.name.trim(),
        meal_type: meal.type || 'snack',
        time: meal.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: meal.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        // IMPORTANT: PostgreSQL columns are INTEGER type, so we MUST round to avoid "22P02" error
        calories: Math.round(Math.max(0, meal.calories || 0)),
        weight_grams: meal.weight && meal.weight > 0 ? Math.round(meal.weight) : null,
        macro_protein: Math.round(Math.max(0, meal.macros?.protein || 0)),
        macro_carbs: Math.round(Math.max(0, meal.macros?.carbs || 0)),
        macro_fats: Math.round(Math.max(0, meal.macros?.fats || 0)),
        ingredients: meal.ingredients || [],
        image_url: meal.image || null,
    };

    const { data, error } = await supabase
        .from('meals')
        .insert(mealData)
        .select()
        .single();

    if (error) {
        console.error('Error adding meal:', {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            mealData: { ...mealData, image_url: mealData.image_url ? '[IMAGE]' : null }
        });
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        time: data.time,
        date: data.date,
        calories: data.calories,
        weight: data.weight_grams,
        ingredients: data.ingredients || [],
        macros: {
            protein: data.macro_protein,
            carbs: data.macro_carbs,
            fats: data.macro_fats,
        },
        type: data.meal_type as Meal['type'],
        image: data.image_url,
    };
}

export async function updateMeal(mealId: string, updates: Partial<Meal>): Promise<boolean> {
    const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.meal_type = updates.type;
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    // IMPORTANT: PostgreSQL columns are INTEGER type, so we MUST round
    if (updates.calories !== undefined) dbUpdates.calories = Math.round(updates.calories);
    if (updates.weight !== undefined) dbUpdates.weight_grams = updates.weight ? Math.round(updates.weight) : null;
    if (updates.ingredients !== undefined) dbUpdates.ingredients = updates.ingredients;
    if (updates.image !== undefined) dbUpdates.image_url = updates.image;
    if (updates.macros) {
        dbUpdates.macro_protein = Math.round(updates.macros.protein || 0);
        dbUpdates.macro_carbs = Math.round(updates.macros.carbs || 0);
        dbUpdates.macro_fats = Math.round(updates.macros.fats || 0);
    }

    const { error } = await supabase
        .from('meals')
        .update(dbUpdates)
        .eq('id', mealId);

    if (error) {
        console.error('Error updating meal:', error);
        return false;
    }

    return true;
}

export async function deleteMeal(mealId: string): Promise<boolean> {
    const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

    if (error) {
        console.error('Error deleting meal:', error);
        return false;
    }

    return true;
}

// ============ EXERCISES FUNCTIONS ============

export async function getExercises(userId: string, date?: string): Promise<Exercise[]> {
    let query = supabase
        .from('exercises')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching exercises:', error);
        return [];
    }

    return data.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        durationMinutes: exercise.duration_minutes,
        caloriesBurned: exercise.calories_burned,
        intensity: exercise.intensity,
        time: exercise.time,
        date: exercise.date,
    }));
}

export async function getTodayExercises(userId: string): Promise<Exercise[]> {
    const today = new Date().toISOString().split('T')[0];
    return getExercises(userId, today);
}

export async function addExercise(userId: string, exercise: Omit<Exercise, 'id'>): Promise<Exercise | null> {
    const { data, error } = await supabase
        .from('exercises')
        .insert({
            user_id: userId,
            name: exercise.name,
            duration_minutes: exercise.durationMinutes,
            calories_burned: exercise.caloriesBurned,
            intensity: exercise.intensity,
            time: exercise.time,
            date: exercise.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding exercise:', error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        durationMinutes: data.duration_minutes,
        caloriesBurned: data.calories_burned,
        intensity: data.intensity,
        time: data.time,
        date: data.date,
    };
}

export async function deleteExercise(exerciseId: string): Promise<boolean> {
    const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId);

    if (error) {
        console.error('Error deleting exercise:', error);
        return false;
    }

    return true;
}

// ============ DAILY LOGS (WATER) FUNCTIONS ============

export async function getDailyLog(userId: string, date: string) {
    const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching daily log:', error);
        return null;
    }

    return data;
}

export async function updateWaterConsumption(userId: string, amount: number, date?: string): Promise<number> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Try to get existing log
    const existingLog = await getDailyLog(userId, targetDate);

    if (existingLog) {
        const newAmount = Math.max(0, existingLog.water_consumed + amount);
        const { error } = await supabase
            .from('daily_logs')
            .update({
                water_consumed: newAmount,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingLog.id);

        if (error) {
            console.error('Error updating water:', error);
            return existingLog.water_consumed;
        }

        return newAmount;
    } else {
        // Create new log
        const newAmount = Math.max(0, amount);
        const { error } = await supabase
            .from('daily_logs')
            .insert({
                user_id: userId,
                date: targetDate,
                water_consumed: newAmount,
            });

        if (error) {
            console.error('Error creating daily log:', error);
            return 0;
        }

        return newAmount;
    }
}

export async function getTodayWater(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const log = await getDailyLog(userId, today);
    return log?.water_consumed || 0;
}

// ============ ACHIEVEMENTS FUNCTIONS ============

export async function getUnlockedAchievements(userId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching achievements:', error);
        return [];
    }

    return data.map((a) => a.achievement_id);
}

export async function unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
    const { error } = await supabase
        .from('user_achievements')
        .insert({
            user_id: userId,
            achievement_id: achievementId,
        });

    if (error) {
        // Ignore duplicate errors
        if (error.code === '23505') return true;
        console.error('Error unlocking achievement:', error);
        return false;
    }

    return true;
}

// ============ WEIGHT HISTORY FUNCTIONS ============

export async function getWeightHistory(userId: string, limit = 30) {
    const { data, error } = await supabase
        .from('weight_history')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching weight history:', error);
        return [];
    }

    return data.map((entry) => ({
        day: entry.date,
        weight: Number(entry.weight),
    }));
}

export async function addWeightEntry(userId: string, weight: number, date?: string): Promise<boolean> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { error } = await supabase
        .from('weight_history')
        .upsert({
            user_id: userId,
            weight: weight,
            date: targetDate,
        }, {
            onConflict: 'user_id,date',
        });

    if (error) {
        console.error('Error adding weight entry:', error);
        return false;
    }

    // Also update user profile
    await updateProfile(userId, { weight });

    return true;
}

// ============ STATS CALCULATION ============

export async function calculateDailyStats(userId: string, date?: string): Promise<DailyStats> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [meals, exercises, waterLog] = await Promise.all([
        getMeals(userId, targetDate),
        getExercises(userId, targetDate),
        getDailyLog(userId, targetDate),
    ]);

    return {
        caloriesConsumed: meals.reduce((acc, meal) => acc + meal.calories, 0),
        caloriesBurned: exercises.reduce((acc, ex) => acc + ex.caloriesBurned, 0),
        proteinConsumed: meals.reduce((acc, meal) => acc + meal.macros.protein, 0),
        carbsConsumed: meals.reduce((acc, meal) => acc + meal.macros.carbs, 0),
        fatsConsumed: meals.reduce((acc, meal) => acc + meal.macros.fats, 0),
        waterConsumed: waterLog?.water_consumed || 0,
    };
}

// ============ NEW: CONSISTENCY & ANALYTICS ============

export async function getWeeklyStats(userId: string): Promise<{ date: string; stats: DailyStats; achieved: boolean }[]> {
    const dates = [];
    const today = new Date();

    // Generate last 7 days (including today)
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // Bulk fetch for efficiency
    const [{ data: meals }, { data: exercises }, { data: logs }] = await Promise.all([
        supabase.from('meals').select('*').eq('user_id', userId).gte('date', startDate).lte('date', endDate),
        supabase.from('exercises').select('*').eq('user_id', userId).gte('date', startDate).lte('date', endDate),
        supabase.from('daily_logs').select('*').eq('user_id', userId).gte('date', startDate).lte('date', endDate)
    ]);

    const result = dates.map(date => {
        const DayMeals = meals?.filter(m => m.date === date) || [];
        const DayExercises = exercises?.filter(e => e.date === date) || [];
        const DayLog = logs?.find(l => l.date === date);

        const caloriesConsumed = DayMeals.reduce((acc, m) => acc + m.calories, 0);
        const caloriesBurned = DayExercises.reduce((acc, e) => acc + e.calories_burned, 0);
        const waterConsumed = DayLog ? DayLog.water_consumed : 0;

        // Simple achievement logic: Any meaningful activity
        const achieved = caloriesConsumed > 0 || caloriesBurned > 0 || waterConsumed > 0;

        return {
            date,
            achieved,
            stats: {
                caloriesConsumed,
                caloriesBurned,
                proteinConsumed: DayMeals.reduce((acc, m) => acc + m.macro_protein, 0),
                carbsConsumed: DayMeals.reduce((acc, m) => acc + m.macro_carbs, 0),
                fatsConsumed: DayMeals.reduce((acc, m) => acc + m.macro_fats, 0),
                waterConsumed
            }
        };
    });

    return result;
}

export async function calculateStreak(userId: string): Promise<number> {
    // Fetch last 30 days of activity to calculate streak
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];

    const [{ data: meals }, { data: exercises }, { data: logs }] = await Promise.all([
        supabase.from('meals').select('date').eq('user_id', userId).gte('date', startStr).lte('date', endStr),
        supabase.from('exercises').select('date').eq('user_id', userId).gte('date', startStr).lte('date', endStr),
        supabase.from('daily_logs').select('date, water_consumed').eq('user_id', userId).gte('date', startStr).lte('date', endStr)
    ]);

    // Collect all unique active dates
    const activeDates = new Set<string>();

    meals?.forEach(m => activeDates.add(m.date));
    exercises?.forEach(e => activeDates.add(e.date));
    logs?.forEach(l => {
        if (l.water_consumed > 0) activeDates.add(l.date);
    });

    let streak = 0;
    // Walk backwards from today
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        if (activeDates.has(dateStr)) {
            streak++;
        } else {
            // Allow skipping today if it's currently empty (streak from yesterday valid)
            if (i === 0) continue;
            break;
        }
    }

    return streak;
}

// ============ GAMIFICATION FUNCTIONS ============

export interface UserProgressDB {
    xp: number;
    level: number;
    streak: number;
    last_activity_date: string | null;
}

export async function getUserProgress(userId: string): Promise<UserProgressDB | null> {
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No record found, create one
            const newProgress = await createUserProgress(userId);
            return newProgress;
        }
        console.error('Error fetching user progress:', error);
        return null;
    }

    return data;
}

export async function createUserProgress(userId: string): Promise<UserProgressDB | null> {
    const { data, error } = await supabase
        .from('user_progress')
        .insert({
            user_id: userId,
            xp: 0,
            level: 1,
            streak: 0,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating user progress:', error);
        return null;
    }

    return data;
}

export async function updateUserProgress(userId: string, updates: Partial<UserProgressDB>): Promise<boolean> {
    const { error } = await supabase
        .from('user_progress')
        .update(updates)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating user progress:', error);
        return false;
    }

    return true;
}

export async function addXPToUser(userId: string, amount: number): Promise<{ newXP: number; leveledUp: boolean; newLevel: number } | null> {
    const progress = await getUserProgress(userId);
    if (!progress) return null;

    const newXP = progress.xp + amount;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
    const leveledUp = newLevel > progress.level;

    await updateUserProgress(userId, { xp: newXP, level: newLevel });

    return { newXP, leveledUp, newLevel };
}

// ============ BADGES FUNCTIONS ============

export interface UserBadgeDB {
    badge_id: string;
    earned_at: string;
}

export async function getUserBadges(userId: string): Promise<UserBadgeDB[]> {
    const { data, error } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching badges:', error);
        return [];
    }

    return data || [];
}

export async function unlockBadge(userId: string, badgeId: string): Promise<boolean> {
    const { error } = await supabase
        .from('user_badges')
        .insert({
            user_id: userId,
            badge_id: badgeId,
        });

    if (error) {
        if (error.code === '23505') return true; // Already unlocked
        console.error('Error unlocking badge:', error);
        return false;
    }

    return true;
}

// ============ WEEKLY CHALLENGES FUNCTIONS ============

export interface WeeklyChallengeDB {
    id: string;
    user_id: string;
    title: string;
    description: string;
    type: string;
    target: number;
    current: number;
    start_date: string;
    end_date: string;
    xp_reward: number;
    completed: boolean;
}

export async function getActiveChallenge(userId: string): Promise<WeeklyChallengeDB | null> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('user_id', userId)
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No challenge found
        console.error('Error fetching challenge:', error);
        return null;
    }

    return data;
}

export async function createWeeklyChallenge(
    userId: string,
    challenge: Omit<WeeklyChallengeDB, 'id' | 'user_id'>
): Promise<WeeklyChallengeDB | null> {
    const { data, error } = await supabase
        .from('weekly_challenges')
        .insert({
            user_id: userId,
            ...challenge,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating challenge:', error);
        return null;
    }

    return data;
}

export async function updateChallengeProgress(
    challengeId: string,
    current: number,
    completed: boolean
): Promise<boolean> {
    const { error } = await supabase
        .from('weekly_challenges')
        .update({ current, completed })
        .eq('id', challengeId);

    if (error) {
        console.error('Error updating challenge:', error);
        return false;
    }

    return true;
}

// ============ MEAL PLANS FUNCTIONS ============

export interface MealPlanDB {
    id: string;
    user_id: string;
    week_start: string;
    plan_data: object;
    preferences: object;
    created_at: string;
}

export async function getMealPlan(userId: string, weekStart: string): Promise<MealPlanDB | null> {
    const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching meal plan:', error);
        return null;
    }

    return data;
}

export async function saveMealPlan(
    userId: string,
    weekStart: string,
    planData: object,
    preferences: object
): Promise<MealPlanDB | null> {
    // Upsert: update if exists, insert if not
    const { data, error } = await supabase
        .from('meal_plans')
        .upsert({
            user_id: userId,
            week_start: weekStart,
            plan_data: planData,
            preferences: preferences,
        }, {
            onConflict: 'user_id,week_start'
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving meal plan:', error);
        return null;
    }

    return data;
}

export async function getMealPlanHistory(userId: string, limit = 4): Promise<MealPlanDB[]> {
    const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .order('week_start', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching meal plan history:', error);
        return [];
    }

    return data || [];
}

// ============ CHAT HISTORY FUNCTIONS ============

export interface ChatMessageDB {
    id: string;
    user_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export async function getChatHistory(userId: string, limit = 50): Promise<ChatMessageDB[]> {
    const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching chat history:', error);
        return [];
    }

    return data || [];
}

export async function addChatMessage(
    userId: string,
    role: 'user' | 'assistant',
    content: string
): Promise<ChatMessageDB | null> {
    const { data, error } = await supabase
        .from('chat_history')
        .insert({
            user_id: userId,
            role,
            content,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding chat message:', error);
        return null;
    }

    return data;
}

export async function clearChatHistory(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('Error clearing chat history:', error);
        return false;
    }

    return true;
}
