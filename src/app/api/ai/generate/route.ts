import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

export const runtime = "edge";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { prompt, sessionContext } = await req.json();

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are an expert product manager and creative brainstorming assistant for IdeaForge — an AI-powered innovation lab. 
Generate highly innovative, practical, and specific ideas based on the user's prompt. 
Keep each idea concise, actionable, and structured. 
Session Context: ${sessionContext || "General brainstorming"}`,
      prompt,
    });

    return Response.json({ text });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
