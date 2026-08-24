# 70 — ProyCut Pricing Application Adapter Specification

> **ESTADO: HISTÓRICO / IMPLEMENTADO / SUPERADO POR LA IMPLEMENTACIÓN ACTUAL.** Este documento conserva las decisiones, restricciones y razonamiento de la fase que especificó el adapter antes de implementarlo. El adapter y la integración productiva de Pricing existen ahora. No debe utilizarse como inventario del estado actual; la realidad vigente está representada por `src/scripts/project/pricing-application-adapter.js`, `src/scripts/project/calculate-project-price.js`, `src/scripts/pricing/calculate-price.js` y sus consumidores actuales en `index.html` y `src/scripts/main.js`.

## 1. Estado del documento

Este documento especifica conceptualmente el adapter que permitirá a Application Layer coordinar el módulo Pricing aislado.

Es el último documento conceptual previo a solicitar una implementación de integración. No crea el adapter, no autoriza código y no modifica consumidores.

El estado de partida es:

- Costing produce `ResultadoCostos`;
- Pricing implementa de forma aislada el método `PRECIO_FIJO`;
- Pricing devuelve `ResultadoPrecio` o errores explícitos;
- Application todavía no invoca Pricing;
- Approval todavía no existe;
- confirmación, reportes y Excel continúan en el flujo heredado.

La separación obligatoria es:

> Application coordina. Pricing calcula. Approval autoriza.

## 2. Propósito del adapter

El adapter establece una frontera explícita entre la coordinación del caso de uso y el cálculo comercial.

Su propósito futuro es:

- recibir desde Application un costo técnico y un contexto comercial ya identificados;
- construir la solicitud que exige el contrato público de Pricing;
- invocar Pricing sin duplicar validaciones o fórmulas comerciales;
- devolver a Application el resultado íntegro de la operación;
- impedir que dependencias heredadas sean reinterpretadas como precio;
- aislar a la coordinación de detalles internos del módulo Pricing.

El adapter no es:

- una nueva Pricing Layer;
- un calculador de precio;
- un repositorio;
- un componente de presentación;
- una política de Approval;
- un puente hacia Order;
- una compatibilidad entre costo y precio.

Su valor arquitectónico es hacer visible el paso de Application hacia Pricing sin colocar reglas comerciales en `main.js`, estado, UI o exportadores.

## 3. Ubicación arquitectónica futura

El adapter pertenece conceptualmente a Application Layer porque coordina un caso de uso y depende del contrato público de Pricing.

La dirección de dependencia debe ser:

```text
Presentation
     ↓
Application Adapter
     ↓
Pricing Layer
```

Pricing no debe depender del adapter. Costing tampoco debe depender de él.

La ubicación física y el nombre definitivo del archivo deberán autorizarse en la fase de implementación, considerando que la arquitectura actual utiliza módulos clásicos bajo `src/scripts/` y todavía no materializa la estructura objetivo `src/modules/`.

No debe crearse una estructura arquitectónica paralela ni introducirse un framework para alojar este adapter.

## 4. Frontera Application → Pricing

La frontera conceptual es:

```text
Application
    │
    ├── ResultadoCostos
    └── ContextoComercial
              ↓
      Application Adapter
              ↓
         Pricing Layer
              ↓
        ResultadoPrecio
              ↓
         Application
```

Application selecciona el caso de uso que desea ejecutar y entrega datos explícitos. El adapter no completa información ausente ni selecciona un método alternativo.

La operación futura del adapter puede describirse conceptualmente como:

```text
calcularPrecioDesdeAplicacion({
  resultadoCostos,
  contextoComercial
})
```

Este nombre expresa la responsabilidad, pero no constituye todavía una firma JavaScript autorizada.

## 5. Entradas

### 5.1 `ResultadoCostos`

El adapter debe recibir el contrato canónico producido por Costing:

```text
ResultadoCostos
├── costoMateriales
├── costoComponentes
├── costoCorte
├── costoTapacanto
└── costoTotal
```

