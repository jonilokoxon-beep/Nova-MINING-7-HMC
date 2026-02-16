import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const db = getFirestore();

const plansContainer = document.getElementById("plans");

async function loadPlans() {
  plansContainer.innerHTML = "";

  const q = query(
    collection(db, "plans"),
    where("active", "==", true)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    plansContainer.innerHTML = "<p>No hay planes disponibles</p>";
    return;
  }

  snapshot.forEach(doc => {
    const p = doc.data();

    plansContainer.innerHTML += `
      <div class="plan">
        <h3>${p.name}</h3>
        <p>Inversión: ${p.price} HMC</p>
        <p>Ganancia diaria: ${p.daily} HMC</p>
        <p>Días: ${p.days}</p>
        <button>Invertir</button>
      </div>
    `;
  });
}

loadPlans();
