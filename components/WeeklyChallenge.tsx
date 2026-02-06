import React from 'react';
import { Target, Droplet, Flame, Utensils, Calendar, Trophy, Loader2 } from 'lucide-react';
import { Challenge } from '../types';

interface WeeklyChallengeProps {
    challenge: Challenge | null;
    loading?: boolean;
}

const WeeklyChallenge: React.FC<WeeklyChallengeProps> = ({ challenge, loading }) => {
    if (loading) {
        return (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="animate-spin text-amber-500" size={24} />
                </div>
            </div>
        );
    }

    if (!challenge) {
        return null;
    }

    const progress = Math.round((challenge.current / challenge.target) * 100);
    const daysRemaining = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    const getIcon = () => {
        switch (challenge.type) {
            case 'water':
                return <Droplet size={24} />;
            case 'calories':
                return <Flame size={24} />;
            case 'exercise':
                return <Target size={24} />;
            case 'meals':
                return <Utensils size={24} />;
            case 'streak':
                return <Calendar size={24} />;
            default:
                return <Target size={24} />;
        }
    };

    const getGradient = () => {
        if (challenge.completed) {
            return 'from-green-500 to-emerald-600';
        }
        switch (challenge.type) {
            case 'water':
                return 'from-blue-500 to-cyan-600';
            case 'calories':
                return 'from-orange-500 to-red-600';
            case 'exercise':
                return 'from-purple-500 to-indigo-600';
            case 'meals':
                return 'from-amber-500 to-orange-600';
            case 'streak':
                return 'from-pink-500 to-rose-600';
            default:
                return 'from-gray-500 to-slate-600';
        }
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 ${challenge.completed ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100'}`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-bl-full" />

            <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getGradient()} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                            {challenge.completed ? <Trophy size={24} /> : getIcon()}
                        </div>
                        <div>
                            <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Desafio Semanal</span>
                            <h3 className="font-bold text-gray-900">{challenge.title}</h3>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${challenge.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {challenge.completed ? 'Completo! 🎉' : `${daysRemaining}d restantes`}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4">{challenge.description}</p>

                {/* Progress Bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{challenge.current} / {challenge.target}</span>
                        <span className="font-semibold text-gray-800">{progress}%</span>
                    </div>
                    <div className="h-3 bg-white/80 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Reward */}
                <div className="flex items-center justify-between pt-3 border-t border-amber-200/50">
                    <span className="text-sm text-gray-500">Recompensa</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                        <span className="text-lg">🎯</span>
                        +{challenge.xpReward} XP
                    </span>
                </div>
            </div>
        </div>
    );
};

export default WeeklyChallenge;