Reglas:

- se entrega como un objeto explícito;
- el adapter no recalcula ningún campo;
- el adapter no modifica el objeto;
- el adapter no construye el contrato desde aliases heredados;
- `total`, `ultimoTotal` y `ultimoReporte.total` no sustituyen `costoTotal`;
- ningún campo de costo se utiliza como precio comercial.

El módulo Pricing conserva la validación de su contrato de entrada. El adapter no debe duplicar esa regla de dominio.

### 5.2 `ContextoComercial`

Para la primera integración autorizable, el contexto mínimo es:

```text
ContextoComercial
├── metodo: PRECIO_FIJO
└── precioManual: número explícito mayor que cero
```

El adapter debe trasladar el contexto recibido sin:

- cambiar el método;
- normalizar un método no soportado hacia `PRECIO_FIJO`;
- derivar `precioManual` desde el costo;
- convertir strings en números silenciosamente;
- aplicar redondeos;
- agregar descuentos;
- agregar moneda, impuestos, cliente o lista.

La captura y conversión desde controles de presentación no pertenece a este adapter. Application deberá entregar datos ya expresados conforme al contrato.

### 5.3 Dependencia de Pricing

El adapter deberá acceder únicamente a la operación pública de Pricing que calcula el precio del proyecto.

No debe:

- conocer validadores internos de Pricing;
- llamar funciones privadas;
- inspeccionar su implementación;
- duplicar constantes comerciales;
- alterar su retorno.

La forma técnica de resolver esta dependencia deberá seguir el patrón real de módulos clásicos del repositorio y quedar limitada al alcance de la implementación autorizada.

## 6. Invocación y responsabilidades

El adapter tendrá una secuencia única:

1. Recibe `ResultadoCostos` y `ContextoComercial`.
2. Conserva ambas referencias sin mutarlas.
3. Invoca una vez la operación pública de Pricing.
4. Recibe el contrato explícito de Pricing.
5. Devuelve el contrato a Application sin calcular, autorizar ni persistir.

### Responsabilidades permitidas

- delimitar la llamada Application → Pricing;
- mantener explícitas las dos entradas;
- delegar el cálculo;
- propagar éxito o error;
- preservar la separación semántica entre costo y precio.

### Responsabilidades prohibidas

- calcular `precioBase` o `precioFinal`;
- copiar `costoTotal` hacia un campo de precio;
- aplicar markup o descuento;
- seleccionar listas;
- validar reglas comerciales ya propiedad de Pricing;
- convertir errores en resultados exitosos;
- leer o escribir estado global;
- tocar DOM o almacenamiento;
- renderizar mensajes;
- autorizar el resultado;
- crear o confirmar pedidos.

## 7. Salida `ResultadoPrecio`

Ante una operación exitosa, Pricing devuelve:

```text
{
  ok: true,
  resultadoPrecio: {
    precioBase,
    metodoAplicado,
    descuentoAplicado,
    precioFinal,
    advertencias
  }
}
```

Para la primera versión de precio fijo manual:

- `precioBase` conserva `precioManual`;
- `metodoAplicado` identifica `PRECIO_FIJO`;
- `descuentoAplicado` es `null`;
- `precioFinal` es igual a `precioBase`;
- `advertencias` es una colección explícita.

El adapter debe devolver este contrato sin:

- renombrar propiedades;
- agregar autorización;
- sustituir el resultado por un importe suelto;
- mezclar datos de `ResultadoCostos` dentro de `ResultadoPrecio`;
- guardar silenciosamente una copia en estado.

Un `ResultadoPrecio` válido es un cálculo comercial. No es todavía un precio autorizado.

## 8. Errores

Pricing utiliza un retorno explícito para errores de validación comercial:

```text
{
  ok: false,
  errores: [
    {
      codigo,
      mensaje
    }
  ]
}
```

