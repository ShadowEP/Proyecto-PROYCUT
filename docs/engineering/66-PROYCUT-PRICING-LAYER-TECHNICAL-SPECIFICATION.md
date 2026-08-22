# 66 — ProyCut Pricing Layer Technical Specification

## 1. Estado del módulo

Pricing Layer todavía no existe en el código actual de ProyCut.

Este documento define el contrato técnico conceptual de una futura Pricing Layer. Traduce el diseño funcional de `65-PROYCUT-PRICING-LAYER-DESIGN` a entradas, salidas, responsabilidades, errores y dependencias que deberán respetarse cuando exista una implementación autorizada.

Esta especificación no autoriza código. No crea módulos, carpetas, interfaces JavaScript, APIs, tablas, persistencia ni componentes frontend.

### Estado confirmado

- Costing Layer ya produce un `ResultadoCostos` explícito.
- `ResultadoCostos` representa costo técnico, no precio comercial.
- Pricing Layer todavía no está implementada.
- `ResultadoPrecio` todavía no existe en código ni en estado.
- La confirmación demo no debe migrarse a `costoTotal`; debe esperar un precio comercial autorizado.
- Las reglas comerciales enumeradas como pendientes continúan sin decisión.

### Propósito de la especificación

Esta especificación permite delimitar la futura unidad de cálculo comercial sin anticipar políticas no aprobadas. Su alcance termina en el contrato conceptual y en las fronteras entre Costing, Pricing, Approval, Profitability y sus consumidores.

---

## 2. Responsabilidad exacta

Pricing Layer recibe un resultado técnico de costos y un contexto comercial explícito. Su única responsabilidad es producir un resultado de precio comercial trazable mediante un método solicitado y disponible.

```text
Entrada:
ResultadoCostos + contexto comercial + método solicitado

Salida:
ResultadoPrecio
```

### Responsabilidades propias

Pricing Layer debe:

- validar que las entradas comerciales necesarias estén disponibles;
- aplicar únicamente un método comercial definido y autorizado por reglas vigentes;
- calcular el precio base cuando el método lo permita;
- aplicar el descuento cuando exista una regla válida para hacerlo;
- producir un precio final separado del costo técnico;
- declarar el método y los valores utilizados;
- conservar información suficiente para construir un snapshot comercial explicable;
- devolver errores o advertencias sin inventar valores.

Pricing Layer no debe:

- recalcular costos;
- modificar `ResultadoCostos`;
- autorizar precios;
- aprobar cotizaciones;
- crear pedidos;
- calcular rentabilidad;
- persistir resultados;
- presentar o exportar resultados por su cuenta.

### Conocimientos prohibidos

Pricing Layer no debe conocer ni recibir como dependencia de cálculo:

- optimizer;
- nesting;
- geometría;
- piezas;
- tableros;
- cortes.

Los cortes y tableros pueden haber influido previamente en el costo técnico, pero Pricing Layer no debe inspeccionarlos ni reconstruir ese cálculo. Su frontera técnica comienza en `ResultadoCostos`.

---

## 3. Contrato `ResultadoPrecio`

`ResultadoPrecio` es un contrato de dominio futuro. No es una tabla, una respuesta HTTP, una interfaz JavaScript ni una estructura de persistencia.

### Entrada mínima conceptual

Pricing Layer necesita como mínimo:

- `ResultadoCostos`;
- contexto comercial;
- método solicitado.

#### `ResultadoCostos`

Debe aportar el costo técnico que servirá como entrada cuando el método comercial lo requiera. Pricing Layer depende del contrato, no de la implementación concreta de `calculate-costs.js`.

La futura especificación de implementación deberá declarar qué parte canónica de `ResultadoCostos` consume. No debe depender de aliases heredados como `total`.

#### Contexto comercial

Representa los datos comerciales disponibles para calcular y explicar el precio. Puede incluir conceptualmente, cuando corresponda:

- cliente o contexto de cliente;
- lista de precios seleccionada;
- precio fijo capturado;
- porcentaje solicitado;
- descuento solicitado;
- reglas comerciales vigentes y aplicables.

La presencia conceptual de estos valores no decide cuáles son obligatorios en todos los métodos, su prioridad ni su fuente técnica.

#### Método solicitado

Identifica la estrategia comercial que se pretende aplicar. Debe ser explícito; Pricing Layer no debe elegir silenciosamente entre precio fijo, lista o markup.

### Salida conceptual

```text
ResultadoPrecio
    ├── precioBase
    ├── métodoAplicado
    ├── listaAplicada
    ├── porcentajeAplicado
    ├── descuentoAplicado
    ├── precioFinal
    ├── contextoUtilizado
    └── advertencias
```

### `precioBase`

