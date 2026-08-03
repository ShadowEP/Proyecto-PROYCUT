# 25-RECT-CONTAINMENT-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción de `rectContenidoEn` y `podarRectsContenidos` desde `src/scripts/main.js` hacia `src/scripts/geometry/free-rectangles.js`, resolviendo la dependencia interna que impidió su extracción en `docs/engineering/24-FREE-RECTANGLES-EXTRACTION-REPORT.md`.

## Depende de
`src/scripts/main.js`; `src/scripts/geometry/free-rectangles.js`; `index.html`; `docs/engineering/24-FREE-RECTANGLES-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Evaluar y extraer únicamente `rectContenidoEn` y `podarRectsContenidos` desde `src/scripts/main.js` hacia el archivo ya existente `src/scripts/geometry/free-rectangles.js`, sin extraer `calcularRectsLibresDesdeObstaculos`, las funciones locales `podarContenidos`, ni las funciones de empaquetado.

# Funciones evaluadas

## `rectContenidoEn(a, b)`

Ubicada en `src/scripts/main.js`, línea 4465 (con comentario de 3 líneas), antes de cualquier edición:

```js
// true si el rectangulo "a" cabe completamente adentro de "b" (con un pequeno margen de
// tolerancia para redondeos). Se usa para descartar sobrantes que ya estan cubiertos por otro
// sobrante mas grande, y asi no listar el mismo hueco dos veces.
function rectContenidoEn(a, b){
  if(a.x < b.x-0.001) return false;
  if(a.y < b.y-0.001) return false;
  if(a.x+a.w > b.x+b.w+0.001) return false;
  if(a.y+a.h > b.y+b.h+0.001) return false;
  return true;
}
```

- No accede a `document`, `state` ni `localStorage`.
- Recibe todo por parámetro (`a`, `b`).
- Devuelve un resultado explícito (`boolean`).
- Sin efectos secundarios.

**Cumple el criterio de pureza. Se extrae.**

## `podarRectsContenidos(rects)`

Ubicada en la línea 4472, inmediatamente después de `rectContenidoEn`, sin comentario propio:

```js
function podarRectsContenidos(rects){
  const out = [];
  for(let i=0;i<rects.length;i++){
    let dominado = false;
    for(let j=0;j<rects.length;j++){
      if(i===j) continue;
      if(!rectContenidoEn(rects[i], rects[j])) continue;
      if(rectContenidoEn(rects[j], rects[i])){
        if(j<i){ dominado = true; break; }
        continue;
      }
      dominado = true; break;
    }
    if(!dominado) out.push(rects[i]);
  }
  return out;
}
```

- Depende únicamente de `rectContenidoEn` (extraída junto con ella, en el mismo archivo) y de su propio parámetro `rects`. Esto resuelve el bloqueo documentado en `docs/engineering/24-FREE-RECTANGLES-EXTRACTION-REPORT.md`, donde `rectContenidoEn` no estaba autorizada ni disponible para extracción.
- No accede a `document`, `state` ni `localStorage`.
- No modifica estado global (construye y retorna un arreglo nuevo `out`; no muta `rects`).
- Devuelve un resultado explícito (arreglo).

**Cumple el criterio de pureza. Se extrae.**

# Funciones extraídas

`rectContenidoEn`, `podarRectsContenidos`.

# Funciones descartadas y motivo

Ninguna de las dos funciones evaluadas en esta tarea fue descartada. Conforme a la instrucción explícita de la tarea, **no se evaluaron ni se extrajeron**: `calcularRectsLibresDesdeObstaculos` (permanece en `main.js`, ahora puede llamar a `podarRectsContenidos` a través de la referencia global recién agregada), las funciones locales `podarContenidos` (anidadas dentro de `empacarConListaLibre` y `empacarConLista`, ya documentadas como no extraíbles en el reporte 24), ni ninguna función de empaquetado.

# Evidencia de pureza

| Criterio | `rectContenidoEn` | `podarRectsContenidos` |
|---|---|---|
| No accede a `document` | Sí | Sí |
| No accede a `state` | Sí | Sí |
| No accede a `localStorage` | Sí | Sí |
| Recibe todo por parámetros | Sí | Sí |
| Devuelve un resultado explícito | Sí (`boolean`) | Sí (arreglo) |
| Sin efectos secundarios | Sí | Sí |
| Depende únicamente de `rectContenidoEn` y sus parámetros | N/A | Sí |
| No modifica estado global | N/A | Sí |

# Archivos creados

Ninguno. Se usó el archivo ya existente `src/scripts/geometry/free-rectangles.js`, tal como exigía la tarea.

# Archivos modificados

- **`src/scripts/geometry/free-rectangles.js`**: se agregaron, después de `restarObstaculoRectangular` y antes del cierre del objeto exportado, las dos funciones extraídas (cuerpo, firma y comentario sin alterar), en el mismo orden relativo en que aparecían en `main.js` (`rectContenidoEn` primero, `podarRectsContenidos` después). Se amplió el objeto expuesto:
  ```js
  window.ProyCutFreeRectangles = {
    fusionarRectsAdyacentes,
    interseccionRectangulos,
    restarObstaculoRectangular,
    rectContenidoEn,
    podarRectsContenidos
  };
  ```
  Las tres funciones ya existentes (`fusionarRectsAdyacentes`, `interseccionRectangulos`, `restarObstaculoRectangular`) no se modificaron; se verificó por `diff` contra el commit `HEAD` que el rango de líneas 1-75 del archivo permanece idéntico.

- **`src/scripts/main.js`**: se eliminaron únicamente las dos declaraciones originales (`rectContenidoEn` con su comentario, y `podarRectsContenidos` inmediatamente después). `calcularRectsLibresDesdeObstaculos` permanece exactamente en su lugar, sin modificar. Se completó la desestructuración ya existente al inicio de la IIFE, exactamente como especificó la tarea:
  ```js
  const {
    interseccionRectangulos,
    restarObstaculoRectangular,
    fusionarRectsAdyacentes,
    rectContenidoEn,
    podarRectsContenidos
  } = window.ProyCutFreeRectangles;
  ```
  No se modificó ninguna invocación existente. Las 2 llamadas internas a `rectContenidoEn` (antes dentro de `podarRectsContenidos`) se movieron completas junto con esa función a `free-rectangles.js`, ya verificadas byte-idénticas. La única llamada externa restante en `main.js` a `podarRectsContenidos` (dentro de `calcularRectsLibresDesdeObstaculos`: `return fusionarRectsAdyacentes(podarRectsContenidos(libres));`) se comparó textualmente contra el commit `HEAD`: **idéntica**.

**`index.html` no requirió modificación**: el orden de carga ya establecido en `docs/engineering/24-FREE-RECTANGLES-EXTRACTION-REPORT.md` (`free-rectangles.js` carga después de `basic-geometry.js` y antes de `main.js`) ya era correcto para esta extracción. No se modificó ninguna etiqueta `<script>`.

No se modificaron `fusionarRectsAdyacentes`, `interseccionRectangulos`, `restarObstaculoRectangular`, fórmulas, tolerancias (`0.001`), el orden de resultados, la mutabilidad de parámetros, `calcularRectsLibresDesdeObstaculos`, las funciones de empaquetado (`empacarMaterial`, `empacarConLista`, `empacarConListaLibre`), las funciones locales `podarContenidos`, `state.boards`, `renderDiagrama`, `recalcular`, ni el CSS.

# Comparación

- `diff` entre `rectContenidoEn` y `podarRectsContenidos` en `free-rectangles.js` y su versión original en `main.js` (antes de editar), incluyendo el comentario de `rectContenidoEn`: **sin diferencias (IDÉNTICO)** en ambas.
- `diff` del rango de líneas 1-75 de `free-rectangles.js` (las tres funciones ya existentes) contra la misma sección en el commit `HEAD`: **sin diferencias**, confirmando que no se tocaron.
- Búsqueda de las dos declaraciones en `main.js` tras el cambio: **sin coincidencias**.
- Confirmado que `calcularRectsLibresDesdeObstaculos` sigue declarada en `main.js`, sin modificar.
- Comparación textual (sin números de línea) de la única llamada externa restante a `podarRectsContenidos` entre `HEAD` y el `main.js` actual: **sin diferencias**.
- `node --check` sobre `free-rectangles.js` y `main.js`: ambos sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `free-rectangles.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `src/scripts/main.js` y `src/scripts/geometry/free-rectangles.js` (modificados), además de este reporte. `index.html` no aparece modificado.

