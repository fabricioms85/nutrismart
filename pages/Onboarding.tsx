import React, { useState, useEffect } from 'react';
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
    Flame
} from 'lucide-react';
import {
    Gender,
    Goal,
    ActivityLevel,
    Aggressiveness,
    calculateNutritionalGoals,
    getActivityLevelLabel,
    getGoalLabel
} from '../services/nutritionCalculator';

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
}

const Onboarding: React.FC<OnboardingProps> = ({ userName, onComplete }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1 - Basic Info
    const [weight, setWeight] = useState<number>(70);
    const [height, setHeight] = useState<number>(170);
    const [age, setAge] = useState<number>(30);
    const [gender, setGender] = useState<Gender>('masculino');

    // Step 2 - Goals
    const [goal, setGoal] = useState<Goal>('manter_peso');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderado');
    const [aggressiveness, setAggressiveness] = useState<Aggressiveness>('moderado');

    // Step 3 - Calculated Goals (adjustable)
    const [calories, setCalories] = useState<number>(2000);
    const [protein, setProtein] = useState<number>(150);
    const [carbs, setCarbs] = useState<number>(250);
    const [fats, setFats] = useState<number>(65);
    const [water, setWater] = useState<number>(2500);

    // Recalculate goals when entering step 3
    useEffect(() => {
        if (step === 3 && weight > 0 && height > 0 && age > 0) {
            const goals = calculateNutritionalGoals(
                { weight, height, age, gender },
                { goal, activityLevel },
                aggressiveness
            );
            // Ensure values are within reasonable bounds
            setCalories(Math.min(4000, Math.max(1200, goals.calories)));
            setProtein(Math.min(300, Math.max(50, goals.protein)));
            setCarbs(Math.min(500, Math.max(50, goals.carbs)));
            setFats(Math.min(150, Math.max(20, goals.fats)));
            setWater(Math.min(5000, Math.max(1500, goals.water)));
        }
    }, [step]);


    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            await onComplete({
                weight,
                height,
                age,
                gender,
                goal,
                activityLevel,
                dailyCalorieGoal: calories,
                dailyWaterGoal: water,
                macros: { protein, carbs, fats }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStep1Valid = weight > 0 && height > 0 && age > 0;
    const isStep2Valid = goal && activityLevel;

    // Progress indicator component
    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-3 mb-10">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                    <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-heading font-bold text-lg transition-all duration-500 ${s < step
                            ? 'bg-nutri-500 text-white shadow-lg shadow-nutri-500/30'
                            : s === step
                                ? 'bg-gray-900 text-white shadow-xl scale-110'
                                : 'bg-white border border-gray-100 text-gray-300'
                            }`}
                    >
                        {s < step ? <CheckCircle size={24} /> : s}
                    </div>
                    {s < 3 && (
                        <div className={`w-12 h-1 mx-3 rounded-full transition-all duration-500 ${s < step ? 'bg-nutri-500' : 'bg-gray-100'}`} />
                    )}
                </div>
            ))}
        </div>
    );

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

                    {/* Step 3 - Nutritional Goals */}
                    {step === 3 && (
                        <div className="space-y-8 animate-slide-in-right">
                            <div className="text-center mb-6">
                                <h2 className="font-heading font-bold text-2xl text-gray-900">Seu Plano</h2>
                                <p className="text-sm text-gray-400">Calculamos essas metas para você</p>
                            </div>

                            <div className="bg-nutri-50 rounded-[2rem] p-8 text-center border border-nutri-100">
                                <p className="text-nutri-600 text-xs font-bold uppercase tracking-widest mb-2">META DIÁRIA</p>
                                <h3 className="font-heading font-extrabold text-6xl text-nutri-600 mb-2">{calories}</h3>
                                <p className="text-nutri-400 font-medium">kcal</p>
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

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleBack}
                            className={`flex items-center gap-2 px-6 py-4 text-gray-500 hover:bg-gray-50 rounded-2xl transition font-bold ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                        >
                            <ChevronLeft size={20} />
                            Voltar
                        </button>


                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                                className="flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-[1.25rem] transition-all font-bold shadow-lg shadow-gray-200 hover:scale-105 active:scale-95"
                            >
                                Continuar
                                <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                disabled={isSubmitting}
                                className="flex items-center gap-3 px-8 py-4 bg-nutri-500 hover:bg-nutri-600 disabled:bg-nutri-300 text-white rounded-[1.25rem] transition-all font-bold shadow-lg shadow-nutri-500/30 hover:shadow-nutri-500/50 hover:scale-105 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Sparkles size={20} className="animate-spin" />
                                        Criando Perfil...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={20} />
                                        Finalizar Setup
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