Representa el precio producido por el método comercial antes de aplicar descuentos. No es costo técnico y no debe sobrescribir `costoTotal`.

Este nombre elimina la ambigüedad entre el precio calculado inicialmente y el precio final posterior al descuento.

### `métodoAplicado`

Identifica el método que realmente produjo `precioBase`. Debe permitir explicar si el resultado provino de precio fijo, lista de precios o markup sobre costo.

No debe inferirse a partir de qué campos tengan valor. El método debe formar parte explícita del resultado.

### `listaAplicada`

Identifica conceptualmente la lista comercial utilizada, cuando el método o contexto la requiera. Debe permitir conservar el contexto histórico sin consultar retroactivamente la lista vigente.

Esta especificación no define identificadores, versiones, vigencias ni representación técnica.

### `porcentajeAplicado`

Representa el porcentaje comercial efectivamente aplicado, cuando corresponda. Debe indicar su significado para evitar confundir markup sobre costo con margen real.

No se decide todavía su precisión, rango, redondeo ni comportamiento ante costo cero.

### `descuentoAplicado`

Representa el ajuste comercial aplicado después de obtener `precioBase`. No modifica el costo técnico.

La forma del descuento, su acumulación, límites y permisos quedan pendientes. La ausencia de esas reglas impide inventar un descuento por defecto.

### `precioFinal`

Representa el precio comercial resultante después de los ajustes válidos aplicados a `precioBase`. Es el valor calculado que podrá pasar posteriormente a Approval.

`precioFinal` no equivale por sí mismo a precio autorizado. Pricing calcula; Approval autoriza.

En esta especificación, `precioFinal` es el término canónico conceptual para el resultado posterior al descuento. La relación de compatibilidad futura con el nombre `precioVenta` de documentos anteriores deberá definirse antes de implementar consumidores; no deben coexistir dos valores indistinguibles.

### `contextoUtilizado`

Agrupa conceptualmente la evidencia necesaria para explicar el cálculo sin depender de catálogos o reglas futuras. Debe reflejar las entradas efectivamente utilizadas, no todas las opciones que estaban disponibles.

Su forma técnica queda pendiente y no debe convertirse en un contenedor genérico sin contrato.

### `advertencias`

Expresa condiciones relevantes que no necesariamente invalidan el cálculo, siempre que una regla futura determine que el resultado continúa siendo utilizable.

Las advertencias no sustituyen errores y no autorizan fallbacks. La clasificación exacta entre error y advertencia debe definirse antes de implementar cada método.

### Invariantes del resultado

- `ResultadoPrecio` no modifica `ResultadoCostos`.
- `precioBase` y `precioFinal` tienen significado distinto.
- `métodoAplicado` explica el origen del precio base.
- los valores aplicados reflejan lo realmente usado, no opciones descartadas;
- las advertencias no ocultan entradas inválidas;
- el resultado calculado no contiene autorización comercial implícita;
- ninguna propiedad comercial debe reinterpretarse como costo técnico.

---

## 4. Métodos comerciales

Los siguientes métodos y ajustes son capacidades futuras. Su presencia en esta especificación no autoriza su implementación ni decide prioridad entre ellos.

### Precio fijo

Utiliza un precio capturado explícitamente como base comercial.

La implementación futura deberá validar su disponibilidad y reglas aplicables. No puede asumir que cualquier usuario puede capturarlo o aprobarlo.

### Lista de precios

Obtiene el precio base desde una lista comercial aplicable al contexto.

Un producto puede existir en varias listas con valores diferentes. Un cambio posterior en la lista no debe modificar el resultado ni la cotización histórica.

Quedan pendientes la resolución de productos, la identidad y versión de la lista, las vigencias y el comportamiento cuando falte un producto.

### Markup sobre costo

Utiliza el costo como base y un porcentaje explícito:

```text
Precio base = Costo + (Costo × porcentaje)
```

El porcentaje representa markup sobre costo. No representa margen real. Su alcance por producto o por proyecto, límites, precisión, redondeo y tratamiento de costo cero continúan pendientes.

### Descuento

El descuento es un ajuste posterior al precio base:

```text
precioBase
    ↓
descuentoAplicado
    ↓
precioFinal
```

No es una fórmula de costo ni debe reducir `costoTotal`. Sus tipos, límites, orden y acumulación no están definidos.

### Ausencia de prioridad automática

Esta especificación no establece prioridad entre:

```text
precio fijo
    vs.
lista de precios
    vs.
markup sobre costo
```

El llamador debe aportar un método solicitado explícito. Si existen datos para varios métodos, Pricing Layer no debe escoger uno mediante orden implícito, presencia de campos o fallback automático.

---

## 5. Separación cálculo/autorización

La frontera obligatoria es:

