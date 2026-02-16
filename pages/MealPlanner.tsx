import React, { useState, useEffect } from 'react';
import { Calendar, ChefHat, ShoppingCart, RefreshCw, Loader2, Clock, Flame, ChevronRight, X, Settings2, Utensils, Check } from 'lucide-react';
import { User } from '../types';
import { generateWeeklyMealPlan } from '../services/geminiService';
import {
    WeekPlan,
    DayPlan,
    PlannedMeal,
    MealPreferences,
    ShoppingItem,
    getWeekDates,
    getCurrentWeekPlan,
    saveMealPlan,
    getMealPreferences,
    saveMealPreferences,
    DEFAULT_PREFERENCES,
    generateShoppingList,
    saveShoppingList,
    formatShoppingListForShare,
} from '../services/mealPlanService';

interface MealPlannerProps {
    user: User;
}

const MealPlanner: React.FC<MealPlannerProps> = ({ user }) => {
    const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);
    const [selectedMeal, setSelectedMeal] = useState<PlannedMeal | null>(null);
    const [preferences, setPreferences] = useState<MealPreferences>(getMealPreferences());
    const [showPreferences, setShowPreferences] = useState(false);
    const [showShoppingList, setShowShoppingList] = useState(false);
    const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const weekDates = getWeekDates();

    useEffect(() => {
        const existing = getCurrentWeekPlan();
        if (existing) {
            setWeekPlan(existing);
        }
    }, []);

    const mapMealType = (type: string): PlannedMeal['type'] => {
        const t = type.toLowerCase();
        if (t.includes('café') || t.includes('cafe')) return 'breakfast';
        if (t.includes('almoço')) return 'lunch';
        if (t.includes('jantar')) return 'dinner';
        return 'snack';
    };

    const generatePlan = async () => {
        setIsGenerating(true);

        try {
            const result = await generateWeeklyMealPlan(user, preferences, weekDates);

            if (!result?.days?.length) {
                console.error('Resposta da API sem dias');
                return;
            }

            const days: DayPlan[] = weekDates.map(({ date, dayName }, index) => {
                const apiDay = result.days[index] ?? result.days.find((d: { date?: string }) => d.date === date) ?? result.days[0];
                const meals = (apiDay?.meals || []).map((m: { type: string; name: string; calories: number; protein: number; carbs: number; fats: number; ingredients: { name: string; quantity: string; unit: string }[]; instructions?: string[]; prepTime?: number }) => ({
                    type: mapMealType(m.type),
                    name: m.name,
                    calories: m.calories ?? 0,
                    protein: m.protein ?? 0,
                    carbs: m.carbs ?? 0,
                    fats: m.fats ?? 0,
                    ingredients: m.ingredients ?? [],
                    instructions: m.instructions,
                    prepTime: m.prepTime,
                }));

                const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
                const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);

                return {
                    date,
                    dayName,
                    meals,
                    totalCalories,
                    totalProtein,
                };
            });

            const newPlan: WeekPlan = {
                id: crypto.randomUUID(),
                weekStart: weekDates[0].date,
                days,
                preferences,
                createdAt: new Date().toISOString(),
            };

            setWeekPlan(newPlan);
            saveMealPlan(newPlan);

            const list = generateShoppingList(newPlan);
            setShoppingList(list);
            saveShoppingList(list);
        } catch (error) {
            console.error('Error generating plan:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSavePreferences = () => {
        saveMealPreferences(preferences);
        setShowPreferences(false);
    };

    const handleGenerateShoppingList = () => {
        if (weekPlan) {
            const list = generateShoppingList(weekPlan);
            setShoppingList(list);
            saveShoppingList(list);
            setShowShoppingList(true);
        }
    };

    const handleShareShoppingList = async () => {
        const text = formatShoppingListForShare(shoppingList);

        if (navigator.share) {
            try {
                await navigator.share({ text });
            } catch {
                navigator.clipboard.writeText(text);
            }
        } else {
            navigator.clipboard.writeText(text);
        }
    };

    const toggleShoppingItem = (index: number) => {
        const updated = [...shoppingList];
        updated[index].checked = !updated[index].checked;
        setShoppingList(updated);
        saveShoppingList(updated);
    };

    const getMealTypeLabel = (type: string) => {
        switch (type) {
            case 'breakfast': return 'Café da Manhã';
            case 'lunch': return 'Almoço';
            case 'dinner': return 'Jantar';
            case 'snack': return 'Lanche';
            default: return type;
        }
    };

    const getMealTypeIcon = (type: string) => {
        switch (type) {
            case 'breakfast': return '☕';
            case 'lunch': return '🍽️';
            case 'dinner': return '🌙';
            case 'snack': return '🍎';
            default: return '🍴';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Planejador de Refeições</h1>
                    <p className="text-gray-500 text-sm">Plano semanal personalizado com IA</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPreferences(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                    >
                        <Settings2 size={18} className="text-gray-500" />
                        <span className="hidden sm:inline">Preferências</span>
                    </button>

                    {weekPlan && (
                        <button
                            onClick={handleGenerateShoppingList}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                        >
                            <ShoppingCart size={18} className="text-gray-500" />
                            <span className="hidden sm:inline">Lista de Compras</span>
                        </button>
                    )}

                    <button
                        onClick={generatePlan}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-nutri-500 to-nutri-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <RefreshCw size={18} />
                        )}
                        {isGenerating ? 'Gerando...' : weekPlan ? 'Regenerar' : 'Gerar Plano'}
                    </button>
                </div>
            </div>

            {/* Generating State */}
            {isGenerating && (
                <div className="bg-gradient-to-br from-nutri-50 to-emerald-50 rounded-2xl p-8 text-center mb-8 border border-nutri-100">
                    <Loader2 size={48} className="animate-spin text-nutri-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Gerando seu plano semanal...</h3>
                    <p className="text-gray-600">Isso pode levar alguns segundos.</p>
                </div>
            )}

            {/* Empty State */}
            {!weekPlan && !isGenerating && (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-gradient-to-br from-nutri-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Calendar size={40} className="text-nutri-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum plano criado</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Clique em "Gerar Plano" para criar um plano alimentar personalizado para a semana inteira.
                    </p>
                    <button
                        onClick={generatePlan}
                        className="px-6 py-3 bg-gradient-to-r from-nutri-500 to-nutri-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                    >
                        Gerar Meu Plano Semanal
                    </button>
                </div>
            )}

            {/* Week View */}
            {weekPlan && !isGenerating && (
                <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                    {weekPlan.days.map((day, index) => (
                        <div
                            key={day.date}
                            className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => setSelectedDay(day)}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-800">{day.dayName}</h3>
                                    <p className="text-xs text-gray-400">
                                        {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-gray-400" />
                            </div>

                            <div className="space-y-2">
                                {day.meals.slice(0, 3).map((meal, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <span>{getMealTypeIcon(meal.type)}</span>
                                        <span className="text-gray-600 truncate">{meal.name}</span>
                                    </div>
                                ))}
                                {day.meals.length > 3 && (
                                    <p className="text-xs text-gray-400">+{day.meals.length - 3} mais</p>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span className="text-gray-500">{day.totalCalories} kcal</span>
                                <span className="text-nutri-600 font-medium">{day.totalProtein}g prot</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Day Detail Modal */}
            {selectedDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDay(null)} />
                    <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedDay.dayName}</h2>
                                <p className="text-sm text-gray-500">{selectedDay.totalCalories} kcal • {selectedDay.totalProtein}g proteína</p>
                            </div>
                            <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {selectedDay.meals.map((meal, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                                    onClick={() => setSelectedMeal(meal)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{getMealTypeIcon(meal.type)}</span>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">{getMealTypeLabel(meal.type)}</p>
                                                <h4 className="font-semibold text-gray-800">{meal.name}</h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">{meal.calories} kcal</p>
                                            <p className="text-xs text-gray-500">
                                                P:{meal.protein}g • C:{meal.carbs}g • G:{meal.fats}g
                                            </p>
                                        </div>
                                    </div>
                                    {meal.prepTime && (
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                            <Clock size={12} />
                                            <span>{meal.prepTime} min</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Meal Detail Modal */}
            {selectedMeal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMeal(null)} />
                    <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-nutri-500 to-nutri-600 p-6 text-white">
                            <button
                                onClick={() => setSelectedMeal(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                            <span className="text-3xl">{getMealTypeIcon(selectedMeal.type)}</span>
                            <p className="text-sm text-white/80 mt-2">{getMealTypeLabel(selectedMeal.type)}</p>
                            <h2 className="text-xl font-bold">{selectedMeal.name}</h2>

                            <div className="flex items-center gap-4 mt-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Flame size={16} />
                                    <span>{selectedMeal.calories} kcal</span>
                                </div>
                                {selectedMeal.prepTime && (
                                    <div className="flex items-center gap-1">
                                        <Clock size={16} />
                                        <span>{selectedMeal.prepTime} min</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Macros */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-3 bg-blue-50 rounded-xl">
                                    <p className="text-lg font-bold text-blue-600">{selectedMeal.protein}g</p>
                                    <p className="text-xs text-blue-600">Proteína</p>
                                </div>
                                <div className="text-center p-3 bg-amber-50 rounded-xl">
                                    <p className="text-lg font-bold text-amber-600">{selectedMeal.carbs}g</p>
                                    <p className="text-xs text-amber-600">Carboidratos</p>
                                </div>
                                <div className="text-center p-3 bg-pink-50 rounded-xl">
                                    <p className="text-lg font-bold text-pink-600">{selectedMeal.fats}g</p>
                                    <p className="text-xs text-pink-600">Gorduras</p>
                                </div>
                            </div>

                            {/* Ingredients */}
                            {selectedMeal.ingredients && selectedMeal.ingredients.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <Utensils size={18} />
                                        Ingredientes
                                    </h3>
                                    <ul className="space-y-2">
                                        {selectedMeal.ingredients.map((ing, i) => (
                                            <li key={i} className="flex items-center gap-2 text-gray-600">
                                                <span className="w-2 h-2 bg-nutri-500 rounded-full" />
                                                <span>{ing.quantity} {ing.unit} {ing.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Instructions */}
                            {selectedMeal.instructions && selectedMeal.instructions.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <ChefHat size={18} />
                                        Modo de Preparo
                                    </h3>
                                    <ol className="space-y-3">
                                        {selectedMeal.instructions.map((step, i) => (
                                            <li key={i} className="flex gap-3">
                                                <span className="flex-shrink-0 w-6 h-6 bg-nutri-100 text-nutri-600 rounded-full flex items-center justify-center text-sm font-bold">
                                                    {i + 1}
                                                </span>
                                                <span className="text-gray-600">{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Preferences Modal */}
            {showPreferences && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreferences(false)} />
                    <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Preferências Alimentares</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Dieta</label>
                                <select
                                    value={preferences.dietType}
                                    onChange={e => setPreferences({ ...preferences, dietType: e.target.value as any })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nutri-500"
                                >
                                    <option value="normal">Normal (Balanceada)</option>
                                    <option value="vegetarian">Vegetariano</option>
                                    <option value="vegan">Vegano</option>
                                    <option value="lowCarb">Low Carb</option>
                                    <option value="highProtein">Alta Proteína</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Refeições por Dia</label>
                                <select
                                    value={preferences.mealsPerDay}
                                    onChange={e => setPreferences({ ...preferences, mealsPerDay: parseInt(e.target.value) as any })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nutri-500"
                                >
                                    <option value={3}>3 refeições</option>
                                    <option value={4}>4 refeições</option>
                                    <option value={5}>5 refeições</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tempo de Preparo</label>
                                <select
                                    value={preferences.cookingTime}
                                    onChange={e => setPreferences({ ...preferences, cookingTime: e.target.value as any })}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-nutri-500"
                                >
                                    <option value="quick">Rápido (até 20min)</option>
                                    <option value="normal">Normal (até 40min)</option>
                                    <option value="elaborate">Elaborado (sem limite)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowPreferences(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSavePreferences}
                                className="flex-1 py-3 bg-nutri-500 text-white rounded-xl hover:bg-nutri-600"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shopping List Modal */}
            {showShoppingList && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShoppingList(false)} />
                    <div className="relative bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingCart size={24} className="text-nutri-500" />
                                <h2 className="text-xl font-bold text-gray-900">Lista de Compras</h2>
                            </div>
                            <button onClick={() => setShowShoppingList(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[50vh]">
                            {shoppingList.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Lista vazia</p>
                            ) : (
                                <div className="space-y-2">
                                    {shoppingList.map((item, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${item.checked ? 'bg-green-50 line-through text-gray-400' : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            onClick={() => toggleShoppingItem(index)}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                                }`}>
                                                {item.checked && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="flex-1">{item.quantity} {item.unit} {item.ingredient}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t">
                            <button
                                onClick={handleShareShoppingList}
                                className="w-full py-3 bg-nutri-500 text-white rounded-xl hover:bg-nutri-600"
                            >
                                Compartilhar Lista
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MealPlanner;
