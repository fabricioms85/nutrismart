import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // Configuração do Supabase usando as chaves de ambiente que já estão no Vercel
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase credentials missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Fazendo uma requisição real ao banco (não é apenas um ping de rede)
    const { data, error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      console.error('Erro no Supabase:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log('Keep-alive executado com sucesso no Vercel.');
    return res.status(200).json({ 
      success: true, 
      message: 'Supabase project is active.',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Erro na função keepalive:', err);
    return res.status(500).json({ error: err.message });
  }
}
