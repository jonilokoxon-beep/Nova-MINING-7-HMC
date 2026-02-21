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
// 🔐 CONTROL DE SESIÓN
// ===============================
onAuthStateChanged(auth, async (user) => {

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

  await cargarDashboard();
  await cargarProductos();
  await cargarOrdenes();
  await cargarPerfil();
});


// ===============================
// 📊 DASHBOARD
// ===============================
async function cargarDashboard() {

  const user = auth.currentUser;
  if (!user) return;

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

  const balanceBox = document.getElementById("stat-balance");
  const profitBox = document.getElementById("stat-profit");
  const withdrawnBox = document.getElementById("stat-withdrawn");

  if (balanceBox) balanceBox.innerText = "$" + saldo.toFixed(2);
  if (profitBox) profitBox.innerText = "$" + ganancias.toFixed(2);
  if (withdrawnBox) withdrawnBox.innerText = "$" + retirado.toFixed(2);
}


// ===============================
// 🛒 PRODUCTOS
// ===============================
async function cargarProductos() {

  const list = document.getElementById("productsList");
  if (!list) return;

  const snap = await getDocs(collection(db, "products"));

  list.innerHTML = "";

  snap.forEach(docSnap => {

    const p = docSnap.data();

    list.innerHTML += `
      <div class="card">
        <h4>${p.name || "Plan " + docSnap.id}</h4>
        <p>Precio: $${p.amount}</p>
        <p>Ganancia diaria: $${p.dailyProfit}</p>
        <p>Duración: ${p.duration} días</p>
        <button onclick="invertir('${docSnap.id}')">
          Invertir
        </button>
      </div>
    `;
  });
}


// ===============================
// 💰 INVERTIR
// ===============================
window.invertir = async function (productId) {

  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const saldo = Number(userSnap.data().balance || 0);

  const prodSnap = await getDoc(doc(db, "products", productId));
  const p = prodSnap.data();

  const precio = Number(p.amount || 0);

  if (saldo < precio) {
    alert("Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: saldo - precio,
    totalInvested: (userSnap.data().totalInvested || 0) + precio
  });

  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    productName: p.name || "Plan",
    amount: precio,
    dailyProfit: p.dailyProfit,
    duration: p.duration,
    status: "active",
    createdAt: serverTimestamp()
  });

  alert("Inversión realizada");

  await cargarDashboard();
  await cargarOrdenes();
};


// ===============================
// 📦 ÓRDENES
// ===============================
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
        <p>Ganancia diaria: $${o.dailyProfit}</p>
        <p>Duración: ${o.duration} días</p>
        <p>Estado: ${o.status}</p>
      </div>
    `;
  });
}


// ===============================
// 👤 PERFIL
// ===============================
async function cargarPerfil() {

  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  const perfilBalance = document.getElementById("perfil-balance");

  if (perfilBalance) {
    perfilBalance.innerText = "$" + Number(data.balance || 0).toFixed(2);
  }
}


// ===============================
// 💸 RETIRO
// ===============================
window.solicitarRetiro = async function () {

  const user = auth.currentUser;
  if (!user) return;

  const input = document.getElementById("montoRetiro");
  const monto = Number(input.value);

  if (!monto || monto <= 0) {
    alert("Monto inválido");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const saldo = snap.data().balance || 0;

  if (monto > saldo) {
    alert("Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: saldo - monto,
    totalWithdrawn: (snap.data().totalWithdrawn || 0) + monto
  });

  await addDoc(collection(db, "withdrawals"), {
    userId: user.uid,
    amount: monto,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Retiro solicitado");
  input.value = "";

  await cargarDashboard();
  await cargarPerfil();
};


// ===============================
// 🎁 INGRESAR CÓDIGO
// ===============================
window.ingresarCodigo = async function () {

  const user = auth.currentUser;
  if (!user) return;

  const codigo = prompt("Ingresa el código:");

  if (!codigo) return;

  const snap = await getDoc(doc(db, "rescueCodes", codigo));

  if (!snap.exists()) {
    alert("Código inválido");
    return;
  }

  const valor = snap.data().amount || 0;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  await updateDoc(userRef, {
    balance: (userSnap.data().balance || 0) + valor
  });

  alert("Código aplicado correctamente");

  await cargarDashboard();
  await cargarPerfil();
};


// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = async function () {
  await signOut(auth);
  location.replace("./index.html");
};
