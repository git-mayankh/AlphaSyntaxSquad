import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

export const runtime = "edge";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { ideas } = await req.json();

  if (!ideas || ideas.length === 0) {
    return Response.json({ clusters: [], summary: "", topIdeas: [], insight: "" });
  }

  const ideaList = ideas
    .map((idea: any, i: number) => `${i + 1}. [${idea.votes || 0} votes] ${idea.title}: ${idea.description || ""}`)
    .join("\n");

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are an AI facilitator analyzing ideas from a brainstorming session. Always respond with valid JSON only, no markdown, no extra text.`,
    prompt: `Analyze these ideas and return ONLY valid JSON:
IDEAS:
${ideaList}

Required JSON format:
{
  "clusters": [
    { "theme": "Theme Name", "color": "#hex", "ideaIndexes": [0, 2] }
  ],
  "summary": "2-3 sentence summary of the session's key themes and insights.",
  "topIdeas": [0, 1, 2],
  "insight": "One key strategic recommendation."
}

Rules:
- Group into 2-5 clusters by theme
- Use distinct hex colors for each cluster
- topIdeas = indexes (0-based) of the 3 most impactful ideas by votes + quality
- Respond ONLY with JSON, nothing else`,
    maxOutputTokens: 600,
  });

  try {
    const cleaned = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const result = JSON.parse(cleaned);
    return Response.json(result);
  } catch {
    return Response.json({ clusters: [], summary: text, topIdeas: [], insight: "" });
  }
}
