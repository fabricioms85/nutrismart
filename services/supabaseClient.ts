import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper types for database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          daily_calorie_goal: number;
          daily_water_goal: number;
          weight: number | null;
          height: number | null;
          age: number | null;
          goal: string | null;
          activity_level: string | null;
          macro_protein: number;
          macro_carbs: number;
          macro_fats: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          time: string;
          date: string;
          calories: number;
          weight_grams: number | null;
          macro_protein: number;
          macro_carbs: number;
          macro_fats: number;
          ingredients: { name: string; quantity: string; unit: string }[];
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['meals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['meals']['Insert']>;
      };
      exercises: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          duration_minutes: number;
          calories_burned: number;
          intensity: string | null;
          time: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          water_consumed: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_logs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['daily_logs']['Insert']>;
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>;
      };
      weight_history: {
        Row: {
          id: string;
          user_id: string;
          weight: number;
          date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['weight_history']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['weight_history']['Insert']>;
      };
    };
  };
};
