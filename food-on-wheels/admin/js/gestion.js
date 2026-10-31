// Gestión del admin: productos y combos, inventario e historial, puntos de venta, clientes, banner y promociones.
const campo = (l, n, v = "", t = "text", x = "") => `<label>${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x}></label>`;
const mini = (p) => p.imagen ? `<img class="thumb" src="${p.imagen}" alt="">` : `<span class="em">${p.emoji}</span>`;
const guardarCat = () => guardar("fow_productos", PRODUCTOS) && guardar("fow_recetas", RECETAS);
const guardarRecetas = () => guardar("fow_recetas", RECETAS);
const redimensionar = (file, max = 480) => new Promise((ok, no) => {
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = im.width * k; c.height = im.height * k; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL("image/jpeg", .8)); }; im.onerror = no; im.src = r.result; };
  r.onerror = no; r.readAsDataURL(file);
});
function editor(titulo, html, guardarFn) { // ventana genérica: guardarFn devuelve true o un texto de error
  const f = $("#formDlg");
  f.innerHTML = `<h2>${titulo}</h2>${html}<p class="error" id="errDlg" role="alert"></p><div class="acciones"><button class="btn gris" type="button" data-x>Cancelar</button><button class="btn" type="submit">Guardar</button></div>`;
  f.onsubmit = async (e) => { e.preventDefault(); const r = await guardarFn(new FormData(f)); if (r === true) { $("#dlg").close(); render(); aviso("Guardado"); } else $("#errDlg").textContent = r || "No se pudo guardar."; };
  $("#dlg").showModal();
}
$("#dlg").addEventListener("click", (e) => {
  const t = e.target;
  if (t === $("#dlg") || t.dataset.x !== undefined) $("#dlg").close();
  if (t.dataset.rm !== undefined) t.closest(".fila-receta").remove();
  if (t.dataset.a === "rec-add") $("#recetas").insertAdjacentHTML("beforeend", filaReceta("", "", +t.dataset.id));
});