# Verificaciones (según lo pedido)

1. Cada función extraída cumple los criterios de pureza — confirmado individualmente en "Funciones evaluadas" y "Evidencia de pureza".
2. Cada cuerpo es byte-equivalente al original — confirmado por `diff` (ambas, IDÉNTICO).
3. `main.js` ya no contiene sus declaraciones originales — confirmado por `grep`.
4. Todas las llamadas existentes siguen intactas — confirmado por comparación textual contra `HEAD`.
5. `free-rectangles.js` expone correctamente las funciones — confirmado (`window.ProyCutFreeRectangles` ahora incluye las 5 funciones: las 3 previas más `rectContenidoEn` y `podarRectsContenidos`).
6. `node --check` correcto en `free-rectangles.js` y `main.js` — confirmado.
7. `index.html`, `free-rectangles.js` y `main.js` responden `200` por HTTP — confirmado.
8. Sin cambios fuera de `src/scripts/main.js`, `src/scripts/geometry/free-rectangles.js` y este reporte — confirmado por `git status --short` (`index.html` sin cambios).

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que compara dos implementaciones cargadas de forma independiente: (a) las funciones reales extraídas en `free-rectangles.js` (actualizado), y (b) una copia de control ensamblada directamente desde los mismos fragmentos extraídos por `sed` del código original (`HEAD`), como verificación cruzada independiente. Resultados reales observados (no inventados):

