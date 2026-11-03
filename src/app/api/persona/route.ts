import { NextRequest, NextResponse } from 'next/server'
import { getPersona, pickPersona, publicPersona, PERSONAS } from '@/lib/personas'

// Returns an existing persona (personaId) or a random one that differs from excludeId
export async function POST(req: NextRequest) {
  try {
    const { personaId, excludeId } = await req.json().catch(() => ({}))
    const persona = personaId && PERSONAS.some(p => p.id === personaId)
      ? getPersona(personaId)
      : pickPersona(excludeId)

    return NextResponse.json({
      persona: publicPersona(persona),
      imageUrl: persona.imageUrl
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
