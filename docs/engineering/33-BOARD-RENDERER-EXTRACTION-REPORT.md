# 33-BOARD-RENDERER-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-03

## Propósito
Registrar la extracción completa de `dibujarBoard` (con sus 7 funciones internas) desde `src/scripts/main.js` hacia `src/scripts/svg/board-renderer.js`, siguiendo lo identificado en el análisis previo de solo lectura de esta función (chat previo a este reporte) y en `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md` (candidato 4, "svg/board-renderer.js").

## Depende de
`src/scripts/main.js`; `src/scripts/svg/board-renderer.js`; `index.html`; `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md`; `docs/engineering/32-BOARD-ANALYSIS-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Extraer únicamente la función completa `dibujarBoard(board, kerf, anchoDisponible, estilo)`, con sus 7 funciones locales sin separarlas (`estiloADash`, `dashHastaTopeDe`, `tocaAbajo`, `puntaH`, `puntaV`, `cotaHorizontal`, `cotaVertical`), hacia `src/scripts/svg/board-renderer.js`, conservando exactamente nombre, firma, cuerpo, comentarios, fórmulas, márgenes, escalado, clases CSS, atributos SVG, orden de concatenación, textos, colores embebidos, valores por defecto, la escritura en `board._geom` y el valor de retorno — sin modificar `renderDiagrama`, `generarDiagramasParaExcel`, `activarPiezasArrastrables`, `recalcular()` ni el optimizador.

# Función extraída

`dibujarBoard(board, kerf, anchoDisponible, estilo)`, ubicada en `src/scripts/main.js`, líneas 4035-4283 (antes de cualquier edición): 249 líneas, sin comentario propio.

# Helpers internos conservados

Las 7 funciones locales viajaron dentro del cuerpo de `dibujarBoard`, sin separarlas, exactamente en su posición original:

| Helper | Firma |
|---|---|
| `estiloADash` | `(valor)` |
| `dashHastaTopeDe` | `(valor)` |
| `tocaAbajo` | `(r)` |
| `puntaH` | `(x, y, dirX, color)` |
| `puntaV` | `(x, y, dirY, color)` |
| `cotaHorizontal` | `(x1, x2, y, texto, color)` |
| `cotaVertical` | `(y1, y2, x, texto, color)` |

Confirmado por `grep` sobre el archivo resultante: las 7 declaraciones (`function estiloADash(`, etc.) están presentes dentro de `board-renderer.js`, en las líneas 17, 27, 57, 89, 102, 113 y 127 respectivamente.

# Evidencia de independencia

Antes de modificar, se verificó (ya en el análisis previo de solo lectura de esta misma sesión, y re-confirmado aquí) que `dibujarBoard`:

- No llama a ninguna función de `window.ProyCutFormat`, `window.ProyCutBasicGeometry`, `window.ProyCutFreeRectangles`, `window.ProyCutBoardArea` ni `window.ProyCutBoardAnalysis` — búsqueda exhaustiva de cada nombre expuesto por esos cinco módulos dentro del cuerpo completo: **cero coincidencias**.
- No accede a `document`, `state` ni `localStorage` — confirmado por `grep` sobre el archivo extraído: **sin coincidencias**.
- Sus 7 funciones internas no son referenciadas desde ningún otro punto de `main.js` fuera del propio cuerpo de `dibujarBoard` — confirmado en el análisis previo.

Por estas razones, la extracción no requirió declarar ninguna referencia `const {...} = window.ProyCutXxx;` adicional dentro de `board-renderer.js`: el archivo es completamente autosuficiente salvo por sus propios parámetros.

# Archivos creados

- **`src/scripts/svg/`** (carpeta nueva).
- **`src/scripts/svg/board-renderer.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual) del rango completo de líneas 4035-4283 originales de `main.js`:
  ```js
  (function(){
    function dibujarBoard(board, kerf, anchoDisponible, estilo){
      ... (cuerpo completo, con sus 7 funciones internas) ...
    }

    window.ProyCutBoardRenderer = {
      dibujarBoard
    };
  })();
  ```

# Archivos modificados

- **`src/scripts/main.js`**:
  - Se eliminó únicamente el bloque completo de `dibujarBoard` (líneas 4035-4283, más la línea en blanco que lo separaba del código anterior). Se verificó, comparando por separado el tramo anterior (líneas 1-4034) y el tramo posterior (antes 4285 en adelante, ahora reubicado) contra una copia de respaldo del archivo previo a la edición, que **ningún otro carácter del archivo cambió**.
  - Se agregó, al inicio de la IIFE (después del bloque de `window.ProyCutBoardAnalysis`, antes de `let BOARD_W = 2440;`), la referencia local:
    ```js
    const {
      dibujarBoard
    } = window.ProyCutBoardRenderer;
    ```
  - No se modificó ninguna llamada existente: las 2 invocaciones reales (`renderDiagrama`, línea 4411 tras el cambio; `generarDiagramasParaExcel`, línea 5120 tras el cambio) se compararon textualmente contra el commit `HEAD` y resultaron **idénticas**.

