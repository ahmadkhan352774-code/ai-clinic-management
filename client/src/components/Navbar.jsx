import { FaBars, FaBell, FaRightFromBracket } from 'react-icons/fa6'
import { useAuth } from '../context/AuthContext'

function Navbar({ onMenuClick }) {
  const { logout, user } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
          >
            <FaBars />
          </button>
          <div>
            <p className="text-sm font-semibold capitalize text-slate-950">{user?.role} dashboard</p>
            <p className="text-xs text-slate-500">Clinical operations overview</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 sm:inline-flex"
          >
            <FaBell />
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-950">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-700"
            aria-label="Sign out"
          >
            <FaRightFromBracket />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
