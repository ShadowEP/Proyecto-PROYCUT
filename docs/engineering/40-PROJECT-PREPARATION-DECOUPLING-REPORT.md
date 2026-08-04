# 40-PROJECT-PREPARATION-DECOUPLING-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-04

## Propósito
Registrar el cuarto desacoplamiento arquitectónico de ProyCut: aislar en `src/scripts/project/prepare-project.js` la coordinación de preparación y validación que ocurría al inicio de `recalcular()`, hasta inmediatamente antes de comenzar la optimización, sin modificar el optimizador, el cálculo de costos, `state.boards`, los reportes, el renderizado, la importación, la exportación ni las reglas de negocio.

## Depende de
`src/scripts/main.js`; `src/scripts/project/prepare-project.js`; `src/scripts/pieces/project-model.js`; `src/scripts/pieces/pieces-dom-reader.js`; `src/scripts/config/hierarchical-config.js`; `index.html`; `docs/engineering/36-ARCHITECTURAL-DECOUPLING-PLAN.md`; `docs/engineering/37-COST-CALCULATION-DECOUPLING-REPORT.md`; `docs/engineering/38-PIECES-DOM-READING-DECOUPLING-REPORT.md`; `docs/engineering/39-PROJECT-MODEL-DECOUPLING-REPORT.md`

## Referenciado por
PENDIENTE

---

# 1. Bloque original analizado

El bloque analizado comenzaba en la declaración de `recalcular()` y terminaba justo antes de inicializar los acumuladores y estructuras usados por la optimización. Antes del cambio correspondía a `src/scripts/main.js`, líneas **4621–4672**:

1. Leer una vez las filas de `#piezasBody` mediante `leerFilasPiezasDesdeDOM()`.
2. Leer `#cantidadProyectos` mediante `obtenerCantidadProyectos()`.
3. Construir el modelo temporal con `construirModeloProyecto(...)`.
4. Ejecutar `validarProyecto(modeloProyecto)`.
5. Reproducir la salida temprana de validación si había errores.
6. Resolver kerf y márgenes mediante `resolverParametrosCorteEtapa4()`.
7. Reproducir la salida temprana de parámetros de corte si la resolución fallaba.
8. Leer precio por corte, precio por metro, modo de precio, modo libre/guillotina y nivel de optimización.
9. Ejecutar `leerPiezas(parametrosCorte, modeloProyecto)`.
10. Mostrar los errores o avisos devueltos por la lectura de piezas.
11. Reproducir la salida temprana si no quedaba ninguna pieza utilizable.
12. Agrupar las piezas expandidas por material.

La optimización comenzaba después de ese bloque, con la inicialización de `totalCortes`, `totalCorteMm`, `boardsAll` y `tablerosPorMaterial`, seguida del recorrido de `Object.keys(porMaterial)` y la llamada posterior a `empacarMaterial(...)`.

# 2. Responsabilidades aisladas

La nueva función `prepararProyectoParaOptimizacion(...)` coordina únicamente:

- validación del modelo temporal y del proyecto mediante la dependencia existente `validarProyecto`;
- resolución de los parámetros de corte mediante `resolverParametrosCorte`;
- lectura ordenada de las opciones que necesitarán optimización y costos;
- transformación, normalización, expansión por cantidad y comprobación de ajuste de piezas mediante la dependencia existente `leerPiezas`;
- detección de que no existe ninguna pieza utilizable;
- agrupación de las piezas resultantes por material;
- construcción de un resultado discriminado de éxito o error.

La función no implementa nuevamente validadores ni reglas de piezas. Coordina las funciones existentes para conservar sus mensajes, defaults, orden, expansión, normalización de giro, tolerancias y comprobaciones de ajuste.

La función nueva no:

- ejecuta `empacarMaterial` ni ninguna otra operación de optimización;
- calcula costos;
- accede a `document`, `state` o `localStorage`;
- renderiza;
- muestra u oculta paneles;
- modifica reportes;
- importa o exporta datos;
- modifica sus entradas.

# 3. Contrato de entrada

```js
prepararProyectoParaOptimizacion({
  modeloProyecto,
  validarProyecto,
  resolverParametrosCorte,
  leerOpcionesProyecto,
  leerPiezas
})
```

- **`modeloProyecto`**: modelo temporal ya construido por `recalcular()` con las filas crudas y la cantidad de proyectos del ciclo actual.
- **`validarProyecto`**: función existente que conserva todas las validaciones actuales del proyecto y devuelve `{ok, errores}`.
- **`resolverParametrosCorte`**: dependencia controlada que resuelve la configuración jerárquica de kerf y márgenes.
- **`leerOpcionesProyecto`**: función controlada por `recalcular()` que lee, en el punto original del flujo, `precioCorte`, `precioCorteMetro`, `modoPrecioCorte`, `libre` y `nivelOptimizacion`.
- **`leerPiezas`**: función existente que recibe los parámetros resueltos y el modelo temporal, y devuelve las piezas normalizadas/expandidas junto con sus errores.

