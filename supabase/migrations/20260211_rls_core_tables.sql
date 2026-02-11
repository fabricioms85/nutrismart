-- =====================================================
-- RLS CORE TABLES - NutriSmart
-- Nota: RLS já está habilitado no Supabase para todas
-- as tabelas listadas. Este arquivo serve como
-- documentação e versionamento das políticas.
-- =====================================================

-- As tabelas abaixo já possuem RLS habilitado:
-- profiles, meals, exercises, daily_logs, weight_history,
-- meal_analysis, user_achievements, clinical_symptoms,
-- user_progress, user_badges, weekly_challenges,
-- meal_plans, chat_history

-- Verificação (rodar se precisar conferir):
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
