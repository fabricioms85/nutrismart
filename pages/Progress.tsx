import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Area, AreaChart, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Plus, Calendar, Target, Flame, Activity, ChevronDown, Share2, Download, Loader2, Trophy, Zap, Flag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getWeightHistory, addWeightEntry } from '../services/weightService';
import { updateProfile } from '../services/profileService';
import { calculateStreak } from '../services/gamificationService';
import { getWeeklyStats } from '../services/statsService';
import { getMeals } from '../services/mealService';

import { generateWeeklySummaryImage, shareImage, getWeekRange, getPeriodLabel, isShareSupported } from '../services/shareService';
import WeightModal from '../components/WeightModal';
import { WeightGoal } from '../types';

interface WeightEntry {
  day: string;
  weight: number;
}

interface CalorieEntry {
  day: string;
  calories: number;
  goal: number;
}

type PeriodFilter = 7 | 14 | 30 | 90;

const Progress: React.FC = () => {
  const { authUser, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [calorieHistory, setCalorieHistory] = useState<CalorieEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>(30);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [totalMeals, setTotalMeals] = useState(0);
  const [totalWater, setTotalWater] = useState(0);
  const [totalExerciseMinutes, setTotalExerciseMinutes] = useState(0);

  const fetchData = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);

    try {
      // Fetch weight history (getWeightHistory já retorna ascending: mais antigo primeiro)
      const weightData = await getWeightHistory(authUser.id, period);

      // Formatar para o gráfico: esquerda = mais antigo, direita = mais recente
      const formattedWeight = weightData.map(entry => ({
        day: formatDate(entry.date),
        weight: Number(entry.weight),
      }));
      setWeightHistory(formattedWeight);

      // Fetch calorie history
      const weeklyData = await getWeeklyStats(authUser.id);
      const formattedCalories = weeklyData.map(entry => ({
        day: formatDate(entry.date),
        calories: entry.stats.caloriesConsumed,
        goal: profile?.dailyCalorieGoal || 2000,
      }));
      setCalorieHistory(formattedCalories);

      // Fetch streak
      const streakCount = await calculateStreak(authUser.id);
      setStreak(streakCount);

      // Fetch meal count for sharing
      const meals = await getMeals(authUser.id);
      setTotalMeals(meals.length);

      // Calculate total water and exercise from weekly stats
      const waterTotal = weeklyData.reduce((sum, d) => sum + d.stats.waterConsumed, 0);
      setTotalWater(Math.round(waterTotal / 7));
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  }, [authUser, period, profile?.dailyCalorieGoal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()] + ' ' + date.getDate();
  };

  const handleAddWeight = async (weight: number, date: string) => {
    if (!authUser) return;
    try {
      await addWeightEntry(authUser.id, weight, date);
      await updateProfile(authUser.id, { weight });
      await refreshProfile();
      await fetchData();
    } catch (err) {
      console.error('Erro ao salvar peso:', err);
    }
  };

  // Calculate stats
  const currentWeight = weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].weight
    : profile?.weight || 0;

  const startWeight = weightHistory.length > 1
    ? weightHistory[0].weight
    : currentWeight;

  const weightChange = currentWeight - startWeight;

  const avgCalories = calorieHistory.length > 0
    ? Math.round(calorieHistory.reduce((sum, d) => sum + d.calories, 0) / calorieHistory.length)
    : 0;

  const calorieGoal = profile?.dailyCalorieGoal || 2000;
  const isOnTrack = avgCalories <= calorieGoal + 100;

  // Weight Goal calculations
  const weightGoal: WeightGoal | undefined = (profile as any)?.weightGoal;

  const { progressPercent, totalChange, totalToLose, isLosingWeight, remainingKg, weeklyVelocity } = useMemo(() => {
    if (!weightGoal) {
      return { progressPercent: 0, totalChange: 0, totalToLose: 0, isLosingWeight: true, remainingKg: 0, weeklyVelocity: 0 };
    }

    const goalStart = weightGoal.startWeight;
    const goalTarget = weightGoal.targetWeight;
    const losing = goalTarget < goalStart;
    const total = Math.abs(goalStart - goalTarget);
    const changed = losing
      ? Math.max(0, goalStart - currentWeight)
      : Math.max(0, currentWeight - goalStart);
    const progress = total > 0 ? Math.min(100, Math.round((changed / total) * 100)) : 0;
    const remaining = losing
      ? Math.max(0, currentWeight - goalTarget)
      : Math.max(0, goalTarget - currentWeight);

    // Calculate weekly velocity from weight history
    let velocity = 0;
    if (weightHistory.length >= 2) {
      const recentWeight = weightHistory[weightHistory.length - 1].weight;
      const olderWeight = weightHistory[Math.max(0, weightHistory.length - 8)].weight; // ~1 week ago
      const daysSpan = Math.min(7, weightHistory.length - 1);
      velocity = daysSpan > 0 ? ((recentWeight - olderWeight) / daysSpan) * 7 : 0;
    }

    return {
      progressPercent: progress,
      totalChange: changed,
      totalToLose: total,
      isLosingWeight: losing,
      remainingKg: remaining,
      weeklyVelocity: velocity
    };
  }, [weightGoal, currentWeight, weightHistory]);

  const periodLabels: Record<PeriodFilter, string> = {
    7: '7 dias',
    14: '14 dias',
    30: '30 dias',
    90: '90 dias',
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nutri-500" />
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const showError = (msg: string) => {
      try {
        toast.error(msg);
      } catch {
        alert(msg);
      }
    };
    const showSuccess = (msg: string) => {
      try {
        toast.success(msg);
      } catch {
        alert(msg);
      }
    };

    if (!profile) {
      showError('Carregue seu perfil para compartilhar.');
      return;
    }

    setIsSharing(true);

    try {
      const summaryData = {
        userName: profile.name || 'Usuário NutriSmart',
        weekRange: getWeekRange(period),
        periodLabel: getPeriodLabel(period),
        caloriesAvg: avgCalories,
        caloriesGoal: calorieGoal,
        waterAvg: totalWater,
        waterGoal: profile.dailyWaterGoal ?? 2500,
        exerciseMinutes: totalExerciseMinutes,
        weightChange: weightChange,
        streak: streak,
        mealsLogged: totalMeals,
      };

      const blob = await generateWeeklySummaryImage(summaryData);
      const shared = await shareImage(blob);

      if (shared) {
        showSuccess('Resumo compartilhado!');
      } else {
        showSuccess('Imagem gerada! Se o download não iniciou, verifique a pasta de downloads ou permita pop-ups para este site.');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      showError('Não foi possível gerar a imagem. Tente novamente.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Seu Progresso</h1>

        <div className="flex items-center gap-3">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            disabled={isSharing}
            aria-busy={isSharing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-nutri-500 to-nutri-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-nutri-500/30 transition-all disabled:opacity-50"
          >
            {isSharing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isShareSupported() ? (
              <Share2 size={18} />
            ) : (
              <Download size={18} />
            )}
            <span className="hidden sm:inline">{isSharing ? 'Gerando...' : 'Compartilhar'}</span>
          </button>

          {/* Period Filter */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-nutri-300 transition-colors"
            >
              <Calendar size={18} className="text-gray-500" />
              <span className="font-medium">{periodLabels[period]}</span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPeriodDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                {([7, 14, 30, 90] as PeriodFilter[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setPeriod(p); setShowPeriodDropdown(false); }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${period === p ? 'text-nutri-600 font-semibold bg-nutri-50' : 'text-gray-700'
                      }`}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weight Goal Hero Section */}
      {weightGoal && weightGoal.status === 'active' && (
        <div className="mb-8 bg-gradient-to-r from-nutri-500 via-nutri-600 to-teal-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={24} className="text-yellow-300" />
              <h2 className="text-lg font-bold">Sua Meta de Peso</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Progress Circle */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="stroke-white/20"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="stroke-yellow-300"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray={`${progressPercent}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{progressPercent}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-white/80 text-sm">Progresso</p>
                  <p className="text-2xl font-bold">
                    {Math.abs(totalChange).toFixed(1)}kg
                    <span className="text-sm font-normal text-white/70"> de {Math.abs(totalToLose).toFixed(1)}kg</span>
                  </p>
                </div>
              </div>

              {/* Current vs Target */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-white/70 text-sm">Atual</p>
                  <p className="text-2xl font-bold">{currentWeight.toFixed(1)}kg</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-white/30" />
                  {isLosingWeight ? (
                    <TrendingDown size={24} className="text-green-300" />
                  ) : (
                    <TrendingUp size={24} className="text-green-300" />
                  )}
                  <div className="w-8 h-0.5 bg-white/30" />
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-sm">Meta</p>
                  <p className="text-2xl font-bold">{weightGoal.targetWeight}kg</p>
                </div>
              </div>

              {/* Projection */}
              <div className="text-center md:text-right">
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2 mb-2">
                  <Flag size={16} />
                  <span className="text-sm font-medium">Projeção</span>
                </div>
                <p className="text-xl font-bold">
                  {weightGoal.estimatedDate
                    ? new Date(weightGoal.estimatedDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Calculando...'}
                </p>
                {remainingKg > 0 && (
                  <p className="text-white/70 text-sm mt-1">
                    Faltam {remainingKg.toFixed(1)}kg para sua meta
                  </p>
                )}
              </div>
            </div>

            {/* Weekly Velocity */}
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-4 text-sm">
              <Zap size={16} className="text-yellow-300" />
              <span className="text-white/80">Velocidade atual:</span>
              <span className="font-bold">
                {weeklyVelocity > 0 ? '+' : ''}{weeklyVelocity.toFixed(2)}kg/semana
              </span>
              {Math.abs(weeklyVelocity) > 1 && (
                <span className="bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full text-xs">
                  ⚠️ Ritmo acelerado
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Current Weight Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-nutri-100 to-transparent rounded-bl-full opacity-50" />
          <p className="text-sm text-gray-500 mb-1">Peso Atual</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-gray-900">
              {currentWeight.toFixed(1)} <span className="text-sm font-normal text-gray-500">kg</span>
            </h2>
            {weightChange !== 0 && (
              <span className={`flex items-center text-sm font-medium px-2 py-0.5 rounded-full ${weightChange < 0
                ? 'text-green-600 bg-green-50'
                : 'text-orange-600 bg-orange-50'
                }`}>
                {weightChange < 0 ? <TrendingDown size={14} className="mr-1" /> : <TrendingUp size={14} className="mr-1" />}
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg
              </span>
            )}
          </div>
          <button
            onClick={() => setShowWeightModal(true)}
            className="mt-4 flex items-center gap-2 text-sm text-nutri-600 font-semibold hover:text-nutri-700 transition-colors"
          >
            <Plus size={16} /> Adicionar Registro
          </button>
        </div>

        {/* Average Calories Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100 to-transparent rounded-bl-full opacity-50" />
          <p className="text-sm text-gray-500 mb-1">Média Calórica ({periodLabels[period]})</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-gray-900">
              {avgCalories.toLocaleString()} <span className="text-sm font-normal text-gray-500">kcal</span>
            </h2>
            <span className={`flex items-center text-sm font-medium px-2 py-0.5 rounded-full ${isOnTrack ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
              }`}>
              {isOnTrack ? <TrendingUp size={14} className="mr-1" /> : <Flame size={14} className="mr-1" />}
              {isOnTrack ? 'Na meta' : 'Acima da meta'}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Meta: {calorieGoal.toLocaleString()} kcal/dia
          </p>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-br from-nutri-500 to-nutri-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full" />
          <p className="text-sm text-white/80 mb-1">Sequência de Registros</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold">
              {streak} <span className="text-sm font-normal text-white/80">dias</span>
            </h2>
            {streak >= 7 && (
              <span className="flex items-center text-sm font-medium px-2 py-0.5 rounded-full bg-white/20">
                <Activity size={14} className="mr-1" />
                {streak >= 30 ? 'Lendário!' : streak >= 14 ? 'Incrível!' : 'Em chamas!'}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-white/70">
            Continue assim! 💪
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weight Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Histórico de Peso</h3>
            <span className="text-sm text-gray-500">{periodLabels[period]}</span>
          </div>

          {weightHistory.length > 1 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightHistory}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00b37e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00b37e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v) => `${v}kg`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
                  />
                  {/* Goal reference line */}
                  {weightGoal && (
                    <ReferenceLine
                      y={weightGoal.targetWeight}
                      stroke="#f59e0b"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ value: 'Meta', fill: '#f59e0b', fontSize: 12, position: 'right' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#00b37e"
                    strokeWidth={3}
                    fill="url(#weightGradient)"
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#00b37e"
                    strokeWidth={3}
                    dot={{ fill: '#00b37e', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, stroke: '#00b37e', strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-gray-400">
              <Target size={48} className="mb-4 opacity-50" />
              <p className="text-center">
                Nenhum registro de peso ainda.<br />
                <button
                  onClick={() => setShowWeightModal(true)}
                  className="text-nutri-600 font-semibold hover:underline mt-2"
                >
                  Adicionar primeiro registro
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Calories Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Consumo Calórico</h3>
            <span className="text-sm text-gray-500">Últimos 7 dias</span>
          </div>

          {calorieHistory.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calorieHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} kcal`, 'Consumido']}
                  />
                  <Bar
                    dataKey="calories"
                    fill="#00b37e"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />
                  {/* Goal line */}
                  <ReferenceLine
                    y={calorieGoal}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={{ value: 'Meta', fill: '#f59e0b', fontSize: 12, position: 'right' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-gray-400">
              <Flame size={48} className="mb-4 opacity-50" />
              <p className="text-center">
                Nenhuma refeição registrada ainda.<br />
                Comece a registrar suas refeições!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Weight Modal */}
      <WeightModal
        isOpen={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSubmit={handleAddWeight}
        currentWeight={currentWeight}
      />
    </div>
  );
};

export default Progress;