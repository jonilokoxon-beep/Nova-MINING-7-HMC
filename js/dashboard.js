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
  where,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { loadOrders } from "./orders.js";
@@ -45,7 +46,6 @@
// ===============================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");

  const page = document.getElementById(id);
  if (page) page.style.display = "block";

@@ -74,6 +74,10 @@
      vip: 0,
      refBy: null,
      totalInvested: 0,
      level1Count: 0,
      level2Count: 0,
      level3Count: 0,
      isBlocked: false,
      createdAt: serverTimestamp()
    });
  }
@@ -91,23 +95,28 @@
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();
  const snap = await getDoc(userRef);
  const data = snap.data();

  const saldo = Number(userData.balance || 0);
  if (data.isBlocked) {
    alert("Cuenta bloqueada");
    await signOut(auth);
    return;
  }

  const saldo = Number(data.balance || 0);

  let ganancias = 0;
  let totalInvertido = 0;

  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const snap = await getDocs(q);
  const ordersSnap = await getDocs(q);

  snap.forEach(d => {
  ordersSnap.forEach(d => {
    ganancias += Number(d.data().dailyProfit || 0);
    totalInvertido += Number(d.data().amount || 0);
  });

  // 🔥 VIP AUTOMÁTICO
  let vip = 0;
  if (totalInvertido >= 100) vip = 1;
  if (totalInvertido >= 500) vip = 2;
@@ -123,7 +132,7 @@
}

// ===============================
// 🎁 CHECK-IN 24 HORAS
// 🎁 CHECK-IN 24H
// ===============================
document.addEventListener("click", async (e) => {
  if (e.target.id !== "btn-daily") return;
@@ -139,37 +148,29 @@
  const last = data.lastDailyClaim?.toMillis?.() || 0;

  if (now - last < 86400000) {
    alert("⏳ Ya hiciste tu check-in hoy");
    alert("⏳ Ya hiciste check-in hoy");
    return;
  }

  await updateDoc(userRef, {
    balance: (data.balance || 0) + 5,
    balance: increment(1),
    lastDailyClaim: serverTimestamp()
  });

  await addDoc(collection(db, "transactions"), {
    uid: user.uid,
    type: "Bono Diario",
    amount: 5,
    type: "daily_bonus",
    amount: 1,
    createdAt: serverTimestamp()
  });

  alert("🎉 Recibiste $5");
  alert("🎉 Recibiste $1");
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
@@ -182,29 +183,26 @@
    createdAt: serverTimestamp()
  });

  alert("✅ Depósito enviado");
  alert("Depósito enviado");
  closeDeposit();
});

// ===============================
// 💸 RETIRO
// ===============================
document.getElementById("btn-withdraw")?.addEventListener("click", async () => {
  const amount = Number(prompt("Ingrese monto a retirar"));
  const amount = Number(prompt("Monto a retirar"));
  const user = auth.currentUser;
  if (!user || amount <= 0) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const balance = Number(snap.data().balance || 0);

  if (amount > balance) {
    alert("❌ Saldo insuficiente");
    return;
  }
  if (amount > balance) return alert("Saldo insuficiente");

  await updateDoc(userRef, {
    balance: balance - amount
    balance: increment(-amount)
  });

  await addDoc(collection(db, "withdrawals"), {
@@ -214,7 +212,7 @@
    createdAt: serverTimestamp()
  });

  alert("✅ Retiro solicitado");
  alert("Retiro solicitado");
  cargarDashboard();
});

@@ -247,7 +245,7 @@
}

// ===============================
// 💰 INVERTIR + COMISIÓN 10%
// 💰 INVERTIR + MULTINIVEL
// ===============================
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-invertir")) return;
@@ -266,14 +264,11 @@

  const p = prodSnap.data();

  if (saldo < p.price) {
    alert("❌ Saldo insuficiente");
    return;
  }
  if (saldo < p.price) return alert("Saldo insuficiente");

  await updateDoc(userRef, {
    balance: saldo - p.price,
    totalInvested: (userData.totalInvested || 0) + p.price
    balance: increment(-p.price),
    totalInvested: increment(p.price)
  });

  await addDoc(collection(db, "orders"), {
@@ -283,38 +278,73 @@
    dailyProfit: p.profit,
    duration: p.duration,
    createdAt: serverTimestamp(),
    lastClaim: serverTimestamp(),
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
  await pagarComisiones(userData.refBy, p.price);

  alert("✅ Inversión realizada");
  alert("Inversión realizada");
  go("orders");
  loadOrders();
  cargarDashboard();
});

// ===============================
// 👥 EQUIPO (SOLO ACTIVOS)
// 🔥 MULTINIVEL 3 NIVELES
// ===============================
async function pagarComisiones(refUid, amount) {
  if (!refUid) return;

  const nivel1Ref = doc(db, "users", refUid);
  const snap1 = await getDoc(nivel1Ref);
  if (!snap1.exists()) return;

  const com1 = amount * 0.10;
  await updateDoc(nivel1Ref, { balance: increment(com1) });

  await addDoc(collection(db, "transactions"), {
    uid: refUid,
    type: "nivel1",
    amount: com1,
    createdAt: serverTimestamp()
  });

  const nivel2Uid = snap1.data().refBy;
  if (!nivel2Uid) return;

  const nivel2Ref = doc(db, "users", nivel2Uid);
  const snap2 = await getDoc(nivel2Ref);
  if (!snap2.exists()) return;

  const com2 = amount * 0.05;
  await updateDoc(nivel2Ref, { balance: increment(com2) });

  await addDoc(collection(db, "transactions"), {
    uid: nivel2Uid,
    type: "nivel2",
    amount: com2,
    createdAt: serverTimestamp()
  });

  const nivel3Uid = snap2.data().refBy;
  if (!nivel3Uid) return;

  const com3 = amount * 0.01;
  await updateDoc(doc(db, "users", nivel3Uid), {
    balance: increment(com3)
  });

  await addDoc(collection(db, "transactions"), {
    uid: nivel3Uid,
    type: "nivel3",
    amount: com3,
    createdAt: serverTimestamp()
  });
}

// ===============================
// 👥 EQUIPO
// ===============================
async function cargarEquipo() {
  const user = auth.currentUser;
@@ -323,21 +353,11 @@
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
  if (teamCount) teamCount.innerText = snap.size;
}

// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = () => signOut(auth).then(() => location.replace("login.html"));
