import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useSearchParams } from 'react-router-dom'
import { db } from '../db'
import { getAllClosingsForMonth } from '../repo'
import { currentMonthKey, formatCurrencyBRL, formatMonthLabelCapitalized, shiftMonthKey } from '../utils/month'
import { Screen, Card, EmptyState } from '../components/ui'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CheckCircleIcon, CircleIcon } from '../components/icons'

export function Home() {
  const [params, setParams] = useSearchParams()
  const monthKey = params.get('mes') ?? currentMonthKey()

  const patients = useLiveQuery(() => db.patients.toArray(), [])
  const sessions = useLiveQuery(() => db.sessions.toArray(), [])
  const payments = useLiveQuery(() => db.payments.toArray(), [])

  const closings = useLiveQuery(
    () => getAllClosingsForMonth(monthKey),
    [monthKey, patients, sessions, payments],
  )

  function goMonth(delta: number) {
    setParams({ mes: shiftMonthKey(monthKey, delta) })
  }

  const totalDue = closings?.reduce((sum, c) => sum + (c.paid ? 0 : c.totalValue), 0) ?? 0

  return (
    <Screen>
      <header className="px-4 pt-6 pb-3 bg-brick text-white">
        <p className="text-sm opacity-90">FisioApp</p>
        <h1 className="text-2xl font-semibold mt-0.5">Início</h1>
      </header>

      <div className="px-4 py-4 flex items-center justify-between gap-2">
        <button
          onClick={() => goMonth(-1)}
          className="p-2 rounded-full active:bg-cloud text-charcoal"
          aria-label="Mês anterior"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <span className="text-base font-semibold text-charcoal">{formatMonthLabelCapitalized(monthKey)}</span>
        <button
          onClick={() => goMonth(1)}
          className="p-2 rounded-full active:bg-cloud text-charcoal"
          aria-label="Próximo mês"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {closings && closings.length > 0 && (
        <div className="px-4 pb-2">
          <Card className="bg-salmon/20 border-salmon/40">
            <p className="text-xs text-charcoal/70">Total pendente no mês</p>
            <p className="text-2xl font-bold text-brick">{formatCurrencyBRL(totalDue)}</p>
          </Card>
        </div>
      )}

      <div className="px-4 py-3 flex flex-col gap-3">
        {!closings ? null : closings.length === 0 ? (
          <EmptyState
            title="Nenhum paciente cadastrado ainda"
            subtitle="Cadastre seu primeiro paciente para começar a registrar sessões."
            action={
              <Link to="/pacientes/novo" className="text-brick font-semibold text-sm">
                + Cadastrar paciente
              </Link>
            }
          />
        ) : (
          closings.map((c) => {
              const patient = patients?.find((p) => p.id === c.patientId)
              if (!patient) return null
              return (
                <Link key={c.patientId} to={`/pacientes/${c.patientId}/fechamento?mes=${monthKey}`}>
                  <Card className="flex items-center justify-between active:bg-cloud/60">
                    <div className="min-w-0">
                      <p className="font-semibold text-charcoal truncate">{patient.name}</p>
                      <p className="text-sm text-taupe">
                        {c.sessionCount} {c.sessionCount === 1 ? 'sessão' : 'sessões'} no mês
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 pl-2">
                      <span className="font-semibold text-charcoal">{formatCurrencyBRL(c.totalValue)}</span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${c.paid ? 'text-green-600' : 'text-brick'}`}>
                        {c.paid ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <CircleIcon className="w-3.5 h-3.5" />}
                        {c.paid ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </Card>
                </Link>
              )
            })
        )}
      </div>

      <Link
        to="/registrar-sessao"
        className="fixed bottom-24 right-4 max-w-[480px] mx-auto z-20 bg-brick text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg active:bg-brick-dark"
        aria-label="Registrar sessão"
      >
        <PlusIcon className="w-7 h-7" />
      </Link>
    </Screen>
  )
}
