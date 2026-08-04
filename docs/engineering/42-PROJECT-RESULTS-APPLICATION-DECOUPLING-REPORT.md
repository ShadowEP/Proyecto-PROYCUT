# 42-PROJECT-RESULTS-APPLICATION-DECOUPLING-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-04

## Propósito
Registrar el sexto desacoplamiento arquitectónico de ProyCut: aislar las dos fases reales de aplicación de resultados dentro de `recalcular()` — aplicación de optimización antes de costos y aplicación económica después de costos — conservando exactamente su orden, efectos, ramas y retornos.

## Depende de
`src/scripts/main.js`; `src/scripts/project/apply-project-results.js`; `src/scripts/project/prepare-project.js`; `src/scripts/project/optimize-project.js`; `src/scripts/costing/calculate-costs.js`; `index.html`; `docs/engineering/36-ARCHITECTURAL-DECOUPLING-PLAN.md`; `docs/engineering/37-COST-CALCULATION-DECOUPLING-REPORT.md`; `docs/engineering/39-PROJECT-MODEL-DECOUPLING-REPORT.md`; `docs/engineering/40-PROJECT-PREPARATION-DECOUPLING-REPORT.md`; `docs/engineering/41-PROJECT-OPTIMIZATION-COORDINATION-DECOUPLING-REPORT.md`

## Referenciado por
PENDIENTE

---

# 1. Por qué se dividió en dos funciones

El análisis previo confirmó que no existe una única fase final posterior a costos. El orden real contiene dos bloques separados por `calcularCostosProyecto()`:

1. El resultado de optimización se aplica a `state` y al diagrama.
2. Después se calculan costos.
3. El resultado económico se aplica al reporte o se ejecuta su rama de limpieza.

Combinar ambos bloques en una función única posterior a costos habría movido `state.boards`, `state.activeTab` y `renderDiagrama()` después del cálculo económico. Eso habría eliminado el render transitorio que hoy ocurre antes de una posible falla de costos y habría cambiado el orden observable de efectos.

Por eso se crearon dos coordinadores independientes:

- `aplicarResultadoOptimizacion`;
- `aplicarResultadoCostos`.

# 2. Orden original confirmado

Antes del cambio, dentro de `recalcular()`:

1. Finalizaba `optimizarProyectoPreparado()`.
2. Se leían `state.boards[state.activeTab]` y la identidad del tablero anterior.
3. Se escribía `state.boards = boardsAll`.
4. Se buscaba el índice equivalente o se ajustaba el índice previo al nuevo rango.
5. Se escribía `state.activeTab`.
6. Se mostraba `resultadoPanel`.
7. Se llamaba `renderDiagrama()`.
8. Se llamaba `calcularCostosProyecto()`.
9. Si costos fallaban:
   - se llamaba `mostrarErroresProyecto`;
   - se ocultaba `resultadoPanel`;
   - se ocultaba `reportePanel`;
   - se vaciaba `state.boards`;
   - se asignaba `state.ultimoReporte = null`;
   - se asignaba `state.ultimoTotal = 0`;
   - se retornaba `false`.
10. Si costos eran válidos:
    - se obtenía `datosReporte`;
    - se leían `plantillaReporte` y `disenoTotal` con sus defaults;
    - se llamaba `renderReporte(datosReporte, plantilla, disenoTotal)`;
    - se escribía el HTML resultante en `reporteContenido`;
    - se mostraba `reportePanel`;
    - se escribía `state.ultimoTotal = datosReporte.total`;
    - se escribía `state.ultimoReporte = datosReporte`;
    - se retornaba `true`.

No existe una función `actualizarResumen` en el código actual y no se creó una.

# 3. Módulo creado

Se creó `src/scripts/project/apply-project-results.js`, cargado después de `optimize-project.js` y antes de `main.js`.

Expone:

```js
window.ProyCutProjectResults = {
  aplicarResultadoOptimizacion,
  aplicarResultadoCostos
};
```

El módulo no prepara, valida, optimiza ni calcula costos. Solo aplica resultados que ya fueron producidos por fases anteriores.

# 4. Contrato de `aplicarResultadoOptimizacion`

```js
aplicarResultadoOptimizacion({
  state,
  boards,
  resultadoPanel,
  renderDiagrama
})
```

## Efectos

