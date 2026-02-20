// ===============================
// 🔥 FIREBASE IMPORTS
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 📦 ÓRDENES
import { loadOrders } from "./orders.js";

// ===============================
// 🔹 CONFIG FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyALrk15Qvqrq6zCVTxZ7U9wSnnZIqeSmv4",
  authDomain: "novagrow-app.firebaseapp.com",
  projectId: "novagrow-app",
  storageBucket: "novagrow-app.appspot.com",
  messagingSenderId: "976275033149",
  appId: "1:976275033149:web:e40c6510684bd06c82ae54"
};

// ===============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// 📌 NAVEGACIÓN GLOBAL
// ===============================
window.go = async function (id) {
  document.querySelectorAll(".page").forEach(p => {
    p.style.display = "none";
  });

  const page = document.getElementById(id);
  if (page) page.style.display = "block";

  // 🔥 LÓGICA POR SECCIÓN
  if (id === "orders") {
    await loadOrders();
  }

  if (id === "productos") {
    await cargarPlanes();
  }
};

// ===============================
// 🔐 SESIÓN
// ===============================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  // ⏳ Esperar DOM
  setTimeout(() => {
    go("inicio");
  }, 100);
});

// ===============================
// 💰 CARGAR PRODUCTOS
// ===============================
async function cargarPlanes() {
  const productsDiv = document.getElementById("productsList");

  if (!productsDiv) {
    console.error("❌ No existe #productsList");
    return;
  }

  productsDiv.innerHTML = "Cargando productos...";

  try {
    const snapshot = await getDocs(collection(db, "products"));

    if (snapshot.empty) {
      productsDiv.innerHTML = "No hay productos disponibles";
      return;
    }

    productsDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const p = doc.data();
      if (p.active !== true) return;

      productsDiv.innerHTML += `
        <div class="plan">
          <h4>${p.name}</h4>
          <p>Precio: $${p.price}</p>
          <p>Ganancia diaria: $${p.profit}</p>
          <p>Duración: ${p.duration} días</p>
          <button onclick="alert('Invertir próximamente')">
            Invertir
          </button>
        </div>
      `;
    });

  } catch (err) {
    console.error("🔥 Firestore:", err);
    productsDiv.innerHTML = "Error al cargar productos";
  }
}

// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = function () {
  signOut(auth).then(() => {
    window.location.replace("login.html");
  });
};
