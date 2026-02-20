// =====================================================
// 👑 ADMIN PANEL SYSTEM
// 💰 APROBAR DEPÓSITOS + 💸 APROBAR RETIROS
// =====================================================

import { auth, db } from "./firebase.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  addDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// =====================================================
// 🔐 VERIFICAR ADMIN
// =====================================================
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


// =====================================================
// 💰 CARGAR DEPÓSITOS PENDIENTES
// =====================================================
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
    div.className = "admin-item";

    div.innerHTML = `
      <p><strong>Usuario:</strong> ${data.uid}</p>
      <p><strong>Monto:</strong> $${Number(data.amount).toFixed(2)}</p>
      <button onclick="approveDeposit('${docSnap.id}', '${data.uid}', ${data.amount})">
        ✅ Aprobar
      </button>
    `;

    container.appendChild(div);
  });
}


// =====================================================
// ✅ APROBAR DEPÓSITO
// =====================================================
window.approveDeposit = async (depositId, uid, amount) => {

  try {

    // Cambiar estado del depósito
    await updateDoc(doc(db, "deposits", depositId), {
      status: "approved"
    });

    // Sumar saldo al usuario
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      balance: increment(amount)
    });

    // Registrar transacción
    await addDoc(collection(db, "transactions"), {
      uid,
      type: "deposit",
      amount,
      createdAt: serverTimestamp()
    });

    alert("✅ Depósito aprobado");
    loadDeposits();

  } catch (error) {
    console.error(error);
    alert("Error al aprobar depósito");
  }
};


// =====================================================
// 💸 CARGAR RETIROS PENDIENTES
// =====================================================
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
    div.className = "admin-item";

    div.innerHTML = `
      <p><strong>Usuario:</strong> ${data.uid}</p>
      <p><strong>Monto:</strong> $${Number(data.amount).toFixed(2)}</p>
      <button onclick="approveWithdraw('${docSnap.id}', '${data.uid}', ${data.amount})">
        ✅ Aprobar
      </button>
    `;

    container.appendChild(div);
  });
}


// =====================================================
// ✅ APROBAR RETIRO
// =====================================================
window.approveWithdraw = async (withdrawId, uid, amount) => {

  try {

    // Cambiar estado del retiro
    await updateDoc(doc(db, "withdrawals", withdrawId), {
      status: "approved"
    });

    // Registrar transacción
    await addDoc(collection(db, "transactions"), {
      uid,
      type: "withdraw",
      amount,
      createdAt: serverTimestamp()
    });

    alert("✅ Retiro aprobado");
    loadWithdrawals();

  } catch (error) {
    console.error(error);
    alert("Error al aprobar retiro");
  }
};
