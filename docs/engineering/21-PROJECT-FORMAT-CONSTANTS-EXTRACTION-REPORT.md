# 21-PROJECT-FORMAT-CONSTANTS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la evaluación y extracción de la constante `ENCABEZADO_FORMATO` desde `src/scripts/main.js` hacia `src/scripts/config/project-format.js`, resolviendo la dependencia interna que impidió extraer `parsearCSV` en `docs/engineering/20-CSV-UTILS-EXTRACTION-REPORT.md`.

## Depende de
`src/scripts/main.js`; `src/scripts/config/project-format.js`; `src/scripts/utils/csv.js`; `index.html`; `docs/engineering/20-CSV-UTILS-EXTRACTION-REPORT.md`; `docs/engineering/17-LIMITS-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Identificar y extraer únicamente la constante `ENCABEZADO_FORMATO` (y cualquier constante estática de la que dependiera de forma inseparable) desde `src/scripts/main.js` hacia `src/scripts/config/project-format.js`, sin extraer `parsearCSV` todavía.

# Constante evaluada

## `ENCABEZADO_FORMATO`

Declaración localizada en `src/scripts/main.js`, línea 1342, dentro del bloque comentado `// ---------- Formato de proyecto (piezas + componentes) e Importar ----------`:

```js
const ENCABEZADO_FORMATO = ['Cantidad','Largo_mm','Ancho_mm','Girar','Material','L1','L2','A1','A2','Tipo_tapacanto','Etiqueta'];
```

**Referencias identificadas** (4, todas dentro de `src/scripts/main.js`, antes del cambio):

| Línea (antes) | Uso |
|---|---|
| 1390 | `wsPiezasFormato.addRow(ENCABEZADO_FORMATO);` |
| 1504 | `ENCABEZADO_FORMATO.forEach((nombre, i) => { ... });` (dentro de `parsearCSV`) |
| 1679 | `errores.push(...validarEncabezadoHoja(wsPiezas, ENCABEZADO_FORMATO, 'Piezas'));` |
| 1704 | `filasPiezas:leerRegistrosHoja(wsPiezas, ENCABEZADO_FORMATO.length),` |

Se confirmó con una búsqueda en todo el repositorio (`*.js`, `*.html`) que no existen referencias a `ENCABEZADO_FORMATO` fuera de `src/scripts/main.js`.

# Dependencias detectadas

`ENCABEZADO_FORMATO` es un literal de arreglo de cadenas de texto (`['Cantidad', 'Largo_mm', ...]`). No referencia ninguna otra constante, variable ni expresión. Es completamente autosuficiente.

En la misma línea del código fuente existen constantes **hermanas** declaradas de forma independiente inmediatamente después (`ENCABEZADO_COMPONENTES_FORMATO`, `ENCABEZADO_MATERIALES_FORMATO`, `IDENTIFICADOR_FORMATO_PROYECTO`, `VERSION_FORMATO_PROYECTO`), pero **ninguna de ellas es referenciada dentro del valor de `ENCABEZADO_FORMATO`**, ni `ENCABEZADO_FORMATO` es referenciada dentro de ellas. Son declaraciones paralelas sin relación de dependencia entre sí, simplemente agrupadas bajo el mismo comentario de sección.

**Conclusión**: `ENCABEZADO_FORMATO` no depende de ninguna otra constante. No fue necesario ampliar el alcance de la extracción. Las constantes hermanas permanecen sin modificar en `src/scripts/main.js`.

# Constante extraída

Únicamente `ENCABEZADO_FORMATO`.

# Archivos creados

- **`src/scripts/config/project-format.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual, siguiendo el mismo procedimiento adoptado desde el incidente documentado en `docs/engineering/19-TEXT-NORMALIZATION-EXTRACTION-REPORT.md`) de la línea 1342 original de `main.js`:

```js
(function(){
  const ENCABEZADO_FORMATO = ['Cantidad','Largo_mm','Ancho_mm','Girar','Material','L1','L2','A1','A2','Tipo_tapacanto','Etiqueta'];

  window.ProyCutProjectFormat = {
    ENCABEZADO_FORMATO
  };
})();
```

# Archivos modificados

- **`src/scripts/main.js`**:
  - Se eliminó únicamente la línea de declaración original de `ENCABEZADO_FORMATO`. La línea de comentario de sección (`// ---------- Formato de proyecto (piezas + componentes) e Importar ----------`) y las cuatro constantes hermanas permanecen exactamente en su lugar, sin modificar.
  - Se agregó, al inicio de la IIFE (después del bloque de `csv.js`, antes de `let BOARD_W = 2440;`), la referencia local:
    ```js
    const {
      ENCABEZADO_FORMATO
    } = window.ProyCutProjectFormat;
    ```
  - No se modificó ninguna de las 4 referencias existentes a `ENCABEZADO_FORMATO`; todas siguen escritas exactamente igual y ahora resuelven a través de la referencia desestructurada.

- **`index.html`**: se insertó `<script src="./src/scripts/config/project-format.js"></script>` entre `text-normalization.js` y `csv.js` (antes de ambos `csv.js` y `main.js`, como exigía la tarea), sin alterar ninguna otra etiqueta:
  ```html
  <script src="./src/scripts/utils/format.js"></script>
  <script src="./src/scripts/config/limits.js"></script>
  <script src="./src/scripts/utils/validation.js"></script>
  <script src="./src/scripts/utils/text-normalization.js"></script>
  <script src="./src/scripts/config/project-format.js"></script>
  <script src="./src/scripts/utils/csv.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```

