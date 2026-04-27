import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import BottomNav from '../../components/BottomNav'

/* ── Icons ── */
const IconChart = () => (
  <svg viewBox="0 0 24 24">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6"  y1="20" x2="6"  y2="14" />
  </svg>
)
const IconRoutes = () => (
  <svg viewBox="0 0 24 24">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
)
const IconStar = () => (
  <svg viewBox="0 0 24 24">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const TABS = [
  { id: 'resumen',    label: 'Resumen',    icon: <IconChart /> },
  { id: 'rutas',      label: 'Rutas',      icon: <IconRoutes /> },
  { id: 'eficiencia', label: 'Eficiencia', icon: <IconStar /> },
]

const TECNICOS = [
  {
    id: 1,
    nombre: 'Carlos V.',
    servicios: 4,
    completados: 3,
    pendientes: 1,
    eficiencia: 92,
    tiempoMedio: '48 min',
  },
  {
    id: 2,
    nombre: 'Martín R.',
    servicios: 3,
    completados: 3,
    pendientes: 0,
    eficiencia: 100,
    tiempoMedio: '41 min',
  },
  {
    id: 3,
    nombre: 'Diego F.',
    servicios: 5,
    completados: 2,
    pendientes: 3,
    eficiencia: 74,
    tiempoMedio: '55 min',
  },
]

const RUTAS = [
  { id: 1, tecnico: 'Carlos V.',  zona: 'Cumbres · San Agustín',   total: 4, done: 3, status: 'activo' },
  { id: 2, tecnico: 'Martín R.',  zona: 'Valle Oriente · San Pedro', total: 3, done: 3, status: 'completado' },
  { id: 3, tecnico: 'Diego F.',   zona: 'Contry · Mitras Norte',    total: 5, done: 2, status: 'activo' },
]

const STATS = [
  { label: 'Servicios hoy',  value: 12,   color: 'var(--accent)', sub: '3 técnicos activos' },
  { label: 'Completados',    value: 8,    color: 'var(--green)',  sub: 'Meta: 12' },
  { label: 'Pendientes',     value: 4,    color: 'var(--amber)', sub: 'En progreso' },
  { label: 'Eficiencia',     value: '88%', color: 'var(--accent)', sub: '↑ 4% vs ayer' },
]

export default function SupervisorDashboard() {
  const [tab, setTab] = useState('resumen')
  const { user, logout } = useAuth()
  const initials = (user?.email ?? 'SV').slice(0, 2).toUpperCase()

  return (
    <div className="screen">
      <header className="top-bar">
        <div>
          <div className="top-bar-title">Panel General</div>
          <div className="top-bar-sub">Dom 26 Abr 2026 · AquaMTY</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar">{initials}</div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Salir</button>
        </div>
      </header>

      <div className="page-content">

        {/* ── RESUMEN ── */}
        {tab === 'resumen' && (
          <>
            <div className="stat-grid">
              {STATS.map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="section-title" style={{ marginTop: 8 }}>Progreso global del día</div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>8 de 12 servicios</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--green)' }}>67%</span>
              </div>
              <div className="progress-bar" style={{ height: 8, borderRadius: 4 }}>
                <div className="progress-fill" style={{ width: '67%', background: 'var(--green)', borderRadius: 4 }} />
              </div>
            </div>

            <div className="section-title">Estado por técnico</div>
            {TECNICOS.map((t) => {
              const pct = Math.round((t.completados / t.servicios) * 100)
              return (
                <div key={t.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{t.nombre.slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{t.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.completados}/{t.servicios} servicios</div>
                      </div>
                    </div>
                    <span className={`badge badge-${pct === 100 ? 'green' : pct >= 75 ? 'blue' : 'amber'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)' }} />
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── RUTAS ── */}
        {tab === 'rutas' && (
          <>
            <div className="section-title">Rutas activas hoy</div>
            {RUTAS.map((r) => (
              <div key={r.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>{r.tecnico}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{r.zona}</div>
                  </div>
                  <span className={`badge badge-${r.status === 'completado' ? 'green' : 'blue'}`}>
                    {r.status === 'completado' ? 'Completado' : '● En ruta'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>{r.done} de {r.total} servicios</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    {Math.round((r.done / r.total) * 100)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(r.done / r.total) * 100}%`,
                      background: r.status === 'completado' ? 'var(--green)' : 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── EFICIENCIA ── */}
        {tab === 'eficiencia' && (
          <>
            <div className="section-title">Rendimiento por técnico</div>
            {TECNICOS.map((t) => (
              <div key={t.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar">{t.nombre.slice(0, 2).toUpperCase()}</div>
                    <span style={{ fontWeight: 600 }}>{t.nombre}</span>
                  </div>
                  <span
                    className={`badge badge-${t.eficiencia === 100 ? 'green' : t.eficiencia >= 85 ? 'blue' : 'amber'}`}
                    style={{ fontFamily: 'var(--font-heading)', fontSize: 13 }}
                  >
                    {t.eficiencia}%
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Asignados', val: t.servicios, color: 'var(--text)' },
                    { label: 'Completados', val: t.completados, color: 'var(--green)' },
                    { label: 'Tiempo medio', val: t.tiempoMedio, color: 'var(--accent)' },
                  ].map((item) => (
                    <div key={item.label} style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 8, padding: '10px 6px', border: '1px solid var(--border)' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: item.color }}>{item.val}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="progress-bar" style={{ height: 6, borderRadius: 3 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${t.eficiencia}%`,
                      background: t.eficiencia === 100 ? 'var(--green)' : t.eficiencia >= 85 ? 'var(--accent)' : 'var(--amber)',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="section-title" style={{ marginTop: 8 }}>Promedio del equipo</div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 48, color: 'var(--accent)', lineHeight: 1 }}>88%</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Eficiencia global · Hoy</div>
              <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>↑ 4% vs ayer</div>
            </div>
          </>
        )}

      </div>

      <BottomNav tabs={TABS} active={tab} onSelect={setTab} />
    </div>
  )
}
