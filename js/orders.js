import { auth, db } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadOrders() {
  const container = document.getElementById("orders-container");
  container.innerHTML = "Cargando órdenes...";

  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "orders"),
    where("uid", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "No tienes órdenes aún.";
    return;
  }

  container.innerHTML = "";

  snap.forEach(docu => {
    const data = docu.data();

    container.innerHTML += `
      <div class="order-card">
        <p><strong>Producto:</strong> ${data.productName}</p>
        <p><strong>Monto:</strong> $${Number(data.amount).toFixed(2)}</p>
        <p><strong>Estado:</strong> ${data.status}</p>
      </div>
    `;
  });
}
