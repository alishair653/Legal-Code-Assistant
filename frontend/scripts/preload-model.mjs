/**
 * Run this ONCE before starting the dev server to pre-download the embedding model.
 * Usage: node scripts/preload-model.mjs
 *
 * Downloads ~120MB to .xenova-cache/ folder (one-time, then cached forever).
 */
import { pipeline, env } from '@xenova/transformers';

env.cacheDir = './.xenova-cache';

console.log('Downloading paraphrase-multilingual-MiniLM-L12-v2 model...');
console.log('This is a one-time ~120MB download. Please wait...\n');

const extractor = await pipeline(
  'feature-extraction',
  'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
);

// Quick test to confirm it works
const out = await extractor('Test legal query', { pooling: 'mean', normalize: true });
console.log(`\nModel loaded! Vector size: ${out.data.length}`);
console.log('First 3 values:', Array.from(out.data).slice(0, 3));
console.log('\nDone! You can now run: npm run dev');
console.log('The model is cached in .xenova-cache/ and will load instantly from now on.');
