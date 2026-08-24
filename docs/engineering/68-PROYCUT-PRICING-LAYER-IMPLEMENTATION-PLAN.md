# 68 — ProyCut Pricing Layer Implementation Plan

> **ESTADO: HISTÓRICO / IMPLEMENTADO / SUPERADO POR LA IMPLEMENTACIÓN ACTUAL.** Este documento conserva las decisiones, límites y razonamiento de la fase previa a implementar Pricing. Pricing cuenta ahora con una implementación productiva posterior, incluidos cálculo por precio fijo y por catálogo. No debe utilizarse como inventario del estado actual; la realidad vigente está representada por `src/scripts/pricing/calculate-price.js`, sus fronteras en `src/scripts/project/pricing-application-adapter.js` y `src/scripts/project/calculate-project-price.js`, y sus consumidores actuales en `index.html` y `src/scripts/main.js`.

## 1. Estado actual

ProyCut ya dispone de una Costing Layer que produce `ResultadoCostos`. Su contrato canónico distingue conceptualmente:

- `costoMateriales`;
- `costoComponentes`;
- `costoCorte`;
- `costoTapacanto`;
- `costoTotal`.

Pricing Layer todavía no existe en código y `ResultadoPrecio` tampoco existe como contrato implementado. Profitability Layer depende conceptualmente de un precio comercial producido por Pricing, pero tampoco debe implementarse antes de disponer de ese resultado.

La confirmación de pedido actual continúa dentro del flujo heredado. No debe migrarse para consumir `costoTotal`, porque ese valor es costo técnico y no precio comercial. Debe permanecer separada hasta que existan `ResultadoPrecio`, una decisión de Approval y una migración expresamente aprobada.

La regla económica que gobierna esta transición es:

> Costo ≠ Precio ≠ Ganancia

- Costing calcula cuánto cuesta fabricar.
- Pricing calcula cuánto se propone cobrar.
- Profitability analiza la relación entre costo y precio.

## 2. Objetivo de implementación

La primera versión futura de Pricing Layer debe:

- consumir un `ResultadoCostos` explícito;
- recibir un contexto comercial explícito;
- aplicar únicamente un método comercial autorizado;
- producir un `ResultadoPrecio` trazable;
- mantener separadas la operación de cálculo y la decisión de autorización.

Pricing Layer no debe:

- calcular costos técnicos;
- modificar `ResultadoCostos` ni la Costing Layer;
- crear pedidos;
- aprobar precios;
- decidir por sí misma reglas comerciales no documentadas;
- sustituir datos faltantes mediante valores inferidos.

La primera implementación debe ser aislada y de comportamiento explícito. Su incorporación no autoriza todavía cambios en coordinación, estado, reportes, exportaciones ni confirmación.

## 3. Ubicación futura del módulo

La ubicación conceptual propuesta es:

```text
src/scripts/pricing/
├── cálculo de precio
├── validación comercial
└── construcción de ResultadoPrecio
```

Esta estructura expresa responsabilidades y no prescribe todavía nombres de archivos, funciones auxiliares ni organización interna. Este plan no autoriza crear la carpeta ni sus módulos.

La futura implementación debe respetar estas fronteras:

- el cálculo de precio recibe contratos, no lee DOM ni estado global;
- la validación comercial valida el método solicitado y sus datos, sin inventar prioridades o fallbacks;
- la construcción de `ResultadoPrecio` conserva el contexto realmente utilizado;
- la capa no importa ni coordina optimizer, geometría, nesting, tableros, piezas o cortes.

## 4. API pública conceptual

La operación pública futura puede expresarse conceptualmente como:

```text
calcularPrecioProyecto(
  resultadoCostos,
  contextoComercial
)
```

Esta forma no es una interfaz JavaScript definitiva ni fija nombres técnicos de implementación.

### Entrada: ResultadoCostos

La entrada económica mínima debe exponer:

- `costoMateriales`;
- `costoComponentes`;
- `costoCorte`;
- `costoTapacanto`;
- `costoTotal`.

Pricing debe consumir ese resultado como contrato de costos cerrado. No debe recalcular sus componentes ni corregirlos.

### Entrada: contexto comercial

El contexto debe declarar explícitamente:

- el método solicitado;
- los datos requeridos por ese método.

Para la primera versión autorizable, el dato comercial requerido es el precio fijo manual capturado. La denominación técnica del método y la representación exacta del contexto deberán fijarse antes de escribir código.

### Salida: ResultadoPrecio

La salida conceptual mínima debe contener:

- `precioBase`;
- `metodoAplicado`;
- `descuentoAplicado`;
- `precioFinal`;
- `advertencias`.

El contrato objetivo definido en el documento 66 también contempla contexto utilizado, lista y porcentaje cuando correspondan. Esos conceptos no habilitan su implementación en la primera versión.

Para el único método inicial, precio fijo manual:

- `precioBase` representa el importe manual válido recibido;
- `metodoAplicado` identifica que se utilizó precio fijo manual;
- no se calcula ni aplica descuento;
- `precioFinal` conserva el mismo importe de `precioBase`;
- `advertencias` comunica condiciones no fatales sin sustituir errores ni inventar valores.

