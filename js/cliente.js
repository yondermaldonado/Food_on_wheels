// Parte del cliente. Los datos viven en localStorage hasta conectar la base de datos.
const $ = (s) => document.querySelector(s);
const dinero = (n) => "$" + Math.round(n).toLocaleString("es-CO");
const leer = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let categoria = "Todos";
let texto = "";
let carrito = leer("fow_carrito", []);   // [{id, cant}]
// Demo: las cuentas viven en localStorage (contraseña en texto plano). Con la BD se usará su autenticación.
let cuentas = leer("fow_cuentas", []);
let cliente = cuentas.find((c) => c.correo === leer("fow_sesion", null)) ?? null; // null = visitante
let despuesDeAcceso = null;

const precioFinal = (p) => p.descuento ? p.precio * (1 - p.descuento / 100) : p.precio;

function aviso(msg) {
  const el = $("#aviso");
  el.textContent = msg; el.classList.add("ver");
  setTimeout(() => el.classList.remove("ver"), 2400);
}

/* Menú */
function pintarCategorias() {
  const cats = ["Todos", ...new Set(PRODUCTOS.map((p) => p.categoria))];
  $("#categorias").innerHTML = cats.map((c) =>
    `<button class="chip" type="button" data-cat="${c}" aria-pressed="${c === categoria}">${c}</button>`).join("");
}
function pintarMenu() {
  const lista = PRODUCTOS.filter((p) =>
    (categoria === "Todos" || p.categoria === categoria) &&
    (p.nombre + " " + p.descripcion).toLowerCase().includes(texto));
  $("#infoResultados").textContent = lista.length + " productos";
  $("#grilla").innerHTML = lista.length ? lista.map((p, i) => `
    <article class="tarjeta" style="--i:${Math.min(i, 12)}">
      <div class="tarjeta-img" aria-hidden="true">${p.emoji}${p.descuento ? `<span class="etiqueta-desc">-${p.descuento}%</span>` : ""}</div>
      <div class="tarjeta-cuerpo">
        <h3>${p.nombre}</h3><p>${p.descripcion}</p>
        <span class="meta"><b>★ ${p.rating}</b> · ${p.minutos} min</span>
        <div class="tarjeta-pie">
          <span class="precio">${p.descuento ? `<s>${dinero(p.precio)}</s>` : "Desde "}${dinero(precioFinal(p))}</span>
          <button class="btn-anadir" type="button" data-id="${p.id}" aria-label="Añadir ${p.nombre}">+ Añadir</button>
        </div>
      </div>
    </article>`).join("") : `<p class="vacio">No encontramos platos con esa búsqueda.</p>`;
}
function pintarPromos() {
  $("#listaPromos").innerHTML = PROMOCIONES.map((x) =>
    `<button class="promo" type="button" data-filtro="${x.filtro}"><h3>${x.titulo}</h3><p>${x.texto}</p></button>`).join("");
}

