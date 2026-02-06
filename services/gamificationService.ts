import { Achievement, DailyStats, Meal, Exercise, User, UserProgress, Challenge, Badge } from "../types";

// ============================================
// XP SYSTEM
// ============================================

export const XP_TABLE = {
  registerMeal: 10,
  registerExercise: 15,
  completeWaterGoal: 50,
  completeCalorieGoal: 75,
  completeProteinGoal: 50,
  streak3Days: 100,
  streak7Days: 250,
  streak30Days: 1000,
  completeChallenge: 200,
  unlockBadge: 50,
};

// Calculate level from XP (exponential curve)
export function calculateLevel(xp: number): number {
  // Level formula: sqrt(xp / 100) + 1
  // Level 2 = 100 XP, Level 5 = 1600 XP, Level 10 = 8100 XP
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Calculate XP needed for next level
export function xpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}

// Calculate XP progress within current level
export function getLevelProgress(xp: number): { current: number; required: number; percentage: number } {
  const level = calculateLevel(xp);
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const xpForNext = xpForNextLevel(level);
  const currentProgress = xp - xpForCurrentLevel;
  const requiredForLevel = xpForNext - xpForCurrentLevel;

  return {
    current: currentProgress,
    required: requiredForLevel,
    percentage: Math.round((currentProgress / requiredForLevel) * 100),
  };
}

// ============================================
// BADGE DEFINITIONS
// ============================================

export const BADGE_DEFINITIONS: Omit<Badge, 'earnedAt'>[] = [
  // Comum (easy to get)
  { id: 'first-meal', name: 'Primeira Refeição', description: 'Registrou sua primeira refeição', iconName: 'Utensils', rarity: 'comum', condition: 'Registrar 1 refeição' },
  { id: 'first-exercise', name: 'Primeiro Treino', description: 'Registrou seu primeiro exercício', iconName: 'Dumbbell', rarity: 'comum', condition: 'Registrar 1 exercício' },
  { id: 'hydrated', name: 'Hidratado', description: 'Atingiu a meta de água pela primeira vez', iconName: 'Droplet', rarity: 'comum', condition: 'Bater meta de água' },
  { id: 'balanced', name: 'Equilibrado', description: 'Atingiu a meta calórica pela primeira vez', iconName: 'Scale', rarity: 'comum', condition: 'Bater meta calórica' },

  // Raro (requires consistency)
  { id: 'streak-3', name: 'Constância', description: 'Manteve um streak de 3 dias', iconName: 'Flame', rarity: 'raro', condition: 'Streak de 3 dias' },
  { id: 'streak-7', name: 'Semana Perfeita', description: 'Manteve um streak de 7 dias', iconName: 'Calendar', rarity: 'raro', condition: 'Streak de 7 dias' },
  { id: 'meal-master-10', name: 'Mestre das Refeições', description: 'Registrou 10 refeições', iconName: 'ChefHat', rarity: 'raro', condition: '10 refeições registradas' },
  { id: 'athlete-10', name: 'Atleta Iniciante', description: 'Registrou 10 exercícios', iconName: 'Medal', rarity: 'raro', condition: '10 exercícios registrados' },
  { id: 'water-week', name: 'Hidratação Máxima', description: 'Bateu meta de água 7 dias seguidos', iconName: 'Waves', rarity: 'raro', condition: 'Meta de água 7 dias seguidos' },

  // Épico (challenging)
  { id: 'streak-30', name: 'Dedicação Absoluta', description: 'Manteve um streak de 30 dias', iconName: 'Crown', rarity: 'epico', condition: 'Streak de 30 dias' },
  { id: 'meal-master-50', name: 'Chef Expert', description: 'Registrou 50 refeições', iconName: 'Award', rarity: 'epico', condition: '50 refeições registradas' },
  { id: 'athlete-50', name: 'Atleta Dedicado', description: 'Registrou 50 exercícios', iconName: 'Trophy', rarity: 'epico', condition: '50 exercícios registrados' },
  { id: 'level-10', name: 'Nível 10', description: 'Alcançou o nível 10', iconName: 'Star', rarity: 'epico', condition: 'Nível 10' },
  { id: 'challenge-5', name: 'Desafiante', description: 'Completou 5 desafios semanais', iconName: 'Target', rarity: 'epico', condition: '5 desafios completados' },

  // Lendário (very hard)
  { id: 'streak-100', name: 'Lendário', description: 'Manteve um streak de 100 dias', iconName: 'Gem', rarity: 'lendario', condition: 'Streak de 100 dias' },
  { id: 'level-25', name: 'Mestre Supremo', description: 'Alcançou o nível 25', iconName: 'Sparkles', rarity: 'lendario', condition: 'Nível 25' },
  { id: 'perfect-month', name: 'Mês Perfeito', description: 'Bateu todas as metas por 30 dias', iconName: 'Zap', rarity: 'lendario', condition: 'Todas as metas 30 dias seguidos' },
];

