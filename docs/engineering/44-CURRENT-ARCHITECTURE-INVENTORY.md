# 44 — Inventario arquitectónico actual

## Estado

Final para cierre de la modularización previa a Supabase.

## Versión

1.0

## Última actualización

2026-08-05

## Alcance

Este inventario describe el estado real posterior a los reportes 37–43. Es un documento de transición: no redefine el dominio futuro completo descrito en `07-DATABASE.md`, no propone reescribir el prototipo y no convierte resultados calculados en fuentes de verdad.

## 1. Resumen ejecutivo

ProyCut sigue siendo un monolito frontend clásico, ejecutado en navegador mediante scripts ordenados y objetos `window.ProyCut*`. La modularización ya separó utilidades, geometría, análisis de tableros, render SVG, DXF, apoyo de Excel, costos, lectura de piezas, modelo temporal, preparación, coordinación de optimización, aplicación de resultados y render del reporte. El flujo principal permanece coordinado desde una IIFE en `main.js`.

- `main.js`: **5,497 líneas**.
- JavaScript bajo `src/scripts/`: **23 archivos** en total: `main.js` y **22 módulos extraídos**.
- Responsabilidades separadas con contratos utilizables: validación y normalización, configuración jerárquica, geometría, costos, renderizadores, lectura de piezas, modelo temporal y tres fases del pipeline de proyecto.
- Responsabilidades centralizadas: catálogos y sus identidades, importación CSV/Excel, construcción del libro Excel, optimizador concreto, edición interactiva de boards, controladores/listeners de UI, preferencias y coordinación final.
- Persistencia actual: solo preferencias visuales en `localStorage`; el proyecto operativo vive en DOM, `state` y variables del cierre.

**Decisión:** el proyecto está suficientemente modularizado para comenzar una integración incremental con Supabase, siempre que el primer paso sea definir el contrato y colocar la infraestructura fuera de `main.js`. No está listo para reemplazar de una vez el modo local, introducir Auth, migrar todos los catálogos o persistir resultados derivados.

## 2. Árbol actual de módulos

```text
src/scripts/
├── config/
│   ├── hierarchical-config.js
│   ├── limits.js
│   └── project-format.js
├── costing/
│   └── calculate-costs.js
├── dxf/
│   └── dxf-export.js
├── excel/
│   ├── excel-diagrams.js
│   └── excel-utils.js
├── geometry/
│   ├── basic-geometry.js
│   ├── board-analysis.js
│   ├── board-area.js
│   └── free-rectangles.js
├── pieces/
│   ├── pieces-dom-reader.js
│   └── project-model.js
├── project/
│   ├── apply-project-results.js
│   ├── optimize-project.js
│   └── prepare-project.js
├── reports/
│   └── report-renderer.js
├── svg/
│   └── board-renderer.js
├── utils/
│   ├── csv.js
│   ├── format.js
│   ├── text-normalization.js
│   └── validation.js
└── main.js
```

### `config/`

| Archivo | Responsabilidad y API pública | Dependencias / consumidores | Acceso y estabilidad |
|---|---|---|---|
| `hierarchical-config.js` | Resolución y validación jerárquica de configuración. Expone `ProyCutHierarchicalConfig`: constantes de niveles, claves, reglas y configuraciones; helpers de clonado/mezcla/lectura; `validarConfiguracionEtapa4`, `resolverConfiguracionJerarquica`, `resolverValorPorJerarquia`, `leerNumeroConfiguracionCorte`, `obtenerControlesMargenesExteriores`, `actualizarControlesMargenesExteriores`, `crearConfiguracionProyectoCorteActual`, `fuentesConfiguracionCorteActual`, `mensajesParametrosCorte`, `resolverParametrosCorteEtapa4`. | No depende de otro módulo. `main.js` consume controles y resolución de parámetros. | Accede directamente a `document` en su adaptador de controles; no usa `state` ni `localStorage`. **Media**: núcleo estable, frontera DOM sensible. |
| `limits.js` | Constantes de límites. Expone `ProyCutLimits`. | Consumido por validación, CSV y `main.js`. | Sin DOM/estado/persistencia. **Alta**. |
| `project-format.js` | Encabezado canónico de archivos. Expone `ProyCutProjectFormat.ENCABEZADO_FORMATO`. | Consumido por CSV y `main.js`. | Puro. **Alta**. |

### `costing/`

| Archivo | Responsabilidad y API pública | Dependencias / consumidores | Acceso y estabilidad |
|---|---|---|---|
| `calculate-costs.js` | Valida parámetros económicos y calcula `datosReporte`. Expone `ProyCutCosting.calcularCostosProyecto`. | Depende de `ProyCutFormat`; lo consume `recalcular()`. | No accede a DOM, `state` o `localStorage`, ni muta entradas. **Alta**. |

### `dxf/`

| Archivo | Responsabilidad y API pública | Dependencias / consumidores | Acceso y estabilidad |
|---|---|---|---|
| `dxf-export.js` | Construye texto DXF y nombres seguros. Expone `grupoDxf`, `polilineaRectDxf`, `construirDXFTablero`, `nombreArchivoSeguro`. | Sin dependencia modular; consumido por la exportación DXF de `main.js`. | Puro. **Alta**. |

### `excel/`

