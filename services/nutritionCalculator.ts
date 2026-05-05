/**
 * Nutrition Calculator Service v2.0
 * 
 * Calculates BMR (Mifflin-St Jeor), TDEE, macros (g/kg priority model), 
 * and water goals based on user data.
 * 
 * Key changes from v1:
 * - Mifflin-St Jeor formula (more accurate than Harris-Benedict)
 * - Protein-priority model (g/kg instead of % of calories)
 * - Minimum fat floor (0.7g/kg for hormonal health)
 * - Residual carbs with 80g minimum + calorie auto-adjustment
 * - Clinical mode (GLP-1) with 2.2g/kg protein + 30g fiber
 * - Safety flags and alerts
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

export interface CalculationOptions {
    isClinicalMode?: boolean;
    useConservativeTDEE?: boolean; // Apply 80% multiplier for more realistic estimates
    targetWeight?: number;         // For adjusted weight calculation (BMI > 30)
}

export interface SafetyFlags {
    lowCalorieAlert: boolean;      // Target < BMR
    carbFloorApplied: boolean;     // Carbs were adjusted to minimum 80g
    highProteinAlert: boolean;     // Protein > 2.5g/kg
    originalCalories?: number;     // Calories before carb adjustment
}

export interface WaterGoalResult {
    waterMl: number;
    clinicalAlert?: string;
}

export interface NutritionalGoalsV2 {
    // Calories
    calories: number;
    bmr: number;
    tdee: number;

    // Macros in grams
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
    fiberGrams: number;

    // Water
    waterMl: number;
    waterAlert?: string;          // GLP-1 hydration alert

    // Weight calculation
    weightUsedForCalc: number;    // Actual or adjusted weight
    wasWeightAdjusted: boolean;   // True if adjusted weight was used

    // Safety
    safetyFlags: SafetyFlags;
    safetyMessages: string[];

    // Metadata
    calculationMethod: 'mifflin-st-jeor';
    proteinBasis: 'g/kg';
}

// Legacy interface for backward compatibility
export interface NutritionalGoals {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    water: number;
}

// Activity level multipliers for TDEE calculation
// Note: In case of doubt, prefer 'sedentario' (1.2) to avoid overestimation
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentario: 1.2,      // Office work, no exercise
    leve: 1.375,          // Light exercise 1-3x/week
    moderado: 1.55,       // Moderate exercise 3-5x/week
    intenso: 1.725,       // Heavy exercise 6-7x/week
    muito_intenso: 1.9,   // Professional athlete or physical labor
};

// Calorie adjustments based on goal and aggressiveness
const GOAL_ADJUSTMENTS: Record<Goal, Record<Aggressiveness, number>> = {
    perder_peso: {
        conservador: -250, // ~0.25kg/week
        moderado: -500,    // ~0.5kg/week (Standard)
        agressivo: -750    // ~0.75kg/week
    },
    manter_peso: {
        conservador: 0,
        moderado: 0,
        agressivo: 0
    },
    ganhar_massa: {
        conservador: 200, // Lean gains
        moderado: 400,    // Standard bulk
        agressivo: 700    // Aggressive bulk
    }
};

// Protein targets (g/kg) based on goal and clinical mode
const PROTEIN_TARGETS = {
    perder_peso: {
        normal: 2.0,      // High to preserve lean mass during deficit
        clinical: 2.2     // Higher for GLP-1 users
    },
    manter_peso: {
        normal: 1.8,
        clinical: 2.0
    },
    ganhar_massa: {
        normal: 1.8,
        clinical: 2.0
    }
};

// Constants
const MIN_FAT_PER_KG = 0.7;      // Minimum for hormonal health
const ABSOLUTE_MIN_FAT_PER_KG = 0.6;
const MIN_CARBS = 80;           // Minimum for brain function
const CLINICAL_FIBER_TARGET = 30; // Essential for tirzepatida users
const CONSERVATIVE_TDEE_MULTIPLIER = 0.80; // For users who tend to overestimate activity
const GLP1_WATER_BONUS = 500;   // Extra hydration for GLP-1 users (ml)
const OBESITY_BMI_THRESHOLD = 30; // Threshold for adjusted weight calculation

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation (1990)
 * More accurate than Harris-Benedict, especially for overweight individuals
 * 
 * Men:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
 * Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
 */
