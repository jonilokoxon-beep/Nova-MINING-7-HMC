// ===============================
// 🔥 FIREBASE IMPORTS
// ===============================
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  increment,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// ===============================
// 🔐 VERIFICAR ADMIN
// ===============================
auth.onAuthStateChanged(async (user) => {
  if (!user) return location.replace("login.html");

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || !snap.data().isAdmin) {
    alert("Acceso denegado");
    location.replace("dashboard.html");
    return;
  }

  cargarEstadisticas();
  cargarUsuarios();
  cargarDepositos();
  cargarRetiros();
});

// ===============================
// 📊 ESTADÍSTICAS
// ===============================
async function cargarEstadisticas() {
  const usersSnap = await getDocs(collection(db, "users"));
  const depositsSnap = await getDocs(collection(db, "deposits"));
  const withdrawalsSnap = await getDocs(collection(db, "withdrawals"));

  document.getElementById("totalUsers").innerText = usersSnap.size;
  document.getElementById("totalDeposits").innerText = depositsSnap.size;
  document.getElementById("totalWithdrawals").innerText = withdrawalsSnap.size;
}

// ===============================
// 👥 USUARIOS
// ===============================
async function cargarUsuarios() {
  const list = document.getElementById("usersList");
  if (!list) return;

  list.innerHTML = "";

  const snap = await getDocs(collection(db, "users"));

  snap.forEach(docSnap => {
    const u = docSnap.data();

    list.innerHTML += `
      <div class="admin-card">
        <p>Email: ${u.email}</p>
        <p>Balance: $${Number(u.balance || 0).toFixed(2)}</p>
        <p>VIP: ${u.vip || 0}</p>
        <p>Estado: ${u.isBlocked ? "Bloqueado" : "Activo"}</p>
        <button onclick="toggleBlock('${docSnap.id}', ${u.isBlocked})">
          ${u.isBlocked ? "Desbloquear" : "Bloquear"}
        </button>
      </div>
    `;
  });
}

// ===============================
// 🔒 BLOQUEAR / DESBLOQUEAR
// ===============================
window.toggleBlock = async function (uid, estadoActual) {
  await updateDoc(doc(db, "users", uid), {
    isBlocked: !estadoActual
  });

  alert("Estado actualizado");
  cargarUsuarios();
};

// ===============================
// 💰 DEPÓSITOS PENDIENTES
// ===============================
async function cargarDepositos() {
  const list = document.getElementById("depositsList");
  if (!list) return;

  list.innerHTML = "";

  const q = query(
    collection(db, "deposits"),
    where("status", "==", "pending")
  );

  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const d = docSnap.data();

    list.innerHTML += `
      <div class="admin-card">
        <p>Usuario: ${d.uid}</p>
        <p>Monto: $${d.amount}</p>
        <button onclick="aprobarDeposito('${docSnap.id}', '${d.uid}', ${d.amount})">
          Aprobar
        </button>
      </div>
    `;
  });
}

// ===============================
// ✅ APROBAR DEPÓSITO
// ===============================
window.aprobarDeposito = async function (id, uid, amount) {

  await updateDoc(doc(db, "deposits", id), {
    status: "approved"
  });

  await updateDoc(doc(db, "users", uid), {
    balance: increment(amount)
  });

  await addDoc(collection(db, "transactions"), {
    uid,
    type: "deposit_approved",
    amount,
    createdAt: serverTimestamp()
  });

  alert("Depósito aprobado");
  cargarDepositos();
  cargarUsuarios();
};

// ===============================
// 💸 RETIROS PENDIENTES
// ===============================
async function cargarRetiros() {
  const list = document.getElementById("withdrawalsList");
  if (!list) return;

  list.innerHTML = "";

  const q = query(
    collection(db, "withdrawals"),
    where("status", "==", "pending")
  );

  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const w = docSnap.data();

    list.innerHTML += `
      <div class="admin-card">
        <p>Usuario: ${w.uid}</p>
        <p>Monto: $${w.amount}</p>
        <button onclick="aprobarRetiro('${docSnap.id}')">
          Aprobar
        </button>
      </div>
    `;
  });
}

// ===============================
// ✅ APROBAR RETIRO
// ===============================
window.aprobarRetiro = async function (id) {

  await updateDoc(doc(db, "withdrawals", id), {
    status: "approved"
  });

  alert("Retiro aprobado");
  cargarRetiros();
};
