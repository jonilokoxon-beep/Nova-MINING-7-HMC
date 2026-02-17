function loadPage(page) {
  fetch(`js/${page}.js`)
    .then(res => res.text())
    .then(js => {
      document.getElementById("content").innerHTML = "";
      eval(js);
      setActive(page);
    });
}

function setActive(page) {
  document.querySelectorAll(".bottom-nav button").forEach(btn => {
    btn.classList.remove("active");
  });

  const map = {
    home: 0,
    products: 1,
    orders: 2,
    profile: 3
  };

  document.querySelectorAll(".bottom-nav button")[map[page]].classList.add("active");
}

loadPage("home");
