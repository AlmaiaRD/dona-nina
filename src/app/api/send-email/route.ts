import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const auth = getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { to, subject, body } = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@donadenina.com',
      to,
      subject,
      html: body,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 })
  }
}
