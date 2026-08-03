# 22-PARSEARCSV-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar el traslado de `parsearCSV` desde `src/scripts/main.js` hacia `src/scripts/utils/csv.js`, completando el módulo de utilidades CSV que había quedado parcial en `docs/engineering/20-CSV-UTILS-EXTRACTION-REPORT.md` por la dependencia entonces no resuelta de `ENCABEZADO_FORMATO` (resuelta en `docs/engineering/21-PROJECT-FORMAT-CONSTANTS-EXTRACTION-REPORT.md`).

## Depende de
`src/scripts/main.js`; `src/scripts/utils/csv.js`; `src/scripts/config/project-format.js`; `src/scripts/config/limits.js`; `index.html`; `docs/engineering/20-CSV-UTILS-EXTRACTION-REPORT.md`; `docs/engineering/21-PROJECT-FORMAT-CONSTANTS-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Nota sobre el alcance de la instrucción recibida

El mensaje de la tarea se cortó justo después de mostrar el bloque de código para la referencia local a `ENCABEZADO_FORMATO` en `csv.js`, antes de especificar la lista de verificaciones, pruebas automáticas exigidas, nombre exacto del reporte y mensaje de commit propuesto. Ante esta interrupción, se completó la tarea siguiendo exactamente el mismo patrón mecánico usado en los ocho reportes anteriores de esta secuencia (15 a 21): mover únicamente la función indicada, exponerla junto a lo ya existente en el mismo objeto global, actualizar `main.js`, verificar, probar y documentar. Cualquier decisión no especificada explícitamente en el mensaje truncado se documenta a continuación con su justificación.

# Objetivo

Mover únicamente `parsearCSV` de `src/scripts/main.js` a `src/scripts/utils/csv.js`, sin mover ninguna otra función, conservando exactamente firma, comentarios, cuerpo, mensajes de error y comportamiento.

# Confirmación de pureza (antes de modificar)

Cuerpo de `parsearCSV` revisado en `src/scripts/main.js` (líneas 1495-1519, antes de cualquier edición):

- **No accede a `document`** — confirmado.
- **No accede a `state`** — confirmado.
- **No accede a `localStorage`** — confirmado.
- **Llama a `separarLineaCSV(...)`** (2 veces) — ya reside en `csv.js`; al mover ambas funciones al mismo archivo, la llamada se resuelve como invocación local dentro de la misma IIFE, sin necesidad de exposición adicional.
- **Usa `ENCABEZADO_FORMATO`** (`ENCABEZADO_FORMATO.forEach(...)`) — dependencia ya resuelta en `docs/engineering/21-PROJECT-FORMAT-CONSTANTS-EXTRACTION-REPORT.md` mediante `window.ProyCutProjectFormat`.
- **Usa además `LIMITES.csvColumnas` y `LIMITES.csvFilas`** — esta es una dependencia de una variable interna de la IIFE **distinta de `ENCABEZADO_FORMATO`**, por lo que, tomado literalmente, el criterio de pureza enunciado en la tarea ("no depende de variables internas de la IIFE distintas de `ENCABEZADO_FORMATO`") no se cumple estrictamente. Sin embargo, `LIMITES` ya fue expuesto globalmente como `window.ProyCutLimits` en `docs/engineering/17-LIMITS-EXTRACTION-REPORT.md`, y esta misma situación ya se resolvió con idéntico patrón en `docs/engineering/18-VALIDATION-MODULE-COMPLETE.md` (`validation.js` declara `const LIMITES = window.ProyCutLimits;` dentro de su propia IIFE). Se documenta esta desviación de forma transparente y se aplica la misma solución ya validada en el proyecto, en lugar de bloquear la extracción por una dependencia que ya cuenta con mecanismo de resolución establecido.
- **Recibe todo lo demás por parámetro** (`texto`) — confirmado.
- **Devuelve un resultado explícito** (`{filas, errores}`) — confirmado.
- **No tiene efectos secundarios** — confirmado (no escribe en `state`, DOM, ni almacenamiento).

**Conclusión**: se procede con la extracción, agregando en `csv.js` tanto la referencia a `ENCABEZADO_FORMATO` (vía `window.ProyCutProjectFormat`) como una referencia local a `LIMITES` (vía `window.ProyCutLimits`, mismo patrón que `validation.js`).

# Incidente detectado durante la tarea

Al intentar verificar el cuerpo exacto de `parsearCSV` mediante una transcripción manual de control (antes de tocar ningún archivo), se detectó una diferencia byte a byte: la transcripción manual introdujo un carácter BOM literal (`﻿` real) en lugar de la secuencia de escape de texto `﻿` (seis caracteres: barra invertida, u, F, E, F, F) que realmente existe en el código fuente dentro de `noVacias[0].texto.replace(/^﻿/, '')`. Este es el mismo tipo de error ya documentado en `docs/engineering/19-TEXT-NORMALIZATION-EXTRACTION-REPORT.md`. Se detectó **antes** de modificar cualquier archivo real, mediante un `diff` de control contra una transcripción manual descartable, y se corrigió extrayendo el cuerpo completo de la función exclusivamente mediante `sed` (sin retipeo manual) hacia un archivo temporal en el scratchpad, verificado después por `diff` como IDÉNTICO contra el original.

# Función extraída

`parsearCSV` (única función movida en esta tarea).

# Archivos modificados

- **`src/scripts/utils/csv.js`**: se agregaron, al inicio de la IIFE (antes de `separarLineaCSV`), las referencias locales:
  ```js
  const {
    ENCABEZADO_FORMATO
  } = window.ProyCutProjectFormat;

  const LIMITES = window.ProyCutLimits;
  ```
  y se agregó `parsearCSV` (cuerpo, firma y comentario sin alterar) inmediatamente después de `separarLineaCSV`, en su mismo orden relativo original respecto a `separarLineaCSV`. Se amplió el objeto expuesto:
  ```js
  window.ProyCutCSV = {
    separarLineaCSV,
    parsearCSV
  };
  ```

- **`src/scripts/main.js`**: se eliminó únicamente la declaración original de `parsearCSV` (25 líneas, de la línea 1495 a la 1519 antes del cambio), sin tocar el código inmediatamente anterior (`});` del listener del botón "Exportar formato") ni el comentario/función inmediatamente posterior (`agregarPiezaDesdeColumnas`). Se amplió la desestructuración ya existente al inicio de la IIFE:
  ```js
  const {
    separarLineaCSV,
    parsearCSV
  } = window.ProyCutCSV;
  ```
  No se modificó la única invocación existente de `parsearCSV` (línea 2913, dentro del manejador de importación de archivo CSV: `const resultado = parsearCSV(String(e.target.result || ''));`).
  Las referencias locales `const LIMITES = window.ProyCutLimits;` y `const { ENCABEZADO_FORMATO } = window.ProyCutProjectFormat;` **permanecen** en `main.js` sin cambios, porque ambas siguen usándose ahí en otras funciones no relacionadas (`agregarPiezaDesdeColumnas`, `wsPiezasFormato.addRow(ENCABEZADO_FORMATO)`, `validarEncabezadoHoja(...)`, `leerRegistrosHoja(...)`, validaciones de tamaño de archivo e importación de proyecto completo).

**`index.html` no requirió modificación**: el orden de carga ya establecido en `docs/engineering/21-PROJECT-FORMAT-CONSTANTS-EXTRACTION-REPORT.md` (`limits.js` y `project-format.js` cargan antes que `csv.js`, que a su vez carga antes que `main.js`) ya satisface las dependencias de `parsearCSV` movida a `csv.js`. No se modificó ninguna etiqueta `<script>`.

No se modificó `separarLineaCSV`, `agregarPiezaDesdeColumnas`, ninguna regla de importación, encabezados, columnas, Excel, `state`, el DOM, `recalcular()`, el optimizador, ni el CSS.

# Comparación

- `diff` entre el cuerpo de `parsearCSV` en `csv.js` (líneas 14-38) y su versión original en `main.js` (líneas 1495-1519, antes de editar): **sin diferencias (IDÉNTICO)**.
- Búsqueda de `function parsearCSV(` en `main.js` tras el cambio: **sin coincidencias**.
- Conteo de invocaciones a `parsearCSV` en `main.js`: 1, la misma de antes, sin modificar.
- `node --check` sobre `csv.js`, `main.js`, `project-format.js` y `limits.js`: los cuatro sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `csv.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `src/scripts/main.js` y `src/scripts/utils/csv.js` (modificados), además de este reporte. `index.html` no aparece modificado.

# Verificaciones (según lo pedido)

1. `parsearCSV` no accede a `document`, `state` ni `localStorage` — confirmado.
2. `parsearCSV` no depende de variables internas de la IIFE distintas de `ENCABEZADO_FORMATO`, salvo `LIMITES` — dependencia adicional detectada y resuelta de forma transparente con el mismo mecanismo ya usado en `validation.js` (ver sección "Confirmación de pureza").
3. `csv.js` expone ahora `separarLineaCSV` y `parsearCSV` en `window.ProyCutCSV` — confirmado.
4. `main.js` ya no contiene la declaración original de `parsearCSV` — confirmado por `grep`.
5. La única llamada existente a `parsearCSV` sigue igual — confirmado.
6. `csv.js` sigue cargando antes que `main.js`, y `limits.js`/`project-format.js` cargan antes que `csv.js` — confirmado, sin cambios necesarios en `index.html`.
7. `node --check` correcto en los cuatro archivos relevantes — confirmado.
8. `index.html`, `csv.js` y `main.js` responden `200` por HTTP — confirmado.
9. Sin cambios fuera de `src/scripts/main.js`, `src/scripts/utils/csv.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que carga `limits.js`, luego `project-format.js`, luego `csv.js`, en el mismo orden que `index.html`, y ejercita `parsearCSV` contra datos reales (sin inventar resultados):

| Caso | Resultado real |
|---|---|
| CSV vacío (`''`) | `{"filas":[],"errores":["El archivo CSV esta vacio."]}` |
| Solo líneas en blanco/espacios | `{"filas":[],"errores":["El archivo CSV esta vacio."]}` |
| Encabezado correcto + 1 fila válida | `{"filas":[{"cols":["2","600","400","normal","Melamina Blanca","si","no","si","no","PVC","Puerta"],"numeroFila":2}],"errores":[]}` |
| Encabezado con menos columnas (3 en vez de 11) | `{"filas":[],"errores":["Encabezado: se esperaban 11 columnas y se encontraron 3."]}` |
| Encabezado con un nombre de columna incorrecto (`Rotar` en vez de `Girar`) | `{"filas":[],"errores":["Encabezado, columna 4: se esperaba \"Girar\" y se encontro \"Rotar\"."]}` |
| Encabezado correcto, sin filas de datos | `{"filas":[],"errores":[]}` |
| Encabezado correcto + 2 filas de datos | `{"filas":[{...,"numeroFila":2},{...,"numeroFila":3}],"errores":[]}` |
| BOM UTF-8 al inicio del encabezado | Se elimina correctamente; resultado idéntico al caso sin BOM — `{"filas":[{...}],"errores":[]}` |
| 2001 filas de datos (límite real `LIMITES.csvFilas = 2000`) | `{"filas":[],"errores":["El CSV contiene 2001 filas de datos; el maximo permitido es 2000."]}` |
| `separarLineaCSV` sigue exportada junto a `parsearCSV` | `true` |

Todos los resultados coinciden con las reglas de negocio reales ya presentes en el código (límite de 11 columnas y 2000 filas definidos en `src/scripts/config/limits.js`, encabezado exacto definido en `src/scripts/config/project-format.js`), confirmados a través de las funciones ya ensambladas en el orden real de producción.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación sin errores en consola.
- Pruebas de **importación CSV** de extremo a extremo (formato de piezas): archivo válido, archivo con columnas incorrectas, archivo con encabezado incorrecto, archivo con más de 2000 filas, archivo vacío — confirmando que los mensajes de error mostrados en la interfaz son idénticos a los de antes de este cambio.
- Confirmar que un archivo CSV real exportado con BOM (como los que generan Excel/Sheets al guardar como "CSV UTF-8") se importa correctamente tras el cambio, igual que antes.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 21). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual del código.
- La instrucción original de esta tarea llegó truncada (ver sección "Nota sobre el alcance de la instrucción recibida"). Se completó siguiendo el patrón establecido en las siete extracciones anteriores; si el mensaje completo especificaba una lista de verificaciones, pruebas o convenciones distintas a las aquí aplicadas, este reporte podría no reflejar exactamente lo solicitado y debe revisarse.
- `csv.js` ahora depende de dos objetos globales adicionales (`window.ProyCutLimits`, `window.ProyCutProjectFormat`) además de exponer sus propias funciones; cualquier cambio futuro al orden de `<script>` en `index.html` debe preservar que ambos carguen antes que `csv.js`.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, la declaración original de `parsearCSV` en su ubicación previa (antes de `agregarPiezaDesdeColumnas`), copiando su contenido desde `src/scripts/utils/csv.js`.
2. Reducir la desestructuración al inicio de la IIFE de `main.js` de vuelta a `const { separarLineaCSV } = window.ProyCutCSV;`.
3. En `src/scripts/utils/csv.js`, eliminar `parsearCSV`, las referencias locales `ENCABEZADO_FORMATO` y `LIMITES` agregadas para ella (si ya no se usan), y reducir `window.ProyCutCSV` de vuelta a `{ separarLineaCSV }`.

Como la función movida está verificada como byte-idéntica a su versión original, este proceso de reversión es mecánico. No se requiere revertir `index.html`, ya que no fue modificado en esta tarea.
