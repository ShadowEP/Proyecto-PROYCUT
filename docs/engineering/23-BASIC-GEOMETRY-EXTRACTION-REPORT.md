# 23-BASIC-GEOMETRY-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la evaluación y extracción de cuatro funciones puras de geometría básica (`calcularRectanguloUtilTablero`, `calcularRectanguloColocacion`, `calcularHuellaEnRectangulo`, `capacidadLinealConKerf`) desde `src/scripts/main.js` hacia `src/scripts/geometry/basic-geometry.js`.

## Depende de
`src/scripts/main.js`; `src/scripts/geometry/basic-geometry.js`; `index.html`; `docs/engineering/10-CURRENT-STATE.md`; `docs/engineering/12-MANUAL-TESTS.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Evaluar y extraer únicamente `calcularRectanguloUtilTablero`, `calcularRectanguloColocacion`, `calcularHuellaEnRectangulo` y `capacidadLinealConKerf` desde `src/scripts/main.js` hacia un nuevo módulo `src/scripts/geometry/basic-geometry.js`, conservando exactamente firmas, cuerpos, comentarios, fórmulas y comportamiento.

# Funciones evaluadas

Las cuatro funciones estaban ubicadas en `src/scripts/main.js`, en el bloque de geometría básica del optimizador (líneas 713-772, antes de cualquier edición), intercaladas con otras dos funciones **no incluidas en el alcance** (`obtenerAreaColocacionBoard`, `obtenerKerfMaterial`).

## `calcularRectanguloUtilTablero(boardW, boardH, margenes)`

```js
function calcularRectanguloUtilTablero(boardW, boardH, margenes){
  const m = margenes || {left:0, right:0, top:0, bottom:0};
  const valores = [boardW, boardH, m.left, m.right, m.top, m.bottom];
  if(!valores.every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0)){
    return {ok:false, error:'Las medidas del tablero y sus margenes deben ser numeros finitos no negativos.'};
  }
  const w = boardW - m.left - m.right;
  const h = boardH - m.top - m.bottom;
  if(!(w > 0) || !(h > 0)){
    return {ok:false, error:'Los margenes consumen todo el tablero; el area util debe tener ancho y alto mayores que 0.'};
  }
  return {
    ok:true,
    rect:{x:m.left, y:m.top, w, h},
    margenes:{left:m.left, right:m.right, top:m.top, bottom:m.bottom}
  };
}
```

- No accede a `document`, `state` ni `localStorage`.
- No modifica `margenes` (solo lee sus propiedades; el objeto de retorno es nuevo).
- Recibe todo por parámetro; retorna un resultado explícito (`{ok, rect, margenes}` o `{ok:false, error}`).
- No depende de constantes internas no expuestas.
- Sin efectos secundarios.
- **Cumple el criterio de pureza. Se extrae.**

## `calcularRectanguloColocacion(areaUtil, kerfBordeExterior)`

```js
// Los margenes se aplican primero. El kerf exterior, cuando esta habilitado, se reserva despues
// hacia adentro en cada borde del area util, sin alterar las dimensiones fisicas del tablero.
function calcularRectanguloColocacion(areaUtil, kerfBordeExterior){
  const area = areaUtil || {};
  const kerf = Number.isFinite(kerfBordeExterior) ? kerfBordeExterior : NaN;
  const valores = [area.x, area.y, area.w, area.h, kerf];
  if(!valores.every(v => typeof v === 'number' && Number.isFinite(v)) || kerf < 0){
    return {ok:false, error:'El area util y el kerf exterior deben ser numeros finitos no negativos.'};
  }
  const w = area.w - kerf * 2;
  const h = area.h - kerf * 2;
  if(!(w > 0) || !(h > 0)){
    return {ok:false, error:'El kerf exterior consume toda el area util del tablero.'};
  }
  return {ok:true, rect:{x:area.x+kerf, y:area.y+kerf, w, h}};
}
```

- No accede a `document`, `state` ni `localStorage`.
- No modifica `areaUtil` (solo lee `x`, `y`, `w`, `h`; retorna un objeto nuevo).
- Recibe todo por parámetro; retorna un resultado explícito.
- No depende de constantes internas no expuestas.
- Sin efectos secundarios.
- **Cumple el criterio de pureza. Se extrae.**

## `calcularHuellaEnRectangulo(opcion, rect, kerf)`

```js
// Esta huella es exclusivamente provisional para colocar piezas: reserva kerf solo hacia los
// huecos donde posteriormente puede colocarse otra pieza. Los sobrantes se clasifican despues,
// desde las posiciones finales, y no reutilizan esta huella provisional.
function calcularHuellaEnRectangulo(opcion, rect, kerf){
  const EPS = 0.001;
  const sobraW = rect.w - opcion.w;
  const sobraH = rect.h - opcion.h;
  if(sobraW < -EPS || sobraH < -EPS) return null;
  const fw = opcion.w + (sobraW > EPS ? kerf : 0);
  const fh = opcion.h + (sobraH > EPS ? kerf : 0);
  if(fw > rect.w + EPS || fh > rect.h + EPS) return null;
  return {...opcion, fw, fh};
}
```

- No accede a `document`, `state` ni `localStorage`.
- `EPS` es una constante local declarada dentro de la propia función, no una dependencia externa.
- No modifica `opcion` ni `rect` (usa spread `{...opcion, fw, fh}` para retornar un objeto nuevo).
- Recibe todo por parámetro; retorna un resultado explícito (`null` o el objeto con huella).
- No depende de constantes internas no expuestas.
- Sin efectos secundarios.
- **Cumple el criterio de pureza. Se extrae.**

## `capacidadLinealConKerf(disponible, medida, kerf)`

```js
function capacidadLinealConKerf(disponible, medida, kerf){
  if(!(disponible >= medida) || !(medida > 0)) return 0;
  if(kerf === 0) return Math.floor(disponible / medida);
  return Math.floor((disponible + kerf) / (medida + kerf));
}
```

- No accede a `document`, `state` ni `localStorage`.
- No modifica ningún parámetro (todos son números primitivos, inmutables por naturaleza).
- Recibe todo por parámetro; retorna un resultado explícito (número).
- No depende de constantes internas no expuestas.
- Sin efectos secundarios.
- **Cumple el criterio de pureza. Se extrae.**

# Funciones extraídas

Las cuatro: `calcularRectanguloUtilTablero`, `calcularRectanguloColocacion`, `calcularHuellaEnRectangulo`, `capacidadLinealConKerf`.

# Funciones descartadas y motivo

Ninguna. Las cuatro funciones evaluadas cumplieron el criterio de pureza y fueron extraídas. No se evaluaron ni se extrajeron `obtenerAreaColocacionBoard` ni `obtenerKerfMaterial` (funciones vecinas no incluidas en el alcance de esta tarea); ambas permanecen sin modificar en `src/scripts/main.js`.

# Archivos creados

- **`src/scripts/geometry/`** (carpeta nueva).
- **`src/scripts/geometry/basic-geometry.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual, siguiendo el procedimiento adoptado desde el incidente del reporte 19) de los cuatro rangos de líneas originales:
  ```js
  (function(){
    function calcularRectanguloUtilTablero(boardW, boardH, margenes){ ... }

    // Los margenes se aplican primero. ...
    function calcularRectanguloColocacion(areaUtil, kerfBordeExterior){ ... }

    // Esta huella es exclusivamente provisional para colocar piezas: ...
    function calcularHuellaEnRectangulo(opcion, rect, kerf){ ... }

    function capacidadLinealConKerf(disponible, medida, kerf){ ... }

    window.ProyCutBasicGeometry = {
      calcularRectanguloUtilTablero,
      calcularRectanguloColocacion,
      calcularHuellaEnRectangulo,
      capacidadLinealConKerf
    };
  })();
  ```
  El orden relativo entre las cuatro funciones extraídas se conservó exactamente igual al orden en que aparecían en `main.js` (obviando las dos funciones no extraídas que estaban intercaladas).

