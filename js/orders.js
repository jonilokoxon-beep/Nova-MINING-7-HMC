// ===============================
// 📦 ÓRDENES (MODO SEGURO)
// ===============================

import { db, auth } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadOrders() {
  const user = auth.currentUser;
  if (!user) return;

  const ordersDiv = document.getElementById("ordersList");
  const totalDiv = document.getElementById("totalProfit");

  ordersDiv.innerHTML = "Cargando...";
  totalDiv.innerText = "$0.00";

  let total = 0;

  const q = query(
    collection(db, "orders"),
    where("uid", "==", user.uid)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    ordersDiv.innerHTML = "No hay órdenes";
    return;
  }

  ordersDiv.innerHTML = "";

  snap.forEach(d => {
    const o = d.data();

    const name = o.productName ?? "SIN NOMBRE";
    const amount = Number(o.amount ?? 0);
    const daily = Number(o.dailyProfit ?? 0);
    const duration = Number(o.duration ?? 0);

    const created =
      o.createdAt?.toMillis?.() ?? Date.now();

    const lastClaim =
      o.lastClaim?.toMillis?.() ?? created;

    const daysPassed =
      Math.floor((Date.now() - created) / 86400000);

    const remaining =
      Math.max(duration - daysPassed, 0);

    const earned =
      Math.min(daysPassed * daily, duration * daily);

    total += earned;

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
  startTimers();
}

// ===============================
// ⏱ CONTADOR
// ===============================
function startTimers() {
  setInterval(() => {
    document.querySelectorAll(".timer").forEach(t => {
      const diff = t.dataset.end - Date.now();

      if (diff <= 0) {
        t.innerText = "Disponible";
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      t.innerText = `${h}h ${m}m ${s}s`;
    });
  }, 1000);
}

// ===============================
// 💸 DISPONER
// ===============================
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("claim")) return;

  const id = e.target.dataset.id;
  const profit = Number(e.target.dataset.profit);
  const user = auth.currentUser;

  if (!user) return;

  await updateDoc(
    doc(db, "users", user.uid),
    { balance: increment(profit) }
  );

  await updateDoc(
    doc(db, "orders", id),
    { lastClaim: serverTimestamp() }
  );

  alert("✅ Ganancia agregada");
  loadOrders();
});
