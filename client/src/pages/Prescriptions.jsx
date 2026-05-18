import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import api from '../services/api'
import DashboardHeader from '../dashboard/DashboardHeader'
import DashboardTable from '../dashboard/DashboardTable'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import { FaFilePdf } from 'react-icons/fa6'

export default function Prescriptions() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  const initialForm = { patientId: '', diagnosis: '', notes: '', instructions: '', medicines: [{ medicineName: '', dosage: '', timing: '', duration: '' }] }
  const [formData, setFormData] = useState(initialForm)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [prescRes, patRes] = await Promise.all([
        api.get('/prescriptions').catch(err => { console.error('Prescriptions Error:', err); return { data: [] }; }),
        api.get('/patients').catch(err => { console.error('Patients Error:', err); return { data: [] }; })
      ])
      
      const prescData = prescRes?.data?.data || prescRes?.data?.prescriptions || prescRes?.data || []
      setPrescriptions(Array.isArray(prescData) ? prescData : [])
      
      const patData = patRes?.data?.data || patRes?.data?.patients || patRes?.data || []
      const parsedPatients = Array.isArray(patData) ? patData : []
      setPatients(parsedPatients)

      console.log('Fetched Patients (Prescriptions):', parsedPatients)
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch prescriptions data')
      setPrescriptions([])
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/prescriptions', { ...formData, doctorId: user._id })
      toast.success('Prescription created successfully')
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating prescription')
    }
  }

  const handleDownloadPdf = async (id) => {
    try {
      const response = await api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `prescription-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (err) {
      toast.error('Error downloading PDF')
    }
  }

  const addMedicine = () => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { medicineName: '', dosage: '', timing: '', duration: '' }]
    })
  }

  const handleMedicineChange = (index, field, value) => {
    const newMeds = [...formData.medicines]
    newMeds[index][field] = value
    setFormData({ ...formData, medicines: newMeds })
  }

  const removeMedicine = (index) => {
    const newMeds = formData.medicines.filter((_, i) => i !== index)
    setFormData({ ...formData, medicines: newMeds })
  }

  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : []
  const filtered = safePrescriptions.filter(p => 
    p.patientId?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const canManage = user?.role === 'admin' || user?.role === 'doctor'

  const columns = ['Patient', 'Doctor', 'Diagnosis', 'Date', 'Actions']

  const rows = filtered.map((p) => ({
    id: p._id,
    cells: [
      p.patientId?.name || 'Unknown',
      p.doctorId?.name || 'Unknown',
      p.diagnosis,
      new Date(p.createdAt).toLocaleDateString(),
      <div className="flex gap-2">
        <button onClick={() => handleDownloadPdf(p._id)} className="flex items-center gap-1 text-sky-600 hover:text-sky-800">
          <FaFilePdf /> PDF
        </button>
      </div>
    ],
  }))

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Prescriptions" 
        subtitle="Manage and issue patient prescriptions."
        action={
          canManage && (
            <button onClick={() => {
              setFormData(initialForm)
              setIsModalOpen(true)
            }} className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
              Create Prescription
            </button>
          )
        }
      />

      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Search by patient name..." 
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Prescription">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Patient</label>
            <select required className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Diagnosis</label>
            <input required type="text" className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} />
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <h4 className="font-medium text-slate-800 mb-2">Medicines</h4>
            {formData.medicines.map((med, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 mb-2 items-center">
                <input required placeholder="Name" className="col-span-2 w-full rounded-lg border border-slate-200 p-2 text-xs" value={med.medicineName} onChange={e => handleMedicineChange(index, 'medicineName', e.target.value)} />
                <input required placeholder="Dosage" className="w-full rounded-lg border border-slate-200 p-2 text-xs" value={med.dosage} onChange={e => handleMedicineChange(index, 'dosage', e.target.value)} />
                <input required placeholder="Timing" className="w-full rounded-lg border border-slate-200 p-2 text-xs" value={med.timing} onChange={e => handleMedicineChange(index, 'timing', e.target.value)} />
                <div className="flex gap-1 items-center">
                  <input required placeholder="Duration" className="w-full rounded-lg border border-slate-200 p-2 text-xs" value={med.duration} onChange={e => handleMedicineChange(index, 'duration', e.target.value)} />
                  {formData.medicines.length > 1 && (
                    <button type="button" onClick={() => removeMedicine(index)} className="text-rose-500 hover:text-rose-700 font-bold px-1">&times;</button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={addMedicine} className="text-sm text-sky-600 hover:text-sky-800 mt-1">+ Add Medicine</button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Instructions</label>
            <textarea className="w-full rounded-lg border border-slate-200 p-2 text-sm" value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} />
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
