# 35-MODULARIZATION-ROADMAP-UPDATE.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-03

## Propósito
Actualizar el inventario y la hoja de ruta de modularización de `src/scripts/main.js` (`docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md`) después de las trece extracciones mecánicas realizadas desde entonces (reportes 22 a 34), eliminando del inventario todo lo que ya fue extraído y reclasificando por prioridad lo que permanece.

## Depende de
`docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md`; `docs/engineering/22-PARSEARCSV-EXTRACTION-REPORT.md` a `docs/engineering/34-EXCEL-DIAGRAMS-EXTRACTION-REPORT.md`; `src/scripts/main.js`; `index.html`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Nota metodológica

Este documento es de planificación únicamente. No se modificó ningún archivo del proyecto salvo la creación de este propio documento. Todo el inventario proviene de lectura directa de `src/scripts/main.js` en su estado actual (commit más reciente antes de esta tarea, 5767 líneas) y de los trece reportes de extracción completados desde `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md` (reportes 22 a 34). Las líneas citadas son aproximadas porque cualquier extracción futura las desplazará; los nombres de función y los valores de dependencia son exactos, verificados con `grep` sobre el archivo real.

---

# 1. Resumen ejecutivo

- **Tamaño original de `main.js`** (al separar JS de HTML/CSS, reporte 14): 6972 líneas.
- **Tamaño actual de `main.js`**: **5767 líneas**.
- **Reducción lograda**: 1205 líneas removidas de `main.js`, **17.3%**.
- **Módulos ya extraídos**: 15 archivos, expuestos como `window.ProyCutXxx` y destructurados al inicio de la IIFE de `main.js`:

  | # | Objeto global | Archivo | Origen (reporte) |
  |---|---|---|---|
  | 1 | `window.ProyCutFormat` | `src/scripts/utils/format.js` | 15 |
  | 2 | `window.ProyCutValidation` | `src/scripts/utils/validation.js` | 16, 18 |
  | 3 | `window.ProyCutLimits` | `src/scripts/config/limits.js` | 17 |
  | 4 | `window.ProyCutTextNormalization` | `src/scripts/utils/text-normalization.js` | 19 |
  | 5 | `window.ProyCutCSV` | `src/scripts/utils/csv.js` | 20, 22 |
  | 6 | `window.ProyCutProjectFormat` | `src/scripts/config/project-format.js` | 21 |
  | 7 | `window.ProyCutBasicGeometry` | `src/scripts/geometry/basic-geometry.js` | 23 |
  | 8 | `window.ProyCutFreeRectangles` | `src/scripts/geometry/free-rectangles.js` | 24, 25, 26 |
  | 9 | `window.ProyCutHierarchicalConfig` | `src/scripts/config/hierarchical-config.js` | 28 |
  | 10 | `window.ProyCutBoardArea` | `src/scripts/geometry/board-area.js` | 29 |
  | 11 | `window.ProyCutDxfExport` | `src/scripts/dxf/dxf-export.js` | 30 |
  | 12 | `window.ProyCutExcelUtils` | `src/scripts/excel/excel-utils.js` | 31 |
  | 13 | `window.ProyCutBoardAnalysis` | `src/scripts/geometry/board-analysis.js` | 32 |
  | 14 | `window.ProyCutBoardRenderer` | `src/scripts/svg/board-renderer.js` | 33 |
  | 15 | `window.ProyCutExcelDiagrams` | `src/scripts/excel/excel-diagrams.js` | 34 |

