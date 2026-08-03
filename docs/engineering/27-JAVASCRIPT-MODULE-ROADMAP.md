# 27-JAVASCRIPT-MODULE-ROADMAP.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Describir qué JavaScript permanece dentro de `src/scripts/main.js` después de las doce extracciones mecánicas realizadas hasta ahora (reportes 15 a 26), cómo se agrupa realmente el código, qué dependencias y riesgos tiene cada grupo, y en qué orden debería continuar la modularización.

## Depende de
`README.md`; `docs/engineering/04-AI-RULES.md`; `docs/engineering/05-ARCHITECTURE.md`; `docs/engineering/10-CURRENT-STATE.md`; `docs/engineering/12-MANUAL-TESTS.md`; `docs/engineering/23-BASIC-GEOMETRY-EXTRACTION-REPORT.md`; `docs/engineering/24-FREE-RECTANGLES-EXTRACTION-REPORT.md`; `docs/engineering/25-RECT-CONTAINMENT-EXTRACTION-REPORT.md`; `docs/engineering/26-FREE-RECT-CALCULATION-EXTRACTION-REPORT.md`; `src/scripts/main.js`; `index.html`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Nota metodológica

Este documento es de planificación únicamente. No se modificó código, no se movieron funciones, no se crearon módulos y no se cambió `index.html`. Todo el inventario proviene de lectura directa de `src/scripts/main.js` en su estado actual (commit `6734aa1`, 6706 líneas) y de los doce reportes de extracción ya completados (15 a 26). Las líneas citadas son aproximadas porque cualquier extracción futura las desplazará; los nombres de función, en cambio, son exactos.

---

# 1. Resumen ejecutivo

- **Líneas actuales de `main.js`**: 6706.
- **Líneas originales** (al momento de separar JS de HTML/CSS, reporte 14): 6972.
- **Reducción lograda hasta ahora**: 266 líneas, es decir **3.8%**. Las doce extracciones completadas movieron funciones pequeñas y medianas (formato, validación, límites, normalización de texto, CSV, constantes de formato de proyecto, y seis funciones de geometría de rectángulos), pero ninguna ha tocado todavía las funciones grandes que concentran la mayoría del código (`construirLibroExcel`, `recalcular`, `empacarConLista`, `dibujarBoard`, `aplicarPiezasPendientes`).
- **Funciones de nivel superior restantes dentro de la IIFE de `main.js`**: 161 (156 `function` + 5 `async function`), sin contar funciones anidadas dentro de otras (por ejemplo, los dos `podarContenidos` locales dentro de `empacarConListaLibre`/`empacarConLista`, o `validarNodo` dentro de `validarConfiguracionEtapa4`).
- **Estado general de modularización**: la capa de utilidades puras (formato, validación, límites, texto, CSV, geometría) está prácticamente extraída y expuesta vía `window.ProyCutXxx`. Lo que queda en `main.js` es, en su enorme mayoría, código con dependencia directa de `document` y/o `state`: renderizado de tablas, manejo de eventos, el optimizador de empaquetado, el dibujo SVG del diagrama, la edición manual, el reporte de costos y las tres rutas de importación/exportación (CSV, Excel, DXF). Ninguna función de más de 150 líneas ha sido extraída todavía.
- **Principales zonas de riesgo**: `recalcular()` (274 líneas, coordinador central), `construirLibroExcel` (~503 líneas, la función más grande del archivo), `empacarConLista` (~302 líneas, algoritmo de empaquetado), `dibujarBoard` (~253 líneas, genera el SVG completo del diagrama), `aplicarPiezasPendientes` (~211 líneas, aplicación atómica de importación) y la mutación directa de `state.boards` desde las funciones de edición manual (`rotarPieza`, `espejarBoard`, `compactarHacia*`, `activarPiezasArrastrables`). Todas estas funciones están señaladas en la sección 8 como zonas críticas y en la sección 16 como "qué no tocar todavía".

# 2. Inventario completo del JavaScript restante

De los grupos sugeridos como referencia, estos existen claramente en el código real: estado e inicialización, identidad y SKU, configuración jerárquica, catálogos, componentes del proyecto, piezas, validación de proyecto, importación CSV, importación Excel, vista previa de importación, personalización, combobox, selector de cantos, optimización, sobrantes, diagramas SVG, edición manual, reporte de costos, exportación Excel, exportación DXF, eventos, redimensionamiento e inicialización final. No existe un grupo separado y limpio de "importación Excel" puro: en el código real, la importación de **piezas** (formato propio `PROYCUT_PROJECT_FORMAT`) y la importación de **catálogo** (materiales/tapacantos/componentes, contrato `CAT-7`) son dos rutas de lectura de Excel distintas, con sus propias funciones, que además comparten la misma vista previa y el mismo botón "Importar archivo". Por eso el inventario que sigue separa "Importación Excel — piezas" e "Importación Excel — catálogo" en vez de un único grupo "importación Excel".

| # | Grupo | Rango aprox. de líneas | Marcador de sección original |
|---|---|---|---|
| 1 | Estado e inicialización | 53-79 | (ninguno; primeras líneas de la IIFE) |
| 2 | Identidad y SKU de catálogos | 68-314 | `// ---------- Etapa 2D-A: identidad interna y SKU automatico de catalogos ----------` |
| 3 | Configuración jerárquica (Etapa 4) | 315-727 | `// ---------- Etapa 4A ... ----------` / `// ---------- Etapa 4B ... ----------` |
| 4 | Utilidades compartidas de tablero y precio | 729-803 | (sin marcador propio, entre Etapa 4B y "Config") |
| 5 | Catálogos (materiales/tapacantos/componentes) | 805-947 | `// ---------- Config: materiales / tapacantos / componentes ----------` |
| 6 | Componentes del proyecto | 949-1007 | `// ---------- Componentes del proyecto ... ----------` |
| 7 | Interfaz general, menús y eventos de catálogo | 1008-1326 | (sin marcador propio) |
| 8 | Exportación de formato de proyecto (piezas) | 1326-1460 | `// ---------- Formato de proyecto (piezas + componentes) e Importar ----------` |
| 9 | Importación Excel — piezas | 1460-1663 | (continúa el bloque anterior) |
| 10 | Importación Excel — catálogo (CAT-7) | 1663-1830 | `// ---------- CAT-7: lectura/validacion del archivo de catalogo ... ----------` |
| 11 | Vista previa de importación | 1830-2477 | `// ---------- Etapa 2D-B ... ----------` / `// ---------- M-1 ... ----------` |
| 12 | Aplicación atómica de importación | 2477-2887 | (continúa el bloque anterior; incluye eventos de confirmación) |
| 13 | Personalización (estilo, localStorage) | 2885-3072 | `// ---------- Apariencia del diagrama ... ----------` |
| 14 | Combobox buscable | 3072-3226 | `// ---------- Combobox buscable ... ----------` |
| 15 | Crear catálogo desde el buscador (modal) | 3226-3318 | `// ---------- Crear nuevo Material / Tapacanto / Componente ... ----------` |
| 16 | Selector visual de cantos | 3318-3345 | `// ---------- selector visual de cantos ... ----------` |
| 17 | Filas de piezas | 3345-3705 | `// ---------- Filas de piezas ----------` |
| 18 | Validación de proyecto | 3705-3807 | (sin marcador propio) |
| 19 | Lectura de piezas | 3807-3888 | (sin marcador propio) |
| 20 | Optimización / empaquetado | 3888-4446 | `// ---------- Empaquetado tipo guillotina ... ----------` / `// ---------- Modo LIBRE ... ----------` |
| 21 | Sobrantes y rectángulos libres del tablero | 4446-4563 | (sin marcador propio) |
| 22 | Diagrama SVG | 4563-4838 | (sin marcador propio) |
| 23 | Edición manual del diagrama | 4838-5155 | (sin marcador propio) |
| 24 | Render final y debounce | 5155-5206 | `// ---------- Optimizar (recalculo completo) ----------` |
| 25 | Reporte de costos (plantillas) | 5206-5368 | `// ---------- Plantillas de diseño del reporte "Precio del proyecto" ----------` |
| 26 | `recalcular()` (coordinador) | 5368-5642 | (sin marcador propio) |
| 27 | Ajustes menores de interfaz (tablero, notas, espejo) | 5642-5715 | (sin marcador propio) |
| 28 | Carga diferida de librerías (ExcelJS/JSZip) | 5715-5746 | (sin marcador propio) |
| 29 | Exportación DXF | 5746-5842 | `// ---------- Exportar a DXF para maquinas CNC ... ----------` |
| 30 | Utilidades de imagen para Excel (compartidas con exportación Excel) | 5842-5987 | (físicamente dentro del bloque DXF, funcionalmente parte de exportación Excel) |
| 31 | Exportación Excel (lectura de piezas + construcción del libro) | 5987-6610 | `// ---------- Exportar a Excel ... ----------` (el marcador está en la línea 5710, antes de la carga de ExcelJS) |
| 32 | Redimensionamiento de columnas e inicialización final | 6605-6706 | `// ---------- columnas de la tabla "Piezas a cortar" arrastrables ----------` / `// ---------- barra para arrastrar ... ----------` |