Las dependencias se reciben explícitamente. Esto permite que el módulo de preparación no conozca el DOM ni el cierre privado de `main.js`, a la vez que mantiene la secuencia original de ejecución.

# 4. Contrato de salida

## 4.1 Éxito

```js
{
  ok: true,
  parametrosCorteProyecto,
  piezas,
  gruposPorMaterial,
  opcionesProyecto,
  errores
}
```

- **`parametrosCorteProyecto`**: resultado real de `resolverParametrosCorteEtapa4()`.
- **`piezas`**: arreglo producido por `leerPiezas`, ya normalizado y expandido por cantidad de piezas y cantidad de proyectos.
- **`gruposPorMaterial`**: objeto cuyas claves son los materiales y cuyos valores son los mismos objetos de `piezas`, conservando su orden relativo.
- **`opcionesProyecto`**: valores leídos en el mismo orden y con los mismos defaults que antes (`precioCorte`, `precioCorteMetro`, `modoPrecioCorte`, `libre`, `nivelOptimizacion`).
- **`errores`**: avisos o errores devueltos por `leerPiezas`. Pueden coexistir con piezas válidas, igual que en el flujo original.

## 4.2 Error

```js
{
  ok: false,
  etapa,
  errores
}
```

`etapa` permite a `recalcular()` reproducir los efectos secundarios exactos de la rama original sin trasladar DOM o `state` al módulo nuevo.

# 5. Tipos de error

## 5.1 `validacion`

Se devuelve cuando `validarProyecto(modeloProyecto)` produce `ok:false`.

- No se resuelven nuevamente los parámetros de corte desde la función de preparación.
- No se leen las opciones posteriores.
- No se ejecuta `leerPiezas`.
- Los mensajes se devuelven sin modificación.

## 5.2 `parametros-corte`

Se devuelve cuando la resolución explícita de parámetros de corte produce `ok:false` después de haber superado la validación general.

- No se leen las opciones posteriores.
- No se ejecuta `leerPiezas`.
- Los mensajes de kerf/márgenes se devuelven sin modificación.

Esta segunda resolución se conserva aunque `validarProyecto` ya resuelve parámetros internamente, porque esa era la secuencia real previa al desacoplamiento.

## 5.3 `piezas`

Se devuelve cuando `leerPiezas(...)` termina con `piezas.length === 0`.

- Las opciones ya fueron leídas, igual que antes.
- Los errores de piezas se devuelven exactamente como los produjo `leerPiezas`.
- La etapa discriminada permite conservar la diferencia histórica de `state.ultimoTotal` descrita en la sección 8.

Si existen errores de algunas piezas pero también al menos una pieza utilizable, el resultado es exitoso y conserva esos errores para mostrarlos antes de continuar con la optimización, igual que en el flujo original.

# 6. Funciones y dependencias

```text
recalcular()
  → leerFilasPiezasDesdeDOM()
  → obtenerCantidadProyectos()
  → construirModeloProyecto(...)
  → prepararProyectoParaOptimizacion({
      modeloProyecto,
      validarProyecto,
      resolverParametrosCorte: resolverParametrosCorteEtapa4,
      leerOpcionesProyecto,
      leerPiezas
    })
      → validarProyecto(modeloProyecto)
      → resolverParametrosCorteEtapa4()
      → leerOpcionesProyecto()
      → leerPiezas(parametrosCorteProyecto, modeloProyecto)
      → agrupar piezas por material
  → efectos visuales y de state
  → optimización existente
```

Dependencias indirectas importantes que conservan su implementación previa:

- `validarProyecto` mantiene `validarNumeroEntrada`, `validarCantidad`, `validarMedida`, `validarPrecio`, validación de catálogos y validación del límite de piezas expandidas.
- `resolverParametrosCorteEtapa4` mantiene la jerarquía de configuración y los mensajes de kerf/márgenes.
- `leerPiezas` mantiene `obtenerNivelOptimizacion`, resolución por pieza, medidas de tablero por material, geometría útil/de colocación, expansión y comprobación de piezas que no caben.
- `construirModeloProyecto` y `leerFilasPiezasDesdeDOM` permanecen responsables del modelo temporal y la lectura cruda, respectivamente.

El módulo se expone sin ES modules mediante:

```js
window.ProyCutProjectPreparation = {
  prepararProyectoParaOptimizacion
};
```

`index.html` carga `prepare-project.js` después de los módulos de piezas y antes de `main.js`.

