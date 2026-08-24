# 69 — ProyCut Pricing Application Integration Design

> **ESTADO: HISTÓRICO / IMPLEMENTADO / SUPERADO POR LA IMPLEMENTACIÓN ACTUAL.** Este documento conserva las decisiones y el razonamiento de la fase de diseño de la integración Application → Pricing. Pricing fue integrado productivamente después de esta etapa y ya tiene consumidores de aplicación y presentación. No debe utilizarse como inventario del estado actual; la realidad vigente está representada por `src/scripts/pricing/calculate-price.js`, `src/scripts/project/pricing-application-adapter.js`, `src/scripts/project/calculate-project-price.js` y su integración actual en `index.html` y `src/scripts/main.js`.

## 1. Estado del documento

Este documento define el diseño conceptual para una futura integración entre Application Layer y Pricing Layer.

El módulo inicial de Pricing existe de forma aislada y calcula únicamente precio fijo manual. Todavía no está cargado ni coordinado por la aplicación, no modifica estado y no tiene consumidores productivos.

Este diseño:

- describe responsabilidades y dirección de dependencias;
- define estados conceptualmente separados;
- establece una migración progresiva;
- no autoriza cambios de código ni integración funcional.

La regla económica permanece:

> Costo ≠ Precio ≠ Ganancia

## 2. Responsabilidad de Application Layer

Application Layer coordina el caso de uso de cálculo comercial. Recibe resultados y contexto explícitos, invoca la regla de dominio correspondiente y dirige su salida al siguiente paso permitido.

Su coordinación futura se representa así:

```text
ResultadoCostos + Contexto Comercial
                 ↓
         Application Layer
                 ↓
           Pricing Layer
                 ↓
          ResultadoPrecio
```

Application Layer será responsable de:

- obtener un `ResultadoCostos` válido desde el flujo técnico ya existente;
- recibir un contexto comercial explícito desde una frontera todavía por definir;
- solicitar a Pricing el método expresamente seleccionado;
- conservar y distribuir el `ResultadoPrecio` sin reinterpretarlo;
- propagar errores de Pricing hacia la presentación mediante un contrato futuro;
- coordinar fases posteriores sin trasladar sus reglas a `main.js`.

Application Layer no:

- calcula precios;
- aplica markup;
- aplica descuentos;
- decide listas de precios;
- interpreta costo como precio;
- autoriza precios;
- recalcula costos;
- modifica `ResultadoCostos` o `ResultadoPrecio`;
- crea reglas comerciales mediante fallbacks.

La coordinación no convierte Application en propietaria de la lógica económica. Pricing conserva la responsabilidad del cálculo comercial y Approval conservará la autorización.

## 3. Fronteras de entrada y salida

### Entrada técnica

Application recibe `ResultadoCostos` como contrato cerrado. No reconstruye sus subtotales, no consulta aliases heredados para formar un precio y no sustituye un resultado ausente con `ultimoTotal`.

### Entrada comercial

Application recibe un contexto comercial explícito que identifica el método solicitado y sus datos. Para la versión aislada actual, el único método implementado es precio fijo manual.

Este documento no define todavía:

- dónde se captura el contexto;
- qué componente de presentación lo entrega;
- cómo se conserva en estado;
- permisos o identidad del usuario;
- reglas de Approval.

### Salida comercial

Pricing devuelve un contrato explícito de éxito o error. Ante éxito, Application recibe `ResultadoPrecio`; ante error, no debe inventar un precio, seleccionar otro método ni utilizar el costo técnico como fallback.

El resultado calculado todavía no es un precio autorizado.

## 4. Estado futuro conceptual

La integración necesita mantener separados tres conceptos que no son intercambiables.

### `ultimoCosto`

`ultimoCosto` representa el resultado técnico más reciente del cálculo de fabricación.

- pertenece al contexto de costos;
- contiene el contrato canónico de `ResultadoCostos`;
- no representa un precio de venta;
- no implica autorización comercial;
- no debe alimentar directamente la confirmación futura.

Su existencia actual no autoriza cambiar su forma ni sus consumidores en esta fase.

### `ResultadoPrecio`

`ResultadoPrecio` representa el cálculo comercial producido por Pricing Layer a partir de un `ResultadoCostos` y un contexto comercial explícito.

