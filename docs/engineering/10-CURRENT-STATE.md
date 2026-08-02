# 10-CURRENT-STATE.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Documentar el estado técnico real de `index.html` — estructura, funcionalidades, flujo de datos y comportamientos pendientes de verificar — como base objetiva y verificable para cualquier reorganización futura del código.

## Depende de
`docs/engineering/00-SYSTEM-UNDERSTANDING.md` (contexto de comprensión funcional del sistema); `index.html` (fuente analizada, revisado íntegro en tres pasadas)

## Referenciado por
Pendiente de mapear (documento nuevo). Nota: `README.md` y `docs/engineering/ROADMAP.md` anticipan un entregable equivalente bajo el nombre `docs/CURRENT-STATE.md` (sin prefijo numérico ni carpeta `engineering/`); no se modificó esa referencia porque está fuera del alcance de esta tarea.

## Responsable
PENDIENTE

---

Este documento consolida tres análisis previos de `index.html` (inventario, organización interna y dependencias, flujo de información) en una sola radiografía técnica. Describe el sistema **tal como existe hoy**, no como debería existir. No propone reorganización, no recomienda tecnologías y no elimina ni renombra nada.

# 1. Resumen ejecutivo

`index.html` es un archivo único de **8,162 líneas (~401 KB)**. Su propósito observable es servir como módulo de captura de piezas, optimización de corte, cálculo de precio y generación de diagramas/exportables para un solo trabajo a la vez — no hay concepto de proyecto, cliente ni empresa dentro del archivo (sección 19).

Su alcance actual cubre el ciclo completo desde la captura de una pieza hasta la exportación a Excel o DXF, incluyendo edición manual del acomodo de corte. Como limitación general observable, todo el código vive en un único archivo dentro de una sola función autoejecutable, sin separación física en capas ni módulos (sección 2), y coexisten dos sistemas de configuración de corte con distinto grado de conexión real (sección 20).

**No existe backend**: no se detectó ninguna llamada `fetch` ni `XMLHttpRequest` hacia un servidor propio en todo el archivo; toda la lógica corre en el navegador.

**Se pierden al recargar la página**: las piezas capturadas, el catálogo de materiales/tapacantos/componentes, los parámetros de corte y el resultado de optimización. Lo único que sobrevive a una recarga son las preferencias visuales, guardadas en `localStorage` (sección 5).

# 2. Estructura física

| Bloque | Líneas |
|---|---|
| CSS (`<style>`, dentro de `<head>`) | 7–484 |
| HTML (`<body>`) | 486–1186 |
| JavaScript (`<script>`) | 1187–8160 |

Todo el JavaScript está contenido dentro de una única IIFE `(function(){...})()` (líneas 1188–8159). No existe ninguna separación en archivos externos, módulos ES, ni siquiera en funciones agrupadas por espacio de nombres — todas las funciones y variables comparten el mismo closure.

# 3. Funcionalidades actuales

| Funcionalidad | Estado |
|---|---|
| Piezas (captura, edición, validación, expansión por cantidad) | Completa |
| Catálogo de Materiales / Tapacantos / Componentes (alta, edición, borrado, SKU automático) | Completa |
| Costeo (material, componentes, corte, tapacanto, total) | Completa dentro de su flujo normal — ver sección 17 sobre su actualización tras edición manual del diagrama |
| Optimización de corte (3 niveles, modo guillotina y modo libre) | Completa |
| Diagramas SVG interactivos | Completa |
| Edición manual (mover, rotar, espejar, compactar) | Completa como interacción; su efecto sobre el costo mostrado no está confirmado — ver sección 17 |
| Importación CSV (solo piezas) | Completa |
| Importación Excel de proyecto (piezas + componentes + materiales, con vista previa) | Completa |
| Importación de formato de catálogo (`PROYCUT_CATALOG_FORMAT`, "CAT-7") | Preparada pero sin interfaz — funciones de lectura y validación completas (líneas 2943–3108), sin ningún botón o menú que las invoque |
| Exportación "Exportar formato" (Excel reimportable) | Completa |
| Exportación Excel completo (Reporte + Piezas y diagramas + Resumen) | Completa |
| Exportación DXF (por tablero, en ZIP) | Completa dentro de su alcance (solo geometría, sin costo) |
| Personalización de apariencia | Completa |
| Almacenamiento visual (persistencia de preferencias) | Completa, pero limitada a preferencias — no incluye datos de trabajo (sección 5) |
| Configuración jerárquica de corte ("Etapa 4": veta, apilado, política de rotación, piezas que no caben, etc.) | Preparada pero sin interfaz, salvo el subconjunto kerf/márgenes — líneas 1466–1878 |
| "Confirmar pedido" | Demostrativa — solo `alert()`, menciona integración futura con WooCommerce (línea 8055) |
| "Mi cuenta" / "Academia" / "Centro de ayuda" | Demostrativas — solo `alert()` de "próximamente disponible" (líneas 2489–2500) |

