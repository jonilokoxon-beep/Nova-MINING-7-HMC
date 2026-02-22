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
  const email = emailInput("email");
  const password = emailInput("password");

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
      createdAt: serverTimestamp()
    });

  } catch (e) {
    alert(e.message);
  }
});

function emailInput(id){
  return document.getElementById(id)?.value.trim();
}

// =====================================================
// 🔄 ESTADO GLOBAL
// =====================================================
onAuthStateChanged(auth, async user => {

  if (!user) {
    showLogin();
    return;
  }

  showApp();
  activarUsuario(user);
});

// =====================================================
// 👤 ACTIVAR USUARIO
// =====================================================
function activarUsuario(user){

  const userRef = doc(db, "users", user.uid);

  // 🔄 SALDO EN TIEMPO REAL
  onSnapshot(userRef, snap => {
    const data = snap.data();

    document.getElementById("stat-balance").innerText =
      Number(data.balance || 0).toFixed(2);

    document.getElementById("p-balance").innerText =
      Number(data.balance || 0).toFixed(2);

    document.getElementById("p-id").innerText =
      user.uid.slice(0,8);

    document.getElementById("p-vip").innerText =
      data.level || 0;

    activarBotonAdmin(data);
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
  list.innerHTML = "";

  const snap = await getDocs(collection(db,"products"));

  snap.forEach(docSnap=>{
    const p = docSnap.data();

    list.innerHTML += `
      <div class="card">
        <h4>${p.name}</h4>
        <p>Precio: $${p.price}</p>
        <p>Ganancia diaria: $${p.dailyProfit}</p>
        <button class="invertir" data-id="${docSnap.id}">
          Invertir
        </button>
      </div>
    `;
  });
}

// =====================================================
// 💸 INVERTIR
// =====================================================
document.addEventListener("click", async e=>{

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
    balance: userData.balance - p.price,
    totalInvested: (userData.totalInvested||0) + p.price
  });

  await addDoc(collection(db,"orders"),{
    userId: user.uid,
    productName: p.name,
    amount: p.price,
    dailyProfit: p.dailyProfit,
    status:"active",
    createdAt: serverTimestamp()
  });

  alert("Inversión realizada");
});

// =====================================================
// 📦 ÓRDENES
// =====================================================
async function cargarOrdenes(){

  const user = auth.currentUser;
  const container = document.getElementById("ordersList");

  const q = query(collection(db,"orders"),
    where("userId","==",user.uid)
  );

  const snap = await getDocs(q);

  container.innerHTML="";

  snap.forEach(d=>{
    const o = d.data();
    container.innerHTML += `
      <div class="card">
        <h4>${o.productName}</h4>
        <p>$${o.amount}</p>
        <p>Ganancia diaria: $${o.dailyProfit}</p>
      </div>
    `;
  });
}

// =====================================================
// 💸 RETIROS
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
    balance: data.balance - amount,
    totalWithdrawn: (data.totalWithdrawn||0) + amount
  });

  await addDoc(collection(db,"withdrawals"),{
    userId:user.uid,
    amount,
    status:"pending",
    createdAt: serverTimestamp()
  });

  alert("Retiro solicitado");
});

// =====================================================
// 📜 HISTORIAL
// =====================================================
async function cargarHistorial(){

  const user = auth.currentUser;
  const box = document.getElementById("transactionHistory");

  const q = query(collection(db,"withdrawals"),
    where("userId","==",user.uid)
  );

  const snap = await getDocs(q);
  box.innerHTML="";

  snap.forEach(d=>{
    const w = d.data();
    box.innerHTML += `
      <div>Retiro: $${w.amount} - ${w.status}</div>
    `;
  });
}

// =====================================================
// ⚙ ADMIN
// =====================================================
function activarBotonAdmin(data){
  const btn = document.getElementById("adminFab");
  btn.style.display = data.role==="admin" ? "flex":"none";
}

async function cargarAdmin(){

  const user = auth.currentUser;
  const snapUser = await getDoc(doc(db,"users",user.uid));
  if(snapUser.data().role!=="admin") return;

  const withdrawBox = document.getElementById("pendingWithdrawals");
  const depositBox = document.getElementById("pendingDeposits");

  const wSnap = await getDocs(query(collection(db,"withdrawals"),
    where("status","==","pending")
  ));

  withdrawBox.innerHTML="";
  wSnap.forEach(d=>{
    const w=d.data();
    withdrawBox.innerHTML+=`
      <div>
        ${w.userId.slice(0,6)} - $${w.amount}
      </div>
    `;
  });

  depositBox.innerHTML="(Sistema base listo)";
}

// =====================================================
// 🚪 LOGOUT
// =====================================================
document.getElementById("logoutBtn")?.addEventListener("click",async()=>{
  await signOut(auth);
});
