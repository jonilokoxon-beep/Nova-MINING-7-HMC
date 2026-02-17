// 🔥 Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// ⚠️ TU CONFIG REAL DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyALrk15Qvqrq6zCVTxZ7U9wSnnZIqeSmv4",
  authDomain: "novagrow-app.firebaseapp.com",
  projectId: "novagrow-app",
  storageBucket: "novagrow-app.firebasestorage.app",
  messagingSenderId: "976275033149",
  appId: "1:976275033149:web:e40c6510684bd06c82ae54"
};

// 🔥 Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔐 LOGIN
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("status");

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(err => {
      status.innerText = err.message;
    });
};

// 🆕 REGISTER
window.register = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("status");

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      status.innerText = "Cuenta creada correctamente ✅";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    })
    .catch(err => {
      status.innerText = err.message;
    });
};
