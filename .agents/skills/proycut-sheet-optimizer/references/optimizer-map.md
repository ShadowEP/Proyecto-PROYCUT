# Mapa técnico del optimizador (estado real)

Todas las líneas referidas son de `src/scripts/main.js` salvo que se indique lo contrario. Verificado por lectura directa del código en esta tarea.

## Estructura de una pieza de entrada (confirmada en `leerPiezas`, líneas ~3491–3499)

```text
{
  num, label, l, a, girarModo,       // girarModo: 'auto' | 'normal' | 'rotado'
  material, tapaTipo, l1, l2, a1, a2,
  kerfEfectivo,
  kerfEntrePiezasEfectivo,
  kerfPiezaSobranteEfectivo,
  kerfBordeExteriorEfectivo
}
```

Una entrada por unidad física ya expandida por cantidad (el `for(let i=0;i<cant;i++)` de `leerPiezas` empuja una copia por unidad).

## Estructura de `datosTablero` (confirmada en `optimize-project.js`, líneas 33–43)

```text
{
  boardW, boardH,
  areaUtil, areaColocacion,          // rects {x,y,w,h}
  margenes,
  kerfValor, kerfEntrePiezas, kerfPiezaSobrante, kerfBordeExterior
}
```

Construido una vez por cada grupo de material, antes de llamar `empacarMaterial`.

## Estructura de un `board` de salida

```text
{
  freeRects[], pieces[], cortes, corteMm,
  boardW, boardH, areaUtil, areaColocacion, margenes,
  kerf, kerfEntrePiezas, kerfPiezaSobrante, kerfBordeExterior,
  materialLabel, indexEnMaterial,     // asignados por optimize-project.js
  fronterasKerf: {entrePiezas, piezaSobrante, exterior},  // asignado por reconstruirSobrantesYFronteras
  areaSobranteMm2,                    // idem
  _geom: {scale, margenIzq, margenSup}  // asignado por svg/board-renderer.js al dibujar, no por el optimizador
}
```

`board.pieces[i]` conserva **todos** los campos originales de la pieza de entrada más `{x, y, w, h, rotada}` (spread explícito `{...p, x, y, w, h, rotada}`, no una copia parcial).

Estado interno transitorio **solo** dentro de `empacarConLista` (no sobrevive como campo relevante fuera del propio bucle de colocación, y no existe en `empacarConListaLibre`): `ultimaClaveTam`, `huecosRecientes`, `ultimaPos`.

## Función por función

| Función | Línea aprox. | Rol |
|---|---|---|
| `pseudoAleatorio(semilla)` | 3516 | Generador congruencial lineal determinista |
| `barajar(lista, semilla)` | 3523 | Fisher-Yates con el generador anterior |
| `empacarMaterial(piezas, kerf, libre, nivel, datosTablero)` | 3548 | Punto de entrada; prueba criterios + semillas, se queda con el mejor (`evaluar`), llama `reconstruirSobrantesYFronteras` sobre el resultado final |
| `empacarConListaLibre(...)` | 3621 | Empaquetador modo libre (huecos en "L"); define copias locales de utilidades de rectángulos libres |
| `empacarConLista(...)` | 3761 | Empaquetador modo guillotina (corte de lado a lado); implementa amarre de orientación, prioridad de adyacencia/tanda |
| `reconstruirSobrantesYFronteras(board)` | 4061 | Reconstruye `freeRects`/`fronterasKerf`/`areaSobranteMm2` desde las posiciones reales de las piezas |
| `recalcularFreeRectsDesdeCero(board)` | 4079 | Alias que llama a la anterior; usado tras cualquier edición manual |
| `piezasSeEncimanConOtras(...)` | 4086 | Detección de colisión con colchón `EPS=0.5` mm, usado por rotar/drag |
| `rotarPieza(board, idx)` | 4108 | Ver invariantes en `SKILL.md` |
| `espejarBoard(board)` | 4158 | Volteo vertical; intercambia `l1/l2` o `a1/a2` según orientación |
| `compactarHaciaAbajo(board)` | 4180 | "Gravedad" hacia abajo; parte automática del pipeline vía `optimize-project.js` |
| `compactarHaciaArriba(board)` | 4206 | "Gravedad" hacia arriba; solo manual (menú Espejo) |
| `espejarBoardHorizontal(board)` | 4231 | Volteo horizontal; intercambia el par lógico opuesto a `espejarBoard` |
| `compactarHaciaIzquierda(board)` | 4249 | Solo manual |
| `compactarHaciaDerecha(board)` | 4273 | Solo manual |
| `calcularImanes(board, idxPropio, kerf, w, h, x, y)` | 4301 | Snap al soltar un drag, umbral 18 mm |
| `activarPiezasArrastrables(board, kerf)` | 4346 | Engancha mousedown/mousemove/mouseup sobre el SVG; usa `board._geom.scale` para convertir px→mm |

## Pipeline de invocación confirmado

```text
main.js: recalcular()
  → prepararProyectoParaOptimizacion (project/prepare-project.js)
      → leerPiezas()
  → optimizarProyectoPreparado (project/optimize-project.js)
      → por cada material: calcularRectanguloUtilTablero/Colocacion, obtenerKerfMaterial
      → empacarMaterial(...)  [main.js]
      → compactarHaciaAbajo(board)  para CADA board, siempre
  → aplicarResultadoOptimizacion (project/apply-project-results.js)
      → state.boards = boards; renderDiagrama()
  → calcularCostosProyecto (costing/calculate-costs.js)
  → aplicarResultadoCostos (project/apply-project-results.js)
```

Ninguna función de edición interactiva (`rotarPieza`, `espejarBoard*`, `compactarHacia*` manual, drag) reingresa a este pipeline — todas terminan en `recalcularFreeRectsDesdeCero` + `renderDiagrama`, sin volver a `recalcular()`.
