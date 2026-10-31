# Food on Wheels (FoW)

Web de restaurante con dos interfaces que comparten datos (HTML, CSS y JS puro).

```
food-on-wheels/
├── cliente/   → menú, carrito, seguimiento de pedidos, cuenta/perfil, compra de FoW Prime
└── admin/     → pedidos, productos y combos, inventario e historial, puntos de venta, clientes, banner y promos
```

## Abrir en local
1. Abre la carpeta `food-on-wheels` en VS Code y usa Live Server en `cliente/index.html` y `admin/index.html`.
2. Usa el mismo host en ambas (`127.0.0.1:5500` o `localhost:5500`, sin mezclarlos): comparten datos por `localStorage`.

## Acceso de prueba
- **Admin:** `admin@fow.com` / `admin123`
- **Cliente:** crea una cuenta en la web, o créala desde Admin → Clientes.

## Qué edita el admin y cómo se refleja en el cliente
| Admin | Se guarda en | Efecto en el cliente |
|---|---|---|
| Productos y combos (imagen, precio, descuento, receta) | `fow_productos`, `fow_recetas` | Cambia el menú al instante |
| Inventario (añadir/editar/eliminar insumos) | `fow_inventario` | Producto «Agotado» si falta un insumo de su receta |
| Historial de gasto de insumos | `fow_historial` | Solo admin |
| Clientes (editar, bloquear, eliminar) | `fow_cuentas` | Un cliente bloqueado no puede comprar |
| Banner principal | `fow_banner` | Cambia el banner de la portada |
| Promociones | `fow_promos` | Cambian las tarjetas de promoción |
| Puntos de venta | `fow_puntos` | Solo admin |
| Pedidos (cambio de estado) | `fow_pedidos` | El cliente ve el estado en «Mis pedidos» |
| Membresías Prime vendidas | `fow_membresias` | Se suman a las ventas del admin |

## Notas
- Los insumos se descuentan cuando un pedido pasa a «en preparación» o posterior, y se devuelven si se cancela.
- Las imágenes se reducen y se guardan dentro del navegador (límite ~5 MB en total).
- `js/productos.js` está repetido en `cliente/` y `admin/` y debe ser idéntico.
- La compra de Prime es **de demostración**: no cobra ni guarda datos de tarjeta. Para cobrar de verdad se necesita una pasarela (Wompi, PayU, Mercado Pago…).
- Contraseñas y login son de demostración. El panel admin no está protegido de verdad hasta tener backend.

## Al conectar la base de datos
Reemplazar los `leer(...)`/`guardar(...)` de `cliente/js/cliente.js`, `admin/js/admin.js` y `admin/js/gestion.js`, y los `_lee(...)` de `js/productos.js`.

## Pendiente
Interfaz del contador, fotos reales y pasarela de pagos.
