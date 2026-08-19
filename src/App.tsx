import { HashRouter, Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Home } from './pages/Home'
import { PatientList } from './pages/PatientList'
import { PatientForm } from './pages/PatientForm'
import { PatientDetail } from './pages/PatientDetail'
import { SessionForm } from './pages/SessionForm'
import { MonthlyClosingPage } from './pages/MonthlyClosingPage'
import { EvolutionPage } from './pages/EvolutionPage'
import { Settings } from './pages/Settings'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pacientes" element={<PatientList />} />
        <Route path="/pacientes/novo" element={<PatientForm />} />
        <Route path="/pacientes/:id" element={<PatientDetail />} />
        <Route path="/pacientes/:id/editar" element={<PatientForm />} />
        <Route path="/registrar-sessao" element={<SessionForm />} />
        <Route path="/pacientes/:id/sessao" element={<SessionForm />} />
        <Route path="/pacientes/:id/sessao/:sessionId" element={<SessionForm />} />
        <Route path="/pacientes/:id/fechamento" element={<MonthlyClosingPage />} />
        <Route path="/pacientes/:id/evolucao" element={<EvolutionPage />} />
        <Route path="/ajustes" element={<Settings />} />
      </Routes>
      <BottomNav />
    </HashRouter>
  )
}

export default App
