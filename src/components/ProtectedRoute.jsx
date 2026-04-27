import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, rol }) {
  const { user, rol: userRol, loading } = useAuth()

  if (loading) return <div className="loading-screen">Cargando...</div>
  if (!user)   return <Navigate to="/" replace />
  if (rol && userRol !== rol) return <Navigate to={`/${userRol}`} replace />

  return children
}
