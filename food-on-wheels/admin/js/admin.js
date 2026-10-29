// Panel de administración FoW. Lee y escribe los mismos datos que la web del cliente (localStorage → luego la BD).
const $ = (s) => document.querySelector(s);
const dinero = (n) => "$" + Math.round(n).toLocaleString("es-CO");
const leer = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const ADMIN = { correo: "admin@fow.com", clave: "admin123", nombre: "María López" };
const ESTADOS = ["pendiente", "en preparación", "listo", "en camino", "entregado", "cancelado"];
const VISTAS = [["inicio","🏠","Inicio"],["pedidos","🧾","Pedidos"],["ventas","📈","Ventas"],["facturas","📄","Facturas"],["productos","📦","Productos"],["inventario","🥬","Inventario"],["puntos","🏪","Puntos de venta"],["clientes","👥","Clientes"],["reportes","📊","Reportes"],["config","⚙️","Configuración"]];
let pedidos = leer("fow_pedidos", []);
let inv = leerInventario();
let busq = "", filtro = "todos";

const activos = () => pedidos.filter((p) => p.estado !== "cancelado");
const hoy = () => activos().filter((p) => new Date(p.fecha).toDateString() === new Date().toDateString());
const hora = (p) => new Date(p.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const codigo = (p) => "#FOW-" + String(p.id).slice(-4);
const prod = (id) => PRODUCTOS.find((x) => x.id == id);
const badge = (e) => `<span class="est e${ESTADOS.indexOf(e)}">${e}</span>`;
const coincide = (...t) => t.join(" ").toLowerCase().includes(busq);
function aviso(m) { const a = $("#aviso"); a.textContent = m; a.classList.add("ver"); setTimeout(() => a.classList.remove("ver"), 2200); }
function guardarPedidos() { guardar("fow_pedidos", pedidos); }
function mover(p, signo) { // descuenta (-1) o devuelve (+1) los insumos de un pedido
  inv = leerInventario(); const t = necesidades(p.items);
  inv.forEach((i) => { if (t[i.n]) i.s = Math.max(0, Math.round((i.s + signo * t[i.n]) * 1000) / 1000); });
  guardar("fow_inventario", inv);
}
function cambiarEstado(p, nuevo) {
  if (!p.demo) {
    const consume = !["pendiente", "cancelado"].includes(nuevo);
    if (consume && !p.descontado) { mover(p, -1); p.descontado = true; }
    else if (!consume && p.descontado) { mover(p, 1); p.descontado = false; }
  }
  p.estado = nuevo; guardarPedidos();
}

function sembrar() { // datos de prueba para ver gráficas; se borran al conectar la BD
  if (pedidos.length) return;
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let n = 0; n < 36; n++) {
    const f = new Date(); f.setHours(8 + Math.floor(n / 3.2), Math.floor(r() * 60), 0, 0);
    const items = [...Array(1 + Math.floor(r() * 3))].map(() => { const p = PRODUCTOS[Math.floor(r() * 30)]; return { id: p.id, cant: 1 + Math.floor(r() * 2), precio: p.precio }; });
    const total = items.reduce((a, i) => a + i.precio * i.cant, 0);
    pedidos.push({ id: 4550 + n, demo: true, estado: n < 31 ? "entregado" : ["pendiente","en preparación","listo","en camino","pendiente"][n - 31], fecha: f.toISOString(),
      cliente: { nombre: "Cliente " + (n + 1), correo: "demo" + n + "@correo.com" }, entrega: r() > .5 ? "domicilio" : "recoger", items, sub: total, prime: 0, total });
  }
  guardarPedidos();
}

