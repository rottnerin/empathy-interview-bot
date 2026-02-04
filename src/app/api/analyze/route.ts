
import { NextRequest } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const systemPrompt = `You are an expert Design Thinking coach specialized in Empathy Interviewing for entrepreneurship.
Your job is to analyze an interview transcript and provide constructive, specific feedback directly to the interviewer.

**Important:** Address the interviewer directly using "You" (e.g., "You asked great follow-up questions" not "The student asked...").

**Evaluation Criteria:**
1. **Open-Ended Questions:** Did you ask "Why" and "How" instead of Yes/No questions?
2. **Behavioral Digging:** Did you ask for specific stories ("Tell me about the last time...") instead of generalities?
3. **Neutrality:** Did you avoid leading questions or suggesting solutions (e.g., "Have you tried X?")?
4. **Depth:** Did you uncover the emotional root causes (guilt, feeling overwhelmed, transition struggles) or stay on the surface (laziness, phone addiction)?
5. **Rapport:** Did you build trust and make the interviewee feel heard?

**Output Format:**
Return a JSON object with two fields:
- "strengths": An array of strings highlighting good techniques you used. Address the interviewer as "You".
- "weaknesses": An array of strings highlighting missed opportunities or areas to improve. Address the interviewer as "You".
`

export async function POST(req: NextRequest) {
    const { history } = await req.json()

    // Convert the chat history into a readable transcript for the model
    const transcript = history.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // or gpt-4-turbo, using a capable model for analysis
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Here is the interview transcript:\n\n${transcript}` }
        ],
        response_format: { type: 'json_object' }
    })

    const text = completion.choices[0]?.message?.content

    if (!text) {
        return new Response(JSON.stringify({ error: 'Failed to generate analysis' }), { status: 500 })
    }

    return new Response(text, { headers: { 'content-type': 'application/json' } })
}
