import { auth, db } from "./firebase.js";
import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
collection,
getDocs,
doc,
getDoc,
updateDoc,
addDoc,
query,
where,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.showSection = function(id){
document.querySelectorAll(".section").forEach(s=>s.style.display="none");
document.getElementById(id).style.display="block";
};

onAuthStateChanged(auth, async user => {

if (!user) {
location.replace("./index.html");
return;
}

const snap = await getDoc(doc(db,"users",user.uid));
const data = snap.data();

if (data?.role !== "admin") {
location.replace("./dashboard.html");
return;
}

loadStats();
loadUsers();
loadWithdrawals();
loadCodes();
});

// =====================
// 📊 ESTADÍSTICAS
// =====================
async function loadStats(){

const usersSnap = await getDocs(collection(db,"users"));
let totalBalance = 0;
let totalInvested = 0;
let totalUsers = usersSnap.size;

usersSnap.forEach(d=>{
const u=d.data();
totalBalance+=Number(u.balance||0);
totalInvested+=Number(u.totalInvested||0);
});

document.getElementById("stats").innerHTML=`
<h2>Estadísticas Generales</h2>
<div class="stat-card">Usuarios: ${totalUsers}</div>
<div class="stat-card">Total Balance: $${totalBalance.toFixed(2)}</div>
<div class="stat-card">Total Invertido: $${totalInvested.toFixed(2)}</div>
`;
}

// =====================
// 👥 USUARIOS
// =====================
async function loadUsers(){

const snap=await getDocs(collection(db,"users"));
let html="<h2>Usuarios</h2>";

snap.forEach(d=>{
const u=d.data();
html+=`
<div class="card">
Email: ${u.email}<br>
UID: ${u.uid}<br>
Balance: $${u.balance}<br>
VIP: ${u.level}<br>
<button onclick="editUser('${u.uid}')">Editar</button>
</div>
`;
});

document.getElementById("users").innerHTML=html;
}

window.editUser=async function(uid){

const newBalance=prompt("Nuevo balance:");
const newVip=prompt("Nuevo VIP (1-10):");
const suspend=confirm("¿Suspender usuario?");

await updateDoc(doc(db,"users",uid),{
balance:Number(newBalance),
level:Number(newVip),
suspended:suspend
});

alert("Usuario actualizado");
loadUsers();
};

// =====================
// 💸 RETIROS
// =====================
async function loadWithdrawals(){

const snap=await getDocs(
query(collection(db,"withdrawals"),where("status","==","pending"))
);

let html="<h2>Retiros Pendientes</h2>";

snap.forEach(d=>{
const w=d.data();
html+=`
<div class="card">
Usuario: ${w.userId}<br>
Monto: $${w.amount}<br>
<button onclick="approve('${d.id}')">Aprobar</button>
<button onclick="reject('${d.id}')">Rechazar</button>
</div>
`;
});

document.getElementById("withdrawals").innerHTML=html;
}

window.approve=async function(id){
await updateDoc(doc(db,"withdrawals",id),{status:"approved"});
alert("Retiro aprobado");
loadWithdrawals();
};

window.reject=async function(id){
await updateDoc(doc(db,"withdrawals",id),{status:"rejected"});
alert("Retiro rechazado");
loadWithdrawals();
};

// =====================
// 🎁 CÓDIGOS
// =====================
async function loadCodes(){

let html=`
<h2>Generar Código</h2>
<input id="codeAmount" placeholder="Monto">
<button onclick="generateCode()">Generar</button>
`;

document.getElementById("codes").innerHTML=html;
}

window.generateCode=async function(){

const amount=Number(document.getElementById("codeAmount").value);
if(!amount)return alert("Monto inválido");

const code=Math.random().toString(36).substring(2,8).toUpperCase();

await addDoc(collection(db,"rescueCodes"),{
code,
amount,
used:false,
createdAt:serverTimestamp()
});

alert("Código generado: "+code);
};
