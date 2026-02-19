const db = getFirestore(app);

// ===============================
// 📌 NAVEGACIÓN (CORREGIDA)
// 📌 NAVEGACIÓN
// ===============================
window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => {
@@ -51,15 +51,9 @@ window.go = function (id) {
  const page = document.getElementById(id);
  if (page) page.style.display = "block";

  // 👤 PERFIL solo cuando se abre
  if (id === "profile") {
    loadProfile();
  }

  // 📦 ÓRDENES solo cuando se abre
  if (id === "orders") {
    loadOrders();
  }
  if (id === "profile") loadProfile();
  if (id === "orders") loadOrders();
  if (id === "equipo") cargarEquipo();
};

// ===============================
@@ -79,6 +73,8 @@ onAuthStateChanged(auth, async user => {
      uid: user.uid,
      email: user.email,
      balance: 0,
      vip: 0,
      refBy: null,
      createdAt: serverTimestamp()
    });
  }
@@ -116,6 +112,48 @@ async function cargarDashboard() {
  retiradoBox.innerText = `$0.00`;
}

// ===============================
// 🎁 SERVICIO DIARIO 24H
// ===============================
document.addEventListener("click", async (e) => {
  if (e.target.id !== "btn-daily") return;

  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  const now = Date.now();
  const lastClaim = data.lastDailyClaim?.toMillis?.() || 0;

  const hoursPassed = (now - lastClaim) / (1000 * 60 * 60);

  if (hoursPassed < 24) {
    const remaining = (24 - hoursPassed).toFixed(1);
    alert(`⏳ Debes esperar ${remaining} horas`);
    return;
  }

  const reward = 5;

  await updateDoc(userRef, {
    balance: (data.balance || 0) + reward,
    lastDailyClaim: serverTimestamp()
  });

  await addDoc(collection(db, "transactions"), {
    uid: user.uid,
    type: "Bono Diario",
    amount: reward,
    createdAt: serverTimestamp()
  });

  alert("🎉 Bono diario recibido +$5");
  cargarDashboard();
});

// ===============================
// 🛒 PRODUCTOS
// ===============================
@@ -153,7 +191,7 @@ async function cargarProductos() {
}

// ===============================
// 💰 INVERTIR
// 💰 INVERTIR + COMISIÓN 10%
// ===============================
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-invertir")) return;
@@ -164,12 +202,14 @@ document.addEventListener("click", async (e) => {

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const saldo = Number(userSnap.data().balance || 0);
  const userData = userSnap.data();
  const saldo = Number(userData.balance || 0);

  const prodSnap = await getDoc(doc(db, "products", productId));
  if (!prodSnap.exists()) return;

  const p = prodSnap.data();

  if (saldo < p.price) {
    alert("❌ Saldo insuficiente");
    return;
@@ -188,13 +228,47 @@ document.addEventListener("click", async (e) => {
    status: "active"
  });

  alert("✅ Inversión realizada");
  // 🔥 COMISIÓN AUTOMÁTICA 10%
  if (userData.refBy) {
    const refRef = doc(db, "users", userData.refBy);
    const refSnap = await getDoc(refRef);

    if (refSnap.exists()) {
      const commission = p.price * 0.10;

      await updateDoc(refRef, {
        balance: (refSnap.data().balance || 0) + commission
      });

      await addDoc(collection(db, "transactions"), {
        uid: userData.refBy,
        type: "Comisión",
        amount: commission,
        createdAt: serverTimestamp()
      });
    }
  }

  alert("✅ Inversión realizada");
  go("orders");
  loadOrders();
  cargarDashboard();
});

// ===============================
// 👥 CARGAR EQUIPO
// ===============================
async function cargarEquipo() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "users"), where("refBy", "==", user.uid));
  const snap = await getDocs(q);

  const teamCount = document.getElementById("teamCount");
  if (teamCount) teamCount.innerText = snap.size;
}

// ===============================
// 🚪 LOGOUT
// ===============================
