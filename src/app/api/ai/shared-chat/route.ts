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

    const { chatId, prompt, history } = await req.json();

    if (!chatId || !prompt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify user is a member of this chat
    const { data: membership } = await supabase
      .from("shared_chat_members")
      .select("chat_id")
      .eq("chat_id", chatId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this chat" }, { status: 403 });
    }

    // Build conversation history for context
    const historyText = (history || [])
      .slice(-20) // last 20 messages for context
      .map((m: any) => `${m.is_ai ? "AI Assistant" : m.author_name || "User"}: ${m.content}`)
      .join("\n");

    const systemPrompt = `You are a highly intelligent AI assistant in a collaborative group chat called IdeaForge. Multiple team members are chatting together and asking you questions.

Your role:
- Answer questions clearly and concisely
- Help brainstorm ideas when asked
- Provide actionable insights and suggestions
- Be conversational but professional
- Keep responses focused and under 3 paragraphs unless a detailed answer is needed

Recent conversation:
${historyText || "No previous messages."}

Now respond to the latest message from a team member.`;

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: prompt,
    });

    // Save the AI response as a message in the chat
    const { data: aiMessage, error: insertError } = await supabase
      .from("shared_chat_messages")
      .insert({
        chat_id: chatId,
        author_id: null,
        content: text.trim(),
        is_ai: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save AI message:", insertError);
      return NextResponse.json({ error: "Failed to save AI response" }, { status: 500 });
    }

    return NextResponse.json({ message: aiMessage });
  } catch (error: any) {
    console.error("Shared Chat AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to get AI response" }, { status: 500 });
  }
}
