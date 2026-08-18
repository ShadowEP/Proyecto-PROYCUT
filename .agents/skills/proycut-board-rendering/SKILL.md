---
name: proycut-board-rendering
description: "Contrato técnico real del SVG que dibuja tableros y piezas en ProyCut: firma de dibujarBoard() (src/scripts/svg/board-renderer.js), escala mm→px, board._geom, y los anclajes de interacción (.pieza-drag, .pieza-rotar, data-idx) que consume el drag manual. Activar antes de modificar la estructura del SVG, sus clases/atributos, o su relación de coordenadas. No cubre el comportamiento de arrastrar/rotar/espejar/compactar en sí (usar proycut-board-interactions) ni las fórmulas geométricas del dominio (usar proycut-cutting-geometry)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Renderizado de tableros (SVG)

## Cuándo se activa

- Modificar `src/scripts/svg/board-renderer.js` (única función: `dibujarBoard`).
- Cambiar la estructura del SVG generado: agrupaciones, clases CSS, atributos `data-*`, textos, cotas.
- Cambiar cómo se calcula la escala mm→px o los márgenes visuales del dibujo.
- Cualquier duda sobre si un elemento del SVG es puramente visual o es también un ancla de interacción.

## Cuándo NO se activa

- El comportamiento de arrastrar, rotar, espejar o compactar una pieza (el SVG es su superficie de interacción, pero la lógica vive en `main.js`) → `proycut-board-interactions`.
- Las fórmulas de área útil, huella, kerf o sobrantes que `dibujarBoard` solo dibuja pero no calcula → `proycut-cutting-geometry` / `proycut-free-rectangles`.
- El contrato DXF (otra salida de fabricación, sin relación con el SVG) → `proycut-dxf-r12`.

## Código canónico

- `src/scripts/svg/board-renderer.js` — única fuente. Exporta `window.ProyCutBoardRenderer.dibujarBoard`.
- Consumidores confirmados (únicos dos, verificados por búsqueda directa en esta tarea):
  - `renderDiagrama()` en `main.js` (línea ~4455) — pantalla, con `activarPiezasArrastrables()` enganchado inmediatamente después.
  - `generarDiagramasParaExcel()` en `src/scripts/excel/excel-diagrams.js` (línea ~87) — convierte el **mismo string SVG** a PNG (`svgAPngBuffer`) para incrustarlo en el Excel exportado. No existe una ruta de dibujo separada para Excel: es la misma función, el mismo SVG, solo rasterizado después.

## Firma confirmada

```text
dibujarBoard(board, kerf, anchoDisponible, estilo) → string SVG
```

Confirmada por lectura directa (`board-renderer.js` línea 2) y por ambos call sites (`main.js` línea 4455, `excel-diagrams.js` línea 87). No ha cambiado respecto a lo esperado.

**`kerf` está presente pero no se usa dentro del cuerpo de la función** — confirmado con `grep` dirigido: la única aparición de la palabra `kerf` en todo el archivo es en la firma. Esto es **compatibilidad actual con la forma en que ambos consumidores llaman a la función**, no un permiso automático para eliminar el parámetro. Quitarlo requiere actualizar los dos call sites y confirmar que ninguna versión futura de la función vuelva a necesitarlo — es un cambio de firma, no una limpieza trivial.

## Contratos verificados

