# 49 — Reporte de Skills de geometría, optimizador y costeo

## Estado

Propuesto para revisión.

## Versión

1.0

## Última actualización

2026-08-18

## Propósito

Documentar la creación de cuatro Agent Skills que capturan contratos técnicos reales de los subsistemas de geometría, rectángulos libres, optimizador de corte y costeo de ProyCut, verificados por lectura directa de código en esta tarea (no por memoria ni por documentación previa sin contrastar). No reemplaza el contenido de cada `SKILL.md`.

---

## 1. Skills creadas

| Skill | Ruta | Cubre |
|---|---|---|
| `proycut-cutting-geometry` | `.agents/skills/proycut-cutting-geometry/SKILL.md` | `geometry/basic-geometry.js`, `board-area.js`, `board-analysis.js` |
| `proycut-free-rectangles` | `.agents/skills/proycut-free-rectangles/SKILL.md` | `geometry/free-rectangles.js` |
| `proycut-sheet-optimizer` | `.agents/skills/proycut-sheet-optimizer/SKILL.md` (+ `references/optimizer-map.md`) | Algoritmo de empaquetado y edición interactiva de boards, todavía en `main.js` |
| `proycut-costing` | `.agents/skills/proycut-costing/SKILL.md` | `costing/calculate-costs.js` |

Solo `proycut-sheet-optimizer` usa `references/`, por ser el subsistema con más funciones, estructuras y líneas de código involucradas (algoritmo de empaquetado + 9 funciones de edición interactiva). Ninguna Skill incluye scripts ejecutables.

## 2. Archivos de código inspeccionados

- `src/scripts/geometry/basic-geometry.js` (completo)
- `src/scripts/geometry/board-area.js` (completo)
- `src/scripts/geometry/board-analysis.js` (completo)
- `src/scripts/geometry/free-rectangles.js` (completo)
- `src/scripts/costing/calculate-costs.js` (completo)
- `src/scripts/project/optimize-project.js` (completo)
- `src/scripts/project/apply-project-results.js` (completo)
- `src/scripts/main.js` — bloque de importación de módulos (líneas 1–110), función `leerPiezas` (3422–3503), bloque completo del optimizador y edición interactiva (3505–4423), función `recalcular()` (4476–4579)
- `src/scripts/svg/board-renderer.js` — grep dirigido a `_geom`/`scale` para confirmar el contrato px↔mm

Documentación: `docs/engineering/05-ARCHITECTURE.md`, `08-ENGINEERING-HANDBOOK.md`, `10-CURRENT-STATE.md`, `12-MANUAL-TESTS.md`, `44-CURRENT-ARCHITECTURE-INVENTORY.md`, y las cuatro Skills core (`proycut-architecture`, `proycut-safe-change`, `proycut-domain-rules`, `proycut-regression-matrix`).

## 3. Contratos confirmados (hallazgos verificados, no inferidos)

