import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Droplet,
  MessageCircle,
  Calendar,
  Utensils,
  ChevronRight,
  Check,
  Loader2
} from 'lucide-react';
import { DailyStats, User, Meal, Exercise, NavItem, Challenge } from '../types';
import CalorieHero from '../components/CalorieHero';
import ConsistencyCard from '../components/ConsistencyCard';
import ActionGrid from '../components/ActionGrid';
import ActivityStream from '../components/ActivityStream';
import WeeklyChallenge from '../components/WeeklyChallenge';
import MedicationTracker from '../components/MedicationTracker';
import SymptomModal from '../components/SymptomModal';
import { getWeeklyChallenge } from '../services/gamificationService';
import { logSymptom, addWeightEntry } from '../services/databaseService';

interface DashboardProps {
  user: User;
  userId: string;
  stats: DailyStats;
  updateWater: (amount: number) => void;
  recentMeals: Meal[];
  recentExercises: Exercise[];
  onNavigate: (item: NavItem) => void;
  streak: number;
  weeklyStats: { date: string; stats: DailyStats; achieved: boolean }[];
}

const Dashboard: React.FC<DashboardProps> = ({ user, userId, stats, updateWater, recentMeals, recentExercises, onNavigate, streak, weeklyStats }) => {
  const [weight, setWeight] = useState<string>('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);

  useEffect(() => {
    setChallenge(getWeeklyChallenge());
  }, []);

  const handleLogSymptom = async (symptom: string, severity: number, notes?: string) => {
    await logSymptom(userId, symptom, severity, notes);
  };

  // Save weight directly with current date/time
  const handleSaveWeight = async () => {
    const weightValue = parseFloat(weight) || user.weight;
    if (!weightValue || weightValue <= 0) return;

    setIsSavingWeight(true);
    const today = new Date().toISOString().split('T')[0];
    const success = await addWeightEntry(userId, weightValue, today);

    if (success) {
      setWeightSaved(true);
      // Show success feedback for 2 seconds
      setTimeout(() => {
        setWeightSaved(false);
        window.location.reload();
      }, 1500);
    }
    setIsSavingWeight(false);
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-24">

      {/* Header - Minimalist & Floating */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 mb-2">
            <span className="w-2 h-2 rounded-full bg-nutri-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentDate}</span>
          </div>
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl text-gray-900 tracking-tight leading-tight">
            Olá, <span className="text-nutri-500">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-400 font-medium text-lg mt-1">Sua jornada continua incrível.</p>
        </div>

        {/* Assistant Button - Floating Pill */}
        <button
          onClick={() => onNavigate(NavItem.Assistant)}
          className="flex items-center gap-3 pl-2 pr-6 py-2 bg-gray-900 text-white rounded-full hover:scale-105 hover:shadow-xl hover:shadow-gray-900/20 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-nutri-400 group-hover:rotate-12 transition-transform">
            <MessageCircle size={20} fill="currentColor" className="opacity-90" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Novo</p>
            <p className="font-bold text-sm leading-none">Nutri Assistente</p>
          </div>
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative z-10">

        {/* Left Column: Hero & Actions (8 cols) */}
        <div className="xl:col-span-8 space-y-8">

          <CalorieHero
            consumed={stats.caloriesConsumed}
            goal={user.dailyCalorieGoal}
            burned={stats.caloriesBurned}
            macros={{
              protein: { current: stats.proteinConsumed, total: user.macros.protein },
              carbs: { current: stats.carbsConsumed, total: user.macros.carbs },
              fats: { current: stats.fatsConsumed, total: user.macros.fats }
            }}
          />

          <ActionGrid onNavigate={onNavigate} />

          <ActivityStream
            recentMeals={recentMeals}
            recentExercises={recentExercises}
            onNavigate={onNavigate}
          />

        </div>

        {/* Right Column: Water, Weight & Quick Links (4 cols) */}
        <div className="xl:col-span-4 space-y-8">

          {/* New Consistency Card - Top Priority */}
          <ConsistencyCard streak={streak} weeklyStats={weeklyStats} />

          {/* Clinical Mode - Medication Tracker */}
          {user.isClinicalMode && user.clinicalSettings && (
            <MedicationTracker
              settings={user.clinicalSettings}
              onLogSymptom={() => setShowSymptomModal(true)}
            />
          )}

          {/* Weekly Challenge Card */}
          <WeeklyChallenge challenge={challenge} />

          {/* Water Tracker - The "Liquid" Card */}
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-[3rem] p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
            {/* Liquid Background Animation */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full mix-blend-overlay blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-300 opacity-20 rounded-full mix-blend-overlay blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Droplet size={14} className="fill-white" />
                    </div>
                    <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">Hidratação</span>
                  </div>
                  <h3 className="font-heading font-black text-3xl">Água</h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-heading font-black">{Math.round((stats.waterConsumed / user.dailyWaterGoal) * 100)}%</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-heading font-black text-7xl tracking-tighter">{stats.waterConsumed}</span>
                <span className="font-bold text-blue-100 text-xl">ml</span>
              </div>

              {/* Progress Bar */}
              <div className="h-6 bg-black/20 rounded-full overflow-hidden mb-8 backdrop-blur-md p-1">
                <div
                  className="h-full bg-gradient-to-r from-white to-blue-50 rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden"
                  style={{ width: `${Math.min(100, (stats.waterConsumed / user.dailyWaterGoal) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/50 w-full h-full animate-blob"></div>
                </div>
              </div>

              {/* Quick Add Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => updateWater(250)} className="bg-white/10 hover:bg-white/25 border border-white/20 backdrop-blur-md py-4 rounded-2xl text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-95 flex flex-col items-center justify-center gap-1 group/btn">
                  <Plus size={16} className="text-blue-200 group-hover/btn:text-white transition-colors" />
                  250ml
                </button>
                <button onClick={() => updateWater(500)} className="bg-white/10 hover:bg-white/25 border border-white/20 backdrop-blur-md py-4 rounded-2xl text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-95 flex flex-col items-center justify-center gap-1 group/btn">
                  <Plus size={16} className="text-blue-200 group-hover/btn:text-white transition-colors" />
                  500ml
                </button>
                <button onClick={() => updateWater(-250)} className="bg-black/10 hover:bg-black/20 border border-black/5 backdrop-blur-md py-4 rounded-2xl text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-95 flex flex-col items-center justify-center gap-1 text-blue-200 hover:text-white">
                  <Minus size={16} />
                  Remover
                </button>
              </div>
            </div>
          </div>

          {/* Weight Card - Neo Brutalism Soft */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-white/60 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Utensils size={100} />
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-nutri-50 rounded-lg">
                  <Utensils size={14} className="text-nutri-500" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Corporal</span>
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="font-heading font-black text-3xl text-gray-900 mb-6">Peso Atual</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative group/input">
                    <input
                      type="number"
                      value={weight || user.weight || ''}
                      placeholder={user.weight?.toString() || 'Digite seu peso'}
                      onChange={(e) => setWeight(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && weight) {
                          handleSaveWeight();
                        }
                      }}
                      disabled={isSavingWeight}
                      className="w-full bg-gray-50 border-2 border-transparent group-hover/input:border-gray-200 focus:border-nutri-500 rounded-2xl py-4 px-6 font-heading font-black text-3xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-nutri-500/10 transition-all placeholder:text-gray-300 disabled:opacity-50"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">kg</span>
                  </div>
                </div>
                <button
                  onClick={handleSaveWeight}
                  disabled={isSavingWeight || weightSaved}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl active:scale-95 ${weightSaved
                      ? 'bg-green-500 text-white shadow-green-500/20'
                      : 'bg-gray-900 text-white hover:bg-black hover:scale-110 hover:rotate-90 shadow-gray-900/20'
                    } disabled:opacity-70`}
                >
                  {isSavingWeight ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : weightSaved ? (
                    <Check size={24} strokeWidth={3} />
                  ) : (
                    <Plus size={24} strokeWidth={3} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <button onClick={() => onNavigate(NavItem.Recipes)} className="w-full flex items-center gap-5 p-5 bg-white border border-white/60 shadow-lg shadow-gray-200/40 rounded-[2rem] hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5 transition-all group text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                <Utensils size={24} />
              </div>
              <div className="relative z-10 flex-1">
                <h4 className="font-heading font-bold text-gray-900 text-lg">Receitas</h4>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Ideias saudáveis</p>
              </div>
              <div className="relative z-10 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                <ChevronRight size={16} />
              </div>
            </button>

            <button onClick={() => onNavigate(NavItem.Planning)} className="w-full flex items-center gap-5 p-5 bg-white border border-white/60 shadow-lg shadow-gray-200/40 rounded-[2rem] hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-0.5 transition-all group text-left relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                <Calendar size={24} />
              </div>
              <div className="relative z-10 flex-1">
                <h4 className="font-heading font-bold text-gray-900 text-lg">Planejamento</h4>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Organize a semana</p>
              </div>
              <div className="relative z-10 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                <ChevronRight size={16} />
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* Symptom Modal for Clinical Mode */}
      <SymptomModal
        isOpen={showSymptomModal}
        onClose={() => setShowSymptomModal(false)}
        onSubmit={handleLogSymptom}
      />
    </div>
  );
};

export default Dashboard;