No se fuerza un grupo "eventos" separado: los `addEventListener` de nivel superior están repartidos dentro de cada grupo funcional (54 líneas de wiring directo detectadas, ver sección 6), no concentrados en un solo lugar. Tampoco existe un grupo "inicialización final" aislado más allá de las tres líneas literales al cierre del archivo (`activarColumnasRedimensionables(); activarDivisorColumnas(); recalcular();`), que se documentan dentro del grupo 32.

# 3. Tabla por grupo

Convención de riesgo: **Bajo** (sin DOM/state, o con DOM/state trivial y sin efectos sobre el optimizador) — **Medio** (DOM y/o state, pero acotado a un panel o tabla) — **Alto** (participa en el flujo de cálculo/optimización o en importación/exportación de datos reales) — **Crítico** (coordina o es invocado por `recalcular()`, o muta `state.boards` directamente).

| Grupo | Funciones principales | Lee | Modifica | Dependencias directas | DOM | `state` | Módulos ya extraídos usados | Acoplamiento | Riesgo | Prioridad |
|---|---|---|---|---|---|---|---|---|---|---|
| 1. Estado e inicialización | (declaración de `state`, `BOARD_W`, `BOARD_H`, `pieceCounter`) | — | — | ninguna | No | Es la fuente | ninguno | N/A (es el ancla) | Crítico (es la base de todo) | Última (no se extrae; documentar solamente) |
| 2. Identidad y SKU | `configuracionSkuCategoria`, `crearIdInternoCatalogo`, `asegurarIdentidadInternaCatalogos`, `actualizarMetadatosSku`, `inicializarConsecutivosSku`, `generarSkuAutomatico`, `completarSkuVaciosCatalogos`, `crearRegistroCatalogo`, `prepararSkuCatalogo`, `guardarSkuCatalogoDesdeTabla`, `registrarEventosSkuCatalogo` | `state.materiales/tapacantos/componentes` | `state.materiales/tapacantos/componentes` (agrega SKU, `_idInterno`, metadatos) | `normalizarSkuManual` (ya extraída) | Sí (inputs de SKU en las 3 tablas) | Sí (lee y escribe) | `text-normalization.js` | Medio | Alto (toca los 3 catálogos y sus eventos) | Media |
| 3. Configuración jerárquica (Etapa 4) | `esObjetoPlanoConfiguracion`, `clonarValorConfiguracion`, `combinarConfiguraciones`, `obtenerValorConfiguracion`, `validarConfiguracionEtapa4`, `resolverConfiguracionJerarquica`, `resolverValorPorJerarquia`, `leerNumeroConfiguracionCorte`, `obtenerControlesMargenesExteriores`, `actualizarControlesMargenesExteriores`, `crearConfiguracionProyectoCorteActual`, `fuentesConfiguracionCorteActual`, `mensajesParametrosCorte`, `resolverParametrosCorteEtapa4` | 3 controles DOM de margen/kerf; constantes propias | ninguna (`state`) | ninguna externa | Sí (solo `leerNumeroConfiguracionCorte`/`obtenerControlesMargenesExteriores`/`actualizarControlesMargenesExteriores`) | No | ninguno | Bajo-Medio | Medio | **Alta** |
| 4. Utilidades de tablero y precio | `obtenerAreaColocacionBoard`, `obtenerKerfMaterial`, `textoSeguroParaExcel`, `resumenErrores`, `obtenerMedidaTableroDefault`, `medidaTableroDeMaterial` | `state.materiales`, 2 inputs DOM | ninguna | ninguna | Sí (2 de 6 funciones) | Sí (1 de 6, solo lectura) | ninguno | Bajo | Bajo-Medio | **Alta** |
| 5. Catálogos | `renderMateriales`, `renderTapacantos`, `renderComponentes` | `state.materiales/tapacantos/componentes` | Sí (edición inline, `splice` al quitar) | `registrarEventosSkuCatalogo` (grupo 2), `refrescarSelects` (grupo 14), `recalcularDebounced` (grupo 24), `obtenerMedidaTableroDefault` (grupo 4) | Sí (alto: crea filas de tabla completas) | Sí | ninguno | Alto | Alto | Baja (mover junto con grupo 2) |
| 6. Componentes del proyecto | `etiquetaComponente`, `renderComponentesProyecto` | `state.componentesProyecto` | Sí | `fmtMoney` (ya extraída), `recalcularDebounced` | Sí | Sí | `format.js` | Medio | Medio | Media |
| 7. Interfaz general, menús y eventos de catálogo | `enfocarUltimoInput`, `actualizarVisibilidadInterfaz`, `cerrarTodoElMenu`, `crearMenuTexto`, `cerrarHamburguesa`, `cerrarPanelGuardado` + ~15 `addEventListener` de nivel superior | Estado de clases CSS (`open`/`abierto`) en varios paneles | DOM (clases) | `guardarSkuCatalogoDesdeTabla`, `recalcular` (algunos botones "Guardar" llaman `recalcular()` directo) | Sí (muy alto) | No directamente | ninguno | Alto | Medio | Media |
| 8. Exportación de formato de proyecto | `leerPiezasFormularioParaFormato`, `construirLibroFormatoProyecto` | filas DOM de piezas, `state.componentesProyecto`, `state.materiales` | ninguna (genera un archivo) | `ENCABEZADO_FORMATO` (extraída), `ExcelJS` (CDN) | Sí | Sí (lectura) | `project-format.js` | Medio | Medio | Media |
| 9. Importación Excel — piezas | `agregarPiezaDesdeColumnas`, `textoImportadoSeguro`, `valorPlanoCeldaExcel`, `validarEncabezadoHoja`, `leerRegistrosHoja`, `leerRegistrosMaterialesHoja`, `extraerProyectoDesdeLibroExcel`, `esLibroFormatoPiezas`, `leerProyectoExcel` | Archivo `.xlsx` cargado por el usuario | ninguna directa (retorna datos; `agregarPiezaDesdeColumnas` sí crea filas via `addPiezaRow`) | `ENCABEZADO_FORMATO`, `LIMITES`, `validarCantidad/Medida/Precio`, `normalizarGirarCSV`, `esValorAfirmativo` (todas ya extraídas) | Parcial (`agregarPiezaDesdeColumnas` sí) | No (trabaja con datos del archivo, no con `state`, salvo al insertar filas) | `project-format.js`, `limits.js`, `validation.js`, `text-normalization.js` | Alto | Alto | Media-Baja |
| 10. Importación Excel — catálogo (CAT-7) | `leerRegistrosCatalogoHoja`, `skuDuplicadosEnFilasCatalogo`, `extraerCatalogoDesdeLibroExcel`, `leerCatalogoExcel` | Archivo `.xlsx` | ninguna directa | `LIMITES` | No | No | `limits.js` | Bajo-Medio | Medio | Media |
| 11. Vista previa de importación | `prepararVistaPreviaMateriales`, `opcionesAccionParaMaterial`, `decisionPropuestaParaMaterial`, `cantidadProyectoParaComponente`, `siguienteSkuAutomaticoComponentePrevisto`, `prepararVistaPreviaComponentes`, `componenteCatalogoPorId`, `calcularResultadoVistaPrevia`, `agregarCeldaTexto`, `opcionesAccionParaItem`, `renderVistaPreviaMateriales`, `renderVistaPreviaComponentes`, `abrirVistaPreviaImportacion`, `cancelarVistaPreviaImportacion`, `filasProyectoDelComponente` | `state.materiales/componentes/componentesProyecto` | Construye tabla temporal en el DOM (no toca `state` todavía) | `normalizarNombreMaterialImportado/Componente` (extraídas) | Sí (alto) | Sí (lectura) | `text-normalization.js` | Alto | Alto | Baja |
| 12. Aplicación atómica de importación | `construirAplicacionAtomicaComponentes`, `construirAplicacionAtomicaMateriales`, `aplicarPiezasPendientes` + eventos `confirmarImportacionVistaPrevia`/`importarArchivoBtn` | `state` completo (los 3 catálogos, `componentesProyecto`) | **Sí, en bloque** (aplica o descarta todo el lote) | `agregarPiezaDesdeColumnas` (grupo 9), `renderMateriales/Tapacantos/Componentes` (grupo 5), `recalcular` | Sí | Sí (escritura masiva) | ninguno directo | Muy alto | **Crítico** | No mover todavía |
| 13. Personalización | `cargarEstiloGuardado`, `guardarEstilo`, `aplicarEstiloGlobal`, `aplicarVisibilidadBotones`, `leerEstilo` | `localStorage`, ~40 controles DOM | `localStorage`, variables CSS en `documentElement` | `fuenteACss` (ya extraída) | Sí (alto) | No | `format.js` | Medio | Bajo-Medio | **Alta** |
| 14. Combobox buscable | `refrescarSelects`, `cerrarComboFlotante`, `posicionarComboFlotante`, `renderComboOpciones`, `abrirComboBuscable`, `attachComboBuscable` | `state.materiales/tapacantos`, posición del input en pantalla | DOM (crea/posiciona el panel flotante) | ninguna externa | Sí (muy alto, `getBoundingClientRect`, listeners de scroll/resize) | Sí (lectura) | ninguno | Alto | Medio | Media |
| 15. Crear catálogo desde el buscador | `etiquetaTipoCrear`, `iniciarCrearDesdeCombo`, `abrirModalCrear`, `cerrarModalCrear`, `confirmarCrear` | modal DOM, `state.materiales/tapacantos/componentes` | `state` (agrega registro nuevo) | `guardarSkuCatalogoDesdeTabla`-like validaciones, `renderMateriales/Tapacantos/Componentes`, `refrescarSelects` | Sí | Sí (escritura) | ninguno | Alto | Medio | Media |
| 16. Selector visual de cantos | `sincronizarCantoSelector`, `attachCantoSelector`, `crearCantoSelectorSvg` | checkboxes ocultos `l1/l2/a1/a2` de una fila | DOM (clases activas del SVG) | ninguna | Sí | No | ninguno | Bajo | Bajo | **Alta** (con reserva, ver sección 4) |
| 17. Filas de piezas | `addPiezaRow`, `tituloGirar`, `siguienteModoGirar`, `attachGirarToggle`, `renumerarFilas`, `enfocarCampo`, `attachEnterNavegable`, `ajustarAlturaTabla`, `obtenerCantidadProyectos`, `obtenerNivelOptimizacion` | `pieceCounter`, plantilla de fila, catálogos vía combobox | `pieceCounter`, DOM (crea filas) | `crearCantoSelectorSvg`, `attachCantoSelector`, `attachComboBuscable`, `attachGirarToggle`, `recalcularDebounced` | Sí (muy alto) | Indirecto (lee catálogos vía combobox) | ninguno | Muy alto | Alto | Baja |
| 18. Validación de proyecto | `validarProyecto`, `mostrarErroresProyecto` | Todo el formulario DOM (materiales, tapacantos, componentes, piezas, parámetros de corte) | `#avisos` (DOM) | `LIMITES`, `validarCantidad/Medida/Precio`, `calcularRectanguloUtilTablero/Colocacion`, `resolverParametrosCorteEtapa4` | Sí (muy alto) | No (lee todo desde el DOM, no desde `state`) | `limits.js`, `validation.js`, `basic-geometry.js` | Muy alto | **Crítico** | No mover todavía |
| 19. Lectura de piezas | `leerPiezas` | Filas DOM de piezas | ninguna (retorna datos) | `medidaTableroDeMaterial`, `calcularRectanguloUtilTablero/Colocacion`, `resolverParametrosCorteEtapa4`, `state.materiales` (indirecto) | Sí (alto) | Sí (lectura, vía `medidaTableroDeMaterial`) | `basic-geometry.js` | Alto | **Crítico** | No mover todavía |
| 20. Optimización / empaquetado | `pseudoAleatorio`, `barajar`, `empacarMaterial`, `empacarConListaLibre`, `empacarConLista` (+ `podarContenidos` local ×2) | Arreglo de piezas + `datosTablero` (parámetro, no `state`) | ninguna global; construye y retorna `board` nuevos | `calcularHuellaEnRectangulo`, `capacidadLinealConKerf` (ya extraídas); `splitFreeRect`, `contenido` (locales, no extraídas) | No | No (recibe todo por parámetro) | `basic-geometry.js` | Bajo hacia afuera / muy alto internamente | Alto (por tamaño y algoritmo, no por acoplamiento) | Media |
| 21. Sobrantes y rectángulos libres del tablero | `calcularSobrantes`, `areaSobranteTotal`, `contarCortes`, `calcularFreeRectsPara`, `crearFronterasEntrePiezas`, `crearFronterasPiezaSobrante`, `crearFronterasExteriores`, `reconstruirSobrantesYFronteras`, `recalcularFreeRectsDesdeCero` | `board` (parámetro) | `board.freeRects`/`fronteras*` (muta el objeto recibido) | `calcularRectsLibresDesdeObstaculos`, `obtenerAreaColocacionBoard` (ya extraída la primera) | No | No directamente (opera sobre `board`, que vive en `state.boards`) | `free-rectangles.js` | Medio | Alto (muta objetos de `state.boards` por referencia) | Media |
| 22. Diagrama SVG | `dibujarBoard`, `piezasSeEncimanConOtras` | `board`, `estilo` (parámetros) | ninguna (retorna texto SVG) | `fmt`, `fmtMoney`, `fuenteACss` (ya extraídas) | No (construye texto, no nodos DOM) | No | `format.js` | Bajo hacia afuera | Alto (por tamaño: ~253 líneas, muchas ramas de dibujo) | Media |
| 23. Edición manual del diagrama | `rotarPieza`, `espejarBoard`, `compactarHaciaAbajo/Arriba`, `espejarBoardHorizontal`, `compactarHaciaIzquierda/Derecha`, `calcularImanes`, `activarPiezasArrastrables` | `board.pieces` (parámetro) | **Sí, muta `board.pieces` in-place** (`p.x`, `p.y`, `p.w`, `p.h`, `p.rotada`) | `calcularFreeRectsPara`, `recalcularFreeRectsDesdeCero`, `obtenerAreaColocacionBoard` | Sí (`activarPiezasArrastrables` maneja `mousedown/mousemove/mouseup` sobre el SVG) | Sí (indirecto: `board` es un elemento de `state.boards`) | `free-rectangles.js` (indirecto) | Alto | **Crítico** | No mover todavía |
| 24. Render final y debounce | `renderDiagrama`, `recalcularDebounced` | `state.boards`, `state.activeTab` | DOM (`#diagramContainer`, pestañas) | `dibujarBoard`, `activarPiezasArrastrables`, `recalcular` | Sí | Sí | ninguno directo | Alto | Alto | Baja |
| 25. Reporte de costos (plantillas) | `renderReporte`, `totalBarHtml`, `lineasMaterialHtml`, `lineasTapaHtml`, `lineasComponentesHtml`, `renderReporteColumnas/Lista/Tarjetas/Factura` | Objeto `datos` (parámetro, ya calculado por `recalcular`) | DOM (`#reportePanel`) | `fmt`, `fmtMoney` (ya extraídas) | Sí (solo escritura de HTML) | No directamente (recibe `datos` ya armado) | `format.js` | Medio | Medio | Media |
| 26. `recalcular()` | `recalcular` | Prácticamente todo: DOM completo, `state` completo | `state.boards`, `state.activeTab`, `state.ultimoTotal`, `state.ultimoReporte`, DOM de paneles y reporte | Casi todos los grupos anteriores | Sí (muy alto) | Sí (lectura y escritura) | todos los ya extraídos, indirectamente | Máximo | **Crítico** | No mover todavía |
| 27. Ajustes menores de interfaz | `actualizarMedidaTablero`, `attachToggleNota` + eventos de espejo/resize | Inputs de tablero, checkboxes de nota | DOM, `recalcularDebounced` | ninguna | Sí | No | ninguno | Bajo | Bajo | **Alta** |
| 28. Carga diferida de librerías | `cargarExcelJS`, `cargarJSZip` | `window.ExcelJS`/`window.JSZip`, promesas de módulo (`promesaExcelJS`/`promesaJSZip`) | Inserta `<script>` en `document.head` | ninguna | Sí (mínimo) | No | ninguno | Bajo | Bajo | **Alta** |
| 29. Exportación DXF | `grupoDxf`, `polilineaRectDxf`, `construirDXFTablero`, `nombreArchivoSeguro`, `exportarDXFZip` | `board` (parámetro); `exportarDXFZip` lee `state.boards` | Ninguna (las 4 primeras); `exportarDXFZip` dispara descarga de archivo | `cargarJSZip`, `recalcular()` (la async llama a `recalcular()` antes de exportar) | Solo `exportarDXFZip` | Solo `exportarDXFZip` (lectura) | ninguno | Las 4 puras: nulo. `exportarDXFZip`: alto | Bajo (las 4 puras) / Alto (`exportarDXFZip`) | **Alta** (las 4 puras) |
| 30. Utilidades de imagen para Excel | `fechaLegibleHoy`, `extraerDimensionesSvg`, `svgAPngBuffer`, `generarDiagramasParaExcel` | Texto SVG (parámetro) | ninguna (`fechaLegibleHoy`/`extraerDimensionesSvg`); usa `canvas`/`Image`/`Blob` (`svgAPngBuffer`) | `dibujarBoard` (grupo 22) | `svgAPngBuffer` sí (canvas, Image); las otras dos no | No | ninguno | Medio | Medio | Media |
| 31. Exportación Excel | `leerPiezasParaExportar`, `construirLibroExcel`, `copiarDatosParaExcel`, `exportarExcel` | Todo: `state`, DOM, `estilo`, diagramas generados | Dispara descarga; `copiarDatosParaExcel` no muta nada (copia profunda) | `textoSeguroParaExcel`, `fmt`, `fmtMoney`, `fuenteAExcel`, `generarDiagramasParaExcel`, `cargarExcelJS`, `recalcular()` | Sí (alto) | Sí (lectura extensa) | `format.js` | Muy alto | **Crítico** (por tamaño y por disparar `recalcular()`) | No mover todavía |
| 32. Redimensionamiento e inicialización final | `activarColumnasRedimensionables`, `activarDivisorColumnas` + llamadas finales | Anchos de columnas/paneles en pantalla | DOM (`style.width`), `localStorage` (anchos guardados, si aplica) | ninguna | Sí | No | ninguno | Bajo | Bajo | **Alta** |

