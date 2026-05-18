import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            border: '1px solid #dbeafe',
            borderRadius: '8px',
            color: '#0f172a',
          },
        }}
      />
    </>
  )
}

export default App
