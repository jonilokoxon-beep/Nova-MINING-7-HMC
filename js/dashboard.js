import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const DAILY_RATE = 0.02; // 2% diario

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const data = snap.data();

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  if (now - data.lastProfit >= oneDay && data.balance > 0) {
    const profit = data.balance * DAILY_RATE;

    await updateDoc(userRef, {
      balance: data.balance + profit,
      lastProfit: now
    });
  }

  document.getElementById("p-balance").innerText =
    data.balance.toFixed(2);

  document.getElementById("p-vip").innerText =
    data.vip;
});
