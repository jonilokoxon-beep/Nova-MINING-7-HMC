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
// 🔐 CONTROL SESIÓN
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
// 💰 PRODUCTOS (ANTI UNDEFINED)
// ===============================
async function cargarProductos() {

const list = document.getElementById("productsList");
if (!list) return;

const snap = await getDocs(collection(db, "products"));
list.innerHTML = "";

snap.forEach(docSnap => {

const p = docSnap.data();

// 🔥 Protección total contra undefined
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
await cargarOrdenes();
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
// 💳 DEPÓSITO
// ===============================
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

alert("Retiro enviado con 17% comisión");
await cargarDashboard();
});


// ===============================
// 🎁 CÓDIGO REGALO
// ===============================
document.getElementById("btn-redeem")?.addEventListener("click", async () => {

const code = document.getElementById("giftCode").value.trim();
if (!code) return alert("Ingresa un código");

const snap = await getDoc(doc(db, "giftCodes", code));
if (!snap.exists()) return alert("Código inválido");

const data = snap.data();
if (data.used) return alert("Código ya usado");

const user = auth.currentUser;
const userRef = doc(db, "users", user.uid);
const userSnap = await getDoc(userRef);
const userData = userSnap.data();

await updateDoc(userRef, {
balance: Number(userData.balance || 0) + Number(data.amount)
});

await updateDoc(doc(db, "giftCodes", code), {
used: true,
usedBy: user.uid
});

alert("Código aplicado con éxito");
await cargarDashboard();
});


// ===============================
// 🤝 REFERIDOS
// ===============================
document.getElementById("saveRef")?.addEventListener("click", async () => {

const refId = document.getElementById("refInput").value.trim();
if (!refId) return;

const user = auth.currentUser;
const userRef = doc(db, "users", user.uid);

await updateDoc(userRef, {
referrerId: refId
});

alert("Código de referido guardado");
});


// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = async function () {
await signOut(auth);
location.replace("./index.html");
};
