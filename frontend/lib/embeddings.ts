/**
 * Query embeddings — must match create_embeddings.py model (384-dim).
 */
import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';

let extractor: FeatureExtractionPipeline | null = null;

export async function embedQuery(text: string): Promise<number[]> {
  if (!extractor) {
    extractor = (await pipeline(
      'feature-extraction',
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
    )) as FeatureExtractionPipeline;
  }
  // Cast options: @xenova/transformers types conflict String.normalize with boolean normalize
  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  } as { pooling: 'mean'; normalize: boolean });
  return Array.from(output.data as Float32Array);
}
