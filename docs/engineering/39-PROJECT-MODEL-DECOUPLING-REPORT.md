# 39-PROJECT-MODEL-DECOUPLING-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-04

## Propósito
Registrar el tercer desacoplamiento arquitectónico de ProyCut: introducir un modelo temporal de proyecto (`construirModeloProyecto`, en `src/scripts/pieces/project-model.js`) que agrupa la lectura cruda de piezas ya hecha una sola vez por `recalcular()`, para que `validarProyecto()` y `leerPiezas()` dejen de leer `#piezasBody` cada una por su cuenta dentro del mismo ciclo — sin crear `state.piezas`, sin persistencia y sin cambiar ningún comportamiento observable.

## Depende de
`src/scripts/main.js`; `src/scripts/pieces/project-model.js`; `src/scripts/pieces/pieces-dom-reader.js`; `index.html`; `docs/engineering/36-ARCHITECTURAL-DECOUPLING-PLAN.md`; `docs/engineering/38-PIECES-DOM-READING-DECOUPLING-REPORT.md` (documenta las diferencias exactas entre `validarProyecto`/`leerPiezas`/`leerPiezasParaExportar`/`leerPiezasFormularioParaFormato` que este cambio respeta íntegramente)

## Referenciado por
PENDIENTE

---

# 1. Flujo anterior

Antes de este cambio, cada ciclo de `recalcular()` leía las filas de `#piezasBody` **dos veces**:

```text
recalcular()
  → validarProyecto()          → leerFilasPiezasDesdeDOM()   (lectura #1)
  → resolverParametrosCorteEtapa4()
  → leerPiezas(parametrosCorte) → leerFilasPiezasDesdeDOM()   (lectura #2)
                                 → obtenerCantidadProyectos()  (lectura adicional de #cantidadProyectos)
```

`validarProyecto()` y `leerPiezas()` ya compartían el mismo lector centralizado (`leerFilasPiezasDesdeDOM()`, del cambio anterior, reporte 38), pero cada una lo invocaba de forma independiente, recorriendo el DOM dos veces por cada recálculo aunque las filas no hubieran cambiado entre una llamada y otra dentro del mismo ciclo síncrono.

# 2. Análisis previo (sin modificar código)

1. **Datos crudos de `leerFilasPiezasDesdeDOM()`**: por fila, `{id, cantTexto, largoTexto, anchoTexto, girarModo, material, tapaTipo, l1, l2, a1, a2, labelTexto}` — todos como texto/boolean sin parsear (ver reporte 38, sección 4).
2. **Transformaciones actuales de las 4 funciones**: documentadas exhaustivamente en el reporte 38 (sección 2) — se reconfirmó que siguen vigentes sin cambios: `validarProyecto` valida strings (`validarCantidad`/`validarMedida`) y solo comprueba que `material` no esté vacío; `leerPiezas` parsea, expande por cantidad, normaliza giro y verifica ajuste al tablero; `leerPiezasParaExportar` parsea sin expandir y sin leer giro; `leerPiezasFormularioParaFormato` parsea con default `cant=1` y convierte cantos a `'SI'/'NO'`.
3. **Qué necesita `recalcular()`**: el resultado de `validarProyecto()` (para decidir si continuar), `parametrosCorte` (kerf/márgenes resueltos), y `{piezas, errores}` de `leerPiezas()` para agrupar por material y alimentar `empacarMaterial`.
4. **Qué necesita `calcularCostosProyecto()`**: `piezas` (la salida ya expandida de `leerPiezas`), `boards`, catálogos de `state`, y `cantidadProyectos` (obtenido de nuevo vía `obtenerCantidadProyectos()` en la llamada a `calcularCostosProyecto`, ya centralizado en el reporte 37) — no depende de las filas crudas directamente.
5. **Qué necesita el optimizador (`empacarMaterial`)**: recibe `piezas` ya expandidas y agrupadas por material — la salida final de `leerPiezas()`, no las filas crudas.
6. **Qué necesitan exportación Excel y "Exportar formato"**: `leerPiezasParaExportar()` y `leerPiezasFormularioParaFormato()` — ambas se ejecutan **fuera** del ciclo de `recalcular()` (botones de exportación independientes), no comparten el modelo temporal de un recálculo.
7. **Transformaciones comunes vs. separadas**: lo único genuinamente común entre `validarProyecto` y `leerPiezas` es el array crudo de filas — ninguna transformación de campo (parseo, expansión, normalización de giro, verificación de ajuste) es segura de unificar sin arriesgar el comportamiento de alguna de las dos (ver tabla comparativa del reporte 38, sección 2). Estas transformaciones **deben seguir separadas**.
8. **Dependencias por categoría**:
   - *Cantidad de proyectos*: usada por `leerPiezas` para expandir (`obtenerCantidadProyectos()`) y por `validarProyecto` para el límite agregado (`validarNumeroEntrada` sobre el mismo control, con su propio mensaje de error) — son dos lecturas del mismo control con **propósitos distintos** (una valida, la otra solo obtiene un número usable); no se unificaron.
   - *Materiales*: `leerPiezas` los lee de `state.materiales` (no del DOM), sin relación con la lectura de filas.
   - *Medidas de tablero*: resueltas por `medidaTableroDeMaterial`, sin relación con las filas crudas.
   - *Giro*: normalizado únicamente dentro de `leerPiezas`, a partir de `fila.girarModo` y el nivel de optimización.
   - *Tapacantos*: solo `leerPiezas` los usa (para incluirlos en cada pieza expandida); `validarProyecto` no los toca.
   - *Parámetros de corte*: resueltos por `resolverParametrosCorteEtapa4()`, ya centralizados en `hierarchical-config.js`, fuera del alcance de este cambio.
   - *Validación*: exclusiva de `validarProyecto`, sin relación con la expansión de `leerPiezas`.