/* ---------- Productos y combos ---------- */
let catSel = "todas";
function filaReceta(k = "", c = "", propio = 0) {
  const ops = `<optgroup label="Insumos">${inv.map((i) => `<option value="${esc(i.n)}" ${i.n === k ? "selected" : ""}>${esc(i.n)} (${esc(i.u)})</option>`).join("")}</optgroup><optgroup label="Productos (para combos)">${PRODUCTOS.filter((p) => p.id !== propio).map((p) => `<option value="@${p.id}" ${"@" + p.id === k ? "selected" : ""}>${esc(p.nombre)}</option>`).join("")}</optgroup>`;
  return `<div class="fila-receta"><select name="rk">${ops}</select><input name="rc" type="number" step="any" min="0.001" value="${c}" required aria-label="Cantidad"><button type="button" class="mini" data-rm aria-label="Quitar">✕</button></div>`;
}
V.productos = () => {
  const vend = {}; pedidos.filter((p) => p.estado !== "cancelado").forEach((p) => p.items.forEach((i) => (vend[i.id] = (vend[i.id] || 0) + i.cant)));
  const cats = ["todas", ...new Set(PRODUCTOS.map((p) => p.categoria))];
  const filas = PRODUCTOS.filter((p) => (catSel === "todas" || p.categoria === catSel) && coincide(p.nombre, p.categoria)).map((p) => `<tr><td>${mini(p)}</td><td><b>${esc(p.nombre)}</b></td><td>${esc(p.categoria)}</td><td>${dinero(p.precio)}${p.descuento ? ` <span class="est e1">-${p.descuento}%</span>` : ""}</td><td>${vend[p.id] || 0}</td><td>${agotado(p, inv) ? '<span class="est e5">Agotado</span>' : '<span class="est e3">Disponible</span>'}</td><td class="acc"><button data-a="prod-edit" data-id="${p.id}">Editar</button><button class="peli" data-a="prod-del" data-id="${p.id}">Eliminar</button></td></tr>`);
  return `<section class="caja"><div class="cab"><h2>Productos y combos (${PRODUCTOS.length})</h2><button class="btn" data-a="prod-nuevo">＋ Añadir</button></div><div class="chips">${cats.map((c) => `<button class="chip" data-cat="${esc(c)}" aria-pressed="${c === catSel}">${esc(c)}</button>`).join("")}</div>${tabla(["", "Producto", "Categoría", "Precio", "Vendidos", "Estado", "Acciones"], filas)}</section>`;
};
function editarProducto(id) {
  const e = PRODUCTOS.find((p) => p.id === id) || {};
  editor(id ? "Editar producto" : "Nuevo producto", `
    ${campo("Nombre", "nombre", e.nombre, "text", "required")}${campo("Descripción", "descripcion", e.descripcion)}
    <div class="dos-col">${campo("Precio (COP)", "precio", e.precio, "number", 'required min="1" step="100"')}${campo("Descuento (%)", "descuento", e.descuento || 0, "number", 'min="0" max="90"')}</div>
    <div class="dos-col">${campo("Categoría (usa «Combos» para combos)", "categoria", e.categoria, "text", 'required list="cats"')}${campo("Emoji", "emoji", e.emoji || "🍽️")}</div>
    <datalist id="cats">${[...new Set(PRODUCTOS.map((p) => p.categoria))].map((c) => `<option value="${esc(c)}">`).join("")}</datalist>
    <label>Imagen (opcional)<input type="file" name="img" accept="image/*"></label>
    ${e.imagen ? `<img class="prev" src="${e.imagen}" alt=""><label class="chk"><input type="checkbox" name="quitar"> Quitar imagen actual</label>` : ""}
    <p class="nota"><b>Receta:</b> insumos que gasta una unidad. En un combo, agrega los productos que incluye y cuántos.</p>
    <div id="recetas">${(RECETAS[id] || []).map(([k, c]) => filaReceta(k, c, id)).join("")}</div>
    <button class="btn gris" type="button" data-a="rec-add" data-id="${id}">＋ Ingrediente o producto</button>`,
  async (fd) => {
    const pid = e.id || Math.max(0, ...PRODUCTOS.map((x) => x.id)) + 1, f = fd.get("img");
    let imagen = e.imagen || "";
    if (f && f.size) { try { imagen = await redimensionar(f, 480); } catch { return "No se pudo leer la imagen."; } } else if (fd.get("quitar")) imagen = "";
    const p = { id: pid, nombre: fd.get("nombre").trim(), descripcion: fd.get("descripcion").trim(), precio: +fd.get("precio"), categoria: fd.get("categoria").trim(), minutos: e.minutos || 15, rating: e.rating || 4.5, emoji: fd.get("emoji") || "🍽️", descuento: +fd.get("descuento") || 0, imagen };
    const cs = fd.getAll("rc"), filas = fd.getAll("rk").map((k, i) => [k, +cs[i]]).filter(([, c]) => c > 0);
    e.id ? (PRODUCTOS[PRODUCTOS.findIndex((x) => x.id === pid)] = p) : PRODUCTOS.push(p);
    filas.length ? (RECETAS[pid] = filas) : delete RECETAS[pid];
    return guardarCat() || "No hay espacio: usa una imagen más pequeña.";
  });
}
function borrarProducto(id) {
  const p = PRODUCTOS.find((x) => x.id === id);
  if (!confirm(`¿Eliminar «${p.nombre}»? Desaparece del menú del cliente.`)) return;
  PRODUCTOS = PRODUCTOS.filter((x) => x.id !== id); delete RECETAS[id];
  Object.keys(RECETAS).forEach((k) => (RECETAS[k] = RECETAS[k].filter(([n]) => n !== "@" + id)));
  guardarCat(); render(); aviso("Producto eliminado");
}

