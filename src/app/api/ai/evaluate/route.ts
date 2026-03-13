import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { object } = await generateObject({
      model: groq("llama-3.3-70b-versatile"), // use versatile model for good reasoning and JSON structure
      schema: z.object({
        feasibility: z.number().min(1).max(10).describe("Feasibility score 1-10"),
        market: z.number().min(1).max(10).describe("Market Potential score 1-10"),
        innovation: z.number().min(1).max(10).describe("Innovation score 1-10"),
        review: z.string().describe("A concise 2-3 sentence review explaining the scores and acknowledging any potential risks."),
      }),
      prompt: `Evaluate the following idea strictly on Feasibility, Market Potential, and Innovation on a 1-10 scale.\n\nTitle: ${title}\nDescription: ${description || "No description provided."}\n\nProvide the 3 scores and a very brief, sharp synthesis/review text evaluating its potential.`,
    });

    return NextResponse.json({ success: true, evaluation: object });
  } catch (error: any) {
    console.error("AI Evaluate Error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate idea" }, { status: 500 });
  }
}
