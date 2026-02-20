import { auth } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { loadProducts } from "./products.js";
import { loadOrders } from "./orders.js";
import { loadProfile } from "./profile.js";


// ===============================
// 📌 NAVEGACIÓN SEGURA
// ===============================
window.go = function (id) {

  const pages = document.querySelectorAll(".page");
  pages.forEach(p => p.style.display = "none");

  const target = document.getElementById(id);
  if (target) {
    target.style.display = "block";
  } else {
    console.warn("Sección no encontrada:", id);
  }
};


// ===============================
// 🔐 CONTROL DE SESIÓN GLOBAL
// ===============================
onAuthStateChanged(auth, async user => {

  if (!user) {
    window.location.replace("login.html");
    return;
  }

  go("home");

  try {

    if (typeof loadProducts === "function") {
      await loadProducts();
    }

    if (typeof loadOrders === "function") {
      await loadOrders();
    }

    if (typeof loadProfile === "function") {
      await loadProfile();
    }

  } catch (error) {
    console.error("Error inicializando app:", error);
  }

});
