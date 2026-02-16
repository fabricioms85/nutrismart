-- =====================================================
-- Support tickets (Ajuda e Suporte)
-- Formulário de contato: mensagens vão para esta tabela.
-- =====================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para listar por data e por usuário
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado pode inserir ticket (próprio user_id ou null)
CREATE POLICY "Users can insert own support tickets"
    ON support_tickets
    FOR INSERT
    WITH CHECK (
        user_id IS NULL OR auth.uid() = user_id
    );

-- Usuário pode ver apenas os próprios tickets (opcional: para futura tela "Meus tickets")
CREATE POLICY "Users can view own support tickets"
    ON support_tickets
    FOR SELECT
    USING (auth.uid() = user_id);

-- UPDATE/DELETE não permitidos para usuários (apenas service role para o time de suporte)
COMMENT ON TABLE support_tickets IS 'Tickets do formulário Ajuda e Suporte; leitura por backend/service role para atendimento.';
