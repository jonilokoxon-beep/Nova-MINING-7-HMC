// 🔥 CONFIG FIREBASE (COMPAT)
const firebaseConfig = {
  apiKey: "AIzaSyALrk15Qvqrq6zCVTxZ7U9wSnnZIqeSmv4",
  authDomain: "novagrow-app.firebaseapp.com",
  projectId: "novagrow-app",
  storageBucket: "novagrow-app.appspot.com",
  messagingSenderId: "976275033149",
  appId: "1:976275033149:web:e40c6510684bd06c82ae54"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Servicios
const auth = firebase.auth();
const db = firebase.firestore();

// LOGIN
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("status");

  status.innerText = "Conectando...";

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      status.innerText = "✅ Sesión iniciada";
      window.location.href = "dashboard.html";
    })
    .catch(error => {
      status.innerText = "❌ " + error.message;
    });
}
