// 📌 NAVEGACIÓN
// ===============================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => {
    p.style.display = "none";
  });
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");

  const page = document.getElementById(id);
  if (page) page.style.display = "block";

  if (id === "profile") loadProfile();
  if (id === "orders") loadOrders();
  if (id === "equipo") cargarEquipo();
  if (id === "equipoPage") cargarEquipo();
};

// ===============================
@@ -75,6 +73,7 @@
      balance: 0,
      vip: 0,
      refBy: null,
      totalInvested: 0,
      createdAt: serverTimestamp()
    });
  }
@@ -91,29 +90,40 @@
  const user = auth.currentUser;
  if (!user) return;

  const saldoBox = document.querySelector(".box.blue b");
  const gananciasBox = document.querySelector(".box.green b");
  const retiradoBox = document.querySelector(".box.gold b");
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const saldo = Number(userSnap.data().balance || 0);
  const saldo = Number(userData.balance || 0);

  let ganancias = 0;
  let totalInvertido = 0;

  const q = query(collection(db, "orders"), where("uid", "==", user.uid));
  const snap = await getDocs(q);

  snap.forEach(d => {
    ganancias += Number(d.data().dailyProfit || 0);
    totalInvertido += Number(d.data().amount || 0);
  });

  saldoBox.innerText = `$${saldo.toFixed(2)}`;
  gananciasBox.innerText = `$${ganancias.toFixed(2)}`;
  retiradoBox.innerText = `$0.00`;
  // 🔥 VIP AUTOMÁTICO
  let vip = 0;
  if (totalInvertido >= 100) vip = 1;
  if (totalInvertido >= 500) vip = 2;
  if (totalInvertido >= 1000) vip = 3;
  if (totalInvertido >= 3000) vip = 4;
  if (totalInvertido >= 5000) vip = 5;

  await updateDoc(userRef, { vip });

  document.getElementById("stat-balance").innerText = saldo.toFixed(2);
  document.getElementById("stat-profit").innerText = ganancias.toFixed(2);
  document.getElementById("stat-withdrawn").innerText = "0.00";
}

// ===============================
// 🎁 SERVICIO DIARIO 24H
// 🎁 CHECK-IN 24 HORAS
// ===============================
document.addEventListener("click", async (e) => {
  if (e.target.id !== "btn-daily") return;
@@ -126,50 +136,96 @@
  const data = snap.data();

  const now = Date.now();
  const lastClaim = data.lastDailyClaim?.toMillis?.() || 0;
  const last = data.lastDailyClaim?.toMillis?.() || 0;

  const hoursPassed = (now - lastClaim) / (1000 * 60 * 60);

  if (hoursPassed < 24) {
    const remaining = (24 - hoursPassed).toFixed(1);
    alert(`⏳ Debes esperar ${remaining} horas`);
  if (now - last < 86400000) {
    alert("⏳ Ya hiciste tu check-in hoy");
    return;
  }

  const reward = 5;

  await updateDoc(userRef, {
    balance: (data.balance || 0) + reward,
    balance: (data.balance || 0) + 5,
    lastDailyClaim: serverTimestamp()
  });

  await addDoc(collection(db, "transactions"), {
    uid: user.uid,
    type: "Bono Diario",
    amount: reward,
    amount: 5,
    createdAt: serverTimestamp()
  });

  alert("🎉 Bono diario recibido +$5");
  alert("🎉 Recibiste $5");
  cargarDashboard();
});

// ===============================
// 🛒 PRODUCTOS
// 💰 DEPÓSITO
// ===============================
async function cargarProductos() {
  const list = document.getElementById("productsList");
  if (!list) return;
window.closeDeposit = function () {
  document.getElementById("depositModal").style.display = "none";
};

  list.innerHTML = "Cargando productos...";
document.getElementById("btn-deposit")?.addEventListener("click", () => {
  document.getElementById("depositModal").style.display = "block";
});

  const snap = await getDocs(collection(db, "products"));
document.getElementById("confirmDeposit")?.addEventListener("click", async () => {
  const amount = Number(document.getElementById("depositAmount").value);
  const user = auth.currentUser;
  if (!user || amount <= 0) return alert("Monto inválido");

  await addDoc(collection(db, "deposits"), {
    uid: user.uid,
    amount,
    status: "pending",
    createdAt: serverTimestamp()
  });

  if (snap.empty) {
    list.innerHTML = "No hay productos";
  alert("✅ Depósito enviado");
  closeDeposit();
});

// ===============================
// 💸 RETIRO
// ===============================
document.getElementById("btn-withdraw")?.addEventListener("click", async () => {
  const amount = Number(prompt("Ingrese monto a retirar"));
  const user = auth.currentUser;
  if (!user || amount <= 0) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const balance = Number(snap.data().balance || 0);

  if (amount > balance) {
    alert("❌ Saldo insuficiente");
    return;
  }

  await updateDoc(userRef, {
    balance: balance - amount
  });

  await addDoc(collection(db, "withdrawals"), {
    uid: user.uid,
    amount,
    status: "pending",
    createdAt: serverTimestamp()
  });

  alert("✅ Retiro solicitado");
  cargarDashboard();
});

// ===============================
// 🛒 PRODUCTOS
// ===============================
async function cargarProductos() {
  const list = document.getElementById("productsList");
  if (!list) return;

  const snap = await getDocs(collection(db, "products"));
  list.innerHTML = "";

  snap.forEach(docSnap => {
@@ -215,7 +271,10 @@
    return;
  }

  await updateDoc(userRef, { balance: saldo - p.price });
  await updateDoc(userRef, {
    balance: saldo - p.price,
    totalInvested: (userData.totalInvested || 0) + p.price
  });

  await addDoc(collection(db, "orders"), {
    uid: user.uid,
@@ -224,11 +283,10 @@
    dailyProfit: p.profit,
    duration: p.duration,
    createdAt: serverTimestamp(),
    lastClaim: serverTimestamp(),
    status: "active"
  });

  // 🔥 COMISIÓN AUTOMÁTICA 10%
  // 🔥 COMISIÓN 10%
  if (userData.refBy) {
    const refRef = doc(db, "users", userData.refBy);
    const refSnap = await getDoc(refRef);
@@ -256,7 +314,7 @@
});

// ===============================
// 👥 CARGAR EQUIPO
// 👥 EQUIPO (SOLO ACTIVOS)
// ===============================
async function cargarEquipo() {
  const user = auth.currentUser;
@@ -265,11 +323,21 @@
  const q = query(collection(db, "users"), where("refBy", "==", user.uid));
  const snap = await getDocs(q);

  let activos = 0;

  for (const docSnap of snap.docs) {
    const member = docSnap.data();
    const ordersQ = query(collection(db, "orders"), where("uid", "==", member.uid));
    const ordersSnap = await getDocs(ordersQ);

    if (!ordersSnap.empty) activos++;
  }

  const teamCount = document.getElementById("teamCount");
  if (teamCount) teamCount.innerText = snap.size;
  if (teamCount) teamCount.innerText = activos;
}

// ===============================
// 🚪 LOGOUT
// ===============================
window.logout = () => signOut(auth).then(() => location.replace("login.html"));
