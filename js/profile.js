// js/profile.js

import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  document.getElementById("p-id").innerText = user.uid.slice(0, 6);
  document.getElementById("p-balance").innerText =
    Number(data.balance || 0).toFixed(2);

  loadTransactions(user.uid);
}

async function loadTransactions(uid) {
  const div = document.getElementById("transactionHistory");

  const q = query(
    collection(db, "transactions"),
    where("uid", "==", uid)
  );

  const snap = await getDocs(q);

  div.innerHTML = "";

  snap.forEach(docSnap => {
    const t = docSnap.data();

    div.innerHTML += `
      <div class="tx-item">
        <span>${t.type}</span>
        <b>$${t.amount}</b>
      </div>
    `;
  });
}