| Archivo | Responsabilidad y API pública | Dependencias / consumidores | Acceso y estabilidad |
|---|---|---|---|
| `excel-diagrams.js` | Convierte SVG a PNG y prepara imágenes para Excel. Expone `DIAGRAMAS_POR_HOJA`, `ESCALA_IMPRESION_PIEZAS`, `FILAS_DISPONIBLES_DIAGRAMAS`, `svgAPngBuffer`, `generarDiagramasParaExcel`. | Depende de `ProyCutBoardRenderer` y `ProyCutExcelUtils`; consumido por `exportarExcel`. | Usa infraestructura del navegador (`document.createElement('canvas')`, `Image`, `Blob`, `URL`); no usa `state`/`localStorage`. **Alta con sensibilidad de navegador**. |
| `excel-utils.js` | Fecha legible, dimensiones SVG y copia de datos. Expone `fechaLegibleHoy`, `extraerDimensionesSvg`, `copiarDatosParaExcel`. | Consumido por Excel y `main.js`. | Sin DOM/estado; la fecha depende del reloj. **Alta**. |

### `geometry/`

| Archivo | Responsabilidad y API pública | Dependencias / consumidores | Acceso y estabilidad |
|---|---|---|---|
| `basic-geometry.js` | Rectángulo útil, rectángulo de colocación, huella y capacidad lineal con kerf. Expone esas cuatro funciones. | Consumido por validación, lectura y optimizador en `main.js`. | Puro. **Alta**. |
| `free-rectangles.js` | Intersección, resta, fusión, contención, poda y cálculo de rectángulos libres. Expone seis funciones. | Consumido por `board-analysis` y edición/optimizador en `main.js`. | Puro. **Alta**. |
| `board-area.js` | Área de colocación, kerf del material y textos/resumen auxiliares. Expone `obtenerAreaColocacionBoard`, `obtenerKerfMaterial`, `textoSeguroParaExcel`, `resumenErrores`. | Consumido por `board-analysis`, exportaciones y `main.js`. | Puro. **Alta**. |
| `board-analysis.js` | Sobrantes, área, cortes, rectángulos libres y fronteras. Expone siete funciones de análisis. | Depende de `ProyCutFreeRectangles` y `ProyCutBoardArea`; consumido por optimización, edición, SVG y exportación. | Sin DOM/estado/persistencia. **Alta**. |

### `pieces/`

| Archivo | Responsabilidad y API pública | Dependencias / consumidores | Acceso y estabilidad |
|---|---|---|---|
| `pieces-dom-reader.js` | Captura una instantánea textual de filas de piezas. Expone `ProyCutPiecesDomReader.leerFilasPiezasDesdeDOM`. | Sin módulo directo; consumido por `construirModeloProyecto`, validación y exportación. | Lee `#piezasBody`; no escribe DOM ni usa estado/persistencia. **Media-alta**, sensible al marcado. |
| `project-model.js` | Construye `{ filas, cantidadProyectos }` para un ciclo. Expone `ProyCutProjectModel.construirModeloProyecto`. | Recibe lector y proveedor de cantidad; consumido por `recalcular()`. | Sin DOM directo, estado o persistencia. **Alta**, pero su contrato será la frontera de hidratación. |

### `project/`

| Archivo | Responsabilidad y API pública | Dependencias / consumidores | Acceso y estabilidad |
|---|---|---|---|
| `prepare-project.js` | Coordina validación, parámetros y expansión de piezas. Expone `ProyCutProjectPreparation.prepararProyectoParaOptimizacion`. | Todas sus dependencias son callbacks/datos inyectados; consumido por `recalcular()`. | Sin DOM/estado/persistencia propios. **Alta**, contrato sensible. |
| `optimize-project.js` | Agrupa por material, actualiza dimensiones activas y coordina el empaquetador existente. Expone `ProyCutProjectOptimization.optimizarProyectoPreparado`. | Recibe `empacarMaterial`, medidas y callback; consumido por `recalcular()`. | Sin DOM/estado/persistencia. **Alta como coordinador**; el algoritmo inyectado sigue sensible. |
| `apply-project-results.js` | Aplica boards y luego el resultado económico, conservando el orden de efectos. Expone `ProyCutProjectResults.aplicarResultadoOptimizacion` y `aplicarResultadoCostos`. | Recibe `state`, referencias DOM y callbacks; consumido por `recalcular()`. | Muta explícitamente el estado y DOM recibidos, no los busca globalmente. **Alta**, frontera crítica. |

### `reports/`

| Archivo | Responsabilidad y API pública | Dependencias / consumidores | Acceso y estabilidad |
|---|---|---|---|
| `report-renderer.js` | Genera HTML para las cuatro plantillas de reporte. Solo expone `ProyCutReportRenderer.renderReporte`. | Depende de `ProyCutFormat`; consumido por aplicación de costos. | Puro; sin DOM/estado/persistencia. **Alta**. |

### `svg/`

| Archivo | Responsabilidad y API pública | Dependencias / consumidores | Acceso y estabilidad |
|---|---|---|---|
| `board-renderer.js` | Construye SVG del tablero. Expone `ProyCutBoardRenderer.dibujarBoard`. | Consumido por diagrama y Excel. | No accede al DOM ni persistencia; escribe `board._geom`, geometría efímera usada por drag. **Alta con mutación derivada conocida**. |

### `utils/`

| Archivo | Responsabilidad y API pública | Dependencias / consumidores | Acceso y estabilidad |
|---|---|---|---|
| `format.js` | Formato numérico/monetario, metros, color ARGB y fuentes CSS/Excel. Expone seis funciones. | Consumido por costos, reportes, SVG/Excel y `main.js`. | Puro. **Alta**. |
| `validation.js` | Validación de número, cantidad, medida y precio. Expone cuatro funciones. | Depende de `ProyCutLimits`; consumido por preparación/UI. | Puro. **Alta**. |
| `text-normalization.js` | Normaliza SKU, nombres, giro y valores afirmativos. Expone cinco funciones. | Consumido por catálogos e importadores. | Puro. **Alta**. |
| `csv.js` | Separa y analiza CSV. Expone `separarLineaCSV`, `parsearCSV`. | Depende de formato de proyecto y límites; consumido por importación. | Puro. **Alta**. |

