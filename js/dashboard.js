// =====================================================
// 🔥 FIREBASE CONFIG (V10 MODULAR)
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// =====================================================
// 📌 DETECTAR PÁGINA
// =====================================================
const path = window.location.pathname;

// =====================================================
// 🔐 LOGIN (INDEX)
// =====================================================
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Completa todos los campos");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (error) {
      alert("Error: " + error.message);
    }
  });
}

// =====================================================
// 📝 REGISTRO
// =====================================================
window.register = async function () {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Completa todos los campos");
    return;
  }

  try {

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email: email,
      balance: 0,
      totalInvested: 0,
      totalProfit: 0,
      totalWithdrawn: 0,
      level: 0,
      role: "user",
      createdAt: serverTimestamp()
    });

    window.location.href = "dashboard.html";

  } catch (error) {
    alert("Error: " + error.message);
  }
};

// =====================================================
// 🔐 PROTEGER DASHBOARD
// =====================================================
if (path.includes("dashboard.html")) {

  onAuthStateChanged(auth, async user => {

    if (!user) {
      location.replace("./index.html");
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const userData = snap.data();
    window.currentUserData = userData;

    activarBotonAdmin(userData);

    go("inicio");
    await cargarDashboard();
    await cargarProductos();
    await cargarOrdenes();
    await cargarPerfil();
    await cargarHistorial();
  });
}

// =====================================================
// 🔐 PROTEGER ADMIN
// =====================================================
if (path.includes("admin.html")) {

  onAuthStateChanged(auth, async user => {

    if (!user) {
      location.replace("./index.html");
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const userData = snap.data();

    if (userData.role !== "admin") {
      alert("Acceso no autorizado");
      location.replace("./dashboard.html");
    }
  });
}

// =====================================================
// ⚙ BOTÓN ADMIN
// =====================================================
function activarBotonAdmin(userData) {

  const btn = document.getElementById("adminFab");
  if (!btn) return;

  if (userData?.role === "admin") {
    btn.style.display = "flex";
    btn.onclick = () => location.href = "admin.html";
  } else {
    btn.style.display = "none";
  }
}

// =====================================================
// 📌 NAVEGACIÓN
// =====================================================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const page = document.getElementById(id);
  if (page) page.style.display = "block";
};

// =====================================================
// 📊 DASHBOARD
// =====================================================
async function cargarDashboard() {

  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  document.getElementById("stat-balance")?.innerText =
    Number(data.balance || 0).toFixed(2);

  document.getElementById("stat-withdrawn")?.innerText =
    Number(data.totalWithdrawn || 0).toFixed(2);
}

// =====================================================
// 💰 PRODUCTOS
// =====================================================
async function cargarProductos() {

  const list = document.getElementById("productsList");
  if (!list) return;

  const snap = await getDocs(collection(db, "products"));
  list.innerHTML = "";

  snap.forEach(docSnap => {
    const p = docSnap.data();

    list.innerHTML += `
      <div class="card">
        <h4>${p.name}</h4>
        <p>Precio: $${p.price}</p>
        <button class="btn-invertir" data-id="${docSnap.id}">
          Invertir
        </button>
      </div>
    `;
  });
}

// =====================================================
// 📦 ÓRDENES
// =====================================================
async function cargarOrdenes() {

  const user = auth.currentUser;
  if (!user) return;

  const container = document.getElementById("ordersList");
  if (!container) return;

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid)
  );

  const snap = await getDocs(q);
  container.innerHTML = "";

  snap.forEach(docSnap => {
    const o = docSnap.data();

    container.innerHTML += `
      <div class="card">
        <h4>${o.productName}</h4>
        <p>Inversión: $${o.amount}</p>
      </div>
    `;
  });
}

// =====================================================
// 👤 PERFIL
// =====================================================
async function cargarPerfil() {

  const user = auth.currentUser;
  if (!user) return;

  document.getElementById("p-id")?.innerText =
    user.uid.slice(0, 8);
}

// =====================================================
// 🚪 LOGOUT
// =====================================================
window.logout = async function () {
  await signOut(auth);
  location.replace("./index.html");
};
