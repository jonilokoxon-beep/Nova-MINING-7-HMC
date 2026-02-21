// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
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

// ================= VISTAS =================
const loginView = document.getElementById("loginView");
const registerView = document.getElementById("registerView");
const appView = document.getElementById("appView");
const adminView = document.getElementById("adminView");

function show(view) {
  loginView.style.display = "none";
  registerView.style.display = "none";
  appView.style.display = "none";
  adminView.style.display = "none";
  view.style.display = "block";
}

// ================= LOGIN =================
document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) return alert("Completa todos los campos");

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert(err.message);
  }
});

// ================= REGISTER =================
document.getElementById("registerBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value.trim();

  if (!email || !password) return alert("Completa todos los campos");

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email: email,
      balance: 0,
      role: "user",
      createdAt: serverTimestamp()
    });

  } catch (err) {
    alert(err.message);
  }
});

// ================= CAMBIAR ENTRE LOGIN Y REGISTER =================
document.getElementById("goRegister")?.addEventListener("click", () => show(registerView));
document.getElementById("goLogin")?.addEventListener("click", () => show(loginView));

// ================= AUTH STATE =================
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    show(loginView);
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  const userData = snap.data();

  show(appView);

  document.getElementById("stat-balance").innerText =
    Number(userData.balance || 0).toFixed(2);

  // ADMIN BUTTON
  const adminFab = document.getElementById("adminFab");
  if (userData.role === "admin") {
    adminFab.style.display = "flex";
    adminFab.onclick = () => show(adminView);
  } else {
    adminFab.style.display = "none";
  }
});

// ================= LOGOUT =================
document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
});

// ================= VOLVER ADMIN =================
document.getElementById("backToApp")?.addEventListener("click", () => {
  show(appView);
});