## 3. Mapa de dependencias

Leyenda: `[D]` dominio/cálculo, `[I]` infraestructura, `[UI]` interfaz, `[C]` coordinación.

```text
limits [D] ──→ validation [D] ──→ main/validarProyecto [UI+C]
       └────→ csv [D] ─────────→ main/importación [UI+I]
project-format [D] ────────────→ csv [D]
              └───────────────→ main/importación-exportación [I]

format [D] ──→ costing/calculate-costs [D]
       ├────→ reports/report-renderer [UI de presentación pura]
       └────→ main + Excel [UI+I]

free-rectangles [D] ──→ board-analysis [D]
board-area [D] ───────→ board-analysis [D]
basic-geometry [D] ───→ main/validación-empaquetado [D+C]
geometry/* [D] ───────→ main/edición de boards [UI+C]

board-renderer [UI pura] ──→ main/renderDiagrama [UI]
              └────────────→ excel-diagrams [I]
excel-utils [I] ────────────→ excel-diagrams [I]
excel-diagrams [I] ─────────→ main/exportarExcel [I+C]
dxf-export [I] ─────────────→ main/exportarDXFZip [I+C]

pieces-dom-reader [UI] ──→ project-model [C]
project-model [C] ───────→ recalcular [C]
recalcular [C] ──────────→ prepare-project [C]
prepare-project [C] ─────→ optimize-project [C]
optimize-project [C] ────→ main/empacarMaterial [D]
                         └→ apply-project-results [C+UI]
costing [D] ─────────────→ apply-project-results [C+UI]
report-renderer [UI pura] → apply-project-results [C+UI]
apply-project-results ────→ state + paneles + renderDiagrama
```

No hay repositorios, cliente HTTP ni dependencia de Supabase en el grafo actual. La comunicación entre módulos se realiza por globals ordenados en `index.html`; `main.js` es el compositor.

## 4. `main.js` actual

Los rangos son aproximados y corresponden al archivo de 5,497 líneas analizado.

| Rango | Bloque / funciones principales | DOM, estado y listeners | Dependencias / riesgo / decisión |
|---|---|---|---|
| 1–127 | Importación de APIs globales | Sin efectos; captura funciones en el cierre. | Depende de los 22 módulos. Riesgo bajo; mantener como composición mientras no haya bundler. |
| 128–393 | Variables, `state`, identidad y SKU de catálogos | Muta catálogos, metadatos, referencias de componentes y lee inputs SKU; listeners de input/blur. | Normalización. Riesgo alto por IDs locales y referencias; mantener hasta definir IDs remotos y mapeo. |
| 394–727 | Render y edición de materiales, tapacantos, componentes y componentes del proyecto | Creación masiva de DOM; muta cuatro arreglos de `state`; listeners CRUD. | Formato/validación. Riesgo alto; candidato a controladores de catálogo, pero después del contrato persistente. |
| 728–934 | Navegación, menús, paneles y acciones aún simuladas | Clases/visibilidad, listeners globales y botones. | UI pura. Riesgo medio por comportamiento cruzado; no bloquea Supabase. |
| 935–1068 | Descarga del formato Excel | Lee piezas/estado, construye workbook y descarga Blob. | ExcelJS y formato. Constructor aún acoplado; riesgo medio-alto. Puede esperar. |
| 1069–1430 | Lectura y validación de Excel de proyecto/catálogo | File/ExcelJS, transforma hojas; no aplica hasta vista previa. | Límites, normalización y formato. Riesgo alto por esquemas e identificación. Mantener. |
| 1431–2379 | Vista previa y aplicación atómica de importación | DOM modal/tablas; variables temporales; reemplaza catálogos y proyecto solo al confirmar. | Catálogos, validación. Riesgo muy alto; no mezclar con primera persistencia. |
| 2380–2495 | Orquestación de importación CSV/Excel | `FileReader`, inputs, estados visuales y paneles. | CSV/Excel. Riesgo alto; puede esperar. |
| 2496–2680 | Preferencias visuales | Lee/escribe `localStorage`, controles y variables CSS; listeners de cambio. | Format. Riesgo medio; mantener local en fase 1. |
| 2681–2929 | Refresco de selects, combo buscable y modal de alta | DOM flotante; crea registros en catálogos de `state`. | Normalización/validación. Riesgo alto por CRUD y referencias. Mantener. |
| 2930–3277 | Filas de piezas, cantos, giro, teclado y renumeración | DOM de `#piezasBody`, listeners por fila, `pieceCounter`; recalcula. | Lectura de piezas, catálogos. Riesgo alto: frontera de hidratación. Extraer controlador después de carga remota funcional. |
| 3278–3515 | Layout, cantidad/nivel, validación y lectura de piezas | Lee controles, tablas y modelo temporal; presenta errores. | Config, límites, validación, geometría, lector DOM. Riesgo alto; `validarProyecto` aún mezcla UI y dominio. Mantener por ahora. |
| 3516–4060 | Algoritmos de orden y empaquetado | No listeners; usa dimensiones y piezas; produce boards. | Geometría. Riesgo muy alto por equivalencia algorítmica; no tocar en fase Supabase. |
| 4061–4424 | Reconstrucción y edición interactiva de boards | Muta piezas/boards derivados; drag, rotación, espejo, compactación; listeners sobre SVG. | Geometría/análisis. Riesgo muy alto; no persistir ni mover ahora. |
| 4425–4475 | `renderDiagrama` y debounce | Lee `state.boards/activeTab`, crea tabs y listener por tab, escribe SVG. | BoardRenderer. Riesgo medio; UI legítima, mantener. |
| 4476–4604 | `recalcular()` | Lee modelo/controles; limpia o aplica `state`; muestra/oculta paneles. | ProjectModel, Preparation, Optimization, Results, Costing, ReportRenderer. Riesgo crítico; debe seguir como fachada de coordinación durante fase 1. |
| 4605–4677 | Controles de corte, notas, espejo y resize | Muchos listeners; actualiza `BOARD_W/H` y boards derivados. | Config/geometría. Riesgo medio-alto; mantener. |
| 4678–4741 | Carga diferida de ExcelJS/JSZip | Inyecta scripts y cachea promesas. | Infraestructura externa. Riesgo alto por red/runtime; no mezclar con Supabase. |
| 4742–4781 | Exportación DXF ZIP | Lee boards derivados, genera Blob/descarga. | DXF + JSZip. Riesgo medio; estable para usuario. |
| 4782–5308 | Lectura de piezas y constructor de libro Excel | Lee DOM, reporte, boards y preferencias; arma hojas/estilos. | ExcelUtils. Riesgo alto por tamaño y formato; buen candidato posterior, no bloqueante. |
| 5309–5400 | Orquestación de exportación Excel/confirmación | DOM, carga librería, snapshots, Blob; consume `ultimoReporte`. | ExcelDiagrams y constructor. Riesgo medio-alto; mantener. |
| 5401–5497 | Redimensionado de columnas, divisor e inicio | Listeners mouse; primera llamada a `recalcular()`. | UI/layout. Riesgo bajo-medio; no tiene valor para persistencia. |

