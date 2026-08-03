# 20-CSV-UTILS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la evaluación y extracción parcial de las funciones de parseo CSV (`separarLineaCSV`, `parsearCSV`) desde `src/scripts/main.js` hacia `src/scripts/utils/csv.js`, incluyendo la justificación de por qué `parsearCSV` no se extrajo.

## Depende de
`src/scripts/main.js`; `src/scripts/utils/csv.js`; `index.html`; `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md`; `docs/engineering/17-LIMITS-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Evaluar la pureza de `separarLineaCSV` y `parsearCSV` en `src/scripts/main.js` y extraer a `src/scripts/utils/csv.js` únicamente aquellas que cumplan el criterio de pureza (sin dependencias de `document`, `state`, `localStorage`, ni de constantes/variables internas de la IIFE de `main.js`), conservando exactamente firma, comentarios, cuerpo y comportamiento.

# Funciones evaluadas

## `separarLineaCSV(linea)`

```js
function separarLineaCSV(linea){
  return linea.split(',').map(c => c.trim());
}
```

- No usa `document`, `state`, `localStorage`.
- No usa ninguna constante ni variable interna de la IIFE de `main.js`.
- Recibe todo por parámetro (`linea`), retorna un resultado explícito, sin efectos secundarios.
- **Cumple el criterio de pureza. Se extrae.**

## `parsearCSV(texto)`

Cuerpo revisado en `src/scripts/main.js` (antes de cualquier edición). Referencias detectadas:

```js
if(encabezado.length !== LIMITES.csvColumnas){ ... }
...
ENCABEZADO_FORMATO.forEach((nombre, i) => { ... });
...
if(datos.length > LIMITES.csvFilas){ ... }
```

- Usa `LIMITES.csvColumnas` y `LIMITES.csvFilas` — accesible vía `window.ProyCutLimits`, no sería un impedimento por sí solo.
- Usa `ENCABEZADO_FORMATO`, un `const` declarado dentro de la propia IIFE de `main.js` (línea 1338: `const ENCABEZADO_FORMATO = ['Cantidad','Largo_mm','Ancho_mm','Girar','Material','L1','L2','A1','A2','Tipo_tapacanto','Etiqueta'];`), **no expuesto globalmente** y fuera del alcance autorizado por esta tarea (no se pidió extraer `ENCABEZADO_FORMATO`, ni extraer funciones adicionales a las dos evaluadas).
- **No cumple el criterio "no depende de variables internas de la IIFE". No se extrae.**

Este es el mismo patrón de bloqueo ya documentado con `LIMITES` en `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md`, ahora con `ENCABEZADO_FORMATO` como la dependencia interna no resuelta. A diferencia de aquel caso, esta tarea autorizó explícitamente no extraer y solo explicar el motivo, por lo que no se solicitó decisión al usuario.

# Funciones extraídas

Únicamente `separarLineaCSV`.

# Funciones descartadas y motivo

`parsearCSV`: depende de `ENCABEZADO_FORMATO`, constante interna de la IIFE de `main.js`, no expuesta globalmente y fuera del alcance de esta tarea. Permanece sin modificar en `src/scripts/main.js`.

# Archivos creados

- **`src/scripts/utils/csv.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual) del rango de líneas original que contenía el comentario y la declaración de `separarLineaCSV`:

```js
(function(){
  // separa una linea de CSV en columnas (no soporta comillas con comas adentro, suficiente
  // para el formato numerico/texto simple que se exporta desde el boton "Exportar formato").
  function separarLineaCSV(linea){
    return linea.split(',').map(c => c.trim());
  }

  window.ProyCutCSV = {
    separarLineaCSV
  };
})();
```

# Archivos modificados

- **`src/scripts/main.js`**:
  - Se eliminó únicamente la declaración original de `separarLineaCSV` (con su comentario de dos líneas), dejando `parsearCSV` sin modificar inmediatamente después del punto donde estaba `separarLineaCSV`.
  - Se agregó, al inicio de la IIFE (después del bloque de `text-normalization`, antes de `let BOARD_W = 2440;`), la referencia local:
    ```js
    const {
      separarLineaCSV
    } = window.ProyCutCSV;
    ```
  - No se modificó `parsearCSV` ni ninguna otra función. Las dos llamadas internas a `separarLineaCSV(...)` dentro de `parsearCSV` (líneas 1499 y 1514 tras el cambio) permanecen exactamente iguales y ahora resuelven a través de la referencia desestructurada.

- **`index.html`**: se insertó `<script src="./src/scripts/utils/csv.js"></script>` entre `text-normalization.js` y `main.js`, sin alterar ninguna otra etiqueta:
  ```html
  <script src="./src/scripts/utils/format.js"></script>
  <script src="./src/scripts/config/limits.js"></script>
  <script src="./src/scripts/utils/validation.js"></script>
  <script src="./src/scripts/utils/text-normalization.js"></script>
  <script src="./src/scripts/utils/csv.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```

No se modificó `text-normalization.js`, `validation.js`, `LIMITES`, `state`, `recalcular`, el optimizador, ni el CSS.

# Comparación