- **`compactarHaciaAbajo` es automático, no solo manual.** `optimize-project.js` línea 51 lo llama sobre cada `board` resultante en cada ejecución de `empacarMaterial`, como parte del pipeline normal. No es únicamente una acción del menú "Espejo" — dato no documentado explícitamente en los reportes previos.
- **Ninguna acción de edición interactiva dispara recálculo de costo.** Confirmado leyendo completas `rotarPieza`, `espejarBoard`, `espejarBoardHorizontal`, `compactarHaciaAbajo/Arriba/Izquierda/Derecha` y el manejador de drag: todas terminan en `recalcularFreeRectsDesdeCero` (+ `renderDiagrama` en drag/rotar por botón), ninguna llama `recalcular()`. Esto convierte en confirmado-por-lectura lo que `10-CURRENT-STATE.md` sección 17 marcaba como "pendiente de verificar" — la confirmación por **ejecución en navegador** sigue pendiente.
- **`rotarPieza` no reescribe `l1/l2/a1/a2`; `espejarBoard`/`espejarBoardHorizontal` sí.** Confirmado por lectura línea a línea de las cuatro funciones.
- **Contrato px↔mm real:** `board._geom = {scale, margenIzq, margenSup}`, escrito por `dibujarBoard` (`svg/board-renderer.js` línea 248); `scale` = px disponibles / `board.boardW` (mm). Único punto de conversión confirmado: el manejador de arrastre (`dxMm = dxSvg / scale`).
- **Duplicación real, no solo teórica:** `empacarConLista` y `empacarConListaLibre` (`main.js`) definen copias locales de `contenido`/`podarContenidos` (y `empacarConListaLibre` también `recortarLibre`/`seTraslapan`) en vez de reutilizar `geometry/free-rectangles.js`. Verificado con `grep` de los call-sites reales de las funciones exportadas por ese módulo dentro de `main.js`: solo `calcularRectsLibresDesdeObstaculos` se usa directamente allí (en `reconstruirSobrantesYFronteras`); las demás funciones destructuradas al inicio del archivo no tienen call-sites propios detectados.
- **`calculate-costs.js` es puro por declaración textual del propio código** (comentario líneas 8–13), verificable porque no contiene ninguna referencia a `document`/`state`/`localStorage` y no reasigna ningún parámetro recibido.
- **`cantidadProyectos` se aplica dos veces, en dos lugares distintos, por diseño:** una vez dentro de `leerPiezas()` (expande piezas), otra vez dentro de `calcularCostosProyecto` (solo para `componentesProyecto`, que no pasa por `leerPiezas`). No es doble conteo accidental.
- **Fórmulas de costo confirmadas con línea exacta** para material, componentes, corte y tapacanto (ver `proycut-costing/SKILL.md`), incluyendo el patrón de fallback `precio:0` cuando un nombre ya no existe en catálogo.
- **`obtenerKerfMaterial` toma el máximo**, no el primero ni el promedio, de cada uno de los 4 valores de kerf entre todas las piezas de un material.
- **`podarRectsContenidos` tiene una regla de desempate real y determinista:** entre dos rectángulos que se contienen mutuamente (iguales), conserva el de índice menor en el arreglo de entrada.

## 4. Contratos que no pudieron confirmarse

- **Determinismo end-to-end observado en navegador.** El generador aleatorio es determinista por lectura del algoritmo (sin `Math.random`, sin reloj), pero `OPT-08` (`12-MANUAL-TESTS.md`) sigue en estado `NOT RUN` — no hay confirmación por ejecución real.
- **Si el Excel/DXF exportado refleja una edición manual del diagrama o el resultado original del optimizador.** Fuera del alcance de esta tarea (pertenece a los subsistemas de exportación, no a geometría/optimizador/costeo); se documenta como límite conocido heredado de `10-CURRENT-STATE.md` sección 17.
- **Comportamiento exacto de `activarPiezasArrastrables` bajo condiciones de carrera** (mousedown/mousemove muy rápidos) — no ejecutado en navegador durante esta tarea.
- **Si el área total tras `calcularRectsLibresDesdeObstaculos` se conserva exactamente frente a obstáculos que se solapan entre sí** — no se ejecutó ninguna prueba con ese caso límite específico; se documentó como propiedad sugerida a verificar manualmente, no como hecho confirmado.

## 5. Diferencias entre estado actual y arquitectura objetivo

| Subsistema | Estado actual (verificado) | Arquitectura objetivo (documentada) |
|---|---|---|
| Geometría básica y análisis de tablero | Módulos puros ya extraídos a `src/scripts/geometry/` | Ya alineado; sin brecha relevante |
| Rectángulos libres | Módulo puro ya extraído, pero duplicado localmente en `main.js` | `05-ARCHITECTURE.md` no prescribe duplicación; la extracción ya ocurrió, falta que el optimizador la reutilice — no se propone hacerlo de oficio |
| Optimizador de empaquetado | Vive en `main.js`, mezclado con el resto de la coordinación; determinista pero no versiona sus parámetros en el resultado | `05-ARCHITECTURE.md` sección 36: motor independiente de interfaz, con entrada/salida versionada; `44-CURRENT-ARCHITECTURE-INVENTORY.md` marca esta extracción como "riesgo muy alto" y "no mover ahora" |
| Edición interactiva de boards | Vive en `main.js`, acoplada al DOM/SVG | Mismo estado que el optimizador; no extraída, no se propone extraer |
| Costeo | Ya extraído como módulo puro; único consumidor es `recalcular()` | Ya alineado con `05-ARCHITECTURE.md` sección 37 (cálculos centralizados, entradas/unidades explícitas) |

