import { useState, useEffect, useCallback } from 'react'
import {
  obtenerClientes, obtenerTecnicosAdmin, obtenerAlbercas,
  crearCliente, crearTecnico, crearServicioAdmin, crearAlbercaDoc,
  actualizarUsuario, desactivarUsuario, actualizarAlberca,
} from '../../firebase/adminFirestore'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fechaHoy() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SECCIONES = [
  { id: 'clientes',  label: 'Clientes'  },
  { id: 'tecnicos',  label: 'Técnicos'  },
  { id: 'servicios', label: 'Servicios' },
  { id: 'albercas',  label: 'Albercas'  },
]

const DEFAULT_FORMS = {
  cliente:  { nombre: '', email: '', telefono: '', direccion: '', password: 'aquamty2026' },
  tecnico:  { nombre: '', email: '', telefono: '', zona: '', password: 'aquamty2026' },
  servicio: { tecnicoId: '', clienteId: '', fecha: fechaHoy(), hora: '09:00', orden: '1', tipo: 'Mantenimiento rutina mensual' },
  alberca:  { clienteId: '', tamano: '', tipo: 'cemento', filtracion: '', direccion: '' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      {children}
    </div>
  )
}

function Inp({ value, onChange, type = 'text', placeholder, required }) {
  return (
    <input
      type={type}
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
    />
  )
}

function Sel({ value, onChange, children }) {
  return (
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </select>
  )
}

function UserCard({ item, rolLabel, onEditar, onDesactivar }) {
  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
          <div className="avatar" style={{ flexShrink: 0 }}>
            {(item.nombre ?? item.email).slice(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{item.nombre}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{item.email}</div>
            {item.telefono && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.telefono}</div>}
            {item.zona      && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>Zona: {item.zona}</div>}
            {item.albercaId && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Alberca: {item.albercaId}</div>}
          </div>
        </div>
        <span className={`badge ${item.activo === false ? 'badge-red' : 'badge-green'}`} style={{ flexShrink: 0 }}>
          {item.activo === false ? 'Inactivo' : 'Activo'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => onEditar(item)}>
          Editar
        </button>
        <button
          className="btn btn-red btn-sm"
          style={{ flex: 1 }}
          onClick={() => onDesactivar(item.id)}
          disabled={item.activo === false}
        >
          Desactivar
        </button>
      </div>
    </div>
  )
}

// ── Modal overlay ─────────────────────────────────────────────────────────────

