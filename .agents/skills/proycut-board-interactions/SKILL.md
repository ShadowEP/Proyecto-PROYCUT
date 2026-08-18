---
name: proycut-board-interactions
description: "Contrato real de la interacción manual sobre un tablero ya optimizado en ProyCut: arrastrar, rotar, espejar y compactar piezas (funciones en src/scripts/main.js, todavía no extraídas). Documenta entradas, estado modificado, efectos colaterales y renderizado posterior de cada acción, y distingue interacción visual de cambio de geometría y de recálculo del proyecto. Activar antes de modificar cualquiera de estas acciones o su relación con board._geom. No cubre las heurísticas del algoritmo de empaquetado en sí (usar proycut-sheet-optimizer) ni la estructura del SVG (usar proycut-board-rendering)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Interacciones manuales sobre el tablero

## Cuándo se activa

- Modificar `activarPiezasArrastrables`, `calcularImanes`, `piezasSeEncimanConOtras`, `rotarPieza`, `espejarBoard`, `espejarBoardHorizontal`, `compactarHaciaAbajo/Arriba/Izquierda/Derecha` en `src/scripts/main.js`.
- Cambiar qué dispara un rerender (`renderDiagrama`) o un recálculo de costo (`recalcular`) tras una interacción manual.
- Cambiar cómo se convierten coordenadas de pantalla (px) a milímetros durante el arrastre.

## Cuándo NO se activa

- Las heurísticas de colocación automática del optimizador, criterios de orden, tie-breakers → `proycut-sheet-optimizer` (esta Skill se enfoca en el contrato de interacción usuario→estado, no en por qué el algoritmo automático coloca las piezas donde las coloca).
- La estructura del SVG, sus clases y atributos `data-*` como tales → `proycut-board-rendering`.
- Fórmulas de costo → `proycut-costing`.

## Código canónico

- `src/scripts/main.js`, líneas ~4086–4423 (verificado por lectura directa en esta tarea, coincide con lo ya documentado en `proycut-sheet-optimizer`).
- Esta Skill y `proycut-sheet-optimizer` cubren el **mismo bloque de código** desde ángulos distintos: aquí, el contrato de interacción (qué entra, qué cambia, qué se dispara); allá, el algoritmo y las heurísticas. No duplicar el detalle algorítmico aquí — remitir a esa Skill.

## Contrato por acción (verificado por lectura directa)

| Acción | ENTRADAS | ESTADO MODIFICADO | EFECTOS COLATERALES | RENDERIZADO POSTERIOR |
|---|---|---|---|---|
| **Arrastrar** (`activarPiezasArrastrables` + `calcularImanes` + `piezasSeEncimanConOtras`) | Eventos `mousedown`/`mousemove`/`mouseup` sobre `.pieza-drag`; `board._geom.scale` para convertir px→mm | `p.x`, `p.y` de la pieza arrastrada (con snap a imán si aplica, umbral 18 mm) | Ninguna otra pieza se mueve; si la posición imantada encima con otra, se usa la posición sin imán; si tampoco es válida, la pieza no se mueve | `recalcularFreeRectsDesdeCero(board)` + `renderDiagrama()` — **nunca** `recalcular()` |
| **Rotar** (`rotarPieza`, botón `.pieza-rotar`) | Índice de la pieza en `board.pieces` | `p.w`/`p.h` (intercambiados), `p.x`/`p.y` (reubicados si hace falta), `p.rotada` | Si no cabe en ningún hueco válido, la función retorna `false` y **no modifica nada** | `recalcularFreeRectsDesdeCero(board)` tras éxito, luego `renderDiagrama()` (llamado por el manejador del botón) — **nunca** `recalcular()` |
| **Espejo vertical** (`espejarBoard`) | Ninguna entrada externa además del `board` | `p.y` de todas las piezas; intercambia `l1↔l2` **o** `a1↔a2` según cuál lado sea el largo en pantalla | Ninguno adicional | `recalcularFreeRectsDesdeCero(board)` — **nunca** `recalcular()` |
| **Espejo horizontal** (`espejarBoardHorizontal`) | Ninguna entrada externa además del `board` | `p.x` de todas las piezas; intercambia el par lógico **opuesto** al espejo vertical | Ninguno adicional | `recalcularFreeRectsDesdeCero(board)` — **nunca** `recalcular()` |
| **Compactar (4 direcciones)** (`compactarHaciaAbajo/Arriba/Izquierda/Derecha`) | Ninguna entrada externa además del `board` | `p.y` (Abajo/Arriba) o `p.x` (Izquierda/Derecha) de todas las piezas, respetando `kerfEntrePiezas` | No rota ni voltea, no toca `l1/l2/a1/a2` | `recalcularFreeRectsDesdeCero(board)` — **nunca** `recalcular()`. `compactarHaciaAbajo` además se invoca **automáticamente** sobre cada tablero al final de cada optimización (`optimize-project.js` línea 51) — no es solo una acción manual del menú "Espejo" |

