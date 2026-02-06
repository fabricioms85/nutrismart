import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AiAssistant from './pages/AiAssistant';
import RegisterMeal from './pages/RegisterMeal';
import RegisterExercise from './pages/RegisterExercise';
import Recipes from './pages/Recipes';
import MealPlanner from './pages/MealPlanner';
import Planning from './pages/Planning';
import Progress from './pages/Progress';
import Awards from './pages/Awards';
import Notifications from './pages/Notifications';
import Plans from './pages/Plans';
import Profile from './pages/Profile';
import AuthPage from './pages/AuthPage';
import Onboarding, { OnboardingData } from './pages/Onboarding';
import AIChat from './components/AIChat';
import LevelUpModal from './components/LevelUpModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import { NavItem, User, DailyStats, Meal, Exercise } from './types';
import { checkAchievements, addXP, XP_TABLE, updateChallengeProgress, initGamificationService, checkStreakBadges } from './services/gamificationService';
import * as db from './services/databaseService';

// Default user for fallback
const DEFAULT_USER: User = {
  name: 'Usuário',
  email: '',
  dailyCalorieGoal: 2000,
  dailyWaterGoal: 2500,
  weight: 70,
  height: 170,
  age: 25,
  macros: {
    protein: 100,
    carbs: 250,
    fats: 70
  }
};

