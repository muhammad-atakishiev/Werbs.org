// ═══════════════════════════════════════════
//  FIREBASE CONFIG — твои ключи уже здесь
// ═══════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCN8EOAFYiS40PmWsxvzr0yrbP8LiCzGo0",
  authDomain: "werbs-4857b.firebaseapp.com",
  projectId: "werbs-4857b",
  storageBucket: "werbs-4857b.firebasestorage.app",
  messagingSenderId: "1010172532184",
  appId: "1:1010172532184:web:0c87ba73a593299ed60ead",
  measurementId: "G-Z1NSK59FHM"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

export { db, doc, setDoc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, arrayUnion };