/* ---------- Inventario e historial ---------- */
let invTab = "existencias", rango = "todo";
const quitarDeRecetas = (n) => Object.keys(RECETAS).forEach((k) => (RECETAS[k] = RECETAS[k].filter(([x]) => x !== n)));
function gastos() {
  const hoyStr = new Date().toDateString(), h = leer("fow_historial", []).filter((x) => rango === "todo" || new Date(x.f).toDateString() === hoyStr);
  const res = {}; h.forEach((x) => { const r = (res[x.n] ||= { g: 0, r: 0 }); if (/^(Pedido|Devolución)/.test(x.motivo)) r.g -= x.c; else if (x.c > 0) r.r += x.c; });
  const r2 = (n) => +n.toFixed(2);
  return `<div class="chips">${[["hoy", "Hoy"], ["todo", "Todo el historial"]].map(([k, t]) => `<button class="chip" data-rango="${k}" aria-pressed="${k === rango}">${t}</button>`).join("")}</div>
  ${tabla(["Insumo", "Gastado", "Repuesto", "Stock actual"], inv.map((i) => `<tr><td><b>${esc(i.n)}</b></td><td>${r2(res[i.n]?.g || 0)} ${esc(i.u)}</td><td>${r2(res[i.n]?.r || 0)} ${esc(i.u)}</td><td>${r2(i.s)} ${esc(i.u)}</td></tr>`))}
  <h3 class="sub">Últimos movimientos</h3>
  ${tabla(["Fecha", "Insumo", "Cantidad", "Motivo"], h.slice(-40).reverse().map((x) => `<tr><td>${new Date(x.f).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}</td><td>${esc(x.n)}</td><td class="${x.c < 0 ? "neg" : "pos"}">${x.c > 0 ? "+" : ""}${x.c}</td><td>${esc(x.motivo)}</td></tr>`))}`;
}
V.inventario = () => {
  const bajos = inv.filter((i) => i.s <= i.m).length;
  const tabs = `<div class="chips">${[["existencias", "Existencias"], ["gastos", "Gastos e historial"]].map(([k, t]) => `<button class="chip" data-tab="${k}" aria-pressed="${k === invTab}">${t}</button>`).join("")}</div>`;
  if (invTab === "gastos") return `<section class="caja"><h2>Gasto de insumos</h2>${tabs}${gastos()}</section>`;
  return `${bajos ? `<p class="alerta">⚠️ ${bajos} insumo${bajos > 1 ? "s" : ""} con stock bajo. Repón antes de que se agote la cocina.</p>` : ""}
  <section class="caja"><div class="cab"><h2>Inventario de insumos</h2><button class="btn" data-a="ins-nuevo">＋ Añadir insumo</button></div>${tabs}
  ${tabla(["Insumo", "Stock", "Mínimo", "Nivel", "Ajustar", "Acciones"], inv.map((i, k) => [i, k]).filter(([i]) => coincide(i.n)).map(([i, k]) => `<tr class="${i.s <= i.m ? "bajo" : ""}"><td><b>${esc(i.n)}</b></td><td>${+i.s.toFixed(2)} ${esc(i.u)}</td><td>${i.m} ${esc(i.u)}</td><td><div class="nivel"><i style="width:${Math.min(100, i.s / ((i.m || 1) * 3) * 100)}%"></i></div></td><td class="ajuste"><button data-k="${k}" data-d="-1">−1</button><button data-k="${k}" data-d="1">+1</button><button data-k="${k}" data-d="10">+10</button></td><td class="acc"><button data-a="ins-edit" data-j="${k}">Editar</button><button class="peli" data-a="ins-del" data-j="${k}">Eliminar</button></td></tr>`))}</section>`;
};
function editarInsumo(k) {
  const e = inv[k] || {};
  editor(k >= 0 ? "Editar insumo" : "Nuevo insumo", `${campo("Nombre", "n", e.n, "text", "required")}${campo("Unidad (kg, und, L…)", "u", e.u || "kg", "text", "required")}<div class="dos-col">${campo("Stock", "s", e.s ?? 0, "number", 'required min="0" step="any"')}${campo("Mínimo", "m", e.m ?? 0, "number", 'required min="0" step="any"')}</div>`, (fd) => {
    const n = fd.get("n").trim();
    if (inv.some((x, j) => x.n === n && j !== k)) return "Ya existe un insumo con ese nombre.";
    const nuevo = { n, u: fd.get("u").trim(), s: +fd.get("s"), m: +fd.get("m") };
    if (k >= 0) {
      if (e.n !== n) { Object.keys(RECETAS).forEach((r) => (RECETAS[r] = RECETAS[r].map(([x, c]) => [x === e.n ? n : x, c]))); guardarRecetas(); }
      if (nuevo.s !== e.s) registrar(n, nuevo.s - e.s, "Ajuste manual");
      inv[k] = nuevo;
    } else { inv.push(nuevo); registrar(n, nuevo.s, "Stock inicial"); }
    return guardar("fow_inventario", inv);
  });
}
function borrarInsumo(k) {
  if (!confirm(`¿Eliminar «${inv[k].n}»? También se quitará de las recetas.`)) return;
  quitarDeRecetas(inv[k].n); guardarRecetas(); inv.splice(k, 1); guardar("fow_inventario", inv); render(); aviso("Insumo eliminado");
}

