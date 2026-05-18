export const dashboardPathByRole = {
  admin: '/admin',
  doctor: '/doctor',
  receptionist: '/receptionist',
  patient: '/patient',
}

export const getDashboardPath = (role) => dashboardPathByRole[role] || '/login'