## 5. Estado y fuentes de verdad

| Dato | Ubicación real | Representaciones y autoridad actual |
|---|---|---|
| Piezas | Filas DOM `#piezasBody`; modelo temporal; objetos expandidos para optimización; copias de exportación | El DOM es la fuente editable. `leerFilasPiezasDesdeDOM()` crea snapshot textual; preparación valida/expande; boards contienen copias colocadas. Hay múltiples representaciones. |
| Materiales | `state.materiales`; tabla DOM; filas de piezas guardan nombre; importación crea copias temporales | `state.materiales` es el catálogo operativo; DOM es editor/render. Las piezas referencian material por nombre, no por ID estable remoto. |
| Tapacantos | `state.tapacantos`; tabla DOM; selección y lados en filas de piezas | `state.tapacantos` es catálogo; las piezas conservan tipo por texto. |
| Componentes | `state.componentes`; tabla DOM; copias de importación | Catálogo en `state`, con `idInterno`, SKU y metadatos locales. |
| Componentes del proyecto | `state.componentesProyecto`; tabla DOM | `state` es fuente; cada entrada combina referencia local y snapshot económico/nombre/cantidad. |
| Cantidad de proyectos | Input DOM `#cantidadProyectos`; `modeloProyecto.cantidadProyectos`; piezas expandidas | El input es fuente; el modelo es snapshot del ciclo. |
| Parámetros de corte | Controles DOM y configuración resuelta; `BOARD_W/H` como último tamaño válido; datos copiados a boards | Controles/configuración son fuente actual. Boards son derivados. |
| Preferencias | Controles DOM, objeto devuelto por `leerEstilo()`, CSS variables y `localStorage` | `localStorage` conserva el último snapshot visual; DOM es editor activo. |
| Boards | `state.boards`; `board._geom`; SVG renderizado | Totalmente derivados de entradas. `state.boards` habilita interacción/exportación, no es fuente de proyecto. |
| Reporte | `state.ultimoReporte`; HTML en `#reporteContenido` | `ultimoReporte` es snapshot derivado para que Excel use los mismos números; HTML es presentación. |
| Total | `state.ultimoTotal` y `ultimoReporte.total`; contenido visible | Derivado. `ultimoTotal` se preserva durante ciertos fallos tempranos de piezas, y se pone en cero en otros fallos. |
| Proyecto actual | No existe como entidad persistente única | Está distribuido entre DOM, cuatro catálogos/arreglos, controles, preferencias y variables del cierre. El modelo temporal solo contiene filas y cantidad. |
| Importados/exportados | `File`, `ArrayBuffer`, workbook, CSV parseado, vista previa temporal, Blob/XLSX/ZIP/DXF | Son representaciones de intercambio, no fuente permanente. La confirmación de importación actualiza DOM/`state`; exportar no muta el proyecto. |

Variables relevantes del cierre: `BOARD_W`, `BOARD_H`, `pieceCounter`, consecutivos/IDs de catálogo, datos de vista previa de importación, promesas cacheadas de ExcelJS/JSZip, temporizador de recálculo, temporizador de resize y estado efímero de combos/drag. Ninguna sobrevive a una recarga.

## 6. Pipeline principal

```text
DOM de piezas
  → ProyCutPiecesDomReader.leerFilasPiezasDesdeDOM
  → ProyCutProjectModel.construirModeloProyecto
  → ProyCutProjectPreparation.prepararProyectoParaOptimizacion
      → validarProyecto
      → resolverParametrosCorteEtapa4
      → leerPiezas
  → ProyCutProjectOptimization.optimizarProyectoPreparado
      → agrupar por material
      → empacarMaterial (algoritmo en main.js)
  → ProyCutProjectResults.aplicarResultadoOptimizacion
      → state.boards / state.activeTab
      → renderDiagrama
  → ProyCutCosting.calcularCostosProyecto
  → ProyCutProjectResults.aplicarResultadoCostos
      → ProyCutReportRenderer.renderReporte
      → state.ultimoReporte / state.ultimoTotal
  → renderDiagrama
      → ProyCutBoardRenderer.dibujarBoard
  → exportaciones
      → ExcelUtils + ExcelDiagrams + constructor Excel de main
      → DxfExport + JSZip
```