// ============================================
// WEEKLY CHALLENGES
// ============================================

const CHALLENGE_TEMPLATES = [
  { type: 'water' as const, title: 'Hidratação Total', description: 'Beba 100% da meta de água', targetMultiplier: 7, xpReward: 200 },
  { type: 'calories' as const, title: 'Equilíbrio Calórico', description: 'Fique dentro da meta calórica (±10%)', targetMultiplier: 5, xpReward: 250 },
  { type: 'exercise' as const, title: 'Semana Ativa', description: 'Registre exercícios', targetMultiplier: 1, xpReward: 200 },
  { type: 'meals' as const, title: 'Alimentação Completa', description: 'Registre todas as refeições principais', targetMultiplier: 1, xpReward: 175 },
  { type: 'streak' as const, title: 'Consistência', description: 'Mantenha seu streak ativo', targetMultiplier: 1, xpReward: 300 },
];

export function generateWeeklyChallenge(): Omit<Challenge, 'id' | 'current' | 'completed'> {
  const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

  let target = 0;
  switch (template.type) {
    case 'water':
      target = 7; // 7 days of water goal
      break;
    case 'calories':
      target = 5; // 5 days within calorie goal
      break;
    case 'exercise':
      target = 4; // 4 exercise sessions
      break;
    case 'meals':
      target = 21; // 21 main meals (3 per day x 7)
      break;
    case 'streak':
      target = 7; // 7 day streak
      break;
  }

  return {
    title: template.title,
    description: template.description,
    type: template.type,
    target,
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0],
    xpReward: template.xpReward,
  };
}

// ============================================
// PROGRESS TRACKING (Supabase + LocalStorage fallback)
// ============================================

import * as db from './databaseService';

const PROGRESS_KEY = 'nutrismart-user-progress';
const BADGES_KEY = 'nutrismart-user-badges';
const CHALLENGE_KEY = 'nutrismart-weekly-challenge';

// Current user ID for Supabase sync
let currentUserId: string | null = null;

export function initGamificationService(userId: string): void {
  currentUserId = userId;
}

export function getUserProgress(): UserProgress {
  const stored = localStorage.getItem(PROGRESS_KEY);
  const badges = getUserBadges();

  if (!stored) {
    return {
      xp: 0,
      level: 1,
      streak: 0,
      badges,
    };
  }

  try {
    const parsed = JSON.parse(stored);
    return { ...parsed, badges, level: calculateLevel(parsed.xp) };
  } catch {
    return { xp: 0, level: 1, streak: 0, badges };
  }
}

// Async version that syncs with Supabase
export async function getUserProgressAsync(userId?: string): Promise<UserProgress> {
  const uid = userId || currentUserId;

  if (uid) {
    try {
      const dbProgress = await db.getUserProgress(uid);
      if (dbProgress) {
        const localBadges = getUserBadges();
        const progress: UserProgress = {
          xp: dbProgress.xp,
          level: dbProgress.level,
          streak: dbProgress.streak,
          badges: localBadges,
        };
        // Sync to localStorage
        saveUserProgressLocal(progress);
        return progress;
      }
    } catch (error) {
      console.warn('Failed to fetch progress from Supabase:', error);
    }
  }

  return getUserProgress();
}

