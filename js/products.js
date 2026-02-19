import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadProducts() {
  const container = document.getElementById("products-container");
  container.innerHTML = "Cargando productos...";

  const snap = await getDocs(collection(db, "products"));

  if (snap.empty) {
    container.innerHTML = "No hay productos disponibles.";
    return;
  }

  container.innerHTML = "";

  snap.forEach(docu => {
    const data = docu.data();

    container.innerHTML += `
      <div class="product-card">
        <h3>${data.name}</h3>
        <p>Precio: $${Number(data.price).toFixed(2)}</p>
        <button onclick="buyProduct('${docu.id}')">
          Comprar
        </button>
      </div>
    `;
  });
}
