import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { generateNutritionAdvice } from '../services/geminiService';
import { User, DailyStats, Meal } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface AiAssistantProps {
  user?: User;
  stats?: DailyStats;
  recentMeals?: Meal[];
}

const AiAssistant: React.FC<AiAssistantProps> = ({ user, stats, recentMeals }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: `Olá ${user?.name.split(' ')[0] || ''}! Sou seu assistente nutricional NutriSmart. Analisei seus dados de hoje. Como posso te ajudar a atingir sua meta de ${user?.dailyCalorieGoal} kcal?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass the context if available
      const context = user && stats && recentMeals ? { user, stats, recentMeals } : undefined;
      const responseText = await generateNutritionAdvice(userMessage.text, context);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseText
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "Desculpe, tive um problema ao processar. Tente novamente."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-nutri-50/30">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-nutri-500 to-nutri-600 shadow-sm relative">
            <Bot size={20} />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
               <Sparkles size={12} className="text-yellow-500 fill-yellow-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900">Assistente NutriSmart</h2>
              <span className="px-1.5 py-0.5 bg-nutri-100 text-nutri-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                IA
              </span>
            </div>
            <p className="text-xs text-nutri-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-nutri-500 rounded-full animate-pulse"></span>
              Conectado aos seus dados
            </p>
          </div>
        </div>

        {/* Disclaimer IA */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
          <p className="text-[10px] text-amber-700 text-center leading-tight">
            As respostas são geradas por inteligência artificial e podem conter imprecisões.
            Não substitui orientação de um profissional de saúde.
          </p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-100 text-gray-600' : 'bg-nutri-100 text-nutri-600'}`}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-gray-900 text-white rounded-tr-sm' 
                  : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
              }`}>
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                ))}
                {msg.role === 'assistant' && (
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <Sparkles size={10} className="text-gray-300" />
                    Gerado por IA
                  </p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-nutri-100 text-nutri-600 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 border border-gray-100 shadow-sm">
                <Loader2 size={16} className="animate-spin text-nutri-500" />
                <span className="text-xs text-gray-500 font-medium">Analisando seu contexto...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ex: Quantas calorias ainda posso comer hoje?"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-nutri-500 focus:ring-1 focus:ring-nutri-500 transition bg-white"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-nutri-500 to-nutri-600 text-white px-4 rounded-xl hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center transform active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2">
            O assistente tem acesso às suas refeições e metas de hoje. Respostas geradas por IA.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;