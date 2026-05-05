// Clinical Mode Types (GLP-1 Support)
export interface ClinicalSettings {
  medication: string;
  dosage: string;
  injectionDay?: number; // 0=Dom, 1=Seg... 6=Sab (Optional, meaningful only for weekly intervals)
  intervalDays?: number; // Days between doses (Default 7)
  nextInjection?: string; // Calculated next date
  startDate: string;
  proteinGoalPerKg?: number;
}

export interface Symptom {
  id: string;
  date: string;
  symptom: string;
  severity: number; // 1-5
  notes?: string;
  createdAt?: string;
}

// Weight Goal Journey Types
export interface WeightGoal {
  startWeight: number;           // Peso inicial ao criar meta
  targetWeight: number;          // Peso desejado
  startDate: string;             // Data de início
  targetDate?: string;           // Data alvo (opcional, definida pelo usuário)
  estimatedDate?: string;        // Projeção calculada pela IA
  weeklyGoal: number;            // Meta semanal (ex: -0.5 ou +0.3)
  milestones: WeightMilestone[];
  status: 'active' | 'achieved' | 'paused';
}

export interface WeightMilestone {
  id: string;
  targetWeight: number;          // Ex: 85kg (metade do caminho)
  title: string;                 // "Metade do caminho!"
  achievedAt?: string;
  xpReward: number;
  claimedXP?: boolean;
}

export interface WeightEntry {
  date: string;
  weight: number;
  note?: string;                 // "Me senti mais leve"
  source?: 'manual' | 'smart_scale' | 'wearable';
}

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  dailyCalorieGoal: number;
  dailyWaterGoal: number;
  weight?: number;
  height?: number;
  age?: number;
  gender?: 'masculino' | 'feminino' | 'outro';
  goal?: string;
  activityLevel?: string;
  onboardingCompleted?: boolean;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  // Clinical Mode fields
  isClinicalMode?: boolean;
  clinicalSettings?: ClinicalSettings;
  // Weight Goal Journey fields
  weightGoal?: WeightGoal;
  weightHistory?: WeightEntry[];
  // Exercise calories: none = don't add to remaining, half = 50%, full = 100%
  addExerciseCaloriesToRemaining?: 'none' | 'half' | 'full';
}


export interface DailyStats {
  caloriesConsumed: number;
  caloriesBurned: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatsConsumed: number;
  waterConsumed: number;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  date?: string;
  calories: number;
  weight?: number; // Added weight in grams
  ingredients?: { name: string; quantity: string; unit: string }[]; // Added ingredients list
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  image?: string;
}

export interface Exercise {
  id: string;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  time: string;
  date?: string;
  intensity?: string;
}

export interface Recipe {
  id: string;
  title: string;
  calories: number;
  timeMinutes: number;
  image: string;
  /** Termo em inglês para buscar imagem correspondente no Unsplash (opção 2A). */
  imageSearchTerm?: string;
  tags: string[];
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  /** Ingredientes (opcional); usado na tela de detalhe da receita. */
  ingredients?: string[];
  /** Passos do modo de preparo (opcional). */
  instructions?: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  dateUnlocked?: string;
  condition?: string;
  xpReward?: number;
}

// Gamification - XP and Level System
export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastActivityDate?: string;
  weeklyChallenge?: Challenge;
  badges: Badge[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'water' | 'calories' | 'exercise' | 'meals' | 'streak';
  target: number;
  current: number;
  startDate: string;
  endDate: string;
  xpReward: number;
  completed: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'comum' | 'raro' | 'epico' | 'lendario';
  earnedAt?: string;
  condition: string; // Description of how to earn
}

// Shopping List Types
export interface ShoppingListItem {
  id: string;
  name: string;
  quantity?: string;
  checked: boolean;
}

export interface ShoppingListCategory {
  category: string;
  items: ShoppingListItem[];
}

export interface ShoppingList {
  id: string;
  createdAt: string;
  categories: ShoppingListCategory[];
}

export enum NavItem {
  Dashboard = 'Dashboard',
  RegisterMeal = 'Registrar Refeição',
  RegisterExercise = 'Registrar Exercício',
  Recipes = 'Receitas',
  MealPlanner = 'Planejador Semanal',
  Progress = 'Progresso',
  Assistant = 'NutriAI',
  Awards = 'Conquistas',
  Notifications = 'Notificações',
  ShoppingList = 'Lista de Compras',
  Plans = 'Planos e Assinatura',
  Profile = 'Meu Perfil'
}