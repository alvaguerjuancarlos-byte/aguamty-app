import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBB8IMHS9O0ihXSkFVTMMf1DDC-tXUFWAk",
  authDomain: "aplicacion-para-albercas.firebaseapp.com",
  projectId: "aplicacion-para-albercas",
  storageBucket: "aplicacion-para-albercas.firebasestorage.app",
  messagingSenderId: "413175845386",
  appId: "1:413175845386:web:8334355ec5f2019c62c5f3",
  measurementId: "G-Y8FHWMWG12",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
