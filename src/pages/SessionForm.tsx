import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { createSession, deleteSession, getPatient, updateSession } from '../repo'
import { Screen, TopBar, Field, TextInput, TextArea, Select, PrimaryButton, SecondaryButton } from '../components/ui'
import { todayISO } from '../utils/month'
import type { Patient } from '../types'

export function SessionForm() {
  const { id, sessionId } = useParams()
  const patientIdFromRoute = id ? Number(id) : undefined
  const navigate = useNavigate()

  const patients = useLiveQuery(() => db.patients.toArray(), [])
  const sortedPatients = patients?.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  const [patientId, setPatientId] = useState<number | undefined>(patientIdFromRoute)
  const [date, setDate] = useState(todayISO())
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [loaded, setLoaded] = useState(!sessionId)
  const [saving, setSaving] = useState(false)

  // Preencher valor padrão ao escolher paciente (só em sessão nova)
  useEffect(() => {
    if (sessionId) return
    if (!patientId) return
    getPatient(patientId).then((p: Patient | undefined) => {
      if (p) setValue(String(p.defaultSessionValue))
    })
  }, [patientId, sessionId])

  useEffect(() => {
    if (!sessionId) return
    db.sessions.get(Number(sessionId)).then((s) => {
      if (s) {
        setPatientId(s.patientId)
        setDate(s.date)
        setValue(String(s.value))
        setNote(s.note ?? '')
      }
      setLoaded(true)
    })
  }, [sessionId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numericValue = Number(value.replace(',', '.'))
    if (!patientId || !date || Number.isNaN(numericValue)) return
    setSaving(true)
    const data = { patientId, date, value: numericValue, note: note.trim() || undefined }
    if (sessionId) {
      await updateSession(Number(sessionId), data)
    } else {
      await createSession(data)
    }
    setSaving(false)
    navigate(`/pacientes/${patientId}`)
  }

  async function handleDelete() {
    if (!sessionId) return
    if (!confirm('Excluir esta sessão?')) return
    await deleteSession(Number(sessionId))
    navigate(patientId ? `/pacientes/${patientId}` : '/pacientes')
  }

  const backTo = patientIdFromRoute ? `/pacientes/${patientIdFromRoute}` : '/'

  if (!loaded) return null

  return (
    <Screen>
      <TopBar title={sessionId ? 'Editar sessão' : 'Registrar sessão'} backTo={backTo} />

      <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-4">
        {!patientIdFromRoute && (
          <Field label="Paciente *">
            <Select
              value={patientId ?? ''}
              onChange={(e) => setPatientId(e.target.value ? Number(e.target.value) : undefined)}
              required
            >
              <option value="" disabled>
                Selecione o paciente
              </option>
              {sortedPatients?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Data da sessão *">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </Field>

        <Field label="Valor cobrado (R$) *" hint="Pré-preenchido com o valor padrão do paciente. Pode ajustar se houve desconto ou sessão extra.">
          <TextInput value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" required />
        </Field>

        <Field label="Observação / evolução do dia" hint="Opcional. Vai ajudar a montar o resumo mensal para a família depois.">
          <TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Ex: Paciente respondeu bem aos exercícios de equilíbrio, sem queixas de dor." />
        </Field>

        <div className="mt-2 flex flex-col gap-3">
          <PrimaryButton type="submit" disabled={saving || !patientId}>
            {sessionId ? 'Salvar alterações' : 'Registrar sessão'}
          </PrimaryButton>
          {sessionId && (
            <SecondaryButton type="button" onClick={handleDelete} className="text-brick">
              Excluir sessão
            </SecondaryButton>
          )}
        </div>
      </form>
    </Screen>
  )
}