/* Carrito */
function totales() {
  const sub = carrito.reduce((s, i) => s + precioFinal(PRODUCTOS.find((p) => p.id === i.id)) * i.cant, 0);
  const prime = cliente?.prime ? sub * 0.25 : 0;
  return { sub, prime, total: sub - prime };
}
function pintarCarrito() {
  const n = carrito.reduce((s, i) => s + i.cant, 0);
  $("#contador").textContent = n;
  $("#itemsCarrito").innerHTML = carrito.length ? carrito.map((i) => {
    const p = PRODUCTOS.find((x) => x.id === i.id);
    return `<div class="item"><div class="item-emoji">${p.emoji}</div>
      <div><b>${p.nombre}</b>${dinero(precioFinal(p))}</div>
      <div class="cantidad"><button data-menos="${p.id}" aria-label="Quitar uno">−</button>${i.cant}<button data-mas="${p.id}" aria-label="Agregar uno">+</button></div></div>`;
  }).join("") : `<p class="vacio">Tu carrito está vacío. Elige algo del menú.</p>`;
  const t = totales();
  $("#tSub").textContent = dinero(t.sub);
  $("#filaPrime").hidden = !t.prime;
  $("#tPrime").textContent = "-" + dinero(t.prime);
  $("#tTotal").textContent = dinero(t.total);
  $("#btnContinuar").disabled = !carrito.length;
  guardar("fow_carrito", carrito);
}
function cambiar(id, d) {
  const it = carrito.find((i) => i.id === id);
  if (d > 0) { const b = $("#contador"); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
  if (it) { it.cant += d; carrito = carrito.filter((i) => i.cant > 0); }
  else if (d > 0) carrito.push({ id, cant: 1 });
  pintarCarrito();
}
function abrirCarrito(abrir) {
  $("#carrito").classList.toggle("abierto", abrir);
  $("#carrito").setAttribute("aria-hidden", !abrir);
  $("#velo").hidden = !abrir;
}

/* Registro y pedido */
function pedirAcceso(msg, siguiente) {
  $("#msgLogin").textContent = msg;
  despuesDeAcceso = siguiente;
  $("#dlgLogin").showModal();
}
function abrirPedido() {
  const f = $("#formPedido");
  f.nombre.value = cliente.nombre; f.telefono.value = cliente.telefono;
  f.direccion.value = cliente.direccion || "";
  $("#dlgPedido").showModal();
}
function entregaCambio() {
  const dom = $("#selEntrega").value === "domicilio";
  $("#lblDireccion").hidden = !dom;
  $("#formPedido").direccion.required = dom;
}

/* Eventos */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button, a");
  if (!t) return;
  if (t.dataset.cat) { categoria = t.dataset.cat; pintarCategorias(); pintarMenu(); }
  if (t.dataset.id) { cambiar(+t.dataset.id, 1); aviso("Añadido al pedido"); }
  if (t.dataset.mas) cambiar(+t.dataset.mas, 1);
  if (t.dataset.menos) cambiar(+t.dataset.menos, -1);
  if (t.dataset.filtro) {
    if (t.dataset.filtro === "prime") $("#prime").scrollIntoView();
    else { categoria = t.dataset.filtro; pintarCategorias(); pintarMenu(); $("#menu").scrollIntoView(); }
  }
  if (t.hasAttribute("data-cerrar")) t.closest("dialog").close();
});
$("#btnCarrito").onclick = () => abrirCarrito(true);
$("#cerrarCarrito").onclick = $("#velo").onclick = () => abrirCarrito(false);
$("#buscar").oninput = (e) => { texto = e.target.value.toLowerCase().trim(); pintarMenu(); };
$("#selEntrega").onchange = entregaCambio;
const guardarCuentas = () => guardar("fow_cuentas", cuentas);
function pintarSesion() {
  $("#btnCuenta").textContent = cliente ? cliente.nombre.trim()[0].toUpperCase() : "👤";
  $("#btnCuenta2").firstChild.textContent = cliente ? "🙂" : "👤";
  pintarCarrito();
}
function entrar(c) {
  cliente = c; guardar("fow_sesion", c.correo); pintarSesion();
  const sig = despuesDeAcceso; despuesDeAcceso = null;
  if (sig) setTimeout(sig, 50);
}
function abrirPerfil() {
  const f = $("#formPerfil");
  f.nombre.value = cliente.nombre; f.telefono.value = cliente.telefono; f.correo.value = cliente.correo;
  f.direccion.value = cliente.direccion || ""; f.clave.value = ""; $("#errPerfil").textContent = "";
  $("#avatar").textContent = cliente.nombre.trim()[0].toUpperCase();
  $("#estadoPrime").textContent = cliente.prime ? "Miembro FoW Prime" : "Sin membresía Prime";
  const mios = leer("fow_pedidos", []).filter((p) => p.cliente.correo === cliente.correo).reverse();
  $("#misPedidos").innerHTML = mios.length ? mios.map((p) =>
    `<li><span>${new Date(p.fecha).toLocaleDateString("es-CO")}</span><b>${dinero(p.total)}</b><em>${p.estado}</em></li>`).join("")
    : "<li>Aún no tienes pedidos.</li>";
  $("#dlgPerfil").showModal();
}

