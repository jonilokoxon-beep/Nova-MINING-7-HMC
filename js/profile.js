// ===============================
// 🔥 IMPORTAR FIREBASE YA INICIALIZADO
// ===============================
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
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
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===============================
// 📌 NAVEGACIÓN
// ===============================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const page = document.getElementById(id);
  if (page) page.style.display = "block";
};


// ===============================
// 🔐 CONTROL DE SESIÓN
// ===============================
onAuthStateChanged(auth, async user => {
  if (!user) {
    location.replace("./index.html");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      balance: 0,
      totalInvested: 0,
      totalProfit: 0,
      totalWithdrawn: 0,
      createdAt: serverTimestamp()
    });
  }

  // 👑 ACTIVAR ADMIN SOLO PARA TU CORREO
  if (user.email === "joni.lokoxon@gmail.com") {
    activarAdmin();
  }

  go("inicio");
  await cargarProductos();
  await cargarDashboard();
  await loadOrders();
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
  const data = userSnap.data();

  const saldo = Number(data.balance || 0);
  const retirado = Number(data.totalWithdrawn || 0);

  let ganancias = 0;

  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  snap.forEach(d => {
    ganancias += Number(d.data().dailyProfit || 0);
  });

  if (saldoBox) saldoBox.innerText = `$${saldo.toFixed(2)}`;
  if (gananciasBox) gananciasBox.innerText = `$${ganancias.toFixed(2)}`;
  if (retiradoBox) retiradoBox.innerText = `$${retirado.toFixed(2)}`;
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
  const userData = userSnap.data();
  const saldo = Number(userData.balance || 0);

  const prodSnap = await getDoc(doc(db, "products", productId));
  if (!prodSnap.exists()) return;

  const p = prodSnap.data();

  if (saldo < p.price) {
    alert("❌ Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: saldo - p.price,
    totalInvested: (userData.totalInvested || 0) + p.price
  });

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

  await cargarDashboard();
  await loadOrders();
  go("orders");
});


// ===============================
// 📦 ÓRDENES
// ===============================
async function loadOrders() {
  const container = document.getElementById("ordersList");
  if (!container) return;

  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "No tienes órdenes activas";
    return;
  }

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const o = docSnap.data();

    container.innerHTML += `
      <div class="order">
        <h4>${o.productName}</h4>
        <p>Invertido: $${o.amount}</p>
        <p>Ganancia diaria: $${o.dailyProfit}</p>
        <p>Duración: ${o.duration} días</p>
        <p>Estado: ${o.status}</p>
      </div>
    `;
  });
}


// ===============================
// 💰 DEPÓSITO
// ===============================
const depositBtn = document.getElementById("depositBtn");

if (depositBtn) {
  depositBtn.addEventListener("click", async () => {
    const amount = Number(prompt("Ingrese monto a depositar"));
    if (!amount || amount <= 0) return;

    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    const current = Number(snap.data().balance || 0);

    await updateDoc(userRef, {
      balance: current + amount
    });

    alert("✅ Depósito realizado");
    cargarDashboard();
  });
}


// ===============================
// 💸 RETIRO
// ===============================
const withdrawBtn = document.getElementById("withdrawBtn");

if (withdrawBtn) {
  withdrawBtn.addEventListener("click", async () => {
    const amount = Number(prompt("Ingrese monto a retirar"));
    if (!amount || amount <= 0) return;

    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    const current = Number(snap.data().balance || 0);

    if (amount > current) {
      alert("❌ Saldo insuficiente");
      return;
    }

    await updateDoc(userRef, {
      balance: current - amount,
      totalWithdrawn: (snap.data().totalWithdrawn || 0) + amount
    });

    alert("✅ Retiro realizado");
    cargarDashboard();
  });
}


// ===============================
// 👑 ADMIN PRO
// ===============================
function activarAdmin() {
  if (document.getElementById("adminBtn")) return;

  const btn = document.createElement("button");
  btn.id = "adminBtn";
  btn.innerText = "👑 Admin Pro";

  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.padding = "10px 15px";
  btn.style.background = "gold";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.cursor = "pointer";
  btn.style.fontWeight = "bold";
  btn.style.zIndex = "9999";

  btn.onclick = () => {
    alert("Modo Admin Activado 🔥");
  };

  document.body.appendChild(btn);
}


// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = () => {
  signOut(auth).then(() => {
    location.replace("./index.html");
  });
};
