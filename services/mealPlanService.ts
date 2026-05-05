/**
 * Meal Plan Service
 * Generates weekly meal plans and shopping lists using AI
 */

import { User, Recipe } from '../types';

// Planned meal structure
export interface PlannedMeal {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    ingredients: { name: string; quantity: string; unit: string }[];
    instructions?: string[];
    prepTime?: number;
}

// Day plan
export interface DayPlan {
    date: string;
    dayName: string;
    meals: PlannedMeal[];
    totalCalories: number;
    totalProtein: number;
}

// Week plan
export interface WeekPlan {
    id: string;
    weekStart: string;
    days: DayPlan[];
    preferences: MealPreferences;
    createdAt: string;
}

// User preferences for meal planning
export interface MealPreferences {
    dietType: 'normal' | 'vegetarian' | 'vegan' | 'lowCarb' | 'highProtein';
    allergies: string[];
    dislikedFoods: string[];
    mealsPerDay: 3 | 4 | 5;
    cookingTime: 'quick' | 'normal' | 'elaborate';
}

// Shopping list item
export interface ShoppingItem {
    ingredient: string;
    quantity: number;
    unit: string;
    category: 'proteina' | 'carboidrato' | 'vegetal' | 'fruta' | 'laticinio' | 'tempero' | 'outros';
    checked: boolean;
}

// Storage keys
const MEAL_PLANS_KEY = 'nutrismart-meal-plans';
const PREFERENCES_KEY = 'nutrismart-meal-preferences';
const SHOPPING_LIST_KEY = 'nutrismart-shopping-list';

// Default preferences
export const DEFAULT_PREFERENCES: MealPreferences = {
    dietType: 'normal',
    allergies: [],
    dislikedFoods: [],
    mealsPerDay: 4,
    cookingTime: 'normal',
};

// Get saved preferences
export function getMealPreferences(): MealPreferences {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (!stored) return DEFAULT_PREFERENCES;

    try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {
        return DEFAULT_PREFERENCES;
    }
}

// Save preferences
export function saveMealPreferences(prefs: MealPreferences): void {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

// Get saved meal plans
export function getSavedMealPlans(): WeekPlan[] {
    const stored = localStorage.getItem(MEAL_PLANS_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Get meal plan for a specific week
export function getMealPlan(weekStart: string): WeekPlan | null {
    const plans = getSavedMealPlans();
    return plans.find(p => p.weekStart === weekStart) || null;
}

// Get current week's plan
export function getCurrentWeekPlan(): WeekPlan | null {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = startOfWeek.toISOString().split('T')[0];

    return getMealPlan(weekStart);
}

// Save meal plan
export function saveMealPlan(plan: WeekPlan): void {
    const plans = getSavedMealPlans();
    const existingIndex = plans.findIndex(p => p.weekStart === plan.weekStart);

    if (existingIndex >= 0) {
        plans[existingIndex] = plan;
    } else {
        plans.push(plan);
    }

    // Keep only last 4 weeks
    const sorted = plans.sort((a, b) => b.weekStart.localeCompare(a.weekStart)).slice(0, 4);
    localStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(sorted));
}

// Get day names in Portuguese
function getDayName(date: Date): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
}

// Generate week structure
export function getWeekDates(startDate?: Date): { date: string; dayName: string }[] {
    const start = startDate || new Date();
    const startOfWeek = new Date(start);
    startOfWeek.setDate(start.getDate() - start.getDay() + 1);

    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push({
            date: day.toISOString().split('T')[0],
            dayName: getDayName(day),
        });
    }

    return days;
}

// Prefixes to remove for canonical name (evita "peito de frango" e "frango" separados)
const INGREDIENT_NAME_PREFIXES = [
    'peito de ', 'file de ', 'filé de ', 'filé ', 'cubos de ', 'fatias de ',
    'pedaços de ', 'grãos de ', 'grão de ', 'pedaço de ', 'lascas de '
];

function normalizeIngredientName(name: string): string {
    let s = name.toLowerCase().trim();
    for (const prefix of INGREDIENT_NAME_PREFIXES) {
        if (s.startsWith(prefix)) {
            s = s.slice(prefix.length).trim();
            break;
        }
    }
    return s || name.toLowerCase().trim();
}

// Unifica "g"/"gramas", "ml"/"mililitros" etc para somar quantidades
function normalizeUnit(unit: string): string {
    const u = (unit || '').toLowerCase().trim();
    if (['g', 'gramas', 'grama', 'gr'].includes(u)) return 'g';
    if (['ml', 'mililitros', 'mililitro', 'mls'].includes(u)) return 'ml';
    if (['un', 'unidade', 'unidades'].includes(u)) return 'un';
    if (['xícara', 'xícaras', 'xicara', 'xicaras'].includes(u)) return 'xícara';
    if (['colher', 'colheres', 'colher de sopa', 'colheres de sopa'].includes(u)) return 'colher';
    return u || 'g';
}

