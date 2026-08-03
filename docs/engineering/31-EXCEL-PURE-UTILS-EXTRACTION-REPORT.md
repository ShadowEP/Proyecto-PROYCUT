# 31-EXCEL-PURE-UTILS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción de las tres funciones puras de exportación Excel (`fechaLegibleHoy`, `extraerDimensionesSvg`, `copiarDatosParaExcel`) desde `src/scripts/main.js` hacia `src/scripts/excel/excel-utils.js`, dejando `svgAPngBuffer`, `generarDiagramasParaExcel`, `leerPiezasParaExportar`, `construirLibroExcel`, `cargarExcelJS` y `exportarExcel` sin tocar en `main.js`.

## Depende de
`src/scripts/main.js`; `src/scripts/excel/excel-utils.js`; `index.html`; `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md` (sección 9, análisis de exportación Excel realizado en chat)

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Extraer únicamente las tres funciones puras relacionadas con Excel (`fechaLegibleHoy`, `extraerDimensionesSvg`, `copiarDatosParaExcel`) hacia `src/scripts/excel/excel-utils.js`, conservando exactamente nombres, firmas, cuerpos, comentarios, expresiones regulares, formato de fecha, comportamiento de clonado, valores de retorno y orden relativo, sin tocar ninguna de las funciones acopladas de Excel.

# Funciones extraídas

Las tres funciones, ubicadas en `src/scripts/main.js` en dos puntos **no contiguos** (antes de cualquier edición):

```js
// líneas 5370-5384
function fechaLegibleHoy(){
  return new Date().toLocaleDateString('es-MX', {day:'numeric', month:'long', year:'numeric'});
}

// saca el ancho y alto reales del svg del diagrama (incluye los margenes de las cotas de
// sobrantes, que varian segun cuantos sobrantes se acotan), para poder rasterizarlo sin
// deformarlo y para calcular la altura final que va a ocupar en el Excel.
function extraerDimensionesSvg(svgTexto){ ... }
```

```js
// líneas 6005-6007, después de construirLibroExcel (no extraída) y antes de exportarExcel (no extraída)
function copiarDatosParaExcel(valor){
  return JSON.parse(JSON.stringify(valor));
}
```

`fechaLegibleHoy` y `extraerDimensionesSvg` estaban contiguas entre sí (separadas por el comentario de `extraerDimensionesSvg`); `copiarDatosParaExcel` estaba físicamente a 635 líneas de distancia, intercalada entre `construirLibroExcel` (502 líneas, no extraída) y `exportarExcel` (no extraída). Se extrajeron ambos bloques por separado, conservando el orden relativo original entre las tres (`fechaLegibleHoy` → `extraerDimensionesSvg` → `copiarDatosParaExcel`) dentro del nuevo archivo.

**No se extrajeron**: `svgAPngBuffer`, `generarDiagramasParaExcel`, `leerPiezasParaExportar`, `construirLibroExcel`, `cargarExcelJS`, `exportarExcel`, `promesaExcelJS`, las constantes de diagramas (`DIAGRAMAS_POR_HOJA`, `ESCALA_IMPRESION_PIEZAS`, `FILAS_DISPONIBLES_DIAGRAMAS`), ni el listener del botón. Todas permanecen exactamente donde estaban, sin modificar.

# Evidencia de pureza

| Criterio | `fechaLegibleHoy` | `extraerDimensionesSvg` | `copiarDatosParaExcel` |
|---|---|---|---|
| No accede a `document` | Sí | Sí | Sí |
| No accede a `state` | Sí | Sí | Sí |
| No accede a `localStorage` | Sí | Sí | Sí |
| Recibe todo por parámetros | Sí (ninguno; usa `new Date()`, global del lenguaje, no del DOM) | Sí (`svgTexto`) | Sí (`valor`) |
| Devuelve un resultado explícito | Sí (string) | Sí (`{w, h}`) | Sí (clon profundo) |
| No depende de variables internas no expuestas | Sí | Sí | Sí |
| Sin efectos secundarios | Sí | Sí | Sí |

Las tres cumplen el criterio de pureza según su comportamiento actual (confirmado en el análisis previo de solo lectura de este mismo día y re-verificado antes de modificar). `fechaLegibleHoy` depende del reloj del sistema (`new Date()`), no es "pura" en el sentido matemático estricto, pero no accede a `document`, `state` ni `localStorage`, que es el criterio de pureza usado consistentemente en todas las extracciones de este proyecto.

# Comparación byte a byte

- `diff` entre el bloque `fechaLegibleHoy` + `extraerDimensionesSvg` en `main.js` (antes de editar, líneas 5370-5384) y el cuerpo insertado en `excel-utils.js`: **sin diferencias (IDÉNTICO)**.
- `diff` entre el bloque `copiarDatosParaExcel` en `main.js` (antes de editar, líneas 6005-6007) y el cuerpo insertado en `excel-utils.js`: **sin diferencias (IDÉNTICO)**.