/* ---------- Puntos de venta ---------- */
const puntos = () => leer("fow_puntos", [{ id: 1, nombre: "Sede Principal", dir: "Cll 72 # 12-34", activo: true }, { id: 2, nombre: "Centro Comercial", dir: "Local 214", activo: true }, { id: 3, nombre: "Zona Norte", dir: "Av. 5 # 30-10", activo: true }, { id: 4, nombre: "Domicilio", dir: "Cobertura 8 km", activo: true }]);
V.puntos = () => `<div class="cab"><h2>Puntos de venta</h2><button class="btn" data-a="pv-nuevo">＋ Añadir punto</button></div><div class="kpis">${puntos().map((x) => `<article class="kpi"><span class="ico c4">🏪</span><div><p>${esc(x.nombre)}</p><b class="txt">${esc(x.dir)}</b><small class="${x.activo ? "vivo" : ""}">${x.activo ? "Activo" : "Inactivo"}</small><div class="acc"><button data-a="pv-edit" data-id="${x.id}">Editar</button><button data-a="pv-tog" data-id="${x.id}">${x.activo ? "Desactivar" : "Activar"}</button><button class="peli" data-a="pv-del" data-id="${x.id}">Eliminar</button></div></div></article>`).join("") || '<p class="vacio">No hay puntos de venta.</p>'}</div>`;
function editarPunto(id) {
  const ps = puntos(), e = ps.find((x) => x.id === id) || { activo: true };
  editor(id ? "Editar punto de venta" : "Nuevo punto de venta", `${campo("Nombre", "nombre", e.nombre, "text", "required")}${campo("Dirección", "dir", e.dir, "text", "required")}<label class="chk"><input type="checkbox" name="activo" ${e.activo ? "checked" : ""}> Activo</label>`, (fd) => {
    const x = { id: id || Math.max(0, ...ps.map((p) => p.id)) + 1, nombre: fd.get("nombre").trim(), dir: fd.get("dir").trim(), activo: !!fd.get("activo") };
    id ? (ps[ps.findIndex((p) => p.id === id)] = x) : ps.push(x);
    return guardar("fow_puntos", ps);
  });
}