export function saveUserProgress(progress: Omit<UserProgress, 'badges' | 'level'>): void {
  saveUserProgressLocal(progress);

  // Sync to Supabase in background
  if (currentUserId) {
    db.updateUserProgress(currentUserId, {
      xp: progress.xp,
      streak: progress.streak,
      level: calculateLevel(progress.xp),
    }).catch(() => { });
  }
}

function saveUserProgressLocal(progress: Omit<UserProgress, 'badges' | 'level'> | UserProgress): void {
  const xp = 'xp' in progress ? progress.xp : 0;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({
    ...progress,
    level: calculateLevel(xp),
  }));
}

export function addXP(amount: number, action: keyof typeof XP_TABLE): { newXP: number; leveledUp: boolean; newLevel: number } {
  const progress = getUserProgress();
  const oldLevel = progress.level;
  const newXP = progress.xp + amount;
  const newLevel = calculateLevel(newXP);

  saveUserProgress({ ...progress, xp: newXP });

  // Check for level-based badges
  if (newLevel >= 10) unlockBadge('level-10');
  if (newLevel >= 25) unlockBadge('level-25');

  return {
    newXP,
    leveledUp: newLevel > oldLevel,
    newLevel,
  };
}

export function getUserBadges(): Badge[] {
  const stored = localStorage.getItem(BADGES_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Async version that syncs with Supabase
export async function getUserBadgesAsync(userId?: string): Promise<Badge[]> {
  const uid = userId || currentUserId;
  
  if (uid) {
    try {
      const dbBadges = await db.getUserBadges(uid);
      // Merge with local badge definitions
      const badges = dbBadges
        .map(b => {
          const def = BADGE_DEFINITIONS.find(d => d.id === b.badge_id);
          return def ? { ...def, earnedAt: b.earned_at } as Badge : null;
        })
        .filter((b): b is Badge => b !== null);
      
      // Sync to localStorage
      localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
      return badges;
    } catch (error) {
      console.warn('Failed to fetch badges from Supabase:', error);
    }
  }
  
  return getUserBadges();
}

export function unlockBadge(badgeId: string): Badge | null {
  const definition = BADGE_DEFINITIONS.find(b => b.id === badgeId);
  if (!definition) return null;

  const currentBadges = getUserBadges();
  if (currentBadges.some(b => b.id === badgeId)) return null; // Already unlocked

  const newBadge: Badge = {
    ...definition,
    earnedAt: new Date().toISOString(),
  };

  currentBadges.push(newBadge);
  localStorage.setItem(BADGES_KEY, JSON.stringify(currentBadges));

  // Sync to Supabase in background
  if (currentUserId) {
    db.unlockBadge(currentUserId, badgeId).catch(() => {});
  }

  // Add XP for unlocking (avoid infinite loop by not calling addXP for 'unlockBadge' action recursively)
  const progress = getUserProgress();
  const newXP = progress.xp + XP_TABLE.unlockBadge;
  saveUserProgress({ ...progress, xp: newXP });

  return newBadge;
}

export function getWeeklyChallenge(): Challenge | null {
  const stored = localStorage.getItem(CHALLENGE_KEY);

  if (stored) {
    try {
      const challenge = JSON.parse(stored);
      // Check if challenge is still valid (not expired)
      if (new Date(challenge.endDate) >= new Date()) {
        return challenge;
      }
    } catch {
      // Invalid data, generate new
    }
  }

  // Generate new challenge
  const newChallenge: Challenge = {
    id: crypto.randomUUID(),
    ...generateWeeklyChallenge(),
    current: 0,
    completed: false,
  };

  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(newChallenge));
  return newChallenge;
}

export function updateChallengeProgress(amount: number): Challenge | null {
  const challenge = getWeeklyChallenge();
  if (!challenge || challenge.completed) return challenge;

  challenge.current = Math.min(challenge.current + amount, challenge.target);

  if (challenge.current >= challenge.target) {
    challenge.completed = true;
    addXP(challenge.xpReward, 'completeChallenge');
  }

  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
  return challenge;
}

// ============================================
// LEGACY ACHIEVEMENTS (keeping for compatibility)
// ============================================

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  { id: '1', title: 'Primeiros Passos', description: 'Registre sua primeira refeição no aplicativo', iconName: 'Star', unlocked: false },
  { id: '2', title: 'Hidratação Mestre', description: 'Beba 100% da sua meta de água diária', iconName: 'Droplet', unlocked: false },
  { id: '3', title: 'Movimento Constante', description: 'Realize pelo menos 3 exercícios registrados', iconName: 'Flame', unlocked: false },
  { id: '4', title: 'Disciplina Diária', description: 'Registre Café, Almoço e Jantar no mesmo dia', iconName: 'Calendar', unlocked: false },
  { id: '5', title: 'Explorador', description: 'Registre 5 refeições no total', iconName: 'ChefHat', unlocked: false },
  { id: '6', title: 'Equilíbrio Perfeito', description: 'Consuma exatamente (±50kcal) sua meta calórica', iconName: 'Trophy', unlocked: false },
];

