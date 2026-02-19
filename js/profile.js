// ===============================
// 🔥 FIREBASE IMPORTS
// ===============================
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// ===============================
// 👤 CARGAR PERFIL
// ===============================
export async function loadProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const data = snap.data();

  // 🔹 Datos básicos
  document.getElementById("profile-email").innerText = user.email;
  document.getElementById("profile-balance").innerText =
    Number(data.balance || 0).toFixed(2);
  document.getElementById("profile-vip").innerText =
    "VIP " + (data.vip || 0);
  document.getElementById("profile-invested").innerText =
    Number(data.totalInvested || 0).toFixed(2);

  // 🔥 LINK DE REFERIDO
  const refLink =
    window.location.origin +
    "/register.html?ref=" +
    user.uid;

  const linkInput = document.getElementById("refLink");
  if (linkInput) linkInput.value = refLink;

  // 🔥 CARGAR EQUIPO MULTINIVEL
  await cargarNiveles(user.uid);
}

// ===============================
// 👥 CARGAR NIVELES
// ===============================
async function cargarNiveles(uid) {

  // Nivel 1
  const q1 = query(
    collection(db, "users"),
    where("refBy", "==", uid)
  );
  const snap1 = await getDocs(q1);

  const nivel1 = snap1.size;
  let nivel2 = 0;
  let nivel3 = 0;

  // Nivel 2
  for (const doc1 of snap1.docs) {
    const q2 = query(
      collection(db, "users"),
      where("refBy", "==", doc1.id)
    );
    const snap2 = await getDocs(q2);
    nivel2 += snap2.size;

    // Nivel 3
    for (const doc2 of snap2.docs) {
      const q3 = query(
        collection(db, "users"),
        where("refBy", "==", doc2.id)
      );
      const snap3 = await getDocs(q3);
      nivel3 += snap3.size;
    }
  }

  document.getElementById("nivel1-count").innerText = nivel1;
  document.getElementById("nivel2-count").innerText = nivel2;
  document.getElementById("nivel3-count").innerText = nivel3;
}

// ===============================
// 📋 COPIAR LINK
// ===============================
document.addEventListener("click", (e) => {
  if (e.target.id !== "copyRef") return;

  const input = document.getElementById("refLink");
  if (!input) return;

  input.select();
  document.execCommand("copy");

  alert("🔗 Link copiado");
});
