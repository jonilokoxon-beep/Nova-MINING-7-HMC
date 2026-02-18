import { auth, db } from "./firebase.js";
import { increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  collection,
  getDocs,
  updateDoc,
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
  const q = query(
    collection(db, "deposits"),
    where("status", "==", "pending")
  );

  const snap = await getDocs(q);

  const container = document.getElementById("adminDeposits");
  if (!container) return;

  container.innerHTML = "";

  snap.forEach((docSnap) => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.innerHTML = `
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

  // actualizar estado
  await updateDoc(doc(db, "deposits", depositId), {
    status: "approved"
  });

  // sumar saldo
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    balance: increment(amount)
  });

  // registrar transacción
  await addDoc(collection(db, "transactions"), {
    uid,
    type: "deposit",
    amount,
    createdAt: serverTimestamp()
  });

  alert("Depósito aprobado");
  loadDeposits();
};

// ==============================
// 💸 CARGAR RETIROS PENDIENTES
// ==============================
async function loadWithdrawals() {
  const q = query(
    collection(db, "withdrawals"),
    where("status", "==", "pending")
  );

  const snap = await getDocs(q);

  const container = document.getElementById("adminWithdrawals");
  if (!container) return;

  container.innerHTML = "";

  snap.forEach((docSnap) => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.innerHTML = `
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

  await updateDoc(doc(db, "withdrawals", withdrawId), {
    status: "approved"
  });

  await addDoc(collection(db, "transactions"), {
    uid,
    type: "withdraw",
    amount,
    createdAt: serverTimestamp()
  });

  alert("Retiro aprobado");
  loadWithdrawals();
};