export const checkAchievements = (
  user: User,
  stats: DailyStats,
  allMeals: Meal[],
  allExercises: Exercise[],
  existingUnlockedIds: string[]
): string[] => {
  const unlockedIds = new Set(existingUnlockedIds);

  // 1. Primeiros Passos
  if (allMeals.length > 0) {
    unlockedIds.add('1');
    unlockBadge('first-meal');
  }

  // 2. Hidratação
  if (stats.waterConsumed >= user.dailyWaterGoal && user.dailyWaterGoal > 0) {
    unlockedIds.add('2');
    unlockBadge('hydrated');
  }

  // 3. Movimento (3+ exercícios)
  if (allExercises.length >= 3) {
    unlockedIds.add('3');
    unlockBadge('first-exercise');
  }

  // 4. Disciplina (Café, Almoço, Jantar)
  const hasBreakfast = allMeals.some(m => m.type === 'breakfast');
  const hasLunch = allMeals.some(m => m.type === 'lunch');
  const hasDinner = allMeals.some(m => m.type === 'dinner');

  if (hasBreakfast && hasLunch && hasDinner) {
    unlockedIds.add('4');
  }

  // 5. Explorador (5+ refeições)
  if (allMeals.length >= 5) {
    unlockedIds.add('5');
  }

  // 6. Equilíbrio Perfeito
  const diff = Math.abs(user.dailyCalorieGoal - stats.caloriesConsumed);
  if (stats.caloriesConsumed > 1000 && diff <= 50) {
    unlockedIds.add('6');
    unlockBadge('balanced');
  }

  // Badge unlocks based on counts
  if (allMeals.length >= 10) unlockBadge('meal-master-10');
  if (allMeals.length >= 50) unlockBadge('meal-master-50');
  if (allExercises.length >= 10) unlockBadge('athlete-10');
  if (allExercises.length >= 50) unlockBadge('athlete-50');

  return Array.from(unlockedIds);
};

// Check and unlock level-based badges
export function checkLevelBadges(): void {
  const progress = getUserProgress();
  if (progress.level >= 10) unlockBadge('level-10');
  if (progress.level >= 25) unlockBadge('level-25');
}

// Check and unlock streak-based badges
export function checkStreakBadges(streak: number): void {
  if (streak >= 3) unlockBadge('streak-3');
  if (streak >= 7) unlockBadge('streak-7');
  if (streak >= 30) unlockBadge('streak-30');
  if (streak >= 100) unlockBadge('streak-100');
}