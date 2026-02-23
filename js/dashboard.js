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
serverTimestamp,
onSnapshot
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

function showLogin(){
loginView.style.display="block";
registerView.style.display="none";
appView.style.display="none";
}

function showRegister(){
loginView.style.display="none";
registerView.style.display="block";
appView.style.display="none";
}

function showApp(){
loginView.style.display="none";
registerView.style.display="none";
appView.style.display="block";
}

document.getElementById("goRegister")?.addEventListener("click",e=>{
e.preventDefault();
showRegister();
});

document.getElementById("goLogin")?.addEventListener("click",e=>{
e.preventDefault();
showLogin();
});

// =====================================================
// 🔐 LOGIN
// =====================================================
document.getElementById("loginBtn")?.addEventListener("click", async () => {
const email = document.getElementById("email")?.value.trim();
const password = document.getElementById("password")?.value.trim();
if (!email || !password) return alert("Completa los campos");

try{
await signInWithEmailAndPassword(auth,email,password);
}catch(e){ alert(e.message); }
});

// =====================================================
// 📝 REGISTER
// =====================================================
document.getElementById("registerBtn")?.addEventListener("click", async () => {
const email = document.getElementById("regEmail")?.value.trim();
const password = document.getElementById("regPassword")?.value.trim();
if (!email || !password) return alert("Completa los campos");

try{
const cred = await createUserWithEmailAndPassword(auth,email,password);
await setDoc(doc(db,"users",cred.user.uid),{
uid:cred.user.uid,
email,
balance:0,
totalInvested:0,
totalProfit:0,
totalWithdrawn:0,
level:1,
role:"user",
suspended:false,
createdAt:serverTimestamp()
});
}catch(e){ alert(e.message); }
});

// =====================================================
// 🔄 ESTADO GLOBAL
// =====================================================
onAuthStateChanged(auth,async user=>{
if(!user){ showLogin(); return; }
showApp();
activarUsuario(user);
});

// =====================================================
// 👤 ACTIVAR USUARIO
// =====================================================
function activarUsuario(user){

const userRef = doc(db,"users",user.uid);

onSnapshot(userRef,snap=>{
const data = snap.data();
if(!data) return;

if(data.suspended){
alert("Cuenta suspendida");
signOut(auth);
return;
}

document.getElementById("stat-balance").innerText =
Number(data.balance||0).toFixed(2);

document.getElementById("p-balance").innerText =
Number(data.balance||0).toFixed(2);

document.getElementById("p-id").innerText =
user.uid.slice(0,8);

document.getElementById("p-vip").innerText =
data.level||1;

updateVipUI(data.level||1);
activarBotonAdmin(data);
});

cargarProductos();
cargarOrdenes();
cargarHistorial();
}

// =====================================================
// 📌 NAV
// =====================================================
window.go = function(id){
document.querySelectorAll(".page").forEach(p=>p.style.display="none");
document.getElementById(id).style.display="block";
};

// =====================================================
// 💰 PRODUCTOS
// =====================================================
async function cargarProductos(){
const list = document.getElementById("productsList");
if(!list) return;
list.innerHTML="";
const snap = await getDocs(collection(db,"products"));
snap.forEach(docSnap=>{
const p = docSnap.data();
list.innerHTML+=`
<div class="card">
<h4>${p.name}</h4>
<p>Precio: $${p.price}</p>
<p>Ganancia diaria: $${p.dailyProfit}</p>
<button class="invertir" data-id="${docSnap.id}">Invertir</button>
</div>`;
});
}

