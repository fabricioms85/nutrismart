import React from 'react';
import { Camera, Dumbbell, ArrowRight } from 'lucide-react';
import { NavItem } from '../types';

interface ActionGridProps {
    onNavigate: (item: NavItem) => void;
}

const ActionGrid: React.FC<ActionGridProps> = ({ onNavigate }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Meal Action - Nutri Green Gradient */}
            <button
                onClick={() => onNavigate(NavItem.RegisterMeal)}
                className="group relative overflow-hidden rounded-[2.5rem] p-8 h-56 bg-white border border-gray-100 shadow-xl shadow-nutri-500/5 hover:shadow-2xl hover:shadow-nutri-500/20 hover:-translate-y-1 transition-all duration-500 text-left flex flex-col justify-between"
            >
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-nutri-100 to-transparent rounded-full opacity-50 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex justify-between items-start w-full">
                    <div className="w-16 h-16 bg-nutri-50 text-nutri-600 rounded-3xl flex items-center justify-center group-hover:bg-nutri-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:shadow-nutri-500/30">
                        <Camera size={32} strokeWidth={2} />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-nutri-500 group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0">
                        <ArrowRight size={20} />
                    </div>
                </div>

                <div className="relative z-10">
                    <h3 className="font-heading font-extrabold text-3xl text-gray-900 group-hover:text-nutri-600 transition-colors tracking-tight">
                        Nova Refeição
                    </h3>
                    <p className="text-gray-400 font-medium text-sm mt-2 group-hover:text-gray-500/80 transition-colors">
                        Registre calorias e nutrientes
                    </p>
                </div>
            </button>

            {/* Exercise Action - Solar Orange Gradient */}
            <button
                onClick={() => onNavigate(NavItem.RegisterExercise)}
                className="group relative overflow-hidden rounded-[2.5rem] p-8 h-56 bg-white border border-gray-100 shadow-xl shadow-solar-500/5 hover:shadow-2xl hover:shadow-solar-500/20 hover:-translate-y-1 transition-all duration-500 text-left flex flex-col justify-between"
            >
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-solar-100 to-transparent rounded-full opacity-50 blur-2xl group-hover:scale-125 transition-transform duration-700 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex justify-between items-start w-full">
                    <div className="w-16 h-16 bg-orange-50 text-solar-500 rounded-3xl flex items-center justify-center group-hover:bg-solar-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:shadow-solar-500/30">
                        <Dumbbell size={32} strokeWidth={2} />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-solar-500 group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0">
                        <ArrowRight size={20} />
                    </div>
                </div>

                <div className="relative z-10">
                    <h3 className="font-heading font-extrabold text-3xl text-gray-900 group-hover:text-solar-500 transition-colors tracking-tight">
                        Novo Treino
                    </h3>
                    <p className="text-gray-400 font-medium text-sm mt-2 group-hover:text-gray-500/80 transition-colors">
                        Registre atividades físicas
                    </p>
                </div>
            </button>
        </div>
    );
};

export default ActionGrid;
