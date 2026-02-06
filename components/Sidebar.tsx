import React from 'react';
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  ChefHat,
  CalendarDays,
  CalendarCheck,
  TrendingUp,
  Sparkles,
  Trophy,
  Bell,
  CreditCard,
  LogOut,
  ChevronRight,
  Menu
} from 'lucide-react';
import { NavItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavigate, isOpen, setIsOpen }) => {
  const { profile, signOut } = useAuth();

  const menuItems = [
    { id: NavItem.Dashboard, icon: LayoutDashboard, label: 'Dashboard' },
    { id: NavItem.RegisterMeal, icon: Utensils, label: 'Alimentação' },
    { id: NavItem.RegisterExercise, icon: Dumbbell, label: 'Exercícios' },
    { id: NavItem.Recipes, icon: ChefHat, label: 'Receitas' },
    { id: NavItem.MealPlanner, icon: CalendarCheck, label: 'Planejador Semanal' },
    { id: NavItem.Planning, icon: CalendarDays, label: 'Planejamento' },
    { id: NavItem.Progress, icon: TrendingUp, label: 'Progresso' },
  ];

  const secondaryItems = [
    { id: NavItem.Assistant, icon: Sparkles, label: 'Assistente IA' },
    { id: NavItem.Awards, icon: Trophy, label: 'Conquistas' },
    { id: NavItem.Notifications, icon: Bell, label: 'Notificações' },
    { id: NavItem.Plans, icon: CreditCard, label: 'Planos' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = profile?.name || profile?.email?.split('@')[0] || 'Usuário';
  const avatarUrl = profile?.avatar_url;
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar - Floating Card Design */}
      <aside className={`fixed top-4 left-4 z-50 h-[calc(100vh-2rem)] w-72 bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 flex flex-col transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) transform lg:translate-x-0 border border-white/40 ${isOpen ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'}`}>

        {/* Logo Area - Absolute Top */}
        <div className="p-8 pb-4 relative z-10">
          <div className="flex items-center gap-3 mb-8 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-nutri-500 to-nutri-600 shadow-lg shadow-nutri-500/30 transform group-hover:rotate-6 transition-transform duration-500">
              <span className="font-heading font-bold text-xl">N</span>
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-gray-900 leading-none tracking-tight">NutriSmart</h1>
              <p className="text-[10px] font-bold text-nutri-500 tracking-widest uppercase mt-1 bg-nutri-50 inline-block px-2 py-0.5 rounded-full">Premium</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-[#F8FAFC] rounded-[1.5rem] p-3 flex items-center gap-3 border border-transparent hover:border-nutri-100 hover:bg-white hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 cursor-pointer group" onClick={() => onNavigate(NavItem.Profile)}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-10 h-10 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-nutri-600 font-bold shadow-sm border border-gray-100 group-hover:bg-nutri-50 transition-colors">
                {userInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-400 font-medium truncate group-hover:text-nutri-500 transition-colors">Conta Gratuita</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-300 group-hover:text-nutri-500 group-hover:translate-x-1 transition-all shadow-sm">
              <ChevronRight size={14} />
            </div>
          </div>
        </div>

        {/* Scrollable Navigation - Middle */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-8 scrollbar-hide mask-image-b">

          {/* Main Menu */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-4 mb-2">Menu Principal</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsOpen(false);
                  }}
                  className={`relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group overflow-hidden ${isActive
                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/20 scale-[1.02]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-100 z-0"></div>
                  )}
                  <Icon size={20} className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-nutri-400' : 'text-gray-400 group-hover:text-nutri-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="relative z-10 tracking-wide">{item.label}</span>
                  {isActive && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-nutri-400 z-10 animate-pulse" />}
                </button>
              );
            })}
          </div>

          {/* Secondary Menu */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-4 mb-2">Atalhos</p>
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsOpen(false);
                  }}
                  className={`relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group ${isActive
                    ? 'bg-nutri-50 text-nutri-700 shadow-none'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon size={20} className={`transition-colors duration-300 ${isActive ? 'text-nutri-600' : 'text-gray-400 group-hover:text-nutri-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Area - Bottom */}
        <div className="p-6 pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-bold text-red-400 bg-red-50/50 hover:bg-red-50 hover:text-red-500 hover:scale-[1.02] transition-all duration-300"
          >
            <LogOut size={16} />
            <span>Sair da Conta</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;