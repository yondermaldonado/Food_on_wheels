# Food on Wheels (FoW)

Web de restaurante con dos interfaces que comparten datos (HTML, CSS y JS puro, sin frameworks).

```
food-on-wheels/
├── cliente/   → web del cliente (menú, carrito, cuenta y perfil)
└── admin/     → panel de administración (pedidos, inventario, ventas)
```

## Abrir en local
1. Abre la carpeta `food-on-wheels` completa en VS Code.
2. Con Live Server abre `cliente/index.html` y `admin/index.html`.
3. Usa el mismo host en ambas (`127.0.0.1:5500` o `localhost:5500`, sin mezclarlos): comparten datos por `localStorage`.

## Subir a GitHub Pages
Sube la carpeta al repositorio y activa Pages (Settings → Pages). Quedan en:
- `https://TUUSUARIO.github.io/REPO/cliente/`
- `https://TUUSUARIO.github.io/REPO/admin/`

## Acceso de prueba
- **Admin:** `admin@fow.com` / `admin123`
- **Cliente:** crea una cuenta desde la web (se guarda en el navegador).

## Cómo se conectan
- Los pedidos del cliente se guardan en `fow_pedidos` y el admin los muestra y cambia su estado.
- El inventario del admin (`fow_inventario`) marca productos como **Agotado** en el cliente, según las recetas de `js/productos.js`.
- Los insumos se descuentan cuando el pedido pasa a "en preparación" o a un estado posterior.
- `js/productos.js` está repetido en `cliente/` y `admin/`: si lo cambias, edítalo en ambos.

## Al conectar la base de datos
- Reemplazar el array `PRODUCTOS` y `leerInventario()` (`js/productos.js`).
- Reemplazar los `guardar(...)` / `leer(...)` de `cliente/js/cliente.js` y `admin/js/admin.js`.
- Login y contraseñas: usar la autenticación de la BD. Hoy son solo de demostración y el panel admin no está protegido de verdad.

## Pendiente
Interfaz del contador, fotos reales de los platos y descuento de inventario por recetas definitivas.
