import React, { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { deleteAllUserData } from '../../services/lgpdService';

interface DeleteAccountButtonProps {
    userId: string;
    onDeleted: () => void; // chamado após exclusão (ex: signOut)
}

const DeleteAccountButton: React.FC<DeleteAccountButtonProps> = ({ userId, onDeleted }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (confirmText !== 'EXCLUIR') return;

        setLoading(true);
        try {
            await deleteAllUserData(userId);
            onDeleted();
        } catch (err) {
            console.error('[LGPD] Erro ao excluir conta:', err);
            alert('Erro ao excluir conta. Tente novamente.');
            setLoading(false);
        }
    };

    if (!showConfirm) {
        return (
            <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-500 rounded-xl font-medium text-sm hover:bg-red-50 transition-colors"
            >
                <Trash2 size={16} />
                Excluir Minha Conta
            </button>
        );
    }

    return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-red-700">Ação irreversível</p>
                    <p className="text-xs text-red-600 mt-1">
                        Todos os seus dados serão permanentemente excluídos: refeições, exercícios,
                        histórico de peso, conversas com o assistente, imagens e perfil.
                        Esta ação não pode ser desfeita.
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-red-700 mb-1">
                    Digite <strong>EXCLUIR</strong> para confirmar
                </label>
                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="EXCLUIR"
                    className="w-full px-3 py-2 border-2 border-red-200 rounded-xl text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                    className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleDelete}
                    disabled={confirmText !== 'EXCLUIR' || loading}
                    className="flex-1 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
            </div>
        </div>
    );
};

export default DeleteAccountButton;
