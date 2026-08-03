# 29-BOARD-AREA-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la evaluación y extracción de las funciones puras de "utilidades de tablero y precio" desde `src/scripts/main.js` hacia `src/scripts/geometry/board-area.js`, siguiendo el candidato 6 propuesto en `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md` (sección 9) y el segundo de los "próximos tres cambios recomendados" (sección 15).

## Depende de
`src/scripts/main.js`; `src/scripts/geometry/board-area.js`; `src/scripts/geometry/basic-geometry.js`; `src/scripts/geometry/free-rectangles.js`; `index.html`; `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md`; `docs/engineering/28-HIERARCHICAL-CONFIG-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Nota sobre el mensaje recibido

El mensaje de esta tarea se cortó en la palabra "Prop" (presumiblemente antes de "Propón: <mensaje de commit>"), el mismo tipo de interrupción ya documentado en `docs/engineering/22-PARSEARCSV-EXTRACTION-REPORT.md`. Se completó la tarea siguiendo el patrón mecánico ya establecido en los quince reportes anteriores, y se propone el mensaje de commit sugerido en `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md` (sección 15, punto 2: `refactor(geometry): extract board area and price utilities`).

# Objetivo

Evaluar y extraer únicamente las funciones clasificadas en el roadmap como "utilidades de tablero y precio" hacia `src/scripts/geometry/board-area.js`, sin extraer funciones adicionales aunque parezcan relacionadas.

# Funciones evaluadas

El roadmap (`27-JAVASCRIPT-MODULE-ROADMAP.md`, grupo 4, líneas aproximadas 729-803 en su momento) identificó 6 funciones candidatas en este grupo. Se evaluaron las 6, en su ubicación real actual (`src/scripts/main.js`, líneas 321-395 antes de cualquier edición):

## `obtenerAreaColocacionBoard(board)`

```js
function obtenerAreaColocacionBoard(board){
  return board.areaColocacion || board.areaUtil || {
    x:0, y:0, w:board.boardW, h:board.boardH
  };
}
```
- No accede a `document`, `state` ni `localStorage`. No modifica datos globales. Recibe todo por parámetro (`board`). Devuelve un resultado explícito. No depende de variables internas no expuestas. Sin efectos secundarios.
- **Cumple el criterio de pureza. Se extrae.**

## `obtenerKerfMaterial(piezas, parametrosProyecto)`

```js
function obtenerKerfMaterial(piezas, parametrosProyecto){
  const inicial = { ... };
  return piezas.reduce((resultado, pieza) => ({ ... }), inicial);
}
```
- No accede a `document`, `state` ni `localStorage`. No modifica datos globales (usa `reduce`, que no muta `piezas`; construye un nuevo objeto en cada paso, sin mutar `parametrosProyecto`). Recibe todo por parámetro. Devuelve un resultado explícito. No depende de variables internas no expuestas. Sin efectos secundarios.
- **Cumple el criterio de pureza. Se extrae.**

## `textoSeguroParaExcel(valor)`

```js
function textoSeguroParaExcel(valor){
  const texto = String(valor === null || valor === undefined ? '' : valor);
  if(/^\s*[=+\-@]/.test(texto)) return "'" + texto;
  return texto;
}
```
- No accede a `document`, `state` ni `localStorage`. No modifica datos globales. Recibe todo por parámetro. Devuelve un resultado explícito (previene inyección de fórmulas en Excel anteponiendo un apóstrofo). No depende de variables internas no expuestas. Sin efectos secundarios.
- **Cumple el criterio de pureza. Se extrae.**

## `resumenErrores(errores, maximo)`

```js
function resumenErrores(errores, maximo){
  const limite = maximo || 8;
  const visibles = errores.slice(0, limite);
  const restantes = errores.length - visibles.length;
  return visibles.join('\n') + (restantes > 0 ? '\n... y ' + restantes + ' error' + (restantes===1?'':'es') + ' mas.' : '');
}
```
- No accede a `document`, `state` ni `localStorage`. No modifica datos globales (usa `slice`, no muta `errores`). Recibe todo por parámetro. Devuelve un resultado explícito. No depende de variables internas no expuestas. Sin efectos secundarios.
- **Cumple el criterio de pureza. Se extrae.**
- **Hallazgo adicional**: esta función de nivel superior **no tiene ningún llamador** en todo `main.js` (confirmado por `grep`, antes y después de la extracción). Existe una variable local, del mismo nombre, declarada dentro de otra función distinta (línea 2396 antes de editar, dentro del manejador de importación de CSV/Excel), que reimplementa manualmente una lógica similar en línea — es una coincidencia de nombre en un ámbito distinto, no una llamada a esta función. Se documenta explícitamente para no generar confusión: `resumenErrores` (la función de nivel superior aquí extraída) queda expuesta en el nuevo módulo pero, igual que `resolverValorPorJerarquia` en el reporte 28, permanece sin conectar a ningún llamador real.

## `obtenerMedidaTableroDefault()`

```js
function obtenerMedidaTableroDefault(){
  const inLargo = document.getElementById('tableroLargo');
  const inAncho = document.getElementById('tableroAncho');
  ...
}
```
- **Accede a `document.getElementById`.** No cumple el criterio "no accede a `document`".
- **No se extrae.**

## `medidaTableroDeMaterial(nombreMaterial)`

```js
function medidaTableroDeMaterial(nombreMaterial){
  const cfg = state.materiales.find(m => m.nombre === nombreMaterial);
  ...
  return obtenerMedidaTableroDefault();
}
```
- **Accede a `state.materiales`.** No cumple el criterio "no accede a `state`". Además depende transitivamente de `obtenerMedidaTableroDefault` (DOM), otra dependencia no autorizada para este alcance.
- **No se extrae.**

# Funciones extraídas

`obtenerAreaColocacionBoard`, `obtenerKerfMaterial`, `textoSeguroParaExcel`, `resumenErrores`.

# Funciones descartadas y motivo

| Función | Motivo |
|---|---|
| `obtenerMedidaTableroDefault` | Accede a `document.getElementById('tableroLargo'/'tableroAncho')`. No cumple el criterio de pureza exigido para este módulo. |
| `medidaTableroDeMaterial` | Accede a `state.materiales` y depende transitivamente de `obtenerMedidaTableroDefault` (DOM). No cumple el criterio de pureza. |

Ambas permanecen sin modificar en `src/scripts/main.js`, exactamente en la posición donde quedaron tras remover las cuatro funciones extraídas (inmediatamente después de `resumenErrores`).

# Evidencia de pureza

| Criterio | `obtenerAreaColocacionBoard` | `obtenerKerfMaterial` | `textoSeguroParaExcel` | `resumenErrores` |
|---|---|---|---|---|
| No accede a `document` | Sí | Sí | Sí | Sí |
| No accede a `state` | Sí | Sí | Sí | Sí |
| No accede a `localStorage` | Sí | Sí | Sí | Sí |
| No modifica datos globales | Sí | Sí | Sí | Sí |
| Recibe sus datos por parámetros | Sí | Sí | Sí | Sí |
| Devuelve un resultado explícito | Sí | Sí | Sí | Sí |
| No depende de variables internas no expuestas | Sí | Sí | Sí | Sí |
| Sin efectos secundarios | Sí | Sí | Sí | Sí |

# Archivos creados

- **`src/scripts/geometry/board-area.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual) del rango contiguo de líneas 321-371 originales de `main.js`, conservando el orden relativo exacto:
  ```js
  (function(){
    function obtenerAreaColocacionBoard(board){ ... }

    function obtenerKerfMaterial(piezas, parametrosProyecto){ ... }

    function textoSeguroParaExcel(valor){ ... }

    function resumenErrores(errores, maximo){ ... }

    window.ProyCutBoardArea = {
      obtenerAreaColocacionBoard,
      obtenerKerfMaterial,
      textoSeguroParaExcel,
      resumenErrores
    };
  })();
  ```

