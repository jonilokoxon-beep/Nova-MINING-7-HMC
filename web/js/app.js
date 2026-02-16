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
