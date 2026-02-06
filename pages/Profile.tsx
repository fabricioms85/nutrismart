import React, { useState, useEffect, useCallback } from 'react';
import { User, Save, Camera, Mail, LogOut, Calculator, Scale, Ruler, Calendar, Target, Activity, Droplets, Flame, RefreshCw, Sparkles } from 'lucide-react';
import { User as UserType } from '../types';
import {
  Gender,
  Goal,
  ActivityLevel,
  Aggressiveness,
  calculateNutritionalGoals,
  getActivityLevelLabel,
  getGoalLabel
} from '../services/nutritionCalculator';

interface ProfileProps {
  user: UserType;
  onUpdate: (user: UserType) => void;
  onSignOut?: () => void;
}

// Map display goals to internal goals
const goalDisplayToInternal: Record<string, Goal> = {
  'Perder Peso': 'perder_peso',
  'Ganhar Massa Muscular': 'ganhar_massa',
  'Manter Peso': 'manter_peso',
  'Melhorar Alimentação': 'manter_peso',
};

const goalInternalToDisplay: Record<string, string> = {
  'perder_peso': 'Perder Peso',
  'ganhar_massa': 'Ganhar Massa Muscular',
  'manter_peso': 'Manter Peso',
};

const Profile: React.FC<ProfileProps> = ({ user: initialUser, onUpdate, onSignOut }) => {
  const [formData, setFormData] = useState(initialUser);
  const [aggressiveness, setAggressiveness] = useState<Aggressiveness>('moderado');
  const [showRecalculateHint, setShowRecalculateHint] = useState(false);

  // Track if physical data changed to show recalculate hint
  const checkForChanges = useCallback(() => {
    const physicalFieldsChanged =
      formData.weight !== initialUser.weight ||
      formData.height !== initialUser.height ||
      formData.age !== initialUser.age ||
      formData.gender !== initialUser.gender ||
      formData.goal !== initialUser.goal ||
      formData.activityLevel !== initialUser.activityLevel ||
      aggressiveness !== 'moderado'; // Show hint if aggressiveness changed

    setShowRecalculateHint(physicalFieldsChanged);
  }, [formData, initialUser, aggressiveness]);

  useEffect(() => {
    checkForChanges();
  }, [formData.weight, formData.height, formData.age, formData.gender, formData.goal, formData.activityLevel, aggressiveness, checkForChanges]);

  // Recalculate nutritional goals based on current form data
  const handleRecalculate = () => {
    if (!formData.weight || !formData.height || !formData.age) {
      alert('Por favor, preencha peso, altura e idade para recalcular as metas.');
      return;
    }

    const gender: Gender = (formData.gender as Gender) || 'masculino';

    // Resolve goal: check if it's already internal code, otherwise map from display
    let goal: Goal = 'manter_peso';
    if (Object.values(goalDisplayToInternal).includes(formData.goal as Goal)) {
      goal = formData.goal as Goal;
    } else {
      goal = goalDisplayToInternal[formData.goal || 'Manter Peso'] || 'manter_peso';
    }

    const activityLevel: ActivityLevel = (formData.activityLevel as ActivityLevel) || 'moderado';

    const goals = calculateNutritionalGoals(
      { weight: formData.weight, height: formData.height, age: formData.age, gender },
      { goal, activityLevel },
      aggressiveness
    );

    setFormData(prev => ({
      ...prev,
      dailyCalorieGoal: goals.calories,
      dailyWaterGoal: goals.water,
      macros: {
        protein: goals.protein,
        carbs: goals.carbs,
        fats: goals.fats,
      }
    }));

    setShowRecalculateHint(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Meu Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="relative mb-4 group">
              <img
                src="https://picsum.photos/200/200"
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-nutri-50"
              />
              <button className="absolute bottom-0 right-0 bg-nutri-500 text-white p-2 rounded-full shadow-md hover:bg-nutri-600 transition">
                <Camera size={18} />
              </button>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{formData.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{formData.email}</p>
            <div className="w-full bg-nutri-50 rounded-lg p-3 text-sm text-nutri-700 font-medium">
              Plano Free
            </div>
          </div>

          {/* Current Stats Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-4">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Resumo Atual</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <Flame size={14} className="text-orange-500" /> Calorias
                </span>
                <span className="font-medium">{formData.dailyCalorieGoal} cal/dia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <Droplets size={14} className="text-blue-500" /> Água
                </span>
                <span className="font-medium">{formData.dailyWaterGoal} ml/dia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Proteínas</span>
                <span className="font-medium">{formData.macros.protein}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Carboidratos</span>
                <span className="font-medium">{formData.macros.carbs}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gorduras</span>
                <span className="font-medium">{formData.macros.fats}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-nutri-500" /> Dados Pessoais
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Data */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Scale size={16} className="text-nutri-500" />
                  Dados Físicos
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm"
                      min={30}
                      max={300}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Altura (cm)</label>
                    <input
                      type="number"
                      value={formData.height || ''}
                      onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm"
                      min={100}
                      max={250}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Idade</label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm"
                      min={10}
                      max={120}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gênero</label>
                    <select
                      value={formData.gender || 'masculino'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm bg-white"
                    >
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Goals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Target size={16} className="text-nutri-500" />
                    Objetivo Principal
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition bg-white"
                    value={goalInternalToDisplay[formData.goal || ''] || formData.goal || 'Manter Peso'}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  >
                    <option>Perder Peso</option>
                    <option>Ganhar Massa Muscular</option>
                    <option>Manter Peso</option>
                  </select>
                </div>

                {/* Aggressiveness - Only if not maintaining */}
                {(goalInternalToDisplay[formData.goal || ''] || formData.goal) !== 'Manter Peso' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-nutri-500" />
                      Intensidade da meta
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['conservador', 'moderado', 'agressivo'] as Aggressiveness[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setAggressiveness(level)}
                          className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${aggressiveness === level
                            ? 'border-nutri-500 bg-nutri-50 text-nutri-700 shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Activity size={16} className="text-nutri-500" />
                    Nível de Atividade
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition bg-white"
                    value={formData.activityLevel || 'moderado'}
                    onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })}
                  >
                    <option value="sedentario">{getActivityLevelLabel('sedentario')}</option>
                    <option value="leve">{getActivityLevelLabel('leve')}</option>
                    <option value="moderado">{getActivityLevelLabel('moderado')}</option>
                    <option value="intenso">{getActivityLevelLabel('intenso')}</option>
                    <option value="muito_intenso">{getActivityLevelLabel('muito_intenso')}</option>
                  </select>
                </div>
              </div>

              {/* Recalculate Hint */}
              {showRecalculateHint && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calculator size={20} className="text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Você alterou dados físicos ou objetivos. Deseja recalcular suas metas nutricionais?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRecalculate}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Recalcular
                  </button>
                </div>
              )}

              {/* Nutritional Goals */}
              <div className="bg-nutri-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Flame size={16} className="text-nutri-500" />
                    Metas Nutricionais
                  </h4>
                  <button
                    type="button"
                    onClick={handleRecalculate}
                    className="text-nutri-600 hover:text-nutri-700 text-xs font-medium flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    Recalcular
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Calorias/dia</label>
                    <input
                      type="number"
                      value={formData.dailyCalorieGoal}
                      onChange={(e) => setFormData({ ...formData, dailyCalorieGoal: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-nutri-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Água (ml)</label>
                    <input
                      type="number"
                      value={formData.dailyWaterGoal}
                      onChange={(e) => setFormData({ ...formData, dailyWaterGoal: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-nutri-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Proteínas (g)</label>
                    <input
                      type="number"
                      value={formData.macros.protein}
                      onChange={(e) => setFormData({ ...formData, macros: { ...formData.macros, protein: Number(e.target.value) } })}
                      className="w-full px-3 py-2 rounded-lg border border-nutri-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      value={formData.macros.carbs}
                      onChange={(e) => setFormData({ ...formData, macros: { ...formData.macros, carbs: Number(e.target.value) } })}
                      className="w-full px-3 py-2 rounded-lg border border-nutri-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Gorduras (g)</label>
                    <input
                      type="number"
                      value={formData.macros.fats}
                      onChange={(e) => setFormData({ ...formData, macros: { ...formData.macros, fats: Number(e.target.value) } })}
                      className="w-full px-3 py-2 rounded-lg border border-nutri-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl font-medium transition flex items-center gap-2"
                  >
                    <LogOut size={18} /> Sair da Conta
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-nutri-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-nutri-600 transition flex items-center gap-2 ml-auto"
                >
                  <Save size={18} /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;