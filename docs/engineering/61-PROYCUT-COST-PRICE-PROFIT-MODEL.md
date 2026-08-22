# 61 — Modelo conceptual de Costos, Precios y Rentabilidad ProyCut

## 1. Estado del documento

Modelo conceptual confirmado.

Pendiente de traducción técnica.

Este documento define el puente funcional entre el costeo actual de ProyCut y una futura arquitectura comercial. No define todavía SQL, tablas, columnas, APIs, componentes frontend, migraciones ni implementación.

### Lectura obligatoria del estado

- **Arquitectura actual:** ProyCut calcula costos técnicos de materiales, componentes, corte y tapacanto. El resultado se presenta parcialmente bajo el nombre “Precio del proyecto”, aunque no existe una regla comercial que transforme ese costo en precio de venta.
- **Comportamiento deseado:** separar de forma explícita costo, precio de venta y rentabilidad, conservando la trazabilidad de los valores usados en cada proyecto.
- **Decisiones confirmadas:** las definiciones, fórmulas, separaciones conceptuales y reglas de conservación histórica descritas en este documento.
- **Decisiones pendientes:** moneda definitiva, impuestos, redondeos y las demás políticas enumeradas en la sección 14.

Este documento no autoriza cambios funcionales sobre el cálculo actual.

---

## 2. Principio fundamental

**Costo ≠ Precio ≠ Ganancia**

### Costo

Lo que cuesta fabricar el proyecto.

### Precio

Lo que se cobra al cliente.

### Ganancia

La diferencia entre el precio de venta y el costo total.

Fórmulas conceptuales confirmadas:

```text
Ganancia = Precio Venta - Costo Total

Margen Real (%) = Ganancia / Precio Venta × 100

Markup sobre costo (%) = Ganancia / Costo Total × 100
```

El margen real y el markup sobre costo son porcentajes diferentes porque utilizan bases distintas: el margen real se calcula sobre el precio de venta; el markup se calcula sobre el costo total.

### Ejemplo obligatorio

```text
Costo: 100
Markup: 43%
Precio: 143
Ganancia: 43
Margen real: 43 / 143 × 100 = 30.07%
```

Aunque el markup sea 43%, el margen real es 30.07%. El sistema debe mostrar ambos valores y nombrarlos de forma inequívoca.

---

## 3. Modelo actual de costos

### Arquitectura actual confirmada

La auditoría de costos y el contrato vigente de costeo confirman que ProyCut tiene una única función pura de cálculo para los costos del proyecto. Esta función recibe datos fuente de catálogos y resultados técnicos derivados del optimizador, y produce el desglose económico consumido por el reporte y por el estado actual de la interfaz.

El cálculo actual no contiene precio de venta, descuento, margen, markup ni impuestos. El total vigente es una suma de costos técnicos.

La presentación actual conserva una ambigüedad: el módulo de reporte identifica visualmente el resultado como “Precio del proyecto”, aunque el valor mostrado corresponde a la suma de los cuatro costos calculados. Esta etiqueta no convierte el total en un precio comercial.

### Costos directos actuales

- **Materiales:** cantidad de tableros utilizados multiplicada por el precio unitario del tablero, agrupada por material.
- **Componentes:** precio unitario multiplicado por la cantidad por proyecto y por la cantidad de proyectos.
- **Corte:** cantidad de cortes multiplicada por el precio por corte, o metros lineales multiplicados por el precio por metro, según el modo elegido.
- **Tapacanto:** metros cobrables por tipo multiplicados por el precio por metro, con el redondeo opcional vigente.

Estos valores pertenecen al cálculo técnico del proyecto. Los nombres de entrada actuales que utilizan la palabra “precio” representan importes unitarios usados por el costeo vigente; no demuestran que exista hoy un modelo separado de precio de venta.

### Conceptos que no forman parte del costo actual

No se incorporan todavía:

- mano de obra;
- gastos administrativos;
- gastos financieros;
- costos externos.

Estos conceptos quedan registrados como futuros. Su incorporación requerirá decisiones funcionales explícitas y no debe inferirse de este documento.

---

## 4. Nuevo modelo económico conceptual

