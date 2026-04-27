import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import BottomNav from '../../components/BottomNav'
import { obtenerUsuario, obtenerUltimaMedicion } from '../../firebase/firestore'

/* ── Icons ── */
const IconWaves = () => (
  <svg viewBox="0 0 24 24">
    <path d="M2 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
    <path d="M2 17c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
  </svg>
)
const IconBell = () => (
  <svg viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
const IconClock = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const TABS = [
  { id: 'alberca',   label: 'Alberca',   icon: <IconWaves /> },
  { id: 'notif',     label: 'Alertas',   icon: <IconBell /> },
  { id: 'historial', label: 'Historial', icon: <IconClock /> },
]

/* Rangos óptimos para color coding */
function colorMetrica(key, val) {
  const v = parseFloat(val)
  if (isNaN(v)) return 'var(--muted)'
  if (key === 'ph')    return v >= 7.2 && v <= 7.6 ? 'var(--green)' : v >= 7.0 && v <= 7.8 ? 'var(--amber)' : 'var(--red)'
  if (key === 'cloro') return v >= 1.0 && v <= 3.0 ? 'var(--green)' : v >= 0.5 && v <= 5.0 ? 'var(--amber)' : 'var(--red)'
  if (key === 'tds')   return v < 400 ? 'var(--green)' : v <= 600 ? 'var(--amber)' : 'var(--red)'
  return 'var(--accent)'
}

function estadoGeneral(medicion) {
  if (!medicion) return null
  const { ph, cloro, tds } = medicion
  if (
    colorMetrica('ph', ph) === 'var(--red)' ||
    colorMetrica('cloro', cloro) === 'var(--red)'
  ) return { label: '⚠ Atención', cls: 'badge-red' }
  if (
    colorMetrica('ph', ph) === 'var(--amber)' ||
    colorMetrica('cloro', cloro) === 'var(--amber)' ||
    colorMetrica('tds', tds) === 'var(--amber)'
  ) return { label: '● Revisar', cls: 'badge-amber' }
  return { label: '● Óptimo', cls: 'badge-green' }
}

function fmtTimestamp(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function ClienteDashboard() {
  const [tab, setTab]           = useState('alberca')
  const [userData, setUserData] = useState(null)
  const [medicion, setMedicion] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const { user, logout }        = useAuth()

  useEffect(() => {
    if (!user?.uid) return

    async function cargar() {
      try {
        // 1. Leer documento del usuario para obtener albercaId
        const datos = await obtenerUsuario(user.uid)
        setUserData(datos)

        // 2. Si tiene alberca asignada, cargar última medición
        if (datos?.albercaId) {
          const ultima = await obtenerUltimaMedicion(datos.albercaId)
          setMedicion(ultima)
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [user?.uid])

  const initials = (userData?.nombre ?? user?.email ?? 'CL').slice(0, 2).toUpperCase()
  const estado   = estadoGeneral(medicion)

  const METRICAS = [
    { key: 'ph',    label: 'pH',          value: medicion?.ph,          unit: ''    },
    { key: 'cloro', label: 'Cloro libre', value: medicion?.cloro,       unit: 'ppm' },
    { key: 'temp',  label: 'Temperatura', value: medicion?.temperatura,  unit: '°C'  },
    { key: 'tds',   label: 'TDS',         value: medicion?.tds,          unit: 'ppm' },
  ]

  return (
    <div className="screen">
      <header className="top-bar">
        <div>
          <div className="top-bar-title">Mi Alberca</div>
          <div className="top-bar-sub">{userData?.nombre ?? user?.email}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar">{initials}</div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Salir</button>
        </div>
      </header>

      <div className="page-content">

        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 13 }}>
            Cargando datos...
          </div>
        )}

        {error && (
          <div className="login-error">{error}</div>
        )}

        {/* ── ALBERCA ── */}
        {!loading && tab === 'alberca' && (
          <>
            {!userData?.albercaId ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🏊</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Sin alberca asignada</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Contacta a tu supervisor para que vincule tu cuenta.
                </div>
              </div>
            ) : (
              <>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span className="card-title" style={{ marginBottom: 0 }}>Estado actual</span>
                    {estado && <span className={`badge ${estado.cls}`}>{estado.label}</span>}
                  </div>

                  {!medicion ? (
                    <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '16px 0', fontSize: 13 }}>
                      Sin mediciones registradas aún.
                    </div>
                  ) : (
                    <>
                      <div className="metric-grid">
                        {METRICAS.map((m) => (
                          <div key={m.key} className="metric-card">
                            <div className="metric-value" style={{ color: colorMetrica(m.key, m.value) }}>
                              {m.value ?? '—'}
                              <span className="metric-unit">{m.unit}</span>
                            </div>
                            <div className="metric-label">{m.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
                        Última medición: {fmtTimestamp(medicion.timestamp)}
                      </div>
                    </>
                  )}
                </div>

                <div className="section-title" style={{ marginTop: 8 }}>Mi alberca</div>
                <div className="card" style={{ marginBottom: 0 }}>
                  {[
                    ['ID alberca', userData.albercaId],
                    ['Tipo',       userData.tipoAlberca  ?? 'Residencial'],
                    ['Sistema',    userData.sistemaAgua  ?? '—'],
                    ['Contrato',   userData.contrato     ?? '—'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── NOTIF ── */}
        {!loading && tab === 'notif' && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
            <div style={{ fontSize: 13 }}>Las notificaciones se mostrarán aquí.</div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {!loading && tab === 'historial' && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 13 }}>El historial de servicios aparecerá aquí.</div>
          </div>
        )}

      </div>

      <BottomNav tabs={TABS} active={tab} onSelect={setTab} />
    </div>
  )
}
