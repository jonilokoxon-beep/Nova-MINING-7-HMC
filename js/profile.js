// ===============================
// 👤 PERFIL (SOLO LÓGICA)
// ===============================

// ❌ NO initializeApp
// ❌ NO firebaseConfig
// ❌ NO onAuthStateChanged

import { db, auth } from "./firebase.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// 📤 EXPORTAR FUNCIÓN
// ===============================
export async function loadProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const emailEl = document.getElementById("p-email");
  const uidEl = document.getElementById("p-uid");
  const balanceEl = document.getElementById("p-balance");
  const earnedEl = document.getElementById("p-earned");
  const activeEl = document.getElementById("p-active");
  const finishedEl = document.getElementById("p-finished");
  const dateEl = document.getElementById("p-date");

  if (
    !emailEl || !uidEl || !balanceEl ||
    !earnedEl || !activeEl || !finishedEl || !dateEl
  ) {
    console.warn("Elementos de perfil no encontrados");
    return;
  }

  // 👤 DATOS USUARIO
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;
  const u = userSnap.data();

  emailEl.innerText = user.email;
  uidEl.innerText = user.uid;
  balanceEl.innerText = Number(u.balance || 0).toFixed(2);

  // 📦 ÓRDENES
  let totalEarned = 0;
  let active = 0;
  let finished = 0;

  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  snap.forEach(d => {
    const o = d.data();
    if (o.status === "active") active++;
    if (o.status === "finished") finished++;

    totalEarned +=
      Number(o.dailyProfit || 0) * Number(o.duration || 0);
  });

  earnedEl.innerText = totalEarned.toFixed(2);
  activeEl.innerText = active;
  finishedEl.innerText = finished;

  if (u.createdAt?.toDate) {
    dateEl.innerText = u.createdAt.toDate().toLocaleDateString();
  }
}
