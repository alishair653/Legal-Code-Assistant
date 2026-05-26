import { NextRequest, NextResponse } from 'next/server';
import { groq, FIR_SYSTEM_PROMPT, GROQ_TEXT_MODEL } from '@/lib/groq';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FirRequest {
  incident: string; // user's story in their own words
  type: string;     // e.g. "Mobile Snatching", "House Robbery"
}

interface FirAnalysis {
  sections: string[];          // e.g. ["PPC § 392", "PPC § 34"]
  cognizable: boolean;
  bailable: boolean;
  statement: string;           // formal FIR statement text
  punishment: string;          // brief punishment summary
}

// ── POST /api/generate-fir ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: FirRequest = await req.json();
    const { incident, type } = body;

    if (!incident?.trim()) {
      return NextResponse.json({ error: 'Incident description is required.' }, { status: 400 });
    }

    // ── Step 1: Extract sections + analyze offense ─────────────────────────
    const analysisPrompt = `
Analyze this incident and return a JSON object:

Incident type: ${type}
Incident description: ${incident}

Return ONLY this JSON (no extra text):
{
  "sections": ["PPC § 392", "PPC § 34"],
  "cognizable": true,
  "bailable": false,
  "punishment": "Up to 10 years rigorous imprisonment and fine"
}

Rules:
- sections: array of applicable PPC sections with § symbol
- cognizable: true if police can arrest without warrant
- bailable: true if bail is a right of the accused
- punishment: brief punishment summary from PPC
`;

    const analysisRes = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      temperature: 0.1, // low temperature for accurate section detection
      max_tokens: 300,
      messages: [
        { role: 'system', content: FIR_SYSTEM_PROMPT },
        { role: 'user', content: analysisPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis: FirAnalysis = JSON.parse(
      analysisRes.choices[0]?.message?.content ?? '{}'
    );

    // ── Step 2: Generate formal FIR statement ──────────────────────────────
    const statementPrompt = `
Write a formal FIR statement in professional legal English for this incident:

Incident type: ${type}
Description: ${incident}
Applicable sections: ${analysis.sections?.join(', ')}

Rules:
- Write in first person ("I, the complainant...")
- Use formal legal language
- Be chronological and detailed
- Include place, time, manner of offense
- Mention the accused's actions clearly
- Keep it between 150-250 words
- Do NOT include complainant personal details (leave as placeholders)

Return ONLY the statement text, nothing else.
`;

    const statementRes = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: 'system', content: FIR_SYSTEM_PROMPT },
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