# 4. Funciones todavía puras o casi puras

Estas funciones no acceden a `document`, no leen ni modifican `state`, reciben todo por parámetro y devuelven un resultado explícito. Se listan como candidatas de bajo riesgo; **no se movieron**.

- **Utilidades de configuración jerárquica** (grupo 3): `esObjetoPlanoConfiguracion`, `clonarValorConfiguracion`, `combinarConfiguraciones`, `obtenerValorConfiguracion`, `validarConfiguracionEtapa4` (incluye `validarNodo`, función anidada), `resolverConfiguracionJerarquica`, `resolverValorPorJerarquia`, `mensajesParametrosCorte`. Estas ocho funciones operan únicamente sobre los objetos de configuración (`configuracionesEtapa4` y los objetos `CONFIGURACION_*`/`REGLAS_CONFIGURACION_ETAPA4`, que también son constantes estáticas, no `state`) y sobre sus propios parámetros. El propio comentario del código (línea 316) confirma que "ninguna funcion de geometria, precio, reporte o exportacion lo consulta todavia" — es decir, el sistema de configuración jerárquica está funcionalmente aislado del resto de la aplicación.
- **Utilidades de tablero y precio** (grupo 4, parcial): `textoSeguroParaExcel`, `resumenErrores` son puras. `obtenerAreaColocacionBoard` y `obtenerKerfMaterial` reciben `board`/`piezas`+`parametrosProyecto` por parámetro y no tocan `document` ni `state` — también son puras, aunque conceptualmente pertenecen al dominio de tableros/optimización.
- **Empaquetado — núcleo algorítmico** (grupo 20): `pseudoAleatorio`, `barajar`, `empacarMaterial`, `empacarConListaLibre`, `empacarConLista` no acceden a `document` ni a `state`; reciben `piezas`, `kerf`, `libre`, `nivel` y `datosTablero` por parámetro y retornan un arreglo de `board` nuevos. Son "casi puras" en el sentido de que son deterministas dado el mismo `datosTablero` y la misma semilla, pero su tamaño (hasta 302 líneas) y su intrincada lógica de decisión (criterios de orden, `podarContenidos` local, `splitFreeRect` local) hacen que extraerlas sea de bajo riesgo de acoplamiento pero de **alto riesgo de introducir un error de transcripción** si no se hace con el mismo procedimiento mecánico (`sed`) usado en los reportes 15-26.
- **Diagrama SVG — función de dibujo** (grupo 22): `dibujarBoard` y `piezasSeEncimanConOtras` no tocan `document` (generan una cadena de texto SVG, no nodos DOM) ni `state`; reciben `board`, `kerf`, `anchoDisponible`, `estilo` por parámetro. Es la función más grande de las "puras" (~253 líneas).
- **DXF** (grupo 29): `grupoDxf`, `polilineaRectDxf`, `construirDXFTablero`, `nombreArchivoSeguro` son puras (confirmado también en el propio código: ninguna referencia a `document`, `state` ni `localStorage`).
- **Utilidades de imagen para Excel** (grupo 30, parcial): `fechaLegibleHoy` y `extraerDimensionesSvg` son puras. `svgAPngBuffer` no lo es (usa `document.createElement('canvas')`, `Image`, `Blob`, `URL.createObjectURL`), pero es un efecto secundario controlado y autocontenido (no toca `state` ni otros elementos del DOM de la aplicación).
- **Vista previa de importación — cálculo, no render** (grupo 11, parcial): `opcionesAccionParaMaterial`, `decisionPropuestaParaMaterial`, `cantidadProyectoParaComponente`, `siguienteSkuAutomaticoComponentePrevisto`, `calcularResultadoVistaPrevia`, `opcionesAccionParaItem`, `filasProyectoDelComponente` reciben datos por parámetro y devuelven decisiones/objetos, aunque casi todas necesitan `state.materiales`/`state.componentes`/`state.componentesProyecto` como entrada — son "casi puras" (dependen de `state` solo como dato de entrada de solo lectura, no lo modifican).

