import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { User, DailyStats, Meal } from '../types';
import { generateChatResponse } from '../services/geminiService';
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

interface AIChatProps {
    user: User;
    stats: DailyStats;
    meals: Meal[];
}

const AIChat: React.FC<AIChatProps> = ({ user, stats, meals }) => {
    const { authUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize chat service with user ID and load history
    useEffect(() => {
        if (authUser?.id) {
            initChatService(authUser.id);
            // Load from localStorage first for instant display
            setMessages(getChatHistory());
            // Then sync with Supabase
            getChatHistoryAsync(authUser.id).then(msgs => {
                setMessages(msgs);
            });
        } else {
            setMessages(getChatHistory());
        }
    }, [authUser?.id]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        setShowSuggestions(false);
        setInput('');

        // Add user message
        const userMessage = addMessage({ role: 'user', content: content.trim() });
        setMessages(prev => [...prev, userMessage]);

        setIsLoading(true);

        try {
            // Get context for AI
            const contextMessages = getContextMessages();
            const historyText = formatMessagesForAI(contextMessages);

            // Get today's meals
            const today = new Date().toISOString().split('T')[0];
            const todayMeals = meals.filter(m => m.date === today || !m.date);

            // Generate response
            const response = await generateChatResponse(
                content,
                historyText,
                { user, stats, recentMeals: todayMeals }
            );

            // Add assistant message
            const assistantMessage = addMessage({ role: 'assistant', content: response });
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = addMessage({
                role: 'assistant',
                content: 'Desculpe, ocorreu um erro. Tente novamente! 🙏',
            });
            setMessages(prev => [...prev, errorMessage]);
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
    };

    const suggestions = getQuickSuggestions();

    return (
        <>
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 bg-gradient-to-br from-nutri-500 to-nutri-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 ${isOpen ? 'scale-0' : 'scale-100'}`}
                aria-label="Abrir chat com IA"
            >
                <MessageCircle size={24} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-solar-500 rounded-full animate-pulse" />
            </button>

            {/* Chat Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Chat Container */}
                    <div className="relative w-full md:w-[420px] h-[85vh] md:h-[600px] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-nutri-500 to-nutri-600 p-4 flex items-center justify-between text-white">
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
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {/* Welcome message */}
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

                            {/* Message bubbles */}
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user'
                                            ? 'bg-nutri-500 text-white rounded-br-md'
                                            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                                            {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Loading indicator */}
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
                            <div className="px-4 py-2 bg-white border-t border-gray-100">
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
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
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
                                    {isLoading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <Send size={20} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChat;
