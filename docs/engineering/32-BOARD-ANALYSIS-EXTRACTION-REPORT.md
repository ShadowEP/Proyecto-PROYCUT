# 32-BOARD-ANALYSIS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la evaluación y extracción de las funciones puras de análisis geométrico de tablero, sobrantes y fronteras desde `src/scripts/main.js` hacia `src/scripts/geometry/board-analysis.js`, siguiendo lo identificado en el análisis previo de solo lectura del subsistema SVG (candidato "sobrantes y rectángulos libres" de `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md`, grupo 21).

## Depende de
`src/scripts/main.js`; `src/scripts/geometry/board-analysis.js`; `src/scripts/geometry/basic-geometry.js`; `src/scripts/geometry/free-rectangles.js`; `src/scripts/geometry/board-area.js`; `index.html`; `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Evaluar y extraer únicamente las funciones puras o autocontenidas de análisis geométrico de tablero, sobrantes y fronteras (`calcularSobrantes`, `areaSobranteTotal`, `contarCortes`, `calcularFreeRectsPara`, `crearFronterasEntrePiezas`, `crearFronterasPiezaSobrante`, `crearFronterasExteriores`) hacia `src/scripts/geometry/board-analysis.js`, sin mover ni modificar `reconstruirSobrantesYFronteras`, `recalcularFreeRectsDesdeCero`, `dibujarBoard`, `renderDiagrama`, `activarPiezasArrastrables`, `calcularImanes`, `rotarPieza`, `espejarBoard`, `compactarHacia*`, `empacarMaterial`, `empacarConLista`, `empacarConListaLibre` ni `recalcular`.

# Funciones evaluadas

Las siete funciones candidatas, ubicadas en `src/scripts/main.js`, líneas 4003-4098 (antes de cualquier edición), formando un bloque contiguo:

## `calcularSobrantes(board, limite)`

```js
// "limite" recorta cuantos sobrantes se devuelven (6 en pantalla, para no saturar la tarjeta);
// sin limite (usado en el Excel exportable) regresa TODOS los sobrantes aprovechables del tablero.
function calcularSobrantes(board, limite){
  const MIN_UTIL = 60;
  const lista = board.freeRects
    .filter(r => !(r.w<MIN_UTIL || r.h<MIN_UTIL))
    .map(r => ({w:Math.round(r.w), h:Math.round(r.h)}))
    .sort((a,z)=> (z.w*z.h)-(a.w*a.h));
  return limite ? lista.slice(0, limite) : lista;
}
```
- No accede a `document`, `state` ni `localStorage`. No modifica variables globales. Recibe todo por parámetro. Devuelve un resultado explícito (arreglo nuevo, vía `.filter`/`.map`/`.sort` sobre una copia). No depende de funciones internas no expuestas. Sin efectos secundarios.
- **Cumple. Se extrae.**

## `areaSobranteTotal(board)`

```js
function areaSobranteTotal(board){
  return Math.max(0, (board.freeRects || []).reduce((s,r) => s + r.w*r.h, 0));
}
```
- Mismos criterios que la anterior, todos cumplidos.
- **Cumple. Se extrae.**

## `contarCortes(board)`

```js
function contarCortes(board){
  return {cortes: board.cortes, largoMm: board.corteMm};
}
```
- Todos los criterios cumplidos; retorna un objeto nuevo.
- **Cumple. Se extrae.**

## `calcularFreeRectsPara(pieces, idxExcluir, boardW, boardH, areaUtil, kerf)`

```js
function calcularFreeRectsPara(pieces, idxExcluir, boardW, boardH, areaUtil, kerf){
  const area = areaUtil || {x:0, y:0, w:boardW, h:boardH};
  const kerfNum = Number.isFinite(kerf) ? kerf : 0;
  const obstaculos = [];
  pieces.forEach((p, i) => { ... obstaculos.push({x:p.x, y:p.y, w:ocupaW, h:ocupaH}); });
  return calcularRectsLibresDesdeObstaculos(area, obstaculos);
}
```
- No accede a `document`/`state`/`localStorage`. No muta `pieces` (solo lee vía `forEach`). Recibe todo por parámetro. Devuelve un resultado explícito. Llama a `calcularRectsLibresDesdeObstaculos`, **ya expuesta en `window.ProyCutFreeRectangles`** — no es una dependencia interna no expuesta, sino una referencia explícita a un módulo ya extraído.
- **Cumple. Se extrae.**

## `crearFronterasEntrePiezas(board)`

```js
function crearFronterasEntrePiezas(board){
  const kerf = Number.isFinite(board.kerfEntrePiezas) ? board.kerfEntrePiezas : 0;
  if(!(kerf > 0)) return [];
  ... (recorre board.pieces, construye fronteras)
  return fronteras;
}
```
- No accede a `document`/`state`/`localStorage`. No muta `board.pieces`. Recibe todo por parámetro (`board`). Devuelve un arreglo nuevo. Sin dependencias externas.
- **Cumple. Se extrae.**

## `crearFronterasPiezaSobrante(board, fronterasEntrePiezas)`

```js
function crearFronterasPiezaSobrante(board, fronterasEntrePiezas){
  const kerf = Number.isFinite(board.kerfPiezaSobrante) ? board.kerfPiezaSobrante : 0;
  if(!(kerf > 0)) return [];
  const area = obtenerAreaColocacionBoard(board);
  const piezasFisicas = (board.pieces || []).map(p => ({x:p.x, y:p.y, w:p.w, h:p.h}));
  ...
  return fronteras;
}
```
- No accede a `document`/`state`/`localStorage`. No muta `board.pieces` (crea copias vía `.map`). Recibe todo por parámetro. Devuelve un arreglo nuevo. Llama a `obtenerAreaColocacionBoard` (**ya expuesta en `window.ProyCutBoardArea`**), `interseccionRectangulos` y `calcularRectsLibresDesdeObstaculos` (**ambas ya expuestas en `window.ProyCutFreeRectangles`**) — las tres son referencias explícitas a módulos ya extraídos, no dependencias internas no expuestas.
- **Cumple. Se extrae.**

## `crearFronterasExteriores(board)`

```js
function crearFronterasExteriores(board){
  const kerf = Number.isFinite(board.kerfBordeExterior) ? board.kerfBordeExterior : 0;
  if(!(kerf > 0) || !board.areaUtil || !board.areaColocacion) return [];
  const a = board.areaUtil, c = board.areaColocacion;
  return [ ... ].filter(r => r.w > 0.001 && r.h > 0.001);
}
```
- No accede a `document`/`state`/`localStorage`. No muta `board`. Recibe todo por parámetro. Devuelve un arreglo nuevo. Sin dependencias externas.
- **Cumple. Se extrae.**

# Funciones extraídas

Las siete: `calcularSobrantes`, `areaSobranteTotal`, `contarCortes`, `calcularFreeRectsPara`, `crearFronterasEntrePiezas`, `crearFronterasPiezaSobrante`, `crearFronterasExteriores`.

# Funciones descartadas y motivo

Ninguna. Las siete funciones evaluadas cumplieron los ocho criterios de pureza exigidos y fueron extraídas sin excepción.

# Dependencias

| Función extraída | Dependencia externa | Origen |
|---|---|---|
| `calcularFreeRectsPara` | `calcularRectsLibresDesdeObstaculos` | `window.ProyCutFreeRectangles` |
| `crearFronterasPiezaSobrante` | `obtenerAreaColocacionBoard` | `window.ProyCutBoardArea` |
| `crearFronterasPiezaSobrante` | `interseccionRectangulos`, `calcularRectsLibresDesdeObstaculos` | `window.ProyCutFreeRectangles` |
| `calcularSobrantes`, `areaSobranteTotal`, `contarCortes`, `crearFronterasEntrePiezas`, `crearFronterasExteriores` | ninguna | — |

Ninguna función depende de `window.ProyCutBasicGeometry`. Todas las dependencias se resolvieron mediante referencias explícitas al inicio de la IIFE de `board-analysis.js`:

```js
const {
  calcularRectsLibresDesdeObstaculos,
  interseccionRectangulos
} = window.ProyCutFreeRectangles;