# 5. Funciones coordinadoras

- **`recalcular()`** — conecta validación (`validarProyecto`), configuración (`resolverParametrosCorteEtapa4`), lectura de piezas (`leerPiezas`), empaquetado (`empacarMaterial`), compactación (`compactarHaciaAbajo`), render del diagrama (`renderDiagrama`), y las cinco plantillas del reporte de costos (`renderReporteColumnas/Lista/Tarjetas/Factura`). Escribe `state.boards`, `state.activeTab`, `state.ultimoTotal`, `state.ultimoReporte`. **No debe extraerse todavía** porque es literalmente el punto donde todos los demás grupos convergen; moverla antes que sus 15+ dependencias directas ya estén cada una en su propio módulo obligaría a mover el 60-70% del archivo en un solo cambio, violando el principio de cambios pequeños de `docs/engineering/04-AI-RULES.md` (regla 6).
- **`validarProyecto()`** — lee el DOM completo (materiales, tapacantos, componentes, componentes del proyecto, piezas, parámetros de corte) y es la primera función que llama `recalcular()`. No debe extraerse todavía porque su extracción obligaría a decidir, al mismo tiempo, dónde vive la validación de cada catálogo (grupo 5), de piezas (grupo 17) y de configuración de corte (grupo 3) — mezclaría responsabilidades de varios módulos futuros en una sola decisión.
- **`leerPiezas()`** — traduce las filas del DOM a los objetos `pieza` que consume el optimizador; depende de `medidaTableroDeMaterial`, `calcularRectanguloUtilTablero/Colocacion` y `resolverParametrosCorteEtapa4`. No debe extraerse todavía porque es el punto de unión entre "Filas de piezas" (grupo 17, DOM puro) y "Optimización" (grupo 20, sin DOM): moverla prematuramente fija una interfaz entre esos dos módulos futuros antes de que ambos existan por separado.
- **`renderDiagrama()`** — punto de unión entre `state.boards`/`state.activeTab` y `dibujarBoard`/`activarPiezasArrastrables`; regenera las pestañas de tableros. No debe extraerse todavía porque depende de que "Diagrama SVG" (grupo 22) y "Edición manual" (grupo 23) ya estén definidos como módulos con una interfaz estable.
- **`exportarExcel()`** — dispara `recalcular()` de nuevo antes de exportar (para garantizar datos frescos), luego llama a `leerPiezasParaExportar`, `generarDiagramasParaExcel` y `construirLibroExcel`. No debe extraerse todavía: depende de casi todos los demás grupos y de la carga diferida de ExcelJS.
- **`confirmarImportacionVistaPrevia`** (evento, no función nombrada — línea 2712) — invoca `construirAplicacionAtomicaMateriales`/`Componentes` y `aplicarPiezasPendientes` en una sola operación "todo o nada". No debe extraerse todavía porque su lógica de aplicación atómica está entrelazada con el cierre del modal, el refresco de los tres catálogos y el disparo de `recalcular()`.
- **`empacarMaterial()`** — es el despachador entre el modo "libre" (`empacarConListaLibre`) y el modo "guillotina con lista" (`empacarConLista`), y prueba varios órdenes de entrada para quedarse con el mejor resultado. Podría extraerse junto con `empacarConListaLibre`/`empacarConLista` como una unidad (ver Fase I, sección 10), pero no antes que `datosTablero` (su única entrada compleja) esté completamente desacoplado de `state` — cosa que ya ocurre hoy, así que este grupo es el más cercano a estar listo entre los "críticos".
- **`empacarConLista()`** — el algoritmo de empaquetado guillotina más grande (~302 líneas); contiene su propio `podarContenidos` local (no confundir con `podarRectsContenidos`, ya extraída en el reporte 25). No debe extraerse suelta de `empacarMaterial`/`empacarConListaLibre` porque las tres comparten criterios de orden y helpers locales.
- **`empacarConListaLibre()`** — variante para el modo "libre" (sin restricción de corte de lado a lado); misma observación que la anterior.

# 6. Estado compartido

## Propiedades de `state` (declarado en la línea 57)

| Propiedad | Grupos que la leen | Grupos que la modifican |
|---|---|---|
| `state.materiales` | 4, 5, 9 (import.), 11, 12, 14, 18, 19, 26, 31 | 5 (edición inline, `splice`), 12 (aplicación atómica), 15 (crear desde combobox) |
| `state.tapacantos` | 5, 11, 12, 14, 18, 26 | 5, 12, 15 |
| `state.componentes` | 5, 11, 12, 15, 18 | 5, 12, 15 |
| `state.componentesProyecto` | 6, 8, 11, 12, 18, 26 | 6 (`splice`), 12 |
| `state.boards` | 21, 22, 23, 24, 26, 29, 31 | 26 (`recalcular` reasigna el arreglo completo), 23 (muta objetos `board` individuales por referencia, sin pasar por `recalcular`) |
| `state.activeTab` | 24, 26 | 24 (cambio de pestaña), 26 |
| `state.ultimoTotal` | 25 (indirecto, vía `datos`), 26 | 26 |
| `state.ultimoReporte` | 26, 31 (usa `state.ultimoReporte` para que "Exportar" use los mismos números que la pantalla) | 26 |

