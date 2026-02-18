import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadProducts() {
  const div = document.getElementById("plans");
  if (!div) return;

  div.innerHTML = "Cargando productos...";

  const snap = await getDocs(collection(db, "products"));

  div.innerHTML = "";
  snap.forEach(d => {
    const p = d.data();
    if (!p.active) return;

    div.innerHTML += `
      <div class="plan">
        <h4>${p.name}</h4>
        <p>$${p.price}</p>
      </div>
    `;
  });
}