export function calculateBMR(data: UserPhysicalData): number {
    const { weight, height, age, gender } = data;

    // Input validation
    if (weight < 30 || weight > 300) {
        console.warn(`Weight ${weight}kg is outside typical range (30-300kg)`);
    }
    if (age < 10 || age > 120) {
        console.warn(`Age ${age} is outside typical range (10-120)`);
    }

    const baseCalc = (10 * weight) + (6.25 * height) - (5 * age);

    if (gender === 'masculino') {
        return baseCalc + 5;
    } else {
        // Women and other genders use female formula (more conservative)
        return baseCalc - 161;
    }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * 
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - User's activity level
 * @param useConservative - Apply 80% multiplier to compensate for overestimation
 */
export function calculateTDEE(
    bmr: number,
    activityLevel: ActivityLevel,
    useConservative: boolean = false
): number {
    const baseTDEE = bmr * ACTIVITY_MULTIPLIERS[activityLevel];

    if (useConservative) {
        return baseTDEE * CONSERVATIVE_TDEE_MULTIPLIER;
    }

    return baseTDEE;
}

/**
 * Calculate daily calorie goal based on TDEE and user goal
 */
export function calculateCalorieGoal(
    tdee: number,
    goal: Goal,
    aggressiveness: Aggressiveness = 'moderado'
): number {
    return Math.round(tdee + GOAL_ADJUSTMENTS[goal][aggressiveness]);
}

/**
 * Calculate protein target in grams based on weight and goal
 * Uses g/kg approach (more precise than % of calories)
 */
export function calculateProtein(
    weight: number,
    goal: Goal,
    isClinicalMode: boolean = false
): number {
    const mode = isClinicalMode ? 'clinical' : 'normal';
    const targetPerKg = PROTEIN_TARGETS[goal][mode];
    return Math.round(weight * targetPerKg);
}

/**
 * Calculate fat target in grams based on weight
 * Ensures minimum for hormonal health (0.7g/kg, never below 0.6g/kg)
 */
export function calculateFat(weight: number): number {
    const targetGrams = weight * MIN_FAT_PER_KG;
    const absoluteMinimum = weight * ABSOLUTE_MIN_FAT_PER_KG;
    return Math.round(Math.max(targetGrams, absoluteMinimum));
}

/**
 * Calculate carbs as residual calories after protein and fat
 * Enforces minimum of 80g for brain function
 * If carbs < 80g, calories are auto-adjusted upward
 */
export function calculateCarbs(
    calories: number,
    proteinGrams: number,
    fatGrams: number
): { carbGrams: number; adjustedCalories: number; wasAdjusted: boolean } {
    const proteinCalories = proteinGrams * 4;
    const fatCalories = fatGrams * 9;
    const remainingCalories = calories - proteinCalories - fatCalories;
    const calculatedCarbs = Math.round(remainingCalories / 4);

    if (calculatedCarbs < MIN_CARBS) {
        const additionalCarbCals = (MIN_CARBS - calculatedCarbs) * 4;
        return {
            carbGrams: MIN_CARBS,
            adjustedCalories: calories + additionalCarbCals,
            wasAdjusted: true
        };
    }

    return {
        carbGrams: calculatedCarbs,
        adjustedCalories: calories,
        wasAdjusted: false
    };
}

/**
 * Calculate daily water goal based on weight
 * Standard: 35ml per kg of body weight
 * Clinical mode (GLP-1): +500ml bonus for increased hydration needs
 */
export function calculateWaterGoal(
    weight: number,
    isClinicalMode: boolean = false
): WaterGoalResult {
    const baseWater = Math.round(weight * 35);

    if (isClinicalMode) {
        return {
            waterMl: baseWater + GLP1_WATER_BONUS,
            clinicalAlert: '⚠️ Medicamentos GLP-1 aumentam a necessidade hídrica. Mantenha o consumo de eletrólitos (sódio, potássio).'
        };
    }

    return { waterMl: baseWater };
}

/**
 * Calculate adjusted weight for obese users (BMI > 30)
 * Formula: P_adj = P_target + 0.25 × (P_current - P_target)
 * This prevents unrealistic macro targets for very overweight users
 */
export function calculateAdjustedWeight(
    currentWeight: number,
    targetWeight: number | undefined,
    height: number
): { weightForCalc: number; wasAdjusted: boolean } {
    const bmi = currentWeight / Math.pow(height / 100, 2);

    // Only apply adjustment for obese users (BMI >= 30)
    if (bmi < OBESITY_BMI_THRESHOLD) {
        return { weightForCalc: currentWeight, wasAdjusted: false };
    }

    // If no target weight, use ideal weight at BMI 25
    const idealWeight = 25 * Math.pow(height / 100, 2);
    const effectiveTarget = targetWeight ?? idealWeight;

    // P_adj = P_target + 0.25 × (P_current - P_target)
    const adjustedWeight = effectiveTarget + 0.25 * (currentWeight - effectiveTarget);

    return {
        weightForCalc: Math.round(adjustedWeight * 10) / 10,
        wasAdjusted: true
    };
}

/**
 * Calculate all nutritional goals based on user data (V2 - g/kg model)
 * 
 * Now includes:
 * - Adjusted weight for BMI > 30 (prevents unrealistic protein targets)
 * - GLP-1 hydration bonus (+500ml with electrolyte alert)
 * 
 * @param physicalData - User's physical measurements
 * @param goals - User's fitness goals
 * @param aggressiveness - How aggressive the calorie adjustment should be
 * @param options - Additional calculation options (clinical mode, conservative TDEE, target weight)
 */
export function calculateNutritionalGoalsV2(
    physicalData: UserPhysicalData,
    goals: UserGoals,
    aggressiveness: Aggressiveness = 'moderado',
    options: CalculationOptions = {}
): NutritionalGoalsV2 {
    const { isClinicalMode = false, useConservativeTDEE = false, targetWeight } = options;
    const { weight, height } = physicalData;

    // Step 1: Calculate adjusted weight for obese users (BMI > 30)
    const adjustedWeightResult = calculateAdjustedWeight(weight, targetWeight, height);
    const weightForMacros = adjustedWeightResult.weightForCalc;

    // Step 2: Calculate BMR (Mifflin-St Jeor) - uses actual weight
    const bmr = calculateBMR(physicalData);

    // Step 3: Calculate TDEE
    const tdee = calculateTDEE(bmr, goals.activityLevel, useConservativeTDEE);

    // Step 4: Calculate initial calorie target
    let calories = calculateCalorieGoal(tdee, goals.goal, aggressiveness);

    // Step 5: Calculate macros using adjusted weight (protein-priority model)
    const proteinGrams = calculateProtein(weightForMacros, goals.goal, isClinicalMode);
    const fatGrams = calculateFat(weightForMacros);

    // Step 6: Calculate carbs as residual (with auto-adjustment if < 80g)
    const carbResult = calculateCarbs(calories, proteinGrams, fatGrams);

    // Step 7: Apply carb adjustment to calories if needed
    const originalCalories = calories;
    if (carbResult.wasAdjusted) {
        calories = carbResult.adjustedCalories;
    }

    // Step 8: Calculate water (with GLP-1 bonus)
    const waterResult = calculateWaterGoal(weight, isClinicalMode);

    // Step 9: Calculate fiber (30g for clinical mode, 25g standard)
    const fiberGrams = isClinicalMode ? CLINICAL_FIBER_TARGET : 25;

    // Step 10: Build safety flags and messages
    const safetyFlags: SafetyFlags = {
        lowCalorieAlert: calories < bmr,
        carbFloorApplied: carbResult.wasAdjusted,
        highProteinAlert: proteinGrams / weightForMacros > 2.5,
        originalCalories: carbResult.wasAdjusted ? originalCalories : undefined
    };

    const safetyMessages: string[] = [];

    if (safetyFlags.lowCalorieAlert) {
        safetyMessages.push('⚠️ Sua meta calórica está abaixo do seu metabolismo basal. Consulte um nutricionista.');
    }

    if (safetyFlags.carbFloorApplied) {
        safetyMessages.push('ℹ️ Ajustamos suas calorias para garantir o mínimo de energia para seu cérebro.');
    }

    if (safetyFlags.highProteinAlert) {
        safetyMessages.push('⚠️ Consumo proteico elevado. Mantenha hidratação adequada.');
    }

    // Add adjusted weight notice
    if (adjustedWeightResult.wasAdjusted) {
        safetyMessages.push(`ℹ️ Macros calculados com peso ajustado (${weightForMacros}kg) para metas mais realistas.`);
    }

    // Add GLP-1 hydration alert
    if (waterResult.clinicalAlert) {
        safetyMessages.push(waterResult.clinicalAlert);
    }

    return {
        calories,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        proteinGrams,
        carbGrams: carbResult.carbGrams,
        fatGrams,
        fiberGrams,
        waterMl: waterResult.waterMl,
        waterAlert: waterResult.clinicalAlert,
        weightUsedForCalc: weightForMacros,
        wasWeightAdjusted: adjustedWeightResult.wasAdjusted,
        safetyFlags,
        safetyMessages,
        calculationMethod: 'mifflin-st-jeor',
        proteinBasis: 'g/kg'
    };
}

/**
 * Legacy function for backward compatibility
 * Wraps the new V2 calculation and returns the old interface
 * 
 * @deprecated Use calculateNutritionalGoalsV2 instead
 */
export function calculateNutritionalGoals(
    physicalData: UserPhysicalData,
    goals: UserGoals,
    aggressiveness: Aggressiveness = 'moderado'
): NutritionalGoals {
    const v2Result = calculateNutritionalGoalsV2(physicalData, goals, aggressiveness);

    return {
        calories: v2Result.calories,
        protein: v2Result.proteinGrams,
        carbs: v2Result.carbGrams,
        fats: v2Result.fatGrams,
        water: v2Result.waterMl
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

/**
 * Calculate daily statistics from a list of meals.
 * Supports both meal.macros (protein/carbs/fats) and legacy meal.protein/carbs/fats.
 */
export function calculateDailyStats(meals: any[]): { caloriesConsumed: number; proteinConsumed: number; carbsConsumed: number; fatsConsumed: number } {
    return meals.reduce((acc, meal) => {
        const protein = meal.macros?.protein ?? meal.protein ?? 0;
        const carbs = meal.macros?.carbs ?? meal.carbs ?? 0;
        const fats = meal.macros?.fats ?? meal.fats ?? 0;
        return {
            caloriesConsumed: acc.caloriesConsumed + (meal.calories || 0),
            proteinConsumed: acc.proteinConsumed + protein,
            carbsConsumed: acc.carbsConsumed + carbs,
            fatsConsumed: acc.fatsConsumed + fats
        };
    }, {
        caloriesConsumed: 0,
        proteinConsumed: 0,
        carbsConsumed: 0,
        fatsConsumed: 0
    });
}