El adapter debe propagar ese contrato sin usar excepciones para convertir validaciones comerciales en control de flujo.

### Casos que Pricing debe seguir rechazando

- `ResultadoCostos` ausente o inválido;
- campos canónicos de costo ausentes;
- contexto comercial ausente;
- método distinto de `PRECIO_FIJO`;
- `precioManual` ausente;
- `precioManual` no numérico o no finito;
- `precioManual` igual a cero o negativo;
- entrada basada únicamente en el alias heredado `total`.

### Conducta del adapter ante error

El adapter no debe:

- usar `costoTotal` como fallback;
- recuperar `ultimoTotal`;
- reutilizar un `ResultadoPrecio` anterior;
- cambiar el método solicitado;
- ocultar uno o más errores;
- producir un resultado parcial;
- autorizar la continuación hacia Order o confirmación.

La presentación futura será responsable de mostrar errores. El adapter no define textos visuales ni HTML.

### Fallas técnicas

La ausencia o indisponibilidad de la dependencia Pricing es diferente de una validación comercial. La forma técnica de representar una falla de configuración del módulo deberá decidirse en la especificación de implementación y probarse expresamente.

No debe disfrazarse como un precio inválido ni resolverse con un fallback. Este documento no inventa un código de error técnico ni autoriza excepciones comerciales.

## 9. Separación de cálculo y autorización

La frontera permanece:

```text
Application coordina
Pricing calcula
Approval autoriza
Order consume
```

El adapter termina su responsabilidad al devolver el contrato de Pricing a Application.

No debe:

- incluir un campo `aprobado` por defecto;
- inferir autorización porque `ok === true`;
- invocar confirmación;
- crear Order;
- almacenar un supuesto precio autorizado.

`ok === true` significa que el cálculo comercial terminó conforme al método solicitado. No significa que el precio pueda avanzar al pedido.

## 10. Estado y compatibilidad heredada

La implementación inicial del adapter debe permanecer independiente del estado global.

Este documento no define ni autoriza:

- una propiedad futura para conservar `ResultadoPrecio`;
- cambios en `ultimoCosto`;
- cambios en `ultimoReporte`;
- cambios en `ultimoTotal`;
- eliminación de `total`.

Los contratos heredados continúan temporalmente para sus consumidores actuales, pero:

- no representan precio comercial;
- no forman la entrada comercial del adapter;
- no deben copiarse a `ResultadoPrecio`;
- no deben alimentar confirmación futura.

Separar el adapter de estado permite probar la coordinación antes de decidir el ciclo de vida de un precio calculado.

## 11. Pureza y efectos colaterales

El adapter deberá ser determinista respecto de sus entradas y de la respuesta de Pricing.

No debe acceder a:

- `document`;
- `window` como fuente de datos de negocio;
- `state` global;
- `localStorage`;
- red;
- persistencia;
- Excel;
- renderers;
- confirmación.

No debe mutar:

- `ResultadoCostos`;
- `ContextoComercial`;
- `ResultadoPrecio`;
- errores devueltos por Pricing.

La exposición técnica del módulo deberá respetar el patrón de scripts existente sin convertir el objeto global en fuente de estado o reglas.

## 12. Pruebas necesarias

La futura implementación debe usar el mecanismo real del repositorio, sin introducir frameworks o dependencias nuevas.

### 12.1 Pruebas unitarias del adapter

Con una dependencia Pricing controlada deberá comprobarse:

- recibe y reenvía `ResultadoCostos` sin cambios;
- recibe y reenvía `ContextoComercial` sin cambios;
- invoca Pricing exactamente una vez;
- devuelve el mismo contrato exitoso producido por Pricing;
- devuelve el mismo contrato de error producido por Pricing;
- no calcula campos comerciales;
- no usa aliases heredados;
- no muta entradas ni salida.

### 12.2 Pruebas de contrato con Pricing real

Deberán cubrir:

