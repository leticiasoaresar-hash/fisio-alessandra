import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createPatient, deletePatient, getPatient, updatePatient } from '../repo'
import { Screen, TopBar, Field, TextInput, TextArea, PrimaryButton, SecondaryButton } from '../components/ui'

export function PatientForm() {
  const { id } = useParams()
  const patientId = id ? Number(id) : undefined
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [loaded, setLoaded] = useState(!patientId)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!patientId) return
    getPatient(patientId).then((p) => {
      if (p) {
        setName(p.name)
        setValue(String(p.defaultSessionValue))
        setContact(p.familyContact ?? '')
        setNotes(p.notes ?? '')
      }
      setLoaded(true)
    })
  }, [patientId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numericValue = Number(value.replace(',', '.'))
    if (!name.trim() || Number.isNaN(numericValue)) return
    setSaving(true)
    const data = {
      name: name.trim(),
      defaultSessionValue: numericValue,
      familyContact: contact.trim() || undefined,
      notes: notes.trim() || undefined,
    }
    if (patientId) {
      await updatePatient(patientId, data)
      navigate(`/pacientes/${patientId}`)
    } else {
      const newId = await createPatient(data)
      navigate(`/pacientes/${newId}`)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!patientId) return
    if (!confirm('Excluir este paciente e todo o histórico de sessões dele? Essa ação não pode ser desfeita.')) return
    await deletePatient(patientId)
    navigate('/pacientes')
  }

  if (!loaded) return null

  return (
    <Screen>
      <TopBar title={patientId ? 'Editar paciente' : 'Novo paciente'} backTo={patientId ? `/pacientes/${patientId}` : '/pacientes'} />

      <form onSubmit={handleSubmit} className="px-4 py-4 flex flex-col gap-4">
        <Field label="Nome do paciente *">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Maria da Silva"
            required
            autoFocus={!patientId}
          />
        </Field>

        <Field label="Valor padrão da sessão (R$) *" hint="Pode ser alterado sessão a sessão quando precisar.">
          <TextInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex: 120"
            inputMode="decimal"
            required
          />
        </Field>

        <Field label="Contato do familiar responsável" hint="Opcional. Telefone, WhatsApp ou e-mail.">
          <TextInput
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Ex: (11) 99999-9999"
          />
        </Field>

        <Field label="Observações gerais" hint="Opcional. Diagnóstico, cuidados, restrições, etc.">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Ex: Hipertensa, atenção à pressão antes da sessão."
          />
        </Field>

        <div className="mt-2 flex flex-col gap-3">
          <PrimaryButton type="submit" disabled={saving}>
            {patientId ? 'Salvar alterações' : 'Cadastrar paciente'}
          </PrimaryButton>
          {patientId && (
            <SecondaryButton type="button" onClick={handleDelete} className="text-brick">
              Excluir paciente
            </SecondaryButton>
          )}
        </div>
      </form>
    </Screen>
  )
}
