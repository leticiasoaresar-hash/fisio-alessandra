import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { db } from '../db'
import { Screen, TopBar, Card, EmptyState, TextInput } from '../components/ui'
import { PlusIcon } from '../components/icons'
import { formatCurrencyBRL } from '../utils/month'

export function PatientList() {
  const [query, setQuery] = useState('')
  const patients = useLiveQuery(() => db.patients.toArray(), [])
  const sorted = patients?.slice().sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const filtered = sorted?.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <Screen>
      <TopBar
        title="Pacientes"
        action={
          <Link to="/pacientes/novo" className="p-2 -mr-2 rounded-full active:bg-cloud text-brick" aria-label="Novo paciente">
            <PlusIcon className="w-6 h-6" />
          </Link>
        }
      />

      {sorted && sorted.length > 3 && (
        <div className="px-4 pt-4">
          <TextInput
            placeholder="Buscar paciente..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      <div className="px-4 py-4 flex flex-col gap-3">
        {!filtered ? null : filtered.length === 0 ? (
          <EmptyState
            title={query ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            subtitle={query ? undefined : 'Toque no + para cadastrar o primeiro paciente.'}
          />
        ) : (
          filtered.map((p) => (
            <Link key={p.id} to={`/pacientes/${p.id}`}>
              <Card className="flex items-center justify-between active:bg-cloud/60">
                <p className="font-semibold text-charcoal truncate">{p.name}</p>
                <p className="text-sm text-taupe shrink-0 pl-2">{formatCurrencyBRL(p.defaultSessionValue)} / sessão</p>
              </Card>
            </Link>
          ))
        )}
      </div>
    </Screen>
  )
}
