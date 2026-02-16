import { User, Recipe, DailyStats, Meal } from "../types";

// API endpoint - works both locally and on Vercel
const API_URL = '/api/gemini';

interface UserContext {
  user: User;
  stats: DailyStats;
  recentMeals: Meal[];
}

interface ApiResponse {
  result?: string;
  error?: string;
}

export async function callGeminiApi(action: string, payload: Record<string, unknown>): Promise<string> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  const data: ApiResponse = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.result || '';
}

// Chat conversation with history
export const generateChatResponse = async (
  message: string,
  conversationHistory: string,
  context?: UserContext
): Promise<string> => {
  try {
    return await callGeminiApi('chat', { message, conversationHistory, context });
  } catch (error) {
    console.error("Erro no chat:", error);
    return "Ops! Tive um probleminha técnico. Tenta de novo? 💫";
  }
};

export const analyzeFoodImage = async (base64Data: string, mimeType: string = 'image/jpeg'): Promise<{
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weight: number;
  ingredients: { name: string; quantity: string; unit: string }[];
} | null> => {
  try {
    const result = await callGeminiApi('analyze-food', { base64Data, mimeType });
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error("Erro na análise de imagem:", error);
    throw error;
  }
};

export const calculateNutritionalInfo = async (foodItems: { name: string, quantity: string, unit: string }[]): Promise<{
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
} | null> => {
  try {
    const result = await callGeminiApi('calculate-nutrition', { foodItems });
    return result ? JSON.parse(result) : null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for quota exceeded or API errors
    if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Limite da API Gemini atingido. Os nutrientes não foram calculados automaticamente.");
    } else {
      console.error("Erro ao calcular nutrientes:", error);
    }

    // Return null instead of throwing - allows user to save meal without AI calculation
    return null;
  }
};

// Generate a single day's meal plan
export const generateDayMealPlan = async (
  user: User,
  preferences: {
    dietType: string;
    allergies: string[];
    dislikedFoods: string[];
    mealsPerDay: number;
    cookingTime: string;
  },
  dayName: string
): Promise<{
  meals: {
    type: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    ingredients: { name: string; quantity: string; unit: string }[];
    instructions: string[];
    prepTime: number;
  }[];
} | null> => {
  try {
    const result = await callGeminiApi('generate-meal-plan', { user, preferences, dayName });
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error("Erro ao gerar plano do dia:", error);
    return null;
  }
};

export interface WeeklyMealPlanDay {
  dayName: string;
  date?: string;
  meals: {
    type: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    ingredients: { name: string; quantity: string; unit: string }[];
    instructions: string[];
    prepTime: number;
  }[];
}

// Gera a semana inteira em uma única chamada à API
export const generateWeeklyMealPlan = async (
  user: User,
  preferences: {
    dietType: string;
    allergies: string[];
    dislikedFoods: string[];
    mealsPerDay: number;
    cookingTime: string;
  },
  weekDates: { date: string; dayName: string }[]
): Promise<{ days: WeeklyMealPlanDay[] } | null> => {
  try {
    const result = await callGeminiApi('generate-weekly-meal-plan', { user, preferences, weekDays: weekDates });
    if (!result) return null;
    const parsed = JSON.parse(result);
    if (!parsed.days || !Array.isArray(parsed.days)) return null;
    return { days: parsed.days };
  } catch (error) {
    console.error("Erro ao gerar plano semanal:", error);
    return null;
  }
};

export const generateSmartRecipes = async (ingredients: string): Promise<Omit<Recipe, 'id' | 'image'>[]> => {
  try {
    const result = await callGeminiApi('generate-recipes', { ingredients });
    if (result) {
      const parsed = JSON.parse(result);
      return parsed.recipes || [];
    }
    return [];
  } catch (error) {
    console.error("Erro ao gerar receitas:", error);
    throw error;
  }
};