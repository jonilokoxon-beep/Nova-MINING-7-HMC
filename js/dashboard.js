// ===============================
// ESPERAR QUE CARGUE TODO
// ===============================
document.addEventListener("DOMContentLoaded", () => {

import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js").then(async ({ initializeApp }) => {

const { getAuth, signOut, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
const { getFirestore, doc, getDoc, updateDoc, collection, addDoc, getDocs, query, where } =
await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

// ===============================
// TU CONFIG FIREBASE
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
// NAVEGACIÓN PESTAÑAS
// ===============================
window.go = function(pageId) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const page = document.getElementById(pageId);
  if (page) page.style.display = "block";
};

// ===============================
// LOGOUT
// ===============================
window.logout = async function() {
  await signOut(auth);
  window.location.href = "index.html";
};

// ===============================
// CARGAR DATOS
// ===============================
async function loadUser(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("stat-balance").innerText = (data.balance || 0).toFixed(2);
  document.getElementById("stat-profit").innerText = (data.totalProfit || 0).toFixed(2);
  document.getElementById("stat-withdrawn").innerText = (data.totalWithdrawn || 0).toFixed(2);

  document.getElementById("p-id").innerText = uid.slice(0,6);
  document.getElementById("p-vip").innerText = data.vip || 0;
  document.getElementById("p-balance").innerText = (data.balance || 0).toFixed(2);
}

// ===============================
// PRODUCTOS
// ===============================
const products = [
  { name: "VIP 1", price: 100, daily: 10 },
  { name: "VIP 2", price: 300, daily: 35 },
  { name: "VIP 3", price: 600, daily: 80 }
];

function renderProducts() {
  const container = document.getElementById("productsList");
  if (!container) return;
  container.innerHTML = "";

  products.forEach(p => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h4>${p.name}</h4>
      <p>Precio: $${p.price}</p>
      <p>Ganancia diaria: $${p.daily}</p>
      <button class="buy-btn">Comprar</button>
    `;
    div.querySelector(".buy-btn").addEventListener("click", async () => {
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);
      const data = snap.data();

      if (p.price > data.balance) return alert("Saldo insuficiente");

      await updateDoc(userRef, {
        balance: data.balance - p.price
      });

      await addDoc(collection(db, "orders"), {
        uid: currentUser.uid,
        product: p.name,
        daily: p.daily,
        created: Date.now()
      });

      alert("Producto comprado");
      loadUser(currentUser.uid);
      renderOrders();
    });

    container.appendChild(div);
  });
}

// ===============================
// ÓRDENES
// ===============================
async function renderOrders() {
  const container = document.getElementById("ordersList");
  if (!container) return;
  container.innerHTML = "";

  const q = query(collection(db, "orders"), where("uid", "==", currentUser.uid));
  const snap = await getDocs(q);

  snap.forEach(docu => {
    const data = docu.data();
    const div = document.createElement("div");
    div.innerHTML = `
      <p>${data.product}</p>
      <p>Ganancia diaria: $${data.daily}</p>
    `;
    container.appendChild(div);
  });
}

// ===============================
// DEPÓSITO
// ===============================
document.getElementById("quick-deposit")?.addEventListener("click", () => {
  const amount = parseFloat(prompt("Monto a depositar"));
  if (!amount || amount <= 0) return;

  updateBalance(amount);
});

// ===============================
// RETIRO
// ===============================
document.getElementById("quick-withdraw")?.addEventListener("click", async () => {
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
});

async function updateBalance(amount) {
  const userRef = doc(db, "users", currentUser.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  await updateDoc(userRef, {
    balance: (data.balance || 0) + amount
  });

  loadUser(currentUser.uid);
}

// ===============================
// CHECK IN DIARIO 24H
// ===============================
window.dailyCheckin = async function() {
  const userRef = doc(db, "users", currentUser.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  const now = Date.now();
  if (data.lastCheckin && now - data.lastCheckin < 86400000) {
    return alert("Ya reclamaste hoy");
  }

  await updateDoc(userRef, {
    balance: (data.balance || 0) + 5,
    lastCheckin: now
  });

  alert("Recompensa diaria recibida");
  loadUser(currentUser.uid);
};

// ===============================
// AUTENTICACIÓN
// ===============================
onAuthStateChanged(auth, (user) => {

  if (user) {
    currentUser = user;
    loadUser(user.uid);
    renderProducts();
    renderOrders();
  } else {
    // Espera 500ms antes de redirigir
    setTimeout(() => {
      if (!auth.currentUser) {
        window.location.href = "index.html";
      }
    }, 500);
  }

});
