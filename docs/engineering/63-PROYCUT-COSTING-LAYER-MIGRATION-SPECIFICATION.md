# 63 — Especificación de migración segura de Costing Layer ProyCut

## Estado del documento

Especificación técnica detallada para la primera migración segura de la capa económica.

Pendiente de implementación.

Este documento define el alcance, el contrato esperado, la compatibilidad y las verificaciones que deben preceder cualquier modificación real de `src/scripts/costing/calculate-costs.js`. No autoriza cambios de código, creación de módulos, refactors, interfaz, persistencia ni infraestructura.

Su propósito es resolver únicamente la primera frontera: hacer explícito que el resultado actual es costo técnico, sin alterar números ni romper consumidores heredados.

---

## 1. Estado actual

### Flujo económico vigente

```text
Optimizer
    ↓
Costing
    ↓
Reporte
    ↓
Excel / UI
```

El flujo real está coordinado por `recalcular()` dentro de `src/scripts/main.js`:

1. Lee el proyecto actual desde el DOM y construye un modelo temporal.
2. Prepara y valida piezas, parámetros de corte y opciones.
3. Ejecuta la optimización.
4. Obtiene tableros por material, cantidad de cortes y metros lineales.
5. Invoca `calcularCostosProyecto()`.
6. Entrega el resultado a `aplicarResultadoCostos()`.
7. Renderiza el reporte y actualiza el estado.
8. Excel y la confirmación demo consumen posteriormente ese estado.

### Ubicación real de `calcularCostosProyecto()`

La función vive en:

`src/scripts/costing/calculate-costs.js`

Está expuesta mediante `window.ProyCutCosting` porque la aplicación actual utiliza scripts clásicos ordenados e IIFE; no existe todavía un sistema de módulos ES ni la estructura objetivo `src/modules/` descrita por la arquitectura futura.

La función es pura según el contrato actual:

- no accede a `document`;
- no accede a `state`;
- no accede a `localStorage`;
- no muta sus parámetros;
- devuelve éxito o error explícito.

### Entradas actuales confirmadas

`calcularCostosProyecto()` recibe un objeto con 14 entradas reales:

- `piezas`;
- `boards`;
- `tablerosPorMaterial`;
- `totalCortes`;
- `totalCorteMm`;
- `materiales`;
- `componentes`;
- `componentesProyecto`;
- `tapacantos`;
- `cantidadProyectos`;
- `modoPrecioCorte`;
- `precioCorte`;
- `precioCorteMetro`;
- `redondearTapacanto`.

Estas entradas mezclan datos fuente del proyecto con resultados técnicos ya derivados, pero todas se reciben explícitamente. El módulo no consulta el optimizador, la interfaz ni el estado global por su cuenta.

### Salida actual confirmada

Camino inválido:

```text
Resultado inválido
    └── errores
```

Camino válido:

```text
Resultado válido
    └── datosReporte
          ├── materiales
          ├── matSubtotal
          ├── cantidadProyectos
          ├── componentes
          ├── componentesSubtotal
          ├── tableros
          ├── cortes
          ├── corteMl
          ├── corteMlPresentacion
          ├── precioCorte
          ├── corteLineaLabel
          ├── corteImporte
          ├── tapacantos
          ├── tapaSubtotal
          └── total
```

La salida válida conserva 15 propiedades heredadas. Combina desgloses de costos, métricas técnicas necesarias para el reporte y etiquetas de presentación.

### Significado real de `total`

`total` representa exclusivamente:

```text
Costo de materiales
  + Costo de componentes
  + Costo de corte
  + Costo de tapacanto
```

Por lo tanto, `total` es costo técnico total. No contiene precio comercial, descuento, impuesto, markup, margen real ni ganancia.

### Costo técnico existente

Actualmente ProyCut tiene:

```text
Costo técnico
    ├── materiales
    ├── componentes
    ├── corte
    └── tapacanto
```

Actualmente ProyCut no tiene precio comercial.

### Origen de la mezcla entre costo y precio

La mezcla aparece después del cálculo, no dentro de una fórmula comercial existente:

- el objeto se llama `datosReporte`, sin declarar que es un resultado de costos;
- su `total` se copia a `state.ultimoTotal`;
- el objeto completo se copia a `state.ultimoReporte`;
- el renderer presenta ese total como “Total del proyecto” dentro de un reporte identificado como “Precio del proyecto”;
- Excel produce una hoja llamada “Resumen y precio” a partir del mismo valor;
- la confirmación demo valida `state.ultimoReporte.total` como total de pedido.

