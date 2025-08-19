import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const transcription = await client.audio.transcriptions.create({
    file: await toFile(buffer, file.name || 'input.webm', { type: file.type || 'audio/webm' }),
    model: 'gpt-4o-mini-transcribe',
    response_format: 'json'
  } as any)

  return NextResponse.json({ text: (transcription as any).text || '' })
}
