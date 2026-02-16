import { auth, db } from "./firebase.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const ADMIN_EMAIL = "joni.lokoxon@gmail.com";

onAuthStateChanged(auth, async (user) => {
  if (!user || user.email !== ADMIN_EMAIL) {
    alert("Acceso denegado");
    window.location.href = "index.html";
    return;
  }

  loadUsers();
});

async function loadUsers() {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);

  let totalUsers = 0;
  let totalBalance = 0;
  let activePlans = 0;

  const container = document.getElementById("usersList");
  container.innerHTML = "";

  snapshot.forEach(docu => {
    totalUsers++;

    const data = docu.data();
    totalBalance += data.balance || 0;
    if (data.plan) activePlans++;

    const div = document.createElement("div");
    div.style.background = "#0f172a";
    div.style.padding = "12px";
    div.style.borderRadius = "12px";
    div.style.marginBottom = "10px";

    div.innerHTML = `
      <b>${data.email || "usuario"}</b><br>
      Saldo: $${data.balance || 0}<br>
      Plan: ${data.plan || "Ninguno"}<br><br>
      <button onclick="addBalance('${docu.id}')">+100</button>
    `;

    container.appendChild(div);
  });

  document.getElementById("totalUsers").innerText = totalUsers;
  document.getElementById("totalBalance").innerText = "$" + totalBalance;
  document.getElementById("activePlans").innerText = activePlans;
}

window.addBalance = async function (id) {
  const ref = doc(db, "users", id);
  await updateDoc(ref, {
    balance: 100
  });
  alert("Saldo actualizado");
  loadUsers();
};
