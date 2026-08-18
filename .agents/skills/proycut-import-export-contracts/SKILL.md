---
name: proycut-import-export-contracts
description: "Contratos reales de las fronteras externas de ProyCut: importación CSV, importación/exportación Excel (formato de proyecto, formato de catálogo CAT-7, Excel completo de reporte) y exportación DXF. Para cada frontera documenta entrada/transformación/salida/riesgos, confirmados por lectura de código. Activar antes de modificar cualquier formato importado o exportado. No cubre el contrato DXF en detalle (usar proycut-dxf-r12, ya existente) ni qué datos son fuente/derivados (usar proycut-project-model)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Contratos de importación y exportación

## Propósito

Documentar, frontera por frontera, cómo entra y sale información de ProyCut hoy: qué formato exacto se espera, cómo se transforma a datos internos (o de datos internos al formato externo), y qué riesgos ya existen — sin corregirlos. Estas fronteras son las que un futuro cambio de formato, o la integración con Supabase, no debe romper por accidente.

## Cuándo activar

- Modificar el parseo o formato de CSV (`utils/csv.js`, `config/project-format.js`).
- Modificar la importación o exportación de Excel (bloques de `main.js` relacionados con `PROYCUT_PROJECT_FORMAT`, `PROYCUT_CATALOG_FORMAT`, `construirLibroExcel`).
- Modificar cualquier encabezado, versión de formato, o estructura de hoja usada para intercambio de datos.
- Cualquier tarea que agregue una frontera externa nueva (otro formato de import/export).

## Cuándo NO activar

- El contrato DXF en detalle (versión, capas, CRLF, inversión Y) → ya existe `proycut-dxf-r12`, no duplicarlo aquí.
- Clasificar si un dato es fuente o derivado → `proycut-project-model`.
- El SVG→PNG usado dentro del Excel de reporte → `proycut-board-rendering` documenta ese mecanismo; aquí solo se referencia como parte del contrato de exportación.

## Código canónico

- `src/scripts/utils/csv.js` — `parsearCSV`, `separarLineaCSV`.
- `src/scripts/config/project-format.js` — `ENCABEZADO_FORMATO` (compartido entre CSV y Excel de piezas).
- `src/scripts/main.js` — bloques de formato de proyecto (`IDENTIFICADOR_FORMATO_PROYECTO`, `construirLibroFormatoProyecto`, `extraerProyectoDesdeLibroExcel`), formato de catálogo CAT-7 (`IDENTIFICADOR_FORMATO_CATALOGO`), Excel completo (`construirLibroExcel`).
- `src/scripts/dxf/dxf-export.js` — cubierto en detalle por `proycut-dxf-r12`.
- `docs/engineering/10-CURRENT-STATE.md`, secciones 3, 14, 20 — ya documentaba estas fronteras; esta Skill las confirma línea por línea.

## Procedimiento de análisis

1. Para cada frontera, se identificó la función de entrada real (`parsearCSV`, `extraerProyectoDesdeLibroExcel`, `construirLibroFormatoProyecto`, `construirDXFTablero`) por lectura directa, no por nombre supuesto.
2. Se confirmó, para cada una, si toca `state`/DOM directamente o si es una función de transformación pura seguida de una etapa de aplicación separada — esta distinción es el criterio central de "no mezclar datos internos con formatos externos".
3. Se buscaron duplicaciones de contrato (mismo encabezado definido en más de un lugar) para señalarlas como hallazgo, no para unificarlas.

## Principio: no mezclar datos internos con formatos externos

Confirmado como patrón real ya presente en el código: las funciones de extracción de Excel (`extraerProyectoDesdeLibroExcel`, `extraerCatalogoDesdeLibroExcel`) son de **solo lectura/validación** — su propio comentario declara textualmente que "ninguna de estas funciones toca `state`". La aplicación real a `state`/DOM ocurre en un paso **separado y posterior**, solo tras confirmación del usuario en una vista previa (`confirmarImportacionVistaPrevia`, `construirAplicacionAtomicaComponentes/Materiales`). Este patrón (parseo puro → vista previa → aplicación atómica separada) es el que cualquier frontera nueva debería seguir, no una excepción a preservar solo en el código viejo.

---

## Frontera: CSV (solo piezas)

**ENTRADA:** archivo de texto seleccionado por el usuario. Formato fijo de 11 columnas, encabezado exacto (`ENCABEZADO_FORMATO` = `Cantidad, Largo_mm, Ancho_mm, Girar, Material, L1, L2, A1, A2, Tipo_tapacanto, Etiqueta`), separado por comas.