- **Funciones de nivel superior que quedan en `main.js`**: 128 (frente a las 161 documentadas en el roadmap original — 33 funciones/constantes ya salieron de `main.js`).
- **Estado general**: la capa de utilidades puras y casi-puras (formato, validación, límites, texto, CSV, geometría de rectángulos, sobrantes/fronteras de análisis, generación de SVG, generación de DXF, utilidades y pipeline de imágenes de Excel, configuración jerárquica) está **completamente extraída**. Lo que queda en `main.js` es, en abrumadora mayoría, código con dependencia real y directa de `document` y/o `state`: catálogos, piezas, importación/exportación coordinadas, edición manual, el optimizador de empaquetado, el reporte de costos y los tres grandes coordinadores (`validarProyecto`/`recalcular`, `construirLibroExcel`, `exportarExcel`).
- **Principal hallazgo de esta actualización**: existe un grupo pequeño (25 líneas) — `reconstruirSobrantesYFronteras`/`recalcularFreeRectsDesdeCero` — cuyas **cuatro dependencias ya están 100% resueltas** por extracciones previas (`obtenerAreaColocacionBoard` en `board-area.js`; `crearFronterasEntrePiezas`/`crearFronterasPiezaSobrante`/`crearFronterasExteriores` en `board-analysis.js`; `calcularRectsLibresDesdeObstaculos` en `free-rectangles.js`) y que, sin embargo, **no se extrajo todavía**. Es, con evidencia, la extracción de menor riesgo disponible hoy en todo el archivo.

# 2. Inventario actualizado — grupos restantes en `main.js`

Se eliminaron del inventario original (roadmap, reporte 27) todos los grupos ya extraídos: configuración jerárquica, utilidades de tablero y precio (parcial — ver grupo 3 abajo, que sí permanece), geometría básica, rectángulos libres, contención de rectángulos, cálculo de rectángulos libres, análisis de sobrantes y fronteras (funciones puras), generador SVG del tablero, DXF puro, utilidades puras de Excel y el pipeline de imágenes de Excel.

Convención de riesgo: **Bajo** — **Medio** — **Alto** — **Crítico** (coordina o muta `state`/DOM extensamente, o es invocado por/invoca a `recalcular()`).

