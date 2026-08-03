# 24-FREE-RECTANGLES-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la evaluación y extracción parcial de funciones de geometría de rectángulos libres desde `src/scripts/main.js` hacia `src/scripts/geometry/free-rectangles.js`, incluyendo la justificación detallada de las tres funciones solicitadas que no se extrajeron.

## Depende de
`src/scripts/main.js`; `src/scripts/geometry/basic-geometry.js`; `src/scripts/geometry/free-rectangles.js`; `index.html`; `docs/engineering/23-BASIC-GEOMETRY-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Evaluar y extraer, de entre `interseccionRectangulos`, `restarObstaculoRectangular`, `calcularRectsLibresDesdeObstaculos`, `fusionarRectsAdyacentes`, `podarRectsContenidos` y `podarContenidos`, únicamente las que cumplan el criterio de pureza, hacia un nuevo módulo `src/scripts/geometry/free-rectangles.js`.

# Funciones evaluadas

## `fusionarRectsAdyacentes(rects)`

Ubicada en `src/scripts/main.js`, línea 4489 (con comentario de 5 líneas). No accede a `document`, `state` ni `localStorage`. No muta el arreglo `rects` recibido (usa `rects.slice()` para trabajar sobre una copia). No depende de ninguna variable ni función interna no expuesta. Recibe todo por parámetro y retorna un arreglo nuevo. Sin efectos secundarios.

**Cumple el criterio de pureza. Se extrae.**

## `interseccionRectangulos(a, b)`

Ubicada en línea 4534. Función standalone, sin dependencias externas. No accede a `document`, `state` ni `localStorage`. No muta `a` ni `b`. Recibe todo por parámetro, retorna un resultado explícito (`null` o un rectángulo nuevo). Sin efectos secundarios.

**Cumple el criterio de pureza. Se extrae.**

## `restarObstaculoRectangular(rect, obstaculo)`

Ubicada en línea 4544 (con comentario de 1 línea). Llama a `interseccionRectangulos`, que también está en la lista autorizada y se extrae junto con ella al mismo archivo. No accede a `document`, `state` ni `localStorage`. No muta `rect` ni `obstaculo`. Recibe todo por parámetro, retorna un arreglo nuevo. Sin efectos secundarios.

**Cumple el criterio de pureza. Se extrae.**

## `podarRectsContenidos(rects)`

Ubicada en línea 4466. Su cuerpo llama a `rectContenidoEn(a, b)` (línea 4459), una función **de nivel superior de la IIFE pero no incluida en la lista de funciones autorizadas para extracción**, y no expuesta en ningún objeto `window.ProyCutXxx` existente. Esto viola directamente el criterio de pureza "no depende de variables internas no expuestas" (aquí, una función interna no expuesta). La instrucción de la tarea es explícita: "No extraigas ninguna otra función" — por lo tanto no está autorizado extraer también `rectContenidoEn` para resolver esta dependencia.

**No cumple el criterio de pureza. No se extrae.**

## `calcularRectsLibresDesdeObstaculos(area, obstaculos)`

Ubicada en línea 4559. Su cuerpo (`return fusionarRectsAdyacentes(podarRectsContenidos(libres));`) llama a `restarObstaculoRectangular` y `fusionarRectsAdyacentes` (ambas ya extraídas, sin problema) pero también a `podarRectsContenidos`, que **no se extrajo** por el motivo anterior. Si `calcularRectsLibresDesdeObstaculos` se moviera a `free-rectangles.js`, invocaría una función indefinida en ese archivo (`podarRectsContenidos` seguiría existiendo solo dentro de la IIFE de `main.js`, inaccesible desde otro `<script>`).

**No cumple el criterio de pureza (dependencia transitiva no resuelta). No se extrae.**

## `podarContenidos`

Esta función **no existe como declaración de nivel superior de la IIFE** en `src/scripts/main.js`. Una búsqueda de `function podarContenidos(` encontró exactamente dos coincidencias, ambas con indentación de 4 espacios (funciones anidadas, no de nivel superior):

- Línea 4027, dentro de `empacarConListaLibre(ordenadas, kerf, _permitirMezclaOrientacion, datosTablero)` (declarada en la línea 3995).
- Línea 4262, dentro de `empacarConLista(ordenadas, kerf, permitirMezclaOrientacion, datosTablero)` (declarada en la línea 4135).

Cada una de estas dos funciones anidadas es una implementación **local e independiente** (no la misma función compartida) que depende de un helper local `contenido(a, b)` definido dentro de la misma función de empaquetado que la contiene (líneas 4019 y 4253 respectivamente). Ambas funciones de empaquetado (`empacarConListaLibre`, `empacarConLista`) están explícitamente fuera del alcance de esta tarea ("no debes ... modificar empacarConLista"; el listado de restricciones también prohíbe "extraer funciones de empaquetado").

**No existe en forma extraíble tal como fue solicitada. No se extrae.**

# Funciones extraídas

`fusionarRectsAdyacentes`, `interseccionRectangulos`, `restarObstaculoRectangular`.

# Funciones descartadas y motivo

| Función | Motivo |
|---|---|
| `podarRectsContenidos` | Depende de `rectContenidoEn`, función interna de la IIFE no incluida en la lista autorizada ni expuesta globalmente. |
| `calcularRectsLibresDesdeObstaculos` | Depende de `podarRectsContenidos`, que no se extrajo (dependencia transitiva bloqueada). |
| `podarContenidos` | No existe como función de nivel superior; existe únicamente como dos implementaciones locales distintas, ancladas a las funciones de empaquetado `empacarConListaLibre` y `empacarConLista`, ambas fuera de alcance. |

# Evidencia de pureza

Ver el detalle completo, función por función, en la sección "Funciones evaluadas". Resumen de los ocho criterios pedidos para las tres funciones extraídas:

| Criterio | `fusionarRectsAdyacentes` | `interseccionRectangulos` | `restarObstaculoRectangular` |
|---|---|---|---|
| No accede a `document` | Sí | Sí | Sí |
| No accede a `state` | Sí | Sí | Sí |
| No accede a `localStorage` | Sí | Sí | Sí |
| No modifica datos globales | Sí | Sí | Sí |
| No depende de variables internas no expuestas | Sí | Sí | Sí (depende de `interseccionRectangulos`, extraída junto con ella) |
| Recibe los datos por parámetros | Sí | Sí | Sí |
| Devuelve un resultado explícito | Sí | Sí | Sí |
| Sin efectos secundarios no controlados | Sí | Sí | Sí |

# Archivos creados

- **`src/scripts/geometry/free-rectangles.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual) de los tres rangos de líneas originales, conservando el orden relativo en que aparecían en `main.js` (`fusionarRectsAdyacentes`, `interseccionRectangulos`, `restarObstaculoRectangular`):
  ```js
  (function(){
    // Junta en uno solo los huecos vacios que quedan pegados uno junto a otro y miden exactamente ...
    function fusionarRectsAdyacentes(rects){ ... }

    function interseccionRectangulos(a, b){ ... }

    // Resta un obstaculo rectangular produciendo regiones que no se traslapan entre si.
    function restarObstaculoRectangular(rect, obstaculo){ ... }

    window.ProyCutFreeRectangles = {
      fusionarRectsAdyacentes,
      interseccionRectangulos,
      restarObstaculoRectangular
    };
  })();
  ```
  `restarObstaculoRectangular` llama a `interseccionRectangulos` dentro del mismo archivo, sin necesidad de exposición adicional, tal como pedía la tarea ("si las funciones se llaman entre sí, conserva esas relaciones dentro del mismo archivo").

