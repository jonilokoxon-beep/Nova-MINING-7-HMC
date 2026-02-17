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
    Saldo<br><b>$0.00</b>
  </div>
  <div class="box green">
    Ganancias<br><b>$0.00</b>
  </div>
  <div class="box gold">
    Retirado<br><b>$0.00</b>
  </div>
</div>

<!-- ===== SECCIONES ===== -->

<section id="inicio" class="page">
  <h3 style="padding:15px">Inicio</h3>
  <p style="padding:15px">VIP · Registro Diario · Depósito · Retiro · Tamaño del equipo</p>
</section>

<section id="productos" class="page">
  <h3 style="padding:15px">Planes de Inversión</h3>
  <div class="plans" id="plans"></div>
</section>

<!-- ===== NAV ===== -->
<nav class="bottom">
  <span onclick="go('inicio')">Inicio</span>
  <span onclick="go('productos')">Productos</span>
  <span>Órdenes</span>
  <span>Cuenta</span>
</nav>

<!-- SOLO ESTE SCRIPT -->
<script type="module" src="js/dashboard.js"></script>

</body>
</html>
