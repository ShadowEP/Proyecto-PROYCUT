# 67 — ProyCut Profitability Layer Design

## 1. Estado actual

Costing Layer produce actualmente un `ResultadoCostos` explícito. Ese resultado representa el costo técnico del proyecto y conserva separados los costos de materiales, componentes, corte y tapacanto.

Pricing Layer tiene definido el contrato futuro para producir `ResultadoPrecio`. Sin embargo, Pricing Layer y `ResultadoPrecio` todavía no existen en código.

Profitability Layer todavía no existe. `ResultadoRentabilidad` tampoco existe en código, estado, reportes ni exportaciones.

Este documento define exclusivamente el contrato conceptual de esa futura capa de análisis. No autoriza implementación.

La regla fundamental permanece:

```text
Costo ≠ Precio ≠ Ganancia
```

- **Costo:** lo que cuesta fabricar.
- **Precio:** lo que se ofrece o cobra al cliente según un resultado comercial.
- **Ganancia:** la diferencia analítica entre el precio utilizado y el costo utilizado.

Un costo no se convierte en precio por cambiar su nombre. Un precio no es ganancia. La ganancia no modifica automáticamente el costo ni el precio del que fue derivada.

### Estado de los contratos económicos

```text
ResultadoCostos
    Estado: formalizado y existente

ResultadoPrecio
    Estado: contrato futuro, no implementado

ResultadoRentabilidad
    Estado: contrato conceptual, no implementado
```

---

## 2. Responsabilidad de Profitability Layer

Profitability Layer será responsable de analizar la relación entre un costo técnico y un precio comercial ya calculados.

### Entrada

- `ResultadoCostos`;
- `ResultadoPrecio`;
- contexto necesario para identificar qué valores se están analizando.

### Salida

- `ResultadoRentabilidad`.

### Responsabilidades propias

Profitability Layer debe:

- consumir `ResultadoCostos` sin recalcularlo;
- consumir `ResultadoPrecio` sin reconstruirlo;
- seleccionar de forma explícita el costo y precio que forman el par analizado;
- calcular ganancia;
- calcular markup cuando la base sea calculable;
- calcular margen real cuando la base sea calculable;
- producir un resultado de análisis trazable;
- declarar advertencias o estados no calculables sin inventar valores.

### Responsabilidades prohibidas

Profitability Layer no debe:

- calcular costos;
- calcular precios;
- aplicar descuentos;
- modificar `ResultadoCostos`;
- modificar `ResultadoPrecio`;
- autorizar pedidos;
- autorizar cotizaciones;
- decidir reglas comerciales;
- decidir prioridades entre métodos de precio;
- decidir objetivos mínimos de margen;
- persistir resultados;
- presentar o exportar resultados por su cuenta.

Profitability es una capa de análisis. No es Costing, Pricing, Approval, Order, presentación ni persistencia.

---

## 3. Contrato conceptual `ResultadoRentabilidad`

`ResultadoRentabilidad` representa el análisis económico de un par explícito de costo y precio.

No es una tabla, una API, una interfaz JavaScript, una estructura de estado ni una implementación final.

```text
ResultadoRentabilidad
    ├── costoUtilizado
    ├── precioUtilizado
    ├── ganancia
    ├── markup
    ├── margenReal
    ├── contextoAnalizado
    └── advertencias
```

### `costoUtilizado`

Representa el costo técnico tomado desde `ResultadoCostos` para el análisis.

Debe conservar su significado de costo. Profitability no debe sustituirlo por precio de lista, costo estimado inventado ni otro valor recuperado desde catálogos actuales.

La futura implementación deberá consumir el nombre canónico correspondiente de `ResultadoCostos`, no aliases heredados ambiguos.

### `precioUtilizado`

Representa el precio comercial elegido explícitamente desde `ResultadoPrecio` para calcular la rentabilidad.

Para un análisis posterior a descuentos, corresponde conceptualmente al precio final calculado. Si el análisis usa un precio calculado todavía no autorizado o un precio ya autorizado, esa condición debe quedar declarada en `contextoAnalizado`; Profitability no debe inferirla ni modificarla.

`precioUtilizado` no debe confundirse con `precioBase`, costo técnico o importe de catálogo.

### `ganancia`

Representa la diferencia entre `precioUtilizado` y `costoUtilizado`.

Puede expresar un resultado positivo, cero o negativo según las entradas. El tratamiento comercial, contable o de autorización de una pérdida queda pendiente y no pertenece a esta capa conceptual.

### `markup`

Representa la ganancia en relación con el costo utilizado.

Su base es el costo. No es margen real y no modifica el precio.

Si el costo no permite una división válida, el markup no debe inventarse como cero ni infinito. El resultado debe declarar que esa métrica no es calculable conforme al contrato futuro de errores y advertencias.

### `margenReal`

Representa la ganancia en relación con el precio utilizado.

Su base es el precio. No es markup y no modifica el precio.

Si el precio no permite una división válida, el margen real no debe inventarse como cero ni infinito. El resultado debe declarar que esa métrica no es calculable conforme al contrato futuro de errores y advertencias.

