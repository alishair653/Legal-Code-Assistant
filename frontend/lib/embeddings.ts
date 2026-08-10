/**
 * Query embeddings — must match create_embeddings.py model (384-dim).
 * Dynamic import keeps @xenova/transformers out of the static module graph
 * (important for Vercel serverless builds).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      return pipeline(
        'feature-extraction',
        'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
      );
    })();
  }
  return extractorPromise;
}

export async function embedQuery(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}
