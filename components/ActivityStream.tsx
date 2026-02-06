import React from 'react';
import { Utensils, Dumbbell, Clock, ArrowRight } from 'lucide-react';
import { Meal, Exercise, NavItem } from '../types';

interface ActivityStreamProps {
    recentMeals: Meal[];
    recentExercises: Exercise[];
    onNavigate: (item: NavItem) => void;
}

const ActivityStream: React.FC<ActivityStreamProps> = ({ recentMeals, recentExercises, onNavigate }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Recent Meals Column */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-heading font-bold text-xl text-gray-900 tracking-tight">Refeições de Hoje</h3>
                    <button
                        onClick={() => onNavigate(NavItem.RegisterMeal)}
                        className="group flex items-center gap-1 text-nutri-500 text-sm font-bold hover:text-nutri-600 transition-colors"
                    >
                        Ver todas
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {recentMeals.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-lg shadow-gray-200/40">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <Utensils size={24} />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">Nenhuma refeição registrada</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentMeals.map((meal, idx) => (
                            <div
                                key={meal.id + idx}
                                className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-nutri-500/5 hover:border-nutri-100/50 hover:-translate-y-0.5 transition-all duration-300 cursor-default"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-nutri-50 text-2xl rounded-2xl flex items-center justify-center group-hover:bg-nutri-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        {meal.type === 'breakfast' ? '☕' : meal.type === 'lunch' ? '🥗' : meal.type === 'dinner' ? '🍲' : '🍎'}
                                    </div>
                                    <div>
                                        <p className="font-heading font-bold text-gray-900 text-base">{meal.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md">
                                                <Clock size={10} /> {meal.time}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-heading font-black text-nutri-500 text-lg">+{meal.calories}</span>
                                    <span className="text-[10px] text-gray-300 font-bold block uppercase tracking-wider">kcal</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Exercises Column */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-heading font-bold text-xl text-gray-900 tracking-tight">Atividades de Hoje</h3>
                    <button
                        onClick={() => onNavigate(NavItem.RegisterExercise)}
                        className="group flex items-center gap-1 text-nutri-500 text-sm font-bold hover:text-nutri-600 transition-colors"
                    >
                        Ver todas
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {recentExercises.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center shadow-lg shadow-gray-200/40">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <Dumbbell size={24} />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">Nenhuma atividade registrada</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentExercises.map((ex, idx) => (
                            <div
                                key={ex.id + idx}
                                className="group flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-solar-500/5 hover:border-solar-100/50 hover:-translate-y-0.5 transition-all duration-300 cursor-default"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-orange-50 text-solar-500 rounded-2xl flex items-center justify-center group-hover:bg-solar-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        <Dumbbell size={24} />
                                    </div>
                                    <div>
                                        <p className="font-heading font-bold text-gray-900 text-base">{ex.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded-md">
                                                {ex.durationMinutes} min
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-heading font-black text-solar-500 text-lg">-{ex.caloriesBurned}</span>
                                    <span className="text-[10px] text-gray-300 font-bold block uppercase tracking-wider">kcal</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityStream;