| # | Grupo | Responsabilidad | Tamaño aprox. | Funciones principales | Dependencias hacia módulos extraídos | DOM | `state` | `recalcular()` | Acoplamiento | Riesgo | ¿Subsistema completo? |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Estado e inicialización | Declaración de `state` y variables de módulo (`BOARD_W`, `BOARD_H`, `pieceCounter`) | ~15 líneas (99-113) | (declaraciones, no funciones) | Ninguna | No | Es la fuente | N/A | N/A (es el ancla de todo) | Crítico | No aplica — no es un subsistema, es el sustrato compartido |
| 2 | Identidad y SKU de catálogos | Genera/valida SKU e ID interno de materiales, tapacantos y componentes | ~251 líneas (114-364) | `configuracionSkuCategoria`...`registrarEventosSkuCatalogo` (11 funciones) | `normalizarSkuManual` (text-normalization.js) | Alto (inputs de SKU) | Sí (lee/escribe los 3 catálogos) | No directo | Medio | Alto (toca 3 catálogos + eventos) | Sí, casi — comparte límite difuso con "Catálogos" |
| 3 | Utilidades de tablero (no puras) | Medida por defecto de tablero, medida por material | ~20 líneas (365-384) | `obtenerMedidaTableroDefault`, `medidaTableroDeMaterial` | Ninguna | Sí (`document.getElementById`) | Sí (`state.materiales`) | No | Bajo | Medio (pequeño pero con 2 dependencias reales) | Sí, pequeño |
| 4 | Catálogos | Renderiza y edita las 3 tablas de catálogo | ~144 líneas (385-528) | `renderMateriales`, `renderTapacantos`, `renderComponentes` | Ninguna directa | Muy alto (crea filas completas) | Sí (lee/escribe) | Indirecto (llama `recalcularDebounced`) | Alto | Alto | Sí, junto con el grupo 2 |
| 5 | Componentes del proyecto | Tabla de componentes agregados al proyecto actual | ~144 líneas (529-672) | `etiquetaComponente`, `renderComponentesProyecto` | `fmtMoney` (format.js) | Alto | Sí | Indirecto | Medio | Medio | Sí |
| 6 | Interfaz general y menús | Menús desplegables, hamburguesa, panel de guardado | ~214 líneas (673-886) | `enfocarUltimoInput`...`cerrarPanelGuardado` (6 funciones + ~15 listeners) | Ninguna | Muy alto | No directo | Algunos botones llaman `recalcular()` | Alto | Medio | Sí |
| 7 | Exportación de formato de proyecto | Genera el Excel de "Exportar formato" (piezas + componentes) | ~153 líneas (887-1039) | `leerPiezasFormularioParaFormato`, `construirLibroFormatoProyecto` | `ENCABEZADO_FORMATO` (project-format.js), `textoSeguroParaExcel` (board-area.js) | Alto | Sí (lectura) | No | Medio | Medio | Sí |
| 8 | Importación Excel — piezas | Lee y valida el archivo Excel de formato de piezas | ~203 líneas (1040-1242) | `agregarPiezaDesdeColumnas`...`leerProyectoExcel` (9 funciones) | `ENCABEZADO_FORMATO`, `LIMITES`, `validarCantidad/Medida/Precio`, `normalizarGirarCSV`, `esValorAfirmativo` (5 módulos) | Parcial | No directo | No | Alto | Alto | No — comparte flujo con el grupo 9 y 10 |
| 9 | Importación Excel — catálogo (CAT-7) | Lee y valida el archivo Excel de catálogo | ~167 líneas (1243-1409) | `esLibroFormatoPiezas`...`leerCatalogoExcel` (5 funciones) | `LIMITES` | No | No | No | Medio | Medio | Sí, en sí mismo |
| 10 | Vista previa de importación | Calcula y renderiza la tabla de decisiones antes de aplicar una importación | ~647 líneas (1410-2056) | `prepararVistaPreviaMateriales`...`cancelarVistaPreviaImportacion` (15 funciones) | `normalizarNombreMaterialImportado/Componente` (text-normalization.js) | Muy alto | Sí (lectura) | No | Muy alto | Alto | No — es la mitad de un flujo de 2 partes con el grupo 11 |
| 11 | Aplicación atómica de importación | Aplica (o descarta) en bloque el resultado de la vista previa | ~408 líneas (2057-2464) | `filasProyectoDelComponente`, `construirAplicacionAtomicaComponentes/Materiales`, `aplicarPiezasPendientes` + listeners | `agregarPiezaDesdeColumnas` (mismo archivo), `renderMateriales/Tapacantos/Componentes` | Alto | Sí (escritura masiva) | Sí (llama `recalcular()` al confirmar) | Muy alto | **Crítico** | No — depende del grupo 10 |
| 12 | Personalización | Estilo visual guardado en `localStorage` (colores, fuentes, visibilidad de botones) | ~216 líneas (2465-2680) | `cargarEstiloGuardado`...`leerEstilo` (5 funciones) | `fuenteACss` (format.js) | Alto | No | Indirecto (dispara `recalcularDebounced` vía listeners) | Medio | Bajo-Medio | Sí |
| 13 | Combobox buscable | Selector flotante de material/tapacanto en la tabla de piezas | ~154 líneas (2652-2805) | `refrescarSelects`...`attachComboBuscable` (6 funciones) | Ninguna | Muy alto | Sí (lectura de catálogos) | No | Alto | Medio | Sí |
| 14 | Crear catálogo desde buscador | Modal para dar de alta un material/tapacanto/componente sin salir de la fila | ~92 líneas (2806-2897) | `etiquetaTipoCrear`...`confirmarCrear` (5 funciones) | Ninguna directa | Alto | Sí (escritura) | No | Alto | Medio | Sí |
| 15 | Selector visual de cantos | Cuadrito SVG de L1/L2/A1/A2 en cada fila de pieza | ~27 líneas (2898-2924) | `sincronizarCantoSelector`, `attachCantoSelector` | Ninguna | Sí | No | Indirecto | Bajo | Bajo | Sí, muy pequeño |
| 16 | Filas de piezas | Construcción de cada fila de la tabla de piezas y su navegación | ~348 líneas (2925-3272) | `crearCantoSelectorSvg`...`ajustarAlturaTabla` (10 funciones) | Ninguna directa | Muy alto | Indirecto (`pieceCounter`) | Indirecto | Muy alto | Alto | Sí, grande |
| 17 | Validación de proyecto | Valida el formulario completo antes de optimizar | ~114 líneas (3273-3386) | `obtenerCantidadProyectos`, `obtenerNivelOptimizacion`, `validarProyecto`, `mostrarErroresProyecto` | `LIMITES`, `validarCantidad/Medida/Precio`, `calcularRectanguloUtilTablero/Colocacion`, `resolverParametrosCorteEtapa4` (4 módulos) | Muy alto | No (lee todo del DOM) | Llamada por `recalcular()` | Muy alto | **Crítico** | No — coordinador, no subsistema |
| 18 | Lectura de piezas | Traduce las filas del DOM a objetos `pieza` para el optimizador | ~81 líneas (3387-3467) | `leerPiezas` | `medidaTableroDeMaterial` (mismo archivo, grupo 3), `calcularRectanguloUtilTablero/Colocacion`, `resolverParametrosCorteEtapa4` | Alto | Sí (indirecto) | Llamada por `recalcular()` | Alto | **Crítico** | No — coordinador |
| 19 | Optimización / empaquetado | Algoritmo de empaquetado guillotina y modo libre | ~556 líneas (3468-4023) | `pseudoAleatorio`, `barajar`, `empacarMaterial`, `empacarConListaLibre`, `empacarConLista` (+ closures locales `splitFreeRect`, `contenido`×2, `podarContenidos`×2) | `calcularHuellaEnRectangulo`, `capacidadLinealConKerf` (basic-geometry.js) | No | No (recibe todo por parámetro) | Llamada por `recalcular()` | Bajo hacia afuera / muy alto internamente | Alto (por tamaño y densidad algorítmica) | Sí, en sí mismo |
| 20 | Sobrantes y rectángulos libres del tablero | Reconstruye `freeRects`/`fronterasKerf` tras cualquier cambio de acomodo | **~25 líneas (4024-4048)** | `reconstruirSobrantesYFronteras`, `recalcularFreeRectsDesdeCero` | `obtenerAreaColocacionBoard` (board-area.js), `crearFronterasEntrePiezas/PiezaSobrante/Exteriores` (board-analysis.js), `calcularRectsLibresDesdeObstaculos` (free-rectangles.js) — **las 4 ya expuestas** | No | No (opera sobre `board` recibido) | No | Bajo | **Bajo** | Sí, completo y ya desbloqueado |
| 21 | Edición manual del diagrama | Colisión, rotar, espejar, compactar, imanes | ~260 líneas (4049-4308) | `piezasSeEncimanConOtras`, `rotarPieza`, `espejarBoard`, `espejarBoardHorizontal`, `compactarHacia*` (×4), `calcularImanes` | `obtenerAreaColocacionBoard` (board-area.js), `calcularFreeRectsPara` (board-analysis.js), y el grupo 20 (mismo archivo) | No | No (opera sobre `board`) | No | Medio | Medio | Sí, casi completo (depende del grupo 20) |
| 22 | Render / interacción de pantalla | Pestañas, inserción del SVG, listeners de arrastre | ~129 líneas (4309-4437) | `activarPiezasArrastrables`, `renderDiagrama`, `recalcularDebounced` | `dibujarBoard` (board-renderer.js), `calcularSobrantes`/`areaSobranteTotal` (board-analysis.js) | Muy alto | Sí (lee/escribe `state.boards`/`activeTab`) | Llama a `recalcular` (indirecto vía debounce) | Muy alto | Alto | No — coordinador final del subsistema SVG |
| 23 | Reporte de costos (plantillas) | 4 diseños de tarjeta de precio + helpers de HTML | ~163 líneas (4438-4600) | `renderReporte`, `totalBarHtml`, `lineasMaterialHtml/TapaHtml/ComponentesHtml`, `renderReporteColumnas/Lista/Tarjetas/Factura` | `fmt`, `fmtMoney` (format.js) | Medio (solo escritura de HTML) | No directo (recibe `datos` ya armado) | No | Medio | Medio | Sí |
| 24 | `recalcular()` | Coordinador central: valida, empaqueta, dibuja, calcula costos | **~274 líneas (4601-4874)** | `recalcular` | Prácticamente todos los módulos, indirectamente | Muy alto | Sí (lectura y escritura total) | Es la función | Máximo | **Crítico** | No aplica — es el coordinador raíz |
| 25 | Ajustes menores de interfaz | Medida de tablero editable, notas colapsables, checkbox de márgenes | ~68 líneas (4875-4942) | `actualizarMedidaTablero`, `attachToggleNota` + listeners | `obtenerControlesMargenesExteriores`/`actualizarControlesMargenesExteriores` (hierarchical-config.js) | Alto | No | Indirecto | Medio | Bajo | Sí, pequeño |
| 26 | Carga diferida de librerías | Inserta `<script>` de ExcelJS/JSZip solo cuando hace falta | ~68 líneas (4943-5011) | `cargarExcelJS`, `cargarJSZip` | Ninguna | Sí (mínimo) | No | No | Bajo | **Bajo** | Sí, completo |
| 27 | Exportación DXF (coordinador) | Genera y descarga el ZIP de archivos DXF | ~40 líneas (5012-5051) | `exportarDXFZip` | `construirDXFTablero`, `nombreArchivoSeguro` (dxf-export.js), `cargarJSZip` (grupo 26, mismo archivo) | Sí | Sí (lee `state.boards`) | **Sí, la llama primero** | Alto | Medio | Sí, ya reducido al mínimo posible |
| 28 | Exportación Excel (lectura + construcción + coordinador) | Arma y descarga el libro de Excel completo | **~619 líneas (5052-5670)** | `leerPiezasParaExportar`, `construirLibroExcel` (con 16 closures internas), `exportarExcel` | `textoSeguroParaExcel` (board-area.js), `fuenteAExcel`/`fmt`/`fmtMoney` (format.js), `generarDiagramasParaExcel` (excel-diagrams.js), `cargarExcelJS` (grupo 26), `calcularSobrantes`/`areaSobranteTotal` (board-analysis.js) | Alto | Sí (lee `state.boards`/`ultimoReporte`) | **Sí, la llama primero** | Muy alto | **Crítico** | No — `construirLibroExcel` no es separable sin reescritura (16 closures) |
| 29 | Redimensionamiento + inicialización final | Columnas arrastrables de la tabla de piezas, divisor de panel, arranque | ~97 líneas (5671-5767) | `activarColumnasRedimensionables`, `activarDivisorColumnas` + 3 líneas finales | Ninguna | Sí | No | La última línea del archivo llama `recalcular()` una vez | Bajo | Bajo | Sí, completo |

