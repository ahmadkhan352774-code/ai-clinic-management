import { FaCalendarCheck, FaClipboardList, FaPhone, FaUserPlus } from 'react-icons/fa6'
import DashboardHeader from '../dashboard/DashboardHeader'
import DashboardTable from '../dashboard/DashboardTable'
import StatusPill from '../dashboard/StatusPill'
import StatCard from '../components/StatCard'

function ReceptionistDashboard() {
  const rows = [
    { id: '1', cells: ['Sarah Ahmed', 'Dr. Khan', '09:00', <StatusPill tone="emerald">Confirmed</StatusPill>] },
    { id: '2', cells: ['Ali Raza', 'Dr. Malik', '10:30', <StatusPill tone="amber">Pending</StatusPill>] },
    { id: '3', cells: ['Mina Shah', 'Dr. Khan', '12:15', <StatusPill tone="rose">Needs call</StatusPill>] },
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Receptionist Dashboard"
        subtitle="Coordinate patient intake, appointment booking, and front-desk clinic flow."
        action={
          <button className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
            Book appointment
          </button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Check-ins" value="46" detail="Arrived today" icon={FaClipboardList} tone="sky" />
        <StatCard title="Bookings" value="73" detail="Across all doctors" icon={FaCalendarCheck} tone="emerald" />
        <StatCard title="New patients" value="14" detail="Profiles created" icon={FaUserPlus} tone="amber" />
        <StatCard title="Callbacks" value="8" detail="Pending confirmation" icon={FaPhone} tone="rose" />
      </section>

      <DashboardTable columns={['Patient', 'Doctor', 'Time', 'Status']} rows={rows} />
    </div>
  )
}

export default ReceptionistDashboard
