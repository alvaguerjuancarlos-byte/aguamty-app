import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  {
    id: 'cliente',
    label: 'Cliente',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'tecnico',
    label: 'Técnico',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'supervisor',
    label: 'Supervisor',
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
]

export default function LoginPage() {
  const [rolHint, setRolHint] = useState('cliente')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { rol } = await login(email, password)
      navigate(`/${rol}`)
    } catch {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-logo">
        <h1>AquaMTY</h1>
        <p>Gestión profesional de albercas</p>
      </div>

      <div className="section-title">Selecciona tu rol</div>
      <div className="role-selector">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`role-btn ${rolHint === r.id ? 'active' : ''}`}
            onClick={() => setRolHint(r.id)}
          >
            {r.icon}
            {r.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="login-error">{error}</div>}

        <div className="input-group">
          <label className="input-label">Correo electrónico</label>
          <input
            type="email"
            className="input"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="input-group" style={{ marginBottom: 20 }}>
          <label className="input-label">Contraseña</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn btn-accent" disabled={loading}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}
