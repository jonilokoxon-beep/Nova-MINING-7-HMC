// ===============================
// 👤 PROFILE LOGIC
// ===============================

import { auth, db } from "./firebase.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// 🚀 LOAD PROFILE
// ===============================
export async function loadProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const idEl = document.getElementById("p-id");
  const vipEl = document.getElementById("p-vip");
  const balanceEl = document.getElementById("p-balance");

  const inviteBtn = document.getElementById("btn-invite");
  const rescueBtn = document.getElementById("btn-rescue");

  const userRef = doc(db, "users", user.uid);
  let userSnap = await getDoc(userRef);

  // 🆔 CREAR PERFIL SI NO EXISTE
  if (!userSnap.exists()) {
    const generatedId = Math.floor(100000 + Math.random() * 900000);

    await updateDoc(userRef, {
      publicId: generatedId,
      vip: 0,
      balance: 0,
      createdAt: serverTimestamp()
    });

    userSnap = await getDoc(userRef);
  }

  const u = userSnap.data();

  // 📄 MOSTRAR DATOS
  idEl.innerText = u.publicId || "000000";
  balanceEl.innerText = Number(u.balance || 0).toFixed(2);

  // 👥 REFERIDOS → VIP
  const referralsQuery = query(
    collection(db, "users"),
    where("referredBy", "==", user.uid)
  );

  const referralsSnap = await getDocs(referralsQuery);
  const totalRefs = referralsSnap.size;

  const vipLevel = Math.floor(totalRefs / 3);
  vipEl.innerText = vipLevel;

  // 🔗 INVITAR
  inviteBtn.onclick = () => {
    const link = `${location.origin}/register.html?ref=${user.uid}`;
    navigator.clipboard.writeText(link);
    alert("✅ Enlace copiado para invitar");
  };

  // 🎁 RESCUE (placeholder)
  rescueBtn.onclick = () => {
    alert("🎁 Próximamente: códigos de recompensa");
  };
}
