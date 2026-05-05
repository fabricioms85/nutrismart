# NutriSmart — Documentação Completa do Sistema

> Plataforma SaaS inteligente de nutrição com IA, gamificação e suporte clínico.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Autenticação e Gestão de Usuários](#5-autenticação-e-gestão-de-usuários)
6. [Frontend — Páginas e Componentes](#6-frontend--páginas-e-componentes)
7. [Backend — API e Serverless Functions](#7-backend--api-e-serverless-functions)
8. [Banco de Dados — Supabase (PostgreSQL)](#8-banco-de-dados--supabase-postgresql)
9. [Integração com IA (Google Gemini)](#9-integração-com-ia-google-gemini)
10. [Sistema de Gamificação](#10-sistema-de-gamificação)
11. [Modo Clínico (GLP-1)](#11-modo-clínico-glp-1)
12. [Cálculos Nutricionais](#12-cálculos-nutricionais)
13. [Rastreamento de Peso e Metas](#13-rastreamento-de-peso-e-metas)
14. [PWA (Progressive Web App)](#14-pwa-progressive-web-app)
15. [Sistema de Notificações](#15-sistema-de-notificações)
16. [Deploy e Infraestrutura](#16-deploy-e-infraestrutura)
17. [Variáveis de Ambiente](#17-variáveis-de-ambiente)
18. [Como Rodar Localmente](#18-como-rodar-localmente)
19. [Fluxo do Usuário (Jornada)](#19-fluxo-do-usuário-jornada)
20. [Plano de Expansão](#20-plano-de-expansão)
21. [Estratégia de Divulgação](#21-estratégia-de-divulgação)
22. [Modelo de Monetização](#22-modelo-de-monetização)

---

## 1. Visão Geral

**NutriSmart** é uma plataforma SaaS de nutrição inteligente que combina:

- **Rastreamento alimentar com IA** — o usuário tira uma foto da refeição e a IA identifica os alimentos, calorias e macros automaticamente.
- **Gamificação** — sistema de XP, níveis, badges, streaks e desafios semanais para manter o engajamento.
- **Modo Clínico** — suporte especializado para pacientes em tratamento com medicamentos GLP-1 (semaglutida, tirzepatida), com rastreamento de medicação, sintomas e relatórios médicos em PDF.
- **Planejamento inteligente** — geração de planos alimentares semanais, receitas e listas de compras via IA.
- **PWA** — funciona como app instalável no celular, com suporte offline e notificações push.

### Público-alvo

| Segmento | Descrição |
|----------|-----------|
| **Pessoas comuns** | Querem emagrecer, ganhar massa ou manter peso saudável |
| **Pacientes clínicos** | Em tratamento com GLP-1 (Ozempic, Mounjaro, etc.) |
| **Nutricionistas** | Acompanhamento remoto de pacientes (futuro) |
| **Entusiastas de fitness** | Controle detalhado de macros e exercícios |

### Proposta de Valor

> "O único app de nutrição que combina análise de fotos com IA, gamificação motivacional e suporte clínico para GLP-1 — tudo em português, pensado para o brasileiro."

---

## 2. Stack Tecnológica

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19.2 | UI reativa e componentizada |
| TypeScript | 5.8 | Tipagem estática |
| Vite | 6.2 | Build tool e dev server |
| Tailwind CSS | v4 (CDN) | Estilização utility-first |
| Recharts | 3.7 | Gráficos de progresso |
| Lucide React | 0.562 | Ícones SVG |
| React Router DOM | 7.12 | Navegação SPA |
| jsPDF + AutoTable | 4.1 / 5.0 | Geração de relatórios PDF |
| canvas-confetti | 1.9 | Animações de conquistas |
| vite-plugin-pwa | 1.2 | Service Worker e manifest |

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Express | 5.2 | Servidor local de desenvolvimento |
| @vercel/node | 5.5 | Serverless functions em produção |
| tsx | 4.21 | Execução TypeScript no Node |
| dotenv | 17.2 | Variáveis de ambiente |
| cors | 2.8 | CORS middleware |

### Banco de Dados e Auth

| Tecnologia | Uso |
|------------|-----|
| Supabase | PostgreSQL gerenciado + Auth + RLS + Storage |
| Row Level Security | Isolamento de dados por usuário |

### Inteligência Artificial

| Tecnologia | Uso |
|------------|-----|
| Google Gemini 2.5 Flash | Análise de fotos, planos alimentares, chat |
| Google Gemini 2.5 Flash-Lite | Chat rápido e fallback de quota |

### Infraestrutura

| Tecnologia | Uso |
|------------|-----|
| Vercel | Hosting e serverless functions |
| GitHub | Controle de versão |

---

## 3. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO (Browser/PWA)                 │
│                                                         │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │ Refeições│  │Exercícios│  │Progresso│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │              │              │     │
│  ┌────▼──────────────▼──────────────▼──────────────▼───┐ │
│  │              React 19 + TypeScript                   │ │
│  │    Contexts: Auth | Nutrition | Gamification | Toast │ │
│  └────────────────────┬────────────────────────────────┘ │
└───────────────────────┼─────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │     /api/gemini (Vercel)      │
        │   Express (local dev:3333)    │
        │                               │
        │  ┌─────────────────────────┐  │
        │  │   Google Gemini API     │  │
        │  │   • analyze-food       │  │
        │  │   • generate-meal-plan │  │
        │  │   • chat               │  │
        │  │   • generate-recipes   │  │
        │  │   • clinical-summary   │  │
        │  └─────────────────────────┘  │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │         Supabase              │
        │                               │
        │  ┌──────────┐ ┌───────────┐   │
        │  │   Auth   │ │ PostgreSQL│   │
        │  │  (JWT)   │ │  + RLS    │   │
        │  └──────────┘ └───────────┘   │
        │                               │
        │  Tabelas:                     │
        │  profiles, meals, exercises,  │
        │  weight_history, daily_logs,  │
        │  chat_history, user_progress, │
        │  user_badges, weekly_challenges│
        │  meal_plans, meal_analysis    │
        └───────────────────────────────┘
```

### Fluxo de Dados

1. **Usuário interage** com o frontend React
2. **Contexts** gerenciam estado global (auth, nutrição, gamificação)
3. **Services** fazem chamadas ao Supabase (dados) e à API `/api/gemini` (IA)
4. **API Gemini** processa requisições de IA (análise de fotos, planos, chat)
5. **Supabase** armazena todos os dados com RLS garantindo isolamento por usuário
6. **Cache de imagens** evita chamadas duplicadas à IA (hash SHA-256 → tabela `meal_analysis`)

---

## 4. Estrutura de Diretórios

```
nutrismart/
├── api/                          # Serverless functions (Vercel)
│   └── gemini.ts                 # Endpoint principal da IA
│
├── components/                   # Componentes React reutilizáveis
│   ├── CalorieHero.tsx           # Gráfico donut de calorias diárias
│   ├── AIChat.tsx                # Chat com IA nutricional
│   ├── MedicationTracker.tsx     # Rastreador de medicação GLP-1
│   ├── WeeklyChallenge.tsx       # Card de desafio semanal
│   ├── WeightGoalCard.tsx        # Card de meta de peso
│   ├── MedicalReportGenerator.tsx# Gerador de relatório médico PDF
│   ├── ClinicalSetup.tsx         # Setup do modo clínico
│   ├── BarcodeScanner.tsx        # Scanner de código de barras
│   ├── ConsistencyCard.tsx       # Card de streak/consistência
│   ├── ActivityStream.tsx        # Timeline de atividades recentes
│   └── ...                       # Outros componentes
│
├── contexts/                     # Estado global React
│   ├── AuthContext.tsx            # Sessão e perfil do usuário
│   ├── NutritionContext.tsx       # Refeições, exercícios, água
│   ├── GamificationContext.tsx    # XP, badges, challenges
│   └── ToastContext.tsx           # Notificações toast
│
├── pages/                        # Páginas da aplicação
│   ├── Dashboard.tsx              # Tela principal
│   ├── RegisterMeal.tsx           # Registro de refeição (foto + manual)
│   ├── RegisterExercise.tsx       # Registro de exercício
│   ├── MealPlanner.tsx            # Planejador semanal de refeições
│   ├── Progress.tsx               # Gráficos de progresso
│   ├── Awards.tsx                 # Conquistas e badges
│   ├── Notifications.tsx          # Configuração de notificações
│   ├── Profile.tsx                # Perfil e configurações
│   ├── AuthPage.tsx               # Login e cadastro
│   ├── Onboarding.tsx             # Primeiro acesso
│   ├── AiAssistant.tsx            # Assistente IA
│   ├── ShoppingListPage.tsx       # Lista de compras
│   └── ...                        # Outras páginas
│
├── services/                     # Lógica de negócio e integrações
│   ├── authService.ts             # Autenticação Supabase
│   ├── mealService.ts             # CRUD de refeições
│   ├── exerciseService.ts         # CRUD de exercícios
│   ├── profileService.ts          # Gestão de perfil
│   ├── gamificationService.ts     # XP, badges, streaks
│   ├── nutritionCalculator.ts     # Cálculos TMB/TDEE/macros
│   ├── geminiService.ts           # Cliente da API Gemini
│   ├── notificationService.ts     # Notificações push
│   ├── chatService.ts             # Histórico de chat
│   ├── barcodeService.ts          # Busca por código de barras
│   └── PlateauDetectionService.ts # Detecção de platô de peso
│
├── data/                         # Dados de referência
│   └── brazilianIngredients.ts    # Base de ingredientes brasileiros
│
├── server/                       # Servidor local de desenvolvimento
│   └── local-runner.ts            # Express server (dev)
│
├── supabase/                     # Configuração do banco
│   └── migrations/                # Migrações SQL
│
├── public/                       # Arquivos estáticos
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service Worker
│   └── icons/                     # Ícones do app
│
├── utils/                        # Utilitários
├── types/                        # Tipos TypeScript
│
├── index.html                    # Entry point HTML (Tailwind, meta tags)
├── index.tsx                     # Entry point React
├── App.tsx                       # Componente raiz
├── vite.config.ts                # Configuração Vite + PWA
├── vercel.json                   # Configuração Vercel
├── package.json                  # Dependências e scripts
└── tsconfig.json                 # Configuração TypeScript
```

---

## 5. Autenticação e Gestão de Usuários

### Fluxo de Autenticação

```
Usuário abre o app
       │
       ▼
┌──────────────┐     ┌───────────────────┐
│  AuthPage    │────▶│ Supabase Auth     │
│ (login/signup)│     │ (email + senha)   │
└──────────────┘     └────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ Trigger cria perfil │
                    │ na tabela profiles  │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  AuthContext carrega│
                    │  sessão + perfil   │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
     Onboarding completo?               Onboarding
     Sim → Dashboard                    (peso, altura, meta, etc.)
```

### Componentes Envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `pages/AuthPage.tsx` | UI de login/cadastro |
| `contexts/AuthContext.tsx` | Estado da sessão, carregamento de perfil |
| `services/authService.ts` | Chamadas ao Supabase Auth (signUp, signIn, signOut) |
| `services/profileService.ts` | CRUD do perfil do usuário |
| `pages/Onboarding.tsx` | Coleta de dados iniciais (peso, altura, meta, nível de atividade) |

### Dados do Perfil

```typescript
interface Profile {
  id: string;                    // UUID do auth.users
  name: string;
  email: string;
  avatar_url?: string;

  // Dados físicos
  weight: number;               // kg
  height: number;               // cm
  age: number;
  gender: 'male' | 'female';

  // Objetivos
  goal: 'lose' | 'maintain' | 'gain';
  activity_level: 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso';
  daily_calorie_goal: number;
  daily_water_goal: number;     // ml

  // Macros calculados
  macro_protein: number;        // gramas
  macro_carbs: number;
  macro_fats: number;

  // Modo Clínico
  is_clinical_mode: boolean;
  clinical_settings?: ClinicalSettings;

  // Meta de peso
  weight_goal?: WeightGoal;

  // Controle
  onboarding_completed: boolean;
}
```

---

## 6. Frontend — Páginas e Componentes

### Navegação

O app usa navegação baseada em enum (`NavItem`) com um componente `Sidebar` que colapsa em mobile:

```typescript
enum NavItem {
  Dashboard,
  RegisterMeal,
  RegisterExercise,
  Recipes,
  MealPlanner,
  Planning,
  Progress,
  Assistant,
  Awards,
  Notifications,
  ShoppingList,
  Plans,
  Profile
}
```

### Páginas Detalhadas

#### 6.1 Dashboard (`Dashboard.tsx`)

A tela principal do app, exibindo:

- **CalorieHero** — gráfico donut grande mostrando calorias consumidas vs. meta diária, com breakdown de macros (proteína, carboidratos, gorduras)
- **Cards de atividade** — refeições e exercícios recentes em timeline
- **Rastreador de água** — consumo diário com botão de adicionar
- **Desafios semanais** — desafio ativo com barra de progresso
- **Meta de peso** — progresso em relação à meta com milestones
- **Sugestões de ajuste calórico** — baseadas na análise de dados recentes
- **Modo Clínico** — rastreador de medicação (quando ativado)

#### 6.2 Registro de Refeição (`RegisterMeal.tsx`)

Três formas de registrar:

1. **Foto com IA** — o usuário tira uma foto ou seleciona da galeria → Gemini analisa a imagem → retorna alimentos, calorias e macros estimados → usuário confirma ou edita
2. **Entrada manual** — adiciona alimentos individualmente com quantidade
3. **Código de barras** — escaneia o código → busca na Open Food Facts API → preenche dados nutricionais

**Funcionalidades:**
- Tipos de refeição: café da manhã, almoço, jantar, lanche
- Histórico com filtros (hoje, semana, mês, todos)
- Edição e exclusão de refeições
- Imagem salva junto com a refeição

#### 6.3 Registro de Exercício (`RegisterExercise.tsx`)

- Nome do exercício, duração (minutos), intensidade
- Estimativa automática de calorias queimadas
- Histórico de exercícios

#### 6.4 Planejador de Refeições (`MealPlanner.tsx`)

- **Geração por IA** — o Gemini cria um plano semanal completo baseado em:
  - Tipo de dieta (low carb, mediterrânea, vegana, etc.)
  - Alergias e restrições
  - Tempo disponível para cozinhar
  - Meta calórica
- **Customização** — cada refeição pode ser editada
- **Lista de compras** — gerada automaticamente a partir do plano
- Persistência via localStorage + Supabase

#### 6.5 Progresso (`Progress.tsx`)

Gráficos interativos com Recharts:

- **Gráfico de peso** — linha temporal com períodos de 7, 14, 30, 90 dias
- **Gráfico de calorias** — barras diárias com linha de meta de referência
- **Streak** — dias consecutivos de uso
- **Resumo semanal** — imagem gerada para compartilhamento em redes sociais

#### 6.6 Conquistas (`Awards.tsx`)

- Badges com raridades: Comum, Raro, Épico, Lendário
- Progresso de XP e nível atual
- Desafios semanais ativos
- Animação de confetti ao desbloquear conquistas

#### 6.7 Assistente IA (`AiAssistant.tsx`)

Chat com o NutriAI:
- Contexto nutricional do usuário (perfil, refeições recentes, metas)
- Sugestões de receitas
- Dúvidas sobre nutrição
- Histórico persistido (Supabase + localStorage fallback)

#### 6.8 Perfil (`Profile.tsx`)

- Edição de dados pessoais e foto
- Medidas físicas (peso, altura, idade, gênero)
- Meta e nível de atividade
- Calculadora de macros com recálculo automático
- Ativação/configuração do modo clínico
- Geração de relatório médico PDF (modo clínico)
- Gerenciamento de senha

#### 6.9 Notificações (`Notifications.tsx`)

Configuração de lembretes:
- Água (a cada 2h por padrão)
- Refeições (café 7h, almoço 12h, jantar 19h)
- Treino (desativado por padrão)
- Conquistas
- Medicação (modo clínico, 9h)

#### 6.10 Lista de Compras (`ShoppingListPage.tsx`)

- Itens categorizados (frutas, proteínas, laticínios, etc.)
- Checkbox para marcar itens comprados
- Persistência local

### Componentes Principais

| Componente | Descrição |
|------------|-----------|
| `CalorieHero` | Gráfico donut com calorias + cards de macros + animações de blob |
| `AIChat` | Interface de chat com IA nutricional |
| `MedicationTracker` | Countdown para próxima injeção GLP-1 |
| `WeeklyChallenge` | Card de desafio com barra de progresso |
| `WeightGoalCard` | Meta de peso com milestones e progresso |
| `ConsistencyCard` | Streak e consistência do usuário |
| `ActivityStream` | Timeline de refeições e exercícios recentes |
| `MedicalReportGenerator` | Gera PDF com relatório para o médico |
| `ClinicalSetup` | Wizard de configuração do modo clínico |
| `BarcodeScanner` | Leitor de código de barras para produtos |

### Design System

| Aspecto | Detalhes |
|---------|----------|
| **Cores** | NutriGreen (#00b37e), Solar (accent), Berry (secondary) |
| **Tipografia** | Inter (corpo), Outfit (títulos), Space Grotesk (mono) |
| **Estilização** | Tailwind CSS v4 utility-first |
| **Animações** | Blob backgrounds, fade-in, scale-in com stagger |
| **Responsividade** | Mobile-first, sidebar collapsa no mobile |
| **Modais** | Backdrop blur com animações suaves |

---

## 7. Backend — API e Serverless Functions

### Endpoint Principal: `/api/gemini`

Único endpoint serverless que roteia para diferentes ações via parâmetro `action`:

| Action | Modelo | Descrição |
|--------|--------|-----------|
| `analyze-food` | gemini-2.5-flash | Analisa foto de comida → retorna alimentos, calorias, macros |
| `calculate-nutrition` | gemini-2.5-flash | Lista de alimentos → cálculo nutricional |
| `generate-meal-plan` | gemini-2.5-flash | Gera plano alimentar semanal personalizado |
| `generate-recipes` | gemini-2.5-flash | Sugere receitas baseadas em preferências |
| `generate-shopping-list` | gemini-2.5-flash | Gera lista de compras a partir do plano |
| `generate-clinical-summary` | gemini-2.5-flash | Gera resumo clínico para médico |
| `chat` | gemini-2.5-flash-lite | Chat conversacional sobre nutrição |

### Cache de Análise de Imagens

Para evitar chamadas duplicadas (e custos) à API Gemini:

1. Gera hash SHA-256 da imagem Base64
2. Consulta tabela `meal_analysis` no Supabase
3. Se encontrar (cache hit) → retorna resultado cacheado
4. Se não (cache miss) → chama Gemini → salva resultado no cache

### Fallback de Quota

Quando a quota do Gemini 2.5 Flash é excedida:
- Redireciona para `gemini-2.5-flash-lite`
- Se o lite também falhar → retorna `null` e permite entrada manual

### Desenvolvimento Local

```bash
npm run dev:api    # Express na porta 3333
npm run dev        # Vite na porta 5173 (proxy /api → 3333)
npm run dev:full   # Ambos simultaneamente
```

O Vite está configurado com proxy para redirecionar `/api` ao servidor Express local.

---

## 8. Banco de Dados — Supabase (PostgreSQL)

### Tabelas e Estrutura

#### `profiles`
Perfil completo do usuário, criado automaticamente via trigger no signup.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK, FK auth.users) | Identificador do usuário |
| name | TEXT | Nome do usuário |
| email | TEXT | Email |
| avatar_url | TEXT | URL da foto de perfil |
| weight | NUMERIC | Peso em kg |
| height | NUMERIC | Altura em cm |
| age | INTEGER | Idade |
| gender | TEXT | 'male' ou 'female' |
| goal | TEXT | 'lose', 'maintain', 'gain' |
| activity_level | TEXT | Nível de atividade física |
| daily_calorie_goal | INTEGER | Meta calórica diária |
| daily_water_goal | INTEGER | Meta de água (ml) |
| macro_protein | NUMERIC | Meta de proteína (g) |
| macro_carbs | NUMERIC | Meta de carboidratos (g) |
| macro_fats | NUMERIC | Meta de gorduras (g) |
| is_clinical_mode | BOOLEAN | Modo clínico ativo |
| clinical_settings | JSONB | Configurações do modo clínico |
| weight_goal | JSONB | Meta de peso com milestones |
| onboarding_completed | BOOLEAN | Onboarding finalizado |

#### `meals`
Refeições registradas pelo usuário.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID da refeição |
| user_id | UUID (FK profiles) | Dono da refeição |
| name | TEXT | Nome da refeição |
| meal_type | TEXT | 'breakfast', 'lunch', 'dinner', 'snack' |
| time | TEXT | Horário |
| date | DATE | Data |
| calories | NUMERIC | Calorias totais |
| weight_grams | NUMERIC | Peso em gramas |
| ingredients | JSONB | Lista de ingredientes com detalhes |
| macro_protein | NUMERIC | Proteína (g) |
| macro_carbs | NUMERIC | Carboidratos (g) |
| macro_fats | NUMERIC | Gorduras (g) |
| image_url | TEXT | Foto da refeição |

#### `exercises`
Exercícios registrados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID do exercício |
| user_id | UUID (FK profiles) | Dono |
| name | TEXT | Nome do exercício |
| duration_minutes | INTEGER | Duração em minutos |
| calories_burned | NUMERIC | Calorias queimadas |
| intensity | TEXT | Intensidade |
| time | TEXT | Horário |
| date | DATE | Data |

#### `weight_history`
Histórico de pesagens.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID do registro |
| user_id | UUID (FK profiles) | Dono |
| weight | NUMERIC | Peso em kg |
| date | DATE | Data da pesagem |
| notes | TEXT | Observações |

#### `daily_logs`
Logs diários (água, notas).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID |
| user_id | UUID (FK profiles) | Dono |
| date | DATE | Data |
| water_consumed | NUMERIC | Água consumida (ml) |
| notes | TEXT | Observações |

#### `chat_history`
Mensagens do chat com IA.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID |
| user_id | UUID (FK profiles) | Dono |
| role | TEXT | 'user' ou 'assistant' |
| content | TEXT | Conteúdo da mensagem |
| created_at | TIMESTAMP | Data/hora |

#### `user_progress` (Gamificação)
Progresso do usuário no sistema de gamificação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID |
| user_id | UUID (FK profiles) | Dono |
| xp | INTEGER | Pontos de experiência |
| level | INTEGER | Nível atual |
| streak | INTEGER | Dias consecutivos |
| last_activity_date | DATE | Último dia ativo |

#### `user_badges` (Conquistas)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID |
| user_id | UUID (FK profiles) | Dono |
| badge_id | TEXT | Identificador do badge |
| earned_at | TIMESTAMP | Quando foi ganho |

#### `weekly_challenges` (Desafios)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID |
| user_id | UUID (FK profiles) | Dono |
| title | TEXT | Título do desafio |
| description | TEXT | Descrição |
| type | TEXT | Tipo do desafio |
| target | INTEGER | Meta numérica |
| current | INTEGER | Progresso atual |
| start_date | DATE | Início |
| end_date | DATE | Fim |
| xp_reward | INTEGER | XP de recompensa |
| completed | BOOLEAN | Se foi concluído |

#### `meal_plans` (Planos alimentares)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID |
| user_id | UUID (FK profiles) | Dono |
| week_start | DATE | Início da semana |
| plan_data | JSONB | Dados do plano completo |
| preferences | JSONB | Preferências usadas na geração |

#### `meal_analysis` (Cache de IA)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID (PK) | ID |
| image_hash | TEXT | Hash SHA-256 da imagem |
| analysis_result | JSONB | Resultado da análise |
| created_at | TIMESTAMP | Data do cache |

### Row Level Security (RLS)

**Todas** as tabelas têm RLS ativado com a política:

```sql
-- Leitura: usuário só vê seus dados
CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- Escrita: usuário só insere/atualiza seus dados
CREATE POLICY "Users can manage own data" ON table_name
  FOR ALL USING (auth.uid() = user_id);
```

Isso garante que nenhum usuário pode acessar dados de outro, mesmo que tente manipular a API.

---

## 9. Integração com IA (Google Gemini)

### Como Funciona a Análise de Fotos

```
Usuário tira foto da refeição
         │
         ▼
┌──────────────────────┐
│ Base64 da imagem     │
│ → SHA-256 hash       │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐     Sim    ┌──────────────────┐
│ Cache existe?        │───────────▶│ Retorna resultado│
│ (meal_analysis)      │            │ do cache         │
└────────┬─────────────┘            └──────────────────┘
         │ Não
         ▼
┌──────────────────────┐
│ Gemini 2.5 Flash     │
│ (Vision API)         │
│                      │
│ Prompt:              │
│ "Você é um expert    │
│  em nutrição.        │
│  Analise esta foto   │
│  e retorne JSON com: │
│  - alimentos         │
│  - calorias          │
│  - macros            │
│  Use tabelas TACO    │
│  e USDA"             │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Salva no cache       │
│ Retorna ao usuário   │
└──────────────────────┘
```

### Prompt Engineering

O sistema usa prompts estruturados que forçam resposta em JSON:

- **System prompt**: define o papel de nutricionista especialista
- **Referências**: tabelas TACO (brasileira) e USDA para valores nutricionais
- **Estimativa de porções**: baseada em referências visuais (tamanho do prato, mão, etc.)
- **Output**: JSON estruturado com campos obrigatórios

### Distribuição de Modelos

| Tarefa | Modelo | Justificativa |
|--------|--------|---------------|
| Análise de foto | gemini-2.5-flash | Precisa de capacidade vision avançada |
| Plano alimentar | gemini-2.5-flash | Raciocínio complexo com múltiplas restrições |
| Chat simples | gemini-2.5-flash-lite | Respostas rápidas, menor custo |
| Fallback geral | gemini-2.5-flash-lite | Gestão de quota |

---

## 10. Sistema de Gamificação

### Mecânicas

#### XP (Pontos de Experiência)

| Ação | XP Ganho |
|------|----------|
| Registrar refeição | 10 XP |
| Registrar exercício | 15 XP |
| Registrar água | 5 XP |
| Completar meta diária | 50 XP |
| Bônus de streak | 100 XP |
| Completar desafio semanal | 200 XP |

#### Níveis

```
Nível = floor(XP / 1000) + 1
```

- Nível 1: 0-999 XP
- Nível 2: 1000-1999 XP
- Nível 3: 2000-2999 XP
- E assim por diante...

Ao subir de nível, uma modal de congratulação é exibida com animação de confetti.

#### Badges (Conquistas)

| Badge ID | Nome | Critério | Raridade |
|----------|------|----------|----------|
| `first_meal` | Primeira Refeição | Registrar 1 refeição | Comum |
| `water_master` | Mestre da Hidratação | Beber 2L num dia | Comum |
| `workout_warrior` | Guerreiro do Treino | 5 exercícios | Raro |
| `streak_7` | Semana Perfeita | 7 dias de streak | Raro |
| `weight_loss_1kg` | Primeiro Quilo | Perder 1kg | Épico |
| `early_bird` | Madrugador | Registrar antes das 7h | Raro |
| `balanced_diet` | Dieta Equilibrada | Acertar macros 3 dias | Lendário |

#### Streaks

- Incrementado a cada dia que o usuário registra atividade
- Reseta se pular um dia
- Bônus de XP em marcos (7, 14, 30 dias)

#### Desafios Semanais

Gerados dinamicamente toda semana:
- Registrar X refeições
- Beber X litros de água
- Fazer X exercícios
- Manter streak de X dias
- Cada desafio vale 200 XP

### Arquivos Envolvidos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `services/gamificationService.ts` | Lógica de XP, badges, streaks, challenges |
| `contexts/GamificationContext.tsx` | Estado global de gamificação |
| `pages/Awards.tsx` | Exibição de conquistas |
| `components/WeeklyChallenge.tsx` | Card de desafio |
| `components/CalorieHero.tsx` | Exibe nível e XP no dashboard |

---

## 11. Modo Clínico (GLP-1)

### O que é

O Modo Clínico é um conjunto de funcionalidades para pacientes em tratamento com medicamentos GLP-1 (como Ozempic/semaglutida e Mounjaro/tirzepatida). Esses medicamentos são usados para emagrecimento e controle de diabetes tipo 2.

### Funcionalidades

#### Rastreamento de Medicação
- Countdown para próxima injeção
- Histórico de aplicações
- Cálculo automático de intervalo (semanal ou personalizado)
- Semanas desde o início do tratamento

#### Monitoramento de Sintomas
- Log de sintomas com severidade (leve, moderado, severo)
- Tipos: náusea, fadiga, dor abdominal, constipação, diarreia
- Correlação temporal com doses

#### Metas Nutricionais Especiais
- Proteína elevada: 2.2g/kg (vs 1.6-2.0g/kg padrão)
- Fibra mínima: 30g/dia
- Ajustes calóricos mais conservadores

#### Relatório Médico em PDF
Gerado via `jsPDF` com:
- Dados do paciente (peso, altura, IMC)
- Histórico de peso (gráfico e tabela)
- Consumo calórico médio
- Distribuição de macros
- Log de sintomas
- Aderência ao plano
- Medicação em uso

### Configurações Clínicas

```typescript
interface ClinicalSettings {
  medication: string;        // "semaglutide", "tirzepatide", etc.
  dosage: string;            // "0.25mg", "0.5mg", "1mg", etc.
  injectionDay?: number;     // 0=Dom, 1=Seg... 6=Sáb
  intervalDays?: number;     // Padrão: 7 (semanal)
  startDate: string;         // Data de início do tratamento
  proteinGoalPerKg?: number; // Padrão: 2.2g/kg
}
```

### Componentes do Modo Clínico

| Componente | Descrição |
|------------|-----------|
| `ClinicalSetup.tsx` | Wizard de configuração inicial |
| `MedicationTracker.tsx` | Widget de countdown e tracking |
| `SymptomModal.tsx` | Modal para log de sintomas |
| `MedicalReportGenerator.tsx` | Geração de PDF para médico |

---

## 12. Cálculos Nutricionais

### Fórmula Base: Mifflin-St Jeor

```
Homens:   TMB = (10 × peso) + (6.25 × altura) - (5 × idade) + 5
Mulheres: TMB = (10 × peso) + (6.25 × altura) - (5 × idade) - 161
```

### TDEE (Gasto Energético Total)

```
TDEE = TMB × Fator de Atividade
```

| Nível | Fator | Descrição |
|-------|-------|-----------|
| Sedentário | 1.2 | Pouco ou nenhum exercício |
| Leve | 1.375 | Exercício leve 1-3x/semana |
| Moderado | 1.55 | Exercício moderado 3-5x/semana |
| Intenso | 1.725 | Exercício intenso 6-7x/semana |
| Muito Intenso | 1.9 | Atleta ou trabalho físico pesado |

### Distribuição de Macros (Modelo Protein-Priority)

```
Proteína: 1.6 - 2.0g/kg (modo clínico: 2.2g/kg)
Gordura:  0.7g/kg mínimo (saúde hormonal)
Carboidrato: Residual (mínimo 80g)
```

### Flags de Segurança

| Flag | Condição | Significado |
|------|----------|-------------|
| `lowCalorieAlert` | Meta < TMB | Risco de déficit excessivo |
| `carbFloorApplied` | Carbs ajustados | Mínimo de 80g atingido |
| `highProteinAlert` | Proteína > 2.5g/kg | Potencial sobrecarga renal |

### Arquivo

`services/nutritionCalculator.ts` — contém toda a lógica de cálculo.

---

## 13. Rastreamento de Peso e Metas

### Meta de Peso (WeightGoal)

```typescript
interface WeightGoal {
  startWeight: number;       // Peso inicial
  targetWeight: number;      // Peso alvo
  startDate: string;         // Data de início
  targetDate?: string;       // Data alvo (opcional)
  estimatedDate?: string;    // Projeção da IA
  weeklyGoal: number;        // Ex: -0.5 kg/semana
  milestones: WeightMilestone[];
  status: 'active' | 'achieved' | 'paused';
}

interface WeightMilestone {
  weight: number;            // Peso do milestone
  label: string;             // Ex: "Primeiro 5kg"
  achieved: boolean;
  achievedDate?: string;
  xpReward: number;          // XP ao atingir
  claimed: boolean;          // Se o XP foi resgatado
}
```

### Detecção de Platô

O `PlateauDetectionService.ts` analisa:
- Janela de 14 dias de pesagens
- Variação de peso nesse período
- Score de aderência ao plano

Se detectar platô, sugere:
- Semana de refeed (aumento temporário de calorias)
- Semana de manutenção
- Ajuste de macros
- Redução de cardio

---

## 14. PWA (Progressive Web App)

### Manifest (`public/manifest.json`)

```json
{
  "name": "NutriSmart",
  "short_name": "NutriSmart",
  "display": "standalone",
  "theme_color": "#22c55e",
  "background_color": "#ffffff",
  "categories": ["health", "fitness", "food"],
  "shortcuts": [
    { "name": "Registrar Refeição", "url": "/meal" },
    { "name": "Ver Progresso", "url": "/progress" }
  ]
}
```

### Service Worker (vite-plugin-pwa)

| Recurso | Estratégia | TTL |
|---------|-----------|-----|
| Assets (JS, CSS, HTML, imagens) | Precache | Atualiza com build |
| Supabase API | NetworkFirst | 1 dia |
| Open Food Facts API | CacheFirst | 7 dias |

### Capacidades PWA

- Instalação no home screen (Android e iOS)
- Funcionamento offline (assets cacheados)
- Notificações push (via Browser API)
- Atalhos de tela inicial
- Ícone maskable (192x192 e 512x512)

---

## 15. Sistema de Notificações

### Configurações Padrão

| Categoria | Padrão | Horário |
|-----------|--------|---------|
| Água | A cada 2 horas | 8h-22h |
| Café da manhã | Ativo | 7:00 |
| Almoço | Ativo | 12:00 |
| Jantar | Ativo | 19:00 |
| Treino | Desativado | 18:00 |
| Conquistas | Ativo | Quando ocorrem |
| Medicação (clínico) | Ativo | 9:00 |

### Implementação

- Usa Browser Notification API (`Notification.requestPermission()`)
- Agendamento via `setTimeout` calculando tempo até o próximo horário
- Persistência das configurações em `localStorage`
- Integração com modo clínico para lembretes de medicação

---

## 16. Deploy e Infraestrutura

### Vercel

**Configuração (`vercel.json`):**
- Framework: Vite
- Build: `npm run build` → output em `/dist`
- Rewrites: rotas SPA → `index.html`
- Serverless: `/api/gemini.ts`

**Headers de Segurança:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Cache control para service worker: `no-cache`
- Content-Type para manifest: `application/manifest+json`

### Pipeline de Deploy

```
Push para main (GitHub)
       │
       ▼
Vercel detecta push
       │
       ▼
npm run build (Vite)
       │
       ▼
Deploy automático
├── Static files → CDN
└── /api/ → Serverless Functions
```

---

## 17. Variáveis de Ambiente

### Necessárias

| Variável | Onde | Descrição |
|----------|------|-----------|
| `VITE_SUPABASE_URL` | Frontend (.env) | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Frontend (.env) | Chave anônima do Supabase |
| `GEMINI_API_KEY` | Backend (Vercel env) | API key do Google Gemini |

### Configuração

**Local (`.env` na raiz):**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
GEMINI_API_KEY=AIzaSy...
```

**Produção (Vercel Dashboard):**
- Settings → Environment Variables
- Adicionar as 3 variáveis acima

> **IMPORTANTE:** A `GEMINI_API_KEY` nunca deve ser exposta no frontend. Ela só é acessada pelo serverless function no backend.

---

## 18. Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase (com projeto criado)
- API Key do Google Gemini

### Passo a Passo

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/nutrismart.git
cd nutrismart

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas chaves

# 4. Rodar em desenvolvimento
npm run dev          # Apenas frontend (porta 5173)
npm run dev:api      # Apenas backend (porta 3333)
npm run dev:full     # Frontend + Backend simultaneamente

# 5. Build para produção
npm run build
npm run preview      # Preview local do build
```

### Estrutura de Ports

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Vite Dev Server | 5173 | Frontend React |
| Express Server | 3333 | API local (Gemini proxy) |

O Vite proxy redireciona `/api/*` → `localhost:3333` automaticamente.

---

## 19. Fluxo do Usuário (Jornada)

### Primeiro Acesso

```
1. Abre o app → Tela de login/cadastro
2. Cria conta (email + senha)
3. Onboarding:
   a. Nome e dados básicos
   b. Peso, altura, idade, gênero
   c. Objetivo (emagrecer, manter, ganhar)
   d. Nível de atividade física
   e. (Opcional) Ativar modo clínico
4. Sistema calcula metas (calorias, macros)
5. Dashboard com tutorial inicial
```

### Uso Diário Típico

```
Manhã:
  → Notificação de café da manhã
  → Tira foto do café → IA analisa → Confirma
  → Registra água

Almoço:
  → Notificação de almoço
  → Tira foto → IA analisa → Confirma
  → Verifica progresso no CalorieHero

Tarde:
  → Registra lanche (manual ou foto)
  → Registra exercício
  → Checa desafio semanal

Noite:
  → Jantar (foto + IA)
  → Consulta NutriAI para dúvidas
  → Verifica conquistas desbloqueadas
  → Pesa-se → Registra peso
```

### Ciclo Semanal

```
Segunda: Gera plano alimentar da semana
Terça-Sexta: Segue o plano, registra refeições
Sábado: Verifica progresso nos gráficos
Domingo: Compartilha resumo semanal, novo desafio começa
```

---

## 20. Plano de Expansão

### Fase 1 — Consolidação (Atual → 3 meses)

| Ação | Prioridade | Impacto |
|------|-----------|---------|
| Testes automatizados (Vitest + Playwright) | Alta | Estabilidade |
| Internacionalização (i18n) — inglês + espanhol | Alta | Mercado |
| App nativo via Capacitor ou React Native | Alta | Experiência mobile |
| Integração com wearables (Apple Health, Google Fit) | Média | Dados automáticos |
| Dashboard administrativo | Média | Gestão |

### Fase 2 — Crescimento (3-6 meses)

| Ação | Prioridade | Impacto |
|------|-----------|---------|
| Painel do Nutricionista | Alta | Novo público-alvo |
| Marketplace de planos alimentares | Alta | Monetização |
| Integração com delivery (iFood, Rappi) | Média | Conveniência |
| Comunidade social (grupos, desafios em grupo) | Média | Engajamento |
| Análise avançada de micronutrientes | Média | Diferencial |

### Fase 3 — Escala (6-12 meses)

| Ação | Prioridade | Impacto |
|------|-----------|---------|
| API pública para parceiros | Alta | Ecossistema |
| Programa de afiliados | Alta | Aquisição |
| White label para clínicas | Alta | B2B |
| Machine learning próprio (reduzir dependência do Gemini) | Média | Custos |
| Expansão internacional (LATAM, Europa) | Média | Mercado |

---

## 21. Estratégia de Divulgação

### Marketing Digital

| Canal | Estratégia | Métrica |
|-------|-----------|---------|
| **Instagram/TikTok** | Vídeos curtos "antes e depois", dicas rápidas de nutrição, demonstração da IA analisando pratos | Seguidores, engajamento |
| **YouTube** | Tutoriais completos, cases de uso, comparativos com concorrentes | Views, inscritos |
| **Blog/SEO** | Artigos sobre nutrição, emagrecimento, GLP-1 (Ozempic) — tráfego orgânico | Visitas, conversão |
| **Google Ads** | Palavras-chave: "app de nutrição", "contar calorias", "Ozempic dieta" | CPA, ROAS |
| **Meta Ads** | Lookalike de usuários ativos, retargeting de visitantes | CPA, conversão |

### Parcerias Estratégicas

| Parceiro | Benefício |
|----------|----------|
| **Nutricionistas** | Indicam para pacientes, ganham painel de acompanhamento |
| **Academias** | Bundle com plano da academia, QR code no balcão |
| **Clínicas de emagrecimento** | Versão white label com marca da clínica |
| **Influencers fitness** | Divulgação orgânica, código de desconto |
| **Farmácias (GLP-1)** | Material no ponto de venda para pacientes |

### Growth Hacking

| Tática | Descrição |
|--------|-----------|
| **Resumo semanal compartilhável** | Imagem bonita para Instagram Stories |
| **Referral program** | Ganhe 1 mês grátis ao indicar amigo |
| **Desafios virais** | "Desafio 30 dias NutriSmart" nas redes |
| **Freemium generoso** | Funcionalidades essenciais grátis, IA premium |
| **SEO para GLP-1** | Conteúdo sobre Ozempic/Mounjaro + CTA para o app |

### Métricas-chave (KPIs)

| Métrica | Meta (6 meses) |
|---------|----------------|
| DAU (Daily Active Users) | 10.000 |
| Retenção D7 | > 40% |
| Retenção D30 | > 20% |
| Taxa de conversão free→paid | > 5% |
| NPS | > 50 |
| CAC (Custo de Aquisição) | < R$ 30 |
| LTV (Lifetime Value) | > R$ 200 |

---

## 22. Modelo de Monetização

### Planos Propostos

#### Free (Gratuito)

| Recurso | Limite |
|---------|--------|
| Registro de refeições (manual) | Ilimitado |
| Registro de exercícios | Ilimitado |
| Rastreamento de água | Ilimitado |
| Dashboard básico | Sim |
| Gamificação | Sim |
| Análise de foto com IA | 3/dia |
| Chat com NutriAI | 5 mensagens/dia |
| Histórico | Últimos 7 dias |

#### Premium (R$ 19,90/mês ou R$ 149,90/ano)

| Recurso | Limite |
|---------|--------|
| Tudo do Free | — |
| Análise de foto com IA | Ilimitado |
| Chat com NutriAI | Ilimitado |
| Plano alimentar semanal IA | Ilimitado |
| Receitas personalizadas | Ilimitado |
| Lista de compras automática | Sim |
| Gráficos avançados | 90 dias |
| Exportação de dados | CSV/PDF |
| Sem anúncios | Sim |

#### Clínico (R$ 39,90/mês)

| Recurso | Limite |
|---------|--------|
| Tudo do Premium | — |
| Modo Clínico GLP-1 | Sim |
| Rastreamento de medicação | Sim |
| Log de sintomas | Sim |
| Relatório médico PDF | Ilimitado |
| Detecção de platô | Sim |
| Suporte prioritário | Sim |

#### Nutricionista (R$ 99,90/mês)

| Recurso | Limite |
|---------|--------|
| Painel de acompanhamento | Até 50 pacientes |
| Prescrição de planos | Sim |
| Relatórios de aderência | Sim |
| Chat com pacientes | Sim |
| Marca personalizada | Sim |

### Projeção de Receita

| Cenário | Usuários | Conversão | MRR |
|---------|----------|-----------|-----|
| Conservador (6 meses) | 5.000 | 5% = 250 pagantes | R$ 5.000 |
| Moderado (12 meses) | 20.000 | 7% = 1.400 pagantes | R$ 30.000 |
| Otimista (18 meses) | 50.000 | 10% = 5.000 pagantes | R$ 110.000 |

### Outras Fontes de Receita

| Fonte | Descrição |
|-------|-----------|
| **API para parceiros** | Cobrar por chamada de análise nutricional |
| **White label** | Licenciar plataforma para clínicas (R$ 500-2000/mês) |
| **Marketplace** | Comissão na venda de planos de nutricionistas (15-20%) |
| **Dados agregados** | Relatórios de tendências nutricionais (anonimizados) |
| **Integrações** | Parcerias com apps de delivery (comissão por pedido saudável) |

---

## Apêndice: Integrações Externas

| Serviço | Uso | Endpoint/SDK |
|---------|-----|-------------|
| Supabase | Banco, Auth, Storage | `@supabase/supabase-js` |
| Google Gemini | IA (visão, texto) | REST API via `/api/gemini` |
| Open Food Facts | Dados nutricionais por código de barras | `world.openfoodfacts.org/api/v2` |
| Vercel | Hosting e serverless | Deploy automático via Git |

---

> **Última atualização:** Março 2026
> **Versão do documento:** 1.0
