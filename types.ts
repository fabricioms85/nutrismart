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
  tags: string[];
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  dateUnlocked?: string;
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
  iconName: string;
  rarity: 'comum' | 'raro' | 'epico' | 'lendario';
  earnedAt?: string;
  condition: string; // Description of how to earn
}

export enum NavItem {
  Dashboard = 'Dashboard',
  RegisterMeal = 'Registrar Refeição',
  RegisterExercise = 'Registrar Exercício',
  Recipes = 'Receitas',
  MealPlanner = 'Planejador Semanal',
  Planning = 'Planejamento',
  Progress = 'Progresso',
  Assistant = 'Assistente IA',
  Awards = 'Conquistas',
  Notifications = 'Notificações',
  Plans = 'Planos e Assinatura',
  Profile = 'Meu Perfil'
}