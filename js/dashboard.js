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
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_MSG_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =====================================================
// VISTAS
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
// LOGIN
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
// REGISTER
// =====================================================
document.getElementById("registerBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  if (!email || !password) return alert("Completa los campos");
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      balance: 0,
      level: 0,
      role: "user",
      suspended: false,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    alert(e.message);
  }
});

// =====================================================
// ESTADO GLOBAL
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
// ACTIVAR USUARIO
// =====================================================
function activarUsuario(user){
  const userRef = doc(db, "users", user.uid);

  onSnapshot(userRef, snap => {
    const data = snap.data();
    if (!data) return;

    if (data.suspended) {
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
      data.role === "admin" ? "flex" : "none";
  });

  cargarProductos();
  cargarOrdenes();
  cargarHistorial();
  cargarAdmin();
}

// =====================================================
// NAVEGACIÓN
// =====================================================
window.go = function(id){
  document.querySelectorAll(".page").forEach(p=>p.style.display="none");
  document.getElementById(id).style.display="block";
};

// =====================================================
// PRODUCTOS
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
        <button class="invertir" data-id="${docSnap.id}">Invertir</button>
      </div>
    `;
  });
}

// =====================================================
// ÓRDENES
// =====================================================
async function cargarOrdenes(){
  const user = auth.currentUser;
  const container = document.getElementById("ordersList");
  container.innerHTML="";
  const q = query(collection(db,"orders"),
    where("userId","==",user.uid)
  );
  const snap = await getDocs(q);
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
// HISTORIAL
// =====================================================
async function cargarHistorial(){
  const user = auth.currentUser;
  const box = document.getElementById("transactionHistory");
  box.innerHTML="";
  const q = query(collection(db,"withdrawals"),
    where("userId","==",user.uid)
  );
  const snap = await getDocs(q);
  snap.forEach(d=>{
    const w = d.data();
    box.innerHTML += `<div>Retiro: $${w.amount} - ${w.status}</div>`;
  });
}

// =====================================================
// ADMIN COMPLETO
// =====================================================
async function cargarAdmin(){
  const user = auth.currentUser;
  const userSnap = await getDoc(doc(db,"users",user.uid));
  if (!userSnap.exists()) return;
  if (userSnap.data().role !== "admin") return;

  const statsBox = document.getElementById("pendingDeposits");
  const withdrawBox = document.getElementById("pendingWithdrawals");

  // ESTADÍSTICAS
  const usersSnap = await getDocs(collection(db,"users"));
  statsBox.innerHTML = "Usuarios totales: " + usersSnap.size;

  // RETIROS
  const wSnap = await getDocs(query(collection(db,"withdrawals"),
    where("status","==","pending")
  ));
  withdrawBox.innerHTML="";
  wSnap.forEach(d=>{
    const w=d.data();
    withdrawBox.innerHTML+=`
      <div>
        ${w.userId.slice(0,6)} - $${w.amount}
        <button onclick="aprobarRetiro('${d.id}','${w.userId}',${w.amount})">Aprobar</button>
        <button onclick="rechazarRetiro('${d.id}')">Rechazar</button>
      </div>
    `;
  });
}

window.aprobarRetiro = async(id, uid, amount)=>{
  await updateDoc(doc(db,"withdrawals",id),{status:"approved"});
};

window.rechazarRetiro = async(id)=>{
  await updateDoc(doc(db,"withdrawals",id),{status:"rejected"});
};

// =====================================================
// LOGOUT
// =====================================================
document.getElementById("logoutBtn")?.addEventListener("click",async()=>{
  await signOut(auth);
});
