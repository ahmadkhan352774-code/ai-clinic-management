import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaArrowRightToBracket } from 'react-icons/fa6'
import { useAuth } from '../context/AuthContext'
import { getDashboardPath } from '../routes/roleRedirects'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const { isLoading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const user = await login(form)
      navigate(location.state?.from?.pathname || getDashboardPath(user.role), { replace: true })
    } catch {
      // Toast is handled in AuthContext.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in with your clinic account to continue.</p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          placeholder="you@clinic.com"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          required
          type="password"
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          placeholder="Enter password"
        />
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-70"
      >
        <FaArrowRightToBracket />
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>

      <p className="text-center text-sm text-slate-500">
        New patient?{' '}
        <Link to="/register" className="font-semibold text-sky-700">
          Create an account
        </Link>
      </p>
    </form>
  )
}

export default Login