# Archivos modificados

- **`src/scripts/main.js`**:
  - Se eliminó únicamente el bloque contiguo de las 4 declaraciones extraídas (líneas 321-371 originales, ninguna tenía comentario propio). El comentario de 4 líneas que sigue (líneas 373-376 originales) pertenece a `obtenerMedidaTableroDefault` y **no se tocó**; ambas funciones descartadas permanecen exactamente en su lugar.
  - Se agregó, al inicio de la IIFE (después del bloque de `window.ProyCutHierarchicalConfig`, antes de `let BOARD_W = 2440;`), la referencia local:
    ```js
    const {
      obtenerAreaColocacionBoard,
      obtenerKerfMaterial,
      textoSeguroParaExcel
    } = window.ProyCutBoardArea;
    ```
    `resumenErrores` **no** se incluyó en esta desestructuración porque, como se documentó arriba, no tiene ningún llamador real en `main.js` — mismo criterio aplicado a `resolverValorPorJerarquia` en el reporte 28 (no se importa lo que no se usa).
  - No se modificó ninguna de las invocaciones existentes: 12 llamadas a `obtenerAreaColocacionBoard`, 1 a `obtenerKerfMaterial`, 11 a `textoSeguroParaExcel` — todas comparadas textualmente contra el commit `HEAD` y confirmadas **idénticas**.

