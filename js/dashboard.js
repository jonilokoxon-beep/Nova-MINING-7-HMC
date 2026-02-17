// ===============================
// 🔥 FIREBASE IMPORTS
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// 🔹 CONFIG FIREBASE (USA LA TUYA)
// ===============================
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// 🔐 PROTECCIÓN DE SESIÓN
// ===============================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
  } else {
    mostrarInicio();
    cargarPlanes();
  }
});

// ===============================
// 📌 NAVEGACIÓN ENTRE SECCIONES
// ===============================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => {
    p.style.display = "none";
  });

  const page = document.getElementById(id);
  if (page) {
    page.style.display = "block";
  }
};

function mostrarInicio() {
  go("inicio");
}

// ===============================
// 💰 CARGAR PLANES DESDE FIRESTORE
// ===============================
async function cargarPlanes() {
  const plansDiv = document.getElementById("plans");
  if (!plansDiv) return;

  plansDiv.innerHTML = "Cargando planes...";

  try {
    const snapshot = await getDocs(collection(db, "planes"));
    plansDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const p = doc.data();
      plansDiv.innerHTML += `
        <div class="plan ${p.tipo || ''}">
          <h4>${p.nombre}</h4>
          <p>$${p.precio}</p>
          <p>${p.ingreso || ''}</p>
          <button>Invertir</button>
        </div>
      `;
    });
  } catch (e) {
    plansDiv.innerHTML = "Error al cargar planes";
    console.error(e);
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
