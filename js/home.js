import { auth, db } from "./firebase.js";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ==========================
// INICIO CUANDO CARGA
// ==========================
auth.onAuthStateChanged(user => {
  if (!user) return;

  loadProducts();
  loadOrders();
  initDaily();
  loadTeamSize();
});


// ==========================
// CARGAR PRODUCTOS
// ==========================
async function loadProducts() {

  const div = document.getElementById("plans");
  if (!div) return;

  div.innerHTML = "Cargando productos...";

  const snap = await getDocs(collection(db, "products"));

  if (snap.empty) {
    div.innerHTML = "No hay productos disponibles";
    return;
  }

  let html = "";

  snap.forEach(d => {
    const p = d.data();

    html += `
      <div class="plan">
        <h3>${p.name}</h3>
        <p>Precio: $${p.price}</p>
        <p>Ganancia diaria: $${p.dailyProfit}</p>
        <button onclick="buyProduct('${d.id}', ${p.price}, ${p.dailyProfit}, ${p.duration})">
          Comprar
        </button>
      </div>
    `;
  });

  div.innerHTML = html;
}


// ==========================
// COMPRAR PRODUCTO
// ==========================
window.buyProduct = async (id, price, dailyProfit, duration) => {

  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const data = userSnap.data();
  const balance = data.balance || 0;

  if (balance < price) {
    alert("Saldo insuficiente");
    return;
  }

  // Descontar saldo
  await updateDoc(userRef, {
    balance: balance - price
  });

  // Crear orden
  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    productId: id,
    dailyProfit: dailyProfit,
    duration: duration,
    status: "active",
    createdAt: serverTimestamp(),
    lastClaim: serverTimestamp()
  });

  alert("Compra exitosa");

  loadOrders();
};


// ==========================
// CARGAR ÓRDENES ACTIVAS
// ==========================
async function loadOrders() {

  const user = auth.currentUser;
  if (!user) return;

  const div = document.getElementById("orders");
  if (!div) return;

  div.innerHTML = "Cargando órdenes...";

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    div.innerHTML = "No tienes órdenes activas";
    return;
  }

  let html = "";

  snap.forEach(d => {
    const o = d.data();

    html += `
      <div class="order">
        <p>Ganancia diaria: $${o.dailyProfit}</p>
        <p>Duración: ${o.duration} días</p>
      </div>
    `;
  });

  div.innerHTML = html;
}



// ==========================
// CHECK IN DIARIO
// ==========================
async function initDaily() {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();

  let streak = data.streak || 0;
  let lastCheck = data.lastCheck || null;
  let balance = data.balance || 0;

  const btn = document.getElementById("checkinBtn");
  if (!btn) return;

  btn.onclick = async () => {

    const today = new Date().toDateString();

    if (lastCheck === today) {
      alert("Ya hiciste check-in hoy");
      return;
    }

    streak += 1;

    let reward = 0;
    if (streak === 7) reward = 15;
    if (streak === 15) reward = 30;
    if (streak === 30) reward = 60;

    const newBalance = balance + reward;

    await updateDoc(userRef, {
      streak,
      lastCheck: today,
      balance: newBalance
    });

    if (reward > 0) {
      await addDoc(collection(db, "transactions"), {
        uid: user.uid,
        type: "daily_bonus",
        amount: reward,
        createdAt: serverTimestamp()
      });
    }

    alert("Check-in exitoso");
  };
}



// ==========================
// EQUIPO ACTIVO
// ==========================
async function loadTeamSize() {

  const user = auth.currentUser;
  if (!user) return;

  const refs = query(
    collection(db, "users"),
    where("referredBy", "==", user.uid)
  );

  const snap = await getDocs(refs);

  let active = 0;

  for (const docSnap of snap.docs) {

    const ordersQ = query(
      collection(db, "orders"),
      where("userId", "==", docSnap.id)
    );

    const ordersSnap = await getDocs(ordersQ);

    if (!ordersSnap.empty) active++;
  }

  const teamEl = document.getElementById("teamSize");
  if (teamEl) teamEl.innerText = active;
}