```text
Pricing calcula
Approval autoriza
Order consume precio autorizado
```

### Pricing

Valida entradas comerciales, aplica el método solicitado y produce `ResultadoPrecio`. Su resultado es calculado y explicable, pero no está autorizado automáticamente.

### Approval

Decide si el precio calculado y sus condiciones pueden avanzar en el flujo comercial. Las reglas, permisos y estados de aprobación quedan pendientes.

Approval no debe recalcular el precio ni modificar silenciosamente el snapshot utilizado. Si una aprobación requiere cambiar condiciones, deberá producirse un nuevo cálculo comercial explicable antes de autorizarlo.

### Order

Consume un precio autorizado. No reconstruye el precio usando el costo, la lista o el catálogo vigente.

La forma de enlazar el resultado calculado, la aprobación y el pedido queda fuera de esta especificación porque requiere decisiones de dominio y persistencia todavía pendientes.

### Prohibición de autorización implícita

`ResultadoPrecio` no debe incluir un estado de autorización asumido por defecto. La existencia de `precioFinal` indica que el cálculo terminó, no que una persona o política lo aprobó.

---

## 6. Errores y estados

Pricing Layer debe distinguir conceptualmente entre resultado válido, resultado inválido y resultado con advertencias. La forma técnica definitiva del retorno queda pendiente.

No debe devolver un precio inventado cuando falte una entrada necesaria.

### Costo inexistente

Ocurre cuando no existe un `ResultadoCostos` válido para un método que lo necesita.

No se debe asumir costo cero, usar el alias heredado `total` ni recuperar datos técnicos desde el optimizador.

### Datos comerciales incompletos

Ocurre cuando el método solicitado no tiene las entradas comerciales requeridas.

Pricing Layer debe declarar la insuficiencia; no debe cambiar automáticamente a otro método.

### Método no disponible

Ocurre cuando el método solicitado no existe, no está habilitado o no puede aplicarse al contexto recibido.

No debe resolverse escogiendo precio fijo, lista o markup por orden implícito.

### Lista sin producto

Ocurre cuando una lista requerida no permite obtener el valor comercial necesario para uno o más productos del alcance definido.

El comportamiento definitivo —rechazo, resolución manual u otra política— queda pendiente. No existe fallback automático autorizado.

### Descuento inválido

Ocurre cuando el descuento no cumple las reglas aplicables o no puede evaluarse con la información disponible.

No debe ignorarse silenciosamente ni convertirse en cero por defecto.

### Reglas generales de error

- un error no produce un `precioFinal` utilizable;
- una advertencia solo acompaña un resultado cuando una regla explícita permita continuar;
- ningún error selecciona otro método automáticamente;
- ningún dato faltante se convierte en cero sin regla confirmada;
- mensajes, códigos y estructura técnica quedan pendientes para la implementación;
- la presentación no decide si un error de Pricing es recuperable.

---

## 7. Snapshot comercial

Una cotización histórica debe conservar información suficiente para reproducir y explicar el precio ofrecido aun cuando cambien catálogos, listas o reglas comerciales.

El snapshot debe conservar conceptualmente:

- costo utilizado;
- método aplicado;
- lista utilizada, si aplica;
- valores aplicados;
- porcentaje aplicado, si corresponde;
- precio base;
- descuento aplicado;
- precio final.

### Reglas del snapshot

- conserva valores efectivamente utilizados;
- no consulta retroactivamente el catálogo vigente para explicar el cálculo;
- un cambio de costo o lista no reescribe la historia;
- distingue costo interno, precio base y precio final;
- conserva el método para explicar la procedencia del precio;
- no equivale por sí mismo a una aprobación;
- la aprobación debe referirse al contexto comercial que evaluó, sin recalcularlo silenciosamente.

Este documento no decide cómo se persiste, versiona o identifica el snapshot. Tampoco define tablas, columnas, eventos ni APIs.

---

## 8. Integración Business Store

El flujo conceptual futuro es:

```text
Customer
    ↓
Quote
    ↓
Pricing
    ↓
Approval
    ↓
Order
    ↓
Production
```

### Customer

Aporta contexto comercial, como una relación con una lista cuando una regla futura así lo determine. Pricing no debe asumir automáticamente que todo cliente tiene lista ni qué regla prevalece.

### Quote

Reúne el contexto necesario para solicitar un cálculo y conserva el `ResultadoPrecio` y su snapshot comercial. No debe representar costo como precio.

### Pricing

Calcula el precio solicitado y devuelve un resultado trazable. No autoriza la cotización ni crea el pedido.

### Approval

Autoriza o rechaza el precio y sus condiciones bajo reglas todavía pendientes. No pertenece a Pricing Layer.

### Order

Consume el precio autorizado y su contexto histórico. No recalcula contra listas o costos actuales.

