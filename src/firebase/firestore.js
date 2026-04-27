import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Guarda una medición de parámetros en la subcolección
 * mediciones de una alberca.
 */
export async function guardarMedicion(albercaId, datos) {
  const ref = collection(db, "albercas", albercaId, "mediciones");
  return addDoc(ref, { ...datos, timestamp: serverTimestamp() });
}

/**
 * Devuelve los servicios asignados a un técnico para una fecha dada.
 * @param {string} fecha - "YYYY-MM-DD"
 */
export async function obtenerRuta(tecnicoId, fecha) {
  const ref = collection(db, "servicios");
  const q = query(
    ref,
    where("tecnicoId", "==", tecnicoId),
    where("fecha", "==", fecha)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Actualiza el estado de un paso del checklist de un servicio.
 * @param {string} paso - nombre del paso, e.g. "cloracion"
 * @param {boolean} estado
 */
export async function actualizarPaso(servicioId, paso, estado) {
  const ref = doc(db, "servicios", servicioId);
  return updateDoc(ref, { [`pasos.${paso}`]: estado });
}