# 4. Interfaz actual

- **Paneles de configuración** (uno visible a la vez, ocultan el resto de la pantalla): `tablerosPanel`, `cubrecantoPanel`, `componentesPanel`, `estiloPanel`, `configPanel`.
- **Tablas**: `tablaMateriales`, `tablaTapacantos`, `tablaComponentes`, `tablaComponentesProyecto`, `tablaPiezas`, `tablaVistaPreviaComponentes`, `tablaVistaPreviaMateriales`.
- **Formularios**: cada tabla es editable en línea; subpanel "Agregar componentes"; subpanel "Importar" con selección de archivo.
- **Menús**: "Materiales" (Placas y tableros / Cubre canto / Componentes), "Preferencias" (Ajuste de la interfaz / Ajustes de parámetros de corte), "Ayuda" (Academia / Centro de ayuda), "Mi cuenta"; menú "Archivo" (Exportar formato / Importar); menú "Espejo" (pegar arriba/abajo/izquierda/derecha).
- **Modal**: confirmación de precio al crear un material/tapacanto/componente nuevo desde un buscador.
- **Subpaneles**: agregar componentes al proyecto, importar archivo, vista previa de importación con políticas de cantidad/precio.
- **Área principal**: layout de dos columnas (piezas + precio a la izquierda, diagrama a la derecha), con un divisor arrastrable (`splitResizer`).
- **Elementos interactivos**: combobox buscable (material, tapacanto, componente), checkbox de 3 estados para "Girar", selector visual de cantos (SVG), columnas de tabla redimensionables, piezas arrastrables y rotables directamente sobre el diagrama.
- **Áreas de reporte y diagramas**: `reportePanel` (4 plantillas visuales: columnas, lista, tarjetas, factura), `resultadoPanel` (pestañas por tablero, SVG del diagrama, lista de sobrantes aprovechables).

# 5. Estado y almacenamiento

**`state`** contiene: `materiales[]`, `tapacantos[]`, `componentes[]`, `componentesProyecto[]`, `boards[]`, `activeTab`, `ultimoTotal`, `ultimoReporte` (línea 1193).

**En el DOM**: las piezas capturadas viven únicamente en `#piezasBody` — no existe una copia de las piezas en `state`. Los valores actuales de parámetros de corte y de preferencias visuales también residen solo en los controles del DOM mientras no se persisten explícitamente.

**Variables de módulo** (fuera de `state`, persistentes durante la sesión): `BOARD_W`/`BOARD_H`, `pieceCounter`, `consecutivosSkuCatalogo`, `consecutivoIdInternoCatalogo`, `configuracionesEtapa4`, `debounceTimer`, `importacionPendiente2DB`, `crearPendiente`, `comboActivo`, `promesaExcelJS`, `promesaJSZip`.

**Datos temporales**: `importacionPendiente2DB` (existe solo mientras hay una vista previa de importación abierta), `crearPendiente` (mientras el modal de "crear nuevo" está abierto), `comboActivo` (mientras un buscador está desplegado).

**`localStorage`**: una sola clave, `occ_bamteck_estilo_v1`, exclusivamente para preferencias visuales (línea 4184).

**No sobreviven a una recarga de página**: piezas, catálogo de materiales/tapacantos/componentes, parámetros de corte, resultado de optimización (`state.boards`) y reporte de precio. Solo las preferencias visuales persisten.

# 6. Flujo de inicialización

Orden de ejecución al cargar la página (no hay `DOMContentLoaded`; el `<script>` está al final del `<body>`):