**TRANSFORMACIÓN:** `parsearCSV()` (`utils/csv.js`) — separa líneas por `\r\n|\n|\r`, separa columnas por coma simple (`separarLineaCSV`, **sin soporte de comillas** para comas embebidas en texto), valida encabezado exacto columna por columna, valida número máximo de filas (`LIMITES.csvFilas`). Cada fila válida se valida después contra el catálogo actual de materiales/tapacantos (fuera de `parsearCSV`, en el consumidor).

**SALIDA:** filas nuevas agregadas directamente al DOM (`#piezasBody`) — no pasa por `state`.

**RIESGOS (documentados, no corregidos):**
- Sin soporte de comillas/comas embebidas: una `Etiqueta` que contenga una coma rompería el parseo silenciosamente (se interpretaría como columna adicional).
- No crea materiales/tapacantos nuevos automáticamente — a diferencia del combo "+ Crear..." de la interfaz, una fila que referencie un material inexistente se **rechaza**, no se crea.
- Límite de filas fijo (`LIMITES.csvFilas`) sin mensaje de por qué ese límite existe más allá del error mostrado.

---

## Frontera: Excel — formato de proyecto (`PROYCUT_PROJECT_FORMAT`)

**ENTRADA:** archivo `.xlsx` con hoja "Piezas" (obligatoria) y, opcionalmente, "Componentes"/"Materiales". Identificado por metadata del workbook (`wb.subject === 'PROYCUT_PROJECT_FORMAT'`) **o**, para compatibilidad hacia atrás, por la sola presencia de una hoja "Piezas" sin marcador (archivos de una versión anterior sin este identificador).

**TRANSFORMACIÓN:** `extraerProyectoDesdeLibroExcel()` — valida versión (rechaza versiones **futuras** `> VERSION_FORMATO_PROYECTO` y también versiones **distintas** a la soportada, no solo mayores), valida encabezados exactos por hoja, detecta fórmulas de Excel sin evaluarlas (`formulasDetectadas`, marcadas pero no calculadas). Es puramente lectura/validación (ver "Principio" arriba). El resultado pasa a una etapa de **vista previa** (`prepararVistaPreviaComponentes/Materiales`) que clasifica cada fila contra el catálogo actual (usar existente / crear / relacionar manualmente / rechazar), y solo al confirmar el usuario se aplica todo de una vez (`construirAplicacionAtomicaComponentes/Materiales` + `confirmarImportacionVistaPrevia`).

**SALIDA:** `state.materiales`/`componentes`/`componentesProyecto` reemplazados o extendidos, más filas nuevas en `#piezasBody` — solo tras confirmación explícita del usuario en la vista previa.

**RIESGOS (documentados, no corregidos):**
- La reconciliación de identidad al importar (SKU vs. `idInterno` vs. nombre) puede ser ambigua con nombres duplicados en el catálogo actual — mismo patrón de incertidumbre ya señalado en `proycut-costing` para `componentesProyecto`.
- El flujo de dos pasos (plan de vista previa → confirmación) no fue evaluado en esta tarea respecto a qué ocurre si el usuario cierra la vista previa a medias — riesgo no confirmado, no asumir que se maneja correctamente sin revisar el código correspondiente si se toca esta área.

---

## Frontera: Excel — formato de catálogo (`PROYCUT_CATALOG_FORMAT`, "CAT-7")

**ENTRADA:** archivo `.xlsx` con hasta 3 hojas (Materiales/Tapacantos/Componentes de catálogo, sin cantidades de proyecto), marcador `PROYCUT_CATALOG_FORMAT`.

**TRANSFORMACIÓN:** funciones de lectura/validación completas (`extraerCatalogoDesdeLibroExcel` y relacionadas) — confirmado por `10-CURRENT-STATE.md` secciones 3 y 20 (no releído línea por línea en esta tarea, por no ser el foco; ya estaba documentado como completo pero sin interfaz).

**SALIDA:** ninguna — **no hay ningún botón o menú en la interfaz que invoque este flujo**. Confirmado previamente (`10-CURRENT-STATE.md`), no reconfirmado en detalle en esta tarea.

**RIESGOS:** código funcionalmente muerto desde la perspectiva del usuario (sin acceso de interfaz) — mantenerlo así salvo instrucción explícita de conectarlo; no asumir que "ya se usa" en ningún flujo.

---

## Frontera: Excel — exportación "Exportar formato" (reimportable)

**ENTRADA:** `state` actual (`materiales`) + DOM de piezas (`leerPiezasFormularioParaFormato`) + `state.componentesProyecto`.

