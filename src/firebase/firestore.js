import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ── Servicios ─────────────────────────────────────────────────────────────────

export async function obtenerRuta(tecnicoId, fecha) {
  const q = query(
    collection(db, 'servicios'),
    where('tecnicoId', '==', tecnicoId),
    where('fecha', '==', fecha)
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
}

// Real-time listener — returns unsubscribe fn
export function suscribirServiciosHoy(fecha, onUpdate) {
  const q = query(collection(db, 'servicios'), where('fecha', '==', fecha))
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function actualizarPaso(servicioId, paso, estado) {
  return updateDoc(doc(db, 'servicios', servicioId), {
    [`pasos.${paso}`]: estado,
  })
}

export async function actualizarEstadoServicio(servicioId, estado) {
  return updateDoc(doc(db, 'servicios', servicioId), { status: estado })
}

// ── Usuarios ──────────────────────────────────────────────────────────────────

export async function obtenerUsuario(uid) {
  const snap = await getDoc(doc(db, 'usuarios', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function obtenerTecnicos() {
  const q = query(collection(db, 'usuarios'), where('rol', '==', 'tecnico'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── Albercas / Mediciones ─────────────────────────────────────────────────────

export async function guardarMedicion(albercaId, datos) {
  return addDoc(collection(db, 'albercas', albercaId, 'mediciones'), {
    ...datos,
    timestamp: serverTimestamp(),
  })
}

export async function obtenerUltimaMedicion(albercaId) {
  const q = query(
    collection(db, 'albercas', albercaId, 'mediciones'),
    orderBy('timestamp', 'desc'),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// ── Ubicaciones ───────────────────────────────────────────────────────────────

export async function guardarUbicacion(tecnicoId, { lat, lng, status }) {
  return setDoc(doc(db, 'ubicaciones', tecnicoId), {
    lat,
    lng,
    status: status ?? 'en_ruta',
    timestamp: serverTimestamp(),
  })
}

// Real-time listener for all technician locations — returns unsubscribe fn
export function suscribirUbicaciones(onUpdate) {
  return onSnapshot(collection(db, 'ubicaciones'), (snap) => {
    const data = {}
    snap.docs.forEach((d) => { data[d.id] = { id: d.id, ...d.data() } })
    onUpdate(data)
  })
}
