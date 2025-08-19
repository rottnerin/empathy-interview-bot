import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Return fixed Mateo persona so UI matches the system prompt
    const persona = {
      name: 'Mateo Alvarez',
      age: 15,
      backstory: 'Grade 10 student in Madrid who struggles with after-school time management between futsal, friends, YouTube, coding, and homework.',
      goals: ['enjoy sports and hobbies', 'keep up with schoolwork'],
      frustrations: ['phone distractions', 'procrastinating after practice', 'underestimating task time'],
      style: 'casual Madrid high school vibe, friendly and quick-witted',
      portrait_prompt: 'Photorealistic portrait of a 15-year-old Spanish boy from Madrid (Mateo Alvarez), short dark hair, warm brown eyes, athletic build, casual hoodie, soft window light, neutral studio background, natural expression.'
    }

    // Request a full-body, uncropped, head-to-toe composition with padding so it fits the square frame
    const imagePrompt = `${persona.portrait_prompt} Full body, head-to-toe, standing, centered in frame, ensure entire figure fits within a square canvas without cropping, with comfortable margins, neutral background.`

    async function generateOpenAIImage(prompt: string): Promise<{ url?: string; error?: string; debug?: any }> {
      const endpoint = 'https://api.openai.com/v1/images/generations'
      // First try: base64
      const resp1 = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', response_format: 'b64_json' })
      })
      const text1 = await resp1.text()
      let data1: any
      try { data1 = JSON.parse(text1) } catch { data1 = null }
      const debug1 = { attempt: 'b64_json', ok: resp1.ok, status: resp1.status, bodySample: text1?.slice(0, 800) }
      if (resp1.ok) {
        const first = data1?.data?.[0]
        if (first?.b64_json) return { url: `data:image/png;base64,${first.b64_json}`, debug: debug1 }
        if (first?.url) return { url: first.url, debug: debug1 }
      }
      // Second try: URL
      const resp2 = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024' })
      })
      const text2 = await resp2.text()
      let data2: any
      try { data2 = JSON.parse(text2) } catch { data2 = null }
      const debug2 = { attempt: 'url', ok: resp2.ok, status: resp2.status, bodySample: text2?.slice(0, 800) }
      if (resp2.ok) {
        const first = data2?.data?.[0]
        if (first?.url) return { url: first.url, debug: debug2 }
      }
      const err = (data1?.error?.message || data2?.error?.message || 'unknown error') as string
      return { error: err, debug: { resp1: debug1, resp2: debug2 } }
    }

    const { url, error, debug } = await generateOpenAIImage(imagePrompt)
    let imageUrl: string | undefined = url
    let imageError: string | undefined = error

    // Fallback avatar if images API failed
    if (!imageUrl) {
      imageUrl = `https://api.dicebear.com/8.x/adventurer/png?size=1024&seed=${encodeURIComponent(persona.name)}`
    }

    if (imageError) {
      // Log server-side for easier debugging without exposing secrets
      console.error('OpenAI Images generation failed', { error: imageError, debug })
    }

    return NextResponse.json({ persona: { name: persona.name, age: persona.age }, imageUrl, error: imageError, imageDebug: debug })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
