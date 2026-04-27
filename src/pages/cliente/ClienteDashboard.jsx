import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import BottomNav from '../../components/BottomNav'

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

const METRICS = [
  { key: 'ph',    label: 'pH',          value: '7.4',  unit: '',    color: 'var(--green)' },
  { key: 'cloro', label: 'Cloro libre', value: '1.8',  unit: 'ppm', color: 'var(--green)' },
  { key: 'temp',  label: 'Temperatura', value: '27',   unit: '°C',  color: 'var(--accent)' },
  { key: 'tds',   label: 'TDS',         value: '420',  unit: 'ppm', color: 'var(--amber)' },
]

const NOTIFS = [
  { id: 1, tipo: 'green', msg: 'Servicio completado hoy a las 10:30 am',     time: 'Hace 2 h' },
  { id: 2, tipo: 'amber', msg: 'Nivel de TDS ligeramente elevado (420 ppm)', time: 'Hace 1 d' },
  { id: 3, tipo: 'blue',  msg: 'Próximo servicio: Jue 30 Abr · 10:00 am',   time: 'Hace 2 d' },
  { id: 4, tipo: 'green', msg: 'Balance de agua normalizado',                 time: 'Hace 3 d' },
]

const HISTORIAL = [
  { id: 1, fecha: '23 Abr 2026', tecnico: 'Carlos V.',  notas: 'Limpieza general + balance de agua', status: 'green' },
  { id: 2, fecha: '16 Abr 2026', tecnico: 'Carlos V.',  notas: 'Tratamiento preventivo de algas',    status: 'amber' },
  { id: 3, fecha: '09 Abr 2026', tecnico: 'Martín R.',  notas: 'Servicio de rutina completo',        status: 'green' },
  { id: 4, fecha: '02 Abr 2026', tecnico: 'Carlos V.',  notas: 'Revisión de bomba y filtros',        status: 'green' },
]

export default function ClienteDashboard() {
  const [tab, setTab] = useState('alberca')
  const { user, logout } = useAuth()
  const initials = (user?.email ?? 'CL').slice(0, 2).toUpperCase()

  return (
    <div className="screen">
      {/* Top bar */}
      <header className="top-bar">
        <div>
          <div className="top-bar-title">Mi Alberca</div>
          <div className="top-bar-sub">{user?.email}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar">{initials}</div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Salir</button>
        </div>
      </header>

      <div className="page-content">

        {/* ── ALBERCA ── */}
        {tab === 'alberca' && (
          <>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span className="card-title" style={{ marginBottom: 0 }}>Estado actual</span>
                <span className="badge badge-green">● Óptimo</span>
              </div>
              <div className="metric-grid">
                {METRICS.map((m) => (
                  <div key={m.key} className="metric-card">
                    <div className="metric-value" style={{ color: m.color }}>
                      {m.value}
                      <span className="metric-unit">{m.unit}</span>
                    </div>
                    <div className="metric-label">{m.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
                Última medición: hoy 10:30 am
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 8 }}>Próximo servicio</div>
            <div className="list-item">
              <div className="list-item-left">
                <div>
                  <div className="list-item-title">Jueves 30 Abr · 10:00 am</div>
                  <div className="list-item-sub">Técnico asignado: Carlos V.</div>
                </div>
              </div>
              <span className="badge badge-blue">Programado</span>
            </div>

            <div className="section-title" style={{ marginTop: 8 }}>Mi alberca</div>
            <div className="card" style={{ marginBottom: 0 }}>
              {[
                ['Tipo', 'Residencial exterior'],
                ['Volumen', '85,000 L'],
                ['Sistema', 'Sal electrolítica'],
                ['Contrato', 'Mantenimiento mensual'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── NOTIF ── */}
        {tab === 'notif' && (
          <>
            <div className="section-title">Notificaciones recientes</div>
            {NOTIFS.map((n) => (
              <div key={n.id} className="list-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-item-title" style={{ fontSize: 13 }}>{n.msg}</div>
                  <div className="list-item-sub">{n.time}</div>
                </div>
                <span className={`badge badge-${n.tipo}`}>
                  {n.tipo === 'green' ? 'OK' : n.tipo === 'amber' ? 'Aviso' : 'Info'}
                </span>
              </div>
            ))}
          </>
        )}

        {/* ── HISTORIAL ── */}
        {tab === 'historial' && (
          <>
            <div className="section-title">Servicios anteriores</div>
            {HISTORIAL.map((h) => (
              <div key={h.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14 }}>{h.fecha}</div>
                  <span className={`badge badge-${h.status}`}>
                    {h.status === 'green' ? 'Completado' : 'Con observación'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Técnico: {h.tecnico}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{h.notas}</div>
              </div>
            ))}
          </>
        )}

      </div>

      <BottomNav tabs={TABS} active={tab} onSelect={setTab} />
    </div>
  )
}
