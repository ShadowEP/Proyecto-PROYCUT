# 34-EXCEL-DIAGRAMS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-03

## Propósito
Registrar la extracción del pipeline de generación de imágenes de diagramas para Excel (`svgAPngBuffer`, `generarDiagramasParaExcel`) y sus 3 constantes asociadas desde `src/scripts/main.js` hacia `src/scripts/excel/excel-diagrams.js`, conservando la resolución correcta de `DIAGRAMAS_POR_HOJA`/`ESCALA_IMPRESION_PIEZAS` dentro de `construirLibroExcel`, que permanece en `main.js`.

## Depende de
`src/scripts/main.js`; `src/scripts/excel/excel-diagrams.js`; `src/scripts/svg/board-renderer.js`; `src/scripts/excel/excel-utils.js`; `index.html`; `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md`; `docs/engineering/31-EXCEL-PURE-UTILS-EXTRACTION-REPORT.md`; `docs/engineering/33-BOARD-RENDERER-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Extraer únicamente `svgAPngBuffer`, `generarDiagramasParaExcel` y las constantes `DIAGRAMAS_POR_HOJA`, `ESCALA_IMPRESION_PIEZAS`, `FILAS_DISPONIBLES_DIAGRAMAS` hacia `src/scripts/excel/excel-diagrams.js`, conservando exactamente nombres, firmas, cuerpos, comentarios, valores de constantes, fórmulas, escalas, dimensiones, orden de ejecución, tratamiento de errores, creación/limpieza de object URLs, estructura de resultados y comportamiento asíncrono — sin modificar `construirLibroExcel`, `exportarExcel`, `cargarExcelJS`, `leerPiezasParaExportar`, `copiarDatosParaExcel`, `dibujarBoard`, `extraerDimensionesSvg`, `recalcular()` ni `state`.

# Funciones extraídas

- `svgAPngBuffer(svgTexto, anchoPx, altoPx)` — línea 5045 original.
- `generarDiagramasParaExcel(estilo, boards, kerf)` — línea 5097 original.

Ambas formaban, junto con las 3 constantes, un bloque contiguo en `src/scripts/main.js`, líneas 5043-5131 (89 líneas, antes de cualquier edición).

# Constantes extraídas

| Constante | Valor conservado | Línea original |
|---|---|---|
| `DIAGRAMAS_POR_HOJA` | `2` | 5077 |
| `ESCALA_IMPRESION_PIEZAS` | `70` | 5084 |
| `FILAS_DISPONIBLES_DIAGRAMAS` | `60` | 5089 |

Confirmado en las pruebas automáticas: los tres valores expuestos en `window.ProyCutExcelDiagrams` (`DIAGRAMAS_POR_HOJA=2`, `ESCALA_IMPRESION_PIEZAS=70`, `FILAS_DISPONIBLES_DIAGRAMAS=60`) coinciden exactamente con los originales.

# Dependencias

- `dibujarBoard` — obtenida mediante referencia explícita desde `window.ProyCutBoardRenderer` (ya expuesta desde el reporte 33), sin duplicar su código:
  ```js
  const {
    dibujarBoard
  } = window.ProyCutBoardRenderer;
  ```
- `extraerDimensionesSvg` — obtenida mediante referencia explícita desde `window.ProyCutExcelUtils` (ya expuesta desde el reporte 31), sin duplicar su código:
  ```js
  const {
    extraerDimensionesSvg
  } = window.ProyCutExcelUtils;
  ```
- No se requirió ninguna otra dependencia externa: `svgAPngBuffer` solo usa APIs de navegador (`document`, `Blob`, `URL`, `Image`), disponibles globalmente sin necesidad de referencia explícita.

# Constantes que sigue consumiendo `construirLibroExcel`

`construirLibroExcel` **permanece sin modificar** en `src/scripts/main.js` y sigue usando, textualmente iguales, las mismas dos referencias que usaba antes:

- `pageSetup: {paperSize:1, orientation:'portrait', scale: ESCALA_IMPRESION_PIEZAS, ...}` (configuración de impresión de la hoja "Piezas y diagramas").
- `if(diagramasEnPagina === DIAGRAMAS_POR_HOJA){ ... }` (decisión de salto de página entre imágenes incrustadas).

Estas dos referencias **resuelven correctamente** porque `main.js` ahora desestructura `DIAGRAMAS_POR_HOJA` y `ESCALA_IMPRESION_PIEZAS` desde `window.ProyCutExcelDiagrams` al inicio de su propia IIFE — la misma variable de closure que `construirLibroExcel` consultaba antes (una `const` local a la IIFE de `main.js`) sigue existiendo con el mismo nombre y el mismo valor, solo que ahora se origina en el módulo extraído en vez de una declaración local. No se duplicó ningún valor: hay una única fuente de verdad (`excel-diagrams.js`), consultada tanto por `generarDiagramasParaExcel` (dentro del nuevo módulo) como por `construirLibroExcel` (dentro de `main.js`, vía la referencia desestructurada).

`FILAS_DISPONIBLES_DIAGRAMAS` no tiene ningún otro consumidor — se confirmó por `grep` en todo `main.js` que, tras el cambio, no queda ninguna referencia a ella fuera de `excel-diagrams.js`.

# Archivos creados

- **`src/scripts/excel/excel-diagrams.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual) del rango contiguo de líneas 5043-5131 originales de `main.js`:
  ```js
  (function(){
    const {
      dibujarBoard
    } = window.ProyCutBoardRenderer;

    const {
      extraerDimensionesSvg
    } = window.ProyCutExcelUtils;

    function svgAPngBuffer(svgTexto, anchoPx, altoPx){ ... }

    const DIAGRAMAS_POR_HOJA = 2;
    const ESCALA_IMPRESION_PIEZAS = 70;
    const FILAS_DISPONIBLES_DIAGRAMAS = 60;

    async function generarDiagramasParaExcel(estilo, boards, kerf){ ... }

    window.ProyCutExcelDiagrams = {
      DIAGRAMAS_POR_HOJA,
      ESCALA_IMPRESION_PIEZAS,
      FILAS_DISPONIBLES_DIAGRAMAS,
      svgAPngBuffer,
      generarDiagramasParaExcel
    };
  })();
  ```

