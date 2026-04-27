/**
 * Crea los documentos en Firestore usando el UID real de Firebase Auth.
 * Hace login con cada cuenta, captura el UID y escribe usuarios/{uid}.
 *
 * No requiere serviceAccountKey.json — usa el SDK cliente directamente.
 * Ejecución: npm run seed-users
 */

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  inMemoryPersistence,
} from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

// ── Config del proyecto (pública, igual que src/firebase/config.js) ──────────
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

// ── Usuarios a crear ──────────────────────────────────────────────────────────
const USUARIOS = [
  { email: 'supervisor@aquamty.com', password: 'aquamty2026', nombre: 'Jhonatan Cabrera', rol: 'supervisor' },
  { email: 'tecnico@aquamty.com',    password: 'aquamty2026', nombre: 'Juan Pérez',       rol: 'tecnico'    },
  { email: 'cliente@aquamty.com',    password: 'aquamty2026', nombre: 'Fam. Garza',       rol: 'cliente'    },
]

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seedUsers() {
  console.log('\n🌊  AquaMTY — Creando documentos en Firestore\n')

  // inMemoryPersistence evita errores de localStorage/indexedDB en Node.js
  await setPersistence(auth, inMemoryPersistence)

  for (const u of USUARIOS) {
    try {
      // 1. Login → obtiene UID real de Firebase Auth
      const { user } = await signInWithEmailAndPassword(auth, u.email, u.password)
      const uid = user.uid

      // 2. Escribe usuarios/{uid} en Firestore
      await setDoc(
        doc(db, 'usuarios', uid),
        {
          email:        u.email,
          nombre:       u.nombre,
          rol:          u.rol,
          actualizadoEn: serverTimestamp(),
        },
        { merge: true }
      )

      console.log(`  ✅  [${u.rol.padEnd(10)}]  ${u.nombre.padEnd(20)}  uid: ${uid}`)

      await signOut(auth)
    } catch (err) {
      const msg =
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Contraseña incorrecta o usuario no existe en Firebase Auth'
          : err.code === 'auth/user-not-found'
          ? 'Usuario no existe en Firebase Auth — créalo primero'
          : err.message
      console.error(`  ❌  ${u.email}: ${msg}`)
    }
  }

  console.log('\n✔  Documentos creados en Firestore → colección "usuarios".\n')
  process.exit(0)
}

seedUsers().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(1)
})