# Archivos modificados

- **`src/scripts/main.js`**:
  - Se eliminaron únicamente las tres declaraciones extraídas (con sus comentarios asociados). `rectContenidoEn`, `podarRectsContenidos` y `calcularRectsLibresDesdeObstaculos` permanecen exactamente en su lugar, sin modificar.
  - Se agregó, al inicio de la IIFE (después del bloque de `window.ProyCutBasicGeometry`, antes de `let BOARD_W = 2440;`), la referencia local:
    ```js
    const {
      interseccionRectangulos,
      restarObstaculoRectangular,
      fusionarRectsAdyacentes
    } = window.ProyCutFreeRectangles;
    ```
  - No se modificó ninguna invocación existente. `interseccionRectangulos` tenía 3 apariciones en el archivo original (declaración, una llamada interna dentro de `restarObstaculoRectangular`, y una llamada externa en otra función); la declaración y la llamada interna se movieron juntas a `free-rectangles.js` (como parte del cuerpo íntegro de `restarObstaculoRectangular`, ya verificado byte-idéntico), y la única llamada externa restante en `main.js` (`const inflado = interseccionRectangulos(area, {...`) se comparó textualmente contra el commit anterior: **idéntica**.

- **`index.html`**: se insertó `<script src="./src/scripts/geometry/free-rectangles.js"></script>` entre `basic-geometry.js` y `main.js`, sin alterar ninguna otra etiqueta:
  ```html
  <script src="./src/scripts/utils/format.js"></script>
  <script src="./src/scripts/config/limits.js"></script>
  <script src="./src/scripts/utils/validation.js"></script>
  <script src="./src/scripts/utils/text-normalization.js"></script>
  <script src="./src/scripts/config/project-format.js"></script>
  <script src="./src/scripts/utils/csv.js"></script>
  <script src="./src/scripts/geometry/basic-geometry.js"></script>
  <script src="./src/scripts/geometry/free-rectangles.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```