## Qué datos viven todavía en el DOM (no en `state`)

- **Las piezas del proyecto no están en `state` en absoluto.** Viven exclusivamente como filas `<tr>` dentro de `#piezasBody`, con los valores en `dataset`/`value`/`checked` de cada input. `leerPiezas()` y `validarProyecto()` las leen directamente del DOM en cada recálculo; no existe un arreglo `state.piezas`. Esto es la dependencia de DOM más profunda de todo el archivo y la razón principal por la que "Filas de piezas" (grupo 17), "Validación" (grupo 18) y "Lectura de piezas" (grupo 19) están tan acoplados entre sí.
- Los valores de configuración de corte activos (kerf, márgenes exteriores) también se leen en vivo desde los inputs del panel "Ajustes de parámetros de corte" (`crearConfiguracionProyectoCorteActual`), no desde `state`.
- El estilo visual (colores, tamaños de letra, plantilla de reporte) vive en `localStorage` bajo la clave `ESTILO_KEY`, no en `state`.

## Variables de módulo fuera de `state`

Declaradas con `let`/`const` directamente en la IIFE, fuera del objeto `state`:

| Variable | Línea | Grupo | Propósito |
|---|---|---|---|
| `BOARD_W`, `BOARD_H` | 53-54 | 26 (`recalcular` las reasigna por material antes de empacar) | Medida "activa" del tablero durante el empaquetado de un material |
| `pieceCounter` | 55 | 17 | Consecutivo para el `id` de cada fila de pieza nueva |
| `consecutivosSkuCatalogo`, `consecutivoIdInternoCatalogo` | 74, 78 | 2 | Consecutivos de SKU/identidad interna |
| `importacionPendiente2DB` | 1831 | 11-12 | Lote de importación en espera de confirmación |
| `ESTILO_KEY` | 2886 | 13 | Clave de `localStorage` |
| `comboActivo` | 3105 | 14 | Combobox flotante actualmente abierto |
| `crearPendiente` | 3236 | 15 | Datos del modal "crear nuevo" en curso |
| `debounceTimer` | 5199 | 24 | Temporizador de `recalcularDebounced` |
| `resizeTimer` | 5701 | 27 | Temporizador del listener de `resize` de ventana |
| `promesaExcelJS`, `promesaJSZip` | 5714, 5745 | 28 | Cache de la promesa de carga de cada librería CDN |

Ninguna de estas variables está expuesta ni documentada como parte de un "estado global" formal; son estado mutable de closure, típico del patrón IIFE. Cualquier extracción de un grupo que dependa de una de estas variables (por ejemplo, mover "Filas de piezas" sin resolver `pieceCounter`) tendrá el mismo tipo de bloqueo ya documentado para `LIMITES` (reporte 16) y `ENCABEZADO_FORMATO` (reporte 20).

# 7. Dependencias entre grupos

Mapa de alto nivel (grupos numerados como en la sección 2/3):

```
Identidad y SKU (2) ──state──> Catálogos (5) ──llamada directa──> Combobox (14)
                                     │                                  │
                                     │                          Filas de piezas (17)
                                     │                                  │
Configuración jerárquica (3) ──llamada directa──> Validación (18) <────┘
                                     │                    │
                                     │                    ▼
                              Lectura de piezas (19) ──llamada directa──> Optimización (20)
                                                                                │
                                                                       state.boards
                                                                                ▼
                                                        Sobrantes y rects libres (21)
                                                                                │
                                                                                ▼
                                                              Diagrama SVG (22) <──DOM compartido── Edición manual (23)
                                                                                │
                                                                                ▼
                                                                  Render final (24)
                                                                                │
                                                                                ▼
                                                            Reporte de costos (25)
                                                                                │
                                                                                ▼
                                              recalcular() (26) ──coordina TODO lo anterior──
                                                                                │
                                        ┌───────────────────────────────────────┼───────────────────────────────────────┐
                                        ▼                                       ▼                                       ▼
                          Exportación DXF (29) ──eventos──         Exportación Excel (31) ──eventos──        Vista previa / import (11-12)
                                                                                                                       │
                                                                                                              llamada directa (recalcular)
```

Distinción de tipo de dependencia:

- **Llamada directa** (una función invoca a otra por su nombre): Catálogos → Combobox (`refrescarSelects`), Identidad y SKU → Catálogos (`registrarEventosSkuCatalogo`), Validación → Configuración jerárquica (`resolverParametrosCorteEtapa4`), Lectura de piezas → Optimización (indirecta, vía `recalcular`), Sobrantes → Diagrama SVG (`calcularFreeRectsPara` alimenta lo que se dibuja), Exportación DXF/Excel → `recalcular()`.
- **`state` compartido** (dos grupos leen/escriben la misma propiedad sin llamarse entre sí): Catálogos ↔ Vista previa de importación (ambos sobre `state.materiales`), Edición manual ↔ Render final (ambos sobre `state.boards`, pero `activarPiezasArrastrables` muta `board` directamente sin pasar por `recalcular`).
- **DOM compartido** (dos grupos leen/escriben los mismos elementos sin `state` de por medio): Filas de piezas ↔ Validación ↔ Lectura de piezas (los tres operan sobre `#piezasBody`), Personalización ↔ casi todos los grupos con render (variables CSS en `documentElement`).
- **Dependencia por eventos** (un `addEventListener` conecta dos grupos que de otro modo no se llaman): botones "Guardar" del grupo 7 → `recalcular()` (grupo 26); evento `input`/`change` de casi cualquier control → `recalcularDebounced` (grupo 24) → `recalcular()`; `confirmarImportacionVistaPrevia` (grupo 12) → `recalcular()`.

# 8. Zonas críticas

- **`recalcular()`**: es la única función que escribe `state.boards`, `state.activeTab`, `state.ultimoTotal` y `state.ultimoReporte` a la vez, y la única invocada, directa o indirectamente (vía `recalcularDebounced` o algún flujo de exportación/importación), por prácticamente cada evento de la interfaz. Cualquier extracción que cambie su firma, su orden de ejecución interno, o el momento en que limpia `state.boards` en los casos de error (líneas 5374, 5384, 5402) rompería el comportamiento observable de toda la aplicación.
- **`state.boards`**: se reasigna por completo en `recalcular()` (línea 5470: `state.boards = boardsAll;`), pero también se **muta objeto por objeto** desde la edición manual (`rotarPieza`, `espejarBoard`, `compactarHacia*`, `activarPiezasArrastrables`) sin pasar por `recalcular()`. Esto significa que existen dos caminos distintos que dejan `state.boards` en un estado "válido" para la interfaz: uno que reconstruye todo desde cero (optimización) y otro que edita en el sitio (edición manual). Cualquier módulo futuro que reciba `board` como parámetro debe documentar explícitamente si retorna un `board` nuevo o si lo muta in-place, porque hoy ambos patrones conviven.
- **Piezas almacenadas en el DOM**: como se documentó en la sección 6, no existe `state.piezas`. Esto es una decisión de diseño implícita, no accidental (permite edición inline sin sincronización), pero significa que **ningún módulo de "piezas" puede extraerse sin resolver antes cómo se le pasan los datos**: hoy la respuesta es "se lee `#piezasBody` directamente", lo cual ata ese futuro módulo al DOM de una forma que ninguno de los módulos ya extraídos (formato, validación, límites, CSV, geometría) tiene.
- **Optimizador** (`empacarMaterial`/`empacarConListaLibre`/`empacarConLista`): no tiene dependencias de DOM/state, pero es el código algorítmicamente más denso del archivo (usa `pseudoAleatorio`/`barajar` con semilla fija para probar varios órdenes y quedarse con el mejor). Un error de transcripción aquí (por ejemplo, en la condición `rightW <= bottomH` de `splitFreeRect`, función local no listada para extracción) cambiaría silenciosamente qué tableros/cortes se generan, sin lanzar ningún error — solo pruebas manuales de `docs/engineering/12-MANUAL-TESTS.md` (sección OPT) lo detectarían.
- **Edición manual del diagrama**: `activarPiezasArrastrables` registra `mousedown`/`mousemove`/`mouseup` directamente sobre los `<rect>` del SVG generado por `dibujarBoard`, y llama a `recalcularFreeRectsDesdeCero(board)` después de cada movimiento — es la única parte de la aplicación que actualiza el diagrama **sin** pasar por `recalcular()` completo. Cualquier extracción debe conservar esta ruta corta (mutar `board` + recalcular solo sus rects libres) sin convertirla accidentalmente en una llamada a `recalcular()` completo, que sería mucho más lenta y además re-leería el DOM de piezas.
- **Importación atómica**: `aplicarPiezasPendientes`, `construirAplicacionAtomicaMateriales/Componentes` aplican un lote completo de cambios a `state` de una sola vez ("todo o nada"); si una extracción futura separa la construcción del plan de aplicación (`construirAplicacionAtomica*`) de su ejecución real (`aplicarPiezasPendientes`), debe garantizar que ambas seguirán ejecutándose en la misma operación síncrona, sin permitir que otro evento (por ejemplo, un `recalcularDebounced` disparado por el usuario) se intercale a la mitad.
- **Exportación que dispara recálculo**: tanto `exportarDXFZip` (línea 5843: `if(!recalcular())`) como `exportarExcel` recalculan el proyecto completo antes de generar el archivo, para garantizar que exportan datos frescos. Esto significa que estas dos funciones de exportación **no son operaciones de solo lectura**: pueden cambiar `state.boards`/`state.activeTab` como efecto secundario de "solo exportar". Cualquier módulo futuro de exportación debe documentar explícitamente esta dependencia oculta.