1. `asegurarIdentidadInternaCatalogos(state)`, `inicializarConsecutivosSku(state)`, `completarSkuVaciosCatalogos(state)` — inicialización de identidad/SKU de los catálogos semilla (líneas 1462–1464).
2. Definición de todas las funciones y registro progresivo de `addEventListener` a medida que el código los declara.
3. `cargarEstiloGuardado()` — carga de apariencia desde `localStorage`, si existe (línea 4355).
4. `renderMateriales()`, `renderTapacantos()`, `renderComponentes()`, `renderComponentesProyecto()` — renderes iniciales de catálogo (líneas 4990–4993).
5. `ajustarAlturaTabla()` (línea 4996).
6. `activarColumnasRedimensionables()`, `activarDivisorColumnas()` (líneas 8154–8155).
7. `recalcular()` — última línea antes de cerrar la IIFE (línea 8158); con 0 piezas capturadas no genera diagrama ni reporte, pero deja la interfaz en un estado consistente con `state` inicial.

# 7. Flujo principal de actualización

```text
evento de interfaz (editar pieza, catálogo o parámetro de corte)
→ recalcularDebounced()          (espera 200 ms)
→ recalcular()
   → validarProyecto()
   → resolverParametrosCorteEtapa4()
   → leerPiezas()
   → empacarMaterial()  →  empacarConLista() / empacarConListaLibre()
   → cálculo de costos (material, componentes, corte, tapacanto)
   → renderDiagrama()  →  dibujarBoard()
   → renderReporte()  →  renderReporteColumnas()/Lista()/Tarjetas()/Factura()
```

**Acciones que NO pasan por `recalcular()`**: mover, rotar, espejar o compactar una pieza directamente en el diagrama. Estas llaman `recalcularFreeRectsDesdeCero()` y `renderDiagrama()` de forma directa (ver sección 17, comportamiento pendiente de verificar en ejecución).

Las tres rutas de exportación (`exportarExcel`, `exportarDXFZip`, `descargarFormato`) cancelan el debounce pendiente y llaman `recalcular()` de forma síncrona antes de generar el archivo.

# 8. Grupos funcionales

- **Estado y configuración**: `state`, `LIMITES`, `configuracionesEtapa4`, `REGLAS_CONFIGURACION_ETAPA4`, `resolverConfiguracionJerarquica`.
- **Identidad y SKU**: `crearIdInternoCatalogo`, `generarSkuAutomatico`, `crearRegistroCatalogo`, `guardarSkuCatalogoDesdeTabla` (líneas 1215–1460).
- **Catálogos**: `renderMateriales`, `renderTapacantos`, `renderComponentes`, `medidaTableroDeMaterial`.
- **Piezas**: `addPiezaRow`, `renumerarFilas`, `leerPiezas`, `attachGirarToggle`, selector visual de cantos.
- **Componentes (del proyecto)**: `renderComponentesProyecto`, `etiquetaComponente`, `cantidadProyectoParaComponente`.
- **Validación**: `validarProyecto`, `validarNumeroEntrada`, `validarCantidad`, `validarMedida`, `validarPrecio`.
- **Costos**: cálculo de subtotales dentro de `recalcular()` (líneas 6913–7012).
- **Optimización**: `empacarMaterial`, `empacarConLista`, `empacarConListaLibre`, `pseudoAleatorio`/`barajar`, funciones de rectángulos libres.
- **Diagramas**: `dibujarBoard`, `renderDiagrama`, `rotarPieza`, `espejarBoard`, `compactarHacia*`, `calcularImanes`, `activarPiezasArrastrables`.
- **Reportes**: `renderReporte` y sus 4 plantillas.
- **Importación**: `parsearCSV`, `extraerProyectoDesdeLibroExcel`, `extraerCatalogoDesdeLibroExcel`, `prepararVistaPreviaComponentes`/`Materiales`, `construirAplicacionAtomicaComponentes`/`Materiales`.
- **Exportación**: `construirLibroFormatoProyecto`, `construirLibroExcel`, `construirDXFTablero`, `exportarExcel`, `exportarDXFZip`, `cargarExcelJS`, `cargarJSZip`.
- **Interfaz**: `crearMenuTexto`, `cerrarTodoElMenu`, `actualizarVisibilidadInterfaz`, `attachComboBuscable`, `attachEnterNavegable`, `activarColumnasRedimensionables`, `activarDivisorColumnas`.
- **Personalización**: `leerEstilo`, `aplicarEstiloGlobal`, `aplicarVisibilidadBotones`.
- **Persistencia**: `guardarEstilo`/`cargarEstiloGuardado` — es la única funcionalidad de persistencia entre sesiones que existe en el archivo.

