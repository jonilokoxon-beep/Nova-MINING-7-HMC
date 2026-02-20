// ===============================
// 🎁 SERVICIO DIARIO (24H)
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

  const reward = 5; // 💰 recompensa fija diaria

  await updateDoc(userRef, {
    balance: (data.balance || 0) + reward,
    lastDailyClaim: serverTimestamp()
  });

  alert("🎉 Bono diario recibido +$5");

  cargarDashboard();
});