No se modificó `parsearCSV`, `separarLineaCSV`, `csv.js`, `validation.js`, `LIMITES`, `state`, `recalcular`, el DOM, el optimizador, ni el CSS. No se movieron las constantes hermanas (`ENCABEZADO_COMPONENTES_FORMATO`, `ENCABEZADO_MATERIALES_FORMATO`, `IDENTIFICADOR_FORMATO_PROYECTO`, `VERSION_FORMATO_PROYECTO`).

# Comparación

- `diff` entre la línea del literal en `project-format.js` y la línea original en `main.js` (antes de editar): **sin diferencias (IDÉNTICO)**.
- Búsqueda de `const ENCABEZADO_FORMATO` en `main.js` tras el cambio: **sin coincidencias**.
- Búsqueda de todas las apariciones de `ENCABEZADO_FORMATO` en `main.js` tras el cambio: 5 coincidencias — 1 es la nueva desestructuración (línea 33), las otras 4 son las referencias originales sin modificar (líneas 1393, 1507, 1682, 1707, desplazadas por la eliminación de la línea de declaración).
- `node --check` sobre `project-format.js`, `csv.js` y `main.js`: los tres sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `project-format.js`, `csv.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados) y `src/scripts/config/project-format.js` (nuevo), además de este reporte.

# Archivos creados (resumen)

`src/scripts/config/project-format.js`

# Archivos modificados (resumen)

`index.html`, `src/scripts/main.js`

# Verificaciones (según lo pedido)

1. La constante extraída es byte-equivalente a la original — confirmado por `diff`.
2. `main.js` ya no contiene su declaración original — confirmado por `grep`.
3. Todas sus 4 referencias siguen intactas — confirmado por `grep`, mismas líneas de código, sin modificar.
4. `project-format.js` carga antes de `csv.js` y de `main.js` en `index.html` — confirmado.
5. `project-format.js` no accede a `document`, `state` ni `localStorage` — confirmado por `grep` (sin coincidencias).
6. `node --check` correcto en `project-format.js`, `csv.js` y `main.js` — confirmado.
7. `index.html`, `project-format.js`, `csv.js` y `main.js` responden `200` por HTTP — confirmado.
8. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/config/project-format.js` y este reporte — confirmado por `git status --short`.

# Prueba automática

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que carga `project-format.js` de forma aislada:

| Verificación | Resultado real |
|---|---|
| `window.ProyCutProjectFormat` existe (objeto) | `true` |
| `ENCABEZADO_FORMATO` tiene exactamente el valor original | `true` → `["Cantidad","Largo_mm","Ancho_mm","Girar","Material","L1","L2","A1","A2","Tipo_tapacanto","Etiqueta"]` |
| La desestructuración `const { ENCABEZADO_FORMATO } = window.ProyCutProjectFormat;` usada en `main.js` funciona (longitud 11) | `true` |
| Contenido tras desestructurar es idéntico al original | `true` |

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación sin errores en consola.
- Pruebas de **exportación de formato** (botón "Exportar formato") que usan `ENCABEZADO_FORMATO` como encabezado de la hoja (`wsPiezasFormato.addRow`).
- Pruebas de **importación CSV/Excel** (formato de piezas) que validan el encabezado del archivo contra `ENCABEZADO_FORMATO` (`validarEncabezadoHoja`) y leen registros según su longitud (`leerRegistrosHoja`).
- Confirmar que un archivo de importación con encabezado correcto se acepta igual que antes del cambio, y que uno con encabezado incorrecto produce el mismo mensaje de error que antes.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 20). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual del código.
- `parsearCSV` permanece sin extraer (fuera del alcance de esta tarea). Con `ENCABEZADO_FORMATO` ya expuesto vía `window.ProyCutProjectFormat`, la dependencia que bloqueaba su extracción en `docs/engineering/20-CSV-UTILS-EXTRACTION-REPORT.md` queda resuelta, pero esa extracción no se realizó en esta tarea y requeriría una evaluación propia (incluyendo `LIMITES.csvColumnas`/`LIMITES.csvFilas`, ya resueltos previamente).
- Las constantes hermanas (`ENCABEZADO_COMPONENTES_FORMATO`, `ENCABEZADO_MATERIALES_FORMATO`, `IDENTIFICADOR_FORMATO_PROYECTO`, `VERSION_FORMATO_PROYECTO`) permanecen internas a la IIFE de `main.js`; cualquier extracción futura de código que las use deberá evaluarlas por separado.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, la declaración original de `ENCABEZADO_FORMATO` en su ubicación previa (inmediatamente después del comentario `// ---------- Formato de proyecto (piezas + componentes) e Importar ----------`, antes de `ENCABEZADO_COMPONENTES_FORMATO`), copiando su contenido desde `src/scripts/config/project-format.js`.
2. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     ENCABEZADO_FORMATO
   } = window.ProyCutProjectFormat;
   ```
3. Eliminar `src/scripts/config/project-format.js`.
4. Eliminar la etiqueta `<script src="./src/scripts/config/project-format.js"></script>` de `index.html`.

Como la constante movida está verificada como byte-idéntica a su versión original, este proceso de reversión es mecánico.