const {
  obtenerAreaColocacionBoard
} = window.ProyCutBoardArea;
```

No se duplicó código ni valores de ningún módulo ya extraído.

# Evidencia de pureza

| Criterio | `calcularSobrantes` | `areaSobranteTotal` | `contarCortes` | `calcularFreeRectsPara` | `crearFronterasEntrePiezas` | `crearFronterasPiezaSobrante` | `crearFronterasExteriores` |
|---|---|---|---|---|---|---|---|
| No accede a `document` | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| No accede a `state` | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| No accede a `localStorage` | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| No modifica variables globales | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| Recibe datos por parámetros | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| Devuelve resultado explícito | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| No depende de funciones internas no expuestas | Sí | Sí | Sí | Sí (dependencia ya expuesta) | Sí | Sí (dependencias ya expuestas) | Sí |
| Sin efectos secundarios no controlados | Sí | Sí | Sí | Sí | Sí | Sí | Sí |

# Archivos creados

- **`src/scripts/geometry/board-analysis.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual) del rango contiguo de líneas 4003-4098 originales de `main.js`, conservando el orden relativo exacto:
  ```js
  (function(){
    const {
      calcularRectsLibresDesdeObstaculos,
      interseccionRectangulos
    } = window.ProyCutFreeRectangles;

    const {
      obtenerAreaColocacionBoard
    } = window.ProyCutBoardArea;

    function calcularSobrantes(board, limite){ ... }
    function areaSobranteTotal(board){ ... }
    function contarCortes(board){ ... }
    function calcularFreeRectsPara(pieces, idxExcluir, boardW, boardH, areaUtil, kerf){ ... }
    function crearFronterasEntrePiezas(board){ ... }
    function crearFronterasPiezaSobrante(board, fronterasEntrePiezas){ ... }
    function crearFronterasExteriores(board){ ... }

    window.ProyCutBoardAnalysis = {
      calcularSobrantes,
      areaSobranteTotal,
      contarCortes,
      calcularFreeRectsPara,
      crearFronterasEntrePiezas,
      crearFronterasPiezaSobrante,
      crearFronterasExteriores
    };
  })();
  ```

