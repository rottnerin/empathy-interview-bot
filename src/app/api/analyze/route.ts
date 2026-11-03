
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { getPersona } from '@/lib/personas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SKILLS = ['openEnded', 'followUps', 'neutrality', 'depth', 'rapport'] as const

function buildSystemPrompt(truths: { id: string; label: string }[], previousFocus?: string) {
  return `You are an expert Design Thinking coach specialized in Empathy Interviewing for entrepreneurship.
Your job is to analyze an interview transcript and provide constructive, specific feedback directly to the interviewer.
The interviewer is a student practicing repeatedly, so your feedback should be concrete, motivating and focused on what to do differently next time.

**Important:** Address the interviewer directly using "You" (e.g., "You asked great follow-up questions" not "The student asked..."). In the transcript, the "USER" is the interviewer and the "ASSISTANT" is the person being interviewed.

**Evaluation Criteria (score each 0-10):**
1. **openEnded:** Open-ended "Why" and "How" questions instead of Yes/No questions.
2. **followUps:** Asking for specific stories ("Tell me about the last time...") and following up on what the interviewee actually said, instead of moving to a new topic.
3. **neutrality:** Avoiding leading questions and suggesting solutions (e.g., "Have you tried X?").
4. **depth:** Uncovering emotional root causes instead of staying on the surface.
5. **rapport:** Building trust, reflecting feelings, making the interviewee feel heard.

**Hidden truths the interviewee could reveal.** Mark a truth as found ONLY if the interviewee clearly and specifically revealed the core of it in the transcript. A passing hint or a loosely related detail is NOT enough; when in doubt, mark it not found:
${truths.map(t => `- id "${t.id}": ${t.label}`).join('\n')}

**Scoring honesty:** A very short interview (fewer than 4 questions from the interviewer) cannot score above 4 overall. Do not inflate scores.
${previousFocus ? `
**Previous goal:** Last time the interviewer was told to work on: "${previousFocus}". Judge whether they met it in this interview.
` : ''}
**Output Format:**
Return a JSON object with these fields:
- "score": A whole number 0-10 for the overall quality of the interview.
- "skills": An object with the whole-number 0-10 scores for each of: ${SKILLS.join(', ')}.
- "strengths": An array of 2-3 strings (each under 30 words) highlighting good techniques you used. Address the interviewer as "You". Quote their actual question when possible.
- "weaknesses": An array of 2-3 strings (each under 30 words) highlighting missed opportunities. Address the interviewer as "You". Quote their actual question when possible.
- "truths": An array with one object per hidden truth above: { "id": the id, "found": true or false, "evidence": a short quote (under 20 words) of what the interviewee said (empty string if not found) }.
- "nextFocus": ONE short, specific, actionable sentence describing the single most valuable thing to practice in the next interview (e.g., "Ask 'why' at least twice after each answer.").
- "betterQuestion": { "original": the weakest question the interviewer actually asked (copy it exactly), "improved": a stronger version of it, "why": one sentence on why the improved version works better }. If the interviewer asked no questions, use empty strings.
${previousFocus ? `- "focusMet": { "met": true or false, "comment": one sentence explaining how they did on the previous goal }.` : ''}`
}

export async function POST(req: NextRequest) {
    const { history = [], personaId, previousFocus } = await req.json()
    const persona = getPersona(personaId)

    // Convert the chat history into a readable transcript for the model
    const transcript = history.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')

    const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        reasoning_effort: 'low',
        messages: [
            { role: 'system', content: buildSystemPrompt(persona.truths, previousFocus) },
            { role: 'user', content: `Here is the interview transcript:\n\n${transcript}` }
        ],
        response_format: { type: 'json_object' }
    })

    const text = completion.choices[0]?.message?.content

    if (!text) {
        return new Response(JSON.stringify({ error: 'Failed to generate analysis' }), { status: 500 })
    }

    // Normalize so the UI never crashes on a missing or malformed field
    let raw: any
    try {
        raw = JSON.parse(text)
    } catch {
        return new Response(JSON.stringify({ error: 'Failed to parse analysis' }), { status: 500 })
    }

    const clamp = (n: any) => Math.max(0, Math.min(10, Math.round(Number(n) || 0)))
    const result = {
        score: clamp(raw.score),
        skills: Object.fromEntries(SKILLS.map(k => [k, clamp(raw.skills?.[k])])),
        strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
        weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses : [],
        truths: persona.truths.map(t => {
            const found = Array.isArray(raw.truths) ? raw.truths.find((x: any) => x?.id === t.id) : undefined
            return { id: t.id, label: t.label, hint: t.hint, found: !!found?.found, evidence: found?.found ? String(found.evidence ?? '').replace(/^["“”'‘’]+|["“”'‘’]+$/g, '') : '' }
        }),
        nextFocus: typeof raw.nextFocus === 'string' ? raw.nextFocus : '',
        betterQuestion: raw.betterQuestion?.original
            ? { original: String(raw.betterQuestion.original), improved: String(raw.betterQuestion.improved ?? ''), why: String(raw.betterQuestion.why ?? '') }
            : null,
        focusMet: previousFocus && raw.focusMet
            ? { met: !!raw.focusMet.met, comment: String(raw.focusMet.comment ?? '') }
            : null,
    }

    return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } })
}