La representación técnica de “sin descuento”, de las advertencias y del identificador del método queda pendiente. No debe resolverse por inferencia durante la implementación.

## 5. Primera implementación autorizable

La primera versión implementable debe admitir exclusivamente:

### Precio fijo manual

El llamador proporciona de forma explícita el precio comercial. Pricing lo valida y construye `ResultadoPrecio` sin derivarlo del costo.

Esta primera versión no debe implementar:

- listas de precios;
- markup sobre costo;
- descuentos;
- clientes;
- impuestos;
- monedas;
- aprobación comercial.

Limitar el alcance al precio fijo manual permite probar la frontera técnica entre Costing y Pricing sin inventar prioridades, porcentajes, reglas por cliente, redondeos o políticas financieras.

Aunque el método manual no deriva el precio desde `costoTotal`, `ResultadoCostos` permanece como entrada obligatoria del contrato. Esto conserva la relación explícita entre ambos resultados y permite que una futura Profitability Layer analice exactamente el costo y el precio utilizados. Pricing no debe convertir esa relación en una fórmula implícita.

Antes de implementar deberá definirse expresamente la política para valores negativos, cero, precisión y redondeo. Este documento no decide esas reglas.

## 6. Validaciones necesarias

La futura operación debe rechazar, como mínimo:

- `ResultadoCostos` ausente;
- precio fijo manual ausente;
- valores requeridos que no sean numéricos válidos.

Además, deberá comprobar que el método solicitado sea uno implementado. En la primera versión, cualquier método distinto de precio fijo manual debe producir un estado explícito de método no disponible.

No se permite:

- inventar un precio;
- aplicar un fallback automático;
- usar `costoTotal` como precio;
- elegir otro método cuando el solicitado falle;
- ocultar datos comerciales incompletos detrás de advertencias.

La forma final de los errores y la separación exacta entre error y advertencia deben definirse antes de implementar, conservando coherencia con los contratos existentes. Las decisiones pendientes sobre moneda, redondeo y valores negativos impiden agregar validaciones más específicas en esta fase.

## 7. Pruebas requeridas

### Pruebas unitarias futuras

La operación pura de Pricing deberá cubrir al menos:

- precio fijo manual válido: conserva el importe como precio base y final;
- precio fijo manual ausente o inválido: no produce un precio inventado;
- `ResultadoCostos` ausente: rechaza la operación;
- equivalencia del resultado: con los mismos datos explícitos produce el mismo `ResultadoPrecio`;
- separación contractual: nunca toma `costoTotal` como sustituto del precio manual.

Estas pruebas deberán ejecutarse con el mecanismo disponible cuando se autorice la implementación. El repositorio actual no debe asumir un runner inexistente ni incorporar herramientas nuevas como parte de esta fase documental.

### Regresión futura

Antes de integrar Pricing deberá confirmarse:

- Costing produce los mismos costos antes y después;
- las fórmulas, redondeos, errores y fallbacks de Costing no cambian;
- los reportes técnicos mantienen los mismos valores;
- optimizer, tableros, cortes y resultados técnicos permanecen iguales;
- Excel mantiene su estructura mientras no sea parte de una migración autorizada;
- la confirmación de pedido continúa separada y no consume un precio no autorizado.

La matriz de regresión deberá ajustarse al alcance real de cada cambio futuro. Una implementación aislada requiere validar su contrato puro; cualquier integración posterior amplía la regresión a coordinación, estado, reportes o exportaciones afectados.

## 8. Integración futura

El orden arquitectónico previsto es:

```text
Costing Layer
      ↓
Pricing Layer
      ↓
Profitability Layer
      ↓
Application Layer
```

- Costing entrega `ResultadoCostos` sin conocer reglas comerciales.
- Pricing consume costos y contexto comercial para entregar `ResultadoPrecio`.
- Profitability consume `ResultadoCostos` y `ResultadoPrecio` sin modificar ninguno.
- Application coordina los resultados y los casos de uso; no calcula reglas económicas.

La separación entre cálculo y autorización se mantiene fuera de esta cadena de cálculo:

```text
Pricing calcula
      ↓
Approval autoriza
      ↓
Order consume el precio autorizado
```

La primera implementación aislada no debe modificar todavía:

- `src/scripts/main.js`;
- el estado actual;
- Excel;
- renderers de reportes;
- la confirmación de pedido.

La integración con esos consumidores requiere una fase posterior, contratos aprobados y su propia matriz de regresión.

## 9. Migración de consumidores

Los consumidores heredados continúan dependiendo temporalmente de:

- `ultimoReporte`;
- `ultimoTotal`;
- `total` como alias heredado.

Estos nombres representan compatibilidad con el flujo técnico actual. No deben renombrarse, reinterpretarse como precio ni eliminarse al crear la primera versión aislada de Pricing.

Su migración solo debe comenzar cuando existan conjuntamente:

