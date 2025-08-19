import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { toStudent, toTeacher, subject, html } = await req.json()
    if (!toStudent || !toTeacher) return NextResponse.json({ error: 'Missing recipients' }, { status: 400 })

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    })

    const info1 = await transporter.sendMail({ from: process.env.MAIL_FROM, to: toStudent, subject, html })
    const info2 = await transporter.sendMail({ from: process.env.MAIL_FROM, to: toTeacher, subject, html })

    return NextResponse.json({ ok: true, ids: [info1.messageId, info2.messageId] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
