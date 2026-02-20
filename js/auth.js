import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.login = async function () {
  const email = email.value;
  const password = password.value;
  const status = document.getElementById("status");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (error) {
    status.innerText = error.message;
  }
};

window.register = async function () {
  const emailVal = document.getElementById("email").value;
  const passVal = document.getElementById("password").value;
  const status = document.getElementById("status");

  try {
    const userCred = await createUserWithEmailAndPassword(auth, emailVal, passVal);

    await setDoc(doc(db, "users", userCred.user.uid), {
      email: emailVal,
      balance: 0,
      vip: 0,
      createdAt: Date.now(),
      lastProfit: Date.now()
    });

    window.location.href = "dashboard.html";
  } catch (error) {
    status.innerText = error.message;
  }
};
