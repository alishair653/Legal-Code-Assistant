import { QdrantClient } from '@qdrant/js-client-rest';
import { embedQuery } from '@/lib/embeddings';

export const LEGAL_COLLECTION = 'legal_sections';

export interface LegalSection {
  id: string;
  section_number: string;
  title: string;
  text: string;
  statute: string;
  full_reference: string;
  book_label?: string;
  category?: string;
  source_file?: string;
  part?: number;
}

export interface SearchResult {
  section: LegalSection;
  score: number;
}

function getClient(): QdrantClient {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;
  if (!url || !apiKey) {
    throw new Error('QDRANT_URL and QDRANT_API_KEY must be set in .env.local');
  }
  return new QdrantClient({ url, apiKey });
}

function payloadToSection(payload: Record<string, unknown>): LegalSection {
  return {
    id: String(payload.id ?? ''),
    section_number: String(payload.section_number ?? ''),
    title: String(payload.title ?? ''),
    text: String(payload.text ?? ''),
    statute: String(payload.statute ?? ''),
    full_reference: String(payload.full_reference ?? ''),
    book_label: payload.book_label ? String(payload.book_label) : undefined,
    category: payload.category ? String(payload.category) : undefined,
    source_file: payload.source_file ? String(payload.source_file) : undefined,
    part: payload.part != null ? Number(payload.part) : undefined,
  };
}

/** Vector search in Qdrant (same collection as create_embeddings.py). */
export async function searchLegalSections(
  query: string,
  limit = 5
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const vector = await embedQuery(query.trim());
  const client = getClient();

  const response = await client.query(LEGAL_COLLECTION, {
    query: vector,
    limit,
    with_payload: true,
  });

  const points = response.points ?? [];
  return points
    .filter((p) => p.payload)
    .map((p) => ({
      score: p.score ?? 0,
      section: payloadToSection(p.payload as Record<string, unknown>),
    }));
}

export function formatSectionsForPrompt(results: SearchResult[]): string {
  if (!results.length) {
    return 'No matching sections found in the database.';
  }
  return results
    .map(({ section, score }, i) => {
      const text = section.text.length > 2000 ? `${section.text.slice(0, 2000)}…` : section.text;
      return `[${i + 1}] ${section.full_reference} (relevance ${score.toFixed(3)})
Title: ${section.title}
${text}`;
    })
    .join('\n\n---\n\n');
}