`recalcular()` captura las filas una sola vez por ciclo. La aplicación de boards y el primer render del diagrama ocurren antes del cálculo de costos; esta secuencia observable fue preservada deliberadamente. Exportar consume el estado derivado ya aplicado, no vuelve a inventar una fuente de verdad.

## 7. Escrituras a `state`

| Propiedad | Funciones/bloques que escriben | Motivo | Naturaleza | Supabase |
|---|---|---|---|---|
| `materiales` | render/listeners CRUD, altas desde combo, confirmación de importación | Editar o reemplazar catálogo | Fuente local de catálogo | No como parte automática del primer guardado; persistir referencia/snapshot mínimo y migrar catálogo después. |
| `tapacantos` | render/listeners CRUD y altas desde combo | Editar catálogo | Fuente local de catálogo | Igual: referencia/snapshot mínimo primero. |
| `componentes` | render/listeners CRUD, altas, identidad/SKU, confirmación de importación | Catálogo y metadatos | Fuente local | Fuera del primer proyecto mínimo salvo componentes seleccionados. |
| `componentesProyecto` | agregar, cambiar cantidad, quitar, actualizar referencias SKU, importación | Componentes asignados al proyecto | Fuente local del proyecto | Candidato, pero puede esperar si el primer alcance se limita a piezas/corte. Si se incluye, guardar filas explícitas, no subtotales. |
| `boards` | `aplicarResultadoOptimizacion`; rama inválida de `aplicarResultadoCostos`; limpieza temprana de `recalcular()` | Resultado de optimización o limpieza | Derivado | Recalcular; no persistir inicialmente. |
| `activeTab` | aplicación de optimización y click de pestañas | Selección visual de tablero | UI efímera | No persistir en fase 1. |
| `ultimoTotal` | éxito/error de aplicación económica; limpieza temprana condicional | Snapshot del último total válido | Derivado con semántica de continuidad | Recalcular; no persistir. |
| `ultimoReporte` | éxito/error económico y limpieza temprana | Snapshot coherente para UI/Excel | Derivado | Recalcular; no persistir. |

Además de asignaciones de propiedades raíz existen mutaciones internas: edición de campos de cada catálogo, `push`/`splice`, metadatos de SKU e identidad, actualización de cantidades y referencias de componentes. Esas mutaciones confirman que `state` no es inmutable ni transaccional.

### Semántica preservada de `ultimoTotal`

Si la preparación falla en la etapa `piezas`, `recalcular()` vacía boards y reporte pero **conserva `state.ultimoTotal`**. Para fallos de validación o parámetros de corte lo pone en cero. Si costos fallan, `aplicarResultadoCostos()` también lo pone en cero. En éxito toma `datosReporte.total`. La persistencia no debe “normalizar” accidentalmente esta conducta; el total se reconstruye al recalcular y no se guarda como dato de entrada.

## 8. Lecturas y mutaciones del DOM

| Subsistema | Accesos principales | Clasificación futura |
|---|---|---|
| Piezas | Crear/eliminar/renumerar filas, leer inputs, cantos y giro, navegación Enter | Inevitable para UI; la carga remota debe entrar por un hidratador de filas, no por el repositorio. |
| Catálogos | Render completo de tablas, edición y borrado, combos y modal de alta | El render es UI legítima; la autoridad exclusiva en DOM/`state` deberá ceder a un servicio/repositorio. |
| Configuración | Controles de corte, márgenes, tablero, precios, cantidad y calidad | UI legítima; al cargar se aplicarán valores persistidos antes de recalcular. |
| Importación | File inputs, vista previa, políticas y mensajes | UI/infraestructura legítima; no debe escribir directamente en Supabase en fase 1. |
| Reporte | Paneles, `innerHTML`, opciones de plantilla/diseño | UI legítima y derivada. |
| Diagrama | Tabs, contenedor SVG, drag, espejo, resize | UI legítima y derivada. |
| Exportación | Botones, lectura de metadatos/opciones, enlaces Blob temporales | UI/infraestructura legítima. |
| Navegación | Menús, hamburger, paneles y overlays | UI pura; no participa en persistencia. |
| Layout | Altura de tabla, ancho de columnas y divisor | UI pura; puede permanecer local. |

Deberán desaparecer como fuentes de persistencia las lecturas ad hoc de muchos controles desde acciones de guardar. Un servicio de proyecto debe recibir un snapshot explícito construido por un adaptador UI. No deben desaparecer los accesos que solo renderizan o gestionan interacción.

## 9. Persistencia actual

`localStorage` usa una sola clave: `occ_bamteck_estilo_v1`. Guarda colores, fuentes, tamaños, estilos de líneas/flechas, plantilla del reporte, diseño del total, visibilidad de botones/columna y dimensiones visuales de tabla. Los errores de lectura/escritura se absorben y se mantienen defaults.

Al recargar se pierden piezas, cantidad de proyectos, catálogos modificados, componentes del proyecto, parámetros de corte/precios, boards, pestaña activa, reporte, total y estado de importación. Solo las preferencias visuales enumeradas se restauran.

- Exportación manual: formato/proyecto y reporte a XLSX; diagramas embebidos; tableros a DXF dentro de ZIP.
- Importación manual: CSV de piezas, Excel de proyecto y Excel de catálogo, con vista previa para Excel.
- No guardar inicialmente: boards, geometría libre, sobrantes, fronteras, costos, reporte, SVG, PNG, Excel, DXF y estados de paneles.
- Candidatos Supabase: metadatos mínimos del proyecto, filas fuente de piezas, cantidad de proyectos, parámetros de corte y referencias/snapshots necesarios de material/tapacanto.

