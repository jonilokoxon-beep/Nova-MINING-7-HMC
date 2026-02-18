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
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// 📌 NAVEGACIÓN
// ===============================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const page = document.getElementById(id);
  if (page) page.style.display = "block";
};

// ===============================
// 🔐 SESIÓN
// ===============================
onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("login.html");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      balance: 0,
      createdAt: serverTimestamp()
    });
  }

  go("inicio");
  await cargarProductos();
  await cargarDashboard();
  await loadProfile();
  loadOrders(); // 👈 SOLO UNA FUENTE DE ÓRDENES
});


// ===============================
// 👤 PERFIL USUARIO
// ===============================
async function cargarPerfil() {
  const user = auth.currentUser;
  if (!user) return;

  const emailEl = document.getElementById("p-email");
  const uidEl = document.getElementById("p-uid");
  const balanceEl = document.getElementById("p-balance");
  const earnedEl = document.getElementById("p-earned");
  const activeEl = document.getElementById("p-active");
  const finishedEl = document.getElementById("p-finished");
  const dateEl = document.getElementById("p-date");

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const u = userSnap.data();

  emailEl.innerText = user.email;
  uidEl.innerText = user.uid;
  balanceEl.innerText = Number(u.balance || 0).toFixed(2);

  // 🔢 ÓRDENES
  let totalEarned = 0;
  let active = 0;
  let finished = 0;

  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  snap.forEach(d => {
    const o = d.data();
    if (o.status === "active") active++;
    if (o.status === "finished") finished++;
    totalEarned += Number(o.dailyProfit || 0) * Number(o.duration || 0);
  });

  earnedEl.innerText = totalEarned.toFixed(2);
  activeEl.innerText = active;
  finishedEl.innerText = finished;

  if (u.createdAt?.toDate) {
    dateEl.innerText = u.createdAt.toDate().toLocaleDateString();
  }
}

// ===============================
// 📊 DASHBOARD
// ===============================
async function cargarDashboard() {
  const user = auth.currentUser;
  if (!user) return;

  const saldoBox = document.querySelector(".box.blue b");
  const gananciasBox = document.querySelector(".box.green b");
  const retiradoBox = document.querySelector(".box.gold b");

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const saldo = Number(userSnap.data().balance || 0);

  let ganancias = 0;

  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  snap.forEach(d => {
    ganancias += Number(d.data().dailyProfit || 0);
  });

  saldoBox.innerText = `$${saldo.toFixed(2)}`;
  gananciasBox.innerText = `$${ganancias.toFixed(2)}`;
  retiradoBox.innerText = `$0.00`;
}

// ===============================
// 🛒 PRODUCTOS
// ===============================
async function cargarProductos() {
  const list = document.getElementById("productsList");
  if (!list) return;

  list.innerHTML = "Cargando productos...";

  const snap = await getDocs(collection(db, "products"));

  if (snap.empty) {
    list.innerHTML = "No hay productos";
    return;
  }

  list.innerHTML = "";

  snap.forEach(docSnap => {
    const p = docSnap.data();
    if (!p.active) return;

    list.innerHTML += `
      <div class="plan">
        <h4>${p.name}</h4>
        <p>Precio: $${p.price}</p>
        <p>Ganancia diaria: $${p.profit}</p>
        <p>Duración: ${p.duration} días</p>
        <button class="btn-invertir" data-id="${docSnap.id}">
          Invertir
        </button>
      </div>
    `;
  });
}

// ===============================
// 💰 INVERTIR
// ===============================
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-invertir")) return;

  const productId = e.target.dataset.id;
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const saldo = Number(userSnap.data().balance || 0);

  const prodSnap = await getDoc(doc(db, "products", productId));
  if (!prodSnap.exists()) return;

  const p = prodSnap.data();
  if (saldo < p.price) {
    alert("❌ Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, { balance: saldo - p.price });

  await addDoc(collection(db, "orders"), {
    uid: user.uid,
    productName: p.name,
    amount: p.price,
    dailyProfit: p.profit,
    duration: p.duration,
    createdAt: serverTimestamp(),
    lastClaim: serverTimestamp(),
    status: "active"
  });

  alert("✅ Inversión realizada");
  loadOrders();
  cargarDashboard();
  go("orders");
});

// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = () => signOut(auth).then(() => location.replace("login.html"));
