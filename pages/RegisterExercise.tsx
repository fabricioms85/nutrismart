import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Clock, 
  Flame, 
  Save, 
  Sparkles, 
  Footprints, 
  Waves, 
  Bike, 
  Wind, 
  Activity, 
  Zap 
} from 'lucide-react';
import { Exercise, User } from '../types';

interface RegisterExerciseProps {
  user: User;
  onSave: (exercise: Omit<Exercise, 'id'>) => void;
}

// MET (Metabolic Equivalent of Task) Values Lookup
// Format: Activity -> Intensity -> MET Value
const MET_VALUES: Record<string, Record<string, number>> = {
  'Musculação': { baixa: 3.5, media: 5.0, alta: 6.0 },
  'Corrida': { baixa: 8.0, media: 10.0, alta: 12.5 },
  'Natação': { baixa: 6.0, media: 8.0, alta: 10.0 },
  'Ciclismo': { baixa: 4.0, media: 8.0, alta: 10.0 },
  'Yoga': { baixa: 2.5, media: 3.0, alta: 4.0 },
  'Pilates': { baixa: 3.0, media: 3.5, alta: 4.0 },
  'Crossfit': { baixa: 8.0, media: 10.0, alta: 12.0 },
  'Outro': { baixa: 3.0, media: 5.0, alta: 7.0 }
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  'Musculação': Dumbbell,
  'Corrida': Footprints,
  'Natação': Waves,
  'Ciclismo': Bike,
  'Yoga': Wind,
  'Pilates': Activity,
  'Crossfit': Zap,
  'Outro': Sparkles
};

const RegisterExercise: React.FC<RegisterExerciseProps> = ({ user, onSave }) => {
  const [exerciseData, setExerciseData] = useState({
    name: 'Corrida',
    duration: '',
    intensity: 'media',
    calories: ''
  });

  const [autoCalculated, setAutoCalculated] = useState(false);

  // Automatic Calorie Calculation Effect
  useEffect(() => {
    const calculateCalories = () => {
      const duration = Number(exerciseData.duration);
      if (!duration || duration <= 0) {
        if (exerciseData.calories !== '') setExerciseData(prev => ({ ...prev, calories: '' }));
        return;
      }

      const intensity = exerciseData.intensity;
      const activity = exerciseData.name;
      const weight = user.weight || 70; // Fallback weight if not provided

      // Get MET value or default
      const mets = MET_VALUES[activity]?.[intensity] || MET_VALUES['Outro'][intensity];

      // Formula: Calories = MET * Weight(kg) * Duration(hours)
      const durationInHours = duration / 60;
      const caloriesBurned = Math.round(mets * weight * durationInHours);

      setExerciseData(prev => ({ ...prev, calories: caloriesBurned.toString() }));
      setAutoCalculated(true);
      
      // Reset indicator animation after a moment
      const timer = setTimeout(() => setAutoCalculated(false), 2000);
      return () => clearTimeout(timer);
    };

    calculateCalories();
  }, [exerciseData.name, exerciseData.duration, exerciseData.intensity, user.weight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newExercise: Omit<Exercise, 'id'> = {
      name: exerciseData.name,
      durationMinutes: Number(exerciseData.duration) || 0,
      caloriesBurned: Number(exerciseData.calories) || 0,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      intensity: exerciseData.intensity
    };

    onSave(newExercise);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registrar Exercício</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Activity Type Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Atividade</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.keys(MET_VALUES).map((type) => {
                const Icon = ACTIVITY_ICONS[type] || Sparkles;
                const isSelected = exerciseData.name === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setExerciseData({...exerciseData, name: type})}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-nutri-500 bg-nutri-50 text-nutri-700 shadow-sm ring-1 ring-nutri-200' 
                        : 'border-gray-200 hover:border-nutri-300 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Icon size={24} className={isSelected ? 'text-nutri-600' : 'text-gray-400'} />
                    <span className="text-xs font-semibold">{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Duration Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Clock size={16} /> Duração (minutos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={exerciseData.duration}
                  onChange={(e) => setExerciseData({...exerciseData, duration: e.target.value})}
                  placeholder="Ex: 45"
                  className="w-full pl-4 pr-4 py-3 rounded-xl border border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 outline-none transition text-lg"
                  required
                />
              </div>
            </div>

            {/* Calories (Calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={16} /> Calorias Gastas
                </div>
                {autoCalculated && (
                  <span className="text-xs text-nutri-600 flex items-center gap-1 animate-pulse font-medium">
                    <Sparkles size={12} /> Calculado automaticamente
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={exerciseData.calories}
                  onChange={(e) => setExerciseData({...exerciseData, calories: e.target.value})}
                  placeholder="0"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition text-lg font-bold ${
                    autoCalculated 
                      ? 'border-nutri-400 bg-nutri-50 text-nutri-800' 
                      : 'border-gray-200 focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 text-gray-700'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">kcal</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Estimativa para seu peso de {user.weight || 70}kg
              </p>
            </div>
          </div>

          {/* Intensity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Intensidade do Treino</label>
            <div className="flex gap-4">
               {['Baixa', 'Media', 'Alta'].map((level) => {
                 const value = level.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // "Média" -> "media"
                 const isSelected = exerciseData.intensity === value;
                 
                 let colorClass = 'peer-checked:border-nutri-500 peer-checked:bg-nutri-50 peer-checked:text-nutri-700';
                 if (value === 'alta') colorClass = 'peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700';
                 if (value === 'baixa') colorClass = 'peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700';

                 return (
                 <label key={level} className="flex-1 cursor-pointer group">
                   <input 
                      type="radio" 
                      name="intensity" 
                      value={value} 
                      checked={isSelected}
                      onChange={() => setExerciseData({...exerciseData, intensity: value})}
                      className="hidden peer"
                   />
                   <div className={`text-center py-4 rounded-xl border border-gray-200 transition-all duration-200 font-medium ${colorClass} hover:border-gray-300`}>
                     {level}
                   </div>
                 </label>
               )})}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-nutri-500 to-nutri-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-nutri-200 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.01]"
            >
              <Save size={20} />
              Registrar Atividade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterExercise;