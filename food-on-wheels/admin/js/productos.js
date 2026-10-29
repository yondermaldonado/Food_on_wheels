// DATOS DE PRUEBA (quemados). Luego se reemplazan por la consulta a la base de datos.
// Estructura: id, nombre, descripcion, precio (COP), categoria, minutos, rating, emoji, descuento (% opcional)
const PRODUCTOS = [
  // Platos fuertes
  { id: 1,  nombre: "Bandeja paisa",       descripcion: "La clásica, abundante y llena de sabor.",        precio: 38900, categoria: "Platos fuertes", minutos: 25, rating: 4.8, emoji: "🍛" },
  { id: 2,  nombre: "Ajiaco santafereño",  descripcion: "Sopa reconfortante con pollo, papa y mazorca.",  precio: 32900, categoria: "Platos fuertes", minutos: 30, rating: 4.7, emoji: "🍲" },
  { id: 3,  nombre: "Sancocho de gallina", descripcion: "Caldo espeso con yuca, plátano y gallina.",      precio: 31900, categoria: "Platos fuertes", minutos: 30, rating: 4.6, emoji: "🥣" },
  { id: 4,  nombre: "Lechona tolimense",   descripcion: "Cerdo relleno con arroz y arveja, con arepa.",   precio: 29900, categoria: "Platos fuertes", minutos: 20, rating: 4.7, emoji: "🥓" },
  { id: 5,  nombre: "Pechuga a la plancha",descripcion: "Con arroz, ensalada y papa criolla.",            precio: 27900, categoria: "Platos fuertes", minutos: 25, rating: 4.4, emoji: "🍗" },
  { id: 6,  nombre: "Churrasco criollo",   descripcion: "Carne a la parrilla con papa y chimichurri.",    precio: 41900, categoria: "Platos fuertes", minutos: 35, rating: 4.8, emoji: "🥩" },
  { id: 7,  nombre: "Mojarra frita",       descripcion: "Con patacón, arroz de coco y ensalada.",         precio: 36900, categoria: "Platos fuertes", minutos: 30, rating: 4.5, emoji: "🐟" },
  { id: 8,  nombre: "Cazuela de mariscos", descripcion: "Mariscos en salsa cremosa de coco.",             precio: 44900, categoria: "Platos fuertes", minutos: 35, rating: 4.6, emoji: "🦐" },
  // Entradas
  { id: 9,  nombre: "Arepa rellena",       descripcion: "Crujiente por fuera, deliciosa por dentro.",     precio: 19900, categoria: "Entradas", minutos: 20, rating: 4.6, emoji: "🫓", descuento: 20 },
  { id: 10, nombre: "Empanadas (x3)",      descripcion: "De carne y papa, con ají casero.",               precio: 9900,  categoria: "Entradas", minutos: 15, rating: 4.7, emoji: "🥟" },
  { id: 11, nombre: "Patacones con hogao", descripcion: "Plátano verde frito con hogao y queso.",         precio: 12900, categoria: "Entradas", minutos: 15, rating: 4.5, emoji: "🍌" },
  { id: 12, nombre: "Chicharrón crocante", descripcion: "Con limón y arepita pequeña.",                   precio: 14900, categoria: "Entradas", minutos: 15, rating: 4.4, emoji: "🥓" },
  { id: 13, nombre: "Buñuelos (x4)",       descripcion: "Fritos y suaves, de queso costeño.",             precio: 8900,  categoria: "Entradas", minutos: 10, rating: 4.5, emoji: "🧆" },
  { id: 14, nombre: "Papa rellena",        descripcion: "Con carne molida y huevo cocido.",               precio: 7900,  categoria: "Entradas", minutos: 12, rating: 4.3, emoji: "🥔" },
  // Bebidas
  { id: 15, nombre: "Limonada de coco",    descripcion: "Fría, cremosa y refrescante.",                   precio: 9500,  categoria: "Bebidas", minutos: 5,  rating: 4.8, emoji: "🥥" },
  { id: 16, nombre: "Jugo de lulo",        descripcion: "Natural, en agua o en leche.",                   precio: 7500,  categoria: "Bebidas", minutos: 5,  rating: 4.6, emoji: "🍹" },
  { id: 17, nombre: "Aguapanela con limón",descripcion: "Fría o caliente.",                               precio: 4500,  categoria: "Bebidas", minutos: 5,  rating: 4.4, emoji: "🍯" },
  { id: 18, nombre: "Chocolate santafereño",descripcion: "Con queso y pan.",                              precio: 8500,  categoria: "Bebidas", minutos: 8,  rating: 4.7, emoji: "☕" },
  { id: 19, nombre: "Gaseosa 400 ml",      descripcion: "Variedad de sabores.",                           precio: 4000,  categoria: "Bebidas", minutos: 2,  rating: 4.2, emoji: "🥤" },
  { id: 20, nombre: "Cerveza artesanal",   descripcion: "Rubia, de productores locales.",                 precio: 11900, categoria: "Bebidas", minutos: 3,  rating: 4.5, emoji: "🍺" },
  // Postres
  { id: 21, nombre: "Postre de natas",     descripcion: "Dulce tradicional con salsa de mora.",           precio: 8900,  categoria: "Postres", minutos: 5,  rating: 4.5, emoji: "🍮" },
  { id: 22, nombre: "Arroz con leche",     descripcion: "Con canela y pasas.",                            precio: 7900,  categoria: "Postres", minutos: 5,  rating: 4.6, emoji: "🍚" },
  { id: 23, nombre: "Brevas con arequipe", descripcion: "Brevas en almíbar con queso.",                   precio: 9900,  categoria: "Postres", minutos: 5,  rating: 4.7, emoji: "🍯" },
  { id: 24, nombre: "Tres leches",         descripcion: "Porción de torta húmeda y cremosa.",             precio: 10900, categoria: "Postres", minutos: 5,  rating: 4.8, emoji: "🍰" },
  { id: 25, nombre: "Helado de guanábana", descripcion: "Dos bolas, artesanal.",                          precio: 8500,  categoria: "Postres", minutos: 3,  rating: 4.4, emoji: "🍨" },
  // Combos
  { id: 26, nombre: "Combo familiar",      descripcion: "4 bandejas paisas y 4 bebidas.",                 precio: 139900,categoria: "Combos", minutos: 40, rating: 4.9, emoji: "👨‍👩‍👧‍👦", descuento: 15 },
  { id: 27, nombre: "Combo pareja",        descripcion: "2 platos fuertes, 2 bebidas y 1 postre.",        precio: 79900, categoria: "Combos", minutos: 35, rating: 4.7, emoji: "💑", descuento: 15 },
  { id: 28, nombre: "Combo almuerzo",      descripcion: "Plato del día, jugo y postre.",                  precio: 24900, categoria: "Combos", minutos: 20, rating: 4.6, emoji: "🍽️" },
  { id: 29, nombre: "Combo picada",        descripcion: "Empanadas, patacones, chicharrón y buñuelos.",   precio: 42900, categoria: "Combos", minutos: 25, rating: 4.7, emoji: "🧺" },
  { id: 30, nombre: "Combo parche",        descripcion: "6 arepas rellenas y 3 limonadas de coco.",       precio: 64900, categoria: "Combos", minutos: 30, rating: 4.6, emoji: "🎉", descuento: 10 }
];

