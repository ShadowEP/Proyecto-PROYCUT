# 17-LIMITS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción de la constante estática `LIMITES` de `src/scripts/main.js` a un archivo de configuración compartido (`src/scripts/config/limits.js`), junto con las verificaciones estructurales, la prueba automática y las pruebas manuales pendientes.

## Depende de
`src/scripts/main.js`; `src/scripts/utils/format.js`; `src/scripts/utils/validation.js`; `src/scripts/config/limits.js`; `index.html`; `docs/engineering/10-CURRENT-STATE.md`; `docs/engineering/12-MANUAL-TESTS.md`; `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Extraer únicamente la constante `LIMITES` de `src/scripts/main.js` a `src/scripts/config/limits.js`, expuesta mediante `window.ProyCutLimits`, sin extraer todavía `validarCantidad`, `validarMedida`, `validarPrecio`, `validarProyecto` ni ninguna otra constante o función. Quinta refactorización mecánica de la reorganización, y resolución directa de la dependencia señalada en `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md` (donde `validarCantidad`/`validarMedida`/`validarPrecio` no pudieron moverse porque dependían de este mismo `LIMITES`).

# Objeto extraído

`LIMITES`, declarado originalmente en `src/scripts/main.js`, línea 30 (antes de este cambio):

```js
const LIMITES = {
  csvBytes: 2 * 1024 * 1024,
  csvFilas: 2000,
  csvColumnas: 11,
  cantidadPorFila: 1000,
  cantidadProyectos: 1000,
  piezasExpandidas: 50000,
  medidaMm: 100000,
  precio: 100000000
};
```

# Propiedades y valores preservados

| Propiedad | Valor (tal cual en el código) | Valor evaluado |
|---|---|---|
| `csvBytes` | `2 * 1024 * 1024` | `2097152` |
| `csvFilas` | `2000` | `2000` |
| `csvColumnas` | `11` | `11` |
| `cantidadPorFila` | `1000` | `1000` |
| `cantidadProyectos` | `1000` | `1000` |
| `piezasExpandidas` | `50000` | `50000` |
| `medidaMm` | `100000` | `100000` |
| `precio` | `100000000` | `100000000` |

Las ocho propiedades, sus nombres, su orden y la expresión original de `csvBytes` (`2 * 1024 * 1024`, no precalculada) se conservaron exactamente. No se agregó ni quitó ninguna propiedad, no se renombró ninguna, no se congeló (`Object.freeze`) ni se clonó el objeto.

# Archivos creados

- `src/scripts/config/limits.js` — 12 líneas. Contiene la declaración de `LIMITES` (idéntica byte a byte a la original) envuelta en su propia IIFE, expuesta mediante:
  ```js
  window.ProyCutLimits = LIMITES;
  ```
  Sin módulos ES, sin `import`/`export`, sin `type="module"`.

Solo se creó la carpeta `src/scripts/config/`; no se creó ninguna otra carpeta.

# Archivos modificados

- **`src/scripts/main.js`**: se eliminó únicamente la declaración original de `LIMITES` (10 líneas, donde vivía originalmente, después de `state`). Se agregó, agrupada junto a las referencias ya existentes de `window.ProyCutFormat` y `window.ProyCutValidation` al inicio de la IIFE (antes de `let BOARD_W = 2440;`):
  ```js
  const LIMITES = window.ProyCutLimits;
  ```
  Se decidió colocar esta línea junto a las otras dos referencias externas ya existentes al inicio de la IIFE, en vez de dejarla en su posición física original (después de `state`), para ser consistente con el mismo patrón usado en `docs/engineering/15-FORMAT-UTILS-EXTRACTION-REPORT.md` y `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md` ("después de abrir la IIFE, agrega esta referencia local"). No se modificó ninguna de las 35 referencias existentes a `LIMITES.<propiedad>` en el archivo — todas siguen escritas exactamente igual (`LIMITES.precio`, `LIMITES.cantidadPorFila`, `LIMITES.medidaMm`, etc.) y ahora resuelven, por closure, contra la constante local reasignada.

- **`index.html`**: se agregó `<script src="./src/scripts/config/limits.js"></script>`, cargando en el orden exacto solicitado:
  ```html
  <script src="./src/scripts/utils/format.js"></script>
  <script src="./src/scripts/config/limits.js"></script>
  <script src="./src/scripts/utils/validation.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```

No se modificó `validarCantidad`, `validarMedida`, `validarPrecio`, `validarProyecto`, `validarNumeroEntrada`, `state`, `recalcular()`, la optimización, `format.js`, `validation.js`, CSS, ni ningún otro archivo.

# Comparación

