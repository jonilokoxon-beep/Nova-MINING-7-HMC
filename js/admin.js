import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const ADMIN_EMAIL = "joni.lokoxon@gmail.com";

onAuthStateChanged(auth, async (user) => {
  if (!user || user.email !== ADMIN_EMAIL) {
    window.location.href = "dashboard.html";
    return;
  }

  loadUsers();
});

async function loadUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  const container = document.getElementById("usersList");

  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    container.innerHTML += `
      <div class="admin-card">
        <p>${data.email}</p>
        <p>Balance: $${data.balance}</p>
        <button onclick="addBalance('${docSnap.id}')">+100</button>
      </div>
    `;
  });
}

window.addBalance = async function(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  await updateDoc(userRef, {
    balance: data.balance + 100
  });

  loadUsers();
};
