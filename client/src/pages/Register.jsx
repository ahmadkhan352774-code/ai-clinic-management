import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaUserPlus } from 'react-icons/fa6'
import { useAuth } from '../context/AuthContext'
import { getDashboardPath } from '../routes/roleRedirects'

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' })
  const { isLoading, register } = useAuth()
  const navigate = useNavigate()

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const user = await register(form)
      navigate(getDashboardPath(user.role), { replace: true })
    } catch {
      // Toast is handled in AuthContext.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Create account</h1>
        <p className="mt-2 text-sm text-slate-500">Register a clinic account and continue to your workspace.</p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Full name</span>
        <input
          required
          value={form.name}
          onChange={(event) => updateField('name', event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          placeholder="Patient name"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          placeholder="patient@example.com"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Role</span>
        <select
          value={form.role}
          onChange={(event) => updateField('role', event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="receptionist">Receptionist</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          required
          type="password"
          minLength={8}
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          placeholder="Minimum 8 characters"
        />
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-70"
      >
        <FaUserPlus />
        {isLoading ? 'Creating...' : 'Create account'}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-sky-700">
          Sign in
        </Link>
      </p>
    </form>
  )
}

export default Register
