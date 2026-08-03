# 36-ARCHITECTURAL-DECOUPLING-PLAN.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-03

## Propósito
Definir una estrategia incremental para reducir el acoplamiento real entre DOM, `state`, piezas, catálogos, optimización, costos, diagramas, reportes, importación, exportación y `recalcular()` en ProyCut, transformando el prototipo actual en una arquitectura mantenible sin reescribirlo por completo y sin perder funcionalidad.

## Depende de
`docs/engineering/00-SYSTEM-UNDERSTANDING.md`; `docs/engineering/05-ARCHITECTURE.md`; `docs/engineering/10-CURRENT-STATE.md`; `docs/engineering/12-MANUAL-TESTS.md`; `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md`; `docs/engineering/35-MODULARIZATION-ROADMAP-UPDATE.md`; todos los reportes de extracción (13-34); `src/scripts/main.js`; todos los módulos en `src/scripts/`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Nota metodológica

Este documento es de planificación arquitectónica, no de extracción mecánica. No se modificó ningún archivo del proyecto salvo la creación de este documento. A diferencia de los reportes 13-34 (que identificaban y movían funciones puras), aquí el objeto de análisis es el **acoplamiento real** entre datos y responsabilidades — DOM, `state`, y los coordinadores que los conectan — que ninguna extracción mecánica anterior ha reducido ni podía reducir, porque esas extracciones deliberadamente dejaron intactos todos los coordinadores (`recalcular`, `validarProyecto`, `leerPiezas`, `renderDiagrama`, `construirLibroExcel`, `exportarExcel`, el optimizador). Todo lo que sigue está basado en lectura directa del código actual (`src/scripts/main.js`, 5767 líneas) y en los 20 reportes de extracción ya completados.

---

# 1. Estado arquitectónico actual

**Responsabilidades que siguen dentro de `main.js`** (ver inventario completo en `docs/engineering/35-MODULARIZATION-ROADMAP-UPDATE.md`, sección 2): identidad y SKU de catálogos, renderizado y edición de los 3 catálogos, componentes del proyecto, interfaz general y menús, exportación/importación de formato de proyecto (piezas y catálogo), vista previa y aplicación atómica de importación, personalización visual, combobox buscable, creación de catálogo desde buscador, selector de cantos, filas de piezas, validación de proyecto, lectura de piezas, optimización/empaquetado, reconstrucción de sobrantes/fronteras, edición manual del diagrama, render/interacción de pantalla, reporte de costos, `recalcular()`, ajustes menores de interfaz, carga diferida de librerías, coordinadores de exportación DXF y Excel, y redimensionamiento de columnas.

**Qué datos viven en `state`** (objeto único, declarado línea 103-112, sin `Object.freeze`, mutado por referencia desde decenas de puntos distintos):
```js
const state = {
  materiales: [...],
  tapacantos: [...],
  componentes: [...],
  componentesProyecto: [],
  boards: [],
  activeTab: 0,
  ultimoTotal: 0,
  ultimoReporte: null
};
```

**Qué datos viven únicamente en el DOM** (no tienen ninguna representación en `state`):
- **Las piezas del proyecto**: existen solo como filas `<tr>` en `#piezasBody`, con sus valores en `.value`/`.checked`/`dataset.valor` de cada input. No hay `state.piezas` en ningún punto del código.
- **Los parámetros de corte activos** (kerf, márgenes exteriores): se leen en vivo de los inputs del panel "Ajustes de parámetros de corte" en cada llamada a `resolverParametrosCorteEtapa4()` (que a su vez llama a `crearConfiguracionProyectoCorteActual()`, dentro de `hierarchical-config.js`).
- **Las preferencias visuales** (`estilo`): viven en `localStorage` bajo la clave `ESTILO_KEY`, leídas/escritas exclusivamente a través de `leerEstilo()`/`guardarEstilo()`/`cargarEstiloGuardado()`; nunca se copian a `state`.
- **Otros valores de formulario leídos en cada `recalcular()`**: `precioCorte`, `precioCorteMetro`, `modoPrecioCorte`, `libre` (guillotina), `nivelOptimizacion`, `plantillaReporte`, `disenoTotal`, `redondearTapacanto` — todos leídos directamente de `document.getElementById(...)` dentro de `recalcular()`, sin pasar por `state`.

**Qué variables viven en el cierre de la IIFE** (closure de módulo, ni en `state` ni en el DOM):
`BOARD_W`, `BOARD_H` (mutadas dentro del bucle de `recalcular()`, una vez por cada material, como valor de trabajo temporal), `pieceCounter` (consecutivo de `id` de fila de pieza), `consecutivosSkuCatalogo`/`consecutivoIdInternoCatalogo` (identidad de catálogo), `importacionPendiente2DB` (lote de importación en espera de confirmación), `ESTILO_KEY`, `comboActivo`, `crearPendiente`, `debounceTimer`, `resizeTimer`, `promesaExcelJS` (en `excel-diagrams.js`)/`promesaJSZip` (en `main.js`).

**Coordinadores que siguen centralizados** (funciones que orquestan varios subsistemas a la vez, todas sin extraer, todas explícitamente protegidas en cada tarea de extracción anterior): `recalcular()`, `validarProyecto()`, `leerPiezas()`, `renderDiagrama()`/`activarPiezasArrastrables()`, `construirLibroExcel()`, `exportarExcel()`, `exportarDXFZip()`, `aplicarPiezasPendientes()`/`construirAplicacionAtomicaComponentes()`/`construirAplicacionAtomicaMateriales()`.

**Módulos ya correctamente aislados** (15, ver tabla completa en el reporte 35, sección 1): utilidades de formato, validación, límites, normalización de texto, CSV, geometría básica, rectángulos libres, configuración jerárquica, área/kerf de tablero, análisis de sobrantes y fronteras, generador SVG del tablero, generación DXF, utilidades y pipeline de imágenes de Excel. Todos son funciones puras o casi puras, sin acceso a `document`/`state`, con dependencias explícitas entre sí.

# 2. Problema principal de arquitectura

El problema estructural central **no es el tamaño de `main.js`** (ya reducido 17.3% por extracción mecánica) — es que **el prototipo nunca tuvo un modelo de datos intermedio entre la captura del usuario y el cálculo**. El DOM hace doble función: es a la vez la interfaz visual y el almacén de datos de las piezas. Esto se manifiesta en cuatro síntomas concretos, verificables en el código real:

1. **Piezas almacenadas en filas del DOM**: `leerPiezas()` (línea 3387) y `validarProyecto()` (línea 3285) hacen `document.querySelectorAll('#piezasBody tr')` y leen cada campo con `tr.querySelector('.p-cant').value`, etc. — dos funciones distintas, cada una re-implementando su propia lectura del mismo DOM, con sus propias reglas de conversión (`parseInt`/`parseFloat`, valores por defecto). No existe una única función "leer piezas" reutilizada; existen (al menos) tres lecturas independientes del mismo DOM: `validarProyecto()`, `leerPiezas()`, y `leerPiezasParaExportar()` (línea 5052, para el Excel de "Piezas y diagramas"), cada una con su propio subconjunto de campos y su propia tolerancia a valores inválidos.
2. **`state` incompleto por diseño**: `state` modela los catálogos y el resultado (`boards`, `ultimoReporte`), pero no modela ni la entrada (piezas, parámetros de corte) ni las preferencias (estilo). Esto significa que **no existe ningún objeto único que represente "el proyecto actual"** — reconstruirlo exige leer `state` + el DOM de piezas + el DOM de parámetros de corte + `localStorage`, en ese orden, y solo `recalcular()` sabe hacerlo completo.
3. **`recalcular()` como coordinador único y obligatorio**: es la única función que sabe ensamblar piezas + parámetros + catálogos en un resultado (`state.boards` + `state.ultimoReporte`). Cualquier cambio de dato (agregar una pieza, cambiar un precio, cambiar el kerf) dispara, vía `recalcularDebounced()`, una reconstrucción **completa** desde cero — no hay forma de recalcular solo el costo, o solo el diagrama, sin repetir todo el pipeline.
4. **`state.boards` modificado por dos caminos independientes y no sincronizados**: `recalcular()` reconstruye `state.boards` desde cero (reasigna el arreglo completo, línea 4703); pero la edición manual (`rotarPieza`, `espejarBoard`, `compactarHacia*`, y el arrastre en `activarPiezasArrastrables`) **muta los objetos `board` existentes en el sitio**, sin pasar por `recalcular()`. Ambos caminos dejan `state.boards` en un estado "visualmente válido", pero solo uno de ellos (el de `recalcular()`) también actualiza `state.ultimoReporte`/`state.ultimoTotal` — es decir, **un reacomodo manual nunca actualiza el costo mostrado**, y ya se documentó en los reportes de análisis DXF/Excel que **exportar sí dispara `recalcular()` primero**, lo que descarta cualquier edición manual antes de generar el archivo.

