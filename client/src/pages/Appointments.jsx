import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import DashboardHeader from '../dashboard/DashboardHeader'
import DashboardTable from '../dashboard/DashboardTable'
import StatusPill from '../dashboard/StatusPill'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

export default function Appointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ patientId: '', doctorId: '', appointmentDate: '', appointmentTime: '', symptoms: '', notes: '' })
  
  // Filters
  const [filterDoctor, setFilterDoctor] = useState('')
  const [filterPatient, setFilterPatient] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [apptsRes, docRes, patRes] = await Promise.all([
        api.get('/appointments').catch(err => { console.error('Appts Error:', err); return { data: [] }; }),
        api.get('/admin/users').catch(err => { console.error('Doctors Error:', err); return { data: [] }; }),
        api.get('/patients').catch(err => { console.error('Patients Error:', err); return { data: [] }; })
      ])
      
      // Handle potential API response structure variations safely
      const apptsData = apptsRes?.data?.data || apptsRes?.data?.appointments || apptsRes?.data || []
      setAppointments(Array.isArray(apptsData) ? apptsData : [])
      
      const docData = docRes?.data?.data || docRes?.data?.users || docRes?.data || []
      const parsedDoctors = Array.isArray(docData) ? docData.filter(u => u.role === 'doctor') : []
      setDoctors(parsedDoctors)
      
      const patData = patRes?.data?.data || patRes?.data?.patients || patRes?.data || []
      const parsedPatients = Array.isArray(patData) ? patData : []
      setPatients(parsedPatients)

      console.log('Fetched Doctors:', parsedDoctors)
      console.log('Fetched Patients:', parsedPatients)
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch appointments data')
      setAppointments([])
      setDoctors([])
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  // To properly get doctors if not admin:
  // Usually we'd have a specific /users/doctors endpoint, but we'll fetch from admin users if we can. 
  // If we get unauthorized, we won't show doctors dropdown or we can assume user cannot book.

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/appointments', formData)
      toast.success('Appointment booked successfully')
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error booking appointment')
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status })
      toast.success('Status updated')
      fetchData()
    } catch (err) {
      toast.error('Error updating status')
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await api.patch(`/appointments/${id}/cancel`)
      toast.success('Appointment cancelled')
      fetchData()
    } catch (err) {
      toast.error('Error cancelling appointment')
    }
  }

  const safeAppointments = Array.isArray(appointments) ? appointments : []
  const filtered = safeAppointments.filter(a => {
    const docMatch = filterDoctor ? a.doctorId?._id === filterDoctor : true
    const patMatch = filterPatient ? a.patientId?._id === filterPatient : true
    const dateMatch = filterDate ? new Date(a.appointmentDate).toISOString().split('T')[0] === filterDate : true
    return docMatch && patMatch && dateMatch
  })

  const getStatusTone = (status) => {
    switch (status) {
      case 'confirmed': return 'sky'
      case 'completed': return 'emerald'
      case 'pending': return 'amber'
      case 'cancelled': return 'rose'
      default: return 'slate'
    }
  }

  const canManageStatus = user?.role === 'admin' || user?.role === 'receptionist'

  const columns = ['Patient', 'Doctor', 'Date & Time', 'Status']
  if (canManageStatus) columns.push('Actions')

  const rows = filtered.map((a) => {
    const cells = [
      a.patientId?.name || 'Unknown',
      a.doctorId?.name || 'Unknown',
      `${new Date(a.appointmentDate).toLocaleDateString()} ${a.appointmentTime}`,
      <StatusPill tone={getStatusTone(a.status)}>{a.status}</StatusPill>,
    ]

    if (canManageStatus) {
      cells.push(
        <div className="flex gap-2">
          {a.status === 'pending' && <button onClick={() => handleUpdateStatus(a._id, 'confirmed')} className="text-sky-600 hover:text-sky-800">Confirm</button>}
          {a.status === 'confirmed' && <button onClick={() => handleUpdateStatus(a._id, 'completed')} className="text-emerald-600 hover:text-emerald-800">Complete</button>}
          {a.status !== 'cancelled' && a.status !== 'completed' && <button onClick={() => handleCancel(a._id)} className="text-rose-600 hover:text-rose-800">Cancel</button>}
        </div>
      )
    }

    return { id: a._id, cells }
  })

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Appointments" 
        subtitle="Manage and schedule patient appointments."
        action={
          (user?.role === 'receptionist' || user?.role === 'admin' || user?.role === 'patient') && (
            <button onClick={() => {
              setFormData({ patientId: '', doctorId: '', appointmentDate: '', appointmentTime: '', symptoms: '', notes: '' })
              setIsModalOpen(true)
            }} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
              Book Appointment
            </button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <select className="rounded-lg border border-slate-200 px-4 py-2 text-sm" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}>
          <option value="">All Doctors</option>
          {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="rounded-lg border border-slate-200 px-4 py-2 text-sm" value={filterPatient} onChange={e => setFilterPatient(e.target.value)}>
          <option value="">All Patients</option>
          {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <input type="date" className="rounded-lg border border-slate-200 px-4 py-2 text-sm" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
        </div>
      ) : (
        <DashboardTable columns={columns} rows={rows} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Book Appointment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Patient</label>
              <select required className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Doctor</label>
              <select required className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value})}>
                <option value="">Select Doctor</option>
                {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <input required type="date" className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.appointmentDate} onChange={e => setFormData({...formData, appointmentDate: e.target.value})} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Time</label>
              <input required type="time" className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.appointmentTime} onChange={e => setFormData({...formData, appointmentTime: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Symptoms</label>
            <textarea required className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.symptoms} onChange={e => setFormData({...formData, symptoms: e.target.value})} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Book</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
