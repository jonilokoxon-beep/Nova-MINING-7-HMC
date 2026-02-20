import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ==========================
// VIP CONTENIDO DINÁMICO
// ==========================
const vipInfo = {
  1: "Gana 3 MXN diarios extra.",
  2: "Gana 6 MXN diarios extra.",
  3: "Gana 10 MXN diarios extra.",
  4: "Gana 20 MXN diarios extra.",
  5: "Gana 50 MXN diarios extra."
};

document.addEventListener("click", e => {
  if (!e.target.classList.contains("vip-btn")) return;

  document.querySelectorAll(".vip-btn").forEach(b => b.classList.remove("active"));
  e.target.classList.add("active");

  const level = e.target.dataset.vip;
  document.getElementById("vipContent").innerText = vipInfo[level];
});

// ==========================
// CHECK IN DIARIO
// ==========================
export async function initDaily() {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = snap.data();

  let streak = data.streak || 0;
  let lastCheck = data.lastCheck || null;

  document.getElementById("streakCount").innerText = streak;

  renderCalendar(streak);

  document.getElementById("checkinBtn").onclick = async () => {
    const today = new Date().toDateString();

    if (lastCheck === today) {
      alert("Ya hiciste check-in hoy");
      return;
    }

    streak += 1;

    let reward = 0;
    if (streak === 7) reward = 15;
    if (streak === 15) reward = 30;
    if (streak === 30) reward = 60;

    await updateDoc(userRef, {
      streak,
      lastCheck: today,
      balance: (data.balance || 0) + reward
    });

    if (reward > 0) {
      await addDoc(collection(db, "transactions"), {
        uid: user.uid,
        type: "daily_bonus",
        amount: reward,
        createdAt: serverTimestamp()
      });
    }

    alert("Check-in exitoso");
    location.reload();
  };
}

function renderCalendar(streak) {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  for (let i = 1; i <= 30; i++) {
    const div = document.createElement("div");
    div.className = "day";
    div.innerText = i;
    if (i <= streak) div.classList.add("checked");
    cal.appendChild(div);
  }
}

// ==========================
// EQUIPO ACTIVO
// ==========================
export async function loadTeamSize() {
  const user = auth.currentUser;
  if (!user) return;

  const refs = query(
    collection(db, "users"),
    where("referredBy", "==", user.uid)
  );

  const snap = await getDocs(refs);

  let active = 0;

  for (const docSnap of snap.docs) {
    const ordersQ = query(
      collection(db, "orders"),
      where("uid", "==", docSnap.id)
    );
    const ordersSnap = await getDocs(ordersQ);
    if (!ordersSnap.empty) active++;
  }

  document.getElementById("teamSize").innerText = active;
}
