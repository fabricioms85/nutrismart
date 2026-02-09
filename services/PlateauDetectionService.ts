/**
 * Plateau Detection Service
 * 
 * AI-powered service to detect weight loss plateaus and suggest interventions.
 * Based on scientific protocols for metabolic adaptation (adaptive thermogenesis).
 */

import { WeightEntry, Meal } from '../types';

export interface PlateauAnalysis {
    isPlateaued: boolean;
    daysSinceChange: number;
    weightVariation: number;        // kg variation in the period
    adherenceScore: number;         // 0-100%
    suggestion: PlateauSuggestion;
    message: string;
    details: string;
}

export type PlateauSuggestion =
    | 'refeed'              // 1 day at maintenance for lean users
    | 'maintenance_week'    // 5-7 days at maintenance for aggressive deficits
    | 'adjust_macros'       // Increase protein
    | 'reduce_cardio'       // Too much cardio
    | 'check_logs'          // Adherence issues
    | 'keep_going'          // Not plateaued, continue
    | 'celebrate';          // Weight loss is progressing well

// Configuration
const PLATEAU_DAYS = 14;                // Min days to consider a plateau
const PLATEAU_WEIGHT_THRESHOLD = 0.5;   // Max kg variation to be "stable"
const MIN_WEIGH_INS = 3;                // Minimum weigh-ins in the period
const GOOD_ADHERENCE_THRESHOLD = 80;    // % adherence to be considered "good"
const LEAN_BODY_FAT_THRESHOLD = 20;     // % body fat for refeed suggestion
const AGGRESSIVE_DEFICIT_THRESHOLD = 750; // kcal deficit for maintenance week

/**
 * Analyze weight history to detect plateaus
 */