- `diff` entre la declaración de `LIMITES` en `limits.js` y su versión original en `main.js` (antes de editar): **sin diferencias**.
- Búsqueda de `const LIMITES = {` al inicio de línea en `main.js` tras el cambio: **sin coincidencias** (ya no existe la declaración literal).
- Conteo de referencias `LIMITES.` en `main.js`: **35**, exactamente las mismas que antes del cambio (no se tocó ninguna).
- `limits.js` no contiene `document`, `state`, `localStorage` ni ninguna función de la IIFE de `main.js`.
- Orden de carga en `index.html`: `format.js` → `limits.js` → `validation.js` → `main.js`, confirmado por inspección directa de las cuatro etiquetas `<script>`.
- `node --check` sobre `limits.js`, `validation.js`, `format.js` y `main.js`: los cuatro sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `src/scripts/utils/format.js`, `src/scripts/config/limits.js`, `src/scripts/utils/validation.js`, `src/scripts/main.js` y `src/styles/styles.css` respondieron `200`; `limits.js` con `Content-Type: text/javascript`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados), `src/scripts/config/limits.js` y este reporte (nuevos) — ver sección final del chat.

# Pruebas automáticas

Ejecutadas en un sandbox de Node (`vm`, módulo incluido en Node, sin dependencias nuevas), simulando `window` y cargando `limits.js` tal cual:

- `window.ProyCutLimits` existe tras cargar el archivo.
- El conjunto de propiedades de `window.ProyCutLimits` coincide exactamente con las ocho propiedades reales del código (`csvBytes`, `csvFilas`, `csvColumnas`, `cantidadPorFila`, `cantidadProyectos`, `piezasExpandidas`, `medidaMm`, `precio`) — no se probaron nombres inventados.
- Cada valor coincide con el original, incluyendo `csvBytes` evaluado como `2097152` a partir de la expresión `2 * 1024 * 1024`.
- Se simuló la referencia local exacta que usa `main.js` (`const LIMITES = window.ProyCutLimits;`) y se confirmó acceso correcto a `LIMITES.precio` (`100000000`), `LIMITES.cantidadPorFila` (`1000`), `LIMITES.medidaMm` (`100000`), y a las cinco propiedades restantes (`csvBytes`, `csvFilas`, `csvColumnas`, `cantidadProyectos`, `piezasExpandidas`).

Resultado: todas las comprobaciones (`PASS`) sin excepción.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación y confirmar ausencia de errores en consola.
- **PZ-01** — agregar una pieza válida.
- **PZ-11** — probar una cantidad inválida (por ejemplo mayor que 1000, el límite de `LIMITES.cantidadPorFila`) y confirmar que el mensaje de error es idéntico al que mostraba antes de esta extracción.
- **PZ-11** — probar una medida inválida (por ejemplo mayor que 100000 mm, el límite de `LIMITES.medidaMm`) y confirmar el mismo mensaje.
- **MAT-03 / TAP-01 / COMP-01** — probar un precio inválido (mayor que 100000000, el límite de `LIMITES.precio`) y confirmar el mismo mensaje.
- **OPT-01, REP-05** — confirmar que el diagrama se genera y el total se calcula con normalidad tras este cambio.
- Adicionalmente, dado que `csvBytes`, `csvFilas` y `csvColumnas` también provienen de `LIMITES`: probar una importación CSV (**CSV-02**) para confirmar que los mensajes de límite de columnas/filas siguen siendo idénticos.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 16). La verificación funcional se limitó a un sandbox de Node fuera del navegador, a peticiones HTTP directas y a comparación textual del código.
- Esta extracción, al resolver la dependencia de `LIMITES` fuera de la IIFE de `main.js`, deja abierta la posibilidad técnica de extraer en un cambio futuro `validarCantidad`, `validarMedida` y `validarPrecio` (bloqueada explícitamente en `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md`) — no se hizo en este cambio porque no fue solicitado ("no extraigas todavía... validarCantidad... validarMedida... validarPrecio").
- No se verificó en ejecución si algún otro punto del código, fuera de las 35 referencias ya contabilizadas, referencia `LIMITES` de forma indirecta.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, la declaración original de `LIMITES` en su ubicación previa (después de `state`), copiando el contenido de `src/scripts/config/limits.js` (sin el envoltorio de IIFE ni la asignación a `window.ProyCutLimits`).
2. Eliminar la línea `const LIMITES = window.ProyCutLimits;` del inicio de la IIFE de `main.js`.
3. Eliminar la línea `<script src="./src/scripts/config/limits.js"></script>` de `index.html`.
4. Opcionalmente, eliminar `src/scripts/config/limits.js` y la carpeta `src/scripts/config/`.

Como la constante movida está verificada como byte-idéntica a su versión original y ninguna de las 35 referencias a `LIMITES.*` fue tocada, este proceso de reversión es mecánico.
