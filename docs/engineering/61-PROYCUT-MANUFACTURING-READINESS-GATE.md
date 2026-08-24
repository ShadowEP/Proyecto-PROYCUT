# 61 — ProyCut Manufacturing Readiness Gate

## 1. Estado del documento

Este documento registra el gate de preparación y la primera promoción productiva controlada de `ManufacturingInput` como fuente preferida del Optimizer.

La promoción cambia únicamente la selección de `gruposPorMaterial`. No promueve facade, adapters de ejecución, CostResult, snapshots ni reporter como pipeline activo, y no cambia Optimizer, Costing, Pricing, UI, reportes ni exportaciones.

Decisión del gate: **GO WITH CONDITIONS, primera frontera promovida con fallback**.

Respuesta operativa: **YES, WITH CONDITIONS**. `ManufacturingInput` ya es la fuente preferida cuando la guardia es segura; la entrada legacy continúa activa como fallback inmediato.

## 2. Evidencia disponible

La ruta Manufacturing dispone actualmente de:

- `ManufacturingModel`;
- `ManufacturingInput`;
- `ManufacturingOptimizerAdapter`;
- `OptimizationResult`;
- `ManufacturingCostAdapter`;
- `CostResult`;
- `ManufacturingExecutionFacade`;
- `ManufacturingExecutionSnapshot`;
- `ManufacturingExecutionReporter`.

La evidencia automatizada y el smoke E2E previo confirman:

- equivalencia de entrada, optimización y Costing en los escenarios ejecutados;
- comportamiento visible idéntico con `PROYCUT_DEV` desactivado y activado;
- una ejecución de facade, adapter de Optimizer y adapter de Costing por recálculo;
- cantidades mayores a uno, dos materiales y tapacanto en los casos observados;
- existencia del snapshot y ausencia de un estado ficticio de Pricing.

La ampliación de regresión del gate agrega evidencia automatizada para:

- `girarModo` real: `normal`, `rotado` y `auto`;
- niveles reales: `normal`, `optimizada` y `completa`;
- tapacanto simultáneo en L1, L2, A1 y A2;
- márgenes no cero y distintos entre sí;
- los cuatro valores efectivos de kerf con valores no cero y distintos;
- materiales con SKU, nombre, espesor y dimensiones de tablero diferentes;
- cantidades mayores a uno con materiales intercalados y orden físico preservado;
- Costing mixto temporal: boards Manufacturing más piezas legacy;
- secuencia de bloqueo de `prepararProyectoParaOptimizacion()` antes del Optimizer;
- incompatibilidad explícita cuando `ManufacturingInput` contiene errores;
- contrato del selector futuro con fallback a `porMaterial`, probado sin incorporarlo al código productivo.

Esta evidencia es favorable, pero no cubre todos los modos funcionales ni convierte por sí sola una ruta diagnóstica en una frontera productiva segura.

## 3. Primera frontera candidata

### Estado legacy previo al cutover

`recalcular()` conserva como fuente productiva la preparación legacy:

```text
leerFilasPiezasDesdeDOM()
        ↓
construirModeloProyecto()
        ↓
prepararProyectoParaOptimizacion()
        ↓
leerPiezas()
        ↓
preparacion.gruposPorMaterial (porMaterial)
        ↓
optimizarProyectoPreparado()
```

### Promoción mínima evaluada

La frontera evaluada es cambiar exclusivamente el argumento productivo:

```text
Antes:
gruposPorMaterial: porMaterial

Candidato:
gruposPorMaterial: manufacturingPipeline.optimizerInput.gruposPorMaterial
```

No se promueven en esta fase Costing, Pricing, estado, boards, renderizado, interacciones ni exportaciones. Tampoco se elimina `leerPiezas()` ni `prepararProyectoParaOptimizacion()`.

## 4. Contrato de entrada auditado

### 4.1 Ruta legacy

`leerFilasPiezasDesdeDOM()` obtiene por fila:

- identificador;
- cantidad, largo y ancho como texto;
- modo de rotación;
- material;
- tipo y lados de tapacanto;
- etiqueta.

`leerPiezas()` valida y expande cada especificación a unidades físicas. Cada pieza entregada al Optimizer contiene:

