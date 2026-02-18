// ===============================
// 📦 ÓRDENES - SISTEMA REAL AUTOMÁTICO
// ===============================

import { db, auth } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// 🚀 CARGAR ÓRDENES
// ===============================
export async function loadOrders() {
  const user = auth.currentUser;
  if (!user) return;

  const ordersDiv = document.getElementById("ordersList");
  const totalDiv = document.getElementById("totalProfit");

  if (!ordersDiv || !totalDiv) return;

  ordersDiv.innerHTML = "Cargando órdenes...";
  totalDiv.innerText = "$0.00";

  let totalGanado = 0;

  const q = query(
    collection(db, "orders"),
    where("uid", "==", user.uid),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    ordersDiv.innerHTML = "No tienes inversiones activas";
    return;
  }

  ordersDiv.innerHTML = "";

  snap.forEach(docSnap => {
    const o = docSnap.data();
    const orderId = docSnap.id;

    const daily = Number(o.dailyProfit || 0);
    const duration = Number(o.duration || 0);

    const created = o.createdAt.toMillis();
    const lastClaim = o.lastClaim.toMillis();

    const now = Date.now();
    const passedDays = Math.floor((now - created) / 86400000);
    const daysLeft = Math.max(duration - passedDays, 0);

    totalGanado += daily * passedDays;

    const nextClaim = lastClaim + 86400000;

    ordersDiv.innerHTML += `
      <div class="order-card">
        <b>${o.productName}</b><br>
        Ganancia diaria: $${daily.toFixed(2)}<br>
        Días restantes: ${daysLeft}<br>
        Ganancia acumulada: $${(daily * passedDays).toFixed(2)}<br>
        <div class="timer" 
             data-id="${orderId}" 
             data-next="${nextClaim}">
          --:--:--
        </div>
      </div>
    `;
  });

  totalDiv.innerText = `$${totalGanado.toFixed(2)}`;

  startTimers();
}

// ===============================
// ⏱ CONTADORES + COBRO AUTOMÁTICO
// ===============================
function startTimers() {
  setInterval(async () => {
    const timers = document.querySelectorAll(".timer");
    if (!timers.length) return;

    for (const el of timers) {
      const orderId = el.dataset.id;
      const next = Number(el.dataset.next);
      const now = Date.now();
      const diff = next - now;

      if (diff <= 0) {
        await cobrarOrden(orderId);
        el.innerText = "Procesando...";
        continue;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      el.innerText = `${h}h ${m}m ${s}s`;
    }
  }, 1000);
}

// ===============================
// 💰 COBRAR ORDEN AUTOMÁTICAMENTE
// ===============================
async function cobrarOrden(orderId) {
  const user = auth.currentUser;
  if (!user) return;

  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) return;

  const o = orderSnap.data();
  if (o.status !== "active") return;

  const now = Date.now();
  const last = o.lastClaim.toMillis();

  // 🔒 Ya cobró hoy
  if (now - last < 86400000) return;

  const created = o.createdAt.toMillis();
  const passedDays = Math.floor((now - created) / 86400000);

  // 🔁 ORDEN TERMINADA
  if (passedDays >= o.duration) {
    await updateDoc(orderRef, { status: "finished" });
    loadOrders();
    return;
  }

  // 💸 SUMAR GANANCIA
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const saldo = Number(userSnap.data().balance || 0);

  await updateDoc(userRef, {
    balance: saldo + Number(o.dailyProfit)
  });

  await updateDoc(orderRef, {
    lastClaim: serverTimestamp()
  });

  loadOrders();
}
