import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  addDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const ADMIN_EMAIL = "joni.lokoxon@gmail.com";

auth.onAuthStateChanged(user => {
  if (!user || user.email !== ADMIN_EMAIL) {
    alert("Acceso denegado");
    location.href = "dashboard.html";
  }
});
