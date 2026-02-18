// ===============================
// 📦 ÓRDENES (SOLO LÓGICA)
// ===============================

// ❌ NADA de initializeApp
// ❌ NADA de firebaseConfig
// ❌ NADA de onAuthStateChanged

import { db, auth } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// 📦 EXPORTAR FUNCIÓN
// ===============================
export async function loadOrders() {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No hay usuario autenticado");
    return;
  }

  const ordersDiv = document.getElementById("ordersList");
  const totalDiv = document.getElementById("totalProfit");

  if (!ordersDiv || !totalDiv) {
    console.warn("No existen los contenedores de órdenes");
    return;
  }

  ordersDiv.innerHTML = "Cargando órdenes...";
  totalDiv.innerText = "$0.00";

  let totalGanancia = 0;

  try {
    const q = query(
      collection(db, "orders"),
      where("userEmail", "==", user.email)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      ordersDiv.innerHTML = "No tienes órdenes activas";
      return;
    }

    ordersDiv.innerHTML = "";

    snap.forEach(doc => {
      const o = doc.data();

      const precio = Number(o.amount) || 0;
      const gananciaDiaria = Number(o.dailyProfit) || precio * 0.05;
      const dias = Number(o.duration) || 30;
      const gananciaTotal = gananciaDiaria * dias;

      totalGanancia += gananciaTotal;

      const inicio = o.createdAt?.toMillis?.() || Date.now();
      const proximoPago = inicio + 24 * 60 * 60 * 1000;

      ordersDiv.innerHTML += `
        <div class="order-card">
          <b>${o.productName || "Producto"}</b><br>
          Inversión: $${precio}<br>
          Ganancia diaria: $${gananciaDiaria.toFixed(2)}<br>
          Duración: ${dias} días<br>
          Total a ganar: $${gananciaTotal.toFixed(2)}<br>
          <div class="timer" data-end="${proximoPago}">--:--:--</div>
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
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        el.innerText = "Disponible";
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      el.innerText = `${h}h ${m}m ${s}s`;
    });
  }, 1000);
}