# 7. Efectos que permanecen en `recalcular()`

Todos los efectos observables permanecen fuera de `prepararProyectoParaOptimizacion`:

- lectura inicial de las filas del DOM y de la cantidad de proyectos;
- construcción del modelo temporal;
- lectura concreta del DOM dentro de `leerOpcionesProyecto`;
- llamada a `mostrarErroresProyecto(...)`;
- ocultar `resultadoPanel` y `reportePanel` en las salidas tempranas;
- vaciar `state.boards`;
- limpiar `state.ultimoReporte`;
- decidir si se reinicia o conserva `state.ultimoTotal` según la etapa;
- devolver `false` en cualquier salida temprana;
- ejecutar optimización y compactación;
- asignar `state.boards` y `state.activeTab`;
- renderizar diagrama y reporte;
- calcular costos;
- guardar `state.ultimoTotal` y `state.ultimoReporte` en el flujo exitoso;
- devolver `true` al completar todo el recálculo.

No se agregaron timers ni listeners. `recalcularDebounced()` y la cancelación de debounces hecha por los flujos de exportación permanecen sin cambios.

# 8. Comportamiento de `state.ultimoTotal` preservado

El flujo original tenía una diferencia deliberadamente preservada:

| Rama | Comportamiento original | Comportamiento actual |
|---|---|---|
| Validación general inválida | `state.ultimoTotal = 0` | Se reinicia porque `etapa !== 'piezas'` |
| Parámetros de corte inválidos | `state.ultimoTotal = 0` | Se reinicia porque `etapa !== 'piezas'` |
| Cero piezas utilizables | No se asignaba `state.ultimoTotal` | Se conserva porque `etapa === 'piezas'` |

La rama común de `recalcular()` aplica:

```js
if(preparacion.etapa !== 'piezas') state.ultimoTotal = 0;
```

Esto evita introducir una corrección funcional no solicitada. Aunque el valor conservado en la rama `piezas` pueda parecer inconsistente, modificarlo habría cambiado el comportamiento observable y estaba fuera del objetivo del desacoplamiento.

# 9. Comparación contra el flujo original

| Orden | Flujo original | Flujo desacoplado | Equivalencia |
|---|---|---|---|
| 1 | Leer filas | `recalcular()` lee filas | Idéntica |
| 2 | Leer cantidad de proyectos | `recalcular()` lee cantidad | Idéntica |
| 3 | Construir modelo | `recalcular()` construye modelo | Idéntica |
| 4 | `validarProyecto(modeloProyecto)` | Preparación llama la misma función | Idéntica |
| 5 | Salida de validación | Resultado `etapa:'validacion'`; efectos en `recalcular()` | Mismos mensajes, estado y `false` |
| 6 | `resolverParametrosCorteEtapa4()` | Preparación llama la misma función | Idéntica |
| 7 | Salida de corte | Resultado `etapa:'parametros-corte'`; efectos en `recalcular()` | Mismos mensajes, estado y `false` |
| 8 | Leer opciones | Callback `leerOpcionesProyecto()` | Mismos campos, defaults y orden |
| 9 | `leerPiezas(...)` | Preparación llama la misma función | Idéntica |
| 10 | Mostrar errores de piezas | `recalcular()` muestra `preparacion.errores` | Idéntica |
| 11 | Salida sin piezas | Resultado `etapa:'piezas'`; efectos en `recalcular()` | Mismos paneles, estado y `false` |
| 12 | Agrupar por material | Preparación ejecuta la misma operación | Mismas claves, piezas y orden |
| 13 | Optimizar | Permanece en `recalcular()` | Sin cambios |

La fase posterior sigue recibiendo `parametrosCorte`, `piezas`, `porMaterial`, `precioCorte`, `precioCorteMetro`, `modoPrecioCorte`, `libre` y `nivelOptimizacion`. No cambió ninguna llamada al optimizador ni al cálculo de costos.

# 10. Cinco escenarios automatizados ejecutados

Se cargó el módulo real con Node mediante `vm.runInThisContext`, sin dependencias nuevas, y se probaron dependencias controladas para verificar orden, contrato y no mutación.

1. **Error de validación**: confirmó orden `['validar']`, `ok:false` y `etapa:'validacion'`; las dependencias posteriores no se ejecutaron.
2. **Error de parámetros de corte**: confirmó orden `['validar','resolver']`, `ok:false` y `etapa:'parametros-corte'`; no se leyeron opciones ni piezas.
3. **Cero piezas utilizables**: confirmó orden `['validar','resolver','opciones','piezas']`, `ok:false`, `etapa:'piezas'` y conservación de los errores de piezas.
4. **Éxito con varios materiales**: tres piezas (`A`, `B`, `A`) produjeron dos grupos, con dos piezas en `A` y una en `B`, conservando orden y referencias.
5. **Contrato y no mutación**: confirmó que el arreglo de piezas de entrada no cambió, que la salida conserva las piezas y errores originales, y que devuelve los parámetros de corte y opciones esperados.

