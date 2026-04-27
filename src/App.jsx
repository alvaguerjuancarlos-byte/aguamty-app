import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import ClienteDashboard from './pages/cliente/ClienteDashboard'
import TecnicoDashboard from './pages/tecnico/TecnicoDashboard'
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard'

function RootRedirect() {
  const { user, rol } = useAuth()
  if (user && rol) return <Navigate to={`/${rol}`} replace />
  return <LoginPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/cliente"
          element={
            <ProtectedRoute rol="cliente">
              <ClienteDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tecnico"
          element={
            <ProtectedRoute rol="tecnico">
              <TecnicoDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute rol="supervisor">
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
