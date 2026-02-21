// ===============================
// 🔥 IMPORTAR FIREBASE
// ===============================
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===============================
// 📌 NAVEGACIÓN SEGURA
// ===============================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  const page = document.getElementById(id);
  if (page) page.style.display = "block";
};


// ===============================
// 🔐 CONTROL DE SESIÓN
// ===============================
onAuthStateChanged(auth, async user => {

  try {

    if (!user) {
      location.replace("./index.html");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        balance: 0,
        totalInvested: 0,
        totalWithdrawn: 0,
        level: 0,
        createdAt: serverTimestamp()
      });
    }

    go("inicio");

    await Promise.all([
      cargarProductos(),
      cargarDashboard(),
      cargarOrdenes(),
      cargarPerfil(),
      cargarExtras(),
      cargarHistorial()
    ]);

  } catch (error) {
    console.error("Error general:", error);
  }

});


// ===============================
// 📊 DASHBOARD
// ===============================
async function cargarDashboard() {

  try {

    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;

    const data = snap.data();

    const saldo = Number(data.balance || 0);
    const retirado = Number(data.totalWithdrawn || 0);

    document.getElementById("stat-balance").innerText = saldo.toFixed(2);
    document.getElementById("stat-withdrawn").innerText = retirado.toFixed(2);

  } catch (error) {
    console.error("Error dashboard:", error);
  }
}


// ===============================
// 🔱 VIP + EQUIPO
// ===============================
async function cargarExtras() {

  try {

    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const totalInv = Number(data.totalInvested || 0);

    let level = 0;
    if (totalInv >= 5000) level = 4;
    else if (totalInv >= 2000) level = 3;
    else if (totalInv >= 1000) level = 2;
    else if (totalInv >= 200) level = 1;

    document.getElementById("p-vip").innerText = level;

    const q = query(collection(db, "users"), where("referrerId", "==", user.uid));
    const teamSnap = await getDocs(q);

    document.getElementById("teamCountHome").innerText = teamSnap.size;

  } catch (error) {
    console.error("Error extras:", error);
  }
}


// ===============================
// 💰 PRODUCTOS
// ===============================
async function cargarProductos() {

  try {

    const list = document.getElementById("productsList");
    if (!list) return;

    const snap = await getDocs(collection(db, "products"));

    list.innerHTML = "";

    if (snap.empty) {
      list.innerHTML = "<p style='padding:15px'>No hay productos disponibles</p>";
      return;
    }

    snap.forEach(docSnap => {

      const p = docSnap.data();

      const precio = Number(p.amount ?? p.price ?? 0);
      const ganancia = Number(p.dailyProfit ?? p.profit ?? 0);
      const duracion = Number(p.duration ?? p.days ?? 0);

      list.innerHTML += `
        <div class="card">
          <h4>${p.name || "Producto"}</h4>
          <p>Precio: $${precio}</p>
          <p>Ganancia diaria: $${ganancia}</p>
          <p>Duración: ${duracion} días</p>
          <button class="btn-invertir" data-id="${docSnap.id}">
            Invertir
          </button>
        </div>
      `;
    });

  } catch (error) {
    console.error("Error productos:", error);
  }
}


// ===============================
// 💸 INVERTIR
// ===============================
document.addEventListener("click", async (e) => {

  if (!e.target.classList.contains("btn-invertir")) return;

  try {

    const productId = e.target.dataset.id;
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const prodSnap = await getDoc(doc(db, "products", productId));
    const p = prodSnap.data();

    const precio = Number(p.amount ?? p.price ?? 0);

    if (Number(userData.balance || 0) < precio) {
      alert("Saldo insuficiente");
      return;
    }

    await updateDoc(userRef, {
      balance: Number(userData.balance) - precio,
      totalInvested: Number(userData.totalInvested || 0) + precio
    });

    await addDoc(collection(db, "orders"), {
      userId: user.uid,
      productName: p.name,
      amount: precio,
      dailyProfit: p.dailyProfit ?? p.profit ?? 0,
      duration: p.duration ?? p.days ?? 0,
      status: "active",
      createdAt: serverTimestamp()
    });

    alert("Inversión realizada");

    await cargarDashboard();
    await cargarOrdenes();

  } catch (error) {
    console.error("Error invertir:", error);
  }

});


// ===============================
// 📦 ÓRDENES
// ===============================
async function cargarOrdenes() {

  try {

    const user = auth.currentUser;
    if (!user) return;

    const container = document.getElementById("ordersList");
    if (!container) return;

    const snap = await getDocs(
      query(collection(db, "orders"), where("userId", "==", user.uid))
    );

    container.innerHTML = "";

    snap.forEach(docSnap => {
      const o = docSnap.data();

      container.innerHTML += `
        <div class="card">
          <h4>${o.productName}</h4>
          <p>Inversión: $${o.amount}</p>
          <p>Ganancia diaria: $${o.dailyProfit}</p>
          <p>Duración: ${o.duration} días</p>
          <p>Estado: ${o.status}</p>
        </div>
      `;
    });

  } catch (error) {
    console.error("Error órdenes:", error);
  }
}


// ===============================
// 👤 PERFIL
// ===============================
async function cargarPerfil() {

  try {

    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;

    const data = snap.data();

    document.getElementById("p-id").innerText = user.uid.slice(0, 8);
    document.getElementById("p-balance").innerText =
      Number(data.balance || 0).toFixed(2);

  } catch (error) {
    console.error("Error perfil:", error);
  }
}


// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = async function () {
  await signOut(auth);
  location.replace("./index.html");
};
