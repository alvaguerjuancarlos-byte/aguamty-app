/**
 * Operaciones de administración para el supervisor.
 * Usa la REST API de Firebase Auth para crear usuarios
 * sin cerrar la sesión activa del supervisor.
 */

import {
  collection, getDocs, doc, setDoc, addDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

const API_KEY = 'AIzaSyBB8IMHS9O0ihXSkFVTMMf1DDC-tXUFWAk'

const PASOS_VACIO = {
  llegada: false, skimmer: false, aspirado: false, cepillado: false,
  quimicos: false, filtro: false, bomba: false, medicion: false,
}

// ── Auth vía REST (no afecta la sesión activa) ────────────────────────────────

export async function crearAuthUsuario(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    }
  )
  const data = await res.json()
  if (data.error) {
    const msgs = {
      EMAIL_EXISTS:          'Este correo ya está registrado.',
      WEAK_PASSWORD:         'La contraseña debe tener al menos 6 caracteres.',
      INVALID_EMAIL:         'El formato del correo no es válido.',
      OPERATION_NOT_ALLOWED: 'La autenticación por email no está habilitada.',
    }
    throw new Error(msgs[data.error.message] ?? data.error.message)
  }
  return data.localId // UID
}

// ── Lectura ───────────────────────────────────────────────────────────────────

export async function obtenerClientes() {
  const snap = await getDocs(query(collection(db, 'usuarios'), where('rol', '==', 'cliente')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function obtenerTecnicosAdmin() {
  const snap = await getDocs(query(collection(db, 'usuarios'), where('rol', '==', 'tecnico')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function obtenerAlbercas() {
  const snap = await getDocs(collection(db, 'albercas'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── Creación ──────────────────────────────────────────────────────────────────

export async function crearCliente({ nombre, email, telefono, direccion, password }) {
  const uid       = await crearAuthUsuario(email, password)
  const albercaId = `alberca-${uid.slice(0, 8)}`

  await setDoc(doc(db, 'usuarios', uid), {
    nombre, email,
    telefono:  telefono ?? '',
    rol:       'cliente',
    albercaId,
    activo:    true,
    creadoEn:  serverTimestamp(),
  })

  await setDoc(doc(db, 'albercas', albercaId), {
    clienteId: uid,
    nombre:    `Alberca ${nombre}`,
    direccion: direccion ?? '',
    activa:    true,
    creadoEn:  serverTimestamp(),
  })

  return { uid, albercaId }
}

export async function crearTecnico({ nombre, email, telefono, zona, password }) {
  const uid = await crearAuthUsuario(email, password)

  await setDoc(doc(db, 'usuarios', uid), {
    nombre, email,
    telefono: telefono ?? '',
    zona:     zona ?? '',
    rol:      'tecnico',
    activo:   true,
    creadoEn: serverTimestamp(),
  })

  return uid
}

export async function crearServicioAdmin({
  tecnicoId, tecnicoNombre, clienteId, clienteNombre,
  albercaId, direccion, fecha, hora, orden, tipo,
}) {
  return addDoc(collection(db, 'servicios'), {
    tecnicoId,
    tecnicoNombre: tecnicoNombre ?? '',
    clienteId:     clienteId     ?? '',
    clienteNombre: clienteNombre ?? '',
    albercaId:     albercaId     ?? '',
    nombre:        clienteNombre ?? 'Servicio',
    direccion:     direccion     ?? '',
    fecha,
    hora:          hora          ?? '09:00',
    orden:         Number(orden) || 1,
    tipo:          tipo          ?? 'Mantenimiento rutina mensual',
    status:        'pendiente',
    pasos:         { ...PASOS_VACIO },
    creadoEn:      serverTimestamp(),
  })
}

export async function crearAlbercaDoc({ clienteId, tamano, tipo, filtracion, direccion }) {
  const ref = await addDoc(collection(db, 'albercas'), {
    clienteId:   clienteId   ?? '',
    tamano:      tamano      ?? '',
    tipo:        tipo        ?? 'cemento',
    filtracion:  filtracion  ?? '',
    direccion:   direccion   ?? '',
    activa:      true,
    creadoEn:    serverTimestamp(),
  })

  if (clienteId) {
    await setDoc(doc(db, 'usuarios', clienteId), { albercaId: ref.id }, { merge: true })
  }

  return ref.id
}

// ── Edición / Desactivación ───────────────────────────────────────────────────

export async function actualizarUsuario(uid, datos) {
  await setDoc(doc(db, 'usuarios', uid), datos, { merge: true })
}

export async function desactivarUsuario(uid) {
  await setDoc(doc(db, 'usuarios', uid), { activo: false }, { merge: true })
}

export async function actualizarAlberca(albercaId, datos) {
  await setDoc(doc(db, 'albercas', albercaId), datos, { merge: true })
}