// =====================================================
// 💸 INVERTIR
// =====================================================
document.addEventListener("click",async e=>{
if(!e.target.classList.contains("invertir")) return;

const user = auth.currentUser;
const productId = e.target.dataset.id;

const userRef = doc(db,"users",user.uid);
const userSnap = await getDoc(userRef);
const userData = userSnap.data();

const prodSnap = await getDoc(doc(db,"products",productId));
const p = prodSnap.data();

if(userData.balance < p.price){
alert("Saldo insuficiente");
return;
}

await updateDoc(userRef,{
balance:userData.balance - p.price,
totalInvested:(userData.totalInvested||0)+p.price
});

await addDoc(collection(db,"orders"),{
userId:user.uid,
productName:p.name,
amount:p.price,
dailyProfit:p.dailyProfit,
status:"active",
createdAt:serverTimestamp()
});

alert("Inversión realizada");
});

// =====================================================
// 📦 ÓRDENES
// =====================================================
async function cargarOrdenes(){
const user = auth.currentUser;
const container = document.getElementById("ordersList");
if(!container) return;
container.innerHTML="";
const q = query(collection(db,"orders"),
where("userId","==",user.uid));
const snap = await getDocs(q);
snap.forEach(d=>{
const o = d.data();
container.innerHTML+=`
<div class="card">
<h4>${o.productName}</h4>
<p>$${o.amount}</p>
<p>Ganancia diaria: $${o.dailyProfit}</p>
</div>`;
});
}

// =====================================================
// 📜 HISTORIAL
// =====================================================
async function cargarHistorial(){
const user = auth.currentUser;
const box = document.getElementById("transactionHistory");
if(!box) return;
box.innerHTML="";
const q = query(collection(db,"withdrawals"),
where("userId","==",user.uid));
const snap = await getDocs(q);
snap.forEach(d=>{
const w = d.data();
box.innerHTML+=`<div>Retiro: $${w.amount} - ${w.status}</div>`;
});
}

// =====================================================
// 💳 DEPÓSITO
// =====================================================
document.getElementById("btn-deposit")?.addEventListener("click", async ()=>{
const user = auth.currentUser;
const amount = prompt("Ingresa monto a depositar");
if(!amount || Number(amount)<=0) return;

const userRef = doc(db,"users",user.uid);
const snap = await getDoc(userRef);
const data = snap.data();

await updateDoc(userRef,{
balance:(data.balance||0)+Number(amount)
});

await addDoc(collection(db,"deposits"),{
userId:user.uid,
amount:Number(amount),
status:"approved",
createdAt:serverTimestamp()
});

alert("Depósito agregado");
});

// =====================================================
// 💸 RETIRO
// =====================================================
document.getElementById("withdrawBtn")?.addEventListener("click", async ()=>{
const user = auth.currentUser;
const amount = Number(document.getElementById("withdrawAmount").value);
if(!amount || amount<=0) return alert("Monto inválido");

const userRef = doc(db,"users",user.uid);
const snap = await getDoc(userRef);
const data = snap.data();

if(data.balance < amount){
alert("Saldo insuficiente");
return;
}

await updateDoc(userRef,{
balance:data.balance - amount,
totalWithdrawn:(data.totalWithdrawn||0)+amount
});

await addDoc(collection(db,"withdrawals"),{
userId:user.uid,
amount,
status:"pending",
createdAt:serverTimestamp()
});

alert("Retiro solicitado");
});

// =====================================================
// 🔥 VIP
// =====================================================
function updateVipUI(level){
const vipLevel = document.getElementById("vipLevel");
if(!vipLevel) return;

document.getElementById("vipLevel").innerText = level;
document.getElementById("vipLevelText").innerText = level;
document.getElementById("vipLevelDisplay").innerText = "Nivel " + level;

const progressFill = document.getElementById("vipProgressFill");
if(progressFill){
let progress = (level / 18) * 100;
progressFill.style.width = progress + "%";
}
}

// =====================================================
// ⚙ ADMIN BUTTON
// =====================================================
function activarBotonAdmin(data){
const btn = document.getElementById("adminFab");
if(!btn) return;

if(data.role === "admin"){
btn.style.display="flex";
}else{
btn.style.display="none";
}
}

// =====================================================
// 🚪 LOGOUT
// =====================================================
document.getElementById("logoutBtn")?.addEventListener("click",async()=>{
await signOut(auth);
});