**Resultado: 5 escenarios OK.**

Verificaciones estructurales ejecutadas junto con esos escenarios:

- todos los archivos JavaScript dentro de `src/scripts/` pasaron `node --check`;
- `git diff --check` no reportó errores;
- búsqueda de `document.`, `state.`, `localStorage`, optimización, renderizado y cálculo de costos en `prepare-project.js`: ninguna dependencia ejecutable encontrada;
- servidor estático local: `index.html`, `prepare-project.js`, `pieces-dom-reader.js`, `project-model.js` y `main.js` respondieron HTTP 200.

# 11. Pruebas manuales pendientes

No se ejecutaron ni se aprueban en este reporte las pruebas manuales de navegador. Permanecen pendientes:

- arranque sin errores en consola;
- agregar, editar y eliminar piezas;
- cambiar cantidad por fila y cantidad de proyectos;
- cambiar material y tapacanto;
- activar L1/L2/A1/A2;
- probar giro Auto, Normal y Rotado;
- probar los niveles Normal, Optimizada y Completa;
- cambiar kerf y márgenes exteriores;
- capturar medidas/cantidades inválidas y confirmar mensajes/orden;
- capturar una pieza que no cabe y confirmar mensaje exacto;
- confirmar el caso donde una pieza inválida coexiste con piezas utilizables;
- optimización de uno y varios materiales;
- comprobar diagrama y costos contra una versión previa;
- verificar las tres ramas de salida temprana y el comportamiento de `state.ultimoTotal`;
- importar CSV y Excel;
- exportar formato, Excel completo y DXF;
- confirmar que exportaciones inválidas siguen abortando según el booleano de `recalcular()`;
- revisar la consola durante todo el flujo.

# 12. Riesgos

- **Riesgo bajo, dependencias funcionales explícitas**: el módulo recibe cuatro funciones además del modelo. Esto evita acoplarlo al DOM, pero su contrato depende de que cada función conserve la forma de salida actual. Un cambio futuro en `validarProyecto`, `resolverParametrosCorteEtapa4` o `leerPiezas` deberá revisar este coordinador.
- **Riesgo bajo, callback de opciones**: `leerOpcionesProyecto` existe para mantener exactamente la posición original de esas lecturas entre resolución de parámetros y lectura de piezas. Moverlo antes de validar o después de leer piezas podría cambiar el orden observable si alguna dependencia adquiere efectos en el futuro.
- **Riesgo bajo, objetos de pieza compartidos**: `gruposPorMaterial` crea arreglos nuevos, pero contiene las mismas referencias de objetos que `piezas`, igual que la agrupación inline anterior. Un consumidor que mutara una pieza desde un grupo también la mutaría en `piezas`; es comportamiento heredado, no introducido ni corregido aquí.
- **Riesgo bajo, errores con éxito parcial**: un resultado exitoso puede incluir `errores` si algunas filas fueron descartadas y otras piezas siguen siendo utilizables. Tratar en el futuro `errores.length > 0` como equivalente a `ok:false` cambiaría el comportamiento actual.
- **Riesgo bajo, dependencia de carga**: `prepare-project.js` debe ejecutarse antes de `main.js`. Si se reordena `index.html`, la destructuración de `window.ProyCutProjectPreparation` fallará al cargar.
- **Pruebas manuales pendientes**: la comprobación automatizada cubrió el contrato del coordinador, no la interacción completa con un navegador real ni la equivalencia visual de diagramas/reportes.

# 13. Reversión

La reversión del cuarto desacoplamiento es únicamente de código y no requiere migración de datos:

1. Restaurar el bloque original de preparación en `src/scripts/main.js` (o revertir el commit que contenga el cambio una vez que exista).
2. Eliminar la carga de `src/scripts/project/prepare-project.js` en `index.html`.
3. Eliminar `src/scripts/project/prepare-project.js`; eliminar `src/scripts/project/` solo si queda vacío.
4. Eliminar este reporte si también se desea revertir su documentación.

En el estado actual sin commit, los archivos de código pueden restaurarse con una operación dirigida sobre `index.html` y `src/scripts/main.js`, y el módulo/reporte nuevos pueden eliminarse de forma explícita. No debe usarse una reversión amplia que afecte otros cambios del árbol de trabajo.

No hay cambios de esquema, persistencia, `localStorage`, `state.piezas`, importación ni exportación. La reversión es puramente de archivos.
