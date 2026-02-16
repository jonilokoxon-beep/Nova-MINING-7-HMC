import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const cont = document.getElementById("users");

const q = await getDocs(collection(db,"users"));
q.forEach(doc => {
  cont.innerHTML += `<p>${doc.id} → ${JSON.stringify(doc.data())}</p>`;
});
