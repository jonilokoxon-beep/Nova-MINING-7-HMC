// ===============================
// 🔥 IMPORTAR FIREBASE
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

  const balanceBox = document.getElementById("stat-balance");
  const profitBox = document.getElementById("stat-profit");
  const withdrawnBox = document.getElementById("stat-withdrawn");

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const data = userSnap.data();

  const saldo = Number(data.balance || 0);
  const retirado = Number(data.totalWithdrawn || 0);

  let ganancias = 0;

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);

  snap.forEach(d => {
    ganancias += Number(d.data().dailyProfit || 0);
  });

  if (balanceBox) balanceBox.innerText = "$" + saldo.toFixed(2);
  if (profitBox) profitBox.innerText = "$" + ganancias.toFixed(2);
  if (withdrawnBox) withdrawnBox.innerText = "$" + retirado.toFixed(2);
}


// ===============================
// 🛒 PRODUCTOS (CORREGIDO)
// ===============================
async function cargarProductos() {

  const list = document.getElementById("productsList");
  if (!list) return;

  list.innerHTML = "Cargando productos...";

  const snap = await getDocs(collection(db, "products"));

  if (snap.empty) {
    list.innerHTML = "No hay productos disponibles";
    return;
  }

  list.innerHTML = "";

  snap.forEach(docSnap => {

    const p = docSnap.data();

    const nombre = p.name || "Plan " + docSnap.id;
    const precio = p.amount || 0;   // 🔥 antes era price
    const ganancia = p.dailyProfit || 0;
    const duracion = p.duration || 0;

    list.innerHTML += `
      <div class="card">
        <h4>${nombre}</h4>
        <p>Precio: $${precio}</p>
        <p>Ganancia diaria: $${ganancia}</p>
        <p>Duración: ${duracion} días</p>
        <button class="btn-invertir" data-id="${docSnap.id}">
          Invertir
        </button>
      </div>
    `;
  });
}


// ===============================
// 💰 INVERTIR (CORREGIDO)
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
  const precio = p.amount || 0;

  if (saldo < precio) {
    alert("❌ Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: saldo - precio,
    totalInvested: (userSnap.data().totalInvested || 0) + precio
  });

  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    productName: p.name || "Plan " + productId,
    amount: precio,
    dailyProfit: p.dailyProfit || 0,
    duration: p.duration || 0,
    createdAt: serverTimestamp(),
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

  const user = auth.currentUser;
  if (!user) return;

  const container = document.getElementById("ordersList");
  const totalBox = document.getElementById("totalProfit");

  if (!container) return;

  container.innerHTML = "Cargando órdenes...";

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "No tienes órdenes activas";
    if (totalBox) totalBox.innerText = "$0.00";
    return;
  }

  let total = 0;
  container.innerHTML = "";

  snap.forEach(docSnap => {

    const o = docSnap.data();
    total += Number(o.dailyProfit || 0);

    container.innerHTML += `
      <div class="card">
        <h4>${o.productName}</h4>
        <p>Inversión: $${o.amount}</p>
        <p>Ganancia diaria: $${o.dailyProfit}</p>
        <p>Duración: ${o.duration} días</p>
        <p>Estado: ${o.status}</p>
      </div>
    `;
  });

  if (totalBox) totalBox.innerText = "$" + total.toFixed(2);
}


// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = async function () {
  await signOut(auth);
  location.replace("./index.html");
};
