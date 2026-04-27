/**
 * Seed de usuarios de prueba para AquaMTY.
 *
 * Requisito previo:
 *   Descarga el Service Account JSON desde:
 *   Firebase Console → Configuración del proyecto → Cuentas de servicio
 *                    → "Generar nueva clave privada"
 *   Guárdalo como  serviceAccountKey.json  en la raíz del proyecto.
 *
 * Uso:
 *   npm run seed
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const keyPath   = join(__dirname, '../../serviceAccountKey.json')

// ── Carga la clave del service account ──────────────────────────────────────
let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
} catch {
  console.error('\n❌  No se encontró serviceAccountKey.json en la raíz del proyecto.')
  console.error('   Pasos para obtenerlo:')
  console.error('   1. Firebase Console → ⚙️ Configuración del proyecto')
  console.error('   2. Pestaña "Cuentas de servicio"')
  console.error('   3. Clic en "Generar nueva clave privada"')
  console.error('   4. Guarda el archivo como serviceAccountKey.json en aquamty-app/\n')
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const auth = admin.auth()
const db   = admin.firestore()

// ── Usuarios a crear ─────────────────────────────────────────────────────────
const USUARIOS = [
  {
    email:    'supervisor@aquamty.com',
    password: 'aquamty2026',
    nombre:   'Supervisor AquaMTY',
    rol:      'supervisor',
  },
  {
    email:    'tecnico@aquamty.com',
    password: 'aquamty2026',
    nombre:   'Carlos Vega (Técnico)',
    rol:      'tecnico',
  },
  {
    email:    'cliente@aquamty.com',
    password: 'aquamty2026',
    nombre:   'Cliente Demo',
    rol:      'cliente',
  },
]

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌊  AquaMTY — Seed de usuarios de prueba\n')

  for (const u of USUARIOS) {
    try {
      // Crear en Firebase Auth
      const record = await auth.createUser({
        email:         u.email,
        password:      u.password,
        displayName:   u.nombre,
        emailVerified: true,
      })

      // Crear documento en Firestore
      await db.collection('usuarios').doc(record.uid).set({
        email:    u.email,
        nombre:   u.nombre,
        rol:      u.rol,
        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
      })

      console.log(`  ✅  [${u.rol.padEnd(10)}]  ${u.email}  →  uid: ${record.uid}`)
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        // Usuario ya existe en Auth → sólo sincroniza Firestore
        const existing = await auth.getUserByEmail(u.email)
        await db.collection('usuarios').doc(existing.uid).set(
          { email: u.email, nombre: u.nombre, rol: u.rol },
          { merge: true }
        )
        console.log(`  ♻️   [${u.rol.padEnd(10)}]  ${u.email}  →  ya existía, Firestore sincronizado`)
      } else {
        console.error(`  ❌  ${u.email}:`, err.message)
      }
    }
  }

  console.log('\n✔  Seed completado. Credenciales:\n')
  console.log('  supervisor@aquamty.com  /  aquamty2026')
  console.log('  tecnico@aquamty.com     /  aquamty2026')
  console.log('  cliente@aquamty.com     /  aquamty2026\n')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(1)
})
