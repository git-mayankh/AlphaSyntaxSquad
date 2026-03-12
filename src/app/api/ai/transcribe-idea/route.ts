import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

export const runtime = "edge";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { transcript } = await req.json();

  if (!transcript || transcript.trim().length < 10) {
    return Response.json({ idea: null });
  }

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You analyze voice conversation transcripts from brainstorming sessions. Extract clear, actionable ideas only.`,
    prompt: `Analyze this voice transcript from a brainstorming session:
"${transcript}"

Does this contain a clear, actionable idea or concept?
- If YES: respond with ONLY the idea as a single concise sentence (max 100 characters). No explanation, no prefix.
- If NO (just discussion, questions, filler): respond with exactly: NULL`,
    maxOutputTokens: 80,
  });

  const cleaned = text.trim();
  const idea = cleaned === "NULL" || cleaned.toLowerCase() === "null" || !cleaned ? null : cleaned;
  return Response.json({ idea });
}
