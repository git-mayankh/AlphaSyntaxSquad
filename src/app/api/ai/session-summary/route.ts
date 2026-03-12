import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { sessionTitle, ideas } = await req.json();

    if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
      return new Response(JSON.stringify({ error: "Ideas are required to generate a summary." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { object } = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: z.object({
        overview: z.string().describe("High-level overview of what was discussed in the session"),
        topIdeas: z.array(z.string()).describe("A list of 3-5 standout ideas based on votes and potential"),
        keyThemes: z.array(z.string()).describe("Main themes or overarching categories that emerged"),
        suggestedFinalConcept: z.string().describe("A single, synthesized concept combining the best elements of the brainstorm"),
      }),
      prompt: `Act as a senior product manager reviewing a brainstorming session titled "${sessionTitle}". Synthesize the following raw ideas into a professional, actionable session summary.
      
      Ideas List (includes title, description, and vote count):
      ${JSON.stringify(
        ideas.map((i: any) => ({
          title: i.title,
          description: i.description,
          votes: i.votes,
          source: i.source || "user",
        }))
      )}
      
      Generate a comprehensive summary that highlights the most promising directions, core themes, and a strongly recommended path forward.`,
    });

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Session summary error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate session summary" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