Estos cuatro puntos son la misma causa raíz vista desde cuatro ángulos: **no hay una fuente de verdad completa del proyecto**, así que cada subsistema (validación, lectura, edición manual, exportación) tiene que decidir, cada uno por su cuenta, de dónde sacar los datos y cuándo se consideran "actuales". La UI y las reglas de negocio están mezcladas en las mismas funciones (`recalcular()`, `validarProyecto()`, `leerPiezas()`) porque no hay ninguna capa intermedia que las separe.

# 3. Flujo actual de datos

```
Usuario captura/edita una fila de pieza
  → DOM (#piezasBody, vía addPiezaRow/renumerarFilas/attachEnterNavegable)
  → evento input/change → recalcularDebounced() → setTimeout(recalcular, 200)
  → recalcular()
      → validarProyecto()          [lee TODO el DOM del formulario, incl. piezas]
      → resolverParametrosCorteEtapa4()   [lee kerf/márgenes del DOM, vía hierarchical-config.js]
      → lee precioCorte, precioCorteMetro, modoPrecioCorte, libre, nivelOptimizacion  [DOM directo]
      → leerPiezas(parametrosCorte)       [lee de nuevo el DOM de piezas, con sus propias reglas]
      → agrupa piezas por material (lógica de negocio inline, dentro de recalcular)
      → por cada material:
          medidaTableroDeMaterial() → calcularRectanguloUtilTablero() → obtenerKerfMaterial()
          → calcularRectanguloColocacion() → empacarMaterial() → compactarHaciaAbajo() → contarCortes()
      → state.boards = boardsAll         [ESCRITURA DE STATE #1]
      → state.activeTab = ...            [ESCRITURA DE STATE #2]
      → renderDiagrama()                 [lee state.boards, escribe DOM del diagrama]
      → calcula costos de material, componentes, corte, tapacanto (lógica de negocio inline)
      → renderReporte() → document...innerHTML  [escribe DOM del reporte]
      → state.ultimoTotal = total        [ESCRITURA DE STATE #3]
      → state.ultimoReporte = datosReporte  [ESCRITURA DE STATE #4]
  → return true/false
```

**Camino paralelo — edición manual** (no pasa por `recalcular()`):
```
Usuario arrastra/rota/espeja/compacta una pieza
  → activarPiezasArrastrables() / listener del menú "Espejo"
  → rotarPieza() / espejarBoard() / compactarHacia*()   [mutan board.pieces in-place]
  → recalcularFreeRectsDesdeCero(board)                  [muta board.freeRects/fronterasKerf]
  → renderDiagrama()                                     [redibuja, NO recalcula costos]
```

**Camino paralelo — exportación** (dispara `recalcular()` de nuevo, como guardia, antes de exportar):
```
Usuario hace clic en "Exportar" / "Exportar DXF"
  → exportarExcel() / exportarDXFZip()
  → recalcular()  [reconstruye state.boards desde cero — descarta edición manual previa]
  → si recalcular() retorna false: alerta, aborta
  → toma una instantánea de state (solo exportarExcel, vía copiarDatosParaExcel)
  → construye el archivo (construirLibroExcel / construirDXFTablero por tablero)
  → descarga
```

**Camino paralelo — importación** (escribe `state` en bloque, "todo o nada"):
```
Usuario selecciona un archivo CSV/Excel
  → parsearCSV() / extraerProyectoDesdeLibroExcel() / extraerCatalogoDesdeLibroExcel()
  → prepararVistaPreviaMateriales() / prepararVistaPreviaComponentes()  [calcula decisiones, sin tocar state]
  → usuario confirma → construirAplicacionAtomicaMateriales/Componentes()  [arma el plan]
  → aplicarPiezasPendientes()  [agrega filas al DOM vía agregarPiezaDesdeColumnas]
  → state.materiales = ... / state.componentes = ... / state.componentesProyecto = ...  [reasignación en bloque]
  → recalcular()
```

# 4. Fuentes de verdad actuales

| Dato | Fuente de verdad hoy | ¿Múltiples fuentes / sincronización implícita? |
|---|---|---|
| **Piezas** | **DOM** (`#piezasBody`, una fila por pieza) | Sí — 3 lectores independientes (`validarProyecto`, `leerPiezas`, `leerPiezasParaExportar`), cada uno con su propio subconjunto de campos y reglas de conversión. No hay reconciliación entre ellos; cada uno confía en volver a leer el DOM correctamente. |
| **Materiales** | `state.materiales` | Único, pero editado desde 3 caminos distintos (edición inline en la tabla, alta manual "+ Agregar material", aplicación atómica de importación) — todos escriben el mismo array, sin conflicto real, pero sin ninguna función central de "escribir material". |
| **Tapacantos** | `state.tapacantos` | Único, mismo patrón que materiales (2 caminos: edición inline, alta manual). |
| **Componentes (catálogo)** | `state.componentes` | Único, mismo patrón (3 caminos: edición inline, alta manual, aplicación atómica de importación). |
| **Componentes del proyecto** | `state.componentesProyecto` | Único, pero la cantidad de cada uno se edita in-place (`state.componentesProyecto[i].cantidad = ...`) y también se reemplaza en bloque durante la aplicación atómica de importación (`state.componentesProyecto = aplicacion.proyecto`) — dos formas de escribir el mismo array. |
| **Parámetros de corte (kerf, márgenes)** | **DOM** (panel "Ajustes de parámetros de corte"), leído en vivo por `resolverParametrosCorteEtapa4()` en cada llamada | No hay copia en `state`; se relee del DOM cada vez que se necesita (dentro de `validarProyecto`, `leerPiezas`, `recalcular`) — no hay riesgo de divergencia porque nunca se copia, pero tampoco hay ningún punto único donde "el kerf actual del proyecto" viva como dato, solo como lectura repetida. |
| **Preferencias visuales (`estilo`)** | **`localStorage`** (`ESTILO_KEY`), reflejado también en los controles del panel "Ajuste de la interfaz" | El DOM de los controles y `localStorage` son, en la práctica, dos copias sincronizadas manualmente: `leerEstilo()` lee el DOM y lo persiste a `localStorage` en cada llamada; `cargarEstiloGuardado()` hace el camino inverso al arrancar. `state` no participa en absoluto. |
| **`boards` (resultado del optimizador)** | `state.boards` | Sí, doble camino ya documentado en la sección 2: reconstrucción completa (`recalcular`) vs. mutación in-place (edición manual) — ambos escriben el mismo array/objetos, sin que ninguno sepa del otro. |
| **Reporte de costos** | `state.ultimoReporte`/`state.ultimoTotal` | Único, pero **solo se actualiza dentro de `recalcular()`** — la edición manual no lo toca, así que puede quedar desactualizado respecto al acomodo visual actual (aunque el costo de materiales no cambia con el acomodo, el conteo de cortes sí podría, dependiendo del camino de corte real que no se recalcula tras editar manualmente). |
| **Costos individuales** (material, componentes, corte, tapacanto) | Calculados inline dentro de `recalcular()`, **no persistidos por separado** — solo el total y el desglose completo (`datosReporte`) se guardan en `state.ultimoReporte` | No hay una fuente de verdad de "costo de materiales" independiente del reporte completo; cualquier consumidor que quisiera solo ese subtotal tendría que leer `state.ultimoReporte.matSubtotal`. |

