import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ===============================
// 🛒 CARGAR PRODUCTOS
// ===============================
export async function loadProducts() {

  const div = document.getElementById("plans");
  if (!div) return;

  div.innerHTML = "Cargando productos...";

  try {

    const snap = await getDocs(collection(db, "products"));

    if (snap.empty) {
      div.innerHTML = "No hay productos disponibles";
      return;
    }

    let html = "";

    snap.forEach(d => {

      const p = d.data();

      if (!p.active) return;

      const name = p.name || "Producto";
      const price = Number(p.price || 0).toFixed(2);

      html += `
        <div class="plan">
          <h4>${name}</h4>
          <p>$${price}</p>
        </div>
      `;
    });

    if (!html) {
      div.innerHTML = "No hay productos activos";
      return;
    }

    div.innerHTML = html;

  } catch (error) {

    console.error("Error cargando productos:", error);
    div.innerHTML = "Error cargando productos";

  }
}