- precio fijo manual válido;
- separación entre `costoTotal` y `precioFinal`;
- precio manual ausente;
- método no soportado;
- alias `total` sin `costoTotal` válido;
- string, `NaN`, `Infinity`, cero y valor negativo;
- `descuentoAplicado === null`;
- `precioFinal === precioBase`.

### 12.3 Regresión

Deberá confirmarse:

- Costing no fue modificado;
- sus fórmulas y resultados permanecen iguales;
- Pricing conserva sus pruebas existentes;
- `main.js` no fue modificado;
- estado global no fue modificado;
- reportes técnicos y Excel no cambiaron;
- confirmación no cambió;
- ningún consumidor heredado fue migrado.

### 12.4 Verificaciones automatizables

- `node --check` sobre cada archivo JavaScript nuevo o modificado;
- ejecución directa con Node de las pruebas disponibles;
- `git diff --check`;
- revisión de `git status --short`;
- búsqueda de dependencias prohibidas en el adapter.

No existe un runner de pruebas configurado. No debe inventarse `npm test`, Jest, Vitest ni otra infraestructura como parte de la integración.

## 13. Criterios de aceptación futuros

El adapter podrá considerarse correctamente implementado únicamente si:

- pertenece a la responsabilidad de Application;
- recibe contratos explícitos;
- delega exactamente una vez en Pricing;
- no contiene fórmulas comerciales;
- propaga éxito y error sin reinterpretarlos;
- no usa costo como precio;
- no accede a DOM, estado, almacenamiento o exportadores;
- no introduce Approval implícito;
- no modifica Pricing ni Costing para adaptarlos a su coordinación;
- cuenta con pruebas directas sin frameworks nuevos;
- no modifica consumidores existentes.

## 14. Archivos que no deben modificarse todavía

Una primera implementación aislada del adapter no debe modificar:

- `src/scripts/main.js`;
- `src/scripts/costing/calculate-costs.js`;
- `src/scripts/project/apply-project-results.js`;
- `src/scripts/reports/report-renderer.js`;
- archivos de Excel;
- `index.html`;
- CSS;
- optimizer;
- nesting;
- geometría;
- DXF;
- SVG;
- importadores;
- confirmación de pedido;
- estado global;
- persistencia;
- el módulo Pricing ya validado, salvo autorización explícita por un defecto contractual real.

Tampoco debe crearse Approval, Order, Profitability, UI comercial o infraestructura de persistencia.

## 15. Secuencia posterior

Después de implementar y validar el adapter aislado:

1. definir el contrato técnico para conservar `ResultadoPrecio` en Application;
2. autorizar una modificación mínima del punto coordinador;
3. mantener confirmación y consumidores heredados sin cambios;
4. especificar Approval;
5. migrar confirmación hacia precio autorizado;
6. migrar reportes comerciales en una fase independiente.

La existencia del adapter no autoriza automáticamente ninguno de esos pasos.

## 16. Relación con documentos anteriores

- **66 — Pricing Layer Technical Specification:** define el contrato de Pricing, su salida y sus errores.
- **68 — Pricing Layer Implementation Plan:** limita el primer método a precio fijo manual y exige ausencia de fallback.
- **69 — Pricing Application Integration Design:** asigna coordinación a Application, cálculo a Pricing y autorización a Approval.

Este documento concreta la frontera del adapter sin implementar la integración.

## 17. Limitaciones

Este documento no autoriza:

- código nuevo;
- creación del adapter;
- modificación de archivos existentes;
- integración con `main.js`;
- cambios de estado;
- cambios HTML o CSS;
- cambios en Excel;
- cambios en reportes o renderers;
- cambios en confirmación;
- Approval;
- Order;
- Profitability;
- persistencia, tablas o APIs;
- nuevos métodos comerciales;
- listas, markup, descuentos, impuestos o monedas;
- frameworks o herramientas de prueba nuevas.

Su alcance es exclusivamente especificar la futura frontera Application → Pricing y los criterios para implementarla de forma aislada y verificable.
