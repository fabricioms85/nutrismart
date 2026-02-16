import React, { useState, useEffect, useCallback } from 'react';
import {
  Dumbbell, Clock, Flame, Save, Sparkles, Footprints, Waves, Bike, Wind, Activity, Zap,
  History, Calendar, Copy, Edit2, Trash2, Loader2, ChevronDown, X
} from 'lucide-react';
import { Exercise, User } from '../types';
import { getLocalDateString } from '../utils/dateUtils';
import { getExercisesPaginated, deleteExercise as dbDeleteExercise } from '../services/exerciseService';
import { useAuth } from '../contexts/AuthContext';

interface RegisterExerciseProps {
  user: User;
  onSave: (exercise: Omit<Exercise, 'id'>) => void;
  onUpdate?: (exercise: Exercise) => Promise<void>;
  onDelete?: (exerciseId: string) => Promise<void>;
}

// MET Values (Metabolic Equivalent of Task)
const MET_VALUES: Record<string, Record<string, number>> = {
  'Caminhada': { 'low': 2.5, 'medium': 3.5, 'high': 4.5 },
  'Corrida': { 'low': 6.0, 'medium': 8.0, 'high': 10.0 },
  'Ciclismo': { 'low': 4.0, 'medium': 6.0, 'high': 8.0 },
  'Natação': { 'low': 5.0, 'medium': 7.0, 'high': 9.0 },
  'Musculação': { 'low': 3.0, 'medium': 4.5, 'high': 6.0 },
  'Yoga': { 'low': 2.0, 'medium': 3.0, 'high': 4.0 },
  'Funcional': { 'low': 5.0, 'medium': 7.0, 'high': 9.0 },
  'Outro': { 'low': 3.0, 'medium': 5.0, 'high': 7.0 }
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  'Caminhada': Footprints,
  'Corrida': Wind,
  'Ciclismo': Bike,
  'Natação': Waves,
  'Musculação': Dumbbell,
  'Yoga': Activity,
  'Funcional': Zap,
  'Outro': Sparkles
};

// History Types
type HistoryPeriod = 'today' | 'week' | 'month' | 'all';
const HISTORY_PAGE_SIZE = 20;