No existe una capa intermedia que transforme costo en precio. La presentación comercial del valor técnico crea la ambigüedad.

---

## 2. Problema que resuelve esta migración

### Antes

```text
datosReporte.total
```

### Problema

El sistema interpreta ese valor como precio, aunque realmente es costo.

El nombre genérico permite que distintos consumidores atribuyan significados diferentes al mismo número. Mientras esta ambigüedad exista, agregar precio de venta o rentabilidad podría producir dos o más “totales” sin una frontera confiable.

### Separación obligatoria

```text
Costo ≠ Precio ≠ Ganancia
```

- **Costo:** lo que cuesta fabricar.
- **Precio:** lo que se cobra al cliente.
- **Ganancia:** diferencia entre precio de venta y costo total.

La primera migración solo formaliza el costo. No crea todavía precio ni ganancia.

### Resultado esperado de esta primera separación

Después de la migración inicial debe ser posible afirmar técnicamente:

- el módulo de costeo produce un resultado de costos explícito;
- `costoTotal` tiene el mismo valor numérico que el `total` heredado;
- los consumidores actuales siguen funcionando;
- ninguna regla comercial fue agregada;
- el optimizador produce exactamente los mismos resultados.

---

## 3. Contrato futuro `ResultadoCostos`

`ResultadoCostos` es un contrato de dominio.

No es:

- una tabla;
- una columna;
- una API;
- una respuesta HTTP;
- una representación de Supabase;
- una implementación final;
- un componente de interfaz.

Su finalidad es nombrar de forma inequívoca el resultado técnico del costeo.

### Contenido conceptual esperado

```text
ResultadoCostos
    ├── costoMateriales
    ├── costoComponentes
    ├── costoCorte
    ├── costoTapacanto
    ├── costoTotal
    ├── desglose técnico
    └── advertencias
```

### `costoMateriales`

Representa el subtotal actual `matSubtotal`, sin cambiar su fórmula ni sus líneas de detalle.

### `costoComponentes`

Representa el subtotal actual `componentesSubtotal`, conservando la cantidad por proyecto, la cantidad de proyectos y el comportamiento vigente de los componentes.

### `costoCorte`

Representa el valor actual `corteImporte`, calculado por cantidad de cortes o metros lineales según el modo ya seleccionado.

### `costoTapacanto`

Representa el subtotal actual `tapaSubtotal`, incluidos metraje exacto, metraje cobrable y redondeo opcional vigente.

### `costoTotal`

Representa la misma suma que hoy se publica como `total`. El cambio de nombre expresa significado; no autoriza una nueva fórmula.

### Desglose técnico

Debe conservar la información necesaria para explicar y reportar el costo:

- líneas de materiales;
- líneas de componentes;
- líneas de tapacanto;
- tableros utilizados;
- cortes;
- metros lineales;
- reglas técnicas de presentación que todavía necesiten los consumidores heredados.

La forma definitiva del desglose queda pendiente. La primera fase debe priorizar compatibilidad y evitar reorganizar todas las propiedades simultáneamente.

### Advertencias

Representan incertidumbres o condiciones relevantes del resultado de costos. Su política definitiva todavía no está diseñada.

La primera migración no debe cambiar el comportamiento actual de precio cero, datos faltantes ni error genérico. Agregar nuevas advertencias visibles sería un cambio funcional y requiere una fase separada.

---

## 4. Compatibilidad temporal

### Contrato heredado

Actualmente los consumidores esperan:

```text
datosReporte.total
```

### Contrato durante la transición

Conceptualmente, el resultado debe exponer:

```text
ResultadoCostos
    ├── costoTotal
    └── total
          alias temporal de costoTotal
```

La condición obligatoria es:

```text
costoTotal = total
```

Ambos nombres deben representar exactamente el mismo valor durante la compatibilidad. No pueden calcularse mediante rutas distintas.

### Motivo del alias temporal

El alias `total` existe únicamente para conservar compatibilidad con:

- `src/scripts/reports/report-renderer.js`;
- la construcción del Excel completo;
- el estado actual;
- `state.ultimoReporte`;
- `state.ultimoTotal`;
- la confirmación demo.

### Regla del adaptador

El mecanismo temporal debe adaptar nombres y formas, no recalcular costos. La fuente numérica debe seguir siendo una sola.

No debe existir una fórmula para `costoTotal` y otra para `total`. El alias heredado debe derivar directamente del valor canónico o ambos deben asignarse desde el mismo resultado calculado.

### Prohibición de renombramiento masivo

La primera fase no debe renombrar simultáneamente:

