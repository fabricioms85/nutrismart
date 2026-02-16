import React from 'react';
import { Check, Crown, Star, Zap } from 'lucide-react';

const Plans: React.FC = () => {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Escolha o seu Plano</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Desbloqueie todo o potencial da sua saúde com nossos planos premium. Cancele quando quiser.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Free Plan */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col hover:border-nutri-200 transition relative">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Gratuito</h3>
          <p className="text-sm text-gray-500 mb-6">Para quem está começando</p>
          <div className="text-4xl font-bold text-gray-900 mb-6">R$ 0 <span className="text-sm font-normal text-gray-500">/mês</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={18} className="text-nutri-500" /> Registro de Refeições</li>
            <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={18} className="text-nutri-500" /> Contador de Calorias</li>
            <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={18} className="text-nutri-500" /> 5 Receitas por mês</li>
          </ul>

          <button className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition">
            Plano Atual
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 flex flex-col relative transform md:-translate-y-4 shadow-xl">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-nutri-500 to-nutri-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
            MAIS POPULAR
          </div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Crown size={20} className="text-nutri-400" /> Premium</h3>
          <p className="text-sm text-gray-400 mb-6">Tudo para seus objetivos</p>
          <div className="text-4xl font-bold text-white mb-6">R$ 29 <span className="text-sm font-normal text-gray-400">/mês</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={18} className="text-nutri-500" /> Tudo do Gratuito</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={18} className="text-nutri-500" /> Receitas Ilimitadas</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={18} className="text-nutri-500" /> NutriAI Avançado</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={18} className="text-nutri-500" /> Sem Anúncios</li>
          </ul>

          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-nutri-500 to-nutri-600 text-white font-bold hover:shadow-lg hover:shadow-nutri-900/20 transition">
            Assinar Agora
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col hover:border-nutri-200 transition">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nutri Pro</h3>
          <p className="text-sm text-gray-500 mb-6">Acompanhamento profissional</p>
          <div className="text-4xl font-bold text-gray-900 mb-6">R$ 89 <span className="text-sm font-normal text-gray-500">/mês</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={18} className="text-nutri-500" /> Tudo do Premium</li>
            <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={18} className="text-nutri-500" /> Chat com Nutricionista</li>
            <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={18} className="text-nutri-500" /> Planos Personalizados</li>
          </ul>

          <button className="w-full py-3 rounded-xl border border-nutri-200 text-nutri-700 font-semibold hover:bg-nutri-50 transition">
            Falar com Consultor
          </button>
        </div>

      </div>
    </div>
  );
};

export default Plans;