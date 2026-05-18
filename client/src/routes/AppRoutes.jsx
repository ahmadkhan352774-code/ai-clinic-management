import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import AuthLayout from '../layouts/AuthLayout'
import { AuthProvider } from '../context/AuthContext'
import AdminDashboard from '../pages/AdminDashboard'
import DoctorDashboard from '../pages/DoctorDashboard'
import Login from '../pages/Login'
import NotFound from '../pages/NotFound'
import PatientDashboard from '../pages/PatientDashboard'
import ReceptionistDashboard from '../pages/ReceptionistDashboard'
import Register from '../pages/Register'
import ProtectedRoute from './ProtectedRoute'
import Patients from '../pages/Patients'
import Appointments from '../pages/Appointments'
import Prescriptions from '../pages/Prescriptions'

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [{ path: '/admin', element: <AdminDashboard /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['doctor']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [{ path: '/doctor', element: <DoctorDashboard /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['receptionist']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [{ path: '/receptionist', element: <ReceptionistDashboard /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/patient', element: <PatientDashboard /> },
          { path: '/patients', element: <Patients /> },
          { path: '/appointments', element: <Appointments /> },
          { path: '/prescriptions', element: <Prescriptions /> },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <NotFound /> },
])

function AppRoutes() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default AppRoutes
