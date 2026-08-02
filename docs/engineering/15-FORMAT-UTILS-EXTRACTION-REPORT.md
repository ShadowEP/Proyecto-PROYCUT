# 15-FORMAT-UTILS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción de las seis funciones puras de formato (`fmt`, `fmtMoney`, `normalizarMetrosLinealesParaPresentacion`, `argbDesdeHex`, `fuenteACss`, `fuenteAExcel`) de `src/scripts/main.js` a un archivo utilitario externo (`src/scripts/utils/format.js`), junto con la evidencia de pureza, las verificaciones realizadas y las pruebas manuales pendientes.

## Depende de
`src/scripts/main.js`; `src/scripts/utils/format.js`; `index.html`; `docs/engineering/10-CURRENT-STATE.md`; `docs/engineering/12-MANUAL-TESTS.md`; `docs/engineering/13-CSS-EXTRACTION-REPORT.md`; `docs/engineering/14-JS-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Extraer únicamente las funciones puras de formato de `src/scripts/main.js` (sin acceso a `document`, sin lectura/escritura de `state`, sin dependencia del cierre interno de la IIFE más allá de sí mismas) a `src/scripts/utils/format.js`, expuestas mediante un único objeto global controlado (`window.ProyCutFormat`), y reemplazar sus declaraciones originales por referencias locales desestructuradas al inicio de la IIFE de `main.js`. Tercera refactorización mecánica de la reorganización, continuación de `docs/engineering/13-CSS-EXTRACTION-REPORT.md` y `docs/engineering/14-JS-EXTRACTION-REPORT.md`.

# Funciones extraídas

| Función | Ubicación original en `main.js` (antes de este cambio) |
|---|---|
| `fuenteACss(valor)` | línea 3044 |
| `fmt(n)` | línea 4796 |
| `fmtMoney(n)` | línea 4797 |
| `normalizarMetrosLinealesParaPresentacion(metrosPrecisos)` | línea 4802 |
| `fuenteAExcel(valor)` | línea 6256 |
| `argbDesdeHex(hex)` | línea 6266 |

No se extrajo ninguna otra función. Las candidatas indicadas en la tarea coinciden exactamente con las seis extraídas.

# Evidencia de pureza

Confirmado por lectura directa del cuerpo de cada función antes de moverla:

- **`fmt(n)`**: usa únicamente `n||0` y `Number.prototype.toLocaleString`. Sin acceso a `document`, `state` ni `localStorage`.
- **`fmtMoney(n)`**: concatena `'$'` con el resultado de `fmt(n)` — única dependencia es la otra función extraída, que se mueve junto con ella al mismo archivo.
- **`normalizarMetrosLinealesParaPresentacion(metrosPrecisos)`**: usa únicamente `Number.isFinite`, `Number.EPSILON`, `Math.max`, `Math.round`. Sin dependencias externas.
- **`argbDesdeHex(hex)`**: manipulación de cadenas (`replace`, `toUpperCase`, `split`, `map`, `join`) sobre su propio parámetro. Sin dependencias externas.
- **`fuenteACss(valor)`** y **`fuenteAExcel(valor)`**: mapeos de cadena a cadena mediante comparaciones directas (`if(valor === ...)`). Sin dependencias externas.

Ninguna de las seis leía ni escribía `state`, ni accedía a `document`, `localStorage` o a variables del cierre de la IIFE distintas de sí mismas. Se confirmó adicionalmente en ejecución (ver "Verificaciones realizadas") que las seis producen resultados correctos de forma aislada, sin ningún otro código de `main.js` presente.

# Archivos creados

- `src/scripts/utils/format.js` — 54 líneas. Contiene las seis funciones (con sus comentarios originales, sin alterar cuerpo, nombres, firmas ni valores de retorno), envueltas en su propia IIFE para no filtrar nombres globales sueltos, y expuestas exclusivamente mediante:
  ```js
  window.ProyCutFormat = {
    fmt,
    fmtMoney,
    normalizarMetrosLinealesParaPresentacion,
    argbDesdeHex,
    fuenteACss,
    fuenteAExcel
  };
  ```
  Esta línea de asignación y el envoltorio de IIFE son la única adición de código nuevo; no se usan módulos ES, ni `import`/`export`, ni `type="module"`.

Solo se creó la carpeta `src/scripts/utils/`; no se creó ninguna otra carpeta.

# Archivos modificados

- **`src/scripts/main.js`**: se eliminaron las seis declaraciones originales (con sus comentarios) en sus tres ubicaciones (`fuenteACss` en solitario; `fmt`+`fmtMoney`+`normalizarMetrosLinealesParaPresentacion` juntas; `fuenteAExcel`+`argbDesdeHex` juntas), y se agregó, como primera instrucción dentro de la IIFE (antes de `let BOARD_W = 2440;`):
  ```js
  const {
    fmt,
    fmtMoney,
    normalizarMetrosLinealesParaPresentacion,
    argbDesdeHex,
    fuenteACss,
    fuenteAExcel
  } = window.ProyCutFormat;
  ```
  No se modificó ninguna llamada existente a estas seis funciones (51 llamadas detectadas en el archivo, todas siguen resolviendo los mismos nombres locales por closure). No se modificó `recalcular()`, la optimización, la validación, ni ningún otro código.

- **`index.html`**: se agregó una línea, `<script src="./src/scripts/utils/format.js"></script>`, inmediatamente antes de `<script src="./src/scripts/main.js"></script>`. `main.js` permanece en la misma posición relativa dentro del `<body>`.

No se modificó `src/styles/styles.css`.

# Verificaciones

1. **Byte-equivalencia de cuerpo y comportamiento**: se comparó, mediante `diff`, cada función (con su comentario precedente) tal como quedó en `format.js` contra el contenido original de `main.js` antes de editarlo — **sin diferencias** en las seis.
2. **`format.js` sin accesos indebidos**: revisión del archivo completo — no contiene `document`, `localStorage` ni referencias a `state`; el único uso de `window` es la asignación final `window.ProyCutFormat = {...}`.
3. **`main.js` ya no contiene las declaraciones originales**: confirmado con una búsqueda de `function fmt(`, `function fmtMoney(`, `function normalizarMetrosLinealesParaPresentacion(`, `function argbDesdeHex(`, `function fuenteACss(`, `function fuenteAExcel(` al inicio de línea — sin coincidencias.
4. **Llamadas existentes siguen resolviendo los mismos nombres locales**: se contaron 51 usos de las seis funciones en `main.js` tras el cambio; todos son invocaciones (no declaraciones), y por closure de la IIFE resuelven contra las constantes desestructuradas al inicio del archivo.
5. **`format.js` carga antes de `main.js`**: confirmado por el orden de las etiquetas `<script>` en `index.html`.
6. **Respuesta HTTP 200**: verificado sirviendo el proyecto con `python3 -m http.server` (herramienta ya presente en el sistema) — `index.html`, `src/scripts/utils/format.js`, `src/scripts/main.js` y `src/styles/styles.css` respondieron `200`, con `Content-Type: text/javascript` para ambos archivos JavaScript.
7. **Alcance del cambio**: los únicos archivos afectados son `src/scripts/utils/format.js` (creado), `src/scripts/main.js` (modificado) e `index.html` (modificado), además de este reporte — confirmado con `git status --short` (ver sección final del chat).
8. **Verificación de sintaxis**: `node --check` sobre `format.js` y `main.js` — ambos sintácticamente válidos.
9. **Verificación funcional aislada (adicional, no solicitada explícitamente pero considerada necesaria dado el riesgo de esta extracción particular)**: se ejecutó `format.js` en un sandbox de Node (`vm`, módulo ya incluido en Node, sin dependencias nuevas) simulando `window`, se confirmó que `window.ProyCutFormat` expone exactamente las seis funciones esperadas (ni más ni menos), y se ejecutó la misma desestructuración que usa `main.js`, confirmando que las seis funciones locales resultantes producen los valores esperados (por ejemplo `fmt(1234.5) → "1,234.50"`, `fmtMoney(1234.5) → "$1,234.50"`, `argbDesdeHex("#1e3a5f") → "FF1E3A5F"`).

# Pruebas manuales

**No se marca ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` como aprobada.**

Se completó, fuera del catálogo formal de pruebas manuales, una validación funcional en un entorno Node aislado (punto 9 anterior) que confirma que el mecanismo de extracción (`window.ProyCutFormat` + desestructuración) funciona correctamente y que las seis funciones producen resultados correctos de forma independiente.

**No se completó** ninguna interacción real en navegador. Quedan pendientes, en particular:

- **ARR-01 a ARR-05** — carga de la página en un navegador real sin errores en consola.
- **PZ-01** — agregar una pieza.
- **OPT-01** — que se genere el diagrama.
- **REP-01 a REP-05** — que el total y los subtotales se calculen y muestren correctamente en pantalla (los formatos monetarios fueron verificados a nivel de función en Node, no en la interfaz renderizada).
- **EXC-07** — que la exportación/vista previa que usa `fuenteAExcel`/`argbDesdeHex` (colores y fuente del Excel) no produzca un error inmediato al ejecutarse dentro de la aplicación completa.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 y 14: hacerlo con Playwright habría requerido descargar binarios de navegador, evitado deliberadamente por no contar con autorización para instalar dependencias). La verificación funcional se limitó a un sandbox de Node fuera del navegador y a peticiones HTTP directas.
- El riesgo estructural principal de este tipo de extracción —que la desestructuración `const { ... } = window.ProyCutFormat;` se ejecute antes de que `window.ProyCutFormat` exista— se descartó por diseño (orden de las etiquetas `<script>`, sin `defer`/`async`) y se verificó de forma aislada en Node, pero no fue confirmado dentro del navegador real ni dentro del flujo completo de carga de `index.html`.
- No se verificó en ejecución si algún otro código de `main.js`, fuera de las 51 llamadas ya contabilizadas, referenciaba estas funciones de forma indirecta (por ejemplo, a través de una cadena de texto evaluada dinámicamente) — una revisión del código no encontró indicios de esto, pero no se trata de una garantía exhaustiva.

# Reversión

Este cambio puede revertirse de forma sencilla:

1. Restaurar, dentro de `src/scripts/main.js`, las seis declaraciones originales (con sus comentarios) en sus tres ubicaciones previas, copiando el contenido de `src/scripts/utils/format.js` (sin el envoltorio de IIFE ni la asignación final a `window.ProyCutFormat`).
2. Eliminar el bloque `const { fmt, fmtMoney, normalizarMetrosLinealesParaPresentacion, argbDesdeHex, fuenteACss, fuenteAExcel } = window.ProyCutFormat;` del inicio de la IIFE.
3. Eliminar la línea `<script src="./src/scripts/utils/format.js"></script>` de `index.html`.
4. Opcionalmente, eliminar `src/scripts/utils/format.js` y la carpeta `src/scripts/utils/` si queda vacía.

Como cada función movida está verificada como byte-idéntica a su versión original, este proceso de reversión es mecánico y no requiere reconstruir ningún cuerpo de función desde memoria.
