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
const primeActivo = () => !!cliente?.prime && (!cliente.vence || new Date(cliente.vence) > new Date());
const bloqueado = () => !!leer("fow_cuentas", []).find((c) => c.correo === cliente?.correo)?.bloqueado;
const AVISO_BLOQ = "Tu cuenta está bloqueada y no puede comprar. Contacta al restaurante.";

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
  const inv = leerInventario();
  const lista = PRODUCTOS.filter((p) =>
    (categoria === "Todos" || p.categoria === categoria) &&
    (p.nombre + " " + p.descripcion).toLowerCase().includes(texto));
  $("#infoResultados").textContent = lista.length + " productos";
  $("#grilla").innerHTML = lista.length ? lista.map((p, i) => `
    <article class="tarjeta${agotado(p, inv) ? " agotado" : ""}" style="--i:${Math.min(i, 12)}">
      <div class="tarjeta-img" aria-hidden="true">${p.imagen ? `<img src="${p.imagen}" alt="">` : p.emoji}${agotado(p, inv) ? '<span class="etiqueta-desc etiqueta-agotado">Agotado</span>' : p.descuento ? `<span class="etiqueta-desc">-${p.descuento}%</span>` : ""}</div>
      <div class="tarjeta-cuerpo">
        <h3>${p.nombre}</h3><p>${p.descripcion}</p>
        <span class="meta"><b>★ ${p.rating}</b> · ${p.minutos} min</span>
        <div class="tarjeta-pie">
          <span class="precio">${p.descuento ? `<s>${dinero(p.precio)}</s>` : "Desde "}${dinero(precioFinal(p))}</span>
          <button class="btn-anadir" type="button" data-id="${p.id}" aria-label="Añadir ${p.nombre}"${agotado(p, inv) ? " disabled" : ""}>${agotado(p, inv) ? "Agotado" : "+ Añadir"}</button>
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
  const prime = primeActivo() ? sub * 0.25 : 0;
  return { sub, prime, total: sub - prime };
}
function pintarCarrito() {
  const n = carrito.reduce((s, i) => s + i.cant, 0);
  $("#contador").textContent = n;
  $("#itemsCarrito").innerHTML = carrito.length ? carrito.map((i) => {
    const p = PRODUCTOS.find((x) => x.id === i.id);
    return `<div class="item"><div class="item-emoji">${p.imagen ? `<img src="${p.imagen}" alt="">` : p.emoji}</div>
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
  if (d > 0 && cliente && bloqueado()) { aviso(AVISO_BLOQ); return false; }
  if (d > 0) { // no dejar pedir más de lo que hay en el inventario
    const prueba = carrito.map((i) => ({ ...i })), e = prueba.find((i) => i.id === id);
    e ? e.cant++ : prueba.push({ id, cant: 1 });
    if (faltantes(prueba, leerInventario()).length) { aviso("No quedan más existencias de " + PRODUCTOS.find((x) => x.id === id).nombre); pintarMenu(); return false; }
  }
  if (d > 0) { const b = $("#contador"); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
  if (it) { it.cant += d; carrito = carrito.filter((i) => i.cant > 0); }
  else if (d > 0) carrito.push({ id, cant: 1 });
  pintarCarrito();
  return true;
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
  if (bloqueado()) return aviso(AVISO_BLOQ);
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
  if (t.dataset.id && cambiar(+t.dataset.id, 1)) { aviso("Añadido al pedido"); const c = $("#btnCarrito"); c.classList.remove("meneo"); void c.offsetWidth; c.classList.add("meneo"); }
  if (t.dataset.mas) cambiar(+t.dataset.mas, 1);
  if (t.dataset.menos) cambiar(+t.dataset.menos, -1);
  if (t.dataset.filtro) {
    if (t.dataset.filtro === "prime") $("#prime").scrollIntoView();
    else { categoria = t.dataset.filtro; pintarCategorias(); pintarMenu(); $("#menu").scrollIntoView(); }
  }
  if (t.hasAttribute("data-cerrar")) t.closest("dialog").close();
});
$("#btnCarrito").onclick = () => abrirCarrito(true);
$("#cerrarCarrito").onclick = () => abrirCarrito(false);
$("#velo").onclick = () => { abrirCarrito(false); abrirPedidos(false); };
$("#btnPedidos").onclick = $("#btnPedidos2").onclick = () => abrirPedidos();
$("#cerrarPedidos").onclick = () => abrirPedidos(false);
$("#buscar").oninput = (e) => { texto = e.target.value.toLowerCase().trim(); pintarMenu(); };
$("#selEntrega").onchange = entregaCambio;
function guardarCuentas() {
  if (cliente) { // fusionar con lo que el admin pudo cambiar (p. ej. el bloqueo)
    const frescas = leer("fow_cuentas", []), i = frescas.findIndex((c) => c.correo === cliente.correo);
    if (i >= 0) { cliente.bloqueado = frescas[i].bloqueado; frescas[i] = cliente; cuentas = frescas; }
  }
  guardar("fow_cuentas", cuentas);
}
function pintarSesion() {
  $("#btnCuenta").textContent = cliente ? cliente.nombre.trim()[0].toUpperCase() : "👤";
  $("#btnCuenta2").firstChild.textContent = cliente ? "🙂" : "👤";
  pintarCarrito(); snap(); pintarPedidos();
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
  $("#estadoPrime").textContent = primeActivo() ? "Miembro FoW Prime" + (cliente.vence ? " hasta " + new Date(cliente.vence).toLocaleDateString("es-CO") : "") : "Sin membresía Prime";
  $("#dlgPerfil").showModal();
}