# Archivos modificados

- **`src/scripts/main.js`**:
  - Se eliminó únicamente el bloque contiguo de las 5 declaraciones (2 funciones + 3 constantes, con sus comentarios). `construirLibroExcel` (que empieza inmediatamente después de `leerPiezasParaExportar`, la cual tampoco se tocó) permanece exactamente en su lugar.
  - Se agregó, al inicio de la IIFE (después del bloque de `window.ProyCutBoardRenderer`, antes de `let BOARD_W = 2440;`), la referencia local:
    ```js
    const {
      DIAGRAMAS_POR_HOJA,
      ESCALA_IMPRESION_PIEZAS,
      FILAS_DISPONIBLES_DIAGRAMAS,
      generarDiagramasParaExcel
    } = window.ProyCutExcelDiagrams;
    ```
    `svgAPngBuffer` **no** se incluyó en esta desestructuración, tal como indicaba la tarea, porque ningún código de `main.js` la llama directamente (su único llamador, `generarDiagramasParaExcel`, viajó junto con ella al mismo archivo).
  - No se modificó ninguna llamada existente: la única invocación real de `generarDiagramasParaExcel` (dentro de `exportarExcel`) se comparó textualmente contra el commit `HEAD` y resultó **idéntica**; las dos referencias reales a `ESCALA_IMPRESION_PIEZAS`/`DIAGRAMAS_POR_HOJA` dentro de `construirLibroExcel` también se compararon y resultaron **idénticas**.