- `datosReporte`;
- `total`;
- `ultimoReporte`;
- `ultimoTotal`;
- argumentos de `renderReporte()`;
- parámetros de `construirLibroExcel()`;
- etiquetas de la interfaz.

Un renombramiento masivo ampliaría el cambio desde el contrato de costeo hacia presentación, estado, exportación e interacción comercial. Eso impediría demostrar que la primera migración conserva comportamiento.

### Duración de la compatibilidad

El alias debe existir hasta que:

1. todos los consumidores hayan sido identificados;
2. el estado tenga una representación explícita de costos;
3. el reporte técnico consuma `ResultadoCostos`;
4. Excel consuma un contrato estable;
5. la confirmación demo deje de tratar costo como precio;
6. una búsqueda global confirme que `datosReporte.total` ya no se interpreta comercialmente;
7. las pruebas de regresión correspondientes hayan pasado.

La eliminación del alias debe realizarse en un cambio posterior e independiente.

---

## 5. Primera fase de implementación futura

### Archivo principal

`src/scripts/costing/calculate-costs.js`

### Objetivo único

Formalizar la salida de costos.

La primera implementación futura debe limitarse a introducir nombres explícitos para los resultados ya calculados y la compatibilidad requerida por los consumidores actuales.

### Restricciones obligatorias

No cambiar:

- fórmula de materiales;
- fórmula de componentes;
- fórmula de corte;
- fórmula de tapacanto;
- suma total;
- redondeo de tapacanto;
- conversión de milímetros a metros;
- entradas de la función;
- cantidad de proyectos;
- fallbacks vigentes;
- validación de valores finitos y no negativos;
- forma del error actual;
- comportamiento numérico;
- pureza del módulo;
- ausencia de mutación de entradas.

### Elementos que debe conservar

- materiales;
- componentes;
- corte;
- tapacanto;
- desgloses existentes;
- métricas técnicas utilizadas por reportes;
- contrato válido e inválido;
- compatibilidad con `datosReporte`.

### Criterio de aceptación principal

Para cualquier entrada válida soportada hoy:

```text
Costo antes = Costo después
```

Para cualquier entrada inválida soportada hoy:

```text
Error antes = Error después
```

### Alcance de archivos

La implementación de esta primera fase debería buscar el cambio mínimo posible en `calculate-costs.js`. Si fuera imprescindible tocar un consumidor para exponer el contrato, ese cambio deberá justificarse, aprobarse y probarse como alcance adicional; no queda autorizado automáticamente por esta especificación.

---

## 6. Qué NO debe hacerse

### Prohibiciones dentro de `calculate-costs.js`

No introducir:

- precio de venta;
- markup;
- descuentos;
- clientes;
- listas comerciales;
- margen real;
- ganancias;
- cotizaciones;
- pedidos;
- impuestos;
- reglas de autorización;
- persistencia;
- acceso a interfaz.

El módulo de costos no debe conocer la futura Pricing Layer ni Profitability Layer. Su responsabilidad termina al producir `ResultadoCostos`.

### Archivos y subsistemas fuera de la primera fase

No modificar:

- optimizer;
- nesting;
- geometría;
- `src/scripts/project/optimize-project.js`;
- DXF;
- SVG;
- Excel;
- interfaz;
- HTML;
- CSS;
- piezas;
- importadores CSV/Excel;
- formato de proyecto reimportable;
- formato de catálogo CAT-7;
- interacción manual de tableros;
- persistencia;
- SQL;
- configuración.

Estas áreas no son necesarias para formalizar el resultado de costos. Tocarlas impediría aislar el riesgo y ampliaría la matriz de regresión sin aportar a la primera frontera.

---

## 7. Dependencias actuales

### `src/scripts/project/apply-project-results.js`

`aplicarResultadoCostos()` es el único punto donde el resultado del costeo toca estado y DOM.

Actualmente:

- extrae `resultadoCostos.datosReporte`;
- llama `renderReporte(datosReporte, ...)`;
- asigna `state.ultimoTotal = datosReporte.total`;
- asigna `state.ultimoReporte = datosReporte`;
- limpia estado y paneles cuando el costeo falla.

Debe migrarse después porque combina compatibilidad de estado, presentación y efectos de error. Cambiarlo en la primera fase ocultaría si una diferencia proviene del contrato o de la aplicación del resultado.

### `src/scripts/reports/report-renderer.js`

Consume subtotales, desgloses técnicos y `datos.total`. Tiene cuatro plantillas visuales y presenta el valor como “Total del proyecto”.

Debe migrarse después de estabilizar `ResultadoCostos`, porque su responsabilidad futura será representar un reporte técnico explícito, no definir el contrato de dominio.