- `diff` entre el cuerpo de `separarLineaCSV` en `csv.js` y su versión original en `main.js` (antes de editar): **sin diferencias (IDÉNTICO)**.
- Búsqueda de `function separarLineaCSV(` al inicio de línea en `main.js` tras el cambio: **sin coincidencias**.
- Búsqueda de `separarLineaCSV(` (llamadas) en `main.js`: 2 coincidencias, ambas dentro de `parsearCSV`, sin modificar.
- `node --check` sobre `csv.js` y `main.js`: ambos sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `csv.js`, `text-normalization.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados) y `src/scripts/utils/csv.js` (nuevo), además de este reporte.

# Verificaciones (según lo pedido)

1. `separarLineaCSV` evaluada como pura y extraída — confirmado.
2. `parsearCSV` evaluada como no pura (depende de `ENCABEZADO_FORMATO` interno) y no extraída — confirmado y documentado.
3. `csv.js` expone únicamente `separarLineaCSV` en `window.ProyCutCSV` — confirmado.
4. `main.js` ya no contiene la declaración original de `separarLineaCSV` — confirmado.
5. Las 2 llamadas existentes a `separarLineaCSV` dentro de `parsearCSV` siguen iguales — confirmado.
6. `csv.js` carga antes que `main.js` en `index.html` — confirmado.
7. `node --check` correcto en `csv.js` y `main.js` — confirmado.
8. `index.html`, `csv.js`, `text-normalization.js` y `main.js` responden `200` por HTTP — confirmado.
9. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/utils/csv.js` y este reporte — confirmado por `git status --short`.

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que carga `csv.js` de forma aislada y ejercita `separarLineaCSV` directamente. Como `parsearCSV` no fue extraída, los casos de nivel "archivo CSV completo" (múltiples filas, encabezados como fila completa) se probaron contra `separarLineaCSV` como el procesamiento de una sola línea a la vez, que es el alcance real de la función extraída. Resultados reales observados (no inventados):

| Caso | Input | Resultado real |
|---|---|---|
| Línea simple con comas | `2,600,400,normal` | `["2","600","400","normal"]` |
| Campos entre comillas | `"Melamina Blanca",600,400` | `["\"Melamina Blanca\"","600","400"]` (las comillas **no** se eliminan) |
| Coma dentro de comillas | `"Melamina, Blanca",600,400` | `["\"Melamina","Blanca\"","600","400"]` — **se divide dentro del campo entrecomillado**, produciendo 4 columnas en vez de 3 |
| Comillas escapadas estilo CSV (`""`) | `"Melamina ""Blanca""",600,400` | `["\"Melamina \"\"Blanca\"\"\"","600","400"]` (sin coma interna, no se fragmenta; las comillas quedan literales) |
| Línea vacía | `""` (cadena vacía) | `[""]` |
| Fila de encabezados | `Cantidad,Largo_mm,Ancho_mm,Girar,Material` | `["Cantidad","Largo_mm","Ancho_mm","Girar","Material"]` |
| Valores vacíos entre comas | `2,,400,,normal` | `["2","","400","","normal"]` |
| Espacios alrededor de valores | ` 2 , 600 , 400 ` | `["2","600","400"]` (se recortan espacios) |
| Salto de línea incrustado | `"2,600\n,400"` | `["2","600","400"]` (el `\n` se recorta por `trim()`, no se trata como separador de fila) |

**Confirmación del comportamiento documentado en el propio comentario del código**: el caso "coma dentro de comillas" confirma exactamente la limitación que el comentario original advierte — *"no soporta comillas con comas adentro"*. La función no implementa ningún manejo de comillas como delimitador protegido; simplemente divide por `,` y recorta espacios en cada trozo. Este comportamiento es idéntico antes y después de la extracción (mismo código, byte a byte).

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación sin errores en consola.
- Pruebas de **importación CSV** (formato numérico) que ejercitan `parsearCSV` de extremo a extremo, incluyendo: archivo válido, archivo con columnas incorrectas (mensaje de `LIMITES.csvColumnas`), archivo con más filas que `LIMITES.csvFilas`, y archivo con encabezados que no coinciden con `ENCABEZADO_FORMATO`.
- Confirmar visualmente que una importación CSV real con un campo que contenga una coma (por ejemplo, un nombre de material con coma, aunque no esté entrecomillado en la práctica actual) se sigue comportando igual que antes del cambio (no se esperaba que funcionara antes tampoco, dado el comentario original).

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 19). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual del código.
- `parsearCSV` permanece sin extraer y sigue dependiendo de `ENCABEZADO_FORMATO`, interno a `main.js`. Esto significa que `src/scripts/utils/csv.js` es una extracción parcial: la lógica completa de importación CSV (encabezados, límites de filas/columnas, mapeo a objetos) sigue viviendo en `main.js`, igual que antes del cambio.
- `separarLineaCSV` no maneja comillas ni comas internas de forma robusta (comportamiento heredado, sin cambios). Cualquier extracción futura de `parsearCSV` deberá primero exponer `ENCABEZADO_FORMATO` (siguiendo el mismo patrón usado con `LIMITES` en `docs/engineering/17-LIMITS-EXTRACTION-REPORT.md`), lo cual no fue autorizado ni realizado en esta tarea.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, la declaración original de `separarLineaCSV` (con su comentario de dos líneas) en su ubicación previa, inmediatamente antes de `parsearCSV`, copiando su contenido desde `src/scripts/utils/csv.js`.
2. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     separarLineaCSV
   } = window.ProyCutCSV;
   ```
3. Eliminar `src/scripts/utils/csv.js`.
4. Eliminar la etiqueta `<script src="./src/scripts/utils/csv.js"></script>` de `index.html`.

Como la función movida está verificada como byte-idéntica a su versión original, este proceso de reversión es mecánico.
