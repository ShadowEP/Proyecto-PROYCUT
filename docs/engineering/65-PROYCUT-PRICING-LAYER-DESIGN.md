# 65 — ProyCut Pricing Layer Design

## 1. Estado actual

La Costing Layer ya existe en el sistema actual y produce un `ResultadoCostos` explícito. Su responsabilidad es calcular el costo técnico del proyecto a partir de materiales, componentes, corte y tapacanto.

La migración de la Fase A incorporó nombres canónicos para esos costos y mantuvo aliases temporales para los consumidores heredados. Este avance aclara el significado de los valores existentes, pero no crea una regla comercial.

Actualmente ProyCut no tiene precio comercial. No existe todavía un `ResultadoPrecio`, una lista comercial aplicada al proyecto, una regla de prioridad entre métodos de precio ni un proceso de autorización del importe que se cobrará al cliente.

La confirmación demo de pedido continúa dependiendo de un total heredado que representa costo técnico. De acuerdo con `64-PROYCUT-CONFIRMATION-FLOW-AUDIT`, ese flujo no debe migrarse mecánicamente hacia `costoTotal`: debe esperar a un `ResultadoPrecio` producido por Pricing Layer.

La separación vigente y futura es:

```text
Costo ≠ Precio
```

- **Costo:** lo que cuesta fabricar.
- **Precio:** lo que se cobra al cliente.

El nombre comercial de una pantalla, un reporte o una acción no convierte el costo en precio de venta.

---

## 2. Objetivo Pricing Layer

Pricing Layer será responsable únicamente de transformar un contexto comercial válido y un costo técnico disponible en un resultado de precio de venta explícito y trazable.

Sus responsabilidades conceptuales serán:

- calcular el precio de venta;
- aplicar reglas comerciales confirmadas;
- manejar listas de precios;
- manejar descuentos futuros;
- conservar el contexto comercial utilizado;
- explicar qué método y qué valores produjeron el precio final.

Pricing Layer no debe conocer:

- nesting;
- optimización;
- geometría;
- cortes;
- tableros;
- piezas.

Esos conceptos pertenecen al dominio técnico previo. Pricing Layer debe consumir `ResultadoCostos`; no debe reconstruir el proyecto técnico ni volver a calcular sus costos.

---

## 3. Arquitectura futura

```text
Optimizer
    ↓
Resultado Técnico
    ↓
Costing Layer
    ↓
ResultadoCostos
    ↓
Pricing Layer
    ↓
ResultadoPrecio
    ↓
Profitability Layer
    ↓
Confirmación / Reportes Comerciales
```

### Optimizer

Produce resultados técnicos de optimización. No conoce costos, clientes, precios, descuentos ni márgenes.

### Resultado Técnico

Representa los resultados derivados que Costing Layer necesita, junto con las demás entradas técnicas del proyecto. No contiene decisiones comerciales.

### Costing Layer

Calcula costos técnicos de materiales, componentes, corte y tapacanto. Su responsabilidad termina al producir `ResultadoCostos`.

### ResultadoCostos

Expresa de forma inequívoca el costo técnico. Es entrada de Pricing Layer, pero no contiene precio de venta.

### Pricing Layer

Aplica reglas comerciales confirmadas al contexto correspondiente. Produce un precio trazable sin alterar `ResultadoCostos`.

### ResultadoPrecio

Representa el resultado comercial que podrá ser autorizado y consumido por cotizaciones, pedidos, reportes comerciales y otros flujos de venta.

### Profitability Layer

Consume costo y precio como resultados separados para calcular ganancia, markup y margen real. No modifica ninguno de los dos resultados de entrada.

### Confirmación y reportes comerciales

Consumen resultados ya calculados y autorizados. No deben implementar fórmulas comerciales por su cuenta.

---

## 4. Separación económica del producto

Un mismo producto puede tener tres valores con significados distintos:

```text
Producto: MDF Blanco 18mm

Costo interno: 800
Precio de lista: 1200
Precio venta cliente: 1500
```

### Costo interno

Representa cuánto cuesta adquirir o fabricar el producto. Pertenece al contexto interno y técnico del negocio.

### Precio de lista

Representa un valor o regla comercial dentro de una lista determinada. No sustituye el costo interno y no necesariamente será el precio final.

### Precio venta cliente

Representa lo que finalmente se ofrece o cobra al cliente después de aplicar el método comercial y los ajustes autorizados.

Estos valores nunca deben mezclarse:

- cambiar el costo interno no debe reescribir automáticamente una cotización histórica;
- cambiar el precio de lista no debe modificar el costo interno;
- cambiar el precio para un cliente no debe alterar otros contextos comerciales;
- el precio final no debe sobrescribir la evidencia del costo o la lista utilizados.

---

## 5. Modelo de listas de precios

Una lista de precios representa una regla o contexto comercial bajo el cual uno o más productos pueden tener precios determinados.

Ejemplo conceptual:

