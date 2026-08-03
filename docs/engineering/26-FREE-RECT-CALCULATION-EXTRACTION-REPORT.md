# 26-FREE-RECT-CALCULATION-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción de `calcularRectsLibresDesdeObstaculos` desde `src/scripts/main.js` hacia `src/scripts/geometry/free-rectangles.js`, completando el módulo de geometría de rectángulos libres iniciado en `docs/engineering/24-FREE-RECTANGLES-EXTRACTION-REPORT.md` y continuado en `docs/engineering/25-RECT-CONTAINMENT-EXTRACTION-REPORT.md`.

## Depende de
`src/scripts/main.js`; `src/scripts/geometry/free-rectangles.js`; `index.html`; `docs/engineering/24-FREE-RECTANGLES-EXTRACTION-REPORT.md`; `docs/engineering/25-RECT-CONTAINMENT-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Evaluar y extraer únicamente `calcularRectsLibresDesdeObstaculos` desde `src/scripts/main.js` hacia el archivo ya existente `src/scripts/geometry/free-rectangles.js`.

# Función evaluada

## `calcularRectsLibresDesdeObstaculos(area, obstaculos)`

Ubicada en `src/scripts/main.js`, línea 4464, sin comentario propio, antes de cualquier edición:

```js
function calcularRectsLibresDesdeObstaculos(area, obstaculos){
  let libres = [{x:area.x, y:area.y, w:area.w, h:area.h}];
  (obstaculos || []).forEach(obstaculo => {
    const siguientes = [];
    libres.forEach(rect => siguientes.push(...restarObstaculoRectangular(rect, obstaculo)));
    libres = siguientes;
  });
  return fusionarRectsAdyacentes(podarRectsContenidos(libres));
}
```

# Dependencias

- `restarObstaculoRectangular(rect, obstaculo)` — ya expuesta en `window.ProyCutFreeRectangles` desde `docs/engineering/24-FREE-RECTANGLES-EXTRACTION-REPORT.md`.
- `podarRectsContenidos(libres)` — ya expuesta en `window.ProyCutFreeRectangles` desde `docs/engineering/25-RECT-CONTAINMENT-EXTRACTION-REPORT.md`.
- `fusionarRectsAdyacentes(...)` — ya expuesta en `window.ProyCutFreeRectangles` desde `docs/engineering/24-FREE-RECTANGLES-EXTRACTION-REPORT.md`.

Las tres dependencias ya viven en el mismo archivo destino (`free-rectangles.js`), por lo que la función puede llamarlas como referencias internas dentro de la misma IIFE, sin necesidad de resolver ningún bloqueo adicional (a diferencia de lo documentado en el reporte 24, donde esta misma función no pudo extraerse porque `podarRectsContenidos` todavía no estaba disponible).

# Evidencia de pureza

| Criterio | Resultado |
|---|---|
| No accede a `document` | Sí (confirmado) |
| No accede a `state` | Sí (confirmado) |
| No accede a `localStorage` | Sí (confirmado) |
| No depende de variables internas no expuestas | Sí — sus tres dependencias ya están expuestas en `window.ProyCutFreeRectangles` |
| Recibe todo por parámetros | Sí (`area`, `obstaculos`) |
| Devuelve un resultado explícito | Sí (arreglo de rectángulos) |
| Depende únicamente de funciones ya expuestas en `window.ProyCutFreeRectangles` | Sí (`restarObstaculoRectangular`, `podarRectsContenidos`, `fusionarRectsAdyacentes`) |
| Sin efectos secundarios globales | Sí — construye `libres` como un arreglo nuevo; `(obstaculos \|\| [])` solo lee, no muta `obstaculos`; no muta `area` |

**Cumple todos los criterios de pureza. Se extrae.**

No hubo ninguna función descartada en esta tarea: la única función evaluada fue confirmada como extraíble.

# Archivos creados

Ninguno. Se usó el archivo ya existente `src/scripts/geometry/free-rectangles.js`, tal como exigía la tarea.

# Archivos modificados

- **`src/scripts/geometry/free-rectangles.js`**: se agregó, después de `podarRectsContenidos` y antes del cierre del objeto exportado, la función extraída (cuerpo, firma, sin comentario propio, igual que en el original). Se amplió el objeto expuesto:
  ```js
  window.ProyCutFreeRectangles = {
    fusionarRectsAdyacentes,
    interseccionRectangulos,
    restarObstaculoRectangular,
    rectContenidoEn,
    podarRectsContenidos,
    calcularRectsLibresDesdeObstaculos
  };
  ```
  Las cinco funciones ya existentes no se modificaron; se verificó por `diff` contra el commit `HEAD` que el rango de líneas 1-104 del archivo permanece idéntico.

- **`src/scripts/main.js`**: se eliminó únicamente la declaración original de `calcularRectsLibresDesdeObstaculos`. Se completó la desestructuración ya existente al inicio de la IIFE, exactamente como especificó la tarea:
  ```js
  const {
    interseccionRectangulos,
    restarObstaculoRectangular,
    fusionarRectsAdyacentes,
    rectContenidoEn,
    podarRectsContenidos,
    calcularRectsLibresDesdeObstaculos
  } = window.ProyCutFreeRectangles;
  ```
  No se modificó ninguna de las 3 invocaciones existentes (dentro de `calcularFreeRectsPara`, y dos más en funciones de clasificación de sobrantes/piezas más adelante en el archivo); todas se compararon textualmente contra el commit `HEAD` y resultaron **idénticas**.

**`index.html` no requirió modificación**: el orden de carga ya establecido en los reportes 24 y 25 (`free-rectangles.js` carga después de `basic-geometry.js` y antes de `main.js`) ya era correcto para esta extracción. No se modificó ninguna etiqueta `<script>`.

No se modificaron las cinco funciones ya extraídas, fórmulas, tolerancias (`0.001`, `0.5`), el orden de resultados, la mutabilidad de parámetros, las funciones locales `podarContenidos`, `empacarMaterial`, `empacarConLista`, `empacarConListaLibre`, `state.boards`, `renderDiagrama`, `recalcular`, ni el CSS.

# Comparación

- `diff` entre `calcularRectsLibresDesdeObstaculos` en `free-rectangles.js` y su versión original en `main.js` (antes de editar): **sin diferencias (IDÉNTICO)**.
- `diff` del rango de líneas 1-104 de `free-rectangles.js` (las cinco funciones ya existentes) contra la misma sección en el commit `HEAD`: **sin diferencias**, confirmando que no se tocaron.
- Búsqueda de la declaración en `main.js` tras el cambio: **sin coincidencias**.
- Comparación textual (sin números de línea) de las 3 líneas de invocación entre `HEAD` y el `main.js` actual: **sin diferencias**.
- `node --check` sobre `free-rectangles.js` y `main.js`: ambos sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `free-rectangles.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `src/scripts/main.js` y `src/scripts/geometry/free-rectangles.js` (modificados), además de este reporte. `index.html` no aparece modificado.