- un `ResultadoPrecio` implementado y validado;
- un flujo de Approval definido;
- una migración de consumidores expresamente aprobada.

El orden posterior deberá identificar cada consumidor, determinar si necesita costo, precio autorizado o ambos, e introducir adaptadores temporales cuando sean necesarios. La confirmación no debe migrarse directamente desde `ultimoReporte.total` hacia `costoTotal`; su destino futuro es un precio autorizado.

## 10. Secuencia futura recomendada

### Paso 1 — Cerrar decisiones mínimas del contrato manual

Definir representación de método, errores, advertencias, ausencia de descuento, precisión, redondeo y tratamiento de cero o valores negativos. No ampliar métodos comerciales.

### Paso 2 — Autorizar el módulo aislado

Crear la futura ubicación de Pricing con una operación pura que implemente únicamente precio fijo manual. No integrar estado, UI ni consumidores.

### Paso 3 — Validar contrato y regresión de Costing

Probar entradas válidas e inválidas, determinismo y prohibición de usar costo como precio. Confirmar que Costing y los reportes técnicos permanecen sin cambios.

### Paso 4 — Diseñar integración de Application

Definir cómo Application recibe contexto comercial y conserva `ResultadoPrecio`, sin colocar cálculos en `main.js` ni sustituir contratos heredados prematuramente.

### Paso 5 — Definir Approval

Especificar la autorización del precio como responsabilidad separada. Solo después podrá planearse la migración de confirmación y Order.

### Paso 6 — Integrar Profitability

Consumir el costo y el precio ya producidos. Profitability no debe bloquear ni alterar la creación de `ResultadoPrecio`.

### Paso 7 — Migrar consumidores de forma explícita

Actualizar cada consumidor según su responsabilidad y retirar aliases únicamente cuando no quede ninguna dependencia verificada.

## 11. Riesgos y controles

- **Usar costo como precio:** impedir cualquier fallback desde `costoTotal` al precio manual.
- **Inventar reglas comerciales:** limitar la primera versión al valor manual explícito y mantener pendientes las demás decisiones.
- **Mezclar cálculo y autorización:** Pricing produce una propuesta; Approval decide si puede utilizarse.
- **Romper consumidores heredados:** no modificar estado, reportes, Excel ni confirmación durante la implementación aislada.
- **Duplicar fórmulas de Costing:** consumir `ResultadoCostos` sin recalcular sus componentes.
- **Crear una segunda fuente de verdad:** conservar el contexto realmente aplicado y evitar valores derivados fuera de Pricing.
- **Expandir accidentalmente el alcance:** aplicar la matriz de regresión al subsistema efectivamente modificado antes de cada cierre.

## 12. Criterios de aceptación de la primera implementación futura

La primera implementación podrá considerarse completa solamente si:

- recibe un `ResultadoCostos` explícito sin modificarlo;
- acepta exclusivamente un precio fijo manual explícito;
- produce un `ResultadoPrecio` con el mismo precio base y final cuando no existe descuento;
- identifica el método realmente aplicado;
- rechaza entradas ausentes o no numéricas sin fallbacks;
- nunca usa `costoTotal` como precio;
- no modifica Costing ni sus consumidores;
- no integra Approval, Order, UI, Excel, reportes o confirmación;
- supera las pruebas puras y la regresión correspondiente al alcance autorizado.

## 13. Relación con documentos anteriores

- **61 — Modelo de Costos, Precios y Rentabilidad:** establece la separación económica y los conceptos de precio, descuento y snapshot.
- **62 — Plan de implementación de la capa económica:** define la secuencia general Costing, Pricing y Profitability.
- **63 — Especificación de migración de Costing Layer:** formaliza `ResultadoCostos` y su compatibilidad temporal.
- **64 — Auditoría del flujo de confirmación:** determina que confirmación debe esperar un precio autorizado y no consumir costo como precio.
- **65 — Diseño de Pricing Layer:** fija responsabilidades, capacidades futuras y decisiones comerciales pendientes.
- **66 — Especificación técnica de Pricing Layer:** define el contrato conceptual de entrada, salida, errores y snapshot.
- **67 — Diseño de Profitability Layer:** establece que rentabilidad depende de `ResultadoCostos` y `ResultadoPrecio`.

Este documento reduce ese marco a un primer incremento futuro autorizable sin ampliar las reglas de negocio.

## 14. Limitaciones

Este documento no autoriza:

- escribir o modificar código;
- crear `src/scripts/pricing/` ni ningún módulo;
- implementar reglas comerciales adicionales;
- implementar listas de precios;
- implementar markup;
- implementar descuentos;
- crear Approval;
- crear persistencia, tablas, SQL o APIs;
- modificar Costing o Profitability;
- modificar estado, `main.js`, UI, Excel, renderers o confirmación;
- resolver moneda, impuestos, redondeos, permisos o reglas por cliente.

Su alcance es exclusivamente definir el orden, las fronteras, las validaciones mínimas y los criterios de regresión para una implementación futura de precio fijo manual.
