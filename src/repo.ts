import { db } from './db'
import type { Patient, Session, MonthlyPayment, MonthlyNote, BackupData } from './types'
import { monthKeyFromDate } from './utils/month'

// ---- Patients ----

export async function listPatients(): Promise<Patient[]> {
  const patients = await db.patients.toArray()
  return patients.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function getPatient(id: number): Promise<Patient | undefined> {
  return db.patients.get(id)
}

export async function createPatient(data: Omit<Patient, 'id' | 'createdAt'>): Promise<number> {
  return db.patients.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updatePatient(id: number, data: Partial<Omit<Patient, 'id' | 'createdAt'>>): Promise<void> {
  await db.patients.update(id, data)
}

export async function deletePatient(id: number): Promise<void> {
  await db.transaction('rw', db.patients, db.sessions, db.payments, async () => {
    await db.sessions.where('patientId').equals(id).delete()
    await db.payments.where('patientId').equals(id).delete()
    await db.patients.delete(id)
  })
}

// ---- Sessions ----

export async function listSessionsForPatient(patientId: number): Promise<Session[]> {
  const sessions = await db.sessions.where('patientId').equals(patientId).toArray()
  return sessions.sort((a, b) => b.date.localeCompare(a.date))
}

export async function listSessionsForPatientMonth(patientId: number, monthKey: string): Promise<Session[]> {
  const sessions = await listSessionsForPatient(patientId)
  return sessions.filter((s) => monthKeyFromDate(s.date) === monthKey)
}

export async function createSession(data: Omit<Session, 'id' | 'createdAt'>): Promise<number> {
  return db.sessions.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateSession(id: number, data: Partial<Omit<Session, 'id' | 'createdAt'>>): Promise<void> {
  await db.sessions.update(id, data)
}

export async function deleteSession(id: number): Promise<void> {
  await db.sessions.delete(id)
}

// ---- Monthly closing ----

export interface MonthlyClosing {
  patientId: number
  monthKey: string
  sessionCount: number
  totalValue: number
  paid: boolean
  sessions: Session[]
}

export async function getMonthlyClosing(patientId: number, monthKey: string): Promise<MonthlyClosing> {
  const sessions = await listSessionsForPatientMonth(patientId, monthKey)
  const totalValue = sessions.reduce((sum, s) => sum + s.value, 0)
  const payment = await db.payments
    .where('[patientId+monthKey]')
    .equals([patientId, monthKey])
    .first()
  return {
    patientId,
    monthKey,
    sessionCount: sessions.length,
    totalValue,
    paid: payment?.paid ?? false,
    sessions,
  }
}

export async function setMonthPaid(patientId: number, monthKey: string, paid: boolean): Promise<void> {
  const existing = await db.payments
    .where('[patientId+monthKey]')
    .equals([patientId, monthKey])
    .first()
  const record: Omit<MonthlyPayment, 'id'> = {
    patientId,
    monthKey,
    paid,
    paidAt: paid ? new Date().toISOString() : undefined,
  }
  if (existing?.id) {
    await db.payments.update(existing.id, record)
  } else {
    await db.payments.add(record)
  }
}

export async function getAllClosingsForMonth(monthKey: string): Promise<MonthlyClosing[]> {
  const patients = await listPatients()
  return Promise.all(patients.map((p) => getMonthlyClosing(p.id!, monthKey)))
}

// ---- Monthly notes (observações / evolução do mês) ----

export async function getMonthlyNote(patientId: number, monthKey: string): Promise<string> {
  const note = await db.monthlyNotes
    .where('[patientId+monthKey]')
    .equals([patientId, monthKey])
    .first()
  return note?.text ?? ''
}

export async function saveMonthlyNote(patientId: number, monthKey: string, text: string): Promise<void> {
  const existing = await db.monthlyNotes
    .where('[patientId+monthKey]')
    .equals([patientId, monthKey])
    .first()
  const record: Omit<MonthlyNote, 'id'> = {
    patientId,
    monthKey,
    text,
    updatedAt: new Date().toISOString(),
  }
  if (existing?.id) {
    await db.monthlyNotes.update(existing.id, record)
  } else {
    await db.monthlyNotes.add(record)
  }
}

// ---- Settings ----

export async function getSettings() {
  return db.settings.get(1)
}

export async function saveSettings(data: { name: string; credential?: string; phone?: string }) {
  await db.settings.put({ id: 1, ...data })
}

// ---- Backup ----

export async function exportBackup(): Promise<BackupData> {
  const [patients, sessions, payments, settings, monthlyNotes] = await Promise.all([
    db.patients.toArray(),
    db.sessions.toArray(),
    db.payments.toArray(),
    db.settings.toArray(),
    db.monthlyNotes.toArray(),
  ])
  return {
    exportedAt: new Date().toISOString(),
    version: 2,
    patients,
    sessions,
    payments,
    settings,
    monthlyNotes,
  }
}

export async function importBackup(data: BackupData): Promise<void> {
  await db.transaction('rw', db.patients, db.sessions, db.payments, db.settings, db.monthlyNotes, async () => {
    await db.patients.clear()
    await db.sessions.clear()
    await db.payments.clear()
    await db.settings.clear()
    await db.monthlyNotes.clear()
    if (data.patients?.length) await db.patients.bulkAdd(data.patients)
    if (data.sessions?.length) await db.sessions.bulkAdd(data.sessions)
    if (data.payments?.length) await db.payments.bulkAdd(data.payments)
    if (data.settings?.length) await db.settings.bulkAdd(data.settings)
    if (data.monthlyNotes?.length) await db.monthlyNotes.bulkAdd(data.monthlyNotes)
  })
}
