/**
 * Gera icon-192.png e icon-512.png a partir de logo.png com fundo branco,
 * para a splash do PWA não exibir transparência como preto.
 * Uso: node scripts/generate-pwa-icons.mjs
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const logoPath = path.join(publicDir, 'logo.png');
const white = { r: 255, g: 255, b: 255 };

async function main() {
  try {
    await sharp(logoPath)
      .resize(512, 512, { fit: 'contain', position: 'center', background: white })
      .flatten({ background: white })
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));

    await sharp(logoPath)
      .resize(192, 192, { fit: 'contain', position: 'center', background: white })
      .flatten({ background: white })
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));

    console.log('Ícones PWA gerados: public/icon-192.png e public/icon-512.png (fundo branco)');
  } catch (err) {
    console.error('Erro ao gerar ícones:', err.message);
    process.exit(1);
  }
}

main();
