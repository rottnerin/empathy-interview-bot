import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { getPersona, systemPromptFor, type Difficulty } from '@/lib/personas'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { history = [], user, personaId, difficulty = 'normal' } = await req.json()

  const persona = getPersona(personaId)
  const messages = [
    { role: 'system', content: systemPromptFor(persona, difficulty as Difficulty) },
    ...history,
    { role: 'user', content: user }
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[]

  const completion = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    reasoning_effort: 'low', // keeps replies fast; the persona prompt does the heavy lifting
    messages
  })

  const text = completion.choices[0]?.message?.content ?? ''
  return new Response(JSON.stringify({ text }), { headers: { 'content-type': 'application/json' } })
}
