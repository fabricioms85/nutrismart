/**
 * Notification Service
 * Handles browser push notifications, scheduling, and celebration alerts
 */

export interface NotificationSettings {
    water: { enabled: boolean; intervalMinutes: number };
    meals: { enabled: boolean; times: string[] }; // Array of HH:MM times
    workout: { enabled: boolean; time: string }; // HH:MM time
    achievements: boolean;
}

export interface ScheduledNotification {
    id: string;
    type: 'water' | 'meal' | 'workout' | 'achievement' | 'celebration';
    title: string;
    body: string;
    scheduledTime: number; // timestamp
    recurring?: boolean;
}

const STORAGE_KEY = 'nutrismart_notifications';
const NOTIFICATION_PERMISSION_KEY = 'nutrismart_notification_permission';

// Default settings
const DEFAULT_SETTINGS: NotificationSettings = {
    water: { enabled: true, intervalMinutes: 120 }, // Every 2 hours
    meals: {
        enabled: true,
        times: ['07:00', '12:00', '19:00'] // Breakfast, Lunch, Dinner
    },
    workout: { enabled: false, time: '18:00' },
    achievements: true,
};

// Check if notifications are supported
export function isNotificationSupported(): boolean {
    return 'Notification' in window;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isNotificationSupported()) {
        console.warn('Notifications not supported');
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
    return permission;
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
    if (!isNotificationSupported()) return 'denied';
    return Notification.permission;
}

// Get settings from localStorage
export function getNotificationSettings(): NotificationSettings {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch {
            return DEFAULT_SETTINGS;
        }
    }
    return DEFAULT_SETTINGS;
}

// Save settings to localStorage
export function saveNotificationSettings(settings: NotificationSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Reschedule notifications when settings change
    scheduleNotifications(settings);
}

// Send a notification immediately
export function sendNotification(
    title: string,
    body: string,
    options?: { icon?: string; tag?: string; requireInteraction?: boolean }
): void {
    if (getNotificationPermission() !== 'granted') {
        console.warn('Notification permission not granted');
        return;
    }

    const notification = new Notification(title, {
        body,
        icon: options?.icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: options?.tag,
        requireInteraction: options?.requireInteraction || false,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
}

// Celebration notification when goal is achieved
export function celebrateGoalAchieved(goalType: 'calories' | 'water' | 'protein' | 'streak'): void {
    const messages: Record<string, { title: string; body: string }> = {
        calories: {
            title: '🎉 Meta de Calorias Atingida!',
            body: 'Parabéns! Você atingiu sua meta calórica de hoje!',
        },
        water: {
            title: '💧 Meta de Água Completa!',
            body: 'Excelente! Você bebeu toda a água de hoje!',
        },
        protein: {
            title: '💪 Meta de Proteína Atingida!',
            body: 'Ótimo trabalho! Sua proteína diária está completa!',
        },
        streak: {
            title: '🔥 Sequência em Chamas!',
            body: 'Você está arrasando! Continue assim!',
        },
    };

    const msg = messages[goalType];
    if (msg) {
        sendNotification(msg.title, msg.body, { tag: `celebration-${goalType}` });
    }
}

// Water reminder notification
export function sendWaterReminder(): void {
    const messages = [
        'Hora de beber água! 💧',
        'Não esqueça de se hidratar! 💦',
        'Que tal um copo de água agora? 🥤',
        'Mantenha-se hidratado! 💧',
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    sendNotification('Lembrete de Hidratação', randomMsg, {
        tag: 'water-reminder',
        requireInteraction: false
    });
}

// Meal reminder notification
export function sendMealReminder(mealType: 'breakfast' | 'lunch' | 'dinner'): void {
    const meals: Record<string, { title: string; body: string }> = {
        breakfast: {
            title: '🌅 Hora do Café da Manhã!',
            body: 'Comece o dia com energia. Registre seu café!',
        },
        lunch: {
            title: '🍽️ Hora do Almoço!',
            body: 'Hora de fazer uma pausa e se alimentar bem.',
        },
        dinner: {
            title: '🌙 Hora do Jantar!',
            body: 'Finalize o dia com uma refeição equilibrada.',
        },
    };

    const meal = meals[mealType];
    if (meal) {
        sendNotification(meal.title, meal.body, { tag: `meal-${mealType}` });
    }
}

// Workout reminder notification
export function sendWorkoutReminder(): void {
    sendNotification(
        '🏋️ Hora de Treinar!',
        'Seu corpo agradece cada movimento. Vamos lá!',
        { tag: 'workout-reminder' }
    );
}

// Store for scheduled intervals
const scheduledIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

// Clear all scheduled notifications
function clearAllScheduledNotifications(): void {
    scheduledIntervals.forEach((interval) => clearInterval(interval));
    scheduledIntervals.clear();
}

// Schedule notifications based on settings
export function scheduleNotifications(settings: NotificationSettings): void {
    // Clear existing schedules
    clearAllScheduledNotifications();

    // Water reminders
    if (settings.water.enabled) {
        const intervalMs = settings.water.intervalMinutes * 60 * 1000;
        const waterInterval = setInterval(() => {
            // Only send during waking hours (7am - 10pm)
            const hour = new Date().getHours();
            if (hour >= 7 && hour <= 22) {
                sendWaterReminder();
            }
        }, intervalMs);
        scheduledIntervals.set('water', waterInterval);
    }

    // Meal reminders - schedule for specific times
    if (settings.meals.enabled) {
        settings.meals.times.forEach((time, index) => {
            const mealTypes: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];
            const mealType = mealTypes[index] || 'lunch';

            scheduleAtTime(time, () => sendMealReminder(mealType), `meal-${mealType}`);
        });
    }

    // Workout reminder
    if (settings.workout.enabled) {
        scheduleAtTime(settings.workout.time, sendWorkoutReminder, 'workout');
    }
}

// Schedule a notification at a specific time (HH:MM)
function scheduleAtTime(time: string, callback: () => void, id: string): void {
    const [hours, minutes] = time.split(':').map(Number);

    const checkInterval = setInterval(() => {
        const now = new Date();
        if (now.getHours() === hours && now.getMinutes() === minutes) {
            callback();
        }
    }, 60000); // Check every minute

    scheduledIntervals.set(id, checkInterval);
}

// Initialize notification system
export function initializeNotifications(): void {
    const settings = getNotificationSettings();

    // Only schedule if permission is granted
    if (getNotificationPermission() === 'granted') {
        scheduleNotifications(settings);
    }
}

// Check goal completion and send celebration
export function checkAndCelebrate(
    type: 'calories' | 'water',
    current: number,
    goal: number,
    _previouslyCompleted: boolean
): boolean {
    const isComplete = current >= goal;
    const settings = getNotificationSettings();

    if (isComplete && settings.achievements) {
        celebrateGoalAchieved(type);
        return true;
    }

    return isComplete;
}