El comportamiento deseado separa tres resultados. Son conceptos del dominio y no nombres de tablas, columnas, clases, interfaces ni respuestas de API.

### ResultadoCostos

Debe contener conceptualmente:

- costoMateriales;
- costoComponentes;
- costoCorte;
- costoTapacanto;
- costoTotal;
- moneda;
- advertencias.

`costoTotal` representa la suma de los conceptos de costo que estén confirmados y disponibles para el cálculo. Las advertencias deben hacer visible cualquier incertidumbre que impida interpretar el resultado como costo completo.

### ResultadoPrecio

Debe contener conceptualmente:

- listaPrecio utilizada;
- porcentaje aplicado;
- precio fijo, si aplica;
- descuento;
- precioVenta.

El precio de venta debe ser trazable hasta la regla comercial utilizada. Este documento confirma que pueden existir precio manual, porcentaje automático y cálculo inverso, pero no decide prioridad, validaciones ni reglas de conflicto entre ellos.

### ResultadoRentabilidad

Debe contener conceptualmente:

- costoTotal;
- precioVenta;
- ganancia;
- markup;
- margenReal.

La rentabilidad se deriva de un costo total y un precio de venta ya determinados. No modifica el resultado técnico del optimizador ni sustituye el costeo.

---

## 5. Modelo de listas de precios

ProyCut tendrá listas de precios comerciales. Una lista representa un contexto comercial bajo el cual un producto puede tener un precio de venta específico.

Ejemplo:

```text
Lista: Carpintero
Producto: MDF Blanco 18mm
Precio: 1500

Lista: Cliente Premium
Producto: MDF Blanco 18mm
Precio: 1700
```

Un mismo producto puede existir en varias listas con precios comerciales diferentes. La lista no altera por sí misma el costo interno del producto.

El modelo debe permitir:

- precio manual;
- porcentaje automático;
- cálculo inverso.

Ejemplo conceptual:

```text
Costo del producto: 100

El usuario captura 43% de markup.
El sistema calcula un precio de 143.

O el usuario captura un precio de 143.
El sistema calcula un markup de 43%.
```

En ambos sentidos, la base del porcentaje debe identificarse explícitamente. Cuando el porcentaje sea markup, se calcula sobre costo; no debe presentarse como margen real.

---

## 6. Materiales, componentes y listas

Cada producto debe poder tener conceptualmente:

- costo base;
- precio de lista;
- listas comerciales asociadas.

Esta separación aplica a los productos que ProyCut utilice en su modelo comercial, incluidos materiales y componentes cuando corresponda.

El costo base es información interna utilizada para comprender cuánto cuesta fabricar. El precio de lista es información comercial utilizada para determinar cuánto se cobra. Una variación del precio comercial no implica necesariamente una variación del costo interno, y una variación del costo interno no debe reescribir silenciosamente un precio ya acordado.

**Costo interno y precio comercial no son sinónimos.**

### Diferencia entre costo interno y precio comercial

Un mismo producto puede tener valores distintos según la función económica que representa cada uno.

Ejemplo conceptual:

```text
Producto: MDF Blanco 18mm

Costo interno: 800
Precio de lista: 1200
Precio comercial cliente: 1500
```

- **Costo interno:** representa cuánto cuesta adquirir o fabricar el producto.
- **Precio de lista:** representa una regla comercial aplicable dentro de una lista determinada.
- **Precio de venta:** representa lo que finalmente se cobra al cliente, después de aplicar las reglas comerciales que correspondan.

Estos valores no deben mezclarse ni utilizarse como si fueran equivalentes.

Un cambio en el precio comercial no debe modificar automáticamente el costo interno. Del mismo modo, un cambio en el costo interno no debe modificar automáticamente una cotización histórica.

---

## 7. Reglas de actualización

Si cambia un precio de catálogo, el cambio no debe alterar automáticamente proyectos existentes.

Cada proyecto debe conservar el contexto comercial utilizado:

- precio utilizado;
- lista utilizada;
- porcentaje utilizado.

Debe existir historial comercial suficiente para explicar cómo se obtuvo el precio ofrecido o acordado. Esta regla extiende el principio de snapshot ya confirmado en el modelo de dominio: el catálogo actual puede evolucionar sin reescribir la historia del proyecto.

