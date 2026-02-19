// ===============================
// 📦 ÓRDENES (MODO SEGURO)
// 📦 ÓRDENES - SISTEMA REAL AUTOMÁTICO
// ===============================

import { db, auth } from "./firebase.js";
@@ -11,133 +11,151 @@ import {
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  increment
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

  ordersDiv.innerHTML = "Cargando...";
  if (!ordersDiv || !totalDiv) return;

  ordersDiv.innerHTML = "Cargando órdenes...";
  totalDiv.innerText = "$0.00";

  let total = 0;
  let totalGanado = 0;

  const q = query(
    collection(db, "orders"),
    where("uid", "==", user.uid)
    where("uid", "==", user.uid),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    ordersDiv.innerHTML = "No hay órdenes";
    ordersDiv.innerHTML = "No tienes inversiones activas";
    return;
  }

  ordersDiv.innerHTML = "";

  snap.forEach(d => {
    const o = d.data();

    const name = o.productName ?? "SIN NOMBRE";
    const amount = Number(o.amount ?? 0);
    const daily = Number(o.dailyProfit ?? 0);
    const duration = Number(o.duration ?? 0);
  snap.forEach(docSnap => {
    const o = docSnap.data();
    const orderId = docSnap.id;

    const created =
      o.createdAt?.toMillis?.() ?? Date.now();
    const daily = Number(o.dailyProfit || 0);
    const duration = Number(o.duration || 0);

    const lastClaim =
      o.lastClaim?.toMillis?.() ?? created;
    const created = o.createdAt.toMillis();
    const lastClaim = o.lastClaim.toMillis();

    const daysPassed =
      Math.floor((Date.now() - created) / 86400000);
    const now = Date.now();
    const passedDays = Math.floor((now - created) / 86400000);
    const daysLeft = Math.max(duration - passedDays, 0);

    const remaining =
      Math.max(duration - daysPassed, 0);

    const earned =
      Math.min(daysPassed * daily, duration * daily);

    total += earned;
    totalGanado += daily * passedDays;

    const nextClaim = lastClaim + 86400000;

    ordersDiv.innerHTML += `
      <div class="order-card">
        <b>${name}</b><br>
        Inversión: $${amount}<br>
        Ganancia diaria: $${daily}<br>
        Duración: ${duration} días<br>
        Días restantes: ${remaining}<br>
        Ganancia generada: $${earned.toFixed(2)}<br>

        <div class="timer" data-end="${nextClaim}" data-id="${d.id}">
        <b>${o.productName}</b><br>
        Ganancia diaria: $${daily.toFixed(2)}<br>
        Días restantes: ${daysLeft}<br>
        Ganancia acumulada: $${(daily * passedDays).toFixed(2)}<br>
        <div class="timer" 
             data-id="${orderId}" 
             data-next="${nextClaim}">
          --:--:--
        </div>

        <button class="claim" 
          data-id="${d.id}" 
          data-profit="${daily}">
          Disponer
        </button>
      </div>
    `;
  });

  totalDiv.innerText = `$${total.toFixed(2)}`;
  totalDiv.innerText = `$${totalGanado.toFixed(2)}`;

  startTimers();
}

// ===============================
// ⏱ CONTADOR
// ⏱ CONTADORES + COBRO AUTOMÁTICO
// ===============================
function startTimers() {
  setInterval(() => {
    document.querySelectorAll(".timer").forEach(t => {
      const diff = t.dataset.end - Date.now();
  setInterval(async () => {
    const timers = document.querySelectorAll(".timer");
    if (!timers.length) return;

    for (const el of timers) {
      const orderId = el.dataset.id;
      const next = Number(el.dataset.next);
      const now = Date.now();
      const diff = next - now;

      if (diff <= 0) {
        t.innerText = "Disponible";
        return;
        await cobrarOrden(orderId);
        el.innerText = "Procesando...";
        continue;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      t.innerText = `${h}h ${m}m ${s}s`;
    });
      el.innerText = `${h}h ${m}m ${s}s`;
    }
  }, 1000);
}

// ===============================
// 💸 DISPONER
// 💰 COBRAR ORDEN AUTOMÁTICAMENTE
// ===============================
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("claim")) return;

  const id = e.target.dataset.id;
  const profit = Number(e.target.dataset.profit);
async function cobrarOrden(orderId) {
  const user = auth.currentUser;

  if (!user) return;

  await updateDoc(
    doc(db, "users", user.uid),
    { balance: increment(profit) }
  );
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  if (!orderSnap.exists()) return;

  await updateDoc(
    doc(db, "orders", id),
    { lastClaim: serverTimestamp() }
  );
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

  alert("✅ Ganancia agregada");
  loadOrders();
});
}