No se modificaron fórmulas, tolerancias (`0.001`, `0.5`), el orden de resultados, la mutabilidad de parámetros, `basic-geometry.js`, funciones de empaquetado (`empacarMaterial`, `empacarConLista`, `empacarConListaLibre`), `state.boards`, `renderDiagrama`, `recalcular`, ni el CSS.

# Comparación

- `diff` entre cada una de las tres funciones en `free-rectangles.js` y su versión original en `main.js` (antes de editar), incluyendo comentarios asociados: **sin diferencias (IDÉNTICO)** en las tres.
- Búsqueda de las tres declaraciones en `main.js` tras el cambio: **sin coincidencias**.
- Confirmado que `rectContenidoEn`, `podarRectsContenidos` y `calcularRectsLibresDesdeObstaculos` siguen declaradas en `main.js`, sin modificar.
- Comparación textual (sin números de línea) de las líneas de invocación de `fusionarRectsAdyacentes` y `restarObstaculoRectangular` entre `HEAD` (previo a esta tarea) y el `main.js` actual: **sin diferencias**. Para `interseccionRectangulos`, la única línea de llamada que "desapareció" de `main.js` es la que estaba dentro del cuerpo de `restarObstaculoRectangular` (movida junto con esa función, ya verificada byte-idéntica); la llamada externa restante se comparó por separado y es **idéntica**.
- `node --check` sobre `free-rectangles.js` y `main.js`: ambos sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `free-rectangles.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados) y `src/scripts/geometry/free-rectangles.js` (nuevo), además de este reporte.

# Verificaciones (según lo pedido)

1. Cada función extraída cumple los criterios de pureza — confirmado individualmente en "Funciones evaluadas" y resumido en "Evidencia de pureza".
2. Cada cuerpo es byte-equivalente al original — confirmado por `diff` (las tres, IDÉNTICO).
3. `main.js` ya no contiene sus declaraciones originales — confirmado por `grep`.
4. Todas las llamadas existentes siguen intactas — confirmado por comparación textual contra `HEAD`.
5. `free-rectangles.js` carga después de `basic-geometry.js` y antes de `main.js` — confirmado.
6. `node --check` correcto en `free-rectangles.js` y `main.js` — confirmado.
7. `index.html`, `free-rectangles.js` y `main.js` responden `200` por HTTP — confirmado.
8. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/geometry/free-rectangles.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que compara dos implementaciones cargadas de forma independiente: (a) las funciones reales extraídas en `free-rectangles.js`, y (b) una copia de control ensamblada directamente desde los mismos fragmentos extraídos por `sed` del código original (`HEAD`), como verificación cruzada independiente. Resultados reales observados (no inventados):

| Caso | `interseccionRectangulos` |
|---|---|
| Rectángulos sin intersección | `null` |
| Intersección parcial | `{"x":50,"y":50,"w":50,"h":50}` |
| Contención total (b dentro de a) | `{"x":50,"y":50,"w":20,"h":20}` |
| Obstáculo tocando un borde (sin área real de intersección) | `null` |

| Caso | `restarObstaculoRectangular` |
|---|---|
| Obstáculo en el centro | 4 regiones resultantes (arriba, abajo, izquierda, derecha) |
| Obstáculo tocando un borde | 1 región resultante |
| Obstáculo fuera del rectángulo | `[{"x":0,"y":0,"w":100,"h":100}]` (rectángulo original sin cambios) |
| Obstáculo igual al rectángulo completo | `[]` (sin regiones sobrantes) |

| Caso | `fusionarRectsAdyacentes` |
|---|---|
| Fusión horizontal (mismo alto, pegados en x) | `[{"x":0,"y":0,"w":100,"h":100}]` (fusionados en 1) |
| Fusión vertical (mismo ancho, pegados en y) | `[{"x":0,"y":0,"w":100,"h":100}]` (fusionados en 1) |
| Rectángulos no fusionables (distinto tamaño, separados) | Los 2 rectángulos originales, sin fusionar |
| Lista vacía | `[]` |
| Varias operaciones consecutivas (3 franjas horizontales encadenadas) | `[{"x":0,"y":0,"w":100,"h":90}]` (las 3 fusionadas en 1) |

En los 13 casos comparativos, el resultado de la implementación extraída coincidió exactamente con el de la copia de control ensamblada independientemente desde el código original — **13/13 OK**.

Adicionalmente, se verificó que ninguna de las tres funciones muta los objetos/arreglos recibidos como parámetro (comparando `JSON.stringify` de los argumentos antes y después de cada llamada): **3/3 OK, sin mutación**.

**Nota sobre casos no aplicables**: el caso "poda de contenidos" solicitado en las pruebas automáticas no pudo ejecutarse contra este módulo porque `podarRectsContenidos` (y `podarContenidos`) no fueron extraídas (ver "Funciones descartadas y motivo"). No se inventó un resultado para este caso.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación sin errores en consola.
- **OPT-01** — confirmar que el optimizador genera el mismo diagrama de corte que antes del cambio, con las mismas regiones libres, obstáculos y huecos fusionados.
- Pruebas con piezas colocadas cerca de los bordes del tablero y entre sí, confirmando que las regiones libres calculadas (que dependen de `restarObstaculoRectangular` y `fusionarRectsAdyacentes`, ahora extraídas) coinciden visualmente con las de antes del cambio.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 23). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual del código.
- No fue posible cargar el `main.js` completo (ni la versión previa en `HEAD`) dentro de un sandbox de Node, por las mismas razones documentadas en `docs/engineering/23-BASIC-GEOMETRY-EXTRACTION-REPORT.md` (lógica de conexión al DOM en el nivel superior de la IIFE). La comparación automática se hizo contra una copia de control ensamblada independientemente desde el mismo código fuente extraído, no contra una ejecución completa de la aplicación original.
- El módulo de geometría de rectángulos libres queda **incompleto**: `podarRectsContenidos` y `calcularRectsLibresDesdeObstaculos` permanecen en `main.js` por la dependencia no resuelta de `rectContenidoEn`. Una extracción futura de estas funciones requeriría primero decidir si `rectContenidoEn` se expone globalmente (mismo patrón usado con `LIMITES` y `ENCABEZADO_FORMATO` en los reportes 17 y 21), lo cual no fue autorizado en esta tarea.
- `podarContenidos`, tal como fue solicitada, no existe como función única; las dos implementaciones locales encontradas dentro de `empacarConListaLibre` y `empacarConLista` permanecen intactas y fuera de esta refactorización.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, las tres declaraciones originales (con sus comentarios asociados) en su ubicación previa (inmediatamente antes de `calcularRectsLibresDesdeObstaculos`, en su orden original), copiando su contenido desde `src/scripts/geometry/free-rectangles.js`.
2. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     interseccionRectangulos,
     restarObstaculoRectangular,
     fusionarRectsAdyacentes
   } = window.ProyCutFreeRectangles;
   ```
3. Eliminar `src/scripts/geometry/free-rectangles.js`.
4. Eliminar la etiqueta `<script src="./src/scripts/geometry/free-rectangles.js"></script>` de `index.html`.

Como las tres funciones movidas están verificadas como byte-idénticas a su versión original, este proceso de reversión es mecánico.
