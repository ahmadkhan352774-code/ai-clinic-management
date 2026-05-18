import { FaHeartbeat } from 'react-icons/fa'

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
        <FaHeartbeat />
      </div>
      <div>
        <p className="text-base font-semibold leading-5 text-slate-950">AI Clinic</p>
        <p className="text-xs font-medium text-slate-500">Care management</p>
      </div>
    </div>
  )
}

export default Logo