### `contextoAnalizado`

Representa la evidencia necesaria para explicar qué costo y qué precio fueron comparados.

Debe distinguir conceptualmente, cuando corresponda:

- el resultado de costos utilizado;
- el resultado de precio utilizado;
- si el precio era calculado o autorizado;
- el método comercial que originó el precio;
- el descuento reflejado en el precio final;
- el alcance temporal o histórico del análisis.

Su forma técnica queda pendiente. No debe convertirse en un contenedor genérico sin contrato.

### `advertencias`

Expresa condiciones que afectan la interpretación del análisis, incluidos valores no calculables o contexto incompleto, cuando el contrato futuro permita producir un resultado parcial.

Las advertencias no autorizan fallbacks, no convierten divisiones inválidas en porcentajes válidos y no deciden si un pedido puede aprobarse.

### Invariantes del resultado

- costo, precio y ganancia conservan significados distintos;
- el costo y el precio provienen de resultados previos explícitos;
- ganancia, markup y margen real se derivan del mismo par analizado;
- Profitability no modifica sus entradas;
- las métricas no cambian el precio utilizado;
- el resultado no implica aprobación comercial;
- el contexto permite explicar el análisis histórico;
- un valor no calculable no se reemplaza mediante un default silencioso.

---

## 4. Fórmulas económicas

Las fórmulas conceptuales confirmadas son:

### Ganancia

```text
ganancia = precio - costo
```

Aplicada al contrato:

```text
ganancia = precioUtilizado - costoUtilizado
```

La ganancia es un resultado analítico. No aplica descuentos, no altera el precio y no modifica el costo.

### Markup sobre costo

```text
markup (%) = ganancia / costo × 100
```

Aplicada al contrato:

```text
markup (%) = ganancia / costoUtilizado × 100
```

La base es el costo utilizado.

### Margen real sobre precio

```text
margenReal (%) = ganancia / precio × 100
```

Aplicada al contrato:

```text
margenReal (%) = ganancia / precioUtilizado × 100
```

La base es el precio utilizado.

### Diferencia obligatoria

Markup y margen real no son equivalentes porque utilizan bases diferentes.

```text
Markup → base costo
Margen real → base precio
```

Ambos pueden existir simultáneamente en `ResultadoRentabilidad`. Ninguno modifica `ResultadoCostos`, `ResultadoPrecio` ni el precio que se cobra al cliente.

### Bases no calculables

Las divisiones requieren una base válida. Esta especificación no define un porcentaje alternativo cuando costo o precio sean cero, inexistentes o no calculables.

No se debe:

- dividir silenciosamente entre cero;
- publicar `Infinity` o `NaN` como métrica;
- convertir una métrica no calculable en cero;
- sustituir costo o precio mediante datos de catálogo actuales.

La clasificación definitiva entre error, resultado parcial y advertencia queda pendiente para una futura especificación técnica.

---

## 5. Flujo arquitectónico futuro

Vista secuencial del flujo económico:

```text
ResultadoCostos
        |
        v
ResultadoPrecio
        |
        v
Profitability Layer
        |
        v
ResultadoRentabilidad
```

Esta vista expresa el orden conceptual: Pricing utiliza el costo para producir precio y Profitability analiza ambos resultados. La dependencia exacta de Profitability contiene dos entradas, no solo la salida de Pricing:

```text
ResultadoCostos + ResultadoPrecio
                 |
                 v
       Profitability Layer
                 |
                 v
     ResultadoRentabilidad
```

### Costing Layer

Calcula el costo técnico y produce `ResultadoCostos`. No conoce precio, ganancia, markup, margen ni reglas comerciales.

### Pricing Layer

Calcula el precio comercial y produce `ResultadoPrecio`. Puede reflejar descuentos conforme a reglas futuras, pero no calcula rentabilidad ni autoriza el resultado.

### Profitability Layer

Analiza un costo y un precio explícitos. Produce ganancia, markup y margen real sin modificar las entradas ni decidir si el resultado es aceptable.

### Approval

Autoriza o rechaza condiciones comerciales bajo reglas pendientes. Puede consumir análisis de rentabilidad como información interna cuando una regla futura lo autorice, pero Profitability no decide por Approval.

Esta especificación no establece objetivos de margen ni convierte `ResultadoRentabilidad` en requisito automático de aprobación.

### Order

Consume un precio autorizado y su contexto histórico. No recalcula costo, precio ni rentabilidad para reemplazar los valores aprobados.

### Reportes

Representan resultados recibidos. No contienen fórmulas de costo, precio o rentabilidad.

Los reportes internos pueden consumir `ResultadoRentabilidad` según permisos y audiencia futuros. Los reportes para clientes no deben exponer automáticamente costo interno, ganancia o margen.

### Dirección de dependencias

Costing y Pricing no dependen de Profitability. Profitability depende de sus contratos de salida, no de sus implementaciones internas.

La presentación, `main.js`, Excel y otros consumidores no deben convertirse en propietarios de las fórmulas económicas.

---

## 6. Snapshot económico

El snapshot económico permite explicar un análisis histórico sin consultar catálogos, listas o resultados actuales.

