# 62 — Plan de implementación de la capa económica ProyCut

## 1. Estado del documento

Plan técnico de migración.

Pendiente de implementación.

Este documento traduce el modelo conceptual confirmado en `docs/engineering/61-PROYCUT-COST-PRICE-PROFIT-MODEL.md` a una secuencia técnica de cambios pequeños y verificables. No autoriza cambios todavía: cada fase futura requerirá alcance explícito, revisión de contratos, pruebas y aprobación independiente.

Las rutas y módulos futuros descritos aquí son una dirección de implementación compatible con la estructura actual. No deben interpretarse como archivos o capas ya existentes.

---

## 2. Problema actual

### Flujo real vigente

Actualmente el flujo económico observable es:

```text
Optimizer
    ↓
Costing
    ↓
Reporte
```

El optimizador produce tableros, conteos de cortes y metros lineales. `src/scripts/costing/calculate-costs.js` consume esos resultados técnicos junto con piezas y catálogos, y calcula materiales, componentes, corte y tapacanto. Su salida se aplica al estado y se entrega directamente a los reportes.

Comercialmente, el resultado presenta esta ambigüedad:

```text
Costo técnico
      =
interpretado como precio
```

No existe actualmente una transformación separada que produzca precio de venta. Tampoco existen cálculos de ganancia, margen real o markup como capas independientes.

### Deuda conceptual confirmada

- **`total` mezclado:** `datosReporte.total` es la suma de cuatro costos técnicos, pero varios consumidores lo presentan como “total” o “precio” del proyecto.
- **Precio comercial inexistente:** los valores unitarios llamados `precio` alimentan directamente el costeo; no existe un resultado de precio de venta separado.
- **Reportes ambiguos:** `src/scripts/reports/report-renderer.js` recibe el resultado del costeo, pero lo presenta bajo el concepto “Precio del proyecto”.
- **Estado ambiguo:** `state.ultimoReporte` guarda el resultado completo del costeo bajo un nombre de reporte, y `state.ultimoTotal` copia su `total` sin expresar si representa costo o precio.
- **Excel dependiente del contrato antiguo:** `construirLibroExcel()` consume la forma actual de `state.ultimoReporte`, incluida la propiedad `total`, y genera hojas llamadas “Reporte” y “Resumen y precio”.
- **Confirmación comercial acoplada:** el flujo demo de confirmar pedido valida `state.ultimoReporte.total`, aunque todavía no existe precio comercial.

Esta deuda es de significado y contratos. No implica que las fórmulas actuales de costeo sean incorrectas.

---

## 3. Objetivo de la migración

La migración debe separar tres responsabilidades económicas sin introducirlas dentro del optimizador, la presentación o los exportadores.

### Costing Layer

Responsable de calcular costos técnicos.

Debe conservar como responsabilidades:

- costo de materiales;
- costo de componentes;
- costo de corte;
- costo de tapacanto;
- costo total técnico;
- advertencias propias del cálculo de costos.

No debe conocer:

- clientes;
- precios de venta;
- descuentos comerciales;
- márgenes;
- cotizaciones;
- reglas de listas comerciales.

La función real `calcularCostosProyecto()` es el punto de partida de esta capa. Su pureza actual debe preservarse.

### Pricing Layer

Responsable de calcular el precio comercial.

Debe poder conocer en fases futuras:

- listas de precios;
- markup;
- precio manual o fijo;
- descuentos;
- reglas comerciales aprobadas;
- contexto comercial necesario para explicar el precio.

No debe conocer:

- algoritmos de optimización;
- geometría;
- nesting;
- colocación de piezas;
- renderizado de tableros.

La Pricing Layer consume un resultado de costos ya calculado. No debe volver a calcular costos técnicos.

### Profitability Layer

Responsable de calcular y explicar:

- ganancia;
- margen real;
- markup.

Debe consumir explícitamente:

```text
Costo + Precio
```

No debe decidir la lista de precios, modificar el costo ni aplicar descuentos. Analiza resultados ya determinados por Costing Layer y Pricing Layer.

---

