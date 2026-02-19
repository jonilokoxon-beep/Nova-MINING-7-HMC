import { auth, db } from "./firebase.js";

import { increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  doc,
  query,
  where,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔐 VERIFICAR ADMIN
const ADMIN_EMAIL = "joni.lokoxon@gmail.com";

auth.onAuthStateChanged(async (user) => {
  if (!user || user.email !== ADMIN_EMAIL) {
    alert("Acceso denegado");
    location.href = "dashboard.html";
    return;
  }

  loadDeposits();
  loadWithdrawals();
});

// ==============================
// 💰 CARGAR DEPÓSITOS PENDIENTES
// ==============================
async function loadDeposits() {
  const snapshot = await getDocs(collection(db, "deposits"));
  const container = document.getElementById("admin-deposits");
  const q = query(
    collection(db, "deposits"),
    where("status", "==", "pending")
  );

  container.innerHTML = "";
  const snap = await getDocs(q);

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
  const container = document.getElementById("adminDeposits");
  if (!container) return;

    if (d.status !== "pending") return;
  container.innerHTML = "";

  snap.forEach((docSnap) => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.innerHTML = `
      <p>UID: ${d.uid}</p>
      <p>Monto: $${d.amount}</p>
      <button onclick="approveDeposit('${docSnap.id}', '${d.uid}', ${d.amount})">
        Aprobar
      </button>
      <hr/>
      <p>Usuario: ${data.uid}</p>
      <p>Monto: $${data.amount}</p>
      <button onclick="approveDeposit('${docSnap.id}', '${data.uid}', ${data.amount})">Aprobar</button>
    `;

    container.appendChild(div);
  });
}

// ==============================
// ✅ APROBAR DEPÓSITO
// ==============================
window.approveDeposit = async (depositId, uid, amount) => {
  const depositRef = doc(db, "deposits", depositId);
  const userRef = doc(db, "users", uid);

  const userSnap = await getDoc(userRef);
  const currentBalance = userSnap.data().balance || 0;

  await updateDoc(depositRef, { status: "approved" });
  // actualizar estado
  await updateDoc(doc(db, "deposits", depositId), {
    status: "approved"
  });

  // sumar saldo
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    balance: currentBalance + amount
    balance: increment(amount)
  });

  // registrar transacción
  await addDoc(collection(db, "transactions"), {
    uid,
    type: "deposit",
@@ -59,44 +83,43 @@ window.approveDeposit = async (depositId, uid, amount) => {
  loadDeposits();
};

loadDeposits();

// ==============================
// 💸 CARGAR RETIROS PENDIENTES
// ==============================
async function loadWithdrawals() {
  const snapshot = await getDocs(collection(db, "withdrawals"));
  const container = document.getElementById("admin-withdrawals");
  const q = query(
    collection(db, "withdrawals"),
    where("status", "==", "pending")
  );

  container.innerHTML = "";
  const snap = await getDocs(q);

  const container = document.getElementById("adminWithdrawals");
  if (!container) return;

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
  container.innerHTML = "";

    if (d.status !== "pending") return;
  snap.forEach((docSnap) => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.innerHTML = `
      <p>UID: ${d.uid}</p>
      <p>Monto: $${d.amount}</p>
      <button onclick="approveWithdraw('${docSnap.id}', '${d.uid}', ${d.amount})">
        Aprobar
      </button>
      <hr/>
      <p>Usuario: ${data.uid}</p>
      <p>Monto: $${data.amount}</p>
      <button onclick="approveWithdraw('${docSnap.id}', '${data.uid}', ${data.amount})">Aprobar</button>
    `;

    container.appendChild(div);
  });
}

// ==============================
// ✅ APROBAR RETIRO
// ==============================
window.approveWithdraw = async (withdrawId, uid, amount) => {
  const withdrawRef = doc(db, "withdrawals", withdrawId);
  const userRef = doc(db, "users", uid);

  const userSnap = await getDoc(userRef);
  const currentBalance = userSnap.data().balance || 0;

  await updateDoc(withdrawRef, { status: "approved" });

  await updateDoc(userRef, {
    balance: currentBalance - amount
  await updateDoc(doc(db, "withdrawals", withdrawId), {
    status: "approved"
  });

  await addDoc(collection(db, "transactions"), {
@@ -109,5 +132,3 @@ window.approveWithdraw = async (withdrawId, uid, amount) => {
  alert("Retiro aprobado");
  loadWithdrawals();
};

loadWithdrawals();
