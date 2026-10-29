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