## 10. Módulos estables

Durante los tres primeros cambios de Supabase no deberían tocarse:

- `geometry/*`: contratos puros y cubiertos por las extracciones; producen datos reconstruibles.
- `dxf/*`: salida derivada e independiente de persistencia.
- `svg/*`: renderer aislado; su mutación `_geom` es efímera y conocida.
- `excel/excel-diagrams.js` y `excel-utils.js`: frontera de exportación, no necesaria para guardar/cargar.
- `costing/*`: cálculo puro; debe servir para comprobar que una carga reconstruye el mismo resultado.
- `reports/*`: presentación pura del resultado de costos.
- `project/prepare-project.js`, `optimize-project.js` y `apply-project-results.js`: contratos de coordinación recién estabilizados; constituyen el pipeline de regresión.
- `utils/*`, `config/limits.js` y `config/project-format.js`: funciones pequeñas, estables y reutilizables.

`config/hierarchical-config.js` también debe evitar cambios funcionales, aunque su adaptador DOM requerirá cuidado al hidratar parámetros. Estable no significa inmutable para siempre: significa fuera del alcance de la primera integración.

## 11. Módulos sensibles

- `pieces-dom-reader`: depende del contrato CSS/DOM de cada fila; una hidratación incompleta puede cambiar silenciosamente textos, cantos o giro.
- `project-model`: es el mejor snapshot del ciclo, pero hoy solo incluye filas y cantidad; ampliarlo sin versión rompería preparación y pruebas.
- `prepare-project`: separa errores de validación, parámetros y piezas; la carga debe producir exactamente las mismas entradas.
- `main.js`: combina UI, autoridad local y coordinación. Solo debe consumir un servicio de persistencia; nunca el cliente Supabase.
- Importadores: ya tienen sus propios esquemas, políticas, IDs temporales y aplicación atómica. Conectarlos a persistencia en el primer alcance generaría dos caminos de escritura.
- Catálogos: mezclan IDs internos, SKU, nombre y referencias legadas por texto. Requieren estrategia explícita antes de IDs UUID remotos.
- Preferencias: hoy toleran ausencia de almacenamiento y son locales al navegador. Migrarlas prematuramente agrega identidad de usuario y conflictos de sincronización.

## 12. Punto de integración con Supabase

Estructura recomendada para evaluar e implementar después de este inventario:

### `infrastructure/supabase-client.js`

- Responsabilidad: crear/configurar una única instancia del SDK y exponer disponibilidad controlada.
- Permitido: SDK Supabase, URL y clave pública publicable obtenidas de configuración; traducción mínima de error de inicialización.
- Prohibido: DOM, `state`, reglas de proyecto, tablas específicas, service-role key, secretos y renders.
- Global sugerido: `window.ProyCutSupabaseClient`.
- Consumidores: implementaciones de repositorio únicamente.

### `repositories/project-repository.js`

- Responsabilidad: implementar operaciones de datos para proyectos y piezas; mapear filas de base de datos a DTOs; manejar operaciones multi-tabla y errores.
- Permitido: `ProyCutSupabaseClient`, nombres de tablas, contexto explícito de empresa, mapeadores y contratos de persistencia.
- Prohibido: `document`, `state`, `recalcular`, render, preferencias visuales y cálculos de boards/costos.
- Global sugerido: `window.ProyCutProjectRepository`.
- Consumidores: servicio `project-persistence`, no botones.

### `project/project-persistence.js`

- Responsabilidad: fachada de caso de uso para guardar/cargar/listar; validar DTO, seleccionar repositorio remoto o modo local y devolver resultados explícitos.
- Permitido: repositorio inyectado, normalización/validación de contrato, DTO serializable y política de fallback acordada.
- Prohibido: SDK Supabase directo, selectores DOM, mutaciones de `state`, HTML y algoritmos derivados.
- Global sugerido: `window.ProyCutProjectPersistence`.
- Consumidores: un futuro controlador UI en `main.js` o módulo dedicado de guardar/cargar.

El punto exacto de conexión es: **controlador UI → `ProyCutProjectPersistence` → `ProyCutProjectRepository` → `ProyCutSupabaseClient`**. Para carga, el controlador recibe el DTO, hidrata DOM/controles mediante funciones de UI y llama `recalcular()` una vez.

## 13. Datos a persistir primero

El mínimo real debe representar una entrada reproducible, no todo el modelo empresarial futuro.

**Guardar en la primera fase funcional:**

- ID UUID y `company_id` explícito, nombre/título, versión de formato y timestamps del proyecto;
- filas de piezas en orden: cantidad, largo, ancho, material, giro, tipo de tapacanto, lados y cualquier etiqueta/número fuente necesario;
- `cantidadProyectos`;
- parámetros de corte que alteran el resultado: kerf, modo de corte, márgenes, dimensión de tablero seleccionada/efectiva, calidad y modos/precios necesarios para reconstruir costos;
- referencia de material/tapacanto cuando exista ID remoto y, durante transición, snapshot textual mínimo (SKU/nombre y dimensiones/precio relevantes) para no impedir una carga local;
- componentes del proyecto solo si se exige paridad económica desde la primera migración: referencia/snapshot, cantidad y precio fuente, nunca subtotal.

**No guardar inicialmente:** preferencias visuales (seguirán en `localStorage`), catálogos completos, boards, pestaña activa, `ultimoTotal`, `ultimoReporte`, geometría o archivos exportados.

El modelo corporativo objetivo exige `companies` y control de tenant. El primer dataset no debe fingir que el prototipo ya posee clientes, usuarios, roles o ramas en UI; esos prerrequisitos se resolverán en el plan y migraciones, con contexto de empresa explícito.