# 9. Dependencias internas

Se distinguen cuatro tipos de relación:

**Llamada directa (confirmada):**
- Piezas → Validación → Costos → Optimización → Diagramas (todas dentro de `recalcular()`).
- Identidad/SKU → Catálogos (`crearRegistroCatalogo` se usa en alta manual y en importación).
- Optimización → Diagramas (`dibujarBoard` recibe `board.pieces` ya calculado).
- Exportación → Piezas/Optimización (`exportarExcel`/`exportarDXFZip` llaman `recalcular()` antes de generar el archivo).

**Dependencia mediante `state` (confirmada):**
- Piezas lee `state.materiales`/`state.tapacantos` para poblar sus buscadores.
- Costos lee `state.materiales`/`state.tapacantos`/`state.componentesProyecto` dentro de `recalcular()`.
- Diagramas y Exportación leen/mutan `state.boards`.
- Importación escribe `state.componentes`, `state.componentesProyecto`, `state.materiales`.

**Dependencia mediante DOM (confirmada):**
- `leerPiezas()` y `validarProyecto()` leen directamente nodos de `#piezasBody`.
- `resolverParametrosCorteEtapa4()` depende de IDs concretos del panel de configuración.
- `refrescarSelects()` corrige filas del DOM cuando un nombre de catálogo deja de existir.

**Dependencia inferida (por datos compartidos, sin llamada directa observada):**
- Diagramas → Exportación: `generarDiagramasParaExcel()` llama la misma `dibujarBoard()` que usa la pantalla, sobre los mismos `boards`, pero no hay una función común que las una explícitamente más allá de compartir el dato.
- Personalización → Exportación: los colores/fuente aplicados al Excel (`construirLibroExcel`) provienen de `leerEstilo()`, la misma fuente que usa la pantalla.

No se detectó ningún caso de un grupo "interno" (Optimización, Diagramas) llamando de vuelta a un grupo "externo" (Exportación, Importación).

# 10. Funciones coordinadoras

- **`recalcular()`** (6801–7049): punto central de actualización. Coordina Validación, Piezas, Optimización, los cuatro cálculos de costo, Diagramas y Reporte. Efectos observables: escribe `state.boards`, `state.ultimoReporte`, `state.ultimoTotal`; muestra u oculta `resultadoPanel`/`reportePanel`; es llamada tanto por el flujo automático (debounce) como por las tres rutas de exportación y por la confirmación de importación.
- **`exportarExcel()`** (7971–8041): coordina Piezas, Optimización (vía `state.boards`), Exportación y Personalización. Llama `recalcular()`, `cargarExcelJS()`, `generarDiagramasParaExcel()` y `construirLibroExcel()`; toma una "instantánea" de los datos antes del primer `await` para que la generación no se vea afectada por cambios del usuario durante el proceso.
- **Confirmación de importación** (`confirmarImportacionVistaPrevia`, 4010–4076): coordina Importación, Catálogos, Componentes del proyecto y Piezas. Reasigna `state.componentes`, `state.componentesProyecto` y `state.materiales`; llama `aplicarPiezasPendientes()`; vuelve a renderizar los tres catálogos y finalmente llama `recalcular()`.
- **`renderDiagrama()`** (6588–6629): coordina Optimización (lee `state.boards`) y Personalización (lee `leerEstilo()`). Reescribe el HTML de pestañas, el SVG del tablero activo y la lista de sobrantes; llama `activarPiezasArrastrables()` al final.
- **`leerEstilo()`** (4291–4354): lee más de 30 controles del DOM, guarda el resultado en `localStorage` (`guardarEstilo`) y lo aplica de inmediato (`aplicarEstiloGlobal`, `aplicarVisibilidadBotones`) en una sola pasada.

# 11. Funciones relativamente independientes

Funciones cuyo cuerpo, por lectura directa, no accede a `document` ni a `state` (reciben todo por parámetro):

