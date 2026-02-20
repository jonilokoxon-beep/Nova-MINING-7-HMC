// =====================================================
// 👑 ADMIN PANEL SYSTEM
// 💰 APROBAR DEPÓSITOS + 💸 APROBAR RETIROS
// =====================================================

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  addDoc,
  serverTimestamp,
  increment,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// =====================================================
// 🔐 VERIFICAR ADMIN
// =====================================================
const ADMIN_EMAIL = "joni.lokoxon@gmail.com";

onAuthStateChanged(auth, async (user) => {

  if (!user || user.email !== ADMIN_EMAIL) {
    alert("Acceso denegado");
    window.location.replace("dashboard.html");
    return;
  }

  await loadDeposits();
  await loadWithdrawals();
});


// =====================================================
// 💰 CARGAR DEPÓSITOS PENDIENTES
// =====================================================
async function loadDeposits() {

  const container = document.getElementById("adminDeposits");
  if (!container) return;

  container.innerHTML = "Cargando depósitos...";

  try {

    const q = query(
      collection(db, "deposits"),
      where("status", "==", "pending")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = "No hay depósitos pendientes";
      return;
    }

    container.innerHTML = "";

    snap.forEach((docSnap) => {

      const data = docSnap.data();
      const amount = Number(data.amount || 0);

      const div = document.createElement("div");
      div.className = "admin-item";

      div.innerHTML = `
        <p><strong>Usuario:</strong> ${data.uid}</p>
        <p><strong>Monto:</strong> $${amount.toFixed(2)}</p>
        <button onclick="approveDeposit('${docSnap.id}', '${data.uid}', ${amount})">
          ✅ Aprobar
        </button>
      `;

      container.appendChild(div);
    });

  } catch (error) {
    console.error("Error cargando depósitos:", error);
    container.innerHTML = "Error cargando depósitos";
  }
}


// =====================================================
// ✅ APROBAR DEPÓSITO
// =====================================================
window.approveDeposit = async (depositId, uid, amount) => {

  try {

    const depositRef = doc(db, "deposits", depositId);
    const depositSnap = await getDoc(depositRef);

    if (!depositSnap.exists()) {
      alert("Depósito no encontrado");
      return;
    }

    const depositData = depositSnap.data();

    if (depositData.status !== "pending") {
      alert("Este depósito ya fue procesado");
      return;
    }

    // Cambiar estado del depósito
    await updateDoc(depositRef, {
      status: "approved"
    });

    // Sumar saldo al usuario
    const userRef = doc(db, "users", uid);

    await updateDoc(userRef, {
      balance: increment(Number(amount))
    });

    // Registrar transacción
    await addDoc(collection(db, "transactions"), {
      uid,
      type: "deposit",
      amount: Number(amount),
      createdAt: serverTimestamp()
    });

    alert("✅ Depósito aprobado");

    await loadDeposits();

  } catch (error) {
    console.error("Error aprobando depósito:", error);
    alert("Error al aprobar depósito");
  }
};


// =====================================================
// 💸 CARGAR RETIROS PENDIENTES
// =====================================================
async function loadWithdrawals() {

  const container = document.getElementById("adminWithdrawals");
  if (!container) return;

  container.innerHTML = "Cargando retiros...";

  try {

    const q = query(
      collection(db, "withdrawals"),
      where("status", "==", "pending")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = "No hay retiros pendientes";
      return;
    }

    container.innerHTML = "";

    snap.forEach((docSnap) => {

      const data = docSnap.data();
      const amount = Number(data.amount || 0);

      const div = document.createElement("div");
      div.className = "admin-item";

      div.innerHTML = `
        <p><strong>Usuario:</strong> ${data.uid}</p>
        <p><strong>Monto:</strong> $${amount.toFixed(2)}</p>
        <button onclick="approveWithdraw('${docSnap.id}', '${data.uid}', ${amount})">
          ✅ Aprobar
        </button>
      `;

      container.appendChild(div);
    });

  } catch (error) {
    console.error("Error cargando retiros:", error);
    container.innerHTML = "Error cargando retiros";
  }
}


// =====================================================
// ✅ APROBAR RETIRO
// =====================================================
window.approveWithdraw = async (withdrawId, uid, amount) => {

  try {

    const withdrawRef = doc(db, "withdrawals", withdrawId);
    const withdrawSnap = await getDoc(withdrawRef);

    if (!withdrawSnap.exists()) {
      alert("Retiro no encontrado");
      return;
    }

    const withdrawData = withdrawSnap.data();

    if (withdrawData.status !== "pending") {
      alert("Este retiro ya fue procesado");
      return;
    }

    // Cambiar estado del retiro
    await updateDoc(withdrawRef, {
      status: "approved"
    });

    // Registrar transacción
    await addDoc(collection(db, "transactions"), {
      uid,
      type: "withdraw",
      amount: Number(amount),
      createdAt: serverTimestamp()
    });

    alert("✅ Retiro aprobado");

    await loadWithdrawals();

  } catch (error) {
    console.error("Error aprobando retiro:", error);
    alert("Error al aprobar retiro");
  }
};