- identifica el método aplicado;
- conserva el precio base y final calculados;
- no modifica el costo;
- no contiene autorización implícita;
- puede ser inválido si Pricing devuelve errores.

Este documento usa `ResultadoPrecio` como concepto de dominio. No decide el nombre de una futura propiedad de `state`, su ciclo de vida ni su persistencia.

### Precio autorizado futuro

El precio autorizado pertenece a Approval.

- parte de un `ResultadoPrecio` calculado;
- expresa que una decisión de autorización ocurrió;
- no debe ser creado por Pricing ni por Application mediante un booleano asumido;
- será el único precio elegible para avanzar hacia Order y confirmación.

La forma, identidad, permisos, estados y evidencia de Approval continúan pendientes. Por tanto, no debe introducirse todavía un campo de “precio autorizado” en el estado actual.

## 5. Flujo futuro

El flujo futuro de cálculo se define así:

```text
Costing Layer
      ↓
ResultadoCostos
      ↓
Application Layer
      ↓
Pricing Layer
      ↓
ResultadoPrecio
      ↓
Application Layer
```

Application coordina las entradas y recibe la salida, pero las reglas permanecen dentro de sus capas responsables.

El flujo comercial posterior es distinto:

```text
ResultadoPrecio
      ↓
Approval
      ↓
Precio autorizado
      ↓
Order
```

Las responsabilidades son:

- Pricing calcula.
- Application coordina.
- Approval autoriza.
- Order consume un precio autorizado.

Application no debe omitir Approval ni tratar todo `ResultadoPrecio` válido como aprobado.

## 6. Compatibilidad heredada

Durante la migración continúan temporalmente:

- `ultimoReporte`;
- `ultimoTotal`;
- `total` como alias heredado.

Estos valores preservan consumidores existentes del flujo técnico. No representan precio comercial, aunque algunos nombres o textos históricos permitan interpretarlos de esa manera.

Reglas de compatibilidad:

- no eliminarlos mientras existan consumidores verificados;
- no renombrarlos masivamente durante la integración inicial;
- no copiarlos hacia `ResultadoPrecio`;
- no utilizarlos como fallback cuando falte contexto comercial;
- no tratarlos como evidencia de Approval;
- no alimentar con ellos la confirmación futura.

La compatibilidad conserva funcionamiento; no valida la semántica ambigua del contrato heredado.

## 7. Confirmación de pedido

La frontera obligatoria es:

> Costo ≠ Precio

La confirmación futura debe consumir un `ResultadoPrecio` autorizado. No debe consumir solamente un resultado calculado ni debe reconstruir el precio desde costos vigentes.

Nunca debe utilizar como precio:

- `costoTotal`;
- `ultimoReporte.total`;
- `ultimoTotal`;
- cualquier subtotal técnico;
- un fallback producido por Application.

El flujo correcto será:

```text
ResultadoPrecio
      ↓
Approval
      ↓
ResultadoPrecio autorizado
      ↓
Confirmación de pedido
```

Hasta que Approval tenga un contrato aprobado, la confirmación actual debe permanecer sin migrar. Cambiarla directamente hacia `ResultadoPrecio` también sería prematuro, porque cálculo y autorización son responsabilidades diferentes.

## 8. Relación con Profitability

Profitability consume `ResultadoCostos` y `ResultadoPrecio` para producir análisis económico. No forma parte del cálculo de precio ni de la autorización.

```text
ResultadoCostos + ResultadoPrecio
                 ↓
       Profitability Layer
                 ↓
     ResultadoRentabilidad
```

Application podrá coordinar esta operación en una fase futura, pero no calculará ganancia, markup ni margen real.

La integración de Profitability no es requisito para que Pricing produzca un resultado calculado. Tampoco convierte el análisis de rentabilidad en autorización comercial.

## 9. Migración progresiva

### Fase 1 — Pricing aislado actual

- Pricing implementa únicamente precio fijo manual.
- Sus pruebas directas validan el contrato puro.
- No está integrado con Application, estado, UI ni consumidores.
- Costing y el flujo heredado permanecen sin cambios.

### Fase 2 — Application consume `ResultadoPrecio`

- Application obtiene `ResultadoCostos` y contexto comercial explícitos.
- Invoca Pricing sin calcular reglas.
- Recibe éxito o errores explícitos.
- Mantiene separado `ResultadoPrecio` de `ultimoCosto`.