**Conclusión del análisis: no hay bloqueo.** Puede crearse un modelo intermedio seguro si se limita estrictamente a las filas crudas (ya idénticas entre ambas funciones) más la cantidad de proyectos (una lectura adicional, de bajo riesgo, ya precedida por el mismo patrón que usa `parametrosCorte` en `recalcular()`). Cualquier intento de incluir piezas normalizadas o expandidas en el modelo habría requerido mover lógica de `leerPiezas` fuera de su función, sin beneficiar a `validarProyecto` (que necesita el texto crudo, no valores parseados) — por eso se descartó.

# 3. Modelo creado

`construirModeloProyecto({filasPiezas, cantidadProyectos})` en `src/scripts/pieces/project-model.js`, expuesto como `window.ProyCutProjectModel = { construirModeloProyecto }`. No lee `document`, `state` ni `localStorage`; no muta sus entradas; no valida, no expande, no calcula costos, no optimiza, no renderiza. Es un objeto plano, construido y descartado dentro de cada llamada a `recalcular()` — nunca se guarda en `state` ni en `localStorage`.

# 4. Contrato de entrada

```js
construirModeloProyecto({
  filasPiezas,       // array crudo devuelto por leerFilasPiezasDesdeDOM(), leido UNA VEZ por recalcular()
  cantidadProyectos  // numero ya resuelto por obtenerCantidadProyectos(), leido UNA VEZ por recalcular()
})
```

# 5. Contrato de salida

```js
{
  filas: filasPiezas,             // mismo array, mismo orden, sin copiar ni transformar
  cantidadProyectos: cantidadProyectos
}
```

Deliberadamente **no incluye**: piezas normalizadas, piezas expandidas, resultado de validación, metadatos de material, ni configuración de corte resuelta — ninguno de esos datos es seguro de compartir sin duplicar o arriesgar alguna de las transformaciones ya documentadas como distintas en el reporte 38.

# 6. Funciones migradas

- **`validarProyecto(modeloProyecto)`**: ahora acepta un parámetro opcional. Usa `modeloProyecto.filas` si se le pasa un modelo; si no (llamada aislada, sin argumento), sigue llamando `leerFilasPiezasDesdeDOM()` internamente, exactamente como antes. El resto de la función (validación de materiales/tapacantos/componentes/componentes del proyecto, límites) no cambió.
- **`leerPiezas(parametrosCorteProyecto, modeloProyecto)`**: se agregó un segundo parámetro opcional. Usa `modeloProyecto.filas` y `modeloProyecto.cantidadProyectos` si se le pasa un modelo; si no, sigue llamando `leerFilasPiezasDesdeDOM()` y `obtenerCantidadProyectos()` internamente, exactamente como antes.
- **`recalcular()`**: al inicio, lee las filas una sola vez (`leerFilasPiezasDesdeDOM()`) y la cantidad de proyectos una sola vez (`obtenerCantidadProyectos()`), construye el modelo con `construirModeloProyecto(...)`, y lo pasa a `validarProyecto(modeloProyecto)` y a `leerPiezas(parametrosCorte, modeloProyecto)`. El resto de `recalcular()` (lectura de kerf/precio de corte/modo, agrupación por material, llamada al optimizador, cálculo de costos, render del diagrama y del reporte) no cambió.