Debe conservar conceptualmente:

- costo utilizado;
- precio utilizado;
- ganancia calculada;
- markup;
- margen real;
- contexto utilizado.

### Reglas del snapshot

- conserva el mismo par de costo y precio que produjo las métricas;
- distingue precio calculado de precio autorizado cuando corresponda;
- no recalcula automáticamente si cambia el costo actual;
- no recalcula automáticamente si cambia el precio actual;
- no depende de catálogos ni listas vigentes para explicar el resultado;
- conserva las métricas calculadas bajo el contexto histórico correspondiente;
- no modifica el snapshot comercial de Pricing;
- no implica aprobación, registro contable ni cierre fiscal.

El snapshot económico sirve para análisis histórico. No se define en este documento cómo se persiste, versiona, identifica o relaciona técnicamente con Project, Quote, Approval u Order.

---

## 7. Reportes

La arquitectura debe separar reportes por responsabilidad y audiencia.

### Reporte costos

Representa el contexto técnico e interno de fabricación. Puede mostrar:

- fabricación;
- materiales;
- componentes;
- corte;
- tapacanto.

Consume `ResultadoCostos` y otros resultados técnicos necesarios. No presenta precio comercial como costo ni calcula rentabilidad.

### Reportes comerciales

Representan el contexto de venta y análisis comercial. Pueden mostrar, según permisos y audiencia futuros:

- precio;
- utilidad;
- margen.

El precio proviene de `ResultadoPrecio`. La utilidad y el margen provienen de `ResultadoRentabilidad`. El reporte no debe recalcularlos.

### Protección de información interna

Los costos internos no deben exponerse automáticamente al cliente.

La misma protección aplica a ganancia, markup, margen, proveedores y otros indicadores estratégicos. La audiencia y permisos definitivos quedan pendientes; la ausencia de esas reglas no autoriza exponerlos por defecto.

### Exportaciones

Excel u otros exportadores futuros deben representar resultados ya calculados. No deben implementar fórmulas de rentabilidad ni combinar silenciosamente costo y precio.

Este documento no autoriza cambios en reportes, Excel, interfaz ni exportaciones.

---

## 8. Decisiones pendientes

Esta especificación registra, pero no resuelve:

- impuestos;
- moneda;
- múltiples monedas;
- conversiones entre monedas;
- redondeos financieros;
- precisión de porcentajes e importes;
- reglas contables;
- permisos;
- auditoría;
- periodos fiscales;
- tratamiento de pérdidas;
- objetivos de margen;
- límites o umbrales de rentabilidad;
- indicadores futuros;
- clasificación de errores y advertencias;
- tratamiento de costo cero o precio cero;
- tratamiento de costo o precio desconocido;
- análisis sobre precio calculado frente a precio autorizado;
- versionado del snapshot económico;
- persistencia e historial;
- relación con Approval y políticas de autorización;
- alcance de análisis por producto, proyecto, cotización, pedido o periodo.

Ninguna de estas decisiones debe resolverse mediante defaults técnicos, valores semilla, reglas contables supuestas o condiciones ocultas en la implementación.

---

## 9. Limitaciones

Este documento no autoriza:

- código;
- JavaScript;
- creación de `src/scripts/profitability/`;
- creación de módulos;
- implementación de Profitability Layer;
- implementación de `ResultadoRentabilidad`;
- tablas;
- columnas reales;
- SQL;
- APIs;
- persistencia;
- migraciones;
- frontend;
- cambios en Pricing Layer;
- cambios en Costing Layer;
- cambios en confirmación;
- cambios en reportes;
- cambios en Excel;
- reglas de aprobación;
- reglas comerciales;
- reglas contables;
- objetivos de margen.

Solo define el contrato conceptual de Profitability Layer.

Antes de implementar código deberán existir una especificación técnica autorizada, decisiones suficientes para los casos no calculables, criterios de aceptación y una estrategia de integración con estado y consumidores.

---

## Relación con documentos anteriores

- **[[61-PROYCUT-COST-PRICE-PROFIT-MODEL]]:** confirma la separación `Costo ≠ Precio ≠ Ganancia` y las fórmulas de ganancia, markup y margen real.
- **[[62-PROYCUT-ECONOMIC-LAYER-IMPLEMENTATION-PLAN]]:** ubica Profitability después de Costing y Pricing y exige pruebas separadas con pares controlados.
- **[[63-PROYCUT-COSTING-LAYER-MIGRATION-SPECIFICATION]]:** formaliza `ResultadoCostos`, primera entrada de Profitability.
- **[[64-PROYCUT-CONFIRMATION-FLOW-AUDIT]]:** separa el análisis económico de la confirmación y evita interpretar costo como precio.
- **[[65-PROYCUT-PRICING-LAYER-DESIGN]]:** define la responsabilidad comercial de Pricing y mantiene Profitability como capa de análisis.
- **[[66-PROYCUT-PRICING-LAYER-TECHNICAL-SPECIFICATION]]:** define `ResultadoPrecio`, segunda entrada de Profitability, y mantiene Approval fuera del cálculo de precio.