### `src/scripts/main.js`

`recalcular()` es el único llamador confirmado de `calcularCostosProyecto()`. Construye sus 14 entradas y entrega el resultado a `aplicarResultadoCostos()`.

También contiene:

- el estado actual;
- coordinación del Excel;
- construcción del Excel completo;
- confirmación demo;
- numerosos subsistemas no económicos.

Debe modificarse solo en fases posteriores y con alcance estrecho. No debe recibir fórmulas económicas.

### Excel completo

`construirLibroExcel()` consume una copia de `state.ultimoReporte`. Utiliza propiedades heredadas para crear:

- “Piezas y diagramas”;
- “Reporte”;
- “Resumen y precio”.

Excel debe migrarse después porque es una frontera externa y visual que depende de la forma completa del resultado actual. Durante la compatibilidad debe producir los mismos valores y estructura observable.

El formato Excel completo no debe confundirse con “Exportar formato”, que es reimportable y posee otro contrato.

### `state.ultimoReporte`

Almacena una copia derivada de `datosReporte` para que Excel use los mismos números mostrados en pantalla. También participa en la confirmación demo.

Debe separarse después en estados con significado explícito. Eliminarlo en la primera fase rompería consumidores existentes.

### `state.ultimoTotal`

Almacena una copia de `datosReporte.total`. La auditoría actual no encontró consumidores de lectura funcionales, pero se inicializa y restablece junto con el reporte.

Su redundancia no autoriza eliminarlo dentro de la primera fase. Debe revisarse y retirarse, si corresponde, en un cambio posterior dedicado.

### Motivo del orden diferido

Estos consumidores pertenecen a Aplicación, Presentación y exportación. La primera fase debe estabilizar el contrato interno antes de migrar fronteras externas o estado, siguiendo la dirección:

```text
Dominio
    ↓
Aplicación
    ↓
Presentación / Exportación
```

---

## 8. Estrategia de pruebas

### Principio de equivalencia

Para el mismo proyecto:

```text
Antes: costo X
Después: costo X
```

No basta comparar únicamente `costoTotal`. Debe compararse la salida completa relevante.

### Línea base previa

Antes de modificar código se debe registrar una línea base reproducible con:

- entradas del costeo;
- resultado válido o inválido;
- subtotales;
- desgloses;
- cantidad de tableros;
- cortes;
- metros lineales;
- Excel de referencia cuando aplique validación manual;
- mensajes de error.

### Equivalencia del costeo

Debe conservar:

- mismo costo de materiales;
- mismo costo de componentes;
- mismo costo de corte;
- mismo costo de tapacanto;
- mismo costo total;
- mismas líneas de materiales;
- mismas líneas de componentes;
- mismas líneas de tapacanto;
- mismas reglas de redondeo;
- mismos casos de precio cero;
- mismos fallbacks técnicos;
- misma no-mutación de entradas.

### Equivalencia técnica del proyecto

Aunque el optimizador no se modifique, debe confirmarse:

- mismos tableros;
- mismos cortes;
- mismos metros lineales;
- mismo orden de coordinación;
- mismos resultados de optimización entregados al costeo.

Esto protege contra cambios colaterales en `main.js` si alguna fase posterior toca coordinación.

### Reporte durante compatibilidad

Debe conservar:

- mismos subtotales visibles;
- mismo total visible;
- mismas cuatro plantillas actuales;
- mismos estados de panel visible/oculto;
- mismos errores de proyecto.

### Excel durante compatibilidad

Debe conservar:

- mismos valores económicos;
- mismas hojas;
- mismos subtotales;
- mismo total;
- misma correspondencia entre pantalla y snapshot exportado;
- misma distinción entre Excel completo y formato reimportable.

### Casos mínimos

La matriz debe incluir, como mínimo conceptual:

- una pieza y un tablero;
- varias piezas y varios tableros;
- varios materiales;
- componentes;
- cantidad de proyectos mayor que uno;
- corte por cantidad;
- corte por metro lineal;
- tapacanto sin redondeo;
- tapacanto con redondeo a 0.5 m;
- precios unitarios en cero;
- datos ausentes tolerados actualmente;
- costo inválido no finito o negativo.

### Herramientas reales

La implementación futura debe consultar `proycut-regression-matrix` y las pruebas existentes antes de ejecutar comandos. Esta especificación no inventa infraestructura de pruebas que el repositorio no tenga.

---

## 9. Orden de migración recomendado

### Paso 1 — Formalizar `ResultadoCostos`

