import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getPersona } from '@/lib/personas'

export async function POST(req: NextRequest) {
  const { text, personaId } = await req.json()

  // Don't read stage directions like [shrugs] aloud
  const spoken = String(text ?? '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim()
  if (!spoken) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

  const persona = getPersona(personaId)
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: persona.voice as any,
      input: spoken,
      instructions: persona.voiceStyle,
    } as any)

    const buffer = Buffer.from(await mp3.arrayBuffer())
    return new Response(buffer, { headers: { 'content-type': 'audio/mpeg' } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
