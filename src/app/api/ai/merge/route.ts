import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

export const runtime = "edge";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { idea1, idea2 } = await req.json();

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are an expert product strategist. Always respond with valid JSON only, no markdown, no extra text.`,
    prompt: `Merge these two ideas into one powerful concept:

IDEA 1: "${idea1.title}"
${idea1.description || ""}

IDEA 2: "${idea2.title}"
${idea2.description || ""}

Return ONLY this JSON (no extra text):
{
  "title": "Merged idea title (max 60 chars)",
  "description": "Compelling merged description combining the best of both (2-3 sentences)."
}`,
    maxOutputTokens: 200,
  });

  try {
    const cleaned = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const result = JSON.parse(cleaned);
    return Response.json(result);
  } catch {
    return Response.json({ title: "Merged Concept", description: text });
  }
}