## 4. Arquitectura objetivo

```text
Optimizer
    ↓
Resultado Técnico
    ↓
Costing Layer
    ↓
Resultado Costos
    ↓
Pricing Layer
    ↓
Resultado Precio
    ↓
Profitability Layer
    ↓
Reportes / UI / Exportaciones
```

### Responsabilidades por frontera

**Optimizer**

- Calcula acomodo, tableros, cortes y métricas técnicas.
- No conoce costos, precios, clientes ni rentabilidad.

**Resultado Técnico**

- Transporta los datos derivados que necesita el costeo.
- No contiene decisiones comerciales.

**Costing Layer**

- Combina resultados técnicos con costos unitarios y reglas técnicas de costeo.
- Produce un resultado de costos explícito y reproducible.

**Resultado Costos**

- Expone subtotales, costo total y advertencias sin llamarlos precio de venta.
- Es la única entrada económica que Pricing Layer necesita del costeo.

**Pricing Layer**

- Aplica reglas comerciales aprobadas sobre el costo o sobre precios definidos.
- Produce un precio explicable sin modificar el resultado de costos.

**Resultado Precio**

- Conserva el precio calculado y el contexto comercial que lo explica.
- Se mantiene separado de la rentabilidad.

**Profitability Layer**

- Compara costo y precio.
- Produce ganancia, markup y margen real sin alterar sus entradas.

**Reportes / UI / Exportaciones**

- Consumen resultados explícitos según su propósito.
- No realizan fórmulas económicas críticas.
- Distinguen reporte técnico de costos y reporte comercial de ventas.

La coordinación pertenece a la capa de Aplicación. Las tres capas económicas deben mantenerse puras y no depender del DOM, `state`, `localStorage`, Excel, Supabase ni un framework de interfaz.

---

## 5. Primera migración segura

La primera modificación no debe cambiar el comportamiento observable.

### Objetivo

Introducir un contrato explícito de costos sin romper los consumidores actuales.

Antes:

```text
datosReporte.total
```

Después, conceptualmente:

```text
ResultadoCostos
    ├── costoTotal
    └── total heredado temporalmente
```

`costoTotal` expresará el significado correcto. `total` continuará disponible temporalmente como alias de compatibilidad con el mismo valor, exclusivamente para que el reporte HTML, Excel, `state.ultimoReporte` y la confirmación demo no cambien durante la primera fase.

La primera migración debe garantizar:

- mismas entradas;
- mismas cuatro fórmulas;
- mismos redondeos y fallbacks;
- mismo resultado numérico;
- misma salida visible;
- mismo Excel;
- mismos estados de error.

La compatibilidad temporal no es el modelo final. Debe eliminarse cuando todos los consumidores hayan migrado a nombres explícitos y cuando existan resultados separados para costos y precios. Su retiro será una fase posterior, aislada y verificable.

No debe hacerse un renombrado masivo de `datosReporte`, `total`, `ultimoReporte` y `ultimoTotal` en el mismo cambio que formalice el contrato.

---

## 6. Orden de implementación

Cada fase debe tener propósito único, pruebas propias y posibilidad de reversión independiente.

### Fase A — Formalizar la salida del costeo

Archivo principal:

`src/scripts/costing/calculate-costs.js`

Objetivo:

- formalizar `ResultadoCostos`;
- separar conceptualmente `costoMateriales`;
- separar conceptualmente `costoComponentes`;
- separar conceptualmente `costoCorte`;
- separar conceptualmente `costoTapacanto`;
- separar conceptualmente `costoTotal`;
- mantener temporalmente la forma heredada necesaria para compatibilidad.

Restricción principal: no cambiar fórmulas.

Los nombres actuales `matSubtotal`, `componentesSubtotal`, `corteImporte`, `tapaSubtotal` y `total` deben seguir produciendo exactamente los mismos valores mientras existan consumidores heredados.

Esta fase no introduce precio de venta ni rentabilidad.

### Fase B — Crear Pricing Layer

Nuevo concepto de ubicación:

`src/scripts/pricing/`

Esta ruta no existe actualmente. Su creación requerirá una tarea posterior explícita y un contrato previamente aprobado.

Responsabilidades futuras:

- producir `precioVenta`;
- aplicar markup cuando exista una regla confirmada;
- admitir descuentos futuros;
- devolver advertencias comerciales;
- conservar el contexto utilizado para explicar el precio.

Esta fase debe comenzar con una regla mínima aprobada y comprobable. No debe implementar todavía listas comerciales completas, impuestos, múltiples descuentos ni políticas pendientes del documento 61.

No debe duplicar `calcularCostosProyecto()` ni leer resultados del optimizador directamente.

### Fase C — Crear Profitability Layer

Nuevo concepto de ubicación:

`src/scripts/profitability/`

Esta ruta tampoco existe actualmente y no queda autorizada por este documento.

Responsabilidades futuras:

- calcular ganancia;
- calcular margen real;
- calcular markup;
- informar entradas inválidas o bases no calculables;
- producir un resultado de análisis separado.

Debe recibir `ResultadoCostos` y `ResultadoPrecio`. No debe consultar DOM, catálogos, optimizador ni estado global.

### Fase D — Actualizar coordinación

Archivo:

`src/scripts/main.js`

Responsabilidad futura:

- coordinar Optimizer;
- coordinar Costing Layer;
- coordinar Pricing Layer;
- coordinar Profitability Layer;
- enviar resultados explícitos a la aplicación de resultados.

`main.js` no debe calcular fórmulas de costo, precio, ganancia, markup ni margen. Su función es orquestar el ciclo, no convertirse en una cuarta implementación económica.

Esta fase debe conservar el pipeline actual `preparar → optimizar → costear → aplicar` y extenderlo gradualmente, sin mover el algoritmo de empaquetado.

### Fase E — Actualizar aplicación de resultados

Archivo:

`src/scripts/project/apply-project-results.js`

Objetivo futuro:

- separar estado de costos;
- separar estado de precios;
- separar estado de rentabilidad;
- mantener los efectos de error y visibilidad bajo coordinación explícita;
- dejar de utilizar un único `ultimoReporte` como contenedor económico ambiguo.

Esta capa aplica resultados; no debe calcularlos.

La migración del estado debe ser gradual. `state.ultimoReporte` y `state.ultimoTotal` no deben eliminarse hasta que sus consumidores estén identificados, migrados y probados.

### Fase F — Actualizar reportes

Archivos o bloques a modificar después:

- `src/scripts/reports/report-renderer.js`;
- `construirLibroExcel()` en `src/scripts/main.js`;
- coordinación de `exportarExcel()` en `src/scripts/main.js`.

Separación objetivo:

```text
Reporte Costos

Reporte Ventas
```

El Reporte Costos consume el resultado técnico y económico interno necesario para fabricación. El Reporte Ventas consume precio, descuento y rentabilidad según la audiencia autorizada.

Excel debe migrarse después de estabilizar los contratos. No debe ser el primer consumidor modificado porque depende de numerosos nombres heredados y produce tres hojas coordinadas con un único snapshot.

### Fase G — Actualizar interfaz

Dirección funcional confirmada:

```text
[Costos]
[Precios]

Menú separado:
Ganancias
```

La interfaz se actualiza al final, cuando los resultados independientes ya existan y estén probados. La Presentación solo muestra información y captura decisiones; no calcula costos, precios ni rentabilidad.

Esta fase requerirá una tarea específica de frontend. Este documento no define componentes, HTML, CSS, rutas ni framework.

---

## 7. Archivos que NO deben tocarse inicialmente

No deben modificarse durante la formalización inicial del contrato de costos:

- algoritmo del optimizer dentro de `src/scripts/main.js`;
- funciones de nesting y empaquetado;
- `src/scripts/project/optimize-project.js`;
- `src/scripts/geometry/`;
- `src/scripts/dxf/dxf-export.js`;
- `src/scripts/svg/board-renderer.js`;
- `src/scripts/pieces/`;
- importadores CSV y Excel;
- formato de proyecto reimportable;
- formato de catálogo CAT-7;
- interacción manual de tableros;
- configuración jerárquica de corte;
- persistencia y cualquier integración externa.

