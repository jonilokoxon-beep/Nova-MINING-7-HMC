// =====================================================
// 👤 PROFILE SYSTEM PRO
// 📊 HISTORIAL + 🚀 VIP SYSTEM + 💰 DEPOSIT/WITHDRAW
// =====================================================

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


// =====================================================
// 🚀 LOAD PROFILE
// =====================================================
export async function loadProfile() {

  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  let userSnap = await getDoc(userRef);

  // =============================
  // 👑 ADMIN BUTTON
  // =============================
  if (user.email === "joni.lokoxon@gmail.com") {
    const adminBtn = document.createElement("button");
    adminBtn.textContent = "👑 Panel Admin";
    adminBtn.onclick = () => location.href = "admin.html";
    document.querySelector(".profile-menu")?.appendChild(adminBtn);
  }

  // =============================
  // 🆔 CREATE USER IF NOT EXISTS
  // =============================
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

  const userData = userSnap.data();

  // =============================
  // 👥 VIP SYSTEM BY REFERRALS
  // =============================
  const referralsQuery = query(
    collection(db, "users"),
    where("referredBy", "==", user.uid)
  );

  const referralsSnap = await getDocs(referralsQuery);
  const totalRefs = referralsSnap.size;

  const vipLevel = Math.floor(totalRefs / 3);
  const vipRate = getVipRate(vipLevel);

  document.getElementById("p-vip")?.innerText = vipLevel;
  document.getElementById("p-id")?.innerText = userData.publicId || "000000";
  document.getElementById("p-balance")?.innerText =
    Number(userData.balance || 0).toFixed(2);

  // =============================
  // 📊 LOAD TRANSACTIONS
  // =============================
  loadTransactions(user.uid);

  // =============================
  // 🔗 INVITE LINK
  // =============================
  document.getElementById("btn-invite")?.addEventListener("click", () => {
    const link = `${location.origin}/register.html?ref=${user.uid}`;
    navigator.clipboard.writeText(link);
    alert("✅ Enlace copiado");
  });

  // =============================
  // 🎁 RESCUE CODE
  // =============================
  document.getElementById("btn-rescue")?.addEventListener("click", async () => {

    const code = prompt("Ingresa código:");
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
      balance: (userData.balance || 0) + reward
    });

    await addDoc(collection(db, "transactions"), {
      uid: user.uid,
      type: "rescue",
      amount: reward,
      createdAt: serverTimestamp()
    });

    alert("🎉 Premio acreditado");
    loadProfile();
  });

  // =============================
  // 💰 DEPOSIT MODAL
  // =============================
  document.getElementById("btn-deposit")?.addEventListener("click", () => {
    document.getElementById("depositModal")?.style.display = "block";
  });

  // =============================
  // 💸 WITHDRAW REQUEST
  // =============================
  document.getElementById("btn-withdraw")?.addEventListener("click", async () => {

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

    alert("✅ Solicitud enviada");
  });

}


// =====================================================
// 🚀 VIP RATE TABLE
// =====================================================
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


// =====================================================
// 💎 VIP PROFIT CALCULATOR
// =====================================================
export function calculateVipProfit(investment, vipLevel) {
  return investment * getVipRate(vipLevel);
}


// =====================================================
// 📊 LOAD TRANSACTION HISTORY
// =====================================================
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

    const item = document.createElement("div");
    item.className = "tx-item";

    item.innerHTML = `
      <span>${data.type}</span>
      <strong>$${Number(data.amount).toFixed(2)}</strong>
    `;

    container.appendChild(item);
  });
}


// =====================================================
// ❌ CLOSE DEPOSIT MODAL
// =====================================================
window.closeDeposit = function () {
  document.getElementById("depositModal")?.style.display = "none";
};


// =====================================================
// 💰 CONFIRM DEPOSIT
// =====================================================
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

    alert("✅ Solicitud enviada");
    closeDeposit();

  } catch (error) {
    console.error(error);
    alert("Error al enviar depósito");
  }

});
