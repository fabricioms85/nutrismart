
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Meal, User, DailyStats, Exercise } from '../types';
import { calculateDailyStats } from '../services/nutritionCalculator';
import * as mealService from '../services/mealService';
import * as exerciseService from '../services/exerciseService';
import { useAuth } from './AuthContext';
import { getDailyLog, updateWaterConsumed } from '../services/healthService';
import { getLocalDateString } from '../utils/dateUtils';

interface NutritionContextType {
    meals: Meal[];
    exercises: Exercise[];
    stats: DailyStats;
    waterConsumed: number;
    loading: boolean;
    addMeal: (meal: Omit<Meal, 'id'>) => Promise<void>;
    updateMeal: (id: string, meal: Partial<Meal>) => Promise<void>;
    deleteMeal: (id: string) => Promise<void>;
    addExercise: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
    updateExercise: (id: string, exercise: Partial<Exercise>) => Promise<void>;
    deleteExercise: (id: string) => Promise<void>;
    addWater: (amount: number) => Promise<void>;
    refreshNutrition: () => Promise<void>;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export function NutritionProvider({ children }: { children: React.ReactNode }) {
    const { authUser, profile } = useAuth();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [stats, setStats] = useState<DailyStats>({
        caloriesConsumed: 0,
        caloriesBurned: 0,
        proteinConsumed: 0,
        carbsConsumed: 0,
        fatsConsumed: 0,
        waterConsumed: 0
    });
    const [waterConsumed, setWaterConsumed] = useState(0);
    const [loading, setLoading] = useState(true);

    const refreshNutrition = async () => {
        if (!authUser || !profile) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const today = getLocalDateString();
            const todayMeals = await mealService.getMeals(authUser.id, today);
            const todayExercises = await exerciseService.getExercises(authUser.id, today);
            const todayLog = await getDailyLog(authUser.id, today);

            setMeals(todayMeals);
            setExercises(todayExercises);

            // Get water from logs if available, or default to 0
            const currentWater = todayLog ? todayLog.water_consumed : 0;
            setWaterConsumed(currentWater);

            // Recalculate stats
            const nutritionStats = calculateDailyStats(todayMeals);
            const caloriesBurned = todayExercises.reduce((acc, ex) => acc + ex.caloriesBurned, 0);

            setStats({
                ...nutritionStats,
                caloriesBurned,
                waterConsumed: currentWater
            });

        } catch (error) {
            console.error("Failed to refresh nutrition data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshNutrition();
    }, [authUser, profile]);

    const addMeal = async (mealData: Omit<Meal, 'id'>) => {
        if (!authUser) return;
        await mealService.addMeal(authUser.id, mealData);
        await refreshNutrition();
    };

    const updateMeal = async (id: string, updates: Partial<Meal>) => {
        await mealService.updateMeal(id, updates);
        await refreshNutrition();
    };

    const deleteMeal = async (id: string) => {
        await mealService.deleteMeal(id);
        await refreshNutrition();
    };

    const addExercise = async (exercise: Omit<Exercise, 'id'>) => {
        if (!authUser) return;
        await exerciseService.addExercise(authUser.id, exercise);
        await refreshNutrition();
    };

    const updateExercise = async (id: string, updates: Partial<Exercise>) => {
        await exerciseService.updateExercise(id, updates);
        await refreshNutrition();
    };

    const deleteExercise = async (id: string) => {
        await exerciseService.deleteExercise(id);
        await refreshNutrition();
    };

    const addWater = async (amount: number) => {
        if (!authUser) return;
        const newAmount = waterConsumed + amount;
        setWaterConsumed(newAmount);

        const today = getLocalDateString();
        await updateWaterConsumed(authUser.id, today, newAmount);
        await refreshNutrition();
    };

    const value = {
        meals,
        exercises,
        stats,
        waterConsumed,
        loading,
        addMeal,
        updateMeal,
        deleteMeal,
        addExercise,
        updateExercise,
        deleteExercise,
        addWater,
        refreshNutrition
    };

    return (
        <NutritionContext.Provider value={value}>
            {children}
        </NutritionContext.Provider>
    );
};

export const useNutrition = () => {
    const context = useContext(NutritionContext);
    if (context === undefined) {
        throw new Error('useNutrition must be used within a NutritionProvider');
    }
    return context;
};
