---
name: proycut-sheet-optimizer
description: "Contratos técnicos reales del optimizador de corte de ProyCut: empacarMaterial/empacarConLista/empacarConListaLibre (todavía en src/scripts/main.js, no extraídos) y la edición interactiva de boards (rotar, espejar, compactar, imanes, drag). Activar antes de modificar heurísticas, orden de piezas, criterios de desempate, o el comportamiento de mover/rotar/espejar/compactar una pieza en el diagrama. Distingue implementación actual de dirección arquitectónica deseada. No cubre las primitivas geométricas puras (usar proycut-cutting-geometry o proycut-free-rectangles) ni el costeo (usar proycut-costing)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Optimizador de tableros

## Cuándo se activa

- Modificar `empacarMaterial`, `empacarConLista`, `empacarConListaLibre`, `pseudoAleatorio`, `barajar` en `src/scripts/main.js` (líneas ~3516–4059 al momento de esta Skill).
- Modificar `src/scripts/project/optimize-project.js`.
- Modificar la edición interactiva de un tablero: `rotarPieza`, `espejarBoard`, `espejarBoardHorizontal`, `compactarHaciaAbajo/Arriba/Izquierda/Derecha`, `calcularImanes`, `activarPiezasArrastrables`, `piezasSeEncimanConOtras`, `recalcularFreeRectsDesdeCero`, `reconstruirSobrantesYFronteras` (líneas ~4061–4423 de `main.js`).
- Cambiar cualquier heurística: criterios de orden, semillas, amarre de orientación, prioridad de colocación, tie-breakers.

## Cuándo NO se activa

- Las primitivas geométricas puras (área útil, huella, capacidad lineal) → `proycut-cutting-geometry`.
- El algoritmo de intersección/resta/poda/fusión de rectángulos libres en sí → `proycut-free-rectangles` (el optimizador lo consume, pero no lo implementa — salvo las copias locales duplicadas, ver abajo).
- Fórmulas de costo → `proycut-costing`.

## Documentos y código canónicos

