import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const reflectionSchema = z.object({
  content: z.string().min(1).max(5000),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.string().optional(),
});

export type AIReflection = {
  summary: string;
  reflection: string;
  possibleTrigger: string;
  suggestion: string;
  studyTip?: string;
  safetyNote?: string;
};

const SYSTEM_PROMPT = `You are MindCanvas, a warm, calm companion for Class 11 and 12 students in India.
You respond to a student's short journal entry with supportive reflection.

Rules:
- Never diagnose mental-health conditions.
- Never replace professional help.
- Never be preachy or use clinical language.
- Sound like a wise, kind older sibling — brief, honest, encouraging.
- If the entry describes severe or persistent distress (self-harm thoughts, hopelessness, feeling unsafe), gently set safetyNote encouraging the student to reach out to a trusted adult, teacher, counselor, or friend. Do not give medical advice.

Return ONLY JSON matching this exact shape (no markdown, no prose outside JSON):
{
  "summary": "1 sentence emotional summary of the day",
  "reflection": "2-3 sentences of warm, non-judgmental reflection",
  "possibleTrigger": "1 sentence naming a likely stress trigger, or '' if none",
  "suggestion": "1 concrete, tiny, practical suggestion for tonight or tomorrow",
  "studyTip": "1 short study tip ONLY if exams/subjects mentioned, else ''",
  "safetyNote": "gentle encouragement to talk to a trusted person, ONLY if severe distress detected, else ''"
}`;

export const generateReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reflectionSchema.parse(input))
  .handler(async ({ data, context }): Promise<AIReflection> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const userMsg = `Date: ${data.entryDate}\nMood: ${data.mood ?? "unspecified"}\n\nJournal entry:\n${data.content}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AI reflection]", response.status, errText);
      if (response.status === 429) throw new Error("Too many requests — try again in a moment.");
      if (response.status === 402) throw new Error("AI credits exhausted. Please add credits.");
      throw new Error("AI reflection failed.");
    }

    const json = await response.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: AIReflection;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        summary: "You showed up today — that counts.",
        reflection: raw.slice(0, 300),
        possibleTrigger: "",
        suggestion: "Take one slow breath before your next task.",
      };
    }

    // Persist reflection back to the row
    await context.supabase
      .from("journal_entries")
      .update({ ai_reflection: parsed as never })
      .eq("user_id", context.userId)
      .eq("entry_date", data.entryDate);

    return parsed;
  });