- `num`;
- `label`;
- `l` y `a`;
- `girarModo`;
- `material`;
- `tapaTipo`;
- `l1`, `l2`, `a1`, `a2`;
- `kerfEfectivo`;
- `kerfEntrePiezasEfectivo`;
- `kerfPiezaSobranteEfectivo`;
- `kerfBordeExteriorEfectivo`.

La expansión considera la cantidad de proyectos. El agrupamiento `porMaterial` conserva los mismos objetos físicos y el orden de inserción producido por las filas.

Antes de llegar al Optimizer, la ruta legacy también conserva su responsabilidad de validación: datos numéricos, cantidad, dimensiones, existencia de material, parámetros técnicos y cabida de la pieza en el área disponible según rotación, márgenes y kerf exterior.

### 4.2 Ruta Manufacturing

`buildManufacturingModel()` conserva especificaciones sin expandir y relaciona materiales mediante SKU. `buildOptimizerInputFromManufacturingModel()` realiza una única expansión física y produce:

```text
ManufacturingInput {
  piezas,
  gruposPorMaterial,
  errores
}
```

Las piezas físicas contienen los mismos quince campos usados por la ruta legacy. Los mismos objetos se conservan por referencia entre `piezas` y cada arreglo de `gruposPorMaterial`; no existe una segunda expansión.

El material se resuelve desde la especificación hacia el tablero por SKU y vuelve al nombre comercial/técnico que usa como clave el Optimizer actual. Los SKU se normalizan para localizar catálogos, pero el valor final `material` conserva el nombre del catálogo actual.

### 4.3 Equivalencia y diferencias relevantes

El comparador de entrada verifica, en orden, todos los campos físicos anteriores y también SKU, nombre, dimensiones, espesor, costo y precio de tableros.

No se encontró un campo de pieza legacy omitido por `ManufacturingInput`.

Sí existe una diferencia de responsabilidad: el adapter Manufacturing registra errores de material o parámetros, pero no sustituye todas las validaciones de cabida realizadas por `leerPiezas()`. Esto no bloquea la promoción mínima mientras `prepararProyectoParaOptimizacion()` continúe ejecutándose primero y siga siendo la barrera de validación del proyecto.

La equivalencia depende del orden. Esto es correcto: el Optimizer utiliza la secuencia de piezas como parte de sus heurísticas. Una diferencia de orden debe considerarse incompatible, no normalizarse ni corregirse silenciosamente.

## 5. Identidad y mutación

El Optimizer no depende de la identidad de las piezas producidas por `leerPiezas()`:

- las heurísticas parten de copias de los arreglos (`slice` o barajado sobre copia);
- al colocar una pieza, los packers agregan a `board.pieces` un objeto nuevo mediante expansión de propiedades;
- `x`, `y`, `w`, `h` y `rotada` se agregan a ese objeto colocado, no a la pieza física de entrada;
- la compactación y las interacciones manuales mutan las piezas colocadas en `board.pieces`.

Por tanto, las piezas de `ManufacturingInput` no son mutadas por el packing actual. No se encontró un consumidor posterior que requiera identidad compartida entre una pieza de entrada, el DOM y una pieza colocada.

La identidad importante después de optimizar es interna a cada board: `data-idx` apunta a `board.pieces[idx]`. Cambiar únicamente la fuente de grupos no altera este contrato si la entrada es equivalente en contenido y orden.

## 6. Consumidores auditados

### 6.1 Application y estado

`apply-project-results.js` recibe boards terminados, los asigna a `state.boards`, preserva el tablero activo mediante `materialLabel` e `indexEnMaterial` y solicita renderizado. No consume piezas de entrada ni exige identidad legacy.

### 6.2 SVG y edición manual

El renderer consume `board.boardW`, `board.boardH`, `board.freeRects` y `board.pieces`. Cada pieza colocada requiere posición, huella, número, rotación y lados de tapacanto. El renderer añade `board._geom` para convertir coordenadas de pantalla a milímetros.

Drag, rotación, espejo y compactación trabajan sobre `state.boards` y `board.pieces`. El índice visual se obtiene con `data-idx`. No se encontró lectura posterior de la pieza original producida por `leerPiezas()`.