# Archivos modificados

- **`src/scripts/main.js`**:
  - Se eliminó únicamente el bloque contiguo de las 7 declaraciones (con sus comentarios). `reconstruirSobrantesYFronteras` (inmediatamente después del bloque) y todas las demás funciones excluidas permanecen exactamente en su lugar, sin modificar.
  - Se agregó, al inicio de la IIFE (después del bloque de `window.ProyCutExcelUtils`, antes de `let BOARD_W = 2440;`), la referencia local:
    ```js
    const {
      calcularSobrantes,
      areaSobranteTotal,
      contarCortes,
      calcularFreeRectsPara,
      crearFronterasEntrePiezas,
      crearFronterasPiezaSobrante,
      crearFronterasExteriores
    } = window.ProyCutBoardAnalysis;
    ```
  - No se modificó ninguna llamada existente: `calcularSobrantes` (2 llamadas externas, en `renderDiagrama` y `construirLibroExcel`), `areaSobranteTotal` (2, mismos lugares), `contarCortes` (1, en `recalcular`), `calcularFreeRectsPara` (1, en `rotarPieza`), `crearFronterasEntrePiezas`/`crearFronterasPiezaSobrante`/`crearFronterasExteriores` (1 cada una, dentro de `reconstruirSobrantesYFronteras`) — las 8 comparadas textualmente contra el commit `HEAD` y confirmadas **idénticas**.

- **`index.html`**: se insertó `<script src="./src/scripts/geometry/board-analysis.js"></script>` entre `board-area.js` y `hierarchical-config.js`, inmediatamente después de sus dos dependencias (`free-rectangles.js` y `board-area.js`, ambas ya cargadas antes en el orden existente), sin alterar ninguna otra etiqueta:
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
  <script src="./src/scripts/main.js"></script>
  ```

No se modificaron fórmulas, tolerancias (`0.001`, `MIN_UTIL=60`), el orden de resultados, unidades, la forma de calcular sobrantes, el conteo de cortes, las fronteras, `board._geom`, `state.boards`, `basic-geometry.js`, `free-rectangles.js`, `board-area.js`, ni el CSS.

# Comparación byte a byte

- `diff` entre el bloque completo de las 7 funciones en `board-analysis.js` y su versión original en `main.js` (antes de editar): **sin diferencias (IDÉNTICO)**.
- Búsqueda de las 7 declaraciones en `main.js` tras el cambio: **sin coincidencias**.
- Confirmado que `reconstruirSobrantesYFronteras`, `recalcularFreeRectsDesdeCero`, `dibujarBoard`, `rotarPieza`, `espejarBoard`, `compactarHaciaAbajo/Arriba/Izquierda/Derecha`, `espejarBoardHorizontal`, `calcularImanes`, `activarPiezasArrastrables`, `renderDiagrama` siguen declaradas en `main.js`, sin modificar.
- Comparación textual (sin números de línea) de las 8 líneas de invocación entre el commit `HEAD` y el `main.js` actual: **sin diferencias** en las siete funciones.
- `node --check` sobre `board-analysis.js` y `main.js`: ambos sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `board-analysis.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados) y `src/scripts/geometry/board-analysis.js` (nuevo), además de este reporte.