/* ---------- Clientes ---------- */
V.clientes = () => {
  const c = leer("fow_cuentas", []).filter((x) => coincide(x.nombre, x.correo));
  return `<section class="caja"><div class="cab"><h2>Clientes (${c.length})</h2><button class="btn" data-a="cli-nuevo">＋ Añadir cliente</button></div>${tabla(["Nombre", "Correo", "Teléfono", "Pedidos", "Prime", "Estado", "Acciones"], c.map((x) => `<tr class="${x.bloqueado ? "bloq" : ""}"><td><b>${esc(x.nombre)}</b></td><td>${esc(x.correo)}</td><td>${esc(x.telefono)}</td><td>${pedidos.filter((p) => p.cliente.correo === x.correo).length}</td><td>${x.prime ? "👑 " + (x.vence ? "hasta " + new Date(x.vence).toLocaleDateString("es-CO") : "Sí") : "No"}</td><td>${x.bloqueado ? '<span class="est e5">Bloqueado</span>' : '<span class="est e3">Activo</span>'}</td><td class="acc"><button data-a="cli-edit" data-c="${esc(x.correo)}">Editar</button><button data-a="cli-blq" data-c="${esc(x.correo)}">${x.bloqueado ? "Desbloquear" : "Bloquear"}</button><button class="peli" data-a="cli-del" data-c="${esc(x.correo)}">Eliminar</button></td></tr>`))}</section>`;
};
function editarCliente(correo) {
  const e = leer("fow_cuentas", []).find((x) => x.correo === correo) || {};
  editor(correo ? "Editar cliente" : "Nuevo cliente", `${campo("Nombre", "nombre", e.nombre, "text", "required")}${campo("Teléfono", "telefono", e.telefono, "tel", 'required pattern="[0-9 ]{7,15}"')}${campo("Correo", "correo", e.correo, "email", correo ? "readonly" : "required")}${campo("Dirección", "direccion", e.direccion)}${campo(correo ? "Nueva contraseña (opcional)" : "Contraseña", "clave", "", "password", correo ? 'minlength="6"' : 'required minlength="6"')}`, (fd) => {
    const cs = leer("fow_cuentas", []), mail = (correo || fd.get("correo")).trim().toLowerCase();
    if (!correo && cs.some((x) => x.correo === mail)) return "Ese correo ya tiene cuenta.";
    const c = cs.find((x) => x.correo === mail) || { correo: mail, prime: false, bloqueado: false };
    Object.assign(c, { nombre: fd.get("nombre").trim(), telefono: fd.get("telefono").trim(), direccion: fd.get("direccion").trim() });
    if (fd.get("clave")) c.clave = fd.get("clave");
    if (!cs.includes(c)) cs.push(c);
    return guardar("fow_cuentas", cs);
  });
}
const cambiarCuentas = (fn) => { const cs = leer("fow_cuentas", []); fn(cs); guardar("fow_cuentas", cs); render(); };

/* ---------- Banner y promociones ---------- */
V.apariencia = () => {
  const b = leerBanner();
  return `<section class="caja"><h2>Banner principal del cliente</h2><form id="formBanner" class="form">${campo("Etiqueta pequeña", "etiqueta", b.etiqueta)}${campo("Título", "titulo", b.titulo)}<label>Texto<textarea name="texto" rows="2">${esc(b.texto)}</textarea></label>${campo("Texto del botón", "boton", b.boton)}${campo("Emoji (si no hay imagen)", "emoji", b.emoji)}<label>Imagen del banner<input type="file" name="img" accept="image/*"></label>${b.imagen ? `<img class="prev" src="${b.imagen}" alt=""><label class="chk"><input type="checkbox" name="quitar"> Quitar imagen</label>` : ""}<div class="acciones"><button class="btn gris" type="button" data-a="ban-reset">Restablecer</button><button class="btn" type="submit">Guardar banner</button></div></form></section>
  <section class="caja"><div class="cab"><h2>Promociones</h2><button class="btn" data-a="promo-nueva">＋ Añadir</button></div>${tabla(["Título", "Texto", "Lleva a", "Acciones"], PROMOCIONES.map((x, i) => `<tr><td><b>${esc(x.titulo)}</b></td><td>${esc(x.texto)}</td><td>${esc(x.filtro)}</td><td class="acc"><button data-a="promo-edit" data-j="${i}">Editar</button><button class="peli" data-a="promo-del" data-j="${i}">Eliminar</button></td></tr>`))}<p class="nota">El descuento de cada producto se cambia en Productos (campo «Descuento»).</p></section>`;
};
function editarPromo(i) {
  const e = PROMOCIONES[i] || {}, cats = [...new Set(PRODUCTOS.map((p) => p.categoria)), "prime"];
  editor(i >= 0 ? "Editar promoción" : "Nueva promoción", `${campo("Título", "titulo", e.titulo, "text", "required")}${campo("Texto", "texto", e.texto, "text", "required")}<label>Al pulsar lleva a<select name="filtro">${cats.map((c) => `<option value="${esc(c)}" ${c === e.filtro ? "selected" : ""}>${c === "prime" ? "Sección FoW Prime" : "Categoría: " + esc(c)}</option>`).join("")}</select></label>`, (fd) => {
    const x = { titulo: fd.get("titulo").trim(), texto: fd.get("texto").trim(), filtro: fd.get("filtro") };
    i >= 0 ? (PROMOCIONES[i] = x) : PROMOCIONES.push(x);
    return guardar("fow_promos", PROMOCIONES);
  });
}
$("#vista").addEventListener("submit", async (e) => {
  if (e.target.id !== "formBanner") return;
  e.preventDefault();
  const fd = new FormData(e.target), file = fd.get("img"); let imagen = leerBanner().imagen;
  if (file && file.size) { try { imagen = await redimensionar(file, 900); } catch { return aviso("No se pudo leer la imagen."); } } else if (fd.get("quitar")) imagen = "";
  if (guardar("fow_banner", { etiqueta: fd.get("etiqueta"), titulo: fd.get("titulo"), texto: fd.get("texto"), boton: fd.get("boton"), emoji: fd.get("emoji") || "🍛", imagen })) { render(); aviso("Banner actualizado"); }
});

