import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { db } from '../db'
import { getMonthlyClosing, getSettings, setMonthPaid } from '../repo'
import { Screen, TopBar, Card, Field, TextInput, PrimaryButton, OutlineButton, SecondaryButton } from '../components/ui'
import { CheckCircleIcon, CircleIcon, DownloadIcon, CopyIcon } from '../components/icons'
import { currentMonthKey, formatCurrencyBRL, formatMonthLabelCapitalized } from '../utils/month'
import { buildReceiptFilename, buildReceiptText, generateReceiptPdf } from '../utils/receipt'

export function MonthlyClosingPage() {
  const { id } = useParams()
  const patientId = Number(id)
  const [params] = useSearchParams()
  const monthKey = params.get('mes') ?? currentMonthKey()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [payerName, setPayerName] = useState('')

  const patient = useLiveQuery(() => db.patients.get(patientId), [patientId])
  const settings = useLiveQuery(() => getSettings(), [])
  const paymentsVersion = useLiveQuery(() => db.payments.where('patientId').equals(patientId).toArray(), [patientId])
  const sessionsVersion = useLiveQuery(() => db.sessions.where('patientId').equals(patientId).toArray(), [patientId])
  const closing = useLiveQuery(
    () => getMonthlyClosing(patientId, monthKey),
    [patientId, monthKey, paymentsVersion, sessionsVersion],
  )

  useEffect(() => {
    if (patient) setPayerName(patient.payerName || patient.name)
  }, [patient])

  async function togglePaid() {
    if (!closing) return
    await setMonthPaid(patientId, monthKey, !closing.paid)
  }

  async function handleDownloadPdf() {
    if (!patient || !closing) return
    const doc = await generateReceiptPdf(patient, settings, closing, payerName)
    doc.save(buildReceiptFilename(patient, monthKey))
  }

  async function handleCopyText() {
    if (!patient || !closing) return
    const text = buildReceiptText(patient, settings, closing, payerName)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    if (!patient || !closing) return
    const text = buildReceiptText(patient, settings, closing, payerName)
    if (navigator.share) {
      try {
        await navigator.share({ title: `Recibo - ${patient.name}`, text })
        return
      } catch {
        // usuário cancelou o compartilhamento
      }
    } else {
      await handleCopyText()
    }
  }

  if (patient === undefined || closing === undefined) return null

  return (
    <Screen>
      <TopBar title="Fechamento mensal" backTo={`/pacientes/${patientId}`} />

      <div className="px-4 py-4 flex flex-col gap-4">
        <Card className="flex flex-col gap-1">
          <p className="text-sm text-taupe">{patient.name}</p>
          <p className="text-base font-semibold text-charcoal">{formatMonthLabelCapitalized(monthKey)}</p>
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-sm text-taupe">
                {closing.sessionCount} {closing.sessionCount === 1 ? 'sessão' : 'sessões'}
              </p>
              <p className="text-2xl font-bold text-charcoal">{formatCurrencyBRL(closing.totalValue)}</p>
            </div>
          </div>
        </Card>

        <button onClick={togglePaid} className="text-left">
          <Card className={`flex items-center gap-3 ${closing.paid ? 'bg-green-50 border-green-200' : ''}`}>
            {closing.paid ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600 shrink-0" />
            ) : (
              <CircleIcon className="w-6 h-6 text-brick shrink-0" />
            )}
            <div>
              <p className="font-semibold text-charcoal">{closing.paid ? 'Marcado como pago' : 'Marcar como pago'}</p>
              <p className="text-xs text-taupe">Toque para {closing.paid ? 'desmarcar' : 'confirmar o pagamento'}</p>
            </div>
          </Card>
        </button>

        {closing.sessionCount === 0 ? (
          <p className="text-sm text-taupe text-center py-6">
            Nenhuma sessão registrada neste mês para este paciente ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-charcoal">Recibo</p>
            <Field label="Recibo emitido para" hint="Nome de quem recebe o recibo (paciente ou familiar responsável pelo pagamento).">
              <TextInput value={payerName} onChange={(e) => setPayerName(e.target.value)} />
            </Field>
            <PrimaryButton onClick={handleDownloadPdf}>
              <DownloadIcon className="w-5 h-5" />
              Baixar recibo em PDF
            </PrimaryButton>
            <OutlineButton onClick={handleCopyText}>
              <CopyIcon className="w-5 h-5" />
              {copied ? 'Texto copiado!' : 'Copiar texto do recibo'}
            </OutlineButton>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <SecondaryButton onClick={handleShare}>Compartilhar recibo</SecondaryButton>
            )}

            <button
              onClick={() => navigate(`/pacientes/${patientId}/evolucao?mes=${monthKey}`)}
              className="text-sm font-semibold text-brick text-center mt-2 py-2"
            >
              Gerar mensagem de evolução para a família →
            </button>
          </div>
        )}
      </div>
    </Screen>
  )
}
