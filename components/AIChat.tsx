import React, { useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { User, DailyStats, Meal, NavItem } from '../types';
import NutriAIChatContent from './NutriAIChatContent';

interface AIChatProps {
  user: User;
  stats: DailyStats;
  meals: Meal[];
  currentPath?: NavItem;
}

const AIChat: React.FC<AIChatProps> = ({ user, stats, meals, currentPath }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const showFab = currentPath !== NavItem.Assistant;

  return (
    <>
      {showFab && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 bg-gradient-to-br from-nutri-500 to-nutri-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`}
          aria-label="Abrir chat com IA"
        >
          <MessageCircle size={24} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-solar-500 rounded-full animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full md:w-[420px] h-[85vh] md:h-[600px] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            <NutriAIChatContent
              user={user}
              stats={stats}
              meals={meals}
              variant="panel"
              onClose={() => setIsOpen(false)}
              onClear={() => {}}
              inputRef={inputRef}
              autoFocus={isOpen}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