La compatibilidad contractual es favorable, pero no existe evidencia automatizada completa para todas las interacciones manuales después de cambiar productivamente la fuente; por eso siguen siendo una condición de promoción.

### 6.3 Costing

Costing recibe dos entradas distintas:

- boards y métricas provenientes del Optimizer para material y corte;
- piezas físicas para calcular tapacanto.

También recibe componentes y catálogos de forma independiente. No depende de identidad entre `boards[].pieces` y el arreglo `piezas`.

Durante la primera promoción es posible conservar piezas legacy para Costing y usar boards generados desde grupos Manufacturing, pero solo mientras la equivalencia de entrada sea verdadera. Sin esa guardia, se formarían dos representaciones potencialmente divergentes: tableros desde Manufacturing y tapacanto desde legacy. Esa mezcla no es segura ante una diferencia y constituye la principal condición del gate.

### 6.4 Pricing y reportes

Pricing consume resultados económicos posteriores; no consume piezas de entrada del Optimizer. Los reportes consumen `datosReporte`. El riesgo directo de la sustitución propuesta es bajo, condicionado a que Costing siga produciendo el mismo contrato.

### 6.5 Excel, DXF y SVG

- DXF recorre `state.boards` y usa dimensiones y geometría colocada de `board.pieces`.
- Excel toma una instantánea de `state.boards`, el reporte económico y una lectura separada de las filas capturadas.
- Los diagramas de Excel reutilizan boards y el renderer.

No se encontró dependencia de referencia hacia las piezas legacy. Sin embargo, las exportaciones son consumidores de fabricación y requieren smoke específico después de una promoción productiva, aun cuando los comparadores de boards indiquen equivalencia.

## 7. Matriz funcional

`PASS` significa evidencia explícita en pruebas o smoke existente. `UNKNOWN` significa que el contrato parece compatible, pero no existe cobertura suficiente para autorizarlo por inferencia. No se encontraron casos `FAIL` en la evidencia revisada.

| Caso | Estado | Evidencia / límite |
|---|---|---|
| Una pieza | PASS | Equivalencia de entrada, optimización y costo cubierta. |
| Cantidades mayores a uno | PASS | Expansión y caso de diez unidades; smoke con cantidades múltiples. |
| Múltiples materiales | PASS | Prueba y smoke con dos materiales. |
| Rotación normal/prohibida | PASS | `normal` y `rotado` conservan entrada, orden, OptimizationResult y CostResult. |
| Rotación automática/permitida | PASS | `auto` se convierte a `normal` en nivel normal y se conserva en optimizada/completa, igual en ambas rutas. |
| Tapacanto | PASS | Tipo, SKU, metraje y costo cubiertos. |
| L1/L2/A1/A2 | PASS | Un escenario ejerce simultáneamente los cuatro lados y su expansión física. |
| Márgenes no nulos | PASS | Se propagan cuatro márgenes no cero y distintos por ambas rutas. |
| Kerf estándar | PASS | El kerf efectivo básico está presente y comparado. |
| Kerf entre piezas | PASS contractual | Entrada comparada con valor distinto y no cero; la geometría real posterior sigue sin modificarse. |
| Kerf pieza-sobrante | PASS contractual | Entrada comparada con valor distinto y no cero; la geometría real posterior sigue sin modificarse. |
| Kerf borde exterior | PASS contractual | Entrada comparada con valor distinto y no cero; la geometría real posterior sigue sin modificarse. |
| Nivel normal | PASS | Cubierto por pruebas actuales. |
| Otros niveles de optimización | PASS contractual | Optimizada y completa conservan entrada y atraviesan la misma frontera de Optimizer. |
| Modo libre | UNKNOWN | `libre:true` se propaga igual y produce contratos equivalentes con dependencias inyectadas; el packer libre real permanece embebido en `main.js` y no fue simulado para declarar equivalencia geométrica. |
| Diferentes dimensiones de tablero | PASS | Dos materiales usan 2440×1220 y 2800×2070, con SKU, nombre y espesor verificados. |
| Costo/precio no configurado | UNKNOWN | No forma parte de la geometría, pero falta un caso integral del flujo promovido. |
| Errores de validación | PASS de frontera | La preparación bloquea validación general, parámetros y ausencia de piezas antes del Optimizer; los mensajes concretos siguen siendo responsabilidad legacy. |
| Drag, rotación, espejo y compactación manual | UNKNOWN | Contrato de board compatible por lectura; falta regresión sobre la ruta productiva promovida. |
| Excel, DXF y SVG | UNKNOWN | Contratos estructurales compatibles; falta smoke posterior a la promoción. |

