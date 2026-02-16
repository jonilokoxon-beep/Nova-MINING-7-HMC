import { auth, db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

auth.onAuthStateChanged(async user => {
  if (!user) location.href = "index.html";

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const d = snap.data();
    saldo.innerText = "$" + d.saldo;
    ganancias.innerText = "$" + d.ganancias;
    retirado.innerText = "$" + d.retirado;
  }
});

window.logout = () => {
  signOut(auth).then(() => location.href = "index.html");
};
