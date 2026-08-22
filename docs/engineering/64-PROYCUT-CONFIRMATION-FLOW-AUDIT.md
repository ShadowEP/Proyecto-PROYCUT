# 64 — PROYCUT Confirmation Flow Audit

## 1. Estado actual

Este documento registra una auditoría de lectura del flujo demo de confirmación de pedido. Describe el comportamiento observado durante la migración de Costing Layer y define su frontera futura. No autoriza cambios de código ni implementa Pricing Layer o Profitability Layer.

La confirmación actual vive en `src/scripts/main.js`, dentro del listener del elemento `#confirmar`. Cuando el usuario activa la acción, el flujo:

1. cancela el recálculo pendiente;
2. ejecuta `recalcular()` para actualizar el proyecto;
3. se detiene si el proyecto contiene datos inválidos;
4. comprueba que exista `state.ultimoReporte`;
5. comprueba que `state.ultimoReporte.total` sea finito y no negativo;
6. muestra el mensaje demo de pedido registrado.

La acción no crea actualmente una entidad de pedido, no conserva una cotización y no ejecuta una operación comercial. El mensaje visible declara que se trata de una demostración y que la integración posterior queda fuera del flujo actual.

### Variable utilizada

La validación de confirmación usa directamente:

```text
state.ultimoReporte.total
```

`state.ultimoReporte` recibe el mismo objeto `datosReporte` producido por `calcularCostosProyecto()` y aplicado por `aplicarResultadoCostos()`. Su propiedad heredada `total` representa la suma de materiales, componentes, corte y tapacanto.

Por lo tanto, el valor validado por la confirmación es un **costo técnico total**, no un precio comercial.

### Estado económico relacionado

- `state.ultimoReporte` conserva el resultado completo del costeo para consumidores heredados. En el estado actual lo leen la exportación del Excel completo y la confirmación demo.
- `state.ultimoTotal` conserva una copia de `datosReporte.total`. Se inicializa y restablece, pero la auditoría no encontró una lectura funcional vigente.
- `state.ultimoCosto` es la referencia explícita incorporada durante la migración a `ResultadoCostos`. Se asigna al mismo `datosReporte` cuando el costeo termina correctamente y se limpia cuando `aplicarResultadoCostos()` recibe un error. La auditoría no encontró consumidores de lectura vigentes.

La inicialización principal de `state` todavía declara `ultimoReporte` y `ultimoTotal`; `ultimoCosto` se incorpora dinámicamente al aplicar el resultado. Además, un fallo anterior al costeo dentro de la preparación del proyecto limpia `ultimoReporte` y, según la etapa, `ultimoTotal`, pero actualmente no gestiona `ultimoCosto`. Este hallazgo pertenece a la compatibilidad transitoria y no autoriza modificar `main.js` dentro de esta auditoría.

### Origen de la mezcla entre costo y precio

No existe una fórmula comercial que transforme el costo en precio. La mezcla aparece porque un resultado técnico:

- se conserva bajo el nombre genérico `ultimoReporte`;
- expone un campo genérico `total`;
- se usa como condición para confirmar un pedido;
- también alimenta textos históricos que hablan de reporte de precio o total del proyecto.

Los nombres y el contexto comercial no cambian el significado del número: sigue siendo costo técnico.

---

## 2. Flujo actual

```text
Optimizer
    ↓
Costing
    ↓
datosReporte
    ↓
state.ultimoReporte
    ↓
Confirmación pedido
```

El Optimizer produce resultados técnicos como tableros y cortes. Costing combina esos resultados con las entradas vigentes del proyecto y calcula costos de materiales, componentes, corte y tapacanto. `aplicarResultadoCostos()` conserva `datosReporte` en el estado, y la confirmación demo valida posteriormente su alias `total`.

Actualmente no existe en este flujo:

- `precioVenta`;
- descuento;
- margen;
- markup;
- regla comercial.

Tampoco existe una decisión de lista de precios, precio manual autorizado o contexto de cliente entre Costing y la confirmación.

---

## 3. Problema conceptual

```text
Costo ≠ Precio
```

`state.ultimoReporte.total` representa costo técnico. Su valor corresponde a:

```text
Costo de materiales
  + Costo de componentes
  + Costo de corte
  + Costo de tapacanto
```

No representa lo que se cobrará al cliente. Validar que sea finito y no negativo solo demuestra que existe un costo técnicamente válido; no demuestra que exista un precio de venta definido o autorizado.

Mientras la confirmación consuma este campo, el sistema puede presentar como confirmable un proyecto que todavía carece de decisión comercial. La deuda es conceptual y de contrato: no implica que la fórmula vigente de costos sea incorrecta.

---

## 4. Decisión de arquitectura

**No migrar la confirmación desde `state.ultimoReporte.total` hacia `costoTotal`.**

Esa sustitución cambiaría el nombre leído, pero conservaría el mismo significado técnico. Haría más explícito que el flujo confirma usando un costo y consolidaría una dependencia comercial incorrecta.

La confirmación deberá esperar a que exista `ResultadoPrecio`, producido por Pricing Layer mediante reglas comerciales confirmadas. Solo entonces podrá migrarse hacia un contrato que represente el precio autorizado para el pedido.

Esta decisión también implica:

- no usar `state.ultimoCosto.costoTotal` como sustituto del total de pedido;
- no calcular precio dentro del listener de confirmación;
- no colocar markup, descuentos o reglas de cliente dentro de Costing Layer;
- no inventar un precio provisional a partir del costo;
- mantener el comportamiento demo actual durante la compatibilidad, hasta que una fase comercial explícita autorice su reemplazo.