# 3. Roadmap actualizado — clasificación por prioridad

## Muy recomendable

| Grupo | Por qué |
|---|---|
| **20 — Sobrantes y rectángulos libres del tablero** | Las 4 dependencias ya están expuestas (`board-area.js`, `board-analysis.js`, `free-rectangles.js`); 25 líneas; sin DOM ni `state` directo; mismo patrón de "efecto secundario controlado" ya usado con éxito en `dibujarBoard` (muta `board`, no `state` global). Es, con evidencia, la extracción de menor riesgo disponible hoy. |
| **21 — Edición manual del diagrama** | Sus dos dependencias geométricas (`obtenerAreaColocacionBoard`, `calcularFreeRectsPara`) ya están expuestas; su tercera dependencia real (el grupo 20) queda resuelta en cuanto se complete el punto anterior. Sin DOM, sin `state` directo — solo muta el `board` recibido, patrón ya validado 3 veces en esta serie. |
| **26 — Carga diferida de librerías** | `cargarExcelJS` y `cargarJSZip` son dos implementaciones del mismo patrón, ya analizadas en detalle en los reportes 30 y 34; sin `state`; DOM mínimo (solo inserción de `<script>`); riesgo bajo demostrado. |

## Recomendable

| Grupo | Motivo |
|---|---|
| 27 — Exportación DXF (coordinador) | Ya reducida a su mínimo posible (40 líneas); depende del grupo 26, así que conviene extraerlo justo después. |
| 3 — Utilidades de tablero (no puras) | Pequeño, pero requiere decidir explícitamente cómo exponer una dependencia de `document`/`state` — buen ejercicio antes de abordar grupos más grandes con el mismo patrón. |
| 12 — Personalización | Grande pero autocontenido: no depende del optimizador ni de `state.boards`, solo de `document`/`localStorage`. |
| 15 — Selector visual de cantos | Trivial, autocontenido, sin riesgo relevante. |
| 25 — Ajustes menores de interfaz | Pequeño y autocontenido, aunque de bajo impacto en el tamaño total. |
| 29 — Redimensionamiento + inicialización final | Sin `state`, sin `recalcular()` directo, funcionalmente aislado del resto. |
| 23 — Reporte de costos (plantillas) | Recibe `datos` ya calculado por parámetro; no toca `state.boards`; su mayor riesgo es de tamaño/transcripción, no de acoplamiento. |
| 13 — Combobox buscable | Autocontenido, aunque con alta densidad de DOM. |
| 14 — Crear catálogo desde buscador | Autocontenido, pequeño. |

