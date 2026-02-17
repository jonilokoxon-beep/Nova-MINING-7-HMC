<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nova MINING 7 HMC</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

<header class="top">
  <span>Nova <b>MINING 7</b> HMC</span>
  <button onclick="logout()">Salir</button>
</header>

<div class="stats">
  <div class="box blue">
    Saldo<br>
    <b>$0.00</b>
  </div>
  <div class="box green">
    Ganancias<br>
    <b>$0.00</b>
  </div>
  <div class="box gold">
    Retirado<br>
    <b>$0.00</b>
  </div>
</div>

<h3 style="padding:15px">Planes de Inversión</h3>

<!-- 👇 AQUÍ SE CARGAN DESDE FIRESTORE -->
<div class="plans" id="plans"></div>

<nav class="bottom">
  <span>Inicio</span>
  <span>Órdenes</span>
  <span>Retiros</span>
  <span>Cuenta</span>
</nav>

<!-- IMPORTANTE: module -->
<script type="module" src="js/dashboard.js"></script>
</body>
</html>