**Conclusión de esta sección**: la única fuente de verdad genuinamente ambigua o duplicada es **piezas** (DOM, con 3 lectores independientes) y, en menor medida, **`state.boards`** (dos escritores independientes que no se coordinan entre sí). El resto de los datos tiene una fuente de verdad clara, aunque distribuida entre `state`, DOM y `localStorage` sin ningún punto central que los una.

# 5. Acoplamientos críticos

| Patrón | Ejemplos reales | Riesgo |
|---|---|---|
| **Funciones que leen directamente del DOM para reconstruir datos de negocio** | `validarProyecto()`, `leerPiezas()`, `leerPiezasParaExportar()`, `resolverParametrosCorteEtapa4()` (vía `hierarchical-config.js`) | **Alto** — cada una repite su propia lectura/parseo del mismo DOM; un cambio de estructura del formulario (renombrar una clase CSS, por ejemplo) rompería 3-4 funciones a la vez, en silencio, sin ningún punto central que avisara. |
| **Funciones que escriben directamente en `state`** | Las 27 escrituras identificadas en la sección 1 (edición de catálogos, `recalcular()`, aplicación atómica de importación, cambio de pestaña) | **Medio-Alto** — no hay ningún setter centralizado; cualquier función con acceso al cierre de la IIFE puede escribir `state` directamente, sin validación ni notificación a otros consumidores. |
| **Funciones que modifican DOM y lógica de negocio a la vez** | `recalcular()` (valida, optimiza, calcula costos, Y escribe `innerHTML` del reporte/diagrama, Y oculta/muestra paneles), `aplicarPiezasPendientes()` (aplica datos Y crea filas del DOM vía `agregarPiezaDesdeColumnas`), `guardarSkuCatalogoDesdeTabla()` (valida Y actualiza el DOM del catálogo) | **Crítico** en el caso de `recalcular()` — es imposible probar o reutilizar la lógica de costeo sin también ejecutar sus efectos secundarios sobre el DOM. |
| **Funciones que llaman `recalcular()` (directa o indirectamente vía `recalcularDebounced`)** | ~20 listeners de eventos repartidos por todo el archivo (edición de piezas, cambio de kerf, cambio de catálogo, cambio de estilo, importación confirmada, redimensionar ventana) + `exportarDXFZip`/`exportarExcel` (llamada directa, síncrona, como guardia) | **Alto** — `recalcular()` es, de facto, un punto de entrada global sin contrato explícito: cualquier función puede dispararlo, pero solo dos (`exportarExcel`/`exportarDXFZip`) dependen de su valor de retorno para decidir si continuar. |
| **Funciones que dependen de IDs concretos del DOM** | Prácticamente todo el archivo — decenas de `document.getElementById('...')` con literales de string repetidos (`'piezasBody'`, `'boardSvgWrap'`, `'resultadoPanel'`, `'reportePanel'`, etc.), sin ninguna constante centralizada de IDs | **Medio** — funcional hoy, pero cualquier refactor de `index.html` (renombrar un ID) rompería silenciosamente la función que lo usa, sin ningún error en tiempo de carga. |
| **Funciones que dependen del orden de inicialización** | `activarPiezasArrastrables()` depende de que `dibujarBoard()` ya haya escrito `board._geom` (mismo ciclo síncrono de `renderDiagrama()`); el bloque de destructuración de 15 módulos al inicio de la IIFE depende de que los 15 `<script>` de `index.html` ya se hayan ejecutado, en ese orden exacto | **Medio** — ya mitigado por la disciplina de "un `<script>` por módulo, en orden, antes de `main.js`" seguida en las 15 extracciones anteriores, pero sigue siendo un acoplamiento implícito, no verificado por ninguna herramienta. |

# 6. `recalcular()` — análisis del coordinador

**Entradas reales** (todas leídas dentro de la función, ninguna recibida como parámetro — `recalcular()` no tiene parámetros):
- DOM del formulario completo (piezas, catálogos, parámetros de corte, plantilla de reporte, diseño de total) — vía `validarProyecto()`, `resolverParametrosCorteEtapa4()`, `leerPiezas()`, y lecturas directas de `precioCorte`/`precioCorteMetro`/`modoPrecioCorte`/`libre`/`nivelOptimizacion`/`plantillaReporte`/`disenoTotal`/`redondearTapacanto`.
- `state.materiales`, `state.tapacantos`, `state.componentes`, `state.componentesProyecto` (lectura).
- `state.boards`, `state.activeTab` (lectura, para preservar la pestaña activa).

**Dependencias** (funciones/módulos llamados, en orden de aparición): `validarProyecto`, `mostrarErroresProyecto`, `resolverParametrosCorteEtapa4` (hierarchical-config.js), `obtenerNivelOptimizacion`, `leerPiezas`, `medidaTableroDeMaterial`, `calcularRectanguloUtilTablero` (basic-geometry.js), `obtenerKerfMaterial` (board-area.js), `calcularRectanguloColocacion` (basic-geometry.js), `empacarMaterial`, `compactarHaciaAbajo`, `contarCortes` (board-analysis.js), `renderDiagrama`, `obtenerCantidadProyectos`, `normalizarMetrosLinealesParaPresentacion` (format.js), `fmt`/`fmtMoney` (format.js), `renderReporte`.

**Datos modificados**: `state.boards`, `state.activeTab`, `state.ultimoTotal`, `state.ultimoReporte` (las 4 propiedades de `state` relacionadas con el resultado); además, **muta las variables de cierre `BOARD_W`/`BOARD_H`** como valor de trabajo temporal dentro del bucle de empaquetado (efecto secundario no documentado como tal en ningún comentario, pero real).

**DOM modificado**: `#avisos` (vía `mostrarErroresProyecto`), `#resultadoPanel`/`#reportePanel` (`style.display`), `#reporteContenido` (`innerHTML`), y todo el DOM que `renderDiagrama()` reescribe (`#boardTabs`, `#boardSvgWrap`, `#sobrantesBox`).

**Resultados generados**: `boolean` (`true`/`false`, indicando éxito), más los efectos secundarios sobre `state` y el DOM ya descritos — no retorna ningún dato estructurado utilizable por un llamador que quisiera, por ejemplo, solo el costo sin renderizar nada.

**Efectos secundarios**: renderizado completo del diagrama, renderizado completo del reporte, ocultamiento/muestra de paneles — todos disparados incondicionalmente cada vez que se llama, sin forma de pedir "solo valida" o "solo calcula costos".

**Responsabilidades mezcladas** (evidencia directa del código, no interpretación): validación de formulario + lectura de configuración + lectura de piezas + agrupación por material + orquestación del optimizador + compactación automática + conteo de cortes + gestión de la pestaña activa + disparo de renderizado del diagrama + cálculo de 4 tipos de costo distintos (material, componentes, corte, tapacanto) + validación numérica del resultado + construcción del objeto de reporte + disparo de renderizado del reporte + persistencia en `state`. **Catorce responsabilidades distintas en una sola función de 249 líneas.**

