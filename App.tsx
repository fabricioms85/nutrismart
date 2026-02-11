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
import ShoppingListPage from './pages/ShoppingListPage';
import Profile from './pages/Profile';
import AuthPage from './pages/AuthPage';
import Onboarding, { OnboardingData } from './pages/Onboarding';
import AIChat from './components/AIChat';
import LevelUpModal from './components/LevelUpModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NutritionProvider, useNutrition } from './contexts/NutritionContext';
import { GamificationProvider, useGamification } from './contexts/GamificationContext';
import { useToast } from './contexts/ToastContext';
import { NavItem, User, DailyStats, Meal, Exercise } from './types';
import * as profileService from './services/profileService';
import { XP_VALUES } from './services/gamificationService';
import { initializeNotifications } from './services/notificationService';

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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-x-hidden max-w-[100vw]">
      <Sidebar
        activeItem={currentPath}
        onNavigate={onNavigate}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen transition-all duration-500 ease-in-out overflow-x-hidden min-w-0">
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

        <main className="flex-1 relative overflow-y-auto w-full overflow-x-hidden">
          {/* Background Blobs for Pages - Contained to prevent overflow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-nutri-50/50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-50/50 rounded-full mix-blend-multiply filter blur-3xl opacity-40 translate-y-1/3 -translate-x-1/3" />
          </div>

          <div className="relative z-10 w-full max-w-full overflow-x-hidden">
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
// Main App Content (authenticated)
const AppContent: React.FC = () => {
  const { authUser, profile, signOut, refreshProfile } = useAuth();
  const { meals, exercises, stats, addMeal, updateMeal, deleteMeal, addExercise, updateExercise, deleteExercise, addWater } = useNutrition();
  const { xp, level, streak, badges: unlockedAchievements, weeklyStats, awardXP, showLevelUp, setShowLevelUp, newLevel } = useGamification();

  const toast = useToast();
  const [activeItem, setActiveItem] = useState<NavItem>(NavItem.Dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Derive display user from profile or default
  const user = profile || DEFAULT_USER;

  // Initialize notifications on mount
  useEffect(() => {
    console.log("AppContent mounted, initializing...");
    if (profile) {
      try {
        initializeNotifications(
          (profile.isClinicalMode && profile.clinicalSettings)
            ? profile.clinicalSettings
            : undefined
        );
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    }
  }, [profile]);

  // Handlers
  const handleUpdateWater = async (amount: number) => {
    try {
      await addWater(amount);
      if (amount > 0) {
        toast.success(`+${amount}ml de água adicionados! 💧`);
      }
    } catch (error) {
      toast.error('Erro ao atualizar água');
    }
  };

  const handleAddMeal = async (newMeal: Omit<Meal, 'id'>) => {
    try {
      await addMeal(newMeal);
      setActiveItem(NavItem.Dashboard);

      // Award XP
      await awardXP(XP_VALUES.LOG_MEAL, 'registerMeal');
      toast.success(`Refeição registrada! +${XP_VALUES.LOG_MEAL} XP 🍽️`);
    } catch (error) {
      console.error('handleAddMeal: Error saving meal:', error);
      toast.error('Erro ao salvar refeição. Tente novamente.');
    }
  };

  const handleUpdateMeal = async (updatedMeal: Meal) => {
    try {
      console.log('[handleUpdateMeal] Atualizando refeição:', updatedMeal.id, {
        name: updatedMeal.name,
        calories: updatedMeal.calories,
        protein: updatedMeal.macros?.protein,
        carbs: updatedMeal.macros?.carbs,
        fats: updatedMeal.macros?.fats,
        ingredientsCount: updatedMeal.ingredients?.length,
      });
      await updateMeal(updatedMeal.id, updatedMeal);
      toast.success('Refeição atualizada com sucesso!');
    } catch (error) {
      console.error('[handleUpdateMeal] Erro:', error);
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar refeição: ${msg}`);
      throw error; // Re-lança para que o RegisterMeal saiba que falhou e NÃO resete o form
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      await deleteMeal(mealId);
      toast.success('Refeição removida.');
    } catch (error) {
      toast.error('Erro ao remover refeição.');
    }
  };

  const handleAddExercise = async (newExercise: Omit<Exercise, 'id'>) => {
    try {
      await addExercise(newExercise);

      // Award XP
      await awardXP(XP_VALUES.LOG_EXERCISE, 'registerExercise');
      toast.success(`Exercício registrado! +${XP_VALUES.LOG_EXERCISE} XP 🏋️`);
    } catch (error) {
      toast.error('Erro ao salvar exercício');
    }
  };

  const handleUpdateExercise = async (updatedExercise: Exercise) => {
    try {
      await updateExercise(updatedExercise.id, updatedExercise);
      toast.success('Exercício atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar exercício');
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      await deleteExercise(exerciseId);
      toast.success('Exercício removido.');
    } catch (error) {
      toast.error('Erro ao remover exercício.');
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!authUser) return;
    try {
      await profileService.updateProfile(authUser.id, updatedUser);
      await refreshProfile();
      alert("Perfil atualizado com sucesso!");
      setActiveItem(NavItem.Dashboard);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Erro ao atualizar perfil.");
    }
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    if (!authUser) return;
    try {
      await profileService.updateProfile(authUser.id, {
        ...profile,
        ...data,
        onboardingCompleted: true
      });
      toast.success('Bem-vindo ao NutriSmart! 🎉');
      await refreshProfile();
    } catch (e) {
      console.error("Onboarding error", e);
      toast.error("Erro ao salvar dados de onboarding");
    }
  };

  // Check if user needs onboarding
  const needsOnboarding = profile && !profile.onboardingCompleted;

  if (needsOnboarding) {
    return (
      <Onboarding
        userName={profile?.name || 'Usuário'}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  const renderContent = () => {
    switch (activeItem) {
      case NavItem.Dashboard:
        return (
          <Dashboard
            user={user}
            userId={authUser?.id || ''}
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
        return <RegisterMeal onSave={handleAddMeal} onUpdate={handleUpdateMeal} onDelete={handleDeleteMeal} />;
      case NavItem.RegisterExercise:
        return <RegisterExercise user={user} onSave={handleAddExercise} onUpdate={handleUpdateExercise} onDelete={handleDeleteExercise} />;
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
        return (
          <Notifications
            isClinicalMode={user.isClinicalMode}
            clinicalSettings={user.clinicalSettings}
          />
        );
      case NavItem.ShoppingList:
        return (
          <ShoppingListPage
            onBack={() => setActiveItem(NavItem.MealPlanner)}
          />
        );
      case NavItem.Plans:
        return <Plans />;
      case NavItem.Profile:
        return (
          <Profile
            user={user}
            onUpdate={handleUpdateUser}
            onSignOut={signOut}
            onToggleClinicalMode={async (enabled) => {
              if (!authUser) return;
              await profileService.updateProfile(authUser.id, { isClinicalMode: enabled });
              await refreshProfile();
            }}
          />
        );
      default:
        return <Dashboard user={user} userId={authUser?.id || ''} stats={stats} updateWater={handleUpdateWater} recentMeals={meals} recentExercises={exercises} onNavigate={setActiveItem} streak={streak} weeklyStats={weeklyStats} />;
    }
  };

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
      <NutritionProvider>
        <GamificationProvider>
          <AuthenticatedApp />
        </GamificationProvider>
      </NutritionProvider>
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