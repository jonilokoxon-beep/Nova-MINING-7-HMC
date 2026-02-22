// =====================================================
// 🔥 FIREBASE CONFIG
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyALrk15Qvqrq6zCVTxZ7U9wSnnZIqeSmv4",
  authDomain: "novagrow-app.firebaseapp.com",
  projectId: "novagrow-app",
  storageBucket: "novagrow-app.appspot.com",
  messagingSenderId: "976275033149",
  appId: "1:976275033149:web:e40c6510684bd06c82ae54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =====================================================
// 📌 VISTAS
// =====================================================
const loginView = document.getElementById("loginView");
const registerView = document.getElementById("registerView");
const appView = document.getElementById("appView");

function showLogin() {
  loginView.style.display = "block";
  registerView.style.display = "none";
  appView.style.display = "none";
}

function showRegister() {
  loginView.style.display = "none";
  registerView.style.display = "block";
  appView.style.display = "none";
}

function showApp() {
  loginView.style.display = "none";
  registerView.style.display = "none";
  appView.style.display = "block";
}

// =====================================================
// 🔁 CAMBIO LOGIN / REGISTER
// =====================================================
document.getElementById("goRegister")?.addEventListener("click", e => {
  e.preventDefault();
  showRegister();
});

document.getElementById("goLogin")?.addEventListener("click", e => {
  e.preventDefault();
  showLogin();
});

// =====================================================
// 🔐 LOGIN
// =====================================================
document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Completa todos los campos");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
});

// =====================================================
// 📝 REGISTER
// =====================================================
document.getElementById("registerBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  if (!email || !password) {
    alert("Completa todos los campos");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      balance: 0,
      totalInvested: 0,
      totalProfit: 0,
      totalWithdrawn: 0,
      role: "user",
      createdAt: serverTimestamp()
    });

  } catch (error) {
    alert(error.message);
  }
});

// =====================================================
// 🔄 ESTADO GLOBAL
// =====================================================
onAuthStateChanged(auth, async user => {

  if (!user) {
    showLogin();
    return;
  }

  showApp();

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("stat-balance").innerText =
    Number(data.balance || 0).toFixed(2);

  document.getElementById("p-balance").innerText =
    Number(data.balance || 0).toFixed(2);

  document.getElementById("p-id").innerText =
    user.uid.slice(0, 8);

  activarBotonAdmin(data);

  await cargarProductos();
  await cargarOrdenes();
  await cargarHistorial();
});

// =====================================================
// 📌 NAVEGACIÓN INTERNA
// =====================================================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const page = document.getElementById(id);
  if (page) page.style.display = "block";
};

// =====================================================
// ⚙ ADMIN
// =====================================================
function activarBotonAdmin(userData) {
  const btn = document.getElementById("adminFab");
  if (!btn) return;

  btn.style.display = userData.role === "admin" ? "flex" : "none";
}

// =====================================================
// 💰 PRODUCTOS
// =====================================================
async function cargarProductos() {

  const list = document.getElementById("productsList");
  if (!list) return;

  const snap = await getDocs(collection(db, "products"));
  list.innerHTML = "";

  snap.forEach(docSnap => {
    const p = docSnap.data();

    list.innerHTML += `
      <div class="card">
        <h4>${p.name}</h4>
        <p>Precio: $${p.price}</p>
        <p>Ganancia diaria: $${p.dailyProfit}</p>
        <button class="btn-invertir" data-id="${docSnap.id}">
          Invertir
        </button>
      </div>
    `;
  });
}

// =====================================================
// 💸 INVERTIR
// =====================================================
document.addEventListener("click", async (e) => {

  if (!e.target.classList.contains("btn-invertir")) return;

  const user = auth.currentUser;
  if (!user) return;

  const productId = e.target.dataset.id;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const prodSnap = await getDoc(doc(db, "products", productId));
  const p = prodSnap.data();

  if ((userData.balance || 0) < p.price) {
    alert("Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: userData.balance - p.price
  });

  await addDoc(collection(db, "orders"), {
    userId: user.uid,
    productName: p.name,
    amount: p.price,
    dailyProfit: p.dailyProfit,
    status: "active",
    createdAt: serverTimestamp()
  });

  alert("Inversión realizada");

  onAuthStateChanged(auth, () => {});
});

// =====================================================
// 📦 ÓRDENES
// =====================================================
async function cargarOrdenes() {

  const user = auth.currentUser;
  if (!user) return;

  const container = document.getElementById("ordersList");
  if (!container) return;

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid)
  );

  const snap = await getDocs(q);
  container.innerHTML = "";

  snap.forEach(docSnap => {
    const o = docSnap.data();

    container.innerHTML += `
      <div class="card">
        <h4>${o.productName}</h4>
        <p>Inversión: $${o.amount}</p>
        <p>Ganancia diaria: $${o.dailyProfit}</p>
      </div>
    `;
  });
}

// =====================================================
// 📜 HISTORIAL
// =====================================================
async function cargarHistorial() {

  const user = auth.currentUser;
  if (!user) return;

  const box = document.getElementById("transactionHistory");
  if (!box) return;

  const snap = await getDocs(
    query(collection(db, "withdrawals"), where("userId", "==", user.uid))
  );

  box.innerHTML = "";

  snap.forEach(d => {
    const w = d.data();
    box.innerHTML += `
      <div style="padding:5px;">
        Retiro: $${w.amount} - ${w.status}
      </div>
    `;
  });
}

// =====================================================
// 🚪 LOGOUT
// =====================================================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
});
