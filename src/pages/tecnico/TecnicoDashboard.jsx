import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import BottomNav from '../../components/BottomNav'

/* ── Icons ── */
const IconMap = () => (
  <svg viewBox="0 0 24 24">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
)
const IconWrench = () => (
  <svg viewBox="0 0 24 24">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
)
const IconClipboard = () => (
  <svg viewBox="0 0 24 24">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
)

const TABS = [
  { id: 'ruta',      label: 'Mi Ruta',  icon: <IconMap /> },
  { id: 'activo',    label: 'Activo',   icon: <IconWrench /> },
  { id: 'checklist', label: 'Checklist', icon: <IconClipboard /> },
]

const RUTA = [
  { id: 1, orden: 1, nombre: 'Residencial Cumbres',  dir: 'Av. Constitución 450, Col. Cumbres', status: 'completado', hora: '08:30' },
  { id: 2, orden: 2, nombre: 'Club Privado Bosque',   dir: 'Blvd. Díaz Ordaz 1200, San Agustín', status: 'activo',     hora: '10:00' },
  { id: 3, orden: 3, nombre: 'Fracc. Valle Oriente',  dir: 'Cerrada Nogales 78, Valle Oriente',  status: 'pendiente',  hora: '12:30' },
  { id: 4, orden: 4, nombre: 'Residencial San Pedro', dir: 'Vía Láctea 33, San Pedro',           status: 'pendiente',  hora: '14:00' },
]

const ACTIVO = RUTA.find((r) => r.status === 'activo')

const PASOS_INIT = [
  { id: 'llegada',    label: 'Llegada y evaluación visual',     done: false },
  { id: 'skimmer',    label: 'Limpieza de skimmer y canasta',   done: false },
  { id: 'aspirado',   label: 'Aspirado de fondo',               done: false },
  { id: 'cepillado',  label: 'Cepillado de paredes y escaleras', done: false },
  { id: 'quimicos',   label: 'Ajuste de químicos (pH/cloro)',   done: false },
  { id: 'filtro',     label: 'Revisión de filtro y presión',    done: false },
  { id: 'bomba',      label: 'Revisión de bomba',               done: false },
  { id: 'medicion',   label: 'Registro de mediciones finales',  done: false },
]

const STATUS_BADGE = {
  completado: <span className="badge badge-green">Completado</span>,
  activo:     <span className="badge badge-blue">● Activo</span>,
  pendiente:  <span className="badge badge-muted">Pendiente</span>,
}

export default function TecnicoDashboard() {
  const [tab, setTab]     = useState('ruta')
  const [pasos, setPasos] = useState(PASOS_INIT)
  const { user, logout }  = useAuth()

  const completados = pasos.filter((p) => p.done).length
  const progreso    = Math.round((completados / pasos.length) * 100)
  const initials    = (user?.email ?? 'TC').slice(0, 2).toUpperCase()

  function togglePaso(id) {
    setPasos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p))
    )
  }

  return (
    <div className="screen">
      <header className="top-bar">
        <div>
          <div className="top-bar-title">Técnico</div>
          <div className="top-bar-sub">Dom 26 Abr · {RUTA.length} servicios hoy</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar">{initials}</div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Salir</button>
        </div>
      </header>

      <div className="page-content">

        {/* ── RUTA ── */}
        {tab === 'ruta' && (
          <>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="card-title" style={{ marginBottom: 0 }}>Progreso del día</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>
                  {RUTA.filter((r) => r.status === 'completado').length}/{RUTA.length}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(RUTA.filter((r) => r.status === 'completado').length / RUTA.length) * 100}%`, background: 'var(--green)' }} />
              </div>
            </div>

            <div className="section-title">Servicios asignados</div>
            {RUTA.map((r) => (
              <div key={r.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: r.status === 'activo' ? 'var(--accent)' : 'var(--surface)',
                    border: `1px solid ${r.status === 'activo' ? 'var(--accent)' : 'var(--border)'}`,
                    color: r.status === 'activo' ? '#080d1a' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2,
                  }}>
                    {r.orden}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="list-item-title">{r.nombre}</div>
                    <div className="list-item-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.dir}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>📍 {r.hora}</div>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>{STATUS_BADGE[r.status]}</div>
              </div>
            ))}
          </>
        )}

        {/* ── ACTIVO ── */}
        {tab === 'activo' && ACTIVO && (
          <>
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <span className="badge badge-blue" style={{ marginBottom: 8, display: 'inline-flex' }}>● Servicio activo</span>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18 }}>{ACTIVO.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{ACTIVO.dir}</div>
                </div>
              </div>
              <div className="divider" />
              {[
                ['Hora inicio', ACTIVO.hora],
                ['Tipo', 'Mantenimiento rutina mensual'],
                ['Contacto', 'Lic. Ramírez · 81 1234 5678'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="section-title">Progreso del servicio</div>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{completados} de {pasos.length} pasos</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--accent)' }}>{progreso}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progreso}%` }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setTab('checklist')} style={{ flex: 1 }}>
                Ver checklist
              </button>
              <button
                className="btn btn-green"
                style={{ flex: 1 }}
                disabled={completados < pasos.length}
              >
                {completados < pasos.length ? `Faltan ${pasos.length - completados}` : 'Finalizar servicio'}
              </button>
            </div>
          </>
        )}

        {/* ── CHECKLIST ── */}
        {tab === 'checklist' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Checklist — {ACTIVO?.nombre}</div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>
                {completados}/{pasos.length}
              </span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 16 }}>
              <div className="progress-fill" style={{ width: `${progreso}%` }} />
            </div>

            {pasos.map((p) => (
              <div
                key={p.id}
                className={`check-row ${p.done ? 'done' : ''}`}
                onClick={() => togglePaso(p.id)}
              >
                <div className={`check-box ${p.done ? 'checked' : ''}`}>
                  {p.done && (
                    <svg viewBox="0 0 12 12" width="12" height="12" stroke="#080d1a" strokeWidth="2" fill="none">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 14, fontWeight: p.done ? 400 : 500 }}>{p.label}</span>
              </div>
            ))}
          </>
        )}

      </div>

      <BottomNav tabs={TABS} active={tab} onSelect={setTab} />
    </div>
  )
}