## Descomposición conceptual propuesta (sin modificar código todavía)

El propio código ya sugiere las costuras naturales, marcadas por sus propios comentarios (`// ---- costos: material ----`, `// ---- costos: componentes del proyecto ----`, etc.) y por los dos primeros `return false` tempranos, que son, de hecho, tres etapas de validación distintas ya separadas visualmente:

1. **Validar formulario** — `validarProyecto()` + `resolverParametrosCorteEtapa4()`. Ya son funciones separadas; hoy solo están secuenciadas manualmente dentro de `recalcular()`.
2. **Capturar parámetros de corte y opciones del proyecto** — la lectura directa de `precioCorte`/`modoPrecioCorte`/`libre`/`nivelOptimizacion` (hoy dispersa entre líneas 4622-4627), que conceptualmente pertenece al mismo paso que `resolverParametrosCorteEtapa4()`.
3. **Leer piezas** — `leerPiezas(parametrosCorte)`, ya aislada, pero su resultado (`{piezas, errores}`) se usa inmediatamente para una tercera validación temprana (`piezas.length === 0`).
4. **Construir el modelo de tableros por material** — el bucle `Object.keys(porMaterial).forEach(...)` (líneas 4647-4698) es, en sí mismo, una unidad conceptual completa: agrupa, calcula áreas, empaca, compacta, cuenta cortes. Es la etapa más "de dominio puro" de toda la función (no toca DOM, solo `state` al final).
5. **Actualizar el estado de tableros** — la reasignación de `state.boards`/`state.activeTab` con preservación de pestaña (líneas 4699-4709), un algoritmo pequeño y autocontenido que hoy vive mezclado con el paso anterior.
6. **Renderizar el diagrama** — `renderDiagrama()`, ya aislado, pero llamado en medio de la función (línea 4711), no al final.
7. **Calcular costos** — los 4 bloques de costo (material, componentes, corte, tapacanto) más la validación numérica del total (líneas 4713-4822): esta es la etapa de negocio más claramente aislable, porque **no toca DOM en absoluto** salvo por 2 lecturas puntuales (`redondearTapacanto` del checkbox, y el propio `precioCorte`/`precioCorteMetro` ya leídos en el paso 2).
8. **Construir y renderizar el reporte, y persistir el resultado** — construcción de `datosReporte`, lectura de `plantillaReporte`/`disenoTotal`, `renderReporte()`, escritura de `state.ultimoTotal`/`state.ultimoReporte` (líneas 4823-4848).

Esta descomposición en 8 etapas (que podría consolidarse conceptualmente en las 7 sugeridas por la tarea — capturar entrada, validar, construir modelo, optimizar, calcular costos, actualizar estado, renderizar — fusionando los pasos 1-3 en "capturar y validar entrada") **no implica necesariamente 8 funciones nuevas**: el valor real está en identificar que los pasos 4 y 7 (construir modelo de tableros, calcular costos) son los únicos que podrían aislarse **sin tocar DOM en absoluto**, si recibieran sus datos por parámetro en vez de leerlos ellos mismos. Esa es la costura de mayor valor arquitectónico de toda la función.

# 7. Modelo de piezas — viabilidad de `state.piezas`

**Estructura mínima necesaria**, derivada exactamente de lo que ya leen `leerPiezas()`/`validarProyecto()`/`leerPiezasParaExportar()` del DOM hoy (sin inventar campos nuevos):
```js
{
  id,            // dataset.id de la fila, hoy generado por pieceCounter
  label,         // .p-label
  cantidad,      // .p-cant
  largo,         // .p-l
  ancho,         // .p-a
  girarModo,     // dataset.modo del toggle de girar ('auto'|'normal'|'rotado')
  material,      // dataset.valor del combobox de material
  tapaTipo,      // dataset.valor del combobox de tapacanto
  l1, l2, a1, a2 // .p-l1/.p-l2/.p-a1/.p-a2 (booleanos)
}
```

**Cómo se sincronizaría con el DOM**: el DOM seguiría siendo necesario para la interacción (arrastrar el foco entre celdas, mostrar el combobox flotante, el selector visual de cantos) — no se propone eliminar las filas visuales, sino dejar de usarlas como **fuente de datos**. Cada evento de edición de un campo (`input`/`change` ya existentes) actualizaría tanto el DOM (para que se vea el cambio) como `state.piezas[i]` (para que sea la fuente de verdad), en la misma línea de código que hoy solo dispara `recalcularDebounced()`.

**Qué funciones deberían dejar de leer filas directamente**: `validarProyecto()` (la parte que valida piezas), `leerPiezas()`, `leerPiezasParaExportar()` — las tres pasarían a leer `state.piezas` en vez de `document.querySelectorAll('#piezasBody tr')`.

**Riesgos de migración**:
- Las tres funciones actuales no leen exactamente los mismos campos ni aplican las mismas reglas de conversión (por ejemplo, `leerPiezas()` multiplica la cantidad por `cantidadProyectos` y expande una fila en N piezas individuales; `leerPiezasParaExportar()` no expande, deja una fila por renglón). Un modelo único de `state.piezas` tendría que decidir **en qué forma** se guarda (¿una entrada por fila capturada, o ya expandida?) sin romper ninguno de los tres consumidores.
- El combobox buscable y el selector de cantos escriben directamente sobre el DOM de la fila (`dataset.valor`, clases `.activo`); sincronizarlos con `state.piezas` exige tocar esos dos módulos también, no solo los 3 lectores.
- `pieceCounter` (el consecutivo de `id`) tendría que seguir existiendo igual, para no romper la identidad de la fila al usarla como clave de `state.piezas`.

**Comportamiento actual que debe preservarse**: el "auto" de girar que se resuelve distinto según el nivel de optimización (`permitirGirarAuto`), el rechazo silencioso de filas incompletas (`if(!l || !a || cant<=0) return;`), y los mensajes de error exactos de `validarProyecto()`/`leerPiezas()` cuando una pieza no cabe en su material.

**¿De una sola vez o incrementalmente?** **Incrementalmente**, en fases (propuestas en la sección 12) — un cambio de esta magnitud, si se hace de una sola vez, tocaría simultáneamente `validarProyecto`, `leerPiezas`, `leerPiezasParaExportar`, `addPiezaRow`, el combobox y el selector de cantos: exactamente el tipo de "cambio simultáneo de interfaz, datos y lógica de negocio" que `docs/engineering/04-AI-RULES.md` (regla 7) prohíbe explícitamente.

# 8. Separación dominio / UI