- Geometría: `calcularRectanguloUtilTablero`, `calcularRectanguloColocacion`, `calcularHuellaEnRectangulo`, `capacidadLinealConKerf`, `interseccionRectangulos`, `restarObstaculoRectangular`, `calcularRectsLibresDesdeObstaculos`, `fusionarRectsAdyacentes`, `podarRectsContenidos`/`podarContenidos`.
- Aleatoriedad determinista: `pseudoAleatorio`, `barajar`.
- Normalización de texto: `normalizarSkuManual`, `normalizarNombreComponente`, `normalizarNombreMaterialImportado`, `normalizarGirarCSV`, `esValorAfirmativo`.
- Formato: `fmt`, `fmtMoney`, `normalizarMetrosLinealesParaPresentacion`, `argbDesdeHex`, `fuenteACss`, `fuenteAExcel`.
- Validación de entrada ya extraída: `validarNumeroEntrada`, `validarCantidad`, `validarMedida`, `validarPrecio`.
- Generación de texto DXF: `grupoDxf`, `polilineaRectDxf`, `construirDXFTablero`.
- Parseo: `separarLineaCSV`, `parsearCSV`.

No se afirma que estén organizadas como una capa separada — conviven en el mismo archivo y closure que todo lo demás.

# 12. Cálculos actuales

Se documenta qué calcula el código; no se confirma su exactitud matemática sin ejecución (ver sección 21).

- **Materiales**: costo = número de tableros usados × precio por tablero, agrupado por material (líneas 6915–6932).
- **Componentes**: costo = precio unitario × cantidad por proyecto × cantidad de proyectos (líneas 6939–6963).
- **Corte**: por número de cortes × precio por corte, o por metros lineales de corte × precio por metro, según el modo elegido (líneas 6965–6971).
- **Tapacanto**: metros por tipo (suma de lados largos/cortos marcados) × precio por metro, con redondeo opcional hacia arriba a 0.5 m (líneas 6973–7010).
- **Desperdicio**: área de huecos libres del tablero tras reconstruir fronteras de kerf (`reconstruirSobrantesYFronteras`, `areaSobranteTotal`, líneas 5961–5973, 5764–5766).
- **Número de tableros**: cantidad de objetos `board` generados por `empacarMaterial` por cada material.
- **Kerf**: un valor base capturado por el usuario, del cual se derivan 4 valores efectivos (`kerf`, `kerfEntrePiezas`, `kerfPiezaSobrante`, `kerfBordeExterior`) según qué casillas de la configuración jerárquica estén activas (líneas 1834–1878).
- **Márgenes**: 4 valores (izquierdo, derecho, superior, inferior), iguales entre sí si "Usar el mismo margen" está marcado, o independientes si no.
- **Redondeos**: metraje de tapacanto (a 0.5 m, opcional); metros lineales de corte para presentación (`normalizarMetrosLinealesParaPresentacion`, redondeo a 2 decimales solo para mostrar, no para el cálculo interno).
- **Posiciones**: cada pieza colocada recibe `x, y, w, h, rotada` según el algoritmo de empaquetado (sección 13); se recalculan al mover, rotar, espejar o compactar manualmente.

# 13. Optimización

**Modos disponibles**: guillotina (`empacarConLista`, corte de extremo a extremo, compatible con sierra escuadradora) y libre (`empacarConListaLibre`, permite huecos en forma de "L", para CNC/router/caladora) — elegidos por el checkbox "Corte de extremo a extremo".

**Niveles de calidad**: Normal (piezas en Auto no giran), Optimizada (pueden girar, pero todas las copias iguales usan la misma orientación), Completa (permite mezclar orientación entre copias idénticas y agrega 2 criterios de orden adicionales).

**Entradas**: lista de piezas ya expandidas por cantidad (`leerPiezas`), kerf efectivo, medida de tablero por material, parámetros de corte resueltos.

**Algoritmo observable**: empaquetado por rectángulos libres ("guillotine bin packing"), con lógica adicional de "amarre" de orientación y adyacencia entre piezas del mismo tamaño para mantener acomodos practicables en sierra.

**Criterios/semillas**: `empacarMaterial` prueba 4 (o 6 en modo Completa) criterios de orden fijo, más 6 (o 14 en modo Completa) órdenes aleatorios con semilla fija (`pseudoAleatorio`), y se queda con el resultado que use menos tableros y, en empate, menos cortes.

**Resultados**: un arreglo de `board` por tablero usado, cada uno con `pieces[]` (posición final), `freeRects[]` (huecos libres) y contadores de cortes.