- **`index.html`**: se insertó `<script src="./src/scripts/svg/board-renderer.js"></script>` entre `excel-utils.js` y `main.js`, sin alterar ninguna otra etiqueta:
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
  <script src="./src/scripts/geometry/board-analysis.js"></script>
  <script src="./src/scripts/config/hierarchical-config.js"></script>
  <script src="./src/scripts/dxf/dxf-export.js"></script>
  <script src="./src/scripts/excel/excel-utils.js"></script>
  <script src="./src/scripts/svg/board-renderer.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```

No se modificó `renderDiagrama`, `generarDiagramasParaExcel`, `activarPiezasArrastrables`, la firma de `dibujarBoard` (se conservó el parámetro `kerf` aunque no se usa internamente), las clases `pieza-drag`/`pieza-rotar`, `data-idx`, el orden de concatenación del SVG, las fórmulas de `scale`, `margenIzq`/`margenSup`/`margenDer`/`margenInf`, el mapeo de tapacantos, los textos, los colores, los estilos, las cotas, el CSS, `recalcular()` ni el optimizador.

# Comparación byte a byte

- `diff` entre el cuerpo completo de `dibujarBoard` (249 líneas) en `main.js` (antes de editar) y el cuerpo insertado en `board-renderer.js`: **sin diferencias (IDÉNTICO)**.
- Búsqueda de `function dibujarBoard(` en `main.js` tras el cambio: **sin coincidencias**.
- Comparación textual (sin números de línea) de las 2 líneas de invocación entre el commit `HEAD` y el `main.js` actual: **sin diferencias**.
- `node --check` sobre `board-renderer.js` y `main.js`: ambos sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `board-renderer.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados) y `src/scripts/svg/board-renderer.js` (nuevo), además de este reporte.

# Verificación de `board._geom`

- Se confirmó, mediante `grep`, que la única línea de efecto secundario de la función se conserva exactamente igual en el archivo extraído: `board._geom = {scale, margenIzq, margenSup};` (línea 248 de `board-renderer.js`).
- En las 25 pruebas automáticas comparativas (ver sección siguiente), se verificó explícitamente, para cada caso, que `board._geom` resultante de la implementación extraída es **idéntico** (mediante `JSON.stringify`) al de la copia de control ensamblada independientemente desde el código original — no solo se comparó el string SVG retornado, sino también el estado del objeto `board` recibido después de la llamada.
- Se confirmó que `board.pieces` y `board.freeRects` **no se mutan** por la función (solo `_geom` cambia).

# Verificaciones (según lo pedido)

1. `dibujarBoard` fue extraída completa — confirmado (249 líneas, cuerpo íntegro).
2. Sus 7 funciones internas viajaron dentro de ella — confirmado por `grep`.
3. El cuerpo es byte-equivalente al original — confirmado por `diff`.
4. `main.js` ya no contiene su declaración — confirmado por `grep`.
5. Todas las llamadas existentes siguen intactas — confirmado por comparación textual contra `HEAD`.
6. `board-renderer.js` no accede a `document`, `state` ni `localStorage` — confirmado por `grep` (sin coincidencias).
7. `board._geom` sigue escribiéndose exactamente como `board._geom = {scale, margenIzq, margenSup};` — confirmado por `grep` y por las 25 pruebas comparativas.
8. La firma conserva el parámetro `kerf` — confirmado (`dibujarBoard(board, kerf, anchoDisponible, estilo)`, sin cambios).
9. `board-renderer.js` carga antes de `main.js` — confirmado.
10. `node --check` correcto en `board-renderer.js` y `main.js` — confirmado.
11. `index.html`, `board-renderer.js` y `main.js` responden `200` por HTTP — confirmado.
12. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/svg/board-renderer.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que compara dos implementaciones cargadas de forma independiente: (a) la función real extraída en `board-renderer.js`, y (b) una copia de control ensamblada directamente desde el mismo fragmento de código original (`HEAD`, extraído por `sed`). Para cada caso se comparó tanto el **string SVG retornado** (igualdad estricta `===`) como el **`board._geom` resultante** (vía `JSON.stringify`), usando copias independientes del `board` de entrada para cada implementación. Resultados reales observados (no inventados):

| Grupo | Casos | Resultado |
|---|---|---|
| Básicos | tablero vacío, una pieza, varias piezas, pieza con `w`/`h` intercambiados (rotada) | 4/4 OK |
| Tapacantos | L1 solo, L2 solo, A1 solo, A2 solo, combinación de los 4, combinación parcial (L1+A2) en pieza rotada | 6/6 OK |
| Kerf | `kerf=0` vs. `kerf=8` (extraído), `kerf=0` (extraído vs. control), `kerf` positivo (extraído vs. control) | 3/3 OK |
| Sobrantes | sin sobrantes, un sobrante, cuatro sobrantes (máximo anotado), sobrante tocando el borde inferior | 4/4 OK |
| Visibilidad | `mostrarNumero:false`, `mostrarMedidas:false`, `mostrarFlechas:false` (con sobrantes presentes) | 3/3 OK |
| Anchos disponibles | `400`, `1200`, `undefined` (usa el valor por defecto `760`) | 3/3 OK |
| Estilos | por defecto (`{}`), personalizados completos (colores/fuentes/grosores/tipo de flecha/dash), `estilo=null` | 3/3 OK |

**Total: 25/25 casos comparativos OK**, incluyendo la igualdad exacta de `board._geom` en cada uno.

**Verificación específica del parámetro `kerf`** (sin corregir ni interpretar el comportamiento, solo documentarlo): se llamó a la función extraída con el mismo `board`/`anchoDisponible`/`estilo`, una vez con `kerf=0` y otra con `kerf=8`. **El string SVG resultante fue idéntico en ambos casos** — confirma, con evidencia directa sobre la implementación ya extraída, que el parámetro `kerf` no influye en el resultado, tal como ya se había determinado en el análisis previo de solo lectura. Este comportamiento se conservó exactamente igual que en el original (no se intentó "corregirlo" ni se interpretó como error).

**No mutación de parámetros**: se verificó, con un `board` que incluía piezas y sobrantes, que `board.pieces` y `board.freeRects` permanecen `JSON.stringify`-idénticos antes y después de llamar a la función extraída — **2/2 OK**. Se confirmó, en el mismo caso, que `board._geom` sí se escribió (comportamiento esperado y deseado, no una mutación indebida).

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **Carga inicial**: abrir `index.html` y confirmar que no hay errores en consola relacionados con `ProyCutBoardRenderer` o `dibujarBoard`.
- **Diagrama con una pieza**: capturar una pieza y confirmar que el diagrama se ve igual que antes del cambio.
- **Varias piezas**: capturar varias piezas y confirmar el mismo comportamiento visual.
- **Tapacantos en los cuatro lados**: activar L1/L2/A1/A2 en distintas piezas y confirmar que se dibujan en el lado correcto.
- **Sobrantes**: confirmar que las cotas de sobrantes (hasta 4) se dibujan igual que antes, incluyendo el caso de un sobrante que toca el borde inferior del tablero.
- **Varios tableros**: confirmar que cada pestaña dibuja su propio tablero correctamente.
- **Arrastre**: mover una pieza con el mouse y confirmar que `board._geom` (ahora escrito por la función ya extraída) sigue permitiendo la conversión correcta de coordenadas — si esto falla, la pieza no se movería o saltaría a una posición incorrecta.
- **Rotación**: clic en el botón ⟳ sobre una pieza y confirmar que gira correctamente.
- **Espejo**: usar las 4 opciones del menú "Espejo" y confirmar que el resultado visual no cambia.
- **Compactación**: confirmar que compactar no altera visualmente el diagrama generado.
- **Cambio de pestaña**: confirmar que cambiar entre tableros sigue funcionando sin errores.
- **Exportación Excel**: confirmar que la hoja "Piezas y diagramas" sigue incrustando las imágenes de los diagramas correctamente (usa `dibujarBoard` a través de `generarDiagramasParaExcel`, no modificada).
- **Comparación visual antes/después**: captura de pantalla del mismo proyecto antes y después de esta extracción, sin diferencias esperadas.
- **Consola sin errores**: confirmar que no aparece ningún error ni advertencia nueva en ningún flujo (arranque, optimización, edición manual, exportación).

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 32). La verificación se limitó a un sandbox de Node, peticiones HTTP directas, comparación textual y comparación byte a byte del string SVG y de `board._geom`.
- Esta es la extracción de mayor tamaño realizada hasta ahora en el subsistema SVG (249 líneas, 7 funciones internas), con una densidad alta de fórmulas visuales (márgenes, escalado, posicionamiento de cotas). Aunque la comparación automática cubrió 25 combinaciones distintas de entrada, no sustituye la validación visual real en navegador.
- `dibujarBoard` sigue teniendo un efecto secundario deliberado sobre su parámetro `board` (`board._geom`); cualquier código futuro que dependa de esta escritura debe seguir llamando a la función real (ya sea desde `main.js`, a través de la referencia desestructurada, o desde cualquier otro consumidor futuro) para que ese efecto se produzca.
- El parámetro `kerf` permanece sin uso interno, tal como exigía la tarea (no se eliminó ni se corrigió); esto no es un riesgo introducido por esta extracción, sino un comportamiento preexistente ahora confirmado con evidencia directa sobre el código ya movido.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, la declaración completa de `dibujarBoard` (con sus 7 funciones internas) en su ubicación previa (inmediatamente antes de `piezasSeEncimanConOtras`), copiando su contenido desde `src/scripts/svg/board-renderer.js`.
2. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     dibujarBoard
   } = window.ProyCutBoardRenderer;
   ```
3. Eliminar `src/scripts/svg/board-renderer.js` y, si queda vacía, la carpeta `src/scripts/svg/`.
4. Eliminar la etiqueta `<script src="./src/scripts/svg/board-renderer.js"></script>` de `index.html`.

Como la función movida está verificada como byte-idéntica a su versión original (incluida la escritura de `board._geom`), este proceso de reversión es mecánico.