# Archivos modificados

- **`src/scripts/main.js`**:
  - Se eliminaron únicamente las cuatro declaraciones originales, cada una con su comentario asociado cuando lo tenía (`calcularRectanguloColocacion` y `calcularHuellaEnRectangulo` conservaban comentarios de dos y tres líneas respectivamente, removidos junto con la función). `obtenerAreaColocacionBoard` y `obtenerKerfMaterial` permanecen exactamente en su lugar, sin modificar.
  - Se agregó, al inicio de la IIFE (después del bloque de `ENCABEZADO_FORMATO`, antes de `let BOARD_W = 2440;`), la referencia local:
    ```js
    const {
      calcularRectanguloUtilTablero,
      calcularRectanguloColocacion,
      calcularHuellaEnRectangulo,
      capacidadLinealConKerf
    } = window.ProyCutBasicGeometry;
    ```
  - No se modificó ninguna de las 17 invocaciones existentes (3 de `calcularRectanguloUtilTablero`, 3 de `calcularRectanguloColocacion`, 5 de `calcularHuellaEnRectangulo`, 6 de `capacidadLinealConKerf`); todas siguen escritas exactamente igual y ahora resuelven a través de la referencia desestructurada.

- **`index.html`**: se insertó `<script src="./src/scripts/geometry/basic-geometry.js"></script>` entre `csv.js` y `main.js`, sin alterar ninguna otra etiqueta:
  ```html
  <script src="./src/scripts/utils/format.js"></script>
  <script src="./src/scripts/config/limits.js"></script>
  <script src="./src/scripts/utils/validation.js"></script>
  <script src="./src/scripts/utils/text-normalization.js"></script>
  <script src="./src/scripts/config/project-format.js"></script>
  <script src="./src/scripts/utils/csv.js"></script>
  <script src="./src/scripts/geometry/basic-geometry.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```

