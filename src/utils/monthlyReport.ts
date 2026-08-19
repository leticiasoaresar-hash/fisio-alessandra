import type { Patient, TherapistSettings } from '../types'
import type { MonthlyClosing } from '../repo'
import { formatCurrencyBRL, formatDateShortBR, formatMonthLabel } from './month'

export function buildMonthlyReportText(
  patient: Patient,
  therapist: TherapistSettings | undefined,
  closing: MonthlyClosing,
  observations: string,
): string {
  const monthLabel = formatMonthLabel(closing.monthKey)
  const therapistName = therapist?.name || '(nome da fisioterapeuta não configurado em Ajustes)'

  const sessionLines = closing.sessions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => `${formatDateShortBR(s.date)} - ${formatCurrencyBRL(s.value)}`)

  return [
    `Segue o fechamento dos atendimentos de fisioterapia de ${monthLabel}, referente a ${patient.name}.`,
    '',
    ...sessionLines,
    `TOTAL: ${formatCurrencyBRL(closing.totalValue)}`,
    '',
    `Observações: ${observations.trim() || '(nenhuma observação registrada)'}`,
    '',
    'Qualquer dúvida estou à disposição.',
    '',
    'Abraço!',
    therapistName,
  ].join('\n')
}

export function buildMonthlyReportFilename(patient: Patient, monthKey: string): string {
  const safeName = patient.name.trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '')
  return `relatorio-mensal-${safeName}-${monthKey}.pdf`
}

export async function generateMonthlyReportPdf(
  patient: Patient,
  therapist: TherapistSettings | undefined,
  closing: MonthlyClosing,
  observations: string,
) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 56
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - marginX * 2
  let y = 70

  function ensureSpace(next: number) {
    if (y + next > pageHeight - 60) {
      doc.addPage()
      y = 70
    }
  }

  const monthLabel = formatMonthLabel(closing.monthKey)
  const therapistName = therapist?.name || 'Fisioterapeuta'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Relatório Mensal de Fisioterapia', marginX, y)
  y += 36

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  const intro = `Segue o fechamento dos atendimentos de fisioterapia de ${monthLabel}, referente a ${patient.name}.`
  const wrappedIntro = doc.splitTextToSize(intro, contentWidth)
  doc.text(wrappedIntro, marginX, y)
  y += wrappedIntro.length * 16 + 24

  // Tabela de sessões
  doc.setFont('helvetica', 'bold')
  doc.text('Data', marginX, y)
  doc.text('Valor', marginX + 120, y)
  y += 6
  doc.setLineWidth(0.5)
  doc.line(marginX, y, marginX + contentWidth, y)
  y += 18

  doc.setFont('helvetica', 'normal')
  const sortedSessions = closing.sessions.slice().sort((a, b) => a.date.localeCompare(b.date))
  for (const s of sortedSessions) {
    ensureSpace(20)
    doc.text(formatDateShortBR(s.date), marginX, y)
    doc.text(formatCurrencyBRL(s.value), marginX + 120, y)
    y += 20
  }

  y += 6
  doc.line(marginX, y, marginX + contentWidth, y)
  y += 22
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL: ${formatCurrencyBRL(closing.totalValue)}`, marginX, y)
  y += 36

  ensureSpace(60)
  doc.setFont('helvetica', 'bold')
  doc.text('Observações', marginX, y)
  y += 20
  doc.setFont('helvetica', 'normal')
  const obsText = observations.trim() || '(nenhuma observação registrada)'
  const wrappedObs = doc.splitTextToSize(obsText, contentWidth)
  ensureSpace(wrappedObs.length * 16)
  doc.text(wrappedObs, marginX, y)
  y += wrappedObs.length * 16 + 30

  ensureSpace(80)
  doc.text('Qualquer dúvida estou à disposição.', marginX, y)
  y += 26
  doc.text('Abraço!', marginX, y)
  y += 18
  doc.setFont('helvetica', 'bold')
  doc.text(therapistName, marginX, y)

  return doc
}
