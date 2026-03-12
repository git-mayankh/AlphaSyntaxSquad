import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      await new Promise(r => setTimeout(r, 1500));
      return Response.json({
        text: `<p><strong>🚀 AI Improved:</strong></p><p>${content}</p><p><em>Strategic Expansion:</em> We should also consider integrating a feedback loop to measure user engagement. Success metrics could include DAU/MAU ratio and time-to-value (TTV).</p>`
      });
    }

    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      system: `You are an expert editor and product strategist. Improve the following HTML idea description. Make it more professional, structured, and impactful while keeping the original intent. You may return HTML. Wrap your improvements or additions clearly so the user sees the added value.`,
      prompt: content,
    });

    return Response.json({ text });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
