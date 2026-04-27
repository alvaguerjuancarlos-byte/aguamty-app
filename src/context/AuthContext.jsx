import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "usuarios", firebaseUser.uid));
        const data = snap.exists() ? snap.data() : {};
        setUser(firebaseUser);
        setRol(data.rol ?? null);
      } else {
        setUser(null);
        setRol(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "usuarios", cred.user.uid));
    const data = snap.exists() ? snap.data() : {};
    setRol(data.rol ?? null);
    return { user: cred.user, rol: data.rol ?? null };
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setRol(null);
  }

  return (
    <AuthContext.Provider value={{ user, rol, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Roles: "cliente" | "tecnico" | "supervisor"
export function useAuth() {
  return useContext(AuthContext);
}