## Conviene esperar

| Grupo | Motivo |
|---|---|
| 2 — Identidad y SKU de catálogos | Comparte límite difuso con el grupo 4 (Catálogos); mejor evaluarlos juntos en una sola decisión arquitectónica, no por separado. |
| 4 — Catálogos | Igual que el anterior; además, es llamado desde el grupo 11 (aplicación atómica), que también sigue sin extraer. |
| 5 — Componentes del proyecto | Acoplado a los mismos patrones de edición de catálogo que los grupos 2 y 4. |
| 6 — Interfaz general y menús | Gran volumen de listeners entremezclados con otros paneles; conviene abordarlo después de que los paneles que controla (catálogos, personalización, importación) ya estén modularizados. |
| 7 — Exportación de formato de proyecto | Autocontenido en sí mismo, pero de bajo valor marginal mientras los grupos 8-11 (todo el resto de importación/exportación de piezas) sigan sin resolverse — mejor abordarlos como un solo frente. |
| 8, 9, 10, 11 — Importación Excel (piezas, catálogo, vista previa, aplicación atómica) | Forman, en conjunto, el subsistema de importación más grande y más entrelazado del archivo (~1425 líneas combinadas); el grupo 11 en particular es **Crítico** (aplica cambios "todo o nada" a `state` y llama a `recalcular()`). No deben extraerse por partes sueltas — requieren un análisis dedicado propio, al estilo de los ya hechos para DXF/Excel/SVG, antes de tocar nada. |
| 16 — Filas de piezas | Muy grande (348 líneas) y con la dependencia arquitectónica más profunda de todo el archivo: no existe `state.piezas`, las piezas viven solo en el DOM. Extraerlo sin resolver esa decisión de diseño solo mueve el acoplamiento, no lo reduce. |
| 17 — Validación de proyecto | Coordinador que lee el DOM completo del formulario; depende de que el grupo 16 (y los catálogos) tengan un contrato de datos más estable antes de aislarlo con seguridad. |
| 18 — Lectura de piezas | Mismo motivo que el grupo 17 — es el "traductor" DOM→optimizador, íntimamente ligado a la decisión pendiente sobre `state.piezas`. |
| 19 — Optimización / empaquetado | Sin acoplamiento a DOM/`state` (candidata técnica excelente), pero su tamaño (556 líneas) y densidad algorítmica (closures locales, múltiples criterios de orden) ameritan un análisis dedicado propio antes de intentarlo — el mismo criterio ya aplicado a DXF y Excel antes de extraerlos. |
| 22 — Render / interacción de pantalla | Coordinador final del subsistema SVG; debe esperar a que el grupo 21 (edición manual) ya esté modularizado, para no tener que tocar dos capas a la vez. |

