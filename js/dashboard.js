import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { loadOrders } from "./orders.js";
import { loadProfile } from "./profile.js";

// ================= NAV =================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const page = document.getElementById(id);
  if (page) page.style.display = "block";

  if (id === "orders") loadOrders();
  if (id === "profile") loadProfile();
};

// ================= SESSION =================
auth.onAuthStateChanged(async user => {
  if (!user) {
    location.replace("login.html");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      balance: 0,
      vip: 0,
      totalInvested: 0,
      createdAt: serverTimestamp()
    });
  }

  go("inicio");
  cargarDashboard();
});

// ================= DASHBOARD =================
async function cargarDashboard() {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  document.getElementById("stat-balance").innerText =
    Number(data.balance || 0).toFixed(2);
}

// ================= LOGOUT =================
window.logout = async () => {
  await auth.signOut();
  location.replace("login.html");
};
