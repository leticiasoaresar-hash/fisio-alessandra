import { NavLink } from 'react-router-dom'
import { HomeIcon, UsersIcon, SettingsIcon } from './icons'

const items = [
  { to: '/', label: 'Início', icon: HomeIcon, end: true },
  { to: '/pacientes', label: 'Pacientes', icon: UsersIcon, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: SettingsIcon, end: false },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-cloud flex pb-[env(safe-area-inset-bottom)] z-20">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
              isActive ? 'text-brick' : 'text-taupe'
            }`
          }
        >
          <Icon className="w-6 h-6" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
