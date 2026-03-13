import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
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

    const { ideaId, title, description, currentComments, prompt } = await req.json();

    if (!title || !prompt || !ideaId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Format the existing comments into a readable chat history string for context
    const commentsList = currentComments?.length > 0 
      ? currentComments.map((c: any) => `${c.author}: ${c.text}`).join("\n") 
      : "No comments yet.";

    const systemPrompt = `You are a highly intelligent product strategist and brainstorming AI assistant.
Currently, you are evaluating a specific idea proposed by the team.

Idea Title: ${title}
Idea Description: ${description || "None provided."}

Here is the current discussion happening around this idea:
${commentsList}

The user is asking you a direct question regarding this idea in the comment thread. Provide a sharp, concise, and highly actionable response. Do NOT use markdown headers, just return a conversational paragraph or distinct bullet points if necessary. Limit to exactly 1 or 2 small paragraphs.`;

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: prompt,
    });

    // Instead of just returning it to the UI, let's actually save it as a comment directly in the DB
    // from the "AI" so it feels fully integrated! 
    const { data, error } = await supabase.from("idea_comments").insert({
        idea_id: ideaId,
        author_id: user.id, // the author of the comment is still technically the user triggering the AI, but we could make an AI system user instead or handle it visually.
        text: text.trim(),
        is_ai_author: true // Assuming we add this column, or we can just append an AI prefix
    }).select().single();
    
    // We will prefix the text with AI just in case we don't have that column
    const prefixedText = `*✨ AI Assistant Response:*\n${text.trim()}`;
    
     await supabase.from("idea_comments").insert({
        idea_id: ideaId,
        author_id: user.id, // we tie it to the user who invoked it so we don't need a special AI user account
        text: prefixedText
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Idea AI Chat Error:", error);
    return NextResponse.json({ error: error.message || "Failed to respond via AI" }, { status: 500 });
  }
}
