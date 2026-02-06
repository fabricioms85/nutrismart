import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Star, Flame, Droplet, Calendar, ChefHat, Crown, Gem, Sparkles, Target, Waves, Dumbbell, Utensils, Scale, Zap } from 'lucide-react';
import { Badge, UserProgress } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  BADGE_DEFINITIONS,
  ACHIEVEMENT_DEFINITIONS,
  getUserProgress,
  getUserProgressAsync,
  getUserBadgesAsync,
  getLevelProgress,
  getWeeklyChallenge,
} from '../services/gamificationService';
import WeeklyChallenge from '../components/WeeklyChallenge';

interface AwardsProps {
  unlockedIds?: string[];
}

const Awards: React.FC<AwardsProps> = ({ unlockedIds = [] }) => {
  const { authUser } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [challenge, setChallenge] = useState(getWeeklyChallenge());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Load from localStorage first for instant display
      setProgress(getUserProgress());

      // Then sync with Supabase
      if (authUser?.id) {
        try {
          const [dbProgress, dbBadges] = await Promise.all([
            getUserProgressAsync(authUser.id),
            getUserBadgesAsync(authUser.id),
          ]);
          setProgress({ ...dbProgress, badges: dbBadges });
        } catch (error) {
          console.warn('Failed to sync with Supabase:', error);
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, [authUser?.id]);

  const getIcon = (name: string, unlocked: boolean, rarity?: string) => {
    const colorClass = unlocked
      ? rarity === 'lendario' ? 'text-amber-500'
        : rarity === 'epico' ? 'text-purple-500'
          : rarity === 'raro' ? 'text-blue-500'
            : 'text-green-500'
      : 'text-gray-300';

    const props = { size: 28, className: colorClass };

    switch (name) {
      case 'Star': return <Star {...props} fill={unlocked ? 'currentColor' : 'none'} />;
      case 'Droplet': return <Droplet {...props} fill={unlocked ? 'currentColor' : 'none'} />;
      case 'Flame': return <Flame {...props} fill={unlocked ? 'currentColor' : 'none'} />;
      case 'Calendar': return <Calendar {...props} />;
      case 'Trophy': return <Trophy {...props} fill={unlocked ? 'currentColor' : 'none'} />;
      case 'ChefHat': return <ChefHat {...props} />;
      case 'Crown': return <Crown {...props} fill={unlocked ? 'currentColor' : 'none'} />;
      case 'Gem': return <Gem {...props} fill={unlocked ? 'currentColor' : 'none'} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Target': return <Target {...props} />;
      case 'Waves': return <Waves {...props} />;
      case 'Dumbbell': return <Dumbbell {...props} />;
      case 'Utensils': return <Utensils {...props} />;
      case 'Scale': return <Scale {...props} />;
      case 'Zap': return <Zap {...props} fill={unlocked ? 'currentColor' : 'none'} />;
      case 'Medal': return <Medal {...props} fill={unlocked ? 'currentColor' : 'none'} />;
      case 'Award': return <Award {...props} fill={unlocked ? 'currentColor' : 'none'} />;
      default: return <Award {...props} />;
    }
  };

  const getRarityStyles = (rarity: string, unlocked: boolean) => {
    if (!unlocked) return 'bg-gray-100 border-gray-200';

    switch (rarity) {
      case 'lendario':
        return 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-300 shadow-amber-100';
      case 'epico':
        return 'bg-gradient-to-br from-purple-50 to-indigo-100 border-purple-300 shadow-purple-100';
      case 'raro':
        return 'bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-300 shadow-blue-100';
      default:
        return 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300 shadow-green-100';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'lendario': return { label: 'Lendário', color: 'bg-amber-500' };
      case 'epico': return { label: 'Épico', color: 'bg-purple-500' };
      case 'raro': return { label: 'Raro', color: 'bg-blue-500' };
      default: return { label: 'Comum', color: 'bg-green-500' };
    }
  };

  // Get all badges with earned status
  const allBadges = BADGE_DEFINITIONS.map(def => {
    const earned = progress?.badges.find(b => b.id === def.id);
    return {
      ...def,
      earned: !!earned,
      earnedAt: earned?.earnedAt,
    };
  });

  // Group badges by rarity
  const badgesByRarity = {
    lendario: allBadges.filter(b => b.rarity === 'lendario'),
    epico: allBadges.filter(b => b.rarity === 'epico'),
    raro: allBadges.filter(b => b.rarity === 'raro'),
    comum: allBadges.filter(b => b.rarity === 'comum'),
  };

  const earnedCount = allBadges.filter(b => b.earned).length;
  const levelProgress = progress ? getLevelProgress(progress.xp) : { current: 0, required: 100, percentage: 0 };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header with XP & Level */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-nutri-500 to-nutri-600 rounded-2xl p-6 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Level Display */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold">{progress?.level || 1}</span>
                  <p className="text-xs text-white/80">Nível</p>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Suas Conquistas</h1>
                <p className="text-white/80 text-sm">
                  {earnedCount} de {allBadges.length} medalhas conquistadas
                </p>
              </div>
            </div>

            {/* XP Progress */}
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/80">XP Total: {progress?.xp || 0}</span>
                <span className="font-semibold">Próximo nível</span>
              </div>
              <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-1000"
                  style={{ width: `${levelProgress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-white/60 mt-1 text-right">
                {levelProgress.current} / {levelProgress.required} XP
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="relative grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">{progress?.streak || 0}</p>
              <p className="text-xs text-white/70">Dias de Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{earnedCount}</p>
              <p className="text-xs text-white/70">Medalhas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{progress?.level || 1}</p>
              <p className="text-xs text-white/70">Nível</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Challenge */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Desafio da Semana</h2>
        <WeeklyChallenge challenge={challenge} />
      </div>

      {/* Badges by Rarity */}
      {(['lendario', 'epico', 'raro', 'comum'] as const).map(rarity => {
        const badges = badgesByRarity[rarity];
        const rarityInfo = getRarityLabel(rarity);

        return (
          <div key={rarity} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-3 h-3 rounded-full ${rarityInfo.color}`} />
              <h2 className="text-lg font-bold text-gray-800">{rarityInfo.label}</h2>
              <span className="text-sm text-gray-400">
                ({badges.filter(b => b.earned).length}/{badges.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${badge.earned
                    ? `${getRarityStyles(badge.rarity, true)} shadow-md hover:shadow-lg transform hover:-translate-y-1`
                    : 'bg-gray-50 border-gray-200 opacity-60 grayscale hover:grayscale-0 hover:opacity-80'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${badge.earned ? 'bg-white/60 shadow-inner' : 'bg-gray-200'
                      }`}>
                      {getIcon(badge.iconName, badge.earned, badge.rarity)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm ${badge.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                        {badge.name}
                      </h3>
                      <p className="text-xs text-gray-500 leading-tight mt-0.5">
                        {badge.description}
                      </p>
                      {!badge.earned && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          {badge.condition}
                        </p>
                      )}
                      {badge.earned && badge.earnedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(badge.earnedAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    {badge.earned && (
                      <div className="absolute top-2 right-2">
                        <div className={`w-5 h-5 rounded-full ${rarityInfo.color} flex items-center justify-center`}>
                          <Star size={12} className="text-white" fill="white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Awards;