$("#btnCuenta").onclick = $("#btnCuenta2").onclick = () =>
  cliente ? abrirPerfil() : pedirAcceso("Entra con tu cuenta para pedir y ver tus datos.", null);
/* Compra de FoW Prime (pago de demostración: no se cobra ni se guarda ningún dato de tarjeta) */
const PLANES = { mensual: ["Mensual", 19900, 30], trimestral: ["Trimestral", 49900, 90], anual: ["Anual", 179900, 365] };
function resumenPrime() {
  const f = $("#formPrime"), tarjeta = f.metodo.value === "tarjeta";
  $("#resumenPrime").textContent = dinero(PLANES[f.plan.value][1]);
  $("#camposTarjeta").hidden = !tarjeta; $("#camposBilletera").hidden = tarjeta;
  $("#camposTarjeta").querySelectorAll("input").forEach((i) => (i.required = tarjeta));
  f.celular.required = !tarjeta;
}
function abrirPrime() {
  if (bloqueado()) return aviso(AVISO_BLOQ);
  if (primeActivo()) return aviso("Tu Prime está activo" + (cliente.vence ? " hasta " + new Date(cliente.vence).toLocaleDateString("es-CO") : ""));
  $("#dlgPrime").showModal(); resumenPrime();
}
$("#btnPrime").onclick = () => cliente ? abrirPrime() : pedirAcceso("Inicia sesión o crea tu cuenta para comprar FoW Prime.", abrirPrime);
$("#formPrime").onchange = resumenPrime;
$("#formPrime").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target, pl = PLANES[f.plan.value], ahora = new Date();
  cliente.prime = true; cliente.plan = pl[0]; cliente.vence = new Date(ahora.getTime() + pl[2] * 864e5).toISOString();
  guardarCuentas();
  const m = leer("fow_membresias", []);
  m.push({ id: Date.now(), fecha: ahora.toISOString(), correo: cliente.correo, nombre: cliente.nombre, plan: pl[0], precio: pl[1], metodo: f.metodo.value });
  guardar("fow_membresias", m);
  f.reset(); $("#dlgPrime").close(); pintarCarrito(); aviso("¡Bienvenido a FoW Prime!");
};
function aplicarBanner() {
  const b = leerBanner(), h = $("#hPlato");
  $("#hEtiqueta").textContent = b.etiqueta; $("#hTitulo").textContent = b.titulo; $("#hTexto").textContent = b.texto;
  $("#hBoton").textContent = b.boton; $("#hEmoji").textContent = b.emoji;
  h.classList.toggle("con-imagen", !!b.imagen); h.style.backgroundImage = b.imagen ? `url(${b.imagen})` : "";
}
$("#btnContinuar").onclick = () =>
  cliente ? abrirPedido() : pedirAcceso("Para hacer tu pedido inicia sesión o crea una cuenta.", abrirPedido);

$("#formLogin").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target;
  cuentas = leer("fow_cuentas", []);
  const c = cuentas.find((x) => x.correo === f.correo.value.trim().toLowerCase() && x.clave === f.clave.value);
  if (!c) { $("#errLogin").textContent = "Correo o contraseña incorrectos."; return; }
  f.reset(); $("#errLogin").textContent = ""; $("#dlgLogin").close();
  aviso("Hola, " + c.nombre.split(" ")[0]); entrar(c);
};
$("#formRegistro").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target, correo = f.correo.value.trim().toLowerCase();
  cuentas = leer("fow_cuentas", []);
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
  if (bloqueado()) { e.preventDefault(); $("#dlgPedido").close(); return aviso(AVISO_BLOQ); }
  if (faltantes(carrito, leerInventario()).length) { // algo se agotó mientras armaba el pedido
    e.preventDefault(); $("#dlgPedido").close(); pintarMenu(); abrirCarrito(true);
    return aviso("Algún producto se agotó. Ajusta tu pedido.");
  }
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
  aviso("Solicitud enviada. Te contactaremos pronto."); snap(); abrirPedidos();
};

