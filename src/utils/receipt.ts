import type { Patient, TherapistSettings } from '../types'
import type { MonthlyClosing } from '../repo'
import { formatCurrencyBRL, formatMonthLabel, todayISO, formatDateBR } from './month'

export function buildReceiptText(
  patient: Patient,
  therapist: TherapistSettings | undefined,
  closing: MonthlyClosing,
): string {
  const monthLabel = formatMonthLabel(closing.monthKey)
  const therapistName = therapist?.name || '(nome da fisioterapeuta não configurado em Ajustes)'
  const credentialLine = therapist?.credential ? `${therapist.credential}\n` : ''

  return [
    'RECIBO',
    '',
    `Paciente: ${patient.name}`,
    `Referente a: ${monthLabel}`,
    `Número de sessões: ${closing.sessionCount}`,
    `Valor total: ${formatCurrencyBRL(closing.totalValue)}`,
    '',
    `Recebi a quantia de ${formatCurrencyBRL(closing.totalValue)} referente aos atendimentos de fisioterapia realizados no período acima.`,
    '',
    `Data de emissão: ${formatDateBR(todayISO())}`,
    '',
    '_________________________________',
    therapistName,
    credentialLine,
  ]
    .join('\n')
    .trim()
}

export function buildReceiptFilename(patient: Patient, monthKey: string): string {
  const safeName = patient.name.trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '')
  return `recibo-${safeName}-${monthKey}.pdf`
}

export async function generateReceiptPdf(
  patient: Patient,
  therapist: TherapistSettings | undefined,
  closing: MonthlyClosing,
) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 56
  let y = 80

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Recibo', marginX, y)
  y += 40

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  const monthLabel = formatMonthLabel(closing.monthKey)
  const lines = [
    ['Paciente', patient.name],
    ['Referente a', monthLabel],
    ['Número de sessões', String(closing.sessionCount)],
    ['Valor total', formatCurrencyBRL(closing.totalValue)],
  ]

  for (const [label, val] of lines) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, marginX, y)
    doc.setFont('helvetica', 'normal')
    doc.text(val, marginX + 150, y)
    y += 24
  }

  y += 20
  const body = `Recebi a quantia de ${formatCurrencyBRL(
    closing.totalValue,
  )} referente aos atendimentos de fisioterapia realizados no período acima.`
  const wrapped = doc.splitTextToSize(body, 480)
  doc.text(wrapped, marginX, y)
  y += wrapped.length * 16 + 30

  doc.text(`Data de emissão: ${formatDateBR(todayISO())}`, marginX, y)
  y += 70

  doc.line(marginX, y, marginX + 260, y)
  y += 18
  doc.setFont('helvetica', 'bold')
  doc.text(therapist?.name || 'Fisioterapeuta', marginX, y)
  if (therapist?.credential) {
    y += 16
    doc.setFont('helvetica', 'normal')
    doc.text(therapist.credential, marginX, y)
  }

  return doc
}