1. Lee el board anterior usando `state.activeTab`.
2. Construye su identidad con `materialLabel + '·' + indexEnMaterial`.
3. Escribe `state.boards = boards`.
4. Busca la misma identidad en los boards nuevos.
5. Si no existe, ajusta el índice previo mediante `Math.min`.
6. Escribe `state.activeTab = Math.max(0, nuevoIndice)`.
7. Escribe `resultadoPanel.style.display = 'block'`.
8. Llama una vez `renderDiagrama()`.

No modifica `state.ultimoTotal` ni `state.ultimoReporte`, no renderiza el reporte y no calcula costos.

La función no necesita devolver un valor: el flujo original tampoco producía un resultado entre esta fase y `calcularCostosProyecto()`.

# 5. Contrato de `aplicarResultadoCostos`

```js
aplicarResultadoCostos({
  state,
  resultadoCostos,
  resultadoPanel,
  reportePanel,
  reporteContenido,
  leerOpcionesReporte,
  mostrarErroresProyecto,
  renderReporte
})
```

`leerOpcionesReporte` es una dependencia explícita para conservar una sutileza del orden original: `plantillaReporte` y `disenoTotal` solo se leen si los costos son válidos. La rama inválida no ejecuta ese callback.

## Rama inválida

1. Llama `mostrarErroresProyecto(resultadoCostos.errores)`.
2. Oculta `resultadoPanel`.
3. Oculta `reportePanel`.
4. Escribe `state.boards = []`.
5. Escribe `state.ultimoReporte = null`.
6. Escribe `state.ultimoTotal = 0`.
7. Retorna `false`.

El flujo original no vaciaba `reporteContenido.innerHTML`; solo ocultaba su panel. Esa ausencia de mutación se conserva, aunque una interpretación amplia de “limpiar DOM” pudiera sugerir lo contrario.

## Rama válida

1. Obtiene `datosReporte` del resultado ya calculado.
2. Ejecuta `leerOpcionesReporte()`.
3. Llama `renderReporte` una vez.
4. Escribe el HTML devuelto en `reporteContenido.innerHTML`.
5. Muestra `reportePanel`.
6. Escribe `state.ultimoTotal = datosReporte.total`.
7. Escribe `state.ultimoReporte = datosReporte`.
8. Retorna `true`.

# 6. Cambio en `recalcular()`

El flujo quedó:

```text
preparar proyecto
→ optimizar proyecto
→ aplicarResultadoOptimizacion(...)
→ calcularCostosProyecto(...)
→ return aplicarResultadoCostos(...)
```

El booleano de `recalcular()` ahora es directamente el booleano producido por `aplicarResultadoCostos`, idéntico al retorno original de sus dos ramas.

El diagrama sigue renderizándose antes de calcular costos. No se corrigió ni eliminó el comportamiento transitorio previo a una falla económica.

# 7. Dependencias inyectadas

## Fase de optimización

- objeto `state` existente;
- arreglo `boardsAll` ya calculado;
- referencia real a `resultadoPanel`;
- callback privado `renderDiagrama`.

## Fase económica

- objeto `state` existente;
- `resultadoCostos` ya producido por `calcularCostosProyecto`;
- referencias reales a `resultadoPanel`, `reportePanel` y `reporteContenido`;
- callback `leerOpcionesReporte` para las dos lecturas condicionales de DOM;
- callback privado `mostrarErroresProyecto`;
- callback privado `renderReporte`.

No se expusieron globalmente funciones adicionales de `main.js`.

# 8. Escrituras a `state`

| Fase/rama | Escrituras |
|---|---|
| Optimización | `state.boards = boards`; `state.activeTab = índice resuelto` |
| Costos inválidos | `state.boards = []`; `state.ultimoReporte = null`; `state.ultimoTotal = 0` |
| Costos válidos | `state.ultimoTotal = datosReporte.total`; `state.ultimoReporte = datosReporte` |

No cambió la estructura de `state`, los nombres de propiedades ni el orden de las escrituras.

# 9. Efectos de DOM y render

| Fase/rama | Efectos |
|---|---|
| Optimización | `resultadoPanel.style.display = 'block'`; `renderDiagrama()` |
| Costos inválidos | `mostrarErroresProyecto(...)`; ambos paneles pasan a `'none'` |
| Costos válidos | lectura condicional de plantilla/diseño; `renderReporte(...)`; escritura de `reporteContenido.innerHTML`; `reportePanel.style.display = 'block'` |

`renderDiagrama`, `renderReporte`, sus plantillas y los textos permanecen en `main.js` sin cambios.

# 10. Comparación contra el original

