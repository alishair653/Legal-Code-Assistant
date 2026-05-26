import Groq from 'groq-sdk';

// ── Client ────────────────────────────────────────────────────────────────────
// Single shared Groq instance — used by all API routes
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// ── Models ────────────────────────────────────────────────────────────────────
// Text-only model for legal Q&A and FIR generation
export const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';

// Vision model — used when user attaches an image in chat
export const GROQ_VISION_MODEL = 'llama-3.2-11b-vision-preview';

// ── System prompts ────────────────────────────────────────────────────────────

/** Base system prompt for all legal Q&A */
export const LEGAL_SYSTEM_PROMPT = `You are an expert AI assistant for Pakistani law.
You specialize in:
- Pakistan Penal Code (PPC 1860)
- Code of Criminal Procedure (CrPC 1898)
- Qanun-e-Shahadat Order (QSO 1984)
- Constitution of Pakistan 1973
- Other Pakistani statutes and ordinances

RULES:
1. Always cite exact section numbers (e.g., "Section 302 PPC", "Section 497 CrPC")
2. Be precise and accurate — lives and freedoms depend on legal advice
3. If unsure, say so clearly rather than guessing
4. Answer in English but you understand Roman Urdu queries
5. Keep answers concise but complete
6. Always mention bail eligibility when discussing criminal offenses
7. End with a disclaimer: "Consult a qualified lawyer for your specific case."`;

/** System prompt for image/document analysis */
export const VISION_SYSTEM_PROMPT = `You are an expert Pakistani legal document analyst.
When shown a legal document image:
1. First extract and read ALL text visible in the image
2. Identify the document type (FIR, contract, notice, court order, etc.)
3. List all legal sections/provisions cited
4. Explain what the document means in plain English
5. Identify any issues, missing elements, or important deadlines
6. Provide actionable next steps

Always cite Pakistani law sections where relevant.
End with: "Consult a qualified lawyer before taking legal action."`;

/** System prompt for FIR generation */
export const FIR_SYSTEM_PROMPT = `You are a Pakistani police legal expert specializing in FIR drafting.
Given an incident description, you must:
1. Identify the correct PPC sections that apply
2. Determine if the offense is cognizable/non-cognizable and bailable/non-bailable
3. Write a formal FIR statement in professional legal English
4. Be accurate with section numbers — incorrect sections can get a case dismissed

Return ONLY valid JSON. No explanation outside the JSON.`;

// ── Helper: simple chat completion ────────────────────────────────────────────
export async function chatCompletion(
  userMessage: string,
  systemPrompt: string = LEGAL_SYSTEM_PROMPT,
  temperature = 0.3
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    temperature,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  return response.choices[0]?.message?.content ?? 'No response from AI.';
}

// ── Helper: vision chat (image + text) ───────────────────────────────────────
export async function visionCompletion(
  userMessage: string,
  imageBase64: string, // full data URL e.g. "data:image/png;base64,..."
  systemPrompt: string = VISION_SYSTEM_PROMPT
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: GROQ_VISION_MODEL,
    temperature: 0.3,
    max_tokens: 1500,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageBase64 } },
          { type: 'text', text: userMessage || 'Analyze this legal document.' },
        ],
      },
    ],
  });

  return response.choices[0]?.message?.content ?? 'No response from AI.';
}
