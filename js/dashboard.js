// =====================================================
// 🔥 FIREBASE CONFIG (V10 MODULAR)
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
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
// 📌 NAVEGACIÓN
// =====================================================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const page = document.getElementById(id);
  if (page) page.style.display = "block";
};

// =====================================================
// 🔐 CONTROL GLOBAL DE SESIÓN
// =====================================================
onAuthStateChanged(auth, async user => {

  if (!user) {
    location.replace("./index.html");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  let snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      balance: 0,
      totalInvested: 0,
      totalProfit: 0,
      totalWithdrawn: 0,
      level: 0,
      role: "user",
      createdAt: serverTimestamp()
    });
    snap = await getDoc(userRef);
  }

  const userData = snap.data();
  window.currentUserData = userData;

  activarBotonAdmin(userData);

  go("inicio");

  await cargarDashboard();
  await cargarProductos();
  await cargarOrdenes();
  await cargarPerfil();
  await cargarExtras();
  await cargarHistorial();
});

// =====================================================
// ⚙ BOTÓN ADMIN
// =====================================================
function activarBotonAdmin(userData) {

  const btn = document.getElementById("adminFab");
  if (!btn) return;

  if (userData.role === "admin") {
    btn.style.display = "flex";
    btn.onclick = () => location.href = "admin.html";
  } else {
    btn.style.display = "none";
  }
}

// =====================================================
// 📊 DASHBOARD
// =====================================================
async function cargarDashboard() {

  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  const saldo = Number(data.balance || 0);
  const retirado = Number(data.totalWithdrawn || 0);

  let ganancias = 0;

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid),
    where("status", "==", "active")
  );

  const snapOrders = await getDocs(q);
  snapOrders.forEach(d => {
    ganancias += Number(d.data().dailyProfit || 0);
  });

  document.getElementById("stat-balance")?.innerText = "$" + saldo.toFixed(2);
  document.getElementById("stat-profit")?.innerText = "$" + ganancias.toFixed(2);
  document.getElementById("stat-withdrawn")?.innerText = "$" + retirado.toFixed(2);
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
    const price = Number(p.price ?? 0);
    const profit = Number(p.dailyProfit ?? 0);
    const duration = Number(p.duration ?? 0);

    list.innerHTML += `
      <div class="card">
        <h4>${p.name}</h4>
        <p>Precio: $${price}</p>
        <p>Ganancia diaria: $${profit}</p>
        <p>Duración: ${duration} días</p>
        <button class="btn-invertir" data-id="${docSnap.id}">
          Invertir
        </button>
      </div>
    `;
  });
}

// =====================================================
// 💸 INVERTIR
// =====================================================
document.addEventListener("click", async (e) => {

  if (!e.target.classList.contains("btn-invertir")) return;

  const productId = e.target.dataset.id;
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const saldo = Number(userData.balance || 0);
  const prodSnap = await getDoc(doc(db, "products", productId));
  const p = prodSnap.data();

  const precio = Number(p.price || 0);
  const profit = Number(p.dailyProfit || 0);

  if (saldo < precio) {
    alert("Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: saldo - precio,
    totalInvested: (userData.totalInvested || 0) + precio
  });

  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    productName: p.name,
    amount: precio,
    dailyProfit: profit,
    duration: p.duration ?? 0,
    status: "active",
    createdAt: serverTimestamp()
  });

  alert("Inversión realizada");

  await cargarDashboard();
  await cargarOrdenes();
});

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
    where("userId", "==", user.uid),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);
  container.innerHTML = "";

  snap.forEach(docSnap => {
    const o = docSnap.data();

    container.innerHTML += `
      <div class="card">
        <h4>${o.productName}</h4>
        <p>Inversión: $${Number(o.amount)}</p>
        <p>Ganancia diaria: $${Number(o.dailyProfit)}</p>
        <p>Duración: ${o.duration} días</p>
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

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  document.getElementById("p-id")?.innerText = user.uid.slice(0, 8);
  document.getElementById("p-balance")?.innerText =
    Number(data.balance || 0).toFixed(2);
}

// =====================================================
// 📜 HISTORIAL RETIROS
// =====================================================
async function cargarHistorial() {

  const user = auth.currentUser;
  if (!user) return;

  const box = document.getElementById("transactionHistory");
  if (!box) return;

  box.innerHTML = "";

  const snap = await getDocs(
    query(collection(db, "withdrawals"), where("userId", "==", user.uid))
  );

  snap.forEach(d => {
    const w = d.data();
    box.innerHTML += `
      <div style="padding:5px;">
        Retiro: $${w.amount} - ${w.status}
      </div>
    `;
  });
}

// =====================================================
// 🚪 LOGOUT
// =====================================================
window.logout = async function () {
  await signOut(auth);
  location.replace("./index.html");
};
