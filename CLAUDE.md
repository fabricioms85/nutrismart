# NutriSmart — Contexto para Claude

## O que é

NutriSmart é um SaaS de nutrição inteligente com IA. O usuário tira foto da refeição, a IA (Google Gemini) analisa e retorna calorias/macros automaticamente. Inclui gamificação (XP, badges, streaks), modo clínico para pacientes GLP-1 (Ozempic/Mounjaro), planejamento alimentar por IA e funciona como PWA instalável.

## Stack

- **Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS v4 (CDN) + Recharts + Lucide React
- **Backend:** Serverless function única em `/api/gemini.ts` (Vercel) + Express local (dev)
- **Banco:** Supabase (PostgreSQL + Auth + RLS)
- **IA:** Google Gemini 2.5 Flash (visão/planos) e Flash-Lite (chat/fallback)
- **PWA:** vite-plugin-pwa com Workbox
- **PDF:** jsPDF + jsPDF-autotable (relatórios médicos)
- **Deploy:** Vercel (auto-deploy do GitHub)

## Estrutura principal

```
/api/gemini.ts          → Serverless function (toda IA passa por aqui)
/components/            → Componentes React reutilizáveis
/contexts/              → AuthContext, NutritionContext, GamificationContext, ToastContext
/pages/                 → Dashboard, RegisterMeal, Progress, Awards, Profile, etc.
/services/              → Lógica de negócio (auth, meals, exercises, gamification, etc.)
/data/                  → brazilianIngredients.ts (base de ingredientes)
/server/local-runner.ts → Express server para dev local (porta 3333)
/supabase/migrations/   → Migrações SQL
```

## Banco de dados (Supabase)

Tabelas principais: `profiles`, `meals`, `exercises`, `weight_history`, `daily_logs`, `chat_history`, `user_progress`, `user_badges`, `weekly_challenges`, `meal_plans`, `meal_analysis` (cache de IA).

Todas com RLS: `auth.uid() = user_id`.

## Variáveis de ambiente

```
VITE_SUPABASE_URL       → URL do Supabase (frontend)
VITE_SUPABASE_ANON_KEY  → Anon key do Supabase (frontend)
GEMINI_API_KEY          → API key do Gemini (backend only)
```

## Scripts de desenvolvimento

```bash
npm run dev          # Vite dev server (frontend)
npm run dev:api      # Express server local (backend, porta 3333)
npm run dev:full     # Ambos simultaneamente
npm run build        # Build produção
```

## Funcionalidades-chave

1. **Análise de foto com IA** — tira foto → Gemini Vision → JSON com alimentos/calorias/macros
2. **Registro manual + código de barras** — Open Food Facts API
3. **Gamificação** — XP (10-200 por ação), níveis (XP/1000+1), 7 badges, streaks, desafios semanais
4. **Modo Clínico GLP-1** — tracking de medicação, sintomas, relatório PDF para médico, proteína 2.2g/kg
5. **Planejamento alimentar IA** — plano semanal + receitas + lista de compras
6. **Progresso** — gráficos de peso e calorias (7/14/30/90 dias), resumo semanal compartilhável
7. **Cálculos nutricionais** — Mifflin-St Jeor (TMB), TDEE, macros protein-priority
8. **Detecção de platô** — análise de 14 dias com sugestões
9. **Chat NutriAI** — contexto nutricional do usuário, histórico persistido
10. **Notificações** — água, refeições, treino, medicação, conquistas

## Padrões do código

- Navegação por enum `NavItem` (não usa react-router para navegação interna, só para rotas)
- Services fazem chamadas ao Supabase diretamente
- Contexts wrappam o App inteiro: Auth > Gamification > Nutrition > Toast
- Cache de IA via hash SHA-256 na tabela `meal_analysis`
- Fallback de modelo: gemini-2.5-flash → gemini-2.5-flash-lite
- Tailwind via CDN no index.html (não via PostCSS)
- Idioma principal: Português (BR)

## Convenções

- Commits em português ou inglês (prefixo: feat, fix, chore, etc.)
- Componentes em PascalCase, services em camelCase
- Tipos definidos inline ou em `/types/`
- Sem testes automatizados ainda (pendente implementação com Vitest)

## Documentação completa

Ver `DOCUMENTACAO.md` na raiz do projeto para detalhes sobre arquitetura, banco de dados, IA, gamificação, modo clínico, deploy, plano de expansão e monetização.
