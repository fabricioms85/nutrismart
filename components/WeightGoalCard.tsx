import { useMemo } from 'react';
import { Target, TrendingDown, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { WeightGoal, WeightEntry } from '../types';
import { calculateWeightProgress } from '../services/PlateauDetectionService';

interface WeightGoalCardProps {
    weightGoal: WeightGoal;
    currentWeight: number;
    weightHistory?: WeightEntry[];
    compact?: boolean;
}

export default function WeightGoalCard({
    weightGoal,
    currentWeight,
    weightHistory = [],
    compact = false
}: WeightGoalCardProps) {
    const { startWeight, targetWeight, estimatedDate, weeklyGoal, status } = weightGoal;

    const progress = useMemo(() =>
        calculateWeightProgress(startWeight, currentWeight, targetWeight),
        [startWeight, currentWeight, targetWeight]
    );

    const weightRemaining = Math.abs(currentWeight - targetWeight);
    const weightLost = Math.abs(startWeight - currentWeight);
    const isLosing = startWeight > targetWeight;

    // Calculate trend from last 7 days
    const trend = useMemo(() => {
        if (weightHistory.length < 2) return 0;

        const sortedEntries = [...weightHistory]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const recent = sortedEntries.slice(0, 7);
        if (recent.length < 2) return 0;

        const weekChange = recent[0].weight - recent[recent.length - 1].weight;
        return Math.round(weekChange * 10) / 10;
    }, [weightHistory]);

    // Format estimated date
    const formattedDate = useMemo(() => {
        if (!estimatedDate) return null;
        const date = new Date(estimatedDate);
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long'
        });
    }, [estimatedDate]);

    // Determine status color
    const statusColor = useMemo(() => {
        if (status === 'achieved') return 'text-emerald-400';
        if (progress >= 75) return 'text-emerald-400';
        if (progress >= 50) return 'text-blue-400';
        if (progress >= 25) return 'text-amber-400';
        return 'text-gray-400';
    }, [status, progress]);

    if (compact) {
        return (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary-400" />
                        <span className="font-medium text-white">Meta: {targetWeight}kg</span>
                    </div>
                    <span className={`text-sm font-bold ${statusColor}`}>{progress}%</span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>{weightRemaining.toFixed(1)}kg restantes</span>
                    {trend !== 0 && (
                        <span className={trend < 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {trend > 0 ? '+' : ''}{trend}kg /sem
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                        <Target className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Sua Meta</h3>
                        <p className="text-sm text-gray-400">
                            {startWeight}kg → {targetWeight}kg
                        </p>
                    </div>
                </div>

                {status === 'achieved' && (
                    <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full">
                        <Trophy className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">Alcançada!</span>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-white">{progress}%</span>
                    <span className="text-sm text-gray-400">concluído</span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 h-3 rounded-full transition-all duration-700 ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                {/* Current Weight */}
                <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Atual</p>
                    <p className="text-xl font-bold text-white">{currentWeight}kg</p>
                </div>

                {/* Weight Lost/Gained */}
                <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">
                        {isLosing ? 'Perdido' : 'Ganho'}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                        {isLosing ? (
                            <TrendingDown className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                        )}
                        <span className={`text-xl font-bold ${isLosing ? 'text-emerald-400' : 'text-blue-400'}`}>
                            {weightLost.toFixed(1)}kg
                        </span>
                    </div>
                </div>

                {/* Remaining */}
                <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Restante</p>
                    <p className="text-xl font-bold text-amber-400">{weightRemaining.toFixed(1)}kg</p>
                </div>
            </div>

            {/* Weekly Rate & Estimated Date */}
            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${trend !== 0
                            ? (isLosing
                                ? (trend < 0 ? 'bg-emerald-400' : 'bg-red-400')
                                : (trend > 0 ? 'bg-emerald-400' : 'bg-red-400'))
                            : 'bg-gray-400'
                        }`} />
                    <span className="text-sm text-gray-300">
                        {trend !== 0
                            ? `${trend > 0 ? '+' : ''}${trend}kg esta semana`
                            : 'Registre peso para ver tendência'}
                    </span>
                </div>

                {formattedDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Projeção: {formattedDate}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