export function detectPlateau(
    weightHistory: WeightEntry[],
    calorieGoal: number,
    currentDeficit: number,
    bodyFatPercentage?: number,
    mealLogs?: Meal[]
): PlateauAnalysis {
    // Get last 14 days of entries
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - PLATEAU_DAYS * 24 * 60 * 60 * 1000);

    const recentEntries = weightHistory
        .filter(entry => new Date(entry.date) >= cutoffDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Not enough data
    if (recentEntries.length < MIN_WEIGH_INS) {
        return {
            isPlateaued: false,
            daysSinceChange: 0,
            weightVariation: 0,
            adherenceScore: 100,
            suggestion: 'keep_going',
            message: 'Continue registrando seu peso regularmente.',
            details: `Precisamos de pelo menos ${MIN_WEIGH_INS} pesagens nos últimos ${PLATEAU_DAYS} dias para análise.`
        };
    }

    // Calculate weight variation
    const weights = recentEntries.map(e => e.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightVariation = maxWeight - minWeight;
    const firstWeight = weights[0];
    const lastWeight = weights[weights.length - 1];
    const weightChange = lastWeight - firstWeight;

    // Calculate days since significant change
    const daysSinceChange = calculateDaysSinceChange(weightHistory);

    // Calculate adherence (simplified - based on meal logs if available)
    const adherenceScore = calculateAdherence(mealLogs, calorieGoal);

    // Determine if plateaued
    const isPlateaued = weightVariation <= PLATEAU_WEIGHT_THRESHOLD &&
        daysSinceChange >= PLATEAU_DAYS;

    // If losing weight, celebrate!
    if (weightChange < -0.5) {
        return {
            isPlateaued: false,
            daysSinceChange,
            weightVariation,
            adherenceScore,
            suggestion: 'celebrate',
            message: '🎉 Excelente progresso! Continue assim!',
            details: `Você perdeu ${Math.abs(weightChange).toFixed(1)}kg nas últimas 2 semanas.`
        };
    }

    // Not plateaued
    if (!isPlateaued) {
        return {
            isPlateaued: false,
            daysSinceChange,
            weightVariation,
            adherenceScore,
            suggestion: 'keep_going',
            message: 'Seu progresso está dentro do esperado.',
            details: 'Continue seguindo seu plano alimentar.'
        };
    }

    // Plateaued - determine best suggestion
    const suggestion = determineSuggestion(
        adherenceScore,
        bodyFatPercentage,
        currentDeficit
    );

    return {
        isPlateaued: true,
        daysSinceChange,
        weightVariation,
        adherenceScore,
        suggestion,
        message: getPlateauMessage(suggestion),
        details: getPlateauDetails(suggestion, adherenceScore, bodyFatPercentage, currentDeficit)
    };
}

/**
 * Calculate days since any significant weight change (> 0.5kg)
 */
function calculateDaysSinceChange(weightHistory: WeightEntry[]): number {
    if (weightHistory.length < 2) return 0;

    const sortedEntries = [...weightHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let referenceWeight = sortedEntries[0].weight;

    for (let i = 1; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        if (Math.abs(entry.weight - referenceWeight) > 0.5) {
            const daysDiff = Math.floor(
                (new Date(sortedEntries[0].date).getTime() - new Date(entry.date).getTime())
                / (24 * 60 * 60 * 1000)
            );
            return daysDiff;
        }
    }

    // No significant change found
    const firstEntry = sortedEntries[sortedEntries.length - 1];
    return Math.floor(
        (new Date(sortedEntries[0].date).getTime() - new Date(firstEntry.date).getTime())
        / (24 * 60 * 60 * 1000)
    );
}

/**
 * Calculate adherence score based on meal logs
 */
function calculateAdherence(mealLogs: Meal[] | undefined, calorieGoal: number): number {
    if (!mealLogs || mealLogs.length === 0) {
        return 80; // Assume moderate adherence if no logs
    }

    // Group meals by date
    const dailyCalories = new Map<string, number>();

    mealLogs.forEach(meal => {
        const date = meal.date || new Date().toISOString().split('T')[0];
        const current = dailyCalories.get(date) || 0;
        dailyCalories.set(date, current + meal.calories);
    });

    // Calculate % of days within goal (±10%)
    let daysOnTrack = 0;
    const tolerance = calorieGoal * 0.1;

    dailyCalories.forEach((calories) => {
        if (calories >= calorieGoal - tolerance && calories <= calorieGoal + tolerance) {
            daysOnTrack++;
        }
    });

    return Math.round((daysOnTrack / dailyCalories.size) * 100);
}

/**
 * Determine the best suggestion based on user context
 */
function determineSuggestion(
    adherenceScore: number,
    bodyFatPercentage: number | undefined,
    currentDeficit: number
): PlateauSuggestion {
    // Low adherence - suggest checking logs first
    if (adherenceScore < GOOD_ADHERENCE_THRESHOLD) {
        return 'check_logs';
    }

    // Good adherence - determine metabolic intervention
    const isLean = bodyFatPercentage !== undefined && bodyFatPercentage < LEAN_BODY_FAT_THRESHOLD;
    const isAggressiveDeficit = currentDeficit >= AGGRESSIVE_DEFICIT_THRESHOLD;

    if (isLean) {
        // Lean users benefit more from refeed days
        return 'refeed';
    }

    if (isAggressiveDeficit) {
        // Aggressive deficits need longer breaks
        return 'maintenance_week';
    }

    // Default to macro adjustment
    return 'adjust_macros';
}

/**
 * Get user-facing plateau message
 */
function getPlateauMessage(suggestion: PlateauSuggestion): string {
    const messages: Record<PlateauSuggestion, string> = {
        refeed: '📊 Platô detectado. Sugerimos um dia de recarga.',
        maintenance_week: '📊 Platô detectado. Recomendamos uma semana de manutenção.',
        adjust_macros: '📊 Platô detectado. Vamos ajustar seus macros.',
        reduce_cardio: '📊 Platô detectado. Considere reduzir o cardio.',
        check_logs: '🤔 Platô detectado. Vamos verificar seus registros.',
        keep_going: '✅ Continue com seu plano atual.',
        celebrate: '🎉 Excelente progresso!'
    };
    return messages[suggestion];
}

/**
 * Get detailed explanation for the suggestion
 */
function getPlateauDetails(
    suggestion: PlateauSuggestion,
    adherenceScore: number,
    bodyFatPercentage: number | undefined,
    currentDeficit: number
): string {
    switch (suggestion) {
        case 'refeed':
            return `Seu corpo pode estar em modo de conservação. Um dia comendo em manutenção (sem déficit) pode "resetar" a leptina e destravar seu metabolismo. Aumente as calorias em ${currentDeficit}kcal por um dia.`;

        case 'maintenance_week':
            return `Seu déficit de ${currentDeficit}kcal é intenso. Uma pausa estratégica de 5-7 dias comendo em manutenção ajudará seu metabolismo a se recuperar sem ganhar peso.`;

        case 'adjust_macros':
            return 'Aumentar a proteína para 2.2g/kg pode acelerar a queima de gordura e preservar massa muscular. Considere também incluir mais treino de força.';

        case 'reduce_cardio':
            return 'Excesso de cardio pode aumentar o cortisol e dificultar a perda de peso. Tente reduzir 20% e dar prioridade a treino de força.';

        case 'check_logs':
            return `Sua adesão está em ${adherenceScore}%. Verifique se está registrando todas as refeições e porções corretamente. Pequenas "escapadas" podem anular o déficit.`;

        case 'keep_going':
            return 'Seu progresso está dentro do esperado. Continue seguindo o plano.';

        case 'celebrate':
            return 'Você está no caminho certo! Continue com disciplina e paciência.';
    }
}

/**
 * Estimate target date based on current weight, target, and weekly goal
 */
export function estimateTargetDate(
    currentWeight: number,
    targetWeight: number,
    weeklyGoal: number
): Date {
    const weightDifference = Math.abs(currentWeight - targetWeight);
    const weeksNeeded = Math.ceil(weightDifference / Math.abs(weeklyGoal));

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);

    return targetDate;
}

/**
 * Calculate progress percentage towards weight goal
 */
export function calculateWeightProgress(
    startWeight: number,
    currentWeight: number,
    targetWeight: number
): number {
    const totalChange = startWeight - targetWeight;
    const currentChange = startWeight - currentWeight;

    if (totalChange === 0) return 100;

    const progress = (currentChange / totalChange) * 100;
    return Math.max(0, Math.min(100, Math.round(progress)));
}

/**
 * Generate weight milestones
 */
export function generateMilestones(
    startWeight: number,
    targetWeight: number
): Array<{ weight: number; title: string; xpReward: number }> {
    const totalChange = Math.abs(startWeight - targetWeight);
    const isLosing = startWeight > targetWeight;

    const milestones = [];

    // First kg
    const firstKg = isLosing ? startWeight - 1 : startWeight + 1;
    milestones.push({
        weight: firstKg,
        title: 'Primeiro Kilo!',
        xpReward: 50
    });

    // 5kg milestone (if applicable)
    if (totalChange >= 5) {
        const fiveKg = isLosing ? startWeight - 5 : startWeight + 5;
        milestones.push({
            weight: fiveKg,
            title: 'Clube dos 5kg!',
            xpReward: 150
        });
    }

    // 10kg milestone (if applicable)
    if (totalChange >= 10) {
        const tenKg = isLosing ? startWeight - 10 : startWeight + 10;
        milestones.push({
            weight: tenKg,
            title: 'Transformação de 10kg!',
            xpReward: 300
        });
    }

    // Halfway milestone
    const halfwayWeight = startWeight + (targetWeight - startWeight) / 2;
    milestones.push({
        weight: Math.round(halfwayWeight * 10) / 10,
        title: 'Metade do Caminho! 🎯',
        xpReward: 200
    });

    // Final goal
    milestones.push({
        weight: targetWeight,
        title: '🏆 OBJETIVO ALCANÇADO!',
        xpReward: 500
    });

    // Sort by weight (ascending for loss, descending for gain)
    return milestones.sort((a, b) =>
        isLosing ? b.weight - a.weight : a.weight - b.weight
    );
}