- **Escala:** `scale = (anchoDisponible || 760) / board.boardW` — píxeles por milímetro. `anchoDisponible` es el único parámetro que controla el tamaño final del dibujo; si es falsy, usa `760` por defecto.
- **`board._geom`:** al final de `dibujarBoard` (línea 248) se escribe `board._geom = {scale, margenIzq, margenSup}` sobre el objeto `board` recibido — **efecto colateral confirmado**: `dibujarBoard` muta su parámetro de entrada, no es una función puramente de transformación de datos. Este objeto es el único punto de conversión px↔mm usado después por el manejador de arrastre (`proycut-board-interactions`). No renombrar `scale`/`margenIzq`/`margenSup` ni cambiar su significado sin actualizar ese consumidor.
- **Márgenes visuales:** `margenIzq` es fijo (`34`); `margenSup`/`margenDer`/`margenInf` varían según cuántos sobrantes se anotan con cota en cada lado (`filaCota`, `filaCotaV`, `colchonAfuera`, todos derivados del tamaño de letra configurado). No son constantes fijas — dependen del contenido a dibujar.
- **Anclas de interacción confirmadas — no eliminar/renombrar sin revisar consumidores:**
  - `.pieza-drag` (`<g class="pieza-drag" data-idx="${idx}">`, línea 199) — un grupo por pieza; `data-idx` es el índice de la pieza dentro de `board.pieces`, consumido por `activarPiezasArrastrables` (`main.js`) vía `svgEl.querySelectorAll('.pieza-drag')` y `g.getAttribute('data-idx')`.
  - `.pieza-rotar` (`<g class="pieza-rotar" data-idx="${idx}">`, línea 237) — solo se dibuja si la pieza mide más de 26×26 px en pantalla (`cabeBotonRotar`); consumido por `g.querySelector('.pieza-rotar')` en el mismo manejador.
  - Ambas clases y el atributo `data-idx` son **contratos de interacción real**, no solo nombres de estilo — confirmado porque `main.js` los consulta por selector CSS/atributo, no por posición ni por otra vía.
- **Orientación de piezas en pantalla:** L1/L2 se dibujan siempre en el lado más **largo** de la pieza tal como se ve en pantalla (`pw >= ph` decide cuál par es cuál, línea 206–209), sin importar en qué columna (Largo/Ancho) se capturó el valor mayor — el mismo criterio que usa `costing/calculate-costs.js` para tapacanto (ver `proycut-costing`), aplicado aquí a la presentación visual.
- **Tamaño de letra de piezas:** único para todas las piezas del tablero (`fs`/`fsLado`), calculado en función de la pieza **más chica** del tablero (`minPw`/`minPh`), para que el texto quepa en todas — no es un tamaño fijo configurable directamente.

## Equivalencia estructural a proteger

- El SVG debe seguir siendo un string válido reutilizable tanto para inserción directa en el DOM (`wrapEl.innerHTML = ...`) como para rasterizado a PNG (`svgAPngBuffer`). Un cambio que dependa de que el SVG esté ya insertado en el DOM (por ejemplo, medir un `getBBox()` real) rompería el uso desde Excel, que nunca lo inserta en el documento.
- La relación de coordenadas (`px = margenIzq + p.x*scale`, `py = margenSup + p.y*scale`) debe mantenerse consistente entre lo que se dibuja y lo que `board._geom` reporta — un cambio en una sin la otra desincroniza el drag.
- No mezclar lógica de geometría del dominio (cálculo de kerf, sobrantes, huella) dentro de este archivo — `dibujarBoard` solo lee `board.freeRects`/`board.pieces` ya calculados; no debe empezar a recalcularlos.

## Verificaciones obligatorias

- `node --check` sobre el archivo modificado.
- Confirmar que `.pieza-drag`, `.pieza-rotar` y `data-idx` siguen presentes con el mismo significado si se toca la estructura del SVG — revisar `proycut-board-interactions` antes de renombrarlos.
- Revisión visual manual del diagrama en pantalla y, si es relevante, del PNG embebido en el Excel exportado (mismo SVG, dos consumidores).
- Ver `proycut-regression-matrix` → fila "SVG (render del tablero)".

## Condiciones para detenerse y pedir aclaración

- La tarea pide eliminar el parámetro `kerf` no usado — requiere confirmar con el usuario y actualizar ambos call sites, no es un cambio trivial de "limpieza".
- La tarea pide cambiar `.pieza-drag`/`.pieza-rotar`/`data-idx` sin haber revisado primero `proycut-board-interactions`.
- No es claro si un cambio visual (por ejemplo, agregar un elemento nuevo al SVG) podría interferir con el rasterizado a PNG usado en Excel.
