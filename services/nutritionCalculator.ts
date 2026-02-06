/**
 * Nutrition Calculator Service
 * Calculates BMR, TDEE, macros and water goals based on user data
 */

export type Gender = 'masculino' | 'feminino' | 'outro';
export type Goal = 'perder_peso' | 'manter_peso' | 'ganhar_massa';
export type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso';
export type Aggressiveness = 'conservador' | 'moderado' | 'agressivo';

export interface UserPhysicalData {
    weight: number; // kg
    height: number; // cm
    age: number;
    gender: Gender;
}

export interface UserGoals {
    goal: Goal;
    activityLevel: ActivityLevel;
}

export interface NutritionalGoals {
    calories: number;
    protein: number; // grams
    carbs: number; // grams
    fats: number; // grams
    water: number; // ml
}

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    muito_intenso: 1.9,
};

// Calorie adjustments based on goal and aggressiveness
const GOAL_ADJUSTMENTS: Record<Goal, Record<Aggressiveness, number>> = {
    perder_peso: {
        conservador: -250, // ~0.25kg week
        moderado: -500,    // ~0.5kg week (Standard)
        agressivo: -750    // ~0.75kg week (Hard)
    },
    manter_peso: {
        conservador: 0,
        moderado: 0,
        agressivo: 0
    },
    ganhar_massa: {
        conservador: 200, // Lean gains
        moderado: 400,    // Standard bulk
        agressivo: 700    // Dirty bulk / aggressive
    }
};

/**
 * Calculate Basal Metabolic Rate (BMR) using Harris-Benedict equation
 */
export function calculateBMR(data: UserPhysicalData): number {
    const { weight, height, age, gender } = data;

    if (gender === 'masculino') {
        // Men: BMR = 88.362 + (13.397 × weight) + (4.799 × height) - (5.677 × age)
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        // Women (and other): BMR = 447.593 + (9.247 × weight) + (3.098 × height) - (4.330 × age)
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

/**
 * Calculate daily calorie goal based on TDEE and user goal
 */
export function calculateCalorieGoal(tdee: number, goal: Goal, aggressiveness: Aggressiveness = 'moderado'): number {
    return Math.round(tdee + GOAL_ADJUSTMENTS[goal][aggressiveness]);
}

/**
 * Calculate macronutrient distribution
 * Standard distribution: 25% protein, 45% carbs, 30% fats
 */
export function calculateMacros(calories: number, goal: Goal): { protein: number; carbs: number; fats: number } {
    // Adjust protein based on goal
    let proteinPercent = 0.25;
    let carbsPercent = 0.45;
    let fatsPercent = 0.30;

    if (goal === 'ganhar_massa') {
        proteinPercent = 0.30;
        carbsPercent = 0.45;
        fatsPercent = 0.25;
    } else if (goal === 'perder_peso') {
        proteinPercent = 0.35; // Increased protein for weight loss to protect muscle
        carbsPercent = 0.35;
        fatsPercent = 0.30;
    }

    return {
        protein: Math.round((calories * proteinPercent) / 4), // 4 cal per gram of protein
        carbs: Math.round((calories * carbsPercent) / 4), // 4 cal per gram of carbs
        fats: Math.round((calories * fatsPercent) / 9), // 9 cal per gram of fat
    };
}

/**
 * Calculate daily water goal based on weight
 * Standard: 35ml per kg of body weight
 */
export function calculateWaterGoal(weight: number): number {
    return Math.round(weight * 35);
}

/**
 * Calculate all nutritional goals based on user data
 */
export function calculateNutritionalGoals(
    physicalData: UserPhysicalData,
    goals: UserGoals,
    aggressiveness: Aggressiveness = 'moderado'
): NutritionalGoals {
    const bmr = calculateBMR(physicalData);
    const tdee = calculateTDEE(bmr, goals.activityLevel);
    const calories = calculateCalorieGoal(tdee, goals.goal, aggressiveness);
    const macros = calculateMacros(calories, goals.goal);
    const water = calculateWaterGoal(physicalData.weight);

    return {
        calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fats: macros.fats,
        water,
    };
}

/**
 * Get activity level display text
 */
export function getActivityLevelLabel(level: ActivityLevel): string {
    const labels: Record<ActivityLevel, string> = {
        sedentario: 'Sedentário (Trabalho de escritório, sem exercícios)',
        leve: 'Leve (Caminhadas ou exercícios leves 1-3x/semana)',
        moderado: 'Moderado (Exercícios moderados 3-5x/semana)',
        intenso: 'Intenso (Exercícios pesados 6-7x/semana)',
        muito_intenso: 'Muito Intenso (Atleta profissional ou trabalho físico pesado)',
    };
    return labels[level];
}

/**
 * Get goal display text
 */
export function getGoalLabel(goal: Goal): string {
    const labels: Record<Goal, string> = {
        perder_peso: 'Perder peso',
        manter_peso: 'Manter peso',
        ganhar_massa: 'Ganhar massa muscular',
    };
    return labels[goal];
}
