// js/orders.js

import { auth, db } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function loadOrders() {
  const user = auth.currentUser;
  if (!user) return;

  const div = document.getElementById("ordersList");
  div.innerHTML = "Cargando...";

  const q = query(
    collection(db, "orders"),
    where("uid", "==", user.uid)
  );

  const snap = await getDocs(q);

  div.innerHTML = "";

  snap.forEach(docSnap => {
    const o = docSnap.data();

    div.innerHTML += `
      <div class="order-card">
        <b>${o.productName}</b><br>
        Monto: $${o.amount}
      </div>
    `;
  });
}