```text
Lista: Carpintero
Producto: MDF Blanco
Precio: 1200

Lista: Cliente Premium
Producto: MDF Blanco
Precio: 1500
```

Reglas confirmadas:

- un producto puede pertenecer a varias listas;
- cada lista puede asignar precios diferentes al mismo producto;
- la lista expresa información comercial, no costo interno;
- cambiar una lista no modifica proyectos ni cotizaciones históricas;
- el contexto utilizado debe conservarse para explicar el precio ofrecido.

Este documento no decide todavía cómo se identifica una lista, quién puede administrarla, cómo se resuelve una vigencia ni cómo se representa técnicamente la relación entre productos y listas.

---

## 6. Métodos de cálculo comercial

Pricing Layer deberá contemplar distintos métodos futuros. Su coexistencia, prioridad y validación quedan pendientes de reglas comerciales posteriores.

### Precio fijo

El usuario define directamente el precio de venta.

```text
Entrada comercial: Precio venta
Resultado: precio definido manualmente
```

El sistema deberá conservar que el método fue manual. Este documento no define permisos, límites ni aprobación para ese valor.

### Markup sobre costo

El markup utiliza el costo como base.

```text
Precio = Costo + (Costo × porcentaje)
```

Ejemplo conceptual:

```text
Costo: 1000
Markup: 40%
Precio: 1400
```

El porcentaje debe identificarse explícitamente como markup sobre costo. No debe etiquetarse como margen real.

### Margen sobre precio

El margen real utiliza el precio de venta como base:

```text
Ganancia = Precio Venta - Costo Total

Margen Real (%) = Ganancia / Precio Venta × 100
```

Markup y margen real son porcentajes diferentes:

```text
Markup (%) = Ganancia / Costo Total × 100

Margen Real (%) = Ganancia / Precio Venta × 100
```

El sistema debe mostrar ambos por separado y nombrar la base de cada cálculo. Este documento no define todavía una política para calcular un precio objetivo a partir de un margen capturado; esa regla requiere una decisión posterior.

---

## 7. Reglas de prioridad

La coexistencia de métodos abre preguntas que todavía no están resueltas:

- ¿qué tiene prioridad entre precio manual, lista de precios y markup?;
- ¿un precio manual reemplaza la lista o actúa como excepción registrada?;
- ¿el markup se aplica al costo total del proyecto, a productos individuales o a ambos según contexto?;
- ¿qué ocurre cuando una lista no contiene todos los productos considerados?;
- ¿qué método debe usarse como fallback y quién puede autorizarlo?;
- ¿cómo se resuelve un conflicto entre una lista vigente y un precio previamente ofrecido?;

Ejemplo de conflicto pendiente:

```text
Precio manual
      vs.
Lista de precios
      vs.
Markup
```

Este documento no decide la prioridad. La implementación deberá esperar una regla comercial explícita, verificable y autorizada.

---

## 8. Descuentos

El orden conceptual es:

```text
Costo
    ↓
Precio base
    ↓
Descuento
    ↓
Precio final
```

El descuento:

- no modifica el costo técnico;
- reduce o ajusta el precio que se ofrece al cliente;
- afecta la utilidad;
- afecta el margen real;
- debe conservarse como parte del contexto comercial aplicado.

No se implementan descuentos todavía. Quedan pendientes sus tipos, límites, acumulación, orden, permisos, validaciones y condiciones de aprobación.

---

## 9. Snapshot comercial

Cada cotización o proyecto que alcance un estado comercial debe conservar el contexto utilizado para calcular su precio.

El snapshot comercial debe incluir conceptualmente:

- costo utilizado;
- lista utilizada;
- precio aplicado;
- porcentaje aplicado;
- método comercial aplicado;
- descuento;
- precio final.

Su objetivo es que un proyecto histórico pueda explicar cómo se calculó el importe ofrecido aunque posteriormente cambien:

- costos internos;
- materiales o catálogos;
- listas de precios;
- porcentajes comerciales;
- descuentos o reglas vigentes.

El snapshot no convierte el catálogo vigente en fuente retroactiva. Debe preservar el contexto de la decisión original. Este documento no define tablas, versionado técnico, persistencia ni APIs para hacerlo.

---

## 10. Integración futura Business Store

Pricing Layer participará en el flujo comercial futuro:

```text
Customer
    ↓
Quote
    ↓
Approval
    ↓
Order
    ↓
Production
```

- **Customer:** aporta el contexto comercial y, cuando corresponda, una lista asociada.
- **Quote:** conserva el precio ofrecido y la explicación de su cálculo.
- **Approval:** representa la autorización comercial del precio y sus condiciones.
- **Order:** consume el precio ya autorizado; no debe reconstruirlo a partir del costo vigente.
- **Production:** utiliza el contexto técnico aprobado sin convertir el precio comercial en una entrada del optimizador.

Pricing Layer alimentará en el futuro:

- cotizaciones;
- pedidos;
- portal cliente.

No se implementa ninguna capacidad de Business Store en esta fase de diseño.

---

## 11. Reportes comerciales