## No conviene modularizar (por ahora)

| Grupo | Motivo |
|---|---|
| 1 — Estado e inicialización | No es un subsistema extraíble; es el sustrato compartido por todo lo demás. Cualquier cambio aquí es un rediseño de arquitectura de estado, no una extracción mecánica. |
| 24 — `recalcular()` | Coordinador raíz; por diseño, debe ser lo último en tocarse, cuando todo lo que coordina ya viva en módulos estables. |
| 28 — Exportación Excel (`construirLibroExcel`) | Ya analizada en profundidad (reporte de análisis Excel, previo al reporte 34): 502 líneas con 16 funciones internas que cierran sobre variables locales (colores, hojas), no extraíbles sin una reescritura real. No es candidata a extracción mecánica con el patrón actual. |

# 4. Los tres mejores candidatos — por qué son el siguiente paso natural

1. **Grupo 20 — Sobrantes y rectángulos libres del tablero** (`reconstruirSobrantesYFronteras`, `recalcularFreeRectsDesdeCero`). Es la única pieza del árbol de dependencias de todo el subsistema de diagramas que queda "colgando" con sus cuatro dependencias ya resueltas y expuestas — literalmente no hay ningún trabajo previo pendiente. Extraerla no solo reduce 25 líneas de `main.js`; **desbloquea por completo** al grupo 21 (edición manual), que hoy depende de ella.
2. **Grupo 21 — Edición manual del diagrama** (`rotarPieza`, `espejarBoard`, `compactarHacia*`, `calcularImanes`, `piezasSeEncimanConOtras`). Es el segundo eslabón natural inmediatamente después del grupo 20: sus otras dos dependencias (`obtenerAreaColocacionBoard`, `calcularFreeRectsPara`) ya están expuestas desde hace varios reportes. Completar este grupo deja el subsistema SVG con una sola pieza pendiente de extraer (el coordinador `renderDiagrama`/`activarPiezasArrastrables`, grupo 22), en vez de las cuatro capas que existían al inicio de este análisis.
3. **Grupo 26 — Carga diferida de librerías** (`cargarExcelJS`, `cargarJSZip`). No depende de nada del subsistema de diagramas — es un candidato independiente y trivialmente seguro (mismo patrón ya usado dos veces, sin `state`, DOM mínimo). Se recomienda como tercer paso porque puede ejecutarse en paralelo lógico con los dos anteriores (no comparte archivo destino ni dependencias con ellos) sin ningún riesgo de interferencia, y cierra el último cabo suelto de la familia de módulos `dxf`/`excel` ya construida.