# Verificaciones (según lo pedido)

1. `calcularRectsLibresDesdeObstaculos` cumple los criterios de pureza — confirmado en "Evidencia de pureza".
2. Su cuerpo es byte-equivalente al original — confirmado por `diff`.
3. `main.js` ya no contiene su declaración — confirmado por `grep`.
4. Todas sus llamadas permanecen intactas — confirmado por comparación textual contra `HEAD` (3 llamadas, sin diferencias).
5. `free-rectangles.js` expone correctamente la función — confirmado (`window.ProyCutFreeRectangles` ahora incluye las 6 funciones del módulo).
6. `node --check` correcto en `free-rectangles.js` y `main.js` — confirmado.
7. `index.html`, `free-rectangles.js` y `main.js` responden `200` por HTTP — confirmado.
8. Sin cambios fuera de `src/scripts/main.js`, `src/scripts/geometry/free-rectangles.js` y este reporte — confirmado por `git status --short` (`index.html` sin cambios).

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que compara dos implementaciones cargadas de forma independiente: (a) la función real extraída en `free-rectangles.js` (actualizado, con sus seis funciones incluyendo las cinco dependencias previamente extraídas), y (b) una copia de control ensamblada directamente desde los mismos fragmentos extraídos por `sed` del código original (`HEAD`) de las seis funciones involucradas (`fusionarRectsAdyacentes`, `interseccionRectangulos`, `restarObstaculoRectangular`, `rectContenidoEn`, `podarRectsContenidos`, `calcularRectsLibresDesdeObstaculos`). Resultados reales observados (no inventados), usando un área base de `{x:0, y:0, w:1000, h:800}` salvo que se indique otra:

