// ===============================
// 🔥 FIREBASE
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔹 CONFIG REAL
const firebaseConfig = {
  apiKey: "AIzaSyALrk15Qvqrq6zCVTxZ7U9wSnnZIqeSmv4",
  authDomain: "novagrow-app.firebaseapp.com",
  projectId: "novagrow-app",
  storageBucket: "novagrow-app.appspot.com",
  messagingSenderId: "976275033149",
  appId: "1:976275033149:web:e40c6510684bd06c82ae54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// 📦 CARGAR ÓRDENES
// ===============================
onAuthStateChanged(auth, user => {
  if (user) loadOrders(user);
});

async function loadOrders(user) {
  const ordersDiv = document.getElementById("ordersList");
  const totalDiv = document.getElementById("totalProfit");

  if (!ordersDiv) return;

  ordersDiv.innerHTML = "Cargando órdenes...";
  let totalGanancia = 0;

  const q = query(
    collection(db, "orders"),
    where("userEmail", "==", user.email)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    ordersDiv.innerHTML = "No tienes órdenes activas";
    totalDiv.innerText = "$0.00";
    return;
  }

  ordersDiv.innerHTML = "";

  snap.forEach(doc => {
    const o = doc.data();

    const precio = o.amount || 0;
    const gananciaDiaria = precio * 0.05; // 5% ejemplo
    const dias = 30;
    const gananciaTotal = gananciaDiaria * dias;
    totalGanancia += gananciaTotal;

    const inicio = o.createdAt?.toMillis() || Date.now();
    const proximoPago = inicio + 24 * 60 * 60 * 1000;

    ordersDiv.innerHTML += `
      <div class="order-card">
        <div class="order-info">
          <b>${o.productName}</b><br>
          Precio: $${precio}<br>
          Ganancia diaria: $${gananciaDiaria.toFixed(2)}<br>
          Ciclo: ${dias} días<br>
          Ganancia total: $${gananciaTotal.toFixed(2)}<br>
          <div class="timer" data-end="${proximoPago}">--:--:--</div>
        </div>
      </div>
    `;
  });

  totalDiv.innerText = `$${totalGanancia.toFixed(2)}`;
  startTimers();
}

// ===============================
// ⏱ CONTADORES
// ===============================
function startTimers() {
  setInterval(() => {
    document.querySelectorAll(".timer").forEach(el => {
      const end = parseInt(el.dataset.end);
      const now = Date.now();
      let diff = end - now;

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
