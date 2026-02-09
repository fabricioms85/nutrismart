import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3333;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Supabase client
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

interface GeminiRequest {
    action: 'chat' | 'analyze-food' | 'calculate-nutrition' | 'generate-meal-plan' | 'generate-recipes' | 'generate-shopping-list' | 'generate-clinical-summary';
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

interface ModelConfig {
    name: string;
    apiUrl: string;
}

// Model configuration - Updated to match Google AI Studio model names
const MODELS = {
    VISION: {
        name: 'gemini-2.5-flash',  // Primary vision model
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
    },
    VISION_FALLBACK: {
        name: 'gemini-2.5-flash-lite',  // Fallback with lower quota usage
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
    },
    LOGIC: {
        name: 'gemini-2.5-flash',  // For complex calculations
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
    },
    LITE: {
        name: 'gemini-2.5-flash-lite',  // For chat and recipes (lower quota)
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
    }
};

// System prompt for nutrition expert
const NUTRITION_EXPERT_PROMPT = `Você é um Especialista em Nutrição Computacional. Sua tarefa é analisar fotos de refeições e extrair: ingredientes, pesos estimados e macros (Calorias, Proteínas, Carboidratos, Gorduras).

Regras Estritas:
1. Retorne apenas um JSON puro, sem markdown ou explicações
2. Use bases nutricionais como TACO (Brasil) ou USDA para os cálculos
3. Estime o peso de cada porção baseado em referências visuais (tamanho do prato, utensílios)
4. Se a imagem não for de comida, retorne {"error": "not_food"}
5. Seja preciso nos valores nutricionais`;

// Generate SHA-256 hash for image caching
async function sha256(data: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Core Gemini API call
async function callGemini(
    modelConfig: ModelConfig,
    contents: GeminiContent | string,
    systemInstruction?: string,
    responseSchema?: Record<string, unknown>
): Promise<string> {
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
        `${modelConfig.apiUrl}/${modelConfig.name}:generateContent?key=${GEMINI_API_KEY}`,
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

// Call with automatic fallback on quota errors
async function callWithFallback(
    primary: ModelConfig,
    fallback: ModelConfig | null,
    contents: GeminiContent | string,
    systemInstruction?: string,
    responseSchema?: Record<string, unknown>
): Promise<string> {
    try {
        return await callGemini(primary, contents, systemInstruction, responseSchema);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (fallback && (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED'))) {
            console.log(`Primary model ${primary.name} quota exceeded, falling back to ${fallback.name}`);
            return await callGemini(fallback, contents, systemInstruction, responseSchema);
        }
        throw error;
    }
}

// Handler for chat/advice
async function handleChat(payload: Record<string, unknown>): Promise<string> {
    const { message, conversationHistory, context } = payload as {
        message: string;
        conversationHistory?: string;
        context?: {
            user: {
                name: string;
                goal?: string;
                dailyCalorieGoal: number;
                dailyWaterGoal: number;
                isClinicalMode?: boolean;
                clinicalSettings?: {
                    medication: string;
                    dosage: string;
                    startDate: string;
                    injectionDay: number;
                };
            };
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

        if (user.isClinicalMode && user.clinicalSettings) {
            systemInstruction += `
             
MODO CLÍNICO ATIVO (${user.clinicalSettings.medication}):
- O usuário está em tratamento médico para perda de peso.
- MEDICAÇÃO: ${user.clinicalSettings.medication} (${user.clinicalSettings.dosage}).
- FOCO CRÍTICO: Priorize proteína em TODAS as refeições para evitar perda de massa magra.
- HIDRATAÇÃO: Enfatize beber muita água para evitar efeitos colaterais.
- EFEITOS COLATERAIS: Se o usuário relatar náusea/enjoo, sugira alimentos frios, secos, gengibre e comer devagar.
- FRACIONAMENTO: Sugira refeições menores e mais frequentes se houver saciedade precoce.
- EVITAR: Alimentos muito gordurosos ou muito doces que podem piorar o enjoo com a medicação.
- Seja empática com possíveis dificuldades de adaptação ao medicamento.`;
        }
    }

    if (conversationHistory) {
        systemInstruction += `

HISTÓRICO DA CONVERSA:
${conversationHistory}`;
    }

    return callGemini(MODELS.LITE, message, systemInstruction);
}

// Handler for food image analysis with caching
async function handleAnalyzeFood(payload: Record<string, unknown>): Promise<string> {
    const { base64Data, mimeType = 'image/jpeg' } = payload as {
        base64Data: string;
        mimeType?: string;
    };

    // Generate hash for caching
    const imageHash = await sha256(base64Data.substring(0, 10000));

    // Check cache in Supabase
    if (supabase) {
        const { data: cached } = await supabase
            .from('meal_analysis')
            .select('analysis_result')
            .eq('image_hash', imageHash)
            .single();

        if (cached?.analysis_result) {
            console.log('Cache hit for image hash:', imageHash.substring(0, 16));
            return JSON.stringify(cached.analysis_result);
        }
    }

    // Prepare request content
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
            error: { type: 'STRING', description: 'Se não for comida, retorne "not_food"' },
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

    const result = await callWithFallback(
        MODELS.VISION,
        MODELS.VISION_FALLBACK,
        contents,
        NUTRITION_EXPERT_PROMPT,
        schema
    );

    // Save to cache
    if (supabase && result) {
        try {
            const parsedResult = JSON.parse(result);
            if (!parsedResult.error) {
                await supabase.from('meal_analysis').insert({
                    image_hash: imageHash,
                    analysis_result: parsedResult
                });
                console.log('Cached analysis for hash:', imageHash.substring(0, 16));
            }
        } catch (e) {
            console.error('Failed to cache result:', e);
        }
    }

    return result;
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

    return callGemini(MODELS.LOGIC, prompt, undefined, schema);
}

// Handler for meal plan generation
async function handleGenerateMealPlan(payload: Record<string, unknown>): Promise<string> {
    const { user, preferences, dayName } = payload as {
        user: {
            dailyCalorieGoal: number;
            goal?: string;
            macros: { protein: number };
            isClinicalMode?: boolean;
            clinicalSettings?: { medication: string };
        };
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

    let prompt = `Crie um plano alimentar para ${dayName} com as seguintes especificações:
    
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

    if (user.isClinicalMode) {
        prompt += `
        
ATENÇÃO - MODO CLÍNICO (${user?.clinicalSettings?.medication || 'Tratamento'}):
Este plano deve ser adaptado para quem usa medicação para perda de peso (GLP-1).
1. PRIORIDADE TOTAL EM PROTEÍNA: Garanta que a meta de proteína seja atingida ou superada para preservar massa magra.
2. ALTA SACIEDADE COM POUCO VOLUME: Use alimentos densos em nutrientes, pois o apetite pode estar reduzido.
3. INGESTÃO DE FIBRAS: Inclua fibras para auxiliar o intestino, mas evite excesso de gordura na mesma refeição.
4. EVITAR NÁUSEAS: Evite refeições muito volumosas ou muito gordurosas.
5. HIDRATAÇÃO: Sugira acompanhar com água (exceto durante a refeição se causar plenitude gástrica).`;
    }

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

    return callGemini(MODELS.LOGIC, prompt, undefined, schema);
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

    return callGemini(MODELS.LITE, prompt, undefined, schema);
}

// Handler for shopping list generation
async function handleGenerateShoppingList(payload: Record<string, unknown>): Promise<string> {
    const { ingredients } = payload as { ingredients: string[] };

    const prompt = `Você é um organizador de lista de compras. Receba a lista de ingredientes abaixo e agrupe-os por setor de supermercado.

INGREDIENTES:
${ingredients.map(i => `- ${i}`).join('\n')}

Retorne um JSON válido agrupando os itens por categoria. Mantenha as quantidades originais quando disponíveis. Remova categorias vazias. Padronize nomes (ex: "2 bananas" em vez de "banana (2)"). Use português brasileiro.`;

    const schema = {
        type: 'OBJECT',
        properties: {
            'Hortifruti': { type: 'ARRAY', items: { type: 'STRING' } },
            'Açougue': { type: 'ARRAY', items: { type: 'STRING' } },
            'Laticínios': { type: 'ARRAY', items: { type: 'STRING' } },
            'Mercearia': { type: 'ARRAY', items: { type: 'STRING' } },
            'Bebidas': { type: 'ARRAY', items: { type: 'STRING' } },
            'Congelados': { type: 'ARRAY', items: { type: 'STRING' } },
            'Padaria': { type: 'ARRAY', items: { type: 'STRING' } },
            'Outros': { type: 'ARRAY', items: { type: 'STRING' } }
        }
    };

    return callGemini(MODELS.LITE, prompt, undefined, schema);
}

// Handler for clinical summary generation
async function handleGenerateClinicalSummary(payload: Record<string, unknown>): Promise<string> {
    const { proteinAdherence, symptoms, medication, dosage, startDate } = payload as {
        proteinAdherence: number;
        symptoms: Array<{ symptom: string; date: string; severity: number }>;
        medication?: string;
        dosage?: string;
        startDate?: string;
    };

    const symptomCounts = new Map<string, number>();
    for (const s of symptoms) {
        symptomCounts.set(s.symptom, (symptomCounts.get(s.symptom) || 0) + 1);
    }
    const symptomSummary = Array.from(symptomCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([symptom, count]) => `${symptom}: ${count}x`)
        .join(', ');

    const prompt = `Você é um relator médico especializado em acompanhamento de pacientes em uso de agonistas GLP-1 para perda de peso.

DADOS DO PACIENTE:
- Medicamento: ${medication || 'Não informado'}
- Dosagem: ${dosage || 'Não informada'}
- Início do tratamento: ${startDate || 'Não informado'}
- Adesão à meta proteica: ${proteinAdherence}% dos dias
- Sintomas registrados: ${symptomSummary || 'Nenhum sintoma registrado'}

Com base nesses dados, gere um resumo clínico de 2-3 parágrafos para um endocrinologista ou nutrólogo. Seja objetivo e use linguagem técnica. Mencione:
1. Avaliação geral da adesão alimentar
2. Padrão dos efeitos colaterais (se houver)
3. Recomendações para a próxima consulta

Retorne apenas o texto do resumo, sem formatação especial.`;

    return callGemini(MODELS.LOGIC, prompt);
}

// Main API endpoint
app.post('/api/gemini', async (req, res) => {
    if (!GEMINI_API_KEY) {
        return res.status(500).json({
            error: 'O assistente de IA não está configurado. Configure a variável GEMINI_API_KEY no .env.local'
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
            case 'generate-shopping-list':
                result = await handleGenerateShoppingList(payload);
                break;
            case 'generate-clinical-summary':
                result = await handleGenerateClinicalSummary(payload);
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
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', geminiConfigured: !!GEMINI_API_KEY });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API Server running at http://localhost:${PORT}`);
    console.log(`   Gemini API: ${GEMINI_API_KEY ? '✅ Configured' : '❌ Missing GEMINI_API_KEY'}`);
    console.log(`   Supabase: ${supabase ? '✅ Connected' : '⚠️ Not configured'}`);
});
