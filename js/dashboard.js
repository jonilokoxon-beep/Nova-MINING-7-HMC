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
      level: 0,
      createdAt: serverTimestamp()
    });
  }

  // 🔐 ACTIVAR ADMIN (CAMBIA TU CORREO)
  if (user.email === "TU_CORREO_ADMIN@gmail.com") {
    document.getElementById("adminBtn").style.display = "inline-block";
    cargarAdmin();
  }

  go("inicio");

  await cargarProductos();
  await cargarDashboard();
  await cargarOrdenes();
  await cargarPerfil();
  await cargarExtras();
  await cargarHistorial();
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
// 🔱 VIP + EQUIPO
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

  await updateDoc(userRef, { level });

  document.getElementById("vip-level")?.innerText = "VIP " + level;
  document.getElementById("p-vip").innerText = level;

  // 👥 EQUIPO
  const q = query(collection(db, "users"), where("referrerId", "==", user.uid));
  const teamSnap = await getDocs(q);

  const teamSize = teamSnap.size;
  document.getElementById("team-size")?.innerText = teamSize;
  document.getElementById("teamCountHome").innerText = teamSize;
}


// ===============================
// 💰 PRODUCTOS (ANTI-UNDEFINED)
// ===============================
async function cargarProductos() {

  const list = document.getElementById("productsList");
  if (!list) return;

  const snap = await getDocs(collection(db, "products"));
  list.innerHTML = "";

  snap.forEach(docSnap => {

    const p = docSnap.data();

    const precio = p.amount ?? p.price ?? 0;
    const ganancia = p.dailyProfit ?? p.profit ?? 0;
    const duracion = p.duration ?? p.days ?? 0;

    list.innerHTML += `
      <div class="card">
        <h4>${p.name || "Producto"}</h4>
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

  const prodSnap = await getDoc(doc(db, "products", productId));
  const p = prodSnap.data();

  const precio = p.amount ?? p.price ?? 0;

  if (userData.balance < precio) {
    alert("Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: userData.balance - precio,
    totalInvested: (userData.totalInvested || 0) + precio
  });

  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    productName: p.name,
    amount: precio,
    dailyProfit: p.dailyProfit ?? p.profit ?? 0,
    duration: p.duration ?? p.days ?? 0,
    status: "active",
    createdAt: serverTimestamp()
  });

  alert("Inversión realizada");

  await cargarDashboard();
  await cargarOrdenes();
  await cargarExtras();
});


// ===============================
// 📦 ÓRDENES
// ===============================
async function cargarOrdenes() {

  const user = auth.currentUser;
  if (!user) return;

  const container = document.getElementById("ordersList");
  const totalBox = document.getElementById("totalProfit");
  if (!container) return;

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid)
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
        <p>Estado: ${o.status}</p>
      </div>
    `;
  });

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


// ===============================
// 💳 DEPÓSITO
// ===============================
document.getElementById("btn-deposit")?.addEventListener("click", () => {
  document.getElementById("depositModal").style.display = "block";
});

window.closeDeposit = function () {
  document.getElementById("depositModal").style.display = "none";
};

document.getElementById("confirmDeposit")?.addEventListener("click", async () => {

  const user = auth.currentUser;
  const amount = Number(document.getElementById("depositAmount").value);

  if (!amount || amount <= 0) {
    alert("Monto inválido");
    return;
  }

  await addDoc(collection(db, "deposits"), {
    userId: user.uid,
    amount,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Depósito enviado para aprobación");
  closeDeposit();
});


// ===============================
// 💸 RETIRO 17%
// ===============================
document.getElementById("withdrawBtn")?.addEventListener("click", async () => {

  const user = auth.currentUser;
  const amount = Number(document.getElementById("withdrawAmount").value);

  if (!amount || amount <= 0) {
    alert("Monto inválido");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  if (data.balance < amount) {
    alert("Saldo insuficiente");
    return;
  }

  const fee = amount * 0.17;
  const finalAmount = amount - fee;

  await updateDoc(userRef, {
    balance: data.balance - amount
  });

  await addDoc(collection(db, "withdrawals"), {
    userId: user.uid,
    amount,
    fee,
    finalAmount,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("Retiro enviado (17% comisión aplicada)");

  await cargarDashboard();
  await cargarHistorial();
});


// ===============================
// 📜 HISTORIAL
// ===============================
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


// ===============================
// 👑 ADMIN PANEL
// ===============================
async function cargarAdmin() {

  const withdrawalsBox = document.getElementById("admin-withdrawals");
  const depositsBox = document.getElementById("admin-deposits");

  const wSnap = await getDocs(
    query(collection(db, "withdrawals"), where("status", "==", "pending"))
  );

  withdrawalsBox.innerHTML = "";
  wSnap.forEach(docSnap => {
    const w = docSnap.data();
    withdrawalsBox.innerHTML += `
      <div class="card">
        <p>User: ${w.userId}</p>
        <p>Monto: $${w.amount}</p>
      </div>
    `;
  });

  const dSnap = await getDocs(
    query(collection(db, "deposits"), where("status", "==", "pending"))
  );

  depositsBox.innerHTML = "";
  dSnap.forEach(docSnap => {
    const d = docSnap.data();
    depositsBox.innerHTML += `
      <div class="card">
        <p>User: ${d.userId}</p>
        <p>Monto: $${d.amount}</p>
      </div>
    `;
  });
}


// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = async function () {
  await signOut(auth);
  location.replace("./index.html");
};
