import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User as AuthUser, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { signIn, signUp, signOut, onAuthStateChange } from '../services/authService';
import { getProfile } from '../services/databaseService';
import type { User } from '../types';

interface AuthContextType {
    authUser: AuthUser | null;
    session: Session | null;
    profile: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        if (!authUser) {
            setProfile(null);
            return;
        }

        const userProfile = await getProfile(authUser.id);
        setProfile(userProfile);
    }, [authUser]);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setAuthUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = onAuthStateChange((_event, session) => {
            setSession(session);
            setAuthUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load profile when auth user changes
    useEffect(() => {
        if (authUser) {
            refreshProfile();
        } else {
            setProfile(null);
        }
    }, [authUser, refreshProfile]);

    const handleSignIn = async (email: string, password: string) => {
        setLoading(true);
        try {
            await signIn(email, password);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (email: string, password: string, name: string) => {
        setLoading(true);
        try {
            await signUp(email, password, name);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await signOut();
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const value = {
        authUser,
        session,
        profile,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
