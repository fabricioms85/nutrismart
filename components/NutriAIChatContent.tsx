import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Sparkles, Trash2, Bot } from 'lucide-react';
import { User, DailyStats, Meal } from '../types';
import { generateChatResponse } from '../services/geminiService';
import { getLocalDateString } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import {
  ChatMessage,
  getChatHistory,
  getChatHistoryAsync,
  addMessage,
  clearChatHistory,
  getContextMessages,
  formatMessagesForAI,
  getQuickSuggestions,
  initChatService,
} from '../services/chatService';

export interface NutriAIChatContentProps {
  user: User;
  stats: DailyStats;
  meals: Meal[];
  variant: 'page' | 'panel';
  onClose?: () => void;
  onClear?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
}

const NutriAIChatContent: React.FC<NutriAIChatContentProps> = ({
  user,
  stats,
  meals,
  variant,
  onClose,
  onClear,
  inputRef: externalInputRef,
  autoFocus = false,
}) => {
  const { authUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;

  useEffect(() => {
    if (authUser?.id) {
      initChatService(authUser.id);
      setMessages(getChatHistory());
      getChatHistoryAsync(authUser.id).then((msgs) => setMessages(msgs));
    } else {
      setMessages(getChatHistory());
    }
  }, [authUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus, inputRef]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    setShowSuggestions(false);
    setInput('');

    const userMessage = addMessage({ role: 'user', content: content.trim() });
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const contextMessages = getContextMessages();
      const historyText = formatMessagesForAI(contextMessages);
      const today = getLocalDateString();
      const todayMeals = meals.filter((m) => m.date === today || !m.date);

      const response = await generateChatResponse(content, historyText, {
        user,
        stats,
        recentMeals: todayMeals,
      });

      const assistantMessage = addMessage({ role: 'assistant', content: response });
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = addMessage({
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente! 🙏',
      });
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClearHistory = () => {
    clearChatHistory();
    setMessages([]);
    setShowSuggestions(true);
    onClear?.();
  };

  const suggestions = getQuickSuggestions();

  const isPanel = variant === 'panel';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      {isPanel ? (
        <div className="bg-gradient-to-r from-nutri-500 to-nutri-600 p-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-bold">NutriAI</h2>
              <p className="text-xs text-white/80">Sua assistente de nutrição</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Limpar histórico"
              >
                <Trash2 size={18} />
              </button>
            )}
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-nutri-50/30 flex-shrink-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-nutri-500 to-nutri-600 shadow-sm relative">
            <Bot size={20} />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
              <Sparkles size={12} className="text-yellow-500 fill-yellow-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900">NutriAI</h2>
              <span className="px-1.5 py-0.5 bg-nutri-100 text-nutri-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                IA
              </span>
            </div>
            <p className="text-xs text-nutri-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-nutri-500 rounded-full animate-pulse" />
              Conectado aos seus dados
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-nutri-100 to-nutri-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-nutri-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Olá, {user.name}! 👋</h3>
            <p className="text-gray-500 text-sm max-w-[280px] mx-auto">
              Sou a NutriAI, sua assistente de nutrição. Pergunte sobre dietas, alimentos ou peça sugestões!
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-nutri-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p
                className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}
              >
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Digitando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length < 2 && (
        <div className="px-4 py-2 bg-white border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400 mb-2">Sugestões:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => sendMessage(suggestion)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-nutri-50 text-gray-700 text-xs rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nutri-500/50"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-nutri-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-nutri-600 transition-colors"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        {!isPanel && (
          <p className="text-[10px] text-center text-gray-400 mt-2">
            O assistente tem acesso às suas refeições e metas de hoje. Respostas geradas por IA.
          </p>
        )}
      </div>
    </div>
  );
};

export default NutriAIChatContent;
