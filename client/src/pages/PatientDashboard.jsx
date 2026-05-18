import { FaCalendarCheck, FaFileMedical, FaHeartPulse, FaPrescriptionBottleMedical } from 'react-icons/fa6'
import DashboardHeader from '../dashboard/DashboardHeader'
import DashboardTable from '../dashboard/DashboardTable'
import StatusPill from '../dashboard/StatusPill'
import StatCard from '../components/StatCard'

function PatientDashboard() {
  const rows = [
    { id: '1', cells: ['May 20, 2026', 'Dr. Khan', 'General checkup', <StatusPill>Upcoming</StatusPill>] },
    { id: '2', cells: ['May 04, 2026', 'Dr. Malik', 'Prescription review', <StatusPill tone="emerald">Completed</StatusPill>] },
    { id: '3', cells: ['Apr 18, 2026', 'Dr. Khan', 'Fever follow-up', <StatusPill tone="emerald">Completed</StatusPill>] },
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Patient Dashboard"
        subtitle="Track appointments, prescriptions, and personal care history from one focused workspace."
        action={
          <button className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
            Request visit
          </button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Upcoming" value="1" detail="Next visit scheduled" icon={FaCalendarCheck} tone="sky" />
        <StatCard title="Prescriptions" value="6" detail="Available in history" icon={FaPrescriptionBottleMedical} tone="emerald" />
        <StatCard title="Records" value="12" detail="Medical history entries" icon={FaFileMedical} tone="amber" />
        <StatCard title="Care status" value="Good" detail="Routine monitoring" icon={FaHeartPulse} tone="rose" />
      </section>

      <DashboardTable columns={['Date', 'Doctor', 'Reason', 'Status']} rows={rows} />
    </div>
  )
}

export default PatientDashboard
