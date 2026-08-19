import { NextRequest, NextResponse } from 'next/server';
import type { ChatCompletion } from 'groq-sdk/resources/chat/completions';
import { groq, GROQ_TEXT_MODEL } from '@/lib/groq';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FirDetails {
  name?: string;
  fatherName?: string;
  address?: string;
  station?: string;
  district?: string;
  occurrence?: string;       // date/time of occurrence (user-entered)
  place?: string;            // place of occurrence
  property?: string;         // stolen property + value
}

interface FirRequest {
  incident: string;          // user's story in their own words
  type: string;              // e.g. "Mobile Snatching", "House Robbery"
  details?: FirDetails;
}

interface FirAnalysis {
  sections: string[];        // Urdu, e.g. ["دفعہ 380 ت۔پ (چوری)"]
  cognizable: boolean;
  bailable: boolean;
  punishment: string;        // Urdu punishment summary
}

const FIR_ANALYSIS_SYSTEM_PROMPT = `You are a Pakistani criminal law expert.
Analyze incidents under the Pakistan Penal Code (PPC).
Return ONLY a valid JSON object with keys: sections (string array), cognizable (boolean), bailable (boolean), punishment (string in Urdu).
No markdown, no explanation outside the JSON.`;

const DEFAULT_SECTIONS: Record<string, string[]> = {
  'Mobile Snatching': ['دفعہ 379 ت۔پ (چوری)', 'دفعہ 34 ت۔پ'],
  'House Robbery': ['دفعہ 457 ت۔پ (چوری)', 'دفعہ 380 ت۔پ (چوری)'],
  'Fraud / Cheating': ['دفعہ 420 ت۔پ (دھوکہ دہی)'],
  Murder: ['دفعہ 302 ت۔پ (قتل)'],
};

function parseFirAnalysis(raw: string, type: string): FirAnalysis {
  try {
    const trimmed = raw.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? trimmed) as Partial<FirAnalysis>;
    return {
      sections: Array.isArray(parsed.sections) && parsed.sections.length
        ? parsed.sections.map(String)
        : DEFAULT_SECTIONS[type] ?? ['دفعہ 379 ت۔پ'],
      cognizable: parsed.cognizable ?? true,
      bailable: parsed.bailable ?? false,
      punishment: parsed.punishment ?? 'قانون کے مطابق سزا',
    };
  } catch {
    return {
      sections: DEFAULT_SECTIONS[type] ?? ['دفعہ 379 ت۔پ'],
      cognizable: true,
      bailable: false,
      punishment: 'قانون کے مطابق سزا',
    };
  }
}

async function groqChatWithRetry(
  params: Parameters<typeof groq.chat.completions.create>[0] & { stream?: false },
  attempts = 3
): Promise<ChatCompletion> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await groq.chat.completions.create({ ...params, stream: false });
      return result as ChatCompletion;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

function buildFallbackStatement(
  incident: string,
  type: string,
  details: FirDetails | undefined,
  sections: string[]
): string {
  const station = details?.station ?? '____';
  const district = details?.district ?? '____';
  const name = details?.name ?? '____';
  const father = details?.fatherName ? ` ولد ${details.fatherName}` : '';
  const address = details?.address ?? '____';
  const occurrence = details?.occurrence ?? '____';
  const place = details?.place ?? '____';
  const property = details?.property ?? '____';
  const sectionText = sections.join('، ') || 'متعلقہ دفعات';

  return `بجناب SHO صاحب تھانہ ${station} ضلع ${district}۔ جنابِ عالی! گزارش ہے کہ میں مسمی ${name}${father} سکونت ${address} کا رہائشی ہوں۔ مورخہ ${occurrence} کو ${place} پر ${type} کا واقعہ پیش آیا۔ ${incident.trim()} متعلقہ دفعات: ${sectionText}۔ چوری/نقصان شدہ مال: ${property}۔ لہٰذا جنابِ عالی سے استدعا ہے کہ میری درخواست درج رجسٹر کر کے میرے ساتھ قانونی کارروائی کی جائے۔ عین نوازش ہوگی۔ مستغیث`;
}

export const maxDuration = 60;

// ── POST /api/generate-fir ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: FirRequest = await req.json();
    const { incident, type, details } = body;

    if (!incident?.trim()) {
      return NextResponse.json({ error: 'Incident description is required.' }, { status: 400 });
    }

    // ── Step 1: Extract sections + analyze offense (Urdu) ──────────────────
    const analysisPrompt = `
Analyze this incident under Pakistani law and return a JSON object.

Incident type: ${type}
Incident description: ${incident}

Return ONLY this JSON (no extra text):
{
  "sections": ["دفعہ 380 ت۔پ (چوری)", "دفعہ 34 ت۔پ"],
  "cognizable": true,
  "bailable": false,
  "punishment": "زیادہ سے زیادہ تین سال قید اور جرمانہ"
}

Rules:
- sections: array of applicable PPC sections written in URDU, format "دفعہ <number> ت۔پ (<short Urdu name>)". "ت۔پ" means تعزیراتِ پاکستان (PPC).
- cognizable: true if police can arrest without warrant
- bailable: true if bail is a right of the accused
- punishment: brief punishment summary in URDU
`;

    let analysis: FirAnalysis;
    try {
      const analysisRes = await groqChatWithRetry({
        model: GROQ_TEXT_MODEL,
        temperature: 0.1,
        max_tokens: 800,
        messages: [
          { role: 'system', content: FIR_ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: analysisPrompt },
        ],
      });
      analysis = parseFirAnalysis(analysisRes.choices[0]?.message?.content ?? '{}', type);
    } catch (analysisErr) {
      console.warn('[/api/generate-fir] Analysis failed, using defaults:', analysisErr);
      analysis = parseFirAnalysis('{}', type);
    }

    // ── Step 2: Generate formal FIR statement in URDU ──────────────────────
    const statementPrompt = `
آپ ایک پاکستانی پولیس FIR لکھنے کے ماہر ہیں۔ نیچے دیے گئے واقعہ کی بنیاد پر
"مستغیث بیان / تحریری درخواست" رسمی اردو میں لکھیں — بالکل اصلی FIR کی طرز پر۔

واقعہ کی قسم: ${type}
تفصیل (مستغیث کے الفاظ میں): ${incident}
متعلقہ دفعات: ${analysis.sections?.join('، ') ?? ''}
تھانہ: ${details?.station ?? '____'}
ضلع: ${details?.district ?? '____'}
جائے وقوعہ: ${details?.place ?? '____'}
تاریخ و وقت وقوعہ: ${details?.occurrence ?? '____'}
چوری شدہ مال: ${details?.property ?? '____'}

ہدایات (اصلی پاکستانی FIR کی تحریری درخواست کی طرز پر):
- آغاز بالکل اس طرح کریں: "بجناب SHO صاحب تھانہ ${details?.station ?? '____'} ضلع ${details?.district ?? '____'}۔ جنابِ عالی! گزارش ہے کہ میں مسمی ${details?.name ?? '____'} ${details?.fatherName ? 'ولد ' + details.fatherName : ''} سکونت ${details?.address ?? '____'} کا رہائشی ہوں۔"
- پھر لکھیں: "مورخہ ${details?.occurrence ?? '____'} کو ..." اور واقعہ ترتیب وار بیان کریں (جگہ ${details?.place ?? '____'}، طریقہ واردات، نامعلوم/ملزم کا فعل، چوری/نقصان شدہ مال: ${details?.property ?? '____'})۔
- پہلے شخص (میں) میں، رسمی عدالتی اردو میں لکھیں۔
- آخر میں بالکل اس طرح استدعا کریں: "لہٰذا جنابِ عالی سے استدعا ہے کہ میری درخواست درج رجسٹر کر کے میرے ساتھ قانونی کارروائی کی جائے۔ عین نوازش ہوگی۔ مستغیث"
- 120 سے 220 الفاظ کے درمیان رکھیں۔
- صرف بیان کا متن لوٹائیں، کوئی اضافی عنوان، نمبر یا انگریزی وضاحت نہیں۔
`;

    let statement = '';
    try {
      const statementRes = await groqChatWithRetry({
        model: GROQ_TEXT_MODEL,
        temperature: 0.4,
        max_tokens: 2500,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert Pakistani police FIR drafter. You write formal, court-style Urdu (Nastaliq) FIR statements. Output Urdu text only.',
          },
          { role: 'user', content: statementPrompt },
        ],
      });
      statement = statementRes.choices[0]?.message?.content?.trim() ?? '';
    } catch (statementErr) {
      console.warn('[/api/generate-fir] Statement generation failed:', statementErr);
    }

    if (!statement) {
      statement = buildFallbackStatement(incident, type, details, analysis.sections);
    }

    // ── Response ───────────────────────────────────────────────────────────
    return NextResponse.json({
      sections: analysis.sections ?? [],
      cognizable: analysis.cognizable ?? true,
      bailable: analysis.bailable ?? false,
      punishment: analysis.punishment ?? '',
      statement,
    });

  } catch (err) {
    console.error('[/api/generate-fir] Error:', err);
    return NextResponse.json(
      { error: 'Failed to generate FIR. Please try again.' },
      { status: 500 }
    );
  }
}
