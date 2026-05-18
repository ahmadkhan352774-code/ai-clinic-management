import { Outlet } from 'react-router-dom'
import Logo from '../components/Logo'

function AuthLayout() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.85fr]">
        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">
            <Logo />
            <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <Outlet />
            </div>
          </div>
        </section>
        <section className="hidden border-l border-slate-200 bg-sky-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-200">AI Clinic Management</p>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight">
              A calm workspace for appointments, patients, prescriptions, and AI-assisted review.
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {['Secure roles', 'Clinical flow', 'Responsive UI'].map((item) => (
              <div key={item} className="rounded-lg border border-white/15 bg-white/10 p-4">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default AuthLayout