La información técnica y comercial debe producir reportes distintos según propósito y audiencia.

### Reporte costos

Debe mostrar conceptualmente:

- materiales;
- componentes;
- corte;
- tapacanto.

Es un reporte interno y técnico. Puede incorporar el contexto necesario para fabricación, pero no representa por sí mismo una oferta comercial.

### Reporte ventas

Debe mostrar conceptualmente:

- precio de venta;
- descuento;
- utilidad;
- margen.

Es un reporte comercial. Debe consumir resultados explícitos de precio y rentabilidad, sin recalcularlos.

Los costos internos nunca deben exponerse automáticamente al cliente. La audiencia, permisos y formato definitivo de cada reporte quedan pendientes.

---

## 12. Estados futuros

El modelo económico separa conceptualmente tres resultados:

### ResultadoCostos

Expresa costos técnicos de fabricación y su desglose. Ya está formalizado en la Costing Layer actual.

### ResultadoPrecio

Expresará el precio comercial, el método utilizado y el contexto necesario para explicar el resultado. Todavía no existe en código.

### ResultadoRentabilidad

Expresará la relación analítica entre costo y precio: ganancia, markup y margen real. Todavía no existe en código.

Estos nombres representan contratos conceptuales. Este documento no define objetos JavaScript, interfaces, tablas, columnas, respuestas de API ni estado técnico definitivo.

---

## 13. Decisiones pendientes

Antes de implementar Pricing Layer deben resolverse explícitamente:

- impuestos;
- moneda y posible manejo de múltiples monedas;
- redondeos comerciales;
- descuentos múltiples y su orden;
- reglas de aprobación;
- permisos para consultar, modificar y autorizar precios;
- listas por cliente;
- relación con proveedores;
- promociones;
- vigencias de listas, precios y reglas;
- prioridad entre precio manual, lista y markup;
- alcance del markup por producto o por proyecto;
- tratamiento comercial de costo cero o desconocido;
- validaciones y límites de porcentajes;
- tratamiento de productos ausentes en una lista;
- definición de precio autorizado;
- transición entre cotización aprobada y pedido.

Ninguna de estas decisiones debe resolverse mediante defaults técnicos o supuestos dentro de la implementación.

---

## 14. Reglas de arquitectura

1. Pricing Layer depende conceptualmente de `ResultadoCostos` producido por Costing Layer.
2. Costing Layer no depende de Pricing Layer.
3. Profitability Layer consume `ResultadoCostos` y `ResultadoPrecio` como resultados separados.
4. Pricing Layer no modifica el costo técnico ni duplica sus fórmulas.
5. Costing Layer no conoce clientes, listas, descuentos, markup ni margen.
6. Pricing Layer no conoce nesting, optimización, geometría, cortes, tableros ni piezas.
7. La presentación no calcula precios, descuentos, utilidad, markup ni margen.
8. Excel no calcula reglas comerciales; únicamente representa resultados recibidos.
9. `main.js` coordina el flujo, pero no calcula reglas comerciales.
10. La confirmación de pedido consume en el futuro un precio autorizado, no `costoTotal`.
11. Los reportes de venta no deben exponer costos internos automáticamente.
12. Los snapshots históricos deben conservar el contexto aplicado sin depender retroactivamente del catálogo vigente.
13. Las dependencias deben respetar la dirección general Presentación → Aplicación → Dominio, manteniendo proveedores e infraestructura detrás de contratos.

---

## 15. Limitaciones

Este documento no autoriza:

- escribir o modificar código;
- crear `src/scripts/pricing/`;
- crear Pricing Layer;
- crear Profitability Layer;
- crear tablas SQL;
- definir columnas reales;
- crear APIs;
- crear componentes frontend;
- cambiar HTML o CSS;
- modificar `main.js`;
- modificar reportes o Excel;
- modificar la confirmación de pedido;
- crear migraciones;
- implementar persistencia;
- resolver decisiones comerciales pendientes.

Solo define el contrato conceptual, las responsabilidades y las fronteras de la futura Pricing Layer. Cualquier implementación requiere una especificación técnica posterior, decisiones comerciales explícitas, pruebas proporcionales al riesgo y autorización independiente.

---

## Relación con documentos anteriores

- **[[61-PROYCUT-COST-PRICE-PROFIT-MODEL]]:** establece la separación `Costo ≠ Precio ≠ Ganancia`, las listas comerciales y el snapshot histórico.
- **[[62-PROYCUT-ECONOMIC-LAYER-IMPLEMENTATION-PLAN]]:** define la secuencia general entre Costing, Pricing y Profitability.
- **[[63-PROYCUT-COSTING-LAYER-MIGRATION-SPECIFICATION]]:** formaliza el contrato técnico de `ResultadoCostos` y su compatibilidad temporal.
- **[[64-PROYCUT-CONFIRMATION-FLOW-AUDIT]]:** confirma que la aprobación de pedido no debe migrar hacia `costoTotal` y debe esperar un `ResultadoPrecio` autorizado.