# Archivos creados

- **`src/scripts/excel/`** (carpeta nueva).
- **`src/scripts/excel/excel-utils.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual, en dos operaciones separadas dado que los bloques no eran contiguos en el original):
  ```js
  (function(){
    function fechaLegibleHoy(){ ... }

    // saca el ancho y alto reales del svg del diagrama ...
    function extraerDimensionesSvg(svgTexto){ ... }

    function copiarDatosParaExcel(valor){ ... }

    window.ProyCutExcelUtils = {
      fechaLegibleHoy,
      extraerDimensionesSvg,
      copiarDatosParaExcel
    };
  })();
  ```

# Archivos modificados

- **`src/scripts/main.js`**:
  - Se eliminó únicamente el bloque `fechaLegibleHoy` + `extraerDimensionesSvg` (con su comentario), sin tocar `svgAPngBuffer` (que sigue inmediatamente después, sin cambios).
  - Se eliminó únicamente la declaración de `copiarDatosParaExcel`, sin tocar `construirLibroExcel` (justo antes) ni `exportarExcel` (justo después).
  - Se agregó, al inicio de la IIFE (después del bloque de `window.ProyCutDxfExport`, antes de `let BOARD_W = 2440;`), la referencia local:
    ```js
    const {
      fechaLegibleHoy,
      extraerDimensionesSvg,
      copiarDatosParaExcel
    } = window.ProyCutExcelUtils;
    ```
  - No se modificó ninguna llamada existente: `fechaLegibleHoy()` (1 llamada, dentro de `exportarExcel`), `extraerDimensionesSvg(svgTexto)` (1 llamada, dentro de `generarDiagramasParaExcel`), `copiarDatosParaExcel(...)` (4 llamadas, dentro de `exportarExcel`) — las 6 comparadas textualmente contra el commit `HEAD` y confirmadas **idénticas**.

- **`index.html`**: se insertó `<script src="./src/scripts/excel/excel-utils.js"></script>` entre `dxf-export.js` y `main.js`, sin alterar ninguna otra etiqueta:
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
  <script src="./src/scripts/dxf/dxf-export.js"></script>
  <script src="./src/scripts/excel/excel-utils.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```

No se modificó el formato de fecha, la configuración regional (`'es-MX'`), las expresiones regulares de SVG, el comportamiento de `JSON.parse(JSON.stringify(...))`, `svgAPngBuffer`, `generarDiagramasParaExcel`, `construirLibroExcel`, `cargarExcelJS`, `exportarExcel`, `recalcular()`, `state`, ni el CSS.

# Verificaciones (según lo pedido)

1. Las tres funciones son puras según su comportamiento actual — confirmado en "Evidencia de pureza".
2. Cada cuerpo es byte-equivalente al original — confirmado por `diff` (ambos bloques, IDÉNTICO).
3. `main.js` ya no contiene sus declaraciones originales — confirmado por `grep`.
4. Todas sus llamadas siguen intactas — confirmado por comparación textual contra `HEAD` (6 llamadas, sin diferencias).
5. `excel-utils.js` carga antes de `main.js` — confirmado.
6. Las funciones acopladas de Excel permanecen en `main.js` — confirmado: `cargarExcelJS`, `svgAPngBuffer`, `generarDiagramasParaExcel`, `leerPiezasParaExportar`, `construirLibroExcel`, `exportarExcel` siguen declaradas ahí, sin modificar.
7. `node --check` correcto en `excel-utils.js` y `main.js` — confirmado.
8. `index.html`, `excel-utils.js` y `main.js` responden `200` por HTTP — confirmado.
9. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/excel/excel-utils.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que compara dos implementaciones cargadas de forma independiente: (a) las funciones reales extraídas en `excel-utils.js`, y (b) una copia de control ensamblada directamente desde los mismos dos fragmentos de código original (`HEAD`, extraídos por `sed`). Resultados reales observados (no inventados):

| Caso | Resultado |
|---|---|
| `fechaLegibleHoy()` con formato real `es-MX` (ejecutado el día de la prueba) | `"2 de agosto de 2026"` — idéntico entre extraído y control en el mismo instante |
| SVG con `width` y `height` decimales | `{"w":850.5,"h":420.25}` |
| SVG sin `width` (usa el valor por defecto 800) | `{"w":800,"h":420}` |
| SVG sin `height` (usa el valor por defecto 400) | `{"w":850,"h":400}` |
| SVG sin `width` ni `height` (usan ambos valores por defecto) | `{"w":800,"h":400}` |
| SVG con valores decimales pequeños | `{"w":123.456,"h":78.9}` |
| Texto vacío (sin coincidencia de regex) | `{"w":800,"h":400}` |
| `copiarDatosParaExcel` con objeto plano | `{"a":1,"b":"texto","c":true}` |
| `copiarDatosParaExcel` con objeto anidado (estilo + boards + pieces) | Clon exacto, estructura completa preservada |
| `copiarDatosParaExcel` con arreglo de números | `[1,2,3,4,5]` |
| `copiarDatosParaExcel` con arreglo de objetos | Clon exacto |
| `copiarDatosParaExcel` con booleanos (`true`/`false`) | Preservados exactamente |
| Copia profunda sin mutación del original | Confirmado: modificar la copia (`copia.estilo.colorPrincipal`, `copia.boards[0].boardW`) no altera el objeto original |

