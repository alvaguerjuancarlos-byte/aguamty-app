import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import BottomNav from '../../components/BottomNav'
import { suscribirServiciosHoy, obtenerTecnicos } from '../../firebase/firestore'

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

function fechaHoy() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* Agrupa servicios por técnico y calcula métricas */
function agruparPorTecnico(servicios, tecnicosMap) {
  const grupos = {}

  servicios.forEach((s) => {
    const id = s.tecnicoId ?? 'sin_asignar'
    if (!grupos[id]) {
      grupos[id] = {
        id,
        nombre: tecnicosMap[id]?.nombre ?? s.tecnicoNombre ?? id,
        servicios: [],
      }
    }
    grupos[id].servicios.push(s)
  })

  return Object.values(grupos).map((g) => {
    const total       = g.servicios.length
    const completados = g.servicios.filter((s) => s.status === 'completado').length
    const eficiencia  = total > 0 ? Math.round((completados / total) * 100) : 0
    return { ...g, total, completados, eficiencia }
  })
}

export default function SupervisorDashboard() {
  const [tab, setTab]           = useState('resumen')
  const [servicios, setServicios] = useState([])
  const [tecnicosMap, setTecnicosMap] = useState({})
  const [loading, setLoading]   = useState(true)
  const { user, logout }        = useAuth()

  const hoy      = fechaHoy()
  const initials = (user?.email ?? 'SV').slice(0, 2).toUpperCase()

  /* Carga técnicos una sola vez */
  useEffect(() => {
    obtenerTecnicos()
      .then((lista) => {
        const mapa = {}
        lista.forEach((t) => { mapa[t.id] = t })
        setTecnicosMap(mapa)
      })
      .catch(console.error)
  }, [])

  /* Suscripción en tiempo real a servicios del día */
  useEffect(() => {
    const unsub = suscribirServiciosHoy(hoy, (data) => {
      setServicios(data)
      setLoading(false)
    })
    return unsub
  }, [hoy])

  /* Estadísticas derivadas */
  const total       = servicios.length
  const completados = servicios.filter((s) => s.status === 'completado').length
  const pendientes  = total - completados
  const eficiencia  = total > 0 ? Math.round((completados / total) * 100) : 0
  const tecnicoList = agruparPorTecnico(servicios, tecnicosMap)

  const STATS = [
    { label: 'Servicios hoy',  value: total,            color: 'var(--accent)', sub: `${Object.keys(tecnicosMap).length} técnicos` },
    { label: 'Completados',    value: completados,      color: 'var(--green)',  sub: `Meta: ${total}` },
    { label: 'Pendientes',     value: pendientes,       color: 'var(--amber)', sub: 'En progreso' },
    { label: 'Eficiencia',     value: `${eficiencia}%`, color: 'var(--accent)', sub: 'del día' },
  ]

  const EmptyState = ({ icon, msg }) => (
    <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{msg}</div>
    </div>
  )

  return (
    <div className="screen">
      <header className="top-bar">
        <div>
          <div className="top-bar-title">Panel General</div>
          <div className="top-bar-sub">
            {loading ? 'Cargando...' : `${hoy} · ${total} servicios · tiempo real`}
          </div>
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

            {total > 0 && (
              <>
                <div className="section-title" style={{ marginTop: 8 }}>Progreso global del día</div>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>{completados} de {total} servicios</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--green)' }}>
                      {eficiencia}%
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 8, borderRadius: 4 }}>
                    <div className="progress-fill" style={{ width: `${eficiencia}%`, background: 'var(--green)', borderRadius: 4 }} />
                  </div>
                </div>
              </>
            )}

            <div className="section-title">Estado por técnico</div>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 13 }}>Cargando...</div>
            ) : tecnicoList.length === 0 ? (
              <EmptyState icon="👷" msg="No hay servicios asignados hoy." />
            ) : (
              tecnicoList.map((t) => {
                const pct = t.eficiencia
                return (
                  <div key={t.id} className="card" style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar">{t.nombre.slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{t.nombre}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.completados}/{t.total} servicios</div>
                        </div>
                      </div>
                      <span className={`badge badge-${pct === 100 ? 'green' : pct >= 50 ? 'blue' : 'amber'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: pct === 100 ? 'var(--green)' : 'var(--accent)',
                      }} />
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}

        {/* ── RUTAS ── */}
        {tab === 'rutas' && (
          <>
            <div className="section-title">Servicios del día</div>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 13 }}>Cargando...</div>
            ) : servicios.length === 0 ? (
              <EmptyState icon="🗺️" msg="No hay servicios registrados para hoy." />
            ) : (
              servicios
                .slice()
                .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                .map((s) => {
                  const tecNombre = tecnicosMap[s.tecnicoId]?.nombre ?? s.tecnicoNombre ?? s.tecnicoId
                  return (
                    <div key={s.id} className="card" style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>{s.nombre}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.direccion}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Técnico: {tecNombre}</div>
                        </div>
                        <span className={`badge badge-${s.status === 'completado' ? 'green' : s.status === 'activo' ? 'blue' : 'muted'}`}>
                          {s.status === 'completado' ? 'Completado' : s.status === 'activo' ? '● Activo' : 'Pendiente'}
                        </span>
                      </div>
                      {s.hora && (
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>📍 {s.hora}</div>
                      )}
                    </div>
                  )
                })
            )}
          </>
        )}

        {/* ── EFICIENCIA ── */}
        {tab === 'eficiencia' && (
          <>
            <div className="section-title">Rendimiento por técnico</div>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 13 }}>Cargando...</div>
            ) : tecnicoList.length === 0 ? (
              <EmptyState icon="📊" msg="Sin datos de rendimiento para hoy." />
            ) : (
              tecnicoList.map((t) => (
                <div key={t.id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{t.nombre.slice(0, 2).toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{t.nombre}</span>
                    </div>
                    <span
                      className={`badge badge-${t.eficiencia === 100 ? 'green' : t.eficiencia >= 50 ? 'blue' : 'amber'}`}
                      style={{ fontFamily: 'var(--font-heading)', fontSize: 13 }}
                    >
                      {t.eficiencia}%
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Asignados',    val: t.total,       color: 'var(--text)' },
                      { label: 'Completados',  val: t.completados, color: 'var(--green)' },
                      { label: 'Pendientes',   val: t.total - t.completados, color: 'var(--amber)' },
                    ].map((item) => (
                      <div key={item.label} style={{
                        textAlign: 'center', background: 'var(--surface2)',
                        borderRadius: 8, padding: '10px 6px', border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: item.color }}>
                          {item.val}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="progress-bar" style={{ height: 6, borderRadius: 3 }}>
                    <div className="progress-fill" style={{
                      width: `${t.eficiencia}%`,
                      background: t.eficiencia === 100 ? 'var(--green)' : t.eficiencia >= 50 ? 'var(--accent)' : 'var(--amber)',
                      borderRadius: 3,
                    }} />
                  </div>
                </div>
              ))
            )}

            {tecnicoList.length > 0 && (
              <>
                <div className="section-title" style={{ marginTop: 8 }}>Promedio del equipo</div>
                <div className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 52, color: 'var(--accent)', lineHeight: 1 }}>
                    {eficiencia}%
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Eficiencia global · Hoy</div>
                  <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>
                    {completados} de {total} servicios completados
                  </div>
                </div>
              </>
            )}
          </>
        )}

      </div>

      <BottomNav tabs={TABS} active={tab} onSelect={setTab} />
    </div>
  )
}