const RegisterExercise: React.FC<RegisterExerciseProps> = ({ user, onSave, onUpdate, onDelete }) => {
  const { authUser } = useAuth();
  const [exerciseData, setExerciseData] = useState({
    name: '',
    duration: '',
    intensity: 'medium' as 'low' | 'medium' | 'high',
    calories: '',
    date: getLocalDateString(),
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });

  const [autoCalculated, setAutoCalculated] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // History State
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>('today');
  const [historyExercises, setHistoryExercises] = useState<Exercise[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Helper Functions ---

  function getDateRange(period: HistoryPeriod): { dateFrom?: string; dateTo?: string } {
    const today = getLocalDateString();
    if (period === 'today') return { dateFrom: today, dateTo: today };
    if (period === 'all') return {}; // No filters

    const date = new Date();
    if (period === 'week') {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
    } else if (period === 'month') {
      date.setDate(1);
    }
    return { dateFrom: getLocalDateString(date), dateTo: today };
  }

  function formatDateLabel(dateStr: string): string {
    const today = getLocalDateString();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    if (dateStr === today) return 'Hoje';
    if (dateStr === yesterdayStr) return 'Ontem';

    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // --- Effects ---

  // Auto-calculate calories
  useEffect(() => {
    if (exerciseData.name && exerciseData.duration && user.weight && !editingId) {
      const met = MET_VALUES[exerciseData.name]?.[exerciseData.intensity] || MET_VALUES['Outro'][exerciseData.intensity];
      const durationHours = parseFloat(exerciseData.duration) / 60;
      const calculated = Math.round(met * user.weight * durationHours);

      if (!isNaN(calculated) && calculated > 0) {
        setExerciseData(prev => {
          // Only update if value matches manual input or field is empty/auto-calculated
          if (!prev.calories || autoCalculated) {
            if (prev.calories !== calculated.toString()) {
              setAutoCalculated(true);
              return { ...prev, calories: calculated.toString() };
            }
          }
          return prev;
        });
      }
    }
  }, [exerciseData.name, exerciseData.duration, exerciseData.intensity, user.weight, editingId, autoCalculated]);

  // Load History (usa authUser.id para garantir o mesmo usuário da sessão/RLS)
  const loadHistory = useCallback(async (period: HistoryPeriod, offset: number = 0, append: boolean = false) => {
    if (!authUser?.id) return;

    setHistoryLoading(true);
    try {
      const range = getDateRange(period);
      const result = await getExercisesPaginated(authUser.id, {
        ...range,
        limit: HISTORY_PAGE_SIZE,
        offset
      });

      setHistoryExercises(prev => append ? [...prev, ...result.data] : result.data);
      setHistoryHasMore(result.hasMore);
      setHistoryOffset(offset + result.data.length);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [authUser?.id]);

  // Initial Load & Period Change
  useEffect(() => {
    setHistoryOffset(0);
    loadHistory(historyPeriod, 0, false);
  }, [historyPeriod, loadHistory]);


  // --- Handlers ---

  const handleLoadMore = () => {
    loadHistory(historyPeriod, historyOffset, true);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    setDeletingId(exerciseId);
    try {
      const success = await dbDeleteExercise(exerciseId);
      if (success) {
        setHistoryExercises(prev => prev.filter(e => e.id !== exerciseId));
        if (onDelete) await onDelete(exerciseId);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const loadExerciseIntoForm = (exercise: Exercise, mode: 'edit' | 'copy') => {
    // Determine intensity if possible, default to medium
    let intensity: 'low' | 'medium' | 'high' = 'medium';
    if (exercise.intensity === 'low' || exercise.intensity === 'medium' || exercise.intensity === 'high') {
      intensity = exercise.intensity;
    }

    setExerciseData({
      name: exercise.name,
      duration: exercise.durationMinutes.toString(),
      intensity: intensity,
      calories: exercise.caloriesBurned.toString(),
      date: exercise.date || getLocalDateString(),
      time: exercise.time
    });

    if (mode === 'edit') {
      setEditingId(exercise.id);
    } else {
      setEditingId(null);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectActivity = (activityName: string) => {
    setExerciseData(prev => ({ ...prev, name: activityName }));
  };

  const resetForm = () => {
    setExerciseData({
      name: '',
      duration: '',
      intensity: 'medium',
      calories: '',
      date: getLocalDateString(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
    setEditingId(null);
    setAutoCalculated(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newExercise = {
      name: exerciseData.name,
      durationMinutes: parseInt(exerciseData.duration),
      caloriesBurned: parseInt(exerciseData.calories),
      intensity: exerciseData.intensity,
      date: exerciseData.date,
      time: exerciseData.time,
    };

    if (editingId && onUpdate) {
      const updated = { ...newExercise, id: editingId } as Exercise;
      await onUpdate(updated);
      resetForm();
      loadHistory(historyPeriod, 0);
      return;
    }

    onSave(newExercise);
    resetForm();
    // Reload history after a small delay
    setTimeout(() => loadHistory(historyPeriod, 0), 500);
  };

  // Group history by date
  const groupedExercises = historyExercises.reduce((acc, exercise) => {
    const date = exercise.date || 'Desconhecido';
    if (!acc[date]) acc[date] = [];
    acc[date].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedExercises).sort((a, b) => b.localeCompare(a));


  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20">

      {/* Form Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-teal-100 p-2.5 rounded-xl text-teal-600">
            <Dumbbell size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {editingId ? 'Editar Exercício' : 'Registrar Atividade'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Activity Selection */}
          {!editingId && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Object.entries(ACTIVITY_ICONS).map(([name, Icon]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectActivity(name)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${exerciseData.name === name
                    ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-200'
                    : 'border-gray-100 hover:border-teal-300 hover:bg-gray-50 text-gray-500'
                    }`}
                >
                  <Icon size={20} className="mb-1" />
                  <span className="text-[10px] font-medium truncate w-full text-center">{name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Name & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 ">Atividade</label>
              <input
                type="text"
                required
                value={exerciseData.name}
                onChange={(e) => setExerciseData({ ...exerciseData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition text-gray-700"
                placeholder="Ex: Corrida, Yoga..."
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Intensidade</label>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setExerciseData({ ...exerciseData, intensity: level })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${exerciseData.intensity === level
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {level === 'low' ? 'Baixa' : level === 'medium' ? 'Média' : 'Alta'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Duration & Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Clock size={14} className="text-teal-500" /> Duração (min)
              </label>
              <input
                type="number"
                required
                min="1"
                value={exerciseData.duration}
                onChange={(e) => setExerciseData({ ...exerciseData, duration: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition text-gray-700 font-mono"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Flame size={14} className="text-orange-500" /> Calorias
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  value={exerciseData.calories}
                  onChange={(e) => {
                    setExerciseData({ ...exerciseData, calories: e.target.value });
                    setAutoCalculated(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl border focus:ring-4 outline-none transition text-gray-700 font-mono ${autoCalculated
                    ? 'border-teal-300 bg-teal-50 text-teal-800'
                    : 'border-gray-200 focus:border-teal-500 focus:ring-teal-100'
                    }`}
                  placeholder="0"
                />
                {autoCalculated && (
                  <div className="absolute right-3 top-3.5 text-teal-600 animate-pulse" title="Calculado automaticamente">
                    <Sparkles size={16} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
              <input
                type="date"
                required
                value={exerciseData.date}
                onChange={(e) => setExerciseData({ ...exerciseData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:border-teal-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hora</label>
              <input
                type="time"
                required
                value={exerciseData.time}
                onChange={(e) => setExerciseData({ ...exerciseData, time: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 focus:border-teal-400 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 active:scale-[0.98] transition"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className={`flex-1 py-3.5 rounded-xl text-white font-bold active:scale-[0.98] transition shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 ${editingId
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
                }`}
            >
              {editingId ? <><Edit2 size={20} /> Atualizar</> : <><Save size={20} /> Salvar Atividade</>}
            </button>
          </div>
        </form>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <History size={22} className="text-teal-500" />
            Histórico de Atividades
          </h2>
          {/* Period Filter Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {([['today', 'Hoje'], ['week', 'Semana'], ['month', 'Mês'], ['all', 'Todos']] as [HistoryPeriod, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setHistoryPeriod(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${historyPeriod === key
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {historyLoading && historyExercises.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            <span className="ml-2 text-gray-500 text-sm">Carregando histórico...</span>
          </div>
        ) : historyExercises.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <History size={28} className="text-gray-300" />
            </div>
            <p className="font-medium">Nenhuma atividade neste período</p>
            <p className="text-sm mt-1">
              {historyPeriod === 'today' ? 'Vamos nos mexer hoje?' : 'Tente um período diferente'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {sortedDates.map(date => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-500" />
                    {formatDateLabel(date)}
                  </h3>
                  <div className="h-px bg-gray-100 flex-1"></div>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {groupedExercises[date].reduce((acc, curr) => acc + curr.caloriesBurned, 0)} kcal
                  </span>
                </div>

                <div className="space-y-3">
                  {groupedExercises[date].map((exercise) => {
                    const Icon = ACTIVITY_ICONS[exercise.name] || ACTIVITY_ICONS['Outro'];
                    return (
                      <div key={exercise.id} className="group flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-teal-300 hover:bg-teal-50/30 transition-all duration-200 bg-white">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-teal-100 group-hover:scale-110 transition-all">
                            <Icon size={20} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-800 truncate text-sm">{exercise.name}</h3>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1"><Clock size={11} /> {exercise.time}</span>
                              <span className="flex items-center gap-1"><Activity size={11} /> {exercise.durationMinutes} min</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${exercise.intensity === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                                exercise.intensity === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                  'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                {exercise.intensity === 'high' ? 'Intenso' : exercise.intensity === 'medium' ? 'Médio' : 'Leve'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <span className="block font-bold text-base text-gray-900">{exercise.caloriesBurned}</span>
                            <span className="text-[10px] text-orange-400 font-medium">kcal</span>
                          </div>

                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); loadExerciseIntoForm(exercise, 'copy'); }} className="p-1.5 rounded-lg text-gray-300 hover:text-teal-600 hover:bg-white transition" title="Duplicar"><Copy size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); loadExerciseIntoForm(exercise, 'edit'); }} className="p-1.5 rounded-lg text-gray-300 hover:text-amber-600 hover:bg-white transition" title="Editar"><Edit2 size={16} /></button>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (confirm('Excluir este exercício?')) handleDeleteExercise(exercise.id); }}
                              disabled={deletingId === exercise.id}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                              title="Excluir"
                            >
                              {deletingId === exercise.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Load More */}
            {historyHasMore && (
              <button
                onClick={handleLoadMore}
                disabled={historyLoading}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50/30 font-medium text-sm transition-all flex items-center justify-center gap-2"
              >
                {historyLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Carregando...</>
                ) : (
                  <><ChevronDown size={16} /> Carregar mais atividades</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterExercise;