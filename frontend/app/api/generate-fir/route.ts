import { NextRequest, NextResponse } from 'next/server';
import { groq, FIR_SYSTEM_PROMPT, GROQ_TEXT_MODEL } from '@/lib/groq';

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

    const analysisRes = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      temperature: 0.1, // low temperature for accurate section detection
      max_tokens: 400,
      messages: [
        { role: 'system', content: FIR_SYSTEM_PROMPT },
        { role: 'user', content: analysisPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis: FirAnalysis = JSON.parse(
      analysisRes.choices[0]?.message?.content ?? '{}'
    );

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

    const statementRes = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      temperature: 0.4,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert Pakistani police FIR drafter. You write formal, court-style Urdu (Nastaliq) FIR statements. Output Urdu text only.',
        },
        { role: 'user', content: statementPrompt },
      ],
    });

    const statement = statementRes.choices[0]?.message?.content?.trim() ?? '';

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