| Capa | Funciones actuales (ejemplos representativos) | ¿Mezclada hoy? |
|---|---|---|
| **Dominio** (reglas de negocio puras, ya extraídas en su mayoría) | `calcularRectanguloUtilTablero`, `empacarMaterial`/`empacarConLista`, `calcularSobrantes`, `crearFronterasEntrePiezas`, `calcularImanes`, `piezasSeEncimanConOtras` | No — ya están en módulos separados o, las que faltan (optimizador, edición manual), son autocontenidas sin DOM/`state`. |
| **Aplicación / coordinación** | `recalcular()`, `validarProyecto()`, `leerPiezas()`, `renderDiagrama()`, `aplicarPiezasPendientes()` | **Sí, fuertemente** — estas funciones deberían orquestar llamadas a dominio/infraestructura, pero en la práctica *son* la infraestructura (leen DOM) y *son* el dominio (calculan costos) a la vez. |
| **Infraestructura** (acceso a DOM, `localStorage`, red) | Las decenas de `document.getElementById`/`querySelector` dispersas, `cargarEstiloGuardado`/`guardarEstilo` (`localStorage`), `cargarExcelJS`/`cargarJSZip` (CDN) | Parcialmente aislada (`cargarExcelJS`/`cargarJSZip` son funciones dedicadas); el acceso a `localStorage` de estilo está razonablemente contenido en 3 funciones; el acceso al DOM de piezas/formulario está totalmente disperso. |
| **Interfaz** (renderizado puro a partir de datos ya calculados) | `dibujarBoard` (ya extraída), `renderReporte`/`renderReporteColumnas/Lista/Tarjetas/Factura`, `renderMateriales`/`Tapacantos`/`Componentes` | Mixta — el "reporte de costos" ya recibe `datos` armado por parámetro (buen ejemplo de interfaz separada de dominio); los renders de catálogo, en cambio, leen y escriben `state` directamente dentro de la misma función que genera el HTML. |
| **Persistencia** | `cargarEstiloGuardado`/`guardarEstilo` (único punto real de persistencia — `localStorage`) | No — es la capa mejor aislada de todo el archivo, quizás porque nunca tuvo que competir con lógica de negocio. |
| **Exportación / importación** | `construirLibroExcel`, `construirDXFTablero` (extraída), `extraerProyectoDesdeLibroExcel`, `parsearCSV` (extraída), `aplicarPiezasPendientes` | **Sí, fuertemente** en el lado de importación (`aplicarPiezasPendientes` escribe `state` Y el DOM a la vez) y en `construirLibroExcel` (arma datos Y formatea celdas Excel en la misma función, con 16 closures). El lado de generación pura (DXF, imágenes) ya está bien separado. |

**Conclusión**: la capa mejor separada hoy es **dominio** (gracias a las 20 extracciones mecánicas ya hechas) y **persistencia** (que nunca estuvo mezclada). La capa peor separada es **aplicación/coordinación**, que en la práctica absorbe tanto infraestructura como dominio dentro de las mismas funciones — es exactamente donde debe enfocarse esta fase.

# 9. Subsistemas arquitectónicos candidatos

| Subsistema | Responsabilidad | Datos propios | Funciones actuales relacionadas | Dependencias | Interfaz pública propuesta | Riesgo | Precondiciones |
|---|---|---|---|---|---|---|---|
| **project-state** | Única fuente de verdad del proyecto activo (piezas, parámetros de corte, catálogos referenciados) | `state.piezas` (nuevo), `state.materiales/tapacantos/componentes/componentesProyecto` (ya existen) | Ninguna hoy — es el subsistema que no existe todavía | Ninguna | `leerProyectoActual()`, `actualizarPieza(id, cambios)`, `agregarPieza(datos)`, `eliminarPieza(id)` | Alto (toca el corazón del prototipo) | Fase de piezas (sección 12) completada |
| **pieces** | Captura, edición y presentación de filas de pieza en el DOM | Ninguno propio (usa `project-state`) | `addPiezaRow`, `renumerarFilas`, `attachEnterNavegable`, `crearCantoSelectorSvg`, `sincronizarCantoSelector` | `project-state` (una vez exista) | Eventos DOM que escriben en `project-state` | Alto (348 líneas, mucho DOM) | `project-state` |
| **catalogs** | CRUD de materiales, tapacantos, componentes | `state.materiales/tapacantos/componentes` | `renderMateriales/Tapacantos/Componentes`, `guardarSkuCatalogoDesdeTabla`, identidad/SKU (11 funciones) | `text-normalization.js` | `agregarMaterial(datos)`, `actualizarMaterial(id, cambios)`, `eliminarMaterial(id)` (×3 catálogos) | Medio | Ninguna — puede empezar ya |
| **costing** | Cálculo de costos (material, componentes, corte, tapacanto, total) a partir de un modelo ya construido | Ninguno propio — recibe `boards`+`piezas`+catálogos, retorna `datosReporte` | El bloque de costos dentro de `recalcular()` (líneas 4713-4822) | `format.js` (`fmt`/`fmtMoney`/`normalizarMetrosLinealesParaPresentacion`) | `calcularCostos(boards, piezas, catalogos, parametrosCorte)` → `datosReporte` | Bajo-Medio (es la costura de mayor valor identificada en la sección 6) | Ninguna — es el candidato más aislable de `recalcular()` hoy mismo |
| **optimization** | Empaquetado guillotina/libre | Ninguno — recibe piezas+parámetros, retorna `boards` | `pseudoAleatorio`, `barajar`, `empacarMaterial`, `empacarConListaLibre`, `empacarConLista` | `basic-geometry.js` | `optimizar(piezasPorMaterial, kerf, opciones)` → `boards[]` | Alto (556 líneas, algoritmo denso) | Análisis dedicado propio (roadmap 35, sección "Conviene esperar") |
| **diagram** | Generación visual y edición manual del tablero | Ninguno — opera sobre `board` recibido | `dibujarBoard` (ya extraída), `rotarPieza`, `espejarBoard*`, `compactarHacia*`, `calcularImanes`, `activarPiezasArrastrables`, `renderDiagrama` | `board-renderer.js`, `board-area.js`, `board-analysis.js`, `free-rectangles.js` | `renderizarDiagrama(board, estilo)`, `editarPieza(board, accion)` | Medio (ya muy avanzado por extracciones previas) | Grupo 20 del roadmap 35 (sobrantes/fronteras) |
| **reports** | Presentación del desglose de costos en 4 plantillas | Ninguno — recibe `datosReporte` | `renderReporte` y sus 4 variantes | `format.js` | `renderizarReporte(datosReporte, plantilla, diseno)` | Bajo (ya recibe datos por parámetro) | Ninguna — ya casi aislado |
| **imports** | Lectura, vista previa y aplicación de CSV/Excel | `importacionPendiente2DB` | Los 4 grupos de importación (roadmap 35, grupos 8-11) | `csv.js`, `project-format.js`, `text-normalization.js`, `limits.js` | `leerArchivo(archivo)` → vista previa; `confirmarImportacion(decisiones)` | Alto (~1425 líneas combinadas, escritura atómica de `state`) | Análisis dedicado propio |
| **exports** | Generación de Excel/DXF | Ninguno — recibe `state` ya consolidado | `construirLibroExcel`, `exportarExcel`, `exportarDXFZip`, `construirLibroFormatoProyecto` | `dxf-export.js`, `excel-utils.js`, `excel-diagrams.js`, `board-area.js` | `exportarExcel(proyecto)`, `exportarDXF(boards)` | Crítico (`construirLibroExcel` no separable sin reescritura) | Ninguna adicional a lo ya extraído — `construirLibroExcel` queda fuera de alcance |
| **UI controllers** | Menús, personalización, combobox, modal de creación, redimensionamiento | `localStorage` (estilo) | Grupos 6, 12, 13, 14, 25, 29 del roadmap 35 | `format.js` | Sin interfaz de datos — solo interfaz de eventos DOM | Bajo-Medio | Ninguna — extraíbles ya, uno por uno |

# 10. Estrategia incremental

Cada cambio de esta fase debe seguir el mismo contrato ya usado en las 20 extracciones anteriores, extendido con la dimensión arquitectónica (no solo mover código, sino introducir un punto de indirección):

1. Una sola responsabilidad por cambio (una función coordinadora dividida, o una fuente de verdad introducida — nunca ambas a la vez).
2. La aplicación debe seguir funcionando de principio a fin después de cada cambio (sin pantallas rotas, sin funcionalidades perdidas).
3. Cada cambio debe ser reversible mecánicamente (mismo criterio de "reversión" ya documentado en los 20 reportes anteriores).
4. Cada cambio incluye pruebas: automáticas cuando el nuevo código sea aislable en sandbox de Node, manuales del subconjunto relevante de `docs/engineering/12-MANUAL-TESTS.md`.
5. Cada cambio termina en un commit propuesto (no ejecutado por la IA salvo autorización explícita, mismo patrón ya seguido) y, cuando el usuario lo autorice, en push.

