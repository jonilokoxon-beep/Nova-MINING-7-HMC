import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { loadProducts } from "./products.js";
import { loadOrders } from "./orders.js";
import { loadProfile } from "./profile.js";

window.go = function (id) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(id).style.display = "block";
};

onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  go("home");

  loadProducts();
  loadOrders();
  loadProfile();
});