# Verificaciones (según lo pedido)

1. Funciones evaluadas: las 7 candidatas — confirmado en "Funciones evaluadas".
2. Funciones extraídas: las 7 — confirmado.
3. Funciones descartadas: ninguna — confirmado y explicado.
4. Cada cuerpo extraído es byte-equivalente al original — confirmado por `diff`.
5. `main.js` ya no contiene sus declaraciones originales — confirmado por `grep`.
6. Todas las llamadas existentes siguen textualmente intactas — confirmado por comparación contra `HEAD`.
7. `board-analysis.js` carga antes de `main.js` — confirmado.
8. Las dependencias con otros módulos son explícitas — confirmado (`window.ProyCutFreeRectangles`, `window.ProyCutBoardArea`, sin duplicar código ni valores).
9. `node --check` correcto en `board-analysis.js` y `main.js` — confirmado.
10. `index.html`, `board-analysis.js` y `main.js` responden `200` por HTTP — confirmado.
11. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/geometry/board-analysis.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que carga `basic-geometry.js` → `free-rectangles.js` → `board-area.js` → `board-analysis.js` (mismo orden que `index.html`) y compara dos implementaciones: (a) el módulo real extraído, y (b) una copia de control ensamblada directamente desde el mismo fragmento de código original (`HEAD`, extraído por `sed`), cargada con las mismas tres dependencias. Resultados reales observados (no inventados):

| Caso | Resultado |
|---|---|
| `calcularSobrantes` — tablero vacío | `[]` |
| `calcularSobrantes` — sobrantes múltiples, con límite 6 | 6 elementos, ordenados por área descendente |
| `calcularSobrantes` — sin límite (uso Excel) | Todos los sobrantes ≥ 60mm en cada lado |
| `calcularSobrantes` — sobrante bajo el mínimo útil (60mm) | `[]` (descartado) |
| `areaSobranteTotal` — tablero vacío | `0` |
| `areaSobranteTotal` — varios rects | `20000` |
| `areaSobranteTotal` — `freeRects` indefinido | `0` (usa el valor por defecto `[]`) |
| `contarCortes` — conteo normal | `{"cortes":5,"largoMm":12345.5}` |
| `contarCortes` — en cero | `{"cortes":0,"largoMm":0}` |
| `calcularFreeRectsPara` — una pieza | 2 rectángulos libres resultantes |
| `calcularFreeRectsPara` — varias piezas, excluyendo un índice | 3 rectángulos libres resultantes |
| `calcularFreeRectsPara` — pieza tocando el borde derecho del área | 2 rectángulos libres resultantes (sin kerf extra en ese lado) |
| `calcularFreeRectsPara` — sin `areaUtil` (usa `boardW`/`boardH`) | Igual al caso equivalente con `areaUtil` explícita |
| `crearFronterasEntrePiezas` — piezas separadas | `[]` |
| `crearFronterasEntrePiezas` — piezas adyacentes (gap = kerf exacto) | 1 frontera `entre_piezas` |
| `crearFronterasEntrePiezas` — sin kerf entre piezas | `[]` |
| `crearFronterasEntrePiezas` — piezas adyacentes verticalmente | 1 frontera `entre_piezas` |
| `crearFronterasPiezaSobrante` — pieza rodeada de espacio libre | 4 fronteras `pieza_sobrante` (arriba/abajo/izquierda/derecha) |
| `crearFronterasPiezaSobrante` — sin `kerfPiezaSobrante` | `[]` |
| `crearFronterasPiezaSobrante` — con fronteras entre piezas como obstáculo adicional | 6 fronteras `pieza_sobrante` (ajustadas por el obstáculo extra) |
| `crearFronterasExteriores` — con kerf y márgenes | 4 fronteras (`exterior_top/bottom/left/right`) |
| `crearFronterasExteriores` — sin `kerfBordeExterior` | `[]` |
| `crearFronterasExteriores` — sin `areaUtil`/`areaColocacion` | `[]` |

