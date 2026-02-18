import { auth, db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadDeposits() {
  const snapshot = await getDocs(collection(db, "deposits"));
  const container = document.getElementById("admin-deposits");

  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const d = docSnap.data();

    if (d.status !== "pending") return;

    const div = document.createElement("div");
    div.innerHTML = `
      <p>UID: ${d.uid}</p>
      <p>Monto: $${d.amount}</p>
      <button onclick="approveDeposit('${docSnap.id}', '${d.uid}', ${d.amount})">
        Aprobar
      </button>
      <hr/>
    `;

    container.appendChild(div);
  });
}

window.approveDeposit = async (depositId, uid, amount) => {
  const depositRef = doc(db, "deposits", depositId);
  const userRef = doc(db, "users", uid);

  const userSnap = await getDoc(userRef);
  const currentBalance = userSnap.data().balance || 0;

  await updateDoc(depositRef, { status: "approved" });

  await updateDoc(userRef, {
    balance: currentBalance + amount
  });

  await addDoc(collection(db, "transactions"), {
    uid,
    type: "deposit",
    amount,
    createdAt: serverTimestamp()
  });

  alert("Depósito aprobado");
  loadDeposits();
};

loadDeposits();
