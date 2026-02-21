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
      totalProfit: 0,
      totalWithdrawn: 0,
      level: 0,
      createdAt: serverTimestamp()
    });
  }

  if (user.email === ADMIN_EMAIL) {
    const btn = document.getElementById("adminBtn");
    if (btn) btn.style.display = "block";
    cargarAdminPanel();
  }

  go("inicio");

  await cargarProductos();
  await cargarDashboard();
  await cargarOrdenes();
  await cargarPerfil();
  await cargarExtras();
});


// ===============================
// 📊 DASHBOARD
// ===============================
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

  document.getElementById("stat-balance").innerText = saldo.toFixed(2);
  document.getElementById("stat-profit").innerText = ganancias.toFixed(2);
  document.getElementById("stat-withdrawn").innerText = retirado.toFixed(2);
}


// ===============================
// 🔱 VIP + EQUIPO + BONOS
// ===============================
async function cargarExtras() {

  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  const totalInv = Number(data.totalInvested || 0);

  let level = 0;
  if (totalInv >= 5000) level = 4;
  else if (totalInv >= 2000) level = 3;
  else if (totalInv >= 1000) level = 2;
  else if (totalInv >= 200) level = 1;

  if (data.level !== level) {
    await updateDoc(userRef, { level });
  }

  const vipBox = document.getElementById("vip-level");
  if (vipBox) vipBox.innerText = "VIP " + level;

  const q = query(
    collection(db, "users"),
    where("referrerId", "==", user.uid)
  );

  const teamSnap = await getDocs(q);
  const teamSize = teamSnap.size;

  const teamBox = document.getElementById("team-size");
  if (teamBox) teamBox.innerText = teamSize;

  const bonusBox = document.getElementById("team-bonus");
  if (bonusBox) bonusBox.innerText = "$" + (teamSize * 2).toFixed(2);

  const today = new Date().toDateString();
  const giftBox = document.getElementById("daily-gift");

  if (data.lastGift === today) {
    if (giftBox) giftBox.innerText = "Ya reclamado";
  } else {
    if (giftBox) giftBox.innerText = "Disponible";
  }
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
        <p>Ganancia diaria: $${p.dailyProfit}</p>
        <p>Duración: ${p.duration} días</p>
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
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const saldo = Number(userData.balance || 0);

  const prodSnap = await getDoc(doc(db, "products", productId));
  const p = prodSnap.data();

  if (saldo < p.amount) {
    alert("Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: saldo - p.amount,
    totalInvested: (userData.totalInvested || 0) + p.amount
  });

  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    productName: p.name,
    amount: p.amount,
    dailyProfit: p.dailyProfit,
    duration: p.duration,
    status: "active",
    createdAt: serverTimestamp()
  });

  alert("Inversión realizada");

  await cargarDashboard();
  await cargarExtras();
  await cargarOrdenes();
});


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
    where("userId", "==", user.uid),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);

  container.innerHTML = "";

  let total = 0;

  snap.forEach(docSnap => {
    const o = docSnap.data();
    total += Number(o.dailyProfit || 0);

    container.innerHTML += `
      <div class="card">
        <h4>${o.productName}</h4>
        <p>Inversión: $${o.amount}</p>
        <p>Ganancia diaria: $${o.dailyProfit}</p>
        <p>Duración: ${o.duration} días</p>
      </div>
    `;
  });

  const totalBox = document.getElementById("totalProfit");
  if (totalBox) totalBox.innerText = "$" + total.toFixed(2);
}


// ===============================
// 👤 PERFIL
// ===============================
async function cargarPerfil() {

  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  document.getElementById("p-id").innerText = user.uid.slice(0, 8);
  document.getElementById("p-balance").innerText =
    Number(data.balance || 0).toFixed(2);
}
