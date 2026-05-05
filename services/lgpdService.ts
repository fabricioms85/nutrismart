/**
 * LGPD Service
 * Exportação e exclusão de todos os dados do usuário
 */

import { supabase } from './supabaseClient';

// Todas as tabelas que contêm dados do usuário
const USER_TABLES = [
    'chat_history',
    'weekly_challenges',
    'user_badges',
    'user_progress',
    'meal_plans',
    'weight_history',
    'daily_logs',
    'exercises',
    'meals',
    'profiles',
] as const;

// Tabelas auxiliares (cache, não-pessoais mas vinculadas)
const CACHE_TABLES = ['meal_analysis'] as const;

// Buckets de Storage
const STORAGE_BUCKETS = ['meal-images', 'avatars'] as const;

/**
 * Exporta todos os dados do usuário em formato JSON
 */
export async function exportAllUserData(userId: string): Promise<Record<string, unknown[]>> {
    const result: Record<string, unknown[]> = {};

    for (const table of USER_TABLES) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.warn(`[LGPD Export] Erro ao consultar ${table}:`, error.message);
            result[table] = [];
        } else {
            result[table] = data || [];
        }
    }

    // Metadados
    result._export_metadata = [{
        exported_at: new Date().toISOString(),
        user_id: userId,
        tables_included: [...USER_TABLES],
    }];

    return result;
}

/**
 * Faz download dos dados como arquivo JSON
 */
export function downloadDataAsJson(data: Record<string, unknown[]>, filename?: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `nutrismart-dados-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Remove todas as imagens do usuário do Storage
 */
async function deleteUserStorage(userId: string): Promise<void> {
    for (const bucket of STORAGE_BUCKETS) {
        try {
            const { data: files } = await supabase.storage
                .from(bucket)
                .list(userId);

            if (files && files.length > 0) {
                const paths = files.map(f => `${userId}/${f.name}`);
                await supabase.storage.from(bucket).remove(paths);
            }
        } catch (err) {
            console.warn(`[LGPD Delete] Erro ao limpar bucket ${bucket}:`, err);
        }
    }
}

/**
 * Exclui todos os dados do usuário de todas as tabelas
 * Ordem respeita foreign keys (filhas primeiro, profiles por último)
 */
export async function deleteAllUserData(userId: string): Promise<void> {
    // 1. Deletar imagens do Storage
    await deleteUserStorage(userId);

    // 2. Deletar dados de cache
    for (const table of CACHE_TABLES) {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.warn(`[LGPD Delete] Erro ao deletar ${table}:`, error.message);
        }
    }

    // 3. Deletar dados do usuário (ordem: filhas primeiro)
    for (const table of USER_TABLES) {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', userId);

        if (error) {
            console.warn(`[LGPD Delete] Erro ao deletar ${table}:`, error.message);
            // Continua tentando as demais tabelas
        }
    }
}
