// ===============================
// 🔥 FIREBASE IMPORTS
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// 🔹 CONFIG FIREBASE REAL
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
// 🔐 SESIÓN
// ===============================
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
  } else {
    go("inicio");
    cargarPlanes();
  }
});

// ===============================
// 📌 NAVEGACIÓN
// ===============================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => {
    p.style.display = "none";
  });
  const page = document.getElementById(id);
  if (page) page.style.display = "block";
};

// ===============================
// 💰 CARGAR PLANES
// ===============================
async function cargarPlanes() {
  const plansDiv = document.getElementById("plans");
  if (!plansDiv) return;

  plansDiv.innerHTML = "Cargando planes...";

  try {
    const snapshot = await getDocs(collection(db, "products"));

    if (snapshot.empty) {
      plansDiv.innerHTML = "No hay planes disponibles";
      return;
    }

    plansDiv.innerHTML = "";

    snapshot.forEach(doc => {
      const p = doc.data();
      plansDiv.innerHTML += `
        <div class="plan ${p.tipo}">
          <h4>${p.nombre}</h4>
          <p>$${p.precio}</p>
          <p>${p.ingreso}</p>
          <button>Invertir</button>
        </div>
      `;
    });

  } catch (error) {
    console.error("Firestore error:", error);
    plansDiv.innerHTML = "Error al cargar planes";
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