## 8. Clasificación de riesgos

| Riesgo | Nivel | Justificación |
|---|---|---|
| Datos | MEDIUM | El contrato preserva campos y orden, pero una divergencia actualmente solo se reporta; debe bloquear la promoción o activar fallback. |
| Identidad | LOW | El packing crea objetos colocados nuevos y ningún consumidor auditado exige identidad con las piezas de entrada. |
| Algoritmo | MEDIUM | No se cambia el algoritmo, pero el orden de entrada afecta heurísticas y varios modos siguen sin cobertura. Con guardia de equivalencia baja a LOW. |
| UI | LOW | La UI consume boards resultantes, no la entrada. |
| Costing | MEDIUM | Mezclar boards Manufacturing con piezas legacy es válido solo si el gate de equivalencia es verdadero. |
| Pricing | LOW | Consume resultados posteriores y permanece sin cambios. |
| Exportaciones | MEDIUM | No dependen de identidad legacy, pero aún requieren smoke de los artefactos generados tras la promoción. |
| Interacción manual | MEDIUM | El contrato estructural se conserva, pero falta prueba productiva de drag, rotación, espejo y compactación. |
| Rollback | LOW | La frontera es una selección de fuente en `main.js`; puede volver inmediatamente a `porMaterial`. |

## 9. Decisión del readiness gate

### GO WITH CONDITIONS

La arquitectura está preparada para una promoción controlada de `ManufacturingInput` como fuente de `gruposPorMaterial`, pero no para una sustitución incondicional.

Condiciones obligatorias:

1. Mantener `prepararProyectoParaOptimizacion()` y `leerPiezas()` en la primera promoción. La validación legacy continúa siendo la barrera activa.
2. Seleccionar la entrada Manufacturing únicamente cuando `manufacturingPipeline.equivalenceReport.compatible === true` y `manufacturingPipeline.optimizerInput.errores` esté vacío.
3. Ante incompatibilidad, usar `porMaterial` sin corregir ni normalizar silenciosamente la entrada Manufacturing y conservar diagnóstico en desarrollo.
4. Mantener `piezas` legacy como entrada de Costing durante esta primera promoción.
5. Antes de cerrar la fase productiva, agregar regresión para los casos `UNKNOWN` de mayor impacto: rotación y niveles, modo libre, márgenes, cuatro variantes de kerf, dimensiones distintas y errores de validación.
6. Ejecutar smoke manual de drag, rotación, espejo, compactación, SVG, Excel y DXF con la fuente promovida.
7. Confirmar que el resultado activo y el shadow no ejecutan dos optimizaciones productivas; la ejecución diagnóstica continúa limitada por `PROYCUT_DEV`.

La condición de modo libre real permanece abierta y no se considera satisfecha por la prueba contractual con dependencias inyectadas.

## 10. Primera promoción productiva realizada

Archivo: `src/scripts/main.js`.

Frontera conceptual: llamada activa a `optimizarProyectoPreparado()` dentro de `recalcular()`, después de construir `manufacturingPipeline` y antes de aplicar resultados.

Selección implementada:

```text
entrada compatible y sin errores
        → manufacturingPipeline.optimizerInput.gruposPorMaterial

entrada incompatible o con errores
        → porMaterial
```

La fuente Manufacturing se selecciona solamente cuando:

- `libre === false`;
- `manufacturingPipeline.equivalenceReport.compatible === true`;
- `manufacturingPipeline.optimizerInput.errores.length === 0`.

En cualquier otra combinación se utiliza exactamente `porMaterial`. Los grupos seleccionados llegan por referencia directa al Optimizer; no se clonan, reagrupan ni reordenan.

