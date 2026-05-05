import React, { useState, useEffect } from 'react';
import { Clock, Flame, ChevronRight, Search, ChefHat, Sparkles, Loader2, X } from 'lucide-react';
import { Recipe } from '../types';
import { generateSmartRecipes } from '../services/geminiService';
import { getRecipeImageUrls } from '../services/recipeImageService';
import { CURATED_RECIPES } from '../data/curatedRecipes';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

const Recipes: React.FC = () => {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>(CURATED_RECIPES);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const hasAiSuggestions = recipes.length > CURATED_RECIPES.length;

  useEffect(() => {
    let cancelled = false;
    getRecipeImageUrls(recipes).then((urls) => {
      if (!cancelled) setImageUrls(urls);
    });
    return () => { cancelled = true; };
  }, [recipes]);

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
        image: PLACEHOLDER_IMAGE,
        imageSearchTerm: item.englishSearchTerm ? String(item.englishSearchTerm).trim() : undefined,
      }));

      setRecipes([...newRecipes, ...CURATED_RECIPES]);
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
          {hasAiSuggestions ? 'Sugestões para Você' : 'Receitas saudáveis'}
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
          <div
            key={recipe.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedRecipe(recipe)}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedRecipe(recipe)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition cursor-pointer flex flex-col h-full"
          >
            <div className="relative h-48 overflow-hidden bg-gray-100">
              <img 
                src={imageUrls[recipe.id] ?? recipe.image} 
                alt={recipe.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecipe(recipe);
                  }}
                  className="w-full py-2.5 rounded-xl border border-nutri-200 text-nutri-600 font-medium hover:bg-nutri-50 transition flex items-center justify-center gap-1"
                >
                  Ver Receita <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedRecipe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedRecipe(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="recipe-modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-48 sm:h-56 flex-shrink-0 bg-gray-100">
              <img
                src={imageUrls[selectedRecipe.id] ?? selectedRecipe.image}
                alt={selectedRecipe.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                }}
              />
              <button
                type="button"
                onClick={() => setSelectedRecipe(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm"
                aria-label="Fechar"
              >
                <X size={20} className="text-gray-700" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <h2 id="recipe-modal-title" className="text-xl font-bold text-gray-900 mb-2">
                {selectedRecipe.title}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedRecipe.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase font-bold tracking-wider text-nutri-600 bg-nutri-50 px-2 py-1 rounded-sm">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Flame size={14} className="text-orange-500" />
                  {selectedRecipe.calories} kcal
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-blue-500" />
                  {selectedRecipe.timeMinutes} min
                </span>
                <span>{selectedRecipe.difficulty}</span>
              </div>
              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                <>
                  <h3 className="font-semibold text-gray-900 mb-2">Ingredientes</h3>
                  <ul className="list-disc pl-5 text-gray-600 text-sm space-y-1 mb-4">
                    {selectedRecipe.ingredients.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 ? (
                <>
                  <h3 className="font-semibold text-gray-900 mb-2">Modo de preparo</h3>
                  <ol className="list-decimal pl-5 text-gray-600 text-sm space-y-2">
                    {selectedRecipe.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </>
              ) : null}
              {(!selectedRecipe.ingredients?.length && !selectedRecipe.instructions?.length) && (
                <p className="text-gray-500 text-sm italic">
                  Ingredientes e modo de preparo em breve para esta receita.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;