| Caso | Resultado real |
|---|---|
| Sin obstáculos (`[]`) | `[{"x":0,"y":0,"w":1000,"h":800}]` |
| Sin obstáculos (`undefined`) | `[{"x":0,"y":0,"w":1000,"h":800}]` (misma protección `obstaculos \|\| []`) |
| Un obstáculo central | 4 regiones (arriba, abajo, izquierda, derecha del obstáculo) |
| Obstáculo fuera del tablero | `[{"x":0,"y":0,"w":1000,"h":800}]` (sin cambios) |
| Obstáculo tocando el borde izquierdo | `[{"x":100,"y":0,"w":900,"h":800}]` (1 región) |
| Varios obstáculos (3, en distintas posiciones) | 6 regiones resultantes |
| Obstáculos superpuestos entre sí | 6 regiones resultantes |
| Lista vacía (`obstaculos = []`) | `[{"x":0,"y":0,"w":1000,"h":800}]` |
| Rectángulo base degenerado (`w=0`) | `[{"x":0,"y":0,"w":0,"h":800}]` (el original lo admite sin error) |
| Rectángulo base degenerado (`h=0`) | `[{"x":0,"y":0,"w":1000,"h":0}]` (el original lo admite sin error) |
| Obstáculo que cubre todo el área | `[]` (sin regiones libres restantes) |

En los 11 casos comparativos, el resultado de la implementación extraída coincidió exactamente con el de la copia de control ensamblada independientemente desde el código original — **11/11 OK**.

**Conservación del orden de salida**: se comparó `JSON.stringify` del arreglo completo (no solo su contenido) para un caso con un obstáculo vertical central; el resultado extraído (`[{"x":0,"y":0,"w":400,"h":800},{"x":450,"y":0,"w":550,"h":800}]`) coincidió en orden y contenido exacto con la copia de control — **OK**.

**No mutación de parámetros**: se comparó `JSON.stringify` de `area` y `obstaculos` antes y después de la llamada — ninguno de los dos fue modificado — **2/2 OK**.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación sin errores en consola.
- **OPT-01** — confirmar que el optimizador genera el mismo diagrama de corte que antes del cambio, dado que `calcularRectsLibresDesdeObstaculos` es usada por `calcularFreeRectsPara` (huecos provisionales al mover/girar una pieza) y en la clasificación final de sobrantes de cada tablero (`board.freeRects`).
- Pruebas con múltiples piezas colocadas y removidas interactivamente (mover, girar), confirmando que los huecos libres calculados visualmente coinciden con los de antes del cambio.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 25). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual del código.
- No fue posible cargar el `main.js` completo (ni la versión previa en `HEAD`) dentro de un sandbox de Node, por las mismas razones ya documentadas en los reportes 23, 24 y 25 (lógica de conexión al DOM en el nivel superior de la IIFE). La comparación automática se hizo contra una copia de control ensamblada independientemente desde el mismo código fuente extraído, no contra una ejecución completa de la aplicación original.
- Con esta extracción, el módulo `free-rectangles.js` queda funcionalmente completo respecto a las seis funciones identificadas en los reportes 24, 25 y 26 (`interseccionRectangulos`, `restarObstaculoRectangular`, `fusionarRectsAdyacentes`, `rectContenidoEn`, `podarRectsContenidos`, `calcularRectsLibresDesdeObstaculos`); las funciones locales `podarContenidos` (duplicadas dentro de `empacarConListaLibre` y `empacarConLista`) permanecen fuera de este módulo, sin cambios, tal como se documentó en el reporte 24.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, la declaración original de `calcularRectsLibresDesdeObstaculos` en su ubicación previa (inmediatamente antes de `calcularFreeRectsPara`), copiando su contenido desde `src/scripts/geometry/free-rectangles.js`.
2. Reducir la desestructuración al inicio de la IIFE de `main.js` de vuelta a:
   ```js
   const {
     interseccionRectangulos,
     restarObstaculoRectangular,
     fusionarRectsAdyacentes,
     rectContenidoEn,
     podarRectsContenidos
   } = window.ProyCutFreeRectangles;
   ```
3. En `src/scripts/geometry/free-rectangles.js`, eliminar `calcularRectsLibresDesdeObstaculos`, y reducir `window.ProyCutFreeRectangles` de vuelta a `{ fusionarRectsAdyacentes, interseccionRectangulos, restarObstaculoRectangular, rectContenidoEn, podarRectsContenidos }`.

Como la función movida está verificada como byte-idéntica a su versión original, este proceso de reversión es mecánico. No se requiere revertir `index.html`, ya que no fue modificado en esta tarea.
