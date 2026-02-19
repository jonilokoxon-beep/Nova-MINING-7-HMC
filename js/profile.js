// ===============================
// 👤 PROFILE LOGIC COMPLETO PRO +
// 📊 HISTORIAL + 🚀 VIP SYSTEM
// ===============================

import { auth, db } from "./firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===============================
// 🚀 LOAD PROFILE
// ===============================
export async function loadProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const idEl = document.getElementById("p-id");
  const vipEl = document.getElementById("p-vip");
  const balanceEl = document.getElementById("p-balance");

  const inviteBtn = document.getElementById("btn-invite");
  const rescueBtn = document.getElementById("btn-rescue");
  const depositBtn = document.getElementById("btn-deposit");
  const withdrawBtn = document.getElementById("btn-withdraw");

  const userRef = doc(db, "users", user.uid);
  let userSnap = await getDoc(userRef);

if (user.email === "TU_CORREO_ADMIN@gmail.com") {
if (user.email === "joni.lokoxon@gmail.com") {
  const btn = document.createElement("button");
  btn.innerText = "👑 Panel Admin";
  btn.onclick = () => location.href = "admin.html";
  document.querySelector(".profile-menu").appendChild(btn);
}


  // 🆔 CREAR PERFIL SI NO EXISTE
  if (!userSnap.exists()) {
    const generatedId = Math.floor(100000 + Math.random() * 900000);

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      publicId: generatedId,
      vip: 0,
      balance: 0,
      createdAt: serverTimestamp()
    });

    userSnap = await getDoc(userRef);
  }

  const u = userSnap.data();

  // ===============================
  // 👥 VIP POR REFERIDOS
  // ===============================
  const referralsQuery = query(
    collection(db, "users"),
    where("referredBy", "==", user.uid)
  );

  const referralsSnap = await getDocs(referralsQuery);
  const totalRefs = referralsSnap.size;

  const vipLevel = Math.floor(totalRefs / 3); // 1 VIP cada 3 referidos
  const vipRate = getVipRate(vipLevel);

  if (vipEl) vipEl.innerText = vipLevel;

  // ===============================
  // 📄 MOSTRAR DATOS
  // ===============================
  if (idEl) idEl.innerText = u.publicId || "000000";
  if (balanceEl) balanceEl.innerText = Number(u.balance || 0).toFixed(2);

  // ===============================
  // 📊 HISTORIAL AUTOMÁTICO
  // ===============================
  loadTransactions(user.uid);

  // ===============================
  // 🔗 INVITAR
  // ===============================
  if (inviteBtn) {
    inviteBtn.onclick = () => {
      const link = `${location.origin}/register.html?ref=${user.uid}`;
      navigator.clipboard.writeText(link);
      alert("✅ Enlace copiado para invitar");
    };
  }

  // ===============================
  // 🎁 RESCUE REAL + HISTORIAL
  // ===============================
  if (rescueBtn) {
    rescueBtn.onclick = async () => {
      const code = prompt("Ingresa código de recompensa:");
      if (!code) return;

      const q = query(
        collection(db, "rescueCodes"),
        where("code", "==", code),
        where("active", "==", true)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        alert("❌ Código inválido");
        return;
      }

      const reward = snap.docs[0].data().reward || 0;

      await updateDoc(userRef, {
        balance: (u.balance || 0) + reward
      });

      await addDoc(collection(db, "transactions"), {
        uid: user.uid,
        type: "rescue",
        amount: reward,
        createdAt: serverTimestamp()
      });

      alert("🎉 Premio acreditado");
      loadProfile();
    };
  }

  // ===============================
  // 💰 DEPÓSITO
  // ===============================
  if (depositBtn) {
    depositBtn.onclick = () => {
      const modal = document.getElementById("depositModal");
      if (modal) modal.style.display = "block";
    };
  }

  // ===============================
  // 💸 RETIRO + HISTORIAL
  // ===============================
  if (withdrawBtn) {
    withdrawBtn.onclick = async () => {
      const amount = Number(prompt("Monto a retirar:"));

      if (!amount || amount <= 0) {
        alert("Monto inválido");
        return;
      }

      const currentSnap = await getDoc(userRef);
      const currentBalance = currentSnap.data().balance || 0;

      if (amount > currentBalance) {
        alert("❌ Saldo insuficiente");
        return;
      }

      await addDoc(collection(db, "withdrawals"), {
        uid: user.uid,
        amount,
        status: "pending",
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "transactions"), {
        uid: user.uid,
        type: "withdraw_request",
        amount,
        createdAt: serverTimestamp()
      });

      alert("✅ Solicitud enviada. Esperando aprobación.");
    };
  }
}

// ===============================
// 🚀 SISTEMA VIP POR NIVEL
// ===============================
function getVipRate(level) {
  const rates = {
    0: 0.02,
    1: 0.03,
    2: 0.05,
    3: 0.07,
    4: 0.10,
    5: 0.15
  };

  return rates[level] || 0.02;
}

// 👉 Usa esta función cuando calcules ganancias:
export function calculateVipProfit(investment, vipLevel) {
  const rate = getVipRate(vipLevel);
  return investment * rate;
}

// ===============================
// 📊 CARGAR HISTORIAL
// ===============================
async function loadTransactions(uid) {

  const container = document.getElementById("transactionHistory");
  if (!container) return;

  const q = query(
    collection(db, "transactions"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.className = "tx-item";
    div.innerHTML = `
      <span>${data.type}</span>
      <b>$${Number(data.amount).toFixed(2)}</b>
    `;

    container.appendChild(div);
  });
}

// ===============================
// ❌ CERRAR MODAL
// ===============================
window.closeDeposit = function () {
  const modal = document.getElementById("depositModal");
  if (modal) modal.style.display = "none";
};

// ===============================
// 💰 CONFIRMAR DEPÓSITO
// ===============================
document.addEventListener("click", async (e) => {
  if (e.target.id !== "confirmDeposit") return;

  const user = auth.currentUser;
  if (!user) return;

  const amount = Number(document.getElementById("depositAmount")?.value);

  if (!amount || amount <= 0) {
    alert("Monto inválido");
    return;
  }

  try {
    await addDoc(collection(db, "deposits"), {
      uid: user.uid,
      amount,
      status: "pending",
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, "transactions"), {
      uid: user.uid,
      type: "deposit_request",
      amount,
      createdAt: serverTimestamp()
    });

    alert("✅ Solicitud enviada. Esperando aprobación.");
    closeDeposit();
  } catch (error) {
    console.error(error);
    alert("Error al enviar depósito");
  }
});
