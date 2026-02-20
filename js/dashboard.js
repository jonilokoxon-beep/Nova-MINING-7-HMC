import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
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
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_SENDER",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =========================
   NAVEGACIÓN
========================= */
window.go = function(pageId){
  document.querySelectorAll(".page").forEach(p=>{
    p.style.display="none";
  });
  const target=document.getElementById(pageId);
  if(target) target.style.display="block";

  if(pageId==="orders") cargarOrdenes();
  if(pageId==="profile") cargarPerfil();
}

/* =========================
   SESIÓN
========================= */
onAuthStateChanged(auth, async user=>{
  if(!user){
    location.replace("index.html");
    return;
  }

  const userRef=doc(db,"users",user.uid);
  const snap=await getDoc(userRef);

  if(!snap.exists()){
    await setDoc(userRef,{
      uid:user.uid,
      email:user.email,
      balance:0,
      createdAt:serverTimestamp()
    });
  }

  cargarDashboard();
  cargarProductos();
});

/* =========================
   DASHBOARD
========================= */
async function cargarDashboard(){
  const user=auth.currentUser;
  if(!user) return;

  const snap=await getDoc(doc(db,"users",user.uid));
  const saldo=Number(snap.data().balance||0);

  document.getElementById("stat-balance").innerText=saldo.toFixed(2);
}

/* =========================
   PRODUCTOS
========================= */
async function cargarProductos(){
  const list=document.getElementById("productsList");
  if(!list) return;

  list.innerHTML="Cargando...";

  const snap=await getDocs(collection(db,"products"));
  list.innerHTML="";

  snap.forEach(d=>{
    const p=d.data();
    list.innerHTML+=`
      <div>
        <h4>${p.name}</h4>
        <p>$${p.price}</p>
        <button onclick="invertir('${d.id}')">Invertir</button>
      </div>
    `;
  });
}

/* =========================
   INVERTIR
========================= */
window.invertir=async function(productId){
  const user=auth.currentUser;
  if(!user) return;

  const userRef=doc(db,"users",user.uid);
  const userSnap=await getDoc(userRef);
  const saldo=Number(userSnap.data().balance||0);

  const prodSnap=await getDoc(doc(db,"products",productId));
  const p=prodSnap.data();

  if(saldo<p.price){
    alert("Saldo insuficiente");
    return;
  }

  await updateDoc(userRef,{
    balance:saldo-p.price
  });

  await addDoc(collection(db,"orders"),{
    uid:user.uid,
    productName:p.name,
    amount:p.price,
    createdAt:serverTimestamp()
  });

  alert("Inversión realizada");
  cargarDashboard();
}

/* =========================
   ÓRDENES
========================= */
async function cargarOrdenes(){
  const user=auth.currentUser;
  if(!user) return;

  const list=document.getElementById("ordersList");
  list.innerHTML="Cargando...";

  const q=query(collection(db,"orders"),where("uid","==",user.uid));
  const snap=await getDocs(q);

  list.innerHTML="";

  snap.forEach(d=>{
    const o=d.data();
    list.innerHTML+=`
      <div>
        <p>${o.productName}</p>
        <p>$${o.amount}</p>
      </div>
    `;
  });
}

/* =========================
   PERFIL
========================= */
async function cargarPerfil(){
  const user=auth.currentUser;
  if(!user) return;

  const snap=await getDoc(doc(db,"users",user.uid));
  const data=snap.data();

  document.getElementById("p-id").innerText=user.uid.slice(0,8);
  document.getElementById("p-balance").innerText=data.balance.toFixed(2);
}

/* =========================
   DEPÓSITO
========================= */
window.closeDeposit=()=>document.getElementById("depositModal").style.display="none";

document.getElementById("quick-deposit")?.addEventListener("click",()=>{
  document.getElementById("depositModal").style.display="block";
});

document.getElementById("btn-deposit")?.addEventListener("click",()=>{
  document.getElementById("depositModal").style.display="block";
});

document.getElementById("confirmDeposit")?.addEventListener("click",async()=>{
  const amount=Number(document.getElementById("depositAmount").value);
  const user=auth.currentUser;
  if(!user||amount<=0) return;

  const userRef=doc(db,"users",user.uid);
  const snap=await getDoc(userRef);
  const saldo=Number(snap.data().balance||0);

  await updateDoc(userRef,{balance:saldo+amount});
  closeDeposit();
  cargarDashboard();
});

/* =========================
   RETIRO
========================= */
document.getElementById("quick-withdraw")?.addEventListener("click",retirar);
document.getElementById("btn-withdraw")?.addEventListener("click",retirar);

async function retirar(){
  const amount=Number(prompt("Monto a retirar"));
  const user=auth.currentUser;
  if(!user||amount<=0) return;

  const userRef=doc(db,"users",user.uid);
  const snap=await getDoc(userRef);
  const saldo=Number(snap.data().balance||0);

  if(amount>saldo){
    alert("Saldo insuficiente");
    return;
  }

  await updateDoc(userRef,{balance:saldo-amount});
  cargarDashboard();
}

/* =========================
   LOGOUT
========================= */
window.logout=()=>signOut(auth).then(()=>location.replace("index.html"));
