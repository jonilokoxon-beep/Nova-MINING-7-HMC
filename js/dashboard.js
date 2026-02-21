// =====================================================
// 🔥 FIREBASE CONFIG
// =====================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =====================================================
// 🔐 AUTH STATE
// =====================================================
onAuthStateChanged(auth, async user => {

  if (user) {
    showApp();
    await cargarDashboard();
    await cargarProductos();
    await cargarOrdenes();
    await cargarPerfil();

    const snap = await getDoc(doc(db, "users", user.uid));
    const userData = snap.data();
    activarBotonAdmin(userData);

  } else {
    showLogin();
  }
});

// =====================================================
// 🔐 LOGIN
// =====================================================
document.getElementById("loginBtn")?.addEventListener("click", async () => {

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  await signInWithEmailAndPassword(auth, email, password);
});

// =====================================================
// 📝 REGISTER
// =====================================================
document.getElementById("registerBtn")?.addEventListener("click", async () => {

  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    email,
    balance: 0,
    totalWithdrawn: 0,
    role: "user",
    createdAt: serverTimestamp()
  });
});

// =====================================================
// 🚪 LOGOUT
// =====================================================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
});

// =====================================================
// 🔄 VISTAS
// =====================================================
function showLogin() {
  loginView.style.display = "block";
  registerView.style.display = "none";
  appView.style.display = "none";
}

function showApp() {
  loginView.style.display = "none";
  registerView.style.display = "none";
  appView.style.display = "block";
}

document.getElementById("goRegister").onclick = () => {
  loginView.style.display = "none";
  registerView.style.display = "block";
};

document.getElementById("goLogin").onclick = () => {
  registerView.style.display = "none";
  loginView.style.display = "block";
};

// =====================================================
// 📌 NAVEGACIÓN INTERNA
// =====================================================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(id).style.display = "block";
};

// =====================================================
// 📊 FUNCIONES
// =====================================================
async function cargarDashboard() {
  const user = auth.currentUser;
  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  document.getElementById("stat-balance").innerText =
    Number(data.balance || 0).toFixed(2);

  document.getElementById("stat-withdrawn").innerText =
    Number(data.totalWithdrawn || 0).toFixed(2);
}

async function cargarProductos() {
  const list = document.getElementById("productsList");
  const snap = await getDocs(collection(db, "products"));
  list.innerHTML = "";

  snap.forEach(d => {
    const p = d.data();
    list.innerHTML += `<div>${p.name} - $${p.price}</div>`;
  });
}

async function cargarOrdenes() {
  const user = auth.currentUser;
  const q = query(collection(db, "orders"), where("userId", "==", user.uid));
  const snap = await getDocs(q);
  const container = document.getElementById("ordersList");
  container.innerHTML = "";

  snap.forEach(d => {
    const o = d.data();
    container.innerHTML += `<div>${o.productName} - $${o.amount}</div>`;
  });
}

async function cargarPerfil() {
  const user = auth.currentUser;
  document.getElementById("p-id").innerText = user.uid.slice(0, 8);
}

function activarBotonAdmin(userData) {
  const btn = document.getElementById("adminFab");
  if (userData?.role === "admin") {
    btn.style.display = "flex";
  }
}
