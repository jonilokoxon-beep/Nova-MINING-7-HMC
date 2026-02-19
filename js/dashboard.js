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
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");

  const page = document.getElementById(id);
  if (page) page.style.display = "block";

  if (id === "profile") loadProfile();
  if (id === "orders") loadOrders();
  if (id === "equipoPage") cargarEquipo();
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
      totalInvested: 0,
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

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const saldo = Number(userData.balance || 0);

  let ganancias = 0;
  let totalInvertido = 0;

  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  snap.forEach(d => {
    ganancias += Number(d.data().dailyProfit || 0);
    totalInvertido += Number(d.data().amount || 0);
  });

  // 🔥 VIP AUTOMÁTICO
  let vip = 0;
  if (totalInvertido >= 100) vip = 1;
  if (totalInvertido >= 500) vip = 2;
  if (totalInvertido >= 1000) vip = 3;
  if (totalInvertido >= 3000) vip = 4;
  if (totalInvertido >= 5000) vip = 5;

  await updateDoc(userRef, { vip });

  document.getElementById("stat-balance").innerText = saldo.toFixed(2);
  document.getElementById("stat-profit").innerText = ganancias.toFixed(2);
  document.getElementById("stat-withdrawn").innerText = "0.00";
}

// ===============================
// 🎁 CHECK-IN 24 HORAS
// ===============================
document.addEventListener("click", async (e) => {
  if (e.target.id !== "btn-daily") return;

  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  const now = Date.now();
  const last = data.lastDailyClaim?.toMillis?.() || 0;

  if (now - last < 86400000) {
    alert("⏳ Ya hiciste tu check-in hoy");
    return;
  }

  await updateDoc(userRef, {
    balance: (data.balance || 0) + 5,
    lastDailyClaim: serverTimestamp()
  });

  await addDoc(collection(db, "transactions"), {
    uid: user.uid,
    type: "Bono Diario",
    amount: 5,
    createdAt: serverTimestamp()
  });

  alert("🎉 Recibiste $5");
  cargarDashboard();
});

// ===============================
// 💰 DEPÓSITO
// ===============================
window.closeDeposit = function () {
  document.getElementById("depositModal").style.display = "none";
};

document.getElementById("btn-deposit")?.addEventListener("click", () => {
  document.getElementById("depositModal").style.display = "block";
});

document.getElementById("confirmDeposit")?.addEventListener("click", async () => {
  const amount = Number(document.getElementById("depositAmount").value);
  const user = auth.currentUser;
  if (!user || amount <= 0) return alert("Monto inválido");

  await addDoc(collection(db, "deposits"), {
    uid: user.uid,
    amount,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("✅ Depósito enviado");
  closeDeposit();
});

// ===============================
// 💸 RETIRO
// ===============================
document.getElementById("btn-withdraw")?.addEventListener("click", async () => {
  const amount = Number(prompt("Ingrese monto a retirar"));
  const user = auth.currentUser;
  if (!user || amount <= 0) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const balance = Number(snap.data().balance || 0);

  if (amount > balance) {
    alert("❌ Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: balance - amount
  });

  await addDoc(collection(db, "withdrawals"), {
    uid: user.uid,
    amount,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("✅ Retiro solicitado");
  cargarDashboard();
});

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
    status: "active"
  });

  // 🔥 COMISIÓN 10%
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
// 👥 EQUIPO (SOLO ACTIVOS)
// ===============================
async function cargarEquipo() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "users"), where("refBy", "==", user.uid));
  const snap = await getDocs(q);

  let activos = 0;

  for (const docSnap of snap.docs) {
    const member = docSnap.data();
    const ordersQ = query(collection(db, "orders"), where("uid", "==", member.uid));
    const ordersSnap = await getDocs(ordersQ);

    if (!ordersSnap.empty) activos++;
  }

  const teamCount = document.getElementById("teamCount");
  if (teamCount) teamCount.innerText = activos;
}

// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = () => signOut(auth).then(() => location.replace("login.html"));