# 7. Funciones no migradas y motivo

- **`leerPiezasParaExportar()`** y **`leerPiezasFormularioParaFormato()`**: siguen llamando `leerFilasPiezasDesdeDOM()` directamente, sin modelo. Motivo: se ejecutan fuera del ciclo de `recalcular()` (botones "Exportar" y "Exportar formato", en respuesta a un clic independiente), por lo que no existe una lectura previa del mismo ciclo que puedan reutilizar — construir un modelo para una sola lectura no aportaría nada y ampliaría el cambio hacia exportación, explícitamente fuera del alcance recomendado para esta tarea.
- **`aplicarPiezasPendientes()`**: sigue llamando `leerFilasPiezasDesdeDOM()` directamente (para sumar la cantidad ya existente antes de una importación). Motivo: se ejecuta durante la confirmación de una importación, un flujo completamente distinto al de `recalcular()`, sin relación con el modelo de este cambio.
- **`obtenerCantidadProyectos()` dentro de la llamada a `calcularCostosProyecto`** (dentro de `recalcular()`, ya centralizada en el reporte 37): se dejó sin tocar deliberadamente. Aunque en teoría podría reutilizar `modeloProyecto.cantidadProyectos` (el valor sería idéntico, ya que nada muta `#cantidadProyectos` durante la ejecución síncrona de `recalcular()`), tocar esa línea significa editar un punto de integración de `calcularCostosProyecto` fuera del objetivo único de este cambio (que es específicamente el modelo de lectura de piezas para `validarProyecto`/`leerPiezas`) — se documenta como una duplicación de lectura conocida y aceptada, no corregida en esta tarea.

# 8. Comportamiento preservado

- Mensajes de validación: idénticos, verificados palabra por palabra en las pruebas automáticas.
- Orden de validaciones dentro de `validarProyecto`: sin cambios (el fragmento de piezas sigue siendo el último bloque).
- Defaults, modos de giro, expansión por cantidad, numeración (`num`), tratamiento de material/tapacanto, de vacíos y de valores inválidos: todos preservados porque el código de transformación de `validarProyecto` y `leerPiezas` no cambió — solo cambió **de dónde** obtienen el array de filas.
- Estructura de exportación: sin cambios (funciones no migradas, sección 7).
- Piezas que no caben: el mensaje de error y la condición de ajuste al tablero no cambiaron.
- `leerPiezas()` y `validarProyecto()` siguen siendo llamables sin modelo (compatibilidad hacia atrás), reproduciendo el comportamiento exacto de antes de este cambio.
- No se creó `state.piezas`; el modelo no se guarda en ningún lado, se construye y se descarta dentro de `recalcular()`.
- No se agregaron event listeners.
- No se tocó `addPiezaRow`, importación, exportación (salvo cero cambios reales, solo confirmación de que no se tocaron), `calcularCostosProyecto`, el optimizador, ni los reportes.

# 9. Comparación contra el original

Se reprodujo el cuerpo **verbatim** de `validarProyecto` (fragmento de piezas) y `leerPiezas` tal como existían **antes de este cambio** (sin `modeloProyecto`, leyendo el DOM directamente en cada llamada) como copias de control, y se comparó su salida contra el código **actual** de `main.js` (con `modeloProyecto`), verificado además con lectura directa del archivo tras el cambio.

# 10. Pruebas automáticas

Entorno: Node, sin dependencias nuevas — mismo DOM simulado del reporte 38, más los módulos reales (`limits.js`, `validation.js`, `basic-geometry.js`, `hierarchical-config.js`, `pieces-dom-reader.js`, `project-model.js`) cargados con `vm.runInThisContext`.

**17 escenarios** (los exigidos): cero filas, una pieza válida, varias piezas, cantidad mayor a uno, varios proyectos, giro auto, giro normal, giro rotado, material faltante, tapacanto faltante, medidas inválidas, pieza que no cabe, varios materiales, kerf y márgenes, orden de filas invertido, valores decimales, valores vacíos.