/* ---------- Acciones de los botones ---------- */
$("#vista").addEventListener("click", (e) => {
  const t = e.target.closest("[data-a],[data-cat],[data-tab],[data-rango]"); if (!t) return;
  const d = t.dataset, id = +d.id, j = +d.j;
  if (d.cat) { catSel = d.cat; render(); }
  if (d.tab) { invTab = d.tab; render(); }
  if (d.rango) { rango = d.rango; render(); }
  ({
    "prod-nuevo": () => editarProducto(0), "prod-edit": () => editarProducto(id), "prod-del": () => borrarProducto(id),
    "ins-nuevo": () => editarInsumo(-1), "ins-edit": () => editarInsumo(j), "ins-del": () => borrarInsumo(j),
    "pv-nuevo": () => editarPunto(0), "pv-edit": () => editarPunto(id),
    "pv-tog": () => { const ps = puntos(), x = ps.find((p) => p.id === id); x.activo = !x.activo; guardar("fow_puntos", ps); render(); },
    "pv-del": () => { if (confirm("¿Eliminar este punto de venta?")) { guardar("fow_puntos", puntos().filter((p) => p.id !== id)); render(); } },
    "cli-nuevo": () => editarCliente(""), "cli-edit": () => editarCliente(d.c),
    "cli-blq": () => cambiarCuentas((cs) => { const c = cs.find((x) => x.correo === d.c); c.bloqueado = !c.bloqueado; aviso(c.bloqueado ? "Cliente bloqueado: ya no puede comprar" : "Cliente desbloqueado"); }),
    "cli-del": () => { if (confirm("¿Eliminar este cliente? Su cuenta dejará de existir.")) cambiarCuentas((cs) => cs.splice(cs.findIndex((x) => x.correo === d.c), 1)); },
    "ban-reset": () => { if (confirm("¿Volver al banner original?")) { localStorage.removeItem("fow_banner"); render(); } },
    "promo-nueva": () => editarPromo(-1), "promo-edit": () => editarPromo(j),
    "promo-del": () => { if (confirm("¿Eliminar esta promoción?")) { PROMOCIONES.splice(j, 1); guardar("fow_promos", PROMOCIONES); render(); } },
  })[d.a]?.();
});

VISTAS.splice(9, 0, ["apariencia", "🎨", "Banner y promos"]);
if (!$("#app").hidden) render();
