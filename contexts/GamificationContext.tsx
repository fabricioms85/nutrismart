import React, { createContext, useContext, useState, useEffect } from 'react';
import * as gamificationService from '../services/gamificationService';
import { useAuth } from './AuthContext';
import { Achievement, Challenge, DailyStats } from '../types';

interface GamificationContextType {
    xp: number;
    level: number;
    streak: number;
    badges: string[]; // Access to badge IDs or objects
    achievements: Achievement[]; // All potential achievements
    unlockedAchievements: string[]; // IDs of unlocked ones
    activeChallenge: Challenge | null;
    weeklyStats: { date: string; stats: DailyStats; achieved: boolean }[];
    refreshGamification: () => Promise<void>;
    awardXP: (amount: number, reason: string) => Promise<void>;
    checkAchievements: (stats: any) => Promise<void>; // Pass stats or other criteria
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { authUser } = useAuth();
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);
    const [badges, setBadges] = useState<string[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [weeklyStats, setWeeklyStats] = useState<{ date: string; stats: DailyStats; achieved: boolean }[]>([]);

    const refreshGamification = async () => {
        if (!authUser) return;
        try {
            let progress = await gamificationService.getUserProgress(authUser.id);

            if (!progress) {
                await gamificationService.initializeUserProgress(authUser.id);
                progress = await gamificationService.getUserProgress(authUser.id);
            }

            if (progress) {
                setXp(progress.xp);
                setLevel(progress.level);
                setStreak(progress.streak);
            }

            const userBadges = await gamificationService.getUserBadges(authUser.id);
            // Badges now returns objects {id, earnedAt}, extracting IDs for unlockedAchievements compat
            const badgeIds = userBadges.map(b => b.id);
            setBadges(badgeIds);
            setUnlockedAchievements(badgeIds);

            const allAchievements = await gamificationService.getAllAchievements();
            setAchievements(allAchievements);

            const challenge = await gamificationService.getActiveChallenge(authUser.id);
            setActiveChallenge(challenge);

            const fetchedWeeklyStats = await gamificationService.getWeeklyStats(authUser.id);
            setWeeklyStats(fetchedWeeklyStats);
            setStreak(gamificationService.computeStreakFromWeeklyStats(fetchedWeeklyStats));

        } catch (error) {
            console.error("Failed to refresh gamification data", error);
        }
    };

    useEffect(() => {
        refreshGamification();
    }, [authUser]);

    const awardXP = async (amount: number, reason: string) => {
        if (!authUser) return;
        await gamificationService.addXP(authUser.id, amount, reason);
        await refreshGamification();
    };

    const checkAchievements = async (metricData: any) => {
        if (!authUser) return;
        const newUnlocks = await gamificationService.checkAchievements(authUser.id, metricData);
        if (newUnlocks && newUnlocks.length > 0) {
            await refreshGamification();
            // Potentially trigger a toast or modal here?
            // For now, we update the state.
        }
    };

    return (
        <GamificationContext.Provider value={{
            xp,
            level,
            streak,
            badges,
            achievements,
            unlockedAchievements,
            activeChallenge,
            weeklyStats,
            refreshGamification,
            awardXP,
            checkAchievements
        }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};
