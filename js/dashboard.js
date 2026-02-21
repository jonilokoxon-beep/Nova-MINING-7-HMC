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

const ADMIN_EMAIL = "joni.lokoxon@gmail.com";


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
      totalWithdrawn: 0,
      createdAt: serverTimestamp()
    });
  }

  // Mostrar botón admin solo a ti
  if (user.email === ADMIN_EMAIL) {
    const btn = document.getElementById("adminBtn");
    if (btn) btn.style.display = "block";
    cargarAdminPanel();
  }

  go("inicio");

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
  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  document.getElementById("stat-balance").innerText =
    "$" + Number(data.balance || 0).toFixed(2);
}


// ===============================
// 💰 PRODUCTOS
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
        <h4>${p.name}</h4>
        <p>Precio: $${p.amount}</p>
        <button class="btn-invertir" data-id="${docSnap.id}">
          Invertir
        </button>
      </div>
    `;
  });
}


// ===============================
// 💸 INVERTIR
// ===============================
document.addEventListener("click", async (e) => {

  if (!e.target.classList.contains("btn-invertir")) return;

  const productId = e.target.dataset.id;
  const user = auth.currentUser;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const saldo = Number(userSnap.data().balance || 0);

  const prodSnap = await getDoc(doc(db, "products", productId));
  const p = prodSnap.data();

  if (saldo < p.amount) {
    alert("Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: saldo - p.amount
  });

  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    productName: p.name,
    amount: p.amount,
    status: "active",
    createdAt: serverTimestamp()
  });

  alert("Inversión realizada");
  cargarDashboard();
});


// ===============================
// 💸 RETIRO 17% + ADMIN
// ===============================
window.solicitarRetiro = async function () {

  const user = auth.currentUser;
  const monto = Number(document.getElementById("withdrawAmount").value);

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const saldo = snap.data().balance;

  if (monto > saldo) {
    alert("Saldo insuficiente");
    return;
  }

  const fee = monto * 0.17;
  const finalAmount = monto - fee;

  await updateDoc(userRef, {
    balance: saldo - monto
  });

  await addDoc(collection(db, "withdrawals"), {
    userId: user.uid,
    amountRequested: monto,
    fee: fee,
    amountToPay: finalAmount,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Retiro enviado al admin");
  cargarDashboard();
};


// ===============================
// 💰 DEPÓSITOS
// ===============================
window.hacerDeposito = async function () {

  const user = auth.currentUser;
  const monto = Number(prompt("Monto a depositar:"));

  if (!monto || monto <= 0) return;

  await addDoc(collection(db, "deposits"), {
    userId: user.uid,
    amount: monto,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Depósito enviado al admin");
};


// ===============================
// 👑 PANEL ADMIN
// ===============================
async function cargarAdminPanel() {

  const wContainer = document.getElementById("admin-withdrawals");
  const dContainer = document.getElementById("admin-deposits");

  // Retiros
  const wSnap = await getDocs(
    query(collection(db, "withdrawals"), where("status", "==", "pending"))
  );

  wContainer.innerHTML = "";
  wSnap.forEach(docSnap => {
    const w = docSnap.data();

    wContainer.innerHTML += `
      <div class="card">
        <p>User: ${w.userId}</p>
        <p>Monto: $${w.amountRequested}</p>
        <button onclick="aprobarRetiro('${docSnap.id}')">Aprobar</button>
        <button onclick="rechazarRetiro('${docSnap.id}','${w.userId}',${w.amountRequested})">Rechazar</button>
      </div>
    `;
  });

  // Depósitos
  const dSnap = await getDocs(
    query(collection(db, "deposits"), where("status", "==", "pending"))
  );

  dContainer.innerHTML = "";
  dSnap.forEach(docSnap => {
    const d = docSnap.data();

    dContainer.innerHTML += `
      <div class="card">
        <p>User: ${d.userId}</p>
        <p>Monto: $${d.amount}</p>
        <button onclick="aprobarDeposito('${docSnap.id}','${d.userId}',${d.amount})">Aprobar</button>
      </div>
    `;
  });
}


// ===============================
// ✔ APROBAR RETIRO
// ===============================
window.aprobarRetiro = async function (id) {

  await updateDoc(doc(db, "withdrawals", id), {
    status: "approved"
  });

  cargarAdminPanel();
};


// ===============================
// ❌ RECHAZAR RETIRO (REEMBOLSO)
// ===============================
window.rechazarRetiro = async function (id, userId, amount) {

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  await updateDoc(userRef, {
    balance: snap.data().balance + amount
  });

  await updateDoc(doc(db, "withdrawals", id), {
    status: "rejected"
  });

  cargarAdminPanel();
};


// ===============================
// ✔ APROBAR DEPÓSITO
// ===============================
window.aprobarDeposito = async function (id, userId, amount) {

  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);

  await updateDoc(userRef, {
    balance: snap.data().balance + amount
  });

  await updateDoc(doc(db, "deposits", id), {
    status: "approved"
  });

  cargarAdminPanel();
};


// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = async function () {
  await signOut(auth);
  location.replace("./index.html");
};
