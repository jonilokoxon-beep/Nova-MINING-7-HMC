// ===============================
// IMPORTS FIREBASE
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// CONFIG (USA LA TUYA)
// ===============================
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_MSG",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// ===============================
// NAVEGACIÓN ENTRE PESTAÑAS
// ===============================
window.go = function(pageId) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(pageId).style.display = "block";
};

// ===============================
// LOGOUT
// ===============================
window.logout = async function() {
  await signOut(auth);
  window.location.href = "index.html";
};

// ===============================
// CARGAR DATOS USUARIO
// ===============================
async function loadUser(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("stat-balance").innerText = data.balance?.toFixed(2) || "0.00";
  document.getElementById("stat-profit").innerText = data.totalProfit?.toFixed(2) || "0.00";
  document.getElementById("stat-withdrawn").innerText = data.totalWithdrawn?.toFixed(2) || "0.00";

  document.getElementById("p-id").innerText = uid.slice(0,6);
  document.getElementById("p-vip").innerText = data.vip || 0;
  document.getElementById("p-balance").innerText = data.balance?.toFixed(2) || "0.00";
}

// ===============================
// DEPÓSITO
// ===============================
window.closeDeposit = function() {
  document.getElementById("depositModal").style.display = "none";
};

document.getElementById("quick-deposit")?.addEventListener("click", () => {
  document.getElementById("depositModal").style.display = "block";
});

document.getElementById("btn-deposit")?.addEventListener("click", () => {
  document.getElementById("depositModal").style.display = "block";
});

document.getElementById("confirmDeposit")?.addEventListener("click", async () => {
  const amount = parseFloat(document.getElementById("depositAmount").value);
  if (!amount || amount <= 0) return alert("Monto inválido");

  const userRef = doc(db, "users", currentUser.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  await updateDoc(userRef, {
    balance: (data.balance || 0) + amount
  });

  closeDeposit();
  loadUser(currentUser.uid);
});

// ===============================
// RETIRO
// ===============================
document.getElementById("quick-withdraw")?.addEventListener("click", withdraw);
document.getElementById("btn-withdraw")?.addEventListener("click", withdraw);

async function withdraw() {
  const amount = parseFloat(prompt("Monto a retirar"));
  if (!amount || amount <= 0) return;

  const userRef = doc(db, "users", currentUser.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  if (amount > data.balance) return alert("Saldo insuficiente");

  await updateDoc(userRef, {
    balance: data.balance - amount,
    totalWithdrawn: (data.totalWithdrawn || 0) + amount
  });

  loadUser(currentUser.uid);
}

// ===============================
// PRODUCTOS VIP
// ===============================
const products = [
  { name: "VIP 1", price: 100, daily: 10 },
  { name: "VIP 2", price: 300, daily: 35 },
  { name: "VIP 3", price: 600, daily: 80 }
];

function renderProducts() {
  const container = document.getElementById("productsList");
  container.innerHTML = "";

  products.forEach(p => {
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <h4>${p.name}</h4>
      <p>Precio: $${p.price}</p>
      <p>Ganancia diaria: $${p.daily}</p>
      <button onclick="buyProduct('${p.name}', ${p.price}, ${p.daily})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

window.buyProduct = async function(name, price, daily) {
  const userRef = doc(db, "users", currentUser.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  if (price > data.balance) return alert("Saldo insuficiente");

  await updateDoc(userRef, {
    balance: data.balance - price
  });

  await addDoc(collection(db, "orders"), {
    uid: currentUser.uid,
    product: name,
    daily: daily,
    created: Date.now()
  });

  alert("Producto comprado");
  loadUser(currentUser.uid);
};

// ===============================
// AUTENTICACIÓN
// ===============================
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    currentUser = user;
    loadUser(user.uid);
    renderProducts();
  }
});
