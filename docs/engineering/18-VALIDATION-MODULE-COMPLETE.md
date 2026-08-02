# 18-VALIDATION-MODULE-COMPLETE.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar el traslado de `validarCantidad`, `validarMedida` y `validarPrecio` desde `src/scripts/main.js` hacia `src/scripts/utils/validation.js`, completando el módulo de validación que había quedado parcial en `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md` por la dependencia entonces no resuelta de `LIMITES` (resuelta en `docs/engineering/17-LIMITS-EXTRACTION-REPORT.md`).

## Depende de
`src/scripts/main.js`; `src/scripts/utils/validation.js`; `src/scripts/config/limits.js`; `src/scripts/utils/format.js`; `index.html`; `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md`; `docs/engineering/17-LIMITS-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Mover únicamente `validarCantidad`, `validarMedida` y `validarPrecio` de `src/scripts/main.js` a `src/scripts/utils/validation.js`, sin mover ninguna otra función, conservando exactamente firmas, comentarios, cuerpo, mensajes de error, comportamiento y orden relativo. Sexta refactorización mecánica de la reorganización, y cierre directo de la extracción parcial documentada en `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md`.

# Contexto: por qué esto ya es posible

En `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md` estas tres funciones no se movieron porque cada una llamaba a `validarNumeroEntrada` pasando límites de `LIMITES` (`LIMITES.cantidadPorFila`, `LIMITES.medidaMm`, `LIMITES.precio`), y `LIMITES` era entonces un `const` interno de la IIFE de `main.js`, inaccesible desde `validation.js`. `docs/engineering/17-LIMITS-EXTRACTION-REPORT.md` resolvió esto exponiendo `LIMITES` como `window.ProyCutLimits`. Con `limits.js` cargando antes que `validation.js` en `index.html`, `validation.js` ya puede declarar su propio `const LIMITES = window.ProyCutLimits;` dentro de su propia IIFE y usarlo con el mismo efecto que antes.

# Archivos modificados

- **`src/scripts/utils/validation.js`**: se agregó, como primera línea dentro de la IIFE, `const LIMITES = window.ProyCutLimits;`, y se agregaron las tres funciones (con cuerpo, firma y comentarios sin alterar) inmediatamente después de `validarNumeroEntrada`, en su mismo orden relativo original (`validarCantidad`, `validarMedida`, `validarPrecio`). Se amplió el objeto expuesto:
  ```js
  window.ProyCutValidation = {
    validarNumeroEntrada,
    validarCantidad,
    validarMedida,
    validarPrecio
  };
  ```
  No se creó ningún objeto global nuevo — se siguió usando `window.ProyCutValidation`, ya existente.

- **`src/scripts/main.js`**: se eliminaron únicamente las tres declaraciones originales (`function validarCantidad`, `function validarMedida`, `function validarPrecio`). Se amplió la desestructuración ya existente al inicio de la IIFE, exactamente como especificó la tarea:
  ```js
  const {
    validarNumeroEntrada,
    validarCantidad,
    validarMedida,
    validarPrecio
  } = window.ProyCutValidation;
  ```
  No se modificó ninguna llamada existente: las 17 invocaciones de `validarCantidad`/`validarMedida`/`validarPrecio` repartidas en el archivo (captura de piezas, catálogos, importación CSV, modal de creación, `validarProyecto()`, etc.) siguen escritas exactamente igual.

No se modificó `validarProyecto()`, `leerPiezas()`, `recalcular()`, el optimizador, el DOM, `state`, `LIMITES`, `format.js`, CSS, ni `index.html` (el orden de las cuatro etiquetas `<script>` no cambió, tal como exigía la tarea).

# Comparación

- `diff` entre el cuerpo de las tres funciones en `validation.js` y su versión original en `main.js` (antes de editar): **sin diferencias**.
- Búsqueda de `function validarCantidad(`, `function validarMedida(`, `function validarPrecio(` al inicio de línea en `main.js` tras el cambio: **sin coincidencias**.
- Conteo de llamadas a las tres funciones en `main.js`: 17, las mismas de antes, ninguna modificada.
- `node --check` sobre `limits.js`, `validation.js`, `format.js` y `main.js`: los cuatro sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `format.js`, `limits.js`, `validation.js`, `main.js` y `styles.css` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `src/scripts/main.js`, `src/scripts/utils/validation.js` (modificados) y este reporte (nuevo) — ver sección final del chat.

# Verificaciones (según lo pedido)

1. `validation.js` conserva exactamente las cuatro funciones (`validarNumeroEntrada`, `validarCantidad`, `validarMedida`, `validarPrecio`) — confirmado.
2. Las tres funciones movidas usan `LIMITES` a través de `window.ProyCutLimits` (vía el `const LIMITES` local de `validation.js`) — confirmado.
3. `main.js` ya no contiene ninguna de las tres declaraciones — confirmado.
4. Las 17 llamadas existentes siguen iguales — confirmado.
5. `node --check` correcto en los cuatro archivos JS — confirmado.
6. Los seis archivos relevantes responden `200` por HTTP — confirmado.
7. Sin cambios fuera de `src/scripts/main.js`, `src/scripts/utils/validation.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que carga `limits.js` y después `validation.js`, en el mismo orden que `index.html`, y ejercita las tres funciones movidas contra los límites reales:

| Caso | Resultado real |
|---|---|
| `validarCantidad(5, ...)` | `{ok:true, valor:5}` |
| `validarCantidad(1000, ...)` (límite exacto) | `{ok:true, valor:1000}` |
| `validarCantidad(1001, ...)` (un paso sobre el límite) | `{ok:false, error:"Cantidad: no puede ser mayor que 1000."}` |
| `validarCantidad(0, ...)` | `{ok:false, error:"Cantidad: debe ser mayor o igual que 1."}` |
| `validarMedida(600, ...)` | `{ok:true, valor:600}` |
| `validarMedida(100000, ...)` (límite exacto) | `{ok:true, valor:100000}` |
| `validarMedida(100001, ...)` | `{ok:false, error:"Largo: no puede ser mayor que 100000."}` |
| `validarMedida(0, ...)` | `{ok:false, error:"Largo: debe ser mayor o igual que 5e-324."}` |
| `validarPrecio(750, ...)` | `{ok:true, valor:750}` |
| `validarPrecio(0, ...)` | `{ok:true, valor:0}` |
| `validarPrecio(100000000, ...)` (límite exacto) | `{ok:true, valor:100000000}` |
| `validarPrecio(-1, ...)` | `{ok:false, error:"Precio: debe ser mayor o igual que 0."}` |

Estos resultados son idénticos a los ya documentados en `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md` (donde se probó `validarNumeroEntrada` directamente con las mismas opciones), ahora confirmados a través de las funciones ya ensambladas y cargadas en el orden real de producción (`limits.js` → `validation.js`).

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación sin errores en consola.
- **PZ-01** — capturar una pieza válida.
- **PZ-11** — probar cantidad inválida (vacía, cero, negativa, mayor que 1000 o decimal) y confirmar que el mensaje es idéntico al de antes de este cambio.
- **PZ-11** — probar medida inválida (incluyendo específicamente `0`, que se rechaza) y confirmar mensaje.
- **MAT-03 / TAP-01 / COMP-01** — probar precio inválido (negativo o mayor que el límite) y confirmar mensaje; confirmar que precio `0` sigue aceptándose.
- **OPT-01, REP-05** — confirmar que el diagrama se genera y el total se calcula con normalidad tras este cambio.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 17). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual del código.
- `src/scripts/utils/validation.js` pasó de exponer 1 función a exponer 4; no se verificó en ejecución si algún código fuera de `main.js` (por ejemplo, algún script futuro o de terceros no presente hoy) esperaba que `window.ProyCutValidation` tuviera únicamente `validarNumeroEntrada` — no se encontró ningún indicio de esto en el código actual.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, las declaraciones originales de `validarCantidad`, `validarMedida` y `validarPrecio` en su ubicación previa (antes de `textoSeguroParaExcel`), copiando su contenido desde `src/scripts/utils/validation.js`.
2. Reducir la desestructuración al inicio de la IIFE de `main.js` de vuelta a `const { validarNumeroEntrada } = window.ProyCutValidation;`.
3. En `src/scripts/utils/validation.js`, eliminar las tres funciones agregadas, el `const LIMITES = window.ProyCutLimits;` (si ya no se usa), y reducir `window.ProyCutValidation` de vuelta a `{ validarNumeroEntrada }`.

Como las tres funciones movidas están verificadas como byte-idénticas a su versión original, este proceso de reversión es mecánico.
