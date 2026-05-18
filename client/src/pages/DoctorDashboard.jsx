import { FaCalendarDay, FaFilePrescription, FaNotesMedical, FaUserInjured } from 'react-icons/fa6'
import DashboardHeader from '../dashboard/DashboardHeader'
import DashboardTable from '../dashboard/DashboardTable'
import StatusPill from '../dashboard/StatusPill'
import StatCard from '../components/StatCard'

function DoctorDashboard() {
  const rows = [
    { id: '1', cells: ['09:00', 'Sarah Ahmed', 'Fever and cough', <StatusPill>Pending</StatusPill>] },
    { id: '2', cells: ['10:30', 'Ali Raza', 'Follow-up', <StatusPill tone="emerald">Confirmed</StatusPill>] },
    { id: '3', cells: ['12:15', 'Mina Shah', 'Prescription review', <StatusPill tone="amber">In review</StatusPill>] },
  ]

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Doctor Dashboard"
        subtitle="Review assigned appointments, patient context, prescriptions, and AI symptom summaries."
        action={
          <button className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
            New prescription
          </button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Today" value="18" detail="Appointments scheduled" icon={FaCalendarDay} tone="sky" />
        <StatCard title="Patients" value="142" detail="Assigned records" icon={FaUserInjured} tone="emerald" />
        <StatCard title="Prescriptions" value="27" detail="Created this week" icon={FaFilePrescription} tone="amber" />
        <StatCard title="Notes" value="9" detail="Pending documentation" icon={FaNotesMedical} tone="rose" />
      </section>

      <DashboardTable columns={['Time', 'Patient', 'Reason', 'Status']} rows={rows} />
    </div>
  )
}

export default DoctorDashboard