# 5. Estado general

- **Tamaño aproximado restante de `main.js`**: 5767 líneas.
- **Porcentaje aproximado ya modularizado**: **17.3%** del tamaño original (6972 → 5767 líneas movidas fuera de `main.js`). El conjunto de los 15 módulos ya extraídos suma 1461 líneas propias (incluyendo el código de exportación `window.ProyCutXxx` y las referencias explícitas a otros módulos de cada archivo, que no existían como líneas separadas en el original) — el crecimiento total del proyecto (main.js + módulos = 7228 líneas, más que las 6972 originales) es esperado y no representa duplicación: es el costo de boilerplate de modularización (envoltorio IIFE + objeto de exportación + bloques de desestructuración) ya aceptado explícitamente en cada tarea anterior.

- **Principales zonas de riesgo que siguen centralizadas**:
  1. **`recalcular()`** (274 líneas) — sigue siendo el único punto que escribe `state.boards`, `state.activeTab`, `state.ultimoTotal` y `state.ultimoReporte` a la vez, y el disparador final de casi cualquier interacción del usuario.
  2. **`construirLibroExcel`** (502 líneas, 16 closures internas) — la función más grande y más internamente compleja de todo el archivo; confirmada como no extraíble sin reescritura.
  3. **Ausencia de `state.piezas`** — las piezas del proyecto siguen viviendo exclusivamente en el DOM (`#piezasBody`); esta decisión de diseño (no un defecto) sigue bloqueando cualquier extracción limpia de los grupos 16, 17 y 18.
  4. **Mutación de `state.boards` por dos caminos distintos** — el optimizador (`recalcular()`, reconstrucción completa) y la edición manual (grupos 20/21, mutación in-place) siguen coexistiendo, tal como se documentó en el roadmap original; nada de lo extraído desde entonces ha alterado ni resuelto esta dualidad.
  5. **El subsistema de importación** (grupos 8-11, ~1425 líneas combinadas) sigue siendo, en volumen, el segundo bloque más grande sin extraer después de la exportación a Excel, con una operación "todo o nada" (`aplicarPiezasPendientes`) que escribe `state` en bloque.

