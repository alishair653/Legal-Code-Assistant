import { NextRequest, NextResponse } from 'next/server';
import { groq, GROQ_TEXT_MODEL, GROQ_VISION_MODEL, LEGAL_SYSTEM_PROMPT, VISION_SYSTEM_PROMPT } from '@/lib/groq';
import { getCurrentUser } from '@/lib/supabase';
import { getUserPlan, checkDailyLimit, incrementUsage, saveQuery } from '@/lib/supabase-admin';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatRequest {
  message: string;
  image?: string; // base64 data URL — present when user pastes/uploads image
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, image } = body;

    // Validate — need at least a message OR an image
    if (!message?.trim() && !image) {
      return NextResponse.json({ error: 'Message or image is required.' }, { status: 400 });
    }

    // ── Auth check ────────────────────────────────────────────────────────────
    // getCurrentUser() may return null if user is not logged in or cookie unavailable
    const user = await getCurrentUser().catch(() => null);
    let remainingQueries: number | null = null;

    if (user) {
      const plan = await getUserPlan(user.id);

      // Free users have a 10 queries/day limit
      if (plan === 'free') {
        const { allowed, remaining } = await checkDailyLimit(user.id);
        if (!allowed) {
          return NextResponse.json(
            {
              error: 'Daily limit reached',
              message: "You've used all 10 free queries for today. Upgrade to Pro for unlimited access.",
              upgradeUrl: '/pricing',
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': '10',
                'X-RateLimit-Remaining': '0',
              },
            }
          );
        }
        remainingQueries = remaining - 1;
      }
    }

    // ── Call Groq ─────────────────────────────────────────────────────────────
    let answer: string;

    if (image) {
      // Vision mode — user sent an image (screenshot, FIR photo, contract, etc.)
      const response = await groq.chat.completions.create({
        model: GROQ_VISION_MODEL,
        temperature: 0.3,
        max_tokens: 1500,
        messages: [
          { role: 'system', content: VISION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: image } },
              { type: 'text', text: message?.trim() || 'Analyze this legal document and explain it.' },
            ],
          },
        ],
      });
      answer = response.choices[0]?.message?.content ?? 'Could not analyze the image.';
    } else {
      // Text mode — regular legal question
      const response = await groq.chat.completions.create({
        model: GROQ_TEXT_MODEL,
        temperature: 0.3,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: LEGAL_SYSTEM_PROMPT },
          { role: 'user', content: message.trim() },
        ],
      });
      answer = response.choices[0]?.message?.content ?? 'Could not generate a response.';
    }

    // ── Save to DB + increment usage (logged-in users only) ───────────────────
    if (user) {
      await Promise.all([
        saveQuery(user.id, message ?? '[image]', answer),
        incrementUsage(user.id),
      ]);
    }

    // ── Response ──────────────────────────────────────────────────────────────
    return NextResponse.json(
      { answer, remainingQueries: remainingQueries ?? null },
      { status: 200 }
    );

  } catch (err) {
    console.error('[/api/chat] Error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
