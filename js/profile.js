import { auth, db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();

  document.getElementById("profile-email").innerText = user.email;
  document.getElementById("profile-balance").innerText =
    Number(data.balance || 0).toFixed(2);
}

window.updateProfile = async function () {
  const user = auth.currentUser;
  if (!user) return;

  const newName = document.getElementById("profile-name").value;

  await updateDoc(doc(db, "users", user.uid), {
    name: newName
  });

  alert("Perfil actualizado correctamente");
};