**TRANSFORMACIÓN:** `construirLibroFormatoProyecto()` — arma 3 hojas (Piezas/Componentes/Materiales) con los mismos encabezados que la importación espera. El marcador de formato/versión se embebe **dos veces**: en la metadata del workbook (`wb.subject`/`wb.description`) **y** en celdas ocultas `M1`/`N1` de la hoja "Piezas" (columnas 13/14 ocultas) — redundancia real, probablemente para tolerar que algún software de Excel descarte la metadata del workbook al reguardar.

**SALIDA:** archivo `.xlsx` descargado, diseñado explícitamente para volver a importarse sin cambios (round-trip).

**RIESGOS (documentados, no corregidos):**
- Los encabezados de "Componentes" y "Materiales" del formato de proyecto (`ENCABEZADO_COMPONENTES_FORMATO`, `ENCABEZADO_MATERIALES_FORMATO`) son constantes **definidas una sola vez** en `main.js` y usadas tanto por importación como por exportación — consistentes hoy, pero sin un módulo compartido que las centralice como sí ocurre con `ENCABEZADO_FORMATO` de piezas (`config/project-format.js`). Un cambio futuro que edite el encabezado en un solo punto sin darse cuenta de que sirve a ambos flujos rompería el round-trip silenciosamente.
- Este formato es **distinto** del "Excel completo" (ver abajo); confundir ambos al modificar código es un riesgo real dado que comparten la extensión `.xlsx` y parte del vocabulario.

---

## Frontera: Excel — exportación "Excel completo" (reporte + diagramas)

**ENTRADA:** `state.boards`, `state.ultimoReporte`, catálogos, estilo visual.

**TRANSFORMACIÓN:** `construirLibroExcel()` — arma 3 hojas (Piezas y diagramas con imágenes PNG incrustadas vía `dibujarBoard` rasterizado, ver `proycut-board-rendering`; Reporte tipo factura; Resumen y precio), con configuración de página fija para impresión. Ya documentado en `10-CURRENT-STATE.md` secciones 3 y 14; no releído línea por línea en esta tarea por no ser el foco de los cambios recientes.

**SALIDA:** archivo `.xlsx` descargado, **no reimportable** — es un reporte, no un formato de intercambio.

**RIESGOS:** posible confusión de usuario o de un agente futuro entre este archivo y el de "Exportar formato" — ambos son `.xlsx` generados por ProyCut pero con propósitos y contratos completamente distintos.

---

## Frontera: DXF (exportación)

Contrato completo ya documentado en `proycut-dxf-r12` (DXF R12/AC1009, capas TABLERO/CORTE, inversión de eje Y, CRLF, `POLYLINE`/`VERTEX`/`SEQEND`) — no se repite aquí. Esta Skill solo la registra como una de las fronteras externas existentes; cualquier modificación al contrato DXF debe pasar por `proycut-dxf-r12`, no por esta Skill.

---

## Invariantes

- Toda frontera de importación debe seguir el patrón parseo puro → validación → (vista previa si aplica) → aplicación separada — no tocar `state`/DOM directamente desde la función de parseo.
- Los encabezados de columna son contratos exactos (texto y orden); un cambio de encabezado en el exportador sin el importador (o viceversa) rompe el round-trip silenciosamente.
- El marcador de versión de formato (`PROYCUT_PROJECT_FORMAT`/`PROYCUT_CATALOG_FORMAT` + número de versión) debe seguir validándose antes de confiar en la estructura del archivo.

## Prohibiciones

- No cambiar un encabezado de columna (CSV o Excel) sin actualizar el lado opuesto (import/export) y confirmar el round-trip.
- No mezclar el formato "Exportar formato" (reimportable) con el "Excel completo" (reporte) — son contratos distintos, no una variación del mismo archivo.
- No conectar el flujo de catálogo CAT-7 a la interfaz como efecto colateral de otra tarea — es una decisión explícita pendiente, no un descuido a corregir de oficio.
- No agregar soporte de comillas/comas embebidas al parser CSV como "mejora" no solicitada — es un cambio de contrato de importación, requiere aprobación.

## Condiciones para detenerse y pedir aclaración

- La tarea pide cambiar un encabezado o el formato de una hoja — confirmar si debe actualizarse también el lado opuesto (import si se toca export, o viceversa) antes de aplicar el cambio.
- No es claro si un archivo de ejemplo a modificar corresponde al formato "reimportable" o al "Excel completo" — verificar contra el marcador (`wb.subject`) antes de asumir.
- La tarea pide conectar el flujo CAT-7 a la interfaz — confirmar que es el objetivo explícito, no un efecto secundario de otro cambio.
