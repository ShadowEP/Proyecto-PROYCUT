---
name: proycut-cutting-geometry
description: "Contratos técnicos reales de las operaciones geométricas básicas de ProyCut: área útil/de colocación de tablero, huella de pieza, capacidad lineal con kerf, y el análisis de sobrantes/fronteras de kerf. Cubre src/scripts/geometry/basic-geometry.js, board-area.js y board-analysis.js. Activar antes de modificar cómo se calculan dimensiones, coordenadas, márgenes, kerf o áreas de un tablero. No cubre el algoritmo de fusión/resta de rectángulos libres (usar proycut-free-rectangles) ni las heurísticas de colocación del optimizador (usar proycut-sheet-optimizer) ni fórmulas de costo (usar proycut-costing)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Geometría de corte

## Cuándo se activa

- Modificar `src/scripts/geometry/basic-geometry.js`, `board-area.js` o `board-analysis.js`.
- Cambiar cómo se calcula el área útil de un tablero, el área de colocación (después de kerf exterior), la huella provisional de una pieza, o la capacidad lineal con kerf.
- Cambiar cómo se calculan sobrantes, fronteras de kerf (entre piezas, alrededor de pieza sobrante, exteriores) o el área sobrante total.
- Cualquier duda sobre unidades (mm, m, px) al tocar estos archivos.

## Cuándo NO se activa

- El algoritmo interno de fusión/resta/poda de rectángulos libres (`geometry/free-rectangles.js`) → `proycut-free-rectangles`.
- Las heurísticas de qué hueco elegir para colocar una pieza, orden de piezas, o edición interactiva del board (drag/rotar/espejar/compactar) → `proycut-sheet-optimizer`.
- Fórmulas de precio/costo → `proycut-costing`.

## Documentos y código canónicos