## 14. Datos derivados

- `boards`: salida del optimizador; reconstruible y sensible a versión algorítmica.
- `freeRects`: auxiliar mutable de colocación/edición.
- sobrantes y sus áreas: análisis de boards.
- fronteras y cortes: geometría calculada.
- costos, subtotales y total: resultado de entradas económicas y cantidades.
- reporte y HTML: presentación del cálculo.
- SVG/PNG: representación visual.
- Excel y DXF/ZIP: artefactos de exportación.

Persistirlos en la primera fase crearía duplicidad, problemas de versión y riesgo de mostrar resultados obsoletos. Si en el futuro se necesita auditoría histórica, deberá existir una versión inmutable explícita del cálculo/optimización, no reutilizar `state.boards` como verdad.

## 15. Contrato de persistencia recomendado

Todas las operaciones deben devolver `Promise<{ ok: true, ... } | { ok: false, error }>` y nunca depender de alertas o HTML.

| Operación | Entrada | Salida exitosa | Errores esperados |
|---|---|---|---|
| `guardarProyecto` | `{ companyId, proyecto: ProyectoPersistible, expectedVersion? }` | `{ proyecto: ProyectoPersistido }` con ID, versión y timestamps | `validacion`, `no-autorizado`, `conflicto`, `red`, `persistencia-parcial`, `no-disponible`. |
| `cargarProyecto` | `{ companyId, projectId }` | `{ proyecto }` completo con filas ordenadas | `validacion`, `no-encontrado`, `no-autorizado`, `datos-incompatibles`, `red`. |
| `actualizarProyecto` | Igual que guardar, con ID y versión requerida | Proyecto actualizado y nueva versión | Los anteriores más `conflicto-de-version`. Puede ser alias semántico de upsert solo si conserva concurrencia. |
| `eliminarProyecto` | `{ companyId, projectId, expectedVersion? }` | `{ projectId, deletedAt }` | `no-encontrado`, `no-autorizado`, `conflicto`, `red`. Preferir soft delete. |
| `listarProyectos` | `{ companyId, limit?, cursor?, includeDeleted? }` | `{ items, nextCursor }`, solo metadatos | `validacion`, `no-autorizado`, `red`. |

El DTO debe tener `schemaVersion`. El repositorio traduce errores técnicos; la fachada decide si una operación es reintentable. Una escritura de proyecto y filas debe ser atómica mediante RPC/transacción o estrategia compensatoria documentada; no se acepta éxito parcial silencioso.

## 16. Reconstrucción de un proyecto cargado

```text
controlador solicita project-persistence.cargarProyecto
→ repository consulta proyecto + filas bajo company_id/RLS
→ persistence valida schemaVersion y DTO completo
→ controlador suspende recálculos/listeners derivados durante hidratación
→ limpia y reconstruye filas con addPiezaRow/adaptador equivalente
→ aplica cantidadProyectos y parámetros de corte a controles
→ resuelve referencias o snapshots de material/tapacanto
→ construirModeloProyecto({ leerFilasPiezasDesdeDOM, obtenerCantidadProyectos })
→ recalcular()
→ prepararProyectoParaOptimizacion
→ optimizarProyectoPreparado
→ boards, costos, reporte y diagrama se reconstruyen
```

Funciones reutilizables: `addPiezaRow`, `refrescarSelects`, `actualizarControlesMargenesExteriores`, `construirModeloProyecto`, `prepararProyectoParaOptimizacion`, `optimizarProyectoPreparado`, `aplicarResultadoOptimizacion`, `calcularCostosProyecto`, `aplicarResultadoCostos` y `recalcular`. Antes de guardar debe existir un constructor de DTO explícito; antes de cargar, un hidratador UI probado. No se recomienda simular eventos de teclado o cambio para reconstruir.

## 17. Riesgos de integración

- Doble fuente de verdad entre DOM, `state`, DTO remoto y catálogos.
- Guardar mientras una fila está incompleta o antes de que blur normalice SKU.
- Reconstruir el DOM con orden, giro, cantos o vacíos distintos al original.
- Proyectos que referencian catálogos borrados/no migrados.
- Confusión entre UUID remoto, `idInterno`, SKU y nombre usado como referencia.
- Inserción de proyecto exitosa y piezas fallidas, o viceversa.
- Pérdida del modo local por hacer obligatoria la red.
- RLS ausente o incorrecta, fuga entre empresas y contexto `company_id` implícito.
- Exponer service-role key; en navegador solo es admisible la clave publicable y con RLS.
- Migraciones irreversibles o sin datos semilla/pruebas.
- Latencia que dispare dobles guardados, recálculos o UI engañosa.
- Errores offline, timeout y respuestas parciales sin política explícita.
- Versiones de formato incompatibles y cambios futuros del optimizador.

## 18. Reglas de transición

1. Mantener el modo local completamente funcional y arrancable sin sesión remota durante la transición.
2. No persistir boards ni otros datos derivados iniciales.
3. No importar ni llamar Supabase desde `main.js`.
4. Ningún botón debe conocer el cliente; llama a un controlador/fachada.
5. Toda lectura/escritura pasa por repositorios y conserva `company_id` explícito.
6. Manejar validación, red, autorización, conflicto y parcialidad como errores distintos.
7. No introducir Auth y persistencia completa en el mismo commit.
8. No mezclar backend/persistencia con rediseño visual, optimizador o exportadores.
9. Mantener una sola llamada final a `recalcular()` después de hidratar una carga completa.
10. Versionar el DTO y probar round-trip antes de ampliar tablas.

## 19. Qué queda pendiente de modularización

