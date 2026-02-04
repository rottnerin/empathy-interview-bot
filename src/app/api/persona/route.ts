import { NextRequest, NextResponse } from 'next/server'

// Static image for Mateo
const MATEO_IMAGE_URL = '/mateo.png'

export async function POST(req: NextRequest) {
  try {
    const persona = {
      name: 'Mateo Alvarez',
      age: 15,
    }

    return NextResponse.json({
      persona,
      imageUrl: MATEO_IMAGE_URL
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
