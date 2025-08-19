import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const { text, voice = 'echo' } = await req.json()
  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const mp3 = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice,
    input: text
  })

  const buffer = Buffer.from(await mp3.arrayBuffer())
  return new Response(buffer, { headers: { 'content-type': 'audio/mpeg' } })
}