/* Estado de mis pedidos (separado del perfil) */
const PASOS = { domicilio: ["pendiente", "en preparación", "listo", "en camino", "entregado"], recoger: ["pendiente", "en preparación", "listo", "entregado"] };
const ETIQ = { pendiente: "Recibido", "en preparación": "Cocinando", listo: "Listo", "en camino": "En camino", entregado: "Entregado" };
let prev = {};
const misPedidos = () => leer("fow_pedidos", []).filter((p) => cliente && p.cliente.correo === cliente.correo).reverse();
const snap = () => { prev = Object.fromEntries(misPedidos().map((p) => [p.id, p.estado])); };
function pintarPedidos() {
  const l = misPedidos(), vivos = l.filter((p) => !["entregado", "cancelado"].includes(p.estado)).length;
  $("#contPedidos").textContent = vivos; $("#contPedidos").hidden = !vivos;
  $("#listaPedidos").innerHTML = l.length ? l.map((p, k) => {
    const pasos = PASOS[p.entrega] || PASOS.domicilio, i = pasos.indexOf(p.estado);
    const items = p.items.map((x) => `${x.cant}× ${PRODUCTOS.find((y) => y.id === x.id)?.nombre ?? "Producto"}`).join(", ");
    const ruta = p.estado === "cancelado" ? '<p class="pedido-cancel">Este pedido fue cancelado.</p>'
      : `<div class="ruta" style="--p:${i / (pasos.length - 1)};--n:${pasos.length}"><i class="barra"></i><span class="moto" aria-hidden="true">🛵</span>${pasos.map((s, n) => `<span class="paso ${n < i ? "hecho" : n === i ? "actual" : ""}"><u></u><small>${p.entrega === "recoger" && s === "listo" ? "Listo para recoger" : ETIQ[s]}</small></span>`).join("")}</div>`;
    return `<article class="pedido${p.estado === "cancelado" ? " cancelado" : ""}" style="--i:${k}"><header><b>#FOW-${String(p.id).slice(-4)}</b><span>${new Date(p.fecha).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}</span></header><p class="pedido-items">${items}</p>${ruta}<footer><span>${p.entrega === "domicilio" ? "🛵 Domicilio" : "🏪 Recoger en local"}</span><b>${dinero(p.total)}</b></footer></article>`;
  }).join("") : '<p class="vacio">Aún no tienes pedidos. ¡Pide algo rico!</p>';
}
function avisarCambios() { // el admin cambió el estado de un pedido
  misPedidos().forEach((p) => { if (prev[p.id] && prev[p.id] !== p.estado) aviso(`Pedido #${String(p.id).slice(-4)}: ${p.estado}`); });
  snap(); pintarPedidos();
}
function abrirPedidos(abrir = true) {
  if (abrir && !cliente) return pedirAcceso("Inicia sesión para ver el estado de tus pedidos.", () => abrirPedidos());
  if (abrir) { abrirCarrito(false); pintarPedidos(); }
  $("#panelPedidos").classList.toggle("abierto", abrir); $("#panelPedidos").setAttribute("aria-hidden", !abrir); $("#velo").hidden = !abrir;
}
/* Detalles de estilo */
addEventListener("scroll", () => $(".top").classList.toggle("elevado", scrollY > 8), { passive: true });
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("visible"); io.unobserve(x.target); } }), { threshold: .1 });
  document.querySelectorAll(".promos,.menu,.prime").forEach((el) => { el.classList.add("reveal"); io.observe(el); });
}
setTimeout(() => $("#splash").classList.add("fuera"), 900);

window.addEventListener("storage", (e) => { // el admin cambió algo
  if (["fow_productos", "fow_recetas", "fow_promos", "fow_banner", "fow_inventario"].includes(e.key)) {
    recargarCatalogo(); carrito = carrito.filter((i) => PRODUCTOS.some((p) => p.id === i.id));
    if (!PRODUCTOS.some((p) => p.categoria === categoria)) categoria = "Todos";
    aplicarBanner(); pintarCategorias(); pintarMenu(); pintarPromos(); pintarCarrito();
  }
  if (e.key === "fow_pedidos") avisarCambios();
  if (e.key === "fow_cuentas") {
    cuentas = leer("fow_cuentas", []); const c = cuentas.find((x) => x.correo === cliente?.correo);
    if (cliente && !c) { cliente = null; localStorage.removeItem("fow_sesion"); aviso("Tu cuenta ya no existe."); } else if (c) cliente = c;
    pintarSesion();
  }
});
carrito = carrito.filter((i) => PRODUCTOS.some((p) => p.id === i.id));
aplicarBanner(); pintarCategorias(); pintarMenu(); pintarPromos(); pintarSesion(); entregaCambio();