# 11. Primer punto de desacoplamiento

**Candidatos evaluados**:

- *Crear un lector centralizado de piezas*: de alto valor, pero requiere decidir primero la forma exacta de `state.piezas` (expandida vs. sin expandir) — prematuro sin antes aislar el consumo (costeo) que hoy fuerza esa decisión.
- *Crear un modelo intermedio de proyecto*: de altísimo valor a largo plazo, pero es un cambio grande que toca piezas + parámetros + catálogos a la vez — va contra el principio de cambios pequeños si se intenta de una sola vez.
- *Aislar el cálculo de costos*: **candidato elegido** — ver justificación abajo.
- *Aislar la actualización de reportes*: ya está parcialmente aislado (`renderReporte` recibe `datosReporte` por parámetro); el valor marginal es menor que aislar quién *construye* `datosReporte`.
- *Crear una capa de acceso al DOM*: útil, pero es una abstracción transversal sin un punto de entrada natural — más un principio a aplicar gradualmente que un cambio único.

**Selección: aislar el cálculo de costos** (el bloque de líneas 4713-4822 de `recalcular()`, ya identificado en la sección 6 como la etapa 7).

**Por qué es el primer cambio correcto**:
- **Pequeño**: son ~110 líneas ya visualmente delimitadas por sus propios comentarios de sección (`// ---- costos: material ----`, etc.), sin necesidad de tocar el resto de `recalcular()` en el mismo cambio.
- **Comprobable**: recibe datos ya calculados (`piezas`, `tablerosPorMaterial`, `totalCortes`, `totalCorteMm`, y lecturas de 3 valores del DOM que pueden pasarse por parámetro) y retorna un objeto plano (`datosReporte` menos la parte de renderizado) — perfectamente sandboxeable en Node, comparando contra una copia de control del cálculo original, exactamente con el mismo patrón usado en las 20 extracciones anteriores.
- **Reversible**: si se extrae como una función `calcularCostos(...)` que `recalcular()` simplemente llama en el mismo punto donde hoy tiene el código inline, revertir es tan mecánico como cualquier extracción anterior.
- **Útil de verdad**: es la primera vez que la lógica de costeo podría probarse de forma aislada, sin optimizador, sin DOM, sin `state` — habilitando pruebas de regresión reales sobre las reglas de precio (que `docs/engineering/04-AI-RULES.md`, regla 26, exige como "pruebas deterministas" para "cálculos de costos").
- **Riesgo bajo-medio**: no toca DOM directamente salvo la lectura de `redondearTapacanto` (que puede pasarse como parámetro booleano), no muta `state` (solo lee catálogos), y no depende de decisiones arquitectónicas pendientes (a diferencia de piezas, que sí depende de resolver primero la forma del modelo).

# 12. Plan de migración de piezas (si se decide avanzar con `state.piezas`)

- **Fase de lectura**: crear una única función `leerPiezasDelDOM()` que centralice la lectura de filas (reemplazando la lógica hoy duplicada en `validarProyecto`/`leerPiezas`/`leerPiezasParaExportar`), **sin introducir `state.piezas` todavía** — cada consumidor sigue llamando a esta función central en vez de leer el DOM por su cuenta. Esto ya elimina la triplicación sin ningún riesgo de divergencia entre DOM y `state` (porque `state.piezas` no existe aún).
- **Fase de espejo DOM/state**: introducir `state.piezas`, escrito en paralelo cada vez que se edita una fila (los mismos eventos `input`/`change` que hoy solo disparan `recalcularDebounced`), pero **sin que ningún consumidor lo lea todavía** — solo para verificar, con pruebas manuales, que el espejo se mantiene sincronizado en todos los flujos (captura, edición, eliminación, importación).
- **Fase de `state` como fuente principal**: migrar los consumidores (`validarProyecto`, `leerPiezas`, `leerPiezasParaExportar`) para que lean `state.piezas` en vez de volver a leer el DOM, uno a la vez, verificando cada uno con las pruebas de regresión de piezas antes de continuar con el siguiente.
- **Fase de eliminación de lectura directa**: una vez que los 3 consumidores ya leen `state.piezas`, eliminar cualquier lectura residual directa del DOM de piezas fuera de la función que mantiene el espejo — el DOM pasa a ser puramente presentacional para piezas.

No se implementa nada de esto en esta tarea; se documenta como plan de referencia para cuando se decida ejecutarlo.

# 13. Plan de descomposición de `recalcular()`

| Fase | Funciones afectadas | Datos de entrada | Datos de salida | Efectos secundarios | Pruebas necesarias | Riesgo |
|---|---|---|---|---|---|---|
| **Fase A — Aislar cálculo de costos** | Extraer el bloque de costos a `calcularCostos(piezas, tablerosPorMaterial, totalCortes, totalCorteMm, catalogos, opcionesCorte)`; `recalcular()` la llama en el mismo punto | `piezas`, resultado del empaquetado, catálogos (`state.materiales/tapacantos/componentesProyecto`), `precioCorte`/`precioCorteMetro`/`modoPrecioCorte`/`redondearTapacanto` | `datosReporte` (sin `renderReporte` aplicado todavía) | Ninguno (función pura) | REP-01 a REP-06 de `12-MANUAL-TESTS.md`, más comparación automática en sandbox de Node contra el cálculo original | Bajo-Medio |
| **Fase B — Aislar construcción del modelo de tableros por material** | Extraer el bucle `Object.keys(porMaterial).forEach(...)` a `construirTablerosPorMaterial(piezas, parametrosCorte, nivelOptimizacion, libre)` → retorna `{boardsAll, tablerosPorMaterial, totalCortes, totalCorteMm}` | `piezas`, `parametrosCorte`, `nivelOptimizacion`, `libre` | `boardsAll`, `tablerosPorMaterial`, totales de corte | Muta `BOARD_W`/`BOARD_H` (debe decidirse si se conserva como variable de módulo o se convierte en valor de retorno) | OPT-01 a OPT-08 completas | Medio (toca el optimizador y las variables de módulo) |
| **Fase C — Separar validación de captura** | `recalcular()` deja de mezclar `validarProyecto()`+`resolverParametrosCorteEtapa4()`+lecturas sueltas de DOM en una sola secuencia; se agrupan en un único paso `capturarYValidarProyecto()` | DOM del formulario completo | `{ok, errores, piezas, parametrosCorte, opciones}` | Escribe `#avisos` (vía `mostrarErroresProyecto`) | ARR-01, PZ-11, LIM-01 a LIM-09 | Bajo (agrupa, no cambia lógica) |
| **Fase D — `recalcular()` como orquestador delgado** | `recalcular()` pasa a ser: capturar/validar → construir tableros → actualizar `state.boards`/`activeTab` → renderizar diagrama → calcular costos → renderizar reporte → persistir — cada paso ya una función propia | (ninguno directo — orquesta) | `boolean` (igual que hoy) | Los mismos de siempre, ahora explícitos por fase | Regresión completa (sección 14) | Alto (es el punto donde todo converge; requiere que A-C ya estén probadas por separado) |

Cada fase debe completarse y validarse (incluyendo el commit/push correspondiente) antes de iniciar la siguiente — no deben mezclarse en un mismo cambio.

# 14. Pruebas de regresión por fase