Se construyeron copias de control de ambos bloques originales y se compararon contra las funciones reales del módulo, cargadas con `vm.runInThisContext`.

Los mocks instrumentaron:

- setters de `state.boards`, `state.activeTab`, `state.ultimoTotal` y `state.ultimoReporte`;
- setters de visibilidad de ambos paneles;
- setter de `reporteContenido.innerHTML`;
- llamadas y argumentos de `renderDiagrama`;
- llamadas y argumentos de `renderReporte`;
- llamadas de `mostrarErroresProyecto`;
- lecturas condicionales de opciones del reporte;
- orden global exacto de todos los efectos.

Para cada escenario se compararon mediante `assert.deepStrictEqual` el estado completo, DOM, HTML, visibilidad, secuencia de eventos y contadores de llamadas. El retorno final se comparó mediante `assert.strictEqual`.

# 11. Pruebas automáticas

Se ejecutaron diez escenarios que cubren:

1. un board con pestaña válida;
2. varios boards conservando pestaña;
3. `activeTab` fuera de rango;
4. conservación de pestaña por identidad de material/índice;
5. costos inválidos;
6. total cero;
7. total positivo;
8. reporte completo;
9. paneles inicialmente ocultos;
10. paneles inicialmente visibles seguidos de error.

La comparación verificó además:

- llamada única y posición exacta de `renderDiagrama` antes de efectos económicos;
- llamada única de `renderReporte` solo en éxito;
- ausencia de lectura de plantilla/diseño en error;
- limpieza exacta de `state` en error;
- conservación del HTML anterior en error;
- retorno `false` en error y `true` en éxito.

**Resultado: 10/10 escenarios OK.**

Verificaciones estructurales:

- todos los JavaScript de `src/scripts/` pasaron `node --check`;
- `git diff --check` pasó;
- `apply-project-results.js` no contiene preparación, validación, optimización, empaquetado, cálculo de costos, acceso a `document` ni acceso a `localStorage`;
- el bloque original no quedó duplicado en `recalcular()`;
- la función de costos y las funciones de render no fueron modificadas.

# 12. Pruebas manuales pendientes

No se ejecutaron ni se aprueban en este reporte:

- proyecto con una pieza;
- proyecto con varias piezas;
- proyecto con varios tableros;
- costo total cero;
- costo total positivo;
- cambio y conservación de pestaña activa;
- contenido y visibilidad del reporte;
- contenido y visibilidad del diagrama;
- arrastre y rotación de piezas;
- espejo y compactación manual;
- exportación Excel;
- exportación DXF;
- rama de costo inválido en navegador;
- consola sin errores durante todos los flujos.

# 13. Riesgos

- **Mutación explícita de `state`**: a diferencia de los coordinadores anteriores, estas funciones son adaptadores de aplicación y modifican deliberadamente el objeto recibido. El contrato debe mantenerse restringido a los efectos documentados.
- **Dependencia del orden**: mover `aplicarResultadoOptimizacion` después del cálculo de costos cambiaría el comportamiento transitorio y la secuencia de callbacks.
- **Lecturas condicionales**: sustituir `leerOpcionesReporte` por valores leídos antes de llamar la función introduciría lecturas de DOM en la rama inválida que hoy no existen.
- **Identidad de pestaña basada en texto**: la conservación usa `materialLabel + '·' + indexEnMaterial`, comportamiento heredado que no se corrigió.
- **HTML anterior conservado en error**: el panel se oculta, pero su contenido no se vacía. Es comportamiento real preservado.
- **Dependencias privadas inyectadas**: `renderDiagrama`, `renderReporte` y `mostrarErroresProyecto` permanecen privadas en `main.js`; cambios futuros en sus contratos deben revisar estas llamadas.
- **Pruebas manuales pendientes**: los mocks prueban equivalencia de coordinación, pero no sustituyen la verificación visual real.

# 14. Reversión

La reversión es puramente de código y documentación:

1. Restaurar inline en `recalcular()` los dos bloques originales.
2. Eliminar la destructuración de `window.ProyCutProjectResults` en `main.js`.
3. Eliminar la carga de `src/scripts/project/apply-project-results.js` en `index.html`.
4. Eliminar `src/scripts/project/apply-project-results.js`.
5. Eliminar este reporte si también se revierte la documentación.

No hay migración de datos, cambios de esquema, cambios en `localStorage` ni nuevas propiedades de `state`. En un árbol con otros cambios sin commit, la reversión debe hacerse de forma dirigida para no eliminar desacoplamientos anteriores.
