
import { supabase } from './supabaseClient';
import { User } from '../types';

export const TABLE_PROFILES = 'profiles';

// Helper to map DB row to User object
function mapToUser(row: any): User {
    return {
        name: row.name,
        email: row.email,
        avatarUrl: row.avatar_url,
        dailyCalorieGoal: row.daily_calorie_goal,
        dailyWaterGoal: row.daily_water_goal,
        weight: row.weight,
        height: row.height,
        age: row.age,
        gender: row.gender,
        goal: row.goal,
        activityLevel: row.activity_level,
        onboardingCompleted: row.onboarding_completed,
        macros: {
            protein: row.macro_protein || 0,
            carbs: row.macro_carbs || 0,
            fats: row.macro_fats || 0,
        },
        isClinicalMode: row.is_clinical_mode,
        clinicalSettings: row.clinical_settings ? (typeof row.clinical_settings === 'string' ? JSON.parse(row.clinical_settings) : row.clinical_settings) : undefined,
        weightGoal: row.weight_goal ? (typeof row.weight_goal === 'string' ? JSON.parse(row.weight_goal) : row.weight_goal) : undefined,
        addExerciseCaloriesToRemaining: row.add_exercise_calories_to_remaining ?? undefined,
    };
}

// Helper to map User object (partial) to DB row
function mapToDB(user: Partial<User>): any {
    const dbRow: any = {};
    if (user.name !== undefined) dbRow.name = user.name;
    if (user.email !== undefined) dbRow.email = user.email;
    if (user.avatarUrl !== undefined) dbRow.avatar_url = user.avatarUrl;
    if (user.dailyCalorieGoal !== undefined) dbRow.daily_calorie_goal = user.dailyCalorieGoal;
    if (user.dailyWaterGoal !== undefined) dbRow.daily_water_goal = user.dailyWaterGoal;
    if (user.weight !== undefined) dbRow.weight = user.weight;
    if (user.height !== undefined) dbRow.height = user.height;
    if (user.age !== undefined) dbRow.age = user.age;
    if (user.gender !== undefined) dbRow.gender = user.gender;
    if (user.goal !== undefined) dbRow.goal = user.goal;
    if (user.activityLevel !== undefined) dbRow.activity_level = user.activityLevel;
    if (user.onboardingCompleted !== undefined) dbRow.onboarding_completed = user.onboardingCompleted;

    // Handle macros flattening
    if (user.macros) {
        if (user.macros.protein !== undefined) dbRow.macro_protein = user.macros.protein;
        if (user.macros.carbs !== undefined) dbRow.macro_carbs = user.macros.carbs;
        if (user.macros.fats !== undefined) dbRow.macro_fats = user.macros.fats;
    }

    // JSON fields
    if (user.isClinicalMode !== undefined) dbRow.is_clinical_mode = user.isClinicalMode;
    if (user.clinicalSettings !== undefined) dbRow.clinical_settings = user.clinicalSettings;
    if (user.weightGoal !== undefined) dbRow.weight_goal = user.weightGoal;
    if (user.addExerciseCaloriesToRemaining !== undefined) dbRow.add_exercise_calories_to_remaining = user.addExerciseCaloriesToRemaining;

    return dbRow;
}

export async function getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
        .from(TABLE_PROFILES)
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return mapToUser(data);
}

export async function updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    const dbUpdates = mapToDB(updates);
    const { error } = await supabase
        .from(TABLE_PROFILES)
        .update(dbUpdates)
        .eq('id', userId);

    if (error) {
        console.error('Error updating profile:', error);
        return false;
    }
    return true;
}

export async function createProfile(user: User): Promise<boolean> {
    const dbRow = mapToDB(user);
    // Add ID explicitly if it's passed in user, though usually handled by auth trigger
    // But mapToDB doesn't include ID, so we might need to handle it or rely on trigger
    // The previous implementation inserted 'user' directly.

    // If 'user' has ID (from auth), we should include it.
    // However, createProfile usually takes a user object that might not have ID if it's new?
    // But normally profile creation is linked to auth.id.
    // Let's assume user object has what it needs or we insert dbRow.

    // Note: The previous code did .insert(user). 
    // If we map it, we must ensure 'id' is preserved if it was in 'user'.
    // 'User' type doesn't explicitly have 'id', but usually we create profile with auth id.

    // Let's add id to dbRow if provided in a "complete" user object context, 
    // but User interface doesn't have ID. 
    // Usually the ID comes from the Auth context insert.
    // We'll stick to inserting dbRow.

    // WAIT: `createProfile` param `user` is type `User`. `User` does NOT have `id`.
    // So how is the ID set?
    // Likely the caller passes `{ id: auth.id, ...user }` but strict type checking forbids it?
    // Or previous code .insert(user) relied on supabase to auto-generate or user contained it?
    // Actually, `createProfile` is rarely called manually if using triggers.
    // checking `AuthContext.tsx`: `handleSignUp` uses `signUp` from `authService`.
    // `authService` passes metadata.
    // If `createProfile` is used, it's likely for manual creation.

    // Let's assume dbRow is correct for the body.
    // IMPORTANT: If 'id' is missing from `User` type, we can't map it from `user`.
    // But `updateProfile` uses `userId` arg. 
    // `createProfile` takes `user: User`. 
    // If the caller expects to pass ID, they might be casting.
    // Let's safe guard: merge `user` (as any) id if present.

    const payload = { ...dbRow, id: (user as any).id };

    const { error } = await supabase
        .from(TABLE_PROFILES)
        .insert(payload);

    if (error) {
        console.error('Error creating profile:', error);
        return false;
    }
    return true;
}
