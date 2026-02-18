// ===============================
// 📦 ÓRDENES (LÓGICA COMPLETA)
// ===============================

import { db, auth } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// 📦 CARGAR ÓRDENES
// ===============================
export async function loadOrders() {
  const user = auth.currentUser;
  if (!user) return;

  const ordersDiv = document.getElementById("ordersList");
  const totalDiv = document.getElementById("totalProfit");

  if (!ordersDiv || !totalDiv) return;

  ordersDiv.innerHTML = "Cargando órdenes...";
  totalDiv.innerText = "$0.00";

  let totalGanancia = 0;

  try {
    const q = query(
      collection(db, "orders"),
      where("uid", "==", user.uid),
      where("status", "==", "active")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      ordersDiv.innerHTML = "No tienes órdenes activas";
      return;
    }

    ordersDiv.innerHTML = "";

    snap.forEach(docSnap => {
      const o = docSnap.data();
      const orderId = docSnap.id;

      const precio = Number(o.amount) || 0;
      const gananciaDiaria = Number(o.dailyProfit) || 0;
      const diasTotales = Number(o.duration) || 0;

      const inicio = o.createdAt?.toMillis?.() || Date.now();
      const hoy = Date.now();
      const diasPasados = Math.floor((hoy - inicio) / 86400000);
      const diasRestantes = Math.max(diasTotales - diasPasados, 0);

      const gananciaGenerada = Math.min(
        diasPasados * gananciaDiaria,
        diasTotales * gananciaDiaria
      );

      totalGanancia += gananciaGenerada;

      const proximoPago =
        (o.lastClaim?.toMillis?.() || inicio) + 86400000;

      ordersDiv.innerHTML += `
        <div class="order-card">
          <b>${o.productName}</b><br>
          Inversión: $${precio}<br>
          Ganancia diaria: $${gananciaDiaria}<br>
          Días restantes: ${diasRestantes}<br>
          Ganancia generada: $${gananciaGenerada.toFixed(2)}<br>

          <div class="timer" data-end="${proximoPago}" data-id="${orderId}">
            --:--:--
          </div>

          <button 
            class="btn-claim" 
            data-id="${orderId}" 
            data-profit="${gananciaDiaria}">
            Disponer
          </button>
        </div>
      `;
    });

    totalDiv.innerText = `$${totalGanancia.toFixed(2)}`;
    startTimers();

  } catch (err) {
    console.error("Error cargando órdenes:", err);
    ordersDiv.innerHTML = "Error al cargar órdenes";
  }
}

// ===============================
// ⏱ CONTADORES
// ===============================
function startTimers() {
  setInterval(() => {
    document.querySelectorAll(".timer").forEach(el => {
      const end = Number(el.dataset.end);
      const diff = end - Date.now();

      if (diff <= 0) {
        el.innerText = "Disponible";
        el.classList.add("ready");
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      el.innerText = `${h}h ${m}m ${s}s`;
    });
  }, 1000);
}

// ===============================
// 💸 DISPONER GANANCIA
// ===============================
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-claim")) return;

  const orderId = e.target.dataset.id;
  const profit = Number(e.target.dataset.profit);
  const user = auth.currentUser;

  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const orderRef = doc(db, "orders", orderId);

    await updateDoc(userRef, {
      balance: window.firebaseIncrement
        ? window.firebaseIncrement(profit)
        : profit
    });

    await updateDoc(orderRef, {
      lastClaim: serverTimestamp()
    });

    alert("✅ Ganancia acreditada");
    loadOrders();

  } catch (err) {
    console.error("Error al disponer:", err);
    alert("❌ No se pudo disponer la ganancia");
  }
});