---

## 5. Flujo futuro esperado

```text
ResultadoCostos
        ↓
Pricing Layer
        ↓
ResultadoPrecio
        ↓
Confirmación pedido
```

`ResultadoCostos` será la entrada técnica de Pricing Layer. Pricing Layer aplicará las reglas comerciales que sean confirmadas en su especificación futura y producirá un `ResultadoPrecio` separado.

La confirmación consumirá ese resultado comercial. No deberá reconstruirlo, reinterpretar el costo ni consultar aliases heredados para decidir cuánto se cobra.

El mecanismo de autorización del precio, su persistencia y la creación real de un pedido quedan pendientes. Este documento define únicamente la dirección del contrato.

---

## 6. Responsabilidades futuras

### Costing Layer

- calcula el costo técnico de materiales;
- calcula el costo técnico de componentes;
- calcula el costo técnico de corte;
- calcula el costo técnico de tapacanto;
- produce el costo total técnico;
- no conoce clientes, descuentos, márgenes ni precio de venta.

### Pricing Layer

- consume un resultado de costos explícito;
- calcula el precio de venta según reglas comerciales confirmadas;
- aplica en el futuro listas, porcentajes, precios manuales y descuentos según sus contratos aprobados;
- no modifica las fórmulas técnicas de Costing Layer;
- no conoce optimización, geometría o nesting.

### Profitability Layer

- consume costo y precio como resultados separados;
- calcula ganancia;
- calcula margen real;
- calcula markup;
- no determina el precio autorizado por sí sola.

### Confirmación

- consume únicamente un precio autorizado;
- no calcula costos;
- no calcula precios;
- no calcula rentabilidad;
- no interpreta `costoTotal` como importe a cobrar;
- no depende del alias técnico `total` cuando complete su migración.

---

## 7. Estado de compatibilidad

Durante la transición se mantienen temporalmente:

- `state.ultimoReporte`;
- `state.ultimoTotal`;
- `total` heredado dentro de `datosReporte`.

Estos elementos permanecen porque todavía existen consumidores heredados y porque su eliminación debe ocurrir solo después de migrarlos y probarlos. El alias `total` conserva exactamente el mismo valor que `costoTotal`; no introduce una segunda fórmula.

`state.ultimoCosto` ya hace explícito el último resultado técnico aplicado, pero no reemplaza un futuro estado de precio ni debe usarse para confirmar pedidos.

La compatibilidad termina únicamente cuando:

1. exista un contrato aprobado de `ResultadoPrecio`;
2. la confirmación consuma el precio autorizado;
3. Excel y los demás consumidores ya no dependan de nombres ambiguos;
4. una búsqueda global confirme que no quedan lecturas heredadas necesarias;
5. las pruebas de regresión correspondientes hayan sido aprobadas.

---

## 8. Riesgos

- **Confirmar pedidos usando costos:** puede tratar el costo interno de fabricación como el importe ofrecido al cliente.
- **Eliminar aliases demasiado pronto:** puede romper la confirmación demo, estado u otros consumidores todavía no migrados.
- **Mezclar Pricing con Costing:** puede introducir clientes, listas, markup o descuentos dentro del módulo técnico de costos.
- **Modificar `main.js` antes de existir `ResultadoPrecio`:** puede consolidar otro contrato provisional ambiguo o inventar una regla comercial.
- **Usar `costoTotal` como reemplazo mecánico:** cambia la claridad del nombre, pero no resuelve la ausencia de precio de venta.
- **Mantener snapshots incoherentes:** durante la transición, rutas de error diferentes pueden limpiar unos estados derivados y conservar otros; su normalización requiere una fase propia y pruebas del pipeline completo.
- **Retirar `ultimoReporte` sin migrar Excel:** puede romper el snapshot que mantiene alineados el reporte exportado y el proyecto recalculado.

---

## 9. Dependencias futuras

- **[[61-PROYCUT-COST-PRICE-PROFIT-MODEL]] — Modelo económico:** confirma `Costo ≠ Precio ≠ Ganancia`, define conceptualmente `ResultadoCostos`, `ResultadoPrecio` y `ResultadoRentabilidad`, y exige trazabilidad comercial.
- **[[62-PROYCUT-ECONOMIC-LAYER-IMPLEMENTATION-PLAN]] — Plan de implementación económica:** separa Costing Layer, Pricing Layer y Profitability Layer, y establece que la coordinación debe consumir contratos explícitos sin calcular fórmulas en `main.js`.
- **[[63-PROYCUT-COSTING-LAYER-MIGRATION-SPECIFICATION]] — Migración Costing Layer:** formaliza `ResultadoCostos`, mantiene aliases temporales y ordena diferir la confirmación hasta que deje de interpretar costo como precio.

La futura migración de confirmación depende de una especificación y autorización propias para Pricing Layer y `ResultadoPrecio`. Este documento no crea esos módulos, no decide sus reglas y no autoriza modificar el flujo actual.

---

## Limitaciones

Esta auditoría no autoriza:

- modificar `main.js` ni ningún otro archivo de código;
- modificar el listener de confirmación;
- crear Pricing Layer;
- crear Profitability Layer;
- crear `src/scripts/pricing/`;
- definir reglas comerciales pendientes;
- cambiar Excel, reportes, UI o persistencia;
- hacer commit o push.

Su alcance termina en documentar el comportamiento actual, identificar la mezcla conceptual y establecer que la confirmación futura debe consumir un `ResultadoPrecio` autorizado.
