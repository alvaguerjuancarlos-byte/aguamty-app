/**
 * Inserta datos de prueba en Firestore:
 *  - 3 servicios para hoy  →  colección "servicios"
 *  - 1 alberca + medición  →  "albercas/alberca-garza"
 *  - Vincula albercaId al documento del cliente en "usuarios"
 *
 * No requiere serviceAccountKey.json.
 * Ejecución: npm run seed-data
 */

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  inMemoryPersistence,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            'AIzaSyBB8IMHS9O0ihXSkFVTMMf1DDC-tXUFWAk',
  authDomain:        'aplicacion-para-albercas.firebaseapp.com',
  projectId:         'aplicacion-para-albercas',
  storageBucket:     'aplicacion-para-albercas.firebasestorage.app',
  messagingSenderId: '413175845386',
  appId:             '1:413175845386:web:8334355ec5f2019c62c5f3',
}

const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db   = getFirestore(app)

function fechaHoy() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function getUID(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  const uid = user.uid
  await signOut(auth)
  return uid
}

const PASOS_VACIO = {
  llegada: false, skimmer: false, aspirado: false,
  cepillado: false, quimicos: false, filtro: false,
  bomba: false, medicion: false,
}

async function seedData() {
  console.log('\n🌊  AquaMTY — Seed de datos de prueba\n')
  await setPersistence(auth, inMemoryPersistence)

  const hoy = fechaHoy()
  console.log(`  📅  Fecha de servicios: ${hoy}\n`)

  // ── Obtener UIDs ────────────────────────────────────────────────────────────
  console.log('  🔑  Obteniendo UIDs...')
  const tecnicoUID = await getUID('tecnico@aquamty.com',   'aquamty2026')
  const clienteUID = await getUID('cliente@aquamty.com', 'aquamty2026')
  console.log(`       técnico  → ${tecnicoUID}`)
  console.log(`       cliente  → ${clienteUID}\n`)

  // ── Servicios ───────────────────────────────────────────────────────────────
  const SERVICIOS = [
    {
      tecnicoId:     tecnicoUID,
      tecnicoNombre: 'Juan Pérez',
      fecha:         hoy,
      nombre:        'Fam. Garza',
      direccion:     'Sector Colonial, San Pedro',
      hora:          '09:00',
      orden:         1,
      status:        'pendiente',
      tipo:          'Mantenimiento rutina mensual',
      contacto:      '81 8000 0001',
      pasos:         { ...PASOS_VACIO },
    },
    {
      tecnicoId:     tecnicoUID,
      tecnicoNombre: 'Juan Pérez',
      fecha:         hoy,
      nombre:        'Res. Akumal',
      direccion:     'Av. Insurgentes 340, Monterrey',
      hora:          '11:00',
      orden:         2,
      status:        'pendiente',
      tipo:          'Mantenimiento rutina mensual',
      contacto:      '81 8000 0002',
      pasos:         { ...PASOS_VACIO },
    },
    {
      tecnicoId:     tecnicoUID,
      tecnicoNombre: 'Juan Pérez',
      fecha:         hoy,
      nombre:        'Club Alpino',
      direccion:     'C. Nacional km 14, García',
      hora:          '13:30',
      orden:         3,
      status:        'pendiente',
      tipo:          'Mantenimiento rutina mensual',
      contacto:      '81 8000 0003',
      pasos:         { ...PASOS_VACIO },
    },
  ]

  console.log('  📋  Creando servicios...')
  for (const s of SERVICIOS) {
    const ref = await addDoc(collection(db, 'servicios'), s)
    console.log(`       ✅  [${s.orden}] ${s.nombre.padEnd(15)} ${s.hora}  →  ${ref.id}`)
  }

  // ── Alberca ─────────────────────────────────────────────────────────────────
  console.log('\n  🏊  Creando alberca...')
  await setDoc(doc(db, 'albercas', 'alberca-garza'), {
    clienteId:   clienteUID,
    nombre:      'Alberca Fam. Garza',
    tipo:        'Residencial exterior',
    volumen:     '85,000 L',
    sistema:     'Sal electrolítica',
    contrato:    'Mantenimiento mensual',
    creadoEn:    serverTimestamp(),
  })
  console.log('       ✅  albercas/alberca-garza')

  // ── Medición ────────────────────────────────────────────────────────────────
  console.log('\n  💧  Insertando medición...')
  const medRef = await addDoc(
    collection(db, 'albercas', 'alberca-garza', 'mediciones'),
    {
      ph:          7.4,
      cloro:       2.0,
      temperatura: 28,
      tds:         380,
      timestamp:   serverTimestamp(),
    }
  )
  console.log(`       ✅  mediciones/${medRef.id}`)

  // ── Vincular alberca al cliente ─────────────────────────────────────────────
  console.log('\n  🔗  Vinculando alberca al cliente...')
  await setDoc(
    doc(db, 'usuarios', clienteUID),
    { albercaId: 'alberca-garza' },
    { merge: true }
  )
  console.log('       ✅  usuarios/' + clienteUID + ' → albercaId: "alberca-garza"')

  console.log('\n✔  Seed completado. La app ya tiene datos reales en Firestore.\n')
  process.exit(0)
}

seedData().catch((err) => {
  console.error('\n❌  Error inesperado:', err.message)
  process.exit(1)
})
