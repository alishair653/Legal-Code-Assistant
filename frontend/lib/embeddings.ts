/**
 * Query embeddings — must match create_embeddings.py model (384-dim).
 */
import { pipeline } from '@xenova/transformers';

type Extractor = Awaited<ReturnType<typeof pipeline>>;

let extractor: Extractor | null = null;

export async function embedQuery(text: string): Promise<number[]> {
  if (!extractor) {
    extractor = await pipeline(
      'feature-extraction',
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
    );
  }
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}