# 9. Módulos candidatos

Para cada candidato: nombre sugerido, funciones, dependencias necesarias, precondiciones, pruebas y riesgo. **No se crean estos archivos en esta tarea.**

1. **`src/scripts/config/hierarchical-config.js`**
   - Funciones: `esObjetoPlanoConfiguracion`, `clonarValorConfiguracion`, `combinarConfiguraciones`, `obtenerValorConfiguracion`, `validarConfiguracionEtapa4`, `resolverConfiguracionJerarquica`, `resolverValorPorJerarquia`, `mensajesParametrosCorte`, y las constantes `NIVELES_CONFIGURACION_ETAPA4`, `CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4`, `REGLAS_CONFIGURACION_ETAPA4`, `CONFIGURACION_SISTEMA_ETAPA4`, `CONFIGURACION_BAMTECK_ETAPA4`.
   - Dependencias necesarias: ninguna externa.
   - Precondiciones: ninguna (ya es autocontenido según el propio comentario del código).
   - Pruebas: sandbox de Node comparando contra el original (mismo patrón de los reportes 15-26); no hay prueba manual específica en `12-MANUAL-TESTS.md` porque el propio código dice que esta capa "aun" no está conectada al resto de la aplicación — ARR-01 (arranque sin errores en consola) es la única verificación manual aplicable.
   - Riesgo: **Bajo**.

2. **`src/scripts/geometry/board-cutting.js`** (empaquetado)
   - Funciones: `pseudoAleatorio`, `barajar`, `empacarMaterial`, `empacarConListaLibre`, `empacarConLista` (con sus helpers locales `podarContenidos` ×2 y `splitFreeRect`, que deben viajar dentro del mismo archivo porque son closures, no funciones de nivel superior).
   - Dependencias necesarias: `window.ProyCutBasicGeometry` (`calcularHuellaEnRectangulo`, `capacidadLinealConKerf`).
   - Precondiciones: ninguna adicional; las dependencias ya están expuestas desde el reporte 23.
   - Pruebas: sandbox de Node con `datosTablero` sintético y comparación contra el original; pruebas manuales OPT-01 a OPT-08 (todo el bloque de optimización de `12-MANUAL-TESTS.md`).
   - Riesgo: **Medio** (por tamaño y densidad algorítmica, no por acoplamiento a DOM/state).

3. **`src/scripts/geometry/board-offcuts.js`** (sobrantes)
   - Funciones: `calcularSobrantes`, `areaSobranteTotal`, `contarCortes`, `calcularFreeRectsPara`, `crearFronterasEntrePiezas`, `crearFronterasPiezaSobrante`, `crearFronterasExteriores`, `reconstruirSobrantesYFronteras`, `recalcularFreeRectsDesdeCero`.
   - Dependencias necesarias: `window.ProyCutFreeRectangles` (`calcularRectsLibresDesdeObstaculos`), `obtenerAreaColocacionBoard` (candidato 6).
   - Precondiciones: extraer primero el candidato 6 (utilidades de tablero), o duplicar temporalmente `obtenerAreaColocacionBoard` — no recomendado; mejor resolver el orden en la Fase correspondiente (sección 10).
   - Pruebas: sandbox de Node; pruebas manuales REP-05/06 (sobrantes en el reporte), OPT-04/05.
   - Riesgo: **Medio**.

4. **`src/scripts/diagram/render-svg.js`**
   - Funciones: `dibujarBoard`, `piezasSeEncimanConOtras`.
   - Dependencias necesarias: `window.ProyCutFormat` (`fmt`, `fmtMoney`, `fuenteACss`).
   - Precondiciones: ninguna adicional.
   - Pruebas: sandbox de Node comparando el texto SVG generado byte a byte contra el original para varios `board`/`estilo` sintéticos; pruebas manuales DIAG-01 a DIAG-06 (comparación visual en navegador, pendiente por la limitación ya documentada de no contar con Playwright en este entorno).
   - Riesgo: **Medio** (tamaño grande, pero sin acoplamiento a DOM/state).

5. **`src/scripts/dxf/dxf-export.js`** (la "Fase A — DXF puro" más evidente del código real)
   - Funciones puras: `grupoDxf`, `polilineaRectDxf`, `construirDXFTablero`, `nombreArchivoSeguro`. La función `exportarDXFZip` (con DOM, `state.boards` y `recalcular()`) **debería quedarse en `main.js`** o, como máximo, en un archivo de "coordinadores de exportación" separado, no junto a las funciones puras.
   - Dependencias necesarias: ninguna.
   - Precondiciones: ninguna.
   - Pruebas: sandbox de Node comparando el texto DXF generado contra el original, para tableros con 0, 1 y varias piezas; prueba manual DXF-01 a DXF-05 (abrir el archivo generado en un visor CAD, fuera del alcance de este entorno).
   - Riesgo: **Bajo**.

6. **`src/scripts/geometry/board-area.js`** (utilidades de tablero y precio)
   - Funciones: `obtenerAreaColocacionBoard`, `obtenerKerfMaterial`, `textoSeguroParaExcel`, `resumenErrores`.
   - Dependencias necesarias: ninguna.
   - Precondiciones: ninguna.
   - Pruebas: sandbox de Node; sin prueba manual dedicada (son utilidades de soporte, cubiertas indirectamente por OPT-01 y XLS-01).
   - Riesgo: **Bajo**.

7. **`src/scripts/interface/style.js`** (personalización)
   - Funciones: `cargarEstiloGuardado`, `guardarEstilo`, `aplicarEstiloGlobal`, `aplicarVisibilidadBotones`, `leerEstilo`.
   - Dependencias necesarias: `window.ProyCutFormat` (`fuenteACss`).
   - Precondiciones: ninguna; usa `localStorage` y `document`, pero de forma autocontenida (no toca `state`).
   - Pruebas: no es sandboxeable de forma útil en Node (depende de `document`/`localStorage` reales); pruebas manuales PERS-01 a PERS-07 completas.
   - Riesgo: **Bajo-Medio** (por el volumen de IDs de DOM referenciados, no por lógica compleja).

8. **`src/scripts/interface/resize.js`** (redimensionamiento)
   - Funciones: `activarColumnasRedimensionables`, `activarDivisorColumnas`.
   - Dependencias necesarias: ninguna.
   - Precondiciones: ninguna.
   - Pruebas: solo manuales, RSZ-01 a RSZ-05 (requiere interacción de arrastre en navegador real).
   - Riesgo: **Bajo**.

9. **`src/scripts/import/excel-loader.js`** (carga diferida de librerías)
   - Funciones: `cargarExcelJS`, `cargarJSZip`.
   - Dependencias necesarias: ninguna.
   - Precondiciones: ninguna.
   - Pruebas: sandbox de Node solo para confirmar que la lógica de cache de promesa (`promesaExcelJS`/`promesaJSZip`) no cambia; la carga real del CDN solo se prueba manualmente (XLS-01, DXF-01).
   - Riesgo: **Bajo**.

# 10. Orden recomendado de modularización

El código real indica un orden distinto al ejemplo orientativo del enunciado, porque en ProyCut la configuración jerárquica y las utilidades de tablero están más aisladas que el propio DXF (que sí es puro, pero su único consumidor real —`exportarDXFZip`— es un coordinador crítico que conviene dejar en `main.js` un poco más).

- **Fase A — Configuración jerárquica** (candidato 1). Riesgo bajo, cero acoplamiento, ya documentado como "no conectado todavía" por el propio código. Es la extracción más segura posible hoy.
- **Fase B — Utilidades de tablero y precio + carga diferida de librerías** (candidatos 6 y 9). Ambas son de bajo riesgo y no dependen entre sí; pueden hacerse en el mismo commit o en dos consecutivos.
- **Fase C — DXF puro** (candidato 5, solo las 4 funciones puras). Deja `exportarDXFZip` en `main.js`, destructurando las 4 funciones desde el nuevo módulo, igual que se hizo con `separarLineaCSV`/`parsearCSV` en los reportes 20 y 22.
- **Fase D — Redimensionamiento** (candidato 8). Aislado del resto de la aplicación; buen candidato de "victoria rápida" adicional si se quiere una fase extra de bajo riesgo antes de tocar algo con DOM más denso.
- **Fase E — Personalización** (candidato 7). Depende de `format.js` (ya extraída); alto volumen de IDs de DOM pero sin lógica de negocio compleja.
- **Fase F — Optimizador (empaquetado)** (candidato 2). Depende de `basic-geometry.js` (ya extraída); es la primera extracción "algorítmicamente pesada", pero sin DOM/state, así que su riesgo es de transcripción, no de arquitectura.
- **Fase G — Sobrantes y rectángulos libres del tablero** (candidato 3). Depende de `free-rectangles.js` (ya extraída) y del candidato 6 (Fase B).
- **Fase H — Diagrama SVG** (candidato 4). Depende de `format.js`; conviene hacerla después del optimizador y de sobrantes porque `dibujarBoard` consume `board.freeRects`/`board.pieces` ya calculados por esos dos grupos.
- **Fase I — Catálogos + Identidad y SKU** (grupos 2 y 5 juntos). Alto acoplamiento a DOM/state, pero autocontenido entre sí (no dependen del optimizador ni de piezas). Es la primera fase con riesgo Alto de esta lista.
- **Fase J — Coordinadores** (`recalcular`, `validarProyecto`, `leerPiezas`, `renderDiagrama`, `exportarExcel`, `confirmarImportacionVistaPrevia`, `empacarMaterial` como despachador, edición manual). Se hace al final, cuando todo lo que coordinan ya vive en módulos separados con interfaces estables — exactamente como advierte la sección 5.

