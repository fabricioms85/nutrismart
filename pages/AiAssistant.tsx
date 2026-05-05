import React from 'react';
import NutriAIChatContent from '../components/NutriAIChatContent';
import { User, DailyStats, Meal } from '../types';

interface AiAssistantProps {
  user?: User;
  stats?: DailyStats;
  recentMeals?: Meal[];
}

const AiAssistant: React.FC<AiAssistantProps> = ({ user, stats, recentMeals }) => {
  if (!user || !stats) {
    return (
      <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col p-4 md:p-8 items-center justify-center text-gray-500">
        Carregando...
      </div>
    );
  }

  const meals = recentMeals ?? [];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        {/* Disclaimer IA */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex-shrink-0">
          <p className="text-[10px] text-amber-700 text-center leading-tight">
            As respostas são geradas por inteligência artificial e podem conter imprecisões.
            Não substitui orientação de um profissional de saúde.
          </p>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <NutriAIChatContent user={user} stats={stats} meals={meals} variant="page" />
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
