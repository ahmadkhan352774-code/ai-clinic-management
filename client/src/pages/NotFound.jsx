import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-8 text-sm font-semibold uppercase tracking-wider text-sky-700">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The clinic workspace route you requested does not exist.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Back to login
        </Link>
      </div>
    </main>
  )
}

export default NotFound