Los otros argumentos del Optimizer y sus dependencias permanecen intactos. Costing continúa recibiendo `piezas` legacy. La facade y los contratos de ejecución permanecen exclusivamente en la rama diagnóstica `PROYCUT_DEV`.

### Evidencia automatizada del cutover

- cinco combinaciones del selector verificadas;
- modo libre exige fallback legacy;
- referencia Manufacturing conservada cuando el gate es elegible;
- referencia `porMaterial` conservada en cada fallback;
- Costing mixto mantiene equivalencia;
- 17 archivos de prueba y 115 casos PASS;
- sintaxis y `git diff --check` correctos.

### Smoke E2E productivo

Con `PROYCUT_DEV` desactivado se verificaron:

- proyecto de tres piezas físicas y precio/costo visibles;
- dos materiales con dimensiones diferentes y cantidades múltiples;
- modos normal, rotado y auto con niveles normal, optimizada y completa;
- tapacanto L1/L2/A1/A2 y metraje/costo visible;
- márgenes distintos y kerf no cero;
- modo libre con optimización, Costing y Pricing visibles mediante fallback legacy;
- SVG y `data-idx` presentes;
- rotación desde el control SVG y compactación desde los controles existentes;
- inicio de exportaciones Excel y DXF sin error de aplicación.

La automatización disponible no expuso una primitiva de mouse suficiente para completar drag real. El drag permanece pendiente de verificación manual y no se declara PASS por inferencia. Las descargas Excel/DXF iniciaron sin error, pero su contenido final continúa sujeto a validación manual de artefacto.

Con `PROYCUT_DEV === true`, mediante harness temporal externo al repositorio, un recálculo compatible produjo exactamente un reporte `Manufacturing full equivalence` con:

- `entrada.compatible === true`;
- `optimizacion.compatible === true`;
- `costing.compatible === true`;
- snapshot presente;
- ausencia de `pricing`.

La arquitectura y las pruebas contractuales mantienen una llamada activa y una llamada shadow deliberada por recálculo. `PROYCUT_DEV === false` no ejecuta la facade.

### Pruebas requeridas

- verificar que la fuente Manufacturing se usa exactamente una vez cuando es compatible;
- verificar fallback exacto a `porMaterial` cuando existe una diferencia;
- verificar fallback cuando `optimizerInput.errores` no está vacío;
- comprobar igualdad de orden y referencia interna entre `optimizerInput.piezas` y sus grupos;
- ejecutar la matriz funcional pendiente indicada en este documento;
- ejecutar la suite completa del repositorio.

### Smoke requerido

- proyecto simple y cantidades mayores a uno;
- dos materiales y dimensiones distintas;
- rotación permitida y prohibida;
- modo libre y cada nivel disponible;
- tapacanto en los cuatro lados;
- márgenes y variantes de kerf no nulos;
- edición manual: drag, rotar, espejo y compactar;
- Costing y Pricing visibles;
- SVG, Excel y DXF;
- ejecución con `PROYCUT_DEV` desactivado y activado.

### Rollback

El rollback consiste únicamente en eliminar la selección condicional y volver a pasar `gruposPorMaterial: porMaterial`. Ambas representaciones, la preparación y las validaciones legacy permanecen disponibles; no requiere reconstrucción ni migración de estado.

## 11. Infraestructura transitoria

No se elimina ningún módulo en este gate.

`manufacturing-snapshot.js` se conserva expresamente. Su responsabilidad no debe confundirse con `ManufacturingExecutionSnapshot` ni eliminarse sin una decisión contractual posterior.

La facade continúa coordinando exclusivamente la ejecución shadow; el reporter continúa siendo observacional; los adapters adaptan fronteras; los comparadores comparan sin corregir; `PROYCUT_DEV` sigue siendo la frontera diagnóstica.

## 12. Post-cutover stabilization gate

El stabilization gate no promovió ninguna frontera adicional y no modificó código productivo. La selección activa continúa limitada a `ManufacturingInput.gruposPorMaterial`; preparación, piezas, agrupación y fallback legacy permanecen disponibles.