## Hallazgo confirmado — comportamiento actual, no una decisión de corrección

**Ninguna de estas acciones recalcula el costo del proyecto.** Confirmado en esta tarea leyendo completas las siete funciones: todas terminan en `recalcularFreeRectsDesdeCero(board)` (y, según el caso, `renderDiagrama()`), ninguna llama a `recalcular()` (el ciclo que sí actualiza `state.ultimoTotal`/`state.ultimoReporte` vía `costing/calculate-costs.js`).

Esto **sigue siendo cierto en el código actual** al momento de esta Skill. Se documenta como comportamiento a preservar, **no** como algo correcto ni incorrecto — esa evaluación no corresponde a esta Skill. Cualquier tarea que agregue un recálculo automático de costo tras una interacción manual es un **CAMBIO FUNCIONAL** (ver `proycut-safe-change`) y requiere aprobación explícita antes de aplicarse; no debe tratarse como una corrección de bug.

## Distinción obligatoria

- **INTERACCIÓN VISUAL** — el evento del mouse, el snap del imán, qué botón se pulsó. Vive en el manejador de eventos (`activarPiezasArrastrables`), no cambia geometría por sí sola.
- **CAMBIO DE GEOMETRÍA** — la reasignación de `x`/`y`/`w`/`h`/`rotada`/`l1`/`l2`/`a1`/`a2` sobre las piezas del `board`, y la reconstrucción de `freeRects` vía `recalcularFreeRectsDesdeCero`. Esto SÍ ocurre en las siete acciones de esta tabla.
- **RECÁLCULO DEL PROYECTO** — `recalcular()`, que reconstruye `state.boards` desde cero con `empacarMaterial()` y actualiza el costo. Ninguna de las siete acciones de esta tabla lo dispara (ver hallazgo arriba).

No confundir estas tres capas al modificar código: un cambio que solo debería tocar la interacción visual (por ejemplo, el umbral del imán) no debería terminar alterando cómo se reconstruye la geometría, y viceversa.

## Dependencia de `board._geom.scale`

Solo el manejador de arrastre (`activarPiezasArrastrables`) convierte coordenadas: `dxMm = dxSvg / scale`, usando el `board._geom` escrito por `dibujarBoard` (ver `proycut-board-rendering`). Las demás seis acciones (rotar, espejar×2, compactar×4) operan directamente en milímetros sobre `board.pieces`, sin conversión de unidades — no la necesitan porque no reciben coordenadas de pantalla.

## No convertir UI en dominio

Estas funciones mutan directamente objetos `board` que son estructuras de dominio (salida del optimizador), pero son **disparadas por interacción de UI** (clic, arrastre). No mover esta lógica a un módulo de dominio "porque conceptualmente pertenece ahí" sin que el usuario lo pida — hoy vive intencionalmente junto al manejo de eventos en `main.js`, y `44-CURRENT-ARCHITECTURE-INVENTORY.md` la marca explícitamente como "no mover ahora" (ver `proycut-architecture`, `proycut-sheet-optimizer`).

## Verificaciones obligatorias

- `node --check` sobre `main.js` si se modifica.
- Ejecutar en navegador los casos `DIAG-01` a `DIAG-06` de `12-MANUAL-TESTS.md`.
- Confirmar explícitamente, tras cualquier cambio, si el costo mostrado en pantalla sigue sin actualizarse tras una interacción manual (o si el cambio lo modificó intencionalmente y de forma aprobada).
- Ver `proycut-regression-matrix` → fila "Interacciones del board".

## Condiciones para detenerse y pedir aclaración

- La tarea pide que una interacción manual dispare recálculo de costo — es un CAMBIO FUNCIONAL, no una corrección; confirmar con el usuario antes de aplicarlo.
- No es claro si un cambio en el manejador de arrastre requiere también actualizar `board._geom` en `proycut-board-rendering`.
- La tarea pide mover esta lógica fuera de `main.js` sin que sea el objetivo explícito de la tarea.