Agregar nombres explícitos para los valores actuales dentro del contrato de salida, sin retirar propiedades heredadas ni modificar consumidores.

Condición de salida: equivalencia completa del costeo.

### Paso 2 — Crear adaptador de compatibilidad

Mantener `datosReporte` y `total` disponibles para consumidores heredados. El adaptador transforma la forma; no recalcula.

Condición de salida: UI, estado, reportes y Excel continúan funcionando sin diferencias observables.

### Paso 3 — Separar estado

Introducir una representación explícita del último resultado de costos y revisar por separado `ultimoReporte` y `ultimoTotal`.

Condición de salida: ningún consumidor recibe un valor con significado ambiguo y los snapshots de un ciclo permanecen coherentes.

Este paso requiere una especificación y autorización independientes.

### Paso 4 — Migrar reportes

Hacer que el reporte técnico consuma `ResultadoCostos` y nombre sus cifras como costos. Mantener separada la futura vista comercial.

Condición de salida: mismas cifras técnicas y ninguna fórmula dentro del renderer.

### Paso 5 — Migrar Excel

Adaptar el Excel completo al contrato explícito de costos, preservando estructura y valores durante compatibilidad.

Condición de salida: comparación estructural y visual aprobada; el formato reimportable permanece intacto.

### Paso 6 — Eliminar nombres ambiguos

Después de migrar todos los consumidores, retirar gradualmente `datosReporte.total`, `ultimoTotal` u otros nombres heredados que ya no tengan consumidores.

Condición de salida: búsqueda global sin usos comerciales ambiguos y regresión completa aprobada.

### Paso 7 — Crear Pricing Layer

Solo después de estabilizar Costing Layer se podrá diseñar e implementar el cálculo de precio comercial.

Pricing Layer debe consumir `ResultadoCostos`; no debe modificarlo ni duplicar sus fórmulas.

Este paso queda fuera del alcance y autorización de la presente especificación.

---

## 10. Relación con documentos anteriores

- **[[61-PROYCUT-COST-PRICE-PROFIT-MODEL]] — Modelo económico:** confirma la separación `Costo ≠ Precio ≠ Ganancia` y define conceptualmente `ResultadoCostos`. Esta especificación limita la primera implementación a ese resultado.
- **[[62-PROYCUT-ECONOMIC-LAYER-IMPLEMENTATION-PLAN]] — Plan de implementación:** define Costing, Pricing y Profitability como capas futuras y organiza la evolución general por fases. Este documento detalla únicamente su Fase A.
- **[[58-PROYCUT-OPTIMIZER-ROADMAP]] — Optimizer:** establece que el motor produce resultados técnicos y no conoce precios, clientes ni márgenes. La migración de costos comienza después de su salida y no modifica el motor.
- **[[59-PROYCUT-TECHNICAL-ARCHITECTURE-ROADMAP]] — Arquitectura técnica:** exige evolución gradual, contratos explícitos y dependencias hacia el dominio. La compatibilidad temporal evita una migración transversal masiva.
- **[[60-PROYCUT-FRONTEND-ARCHITECTURE-ROADMAP]] — Frontend:** identifica `main.js` como coordinador actual y separa Presentación de reglas críticas. La migración del frontend ocurre después de estabilizar el contrato de costos.

### Fuentes del comportamiento actual

- **[[37-COST-CALCULATION-DECOUPLING-REPORT]]:** contrato real de 14 entradas, salida heredada de 15 propiedades y equivalencia previamente verificada de las cuatro fórmulas.
- **[[44-CURRENT-ARCHITECTURE-INVENTORY]]:** ubicación actual de `costing`, coordinación, aplicación de resultados, renderer y Excel.
- **[[57-PROYCUT-DOMAIN-MODEL]]:** Project como concepto central, separación fuente/derivado y conservación histórica del contexto del proyecto.

---

## 11. Limitaciones

Este documento no autoriza:

- modificar código;
- modificar JavaScript;
- crear Pricing Layer;
- crear Profitability Layer;
- crear listas de precios;
- crear tablas;
- crear columnas;
- crear APIs;
- crear UI;
- modificar HTML o CSS;
- crear módulos;
- cambiar importadores o exportadores;
- cambiar Excel;
- cambiar DXF;
- cambiar SVG;
- modificar el optimizador;
- modificar geometría o nesting;
- crear migraciones;
- integrar Supabase;
- modificar persistencia;
- cambiar reglas de negocio pendientes.

Solo define la migración segura del contrato del módulo de costos.

Cada paso posterior requiere una tarea explícita, alcance propio, pruebas proporcionales al riesgo y aprobación antes de modificar archivos.