El mecanismo técnico de historial y versionado queda pendiente. Este documento confirma la necesidad funcional, no su implementación.

### Snapshot comercial del proyecto

El proyecto debe conservar la información comercial utilizada en el momento de calcular un precio.

El snapshot comercial debe incluir conceptualmente:

- materiales considerados;
- precios utilizados;
- lista comercial utilizada;
- porcentaje aplicado;
- descuentos;
- resultado final.

Esta regla se relaciona directamente con la decisión previa del modelo de dominio: los catálogos pueden cambiar, pero los proyectos históricos deben conservar su contexto.

El snapshot comercial permite explicar el resultado histórico sin convertir el catálogo vigente en la fuente retroactiva de ese cálculo. Este documento define la regla de negocio, no el mecanismo técnico para conservarla.

---

## 8. Descuentos

El descuento se aplica después del cálculo del precio.

Orden conceptual confirmado:

```text
Costo
  ↓
Margen / Lista
  ↓
Precio Venta
  ↓
Descuento
  ↓
Precio Final
```

El descuento no modifica el costo técnico. Su efecto comercial debe reflejarse en el precio final y, por consecuencia, en la ganancia y el margen real finales.

La coexistencia de múltiples descuentos, sus límites y su forma de acumulación quedan pendientes.

---

## 9. Reportes

La misma información técnica del proyecto puede alimentar reportes distintos sin mezclar sus audiencias ni sus propósitos.

### Reporte Costos

Debe mostrar:

- materiales;
- componentes;
- corte;
- tapacanto;
- diagramas;
- información técnica.

Este reporte representa la perspectiva interna y técnica de fabricación.

### Reporte Ventas

Debe mostrar:

- precio de venta;
- descuentos;
- utilidad;
- margen.

Este reporte representa la perspectiva comercial. No debe exponer automáticamente costos internos a un cliente externo.

El botón actual de exportación debe evolucionar conceptualmente para trabajar según la vista activa. Este documento no define el control visual, el formato de archivo ni la implementación de esa evolución.

---

## 10. Nueva interfaz conceptual

Dentro del proyecto deben existir dos contextos claramente separados:

```text
[TAB COSTOS]
[TAB PRECIOS]
```

### TAB COSTOS

- costos reales;
- reporte técnico;
- diagramas.

### TAB PRECIOS

- lista aplicada;
- precios para el cliente;
- descuentos;
- utilidad.

Además debe existir un menú separado:

```text
GANANCIAS
```

`GANANCIAS` no pertenece a los tabs del proyecto. Representa una perspectiva de análisis transversal, distinta de la edición técnica y comercial de un proyecto individual.

Esta sección define organización funcional, no componentes frontend, rutas, HTML ni diseño visual.

---

## 11. Integración con Business Store

Este modelo permitirá posteriormente que Business Store incorpore:

- cotizaciones;
- clientes;
- pedidos;
- portal cliente;
- listas comerciales.

El proyecto continúa perteneciendo al workspace. El cliente es una relación comercial externa y no debe tener acceso a costos internos, márgenes, proveedores ni información estratégica, en coherencia con los documentos 55, 56 y 57.

### Relación con el flujo comercial futuro

Este modelo se integra conceptualmente con el flujo comercial futuro de ProyCut:

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

Una cotización debe conservar conceptualmente:

- costo utilizado;
- lista de precios utilizada;
- porcentaje aplicado;
- descuento aplicado;
- precio final ofrecido.

La finalidad es que una cotización histórica pueda explicar cómo fue calculada aunque después cambien los materiales, los catálogos, las listas de precios o los porcentajes comerciales.

Esta conservación es una regla de negocio y de trazabilidad comercial. No define cómo se almacenará, versionará o implementará técnicamente la cotización.

No se implementa ninguna de estas capacidades en este documento.

---

## 12. Integración con Optimizer

El Optimizer entrega únicamente resultados técnicos, entre ellos:

- tableros;
- piezas;
- cortes;
- resultados técnicos.

El Optimizer no conoce:

- precios;
- clientes;
- márgenes.

