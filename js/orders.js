import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

export async function loadOrders() {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "orders"),
    where("uid", "==", user.uid),
    where("status", "==", "active")
  );

  const snap = await getDocs(q);

  let html = "";
  let totalProfit = 0;

  snap.forEach(doc => {
    const o = doc.data();
    totalProfit += o.totalProfit;

    html += `
      <div class="order-card">
        <img src="${o.image}">
        <div class="order-info">
          <b>${o.productName}</b><br>
          Precio: $${o.price}<br>
          Ganancia diaria: $${o.dailyProfit}<br>
          Ciclo: ${o.cycleDays} días<br>
          Ganancia total: $${o.totalProfit}<br>
          <div class="timer" data-end="${o.endDate}">--:--:--</div>
        </div>
      </div>
    `;
  });

  document.getElementById("ordersList").innerHTML = html;
  document.getElementById("totalProfit").innerText = `$${totalProfit.toFixed(2)}`;

  startTimers();
}
