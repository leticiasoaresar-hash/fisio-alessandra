import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { db } from '../db'
import { deleteSession, getMonthlyClosing } from '../repo'
import { Screen, TopBar, Card, PrimaryButton, OutlineButton, EmptyState } from '../components/ui'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CheckCircleIcon, CircleIcon, ReceiptIcon, MessageIcon } from '../components/icons'
import { currentMonthKey, formatCurrencyBRL, formatDateBR, formatMonthLabelCapitalized, shiftMonthKey } from '../utils/month'

export function PatientDetail() {
  const { id } = useParams()
  const patientId = Number(id)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const monthKey = params.get('mes') ?? currentMonthKey()

  const patient = useLiveQuery(() => db.patients.get(patientId), [patientId])
  const sessionsVersion = useLiveQuery(() => db.sessions.where('patientId').equals(patientId).toArray(), [patientId])
  const paymentsVersion = useLiveQuery(() => db.payments.where('patientId').equals(patientId).toArray(), [patientId])
  const closing = useLiveQuery(
    () => getMonthlyClosing(patientId, monthKey),
    [patientId, monthKey, sessionsVersion, paymentsVersion],
  )

  function goMonth(delta: number) {
    setParams({ mes: shiftMonthKey(monthKey, delta) })
  }

  async function handleDeleteSession(sessionId: number) {
    if (!confirm('Excluir esta sessão?')) return
    await deleteSession(sessionId)
  }

  if (patient === undefined) return null
  if (patient === null || !patient) {
    return (
      <Screen>
        <TopBar title="Paciente" backTo="/pacientes" />
        <EmptyState title="Paciente não encontrado" />
      </Screen>
    )
  }

  return (
    <Screen>
      <TopBar
        title={patient.name}
        backTo="/pacientes"
        action={
          <Link to={`/pacientes/${patientId}/editar`} className="text-sm font-semibold text-brick px-2">
            Editar
          </Link>
        }
      />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {(patient.familyName || patient.familyContact || patient.notes) && (
          <Card className="text-sm text-charcoal/80 flex flex-col gap-1">
            {patient.familyName && (
              <p>
                <span className="font-medium text-charcoal">Familiar responsável: </span>
                {patient.familyName}
              </p>
            )}
            {patient.familyContact && (
              <p>
                <span className="font-medium text-charcoal">Contato do familiar: </span>
                {patient.familyContact}
              </p>
            )}
            {patient.notes && (
              <p>
                <span className="font-medium text-charcoal">Observações: </span>
                {patient.notes}
              </p>
            )}
          </Card>
        )}

        <PrimaryButton onClick={() => navigate(`/pacientes/${patientId}/sessao`)}>
          <PlusIcon className="w-5 h-5" />
          Registrar sessão
        </PrimaryButton>

        <div className="flex items-center justify-between">
          <button onClick={() => goMonth(-1)} className="p-2 rounded-full active:bg-cloud text-charcoal" aria-label="Mês anterior">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-base font-semibold text-charcoal">{formatMonthLabelCapitalized(monthKey)}</span>
          <button onClick={() => goMonth(1)} className="p-2 rounded-full active:bg-cloud text-charcoal" aria-label="Próximo mês">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {closing && (
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-taupe">
                  {closing.sessionCount} {closing.sessionCount === 1 ? 'sessão' : 'sessões'} no mês
                </p>
                <p className="text-xl font-bold text-charcoal">{formatCurrencyBRL(closing.totalValue)}</p>
              </div>
              <span className={`flex items-center gap-1 text-sm font-medium ${closing.paid ? 'text-green-600' : 'text-brick'}`}>
                {closing.paid ? <CheckCircleIcon className="w-4 h-4" /> : <CircleIcon className="w-4 h-4" />}
                {closing.paid ? 'Pago' : 'Pendente'}
              </span>
            </div>
            <div className="flex gap-2">
              <OutlineButton onClick={() => navigate(`/pacientes/${patientId}/fechamento?mes=${monthKey}`)} className="text-sm py-2.5">
                <ReceiptIcon className="w-4 h-4" />
                Recibo
              </OutlineButton>
              <OutlineButton onClick={() => navigate(`/pacientes/${patientId}/evolucao?mes=${monthKey}`)} className="text-sm py-2.5">
                <MessageIcon className="w-4 h-4" />
                Evolução
              </OutlineButton>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-2 pb-4">
          <p className="text-sm font-semibold text-charcoal">Histórico de sessões</p>
          {closing && closing.sessions.length === 0 ? (
            <p className="text-sm text-taupe py-4 text-center">Nenhuma sessão registrada neste mês.</p>
          ) : (
            closing?.sessions.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/pacientes/${patientId}/sessao/${s.id}`)}
                className="text-left"
              >
                <Card className="flex items-start justify-between gap-3 active:bg-cloud/60">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal">{formatDateBR(s.date)}</p>
                    {s.note && <p className="text-sm text-taupe mt-0.5 line-clamp-2">{s.note}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-semibold text-charcoal">{formatCurrencyBRL(s.value)}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (s.id) handleDeleteSession(s.id)
                      }}
                      className="text-xs text-brick"
                    >
                      Excluir
                    </button>
                  </div>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </Screen>
  )
}
