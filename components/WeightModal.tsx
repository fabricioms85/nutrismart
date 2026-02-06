import React, { useState } from 'react';
import { X, Scale, Calendar, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface WeightModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (weight: number, date: string) => Promise<void>;
    currentWeight?: number;
}

const WeightModal: React.FC<WeightModalProps> = ({ isOpen, onClose, onSubmit, currentWeight }) => {
    const [weight, setWeight] = useState(currentWeight?.toString() || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const weightNum = parseFloat(weight);

        if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) {
            setError('Digite um peso válido (20-500 kg)');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onSubmit(weightNum, date);
            onClose();
        } catch {
            setError('Erro ao salvar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const weightDiff = currentWeight && parseFloat(weight)
        ? parseFloat(weight) - currentWeight
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-nutri-500 to-nutri-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Scale size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Registrar Peso</h2>
                            <p className="text-white/80 text-sm">Acompanhe sua evolução</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Weight Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Peso Atual
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.1"
                                min="20"
                                max="500"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="Ex: 75.5"
                                className="w-full px-4 py-4 pr-14 text-2xl font-bold text-center border-2 border-gray-200 rounded-2xl focus:border-nutri-500 focus:ring-4 focus:ring-nutri-100 transition-all"
                                autoFocus
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                kg
                            </span>
                        </div>

                        {/* Weight diff indicator */}
                        {weightDiff !== 0 && (
                            <div className={`flex items-center justify-center gap-2 mt-3 p-2 rounded-lg ${weightDiff < 0
                                    ? 'bg-green-50 text-green-600'
                                    : 'bg-orange-50 text-orange-600'
                                }`}>
                                {weightDiff < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                                <span className="font-medium">
                                    {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg desde o último registro
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Date Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar size={16} className="inline mr-2" />
                            Data do Registro
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-nutri-500 focus:ring-4 focus:ring-nutri-100 transition-all"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !weight}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-nutri-500 to-nutri-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-nutri-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Salvando...' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WeightModal;
