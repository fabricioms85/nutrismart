import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { DailyStats } from '../types';

interface ConsistencyCardProps {
    streak: number;
    weeklyStats: { date: string; stats: DailyStats; achieved: boolean }[];
}

const ConsistencyCard: React.FC<ConsistencyCardProps> = ({ streak, weeklyStats }) => {

    // Sort logic to ensure Mon-Sun order? No, we just show last 7 days relative to today.
    // weeklyStats comes ordered from oldest to newest (today at end).

    const days = weeklyStats.map(stat => {
        const date = new Date(stat.date + 'T12:00:00'); // Clean date parsing
        return {
            label: date.toLocaleDateString('pt-BR', { weekday: 'narrow' }).toUpperCase(), // S, T, Q...
            achieved: stat.achieved
        };
    });

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>

            <div className="relative z-10 flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-orange-50 rounded-lg">
                            <Trophy size={14} className="text-orange-500" />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Consistência</span>
                    </div>
                    <h3 className="font-heading font-black text-2xl text-gray-900">Ofensiva</h3>
                </div>

                {/* Streak Counter */}
                <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100">
                    <Flame size={20} className={`text-orange-500 ${streak > 0 ? 'animate-pulse' : ''}`} fill={streak > 0 ? "currentColor" : "none"} />
                    <span className="font-heading font-black text-xl text-orange-600">{streak}</span>
                    <span className="text-xs font-bold text-orange-400 uppercase">Dias</span>
                </div>
            </div>

            {/* Weekly Dots */}
            <div className="flex justify-between items-center gap-2">
                {days.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 group/day">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${day.achieved
                                    ? 'bg-gradient-to-br from-nutri-500 to-nutri-600 text-white shadow-lg shadow-nutri-500/20 scale-100'
                                    : 'bg-gray-50 text-gray-300 border border-gray-100'
                                }`}
                        >
                            {day.achieved && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${day.achieved ? 'text-nutri-500' : 'text-gray-300'}`}>
                            {day.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Motivation Text */}
            <div className="mt-6 pt-6 border-t border-gray-50">
                <p className="text-xs font-medium text-gray-400 text-center">
                    {streak > 3
                        ? "🔥 Você está pegando fogo! Continue assim!"
                        : streak > 0
                            ? "🚀 Ótimo começo! Mantenha o ritmo."
                            : "🌱 Todo dia é um novo começo. Vamos lá!"}
                </p>
            </div>
        </div>
    );
};

export default ConsistencyCard;
