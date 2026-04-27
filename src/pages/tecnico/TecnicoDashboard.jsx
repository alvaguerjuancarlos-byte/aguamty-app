import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import BottomNav from '../../components/BottomNav'
import { obtenerRuta, actualizarPaso, actualizarEstadoServicio } from '../../firebase/firestore'

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
  { id: 'ruta',      label: 'Mi Ruta',   icon: <IconMap /> },
  { id: 'activo',    label: 'Activo',    icon: <IconWrench /> },
  { id: 'checklist', label: 'Checklist', icon: <IconClipboard /> },
]

const STATUS_BADGE = {
  completado: <span className="badge badge-green">Completado</span>,
  activo:     <span className="badge badge-blue">● Activo</span>,
  pendiente:  <span className="badge badge-muted">Pendiente</span>,
}

const PASOS_LABELS = {
  llegada:   'Llegada y evaluación visual',
  skimmer:   'Limpieza de skimmer y canasta',
  aspirado:  'Aspirado de fondo',
  cepillado: 'Cepillado de paredes y escaleras',
  quimicos:  'Ajuste de químicos (pH / cloro)',
  filtro:    'Revisión de filtro y presión',
  bomba:     'Revisión de bomba',
  medicion:  'Registro de mediciones finales',
}
const PASOS_ORDER = Object.keys(PASOS_LABELS)

function pasosDefault() {
  return PASOS_ORDER.map((id) => ({ id, label: PASOS_LABELS[id], done: false }))
}

function pasosDesdeFirestore(pasosObj) {
  return PASOS_ORDER.map((id) => ({
    id,
    label: PASOS_LABELS[id],
    done: pasosObj?.[id] ?? false,
  }))
}

function fechaHoy() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TecnicoDashboard() {
  const [tab, setTab]       = useState('ruta')
  const [ruta, setRuta]     = useState([])
  const [pasos, setPasos]   = useState(pasosDefault)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const { user, logout }    = useAuth()

  const hoy     = fechaHoy()
  const activo  = ruta.find((r) => r.status === 'activo') ?? ruta.find((r) => r.status === 'pendiente') ?? null
  const completados = pasos.filter((p) => p.done).length
  const progreso    = pasos.length > 0 ? Math.round((completados / pasos.length) * 100) : 0
  const initials    = (user?.email ?? 'TC').slice(0, 2).toUpperCase()

  /* Carga ruta del día */
  useEffect(() => {
    if (!user?.uid) return
    obtenerRuta(user.uid, hoy)
      .then((servicios) => {
        setRuta(servicios)
        const svcActivo = servicios.find((s) => s.status === 'activo') ?? servicios.find((s) => s.status === 'pendiente')
        if (svcActivo?.pasos) {
          setPasos(pasosDesdeFirestore(svcActivo.pasos))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.uid, hoy])

  /* Actualiza Firestore + estado local al marcar un paso */
  async function togglePaso(id) {
    if (!activo || guardando) return
    const nuevoDone = !pasos.find((p) => p.id === id).done
    setPasos((prev) => prev.map((p) => (p.id === id ? { ...p, done: nuevoDone } : p)))
    setGuardando(true)
    try {
      await actualizarPaso(activo.id, id, nuevoDone)
    } catch (e) {
      // Revertir en caso de error
      setPasos((prev) => prev.map((p) => (p.id === id ? { ...p, done: !nuevoDone } : p)))
      console.error(e)
    } finally {
      setGuardando(false)
    }
  }

  /* Finaliza el servicio activo */
  async function finalizarServicio() {
    if (!activo) return
    await actualizarEstadoServicio(activo.id, 'completado')
    setRuta((prev) => prev.map((s) => (s.id === activo.id ? { ...s, status: 'completado' } : s)))
  }

  const completadosRuta = ruta.filter((r) => r.status === 'completado').length

  return (
    <div className="screen">
      <header className="top-bar">
        <div>
          <div className="top-bar-title">Técnico</div>
          <div className="top-bar-sub">
            {loading ? 'Cargando...' : `${hoy} · ${ruta.length} servicios`}
          </div>
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
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 13 }}>
                Cargando ruta...
              </div>
            ) : ruta.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🗺️</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Sin servicios para hoy</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Tu supervisor aún no ha asignado servicios para {hoy}.
                </div>
              </div>
            ) : (
              <>
                <div className="card" style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span className="card-title" style={{ marginBottom: 0 }}>Progreso del día</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>
                      {completadosRuta}/{ruta.length}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${ruta.length > 0 ? (completadosRuta / ruta.length) * 100 : 0}%`,
                      background: 'var(--green)',
                    }} />
                  </div>
                </div>

                <div className="section-title">Servicios asignados</div>
                {ruta.map((r) => (
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
                        {r.orden ?? '—'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="list-item-title">{r.nombre}</div>
                        <div className="list-item-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.direccion}
                        </div>
                        {r.hora && (
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>📍 {r.hora}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>{STATUS_BADGE[r.status] ?? STATUS_BADGE.pendiente}</div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ── ACTIVO ── */}
        {tab === 'activo' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 13 }}>Cargando...</div>
            ) : !activo ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  {ruta.length === 0 ? 'Sin servicios asignados' : 'Todos los servicios completados'}
                </div>
              </div>
            ) : (
              <>
                <div className="card" style={{ marginBottom: 14 }}>
                  <span className="badge badge-blue" style={{ marginBottom: 10, display: 'inline-flex' }}>● Servicio activo</span>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18 }}>{activo.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{activo.direccion}</div>
                  <div className="divider" />
                  {[
                    ['Hora',    activo.hora ?? '—'],
                    ['Tipo',    activo.tipo ?? 'Mantenimiento rutina'],
                    ['Contacto', activo.contacto ?? '—'],
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
                    onClick={finalizarServicio}
                  >
                    {completados < pasos.length ? `Faltan ${pasos.length - completados}` : 'Finalizar servicio'}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── CHECKLIST ── */}
        {tab === 'checklist' && (
          <>
            {!activo ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Sin servicio activo.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div className="section-title" style={{ marginBottom: 0 }}>
                    {activo.nombre}
                  </div>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>
                    {completados}/{pasos.length}
                    {guardando && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>guardando…</span>}
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
          </>
        )}

      </div>

      <BottomNav tabs={TABS} active={tab} onSelect={setTab} />
    </div>
  )
}