Los resultados del Optimizer pueden alimentar el costeo —por ejemplo, cantidad de tableros y cortes—, pero el motor no decide cuánto cobrar ni qué rentabilidad aceptar.

---

## 13. Reglas de arquitectura

La separación conceptual confirmada es:

- **Costo:** dominio técnico.
- **Precio:** dominio comercial.
- **Rentabilidad:** capa de análisis.

Reglas derivadas:

1. Los cálculos comerciales no deben colocarse dentro del optimizador.
2. El precio de venta no debe sustituir ni sobrescribir el costo técnico.
3. La rentabilidad debe consumir resultados explícitos de costo y precio.
4. La presentación no debe convertirse en la fuente de verdad de fórmulas críticas.
5. Los cálculos deben permanecer centralizados, reproducibles y explicables.
6. La evolución técnica futura debe respetar la dirección de dependencias: Presentación → Aplicación → Dominio, con Infraestructura detrás de contratos.
7. El historial debe preservar las reglas y valores comerciales aplicados sin convertir resultados derivados en datos fuente indistinguibles.

---

## 14. Decisiones pendientes

Las siguientes decisiones no se toman en este documento:

- moneda definitiva y manejo de múltiples monedas;
- impuestos;
- descuentos múltiples y su orden de aplicación;
- reglas de redondeo;
- mecanismo técnico de historial de precios;
- versionado comercial;
- proveedores y relación entre costo de proveedor y costo base;
- costos adicionales futuros;
- incorporación de mano de obra;
- gastos administrativos;
- gastos financieros;
- costos externos;
- prioridad y resolución de conflictos entre precio manual, lista y porcentaje;
- validaciones y límites de markup, margen y descuentos;
- tratamiento de costo cero o costo desconocido en cálculos comerciales;
- alcance exacto del menú transversal de ganancias;
- formatos y audiencias definitivas de los reportes de costos y ventas.

Estas decisiones requieren documentos o aprobaciones funcionales posteriores antes de traducirse a diseño técnico o código.

---

## 15. Relación con documentos anteriores

- **[[55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL]] — Suscripciones y Business:** define Personal, Business Workshop, Business Store, catálogos propios, precios propios, clientes externos y listas de precios como capacidades del producto. Este documento desarrolla el modelo económico que esas capacidades necesitarán.
- **[[57-PROYCUT-DOMAIN-MODEL]] — Modelo de dominio:** confirma Workspace, Project, Catalogs, Customer, Quote y el principio de snapshot histórico. Este documento especializa la relación entre el proyecto técnico, sus costos y su futura dimensión comercial.
- **[[58-PROYCUT-OPTIMIZER-ROADMAP]] — Optimizer:** delimita el motor como servicio técnico que recibe datos y devuelve resultados derivados. Este documento confirma que precios, clientes y márgenes permanecen fuera del Optimizer.
- **[[59-PROYCUT-TECHNICAL-ARCHITECTURE-ROADMAP]] — Arquitectura técnica:** establece la evolución gradual por capas y la separación de proveedores. La traducción futura de este modelo deberá respetar esa dirección sin adelantar infraestructura.
- **[[60-PROYCUT-FRONTEND-ARCHITECTURE-ROADMAP]] — Frontend:** define la separación futura entre Presentación, Aplicación, Dominio e Infraestructura dentro del frontend. Los contextos Costos, Precios y Ganancias aquí descritos son responsabilidades funcionales, no componentes ni estructura de archivos.

### Fuentes del estado actual

- [[37-COST-CALCULATION-DECOUPLING-REPORT]] — auditoría y extracción del cálculo actual de costos.
- [[44-CURRENT-ARCHITECTURE-INVENTORY]] — ubicación real del módulo de costeo, reporte y estado derivado.
- [[10-CURRENT-STATE]] — fórmulas observadas del comportamiento actual.

---

## Limitaciones de este documento

Este documento no incluye ni autoriza:

- SQL;
- tablas reales;
- nombres de columnas;
- APIs;
- código;
- componentes frontend;
- migraciones;
- implementación.

Su alcance termina en el modelo conceptual y en la separación explícita entre arquitectura actual, comportamiento deseado, decisiones confirmadas y decisiones pendientes.