const PROMOCIONES = [
  { titulo: "Martes de arepas",   texto: "20% menos en la arepa rellena.",           filtro: "Entradas" },
  { titulo: "Combos en familia",  texto: "Hasta 15% menos en combos seleccionados.", filtro: "Combos" },
  { titulo: "FoW Prime",          texto: "25% de descuento en todas tus compras.",   filtro: "prime" }
];

/* ===== INVENTARIO Y RECETAS (compartido con el panel admin; mantener idéntico en ambas carpetas) ===== */
// [insumo, unidad, stock inicial, mínimo]
const INSUMOS = [["Arroz","kg",40,15],["Frijol","kg",18,10],["Carne de res","kg",25,12],["Carne de cerdo","kg",20,10],["Pollo","kg",30,12],["Plátano maduro","und",60,30],["Plátano verde","und",50,25],["Huevos","und",120,60],["Aguacate","und",35,20],["Harina de maíz","kg",22,8],["Papa","kg",45,20],["Yuca","kg",9,10],["Queso","kg",12,6],["Limón","kg",8,5],["Coco","und",14,10],["Lulo","kg",6,6],["Panela","kg",10,4],["Aceite","L",16,8]];
// Insumos que gasta UNA unidad de cada producto. "@id" = incluye otro producto (para los combos).
const RECETAS = {
  1: [["Arroz",.15],["Frijol",.12],["Carne de cerdo",.1],["Carne de res",.1],["Huevos",1],["Plátano maduro",1],["Aguacate",.5]],
  2: [["Pollo",.2],["Papa",.3],["Aguacate",.5]],
  3: [["Pollo",.25],["Yuca",.15],["Plátano verde",1],["Papa",.15]],
  4: [["Carne de cerdo",.25],["Arroz",.1],["Harina de maíz",.08]],
  5: [["Pollo",.22],["Arroz",.15],["Papa",.15]],
  6: [["Carne de res",.3],["Papa",.2]],
  7: [["Arroz",.15],["Plátano verde",1],["Coco",.25],["Aceite",.05]],
  8: [["Coco",.5],["Arroz",.1],["Aceite",.03]],
  9: [["Harina de maíz",.1],["Queso",.06],["Pollo",.08]],
  10: [["Harina de maíz",.1],["Carne de res",.06],["Papa",.06],["Aceite",.03]],
  11: [["Plátano verde",2],["Queso",.04],["Aceite",.03]],
  12: [["Carne de cerdo",.15],["Limón",.03],["Harina de maíz",.05]],
  13: [["Queso",.08],["Harina de maíz",.08],["Aceite",.04]],
  14: [["Papa",.2],["Carne de res",.05],["Huevos",1]],
  15: [["Limón",.1],["Coco",.25]], 16: [["Lulo",.15]], 17: [["Panela",.05],["Limón",.03]], 18: [["Queso",.03]],
  22: [["Arroz",.06]], 23: [["Queso",.03]],
  26: [["@1",4],["@15",4]], 27: [["@5",2],["@15",2]], 28: [["@5",1],["@16",1]],
  29: [["@10",1],["@11",1],["@12",1],["@13",1]], 30: [["@9",6],["@15",3]]
};
function leerInventario() {
  try { const v = JSON.parse(localStorage.getItem("fow_inventario")); if (v) return v; } catch {}
  return INSUMOS.map(([n, u, s, m]) => ({ n, u, s, m }));
}
function necesidades(items) { // items: [{id, cant}] → { insumo: cantidad total }
  const t = {};
  const sumar = (id, veces) => (RECETAS[id] || []).forEach(([k, c]) => k[0] === "@" ? sumar(+k.slice(1), c * veces) : (t[k] = (t[k] || 0) + c * veces));
  items.forEach((i) => sumar(i.id, i.cant));
  return t;
}
function faltantes(items, inv) { // insumos que no alcanzan para esos items
  const t = necesidades(items);
  return Object.keys(t).filter((k) => { const x = inv.find((i) => i.n === k); return !x || x.s < t[k] - 1e-9; });
}
const agotado = (p, inv) => faltantes([{ id: p.id, cant: 1 }], inv).length > 0;