| Caso | `rectContenidoEn` |
|---|---|
| Rectángulo totalmente contenido | `true` |
| Rectángulo parcialmente superpuesto (no contenido) | `false` |
| Rectángulos iguales (contenido mutuo) | `true` |
| Rectángulos separados | `false` |
| Caso con tolerancia (diferencia de 0.0005, dentro de 0.001) | `true` |
| Caso fuera de tolerancia (diferencia de 0.01) | `false` |

| Caso | `podarRectsContenidos` |
|---|---|
| Lista vacía | `[]` |
| Un solo rectángulo | `[{"x":0,"y":0,"w":50,"h":50}]` (sin cambios) |
| Varios rectángulos contenidos (2 pequeños dentro de 1 grande) | Solo queda el rectángulo grande |
| Varios rectángulos no contenidos (todos separados) | Los 3 rectángulos originales, sin cambios |
| Rectángulos iguales entre sí | Se conserva solo 1 (deduplicación por índice, `j<i`) |
| Mezcla: contenidos y no contenidos | Se conservan el grande y el separado; el pequeño contenido se descarta |

En los 12 casos comparativos, el resultado de la implementación extraída coincidió exactamente con el de la copia de control ensamblada independientemente desde el código original — **12/12 OK**.

Adicionalmente, se verificó que ninguna de las dos funciones muta los objetos/arreglos recibidos como parámetro: **2/2 OK, sin mutación**.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación sin errores en consola.
- **OPT-01** — confirmar que el optimizador genera el mismo diagrama de corte que antes del cambio, con los mismos huecos libres (dependientes de `calcularRectsLibresDesdeObstaculos`, que ahora invoca `podarRectsContenidos` a través de `window.ProyCutFreeRectangles`).
- Pruebas con tableros que generan sobrantes anidados (un hueco pequeño completamente dentro de uno más grande), confirmando que el listado de sobrantes finales coincide visualmente con el de antes del cambio.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 24). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual del código.
- No fue posible cargar el `main.js` completo (ni la versión previa en `HEAD`) dentro de un sandbox de Node, por las mismas razones ya documentadas en los reportes 23 y 24 (lógica de conexión al DOM en el nivel superior de la IIFE). La comparación automática se hizo contra una copia de control ensamblada independientemente desde el mismo código fuente extraído, no contra una ejecución completa de la aplicación original.
- `calcularRectsLibresDesdeObstaculos` permanece en `main.js` y ahora depende de `podarRectsContenidos` a través de la referencia global `window.ProyCutFreeRectangles` en lugar de una llamada directa dentro del mismo archivo; el comportamiento en tiempo de ejecución es idéntico (misma función, mismo cuerpo), pero cualquier extracción futura de `calcularRectsLibresDesdeObstaculos` ya no tendría dependencias internas bloqueantes pendientes, dado que todas sus dependencias (`restarObstaculoRectangular`, `fusionarRectsAdyacentes`, `podarRectsContenidos`) ya están expuestas en `window.ProyCutFreeRectangles`.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, las dos declaraciones originales (`rectContenidoEn` con su comentario, y `podarRectsContenidos`) en su ubicación previa (inmediatamente antes de `calcularRectsLibresDesdeObstaculos`), copiando su contenido desde `src/scripts/geometry/free-rectangles.js`.
2. Reducir la desestructuración al inicio de la IIFE de `main.js` de vuelta a:
   ```js
   const {
     interseccionRectangulos,
     restarObstaculoRectangular,
     fusionarRectsAdyacentes
   } = window.ProyCutFreeRectangles;
   ```
3. En `src/scripts/geometry/free-rectangles.js`, eliminar `rectContenidoEn` y `podarRectsContenidos`, y reducir `window.ProyCutFreeRectangles` de vuelta a `{ fusionarRectsAdyacentes, interseccionRectangulos, restarObstaculoRectangular }`.

Como las dos funciones movidas están verificadas como byte-idénticas a su versión original, este proceso de reversión es mecánico. No se requiere revertir `index.html`, ya que no fue modificado en esta tarea.
