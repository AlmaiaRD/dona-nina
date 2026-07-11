'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Send } from 'lucide-react'
import { generateEmailDraft, generateWhatsAppDraft, createCommunication } from '@/services/communications'
import toast from 'react-hot-toast'

interface Props {
  isOpen: boolean
  onClose: () => void
  type: 'email' | 'whatsapp'
  client: { id: string; full_name: string; email?: string; phone?: string }
  documentType: 'invoice' | 'receipt'
  documentNumber: string
  documentId: string
  total: string
  businessName: string
  senderEmail?: string
  senderName?: string
  emailTemplate?: string
  whatsappTemplate?: string
  getAttachment?: () => Promise<{ filename: string; base64: string }>
  onSaved?: () => void
}

export default function CommunicationDraftModal({
  isOpen, onClose, type, client, documentType, documentNumber, documentId,
  total, businessName, senderEmail, senderName, emailTemplate, whatsappTemplate,
  getAttachment, onSaved,
}: Props) {
  const isEmail = type === 'email'
  const [subject, setSubject] = useState(() => {
    if (!isEmail) return ''
    return generateEmailDraft({
      clientName: client.full_name,
      clientEmail: client.email || '',
      documentType,
      documentNumber,
      businessName,
      senderEmail,
      senderName,
      template: emailTemplate,
    }).subject
  })
  const [body, setBody] = useState(() => {
    if (isEmail) {
      return generateEmailDraft({
        clientName: client.full_name, clientEmail: client.email || '',
        documentType, documentNumber, businessName, senderEmail, senderName,
        template: emailTemplate,
      }).body
    }
    return generateWhatsAppDraft({
      clientName: client.full_name, documentType, documentNumber, total, businessName,
      template: whatsappTemplate,
    }).text
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(status: 'draft' | 'sent' = 'draft') {
    setSaving(true)
    try {
      let attachment: { filename: string; base64: string } | undefined
      if (status === 'sent' && isEmail) {
        if (getAttachment) attachment = await getAttachment()
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: client.email,
            subject,
            body,
            senderName: senderName || businessName,
            attachment,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al enviar')
        }
      }

      const commStatus = (isEmail && status === 'sent') ? 'sent' : 'draft'
      await createCommunication({
        client_id: client.id,
        type,
        subject: isEmail ? subject : undefined,
        body,
        status: commStatus,
        document_type: documentType === 'invoice' ? 'invoice' : 'receipt',
        document_id: documentId,
      })

      toast.success(status === 'sent' ? 'Enviado exitosamente' : 'Borrador guardado')
      onSaved?.()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEmail ? 'Enviar por Correo' : 'Enviar por WhatsApp'} size="lg">
      <div className="space-y-4">
        {isEmail && (
          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1">Asunto</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-[#3D2B1F] mb-1">{isEmail ? 'Cuerpo' : 'Mensaje'}</label>
          {isEmail ? (
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
          ) : (
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={() => handleSave('draft')} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-[#3D2B1F] bg-[#FDF8F3] rounded-lg hover:bg-gray-200 disabled:opacity-50">
            Guardar Borrador
          </button>
          {isEmail && (
            <button onClick={() => handleSave('sent')} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              <Send size={16} /> {saving ? 'Enviando...' : 'Enviar Ahora'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