// Categorize ingredient
function categorizeIngredient(ingredient: string): ShoppingItem['category'] {
    const lower = ingredient.toLowerCase();

    const categories: { [key: string]: string[] } = {
        proteina: ['frango', 'carne', 'peixe', 'ovo', 'atum', 'salmão', 'camarão', 'tofu', 'porco', 'peru', 'patinho'],
        carboidrato: ['arroz', 'macarrão', 'pão', 'batata', 'mandioca', 'aveia', 'quinoa', 'farinha', 'massa'],
        vegetal: ['alface', 'tomate', 'cebola', 'alho', 'brócolis', 'espinafre', 'cenoura', 'pepino', 'abobrinha', 'berinjela', 'pimentão', 'couve'],
        fruta: ['banana', 'maçã', 'laranja', 'limão', 'morango', 'abacate', 'manga', 'mamão', 'uva'],
        laticinio: ['leite', 'queijo', 'iogurte', 'manteiga', 'creme', 'requeijão', 'nata'],
        tempero: ['sal', 'pimenta', 'orégano', 'manjericão', 'alecrim', 'azeite', 'vinagre', 'molho', 'curry', 'cominho'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(k => lower.includes(k))) {
            return category as ShoppingItem['category'];
        }
    }

    return 'outros';
}

// Generate shopping list from week plan (unifica ingredientes iguais na mesma linha)
export function generateShoppingList(plan: WeekPlan): ShoppingItem[] {
    const ingredientMap = new Map<string, { quantity: number; unit: string; displayName: string }>();

    plan.days.forEach(day => {
        day.meals.forEach(meal => {
            meal.ingredients?.forEach(ing => {
                const canonicalName = normalizeIngredientName(ing.name);
                const normalizedUnit = normalizeUnit(ing.unit);
                const qty = parseFloat(String(ing.quantity).replace(',', '.')) || 1;
                const key = `${canonicalName}::${normalizedUnit}`;

                if (ingredientMap.has(key)) {
                    const existing = ingredientMap.get(key)!;
                    existing.quantity += qty;
                } else {
                    const displayName = canonicalName.charAt(0).toUpperCase() + canonicalName.slice(1);
                    ingredientMap.set(key, { quantity: qty, unit: normalizedUnit, displayName });
                }
            });
        });
    });

    const items: ShoppingItem[] = [];
    ingredientMap.forEach((value, key) => {
        const [canonicalName] = key.split('::');
        items.push({
            ingredient: value.displayName,
            quantity: Math.ceil(value.quantity),
            unit: value.unit,
            category: categorizeIngredient(canonicalName),
            checked: false,
        });
    });

    const categoryOrder: ShoppingItem['category'][] = ['proteina', 'vegetal', 'fruta', 'carboidrato', 'laticinio', 'tempero', 'outros'];
    items.sort((a, b) => {
        const cat = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        return cat !== 0 ? cat : a.ingredient.localeCompare(b.ingredient);
    });

    return items;
}

// Get saved shopping list
export function getShoppingList(): ShoppingItem[] {
    const stored = localStorage.getItem(SHOPPING_LIST_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Save shopping list
export function saveShoppingList(list: ShoppingItem[]): void {
    localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(list));
}

// Toggle shopping item checked
export function toggleShoppingItem(ingredient: string): void {
    const list = getShoppingList();
    const item = list.find(i => i.ingredient.toLowerCase() === ingredient.toLowerCase());
    if (item) {
        item.checked = !item.checked;
        saveShoppingList(list);
    }
}

// Format shopping list for sharing
export function formatShoppingListForShare(list: ShoppingItem[]): string {
    const grouped: { [key: string]: ShoppingItem[] } = {};

    list.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });

    const categoryNames: { [key: string]: string } = {
        proteina: '🥩 Proteínas',
        vegetal: '🥬 Vegetais',
        fruta: '🍎 Frutas',
        carboidrato: '🍚 Carboidratos',
        laticinio: '🧀 Laticínios',
        tempero: '🧂 Temperos',
        outros: '📦 Outros',
    };

    let text = '🛒 Lista de Compras - NutriSmart\n\n';

    Object.entries(grouped).forEach(([category, items]) => {
        text += `${categoryNames[category] || category}\n`;
        items.forEach(item => {
            const check = item.checked ? '✅' : '⬜';
            text += `${check} ${item.quantity} ${item.unit} ${item.ingredient}\n`;
        });
        text += '\n';
    });

    return text;
}