Esta fase requerirá una especificación técnica y autorización propias antes de modificar código.

### Fase 3 — Approval define autorización

- se define el contrato de autorización;
- se establecen permisos, estados y evidencia;
- Approval consume el resultado calculado sin recalcularlo;
- se distingue formalmente precio calculado de precio autorizado.

Ninguna regla de Approval debe introducirse dentro de Pricing o Application.

### Fase 4 — Confirmación migra

- confirmación deja de interpretar el costo heredado como precio;
- consume exclusivamente un precio autorizado;
- los aliases técnicos se mantienen si otros consumidores aún los necesitan;
- se ejecuta regresión específica del flujo de pedido.

### Fase 5 — Reportes comerciales migran

- los reportes de ventas consumen resultados comerciales ya calculados;
- los reportes técnicos continúan consumiendo costos y datos de fabricación;
- los renderers y Excel no incorporan fórmulas comerciales;
- la exposición de costos internos se protege según audiencia y permisos futuros.

Cada fase debe ser mínima, reversible y validada antes de comenzar la siguiente.

## 10. Dirección de dependencias

La dirección conceptual es:

```text
Presentation
     ↓
Application
     ↓
Pricing Domain
```

- Presentation captura y muestra; no calcula.
- Application coordina; no define reglas comerciales.
- Pricing valida y calcula el precio solicitado.

Pricing no depende de:

- Application;
- `main.js`;
- DOM;
- estado global;
- reportes;
- Excel;
- Approval;
- Order;
- optimizer o geometría.

Application depende del contrato público de Pricing, no de sus detalles internos.

## 11. Errores y ausencia de fallback

Si Pricing rechaza el cálculo, Application debe conservar el error explícito y detener el avance comercial correspondiente.

Application no debe:

- convertir el costo en precio;
- recuperar `ultimoTotal` como sustituto;
- reutilizar silenciosamente un precio anterior;
- cambiar el método solicitado;
- suprimir errores para permitir confirmación;
- marcar un resultado como autorizado.

La presentación futura podrá comunicar los errores, pero la forma visual y el mecanismo de captura quedan fuera de este diseño.

## 12. Validación requerida para fases futuras

Cuando se autorice la integración deberán comprobarse, como mínimo:

- el mismo `ResultadoCostos` antes y después;
- ausencia de cambios en fórmulas de Costing;
- invocación de Pricing con contexto explícito;
- propagación íntegra de `ResultadoPrecio`;
- rechazo sin fallback ante error comercial;
- separación entre costo, precio calculado y precio autorizado;
- conservación de `ultimoReporte`, `ultimoTotal` y `total` mientras sigan en uso;
- confirmación sin cambios hasta la fase autorizada;
- reportes técnicos y Excel sin cambios hasta sus fases correspondientes.

La matriz concreta deberá determinarse según los archivos realmente modificados. Este documento no ejecuta ni sustituye esa regresión.

## 13. Relación con documentos anteriores

- **64 — Confirmation Flow Audit:** establece que la confirmación no debe migrarse hacia `costoTotal` y debe esperar un precio autorizado.
- **66 — Pricing Layer Technical Specification:** define `ResultadoPrecio`, errores, separación entre cálculo y autorización y dependencias futuras.
- **67 — Profitability Layer Design:** ubica la rentabilidad como análisis de `ResultadoCostos` y `ResultadoPrecio`.
- **68 — Pricing Layer Implementation Plan:** limita la primera implementación a precio fijo manual y difiere la integración de consumidores.

Este documento define la frontera de coordinación necesaria entre esas decisiones y una futura Application Layer.

## 14. Límites

Este documento no autoriza:

- cambios en `src/scripts/main.js`;
- cambios en estado global;
- creación de propiedades nuevas de estado;
- cambios HTML o CSS;
- cambios en Excel;
- cambios en reportes o renderers;
- cambios en confirmación de pedido;
- integración de Pricing con consumidores;
- implementación de Approval;
- implementación de Order;
- implementación de Profitability;
- persistencia, tablas o APIs;
- listas, markup, descuentos, impuestos o monedas;
- código nuevo o modificación de código existente.

Su alcance es exclusivamente el diseño conceptual de una integración futura y progresiva entre Application Layer y Pricing Layer.
