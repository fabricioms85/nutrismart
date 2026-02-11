import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Flame } from 'lucide-react';

interface CalorieHeroProps {
    consumed: number;
    goal: number;
    burned: number;
    macros: {
        protein: { current: number; total: number };
        carbs: { current: number; total: number };
        fats: { current: number; total: number };
    };
}

const CalorieHero: React.FC<CalorieHeroProps> = ({ consumed, goal, burned, macros }) => {
    const remaining = Math.max(0, goal - consumed + burned);
    const percentage = Math.min(100, Math.round((consumed / goal) * 100));

    // Chart Data
    const data = [
        { name: 'Consumed', value: consumed },
        { name: 'Remaining', value: remaining },
    ];

    const COLORS = ['#10B981', '#F1F5F9']; // Emerald-500 & Slate-100

    return (
        <div className="relative overflow-hidden bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 p-8 md:p-10 border border-white/50 mb-8 transition-all duration-500 hover:shadow-nutri-500/10">
            {/* Organic Background Blobs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-nutri-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 animate-blob pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 translate-y-1/3 -translate-x-1/4 animate-blob animation-delay-2000 pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left: Massive Typography */}
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                        <div className={`w-2 h-2 rounded-full ${remaining > 0 ? 'bg-nutri-500 animate-pulse' : 'bg-red-500'}`} />
                        <p className="font-heading font-bold text-gray-500 uppercase tracking-widest text-[10px]">Resumo Diário</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <h2 className="font-heading font-black text-8xl md:text-9xl text-gray-900 tracking-tighter leading-none">
                            {remaining}
                        </h2>
                        <div className="flex flex-col -mb-2">
                            <span className="font-heading font-bold text-nutri-500 text-xl tracking-tight">KCAL</span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-0.5">Restantes</span>
                        </div>
                    </div>

                    <div className="flex gap-10 mt-6 pt-6 border-t border-gray-100/50">
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Consumidas</p>
                            <div className="flex items-baseline gap-1">
                                <p className="font-heading font-bold text-2xl text-gray-900">{consumed}</p>
                                <span className="text-xs font-medium text-gray-400">kcal</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">Queimadas</p>
                            <div className="flex items-baseline gap-1">
                                <p className="font-heading font-bold text-2xl text-orange-500">-{burned}</p>
                                <span className="text-xs font-medium text-orange-300">kcal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Radial Hub */}
                <div className="relative flex flex-col items-center justify-center">
                    {/* Chart Container - min dimensions avoid Recharts warning on first paint */}
                    <div className="relative h-56 md:h-72 w-56 md:w-72 min-h-[224px] min-w-[224px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={224} minHeight={224}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="65%"
                                    outerRadius="85%"
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={40}
                                    paddingAngle={-5}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Center Stats */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-nutri-50 rounded-2xl flex items-center justify-center text-nutri-500 mb-2 shadow-sm">
                                <Flame size={20} fill="currentColor" className="opacity-80 md:w-6 md:h-6" />
                            </div>
                            <span className="font-heading font-extrabold text-4xl md:text-5xl text-gray-900">{percentage}%</span>
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Da Meta</span>
                        </div>
                    </div>

                    {/* Macro Cards - Below chart on mobile, floating on desktop */}
                    <div className="flex flex-row gap-2 mt-4 md:absolute md:top-0 md:right-0 md:flex-col md:gap-3 md:mt-0">
                        <div className="bg-white/90 backdrop-blur-md px-3 py-2 md:px-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 md:transform md:translate-x-2 md:-translate-y-2">
                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase">Proteína</p>
                            <p className="font-bold text-gray-900 text-sm md:text-base">{macros.protein.current}g <span className="text-gray-300 font-normal">/ {macros.protein.total}g</span></p>
                            <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (macros.protein.current / macros.protein.total) * 100)}%` }} />
                            </div>
                        </div>
                        <div className="bg-white/90 backdrop-blur-md px-3 py-2 md:px-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 md:transform md:translate-x-6">
                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase">Carboidratos</p>
                            <p className="font-bold text-gray-900 text-sm md:text-base">{macros.carbs.current}g <span className="text-gray-300 font-normal">/ {macros.carbs.total}g</span></p>
                            <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(100, (macros.carbs.current / macros.carbs.total) * 100)}%` }} />
                            </div>
                        </div>
                        <div className="bg-white/90 backdrop-blur-md px-3 py-2 md:px-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 md:transform md:translate-x-2 md:translate-y-2">
                            <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase">Gorduras</p>
                            <p className="font-bold text-gray-900 text-sm md:text-base">{macros.fats.current}g <span className="text-gray-300 font-normal">/ {macros.fats.total}g</span></p>
                            <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, (macros.fats.current / macros.fats.total) * 100)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalorieHero;
