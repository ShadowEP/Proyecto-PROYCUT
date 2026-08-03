# 30-DXF-PURE-UTILS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción de las cuatro funciones puras de generación DXF (`grupoDxf`, `polilineaRectDxf`, `construirDXFTablero`, `nombreArchivoSeguro`) desde `src/scripts/main.js` hacia `src/scripts/dxf/dxf-export.js`, dejando `cargarJSZip` y `exportarDXFZip` sin tocar en `main.js`.

## Depende de
`src/scripts/main.js`; `src/scripts/dxf/dxf-export.js`; `index.html`; `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md` (sección 9, candidato 5; sección 15, punto 3)

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Extraer únicamente las cuatro funciones puras relacionadas con DXF (`grupoDxf`, `polilineaRectDxf`, `construirDXFTablero`, `nombreArchivoSeguro`) hacia `src/scripts/dxf/dxf-export.js`, conservando exactamente nombres, firmas, cuerpos, comentarios, saltos de línea DXF, fórmulas, inversión del eje Y, unidades, orden de entidades y comportamiento, sin tocar `cargarJSZip`, `exportarDXFZip`, `promesaJSZip`, el listener del botón, ni la lógica de visibilidad.

# Funciones extraídas

Las cuatro funciones ubicadas en `src/scripts/main.js`, líneas 5325-5385 (antes de cualquier edición), formando un bloque contiguo:

```js
// Arma un renglon "codigonvalorn" (formato estandar de grupos DXF).
function grupoDxf(codigo, valor){
  return codigo + '\r\n' + valor + '\r\n';
}

// Rectangulo cerrado (POLYLINE/VERTEX/SEQEND) en una capa dada, formato DXF R12 (AC1009),
// el mas compatible entre softwares de CNC/CAM ya que es el formato base sin extensiones.
function polilineaRectDxf(capa, x, y, w, h, boardH){ ... }

// Arma el DXF completo (HEADER/TABLES/BLOCKS/ENTITIES/EOF) de un tablero: ...
function construirDXFTablero(board){ ... }

// Nombre de archivo seguro (sin caracteres invalidos en Windows/Mac/Linux).
function nombreArchivoSeguro(txt){
  return txt.replace(/[/:*?"<>|]/g, '-');
}
```

Las relaciones internas se conservaron dentro del mismo archivo: `polilineaRectDxf` sigue llamando a `grupoDxf`; `construirDXFTablero` sigue llamando a `grupoDxf` y `polilineaRectDxf`.

**No se extrajeron**: `cargarJSZip`, `exportarDXFZip`, `promesaJSZip`, el listener del botón (`document.getElementById('exportarDxf').addEventListener('click', exportarDXFZip)`), ni la lógica de visibilidad del botón (`aplicarVisibilidadBotones`). Todos permanecen exactamente donde estaban, sin modificar.

# Evidencia de pureza

Confirmada individualmente para las cuatro (ya evaluada en el análisis previo de solo lectura, y re-verificada antes de modificar):

| Criterio | `grupoDxf` | `polilineaRectDxf` | `construirDXFTablero` | `nombreArchivoSeguro` |
|---|---|---|---|---|
| No accede a `document` | Sí | Sí | Sí | Sí |
| No accede a `state` | Sí | Sí | Sí | Sí |
| No accede a `localStorage` | Sí | Sí | Sí | Sí |
| No modifica datos globales | Sí | Sí | Sí | Sí |
| Recibe todo por parámetros | Sí | Sí | Sí (`board`, sin mutarlo) | Sí |
| Devuelve un resultado explícito | Sí (string) | Sí (string) | Sí (string DXF completo) | Sí (string) |
| No depende de variables internas no expuestas | Sí | Sí (usa `grupoDxf`, extraída junto con ella) | Sí (usa `grupoDxf`/`polilineaRectDxf`, extraídas junto con ella) | Sí |
| Sin efectos secundarios | Sí | Sí | Sí | Sí |

# Comparación byte a byte

- `diff` entre el bloque completo (líneas 5325-5385) en `main.js` (antes de editar) y el cuerpo insertado en `dxf-export.js`: **sin diferencias (IDÉNTICO)**.
- Se ejecutó además una comparación byte a byte del **DXF completo generado** (no solo del código fuente) entre la implementación extraída y una copia de control ensamblada independientemente desde el original, para un tablero con 3 piezas: el string resultante (1596 caracteres, incluyendo todos los `\r\n`) es **idéntico carácter por carácter** (ver sección "Pruebas automáticas").

# Archivos creados