En los 22 casos comparativos, el resultado de la implementación extraída coincidió exactamente con el de la copia de control ensamblada independientemente desde el código original — **22/22 OK**.

**Conservación del orden de salida**: se comparó `JSON.stringify` del arreglo completo (no solo su contenido) para `calcularSobrantes` con 3 sobrantes de distinta área; el resultado extraído coincidió en orden y contenido exacto con la copia de control — **OK**.

**No mutación de parámetros**: se verificó, para las 7 funciones, que ninguna muta su(s) parámetro(s) (`board`, `pieces`) comparando `JSON.stringify` antes y después de cada llamada — **7/7 OK**.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **Una pieza**: capturar una sola pieza y confirmar que el diagrama y el panel de sobrantes se ven igual que antes del cambio.
- **Varias piezas**: capturar varias piezas del mismo material y confirmar el mismo comportamiento.
- **Varios tableros**: capturar piezas suficientes para generar más de un tablero y confirmar que cada pestaña muestra su propio conteo de sobrantes y cortes correctamente.
- **Sobrantes visibles**: confirmar que el panel "Sobrantes aprovechables" en pantalla (limitado a 6) y la hoja "Piezas y diagramas" del Excel exportado (sin límite) siguen mostrando los mismos valores que antes del cambio.
- **Mover una pieza**: arrastrar una pieza y confirmar que los huecos libres/sobrantes se recalculan igual que antes (usa `crearFronterasEntrePiezas`/`crearFronterasPiezaSobrante`/`crearFronterasExteriores`, ahora extraídas, a través de `reconstruirSobrantesYFronteras`, que no se movió).
- **Rotar una pieza**: girar una pieza y confirmar que `calcularFreeRectsPara` (ahora extraída) sigue determinando correctamente los huecos disponibles para la rotación.
- **Compactar**: usar el menú "Espejo" (con sus opciones de compactación) y confirmar que el resultado visual no cambia.
- **Cambiar de pestaña**: confirmar que cambiar entre tableros no produce errores ni cambia los sobrantes mostrados.
- **Exportar Excel**: confirmar que la hoja "Piezas y diagramas" sigue mostrando la tabla de sobrantes aprovechables por tablero con los mismos valores que antes.
- **Comparar diagrama antes y después**: comparación visual general del diagrama de corte, sin cambios esperados.
- **Revisar consola**: confirmar que no aparece ningún error ni advertencia nueva relacionada con `ProyCutBoardAnalysis` o cualquiera de las 7 funciones extraídas.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 31). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual/byte a byte del código.
- Estas siete funciones son consumidas intensivamente por `reconstruirSobrantesYFronteras` (no extraída), que a su vez es el corazón de la actualización de huecos libres tras cada edición manual (arrastrar, rotar, espejar, compactar) y tras cada optimización automática. Cualquier error de transcripción aquí, aunque ya descartado por la comparación byte a byte, tendría el mayor radio de impacto posible dentro del subsistema de diagramas.
- `board-analysis.js` ahora depende de dos módulos adicionales (`window.ProyCutFreeRectangles`, `window.ProyCutBoardArea`) además de exponer sus propias funciones; cualquier cambio futuro al orden de `<script>` en `index.html` debe preservar que ambos carguen antes que `board-analysis.js`.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, las 7 declaraciones originales (con sus comentarios) en su ubicación previa (inmediatamente antes de `reconstruirSobrantesYFronteras`), copiando su contenido desde `src/scripts/geometry/board-analysis.js`.
2. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     calcularSobrantes,
     areaSobranteTotal,
     contarCortes,
     calcularFreeRectsPara,
     crearFronterasEntrePiezas,
     crearFronterasPiezaSobrante,
     crearFronterasExteriores
   } = window.ProyCutBoardAnalysis;
   ```
3. Eliminar `src/scripts/geometry/board-analysis.js`.
4. Eliminar la etiqueta `<script src="./src/scripts/geometry/board-analysis.js"></script>` de `index.html`.

Como las siete funciones movidas están verificadas como byte-idénticas a su versión original, este proceso de reversión es mecánico.