- **¿Ya existe un punto donde continuar extrayendo deje de aportar valor?** **Sí, y ya es visible en este inventario.** El patrón mecánico usado en las trece extracciones anteriores (evaluar pureza → extraer vía `sed` → comparar byte a byte → probar en sandbox → reportar) funciona de forma segura y de bajo costo mientras existan funciones **puras o casi puras** con dependencias ya resueltas — eso es exactamente lo que queda en los grupos "Muy recomendable" y buena parte de "Recomendable" (aproximadamente 500-600 líneas combinadas entre los grupos 3, 12, 13, 14, 15, 20, 21, 23, 25, 26, 27, 29). **Más allá de ese conjunto, el resto de `main.js` (~4500 líneas) está compuesto casi en su totalidad por coordinadores atados a `document`/`state` por diseño** (catálogos, filas de piezas, validación, importación, `recalcular()`, exportación Excel). Para esos grupos, la extracción mecánica de "mover código sin cambiar comportamiento" **deja de reducir acoplamiento real** — solo reubica el mismo acoplamiento en otro archivo, sin resolver las preguntas arquitectónicas de fondo (¿existe `state.piezas`? ¿se separan interfaz y lógica de negocio en los catálogos? ¿se acepta reescribir `construirLibroExcel` para eliminar sus closures?). Continuar extrayendo esos grupos con el mismo patrón mecánico, sin antes tomar esas decisiones, tiene un costo de riesgo creciente (más DOM, más `state`, más código por commit) con un beneficio arquitectónico decreciente. Esta es la señal de que, después de completar los tres candidatos de la sección 4, **la siguiente fase de modularización debe ir precedida de un análisis de decisión arquitectónica** (como los ya hechos para el subsistema SVG y para Excel) antes de continuar con extracciones mecánicas.

# 6. Resumen final

- **Cantidad de elementos identificados en este inventario**: 29 grupos.
- **Funciones puras/pura-mente extraíbles**: 8 (todas las de los grupos 20 y 21, más las 2 de "carga diferida").
- **Funciones acopladas**: el resto — mayoritariamente coordinadores atados a `document`/`state` por diseño.
- **Módulos candidatos priorizados**: 3 "Muy recomendable", 9 "Recomendable", 12 "Conviene esperar", 3 "No conviene modularizar".
- **Primer cambio recomendado**: extraer el grupo 20 (`reconstruirSobrantesYFronteras`, `recalcularFreeRectsDesdeCero`) a un archivo de geometría (por ejemplo, ampliando `src/scripts/geometry/board-analysis.js` o creando `src/scripts/geometry/board-offcuts-state.js`, decisión a tomar en la tarea de extracción).
- **Riesgo principal**: el punto de retorno decreciente ya está a la vista — una vez agotados los ~500-600 líneas de grupos puros/casi puros restantes, cualquier extracción adicional requiere primero una decisión arquitectónica (estado de piezas, separación de interfaz/negocio en catálogos, o aceptar reescribir `construirLibroExcel`), no solo una extracción mecánica más.
