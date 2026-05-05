import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function keepAlive() {
  console.log(`🚀 Iniciando ping para Supabase: ${supabaseUrl}`);
  
  try {
    // Faz uma query simples para registrar atividade
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('❌ Erro ao conectar ao Supabase:', error.message);
    } else {
      console.log('✅ Sucesso! O projeto Supabase está ativo.');
      console.log('Dados recebidos:', data);
    }
  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
}

keepAlive();