**Edición manual posterior**: `rotarPieza`, `espejarBoard`/`espejarBoardHorizontal`, `compactarHaciaAbajo`/`Arriba`/`Izquierda`/`Derecha`, y el arrastre interactivo (`activarPiezasArrastrables` con "imanes" de alineación, `calcularImanes`) — todas mutan `board.pieces` directamente y llaman `recalcularFreeRectsDesdeCero`, sin volver a ejecutar `empacarMaterial` ni `recalcular()` (ver sección 17).

**Datos guardados en `state.boards`**: el resultado completo de la última llamada a `recalcular()`, más cualquier mutación manual posterior aplicada directamente sobre esos mismos objetos.

# 14. Importación y exportación

- **CSV**: solo piezas, formato fijo de 11 columnas (`ENCABEZADO_FORMATO`), validado contra `state.materiales`/`state.tapacantos` existentes (`parsearCSV`, `agregarPiezaDesdeColumnas`).
- **Excel de proyecto**: formato propio versionado `PROYCUT_PROJECT_FORMAT` (versión 1), con hojas Piezas (obligatoria), Componentes y Materiales (opcionales) — `extraerProyectoDesdeLibroExcel`.
- **Formato de catálogo**: `PROYCUT_CATALOG_FORMAT` (versión 1), hojas Materiales/Tapacantos/Componentes sin cantidades de proyecto — `extraerCatalogoDesdeLibroExcel`/`leerCatalogoExcel`; no conectado a ningún botón (sección 3, sección 20).
- **Vista previa**: `prepararVistaPreviaComponentes`/`Materiales` clasifican cada fila por coincidencia (ID interno, SKU o nombre) contra el catálogo actual, proponen una acción (usar existente, crear, relacionar manualmente, rechazar) y bloquean la confirmación si hay conflictos sin resolver.
- **Aplicación atómica**: `construirAplicacionAtomicaComponentes`/`Materiales` construyen el nuevo estado sin tocar `state` hasta que ambos planes son válidos; solo entonces `confirmarImportacionVistaPrevia` reasigna `state` de una sola vez (sección 10).
- **Excel completo**: 3 hojas (Piezas y diagramas con imágenes PNG incrustadas, Reporte tipo factura, Resumen y precio), con configuración de página fija para impresión (`construirLibroExcel`).
- **Formato reimportable**: "Exportar formato" genera un Excel con las piezas/componentes/materiales actuales, pensado para volver a importarse (`construirLibroFormatoProyecto`).
- **DXF**: un archivo por tablero (contorno + piezas cortadas, sin costo), empaquetados en un ZIP (`construirDXFTablero`, `exportarDXFZip`).
- **Dependencias externas**: `ExcelJS` 4.4.0 y `JSZip` 3.10.1, cargadas dinámicamente desde `cdnjs.cloudflare.com` solo cuando se usan por primera vez (sección 19 del inventario original; ver también sección 21 de este documento).

# 15. Personalización

**Preferencias disponibles**: fuente, colores (principal, secundario, fondo, piezas, sobrantes, encabezado de tabla, fondo del total), tamaños de letra (título, secciones, tabs, piezas, medidas, sobrantes), estilos y grosores de línea (corte, tapacanto, sobrante), tipo de punta de flecha, plantilla del reporte, diseño del total, visibilidad de botones y columnas — más de 30 controles en `estiloPanel`.

**Origen de valores**: valores por defecto en los atributos del HTML; sobrescritos por `cargarEstiloGuardado()` si existe una entrada previa en `localStorage`.

**Aplicación mediante CSS**: `aplicarEstiloGlobal()` escribe variables CSS (`--azul`, `--fuente`, `--piezas-fs`, etc.) sobre `document.documentElement.style`.

**Persistencia**: `guardarEstilo()` escribe en `localStorage` (`occ_bamteck_estilo_v1`) en cada cambio de cualquier control de estilo; con manejo de error silencioso si el navegador lo impide (modo privado).

**Efectos en pantalla y Excel**: los mismos valores leídos por `leerEstilo()` alimentan tanto `dibujarBoard()`/`renderDiagrama()` (pantalla) como `construirLibroExcel()` (fuente y colores del Excel, vía `fuenteAExcel`/`argbDesdeHex`) — es la misma fuente de datos para ambos destinos.

# 16. Zonas de alta interdependencia

Documentado de forma neutral, sin calificar cómo debería resolverse:

