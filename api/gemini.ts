import type { VercelRequest, VercelResponse } from '@vercel/node';

// Gemini API key is now server-side only (no VITE_ prefix)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models';

interface GeminiRequest {
    action: 'chat' | 'analyze-food' | 'calculate-nutrition' | 'generate-meal-plan' | 'generate-recipes';
    payload: Record<string, unknown>;
}

interface GeminiContent {
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

interface GeminiResponseCandidate {
    content: {
        parts: Array<{ text: string }>;
    };
}

interface GeminiApiResponse {
    candidates?: GeminiResponseCandidate[];
    error?: { message: string };
}

// Model constants
const MODEL_STANDARD = 'gemini-1.5-flash';  // For chat, meal plans, recipes
const MODEL_PREMIUM = 'gemini-1.5-flash';   // TODO: Change to gemini-2.5-flash when billing is enabled

async function callGemini(
    contents: GeminiContent | string,
    systemInstruction?: string,
    responseSchema?: Record<string, unknown>,
    usePremiumModel: boolean = false
): Promise<string> {
    const model = usePremiumModel ? MODEL_PREMIUM : MODEL_STANDARD;

    const requestBody: Record<string, unknown> = {
        contents: typeof contents === 'string'
            ? [{ parts: [{ text: contents }] }]
            : [contents],
    };

    if (systemInstruction) {
        requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    if (responseSchema) {
        requestBody.generationConfig = {
            responseMimeType: 'application/json',
            responseSchema,
        };
    }

    const response = await fetch(
        `${GEMINI_API_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        }
    );

    const data: GeminiApiResponse = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Handler for chat/advice
async function handleChat(payload: Record<string, unknown>): Promise<string> {
    const { message, conversationHistory, context } = payload as {
        message: string;
        conversationHistory?: string;
        context?: {
            user: { name: string; goal?: string; dailyCalorieGoal: number; dailyWaterGoal: number };
            stats: { caloriesConsumed: number; waterConsumed: number; caloriesBurned: number };
            recentMeals: Array<{ name: string; calories: number }>;
        };
    };

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

    return callGemini(message, systemInstruction);
}

// Handler for food image analysis
async function handleAnalyzeFood(payload: Record<string, unknown>): Promise<string> {
    const { base64Data, mimeType = 'image/jpeg' } = payload as {
        base64Data: string;
        mimeType?: string;
    };

    const contents: GeminiContent = {
        parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: 'Analise esta imagem de comida. Identifique o prato principal, estime os ingredientes visíveis com suas quantidades aproximadas e calcule os valores nutricionais totais.' }
        ]
    };

    const schema = {
        type: 'OBJECT',
        properties: {
            name: { type: 'STRING', description: 'Nome curto e descritivo do prato em Português' },
            calories: { type: 'NUMBER', description: 'Estimativa de calorias totais (kcal)' },
            protein: { type: 'NUMBER', description: 'Proteínas totais em gramas' },
            carbs: { type: 'NUMBER', description: 'Carboidratos totais em gramas' },
            fats: { type: 'NUMBER', description: 'Gorduras totais em gramas' },
            weight: { type: 'NUMBER', description: 'Estimativa do peso total da porção em gramas' },
            ingredients: {
                type: 'ARRAY',
                description: 'Lista estimada de ingredientes que compõem o prato',
                items: {
                    type: 'OBJECT',
                    properties: {
                        name: { type: 'STRING' },
                        quantity: { type: 'STRING', description: "Número em formato string (ex: '100', '1')" },
                        unit: { type: 'STRING', description: 'Unidade (g, ml, colher, unidade, fatia)' }
                    },
                    required: ['name', 'quantity', 'unit']
                }
            }
        },
        required: ['name', 'calories', 'protein', 'carbs', 'fats', 'weight', 'ingredients']
    };

    // Use premium model for accurate food analysis
    return callGemini(contents, undefined, schema, true);
}

// Handler for nutrition calculation
async function handleCalculateNutrition(payload: Record<string, unknown>): Promise<string> {
    const { foodItems } = payload as {
        foodItems: Array<{ name: string; quantity: string; unit: string }>;
    };

    const itemsDescription = foodItems.map(f => `${f.quantity}${f.unit} de ${f.name}`).join(', ');
    const prompt = `Calcule o total nutricional aproximado para a seguinte lista de alimentos: ${itemsDescription}. Retorne o total somado.`;

    const schema = {
        type: 'OBJECT',
        properties: {
            calories: { type: 'NUMBER' },
            protein: { type: 'NUMBER' },
            carbs: { type: 'NUMBER' },
            fats: { type: 'NUMBER' }
        },
        required: ['calories', 'protein', 'carbs', 'fats']
    };

    // Use premium model for accurate nutrition calculation
    return callGemini(prompt, undefined, schema, true);
}

// Handler for meal plan generation
async function handleGenerateMealPlan(payload: Record<string, unknown>): Promise<string> {
    const { user, preferences, dayName } = payload as {
        user: { dailyCalorieGoal: number; goal?: string; macros: { protein: number } };
        preferences: {
            dietType: string;
            allergies: string[];
            dislikedFoods: string[];
            mealsPerDay: number;
            cookingTime: string;
        };
        dayName: string;
    };

    const mealTypes = preferences.mealsPerDay === 3
        ? ['Café da Manhã', 'Almoço', 'Jantar']
        : preferences.mealsPerDay === 4
            ? ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar']
            : ['Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar'];

    const dietDescriptions: Record<string, string> = {
        normal: 'alimentação balanceada comum',
        vegetarian: 'vegetariano (sem carne, mas permite ovos e laticínios)',
        vegan: 'vegano (sem nenhum produto animal)',
        lowCarb: 'low carb (menos de 50g de carboidratos por dia)',
        highProtein: 'alto teor proteico (foco em proteínas magras)',
    };

    const cookingDescriptions: Record<string, string> = {
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

    const schema = {
        type: 'OBJECT',
        properties: {
            meals: {
                type: 'ARRAY',
                items: {
                    type: 'OBJECT',
                    properties: {
                        type: { type: 'STRING', description: 'Tipo da refeição' },
                        name: { type: 'STRING', description: 'Nome da refeição/receita' },
                        calories: { type: 'NUMBER' },
                        protein: { type: 'NUMBER' },
                        carbs: { type: 'NUMBER' },
                        fats: { type: 'NUMBER' },
                        prepTime: { type: 'NUMBER', description: 'Tempo de preparo em minutos' },
                        ingredients: {
                            type: 'ARRAY',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    name: { type: 'STRING' },
                                    quantity: { type: 'STRING' },
                                    unit: { type: 'STRING' }
                                },
                                required: ['name', 'quantity', 'unit']
                            }
                        },
                        instructions: {
                            type: 'ARRAY',
                            items: { type: 'STRING' },
                            description: 'Passos do modo de preparo'
                        }
                    },
                    required: ['type', 'name', 'calories', 'protein', 'carbs', 'fats', 'ingredients', 'instructions', 'prepTime']
                }
            }
        },
        required: ['meals']
    };

    return callGemini(prompt, undefined, schema);
}

// Handler for recipe generation
async function handleGenerateRecipes(payload: Record<string, unknown>): Promise<string> {
    const { ingredients } = payload as { ingredients: string };

    const prompt = `Eu tenho os seguintes ingredientes: ${ingredients}. 
Sugira 3 receitas criativas e saudáveis que posso fazer com eles (assuma que tenho básicos como sal, óleo, água).
Retorne um JSON.`;

    const schema = {
        type: 'OBJECT',
        properties: {
            recipes: {
                type: 'ARRAY',
                items: {
                    type: 'OBJECT',
                    properties: {
                        title: { type: 'STRING' },
                        calories: { type: 'NUMBER' },
                        timeMinutes: { type: 'NUMBER' },
                        difficulty: { type: 'STRING', enum: ['Fácil', 'Médio', 'Difícil'] },
                        tags: { type: 'ARRAY', items: { type: 'STRING' } },
                        englishSearchTerm: { type: 'STRING', description: "A simple english term to search for an image of this food (e.g. 'chicken salad', 'pasta')" }
                    },
                    required: ['title', 'calories', 'timeMinutes', 'difficulty', 'tags', 'englishSearchTerm']
                }
            }
        }
    };

    return callGemini(prompt, undefined, schema);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!GEMINI_API_KEY) {
        return res.status(500).json({
            error: 'O assistente de IA não está configurado. Configure a variável GEMINI_API_KEY no servidor.'
        });
    }

    try {
        const { action, payload } = req.body as GeminiRequest;

        let result: string;

        switch (action) {
            case 'chat':
                result = await handleChat(payload);
                break;
            case 'analyze-food':
                result = await handleAnalyzeFood(payload);
                break;
            case 'calculate-nutrition':
                result = await handleCalculateNutrition(payload);
                break;
            case 'generate-meal-plan':
                result = await handleGenerateMealPlan(payload);
                break;
            case 'generate-recipes':
                result = await handleGenerateRecipes(payload);
                break;
            default:
                return res.status(400).json({ error: 'Ação inválida' });
        }

        return res.status(200).json({ result });
    } catch (error) {
        console.error('Gemini API Error:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Erro ao processar requisição'
        });
    }
}
