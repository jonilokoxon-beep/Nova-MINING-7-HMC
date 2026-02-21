// =====================================================
// ESPERAR A QUE CARGUE EL HTML
// =====================================================
document.addEventListener("DOMContentLoaded", () => {

console.log("JS funcionando ✅");

// =====================================================
// FIREBASE
// =====================================================
import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js").then(async ({ initializeApp }) => {

const { 
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

const {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp
} = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

// CONFIG
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET",
  messagingSenderId: "TU_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// =====================================================
// LOGIN
// =====================================================
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {

    console.log("Botón presionado");

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(error.message);
    }
  });
}

// =====================================================
// REGISTER
// =====================================================
const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", async () => {

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {

      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        balance: 0,
        totalWithdrawn: 0,
        role: "user",
        createdAt: serverTimestamp()
      });

    } catch (error) {
      alert(error.message);
    }
  });
}

// =====================================================
// AUTH STATE
// =====================================================
onAuthStateChanged(auth, async user => {

  if (user) {
    document.getElementById("loginView").style.display = "none";
    document.getElementById("registerView").style.display = "none";
    document.getElementById("appView").style.display = "block";
  } else {
    document.getElementById("loginView").style.display = "block";
    document.getElementById("appView").style.display = "none";
  }
});

// =====================================================
// LOGOUT
// =====================================================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
  });
}

}); // FIN IMPORT
}); // FIN DOM
