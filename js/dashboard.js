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
// 📌 NAVEGACIÓN
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
totalProfit: 0,
totalWithdrawn: 0,
level: 0,
referrerId: null,
createdAt: serverTimestamp()
});
}

go("inicio");

await cargarDashboard();
await cargarProductos();
await cargarOrdenes();
await cargarPerfil();
await cargarExtras();
await cargarHistorial();
});


// ===============================
// 📊 DASHBOARD
// ===============================
async function cargarDashboard() {

const user = auth.currentUser;
if (!user) return;

const snap = await getDoc(doc(db, "users", user.uid));
const data = snap.data();

const saldo = Number(data.balance || 0);
const retirado = Number(data.totalWithdrawn || 0);

let ganancias = 0;

const q = query(
collection(db, "orders"),
where("userId", "==", user.uid),
where("status", "==", "active")
);

const snapOrders = await getDocs(q);

snapOrders.forEach(d => {
ganancias += Number(d.data().dailyProfit || 0);
});

document.getElementById("stat-balance").innerText = "$" + saldo.toFixed(2);
document.getElementById("stat-profit").innerText = "$" + ganancias.toFixed(2);
document.getElementById("stat-withdrawn").innerText = "$" + retirado.toFixed(2);
}


// ===============================
// 🔱 VIP + EQUIPO
// ===============================
async function cargarExtras() {

const user = auth.currentUser;
if (!user) return;

const userRef = doc(db, "users", user.uid);
const snap = await getDoc(userRef);
const data = snap.data();

const totalInv = Number(data.totalInvested || 0);

let level = 0;
if (totalInv >= 5000) level = 4;
else if (totalInv >= 2000) level = 3;
else if (totalInv >= 1000) level = 2;
else if (totalInv >= 200) level = 1;

if (data.level !== level) {
await updateDoc(userRef, { level });
}

document.getElementById("p-vip").innerText = level;

const q = query(collection(db, "users"), where("referrerId", "==", user.uid));
const teamSnap = await getDocs(q);

document.getElementById("teamCountHome").innerText = teamSnap.size;
}


// ===============================
// 💰 PRODUCTOS (ANTI UNDEFINED)
// ===============================
async function cargarProductos() {

const list = document.getElementById("productsList");
if (!list) return;

const snap = await getDocs(collection(db, "products"));
list.innerHTML = "";

snap.forEach(docSnap => {

const p = docSnap.data();

const price = Number(p.amount ?? p.price ?? 0);
const profit = Number(p.dailyProfit ?? p.profit ?? 0);
const duration = Number(p.duration ?? 0);
const name = p.name ?? "Producto";

list.innerHTML += `
<div class="card">
<h4>${name}</h4>
<p>Precio: $${price}</p>
<p>Ganancia diaria: $${profit}</p>
<p>Duración: ${duration} días</p>
<button class="btn-invertir" data-id="${docSnap.id}">
Invertir
</button>
</div>
`;
});
}


// ===============================
// 💸 INVERTIR
// ===============================
document.addEventListener("click", async (e) => {

if (!e.target.classList.contains("btn-invertir")) return;

const productId = e.target.dataset.id;
const user = auth.currentUser;
if (!user) return;

const userRef = doc(db, "users", user.uid);
const userSnap = await getDoc(userRef);
const userData = userSnap.data();

const saldo = Number(userData.balance || 0);

const prodSnap = await getDoc(doc(db, "products", productId));
const p = prodSnap.data();

const precio = Number(p.amount ?? p.price ?? 0);
const profit = Number(p.dailyProfit ?? p.profit ?? 0);

if (saldo < precio) {
alert("Saldo insuficiente");
return;
}

await updateDoc(userRef, {
balance: saldo - precio,
totalInvested: (userData.totalInvested || 0) + precio
});

await addDoc(collection(db, "orders"), {
userId: user.uid,
productName: p.name,
amount: precio,
dailyProfit: profit,
duration: p.duration ?? 0,
status: "active",
createdAt: serverTimestamp()
});

alert("Inversión realizada");

await cargarDashboard();
await cargarExtras();
await cargarOrdenes();
go("orders");
});


// ===============================
// 📦 ÓRDENES
// ===============================
async function cargarOrdenes() {

const user = auth.currentUser;
if (!user) return;

const container = document.getElementById("ordersList");
if (!container) return;

const q = query(
collection(db, "orders"),
where("userId", "==", user.uid),
where("status", "==", "active")
);

const snap = await getDocs(q);

container.innerHTML = "";

snap.forEach(docSnap => {
const o = docSnap.data();

container.innerHTML += `
<div class="card">
<h4>${o.productName}</h4>
<p>Inversión: $${Number(o.amount)}</p>
<p>Ganancia diaria: $${Number(o.dailyProfit)}</p>
<p>Duración: ${o.duration} días</p>
</div>
`;
});
}


// ===============================
// 👤 PERFIL
// ===============================
async function cargarPerfil() {

const user = auth.currentUser;
if (!user) return;

const snap = await getDoc(doc(db, "users", user.uid));
const data = snap.data();

document.getElementById("p-id").innerText = user.uid.slice(0, 8);
document.getElementById("p-balance").innerText =
Number(data.balance || 0).toFixed(2);
}


// ===============================
// 💳 DEPÓSITO (MODAL FUNCIONAL)
// ===============================
document.getElementById("btn-deposit")?.addEventListener("click", () => {
document.getElementById("depositModal").style.display = "block";
});

window.closeDeposit = function () {
document.getElementById("depositModal").style.display = "none";
};

document.getElementById("confirmDeposit")?.addEventListener("click", async () => {

const user = auth.currentUser;
if (!user) return;

const amount = Number(document.getElementById("depositAmount").value);
if (!amount || amount <= 0) return alert("Monto inválido");

await addDoc(collection(db, "deposits"), {
userId: user.uid,
amount,
status: "pending",
createdAt: serverTimestamp()
});

alert("Depósito enviado para aprobación");
closeDeposit();
});


// ===============================
// 💸 RETIRO 17%
// ===============================
document.getElementById("withdrawBtn")?.addEventListener("click", async () => {

const user = auth.currentUser;
if (!user) return;

const amount = Number(document.getElementById("withdrawAmount").value);
if (!amount || amount <= 0) return alert("Monto inválido");

const userRef = doc(db, "users", user.uid);
const snap = await getDoc(userRef);
const data = snap.data();

if (data.balance < amount) return alert("Saldo insuficiente");

const fee = amount * 0.17;
const finalAmount = amount - fee;

await updateDoc(userRef, {
balance: data.balance - amount
});

await addDoc(collection(db, "withdrawals"), {
userId: user.uid,
amount,
fee,
finalAmount,
status: "pending",
createdAt: serverTimestamp()
});

alert("Retiro enviado (17% comisión aplicada)");

await cargarDashboard();
await cargarHistorial();
});


// ===============================
// 📜 HISTORIAL
// ===============================
async function cargarHistorial() {

const user = auth.currentUser;
if (!user) return;

const box = document.getElementById("transactionHistory");
if (!box) return;

box.innerHTML = "";

const snap = await getDocs(
query(collection(db, "withdrawals"), where("userId", "==", user.uid))
);

snap.forEach(d => {
const w = d.data();
box.innerHTML += `
<div style="padding:5px;">
Retiro: $${w.amount} - ${w.status}
</div>
`;
});
}


// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = async function () {
await signOut(auth);
location.replace("./index.html");
};
