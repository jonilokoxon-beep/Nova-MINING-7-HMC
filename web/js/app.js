<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
<script>
  const firebaseConfig = {
    apiKey: "PEGA_AQUI",
    authDomain: "PEGA_AQUI",
    projectId: "PEGA_AQUI",
    storageBucket: "PEGA_AQUI",
    messagingSenderId: "PEGA_AQUI",
    appId: "PEGA_AQUI"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
</script>

import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("status");

  status.innerText = "Conectando...";

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      status.innerText = "✅ Sesión iniciada";
    })
    .catch(error => {
      status.innerText = "❌ " + error.message;
    });
};