No se propone una fase separada para "Filas de piezas" / "Validación" / "Lectura de piezas" / "Vista previa e importación atómica" porque, según la sección 6, todas comparten el mismo DOM sin `state.piezas` de por medio; extraer cualquiera de las tres sin resolver antes esa dependencia (ver sección 11) generaría un módulo que de todos modos necesita `document.querySelectorAll('#piezasBody tr')` como entrada, lo cual no reduce acoplamiento real, solo mueve código. Esa decisión de diseño (¿introducir `state.piezas`, o aceptar que "piezas" seguirá siendo un módulo con DOM?) es arquitectónica y debe resolverse explícitamente en una tarea futura, no implícitamente durante una extracción mecánica.

# 11. Bloqueos técnicos

- **`pieceCounter`** (variable de módulo, línea 55): bloquea extraer "Filas de piezas" (grupo 17) sin decidir si el contador viaja con el nuevo módulo (rompiendo el patrón "todo se destructura desde `window.ProyCutXxx`" usado hasta ahora, porque `pieceCounter` es mutable y compartido) o si se expone también vía un getter/setter.
- **`splitFreeRect`, `contenido`** (funciones locales dentro de `empacarConListaLibre`/`empacarConLista`): mismo patrón que bloqueó `parsearCSV`/`podarRectsContenidos` en los reportes 20 y 25 — son closures, no funciones de nivel superior, así que solo pueden extraerse junto con la función que las contiene, nunca por separado.
- **`podarContenidos` (×2, local a cada función de empaquetado)**: ya documentado en el reporte 24 como no extraíble tal como está nombrado; sigue vigente. Si el candidato 2 (Fase F) se extrae, estas dos implementaciones locales viajan tal cual, sin unificarse (unificarlas sería una refactorización funcional, no mecánica, y está fuera del alcance de una extracción).
- **Dependencia de IDs del DOM**: casi todos los grupos de la sección 3 referencian docenas de IDs literales (`document.getElementById('tableroLargo')`, etc.). Ningún grupo puede extraerse "a ciegas": cada extracción debe verificar, como se hizo en los reportes 15-26, que el archivo de destino sigue viendo el mismo DOM real en el mismo momento del ciclo de carga.
- **Mutación de `state.boards` desde dos caminos distintos** (ya descrito en la sección 8): bloquea extraer "Edición manual" (grupo 23) de forma aislada de "Sobrantes" (grupo 21) y "Render final" (grupo 24), porque las tres funciones que mutan `board` in-place dependen de `recalcularFreeRectsDesdeCero`, que a su vez es del grupo 21.
- **Llamadas recíprocas entre importación y catálogos**: `renderMateriales`/`Tapacantos`/`Componentes` (grupo 5) son llamadas tanto desde la edición manual de catálogo (grupo 2/15) como desde la aplicación atómica de importación (grupo 12); y la aplicación atómica, a su vez, llama `agregarPiezaDesdeColumnas` (grupo 9), que vive casi 1200 líneas antes en el archivo. No hay un "dueño" claro de esa función: físicamente está en la sección de importación de piezas, pero su único llamador real es la aplicación atómica de importación.
- **Datos sin dueño claro**: la variable `configuracionesEtapa4.piezas` (línea 453, `Object.create(null)`) está preparada para guardar configuración por pieza usando `row.dataset.id` como clave, pero ninguna función de la interfaz la escribe todavía (se confirmó leyendo el grupo 3 completo). Es estado "fantasma": existe, se lee (`resolverParametrosCorteEtapa4(piezaId)`), pero nada lo llena hoy. Cualquier extracción de "Configuración jerárquica" debe documentar esto explícitamente para no dar la impresión de que es una función completa cuando parte de su superficie está sin usar.
- **`ExcelJS`/`JSZip` como variables globales inyectadas por CDN**: `construirLibroExcel`, `construirLibroFormatoProyecto`, `exportarDXFZip` reciben la librería ya cargada como parámetro (`ExcelJSLib`, `JSZipLib`) en unos casos, pero acceden a `window.ExcelJS`/`window.JSZip` directamente en otros (`cargarExcelJS`/`cargarJSZip`). Cualquier módulo de exportación futuro debe mantener consistente esta forma de recibir la librería.

# 12. Estrategia de pruebas

Para cada fase de la sección 10, las pruebas de `docs/engineering/12-MANUAL-TESTS.md` que deberían ejecutarse antes de dar la fase por cerrada (además de las pruebas automáticas en sandbox de Node, que son obligatorias en las 10 fases):

| Fase | Pruebas manuales relevantes |
|---|---|
| A — Configuración jerárquica | ARR-01 (arranque sin errores en consola) |
| B — Utilidades de tablero/precio + carga diferida | ARR-01, OPT-01, XLS-01, DXF-01 (confirmar que la carga de librerías sigue funcionando) |
| C — DXF puro | DXF-01 a DXF-05 (comparar el contenido del archivo `.dxf` generado, no solo que se descargue) |
| D — Redimensionamiento | RSZ-01 a RSZ-05 |
| E — Personalización | PERS-01 a PERS-07, PST-01 (confirmar que el estilo se conserva tras recargar) |
| F — Optimizador | OPT-01 a OPT-08 (todo el bloque), LIM-01 a LIM-09 (casos límite: cero piezas, piezas que no caben, etc.) |
| G — Sobrantes y rects libres | OPT-04, OPT-05, REP-05, REP-06 (sobrantes en el reporte) |
| H — Diagrama SVG | DIAG-01 a DIAG-06 |
| I — Catálogos + Identidad y SKU | MAT-01 a MAT-07, TAP-01 a TAP-06, COMP-01 a COMP-06, MENU-01 a MENU-08 |
| J — Coordinadores | Regresión **completa**: las 135 pruebas de `12-MANUAL-TESTS.md`, priorizando el subconjunto CRITICAL (ARR, PZ, MAT, OPT, DIAG, PST, XLS, DXF, CSV, EXC, FMT, DEMO), antes de considerar terminada cualquier extracción de `recalcular`, `validarProyecto`, `leerPiezas` o `renderDiagrama`. |

En todas las fases, además: `node --check` sobre todos los archivos JS afectados, verificación HTTP 200 vía servidor estático local, y `diff`/checksum del cuerpo de cada función movida contra el commit anterior — el mismo procedimiento ya seguido en los doce reportes de extracción completados.

# 13. Estrategia de Git

- **Tamaño máximo por commit**: una fase de la sección 10 como máximo; dentro de una fase grande (por ejemplo, Fase F u H), un commit por función o por grupo pequeño de funciones fuertemente relacionadas (como ya se hizo: `format.js` en un commit, `validation.js` en dos commits porque `LIMITES` bloqueó parte del trabajo, `free-rectangles.js` en tres commits porque cada función se desbloqueó en un momento distinto).
- **Una responsabilidad por commit**: nunca mezclar una extracción mecánica con una corrección de comportamiento, aunque se detecte un bug real durante la lectura (documentarlo aparte, como se hizo con el hallazgo de "Etapa 4 sin conectar" en este mismo reporte).
- **Cuándo crear ramas**: este proyecto no ha usado ramas hasta ahora (todos los commits se hicieron directo sobre la rama principal, uno por extracción). Se recomienda seguir así mientras cada commit sea pequeño y reversible; considerar una rama solo si se decide abordar una Fase completa (por ejemplo, Fase J) como una serie larga de commits que no se quiere exponer en la rama principal hasta terminar toda la regresión de la sección 12.
- **Cuándo hacer rollback**: inmediatamente si `node --check` falla, si una verificación HTTP deja de responder `200`, si el `diff` de una función movida no es idéntico al original, o si cualquier prueba automática en sandbox de Node no coincide con el comportamiento original — el mismo criterio aplicado en los doce reportes anteriores.
- **Cuándo detener una extracción**: si, durante la evaluación de pureza, se descubre que una función depende de algo no autorizado en el alcance de la tarea (una constante, otra función, una variable de módulo) — no ampliar el alcance unilateralmente; extraer solo lo que sí cumple, documentar el resto como pendiente (patrón ya usado en los reportes 16, 20, 24 y 25), y no forzar la extracción del resto en el mismo commit.