- **`recalcular()`** concentra, en una sola función, la coordinación de Validación, Piezas, Optimización, los cuatro cálculos de costo y el disparo de Diagramas y Reporte (secciones 7 y 10).
- **`state.boards`** es escrito por Optimización, leído y mutado directamente por las funciones de edición manual del diagrama, y leído por Exportación — al menos ocho funciones distintas operan sobre la misma estructura sin una función única que centralice sus cambios (secciones 9 y 13).
- **La configuración de corte** (kerf/márgenes/Etapa 4) conecta controles del DOM, un esquema de validación declarativo, una función de resolución jerárquica, y es consumida a la vez por Validación, Piezas y Optimización (secciones 9 y 12).
- **El combobox buscable** (`comboFlotante`, `attachComboBuscable`) es compartido por Piezas, Componentes del proyecto y el modal de "crear nuevo" de Catálogos (sección 11 del análisis de organización interna, no repetida aquí).
- **Las piezas almacenadas en el DOM** (`#piezasBody`) son leídas directamente, sin pasar por `state`, por al menos cinco funciones distintas (`leerPiezas`, `validarProyecto`, `leerPiezasFormularioParaFormato`, `leerPiezasParaExportar`, `refrescarSelects`) — cualquier cambio en cómo se estructura una fila afecta a las cinco a la vez.

# 17. Comportamientos pendientes de verificar

Ninguno de los siguientes está confirmado por ejecución; se documentan como comportamiento inferido de la lectura del código:

- **Costo tras mover una pieza**: `activarPiezasArrastrables` no llama `recalcular()`; el costo de corte depende de `board.cortes`, que no se vuelve a contar tras un movimiento manual.
- **Costo tras rotar**: `rotarPieza` tampoco llama `recalcular()`; además no reescribe los booleanos `l1/l2/a1/a2` de la pieza, aunque el diagrama decide visualmente cuál lado es "largo" en el momento de dibujar.
- **Costo tras espejar**: `espejarBoard`/`espejarBoardHorizontal` sí intercambian `l1/l2` o `a1/a2` explícitamente, pero tampoco llaman `recalcular()`.
- **Costo tras compactar**: `compactarHacia*` reposiciona piezas sin recalcular costo.
- **Pérdida de ajustes manuales tras importar o recalcular**: la confirmación de importación termina llamando `recalcular()`, que reconstruye `state.boards` desde cero mediante `empacarMaterial()` — cualquier ajuste manual previo en el diagrama se pierde en ese momento.
- **Renombrado de materiales en uso**: `refrescarSelects()` corrige filas que apuntaban a un nombre ya inexistente; el efecto de un renombrado que coincida por casualidad con otro nombre ya existente no está confirmado.
- **Exportación después de edición manual**: no está confirmado si el Excel/DXF exportado refleja el acomodo manual o el resultado original del optimizador automático.
- **Funcionamiento real del modo libre**: el algoritmo de huecos en "L" (`empacarConListaLibre`) no fue ejecutado como parte de este análisis.
- **Restauración de apariencia**: el comportamiento de `cargarEstiloGuardado()` ante datos parcialmente corruptos o de una versión anterior de la clave `localStorage` no está confirmado.
- **Funcionamiento en distintos tamaños de pantalla**: la reorganización responsiva (`@media (max-width:1050px)`, `@media (max-width:860px)`) y el redimensionamiento de columnas/divisor no fueron probados en ejecución.

# 18. Datos de referencia que deberán conservarse

Antes de modificar código, deberán capturarse, para un conjunto de piezas fijo y conocido:

- **Subtotales y total**: `matSubtotal`, `componentesSubtotal`, `corteImporte`, `tapaSubtotal`, `total`.
- **Tableros**: cantidad total y desglose por material.
- **Desperdicio**: área de sobrante total por tablero.
- **Sobrantes**: lista de sobrantes aprovechables (medidas) por tablero.
- **Posiciones**: `x, y, w, h, rotada` de cada pieza en al menos un caso de prueba, para comparación exacta tras cualquier cambio futuro.
- **Archivos Excel**: al menos una copia de referencia de "Exportar formato" y del Excel completo, generados con el mismo caso de prueba.
- **Archivos DXF**: al menos una copia de referencia del ZIP generado con el mismo caso.
- **Preferencias**: el contenido de la clave `localStorage` `occ_bamteck_estilo_v1` para un caso con personalización aplicada.
- **Capturas visuales**: al menos una captura del diagrama en pantalla con esas mismas preferencias, para comparación visual futura.