function Modal({ titulo, onClose, onGuardar, saving, error, children }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.75)',
        zIndex: 200,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)',
        borderRadius: '16px 16px 0 0',
        padding: '24px 20px 32px',
        width: '100%',
        maxWidth: 480,
        maxHeight: '88vh',
        overflowY: 'auto',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18 }}>{titulo}</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', padding: 4 }}
          >
            ✕
          </button>
        </div>

        {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

        {children}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn-accent" style={{ flex: 1 }} onClick={onGuardar} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [seccion, setSeccion]   = useState('clientes')
  const [clientes, setClientes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [albercas, setAlbercas] = useState([])
  const [loading, setLoading]   = useState(false)

  const [modal, setModal]       = useState(null)   // { tipo, editando }
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)
  const [formError, setFormError] = useState('')

  // ── Carga datos por sección ─────────────────────────────────────────────────
  const cargar = useCallback(async (sec) => {
    setLoading(true)
    try {
      if (sec === 'clientes')  setClientes(await obtenerClientes())
      if (sec === 'tecnicos')  setTecnicos(await obtenerTecnicosAdmin())
      if (sec === 'albercas')  setAlbercas(await obtenerAlbercas())
      if (sec === 'servicios') {
        const [c, t] = await Promise.all([obtenerClientes(), obtenerTecnicosAdmin()])
        setClientes(c)
        setTecnicos(t)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar(seccion) }, [seccion, cargar])

  // ── Modal helpers ───────────────────────────────────────────────────────────
  function abrirModal(tipo, editando = null) {
    setFormError('')
    setModal({ tipo, editando })
    setForm(editando ? { ...editando } : { ...DEFAULT_FORMS[tipo] })
  }

  function set(field) {
    return (val) => setForm((f) => ({ ...f, [field]: val }))
  }

  // ── Guardar ─────────────────────────────────────────────────────────────────
  async function guardar() {
    setSaving(true)
    setFormError('')
    try {
      const { tipo, editando } = modal

      if (tipo === 'cliente') {
        if (editando) {
          await actualizarUsuario(editando.id, {
            nombre: form.nombre, telefono: form.telefono, direccion: form.direccion,
          })
          setClientes(await obtenerClientes())
        } else {
          await crearCliente(form)
          setClientes(await obtenerClientes())
        }
      }

      if (tipo === 'tecnico') {
        if (editando) {
          await actualizarUsuario(editando.id, {
            nombre: form.nombre, telefono: form.telefono, zona: form.zona,
          })
          setTecnicos(await obtenerTecnicosAdmin())
        } else {
          await crearTecnico(form)
          setTecnicos(await obtenerTecnicosAdmin())
        }
      }

      if (tipo === 'servicio') {
        const cliente = clientes.find((c) => c.id === form.clienteId)
        const tecnico = tecnicos.find((t) => t.id === form.tecnicoId)
        await crearServicioAdmin({
          tecnicoId:     form.tecnicoId,
          tecnicoNombre: tecnico?.nombre ?? '',
          clienteId:     form.clienteId,
          clienteNombre: cliente?.nombre ?? '',
          albercaId:     cliente?.albercaId ?? '',
          direccion:     albercas.find((a) => a.id === cliente?.albercaId)?.direccion ?? '',
          fecha:         form.fecha,
          hora:          form.hora,
          orden:         form.orden,
          tipo:          form.tipo,
        })
      }

      if (tipo === 'alberca') {
        if (editando) {
          await actualizarAlberca(editando.id, {
            tamano: form.tamano, tipo: form.tipo,
            filtracion: form.filtracion, direccion: form.direccion,
          })
        } else {
          await crearAlbercaDoc(form)
        }
        setAlbercas(await obtenerAlbercas())
      }

      setModal(null)
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDesactivar(uid) {
    if (!window.confirm('¿Desactivar este usuario?')) return
    await desactivarUsuario(uid)
    if (seccion === 'clientes') setClientes(await obtenerClientes())
    if (seccion === 'tecnicos') setTecnicos(await obtenerTecnicosAdmin())
  }

  // ── Render form by type ─────────────────────────────────────────────────────
  function renderForm() {
    const { tipo } = modal

    if (tipo === 'cliente') return (
      <>
        <Field label="Nombre completo"><Inp value={form.nombre}    onChange={set('nombre')}    placeholder="Fam. García" required /></Field>
        <Field label="Correo electrónico"><Inp value={form.email}  onChange={set('email')}     type="email" placeholder="cliente@email.com" required /></Field>
        <Field label="Teléfono"><Inp value={form.telefono}         onChange={set('telefono')}  type="tel"  placeholder="81 0000 0000" /></Field>
        <Field label="Dirección de alberca"><Inp value={form.direccion} onChange={set('direccion')} placeholder="Calle, Col., Ciudad" /></Field>
        {!modal.editando && <Field label="Contraseña inicial"><Inp value={form.password} onChange={set('password')} type="password" /></Field>}
      </>
    )

    if (tipo === 'tecnico') return (
      <>
        <Field label="Nombre completo"><Inp value={form.nombre}    onChange={set('nombre')}   placeholder="Juan Pérez" required /></Field>
        <Field label="Correo electrónico"><Inp value={form.email}  onChange={set('email')}    type="email" placeholder="tecnico@email.com" required /></Field>
        <Field label="Teléfono"><Inp value={form.telefono}         onChange={set('telefono')} type="tel"  placeholder="81 0000 0000" /></Field>
        <Field label="Zona asignada"><Inp value={form.zona}        onChange={set('zona')}     placeholder="Ej: Cumbres Norte" /></Field>
        {!modal.editando && <Field label="Contraseña inicial"><Inp value={form.password} onChange={set('password')} type="password" /></Field>}
      </>
    )

    if (tipo === 'servicio') return (
      <>
        <Field label="Técnico">
          <Sel value={form.tecnicoId} onChange={set('tecnicoId')}>
            <option value="">— Selecciona técnico —</option>
            {tecnicos.filter((t) => t.activo !== false).map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </Sel>
        </Field>
        <Field label="Cliente">
          <Sel value={form.clienteId} onChange={set('clienteId')}>
            <option value="">— Selecciona cliente —</option>
            {clientes.filter((c) => c.activo !== false).map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Sel>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Fecha"><Inp value={form.fecha} onChange={set('fecha')} type="date" /></Field>
          <Field label="Hora"><Inp value={form.hora}   onChange={set('hora')}  type="time" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Orden"><Inp value={form.orden} onChange={set('orden')} type="number" placeholder="1" /></Field>
          <Field label="Tipo">
            <Sel value={form.tipo} onChange={set('tipo')}>
              <option>Mantenimiento rutina mensual</option>
              <option>Limpieza profunda</option>
              <option>Reparación</option>
              <option>Visita de emergencia</option>
            </Sel>
          </Field>
        </div>
      </>
    )

    if (tipo === 'alberca') return (
      <>
        <Field label="Cliente">
          <Sel value={form.clienteId} onChange={set('clienteId')}>
            <option value="">— Selecciona cliente —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Sel>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Tamaño (m³)"><Inp value={form.tamano} onChange={set('tamano')} type="number" placeholder="85" /></Field>
          <Field label="Tipo">
            <Sel value={form.tipo} onChange={set('tipo')}>
              <option value="cemento">Cemento</option>
              <option value="fibra">Fibra de vidrio</option>
              <option value="vinil">Vinil</option>
            </Sel>
          </Field>
        </div>
        <Field label="Sistema de filtración"><Inp value={form.filtracion} onChange={set('filtracion')} placeholder="Arena / Cartucho / Diatomea" /></Field>
        <Field label="Dirección"><Inp value={form.direccion} onChange={set('direccion')} placeholder="Calle, Col., Ciudad" /></Field>
      </>
    )
  }

  const TITULOS = {
    cliente:  modal?.editando ? 'Editar Cliente'  : 'Nuevo Cliente',
    tecnico:  modal?.editando ? 'Editar Técnico'  : 'Nuevo Técnico',
    servicio: 'Asignar Servicio',
    alberca:  modal?.editando ? 'Editar Alberca'  : 'Nueva Alberca',
  }

  const SINGULAR = { clientes: 'cliente', tecnicos: 'tecnico', servicios: 'servicio', albercas: 'alberca' }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 8 }}>

      {/* Sub-nav pills */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
        marginBottom: 16, scrollbarWidth: 'none',
      }}>
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            style={{
              flexShrink: 0,
              padding: '7px 16px',
              borderRadius: 20,
              border: `1px solid ${seccion === s.id ? 'var(--accent)' : 'var(--border)'}`,
              background: seccion === s.id ? 'rgba(0,200,255,.1)' : 'var(--surface2)',
              color: seccion === s.id ? 'var(--accent)' : 'var(--muted)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all .2s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Header + "Nuevo" button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          {SECCIONES.find((s) => s.id === seccion)?.label}
        </div>
        <button
          className="btn btn-accent btn-sm"
          onClick={() => abrirModal(SINGULAR[seccion])}
        >
          + Nuevo
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: 13 }}>
          Cargando...
        </div>
      )}

      {/* ── CLIENTES ── */}
      {!loading && seccion === 'clientes' && (
        clientes.length === 0 ? (
          <EmptyState icon="👤" msg="No hay clientes registrados." />
        ) : (
          clientes.map((c) => (
            <UserCard key={c.id} item={c} rolLabel="Cliente"
              onEditar={(item) => abrirModal('cliente', item)}
              onDesactivar={handleDesactivar}
            />
          ))
        )
      )}

      {/* ── TÉCNICOS ── */}
      {!loading && seccion === 'tecnicos' && (
        tecnicos.length === 0 ? (
          <EmptyState icon="🔧" msg="No hay técnicos registrados." />
        ) : (
          tecnicos.map((t) => (
            <UserCard key={t.id} item={t} rolLabel="Técnico"
              onEditar={(item) => abrirModal('tecnico', item)}
              onDesactivar={handleDesactivar}
            />
          ))
        )
      )}

      {/* ── SERVICIOS ── */}
      {!loading && seccion === 'servicios' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
            Asigna servicios a técnicos. Aparecerán en su ruta del día seleccionado.
          </div>
          {tecnicos.length === 0 || clientes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontSize: 13 }}>
              Necesitas al menos 1 técnico y 1 cliente para asignar servicios.
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{tecnicos.length} técnicos · {clientes.length} clientes</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Usa el botón "+ Nuevo" para asignar un servicio.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ALBERCAS ── */}
      {!loading && seccion === 'albercas' && (
        albercas.length === 0 ? (
          <EmptyState icon="🏊" msg="No hay albercas registradas." />
        ) : (
          albercas.map((a) => (
            <div key={a.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.nombre ?? a.id}</div>
                  {a.direccion && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{a.direccion}</div>}
                </div>
                <span className={`badge ${a.activa === false ? 'badge-red' : 'badge-green'}`}>
                  {a.activa === false ? 'Inactiva' : 'Activa'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {a.tamano    && <Chip label="Tamaño"   val={`${a.tamano} m³`} />}
                {a.tipo      && <Chip label="Tipo"     val={a.tipo} />}
                {a.filtracion && <Chip label="Filtro"  val={a.filtracion} />}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 12, width: '100%' }}
                onClick={() => abrirModal('alberca', a)}
              >
                Editar
              </button>
            </div>
          ))
        )
      )}

      {/* Modal */}
      {modal && (
        <Modal
          titulo={TITULOS[modal.tipo]}
          onClose={() => setModal(null)}
          onGuardar={guardar}
          saving={saving}
          error={formError}
        >
          {renderForm()}
        </Modal>
      )}
    </div>
  )
}

function EmptyState({ icon, msg }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{msg}</div>
    </div>
  )
}

function Chip({ label, val }) {
  return (
    <div style={{ fontSize: 11 }}>
      <span style={{ color: 'var(--muted)' }}>{label}: </span>
      <span style={{ fontWeight: 500 }}>{val}</span>
    </div>
  )
}