# 14. Criterios para considerar un módulo terminado

Un módulo (o fase) se considera terminado cuando, **todos** a la vez:

- Las funciones planeadas para esa fase están movidas al archivo destino, byte-idénticas al original (verificado por `diff`).
- Todas las llamadas existentes a esas funciones, en cualquier parte de `main.js`, siguen exactamente iguales (verificado por comparación textual contra el commit anterior).
- Las dependencias del nuevo módulo (hacia otros módulos ya extraídos, o hacia `main.js` si aplica) están expresadas explícitamente mediante `const {...} = window.ProyCutXxx;`, sin variables implícitas de closure compartidas por accidente.
- Las pruebas automáticas en sandbox de Node (comparación contra una copia de control del código original) pasan al 100%.
- Las pruebas manuales de `docs/engineering/12-MANUAL-TESTS.md` listadas para esa fase en la sección 12 de este documento se ejecutan en un navegador real y pasan (esto sigue pendiente en todo el trabajo hecho hasta ahora, por la limitación de tooling ya documentada en los reportes 13-26).
- El reporte de extracción correspondiente existe en `docs/engineering/`, con las mismas secciones usadas en los reportes 15-26 (objetivo, funciones evaluadas/extraídas/descartadas, evidencia de pureza, comparación, pruebas, riesgos, reversión).
- `git diff --stat` y `git status --short` muestran únicamente los archivos esperados (el/los archivo(s) de módulo, `main.js`, `index.html` si el orden de carga cambió, y el reporte).
- El commit está hecho con un mensaje que sigue la convención `refactor(<dominio>): <descripción corta>` ya usada en los doce commits anteriores.
- Push realizado (o, si se sigue el patrón actual, entregado explícitamente al usuario para que decida cuándo hacer push — hasta ahora ningún commit de esta serie se ha empujado por parte de la IA, siempre a petición y ejecución del usuario).
- `git status --short` queda limpio (working tree clean) después del commit, sin archivos residuales de prueba fuera del scratchpad.

# 15. Próximos tres cambios recomendados

1. **Extraer la configuración jerárquica (Etapa 4) a `src/scripts/config/hierarchical-config.js`.**
   - Objetivo: mover las 8 funciones puras y las 5 constantes de configuración jerárquica (`esObjetoPlanoConfiguracion` … `mensajesParametrosCorte`, `NIVELES_CONFIGURACION_ETAPA4`, `CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4`, `REGLAS_CONFIGURACION_ETAPA4`, `CONFIGURACION_SISTEMA_ETAPA4`, `CONFIGURACION_BAMTECK_ETAPA4`), dejando en `main.js` únicamente `leerNumeroConfiguracionCorte`, `obtenerControlesMargenesExteriores`, `actualizarControlesMargenesExteriores`, `crearConfiguracionProyectoCorteActual`, `fuentesConfiguracionCorteActual` y `resolverParametrosCorteEtapa4` (que sí tocan DOM y deben evaluarse en una tarea posterior, no en esta).
   - Archivos afectados: `src/scripts/config/hierarchical-config.js` (nuevo), `src/scripts/main.js`, `index.html` (agregar el `<script>` antes de `main.js`).
   - Riesgo: Bajo.
   - Dependencias: ninguna (candidato 1 de la sección 9).
   - Commit sugerido: `refactor(config): extract hierarchical configuration model`.

2. **Extraer las utilidades de tablero y precio a `src/scripts/geometry/board-area.js`.**
   - Objetivo: mover `obtenerAreaColocacionBoard`, `obtenerKerfMaterial`, `textoSeguroParaExcel`, `resumenErrores` (candidato 6). `obtenerMedidaTableroDefault`/`medidaTableroDeMaterial` se quedan en `main.js` en esta tarea porque dependen de `document.getElementById`/`state.materiales` y merecen su propia evaluación de pureza posterior.
   - Archivos afectados: `src/scripts/geometry/board-area.js` (nuevo), `src/scripts/main.js`, `index.html`.
   - Riesgo: Bajo.
   - Dependencias: ninguna.
   - Commit sugerido: `refactor(geometry): extract board area and price utilities`.

3. **Extraer las 4 funciones puras de DXF a `src/scripts/dxf/dxf-export.js`.**
   - Objetivo: mover `grupoDxf`, `polilineaRectDxf`, `construirDXFTablero`, `nombreArchivoSeguro` (candidato 5, primera mitad). `exportarDXFZip` se queda en `main.js` en esta tarea, destructurando las 4 funciones desde el nuevo módulo — mismo patrón usado con `separarLineaCSV`/`parsearCSV`.
   - Archivos afectados: `src/scripts/dxf/dxf-export.js` (nuevo), `src/scripts/main.js`, `index.html`.
   - Riesgo: Bajo.
   - Dependencias: ninguna.
   - Commit sugerido: `refactor(dxf): extract pure DXF generation utilities`.

# 16. Qué no tocar todavía

- `recalcular()` completa.
- `validarProyecto()`, `leerPiezas()` (mientras "piezas" siga sin `state.piezas` propio).
- `renderDiagrama()`, `activarPiezasArrastrables()` y el resto de "Edición manual" (grupo 23), por la mutación directa de `state.boards`.
- `aplicarPiezasPendientes`, `construirAplicacionAtomicaMateriales`/`Componentes`, y los manejadores de `confirmarImportacionVistaPrevia`/`importarArchivoBtn`.
- `exportarExcel()` y `construirLibroExcel()` (la función más grande del archivo) — dejar para una fase dedicada, no incluirla "de paso" en ninguna extracción menor.
- `empacarMaterial`/`empacarConListaLibre`/`empacarConLista` fuera de una fase dedicada (Fase F), y siempre juntas (no una función de las tres suelta).
- Cualquier función local (closures) mencionada en la sección 11: `splitFreeRect`, `contenido` (×2), `podarContenidos` (×2), `validarNodo`, `restaurarValor`/`restaurarBooleano` (dentro de `cargarEstiloGuardado`), `onMouseMove`/`onMouseUp` (dentro de `activarDivisorColumnas`).
- `state`, `configuracionesEtapa4`, `BOARD_W`/`BOARD_H`, `pieceCounter` y el resto de variables de módulo listadas en la sección 6 — no mover, no renombrar, no envolver, hasta que exista un plan explícito para cada una.
- `index.html`, CSS, y cualquier función de personalización visual del diagrama fuera de las ya extraídas (`format.js`).

# 17. Conclusión

El proyecto **sí está listo** para continuar la modularización por dominios, pero solo si se respeta el orden de la sección 10: primero las zonas ya demostrado-aisladas por el propio código (configuración jerárquica, utilidades de tablero, DXF puro), después las de acoplamiento medio (personalización, redimensionamiento, optimizador, sobrantes, diagrama SVG), y solo al final los grupos con dependencia real de DOM/`state` (catálogos, piezas) y los coordinadores (`recalcular`, `validarProyecto`, `leerPiezas`, `renderDiagrama`, `exportarExcel`). El patrón mecánico usado en los doce reportes anteriores (evaluación de pureza explícita, extracción vía `sed`, verificación byte a byte, pruebas en sandbox de Node comparando contra el código original, reporte estructurado, sin commit automático) ha demostrado ser seguro y debe repetirse sin cambios para cada fase futura.

**Siguiente cambio exacto recomendado**: extraer la configuración jerárquica de la Etapa 4 (`esObjetoPlanoConfiguracion`, `clonarValorConfiguracion`, `combinarConfiguraciones`, `obtenerValorConfiguracion`, `validarConfiguracionEtapa4`, `resolverConfiguracionJerarquica`, `resolverValorPorJerarquia`, `mensajesParametrosCorte`, y sus 5 constantes) hacia `src/scripts/config/hierarchical-config.js`, exactamente como se describe en el punto 1 de la sección 15. Es la extracción de menor riesgo disponible hoy: el propio código documenta que este subsistema todavía no está conectado a ninguna otra parte de la aplicación.

---

# Resumen final

- **Líneas actuales de `main.js`**: 6706.
- **Grupos identificados**: 32.
- **Módulos candidatos propuestos**: 9.
- **Próximos tres cambios recomendados**:
  1. Extraer configuración jerárquica (Etapa 4) → `src/scripts/config/hierarchical-config.js`.
  2. Extraer utilidades de tablero y precio → `src/scripts/geometry/board-area.js`.
  3. Extraer las 4 funciones puras de DXF → `src/scripts/dxf/dxf-export.js`.
- **Riesgos principales**: `recalcular()` como coordinador central de todo el sistema; mutación directa de `state.boards` desde dos caminos distintos (optimización completa vs. edición manual); ausencia de `state.piezas` (las piezas viven solo en el DOM); el tamaño y densidad de `construirLibroExcel` (~503 líneas) y `empacarConLista` (~302 líneas); y la imposibilidad, en este entorno, de ejecutar pruebas manuales reales en navegador para validar cualquier extracción futura de las zonas visuales (diagrama, personalización, redimensionamiento).
