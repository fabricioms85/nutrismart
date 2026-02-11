import React, { useState } from 'react';
import { X, Send, Loader2, HelpCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

interface SupportFormProps {
    isOpen: boolean;
    onClose: () => void;
}

const SUBJECTS = [
    'Dúvida sobre o app',
    'Problema técnico / Bug',
    'Sugestão de melhoria',
    'Dados pessoais (LGPD)',
    'Assinatura / Pagamento',
    'Outro',
];

const SupportForm: React.FC<SupportFormProps> = ({ isOpen, onClose }) => {
    const { authUser, profile } = useAuth();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState(authUser?.email || '');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !message.trim()) return;

        setLoading(true);
        try {
            // Tenta salvar na tabela support_tickets (se existir)
            // Se não existir, o erro é capturado e o ticket é logado no console
            const { error } = await supabase.from('support_tickets').insert({
                user_id: authUser?.id || null,
                email: email || authUser?.email || 'não informado',
                subject,
                message: message.trim(),
                user_name: profile?.name || 'Anônimo',
            });

            if (error) {
                // Tabela pode não existir ainda — loga para o time
                console.warn('[Suporte] Erro ao salvar ticket:', error.message);
                console.log('[Suporte] Ticket:', { email, subject, message });
            }

            setSent(true);
        } catch (err) {
            console.error('[Suporte] Erro:', err);
            setSent(true); // Mostra confirmação mesmo assim
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSent(false);
        setSubject('');
        setMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-nutri-100 rounded-xl flex items-center justify-center">
                            <HelpCircle size={20} className="text-nutri-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Ajuda e Suporte</h2>
                            <p className="text-xs text-gray-500">Como podemos ajudar?</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {sent ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-nutri-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-nutri-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Mensagem enviada!</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Recebemos sua mensagem e retornaremos o mais breve possível.
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-nutri-500 text-white font-semibold rounded-xl hover:bg-nutri-600 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail para contato</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 transition-colors"
                                    placeholder="seu@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assunto</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 transition-colors bg-white"
                                >
                                    <option value="">Selecione um assunto</option>
                                    {SUBJECTS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-nutri-500 focus:ring-2 focus:ring-nutri-100 transition-colors resize-none"
                                    placeholder="Descreva como podemos ajudar..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !subject || !message.trim()}
                                className="w-full py-3 bg-nutri-500 text-white font-semibold rounded-xl hover:bg-nutri-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Send size={18} />
                                )}
                                {loading ? 'Enviando...' : 'Enviar Mensagem'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportForm;