- `src/scripts/geometry/basic-geometry.js` — `calcularRectanguloUtilTablero`, `calcularRectanguloColocacion`, `calcularHuellaEnRectangulo`, `capacidadLinealConKerf`.
- `src/scripts/geometry/board-area.js` — `obtenerAreaColocacionBoard`, `obtenerKerfMaterial`, `textoSeguroParaExcel`, `resumenErrores`.
- `src/scripts/geometry/board-analysis.js` — `calcularSobrantes`, `areaSobranteTotal`, `contarCortes`, `calcularFreeRectsPara`, `crearFronterasEntrePiezas`, `crearFronterasPiezaSobrante`, `crearFronterasExteriores`.
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` — clasifica estos tres archivos como módulos **puros y estables** (sin DOM/`state`/persistencia); deben seguir siéndolo.

## Contratos verificados (por lectura directa del código)

- `calcularRectanguloUtilTablero(boardW, boardH, margenes)` → `{ok:true, rect:{x,y,w,h}, margenes}` o `{ok:false, error}`. Valida que `boardW`, `boardH` y los 4 márgenes sean números finitos ≥ 0; si el área resultante no tiene `w>0` y `h>0`, retorna error explícito.
- `calcularRectanguloColocacion(areaUtil, kerfBordeExterior)` → aplica el kerf exterior **hacia adentro** del área útil, **después** de los márgenes, sin alterar las dimensiones físicas del tablero (comentario explícito en el código). Retorna `{ok:false, error}` si el kerf consume toda el área útil.
- `calcularHuellaEnRectangulo(opcion, rect, kerf)` → huella **provisional** para decidir si una pieza cabe en un hueco; añade kerf solo hacia los lados donde sobra espacio (`sobraW`/`sobraH` > `EPS=0.001`). No es el cálculo final de sobrante — eso lo hace `board-analysis.js` después de colocar la pieza.
- `capacidadLinealConKerf(disponible, medida, kerf)` → `Math.floor(disponible/medida)` si `kerf===0`; si no, `Math.floor((disponible+kerf)/(medida+kerf))`. Retorna `0` si `medida<=0` o `disponible<medida`.
- `obtenerAreaColocacionBoard(board)` → cadena de fallback: `board.areaColocacion || board.areaUtil || {x:0,y:0,w:board.boardW,h:board.boardH}`. Cualquier función que reciba un `board` incompleto (sin `areaColocacion` ni `areaUtil`) obtiene un rectángulo del tamaño completo del tablero sin restar nada.
- `obtenerKerfMaterial(piezas, parametrosProyecto)` → para cada uno de los 4 valores de kerf (`valor`, `entrePiezas`, `piezaSobrante`, `bordeExterior`), toma el **máximo** entre todas las piezas del material (no el primero, no el promedio, no el del proyecto sin más).
- `board-analysis.js`: `calcularSobrantes` descarta huecos con cualquier lado `< 60` mm (`MIN_UTIL`) y ordena por área descendente; `areaSobranteTotal` suma `w*h` de `board.freeRects` (nombrado en el código como `areaSobranteMm2`, confirmando que el resultado es **mm², no m²**); `calcularFreeRectsPara` construye huecos **provisionales** (solo reserva `kerfEntrePiezas`, nunca clasifica sobrante definitivo — usado por `rotarPieza`, ver `proycut-sheet-optimizer`); `crearFronterasEntrePiezas/PiezaSobrante/Exteriores` reservan franjas de kerf alrededor de piezas y bordes que luego se restan como obstáculos para reconstruir `freeRects`.

## Unidades — advertencia obligatoria

No mezclar sin conversión explícita:

- **mm** — unidad nativa de todo lo geométrico: dimensiones de tablero, piezas, kerf, márgenes, coordenadas `x/y/w/h`.
- **m** — solo aparece en costeo (`tapacanto`, `corte por metro lineal`), vía división explícita `/1000` en `costing/calculate-costs.js`. La geometría nunca calcula en metros.
- **mm²** — áreas de sobrante (`areaSobranteMm2`, `areaSobranteTotal`). No confundir con m².
- **px / escala SVG** — `svg/board-renderer.js` calcula `scale = anchoDisponible(px) / board.boardW(mm)` y escribe `board._geom = {scale, margenIzq, margenSup}` al final de `dibujarBoard` (línea 248). La única conversión px↔mm confirmada en el código es `dxMm = dxSvg / scale` en el manejador de arrastre de `main.js`. Cualquier otro punto que necesite convertir px↔mm debe pasar por `board._geom.scale`, no inventar un factor propio.
- **precio por tablero vs. precio por metro** — es una distinción de costeo, no de geometría; ver `proycut-costing`.

No se han localizado en el código otras conversiones de unidades (pulgadas, pies, etc.). No inventar ninguna que no exista.

## Tolerancias — implementación accidental, no invariante

Cada comparación geométrica en el código usa su propio umbral, elegido para su propósito específico. Estos valores son detalle de implementación (pueden ajustarse con evidencia y aprobación), pero el **patrón** — cada comparación necesita su propia tolerancia, no existe un único "EPS global" — sí es la invariante a preservar:

| Constante | Valor | Dónde | Propósito |
|---|---|---|---|
| `EPS` | `0.001` | `calcularHuellaEnRectangulo` (basic-geometry.js) | Tolerancia de sobra/ajuste de huella |
| `MIN_UTIL` | `60` mm | `calcularSobrantes` (board-analysis.js) | Umbral mínimo para considerar un sobrante "aprovechable" |
| tolerancia de fronteras | `0.001` | `board-analysis.js` (varias) | Evitar franjas de kerf de ancho ~0 |

No unificar estos valores en una sola constante sin evidencia de que es seguro — cada uno protege un caso distinto.

## Casos límite obligatorios al modificar geometría

Cualquier cambio en estos archivos debe considerar explícitamente:

- **Cero:** kerf = 0, márgenes = 0, dimensión = 0 (¿debe rechazarse o es válido?).
- **Bordes coincidentes:** piezas o huecos que se tocan exactamente en el borde (no deben tratarse como traslape — ver también `proycut-free-rectangles`).
- **Piezas ajustadas al límite:** una pieza cuya medida iguala exactamente el área de colocación disponible.
- **Rotación:** intercambio de `l`/`a` al girar — confirmar que kerf y márgenes se sigan aplicando correctamente al rectángulo ya rotado.
- **Kerf que consume toda el área:** ya validado explícitamente en `calcularRectanguloUtilTablero`/`calcularRectanguloColocacion` (retornan `ok:false`) — no romper esa validación.
- **Dimensiones inválidas:** no numéricas, negativas, `NaN`/`Infinity` — `basic-geometry.js` valida esto explícitamente con `Number.isFinite`; confirmar que un cambio no elimine esa validación.

## Verificaciones obligatorias

- `node --check` sobre cada archivo modificado.
- Prueba pura manual (con datos conocidos) de la función tocada, cubriendo al menos los casos límite de la sección anterior.
- Confirmar que el archivo sigue sin acceder a `document`, `state` o `localStorage` (contrato de módulo puro).
- Ver `proycut-regression-matrix` → fila "Geometría" / "Análisis de tablero" para las pruebas manuales de `12-MANUAL-TESTS.md` relacionadas (sección de optimización, `OPT-*`).

## Condiciones para detenerse y pedir aclaración

- Se necesita una conversión de unidades que no está ya en el código (in/ft, mm↔m fuera de costeo, etc.).
- No es claro si un cambio de tolerancia (EPS/MIN_UTIL/UMBRAL) es seguro sin evidencia de por qué el valor actual se eligió así.
- El cambio requeriría que la geometría dependa de `document`/`state` (rompería el contrato de módulo puro).