Para cada escenario se verificó:
1. `validarProyecto` (fragmento de piezas): control (sin modelo) vs. nuevo (con modelo) — `errores` y `totalPorProyecto` exactamente iguales.
2. `leerPiezas`: control (sin modelo) vs. nuevo (con modelo) — `{piezas, errores}` completo, `deepStrictEqual`.
3. `leerPiezas` **sin** modelo (compatibilidad hacia atrás): confirma que sigue produciendo el mismo resultado que la copia de control, para garantizar que la firma ampliada no rompe ninguna llamada futura sin modelo.
4. Cantidad de piezas expandidas, numeración, medidas, giro, material y tapacanto: comparados campo a campo entre la salida nueva y la de control.
5. Entrada final al optimizador: se agrupó `piezas` por material (la misma operación que hace `recalcular()` antes de llamar `empacarMaterial`) y se comparó el resultado exacto entre ambos flujos.
6. No mutación: de las filas crudas de entrada, del catálogo de materiales, y de `modelo.filas` (verificado que ni `validarProyecto` ni `leerPiezas` lo alteran).

**Resultado: 136/136 verificaciones OK** (17 escenarios × 8 verificaciones cada uno).

Verificaciones estructurales adicionales:
- `node --check` sin errores en `project-model.js` y en `main.js`.
- Grep de `document.`/`state.`/`localStorage` en `project-model.js`: ninguna referencia real (solo aparece la palabra "state" dentro de un comentario).
- Grep de mutaciones (`.value =`, `.checked =`, `.dataset.x =`, `push`, `splice`, `createElement`) en `project-model.js`: ninguna coincidencia.
- `leerFilasPiezasDesdeDOM()` se ejecuta exactamente **una vez** por ciclo de `recalcular()` (confirmado por grep de todas las llamadas restantes en `main.js`: la de `recalcular()`, más los `fallback ||` internos de `validarProyecto`/`leerPiezas` que solo se activan si se llaman sin modelo, más las de `leerPiezasParaExportar`/`leerPiezasFormularioParaFormato`/`aplicarPiezasPendientes`, todas fuera del ciclo de `recalcular()`).
- Servidor estático local + `curl` independientes: `index.html` → 200, `src/scripts/pieces/project-model.js` → 200, `src/scripts/main.js` → 200.
- `index.html`: `project-model.js` carga después de `pieces-dom-reader.js` y antes de `main.js`, sin reordenar ningún otro script.
- `git status --short` confirma que no hay cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/pieces/project-model.js` y este reporte.

# 11. Pruebas manuales pendientes (no ejecutadas, no aprobadas)

- Agregar pieza.
- Editar pieza.
- Eliminar pieza.
- Cambiar cantidad.
- Cambiar "Cantidad de proyectos" (varios proyectos).
- Cambiar los tres modos de giro.
- Cambiar tapacantos.
- Cambiar materiales.
- Capturar una pieza inválida (medida o cantidad).
- Capturar una pieza que no cabe en el tablero.
- Ejecutar la optimización.
- Comprobar el reporte de costos.
- Comprobar el diagrama.
- Exportar a Excel.
- Exportar a DXF.
- Importar CSV.
- Importar Excel.
- Revisar la consola del navegador durante todo el flujo anterior.

# 12. Riesgos

- **Riesgo bajo, firma ampliada**: `validarProyecto` y `leerPiezas` ahora aceptan un parámetro adicional opcional. Como cada una tiene un único punto de llamada real (`recalcular()`), y el parámetro es opcional con fallback idéntico al comportamiento previo, el riesgo de romper algún otro llamador es mínimo — confirmado además por la prueba explícita de "compatibilidad hacia atrás" (sección 10, punto 3).
- **Riesgo bajo, duplicación restante documentada**: `cantidadProyectos` se sigue leyendo una tercera vez dentro de la llamada a `calcularCostosProyecto` (sección 7) — deliberadamente no tocado para no mezclar esta tarea con el subsistema de costos. Si en el futuro se optimiza esa lectura también, deberá hacerse como un cambio propio, no como parte de este.
- **Sin riesgo de comportamiento**: las 136 verificaciones automatizadas cubren exactamente las mismas fórmulas, validaciones, defaults y mensajes que existían antes del cambio, incluyendo el caso explícito de llamar las funciones sin modelo.

# 13. Reversión

Cambio contenido en 3 archivos, sin combinarse con ninguna otra modificación:

1. `git checkout -- src/scripts/main.js index.html` (o revertir el commit una vez creado).
2. `rm -f src/scripts/pieces/project-model.js`.

No hay migración de datos ni cambios en `localStorage` — la reversión es puramente de código.