### Production

Consume el contexto técnico aprobado para fabricar. El precio comercial no se convierte en entrada del optimizador, nesting, geometría o fabricación.

Pricing alimenta el flujo comercial sin invadir Production. La relación técnica entre estas entidades queda pendiente de futuras especificaciones de aplicación y persistencia.

---

## 9. Dependencias

### Dependencia de Pricing

Pricing Layer depende del contrato `ResultadoCostos` y del contexto comercial explícito.

```text
ResultadoCostos
        ↓
Pricing Layer
        ↓
ResultadoPrecio
```

Pricing no depende de:

- la implementación interna de Costing Layer;
- optimizer;
- DOM;
- `state` global;
- `main.js`;
- Excel;
- reportes;
- persistencia;
- proveedores externos.

### Dependencia de Profitability

Profitability Layer depende de ambos resultados:

```text
ResultadoCostos + ResultadoPrecio
                 ↓
       Profitability Layer
                 ↓
     ResultadoRentabilidad
```

Profitability no debe recalcular costo ni precio. Su responsabilidad es analizar la relación entre ambos.

### Consumidores futuros

Podrán consumir `ResultadoPrecio`, según sus propios contratos futuros:

- Quote;
- Approval;
- Order, después de autorización;
- confirmación de pedido;
- reportes comerciales;
- portal cliente;
- Profitability Layer.

Los consumidores no deben introducir fórmulas comerciales ni reinterpretar `ResultadoCostos` como precio.

### Dirección arquitectónica

La futura implementación debe mantener las reglas de dominio aisladas de presentación, navegador, estado global e infraestructura. `main.js` podrá coordinar llamadas durante una transición, pero no será propietario de fórmulas comerciales.

---

## 10. Decisiones pendientes

Esta especificación registra, pero no resuelve:

- prioridad entre precio fijo, lista de precios y markup;
- impuestos;
- moneda y posible manejo de múltiples monedas;
- precisión y redondeos comerciales;
- permisos para consultar, calcular, modificar o autorizar precios;
- descuentos múltiples, tipos, límites y orden;
- vigencias de listas, precios y reglas;
- reglas de aprobación;
- reglas por cliente;
- identidad y versionado de listas;
- alcance del markup por producto o proyecto;
- tratamiento de costo cero o desconocido;
- validaciones y límites de porcentajes;
- comportamiento ante una lista sin producto;
- definición técnica del precio autorizado;
- compatibilidad futura entre `precioVenta` y `precioFinal`;
- forma de errores y advertencias;
- persistencia y versionado del snapshot comercial.

Estas decisiones son bloqueantes para una implementación funcional completa. No deben resolverse mediante defaults técnicos, orden de condicionales ni inferencia por presencia de campos.

---

## 11. Limitaciones

Este documento no incluye ni autoriza:

- código;
- JavaScript;
- creación de `src/scripts/pricing/`;
- implementación de Pricing Layer;
- implementación de Profitability Layer;
- SQL;
- tablas;
- columnas reales;
- APIs;
- frontend;
- HTML o CSS;
- estado global;
- persistencia;
- migraciones;
- cambios en `main.js`;
- cambios en Costing Layer;
- cambios en optimizer, nesting o geometría;
- cambios en reportes o Excel;
- cambios en confirmación de pedido;
- resolución de reglas comerciales pendientes.

Solo define el contrato técnico conceptual de la futura Pricing Layer.

Antes de implementar código deberán existir:

1. autorización explícita para la fase correspondiente;
2. decisiones comerciales suficientes para el método que se implemente;
3. criterios de aceptación y pruebas para entradas válidas, inválidas y límites;
4. una frontera aprobada de coordinación y estado;
5. una estrategia de compatibilidad para consumidores heredados.

---

## Relación con documentos anteriores

- **[[61-PROYCUT-COST-PRICE-PROFIT-MODEL]]:** define el modelo económico, las fórmulas conceptuales y el snapshot comercial.
- **[[62-PROYCUT-ECONOMIC-LAYER-IMPLEMENTATION-PLAN]]:** establece la secuencia Costing → Pricing → Profitability y la migración gradual de consumidores.
- **[[63-PROYCUT-COSTING-LAYER-MIGRATION-SPECIFICATION]]:** formaliza `ResultadoCostos`, que constituye la frontera de entrada técnica para Pricing.
- **[[64-PROYCUT-CONFIRMATION-FLOW-AUDIT]]:** separa el cálculo de precio de su autorización y difiere la confirmación hasta que exista un precio autorizado.
- **[[65-PROYCUT-PRICING-LAYER-DESIGN]]:** define responsabilidades, métodos futuros, listas, descuentos y decisiones pendientes que esta especificación traduce a contratos conceptuales.
