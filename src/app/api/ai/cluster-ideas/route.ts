import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

export const runtime = "edge";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { ideas } = await req.json();

  if (!ideas || ideas.length < 2) {
    // Single idea or none — each is its own cluster
    const solo = (ideas || []).map((idea: any) => ({
      id: idea.id,
      name: idea.title?.slice(0, 30) || "Idea",
      theme: "Standalone",
      emoji: "💡",
      color: "#6366f1",
      lightColor: "#eef2ff",
      ideaIds: [idea.id],
    }));
    return Response.json({ clusters: solo });
  }

  const ideaList = ideas
    .map((idea: any, i: number) =>
      `[${i}] id:"${idea.id}" title:"${idea.title}" desc:"${(idea.description || "").slice(0, 120)}"`
    )
    .join("\n");

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are an expert facilitator grouping brainstorming ideas by theme and similarity. 
Always respond with valid JSON only — no markdown, no extra text, no code fences.`,
    prompt: `Group these brainstorming ideas into thematic clusters. 
Ideas that are conceptually similar, solve the same problem, or belong to the same theme should be in the same cluster.
Ideas that are unique or don't fit anywhere form their own solo cluster.

IDEAS:
${ideaList}

Return ONLY this JSON (no extra text):
{
  "clusters": [
    {
      "name": "Short cluster title (max 4 words)",
      "theme": "One-sentence description of what unifies these ideas",
      "emoji": "single relevant emoji",
      "color": "#hexcolor (vibrant, distinct per cluster)",
      "lightColor": "#verylighthexcolor (very light tint of the same hue for the background zone)",
      "ideaIds": ["id1", "id2"]
    }
  ]
}

Rules:
- Group 2+ similar ideas together; solo unique ideas get their own 1-idea cluster
- Use 3–6 clusters max (merge very small related clusters)
- Colors must be visually distinct and vibrant
- lightColor should be a very light pastel version (e.g. color #6366f1 → lightColor #eef2ff)
- Respond ONLY with JSON`,
    maxOutputTokens: 700,
  });

  try {
    const cleaned = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const result = JSON.parse(cleaned);
    return Response.json(result);
  } catch {
    // Fallback: each idea in its own cluster
    const fallback = ideas.map((idea: any) => ({
      name: idea.title?.slice(0, 25) || "Idea",
      theme: "Standalone idea",
      emoji: "💡",
      color: "#6366f1",
      lightColor: "#eef2ff",
      ideaIds: [idea.id],
    }));
    return Response.json({ clusters: fallback });
  }
}
