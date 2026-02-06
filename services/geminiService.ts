import { GoogleGenAI, Type } from "@google/genai";
import { User, Recipe, DailyStats, Meal } from "../types";

// Get API key from Vite environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the client - will be null if no API key
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== '' && apiKey !== 'your_gemini_api_key_here') {
  ai = new GoogleGenAI({ apiKey });
}

interface UserContext {
  user: User;
  stats: DailyStats;
  recentMeals: Meal[];
}

export const generateNutritionAdvice = async (prompt: string, context?: UserContext): Promise<string> => {
  if (!ai) {
    return "O assistente de IA não está configurado. Configure sua chave de API do Gemini nas variáveis de ambiente.";
  }
  try {
    let systemInstruction = "Você é um nutricionista especialista e motivador do aplicativo NutriSmart. Suas respostas devem ser curtas, encorajadoras e focadas em saúde e bem-estar. Responda sempre em Português do Brasil.";

    if (context) {
      const { user, stats, recentMeals } = context;
      const mealsSummary = recentMeals.map(m => `${m.name} (${m.calories}kcal)`).join(', ');

      systemInstruction += `
      
      DADOS DO USUÁRIO ATUAL (Use isso para personalizar a resposta):
      - Nome: ${user.name}
      - Objetivo: ${user.goal || 'Saúde Geral'}
      - Meta Calórica Diária: ${user.dailyCalorieGoal} kcal
      - Consumo Hoje: ${stats.caloriesConsumed} kcal (Restam: ${user.dailyCalorieGoal - stats.caloriesConsumed} kcal)
      - Água Hoje: ${stats.waterConsumed}ml / ${user.dailyWaterGoal}ml
      - Refeições de hoje: ${mealsSummary || 'Nenhuma registrada ainda'}
      
      Se o usuário perguntar "o que posso comer", sugira algo que caiba nas calorias restantes.
      Se o usuário perguntar sobre seu progresso, use os números acima.
      `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Desculpe, não consegui processar sua solicitação no momento.";
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
  if (!ai) {
    return "O assistente de IA não está configurado. Configure sua chave de API do Gemini nas variáveis de ambiente.";
  }

  try {
    let systemInstruction = `Você é a NutriAI, uma assistente de nutrição amigável e motivadora do aplicativo NutriSmart.

PERSONALIDADE:
- Seja acolhedora e use emojis ocasionalmente
- Respostas concisas (máximo 3 parágrafos curtos)
- Tom conversacional e encorajador
- Sempre em Português do Brasil

CAPACIDADES:
- Responder dúvidas sobre nutrição, dietas e alimentos
- Sugerir refeições baseadas nas calorias restantes do usuário
- Analisar o progresso diário do usuário
- Dar dicas práticas e motivacionais
- Não diagnosticar doenças ou prescrever medicamentos`;

    if (context) {
      const { user, stats, recentMeals } = context;
      const mealsSummary = recentMeals.map(m => `${m.name} (${m.calories}kcal)`).join(', ');
      const caloriesRemaining = user.dailyCalorieGoal - stats.caloriesConsumed;
      const waterProgress = Math.round((stats.waterConsumed / user.dailyWaterGoal) * 100);

      systemInstruction += `

DADOS DO USUÁRIO (use para personalizar):
- Nome: ${user.name}
- Objetivo: ${user.goal || 'Saúde Geral'}
- Meta calórica: ${user.dailyCalorieGoal} kcal/dia
- Consumido hoje: ${stats.caloriesConsumed} kcal
- Calorias restantes: ${caloriesRemaining} kcal
- Água: ${stats.waterConsumed}ml de ${user.dailyWaterGoal}ml (${waterProgress}%)
- Exercício queimado: ${stats.caloriesBurned} kcal
- Refeições hoje: ${mealsSummary || 'Nenhuma ainda'}`;
    }

    if (conversationHistory) {
      systemInstruction += `

HISTÓRICO DA CONVERSA:
${conversationHistory}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Hmm, não consegui processar. Pode reformular? 🤔";
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
  if (!ai) {
    console.warn('Gemini AI not configured');
    return null;
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: 'Analise esta imagem de comida. Identifique o prato principal, estime os ingredientes visíveis com suas quantidades aproximadas e calcule os valores nutricionais totais.'
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nome curto e descritivo do prato em Português" },
            calories: { type: Type.NUMBER, description: "Estimativa de calorias totais (kcal)" },
            protein: { type: Type.NUMBER, description: "Proteínas totais em gramas" },
            carbs: { type: Type.NUMBER, description: "Carboidratos totais em gramas" },
            fats: { type: Type.NUMBER, description: "Gorduras totais em gramas" },
            weight: { type: Type.NUMBER, description: "Estimativa do peso total da porção em gramas" },
            ingredients: {
              type: Type.ARRAY,
              description: "Lista estimada de ingredientes que compõem o prato",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING, description: "Número em formato string (ex: '100', '1')" },
                  unit: { type: Type.STRING, description: "Unidade (g, ml, colher, unidade, fatia)" }
                },
                required: ["name", "quantity", "unit"]
              }
            }
          },
          required: ["name", "calories", "protein", "carbs", "fats", "weight", "ingredients"],
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
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
  if (!ai) {
    console.warn('Gemini AI not configured');
    return null;
  }
  try {
    const itemsDescription = foodItems.map(f => `${f.quantity}${f.unit} de ${f.name}`).join(', ');
    const prompt = `Calcule o total nutricional aproximado para a seguinte lista de alimentos: ${itemsDescription}. Retorne o total somado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fats: { type: Type.NUMBER },
          },
          required: ["calories", "protein", "carbs", "fats"],
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
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
  if (!ai) {
    console.warn('Gemini AI not configured');
    return null;
  }

  try {
    const mealTypes = preferences.mealsPerDay === 3
      ? ['Café da Manhã', 'Almoço', 'Jantar']
      : preferences.mealsPerDay === 4
        ? ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar']
        : ['Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar'];

    const dietDescriptions: { [key: string]: string } = {
      normal: 'alimentação balanceada comum',
      vegetarian: 'vegetariano (sem carne, mas permite ovos e laticínios)',
      vegan: 'vegano (sem nenhum produto animal)',
      lowCarb: 'low carb (menos de 50g de carboidratos por dia)',
      highProtein: 'alto teor proteico (foco em proteínas magras)',
    };

    const cookingDescriptions: { [key: string]: string } = {
      quick: 'receitas rápidas (máximo 20 minutos)',
      normal: 'tempo de preparo normal (até 40 minutos)',
      elaborate: 'receitas elaboradas (pode levar mais tempo)',
    };

    const prompt = `Crie um plano alimentar para ${dayName} com as seguintes especificações:
    
PERFIL DO USUÁRIO:
- Meta calórica: ${user.dailyCalorieGoal} kcal/dia
- Meta de proteína: ${user.macros.protein}g
- Objetivo: ${user.goal || 'Saúde geral'}

PREFERÊNCIAS:
- Tipo de dieta: ${dietDescriptions[preferences.dietType] || 'normal'}
- Restrições alimentares: ${preferences.allergies.length > 0 ? preferences.allergies.join(', ') : 'Nenhuma'}
- Alimentos que não gosta: ${preferences.dislikedFoods.length > 0 ? preferences.dislikedFoods.join(', ') : 'Nenhum'}
- Tempo de preparo: ${cookingDescriptions[preferences.cookingTime] || 'normal'}

Crie ${preferences.mealsPerDay} refeições: ${mealTypes.join(', ')}.
Cada refeição deve ter ingredientes específicos com quantidades em gramas/ml e instruções de preparo.
As calorias totais do dia devem somar aproximadamente ${user.dailyCalorieGoal} kcal.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Tipo da refeição" },
                  name: { type: Type.STRING, description: "Nome da refeição/receita" },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER },
                  prepTime: { type: Type.NUMBER, description: "Tempo de preparo em minutos" },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.STRING },
                        unit: { type: Type.STRING },
                      },
                      required: ["name", "quantity", "unit"],
                    },
                  },
                  instructions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Passos do modo de preparo",
                  },
                },
                required: ["type", "name", "calories", "protein", "carbs", "fats", "ingredients", "instructions", "prepTime"],
              },
            },
          },
          required: ["meals"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Erro ao gerar plano do dia:", error);
    return null;
  }
};

// Legacy function for compatibility
export const generateWeeklyMealPlan = async (user: User): Promise<any> => {
  if (!ai) {
    console.warn('Gemini AI not configured');
    return [];
  }
  try {
    const prompt = `Crie um plano alimentar de 1 dia (exemplo) baseado nestes dados: 
    Meta de calorias: ${user.dailyCalorieGoal}, Objetivo: ${user.goal || 'Saúde'}.
    Retorne apenas um array JSON com 4 refeições (Café, Almoço, Lanche, Jantar).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["Café da Manhã", "Almoço", "Lanche", "Jantar"] },
                  name: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text).meals;
    }
    return [];
  } catch (error) {
    console.error("Erro ao gerar plano:", error);
    return [];
  }
};

export const generateSmartRecipes = async (ingredients: string): Promise<Omit<Recipe, 'id' | 'image'>[]> => {
  if (!ai) {
    console.warn('Gemini AI not configured');
    return [];
  }
  try {
    const prompt = `Eu tenho os seguintes ingredientes: ${ingredients}. 
    Sugira 3 receitas criativas e saudáveis que posso fazer com eles (assuma que tenho básicos como sal, óleo, água).
    Retorne um JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  timeMinutes: { type: Type.NUMBER },
                  difficulty: { type: Type.STRING, enum: ['Fácil', 'Médio', 'Difícil'] },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  englishSearchTerm: { type: Type.STRING, description: "A simple english term to search for an image of this food (e.g. 'chicken salad', 'pasta')" }
                },
                required: ["title", "calories", "timeMinutes", "difficulty", "tags", "englishSearchTerm"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text).recipes;
    }
    return [];
  } catch (error) {
    console.error("Erro ao gerar receitas:", error);
    throw error;
  }
};