/**
 * Crea (o actualiza) los documentos en Firestore → colección "usuarios".
 * Obtiene el UID de cada usuario consultando Firebase Authentication por email.
 *
 * Requisito: serviceAccountKey.json en la raíz del proyecto.
 * Ejecución: npm run create-users
 */

import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const keyPath   = join(__dirname, '../../serviceAccountKey.json')

try {
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
} catch {
  console.error('\n❌  No se encontró serviceAccountKey.json en la raíz del proyecto.')
  console.error('   Firebase Console → Configuración → Cuentas de servicio → Generar clave\n')
  process.exit(1)
}

const auth = admin.auth()
const db   = admin.firestore()

const USUARIOS = [
  { email: 'supervisor@aquamty.com', nombre: 'Jhonatan Cabrera', rol: 'supervisor' },
  { email: 'tecnico@aquamty.com',    nombre: 'Juan Pérez',       rol: 'tecnico'    },
  { email: 'cliente@aquamty.com',    nombre: 'Fam. Garza',       rol: 'cliente'    },
]

async function createUsers() {
  console.log('\n🌊  AquaMTY — Creación de documentos en Firestore\n')

  for (const u of USUARIOS) {
    try {
      // Obtener UID desde Firebase Auth
      const record = await auth.getUserByEmail(u.email)

      // Escribir/actualizar documento en usuarios/{uid}
      await db.collection('usuarios').doc(record.uid).set(
        {
          email:        u.email,
          nombre:       u.nombre,
          rol:          u.rol,
          actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }   // no sobreescribe campos extra si ya existían
      )

      console.log(`  ✅  [${u.rol.padEnd(10)}]  ${u.nombre.padEnd(20)}  uid: ${record.uid}`)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.error(`  ❌  ${u.email} no existe en Firebase Auth.`)
        console.error(`      Créalo primero en: Firebase Console → Authentication → Agregar usuario`)
      } else {
        console.error(`  ❌  ${u.email}:`, err.message)
      }
    }
  }

  console.log('\n✔  Listo. Documentos disponibles en Firestore → colección "usuarios".\n')
  process.exit(0)
}

createUsers().catch((err) => {
  console.error('Error inesperado:', err)
  process.exit(1)
})
