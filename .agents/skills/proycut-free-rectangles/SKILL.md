---
name: proycut-free-rectangles
description: "Contratos técnicos reales del algoritmo de rectángulos libres de ProyCut (src/scripts/geometry/free-rectangles.js): intersección, resta de obstáculo, poda de contenidos, fusión de adyacentes y cálculo de rectángulos libres desde obstáculos. Activar antes de modificar este archivo o cualquier lugar que reimplemente su lógica. No cubre la heurística de qué hueco elegir para colocar una pieza (usar proycut-sheet-optimizer) ni el área útil/de colocación del tablero (usar proycut-cutting-geometry)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Rectángulos libres

## Cuándo se activa

- Modificar `src/scripts/geometry/free-rectangles.js`.
- Modificar cualquier código que reimplemente localmente esta misma lógica (ver "Duplicación conocida" abajo).
- Cambiar el comportamiento de poda, fusión o resta de rectángulos libres en cualquier consumidor.

## Cuándo NO se activa

- Decidir en cuál rectángulo libre colocar una pieza, orden de piezas, criterios de desempate del optimizador → `proycut-sheet-optimizer`.
- Área útil/de colocación del tablero, huella de pieza, capacidad lineal → `proycut-cutting-geometry`.

## Documento y código canónico

- `src/scripts/geometry/free-rectangles.js` — único archivo fuente de este algoritmo. Exporta `interseccionRectangulos`, `restarObstaculoRectangular`, `rectContenidoEn`, `podarRectsContenidos`, `fusionarRectsAdyacentes`, `calcularRectsLibresDesdeObstaculos`.
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` — clasifica este archivo como módulo puro y estable.

## Responsabilidades reales confirmadas

- **`interseccionRectangulos(a, b)`** — retorna `null` si el traslape en cualquier eje es `<= 0.001`; si no, `{x,y,w,h}` de la intersección. Contacto exacto de borde (traslape = 0) **no** cuenta como intersección.
- **`restarObstaculoRectangular(rect, obstaculo)`** — si no hay intersección, retorna `[rect]` sin modificar. Si hay, retorna hasta 4 regiones (arriba/abajo/izquierda/derecha) que **no se traslapan entre sí**; cada región solo se agrega si su medida es `> 0.001`.
- **`rectContenidoEn(a, b)`** — `true` si `a` cabe completamente dentro de `b`, con tolerancia `0.001` en los 4 bordes.
- **`podarRectsContenidos(rects)`** — elimina rectángulos dominados (contenidos en otro). **Regla de empate real:** cuando dos rectángulos se contienen mutuamente (son iguales), se conserva el de **índice menor** en el arreglo de entrada (`if(j<i){dominado=true;break;} continue;`) — esto es observable y determinista, no arbitrario.
- **`fusionarRectsAdyacentes(rects)`** — fusiona iterativamente (bucle "hasta que no cambie más") pares que comparten el mismo ancho y son verticalmente adyacentes (gap `< 0.5` mm), o el mismo alto y horizontalmente adyacentes. Existe explícitamente para evitar que un mismo hueco real quede partido en fragmentos por haber sido recortado por piezas distintas por separado (comentario del código).
- **`calcularRectsLibresDesdeObstaculos(area, obstaculos)`** — parte de `[area]` completo, resta cada obstáculo de la lista secuencialmente, y al final aplica `podarRectsContenidos` seguido de `fusionarRectsAdyacentes`. Es la función pública principal; las demás son sus piezas internas (también exportadas).

## Invariantes a proteger

- No crear rectángulos con `w<=0` o `h<=0` — toda función filtra por `> 0.001`.
- No aceptar solapes ficticios: un traslape `<= 0.001` en cualquier eje se trata como "no hay intersección".
- Preservar la regla de desempate de `podarRectsContenidos` (conservar el de índice menor entre iguales) si se refactoriza — el resultado observable depende de ella.
- No cambiar el umbral de adyacencia (`0.5` mm) de `fusionarRectsAdyacentes` sin evidencia — afecta directamente qué sobrantes se muestran como "un solo hueco" vs. varios en el diagrama y el reporte de sobrantes aprovechables (impacto visible al usuario, no solo interno).
- El contacto por borde (piezas o huecos que se tocan sin traslaparse) **no** cuenta como intersección — no cambiar esta semántica sin evidencia explícita de que el comportamiento actual es incorrecto.
- La poda de contenidos/duplicados existe porque el diagrama y "Sobrantes aprovechables" dependen de ella para no mostrar el mismo hueco dos veces — no es solo una optimización interna descartable.

## Ausencia de validación de tipos (hallazgo, no bug a corregir de oficio)

A diferencia de `basic-geometry.js` (que valida `Number.isFinite` explícitamente), `free-rectangles.js` **no** valida que `x/y/w/h` sean números finitos antes de operar. Esto es un hecho verificado por lectura del código, no una suposición. No "corregirlo" agregando validaciones nuevas sin que el usuario lo pida — podría cambiar comportamiento observable (por ejemplo, silenciar un `NaN` que hoy se propaga visiblemente).

## Duplicación conocida (no unificar sin aprobación)

`main.js` — dentro de `empacarConLista` (línea ~3879) y `empacarConListaLibre` (línea ~3645) — define **copias locales** de una función `contenido(a,b)` casi idéntica a `rectContenidoEn`, y `podarContenidos(freeRects)` casi idéntica a `podarRectsContenidos`, en vez de reutilizar este módulo. `empacarConListaLibre` también define su propio `recortarLibre` y `seTraslapan`, con lógica similar pero no idéntica a `restarObstaculoRectangular`/`interseccionRectangulos`.

Esto es un hecho verificado por lectura directa, no una sugerencia de unificarlas. Si una tarea futura modifica `free-rectangles.js` asumiendo que el optimizador ya usa esas funciones, va a fallar en silencio: el optimizador seguirá usando su copia local. Señalar esta duplicación al usuario si es relevante para la tarea; no eliminarla de oficio (ver `proycut-safe-change`).

## No "mejorar" el algoritmo

Esta Skill documenta el algoritmo tal como existe. No propone una implementación más eficiente, ni un enfoque distinto (por ejemplo, un árbol de particiones en vez de resta+poda+fusión). Cualquier cambio de enfoque algorítmico es un cambio funcional/arquitectónico que requiere aprobación explícita.

## Invariantes sugeridas basadas en propiedades (verificación manual, no framework)

Al modificar este archivo, verificar manualmente con datos de prueba (por ejemplo un script desechable con `node` en el scratchpad) que se cumplan:

- Ningún rectángulo libre resultante excede los límites del área original.
- Dos rectángulos libres resultantes no se solapan entre sí en más de la tolerancia (`0.001`).
- `podarRectsContenidos` aplicado dos veces seguidas da el mismo resultado que aplicado una vez (idempotencia).
- El área total cubierta por los rectángulos libres resultantes más el área de los obstáculos efectivamente restados (dentro de los límites del área) se aproxima al área original — útil para detectar errores grandes, no una igualdad exacta garantizada por redondeos y solapes entre obstáculos.

No instalar ni proponer un framework de property-based testing (no existe infraestructura de pruebas automatizadas en este repositorio — ver `proycut-regression-matrix`).

## Verificaciones obligatorias

- `node --check` sobre el archivo modificado.
- Verificación manual de las propiedades de la sección anterior con al menos un caso de obstáculos múltiples y uno de obstáculos adyacentes/contenidos.
- Confirmar en el navegador (`proycut-regression-matrix`) que "Sobrantes aprovechables" y el diagrama siguen sin mostrar huecos duplicados ni fragmentados donde antes no los mostraban (casos `OPT-01`, `OPT-02`, `DIAG-04` de `12-MANUAL-TESTS.md`).

## Condiciones para detenerse y pedir aclaración

- La tarea pide "unificar" las copias locales de `main.js` con este módulo — es un cambio de alcance mayor al de un ajuste puntual; confirmar con el usuario antes de tocar el optimizador.
- No es claro si un caso límite nuevo (por ejemplo, obstáculos que se solapan entre sí) ya está cubierto por el algoritmo actual o requiere una decisión de diseño nueva.