const AppLayout: React.FC<{ children: React.ReactNode; currentPath: NavItem; onNavigate: (item: NavItem) => void }> = ({ children, currentPath, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      <Sidebar
        activeItem={currentPath}
        onNavigate={onNavigate}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen transition-all duration-500 ease-in-out">
        <div className="lg:hidden p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-nutri-500 to-nutri-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-nutri-500/20">
              <span className="font-heading font-bold text-xs">NS</span>
            </div>
            <span className="font-heading font-bold text-gray-900 tracking-tight">NutriSmart</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            <Menu size={24} />
          </button>
        </div>

        <main className="flex-1 relative overflow-hidden">
          {/* Background Blobs for Pages */}
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-nutri-50/50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-50/50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 pointer-events-none translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Loading Screen Component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center relative overflow-hidden">
    {/* Background Blobs */}
    <div className="absolute top-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-nutri-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />

    <div className="text-center relative z-10">
      <div className="w-16 h-16 mx-auto mb-6 bg-white rounded-2xl shadow-xl shadow-nutri-500/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nutri-500 animate-spin" />
      </div>
      <h2 className="font-heading font-bold text-xl text-gray-900 mb-2">NutriSmart</h2>
      <p className="text-gray-400 text-sm font-medium animate-pulse">Carregando sua saúde...</p>
    </div>
  </div>
);

// Main App Content (authenticated)
const AppContent: React.FC = () => {
  const { authUser, profile, signOut, refreshProfile } = useAuth();
  const toast = useToast();
  const [activeItem, setActiveItem] = useState<NavItem>(NavItem.Dashboard);
  const [isLoaded, setIsLoaded] = useState(false);

  // GLOBAL STATE
  const [user, setUser] = useState<User>(DEFAULT_USER);
  const [waterConsumed, setWaterConsumed] = useState(0);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [stats, setStats] = useState<DailyStats>({
    caloriesConsumed: 0,
    caloriesBurned: 0,
    proteinConsumed: 0,
    carbsConsumed: 0,
    fatsConsumed: 0,
    waterConsumed: 0
  });
  const [streak, setStreak] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<{ date: string; stats: DailyStats; achieved: boolean }[]>([]);

  // Level Up Modal state
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);

  // Load data from Supabase on mount
  const loadData = useCallback(async () => {
    if (!authUser) return;

    // Initialize gamification service with user ID
    initGamificationService(authUser.id);

    try {
      const [todayMeals, todayExercises, todayWater, achievements, weekly, streakVal] = await Promise.all([
        db.getTodayMeals(authUser.id),
        db.getTodayExercises(authUser.id),
        db.getTodayWater(authUser.id),
        db.getUnlockedAchievements(authUser.id),
        db.getWeeklyStats(authUser.id),
        db.calculateStreak(authUser.id),
      ]);

      setMeals(todayMeals);
      setExercises(todayExercises);
      setWaterConsumed(todayWater);
      setUnlockedAchievements(achievements);
      setWeeklyStats(weekly);
      setStreak(streakVal);

      // Check and unlock streak-based badges
      checkStreakBadges(streakVal);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [authUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update user from profile
  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile]);

  // Calculate stats whenever meals, exercises or water changes
  useEffect(() => {
    const newStats: DailyStats = {
      caloriesConsumed: meals.reduce((acc, meal) => acc + meal.calories, 0),
      caloriesBurned: exercises.reduce((acc, ex) => acc + ex.caloriesBurned, 0),
      proteinConsumed: meals.reduce((acc, meal) => acc + meal.macros.protein, 0),
      carbsConsumed: meals.reduce((acc, meal) => acc + meal.macros.carbs, 0),
      fatsConsumed: meals.reduce((acc, meal) => acc + meal.macros.fats, 0),
      waterConsumed: waterConsumed
    };
    setStats(newStats);

    // CHECK GAMIFICATION
    if (isLoaded && authUser) {
      const newUnlocked = checkAchievements(user, newStats, meals, exercises, unlockedAchievements);
      if (newUnlocked.length > unlockedAchievements.length) {
        const diff = newUnlocked.filter(x => !unlockedAchievements.includes(x));
        // Unlock new achievements in database
        diff.forEach(achievementId => {
          db.unlockAchievement(authUser.id, achievementId);
        });
        setUnlockedAchievements(newUnlocked);
      }
    }
  }, [meals, exercises, waterConsumed, isLoaded, authUser, user, unlockedAchievements]);

  // Handlers
  const handleUpdateWater = async (amount: number) => {
    if (!authUser) return;

    try {
      const newAmount = await db.updateWaterConsumption(authUser.id, amount);
      setWaterConsumed(newAmount);
      if (amount > 0) {
        toast.success(`+${amount}ml de água adicionados! 💧`);
      }
    } catch (error) {
      toast.error('Erro ao atualizar água');
    }
  };

  const handleAddMeal = async (newMeal: Omit<Meal, 'id'>) => {
    if (!authUser) {
      console.error('handleAddMeal: No authenticated user');
      toast.error('Você precisa estar logado para salvar refeições');
      return;
    }

    console.log('handleAddMeal: Saving meal...', {
      name: newMeal.name,
      type: newMeal.type,
      calories: newMeal.calories
    });

    try {
      const savedMeal = await db.addMeal(authUser.id, newMeal);

      if (savedMeal) {
        console.log('handleAddMeal: Meal saved successfully', savedMeal.id);
        setMeals(prev => [savedMeal, ...prev]);
        setActiveItem(NavItem.Dashboard);

        // Award XP for registering meal
        const xpResult = addXP(XP_TABLE.registerMeal, 'registerMeal');
        if (xpResult.leveledUp) {
          setNewLevel(xpResult.newLevel);
          setShowLevelUp(true);
        }

        // Update weekly challenge progress (meals type)
        updateChallengeProgress(1);

        toast.success(`Refeição registrada! +${XP_TABLE.registerMeal} XP 🍽️`);
      } else {
        // savedMeal is null - database returned error
        console.error('handleAddMeal: db.addMeal returned null');
        toast.error('Não foi possível salvar a refeição. Verifique os dados e tente novamente.');
        throw new Error('Failed to save meal - database returned null');
      }
    } catch (error) {
      console.error('handleAddMeal: Error saving meal:', error);
      toast.error('Erro ao salvar refeição. Tente novamente.');
      throw error; // Re-throw para que o RegisterMeal.tsx saiba que falhou
    }
  };

  const handleUpdateMeal = async (updatedMeal: Meal) => {
    console.log('handleUpdateMeal: Updating meal...', updatedMeal.id);

    try {
      const success = await db.updateMeal(updatedMeal.id, updatedMeal);
      if (success) {
        console.log('handleUpdateMeal: Meal updated successfully');
        setMeals(prev => prev.map(meal => meal.id === updatedMeal.id ? updatedMeal : meal));
        toast.success('Refeição atualizada com sucesso!');
        setActiveItem(NavItem.Dashboard);
      } else {
        console.error('handleUpdateMeal: db.updateMeal returned false');
        toast.error('Não foi possível atualizar a refeição.');
        throw new Error('Failed to update meal');
      }
    } catch (error) {
      console.error('handleUpdateMeal: Error updating meal:', error);
      toast.error('Erro ao atualizar refeição. Tente novamente.');
      throw error;
    }
  };

  const handleAddExercise = async (newExercise: Omit<Exercise, 'id'>) => {
    if (!authUser) return;

    try {
      const savedExercise = await db.addExercise(authUser.id, newExercise);
      if (savedExercise) {
        setExercises(prev => [savedExercise, ...prev]);
        setActiveItem(NavItem.Dashboard);

        // Award XP for registering exercise
        const xpResult = addXP(XP_TABLE.registerExercise, 'registerExercise');
        if (xpResult.leveledUp) {
          setNewLevel(xpResult.newLevel);
          setShowLevelUp(true);
        }

        // Update weekly challenge progress (exercise type)
        updateChallengeProgress(1);

        toast.success(`Exercício registrado! +${XP_TABLE.registerExercise} XP 🏋️`);
      }
    } catch (error) {
      toast.error('Erro ao salvar exercício');
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!authUser) return;

    const success = await db.updateProfile(authUser.id, updatedUser);
    if (success) {
      setUser(updatedUser);
      await refreshProfile();
      alert("Perfil atualizado com sucesso!");
      setActiveItem(NavItem.Dashboard);
    }
  };

  const renderContent = () => {
    switch (activeItem) {
      case NavItem.Dashboard:
        return (
          <Dashboard
            user={user}
            stats={stats}
            updateWater={handleUpdateWater}
            recentMeals={meals.slice(0, 3)}
            recentExercises={exercises.slice(0, 3)}
            onNavigate={setActiveItem}
            streak={streak}
            weeklyStats={weeklyStats}
          />
        );
      case NavItem.RegisterMeal:
        return <RegisterMeal onSave={handleAddMeal} onUpdate={handleUpdateMeal} history={meals} />;
      case NavItem.RegisterExercise:
        return <RegisterExercise user={user} onSave={handleAddExercise} />;
      case NavItem.Recipes:
        return <Recipes />;
      case NavItem.MealPlanner:
        return <MealPlanner user={user} />;
      case NavItem.Planning:
        return <Planning user={user} />;
      case NavItem.Progress:
        return <Progress weightHistory={[{ day: 'Hoje', weight: user.weight || 0 }]} />;
      case NavItem.Assistant:
        return <AiAssistant user={user} stats={stats} recentMeals={meals} />;
      case NavItem.Awards:
        return <Awards unlockedIds={unlockedAchievements} />;
      case NavItem.Notifications:
        return <Notifications />;
      case NavItem.Plans:
        return <Plans />;
      case NavItem.Profile:
        return <Profile user={user} onUpdate={handleUpdateUser} onSignOut={signOut} />;
      default:
        return <Dashboard user={user} stats={stats} updateWater={handleUpdateWater} recentMeals={meals} recentExercises={exercises} onNavigate={setActiveItem} streak={streak} weeklyStats={weeklyStats} />;
    }
  };

  // Check if user needs onboarding
  const needsOnboarding = profile && !profile.onboardingCompleted;

  // Handle onboarding completion
  const handleOnboardingComplete = async (data: OnboardingData) => {
    if (!authUser) return;

    const success = await db.completeOnboarding(authUser.id, {
      weight: data.weight,
      height: data.height,
      age: data.age,
      gender: data.gender,
      goal: data.goal,
      activityLevel: data.activityLevel,
      dailyCalorieGoal: data.dailyCalorieGoal,
      dailyWaterGoal: data.dailyWaterGoal,
      macros: data.macros,
    });

    if (success) {
      toast.success('Bem-vindo ao NutriSmart! 🎉');
      await refreshProfile();
    }
  };

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  // Show onboarding for new users
  if (needsOnboarding) {
    return (
      <Onboarding
        userName={profile?.name || 'Usuário'}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <AppLayout currentPath={activeItem} onNavigate={setActiveItem}>
      {renderContent()}
      <AIChat user={user} stats={stats} meals={meals} />
      <LevelUpModal
        isOpen={showLevelUp}
        newLevel={newLevel}
        onClose={() => setShowLevelUp(false)}
      />
    </AppLayout>
  );
};

// Root App with Auth
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

// Wrapper to handle auth state
const AuthenticatedApp: React.FC = () => {
  const { authUser, loading, signIn, signUp } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authUser) {
    return <AuthPage onSignIn={signIn} onSignUp={signUp} />;
  }

  return <AppContent />;
};

export default App;