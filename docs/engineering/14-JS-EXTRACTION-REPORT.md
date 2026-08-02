# 14-JS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción del bloque `<script>` principal embebido en `index.html` a un archivo JavaScript externo, junto con las verificaciones estructurales realizadas, las validaciones HTTP completadas y las pruebas manuales que quedan pendientes de ejecutar.

## Depende de
`index.html`; `src/scripts/main.js`; `docs/engineering/10-CURRENT-STATE.md`; `docs/engineering/12-MANUAL-TESTS.md`; `docs/engineering/13-CSS-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Extraer el contenido completo del bloque `<script>` principal de `index.html` (la IIFE que contiene toda la lógica de la aplicación) a un archivo JavaScript externo (`src/scripts/main.js`), sin modificar su contenido, orden ni comportamiento, y reemplazar el bloque original por `<script src="./src/scripts/main.js"></script>` en la misma posición, al final del `<body>`. Es la segunda refactorización mecánica de la reorganización, continuación directa de `docs/engineering/13-CSS-EXTRACTION-REPORT.md` (Fase 4 de `docs/engineering/ROADMAP.md`, "Separación inicial de JavaScript").

# Archivos creados

- `src/scripts/main.js` — 6,972 líneas, contenido idéntico byte a byte al que existía entre `<script>` y `</script>` en `index.html` (líneas 711–7682 del archivo previo a este cambio, es decir, después de la extracción de CSS). Verificado mediante `diff` (sin diferencias) y checksum MD5 (`501998a28d2c34c033cff64ef568d08a` en ambos lados). Empieza con `(function(){` y termina con `})();` — la IIFE completa, sin truncar.

Solo se creó la carpeta `src/scripts/`; no se creó ninguna otra carpeta ni archivo.

# Archivos modificados

- `index.html` — se eliminó el bloque `<script>...</script>` completo (antes en las líneas 710–7683, tras la extracción previa de CSS) y se reemplazó por una sola línea:
  ```html
  <script src="./src/scripts/main.js"></script>
  ```
  en la misma posición, al final del `<body>`, inmediatamente antes de `</body>`. El archivo pasó de 7,685 a 712 líneas (−6,973 líneas: 6,974 líneas eliminadas del bloque `<script>` y sus etiquetas, +1 línea de la referencia externa).

No se modificó `src/styles/styles.css` ni la línea `<link rel="stylesheet">` incorporada en la extracción anterior (verificado: sigue presente en la línea 7 de `index.html`, sin cambios). No se modificó ningún otro archivo.

# Líneas extraídas

**6,972 líneas** de JavaScript (contenido entre `<script>` y `</script>`, líneas 711–7682 del `index.html` previo a este cambio).

# Comparación realizada

- `diff` entre las líneas 711–7682 del `index.html` original y `src/scripts/main.js`: **sin diferencias**.
- Checksum MD5 de ambos contenidos: idéntico (`501998a28d2c34c033cff64ef568d08a`).
- `diff` entre las líneas 1–709 del `index.html` original y las líneas 1–709 del archivo nuevo (todo lo anterior al `<script>`, incluyendo el `<link>` de CSS): **sin diferencias**.
- `diff` entre las líneas 7684 en adelante del `index.html` original (`</body>`, `</html>`) y las líneas 711 en adelante del archivo nuevo: **sin diferencias**.
- Verificación de que no queda ningún bloque JavaScript incrustado: búsqueda de la cadena `(function(){` al inicio de línea en el archivo resultante — sin coincidencias fuera de `main.js`.
- Verificación de que la etiqueta nueva no incluye `type="module"`, `defer` ni `async`: confirmado por inspección directa de la línea insertada, `<script src="./src/scripts/main.js"></script>`.
- El diff resultante contiene únicamente tres cambios: creación de `src/scripts/main.js`, eliminación del contenido del `<script>` incrustado, e incorporación de la referencia externa — no se detectó ningún otro cambio.

# Validaciones completadas

Se sirvió el proyecto con `python3 -m http.server` (herramienta ya presente en el sistema operativo, sin instalar nada nuevo) y se confirmó por HTTP:

- `index.html` responde `200 OK`.
- `src/scripts/main.js` responde `200 OK` en la misma ruta relativa que usa `<script src="./src/scripts/main.js">`.
- El `Content-Type` servido para `main.js` es `text/javascript` (tipo válido de JavaScript).
- `src/styles/styles.css` sigue respondiendo `200 OK` sin cambios, confirmando que la extracción anterior de CSS no se vio afectada.
- El contenido servido de `main.js` inicia con `(function(){` y termina con `})();`, coincidiendo con el archivo local.

**No se completaron** las validaciones funcionales en navegador (carga visual, consola sin errores propios de ProyCut, agregar una pieza, generar el diagrama, calcular el total, apertura de los paneles principales) — ver "Riesgos o incertidumbres". Como respaldo parcial, se dejó constancia de un argumento estructural: dado que el contenido de `main.js` es una copia exacta del `<script>` original, que la etiqueta sigue sin `defer`/`async`/`type="module"`, y que su posición (al final del `<body>`, después de todo el HTML que referencia) no cambió, el orden de ejecución respecto al DOM debería ser equivalente al que tenía el script embebido. Esto es una inferencia razonada, no una confirmación en ejecución.

**No se marca ninguna prueba del conjunto de pruebas manuales como aprobada.**

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada. Son especialmente relevantes para confirmar este cambio:

- **ARR-01 a ARR-05** (Prueba de arranque) — carga sin errores visibles, catálogos iniciales, paneles, apariencia.
- **PZ-01** (Agregar una pieza) — verifica directamente uno de los puntos solicitados en esta tarea.
- **OPT-01** (Optimización de un solo tablero) — verifica que el diagrama se genere correctamente.
- **REP-01 a REP-05** (Costos y reporte) — verifica que el total se calcule correctamente.
- **MENU-01, MENU-02** (Apertura y exclusividad de paneles) — verifica que los paneles principales abran.
- Cualquier prueba que dependa de que `ExcelJS`/`JSZip` se carguen dinámicamente desde el CDN (por ejemplo **EXC-01**, **DXF-01**), dado que ese código vive ahora en `main.js` y su ejecución no fue probada en un navegador real tras la extracción.

# Riesgos o incertidumbres

- No se pudo cargar `index.html` en un navegador real ni revisar la consola del navegador dentro de este entorno: hacerlo con Playwright hubiera requerido descargar binarios de navegador no presentes en el sistema, lo cual se evitó deliberadamente por no contar con autorización para instalar dependencias en esta tarea (misma limitación documentada en `docs/engineering/13-CSS-EXTRACTION-REPORT.md`).
- No se confirmó en ejecución si "agregar una pieza", "generar el diagrama", "calcular el total" y "abrir los paneles principales" siguen funcionando exactamente igual — la verificación se limitó a que el archivo se sirve correctamente por HTTP y a la comparación estructural byte a byte del código, no a su ejecución real en un navegador.
- No se revisó si algún error de carga aparecería en la consola del navegador por causas ajenas al propio cambio (por ejemplo, restricciones de origen si el archivo se abre con `file://` en vez de servirse por HTTP) — la validación aquí realizada usó un servidor HTTP local, no la apertura directa del archivo.
- El contenido de `main.js` no fue revisado en busca de referencias relativas a otros recursos que pudieran verse afectadas por el cambio de contexto de carga (por ejemplo, si alguna ruta dentro del JavaScript se construye de forma relativa a la ubicación del script en vez de a la del documento) — una revisión rápida no encontró indicios de esto, pero no reemplaza la prueba en navegador.

# Reversión

Este cambio puede revertirse de forma sencilla:

1. Restaurar el bloque `<script>...</script>` original al final del `<body>` de `index.html`, copiando el contenido íntegro de `src/scripts/main.js` entre esas etiquetas, en el lugar exacto donde hoy está la línea `<script src="./src/scripts/main.js"></script>`.
2. Eliminar esa línea de referencia externa.
3. Opcionalmente, eliminar `src/scripts/main.js` y la carpeta `src/scripts/` (y `src/` si queda vacía y ya no contiene `src/styles/`).

Como el contenido de `src/scripts/main.js` es una copia exacta y verificada del bloque `<script>` original, este proceso de reversión es mecánico y no requiere reconstruir ninguna línea de código desde memoria.