- **`src/scripts/dxf/`** (carpeta nueva).
- **`src/scripts/dxf/dxf-export.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual) del rango contiguo de líneas 5325-5385 originales de `main.js`:
  ```js
  (function(){
    function grupoDxf(codigo, valor){ ... }

    function polilineaRectDxf(capa, x, y, w, h, boardH){ ... }

    function construirDXFTablero(board){ ... }

    function nombreArchivoSeguro(txt){ ... }

    window.ProyCutDxfExport = {
      grupoDxf,
      polilineaRectDxf,
      construirDXFTablero,
      nombreArchivoSeguro
    };
  })();
  ```

# Archivos modificados

- **`src/scripts/main.js`**:
  - Se eliminó únicamente el bloque contiguo de las 4 declaraciones (con sus comentarios). `cargarJSZip` (línea 5292 antes de editar) y `exportarDXFZip` (línea 5387 antes de editar) permanecen exactamente en su lugar, sin modificar.
  - Se agregó, al inicio de la IIFE (después del bloque de `window.ProyCutBoardArea`, antes de `let BOARD_W = 2440;`), la referencia local:
    ```js
    const {
      grupoDxf,
      polilineaRectDxf,
      construirDXFTablero,
      nombreArchivoSeguro
    } = window.ProyCutDxfExport;
    ```
  - No se modificó ninguna llamada existente. Las llamadas **internas** a `grupoDxf` (22 apariciones dentro de `polilineaRectDxf`/`construirDXFTablero`) y a `polilineaRectDxf` (2 apariciones dentro de `construirDXFTablero`) se movieron completas junto con el bloque, ya verificadas byte-idénticas. Las llamadas **externas** que permanecen en `main.js` (`construirDXFTablero(b)` y `nombreArchivoSeguro(...)`, ambas dentro de `exportarDXFZip`) se compararon textualmente contra el commit `HEAD` y resultaron **idénticas**.

- **`index.html`**: se insertó `<script src="./src/scripts/dxf/dxf-export.js"></script>` entre `hierarchical-config.js` y `main.js`, sin alterar ninguna otra etiqueta:
  ```html
  <script src="./src/scripts/utils/format.js"></script>
  <script src="./src/scripts/config/limits.js"></script>
  <script src="./src/scripts/utils/validation.js"></script>
  <script src="./src/scripts/utils/text-normalization.js"></script>
  <script src="./src/scripts/config/project-format.js"></script>
  <script src="./src/scripts/utils/csv.js"></script>
  <script src="./src/scripts/geometry/basic-geometry.js"></script>
  <script src="./src/scripts/geometry/free-rectangles.js"></script>
  <script src="./src/scripts/geometry/board-area.js"></script>
  <script src="./src/scripts/config/hierarchical-config.js"></script>
  <script src="./src/scripts/dxf/dxf-export.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```

No se modificó el contenido DXF, los `\r\n`, los códigos de grupo, las capas, los nombres, las coordenadas, la inversión del eje Y, los `toFixed`, las unidades, `exportarDXFZip`, `cargarJSZip`, `recalcular()`, `state.boards`, los nombres de archivo del ZIP, los botones, ni el CSS.

# Verificaciones (según lo pedido)

1. Las cuatro funciones son puras — confirmado en "Evidencia de pureza".
2. Cada cuerpo es byte-equivalente al original — confirmado por `diff`.
3. `main.js` ya no contiene sus declaraciones — confirmado por `grep`.
4. Todas sus llamadas siguen intactas — confirmado: las internas viajaron con el bloque (verificado por conteo: 23 `grupoDxf(` y 3 `polilineaRectDxf(` en el nuevo archivo, exactamente 1 declaración + N llamadas cada una), las externas se compararon textualmente contra `HEAD` y son idénticas.
5. `dxf-export.js` carga antes de `main.js` — confirmado.
6. `exportarDXFZip` permanece en `main.js` — confirmado (línea 5332 tras el cambio).
7. `cargarJSZip` permanece en `main.js` — confirmado (línea 5299 tras el cambio).
8. `node --check` correcto en `dxf-export.js` y `main.js` — confirmado.
9. `index.html`, `dxf-export.js` y `main.js` responden `200` por HTTP — confirmado.
10. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/dxf/dxf-export.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que compara dos implementaciones cargadas de forma independiente: (a) las funciones reales extraídas en `dxf-export.js`, y (b) una copia de control ensamblada directamente desde el mismo fragmento de código original (`HEAD`, extraído por `sed`). Resultados reales observados (no inventados):

