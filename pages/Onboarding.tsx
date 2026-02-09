import React, { useState, useEffect, useMemo } from 'react';
import {
    Scale,
    Ruler,
    Calendar,
    User,
    Target,
    Activity,
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    Sparkles,
    Droplet,
    Flame,
    Heart,
    Pill,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import ClinicalSetup from '../components/ClinicalSetup';
import { ClinicalSettings, WeightGoal, WeightEntry } from '../types';
import {
    Gender,
    Goal,
    ActivityLevel,
    Aggressiveness,
    calculateNutritionalGoalsV2,
    getActivityLevelLabel,
    getGoalLabel
} from '../services/nutritionCalculator';
import { estimateTargetDate, generateMilestones } from '../services/PlateauDetectionService';

interface OnboardingProps {
    userName: string;
    onComplete: (data: OnboardingData) => Promise<void>;
}

export interface OnboardingData {
    weight: number;
    height: number;
    age: number;
    gender: Gender;
    goal: Goal;
    activityLevel: ActivityLevel;
    dailyCalorieGoal: number;
    dailyWaterGoal: number;
    macros: {
        protein: number;
        carbs: number;
        fats: number;
    };
    // Clinical mode fields (optional)
    isClinicalMode?: boolean;
    clinicalSettings?: ClinicalSettings;
    // Weight goal fields (optional)
    weightGoal?: WeightGoal;
    weightHistory?: WeightEntry[];
}

const Onboarding: React.FC<OnboardingProps> = ({ userName, onComplete }) => {
    const [step, setStep] = useState(0); // Start at step 0 (objective selection)
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Clinical mode state
    const [isClinicalMode, setIsClinicalMode] = useState(false);
    const [clinicalSettings, setClinicalSettings] = useState<ClinicalSettings | undefined>(undefined);

    // Step 1 - Basic Info
    const [weight, setWeight] = useState<number>(70);
    const [height, setHeight] = useState<number>(170);
    const [age, setAge] = useState<number>(30);
    const [gender, setGender] = useState<Gender>('masculino');

    // Step 2 - Goals
    const [goal, setGoal] = useState<Goal>('manter_peso');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderado');
    const [aggressiveness, setAggressiveness] = useState<Aggressiveness>('moderado');

    // Step 2.5 - Weight Goal
    const [targetWeight, setTargetWeight] = useState<number>(0);
    const [weeklyGoal, setWeeklyGoal] = useState<number>(0.5);

    // Step 3 - Calculated Goals (adjustable)
    const [calories, setCalories] = useState<number>(2000);
    const [protein, setProtein] = useState<number>(150);
    const [carbs, setCarbs] = useState<number>(250);
    const [fats, setFats] = useState<number>(65);
    const [water, setWater] = useState<number>(2500);

    // Recalculate goals when entering step 3 (calculation step)
    useEffect(() => {
        if (step === 3 && weight > 0 && height > 0 && age > 0) {
            const goals = calculateNutritionalGoalsV2(
                { weight, height, age, gender },
                { goal, activityLevel },
                aggressiveness,
                { isClinicalMode }
            );
            // V2 already applies bounds and clinical mode protein boost
            setCalories(goals.calories);
            setProtein(goals.proteinGrams);
            setCarbs(goals.carbGrams);
            setFats(goals.fatGrams);
            setWater(goals.waterMl);
        }
    }, [step, isClinicalMode, weight, height, age, gender, goal, activityLevel, aggressiveness]);


    // Total steps depends on clinical mode and goal type
    // Step 0 = Objective, Step 1 = Basic Info, Step 2 = Goals
    // Step 3 = Weight Target (only if goal !== 'manter_peso')
    // Step 4 = Nutritional Plan, Step 5 = Clinical Setup (only if isClinicalMode)
    const hasWeightGoal = goal !== 'manter_peso';
    const totalSteps = (isClinicalMode ? 6 : 5) - (hasWeightGoal ? 0 : 1);
    const finalStep = totalSteps - 1;

    // Calculate estimated date for weight goal
    const estimatedDate = useMemo(() => {
        if (!hasWeightGoal || targetWeight <= 0 || weight <= 0) return null;
        return estimateTargetDate(weight, targetWeight, weeklyGoal);
    }, [hasWeightGoal, weight, targetWeight, weeklyGoal]);

    // Initialize target weight when entering weight goal step
    useEffect(() => {
        if (targetWeight === 0 && weight > 0) {
            // Set reasonable default based on goal
            if (goal === 'perder_peso') {
                setTargetWeight(Math.round(weight * 0.9)); // 10% less
            } else if (goal === 'ganhar_massa') {
                setTargetWeight(Math.round(weight * 1.05)); // 5% more
            }
        }
    }, [goal, weight, targetWeight]);

    const handleNext = () => {
        if (step < finalStep) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            // Build weight goal if applicable
            let weightGoalData: WeightGoal | undefined;
            if (hasWeightGoal && targetWeight > 0) {
                const milestones = generateMilestones(weight, targetWeight).map((m, idx) => ({
                    id: `milestone-${idx}`,
                    targetWeight: m.weight,
                    title: m.title,
                    xpReward: m.xpReward
                }));

                weightGoalData = {
                    startWeight: weight,
                    targetWeight,
                    startDate: new Date().toISOString(),
                    estimatedDate: estimatedDate?.toISOString(),
                    weeklyGoal: goal === 'perder_peso' ? -weeklyGoal : weeklyGoal,
                    milestones,
                    status: 'active'
                };
            }

            await onComplete({
                weight,
                height,
                age,
                gender,
                goal,
                activityLevel,
                dailyCalorieGoal: calories,
                dailyWaterGoal: water,
                macros: { protein, carbs, fats },
                isClinicalMode,
                clinicalSettings,
                weightGoal: weightGoalData,
                weightHistory: weight > 0 ? [{ date: new Date().toISOString().split('T')[0], weight, source: 'manual' as const }] : []
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStep1Valid = weight > 0 && height > 0 && age > 0;
    const isStep2Valid = goal && activityLevel;
    const isClinicalStepValid = !isClinicalMode || (isClinicalMode && clinicalSettings);

    // Progress indicator component - shows steps 1-3 (or 1-4 for clinical)
    // Step 0 is the objective selection and doesn't show in indicator
    const visibleSteps = isClinicalMode ? [1, 2, 3, 4] : [1, 2, 3];
    const StepIndicator = () => {
        // Don't show indicator on step 0
        if (step === 0) return null;

        return (
            <div className="flex items-center justify-center gap-3 mb-10">
                {visibleSteps.map((s, idx) => (
                    <div key={s} className="flex items-center">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-heading font-bold text-lg transition-all duration-500 ${s < step
                                ? 'bg-nutri-500 text-white shadow-lg shadow-nutri-500/30'
                                : s === step
                                    ? isClinicalMode && step === 4
                                        ? 'bg-teal-600 text-white shadow-xl scale-110'
                                        : 'bg-gray-900 text-white shadow-xl scale-110'
                                    : 'bg-white border border-gray-100 text-gray-300'
                                }`}
                        >
                            {s < step ? <CheckCircle size={24} /> : idx + 1}
                        </div>
                        {idx < visibleSteps.length - 1 && (
                            <div className={`w-12 h-1 mx-3 rounded-full transition-all duration-500 ${s < step ? 'bg-nutri-500' : 'bg-gray-100'}`} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-nutri-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />

            <div className="w-full max-w-2xl relative z-10">

                {/* Header Text */}
                <div className="text-center mb-8">
                    <h1 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-2">
                        Configuração Inicial
                    </h1>
                    <p className="text-gray-500">
                        Olá, <span className="font-semibold text-nutri-600">{userName}</span>! Vamos personalizar sua experiência.
                    </p>
                </div>

                <StepIndicator />

                {/* Main Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-white/50 backdrop-blur-sm overflow-hidden p-8 md:p-10 transition-all duration-500">

                    {/* Step 0 - Objective Selection */}
                    {step === 0 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="font-heading font-bold text-2xl text-gray-900">Qual é o seu objetivo?</h2>
                                <p className="text-sm text-gray-400 mt-2">Escolha o que melhor descreve sua jornada</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Lifestyle Option */}
                                <button
                                    onClick={() => {
                                        setIsClinicalMode(false);
                                        setClinicalSettings(undefined);
                                        handleNext();
                                    }}
                                    className={`group p-6 rounded-3xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${!isClinicalMode
                                        ? 'border-nutri-500 bg-nutri-50'
                                        : 'border-gray-100 bg-gray-50 hover:border-nutri-300'
                                        }`}
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-nutri-400 to-nutri-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-nutri-500/30">
                                        <Heart size={28} className="text-white" />
                                    </div>
                                    <h3 className="font-heading font-bold text-lg text-gray-900 mb-2">
                                        Estilo de Vida Saudável
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Quero perder peso, ganhar massa ou manter minha saúde através de reeducação alimentar e exercícios.
                                    </p>
                                </button>

                                {/* Clinical Treatment Option */}
                                <button
                                    onClick={() => {
                                        setIsClinicalMode(true);
                                        handleNext();
                                    }}
                                    className={`group p-6 rounded-3xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${isClinicalMode
                                        ? 'border-teal-500 bg-teal-50'
                                        : 'border-gray-100 bg-gray-50 hover:border-teal-300'
                                        }`}
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
                                        <Pill size={28} className="text-white" />
                                    </div>
                                    <h3 className="font-heading font-bold text-lg text-gray-900 mb-2">
                                        Acompanhamento Clínico
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Estou em tratamento médico (ex: Mounjaro, Ozempic, Wegovy) e preciso de recomendações personalizadas.
                                    </p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 1 - Basic Info */}
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center mb-8">
                                <h2 className="font-heading font-bold text-2xl text-gray-900">Suas Medidas</h2>
                                <p className="text-sm text-gray-400">Para calcularmos seu metabolismo basal</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Weight */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                                        <Scale size={18} className="text-nutri-500" />
                                        Peso (kg)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={weight}
                                            onChange={(e) => setWeight(Number(e.target.value))}
                                            className="w-full h-16 pl-6 pr-4 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-nutri-500 focus:bg-white focus:ring-0 outline-none transition-all font-heading font-bold text-xl text-gray-900 text-center"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Height */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                                        <Ruler size={18} className="text-nutri-500" />
                                        Altura (cm)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={height}
                                            onChange={(e) => setHeight(Number(e.target.value))}
                                            className="w-full h-16 pl-6 pr-4 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-nutri-500 focus:bg-white focus:ring-0 outline-none transition-all font-heading font-bold text-xl text-gray-900 text-center"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Age */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                                        <Calendar size={18} className="text-nutri-500" />
                                        Idade
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={age}
                                            onChange={(e) => setAge(Number(e.target.value))}
                                            className="w-full h-16 pl-6 pr-4 rounded-3xl bg-gray-50 border-2 border-transparent focus:border-nutri-500 focus:bg-white focus:ring-0 outline-none transition-all font-heading font-bold text-xl text-gray-900 text-center"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Gender */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                                        <User size={18} className="text-nutri-500" />
                                        Gênero
                                    </label>
                                    <div className="flex gap-2 p-1 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                                        {(['masculino', 'feminino'] as Gender[]).map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setGender(g)}
                                                className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${gender === g
                                                    ? 'bg-white text-nutri-600 shadow-sm border border-gray-100'
                                                    : 'text-gray-400 hover:text-gray-600'
                                                    }`}
                                            >
                                                {g === 'masculino' ? 'Masculino' : 'Feminino'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2 - Goals */}
                    {step === 2 && (
                        <div className="space-y-8 animate-slide-in-right">
                            <div className="text-center mb-8">
                                <h2 className="font-heading font-bold text-2xl text-gray-900">Seus Objetivos</h2>
                                <p className="text-sm text-gray-400">Onde você quer chegar?</p>
                            </div>

                            <div className="space-y-6">
                                {/* Goal */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                                        <Target size={18} className="text-nutri-500" />
                                        Meta Principal
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {(['perder_peso', 'manter_peso', 'ganhar_massa'] as Goal[]).map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setGoal(g)}
                                                className={`p-4 rounded-3xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-2 ${goal === g
                                                    ? 'border-nutri-500 bg-nutri-50 text-nutri-700'
                                                    : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                {g === 'perder_peso' && <Scale className="mb-1" />}
                                                {g === 'manter_peso' && <Activity className="mb-1" />}
                                                {g === 'ganhar_massa' && <Flame className="mb-1" />}
                                                {getGoalLabel(g)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Intensity */}
                                {goal !== 'manter_peso' && (
                                    <div className="animate-fade-in">
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                                            <Sparkles size={18} className="text-nutri-500" />
                                            Ritmo
                                        </label>
                                        <div className="bg-gray-50 p-1.5 rounded-[1.5rem] flex">
                                            {(['conservador', 'moderado', 'agressivo'] as Aggressiveness[]).map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setAggressiveness(level)}
                                                    className={`flex-1 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${aggressiveness === level
                                                        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                                                        : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                >
                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Activity Level */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                                        <Activity size={18} className="text-nutri-500" />
                                        Atividade Física
                                    </label>
                                    <select
                                        value={activityLevel}
                                        onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                                        className="w-full px-6 py-4 rounded-3xl border-2 border-gray-100 bg-white font-medium text-gray-700 focus:border-nutri-500 focus:ring-0 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="sedentario">{getActivityLevelLabel('sedentario')}</option>
                                        <option value="leve">{getActivityLevelLabel('leve')}</option>
                                        <option value="moderado">{getActivityLevelLabel('moderado')}</option>
                                        <option value="intenso">{getActivityLevelLabel('intenso')}</option>
                                        <option value="muito_intenso">{getActivityLevelLabel('muito_intenso')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3 - Weight Goal (only if goal !== 'manter_peso') */}
                    {step === 3 && hasWeightGoal && (
                        <div className="space-y-8 animate-slide-in-right">
                            <div className="text-center mb-6">
                                <h2 className="font-heading font-bold text-2xl text-gray-900">
                                    {goal === 'perder_peso' ? 'Sua Meta de Peso' : 'Seu Peso Alvo'}
                                </h2>
                                <p className="text-sm text-gray-400 mt-2">
                                    Defina onde você quer chegar e em que ritmo
                                </p>
                            </div>

                            {/* Weight Visualization */}
                            <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-[2rem] p-6">
                                <div className="flex items-center justify-between">
                                    {/* Current Weight */}
                                    <div className="text-center">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Atual</p>
                                        <p className="text-3xl font-bold text-gray-900">{weight}kg</p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex-1 flex items-center justify-center px-4">
                                        <div className={`w-full h-1 ${goal === 'perder_peso' ? 'bg-gradient-to-r from-red-300 to-green-300' : 'bg-gradient-to-r from-gray-300 to-blue-300'} rounded-full relative`}>
                                            {goal === 'perder_peso' ? (
                                                <TrendingDown className="absolute left-1/2 -translate-x-1/2 -top-3 w-6 h-6 text-green-500" />
                                            ) : (
                                                <TrendingUp className="absolute left-1/2 -translate-x-1/2 -top-3 w-6 h-6 text-blue-500" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Target Weight */}
                                    <div className="text-center">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Meta</p>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={targetWeight}
                                                onChange={(e) => setTargetWeight(Number(e.target.value))}
                                                className={`text-3xl font-bold bg-transparent text-center focus:outline-none w-24 ${goal === 'perder_peso' ? 'text-green-600' : 'text-blue-600'
                                                    }`}
                                            />
                                            <span className="text-gray-400 text-sm">kg</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Delta Display */}
                                <div className="mt-4 text-center">
                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${goal === 'perder_peso'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {goal === 'perder_peso' ? (
                                            <>
                                                <TrendingDown size={16} />
                                                Perder {Math.abs(weight - targetWeight).toFixed(1)}kg
                                            </>
                                        ) : (
                                            <>
                                                <TrendingUp size={16} />
                                                Ganhar {Math.abs(targetWeight - weight).toFixed(1)}kg
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Weekly Goal Slider */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 px-1">
                                    <Sparkles size={18} className="text-nutri-500" />
                                    Velocidade Semanal
                                </label>
                                <div className="bg-gray-50 rounded-[1.5rem] p-4">
                                    <div className="flex justify-between mb-3">
                                        <span className="text-xs text-gray-400">Mais Lento</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            {goal === 'perder_peso' ? '-' : '+'}{weeklyGoal}kg/semana
                                        </span>
                                        <span className="text-xs text-gray-400">Mais Rápido</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.25"
                                        max="1"
                                        step="0.25"
                                        value={weeklyGoal}
                                        onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                                        className="w-full accent-nutri-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                                        <span>0.25kg</span>
                                        <span>0.5kg</span>
                                        <span>0.75kg</span>
                                        <span>1kg</span>
                                    </div>
                                </div>
                            </div>

                            {/* Estimated Date */}
                            {estimatedDate && (
                                <div className={`rounded-[1.5rem] p-5 ${goal === 'perder_peso' ? 'bg-green-50 border border-green-100' : 'bg-blue-50 border border-blue-100'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${goal === 'perder_peso' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Projeção de Chegada</p>
                                            <p className={`text-xl font-bold ${goal === 'perder_peso' ? 'text-green-700' : 'text-blue-700'
                                                }`}>
                                                {estimatedDate.toLocaleDateString('pt-BR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Safety Note */}
                            <p className="text-xs text-gray-400 text-center">
                                💡 Perder mais de 1kg por semana pode não ser saudável. Consulte um profissional.
                            </p>
                        </div>
                    )}

                    {/* Step 4 - Nutritional Goals (or step 3 if no weight goal) */}
                    {((step === 4 && hasWeightGoal) || (step === 3 && !hasWeightGoal)) && (
                        <div className="space-y-8 animate-slide-in-right">
                            <div className="text-center mb-6">
                                <h2 className="font-heading font-bold text-2xl text-gray-900">Seu Plano</h2>
                                <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
                                    Calculamos estas metas com base no seu perfil, mas você está no controle.
                                    <br />
                                    Sinta-se à vontade para ajustar qualquer valor manualmente a qualquer momento.
                                </p>
                            </div>

                            <div className="bg-nutri-50 rounded-[2rem] p-6 text-center border border-nutri-100">
                                <p className="text-nutri-600 text-xs font-bold uppercase tracking-widest mb-2">META DIÁRIA</p>
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={calories}
                                            onChange={(e) => setCalories(Number(e.target.value))}
                                            className="font-heading font-extrabold text-5xl text-nutri-600 bg-transparent text-center focus:outline-none focus:border-b-2 focus:border-nutri-300 w-48"
                                        />
                                        <span className="text-nutri-400 font-medium absolute top-1/2 -translate-y-1/2 right-0 translate-x-full ml-2">kcal</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1200"
                                        max="4000"
                                        step="50"
                                        value={calories}
                                        onChange={(e) => setCalories(Number(e.target.value))}
                                        className="w-48 accent-nutri-500 h-2 bg-nutri-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Sliders */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-2 px-1">
                                            <span className="text-sm font-bold text-gray-700">Proteínas</span>
                                            <span className="text-sm font-bold text-nutri-600">{protein}g</span>
                                        </div>
                                        <input type="range" min="50" max="300" value={protein} onChange={(e) => setProtein(Number(e.target.value))} className="w-full accent-nutri-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2 px-1">
                                            <span className="text-sm font-bold text-gray-700">Carboidratos</span>
                                            <span className="text-sm font-bold text-yellow-500">{carbs}g</span>
                                        </div>
                                        <input type="range" min="50" max="500" value={carbs} onChange={(e) => setCarbs(Number(e.target.value))} className="w-full accent-yellow-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2 px-1">
                                            <span className="text-sm font-bold text-gray-700">Gorduras</span>
                                            <span className="text-sm font-bold text-red-500">{fats}g</span>
                                        </div>
                                        <input type="range" min="20" max="150" value={fats} onChange={(e) => setFats(Number(e.target.value))} className="w-full accent-red-500 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </div>

                                {/* Water Goal */}
                                <div className="bg-blue-50 rounded-[1.5rem] p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center">
                                        <Droplet size={24} fill="currentColor" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-blue-900">Hidratação</span>
                                            <span className="font-bold text-blue-600 text-lg">{water}ml</span>
                                        </div>
                                        <input type="range" min="1500" max="5000" step="100" value={water} onChange={(e) => setWater(Number(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5 - Clinical Setup (only for clinical mode) */}
                    {/* Step number is 5 if hasWeightGoal, else 4 */}
                    {((step === 5 && hasWeightGoal) || (step === 4 && !hasWeightGoal)) && isClinicalMode && (
                        <ClinicalSetup
                            onComplete={(settings) => {
                                setClinicalSettings(settings);
                            }}
                            initialSettings={clinicalSettings}
                        />
                    )}

                    {/* Navigation Buttons */}
                    {step !== 0 && (
                        <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                            <button
                                onClick={handleBack}
                                className={`flex items-center gap-2 px-6 py-4 text-gray-500 hover:bg-gray-50 rounded-2xl transition font-bold ${step <= 1 ? 'opacity-0 pointer-events-none' : ''}`}
                            >
                                <ChevronLeft size={20} />
                                Voltar
                            </button>

                            {(() => {
                                // Calculate current step context
                                const nutritionalStep = hasWeightGoal ? 4 : 3;
                                const clinicalStep = hasWeightGoal ? 5 : 4;
                                const isOnNutritionalStep = step === nutritionalStep;
                                const isOnClinicalStep = step === clinicalStep && isClinicalMode;
                                const isOnWeightGoalStep = step === 3 && hasWeightGoal;
                                const isBeforeNutritionalStep = step < nutritionalStep;

                                // Finish Button - Last step (Nutritional for non-clinical, Clinical for clinical)
                                if ((isOnNutritionalStep && !isClinicalMode) || isOnClinicalStep) {
                                    return (
                                        <button
                                            onClick={handleComplete}
                                            disabled={isSubmitting || (isClinicalMode && !clinicalSettings)}
                                            className={`flex items-center gap-3 px-8 py-4 ${isClinicalMode
                                                    ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/30 hover:shadow-teal-500/50'
                                                    : 'bg-nutri-500 hover:bg-nutri-600 shadow-nutri-500/30 hover:shadow-nutri-500/50'
                                                } disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-[1.25rem] transition-all font-bold shadow-lg hover:scale-105 active:scale-95`}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Sparkles size={20} className="animate-spin" />
                                                    Criando Perfil...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={20} />
                                                    {isClinicalMode ? 'Concluir Configuração' : 'Finalizar Setup'}
                                                </>
                                            )}
                                        </button>
                                    );
                                }

                                // Clinical Setup Button - On nutritional step for clinical users
                                if (isOnNutritionalStep && isClinicalMode) {
                                    return (
                                        <button
                                            onClick={handleNext}
                                            className="flex items-center gap-3 px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-[1.25rem] transition-all font-bold shadow-lg shadow-teal-500/30 hover:scale-105 active:scale-95"
                                        >
                                            Configurar Tratamento
                                            <Pill size={20} />
                                        </button>
                                    );
                                }

                                // Continue Button - For all other steps
                                return (
                                    <button
                                        onClick={handleNext}
                                        disabled={
                                            (step === 1 && !isStep1Valid) ||
                                            (step === 2 && !isStep2Valid) ||
                                            (isOnWeightGoalStep && targetWeight <= 0)
                                        }
                                        className="flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-[1.25rem] transition-all font-bold shadow-lg shadow-gray-200 hover:scale-105 active:scale-95"
                                    >
                                        Continuar
                                        <ChevronRight size={20} />
                                    </button>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
