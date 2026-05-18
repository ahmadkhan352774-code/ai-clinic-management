import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import DashboardHeader from '../dashboard/DashboardHeader'
import DashboardTable from '../dashboard/DashboardTable'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

export default function Patients() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', age: '', gender: 'male', contact: '', address: '' })
  const [search, setSearch] = useState('')

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/patients')
      
      // Handle various response structures safely
      let patientsData = []
      if (data) {
        patientsData = data.data || data.patients || data
      }
      
      setPatients(Array.isArray(patientsData) ? patientsData : [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch patients')
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/patients/${editingId}`, formData)
        toast.success('Patient updated successfully')
      } else {
        await api.post('/patients', formData)
        toast.success('Patient added successfully')
      }
      setIsModalOpen(false)
      fetchPatients()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving patient')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return
    try {
      await api.delete(`/patients/${id}`)
      toast.success('Patient deleted')
      fetchPatients()
    } catch (err) {
      toast.error('Error deleting patient')
    }
  }

  const safePatients = Array.isArray(patients) ? patients : []
  const filteredPatients = safePatients.filter(p => p?.name?.toLowerCase().includes(search.toLowerCase()))

  const canManage = user?.role === 'admin' || user?.role === 'receptionist'

  const columns = ['Name', 'Age', 'Gender', 'Contact']
  if (canManage) columns.push('Actions')

  const rows = filteredPatients.map((p) => {
    const cells = [
      p.name,
      p.age,
      <span className="capitalize">{p.gender}</span>,
      p.contact,
    ]
    if (canManage) {
      cells.push(
        <div className="flex gap-2">
          <button onClick={() => {
            setEditingId(p._id)
            setFormData({ name: p.name, age: p.age, gender: p.gender, contact: p.contact, address: p.address })
            setIsModalOpen(true)
          }} className="text-sky-600 hover:text-sky-800">Edit</button>
          <button onClick={() => handleDelete(p._id)} className="text-rose-600 hover:text-rose-800">Delete</button>
        </div>
      )
    }
    return { id: p._id, cells }
  })

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Patients" 
        subtitle="Manage clinic patients and medical records."
        action={
          canManage && (
            <button onClick={() => {
              setEditingId(null)
              setFormData({ name: '', age: '', gender: 'male', contact: '', address: '' })
              setIsModalOpen(true)
            }} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
              Add Patient
            </button>
          )
        }
      />

      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Search patients by name..." 
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent"></div>
        </div>
      ) : (
        <DashboardTable columns={columns} rows={rows} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Patient' : 'Add Patient'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input required type="text" className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Age</label>
              <input required type="number" min="0" max="130" className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Gender</label>
              <select className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contact</label>
            <input required type="text" className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
            <textarea required className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
