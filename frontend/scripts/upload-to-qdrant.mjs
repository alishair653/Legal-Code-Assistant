/**
 * Step 5: Embed legal sections and upload to Qdrant.
 * Uses @xenova/transformers (ONNX, no Python torch needed).
 *
 * Usage:
 *   cd frontend
 *   node scripts/upload-to-qdrant.mjs              # full upload (resume)
 *   node scripts/upload-to-qdrant.mjs --recreate   # drop collection and start fresh
 *   node scripts/upload-to-qdrant.mjs --limit 20   # smoke test (20 records only)
 *   node scripts/upload-to-qdrant.mjs --status     # show upload progress
 */

import { pipeline, env } from '@xenova/transformers';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(FRONTEND_ROOT, '..');

env.cacheDir = resolve(FRONTEND_ROOT, '.xenova-cache');
env.allowLocalModels = true;

// ── Config ──────────────────────────────────────────────────────────────────
const INPUT_JSON = resolve(REPO_ROOT, 'legal-data', 'processed', 'all_legal_data.json');
const CHECKPOINT = resolve(REPO_ROOT, 'legal-data', 'processed', '.embeddings_progress.json');
const COLLECTION = 'legal_sections';
const VECTOR_SIZE = 384;
const BATCH_SIZE = 32;
const MAX_EMBED_CHARS = 8000;
const MAX_PAYLOAD_TEXT = 12000;

// ── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const RECREATE = args.includes('--recreate');
const STATUS_ONLY = args.includes('--status');
const LIMIT_IDX = args.indexOf('--limit');
const LIMIT = LIMIT_IDX !== -1 ? parseInt(args[LIMIT_IDX + 1]) : null;

// ── Load env ─────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(FRONTEND_ROOT, '.env.local');
  if (!existsSync(envPath)) throw new Error('.env.local not found in frontend/');
  const text = readFileSync(envPath, 'utf-8');
  const vars = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

