import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ====== AUTH CHECK ====== */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  cargarUsuario(user.uid);
  cargarPlanes();
});

/* ====== LOGOUT ====== */
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

/* ====== USUARIO ====== */
async function cargarUsuario(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    document.getElementById("saldo").innerText = `$${data.saldo || 0}`;
    document.getElementById("ganancias").innerText = `$${data.ganancias || 0}`;
    document.getElementById("retirado").innerText = `$${data.retirado || 0}`;
  }
}

/* ====== PLANES ====== */
async function cargarPlanes() {
  const contenedor = document.getElementById("plans");
  contenedor.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "plans"));

  querySnapshot.forEach((docu) => {
    const plan = docu.data();

    contenedor.innerHTML += `
      <div class="plan">
        <h4>${plan.nombre}</h4>
        <p><b>$${plan.precio}</b></p>
        <p>${plan.diario} diario</p>
        <button>Comprar</button>
      </div>
    `;
  });
}