### Motivo

Estas áreas producen o transportan datos técnicos, formatos externos o entradas del proyecto, pero no son responsables de transformar costo en precio ni de analizar rentabilidad. Modificarlas durante la primera fase aumentaría el riesgo sin contribuir a la separación económica.

En particular:

- el Optimizer ya entrega las métricas técnicas que Costing Layer necesita;
- geometría y nesting determinan cantidades físicas, no reglas comerciales;
- DXF y SVG representan fabricación y visualización, no precio;
- piezas e importadores son fronteras sensibles con contratos propios;
- cambiar formatos importables antes de definir snapshots comerciales rompería compatibilidad innecesariamente.

---

## 8. Estrategia de compatibilidad

Durante la transición se debe:

- mantener las exportaciones actuales;
- evitar romper Excel;
- preservar `datosReporte` mientras existan consumidores heredados;
- conservar temporalmente `total` como alias del costo total;
- evitar cambios masivos de nombres;
- introducir adaptadores entre contratos nuevos y consumidores antiguos;
- migrar un consumidor por vez;
- retirar cada adaptador solo después de confirmar que no quedan lecturas heredadas;
- preservar el modo local sin backend;
- mantener los mismos mensajes y estados de error durante las fases no funcionales.

Un adaptador de compatibilidad debe transformar nombres y formas, no recalcular valores. Las fórmulas deben permanecer en su capa propietaria.

### Secuencia de retiro de compatibilidad

1. Formalizar `ResultadoCostos` sin retirar campos heredados.
2. Migrar aplicación de resultados a contratos explícitos.
3. Migrar reporte técnico HTML.
4. Migrar Excel manteniendo el mismo archivo observable durante la fase de compatibilidad.
5. Separar reportes comerciales cuando exista `ResultadoPrecio`.
6. Migrar la confirmación demo para que use un precio comercial explícito.
7. Verificar por búsqueda y pruebas que no queden consumidores de `datosReporte.total` como precio.
8. Retirar aliases y adaptadores heredados en un cambio independiente.

---

## 9. Riesgos

### Romper reportes

El renderer actual consume propiedades concretas de `datosReporte`. Un cambio de forma sin adaptador puede dejar paneles vacíos, subtotales incorrectos o errores de ejecución.

### Romper Excel

`construirLibroExcel()` depende del snapshot de `state.ultimoReporte` y de nombres específicos para materiales, componentes, corte, tapacanto y total. Migrarlo antes de estabilizar contratos puede desincronizar pantalla y archivo exportado.

### Mantener la mezcla costo/precio

Agregar `precioVenta` sin corregir consumidores ambiguos podría producir dos totales indistinguibles. Cada salida debe nombrar su significado y audiencia.

### Duplicar fórmulas

Recalcular costo dentro de Pricing Layer, rentabilidad dentro del renderer o precio dentro de `main.js` crearía fuentes de verdad divergentes.

### Modificar el optimizador innecesariamente

Cambiar nesting, geometría o conteos durante esta migración impediría distinguir una regresión técnica de una regresión económica.

### Retirar compatibilidad demasiado pronto

Eliminar `total`, `ultimoReporte` o sus propiedades antes de migrar Excel, reporte y confirmación rompería consumidores vigentes.

### Convertir fallbacks técnicos en reglas de negocio

Los valores `0` usados actualmente ante ciertos datos ausentes no deben reinterpretarse como una política comercial. Cambiar ese comportamiento requiere una decisión funcional separada.

### Mezclar refactor y funcionalidad

La creación de contratos, la introducción de reglas comerciales y el rediseño de interfaz deben permanecer en fases distintas para poder comparar y revertir cada cambio.

---

## 10. Pruebas necesarias antes de cada fase

### Línea base obligatoria

Antes de cambiar código debe existir evidencia reproducible del comportamiento vigente para proyectos representativos:

