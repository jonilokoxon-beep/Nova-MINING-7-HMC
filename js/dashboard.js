// ===============================
// 🔥 FIREBASE IMPORTS
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// ✅ CONFIG REAL (NOVAGROW)
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
// 🚀 INIT
// ===============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// 🔐 AUTH GUARD (SIN LOOP)
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
// 💰 PLANES
// ===============================
async function cargarPlanes() {
  const plansDiv = document.getElementById("plans");
  if (!plansDiv) return;

  plansDiv.innerHTML = "Cargando planes...";

  try {
    const snapshot = await getDocs(collection(db, "products"));
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
