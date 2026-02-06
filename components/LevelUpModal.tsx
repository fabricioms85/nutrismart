import React, { useEffect, useState } from 'react';
import { Star, Sparkles, X, Gift } from 'lucide-react';

interface LevelUpModalProps {
    isOpen: boolean;
    newLevel: number;
    onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, newLevel, onClose }) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Get level tier for styling
    const getLevelTier = () => {
        if (newLevel >= 25) return { color: 'from-amber-400 to-yellow-500', tier: 'Lendário', emoji: '👑' };
        if (newLevel >= 15) return { color: 'from-purple-400 to-indigo-500', tier: 'Épico', emoji: '💎' };
        if (newLevel >= 10) return { color: 'from-blue-400 to-cyan-500', tier: 'Raro', emoji: '⭐' };
        if (newLevel >= 5) return { color: 'from-green-400 to-emerald-500', tier: 'Comum', emoji: '🌟' };
        return { color: 'from-nutri-400 to-nutri-600', tier: 'Iniciante', emoji: '✨' };
    };

    const tier = getLevelTier();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Confetti effect */}
            {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10%',
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${3 + Math.random() * 2}s`,
                            }}
                        >
                            <div
                                className={`w-3 h-3 ${['bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-pink-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]}`}
                                style={{
                                    transform: `rotate(${Math.random() * 360}deg)`,
                                    borderRadius: Math.random() > 0.5 ? '50%' : '0',
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in duration-300">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Header gradient */}
                <div className={`bg-gradient-to-br ${tier.color} p-8 text-white text-center relative overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />

                    <div className="relative">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                                    <Star size={48} fill="white" className="text-white" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                    <Sparkles size={16} className="text-yellow-800" />
                                </div>
                            </div>
                        </div>

                        <p className="text-white/80 font-medium mb-1">Parabéns! 🎉</p>
                        <h2 className="text-4xl font-bold mb-2">Nível {newLevel}</h2>
                        <p className="text-white/90 text-sm">
                            {tier.emoji} Tier {tier.tier}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Você subiu de nível!
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Continue assim para desbloquear novas conquistas e recompensas.
                    </p>

                    {/* Rewards hint */}
                    {newLevel % 5 === 0 && (
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl mb-6 border border-amber-100">
                            <div className="flex items-center justify-center gap-2 text-amber-700">
                                <Gift size={20} />
                                <span className="font-semibold">Nova conquista disponível!</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className={`w-full py-3 bg-gradient-to-r ${tier.color} text-white font-bold rounded-xl hover:shadow-lg transition-all`}
                    >
                        Continuar
                    </button>
                </div>
            </div>

            {/* Confetti animation styles */}
            <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
        </div>
    );
};

export default LevelUpModal;