En los 13 casos comparativos, el resultado de la implementación extraída coincidió exactamente con el de la copia de control ensamblada independientemente desde el código original — **13/13 OK**.

**Comportamiento real documentado (no corregido) para casos límite de `copiarDatosParaExcel`**, tal como pide la tarea:

| Entrada | Resultado real observado |
|---|---|
| Objeto con `NaN` | `{"valor":null}` — `JSON.stringify` convierte `NaN` a `null`; `JSON.parse` lo deja como `null`. Confirmado idéntico entre extraído y control. |
| Objeto con `undefined` | `{"otro":1}` — `JSON.stringify` omite por completo las claves cuyo valor es `undefined`; no aparecen en el resultado. Confirmado idéntico entre extraído y control. |
| Objeto con una instancia `Date` | `{"fecha":"2026-01-01T00:00:00.000Z"}` — `JSON.stringify` serializa `Date` como string ISO 8601; tras `JSON.parse`, el campo **ya no es una instancia de `Date`**, es un `string` (`typeof` confirmado como `"string"`, no `"object"`). Confirmado idéntico entre extraído y control. |

Estos tres comportamientos son los que la función original ya tenía (es la naturaleza conocida de `JSON.parse(JSON.stringify(...))`); se documentan aquí tal cual, sin proponer ni aplicar ninguna corrección, conforme a la restricción explícita de la tarea.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **Exportar Excel completo**: hacer clic en "Exportar" con un proyecto válido y confirmar que el archivo `.xlsx` se descarga sin errores.
- **Confirmar nombre del archivo**: el nombre debe seguir el patrón `optimizador-cortes-bamteck-AAAA-MM-DD.xlsx`, sin cambios respecto a antes de esta extracción.
- **Abrir las tres hojas**: "Piezas y diagramas", "Reporte" y "Resumen y precio" deben abrir correctamente y mostrar los datos esperados.
- **Comprobar que los diagramas se incrustan**: la hoja "Piezas y diagramas" debe mostrar las imágenes PNG de cada tablero (esto depende de `extraerDimensionesSvg`, ahora en el nuevo módulo, usada por `generarDiagramasParaExcel`, que permanece en `main.js`).
- **Confirmar estilos, colores y fuentes**: el Excel generado debe reflejar el mismo `estilo` configurado en "Ajuste de la interfaz" (colores, tipografía), sin cambios visuales respecto a antes.
- **Revisar consola**: confirmar que no aparece ningún error ni advertencia nueva relacionada con `ProyCutExcelUtils`, `fechaLegibleHoy`, `extraerDimensionesSvg` o `copiarDatosParaExcel`.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 30). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual/byte a byte del código.
- `fechaLegibleHoy` depende del reloj y la configuración regional del entorno donde se ejecuta (`'es-MX'`); la prueba automática solo pudo comparar que ambas implementaciones (extraída y control) producen el mismo resultado en el mismo instante de ejecución, no un valor fijo predefinido — esto es inherente a la naturaleza de la función, no una limitación de la extracción.
- `construirLibroExcel`, `generarDiagramasParaExcel`, `leerPiezasParaExportar`, `svgAPngBuffer` y `cargarExcelJS` permanecen en `main.js`, todas bloqueadas por dependencias no resueltas (`calcularSobrantes`/`areaSobranteTotal` del optimizador, `dibujarBoard` del diagrama SVG, y `document` respectivamente), tal como se documentó en el análisis previo de solo lectura de exportación Excel realizado en esta misma sesión.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, la declaración de `fechaLegibleHoy` + `extraerDimensionesSvg` en su ubicación previa (inmediatamente antes de `svgAPngBuffer`), copiando su contenido desde `src/scripts/excel/excel-utils.js`.
2. Restaurar la declaración de `copiarDatosParaExcel` en su ubicación previa (inmediatamente después de `construirLibroExcel`, antes de `exportarExcel`), copiando su contenido desde el mismo archivo.
3. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     fechaLegibleHoy,
     extraerDimensionesSvg,
     copiarDatosParaExcel
   } = window.ProyCutExcelUtils;
   ```
4. Eliminar `src/scripts/excel/excel-utils.js` y, si queda vacía, la carpeta `src/scripts/excel/`.
5. Eliminar la etiqueta `<script src="./src/scripts/excel/excel-utils.js"></script>` de `index.html`.

Como las tres funciones movidas están verificadas como byte-idénticas a su versión original, este proceso de reversión es mecánico.
