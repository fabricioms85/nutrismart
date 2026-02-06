import React, { useState } from 'react';
import { Clock, Flame, ChevronRight, Search, ChefHat, Sparkles, Loader2 } from 'lucide-react';
import { Recipe } from '../types';
import { generateSmartRecipes } from '../services/geminiService';

const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Salada de Quinoa com Abacate',
    calories: 320,
    timeMinutes: 15,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    tags: ['Vegano', 'Sem Glúten'],
    difficulty: 'Fácil'
  },
  {
    id: '2',
    title: 'Frango Grelhado com Legumes',
    calories: 450,
    timeMinutes: 25,
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&q=80',
    tags: ['Proteico', 'Low Carb'],
    difficulty: 'Fácil'
  },
  {
    id: '3',
    title: 'Smoothie Verde Detox',
    calories: 180,
    timeMinutes: 5,
    image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&q=80',
    tags: ['Detox', 'Rápido'],
    difficulty: 'Fácil'
  },
  {
    id: '4',
    title: 'Salmão Assado com Ervas',
    calories: 520,
    timeMinutes: 35,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a7270028d?w=800&q=80',
    tags: ['Ômega 3', 'Keto'],
    difficulty: 'Médio'
  },
];

const Recipes: React.FC = () => {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>(MOCK_RECIPES);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!ingredients.trim()) return;

    setIsGenerating(true);
    try {
      const generatedData = await generateSmartRecipes(ingredients);
      
      const newRecipes: Recipe[] = generatedData.map((item: any, index: number) => ({
        id: `gen-${Date.now()}-${index}`,
        title: item.title,
        calories: item.calories,
        timeMinutes: item.timeMinutes,
        difficulty: item.difficulty,
        tags: item.tags,
        // Use a dynamic Unsplash source based on the English search term provided by AI
        image: `https://source.unsplash.com/800x600/?${encodeURIComponent(item.englishSearchTerm)},food`
      }));

      // Prepend generated recipes to the list
      setRecipes([...newRecipes, ...MOCK_RECIPES]);
    } catch (error) {
      alert("Não foi possível gerar receitas no momento. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
          <ChefHat className="text-nutri-500" size={32} />
          Chef Inteligente
        </h1>
        <p className="text-gray-500 mb-8">
          Diga-nos o que você tem na geladeira e nossa IA criará receitas deliciosas e saudáveis para você agora mesmo.
        </p>

        {/* AI Input Section */}
        <div className="bg-white p-2 rounded-2xl shadow-lg shadow-nutri-100 border border-gray-100 flex flex-col md:flex-row gap-2">
          <input 
            type="text" 
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="Ex: Frango, batata doce, cebola, ovos..." 
            className="flex-1 px-6 py-4 rounded-xl outline-none text-gray-700 placeholder-gray-400 bg-transparent"
          />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !ingredients.trim()}
            className={`px-8 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md ${
              isGenerating || !ingredients.trim()
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-gradient-to-r from-nutri-500 to-nutri-600 hover:shadow-lg hover:shadow-nutri-200 hover:scale-[1.02]'
            }`}
          >
            {isGenerating ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Sparkles size={20} />
            )}
            {isGenerating ? 'Criando...' : 'Gerar Receitas'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {recipes.length > MOCK_RECIPES.length ? 'Sugestões para Você' : 'Receitas Populares'}
        </h2>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Filtrar..." 
            className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-nutri-500 outline-none w-48"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition cursor-pointer flex flex-col h-full">
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <img 
                src={recipe.image} 
                alt={recipe.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
                }}
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-gray-700 shadow-sm">
                {recipe.difficulty}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase font-bold tracking-wider text-nutri-600 bg-nutri-50 px-2 py-1 rounded-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{recipe.title}</h3>
              
              <div className="mt-auto">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-1">
                    <Flame size={14} className="text-orange-500" />
                    {recipe.calories} kcal
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-blue-500" />
                    {recipe.timeMinutes} min
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-xl border border-nutri-200 text-nutri-600 font-medium hover:bg-nutri-50 transition flex items-center justify-center gap-1">
                  Ver Receita <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recipes;