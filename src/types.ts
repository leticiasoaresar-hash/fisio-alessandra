export interface Patient {
  id: number
  name: string
  defaultSessionValue: number
  familyContact?: string
  notes?: string
  createdAt: string
}

export interface Session {
  id: number
  patientId: number
  date: string // YYYY-MM-DD
  value: number
  note?: string
  createdAt: string
}

export interface MonthlyPayment {
  id: number
  patientId: number
  monthKey: string // YYYY-MM
  paid: boolean
  paidAt?: string
}

export interface TherapistSettings {
  id: number // always 1, singleton
  name: string
  credential?: string // e.g. CREFITO number
  phone?: string
}

export interface BackupData {
  exportedAt: string
  version: number
  patients: Patient[]
  sessions: Session[]
  payments: MonthlyPayment[]
  settings: TherapistSettings[]
}
