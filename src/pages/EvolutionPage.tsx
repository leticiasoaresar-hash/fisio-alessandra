import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams, useSearchParams } from 'react-router-dom'
import { db } from '../db'
import { getMonthlyClosing, getSettings } from '../repo'
import { Screen, TopBar, Card, Field, TextArea, PrimaryButton, OutlineButton, SecondaryButton } from '../components/ui'
import { CopyIcon, SparkleIcon } from '../components/icons'
import { currentMonthKey, formatDateBR, formatMonthLabel, formatMonthLabelCapitalized } from '../utils/month'

function extractWhatsAppNumber(contact?: string): string | null {
  if (!contact) return null
  const digits = contact.replace(/\D/g, '')
  if (digits.length < 8) return null
  return digits.startsWith('55') ? digits : `55${digits}`
}

export function EvolutionPage() {
  const { id } = useParams()
  const patientId = Number(id)
  const [params] = useSearchParams()
  const monthKey = params.get('mes') ?? currentMonthKey()

  const patient = useLiveQuery(() => db.patients.get(patientId), [patientId])
  const settings = useLiveQuery(() => getSettings(), [])
  const closing = useLiveQuery(() => getMonthlyClosing(patientId, monthKey), [patientId, monthKey])

  const [extra, setExtra] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const notesFromSessions = closing?.sessions
    .filter((s) => s.note)
    .slice()
    .reverse()
    .map((s) => `${formatDateBR(s.date)}: ${s.note}`)
    .join('\n')

  async function handleGenerate() {
    if (!patient) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/gerar-mensagem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          patientName: patient.name,
          monthLabel: formatMonthLabel(monthKey),
          notes: notesFromSessions ?? '',
          extra,
          therapistName: settings?.name ?? '',
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data?.error || 'Não foi possível gerar a mensagem agora.')
        return
      }
      setMessage(data.message)
    } catch {
      setError('Não foi possível conectar ao serviço de geração de mensagem. Verifique sua internet.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleOpenWhatsApp() {
    const number = extractWhatsAppNumber(patient?.familyContact)
    const encoded = encodeURIComponent(message)
    const url = number ? `https://wa.me/${number}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`
    window.open(url, '_blank')
  }

  if (patient === undefined || closing === undefined) return null

  return (
    <Screen>
      <TopBar title="Evolução mensal" backTo={`/pacientes/${patientId}`} />

      <div className="px-4 py-4 flex flex-col gap-4">
        <div>
          <p className="text-sm text-taupe">{patient?.name}</p>
          <p className="text-base font-semibold text-charcoal">{formatMonthLabelCapitalized(monthKey)}</p>
        </div>

        {notesFromSessions ? (
          <Card className="text-sm text-charcoal/80 whitespace-pre-line">
            <p className="text-xs font-semibold text-taupe mb-2 uppercase tracking-wide">Anotações das sessões deste mês</p>
            {notesFromSessions}
          </Card>
        ) : (
          <p className="text-sm text-taupe">
            Nenhuma observação registrada nas sessões deste mês ainda. Você pode escrever direto no campo abaixo.
          </p>
        )}

        <Field label="Complemento (opcional)" hint="Anote aqui qualquer coisa a mais que queira contar pra família — pode ser em tópicos soltos.">
          <TextArea
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={4}
            placeholder="Ex: melhora no equilíbrio, ainda com receio de escadas, humor ótimo esse mês"
          />
        </Field>

        <PrimaryButton onClick={handleGenerate} disabled={loading}>
          <SparkleIcon className="w-5 h-5" />
          {loading ? 'Gerando mensagem...' : 'Gerar mensagem com IA'}
        </PrimaryButton>

        {error && (
          <Card className="bg-brick/5 border-brick/30 text-sm text-brick">
            {error}
          </Card>
        )}

        {message && (
          <div className="flex flex-col gap-3">
            <Field label="Mensagem pronta" hint="Você pode editar o texto antes de enviar.">
              <TextArea value={message} onChange={(e) => setMessage(e.target.value)} rows={10} />
            </Field>
            <OutlineButton onClick={handleCopy}>
              <CopyIcon className="w-5 h-5" />
              {copied ? 'Copiado!' : 'Copiar mensagem'}
            </OutlineButton>
            <SecondaryButton onClick={handleOpenWhatsApp}>Enviar pelo WhatsApp</SecondaryButton>
          </div>
        )}
      </div>
    </Screen>
  )
}