- `src/scripts/main.js` — implementación real del algoritmo (**no extraída todavía**; confirmado por búsqueda directa en esta tarea).
- `src/scripts/project/optimize-project.js` — coordinador que agrupa por material y llama al algoritmo de `main.js` por inyección de dependencias.
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md`, sección 10 — clasifica el algoritmo concreto y la edición de boards como **"riesgo muy alto"**, explícitamente marcados como "no tocar/no mover ahora".
- `docs/engineering/05-ARCHITECTURE.md`, sección 36 — arquitectura **objetivo** del motor de optimización (ver "Dirección arquitectónica deseada" abajo).
- `docs/engineering/10-CURRENT-STATE.md`, secciones 13 y 17 — comportamiento documentado, incluyendo lo "pendiente de verificar por ejecución".
- Ver `references/optimizer-map.md` para las estructuras completas de entrada/salida y el mapa función por función.

## IMPLEMENTACIÓN ACTUAL (confirmada por lectura directa del código en esta tarea)

- **Entrada:** `empacarMaterial(piezas, kerf, libre, nivel, datosTablero)`. `piezas` ya viene expandida y filtrada por `leerPiezas()` (una entrada por unidad física, no agrupada por cantidad).
- **Selección de resultado:** prueba 4 criterios de orden fijo (6 en nivel `'completa'`) más 6 órdenes aleatorios con semilla fija (14 en `'completa'`), corre el empaquetador elegido (`empacarConLista` o `empacarConListaLibre`) para cada uno, y se queda con el que use **menos tableros** y, en empate, **menos cortes totales** (`evaluar()`, `main.js` ~3582–3592).
- **Determinismo:** `pseudoAleatorio`/`barajar` usan un generador congruencial lineal (`s = (s*1664525+1013904223) >>> 0`) sembrado con `semilla*97+1` — sin `Math.random()`, sin reloj, sin estado externo. Esto es determinismo **verificado por lectura del algoritmo**, distinto de determinismo **observado en navegador** (`OPT-08` en `12-MANUAL-TESTS.md` sigue `NOT RUN`).
- **Amarre de orientación:** en modo `'auto'` con `permitirMezclaOrientacion=false` (niveles `normal`/`optimizada`), todas las copias de un mismo tamaño de pieza (≥2 copias) quedan forzadas a la misma orientación, decidida de antemano por capacidad en cuadrícula simple. En `'completa'` (`permitirMezclaOrientacion=true`) este amarre se desactiva.
- **Prioridad de colocación (`empacarConLista`, modo guillotina):** 1) intenta pegar junto a la última pieza del mismo tamaño colocada; 2) si no, busca en todos los huecos abiertos, priorizando mayor capacidad en cuadrícula y menor distancia de adyacencia para piezas en tanda repetida, o menor sobrante lateral para piezas sueltas.
- **`empacarConListaLibre` (modo libre):** recorta **todos** los huecos que se traslapan con la pieza colocada (no solo el elegido); puede producir huecos en "L"; define copias **locales** de `contenido`/`podarContenidos`/`recortarLibre`/`seTraslapan` en vez de reutilizar `proycut-free-rectangles` (ver esa Skill, sección "Duplicación conocida").
- **Post-procesamiento automático — hecho crítico verificado:** `optimize-project.js` línea 51 llama `compactarHaciaAbajo(board)` sobre **cada** tablero resultante, **siempre**, como parte del pipeline normal — no es una acción opcional del menú "Espejo". El resultado que ve el usuario ya pasó por esta compactación antes de aplicarse a `state.boards`.
- **Reconstrucción de sobrantes:** dentro de `empacarMaterial` (línea 3612), `reconstruirSobrantesYFronteras(board)` se llama sobre cada board del mejor resultado — el `freeRects` final considera fronteras de kerf (entre piezas, alrededor de pieza sobrante, exteriores), no es el `freeRects` "crudo" del empaquetado.

### Edición interactiva — confirmado por lectura directa en esta tarea

- **`rotarPieza`**: intenta mantener la posición actual; si no cabe, busca en huecos libres reales; si nada funciona, no modifica la pieza. Llama `recalcularFreeRectsDesdeCero`. **No** llama a `recalcular()` (el ciclo de costeo) — confirmado leyendo la función completa, no solo por inferencia. **No** reescribe `l1/l2/a1/a2` tras rotar.
- **`espejarBoard`/`espejarBoardHorizontal`**: **sí** intercambian `l1/l2` (volteo vertical) o `a1/a2` (volteo horizontal) explícitamente. Tampoco llaman a `recalcular()`.
- **`compactarHaciaAbajo/Arriba/Izquierda/Derecha`**: mueven piezas en un solo eje, sin rotar/voltear, sin tocar `l1/l2/a1/a2`. Tampoco llaman a `recalcular()`. `compactarHaciaAbajo` es además parte automática del pipeline (ver arriba); las otras tres son solo acciones manuales del menú "Espejo".
- **`calcularImanes`** (al soltar un drag): ajusta la posición dentro de un umbral de 18 mm respetando kerf; si la posición imantada encima con otra pieza, usa la posición sin imán; si tampoco es válida, la pieza no se mueve. El manejador de arrastre siempre llama `recalcularFreeRectsDesdeCero` + `renderDiagrama`, nunca `recalcular()`.

**Conclusión verificada:** ninguna acción de edición interactiva (mover, rotar, espejar, compactar manual) dispara el recálculo de costo. Esto coincide con lo que `10-CURRENT-STATE.md` sección 17 marcaba como "pendiente de verificar por lectura" — aquí queda **confirmado por lectura directa del código en esta tarea**, aunque la confirmación por **ejecución en navegador** (`DIAG-01` a `DIAG-03` de `12-MANUAL-TESTS.md`) sigue pendiente. No tratar esto como un bug a corregir de oficio.

## DIRECCIÓN ARQUITECTÓNICA DESEADA (objetivo, no implementada)

- `44-CURRENT-ARCHITECTURE-INVENTORY.md` marca el algoritmo concreto y la edición de boards como candidatos de extracción **futura**, explícitamente "no mover ahora" por su riesgo de regresión. No proponer su extracción de `main.js` como si fuera el siguiente paso obvio de cualquier tarea.
- `05-ARCHITECTURE.md` sección 36 describe un motor de optimización objetivo: independiente de interfaz, con entrada/salida versionada y reproducible. El código actual **ya es determinista** (semilla fija, verificado arriba) pero **no** está separado de la interfaz (vive en `main.js`, junto a DOM) ni versiona explícitamente sus parámetros en el resultado. Esta es una brecha real, no algo ya resuelto.

## Advertencias obligatorias

- Cambios en **heurísticas** (criterios de orden, capacidad, adyacencia, amarre de orientación) son **cambios funcionales**: cambian qué acomodo gana, no solo cómo se calcula.
- Cambios en el **orden** de piezas (criterios fijos o `barajar`) pueden cambiar qué resultado "gana" en `evaluar()` aunque el algoritmo interno no cambie.
- Cambios en **tie-breakers** (menos cortes en empate de tableros, `shortSide`/`longSide`, capacidad/adyacencia) pueden alterar resultados en casos límite aunque parezcan solo "orden de comparación".
- Los refactors del optimizador requieren comparar **estructuras/resultados equivalentes** (número de tableros, desperdicio total, posiciones `x/y/w/h/rotada` de cada pieza) contra los "Datos de referencia" de `10-CURRENT-STATE.md` sección 18. **Byte-equivalence no aplica**: los boards son objetos JS en memoria, no hay una salida serializada canónica — lo que se compara es la estructura resultante, ejecutada en navegador.
- **No "optimizar mejor"** (cambiar una heurística para reducir desperdicio) sin aprobación explícita — es exactamente el tipo de cambio funcional que este dominio prohíbe hacer de oficio.
- El determinismo del generador aleatorio es un hecho verificado por lectura del algoritmo (sección anterior); no extender esa certeza a "todo el pipeline es determinista end-to-end" sin la confirmación por ejecución que sigue pendiente.

## Verificaciones obligatorias

- `node --check` sobre `src/scripts/main.js` y `src/scripts/project/optimize-project.js` si se modifican.
- Ejecutar en navegador los casos `OPT-01` a `OPT-08` y `DIAG-01` a `DIAG-06` de `12-MANUAL-TESTS.md` relevantes al cambio.
- Comparar tableros/desperdicio/posiciones contra los "Datos de referencia" de `10-CURRENT-STATE.md` sección 18 cuando existan.
- Ver `proycut-regression-matrix` → filas "Optimizador (empaquetado)" e "Interacciones del board".

## Condiciones para detenerse y pedir aclaración

- La tarea pide cambiar una heurística o el orden/tie-breakers sin que el usuario haya aprobado explícitamente que es un cambio funcional.
- La tarea pide extraer el algoritmo o la edición de boards de `main.js` como parte de un cambio no solicitado explícitamente para eso.
- No es posible comparar el resultado antes/después porque no hay navegador disponible en la sesión — declarar la limitación, no asumir que el resultado es correcto.
