/**
 * Chat Service
 * Manages chat history with Supabase + localStorage fallback
 */

import { User, DailyStats, Meal } from '../types';
import * as db from './databaseService';

// Chat message type
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// Chat context for AI
export interface ChatContext {
    user: User;
    stats: DailyStats;
    recentMeals: Meal[];
}

// Storage keys
const CHAT_HISTORY_KEY = 'nutrismart-chat-history';
const MAX_MESSAGES = 50;
const CONTEXT_MESSAGES = 5;

// ============================================
// HYBRID STORAGE (Supabase + localStorage)
// ============================================

let cachedMessages: ChatMessage[] | null = null;
let currentUserId: string | null = null;

// Initialize chat service with user ID
export function initChatService(userId: string): void {
    currentUserId = userId;
    cachedMessages = null;
}

// Get chat history (from Supabase or localStorage fallback)
export async function getChatHistoryAsync(userId?: string): Promise<ChatMessage[]> {
    const uid = userId || currentUserId;

    if (uid) {
        try {
            const dbMessages = await db.getChatHistory(uid, MAX_MESSAGES);
            cachedMessages = dbMessages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.created_at),
            }));
            // Sync to localStorage for offline
            saveChatHistoryLocal(cachedMessages);
            return cachedMessages;
        } catch (error) {
            console.warn('Failed to fetch from Supabase, using localStorage:', error);
        }
    }

    // Fallback to localStorage
    return getChatHistoryLocal();
}

// Sync version for initial render (uses cache or localStorage)
export function getChatHistory(): ChatMessage[] {
    if (cachedMessages) return cachedMessages;
    return getChatHistoryLocal();
}

// Add a message (to Supabase and localStorage)
export async function addMessageAsync(
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
    userId?: string
): Promise<ChatMessage> {
    const uid = userId || currentUserId;
    const timestamp = new Date();

    // Create local message first for immediate UI update
    const localMessage: ChatMessage = {
        id: crypto.randomUUID(),
        ...message,
        timestamp,
    };

    // Update local cache
    if (!cachedMessages) cachedMessages = getChatHistoryLocal();
    cachedMessages.push(localMessage);
    saveChatHistoryLocal(cachedMessages);

    // Save to Supabase in background
    if (uid) {
        try {
            const saved = await db.addChatMessage(uid, message.role, message.content);
            if (saved) {
                // Update local message with server ID
                localMessage.id = saved.id;
            }
        } catch (error) {
            console.warn('Failed to save to Supabase:', error);
        }
    }

    return localMessage;
}

// Sync version for backward compatibility (adds to localStorage only)
export function addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMessage: ChatMessage = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
    };

    const history = getChatHistoryLocal();
    history.push(newMessage);
    saveChatHistoryLocal(history);

    // Update cache
    if (cachedMessages) {
        cachedMessages.push(newMessage);
    }

    // Fire and forget Supabase save
    if (currentUserId) {
        db.addChatMessage(currentUserId, message.role, message.content).catch(() => { });
    }

    return newMessage;
}

// Clear chat history (from both Supabase and localStorage)
export async function clearChatHistoryAsync(userId?: string): Promise<void> {
    const uid = userId || currentUserId;

    // Clear localStorage
    localStorage.removeItem(CHAT_HISTORY_KEY);
    cachedMessages = [];

    // Clear Supabase
    if (uid) {
        try {
            await db.clearChatHistory(uid);
        } catch (error) {
            console.warn('Failed to clear Supabase history:', error);
        }
    }
}

// Sync version for backward compatibility
export function clearChatHistory(): void {
    localStorage.removeItem(CHAT_HISTORY_KEY);
    cachedMessages = [];

    // Fire and forget Supabase clear
    if (currentUserId) {
        db.clearChatHistory(currentUserId).catch(() => { });
    }
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

function getChatHistoryLocal(): ChatMessage[] {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) return [];

    try {
        const messages = JSON.parse(stored);
        return messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
        }));
    } catch {
        return [];
    }
}

function saveChatHistoryLocal(messages: ChatMessage[]): void {
    const trimmed = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
}

// ============================================
// CONTEXT HELPERS
// ============================================

// Get last N messages for context
export function getContextMessages(): ChatMessage[] {
    const history = getChatHistory();
    return history.slice(-CONTEXT_MESSAGES);
}

// Format messages for AI context
export function formatMessagesForAI(messages: ChatMessage[]): string {
    return messages
        .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
        .join('\n');
}

// Quick suggestions based on time of day
export function getQuickSuggestions(): string[] {
    const hour = new Date().getHours();

    const baseSuggestions = [
        'O que posso comer agora?',
        'Analise meu dia de hoje',
        'Dicas para emagrecer',
    ];

    if (hour >= 6 && hour < 10) {
        return ['Sugestão de café da manhã', ...baseSuggestions];
    } else if (hour >= 11 && hour < 14) {
        return ['Sugestão de almoço saudável', ...baseSuggestions];
    } else if (hour >= 14 && hour < 18) {
        return ['Sugestão de lanche', ...baseSuggestions];
    } else if (hour >= 18 && hour < 22) {
        return ['Sugestão de jantar leve', ...baseSuggestions];
    }

    return baseSuggestions;
}
