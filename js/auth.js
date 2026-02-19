// js/auth.js

import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.login = async function () {
  const email = email.value;
  const password = password.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "dashboard.html";
  } catch (err) {
    alert(err.message);
  }
};

window.register = async function () {
  const email = email.value;
  const password = password.value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    location.href = "dashboard.html";
  } catch (err) {
    alert(err.message);
  }
};