- **`index.html`**: se insertó `<script src="./src/scripts/excel/excel-diagrams.js"></script>` entre `board-renderer.js` y `main.js` (después de sus dos dependencias, `excel-utils.js` y `board-renderer.js`, ambas ya cargadas antes en el orden existente), sin alterar ninguna otra etiqueta:
  ```html
  ...
  <script src="./src/scripts/dxf/dxf-export.js"></script>
  <script src="./src/scripts/excel/excel-utils.js"></script>
  <script src="./src/scripts/svg/board-renderer.js"></script>
  <script src="./src/scripts/excel/excel-diagrams.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```

No se modificó `construirLibroExcel`, `exportarExcel`, `cargarExcelJS`, `leerPiezasParaExportar`, `copiarDatosParaExcel`, `dibujarBoard`, `extraerDimensionesSvg`, `recalcular()`, `state`, el uso de `canvas`/`Image`/`Blob`/`URL.createObjectURL`/`URL.revokeObjectURL`/`drawImage`, ninguna dimensión, resolución, escala, valor de constante, tratamiento de errores, ni el CSS.

# Comparación byte a byte

- `diff` entre el bloque completo (89 líneas) en `main.js` (antes de editar) y el cuerpo insertado en `excel-diagrams.js`: **sin diferencias (IDÉNTICO)**.
- Búsqueda de las 5 declaraciones originales en `main.js` tras el cambio: **sin coincidencias**.
- Comparación textual (sin números de línea) de la línea de invocación de `generarDiagramasParaExcel` dentro de `exportarExcel`, entre el commit `HEAD` y el `main.js` actual: **sin diferencias**.
- Comparación textual de las 2 líneas reales que usa `construirLibroExcel` (`scale: ESCALA_IMPRESION_PIEZAS,` y `if(diagramasEnPagina === DIAGRAMAS_POR_HOJA){`), entre `HEAD` y el actual: **sin diferencias** en ambas.
- Confirmado que `main.js` ya no contiene ninguna referencia a `svgAPngBuffer` (ni la declaración ni ninguna llamada), consistente con que su único llamador viajó junto con ella.
- `node --check` sobre `excel-diagrams.js` y `main.js`: ambos sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `excel-diagrams.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados) y `src/scripts/excel/excel-diagrams.js` (nuevo), además de este reporte.

# Verificaciones (según lo pedido)

1. Las dos funciones fueron extraídas completas — confirmado.
2. Las tres constantes conservaron sus valores exactos (`2`, `70`, `60`) — confirmado por prueba automática.
3. Los cuerpos son byte-equivalentes al original — confirmado por `diff`.
4. `main.js` ya no contiene sus declaraciones originales — confirmado por `grep`.
5. Todas las llamadas existentes permanecen intactas — confirmado por comparación textual contra `HEAD`.
6. `construirLibroExcel` sigue resolviendo correctamente las constantes compartidas — confirmado: mismas 2 líneas textuales, ahora resueltas vía la referencia desestructurada de `main.js`.
7. `excel-diagrams.js` obtiene `dibujarBoard` desde `window.ProyCutBoardRenderer` — confirmado.
8. `excel-diagrams.js` obtiene `extraerDimensionesSvg` desde `window.ProyCutExcelUtils` — confirmado.
9. `excel-diagrams.js` carga después de sus dependencias y antes de `main.js` — confirmado.
10. `svgAPngBuffer` conserva toda la limpieza de recursos — confirmado: los 3 `URL.revokeObjectURL` (éxito, error de contexto, error de imagen) se conservan exactamente en sus 3 rutas, verificado también con pruebas automáticas.
11. `node --check` correcto en `excel-diagrams.js` y `main.js` — confirmado.
12. `index.html`, `excel-diagrams.js` y `main.js` responden `200` por HTTP — confirmado.
13. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/excel/excel-diagrams.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que carga las dependencias reales ya extraídas (`board-renderer.js`, `excel-utils.js`) junto con `excel-diagrams.js`, dentro de un **entorno de navegador simulado (mock) mínimo y controlado**: implementaciones propias de `document.createElement('canvas')`, `Image`, `Blob` y `URL.createObjectURL`/`revokeObjectURL`, que registran eventos (creación de canvas, llamadas a `toBlob`, creación/revocación de object URLs) para poder verificar el comportamiento sin necesidad de un navegador real.

**`svgAPngBuffer` (30 verificaciones)**:
| Caso | Resultado |
|---|---|
| Estructura (`window.ProyCutExcelDiagrams` existe, funciones con el tipo correcto, constantes con el valor correcto) | 6/6 OK |
| Resolución exitosa: retorna `ArrayBuffer`, crea exactamente 1 object URL, lo revoca exactamente 1 vez, misma URL creada/revocada | 4/4 OK |
| Rechazo por contexto de canvas nulo: mensaje exacto `"El navegador no permite generar imagenes para el Excel."`, object URL revocado igualmente | 2/2 OK |
| Rechazo por `toBlob` devolviendo `null`: mensaje exacto `"No se pudo generar la imagen del diagrama."` | 1/1 OK |
| Rechazo por error de carga de imagen: mensaje exacto `"No se pudo dibujar el diagrama del tablero."`, object URL revocado igualmente | 2/2 OK |

**`generarDiagramasParaExcel` (con dependencias reales `dibujarBoard`/`extraerDimensionesSvg`, y `svgAPngBuffer` real ejecutándose contra el mock de canvas)**:
| Caso | Resultado |
|---|---|
| Cero tableros → arreglo vacío | OK |
| Un tablero → estructura exacta `{buffer, ancho, alto}`, `buffer` es `ArrayBuffer`, `ancho`/`alto` numéricos, `board._geom` escrito | 5/5 OK |
| Varios tableros (3) → 3 resultados, los 3 `boards` reciben `_geom` | 2/2 OK |
| Ancho objetivo calculado, comparado contra una fórmula de control ensamblada independientemente (`filasPorBloque`/`anchoPorAlto`/`anchoMaximoPorAncho`/`escalaDiagramaExport`) | OK — `1003` en ambos casos |
| Uso de `board.kerf` cuando es finito (`6`) vs. fallback al `kerf` recibido (`4`) cuando `board.kerf` no es finito — verificado espiando la llamada real a `dibujarBoard` | 2/2 OK |
| Llamada a `dibujarBoard` con los parámetros correctos (misma referencia de `board` y `estilo`, exactamente 1 vez) | 3/3 OK |
| Llamada a `extraerDimensionesSvg` exactamente 1 vez, con el string SVG generado | 2/2 OK |
| No modificación de `board.pieces` ni `board.freeRects` | 2/2 OK |
| Llamada real a `svgAPngBuffer` (evidenciada por la creación de 1 canvas, 1 llamada a `toBlob`, creación/revocación de 1 object URL) | 3/3 OK |

**Total: 30/30 verificaciones OK.**

Cuando fue posible, se comparó contra copias de control ensambladas independientemente del código original (la fórmula del ancho objetivo se recalculó línea por línea de forma separada, y los mensajes de error de `svgAPngBuffer` se verificaron carácter por carácter contra los strings literales del código fuente original).

# Límites de las pruebas sin navegador

- El entorno de `canvas`/`Image`/`Blob`/`URL` usado en las pruebas automáticas es un **mock deliberadamente simplificado**: no rasteriza SVG de verdad, no valida que el contenido del SVG sea válido, y produce un `ArrayBuffer` sintético de tamaño derivado (no un PNG real). Esto permite verificar la **lógica** de `svgAPngBuffer`/`generarDiagramasParaExcel` (rutas de éxito/error, orden, estructura, limpieza de recursos, parámetros pasados a sus dependencias), pero **no** verifica que el PNG resultante en un navegador real sea visualmente correcto, nítido, o tenga el color de fondo esperado — eso solo puede confirmarse con pruebas manuales.
- No se simuló ninguna prueba como "real" cuando el entorno no lo permitía: cada verificación automática se limita explícitamente a lo que el mock puede sostener honestamente (conteo de llamadas, estructura, mensajes de error, fórmulas numéricas), sin inventar afirmaciones sobre calidad visual o compatibilidad real con Excel/Numbers/LibreOffice.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **Exportar Excel completo**: clic en "Exportar" con un proyecto válido, confirmar que el archivo se descarga sin errores.
- **Un tablero**: confirmar que la imagen del único diagrama se incrusta correctamente.
- **Varios tableros**: confirmar que cada imagen corresponde al tablero correcto, en el mismo orden que las pestañas de pantalla.
- **Varias imágenes por hoja**: con más de `DIAGRAMAS_POR_HOJA` (2) tableros, confirmar que el salto de página cae exactamente donde corresponde.
- **Colores y estilos personalizados**: cambiar colores/fuentes antes de exportar, confirmar que las imágenes del Excel los reflejan.
- **Nitidez de diagramas**: confirmar que el sobremuestreo ×2 sigue produciendo imágenes nítidas al hacer zoom o imprimir.
- **Dimensiones y proporción**: confirmar que ninguna imagen sale deformada o cortada.
- **Apertura de las tres hojas**: "Piezas y diagramas" (con imágenes), "Reporte" y "Resumen y precio", todas correctas.
- **Configuración de impresión**: confirmar que la escala de impresión (`ESCALA_IMPRESION_PIEZAS`) sigue aplicándose correctamente a la hoja.
- **Apertura en Excel**: confirmar compatibilidad real.
- **Apertura en Numbers o LibreOffice cuando sea posible**: confirmar compatibilidad multiplataforma.
- **Consola sin errores**: confirmar que no aparece ningún error nuevo relacionado con `ProyCutExcelDiagrams`, `canvas`, o `Image`.
- **Confirmar que no se generen imágenes negras o transparentes**: verificar visualmente el fondo blanco de cada diagrama incrustado (relleno explícito `ctx.fillStyle = '#ffffff'` antes de dibujar).
- **Confirmar que el archivo siga abriendo correctamente**: sin corrupción ni advertencias de reparación al abrirlo.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 33). La verificación se limitó a un sandbox de Node con un entorno de navegador simulado (documentado explícitamente en sus límites), peticiones HTTP directas y comparación textual/byte a byte del código.
- Las dos constantes compartidas (`DIAGRAMAS_POR_HOJA`, `ESCALA_IMPRESION_PIEZAS`) ahora viven físicamente en un archivo distinto al de su segundo consumidor (`construirLibroExcel`, en `main.js`); cualquier cambio futuro al orden de `<script>` en `index.html` que invierta la carga de `excel-diagrams.js` respecto a `main.js` rompería esta resolución — el orden actual (`excel-diagrams.js` antes de `main.js`) es indispensable, no solo preferible.
- `generarDiagramasParaExcel` sigue produciendo el mismo efecto secundario inerte ya documentado en el análisis previo (mutación de `board._geom` sobre clones descartables de `state.boards`, hechos por `copiarDatosParaExcel` en `exportarExcel` antes de llamar a esta función) — sin cambios respecto al comportamiento original.
- El pipeline de rasterización real (SVG→canvas→PNG) no pudo probarse con un navegador de verdad en este entorno; cualquier defecto visual real (por ejemplo, un `drawImage` mal escalado) no sería detectado por las pruebas automáticas de esta tarea, que usan un mock sin rasterización real.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, el bloque completo de las 5 declaraciones (2 funciones + 3 constantes, con sus comentarios) en su ubicación previa (inmediatamente antes de `leerPiezasParaExportar`), copiando su contenido desde `src/scripts/excel/excel-diagrams.js`.
2. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     DIAGRAMAS_POR_HOJA,
     ESCALA_IMPRESION_PIEZAS,
     FILAS_DISPONIBLES_DIAGRAMAS,
     generarDiagramasParaExcel
   } = window.ProyCutExcelDiagrams;
   ```
3. Eliminar `src/scripts/excel/excel-diagrams.js`.
4. Eliminar la etiqueta `<script src="./src/scripts/excel/excel-diagrams.js"></script>` de `index.html`.

Como el bloque movido está verificado como byte-idéntico a su versión original, y `construirLibroExcel` nunca se modificó, este proceso de reversión es mecánico.
