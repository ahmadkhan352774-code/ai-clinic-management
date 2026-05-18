import { useEffect, useState } from 'react'
import { FaCalendarCheck, FaRobot, FaUserDoctor, FaUserInjured } from 'react-icons/fa6'
import DashboardHeader from '../dashboard/DashboardHeader'
import DashboardTable from '../dashboard/DashboardTable'
import StatusPill from '../dashboard/StatusPill'
import StatCard from '../components/StatCard'
import api from '../services/api'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsRes, usersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
        ])

        setStats(statsRes.data.data)
        setUsers(usersRes.data.data)
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err)
        setError('Failed to load dashboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        <p>{error}</p>
      </div>
    )
  }

  const rows = users.map((user) => ({
    id: user._id,
    cells: [
      user.name,
      <span className="capitalize">{user.role}</span>,
      <StatusPill tone={user.isActive ? 'emerald' : 'rose'}>{user.isActive ? 'Active' : 'Inactive'}</StatusPill>,
      new Date(user.createdAt).toLocaleDateString(),
    ],
  }))

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Admin Dashboard"
        subtitle="Monitor clinical operations, staff access, patients, and AI-assisted workflow readiness."
        action={
          <button className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
            Add user
          </button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Patients" value={stats?.totalPatients || 0} icon={FaUserInjured} tone="sky" />
        <StatCard title="Total Doctors" value={stats?.totalDoctors || 0} icon={FaUserDoctor} tone="emerald" />
        <StatCard title="Total Appointments" value={stats?.totalAppointments || 0} icon={FaCalendarCheck} tone="amber" />
        <StatCard title="Total Prescriptions" value={stats?.totalPrescriptions || 0} icon={FaRobot} tone="rose" />
      </section>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Recent Users</h2>
        <DashboardTable columns={['Name', 'Role', 'Status', 'Joined']} rows={rows} />
      </div>
    </div>
  )
}

export default AdminDashboard
