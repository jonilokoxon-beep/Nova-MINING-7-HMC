// ===============================
// 🔥 FIREBASE IMPORTS
// ===============================
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// ===============================
// 📦 CARGAR ÓRDENES
// ===============================
export async function loadOrders() {
  const user = auth.currentUser;
  if (!user) return;

  const list = document.getElementById("ordersList");
  if (!list) return;

  list.innerHTML = "";

  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  if (snap.empty) {
    list.innerHTML = "<p>No tienes órdenes activas</p>";
    return;
  }

  snap.forEach(docSnap => {
    const o = docSnap.data();

    if (o.status !== "active") return;

    const created = o.createdAt?.toMillis?.() || 0;
    const now = Date.now();
    const daysPassed = Math.floor((now - created) / 86400000);

    const canClaim =
      now - (o.lastClaim?.toMillis?.() || 0) >= 86400000;

    list.innerHTML += `
      <div class="order-card">
        <h4>${o.productName}</h4>
        <p>Invertido: $${o.amount}</p>
        <p>Ganancia diaria: $${o.dailyProfit}</p>
        <p>Días transcurridos: ${daysPassed}/${o.duration}</p>
        <button 
          class="btn-claim"
          data-id="${docSnap.id}"
          ${canClaim ? "" : "disabled"}
        >
          ${canClaim ? "Cobrar" : "Esperando 24h"}
        </button>
      </div>
    `;
  });
}

// ===============================
// 💰 COBRAR GANANCIA DIARIA
// ===============================
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-claim")) return;

  const orderId = e.target.dataset.id;
  const user = auth.currentUser;
  if (!user) return;

  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);

  if (!orderSnap.exists()) return;

  const o = orderSnap.data();

  const now = Date.now();
  const last = o.lastClaim?.toMillis?.() || 0;

  if (now - last < 86400000) {
    alert("⏳ Aún no pasan 24h");
    return;
  }

  // Verificar duración
  const created = o.createdAt?.toMillis?.() || 0;
  const daysPassed = Math.floor((now - created) / 86400000);

  if (daysPassed >= o.duration) {
    await updateDoc(orderRef, { status: "finished" });
    alert("Orden finalizada");
    loadOrders();
    return;
  }

  // Pagar ganancia
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  await updateDoc(userRef, {
    balance: increment(o.dailyProfit)
  });

  await addDoc(collection(db, "transactions"), {
    uid: user.uid,
    type: "daily_profit",
    amount: o.dailyProfit,
    createdAt: serverTimestamp()
  });

  // Actualizar último cobro
  await updateDoc(orderRef, {
    lastClaim: serverTimestamp()
  });

  // 🔥 MULTINIVEL TAMBIÉN EN GANANCIA
  await pagarComisiones(userData.refBy, o.dailyProfit);

  alert("💸 Ganancia acreditada");
  loadOrders();
});

// ===============================
// 🔥 MULTINIVEL 3 NIVELES
// ===============================
async function pagarComisiones(refUid, amount) {
  if (!refUid) return;

  const nivel1Ref = doc(db, "users", refUid);
  const snap1 = await getDoc(nivel1Ref);
  if (!snap1.exists()) return;

  const com1 = amount * 0.10;
  await updateDoc(nivel1Ref, { balance: increment(com1) });

  await addDoc(collection(db, "transactions"), {
    uid: refUid,
    type: "nivel1_profit",
    amount: com1,
    createdAt: serverTimestamp()
  });

  const nivel2Uid = snap1.data().refBy;
  if (!nivel2Uid) return;

  const nivel2Ref = doc(db, "users", nivel2Uid);
  const snap2 = await getDoc(nivel2Ref);
  if (!snap2.exists()) return;

  const com2 = amount * 0.05;
  await updateDoc(nivel2Ref, { balance: increment(com2) });

  await addDoc(collection(db, "transactions"), {
    uid: nivel2Uid,
    type: "nivel2_profit",
    amount: com2,
    createdAt: serverTimestamp()
  });

  const nivel3Uid = snap2.data().refBy;
  if (!nivel3Uid) return;

  const com3 = amount * 0.01;
  await updateDoc(doc(db, "users", nivel3Uid), {
    balance: increment(com3)
  });

  await addDoc(collection(db, "transactions"), {
    uid: nivel3Uid,
    type: "nivel3_profit",
    amount: com3,
    createdAt: serverTimestamp()
  });
}
