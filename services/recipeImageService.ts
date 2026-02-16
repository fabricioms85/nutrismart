import { Recipe } from '../types';

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined;
const CACHE_PREFIX = 'nutrismart_recipe_img_';
const CACHE_VERSION = '1';

function cacheKey(recipeId: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${recipeId}`;
}

/**
 * Busca no Unsplash uma foto que corresponda ao termo (em inglês) e retorna a URL.
 * Requer VITE_UNSPLASH_ACCESS_KEY no .env (chave em https://unsplash.com/oauth/applications).
 */
async function fetchUnsplashImageUrl(searchTerm: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY?.trim()) return null;
  const query = encodeURIComponent(searchTerm);
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const first = data.results?.[0];
    if (!first?.urls?.regular) return null;
    return first.urls.regular;
  } catch {
    return null;
  }
}

/**
 * Retorna a URL da imagem da receita: usa termo de busca no Unsplash (opção 2A) quando
 * há imageSearchTerm e VITE_UNSPLASH_ACCESS_KEY está definida, com cache em localStorage.
 * Caso contrário usa recipe.image como fallback.
 */
export async function getRecipeImageUrl(recipe: Recipe): Promise<string> {
  const fallback = recipe.image;
  const term = recipe.imageSearchTerm?.trim();
  if (!term) return fallback;

  try {
    const key = cacheKey(recipe.id);
    const cached = localStorage.getItem(key);
    if (cached) return cached;

    const url = await fetchUnsplashImageUrl(term);
    if (url) {
      localStorage.setItem(key, url);
      return url;
    }
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Resolve URLs de imagem para uma lista de receitas (com cache).
 * Útil para pré-carregar na página de Receitas.
 */
export async function getRecipeImageUrls(recipes: Recipe[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    recipes.map(async (r) => {
      out[r.id] = await getRecipeImageUrl(r);
    })
  );
  return out;
}
