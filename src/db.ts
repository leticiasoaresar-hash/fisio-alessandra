import Dexie, { type EntityTable } from 'dexie'
import type { Patient, Session, MonthlyPayment, TherapistSettings, MonthlyNote } from './types'

class FisioDB extends Dexie {
  patients!: EntityTable<Patient, 'id'>
  sessions!: EntityTable<Session, 'id'>
  payments!: EntityTable<MonthlyPayment, 'id'>
  settings!: EntityTable<TherapistSettings, 'id'>
  monthlyNotes!: EntityTable<MonthlyNote, 'id'>

  constructor() {
    super('fisioapp-db')
    this.version(1).stores({
      patients: '++id, name',
      sessions: '++id, patientId, date',
      payments: '++id, patientId, monthKey, [patientId+monthKey]',
      settings: 'id',
    })
    this.version(2).stores({
      patients: '++id, name',
      sessions: '++id, patientId, date',
      payments: '++id, patientId, monthKey, [patientId+monthKey]',
      settings: 'id',
      monthlyNotes: '++id, patientId, monthKey, [patientId+monthKey]',
    })
  }
}

export const db = new FisioDB()
