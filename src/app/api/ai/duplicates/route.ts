import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { ideas } = await req.json();

    if (!ideas || !Array.isArray(ideas) || ideas.length < 2) {
      return new Response(JSON.stringify({ error: "At least 2 ideas are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { object } = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: z.object({
        duplicates: z.array(
          z.object({
            idea1Id: z.string(),
            idea2Id: z.string(),
            reason: z.string().describe("Brief explanation of why these are duplicates"),
            confidenceScore: z.number().min(0).max(100).describe("Confidence score (0-100)"),
          })
        ),
      }),
      prompt: `Analyze the following list of ideas from a brainstorming session. Identify pairs of ideas that are conceptually identical or highly similar (duplicates or near-duplicates).
      
      Ideas:
      ${JSON.stringify(
        ideas.map((i: any) => ({
          id: i.id,
          title: i.title,
          description: i.description,
        }))
      )}
      
      Return a list of duplicate pairs, using their exact IDs. Only include pairs where you are highly confident they represent the same core concept. Provide a brief reason and a confidence score (0-100) for each pair. If there are no clear duplicates, return an empty array.`,
    });

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Duplicate detection error:", error);
    return new Response(JSON.stringify({ error: "Failed to detect duplicates" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
