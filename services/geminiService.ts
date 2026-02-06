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

async function callGeminiApi(action: string, payload: Record<string, unknown>): Promise<string> {
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

export const generateNutritionAdvice = async (prompt: string, context?: UserContext): Promise<string> => {
  try {
    return await callGeminiApi('chat', { message: prompt, context });
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return "Ocorreu um erro ao conectar com o assistente inteligente. Tente novamente mais tarde.";
  }
};

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
    console.error("Erro ao calcular nutrientes:", error);
    throw error;
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

// Legacy function for compatibility
export const generateWeeklyMealPlan = async (user: User): Promise<unknown[]> => {
  try {
    const result = await callGeminiApi('generate-meal-plan', {
      user,
      preferences: {
        dietType: 'normal',
        allergies: [],
        dislikedFoods: [],
        mealsPerDay: 4,
        cookingTime: 'normal',
      },
      dayName: 'hoje',
    });
    if (result) {
      const parsed = JSON.parse(result);
      return parsed.meals || [];
    }
    return [];
  } catch (error) {
    console.error("Erro ao gerar plano:", error);
    return [];
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