# 19. Funcionalidad no implementada

Confirmado por ausencia de cualquier referencia en el código:

- Clientes.
- Proyectos persistentes (más allá del trabajo actual en memoria).
- Empresas / multiempresa.
- Usuarios.
- Autenticación.
- Backend propio.
- Supabase o cualquier otro proveedor de base de datos.
- Pagos.
- Integraciones reales (la única mención es la de WooCommerce en el botón "Confirmar pedido", como aviso de una fase futura — sección 20).
- Persistencia general de datos de trabajo (solo existe persistencia de preferencias visuales, sección 5).

# 20. Funcionalidad de uso incierto

- **Configuración jerárquica "Etapa 4"** (sistema/empresa/sucursal/proyecto/pieza, líneas 1466–1878): uso no confirmado más allá de kerf y márgenes exteriores. El propio comentario del código indica que "ninguna función de geometría, precio, reporte o exportación lo consulta todavía" para el resto de sus claves.
- **Formato de catálogo "CAT-7"** (líneas 2943–3108): conexión parcial — las funciones de lectura y validación existen completas, pero no hay ningún elemento de interfaz que las invoque; el propio comentario del código lo confirma explícitamente.
- **Nombres internos de etapas** ("Etapa 2D-A", "Etapa 2D-B", "Etapa 4A", "Etapa 4B", "M-1", "M-2", "CAT-7"): sugieren un sistema externo de seguimiento de trabajo (tickets o fases de desarrollo), pero el archivo no documenta qué son ni si existen etapas adicionales fuera de este archivo — requiere análisis posterior fuera del alcance de este documento.
- **Relación Bamteck/ProyCut**: el título de la pestaña dice "Optimizador de Cortes - Bamteck" y el logo del encabezado muestra "PROYCUT XIX" junto a "BAMTECK" (líneas 6, 488–489) — la relación exacta entre ambos nombres no puede confirmarse desde el código; requiere análisis posterior o consulta directa.
- **Referencias futuras a WooCommerce**: el botón "Confirmar pedido" menciona que "la integración con el carrito de WooCommerce se conecta en la fase 2" (línea 8055) — confirma la existencia de un plan, pero no hay código de esa integración en este archivo ni forma de confirmar su alcance desde aquí.

# 21. Límites del análisis

- No se ejecutó el archivo en un navegador; todo lo descrito proviene de lectura estática del código fuente.
- No puede confirmarse el comportamiento exacto ante condiciones de carrera (por ejemplo, el `setTimeout` de 150 ms en el blur del combobox buscable, línea 4521) sin ejecución real.
- No puede confirmarse si el costo mostrado en pantalla queda desincronizado tras edición manual del diagrama sin probarlo (sección 17).
- No puede confirmarse si los archivos exportados (Excel, DXF) abren correctamente en Excel, AutoCAD o software CNC real — solo se verificó cómo se construyen internamente.
- No puede confirmarse el comportamiento real de `localStorage` en todos los navegadores o modos relevantes (el manejo de error está confirmado en el código; su efecto real depende del entorno de ejecución).
- No se comparó formalmente esta estructura contra las capas descritas en `docs/engineering/05-ARCHITECTURE.md`; ese contraste, si se requiere, corresponde a una fase de análisis distinta.
- No se determinó cuál criterio o semilla "gana" en la práctica dentro de `empacarMaterial()` para casos de piezas reales, más allá de que el código prueba varios y se queda con el mejor resultado medido.

# 22. Conclusión

El estado actual del prototipo está, con base en los tres análisis consolidados en este documento, **suficientemente comprendido para comenzar la creación de pruebas manuales**. Se conoce con precisión verificable por lectura de código: la estructura física del archivo, el flujo de inicialización, el flujo principal de actualización, los grupos funcionales y sus dependencias, los cálculos que el sistema realiza, y los puntos exactos donde una edición manual del diagrama se desvía del flujo central de recálculo.

Lo que falta no es comprensión del código, sino **confirmación en ejecución** de los comportamientos ya señalados como pendientes (sección 17) y la captura de los datos de referencia (sección 18) — ambas son, por diseño, actividades de una fase posterior y no de este documento. Este documento no propone todavía cómo separar el código ni qué debería cambiar.
