import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadProducts() {

  const div = document.getElementById("plans");
  if (!div) {
    console.log("No existe el div #plans");
    return;
  }

  div.innerHTML = "Cargando productos...";

  try {

    const snap = await getDocs(collection(db, "products"));

    console.log("Productos encontrados:", snap.size);

    if (snap.empty) {
      div.innerHTML = "No hay productos en Firestore";
      return;
    }

    let html = "";

    snap.forEach(d => {
      const p = d.data();
      console.log("Producto:", p);

      html += `
        <div class="plan">
          <h4>${p.name || "Sin nombre"}</h4>
          <p>$${p.price || 0}</p>
        </div>
      `;
    });

    div.innerHTML = html;

  } catch (error) {
    console.error("Error cargando productos:", error);
    div.innerHTML = "Error cargando productos";
  }
}