$("#btnCuenta").onclick = $("#btnCuenta2").onclick = () =>
  cliente ? abrirPerfil() : pedirAcceso("Entra con tu cuenta para pedir y ver tus datos.", null);
$("#btnPrime").onclick = () => {
  const activar = () => { cliente.prime = true; guardarCuentas(); pintarCarrito(); aviso("¡Ya tienes FoW Prime!"); };
  cliente ? activar() : pedirAcceso("Inicia sesión o crea tu cuenta para activar FoW Prime.", activar);
};
$("#btnContinuar").onclick = () =>
  cliente ? abrirPedido() : pedirAcceso("Para hacer tu pedido inicia sesión o crea una cuenta.", abrirPedido);

$("#formLogin").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target;
  const c = cuentas.find((x) => x.correo === f.correo.value.trim().toLowerCase() && x.clave === f.clave.value);
  if (!c) { $("#errLogin").textContent = "Correo o contraseña incorrectos."; return; }
  f.reset(); $("#errLogin").textContent = ""; $("#dlgLogin").close();
  aviso("Hola, " + c.nombre.split(" ")[0]); entrar(c);
};
$("#formRegistro").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target, correo = f.correo.value.trim().toLowerCase();
  if (cuentas.some((x) => x.correo === correo)) { $("#errRegistro").textContent = "Ese correo ya tiene una cuenta. Inicia sesión."; return; }
  const c = { nombre: f.nombre.value.trim(), telefono: f.telefono.value.trim(), correo, clave: f.clave.value, direccion: "", prime: false };
  cuentas.push(c); guardarCuentas();
  f.reset(); $("#errRegistro").textContent = ""; $("#dlgRegistro").close();
  aviso("Cuenta creada"); entrar(c);
};
$("#formPerfil").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target;
  Object.assign(cliente, { nombre: f.nombre.value.trim(), telefono: f.telefono.value.trim(), direccion: f.direccion.value.trim() });
  if (f.clave.value) cliente.clave = f.clave.value;
  guardarCuentas(); pintarSesion(); $("#dlgPerfil").close(); aviso("Datos actualizados");
};
$("#btnSalir").onclick = () => {
  cliente = null; localStorage.removeItem("fow_sesion");
  $("#dlgPerfil").close(); pintarSesion(); aviso("Sesión cerrada");
};
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset?.ir) { t.closest("dialog").close(); $("#" + t.dataset.ir).showModal(); }
  if (t.tagName === "DIALOG") t.close(); // clic en el fondo
});
$("#formPedido").onsubmit = (e) => {
  const f = e.target;
  // Pedido que luego leerán cocina (administrador) y contador. Estado inicial: "pendiente".
  const pedidos = leer("fow_pedidos", []);
  pedidos.push({
    id: Date.now(), estado: "pendiente", fecha: new Date().toISOString(),
    cliente: { nombre: f.nombre.value, telefono: f.telefono.value, correo: cliente.correo },
    entrega: f.entrega.value, direccion: f.direccion.value, notas: f.notas.value,
    items: carrito.map((i) => ({ ...i, precio: precioFinal(PRODUCTOS.find((p) => p.id === i.id)) })),
    ...totales()
  });
  guardar("fow_pedidos", pedidos);
  carrito = []; pintarCarrito(); abrirCarrito(false);
  aviso("Solicitud enviada. Te contactaremos pronto.");
};

pintarCategorias(); pintarMenu(); pintarPromos(); pintarSesion(); entregaCambio();