| Fase arquitectónica | Pruebas de `12-MANUAL-TESTS.md` |
|---|---|
| Aislar cálculo de costos (13-A) | REP-01 a REP-06 (reporte de costos), MAT-01 a MAT-07 (precio de materiales), COMP-01 a COMP-06 (precio de componentes), COR-01 a COR-08 (parámetros de corte) |
| Construcción de tableros por material (13-B) | OPT-01 a OPT-08 (optimización completa), DIAG-01 a DIAG-06 (diagrama resultante) |
| Separar validación (13-C) | PZ-01 a PZ-11 (piezas), LIM-01 a LIM-09 (casos límite), ARR-01 (arranque) |
| `recalcular()` como orquestador (13-D) | Regresión completa — el subconjunto CRITICAL íntegro (ARR, PZ, MAT, OPT, DIAG, PST, XLS, DXF, CSV, EXC, FMT, DEMO) |
| Lector centralizado de piezas (fase de lectura, sección 12) | PZ-01 a PZ-11 completas |
| Espejo DOM/`state.piezas` | PZ-01 a PZ-11, más PST-01 (persistencia — confirmar que recargar la página no deja `state.piezas` desincronizado del DOM restaurado) |
| Migración de consumidores a `state.piezas` | PZ-01 a PZ-11, XLS-01 (importación, que hoy escribe filas vía `agregarPiezaDesdeColumnas`), FMT-01 (exportación de formato, que usa `leerPiezasFormularioParaFormato`) |
| Cualquier fase que toque `catalogs` | MAT-01 a MAT-07, TAP-01 a TAP-06, COMP-01 a COMP-06 |
| Cualquier fase que toque `diagram`/edición manual | DIAG-01 a DIAG-06 (incluye arrastre, rotación, espejo, compactación) |
| Cualquier fase que toque `imports` | CSV-01 a CSV-07, XLS-01 a XLS-11 |
| Cualquier fase que toque `exports` | EXC-01 a EXC-08, DXF-01 a DXF-05, FMT-01 a FMT-04 |
| Cualquier fase | PST-01 a PST-04 (persistencia), ARR-01 a ARR-05 (consola sin errores en cada arranque) |

# 15. Estrategia Git

- **Rama o `main`**: dado que el proyecto no ha usado ramas en ninguna de las 20 extracciones anteriores (todos los commits fueron directos sobre la rama principal, uno por tarea), se recomienda **mantener ese mismo patrón para los cambios de bajo riesgo** (Fases A y C de la sección 13, catálogos, UI controllers). Para cambios de riesgo Alto/Crítico (Fase B, Fase D, cualquier fase de migración de piezas), se recomienda **una rama de trabajo por fase**, fusionada solo después de completar su regresión manual — a diferencia de las extracciones mecánicas anteriores, estas fases sí cambian la forma en que los datos fluyen, no solo su ubicación física.
- **Tamaño máximo por cambio**: una sola fase de las tablas de las secciones 12/13, o un único subsistema "UI controllers"/"catalogs" a la vez — nunca combinar una fase de descomposición de `recalcular()` con una migración de piezas en el mismo commit.
- **Cuándo hacer commit**: al completar una fase con sus pruebas automáticas pasando y su reporte de extracción/cambio documentado — mismo criterio que las 20 tareas anteriores.
- **Cuándo detenerse**: si una fase revela que su "costura" no es tan limpia como se documentó aquí (por ejemplo, si aislar costos descubre una dependencia oculta de DOM no identificada) — detener, documentar el hallazgo, y replantear el alcance antes de continuar, igual que se hizo con los bloqueos de `LIMITES`/`ENCABEZADO_FORMATO` en extracciones anteriores.
- **Cuándo revertir**: si la regresión manual de la fase encuentra una diferencia de comportamiento no documentada como intencional.
- **Cuándo actualizar documentación**: `docs/engineering/10-CURRENT-STATE.md` y `docs/engineering/05-ARCHITECTURE.md` deben actualizarse al completar cada subsistema de la sección 9 (no en cada fase pequeña), para que la documentación de arquitectura no quede desincronizada del código con demasiada frecuencia.

# 16. Riesgos de la nueva fase

- **Divergencia entre DOM y `state`**: el riesgo central de cualquier fase de "espejo" (sección 12) — si un evento de edición no dispara la escritura a `state.piezas`, ambas fuentes divergen silenciosamente hasta el siguiente `recalcular()` completo (que hoy sigue leyendo el DOM, no `state.piezas`, mientras dure la fase de espejo).
- **Doble fuente de verdad transitoria**: inherente a cualquier migración incremental — mientras `state.piezas` exista pero no todos los consumidores lo usen, hay dos fuentes "válidas" simultáneas, lo cual es aceptable solo si se documenta explícitamente cuál manda en cada fase.
- **Cambios silenciosos en costos**: al aislar `calcularCostos()` (sección 11), cualquier diferencia de redondeo o de orden de operaciones respecto al código original produciría un total distinto sin ningún error — de ahí la exigencia de comparación automática byte/valor a valor contra el cálculo original, no solo revisión visual.
- **Pérdida de edición manual**: cualquier descomposición de `recalcular()` que, por accidente, empiece a limpiar o reconstruir `board.pieces` en un punto donde hoy no lo hace, rompería la persistencia del acomodo manual entre recálculos — riesgo ya documentado en los análisis de DXF/Excel/SVG, y que se agrava si se toca la Fase B de la sección 13.
- **Importaciones inconsistentes**: si se introduce `state.piezas` antes de resolver cómo interactúa con `aplicarPiezasPendientes()` (que hoy solo escribe el DOM vía `agregarPiezaDesdeColumnas`), una importación podría dejar piezas en el DOM sin su espejo en `state.piezas`.
- **Exportaciones con datos desactualizados**: ya documentado como comportamiento *actual* (exportar dispara `recalcular()`, que descarta ediciones manuales) — cualquier fase que toque `recalcular()` debe verificar explícitamente que este comportamiento (correcto o no) se mantiene igual, salvo decisión explícita de cambiarlo, que está fuera del alcance de esta fase.
- **Eventos duplicados**: al introducir un "lector centralizado de piezas" o un "espejo DOM/state", existe el riesgo de registrar el mismo listener dos veces (uno para actualizar `state`, otro heredado que sigue leyendo el DOM) — debe verificarse explícitamente que no se disparan cálculos duplicados por el mismo cambio del usuario.
- **Regresiones visuales**: cualquier fase que toque `renderDiagrama`/`dibujarBoard` (aunque no está en el alcance inmediato de esta fase) arriesga diferencias de pantalla no detectables sin comparación visual real en navegador — mismo límite ya documentado en todos los reportes anteriores por la ausencia de herramientas de automatización de navegador en este entorno.

# 17. Criterios de finalización

Esta fase se considera terminada cuando:
- **Piezas** tienen una fuente de verdad clara y documentada (ya sea `state.piezas` completamente migrado, o una decisión explícita y documentada de mantener el DOM como fuente de verdad con un único lector centralizado).
- **`recalcular()`** está dividido en las etapas de la sección 13, con al menos el cálculo de costos y la construcción de tableros aislados como funciones independientes y probadas.
- **La lógica de costos** es invocable y probable de forma independiente del DOM y del optimizador.
- **El DOM** se usa únicamente para presentación e interacción en los subsistemas ya migrados (catálogos, piezas), no como almacén de datos de negocio.
- **Las pruebas críticas** de la sección 14 pasan en navegador real para cada fase completada.
- **`main.js` se reduce por arquitectura, no solo por movimiento** — es decir, el criterio de éxito no es "menos líneas en `main.js`" (eso ya lo logran las extracciones mecánicas), sino "menos responsabilidades mezcladas por función", verificable comparando la tabla de la sección 8 antes/después.

# 18. Próximos tres cambios

