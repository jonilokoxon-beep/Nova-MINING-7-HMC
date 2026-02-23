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
data.level||0;

updateVipUI(data.level||0);
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
    <div class="product-card">

      <div class="product-image">
        <img src="${p.image}" alt="${p.name}">
        ${p.tag ? `<div class="product-tag">${p.tag}</div>` : ""}
      </div>

      <div class="product-top">
        <span class="mode">${p.mode || ""}</span>
      </div>

      <h3 class="product-title">${p.name}</h3>

      <div class="product-price">
        $${p.price}
        <button class="invest-btn invertir" data-id="${docSnap.id}">
          Invertir
        </button>
      </div>

      <div class="product-info">
        <div>
          <strong>Ingresos totales:</strong>
          $${p.totalIncome}
        </div>
        <div>
          <strong>Cuota:</strong>
          ${p.quota}
        </div>
        <div>
          <strong>Ciclo:</strong>
          ${p.cycleDays} días
        </div>
        <div>
          <strong>Ingresos diarios:</strong>
          $${p.dailyProfit}
        </div>
      </div>

    </div>
    `;
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
let orderIntervals = {};

// ===============================
// CARGAR ORDENES PREMIUM
// ===============================
async function cargarOrdenes(){
  const user = auth.currentUser;
  const container = document.getElementById("ordersList");
  if(!container || !user) return;

  container.innerHTML="";

  const q = query(
    collection(db,"orders"),
    where("userId","==",user.uid)
  );

  const snap = await getDocs(q);

  snap.forEach(docSnap=>{
    const o = docSnap.data();
    const orderId = docSnap.id;

    container.innerHTML+=`
    <div class="order-card" id="order-${orderId}">
      
      <div class="order-image">
        <img src="${o.image}">
        <span class="order-mode">${o.mode}</span>
      </div>

      <h3>${o.productName}</h3>

      <!-- BARRA PROGRESO -->
      <div class="progress-bar">
        <div class="progress-fill" 
          style="width:${calcularProgreso(o)}%">
        </div>
      </div>

      <div class="order-stats">
        <div>$${o.dailyProfit}<br><small>Ganancia diaria</small></div>
        <div>${o.cycleDays} d<br><small>Ciclo</small></div>
        <div>$${o.totalProfit}<br><small>Ganancia total</small></div>
      </div>

      <div class="countdown" id="countdown-${orderId}">
        Cargando...
      </div>

      <div class="order-bottom">
        <div class="earn" id="earn-${orderId}">
          +$${o.received || 0}
        </div>
        <button 
          class="receive-btn"
          id="btn-${orderId}"
          data-id="${orderId}"
        >
          Recibir
        </button>
      </div>

    </div>
    `;

    iniciarContador(orderId, o);
  });
}

// ===============================
// CALCULAR PROGRESO DEL CICLO
// ===============================
function calcularProgreso(o){
  const now = Date.now();
  const end = o.startDate + (o.cycleDays*24*60*60*1000);
  const total = end - o.startDate;
  const passed = now - o.startDate;
  return Math.min(100,(passed/total)*100);
}

// ===============================
// CONTADOR EN VIVO
// ===============================
function iniciarContador(orderId, o){

  if(orderIntervals[orderId]){
    clearInterval(orderIntervals[orderId]);
  }

  orderIntervals[orderId] = setInterval(()=>{

    const now = Date.now();
    const endCycle = o.startDate + (o.cycleDays * 24 * 60 * 60 * 1000);

    const btn = document.getElementById(`btn-${orderId}`);
    const countdown = document.getElementById(`countdown-${orderId}`);

    if(!btn || !countdown) return;

    // SI TERMINÓ CICLO
    if(now >= endCycle){
      countdown.innerHTML = "🏁 Ciclo finalizado";
      btn.disabled = true;
      btn.innerHTML = "Finalizado";
      btn.classList.remove("active-btn");
      clearInterval(orderIntervals[orderId]);
      return;
    }

    const nextClaim = o.lastClaim + (24 * 60 * 60 * 1000);
    const timeLeft = nextClaim - now;

    if(timeLeft <= 0){
      countdown.innerHTML = "🟢 Disponible ahora";
      btn.disabled = false;
      btn.classList.add("active-btn");
    }else{
      const h = Math.floor(timeLeft / (1000*60*60));
      const m = Math.floor((timeLeft % (1000*60*60)) / (1000*60));
      const s = Math.floor((timeLeft % (1000*60)) / 1000);

      countdown.innerHTML = `⏳ ${h}h ${m}m ${s}s`;
      btn.disabled = true;
      btn.classList.remove("active-btn");
    }

  },1000);
}

// ===============================
// BOTON RECIBIR
// ===============================
document.addEventListener("click", async (e)=>{
  if(e.target.classList.contains("receive-btn")){

    const id = e.target.dataset.id;
    const orderRef = doc(db,"orders",id);
    const snap = await getDoc(orderRef);

    if(!snap.exists()) return;

    const data = snap.data();
    const now = Date.now();
    const nextClaim = data.lastClaim + (24*60*60*1000);

    if(now < nextClaim) return;

    const newReceived = (data.received || 0) + data.dailyProfit;

    await updateDoc(orderRef,{
      received: newReceived,
      lastClaim: now
    });

    // SUMAR AL BALANCE
    const userRef = doc(db,"users",data.userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    await updateDoc(userRef,{
      balance: (userData.balance || 0) + data.dailyProfit
    });

    cargarOrdenes();
  }
});
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

  console.log("ROLE:", data.role);

  const fab = document.getElementById("adminFab");
  const perfilBtn = document.getElementById("adminBtn");

  if(data.role === "admin"){
    if(fab) fab.style.display = "flex";
    if(perfilBtn) perfilBtn.style.display = "inline-block";
  }else{
    if(fab) fab.style.display = "none";
    if(perfilBtn) perfilBtn.style.display = "none";
  }

}

// =====================================================
// 🏦 GUARDAR CUENTA BANCARIA
// =====================================================

document.addEventListener("click", async (e)=>{
  if(e.target.id === "saveBankBtn"){

    const user = auth.currentUser;
    if(!user) return;

    const bankName = document.getElementById("bankName").value.trim();
    const accountNumber = document.getElementById("accountNumber").value.trim();
    const accountHolder = document.getElementById("accountHolder").value.trim();

    if(!bankName || !accountNumber || !accountHolder){
      alert("Completa todos los campos");
      return;
    }

    const userRef = doc(db,"users",user.uid);

    await updateDoc(userRef,{
      bankData:{
        bankName,
        accountNumber,
        accountHolder
      }
    });

    document.getElementById("bankStatus").innerText =
      "Cuenta guardada correctamente ✅";
  }
});

// =====================================================
// 🚪 LOGOUT
// =====================================================
document.getElementById("logoutBtn")?.addEventListener("click",async()=>{
await signOut(auth);
});
