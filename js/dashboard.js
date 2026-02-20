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
import { loadProfile } from "./profile.js";

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
  document.querySelectorAll(".page").forEach(p => {
    p.style.display = "none";
  });

  const page = document.getElementById(id);
  if (page) page.style.display = "block";

  if (id === "profile") loadProfile();
  if (id === "orders") loadOrders();
  if (id === "equipo") cargarEquipo();
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
      vip: 0,
      refBy: null,
      createdAt: serverTimestamp()
    });
  }

  go("inicio");
  await cargarProductos();
  await cargarDashboard();
});

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
// 🎁 SERVICIO DIARIO 24H
// ===============================
document.addEventListener("click", async (e) => {
  if (e.target.id !== "btn-daily") return;

  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  const now = Date.now();
  const lastClaim = data.lastDailyClaim?.toMillis?.() || 0;

  const hoursPassed = (now - lastClaim) / (1000 * 60 * 60);

  if (hoursPassed < 24) {
    const remaining = (24 - hoursPassed).toFixed(1);
    alert(`⏳ Debes esperar ${remaining} horas`);
    return;
  }

  const reward = 5;

  await updateDoc(userRef, {
    balance: (data.balance || 0) + reward,
    lastDailyClaim: serverTimestamp()
  });

  await addDoc(collection(db, "transactions"), {
    uid: user.uid,
    type: "Bono Diario",
    amount: reward,
    createdAt: serverTimestamp()
  });

  alert("🎉 Bono diario recibido +$5");
  cargarDashboard();
});

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
// 💰 INVERTIR + COMISIÓN 10%
// ===============================
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

  // 🔥 COMISIÓN AUTOMÁTICA 10%
  if (userData.refBy) {
    const refRef = doc(db, "users", userData.refBy);
    const refSnap = await getDoc(refRef);

    if (refSnap.exists()) {
      const commission = p.price * 0.10;

      await updateDoc(refRef, {
        balance: (refSnap.data().balance || 0) + commission
      });

      await addDoc(collection(db, "transactions"), {
        uid: userData.refBy,
        type: "Comisión",
        amount: commission,
        createdAt: serverTimestamp()
      });
    }
  }

  alert("✅ Inversión realizada");
  go("orders");
  loadOrders();
  cargarDashboard();
});

// ===============================
// 👥 CARGAR EQUIPO
// ===============================
async function cargarEquipo() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "users"), where("refBy", "==", user.uid));
  const snap = await getDocs(q);

  const teamCount = document.getElementById("teamCount");
  if (teamCount) teamCount.innerText = snap.size;
}

// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = () => signOut(auth).then(() => location.replace("login.html"));
