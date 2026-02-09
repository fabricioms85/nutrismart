import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Save, Camera, Mail, LogOut, Calculator, Scale, Ruler, Calendar, Target, Activity, Droplets, Flame, RefreshCw, Sparkles, Pill, Syringe, Settings2, Check, X, ChevronRight } from 'lucide-react';
import { User as UserType, ClinicalSettings, Meal, Symptom } from '../types';
import ClinicalSetup from '../components/ClinicalSetup';
import MedicalReportGenerator from '../components/MedicalReportGenerator';
import {
  Gender,
  Goal,
  ActivityLevel,
  Aggressiveness,
  calculateNutritionalGoalsV2,
  getActivityLevelLabel,
  getGoalLabel
} from '../services/nutritionCalculator';

interface ProfileProps {
  user: UserType;
  onUpdate: (user: UserType) => void;
  onSignOut?: () => void;
  onToggleClinicalMode?: (enabled: boolean) => Promise<void>;
  meals?: Meal[];
  symptoms?: Symptom[];
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

const Profile: React.FC<ProfileProps> = ({ user: initialUser, onUpdate, onSignOut, onToggleClinicalMode, meals = [], symptoms = [] }) => {
  const [formData, setFormData] = useState(initialUser);
  const [aggressiveness, setAggressiveness] = useState<Aggressiveness>('moderado');
  const [showRecalculateHint, setShowRecalculateHint] = useState(false);
  const [clinicalModeToggling, setClinicalModeToggling] = useState(false);
  const [isEditingClinical, setIsEditingClinical] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    // Convert to base64 for local storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, avatarUrl: base64String }));
    };
    reader.readAsDataURL(file);
  };

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
  // Uses V2 calculator with g/kg protein model and clinical mode support
  const handleRecalculate = () => {
    const weight = formData.weight || 70;
    const height = formData.height || 170;
    const age = formData.age || 25;
    const gender = (formData.gender as Gender) || 'masculino';
    const goal = goalDisplayToInternal[formData.goal || 'Manter Peso'] || 'manter_peso';
    const activityLevel = (formData.activityLevel as ActivityLevel) || 'moderado';

    // Use V2 with clinical mode and g/kg model
    const nutritionalGoals = calculateNutritionalGoalsV2(
      { weight, height, age, gender },
      { goal, activityLevel },
      aggressiveness,
      { isClinicalMode: formData.isClinicalMode }
    );

    // V2 already applies all bounds and clinical mode protein boost
    setFormData(prev => ({
      ...prev,
      dailyCalorieGoal: nutritionalGoals.calories,
      dailyWaterGoal: nutritionalGoals.waterMl,
      macros: {
        protein: nutritionalGoals.proteinGrams,
        carbs: nutritionalGoals.carbGrams,
        fats: nutritionalGoals.fatGrams,
      },
    }));

    // Show safety messages if any
    if (nutritionalGoals.safetyMessages.length > 0) {
      console.info('Safety alerts:', nutritionalGoals.safetyMessages);
    }

    setShowRecalculateHint(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Avatar & Stats */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4 group">
                <img
                  src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=16A34A&color=fff&size=200`}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover border-4 border-nutri-100 shadow-lg"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-nutri-500 text-white p-2.5 rounded-full shadow-lg hover:bg-nutri-600 transition-all hover:scale-110"
                >
                  <Camera size={16} />
                </button>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{formData.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{formData.email}</p>
              <div className="w-full bg-gradient-to-r from-nutri-50 to-teal-50 rounded-xl p-3 text-sm text-nutri-700 font-semibold border border-nutri-100">
                ✨ Plano Free
              </div>
            </div>
          </div>

          {/* Current Stats Summary */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
              <Target size={16} className="text-nutri-500" />
              Resumo Atual
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 flex items-center gap-2">
                  <Flame size={14} className="text-orange-500" /> Calorias
                </span>
                <span className="font-bold text-gray-900">{formData.dailyCalorieGoal} kcal</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500 flex items-center gap-2">
                  <Droplets size={14} className="text-blue-500" /> Água
                </span>
                <span className="font-bold text-gray-900">{formData.dailyWaterGoal} ml</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500">Proteínas</span>
                <span className="font-bold text-gray-900">{formData.macros.protein}g</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-gray-500">Carboidratos</span>
                <span className="font-bold text-gray-900">{formData.macros.carbs}g</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">Gorduras</span>
                <span className="font-bold text-gray-900">{formData.macros.fats}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Data Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User size={20} className="text-nutri-500" /> Dados Pessoais
              </h3>

              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Data */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Scale size={16} className="text-nutri-500" />
                  Dados Físicos
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Peso (kg)</label>
                    <input
                      type="number"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm font-medium"
                      min={30}
                      max={300}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Altura (cm)</label>
                    <input
                      type="number"
                      value={formData.height || ''}
                      onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm font-medium"
                      min={100}
                      max={250}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Idade</label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm font-medium"
                      min={10}
                      max={120}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Gênero</label>
                    <select
                      value={formData.gender || 'masculino'}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm font-medium bg-white"
                    >
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Goals Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Target size={20} className="text-nutri-500" /> Objetivos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Activity size={16} className="text-nutri-500" />
                    Objetivo Principal
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition bg-white font-medium"
                    value={formData.goal || 'Manter Peso'}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  >
                    <option value="Perder Peso">{getGoalLabel('perder_peso')}</option>
                    <option value="Ganhar Massa Muscular">{getGoalLabel('ganhar_massa')}</option>
                    <option value="Manter Peso">{getGoalLabel('manter_peso')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Flame size={16} className="text-nutri-500" />
                    Nível de Atividade
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition bg-white font-medium"
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
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                      <Calculator size={18} className="text-amber-600" />
                    </div>
                    <p className="text-sm text-amber-800">
                      Você alterou dados. Deseja recalcular suas metas?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRecalculate}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap"
                  >
                    <RefreshCw size={16} />
                    Recalcular
                  </button>
                </div>
              )}

              {/* Nutritional Goals */}
              <div className="bg-nutri-50/50 rounded-xl p-5 mt-5 border border-nutri-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Sparkles size={16} className="text-nutri-500" />
                    Metas Nutricionais
                  </h4>
                  <button
                    type="button"
                    onClick={handleRecalculate}
                    className="text-nutri-600 hover:text-nutri-700 text-xs font-semibold flex items-center gap-1 hover:bg-nutri-100 px-2 py-1 rounded-lg transition"
                  >
                    <RefreshCw size={12} />
                    Recalcular
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Calorias/dia</label>
                    <input
                      type="number"
                      value={formData.dailyCalorieGoal}
                      onChange={(e) => setFormData({ ...formData, dailyCalorieGoal: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-lg border border-nutri-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Água (ml)</label>
                    <input
                      type="number"
                      value={formData.dailyWaterGoal}
                      onChange={(e) => setFormData({ ...formData, dailyWaterGoal: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-lg border border-nutri-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Proteínas (g)</label>
                    <input
                      type="number"
                      value={formData.macros.protein}
                      onChange={(e) => setFormData({ ...formData, macros: { ...formData.macros, protein: Number(e.target.value) } })}
                      className="w-full px-3 py-2.5 rounded-lg border border-nutri-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Carbs (g)</label>
                    <input
                      type="number"
                      value={formData.macros.carbs}
                      onChange={(e) => setFormData({ ...formData, macros: { ...formData.macros, carbs: Number(e.target.value) } })}
                      className="w-full px-3 py-2.5 rounded-lg border border-nutri-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Gorduras (g)</label>
                    <input
                      type="number"
                      value={formData.macros.fats}
                      onChange={(e) => setFormData({ ...formData, macros: { ...formData.macros, fats: Number(e.target.value) } })}
                      className="w-full px-3 py-2.5 rounded-lg border border-nutri-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-sm font-medium bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Clinical Mode Card */}
            <div className={`rounded-2xl overflow-hidden shadow-sm border transition-all ${formData.isClinicalMode ? 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200' : 'bg-white border-gray-100'}`}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${formData.isClinicalMode ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <Syringe size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Modo Clínico</h3>
                      <p className="text-sm text-gray-500">
                        {formData.isClinicalMode
                          ? `Ativo: ${formData.clinicalSettings?.medication || 'Configure abaixo'}`
                          : 'Acompanhamento para medicamentos GLP-1'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={clinicalModeToggling || !onToggleClinicalMode}
                    onClick={async () => {
                      if (!onToggleClinicalMode) return;
                      setClinicalModeToggling(true);
                      try {
                        await onToggleClinicalMode(!formData.isClinicalMode);
                        setFormData(prev => ({ ...prev, isClinicalMode: !prev.isClinicalMode }));
                      } finally {
                        setClinicalModeToggling(false);
                      }
                    }}
                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 ${formData.isClinicalMode ? 'bg-teal-500' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${formData.isClinicalMode ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Clinical Data Display or Edit Mode */}
                {formData.isClinicalMode && (
                  <div className="mt-5 pt-5 border-t border-teal-200/50">
                    {isEditingClinical ? (
                      <div className="animate-fade-in">
                        <ClinicalSetup
                          isEditing={true}
                          initialSettings={formData.clinicalSettings}
                          onComplete={(settings) => {
                            if (settings) {
                              setFormData(prev => ({ ...prev, clinicalSettings: settings }));
                            }
                          }}
                        />
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            onClick={() => setIsEditingClinical(false)}
                            className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-sm"
                          >
                            <Check size={16} /> Salvar Tratamento
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {formData.clinicalSettings ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-white/60 rounded-xl p-3">
                              <span className="text-xs text-teal-600 font-medium block mb-1">Medicamento</span>
                              <p className="font-bold text-gray-900 text-sm">{formData.clinicalSettings.medication}</p>
                            </div>
                            <div className="bg-white/60 rounded-xl p-3">
                              <span className="text-xs text-teal-600 font-medium block mb-1">Dosagem</span>
                              <p className="font-bold text-gray-900 text-sm">{formData.clinicalSettings.dosage}</p>
                            </div>
                            <div className="bg-white/60 rounded-xl p-3">
                              <span className="text-xs text-teal-600 font-medium block mb-1">Frequência</span>
                              <p className="font-bold text-gray-900 text-sm">
                                {formData.clinicalSettings.intervalDays === 7
                                  ? 'Semanal'
                                  : formData.clinicalSettings.intervalDays === 1
                                    ? 'Diária'
                                    : `A cada ${formData.clinicalSettings.intervalDays} dias`}
                              </p>
                            </div>
                            <div className="bg-white/60 rounded-xl p-3">
                              <span className="text-xs text-teal-600 font-medium block mb-1">Próxima / Dia</span>
                              <p className="font-bold text-gray-900 text-sm">
                                {formData.clinicalSettings.intervalDays === 7 && formData.clinicalSettings.injectionDay !== undefined
                                  ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][formData.clinicalSettings.injectionDay]
                                  : 'Automático'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/60 rounded-xl p-4 text-center mb-4">
                            <p className="text-gray-500 text-sm">Nenhum tratamento configurado ainda.</p>
                          </div>
                        )}

                        {/* Edit Button - More Visible */}
                        <button
                          type="button"
                          onClick={() => setIsEditingClinical(true)}
                          className="w-full bg-white hover:bg-teal-50 border border-teal-200 text-teal-700 px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <Settings2 size={18} />
                          {formData.clinicalSettings ? 'Editar Tratamento' : 'Configurar Tratamento'}
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Medical Report Generator - Inside form, same column */}
            <MedicalReportGenerator
              user={formData}
              meals={meals}
              symptoms={symptoms}
            />

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-nutri-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-nutri-600 transition flex items-center gap-2 shadow-lg shadow-nutri-500/20"
              >
                <Save size={18} /> Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sign Out - Full width, clearly visible at the bottom */}
      {onSignOut && (
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Deseja encerrar sua sessão?</p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="text-red-500 hover:text-white hover:bg-red-500 px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 border border-red-200"
            >
              <LogOut size={18} /> Sair da Conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;