// ===============================
// 🔥 FIREBASE IMPORTS
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
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

// ===============================
// 🔹 CONFIG FIREBASE
// ===============================
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

// ===============================
// 📌 NAVEGACIÓN
// ===============================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(id).style.display = "block";
};

// ===============================
// 🔐 SESIÓN
// ===============================
onAuthStateChanged(auth, async user => {
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
      totalEarned: 0,
      createdAt: serverTimestamp()
    });
  }

  await cargarDashboard();
  await cargarProductos();
  await cargarOrdenes();

  go("inicio");
});

// ===============================
// 📊 DASHBOARD (SALDO + GANANCIAS)
// ===============================
async function cargarDashboard() {
  const user = auth.currentUser;
  if (!user) return;

  const saldoBox = document.querySelector(".box.blue b");
  const gananciasBox = document.querySelector(".box.green b");
  const retiradoBox = document.querySelector(".box.gold b");

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  let saldo = userSnap.data().balance || 0;
  let totalGanado = 0;

  // 🔁 CALCULAR GANANCIAS DESDE ÓRDENES
  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const ordersSnap = await getDocs(q);

  ordersSnap.forEach(o => {
    const d = o.data();
    totalGanado += Number(d.dailyProfit || 0);
  });

  saldoBox.innerText = `$${saldo.toFixed(2)}`;
  gananciasBox.innerText = `$${totalGanado.toFixed(2)}`;
  retiradoBox.innerText = `$0.00`;
}

// ===============================
// 🛒 PRODUCTOS
// ===============================
async function cargarProductos() {
  const list = document.getElementById("productsList");
  list.innerHTML = "Cargando productos...";

  const snap = await getDocs(collection(db, "products"));

  if (snap.empty) {
    list.innerHTML = "No hay productos";
    return;
  }

  list.innerHTML = "";

  snap.forEach(docSnap => {
    const p = docSnap.data();
    if (!p.active) return;

    list.innerHTML += `
      <div class="plan">
        <h4>${p.name}</h4>
        <p>Precio: $${p.price}</p>
        <p>Ganancia diaria: $${p.profit}</p>
        <p>Duración: ${p.duration} días</p>
        <button class="btn-invertir" data-id="${docSnap.id}">
          Invertir
        </button>
      </div>
    `;
  });
}

// ===============================
// 📦 ÓRDENES
// ===============================
async function cargarOrdenes() {
  const list = document.getElementById("ordersList");
  const totalBox = document.getElementById("totalProfit");

  list.innerHTML = "";
  let total = 0;

  const user = auth.currentUser;
  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const o = docSnap.data();
    total += Number(o.dailyProfit);

    list.innerHTML += `
      <div class="order">
        <b>${o.productName}</b>
        <p>Ganancia diaria: $${o.dailyProfit}</p>
        <p>Días: ${o.duration}</p>
      </div>
    `;
  });

  totalBox.innerText = `$${total.toFixed(2)}`;
}

// ===============================
// 💰 INVERTIR
// ===============================
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-invertir")) return;

  const productId = e.target.dataset.id;
  const user = auth.currentUser;

  if (!user) {
    alert("❌ Usuario no autenticado");
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("❌ Usuario no encontrado en base de datos");
      return;
    }

    const saldo = Number(userSnap.data().balance || 0);

    const prodRef = doc(db, "products", productId);
    const prodSnap = await getDoc(prodRef);

    if (!prodSnap.exists()) {
      alert("❌ Producto no encontrado");
      return;
    }

    const p = prodSnap.data();

    if (saldo < p.price) {
      alert("❌ Saldo insuficiente");
      return;
    }

    await updateDoc(userRef, {
      balance: saldo - p.price
    });

    await addDoc(collection(db, "orders"), {
      uid: user.uid,
      userEmail: user.email,
      productId: productId,
      productName: p.name,
      amount: p.price,
      dailyProfit: p.profit,
      duration: p.duration,
      createdAt: serverTimestamp(),
      lastClaim: serverTimestamp(),
      status: "active"
    });

    alert("✅ Inversión realizada con éxito");

    loadOrders();
    go("orders");

  } catch (err) {
    console.error("Error al invertir:", err);
    alert("❌ Error al realizar la inversión");
  }
});

// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = function () {
  signOut(auth).then(() => location.replace("login.html"));
};
