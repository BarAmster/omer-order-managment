import { Outlet, NavLink } from 'react-router-dom'
import { CalendarDays, Users, ListOrdered } from 'lucide-react'

const tabs = [
  { to: '/', icon: CalendarDays, label: 'הזמנות' },
  { to: '/customers', icon: Users, label: 'לקוחות' },
  { to: '/pricelists', icon: ListOrdered, label: 'מחירונים' },
]

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-svh bg-gray-50 w-full relative">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 flex z-40">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
