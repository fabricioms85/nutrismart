/**
 * Script one-off: busca no Unsplash uma imagem para cada imageSearchTerm
 * das receitas e imprime as URLs. Requer VITE_UNSPLASH_ACCESS_KEY no .env.
 *
 * Uso: node scripts/fetch-recipe-images.js
 * Ou: VITE_UNSPLASH_ACCESS_KEY=xxx node scripts/fetch-recipe-images.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const KEY = process.env.VITE_UNSPLASH_ACCESS_KEY;
const RECIPES_PATH = path.join(__dirname, '..', 'data', 'curatedRecipes.ts');

if (!KEY) {
  console.error('Defina VITE_UNSPLASH_ACCESS_KEY no .env e rode novamente.');
  process.exit(1);
}

const searchTerms = [
  'spinach egg white omelette healthy',
  'chicken mustard herbs sauce',
  'quinoa bowl roasted vegetables',
  'green smoothie avocado spinach',
  'baked salmon herbs lemon',
  'brazilian tapioca egg cheese breakfast',
  'grilled chicken broccoli sweet potato',
  'caesar salad chicken parmesan',
  'overnight oats berries',
  'baked tilapia vegetables',
  'vegetable wrap hummus',
  'ground beef zucchini noodles zoodles',
  'lentil soup vegetables',
  'brazilian cheese bread gluten free',
  'chicken stir fry vegetables ginger',
  'avocado banana smoothie protein',
  'stuffed eggplant ground beef cheese',
  'oatmeal porridge cinnamon apple',
  'ceviche fish avocado lime',
  'chickpea burger vegan',
  'poached eggs avocado toast',
  'zucchini spaghetti meatballs tomato sauce',
  'chia pudding coconut mango',
  'grilled turkey breast asparagus',
  'chickpea curry brown rice',
  'banana oat pancake healthy',
  'grilled tuna salad greens',
  'roasted cauliflower cheese',
  'protein shake coffee iced',
  'mushroom risotto',
];

async function fetchImageUrl(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}` } });
  if (!res.ok) return null;
  const data = await res.json();
  const first = data.results?.[0];
  return first?.urls?.regular || null;
}

async function main() {
  const results = [];
  for (let i = 0; i < searchTerms.length; i++) {
    const url = await fetchImageUrl(searchTerms[i]);
    results.push({ id: `curated-${i + 1}`, query: searchTerms[i], image: url || '' });
    process.stdout.write(`\r${i + 1}/${searchTerms.length}`);
  }
  console.log('\n');
  fs.writeFileSync(
    path.join(__dirname, '..', 'scripts', 'recipe-image-urls.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('Salvo em scripts/recipe-image-urls.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
