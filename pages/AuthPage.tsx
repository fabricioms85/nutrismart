import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, Sparkles } from 'lucide-react';

interface AuthPageProps {
    onSignIn: (email: string, password: string) => Promise<void>;
    onSignUp: (email: string, password: string, name: string) => Promise<void>;
}

export default function AuthPage({ onSignIn, onSignUp }: AuthPageProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await onSignIn(email, password);
            } else {
                if (!name.trim()) {
                    setError('Por favor, informe seu nome');
                    setLoading(false);
                    return;
                }
                await onSignUp(email, password, name);
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            if (err.message.includes('Invalid login credentials')) {
                setError('Email ou senha incorretos');
            } else if (err.message.includes('User already registered')) {
                setError('Este email já está cadastrado');
            } else if (err.message.includes('Password should be at least')) {
                setError('A senha deve ter pelo menos 6 caracteres');
            } else {
                setError(err.message || 'Ocorreu um erro. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-nutri-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />

            <div className="w-full max-w-md relative z-10 text-center">
                {/* Logo */}
                <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-nutri-500 to-nutri-600 rounded-[2rem] shadow-xl shadow-nutri-500/30 mb-6 rotate-3">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="font-heading font-extrabold text-4xl text-gray-900 mb-2 tracking-tight">NutriSmart</h1>
                    <p className="text-gray-500 font-medium tracking-wide">Sua jornada saudável começa aqui</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200/50 border border-white/50 backdrop-blur-sm">
                    {/* Tabs */}
                    <div className="flex bg-gray-50 rounded-2xl p-1.5 mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isLogin
                                ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${!isLogin
                                ? 'bg-white text-gray-900 shadow-md transform scale-[1.02]'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Criar conta
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="group text-left">
                                <label className="text-xs font-bold text-gray-400 ml-4 mb-1.5 block uppercase tracking-wider">Nome</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-nutri-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Como devemos te chamar?"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-nutri-500 focus:shadow-lg focus:shadow-nutri-500/10 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="group text-left">
                            <label className="text-xs font-bold text-gray-400 ml-4 mb-1.5 block uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-nutri-500 transition-colors" />
                                <input
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-nutri-500 focus:shadow-lg focus:shadow-nutri-500/10 transition-all font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="group text-left">
                            <label className="text-xs font-bold text-gray-400 ml-4 mb-1.5 block uppercase tracking-wider">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-nutri-500 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-nutri-500 focus:shadow-lg focus:shadow-nutri-500/10 transition-all font-medium"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm font-medium text-center animate-fade-in flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl shadow-gray-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Acessar Conta' : 'Começar Agora'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {isLogin && (
                        <button className="w-full mt-6 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">
                            Esqueceu sua senha?
                        </button>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-xs mt-8">
                    Ao continuar, você concorda com nossos <a href="#" className="underline hover:text-nutri-600">Termos de Uso</a> e <a href="#" className="underline hover:text-nutri-600">Política de Privacidade</a>
                </p>
            </div>
        </div>
    );
}
