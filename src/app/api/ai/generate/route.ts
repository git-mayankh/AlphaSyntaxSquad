import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { prompt, sessionContext } = await req.json();
    
    // Fallback for hackathon testing without API key
    if (!process.env.OPENAI_API_KEY) {
      await new Promise(r => setTimeout(r, 1500));
      return Response.json({
        text: `[Simulated AI] Here's an innovative approach for "${prompt}": What if we leverage real-time data and agentic workflows to automate this completely? This reduces manual effort by 80% and fits perfectly into ${sessionContext || 'the current product roadmap'}.`
      });
    }

    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      system: `You are an expert product manager and brainstorming assistant for 'IdeaForge'. Generate highly innovative, practical ideas for a hackathon based on the user's prompt. Keep it concise, engaging, and structured. Session Context: ${sessionContext || 'None'}`,
      prompt,
    });

    return Response.json({ text });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
