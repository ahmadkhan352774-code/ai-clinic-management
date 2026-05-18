function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 rounded-lg border border-sky-100 bg-white px-5 py-4 shadow-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
        <span className="text-sm font-medium text-slate-700">Loading clinic workspace</span>
      </div>
    </div>
  )
}

export default LoadingScreen
