-- =====================================================
-- Add preference: sum exercise calories to remaining (none / half / full)
-- Run in Supabase SQL Editor if using hosted Supabase
-- =====================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS add_exercise_calories_to_remaining TEXT DEFAULT NULL;

COMMENT ON COLUMN profiles.add_exercise_calories_to_remaining IS 'none = do not add, half = 50% of burned, full = 100%';