/* Piezas */
const kpi = (ico, c, t, v, f = "") => `<article class="kpi"><span class="ico ${c}">${ico}</span><div><p>${t}</p><b data-n="${v}" data-f="${f}">0</b></div></article>`;
const tabla = (cab, filas) => `<div class="tabla"><table><thead><tr>${cab.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${filas.join("") || `<tr><td colspan="${cab.length}" class="vacio">Sin resultados</td></tr>`}</tbody></table></div>`;
function filaPedido(p, edit) {
  const det = p.items.map((i) => `${i.cant}× ${prod(i.id)?.nombre}`).join(", ");
  const sel = `<select class="est e${ESTADOS.indexOf(p.estado)}" data-id="${p.id}" aria-label="Estado del pedido">${ESTADOS.map((o) => `<option ${o === p.estado ? "selected" : ""}>${o}</option>`).join("")}</select>`;
  return `<tr><td>${hora(p)}</td><td><b>${codigo(p)}</b></td><td>${p.cliente.nombre}</td>${edit ? `<td class="det">${det}${p.notas ? `<br><em>Nota: ${p.notas}</em>` : ""}</td>` : ""}<td>${p.entrega === "domicilio" ? "🛵 Domicilio" : "🏪 Recoger"}</td><td>${dinero(p.total)}</td><td>${edit ? sel : badge(p.estado)}</td></tr>`;
}
function ranking(n) {
  const m = {}; activos().forEach((p) => p.items.forEach((i) => (m[i.id] = (m[i.id] || 0) + i.cant)));
  return Object.entries(m).map(([id, c]) => ({ p: prod(id), c })).sort((a, b) => b.c - a.c).slice(0, n);
}
function barras(n) {
  const r = ranking(n), max = r[0]?.c || 1;
  return `<ol class="barras">${r.map((x, i) => `<li style="--w:${x.c / max * 100}%;--i:${i}"><span>${x.p.emoji} ${x.p.nombre}</span><i></i><b>${x.c} vendidos</b></li>`).join("")}</ol>`;
}
function grafica() {
  const h = Array(15).fill(0);
  hoy().forEach((p) => { const k = new Date(p.fecha).getHours() - 8; if (k >= 0 && k < 15) h[k] += p.total; });
  let ac = 0; const c = h.map((v) => (ac += v)), max = Math.max(...c, 1);
  const pts = c.map((v, i) => [40 + i * (540 / 14), 190 - (v / max) * 160]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return `<svg viewBox="0 0 600 220" class="graf" role="img" aria-label="Ventas acumuladas por hora"><path class="area" d="${d} L580 190 L40 190Z"/><path class="linea" pathLength="1" d="${d}"/>${pts.map((p, i) => i % 2 ? "" : `<text x="${p[0]}" y="212" text-anchor="middle">${8 + i}h</text>`).join("")}<circle class="punto" cx="${pts[14][0]}" cy="${pts[14][1]}" r="5"/></svg>`;
}

/* Vistas */
const V = {
  inicio: () => { const h = hoy(), v = h.reduce((a, p) => a + p.total, 0); return `
    <section class="banner"><div><h1>¡Hola, ${ADMIN.nombre.split(" ")[0]}!</h1><p>Aquí tienes el resumen de Food on Wheels hoy.</p></div><span class="moto" aria-hidden="true">🛵</span><em>Grandes sabores, mejores resultados</em></section>
    <div class="kpis">${kpi("🛍️","c1","Pedidos hoy",h.length)}${kpi("💰","c2","Ventas hoy",v,"$")}${kpi("🧾","c3","Facturas emitidas",pedidos.filter((p) => p.estado === "entregado").length)}${kpi("🏪","c4","Puntos de venta activos",4)}</div>
    <div class="dos"><section class="caja"><h2>Pedidos en tiempo real <small class="vivo">En línea</small></h2>${tabla(["Hora","Pedido","Cliente","Entrega","Total","Estado"], pedidos.slice(-6).reverse().map((p) => filaPedido(p, false)))}<a class="ver" href="#pedidos">Ver todos los pedidos →</a></section>
    <section class="caja"><h2>Resumen de ventas</h2><p class="gran">${dinero(v)}</p>${grafica()}</section></div>
    <section class="caja"><h2>Productos más vendidos</h2>${barras(6)}</section>`; },
  pedidos: () => { const l = pedidos.slice().reverse().filter((p) => (filtro === "todos" || p.estado === filtro) && coincide(codigo(p), p.cliente.nombre)); return `
    <section class="caja"><h2>Pedidos</h2><div class="chips">${["todos", ...ESTADOS].map((e) => `<button class="chip" data-f="${e}" aria-pressed="${e === filtro}">${e}${e === "todos" ? "" : " (" + pedidos.filter((p) => p.estado === e).length + ")"}</button>`).join("")}</div>
    ${tabla(["Hora","Pedido","Cliente","Detalle","Entrega","Total","Estado"], l.map((p) => filaPedido(p, true)))}</section>`; },
  ventas: () => { const a = activos(), t = a.reduce((s, p) => s + p.total, 0); return `
    <div class="kpis">${kpi("💰","c2","Ventas totales",t,"$")}${kpi("🛍️","c1","Pedidos",a.length)}${kpi("🎟️","c3","Ticket promedio",a.length ? t / a.length : 0,"$")}${kpi("🛵","c4","Domicilios",a.filter((p) => p.entrega === "domicilio").length)}</div>
    <div class="dos"><section class="caja"><h2>Ventas de hoy por hora</h2>${grafica()}</section><section class="caja"><h2>Más vendidos</h2>${barras(8)}</section></div>`; },
  facturas: () => `<section class="caja"><h2>Facturas emitidas</h2>${tabla(["Factura","Fecha","Cliente","Total"], pedidos.filter((p) => p.estado === "entregado").reverse().filter((p) => coincide(codigo(p), p.cliente.nombre)).map((p) => `<tr><td><b>FAC-${String(p.id).slice(-4)}</b></td><td>${new Date(p.fecha).toLocaleDateString("es-CO")} ${hora(p)}</td><td>${p.cliente.nombre}</td><td>${dinero(p.total)}</td></tr>`))}</section>`,
  productos: () => { const m = Object.fromEntries(pedidos.filter((p) => p.estado !== "cancelado").flatMap((p) => p.items).reduce((a, i) => a.set(i.id, (a.get(i.id) || 0) + i.cant), new Map())); return `
    <section class="caja"><h2>Productos (${PRODUCTOS.length})</h2>${tabla(["","Producto","Categoría","Precio","Vendidos","Disponibilidad"], PRODUCTOS.filter((p) => coincide(p.nombre, p.categoria)).map((p) => `<tr><td class="em">${p.emoji}</td><td><b>${p.nombre}</b></td><td>${p.categoria}</td><td>${dinero(p.precio)}</td><td>${m[p.id] || 0}</td><td>${agotado(p, inv) ? '<span class="est e5">Agotado</span>' : '<span class="est e3">Disponible</span>'}</td></tr>`))}</section>`; },
  inventario: () => { const bajos = inv.filter((i) => i.s <= i.m).length; return `
    ${bajos ? `<p class="alerta">⚠️ ${bajos} insumo${bajos > 1 ? "s" : ""} con stock bajo. Repón antes de que se agote la cocina.</p>` : ""}
    <section class="caja"><h2>Inventario de insumos</h2>${tabla(["Insumo","Stock","Mínimo","Nivel","Ajustar"], inv.map((i, k) => [i, k]).filter(([i]) => coincide(i.n)).map(([i, k]) => `<tr class="${i.s <= i.m ? "bajo" : ""}"><td><b>${i.n}</b></td><td>${+i.s.toFixed(2)} ${i.u}</td><td>${i.m} ${i.u}</td><td><div class="nivel"><i style="width:${Math.min(100, i.s / (i.m * 3) * 100)}%"></i></div></td><td class="ajuste"><button data-k="${k}" data-d="-1">−1</button><button data-k="${k}" data-d="1">+1</button><button data-k="${k}" data-d="10">+10</button></td></tr>`))}</section>`; },
  puntos: () => `<div class="kpis">${[["Sede Principal","Cll 72 # 12-34"],["Centro Comercial","Local 214"],["Zona Norte","Av. 5 # 30-10"],["Domicilio","Cobertura 8 km"]].map((x) => `<article class="kpi"><span class="ico c4">🏪</span><div><p>${x[0]}</p><b class="txt">${x[1]}</b><small class="vivo">Activo</small></div></article>`).join("")}</div>`,
  clientes: () => { const c = leer("fow_cuentas", []).filter((x) => coincide(x.nombre, x.correo)); return `<section class="caja"><h2>Clientes registrados (${c.length})</h2>${tabla(["Nombre","Correo","Teléfono","Pedidos","Prime"], c.map((x) => `<tr><td><b>${x.nombre}</b></td><td>${x.correo}</td><td>${x.telefono}</td><td>${pedidos.filter((p) => p.cliente.correo === x.correo).length}</td><td>${x.prime ? "👑 Sí" : "No"}</td></tr>`))}</section>`; },
  reportes: () => { const a = activos(), t = a.reduce((s, p) => s + p.total, 0), r = ranking(1)[0]; return `
    <div class="kpis">${kpi("⭐","c1","Unidades vendidas",a.reduce((n, p) => n + p.items.reduce((x, i) => x + i.cant, 0), 0))}${kpi("🚫","c3","Cancelados",pedidos.length - a.length)}${kpi("🎟️","c2","Ticket promedio",a.length ? t / a.length : 0,"$")}${kpi("🧾","c4","Pedidos totales",pedidos.length)}</div>
    <section class="caja"><h2>Producto estrella</h2><p class="gran">${r ? r.p.emoji + " " + r.p.nombre : "Sin datos"}</p><p>${r ? r.c + " unidades vendidas" : ""}</p></section>`; },
  config: () => `<section class="caja"><h2>Configuración</h2><p>Sesión iniciada como ${ADMIN.correo}.</p><div class="acciones"><button class="btn" id="btnSalir">Cerrar sesión</button><button class="btn gris" id="btnReset">Reiniciar datos de prueba</button></div></section>`
};

/* Render */
function contar() {
  document.querySelectorAll("[data-n]").forEach((el) => {
    const n = +el.dataset.n, pre = el.dataset.f, t0 = performance.now();
    const paso = (t) => { const k = Math.min(1, (t - t0) / 700); el.textContent = (pre || "") + Math.round(n * (1 - Math.pow(1 - k, 3))).toLocaleString("es-CO"); if (k < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
  });
}
function render() {
  const h = (location.hash || "#inicio").slice(1), v = V[h] ? h : "inicio";
  $("#vista").innerHTML = V[v]();
  $("#nav").innerHTML = VISTAS.map(([id, ico, t]) => `<a href="#${id}" class="${id === v ? "activo" : ""}">${ico}<span>${t}</span>${id === "pedidos" ? `<b class="cuenta">${pedidos.filter((p) => p.estado === "pendiente").length}</b>` : ""}</a>`).join("");
  $("#campana").textContent = pedidos.filter((p) => p.estado === "pendiente").length;
  $("#lateral").classList.remove("abierto");
  contar();
}
function entrar() { sembrar(); $("#login").hidden = true; $("#app").hidden = false; render(); }

/* Eventos */
window.onhashchange = () => { busq = ""; $("#buscar").value = ""; render(); scrollTo(0, 0); };
$("#buscar").oninput = (e) => { busq = e.target.value.toLowerCase().trim(); render(); };
$("#btnMenu").onclick = () => $("#lateral").classList.toggle("abierto");
$("#vista").addEventListener("change", (e) => {
  const s = e.target.closest("select[data-id]"); if (!s) return;
  const p = pedidos.find((x) => x.id == s.dataset.id); cambiarEstado(p, s.value);
  s.className = "est e" + ESTADOS.indexOf(p.estado); render(); aviso(codigo(p) + ": " + p.estado);
});
$("#vista").addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.f) { filtro = t.dataset.f; render(); }
  if (t.dataset.k) { const i = inv[+t.dataset.k]; i.s = Math.max(0, i.s + +t.dataset.d); guardar("fow_inventario", inv); render(); }
  if (t.id === "btnSalir") { localStorage.removeItem("fow_admin_sesion"); location.reload(); }
  if (t.id === "btnReset" && confirm("Se borrarán pedidos e inventario guardados. ¿Continuar?")) { ["fow_pedidos", "fow_inventario"].forEach((k) => localStorage.removeItem(k)); location.reload(); }
});
$("#formLogin").onsubmit = (e) => {
  e.preventDefault(); const f = e.target;
  if (f.correo.value.trim().toLowerCase() === ADMIN.correo && f.clave.value === ADMIN.clave) { guardar("fow_admin_sesion", 1); entrar(); }
  else $("#errLogin").textContent = "Correo o contraseña incorrectos.";
};
window.addEventListener("storage", (e) => { // cambios hechos desde la web del cliente
  if (e.key === "fow_pedidos") pedidos = leer("fow_pedidos", []);
  if (e.key === "fow_inventario") inv = leerInventario();
  if (["fow_pedidos", "fow_inventario"].includes(e.key) && !$("#app").hidden) { render(); if (e.key === "fow_pedidos") aviso("Llegó un pedido nuevo"); }
});
if (leer("fow_admin_sesion", 0)) entrar();