## 6. Dry runs

**A — "Cambiar la fórmula para calcular la huella de una pieza girada."**
Activa: `proycut-cutting-geometry` (huella/rotación viven en `basic-geometry.js`/`board-analysis.js`), `proycut-domain-rules` (confirmar que no es una regla inventada), `proycut-safe-change` (cambio funcional, requiere aprobación), `proycut-regression-matrix` (verificación del subsistema geometría). Coincide con lo esperado.

**B — "Cambiar la forma en que se fusionan rectángulos libres."**
Activa: `proycut-free-rectangles` (dueño de `fusionarRectsAdyacentes`), `proycut-cutting-geometry` (por la relación con `board-analysis.js`, que consume el resultado), `proycut-safe-change`, `proycut-regression-matrix`. Coincide con lo esperado.

**C — "Que el optimizador use una heurística distinta para elegir el siguiente rectángulo."**
Activa: `proycut-sheet-optimizer`, `proycut-safe-change`, `proycut-regression-matrix`. Marcado explícitamente como **CAMBIO FUNCIONAL** en `proycut-sheet-optimizer` (sección "Advertencias obligatorias": cambios de heurística cambian qué acomodo gana). Coincide con lo esperado.

**D — "Cambiar el cálculo del costo total del proyecto."**
Activa: `proycut-costing`, `proycut-domain-rules`, `proycut-safe-change`, `proycut-regression-matrix`. Marcado explícitamente como **CAMBIO FUNCIONAL** en `proycut-costing` (sección "Advertencia obligatoria"). Coincide con lo esperado.

## 7. Riesgos

- Un agente futuro podría asumir que, por existir `proycut-free-rectangles.js` como módulo, el optimizador ya lo reutiliza — la duplicación documentada en la sección 3 hace explícito que no es así, para evitar ese error.
- El hallazgo de que ninguna edición interactiva recalcula costo podría malinterpretarse como un bug a corregir; ambas Skills nuevas (`proycut-sheet-optimizer`) y las core (`proycut-safe-change`) advierten explícitamente que no debe "corregirse" de oficio.
- La matriz de kerf (4 valores derivados, tomados como máximo por material) es fácil de simplificar por error al tocar `obtenerKerfMaterial`; se documentó la regla exacta (`Math.max`, no primero/promedio).
- El `references/optimizer-map.md` puede quedar desactualizado si `main.js` se reorganiza (números de línea aproximados); se marcó explícitamente como "aprox." para que un agente futuro no confíe ciegamente en el número de línea sin releer el archivo.

## 8. Siguientes Skills recomendadas

- `proycut-export-contracts` — contratos de exportación DXF/Excel (formato R12/AC1009, capas, CRLF, hojas versionadas), ya recomendada en el reporte anterior (`48-...md`) y aún pendiente.
- `proycut-catalog-identity` — manejo de SKU/`idInterno`/nombre en catálogos, señalado como módulo sensible en `44-CURRENT-ARCHITECTURE-INVENTORY.md`.
- `proycut-board-interaction-ui` — específica para el SVG interactivo (`svg/board-renderer.js` + el bloque de drag/rotar/espejar/compactar de `main.js`) si en el futuro se extrae de `main.js`; por ahora su contrato vive dentro de `proycut-sheet-optimizer` porque ambos comparten el mismo archivo fuente y el mismo riesgo de regresión.

## 9. Verificación final

```text
git diff --check       → sin salida (sin problemas de espacios en blanco)
git status --short     → solo directorios nuevos bajo .agents/skills/ y este reporte
```

Código de producción modificado: NO. Scripts ejecutables nuevos: NO. Commit: NO. Push: NO.
