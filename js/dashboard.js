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
  onSnapshot,
  deleteDoc
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
// 🔄 VISTAS
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
// 🔐 LOGIN
// =====================================================
document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) return alert("Completa los campos");

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert(e.message);
  }
});

// =====================================================
// 📝 REGISTER
// =====================================================
document.getElementById("registerBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  if (!email || !password) return alert("Completa los campos");

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    balance: 0,
    totalProfit: 0,
    totalWithdrawn: 0,
    role: "user",
    level: 0,
    suspended: false,
    createdAt: serverTimestamp()
  });
});

// =====================================================
// 🔄 AUTH STATE
// =====================================================
onAuthStateChanged(auth, async user => {
  if (!user) return showLogin();

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  if (data.suspended) {
    alert("Cuenta suspendida");
    await signOut(auth);
    return;
  }

  showApp();
  activarUsuario(user, data);
});

// =====================================================
// 👤 ACTIVAR USUARIO
// =====================================================
function activarUsuario(user, data) {

  onSnapshot(doc(db,"users",user.uid), snap=>{
    const d = snap.data();

    document.getElementById("stat-balance").innerText = Number(d.balance).toFixed(2);
    document.getElementById("stat-profit").innerText = Number(d.totalProfit||0).toFixed(2);
    document.getElementById("stat-withdrawn").innerText = Number(d.totalWithdrawn||0).toFixed(2);

    document.getElementById("p-id").innerText = user.uid.slice(0,8);
    document.getElementById("p-vip").innerText = d.level||0;
    document.getElementById("p-balance").innerText = Number(d.balance).toFixed(2);

    activarBotonAdmin(d);
  });

  cargarProductos();
  cargarOrdenes();
  cargarHistorial();
  cargarAdmin();
}

// =====================================================
// 📌 NAVEGACIÓN
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
  snap.forEach(d=>{
    const p = d.data();
    list.innerHTML+=`
      <div class="card">
        <h4>${p.name}</h4>
        <p>Precio: $${p.price}</p>
        <button onclick="invertir('${d.id}',${p.price})">Invertir</button>
      </div>
    `;
  });
}

window.invertir = async function(id, price){
  const user = auth.currentUser;
  const userRef = doc(db,"users",user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  if(data.balance < price) return alert("Saldo insuficiente");

  await updateDoc(userRef,{
    balance: data.balance - price
  });

  await addDoc(collection(db,"orders"),{
    userId:user.uid,
    productId:id,
    amount:price,
    status:"active",
    createdAt:serverTimestamp()
  });

  alert("Invertido correctamente");
  cargarOrdenes();
}

// =====================================================
// 📦 ÓRDENES
// =====================================================
async function cargarOrdenes(){
  const user = auth.currentUser;
  const box = document.getElementById("ordersList");
  box.innerHTML="";

  const snap = await getDocs(query(collection(db,"orders"),
    where("userId","==",user.uid)));

  snap.forEach(d=>{
    const o=d.data();
    box.innerHTML+=`
      <div class="card">
        Orden $${o.amount} - ${o.status}
      </div>
    `;
  });
}

// =====================================================
// 💸 RETIRO
// =====================================================
document.getElementById("withdrawBtn")?.addEventListener("click", async ()=>{
  const amount = Number(document.getElementById("withdrawAmount").value);
  const user = auth.currentUser;
  const userRef = doc(db,"users",user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  if(amount<=0 || data.balance<amount) return alert("Monto inválido");

  await updateDoc(userRef,{
    balance:data.balance-amount
  });

  await addDoc(collection(db,"withdrawals"),{
    userId:user.uid,
    amount,
    status:"pending",
    createdAt:serverTimestamp()
  });

  alert("Retiro enviado");
});

// =====================================================
// 📜 HISTORIAL
// =====================================================
async function cargarHistorial(){
  const user = auth.currentUser;
  const box = document.getElementById("transactionHistory");
  box.innerHTML="";

  const snap = await getDocs(query(collection(db,"withdrawals"),
    where("userId","==",user.uid)));

  snap.forEach(d=>{
    const w=d.data();
    box.innerHTML+=`<div>$${w.amount} - ${w.status}</div>`;
  });
}

// =====================================================
// ⚙ ADMIN COMPLETO
// =====================================================
function activarBotonAdmin(data){
  const btn=document.getElementById("adminFab");
  btn.style.display = data.role==="admin" ? "flex":"none";
}

async function cargarAdmin(){
  const user=auth.currentUser;
  const snapUser=await getDoc(doc(db,"users",user.uid));
  if(snapUser.data().role!=="admin") return;

  // ESTADÍSTICAS
  const usersSnap=await getDocs(collection(db,"users"));
  document.getElementById("adminStats").innerHTML=
    `Usuarios: ${usersSnap.size}`;

  // USUARIOS
  const userBox=document.getElementById("adminUsers");
  userBox.innerHTML="";
  usersSnap.forEach(d=>{
    const u=d.data();
    userBox.innerHTML+=`
      <div class="card">
        ${u.email}<br>
        Balance: $${u.balance}
        <button onclick="modBalance('${u.uid}')">Modificar Balance</button>
        <button onclick="modVIP('${u.uid}')">Cambiar VIP</button>
        <button onclick="suspender('${u.uid}')">Suspender</button>
      </div>
    `;
  });

  // RETIROS
  const wSnap=await getDocs(query(collection(db,"withdrawals"),
    where("status","==","pending")));

  const wBox=document.getElementById("pendingWithdrawals");
  wBox.innerHTML="";
  wSnap.forEach(d=>{
    const w=d.data();
    wBox.innerHTML+=`
      <div>
        ${w.userId.slice(0,6)} - $${w.amount}
        <button onclick="aprobarRetiro('${d.id}','${w.userId}',${w.amount})">Aprobar</button>
        <button onclick="rechazarRetiro('${d.id}','${w.userId}',${w.amount})">Rechazar</button>
      </div>
    `;
  });
}

// ADMIN FUNCIONES
window.modBalance = async uid=>{
  const val=Number(prompt("Nuevo balance"));
  if(isNaN(val)) return;
  await updateDoc(doc(db,"users",uid),{balance:val});
};

window.modVIP = async uid=>{
  const val=Number(prompt("Nivel VIP 1-10"));
  if(val<0||val>10) return;
  await updateDoc(doc(db,"users",uid),{level:val});
};

window.suspender = async uid=>{
  await updateDoc(doc(db,"users",uid),{suspended:true});
};

window.aprobarRetiro = async (id,uid,amount)=>{
  await updateDoc(doc(db,"withdrawals",id),{status:"approved"});
};

window.rechazarRetiro = async (id,uid,amount)=>{
  const userRef=doc(db,"users",uid);
  const snap=await getDoc(userRef);
  await updateDoc(userRef,{
    balance:snap.data().balance+amount
  });
  await updateDoc(doc(db,"withdrawals",id),{status:"rejected"});
};

window.generarCodigo = async ()=>{
  const code=Math.random().toString(36).substring(2,8).toUpperCase();
  await addDoc(collection(db,"codes"),{
    code,
    createdAt:serverTimestamp()
  });
  alert("Código generado: "+code);
};

// =====================================================
document.getElementById("logoutBtn")?.addEventListener("click",async()=>{
  await signOut(auth);
});
