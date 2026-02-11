
import { supabase } from './supabaseClient';
import { Achievement, Challenge } from '../types';

// Constants for tables
export const TABLE_USER_PROGRESS = 'user_progress';
export const TABLE_USER_BADGES = 'user_badges';
export const TABLE_WEEKLY_CHALLENGES = 'weekly_challenges';

// XP Values
export const XP_VALUES = {
  LOG_MEAL: 10,
  LOG_WATER: 5,
  LOG_EXERCISE: 15,
  COMPLETE_GOAL: 50,
  STREAK_BONUS: 100,
  CHALLENGE_COMPLETE: 200
};

const USER_PROGRESS_KEY = 'nutrismart-user-progress';

export function getUserProgressLocal() {
  try {
    const stored = localStorage.getItem(USER_PROGRESS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export async function getUserProgress(userId: string) {
  const { data, error } = await supabase
    .from(TABLE_USER_PROGRESS)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }

  // Cache to local storage
  if (data) {
    localStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(data));
  }

  return data;
}

export async function addXP(userId: string, amount: number, reason: string) {
  // 1. Get current progress
  const progress = await getUserProgress(userId);
  if (!progress) {
    // Initialize if missing
    await initializeUserProgress(userId);
    return addXP(userId, amount, reason);
  }

  // 2. Calculate new XP and Level
  let newXP = progress.xp + amount;

  // Legacy logic: Level = floor(XP / 1000) + 1
  const calculatedLevel = Math.floor(newXP / 1000) + 1;
  const levelUp = calculatedLevel > progress.level;

  // 3. Update DB
  const { error } = await supabase
    .from(TABLE_USER_PROGRESS)
    .update({
      xp: newXP,
      level: calculatedLevel,
      last_activity_date: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating XP:', error);
  }

  return { levelUp, newLevel: calculatedLevel };
}

export async function initializeUserProgress(userId: string) {
  const { error } = await supabase
    .from(TABLE_USER_PROGRESS)
    .insert({ user_id: userId, xp: 0, level: 1, streak: 0 });

  if (error) console.error('Error initializing progress:', error);
}

export async function getUserBadges(userId: string): Promise<{ id: string; earnedAt: string }[]> {
  const { data, error } = await supabase
    .from(TABLE_USER_BADGES)
    .select('badge_id, earned_at')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
  return data.map((b: any) => ({ id: b.badge_id, earnedAt: b.earned_at }));
}

export async function getAllAchievements(): Promise<Achievement[]> {
  return [
    { id: 'first_meal', title: 'Primeira Refeição', description: 'Registre sua primeira refeição', icon: '🍽️', condition: 'log_meal_count >= 1', xpReward: 50, unlocked: false },
    { id: 'water_master', title: 'Mestre da Hidratação', description: 'Beba 2L de água em um dia', icon: '💧', condition: 'daily_water >= 2000', xpReward: 100, unlocked: false },
    { id: 'workout_warrior', title: 'Guerreiro do Treino', description: 'Registre 5 exercícios', icon: '💪', condition: 'exercise_count >= 5', xpReward: 150, unlocked: false },
    { id: 'streak_7', title: 'Semana Perfeita', description: 'Mantenha o foco por 7 dias', icon: '🔥', condition: 'streak >= 7', xpReward: 500, unlocked: false }
  ];
}

export async function checkAchievements(userId: string, metrics: any) {
  // Logic to check rules against metrics and award badges
  // Placeholder for actual implementation
  return [];
}

export async function getActiveChallenge(userId: string): Promise<Challenge | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from(TABLE_WEEKLY_CHALLENGES)
    .select('*')
    .eq('user_id', userId)
    .gte('end_date', today)
    .lte('start_date', today)
    .maybeSingle();

  if (error) return null;
  return data as Challenge;
}

export async function calculateStreak(userId: string): Promise<number> {
  // Logic to calculate streak based on activity logs (meals, exercises, etc.)
  // For now, returning the stored streak from user_progress
  const progress = await getUserProgress(userId);
  return progress?.streak || 0;
}

export async function checkWeightBadges(data: {
  currentWeight: number;
  startWeight: number;
  targetWeight: number;
  weightHistoryLength: number;
  consecutiveWeighInDays: number;
}) {
  // TODO: Implement badge checking logic
  // For now just logging
  console.log('Checking weight badges', data);

  if (data.consecutiveWeighInDays >= 7) {
    // Award 'streak_7' badge if not already
    // addXP(userId, 100, 'Weekly Weigh-in Streak');
  }
}

// Badge Definitions
export const BADGE_DEFINITIONS = [
  { id: 'first_meal', name: 'Primeira Refeição', description: 'Registre sua primeira refeição', iconName: 'Utensils', rarity: 'comum', condition: 'Registre 1 refeição' },
  { id: 'water_master', name: 'Mestre da Hidratação', description: 'Beba 2L de água em um dia', iconName: 'Droplet', rarity: 'raro', condition: 'Beba 2000ml de água' },
  { id: 'workout_warrior', name: 'Guerreiro do Treino', description: 'Registre 5 exercícios', iconName: 'Dumbbell', rarity: 'epico', condition: 'Registre 5 treinos' },
  { id: 'streak_7', name: 'Semana Perfeita', description: 'Mantenha o foco por 7 dias', iconName: 'Flame', rarity: 'lendario', condition: 'Sequência de 7 dias' },
  { id: 'weight_loss_1kg', name: 'Primeiro Passo', description: 'Perca 1kg', iconName: 'Scale', rarity: 'comum', condition: 'Perca 1kg' },
  { id: 'early_bird', name: 'Madrugador', description: 'Registre café da manhã antes das 8h', iconName: 'Sun', rarity: 'raro', condition: 'Café antes das 8:00' },
  { id: 'balanced_diet', name: 'Dieta Equilibrada', description: 'Atingiu macros do dia', iconName: 'Target', rarity: 'epico', condition: 'Metas de macros 100%' },
];

export const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_meal', title: 'Primeira Refeição', description: 'Registre sua primeira refeição', icon: '🍽️', condition: 'log_meal_count >= 1', xpReward: 50, unlocked: false },
  { id: 'water_master', title: 'Mestre da Hidratação', description: 'Beba 2L de água em um dia', icon: '💧', condition: 'daily_water >= 2000', xpReward: 100, unlocked: false },
  { id: 'workout_warrior', title: 'Guerreiro do Treino', description: 'Registre 5 exercícios', icon: '💪', condition: 'exercise_count >= 5', xpReward: 150, unlocked: false },
  { id: 'streak_7', title: 'Semana Perfeita', description: 'Mantenha o foco por 7 dias', icon: '🔥', condition: 'streak >= 7', xpReward: 500, unlocked: false }
];

// Helper to calculate level progress
export function getLevelProgress(currentXp: number) {
  const currentLevel = Math.floor(currentXp / 1000) + 1;
  const nextLevelXp = currentLevel * 1000;
  const currentLevelStartXp = (currentLevel - 1) * 1000;
  const progressInLevel = currentXp - currentLevelStartXp;
  const requiredForNext = 1000;

  return {
    current: progressInLevel,
    required: requiredForNext,
    percentage: (progressInLevel / requiredForNext) * 100
  };
}

// Aliases for compatibility
export const getUserProgressAsync = getUserProgress;
export const getUserBadgesAsync = getUserBadges;
export const getWeeklyChallenge = getActiveChallenge;

export async function getWeeklyStats(userId: string) {
  // Mock implementation for UI stability
  // In a real implementation, this would query daily_logs table
  const stats = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    stats.push({
      date: dateStr,
      stats: {
        caloriesConsumed: 0,
        caloriesBurned: 0,
        proteinConsumed: 0,
        carbsConsumed: 0,
        fatsConsumed: 0,
        waterConsumed: 0
      },
      achieved: false // Default to false until real logic is implemented
    });
  }
  return stats;
}