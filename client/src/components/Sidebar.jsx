import { NavLink } from 'react-router-dom'
import {
  FaCalendarCheck,
  FaChartLine,
  FaFilePrescription,
  FaHouseMedical,
  FaRobot,
  FaUserDoctor,
  FaUserInjured,
  FaUsersGear,
  FaXmark,
} from 'react-icons/fa6'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

const roleLinks = {
  admin: [
    { label: 'Overview', path: '/admin', icon: FaChartLine },
    { label: 'Users', path: '/admin', icon: FaUsersGear },
    { label: 'Patients', path: '/patients', icon: FaUserInjured },
    { label: 'Appointments', path: '/appointments', icon: FaCalendarCheck },
    { label: 'Prescriptions', path: '/prescriptions', icon: FaFilePrescription },
    { label: 'AI Insights', path: '/admin', icon: FaRobot },
  ],
  doctor: [
    { label: 'Overview', path: '/doctor', icon: FaChartLine },
    { label: 'Schedule', path: '/appointments', icon: FaCalendarCheck },
    { label: 'Patients', path: '/patients', icon: FaUserInjured },
    { label: 'Prescriptions', path: '/prescriptions', icon: FaFilePrescription },
  ],
  receptionist: [
    { label: 'Overview', path: '/receptionist', icon: FaChartLine },
    { label: 'Appointments', path: '/appointments', icon: FaCalendarCheck },
    { label: 'Patients', path: '/patients', icon: FaHouseMedical },
  ],
  patient: [
    { label: 'Overview', path: '/patient', icon: FaChartLine },
    { label: 'Appointments', path: '/appointments', icon: FaCalendarCheck },
    { label: 'Prescriptions', path: '/prescriptions', icon: FaFilePrescription },
    { label: 'Care Team', path: '/patient', icon: FaUserDoctor },
  ],
}

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const links = roleLinks[user?.role] || []

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/40 transition lg:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-slate-200 bg-white transition duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <Logo />
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 lg:hidden"
          >
            <FaXmark />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {links.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`
                }
              >
                <Icon className="text-base" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="m-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-950">System status</p>
          <p className="mt-1 text-xs leading-5 text-emerald-700">Connected to the clinic API authentication flow.</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
