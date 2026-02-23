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
const email = emailInput("email");
const password = emailInput("password");
if (!email || !password) return alert("Completa los campos");

try{
await signInWithEmailAndPassword(auth,email,password);
}catch(e){ alert(e.message); }
});

// =====================================================
// 📝 REGISTER
// =====================================================
document.getElementById("registerBtn")?.addEventListener("click", async () => {
const email = emailInput("regEmail");
const password = emailInput("regPassword");
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
level:0,
role:"user",
suspended:false,
createdAt:serverTimestamp()
});
}catch(e){ alert(e.message); }
});

function emailInput(id){
return document.getElementById(id)?.value.trim();
}

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
data.level||0;

activarBotonAdmin(data);
});

cargarProductos();
cargarOrdenes();
cargarHistorial();
cargarAdmin();
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
// 💸 RETIRO
// =====================================================
// SOLO AGREGO LO NUEVO A TU CÓDIGO ORIGINAL

// ===== DEPÓSITO =====
document.getElementById("btn-deposit")?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if(!user) return;

  const amount = Number(prompt("Monto a depositar"));
  if(!amount || amount<=0){
    alert("Monto inválido");
    return;
  }

  await addDoc(collection(db,"deposits"),{
    userId:user.uid,
    amount,
    status:"pending",
    createdAt:serverTimestamp()
  });

  alert("Depósito enviado para aprobación");
});

// ===== ADMIN DEPÓSITOS =====
window.aprobarDeposito = async(id,uid,amount)=>{
  const userRef = doc(db,"users",uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  await updateDoc(userRef,{
    balance:(data.balance||0)+Number(amount)
  });

  await updateDoc(doc(db,"deposits",id),{
    status:"approved"
  });

  alert("Depósito aprobado");
};

window.rechazarDeposito = async(id)=>{
  await updateDoc(doc(db,"deposits",id),{
    status:"rejected"
  });

  alert("Depósito rechazado");
};

document.getElementById("withdrawBtn")?.addEventListener("click",async()=>{
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
// 📜 HISTORIAL
// =====================================================
async function cargarHistorial(){
const user = auth.currentUser;
const box = document.getElementById("transactionHistory");
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
// ⚙ ADMIN COMPLETO
// =====================================================
function activarBotonAdmin(data){
document.getElementById("adminFab").style.display =
data.role==="admin"?"flex":"none";
}

async function cargarAdmin(){
const user = auth.currentUser;
const snapUser = await getDoc(doc(db,"users",user.uid));
if(!snapUser.exists()) return;
if(snapUser.data().role!=="admin") return;

const withdrawBox = document.getElementById("pendingWithdrawals");
const depositBox = document.getElementById("pendingDeposits");
const usersBox = document.getElementById("adminUsers");
const statsBox = document.getElementById("adminStats");

const usersSnap = await getDocs(collection(db,"users"));
statsBox.innerHTML = "Usuarios totales: "+usersSnap.size;

usersBox.innerHTML="";
usersSnap.forEach(d=>{
const u = d.data();
usersBox.innerHTML+=`
<div class="card">
${u.email}<br>
Balance: $${u.balance||0}<br>
VIP: ${u.level||0}<br>
<button onclick="modBalance('${u.uid}')">Modificar Balance</button>
<button onclick="modVIP('${u.uid}')">Cambiar VIP</button>
<button onclick="suspenderUser('${u.uid}')">Suspender</button>
</div>`;
});

const wSnap = await getDocs(query(collection(db,"withdrawals"),
where("status","==","pending")));
withdrawBox.innerHTML="";
wSnap.forEach(d=>{
const w=d.data();
withdrawBox.innerHTML+=`
<div class="card">
${w.userId.slice(0,6)} - $${w.amount}
<button onclick="aprobarRetiro('${d.id}')">Aprobar</button>
<button onclick="rechazarRetiro('${d.id}')">Rechazar</button>
</div>`;
});

depositBox.innerHTML="Sistema listo para depósitos";
}

window.modBalance = async(uid)=>{
const val = Number(prompt("Nuevo balance"));
if(isNaN(val)) return;
await updateDoc(doc(db,"users",uid),{balance:val});
};

window.modVIP = async(uid)=>{
const val = Number(prompt("VIP 1-10"));
if(val<1||val>10) return;
await updateDoc(doc(db,"users",uid),{level:val});
};

window.suspenderUser = async(uid)=>{
await updateDoc(doc(db,"users",uid),{suspended:true});
};

window.aprobarRetiro = async(id)=>{
await updateDoc(doc(db,"withdrawals",id),{status:"approved"});
};

window.rechazarRetiro = async(id)=>{
await updateDoc(doc(db,"withdrawals",id),{status:"rejected"});
};

// =====================================================
// 🚪 LOGOUT
// =====================================================
document.getElementById("logoutBtn")?.addEventListener("click",async()=>{
await signOut(auth);
});
