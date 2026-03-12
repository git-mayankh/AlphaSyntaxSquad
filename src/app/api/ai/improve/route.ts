import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

export const runtime = "edge";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { idea } = await req.json();

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are a strategic product advisor specializing in innovation. 
When given a raw idea, you improve it with:
1. A stronger, more compelling title
2. A clear, persuasive description with the problem solved + how it works + key benefits
3. Business model angle
4. Key risks to watch
Keep your response structured but concise.`,
      prompt: `Improve this idea: "${idea.title}"\n\nCurrent description: ${idea.description || "None provided"}`,
    });

    return Response.json({ text });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