No se modificaron fórmulas, tolerancias (`EPS = 0.001`), unidades, kerf, `LIMITES`, funciones de rectángulos libres, empaquetado, `empacarMaterial`, `empacarConLista`, el optimizador, `state.boards`, `renderDiagrama`, `recalcular`, ni el CSS.

# Comparación

- `diff` entre cada una de las cuatro funciones en `basic-geometry.js` y su versión original en `main.js` (antes de editar), incluyendo comentarios asociados: **sin diferencias (IDÉNTICO)** en las cuatro.
- Búsqueda de las cuatro declaraciones (`function calcularRectanguloUtilTablero(`, etc.) en `main.js` tras el cambio: **sin coincidencias**.
- Comparación textual (sin números de línea) de todas las líneas de invocación de las cuatro funciones, entre el commit `HEAD` (previo a esta tarea) y el `main.js` actual: **sin diferencias** en las cuatro funciones.
- `node --check` sobre `basic-geometry.js` y `main.js`: ambos sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `basic-geometry.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados) y `src/scripts/geometry/` (nueva, con `basic-geometry.js`), además de este reporte.

# Verificaciones (según lo pedido)

1. Cada función extraída es pura — confirmado individualmente en la sección "Funciones evaluadas".
2. Cada cuerpo es byte-equivalente al original — confirmado por `diff` (las cuatro, IDÉNTICO).
3. `main.js` ya no contiene las declaraciones originales — confirmado por `grep`.
4. Todas las llamadas existentes siguen intactas — confirmado por comparación textual contra `HEAD` (17 invocaciones, sin diferencias).
5. `basic-geometry.js` carga antes que `main.js` — confirmado.
6. `node --check` correcto en `basic-geometry.js` y `main.js` — confirmado.
7. `index.html`, `basic-geometry.js` y `main.js` responden `200` por HTTP — confirmado.
8. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/geometry/basic-geometry.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que compara dos implementaciones cargadas de forma independiente: (a) las funciones reales extraídas en `basic-geometry.js`, y (b) una copia de control ensamblada directamente desde los mismos fragmentos extraídos por `sed` del código original (ya verificados byte-idénticos), como segunda verificación cruzada. Resultados reales observados (no inventados):

| Caso | `calcularRectanguloUtilTablero` |
|---|---|
| Tablero sin márgenes (2440×1220, margenes null) | `{"ok":true,"rect":{"x":0,"y":0,"w":2440,"h":1220},"margenes":{"left":0,"right":0,"top":0,"bottom":0}}` |
| Tablero con márgenes (10/10/5/5) | `{"ok":true,"rect":{"x":10,"y":5,"w":2420,"h":1210},"margenes":{"left":10,"right":10,"top":5,"bottom":5}}` |
| Márgenes consumen todo el tablero (20×20, margenes 10/10/10/10) | `{"ok":false,"error":"Los margenes consumen todo el tablero; el area util debe tener ancho y alto mayores que 0."}` |
| Medida no numérica (`NaN`) | `{"ok":false,"error":"Las medidas del tablero y sus margenes deben ser numeros finitos no negativos."}` |

| Caso | `calcularRectanguloColocacion` |
|---|---|
| Kerf cero | `{"ok":true,"rect":{"x":0,"y":0,"w":2440,"h":1220}}` |
| Kerf positivo (4) | `{"ok":true,"rect":{"x":4,"y":4,"w":2432,"h":1212}}` |
| Kerf negativo (inválido) | `{"ok":false,"error":"El area util y el kerf exterior deben ser numeros finitos no negativos."}` |
| Kerf consume toda el área (10×10, kerf 6) | `{"ok":false,"error":"El kerf exterior consume toda el area util del tablero."}` |

| Caso | `calcularHuellaEnRectangulo` |
|---|---|
| Pieza sin rotar, rectángulo exacto (600×400 en 600×400) | `{"w":600,"h":400,"fw":600,"fh":400}` |
| Pieza "rotada" (dimensiones intercambiadas) con sobrante (400×600 en 1000×600) | `{"w":400,"h":600,"fw":404,"fh":600}` (reserva kerf solo en el eje con sobrante) |
| Pieza mayor que el espacio (2000×2000 en 600×400) | `null` |
| Kerf cero, ajuste exacto (300×200 en 300×200) | `{"w":300,"h":200,"fw":300,"fh":200}` |

| Caso | `capacidadLinealConKerf` |
|---|---|
| Capacidad de cero (medida 200 mayor que disponible 100) | `0` |
| Kerf cero (disponible 1000, medida 300) | `3` |
| Kerf positivo (disponible 1000, medida 300, kerf 4) | `3` |
| Medida cero (inválida) | `0` |
| Valor límite exacto (disponible == medida == 300) | `1` |

En los 17 casos, el resultado de la implementación extraída (`basic-geometry.js`) coincidió exactamente con el de la copia de control ensamblada independientemente desde el código original — **17/17 OK**.

Adicionalmente, se verificó explícitamente que ninguna de las cuatro funciones muta los objetos recibidos como parámetro (comparando `JSON.stringify` de los argumentos antes y después de cada llamada): **4/4 OK, sin mutación**.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación sin errores en consola.
- **OPT-01** — confirmar que el optimizador genera el mismo diagrama de corte que antes del cambio, con las mismas piezas colocadas en las mismas posiciones.
- Pruebas con tablero con y sin márgenes configurados, y con kerf de borde exterior habilitado/deshabilitado, confirmando que el área útil y de colocación calculadas visualmente coinciden con las de antes del cambio.
- Pruebas con piezas que requieren rotación, confirmando que la capacidad lineal y las huellas provisionales calculadas durante la optimización no cambiaron.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 22). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual del código.
- No fue posible cargar el `main.js` completo (ni la versión previa en `HEAD`) dentro de un sandbox de Node para una comparación de extremo a extremo, porque el archivo ejecuta lógica de conexión al DOM en el nivel superior de la IIFE (fuera de cualquier función), lo cual requeriría un DOM simulado no disponible en este entorno sin instalar dependencias. Por eso la comparación automática se hizo contra una copia de control ensamblada independientemente desde el mismo código fuente extraído (ya verificado byte-idéntico por `diff`), y no contra una ejecución completa de la aplicación original.
- Estas cuatro funciones son utilizadas internamente por el optimizador de corte (llamadas desde las funciones de empaquetado); cualquier extracción futura de las funciones que las invocan deberá considerar que ahora dependen de `window.ProyCutBasicGeometry`.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, las cuatro declaraciones originales (con sus comentarios asociados) en su ubicación previa (entre `obtenerAreaColocacionBoard` y `obtenerKerfMaterial`, en su orden original), copiando su contenido desde `src/scripts/geometry/basic-geometry.js`.
2. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     calcularRectanguloUtilTablero,
     calcularRectanguloColocacion,
     calcularHuellaEnRectangulo,
     capacidadLinealConKerf
   } = window.ProyCutBasicGeometry;
   ```
3. Eliminar `src/scripts/geometry/basic-geometry.js` y, si queda vacía, la carpeta `src/scripts/geometry/`.
4. Eliminar la etiqueta `<script src="./src/scripts/geometry/basic-geometry.js"></script>` de `index.html`.

Como las cuatro funciones movidas están verificadas como byte-idénticas a su versión original, este proceso de reversión es mecánico.