- **`index.html`**: se insertó `<script src="./src/scripts/geometry/board-area.js"></script>` entre `free-rectangles.js` y `hierarchical-config.js`, sin alterar ninguna otra etiqueta:
  ```html
  <script src="./src/scripts/utils/format.js"></script>
  <script src="./src/scripts/config/limits.js"></script>
  <script src="./src/scripts/utils/validation.js"></script>
  <script src="./src/scripts/utils/text-normalization.js"></script>
  <script src="./src/scripts/config/project-format.js"></script>
  <script src="./src/scripts/utils/csv.js"></script>
  <script src="./src/scripts/geometry/basic-geometry.js"></script>
  <script src="./src/scripts/geometry/free-rectangles.js"></script>
  <script src="./src/scripts/geometry/board-area.js"></script>
  <script src="./src/scripts/config/hierarchical-config.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```

No se modificaron fórmulas, unidades, redondeos, precios, `basic-geometry.js`, `free-rectangles.js`, `recalcular()`, el optimizador, `state.boards`, los reportes, las exportaciones, ni el CSS.

# Comparación

- `diff` entre el bloque de las 4 funciones en `board-area.js` y su versión original en `main.js` (antes de editar): **sin diferencias (IDÉNTICO)**.
- Búsqueda de las 4 declaraciones en `main.js` tras el cambio: **sin coincidencias**.
- Confirmado que `obtenerMedidaTableroDefault` y `medidaTableroDeMaterial` siguen declaradas en `main.js`, sin modificar.
- Comparación textual (sin números de línea) de las llamadas a `obtenerAreaColocacionBoard` (12), `obtenerKerfMaterial` (1) y `textoSeguroParaExcel` (11) entre el commit `HEAD` y el `main.js` actual: **sin diferencias** en las tres.
- `node --check` sobre `board-area.js` y `main.js`: ambos sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `board-area.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados) y `src/scripts/geometry/board-area.js` (nuevo), además de este reporte.

# Verificaciones (según lo pedido)

1. Cada función extraída cumple los criterios de pureza — confirmado en "Evidencia de pureza".
2. Cada cuerpo es byte-equivalente al original — confirmado por `diff`.
3. `main.js` ya no contiene sus declaraciones originales — confirmado por `grep`.
4. Todas las llamadas existentes siguen intactas — confirmado por comparación textual contra `HEAD`.
5. `board-area.js` carga antes de `main.js` — confirmado.
6. `node --check` correcto en `board-area.js` y `main.js` — confirmado.
7. `index.html`, `board-area.js` y `main.js` responden `200` por HTTP — confirmado.
8. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/geometry/board-area.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que compara dos implementaciones cargadas de forma independiente: (a) las funciones reales extraídas en `board-area.js`, y (b) una copia de control ensamblada directamente desde el mismo fragmento de código original (`HEAD`, extraído por `sed`). Resultados reales observados (no inventados):

| Caso | `obtenerAreaColocacionBoard` |
|---|---|
| Tablero estándar con `areaColocacion` definida | `{"x":4,"y":4,"w":2432,"h":1212}` |
| Tablero con dimensiones distintas, solo `areaUtil` | `{"x":10,"y":5,"w":1830,"h":900}` |
| Tablero sin `areaColocacion` ni `areaUtil` (usa `boardW`/`boardH`) | `{"x":0,"y":0,"w":2440,"h":1220}` |
| Área cero (`boardW:0, boardH:0`, sin `areaColocacion`/`areaUtil`) | `{"x":0,"y":0,"w":0,"h":0}` |

| Caso | `obtenerKerfMaterial` |
|---|---|
| Kerf uniforme (piezas sin `kerfEfectivo` propio) | `{"valor":4,"entrePiezas":4,"piezaSobrante":4,"bordeExterior":0}` |
| Kerf cuando aplica (una pieza con `kerfEfectivo` mayor) | `{"valor":8,"entrePiezas":8,"piezaSobrante":8,"bordeExterior":2}` |
| `piezas` vacío (retorna el valor inicial) | `{"valor":6,"entrePiezas":6,"piezaSobrante":6,"bordeExterior":1}` |
| Cantidades múltiples (5 piezas, toma el máximo) | `{"valor":9,"entrePiezas":4,"piezaSobrante":4,"bordeExterior":0}` |
| Kerf cero en `parametrosProyecto` (valor límite) | `{"valor":0,"entrePiezas":0,"piezaSobrante":0,"bordeExterior":0}` |

| Caso | `textoSeguroParaExcel` |
|---|---|
| Texto normal sin caracteres especiales | `"Melamina Blanca"` (sin cambios) |
| Texto que inicia con `=` (riesgo de inyección de fórmula) | `"'=SUM(A1:A2)"` |
| Texto que inicia con `+` | `"'+1234567890"` |
| Texto que inicia con `-` | `"'-100"` |
| Texto que inicia con `@` | `"'@usuario"` |
| Valor `null` | `""` |
| Valor `undefined` | `""` |
| Valor límite: espacios en blanco antes de `=` | `"'   =PELIGRO"` |
| Número (no string) pasado como valor | `"42"` |

| Caso | `resumenErrores` |
|---|---|
| Menos errores que el máximo (sin truncar) | `"Error 1\nError 2"` |
| Exactamente el máximo (sin sufijo) | `"E1\nE2\nE3"` |
| Más errores que el máximo, 1 restante (singular "error") | `"E1\nE2\nE3\n... y 1 error mas."` |
| Más errores que el máximo, varios restantes (plural "errores") | `"E1\nE2\nE3\n... y 3 errores mas."` |
| Máximo por defecto (`undefined`, usa 8) | `"E1\n...\nE8\n... y 2 errores mas."` |
| Lista vacía | `""` |

En los 23 casos comparativos, el resultado de la implementación extraída coincidió exactamente con el de la copia de control ensamblada independientemente desde el código original — **23/23 OK**.

Adicionalmente, se verificó que ninguna de las cuatro funciones muta los objetos/arreglos recibidos como parámetro: **4/4 OK, sin mutación**.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación sin errores en consola.
- **OPT-01, OPT-04, OPT-05** — confirmar que el área de colocación y el kerf efectivo por material siguen calculándose igual que antes del cambio durante la optimización.
- **XLS-01, FMT-01** — confirmar que la exportación a Excel (que usa `textoSeguroParaExcel` en 11 puntos distintos) sigue generando archivos con el mismo contenido y protección contra fórmulas.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 28). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual del código.
- `resumenErrores` queda expuesta en `window.ProyCutBoardArea` pero, igual que `resolverValorPorJerarquia` (reporte 28), no tiene ningún llamador real; no se activó ni se conectó a nada nuevo, mismo comportamiento (ausencia de uso) que tenía antes de esta extracción.
- `obtenerMedidaTableroDefault` y `medidaTableroDeMaterial` permanecen en `main.js`; cualquier extracción futura de estas dos requeriría primero resolver su dependencia de `document`/`state`, análogo a los patrones ya usados con `LIMITES` (reporte 17) y `ENCABEZADO_FORMATO` (reporte 21).

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, las cuatro declaraciones originales en su ubicación previa (inmediatamente antes de `obtenerMedidaTableroDefault`), copiando su contenido desde `src/scripts/geometry/board-area.js`.
2. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     obtenerAreaColocacionBoard,
     obtenerKerfMaterial,
     textoSeguroParaExcel
   } = window.ProyCutBoardArea;
   ```
3. Eliminar `src/scripts/geometry/board-area.js`.
4. Eliminar la etiqueta `<script src="./src/scripts/geometry/board-area.js"></script>` de `index.html`.

Como las cuatro funciones movidas están verificadas como byte-idénticas a su versión original, este proceso de reversión es mecánico.