| Bloque | Prioridad / momento |
|---|---|
| Constructor Excel | Buen candidato por tamaño, pero puede esperar hasta después de la primera integración. |
| Importadores y vista previa | Buen candidato a subsistema; debe esperar para no combinar dos rutas de persistencia. |
| Edición de boards | Acoplada a SVG/drag y totalmente derivada; no conviene mover antes de Supabase. |
| Optimizador (`empacar*`) | Candidato de dominio, pero de riesgo algorítmico alto; puede esperar y sirve como baseline. |
| Catálogos/identidad/SKU | Sí requiere separación futura; primero definir IDs y ownership remoto. |
| Controladores UI | Extraer gradualmente después de tener guardar/cargar, empezando por un controlador de persistencia. |

El punto de retorno decreciente previo a Supabase comienza aquí: extraer layout, menús, drag o constructores de exportación ya no reduce el riesgo principal, que es definir una fuente de verdad persistible y una hidratación reversible. Más movimientos ahora aumentarían superficie de regresión sin mejorar el contrato de datos.

Una simplificación futura posible es fusionar conceptualmente `pieces-dom-reader` y el futuro hidratador en un único adaptador UI de piezas, manteniendo lectura/escritura separadas como funciones. También podría existir una fachada `project-pipeline` sobre preparación, optimización y aplicación; no conviene fusionar sus tres módulos actuales porque sus contratos y efectos son deliberadamente distintos.

## 20. Decisión arquitectónica

- **¿Está suficientemente modularizado para iniciar Supabase?** Sí, para planificación, inicialización local y primera migración incremental. No para sustitución total del modo local.
- **¿Qué no debe tocarse antes?** Geometría, costos, render SVG/reporte, coordinación extraída, optimizador, edición de boards y exportaciones.
- **¿Qué debe documentarse o probarse primero?** DTO versionado mínimo, round-trip DOM → DTO → DOM, paridad de recálculo, modelo multiempresa/RLS y comportamiento offline/error.
- **¿Dónde vive la infraestructura?** Cliente en `src/scripts/infrastructure/`, repositorio en `src/scripts/repositories/` y caso de uso en `src/scripts/project/`; nunca dentro de `main.js` ni de módulos de dominio.

## 21. Próximos tres cambios

### 1. Plan de integración Supabase

- Objetivo: ADR/plan con alcance, DTO, tablas mínimas, multiempresa, RLS, errores, modo local, pruebas y reversión.
- Archivos: solo documentación de ingeniería/ADR; sin SDK ni código funcional.
- Pruebas: revisión trazable contra `05-ARCHITECTURE.md`, `07-DATABASE.md` y este inventario; ejemplos de round-trip y matriz de riesgos.
- Riesgo: diseñar el esquema futuro completo en vez del mínimo reproducible.
- Commit sugerido: `docs(architecture): define Supabase integration plan`.

### 2. Inicialización local

- Objetivo: inicializar Supabase CLI/configuración local reproducible, variables de ejemplo y comandos documentados, sin conectar la UI ni introducir Auth funcional.
- Archivos: configuración local de Supabase, documentación y ajustes mínimos de ignore/env que el plan apruebe; aún sin cambios de `main.js`.
- Pruebas: iniciar/detener entorno, verificar estado local, secreto no versionado y proyecto funcionando sin Supabase.
- Riesgo: credenciales reales o dependencia obligatoria del servicio.
- Commit sugerido: `chore(supabase): initialize local development environment`.

### 3. Primera migración

- Objetivo: crear el núcleo mínimo acordado para tenancy y borrador reproducible: compañía/contexto mínimo, proyecto y filas de piezas/configuración versionada; RLS desde el inicio.
- Archivos: una migración SQL, seed/prueba local y documentación del esquema. Sin botones ni consumo desde `main.js`.
- Pruebas: migración desde cero, rollback/recreación local, restricciones, orden de piezas, aislamiento entre dos compañías y rechazo sin contexto válido.
- Riesgo: sobredimensionar tablas o dejar RLS para después.
- Commit sugerido: `feat(database): add initial project persistence schema`.

No se propone un cuarto cambio en este documento.

## 22. Criterios de salida de esta fase

La modularización previa a Supabase se considera cerrada cuando:

- Git está limpio salvo el inventario aprobado;
- este inventario refleja tamaños, módulos y dependencias reales;
- el pipeline y el orden de efectos están documentados;
- módulos estables y sensibles están identificados;
- el punto cliente → repositorio → persistencia → controlador está definido;
- el DTO y los datos persistibles/derivados están acordados;
- están registradas pruebas manuales críticas: captura y recálculo, cuatro plantillas, edición de boards, CSV/Excel, DXF, preferencias, errores por etapa y conservación de `ultimoTotal`;
- existe una prueba planificada de round-trip que compare entradas y resultados recalculados;
- no queda una extracción imprescindible para comenzar el plan de Supabase.

## 23. Conclusión

La arquitectura actual es un monolito frontend modularizado alrededor de un coordinador grande. Veintidós módulos ya protegen los cálculos y renderizadores más valiosos; `main.js` conserva integración UI, catálogos, importadores, algoritmo concreto y exportaciones. Ese reparto es suficiente para detener las extracciones preventivas.

La primera persistencia debe guardar un borrador reproducible: metadatos/versionado/tenant, filas fuente, cantidad y parámetros que cambian el resultado, con referencias o snapshots mínimos de materiales y tapacantos. Boards, geometría, costos, reporte y exportaciones deben recalcularse.

Los módulos estables no deben modificarse durante la entrada a Supabase. El primer cambio técnico no es conectar un botón: es aprobar el plan y el contrato. Después se inicializa Supabase local y solo entonces se crea la primera migración con aislamiento multiempresa y RLS.
