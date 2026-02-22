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
// 🔐 LOGIN / REGISTER (TU MISMA LÓGICA)
// =====================================================

function emailInput(id){
  return document.getElementById(id)?.value.trim();
}

document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const email = emailInput("email");
  const password = emailInput("password");
  if (!email || !password) return alert("Completa los campos");
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById("registerBtn")?.addEventListener("click", async () => {
  const email = emailInput("regEmail");
  const password = emailInput("regPassword");
  if (!email || !password) return alert("Completa los campos");

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
      level: 0,
      suspended: false,
      createdAt: serverTimestamp()
    });

  } catch (e) {
    alert(e.message);
  }
});

// =====================================================
// 🔄 ESTADO GLOBAL
// =====================================================

onAuthStateChanged(auth, async user => {

  if (!user) {
    document.getElementById("loginView").style.display="block";
    document.getElementById("appView").style.display="none";
    return;
  }

  document.getElementById("loginView").style.display="none";
  document.getElementById("appView").style.display="block";

  activarUsuario(user);
});

// =====================================================
// 👤 ACTIVAR USUARIO
// =====================================================

function activarUsuario(user){

  const userRef = doc(db, "users", user.uid);

  onSnapshot(userRef, snap => {

    const data = snap.data();
    if (!data) return;

    if (data.suspended){
      alert("Cuenta suspendida");
      signOut(auth);
      return;
    }

    document.getElementById("stat-balance").innerText =
      Number(data.balance || 0).toFixed(2);

    document.getElementById("p-balance").innerText =
      Number(data.balance || 0).toFixed(2);

    document.getElementById("p-id").innerText =
      user.uid.slice(0,8);

    document.getElementById("p-vip").innerText =
      data.level || 0;

    document.getElementById("adminFab").style.display =
      data.role==="admin" ? "flex":"none";
  });

  cargarAdminCompleto();
}

// =====================================================
// 💰 DEPÓSITO USUARIO
// =====================================================

document.getElementById("depositBtn")?.addEventListener("click", async ()=>{

  const amount = Number(prompt("Monto a depositar"));
  if(!amount || amount<=0) return;

  await addDoc(collection(db,"deposits"),{
    userId: auth.currentUser.uid,
    amount,
    status:"pending",
    createdAt: serverTimestamp()
  });

  alert("Depósito enviado para aprobación");
});

// =====================================================
// ⚙ PANEL ADMIN COMPLETO
// =====================================================

async function cargarAdminCompleto(){

  const user = auth.currentUser;
  if(!user) return;

  const snapUser = await getDoc(doc(db,"users",user.uid));
  if(snapUser.data().role!=="admin") return;

  const usersSnap = await getDocs(collection(db,"users"));
  const withdrawSnap = await getDocs(query(collection(db,"withdrawals"),
    where("status","==","pending")
  ));

  const depositSnap = await getDocs(query(collection(db,"deposits"),
    where("status","==","pending")
  ));

  const usersBox = document.getElementById("adminUsers");
  const withdrawBox = document.getElementById("pendingWithdrawals");
  const depositBox = document.getElementById("pendingDeposits");

  usersBox.innerHTML="";
  withdrawBox.innerHTML="";
  depositBox.innerHTML="";

  usersSnap.forEach(d=>{
    const u=d.data();
    usersBox.innerHTML+=`
      <div class="card">
        ${u.email}<br>
        Balance:$${u.balance}<br>
        VIP:${u.level||0}<br>
        <button onclick="adminBalance('${u.uid}')">Balance</button>
        <button onclick="adminVIP('${u.uid}')">VIP</button>
        <button onclick="adminSuspender('${u.uid}')">Suspender</button>
      </div>
    `;
  });

  withdrawSnap.forEach(d=>{
    const w=d.data();
    withdrawBox.innerHTML+=`
      <div>
        $${w.amount}
        <button onclick="aprobarRetiro('${d.id}')">✔</button>
        <button onclick="rechazarRetiro('${d.id}','${w.userId}',${w.amount})">✖</button>
      </div>
    `;
  });

  depositSnap.forEach(d=>{
    const dep=d.data();
    depositBox.innerHTML+=`
      <div>
        $${dep.amount}
        <button onclick="aprobarDeposito('${d.id}','${dep.userId}',${dep.amount})">✔</button>
        <button onclick="rechazarDeposito('${d.id}')">✖</button>
      </div>
    `;
  });
}

// =====================================================
// 🔧 FUNCIONES ADMIN
// =====================================================

window.adminBalance = async function(uid){
  const nuevo = Number(prompt("Nuevo balance"));
  if(isNaN(nuevo)) return;
  await updateDoc(doc(db,"users",uid),{balance:nuevo});
};

window.adminVIP = async function(uid){
  const vip = Number(prompt("VIP 1-10"));
  if(vip<1||vip>10) return;
  await updateDoc(doc(db,"users",uid),{level:vip});
};

window.adminSuspender = async function(uid){
  await updateDoc(doc(db,"users",uid),{suspended:true});
};

window.aprobarRetiro = async function(id){
  await updateDoc(doc(db,"withdrawals",id),{status:"approved"});
  cargarAdminCompleto();
};

window.rechazarRetiro = async function(id,uid,amount){
  await updateDoc(doc(db,"withdrawals",id),{status:"rejected"});
  const ref=doc(db,"users",uid);
  const snap=await getDoc(ref);
  await updateDoc(ref,{balance:(snap.data().balance||0)+amount});
  cargarAdminCompleto();
};

window.aprobarDeposito = async function(id,uid,amount){
  await updateDoc(doc(db,"deposits",id),{status:"approved"});
  const ref=doc(db,"users",uid);
  const snap=await getDoc(ref);
  await updateDoc(ref,{balance:(snap.data().balance||0)+amount});
  cargarAdminCompleto();
};

window.rechazarDeposito = async function(id){
  await updateDoc(doc(db,"deposits",id),{status:"rejected"});
  cargarAdminCompleto();
};

document.getElementById("logoutBtn")?.addEventListener("click",async()=>{
  await signOut(auth);
});