- mismo costo total antes y después;
- mismos subtotales de materiales, componentes, corte y tapacanto;
- mismos tableros;
- mismos cortes;
- mismos metros lineales;
- mismos reportes técnicos;
- mismo contenido económico exportado a Excel durante las fases de compatibilidad;
- mismos errores ante datos inválidos.

### Costing Layer

Debe compararse la salida completa anterior y posterior, no únicamente el total. Las fórmulas, redondeos, casos de precio cero, datos faltantes y cantidad de proyectos deben conservarse.

### Pricing Layer

Debe probarse por separado con entradas de costos controladas. Sus pruebas no deben ejecutar el optimizador ni depender del DOM.

### Profitability Layer

Debe probarse por separado con pares controlados de costo y precio, incluyendo bases no calculables y valores límite definidos por las reglas aprobadas.

### Coordinación y aplicación

Debe verificarse que cada resultado llegue al estado y consumidor correctos, que los errores no dejen snapshots cruzados y que un nuevo ciclo reemplace coherentemente los resultados anteriores.

### Reportes y Excel

Debe comprobarse que el reporte técnico conserva sus cifras y que el reporte comercial no expone costos internos a una audiencia incorrecta. Excel requiere comparación estructural y visual, además de validación de valores.

### Optimizer

Aunque no se modifique, debe confirmarse que los mismos datos fuente producen los mismos tableros y cortes. Esto demuestra que la migración económica no alteró accidentalmente el núcleo técnico.

La nueva capa comercial debe probarse aparte. Un resultado correcto del optimizador no valida una regla de precio, y un precio correcto no valida geometría o nesting.

Cada implementación futura deberá consultar `proycut-regression-matrix` para seleccionar las verificaciones reales disponibles en el repositorio; este documento no inventa comandos de prueba.

---

## 11. Relación con documentos anteriores

- **[[61-PROYCUT-COST-PRICE-PROFIT-MODEL]] — Modelo económico:** define las reglas conceptuales que este plan traduce a capas y fases técnicas. Costo, precio y rentabilidad permanecen distintos.
- **[[58-PROYCUT-OPTIMIZER-ROADMAP]] — Optimizer:** confirma que el motor entrega resultados técnicos y no debe conocer clientes, precios ni márgenes. Esta migración comienza después de su salida.
- **[[59-PROYCUT-TECHNICAL-ARCHITECTURE-ROADMAP]] — Arquitectura técnica:** establece la evolución gradual, la dirección de dependencias y la separación entre Dominio, Aplicación, Presentación e Infraestructura.
- **[[60-PROYCUT-FRONTEND-ARCHITECTURE-ROADMAP]] — Frontend:** ubica a `main.js` como coordinador actual y exige que la Presentación no realice cálculos críticos. La fase G depende de que las capas económicas existan primero.
- **[[57-PROYCUT-DOMAIN-MODEL]] — Dominio:** sitúa Project, Catalogs, Customer, Quote y el historial comercial en el dominio superior. Las capas económicas deben servir a ese ciclo sin cambiar ownership ni persistencia.

### Fuentes del estado real

- **[[37-COST-CALCULATION-DECOUPLING-REPORT]]:** documenta la extracción ya realizada de `calcularCostosProyecto()`, su contrato de 14 entradas, su salida heredada y la equivalencia verificada de las fórmulas.
- **[[44-CURRENT-ARCHITECTURE-INVENTORY]]:** confirma que `costing/calculate-costs.js` es puro y estable, `main.js` coordina el ciclo y los reportes/Excel consumen resultados derivados.

---

## 12. Limitaciones

Este documento no incluye ni autoriza:

- SQL;
- tablas;
- columnas;
- APIs;
- código;
- implementación final;
- listas comerciales completas;
- reglas definitivas de impuestos;
- políticas definitivas de descuentos;
- persistencia de snapshots económicos;
- componentes frontend;
- migraciones;
- cambios en formatos externos;
- creación inmediata de `src/scripts/pricing/` o `src/scripts/profitability/`.

El alcance termina en el plan técnico de migración segura. Las decisiones funcionales pendientes del documento 61 siguen pendientes y no deben resolverse por inferencia durante la implementación.