| Verificación | Estado | Evidencia real |
|---|---|---|
| Selector productivo | PASS | Mantiene las tres condiciones: no libre, equivalencia compatible y cero errores. |
| Fallback modo libre | PASS | `libre === true` mantuvo optimización, boards, Costing, Pricing y SVG mediante la ruta legacy. |
| Rotación manual | PASS | Una pieza colocada intercambió ancho/alto, cambió posición cuando fue necesario, conservó `data-idx` y cuatro líneas de tapacanto; SVG se reconstruyó. |
| Espejo vertical | PASS | La acción real “Pegar arriba” cambió coordenadas Y, conservó índices, piezas y cuatro lados visuales de tapacanto. |
| Espejo horizontal | PASS | La acción real “Pegar a la izquierda” cambió coordenadas X, conservó índices, piezas y cuatro lados visuales de tapacanto. |
| Compactación | PASS | Los controles reales compactaron el board y el SVG permaneció consistente, sin cambiar el resumen económico visible. |
| Drag real | MANUAL REQUIRED | La superficie de automatización disponible no expuso una primitiva de puntero/mouse capaz de completar un drag real. No se simuló la función ni se declaró PASS. |
| SVG | PASS | Board, tres piezas, etiquetas/índices, dimensiones y cuatro líneas de tapacanto por pieza permanecieron representados después de rotación y espejo. La evidencia previa conserva además el caso de dos materiales. |
| Excel real | MANUAL REQUIRED | El botón completó la generación sin error, pero el navegador aislado no expuso el archivo descargado para abrirlo e inspeccionar workbook, hojas, datos e imágenes. |
| DXF/ZIP real | MANUAL REQUIRED | El botón completó la generación sin error, pero el navegador aislado no expuso el ZIP descargado. El generador puro sí pasó AC1009, INSUNITS 4, MEASUREMENT 1, POLYLINE, VERTEX, SEQEND, capas TABLERO/CORTE, CRLF e inversión Y. |
| PROYCUT_DEV | PASS | Un recálculo produjo un reporte con entrada, optimización y Costing compatibles, snapshot presente, sin Pricing y exactamente un log. |
| Suite automatizada | PASS | 17 archivos y 115 casos PASS; sintaxis y `git diff --check` correctos. |

### Evidencia de interacción

La pieza rotada conservó `data-idx="0"` y cuatro trazos de tapacanto. Su rectángulo SVG pasó de ancho mayor que alto a alto mayor que ancho y fue reubicado a un hueco válido. Los espejos vertical y horizontal conservaron los tres índices `[0, 1, 2]` mientras cambiaron los ejes correspondientes. Estas acciones utilizaron los controles reales del navegador, no llamadas directas a funciones.

El estado interno de `board.pieces` no se expone fuera del coordinador actual. Por ello la evidencia de ejecución combina la mutación visible del SVG con el contrato auditado de las funciones, pero no inventa una lectura de `state` inexistente.

### Exportaciones pendientes

La generación pura DXF queda verificada automáticamente, pero para cerrar la salida real se debe descargar y abrir manualmente el ZIP, inspeccionar al menos un `.dxf` y confirmar que el archivo corresponde al layout automático recalculado que conserva el comportamiento histórico de `exportarDXFZip()`.

Excel requiere descarga y apertura manual para confirmar las hojas, valores económicos, piezas, boards e imágenes. El inicio exitoso de una descarga no equivale a validar el artefacto.

### Estado de estabilización

No se detectó un contrato roto ni una diferencia visible atribuible al cutover. El gate permanece estable con tres verificaciones manuales abiertas: drag real, Excel descargado y ZIP/DXF descargado.

## 13. Conclusión explícita

**¿Podemos sustituir ahora `gruposPorMaterial: porMaterial` por ManufacturingInput en el Optimizer productivo?**

**YES, WITH CONDITIONS; primera frontera promovida.**

`ManufacturingInput` es ahora la fuente preferida del Optimizer productivo cuando el gate de equivalencia es compatible, no existen errores y el proyecto no usa modo libre. Legacy continúa siendo fuente de fallback, validación y Costing; Manufacturing todavía no reemplaza el pipeline completo.