| Caso | Resultado |
|---|---|
| `grupoDxf` con número (`0, 'POLYLINE'`) | `"0\r\nPOLYLINE\r\n"` |
| `grupoDxf` con texto (`9, '$ACADVER'`) | `"9\r\n$ACADVER\r\n"` |
| `grupoDxf` con número decimal ya formateado (`10, (123.456).toFixed(2)`) | `"10\r\n123.46\r\n"` |
| Tablero sin piezas | DXF completo con solo el contorno `TABLERO`, sin ninguna entidad `CORTE` |
| Tablero con una pieza | Coincide exactamente (incluye la inversión de eje Y: pieza en `y:100,h:400` sobre tablero `boardH:1220` → `VERTEX` en `20\r\n720.00` / `20\r\n1120.00`) |
| Tablero con varias piezas (3) | Coincide exactamente, orden `TABLERO → pieza1 → pieza2 → pieza3` preservado |
| Pieza en `x=0, y=0` | Coincide exactamente |
| Pieza en el borde opuesto (esquina inferior derecha) | Coincide exactamente |
| Coordenadas decimales (`boardW:2440.5, boardH:1220.25, pieza x:10.333...`) | Coincide exactamente, incluyendo el redondeo de `toFixed(2)` (`10.33`, `799.58`, etc.) |
| Pieza "rotada" (representada por `w`/`h` ya intercambiados, `w:400,h:600`) | Coincide exactamente |
| Orden exacto de entidades (tablero + 3 piezas) | **Comparación estricta de igualdad de string completo** (`===`, no solo `JSON.stringify`): el DXF generado por la implementación extraída y por la copia de control son **idénticos carácter por carácter**, 1596 caracteres |
| Nombre de archivo normal | Sin cambios |
| Nombre con los 7 caracteres prohibidos (`/:*?"<>|`) | Cada uno reemplazado por `-` |
| Nombre con acentos | Sin tocar (confirma que la función no sanitiza acentos, comportamiento real preservado, no inventado) |
| No mutación del objeto `board` | Confirmado: `JSON.stringify(board)` idéntico antes y después de llamar a `construirDXFTablero(board)` |

En los 15 casos comparativos (incluida la comparación byte a byte estricta del DXF completo), el resultado de la implementación extraída coincidió exactamente con el de la copia de control — **15/15 OK**.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **Generar ZIP DXF**: hacer clic en "Exportar DXF (CNC)" con un proyecto válido y confirmar que el ZIP se descarga.
- **Confirmar cantidad de archivos**: el ZIP debe contener exactamente un `.dxf` por cada tablero de `state.boards`.
- **Abrir un DXF**: abrir alguno de los archivos generados en un visor/editor CAD y confirmar que el contorno del tablero y las piezas se ven correctamente.
- **Verificar dimensiones**: las dimensiones del tablero en el DXF deben coincidir con `board.boardW`/`board.boardH` mostrados en pantalla.
- **Verificar posición de piezas**: la posición de cada pieza en el DXF debe coincidir visualmente con su posición en el diagrama SVG mostrado en pantalla (considerando la inversión de eje Y, que es intencional y no debe "corregirse").
- **Comprobar exportación después de mover una pieza manualmente**: mover una pieza con el mouse (arrastre) y luego exportar DXF; documentar honestamente si el archivo refleja la posición movida o si `recalcular()` (llamado al inicio de `exportarDXFZip`, sin modificar en esta tarea) descarta el acomodo manual y exporta el resultado de un recálculo fresco. **No se debe cambiar este comportamiento** aunque se confirme que descarta el acomodo manual — esto ya se documentó como riesgo conocido en el análisis previo (chat-only, sin reporte), y esta tarea no lo modifica.
- **Revisar consola**: confirmar que no aparece ningún error ni advertencia nueva relacionada con `ProyCutDxfExport`, `grupoDxf`, `polilineaRectDxf`, `construirDXFTablero` o `nombreArchivoSeguro`.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 29). La verificación se limitó a un sandbox de Node, peticiones HTTP directas, comparación textual del código y comparación byte a byte del contenido DXF generado.
- No se pudo abrir ninguno de los archivos `.dxf` generados en un software CAD/CNC real dentro de este entorno; la validación de compatibilidad con dichos programas queda como prueba manual pendiente.
- `exportarDXFZip` sigue llamando a `recalcular()` antes de generar el ZIP (comportamiento preexistente, no modificado en esta tarea); el riesgo de que esto descarte un acomodo manual de piezas ya fue documentado en el análisis previo y se reitera aquí como prueba manual pendiente, sin haberlo alterado.
- `cargarJSZip` y `promesaJSZip` permanecen en `main.js`; cualquier extracción futura del coordinador ZIP deberá evaluarlos por separado, ya que no son puros (acceden a `document`).

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, las cuatro declaraciones originales (con sus comentarios) en su ubicación previa (inmediatamente antes de `exportarDXFZip`), copiando su contenido desde `src/scripts/dxf/dxf-export.js`.
2. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     grupoDxf,
     polilineaRectDxf,
     construirDXFTablero,
     nombreArchivoSeguro
   } = window.ProyCutDxfExport;
   ```
3. Eliminar `src/scripts/dxf/dxf-export.js` y, si queda vacía, la carpeta `src/scripts/dxf/`.
4. Eliminar la etiqueta `<script src="./src/scripts/dxf/dxf-export.js"></script>` de `index.html`.

Como las cuatro funciones movidas están verificadas como byte-idénticas a su versión original (incluyendo el DXF completo que generan), este proceso de reversión es mecánico.
