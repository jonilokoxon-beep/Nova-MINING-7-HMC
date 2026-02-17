<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nova MINING 7 HMC</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

<header class="top">
  <span>Nova <b>MINING 7</b> HMC</span>
  <button onclick="logout()">Salir</button>
</header>

<div class="stats">
  <div class="box blue">
    Saldo<br><b>$0.00</b>
  </div>
  <div class="box green">
    Ganancias<br><b>$0.00</b>
  </div>
  <div class="box gold">
    Retirado<br><b>$0.00</b>
  </div>
</div>

<!-- ===== SECCIONES ===== -->

<section id="inicio" class="page">
  <h3 style="padding:15px">Inicio</h3>
  <p style="padding:15px">VIP · Registro Diario · Depósito · Retiro · Tamaño del equipo</p>
</section>

<section id="productos" class="page">
  <h3 style="padding:15px">Planes de Inversión</h3>
  <div class="plans" id="plans"></div>
</section>

<!-- ===== NAV ===== -->
<nav class="bottom">
  <span onclick="go('inicio')">Inicio</span>
  <span onclick="go('productos')">Productos</span>
  <span>Órdenes</span>
  <span>Cuenta</span>
</nav>
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔹 CONFIG FIREBASE (usa la tuya)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO",
  projectId: "TU_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔹 EVITA PARPADEO: espera sesión
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    cargarPlanes();
  }
});

// 🔹 CARGAR PLANES
async function cargarPlanes() {
  const plansDiv = document.getElementById("plans");
  plansDiv.innerHTML = "Cargando planes...";

  const snapshot = await getDocs(collection(db, "planes"));
  plansDiv.innerHTML = "";

  snapshot.forEach(doc => {
    const p = doc.data();
    plansDiv.innerHTML += `
      <div class="plan ${p.tipo}">
        <h4>${p.nombre}</h4>
        <p>$${p.precio}</p>
        <button>Invertir</button>
      </div>
    `;
  });
}

// 🔹 LOGOUT
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};
  
<!-- SOLO ESTE SCRIPT -->
<script type="module" src="js/dashboard.js"></script>

</body>
</html>
