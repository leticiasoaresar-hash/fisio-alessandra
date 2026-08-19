import type { Patient, TherapistSettings } from '../types'
import type { MonthlyClosing } from '../repo'
import { formatCurrencyBRL, formatMonthLabel, todayISO, formatDateBR } from './month'
import { currencyToWordsBRL } from './currencyWords'

function sessionCountLabel(count: number): string {
  return `${count} atendimento${count === 1 ? '' : 's'} fisioterapêutico${count === 1 ? '' : 's'}`
}

function resolvePayerName(patient: Patient, payerNameOverride?: string): string {
  return (payerNameOverride ?? patient.payerName ?? patient.name).trim() || patient.name
}

export function buildReceiptText(
  patient: Patient,
  therapist: TherapistSettings | undefined,
  closing: MonthlyClosing,
  payerNameOverride?: string,
): string {
  const monthLabel = formatMonthLabel(closing.monthKey)
  const payerName = resolvePayerName(patient, payerNameOverride)
  const therapistName = therapist?.name || '(nome da fisioterapeuta não configurado em Ajustes)'
  const credentialLine = therapist?.credential ? `${therapist.credential}\n` : ''
  const valorExtenso = currencyToWordsBRL(closing.totalValue)

  return [
    'RECIBO',
    '',
    `Recebi de: ${payerName}`,
    `Valor: ${formatCurrencyBRL(closing.totalValue)} (${valorExtenso})`,
    `Referente: a ${sessionCountLabel(closing.sessionCount)} no período de ${monthLabel}`,
    `Data: ${formatDateBR(todayISO())}`,
    '',
    '_________________________________',
    therapistName,
    'Fisioterapeuta',
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
  payerNameOverride?: string,
) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 56
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 90

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('RECIBO', pageWidth / 2, y, { align: 'center' })
  y += 16
  doc.setLineWidth(1)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 50

  const monthLabel = formatMonthLabel(closing.monthKey)
  const payerName = resolvePayerName(patient, payerNameOverride)
  const valorExtenso = currencyToWordsBRL(closing.totalValue)

  const fields: [string, string][] = [
    ['Recebi de:', payerName],
    ['Valor: R$', `${formatCurrencyBRL(closing.totalValue).replace('R$', '').trim()} (${valorExtenso})`],
    ['Referente:', `a ${sessionCountLabel(closing.sessionCount)} no período de ${monthLabel}`],
    ['Data:', formatDateBR(todayISO())],
  ]

  const labelWidth = 110
  const valueWidth = pageWidth - marginX * 2 - labelWidth

  doc.setFontSize(12)
  for (const [label, value] of fields) {
    doc.setFont('helvetica', 'normal')
    doc.text(label, marginX, y)
    const wrapped = doc.splitTextToSize(value, valueWidth)
    doc.text(wrapped, marginX + labelWidth, y)
    doc.setLineWidth(0.5)
    doc.line(marginX + labelWidth, y + 4, pageWidth - marginX, y + 4)
    y += 24 * wrapped.length + 20
  }

  y += 70
  doc.line(marginX, y, marginX + 260, y)
  y += 18
  doc.setFont('helvetica', 'bold')
  doc.text(therapist?.name || 'Fisioterapeuta', marginX, y)
  y += 16
  doc.setFont('helvetica', 'normal')
  doc.text('Fisioterapeuta', marginX, y)
  if (therapist?.credential) {
    y += 16
    doc.text(therapist.credential, marginX, y)
  }

  return doc
}