// ── Qdrant HTTP client ────────────────────────────────────────────────────────
function makeQdrant(url, apiKey) {
  const base = url.replace(/\/$/, '');
  const headers = { 'Content-Type': 'application/json', 'api-key': apiKey };

  async function req(method, path, body) {
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Qdrant ${method} ${path} -> ${res.status}: ${text}`);
    return text ? JSON.parse(text) : {};
  }

  return {
    getCollections: () => req('GET', '/collections'),
    createCollection: (name, cfg) => req('PUT', `/collections/${name}`, cfg),
    deleteCollection: (name) => req('DELETE', `/collections/${name}`),
    createIndex: (name, field) => req('PUT', `/collections/${name}/index`, { field_name: field, field_schema: 'keyword' }),
    upsert: (name, points) => req('PUT', `/collections/${name}/points`, { points }),
    count: (name) => req('POST', `/collections/${name}/points/count`, { exact: true }),
  };
}

// ── Checkpoint ───────────────────────────────────────────────────────────────
function loadCheckpoint() {
  if (!existsSync(CHECKPOINT)) return { uploaded_ids: [] };
  try { return JSON.parse(readFileSync(CHECKPOINT, 'utf-8')); }
  catch { return { uploaded_ids: [] }; }
}

function saveCheckpoint(uploadedIds) {
  writeFileSync(CHECKPOINT, JSON.stringify({ uploaded_ids: uploadedIds }, null, 2));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const envVars = loadEnv();
  const QDRANT_URL = envVars.QDRANT_URL;
  const QDRANT_API_KEY = envVars.QDRANT_API_KEY;
  if (!QDRANT_URL || !QDRANT_API_KEY) {
    throw new Error('QDRANT_URL and QDRANT_API_KEY must be set in frontend/.env.local');
  }

  console.log('Qdrant URL:', QDRANT_URL);

  const qdrant = makeQdrant(QDRANT_URL, QDRANT_API_KEY);

  // Load sections
  if (!existsSync(INPUT_JSON)) throw new Error(`Input not found: ${INPUT_JSON}`);
  const data = JSON.parse(readFileSync(INPUT_JSON, 'utf-8'));
  let sections = data.sections || [];
  if (LIMIT) sections = sections.slice(0, LIMIT);

  console.log(`Loaded ${sections.length} sections from all_legal_data.json`);

  // Status only
  if (STATUS_ONLY) {
    const ck = loadCheckpoint();
    console.log(`Already uploaded: ${ck.uploaded_ids.length}`);
    try {
      const res = await qdrant.count(COLLECTION);
      console.log(`Qdrant collection count: ${res.result?.count ?? 'unknown'}`);
    } catch (e) {
      console.log('Could not reach Qdrant:', e.message);
    }
    return;
  }

  // Recreate collection
  if (RECREATE) {
    console.log('Dropping existing collection...');
    try { await qdrant.deleteCollection(COLLECTION); console.log('Collection deleted.'); }
    catch (e) { console.log('Delete skipped (may not exist):', e.message); }
    writeFileSync(CHECKPOINT, JSON.stringify({ uploaded_ids: [] }, null, 2));
  }

  // Ensure collection exists
  let collections;
  try {
    const r = await qdrant.getCollections();
    collections = r.result?.collections?.map(c => c.name) ?? [];
  } catch (e) {
    throw new Error(`Cannot reach Qdrant: ${e.message}`);
  }

  if (!collections.includes(COLLECTION)) {
    console.log(`Creating collection "${COLLECTION}" (${VECTOR_SIZE}-dim)...`);
    await qdrant.createCollection(COLLECTION, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });
    console.log('Collection created.');
    // Create payload indexes for section_number and statute (required for filtering)
    await qdrant.createIndex(COLLECTION, 'section_number');
    await qdrant.createIndex(COLLECTION, 'statute');
    console.log('Payload indexes created (section_number, statute).');
  } else {
    console.log(`Collection "${COLLECTION}" exists.`);
  }

  // Load checkpoint
  const checkpoint = loadCheckpoint();
  const doneIds = new Set(checkpoint.uploaded_ids);
  const pending = sections.filter(s => !doneIds.has(s.id));
  console.log(`Already uploaded: ${doneIds.size} | Remaining: ${pending.length}`);

  if (!pending.length) {
    console.log('Nothing to do — all sections already uploaded.');
    return;
  }

  // Load embedding model
  console.log('\nLoading embedding model (paraphrase-multilingual-MiniLM-L12-v2)...');
  const extractor = await pipeline(
    'feature-extraction',
    'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
  );
  console.log('Model ready.\n');

  // Embed + upload in batches
  const allUploadedIds = [...doneIds];
  let totalUploaded = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const texts = batch.map(s => {
      const combined = `${s.title || ''} ${s.text || ''}`.slice(0, MAX_EMBED_CHARS);
      return combined.trim();
    });

    // Embed batch
    const vectors = [];
    for (const text of texts) {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      vectors.push(Array.from(output.data));
    }

    // Build Qdrant points
    const points = batch.map((s, idx) => ({
      id: Math.abs(hashString(s.id)) % 2147483647 + 1,
      vector: vectors[idx],
      payload: {
        id: s.id,
        section_number: s.section_number || '',
        title: s.title || '',
        text: (s.text || '').slice(0, MAX_PAYLOAD_TEXT),
        statute: s.statute || '',
        full_reference: s.full_reference || '',
        book_label: s.book_label || '',
        category: s.category || '',
        source_file: s.source_file || '',
        part: s.part || 1,
      },
    }));

    // Upload
    await qdrant.upsert(COLLECTION, points);

    batch.forEach(s => allUploadedIds.push(s.id));
    totalUploaded += batch.length;
    saveCheckpoint(allUploadedIds);

    const pct = Math.round((100 * (doneIds.size + totalUploaded)) / sections.length);
    process.stdout.write(
      `\rUploaded: ${doneIds.size + totalUploaded} / ${sections.length} (${pct}%)   `
    );
  }

  console.log(`\n\nDone! Uploaded ${totalUploaded} new records.`);
  const countRes = await qdrant.count(COLLECTION);
  console.log(`Total in Qdrant collection: ${countRes.result?.count ?? 'unknown'}`);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash;
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
