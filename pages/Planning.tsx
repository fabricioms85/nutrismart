import React, { useState } from 'react';
import { Calendar, Plus, RefreshCw, ChefHat, Loader2, CheckCircle } from 'lucide-react';
import { User } from '../types';
import { generateWeeklyMealPlan } from '../services/geminiService';

// Mock user for standalone page testing, but ideally passed via props or context in a real app
// In this architecture, we will accept User via props or use a default
interface PlanningProps {
  user?: User; 
}

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MEAL_TYPES = ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar'];

const Planning: React.FC<PlanningProps> = ({ user }) => {
  const [selectedDay, setSelectedDay] = useState('Seg');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State to store the plan for the selected day
  const [dayPlan, setDayPlan] = useState<any[]>([]);

  const handleGeneratePlan = async () => {
    if (!user) {
      alert("Usuário não identificado para gerar o plano.");
      return;
    }

    setIsGenerating(true);
    try {
      const generatedMeals = await generateWeeklyMealPlan(user);
      setDayPlan(generatedMeals);
    } catch (error) {
      alert("Erro ao gerar plano. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getMealForType = (type: string) => {
    return dayPlan.find(m => m.type === type);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Planejamento Semanal</h1>
           <p className="text-gray-500 text-sm">Organize sua semana para atingir suas metas</p>
        </div>
        
        <button 
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition shadow-sm ${
            isGenerating 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-nutri-500 to-nutri-600 text-white hover:shadow-lg hover:shadow-nutri-200'
          }`}
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          {isGenerating ? 'Criando Plano...' : 'Gerar com IA'}
        </button>
      </div>

      {/* Days Selector */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {DAYS.map((day, index) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`min-w-[60px] h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
              selectedDay === day
                ? 'bg-gradient-to-br from-nutri-500 to-nutri-600 text-white shadow-lg shadow-nutri-200 scale-105'
                : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className="text-xs font-medium opacity-80">{day}</span>
            <span className="font-bold text-lg">{new Date().getDate() + index}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {MEAL_TYPES.map((mealType) => {
          const plannedMeal = getMealForType(mealType);

          return (
            <div key={mealType} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition hover:border-nutri-200">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   <div className={`w-2 h-6 rounded-full ${plannedMeal ? 'bg-nutri-500' : 'bg-gray-300'}`}></div>
                   {mealType}
                 </h3>
                 <button className="text-nutri-500 hover:text-nutri-600 p-2 hover:bg-nutri-50 rounded-full transition">
                   <Plus size={20} />
                 </button>
               </div>
               
               {plannedMeal ? (
                 <div className="bg-nutri-50/50 border border-nutri-100 rounded-xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-nutri-600 shadow-sm text-xl">
                        {mealType.includes('Café') ? '☕' : mealType.includes('Almoço') ? '🥗' : '🍎'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{plannedMeal.name}</h4>
                        <p className="text-sm text-gray-500">{plannedMeal.calories} kcal • Sugestão do Chef IA</p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition">
                      <CheckCircle className="text-nutri-500 cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                 </div>
               ) : (
                 /* Empty State */
                 <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 flex items-center justify-center gap-3 text-gray-400 hover:border-nutri-200 hover:bg-nutri-50/50 transition cursor-pointer group h-24">
                   <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-white transition">
                     <ChefHat size={20} className="group-hover:text-nutri-500 transition" />
                   </div>
                   <span className="text-sm font-medium">Adicionar {mealType}</span>
                 </div>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Planning;