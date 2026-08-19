import Dexie, { type EntityTable } from 'dexie'
import type { Patient, Session, MonthlyPayment, TherapistSettings } from './types'

class FisioDB extends Dexie {
  patients!: EntityTable<Patient, 'id'>
  sessions!: EntityTable<Session, 'id'>
  payments!: EntityTable<MonthlyPayment, 'id'>
  settings!: EntityTable<TherapistSettings, 'id'>

  constructor() {
    super('fisioapp-db')
    this.version(1).stores({
      patients: '++id, name',
      sessions: '++id, patientId, date',
      payments: '++id, patientId, monthKey, [patientId+monthKey]',
      settings: 'id',
    })
  }
}

export const db = new FisioDB()