1. **Aislar el cálculo de costos dentro de `recalcular()`.**
   - Objetivo: extraer el bloque de líneas 4713-4822 a una función `calcularCostos(...)` que reciba sus datos por parámetro (piezas, resultado del empaquetado por material, catálogos, opciones de precio de corte) y retorne `datosReporte` (sin la parte de renderizado), sin cambiar ningún valor calculado.
   - Archivos afectados: `src/scripts/main.js` únicamente (la función puede vivir en el mismo archivo inicialmente, como primer paso conservador, o en un nuevo módulo si se decide en la tarea de ejecución).
   - Comportamiento protegido: los 4 subtotales (material, componentes, corte, tapacanto), el total, la validación de que ningún costo sea negativo o no finito, y el mensaje de error exacto si eso ocurre.
   - Riesgo: Bajo-Medio.
   - Pruebas: sandbox de Node comparando `calcularCostos(...)` contra una copia de control del cálculo original con datos sintéticos (varios materiales, con/sin componentes, con/sin tapacanto, ambos modos de precio de corte); manuales REP-01 a REP-06, MAT-03, COMP-04.
   - Mensaje de commit sugerido: `refactor(costing): isolate cost calculation from recalcular()`.

2. **Crear un lector centralizado de piezas (sin introducir `state.piezas` todavía).**
   - Objetivo: unificar `validarProyecto()` (la parte de piezas), `leerPiezas()` y `leerPiezasParaExportar()` para que las tres consuman una única función de lectura del DOM, eliminando la triplicación de lógica de parseo sin cambiar ningún comportamiento observable.
   - Archivos afectados: `src/scripts/main.js` únicamente.
   - Comportamiento protegido: las diferencias reales y deliberadas entre las tres (expansión por cantidad en `leerPiezas`, no-expansión en `leerPiezasParaExportar`, reglas de validación en `validarProyecto`) deben preservarse exactamente — la unificación es solo de la lectura cruda de cada campo, no de su interpretación posterior.
   - Riesgo: Medio.
   - Pruebas: manuales PZ-01 a PZ-11 completas, FMT-01 (exportación de formato), XLS-01 (importación).
   - Mensaje de commit sugerido: `refactor(pieces): centralize DOM row reading logic`.

3. **Extraer el subsistema "UI controllers" de menor riesgo: Personalización (`localStorage`) o Redimensionamiento.**
   - Objetivo: aplicar el mismo patrón mecánico ya usado 20 veces (evaluación de pureza/autocontención, extracción vía `sed`, comparación byte a byte, pruebas en sandbox) a uno de los grupos "Muy recomendable"/"Recomendable" ya identificados en `docs/engineering/35-MODULARIZATION-ROADMAP-UPDATE.md` (por ejemplo, el grupo 20 — sobrantes y rectángulos libres — que ya tiene sus 4 dependencias resueltas).
   - Archivos afectados: un nuevo archivo de módulo, `src/scripts/main.js`, `index.html`.
   - Comportamiento protegido: idéntico al de las 20 extracciones anteriores — cuerpo byte-equivalente, llamadas intactas.
   - Riesgo: Bajo.
   - Pruebas: mismas que en los reportes 20-34 (comparación automática + pruebas manuales pendientes correspondientes al grupo elegido).
   - Mensaje de commit sugerido: dependiente del grupo elegido, por ejemplo `refactor(geometry): extract offcut reconstruction utilities`.

Este tercer cambio se incluye deliberadamente como una extracción mecánica de bajo riesgo (no arquitectónica) porque **no todo el trabajo restante requiere un rediseño** — seguir agotando el inventario de funciones puras/casi puras del roadmap 35 en paralelo a los cambios arquitectónicos 1 y 2 sigue siendo valioso y de bajo riesgo, y no debe detenerse solo porque esta fase introduce cambios de mayor alcance.

# 19. Qué no hacer

- No reescribir todo el proyecto.
- No introducir frameworks todavía (React, Vue, o cualquier otro).
- No migrar a módulos ES durante esta fase — se mantiene el patrón `<script>` + `window.ProyCutXxx` ya establecido en las 15 extracciones anteriores.
- No conectar Supabase ni ningún backend.
- No agregar nuevas funcionalidades — esta fase es exclusivamente de reorganización interna.
- No corregir reglas de negocio mientras se desacopla (por ejemplo, el hallazgo de que exportar descarta la edición manual **no se corrige** en esta fase — se documenta y se preserva).
- No cambiar la lógica de optimización sin pruebas — cualquier tarea que toque el grupo 19 del roadmap 35 (optimización/empaquetado) requiere, como mínimo, el mismo nivel de comparación automática ya exigido en las 20 extracciones anteriores.

# 20. Conclusión

**¿Está el proyecto listo para esta fase?** Sí, con una condición: está listo para **empezar** por el cambio de menor riesgo (aislar el cálculo de costos), no para acometer una migración completa de piezas de una sola vez. Las 20 extracciones mecánicas previas ya despejaron toda la capa de utilidades puras que habría distraído o complicado este trabajo — hoy es posible enfocarse exclusivamente en los coordinadores sin preocuparse por geometría, formato, validación o generación de archivos, que ya viven en módulos estables.

**Primer cambio exacto**: aislar el cálculo de costos (líneas 4713-4822 de `recalcular()`) en una función independiente que reciba sus datos por parámetro y retorne `datosReporte`, sin tocar el resto de `recalcular()` en el mismo cambio.

**Por qué ese cambio debe ejecutarse antes que los demás**: es, de los tres coordinadores centralizados de mayor riesgo (`recalcular`, `validarProyecto`/`leerPiezas`, `construirLibroExcel`), el único bloque que **hoy mismo, sin ninguna precondición pendiente**, puede aislarse sin tocar DOM, sin tocar `state.boards`, sin depender de una decisión arquitectónica todavía no tomada (como la forma de `state.piezas`) y sin acoplarse al optimizador. Es, con evidencia directa del código, la costura de menor riesgo y mayor valor de toda la función `recalcular()` — el equivalente arquitectónico exacto de lo que fue `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md`, sección 15, punto 1 (configuración jerárquica) para la capa de utilidades puras: la pieza que, por evidencia y no por intuición, resulta ser la más segura para empezar.

---

# Resumen final

- **Principal problema arquitectónico**: ausencia de un modelo de datos intermedio del proyecto — el DOM hace doble función de interfaz y almacén de piezas, y `recalcular()` es el único punto que sabe ensamblar piezas + parámetros + catálogos en un resultado, mezclando 14 responsabilidades distintas en una sola función de 249 líneas.
- **Primera fuente de verdad que debe corregirse**: **piezas** — hoy viven únicamente en el DOM, leídas de forma independiente y ligeramente distinta por 3 funciones (`validarProyecto`, `leerPiezas`, `leerPiezasParaExportar`).
- **Función coordinadora más crítica**: `recalcular()` — único punto de escritura de `state.boards`/`state.activeTab`/`state.ultimoTotal`/`state.ultimoReporte`, disparado desde ~20 puntos distintos del código, sin contrato explícito de entrada/salida.
- **Primer cambio recomendado**: aislar el cálculo de costos de `recalcular()` en una función independiente, comprobable en sandbox de Node.
- **Próximos tres cambios**: (1) aislar cálculo de costos, (2) centralizar la lectura de piezas del DOM (sin introducir `state.piezas` todavía), (3) continuar, en paralelo, con extracciones mecánicas de bajo riesgo ya identificadas en el roadmap 35 (por ejemplo, sobrantes y rectángulos libres del tablero).
- **Riesgos principales**: divergencia DOM/`state` durante cualquier fase de migración incremental de piezas; cambios silenciosos en costos si el aislamiento de `calcularCostos()` no se verifica byte/valor a valor contra el original; y la ya documentada pérdida de sincronía entre edición manual y `recalcular()`/exportación, que esta fase debe **preservar tal cual**, no corregir.
