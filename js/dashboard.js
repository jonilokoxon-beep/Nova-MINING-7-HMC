// js/dashboard.js

import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { loadOrders } from "./orders.js";
import { loadProfile } from "./profile.js";

import { onAuthStateChanged, signOut }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(id).style.display = "block";

  if (id === "orders") loadOrders();
  if (id === "profile") loadProfile();
};

onAuthStateChanged(auth, async user => {
  if (!user) {
    location.href = "login.html";
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

async function cargarDashboard() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  document.getElementById("stat-balance").innerText =
    Number(data.balance || 0).toFixed(2);
}

window.logout = () =>
  signOut(auth).then(() => location.href = "login.html");
