---
name: proycut-dxf-r12
description: "Contrato real del archivo DXF que ProyCut exporta para fabricación (src/scripts/dxf/dxf-export.js): DXF R12/AC1009, milímetros, capas TABLERO/CORTE, POLYLINE/VERTEX/SEQEND, inversión del eje Y, CRLF. Activar antes de modificar el generador DXF o su empaquetado en ZIP (exportarDXFZip). Prohíbe modernizar a LWPOLIYLINE u otro formato sin decisión explícita — es un cambio de contrato de fabricación, no una mejora técnica. No cubre validación de que el archivo sea fabricable en la práctica (usar proycut-cnc-validation)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Contrato DXF (R12/AC1009)

## Cuándo se activa

- Modificar `src/scripts/dxf/dxf-export.js` (`grupoDxf`, `polilineaRectDxf`, `construirDXFTablero`, `nombreArchivoSeguro`).
- Modificar `exportarDXFZip` o `cargarJSZip` en `main.js`.
- Cualquier propuesta de cambiar el formato, versión, unidades, capas o estructura del DXF generado.

## Cuándo NO se activa

- Validar si el DXF resultante es realmente fabricable en un software CAM/CNC específico → `proycut-cnc-validation`.
- El SVG de pantalla/Excel (otra salida visual, sin relación con este archivo) → `proycut-board-rendering`.

## Código canónico

- `src/scripts/dxf/dxf-export.js` — única fuente del formato DXF.
- `src/scripts/main.js` — `exportarDXFZip` (~línea 4742) y `cargarJSZip` (~línea 4709), únicos consumidores confirmados de `construirDXFTablero`.
- `docs/engineering/10-CURRENT-STATE.md` — ya documentaba este contrato como observado; esta Skill lo confirma línea por línea contra el código actual.

## Contrato confirmado (verificado línea por línea contra el código actual)

- **Versión:** DXF **R12 / AC1009** — `$ACADVER` = `'AC1009'` (línea 30).
- **Unidades:** milímetros — `$INSUNITS = 4` (línea 31, comentario explícito `// 4 = milimetros`).
- **Sistema de medición:** `$MEASUREMENT = 1` (línea 32, `// 1 = metrico`).
- **Extents:** `$EXTMIN` = `(0,0,0)`; `$EXTMAX` = `(board.boardW, board.boardH, 0)` (líneas 33–34), en las unidades del tablero (mm).
- **Entidades:** `POLYLINE` / `VERTEX` (×4, un rectángulo cerrado) / `SEQEND` — confirmado en `polilineaRectDxf`. No se usa `LWPOLYLINE` en ningún punto del archivo.
- **Capas:** exactamente tres definidas en la tabla `LAYER`: `0` (color 7), `TABLERO` (color 8), `CORTE` (color 5) — todas `CONTINUOUS` (líneas 39–41).
- **Orden de entidades:** el contorno del tablero (capa `TABLERO`) se escribe **antes** que las piezas (línea 49, antes del `forEach`); las piezas se escriben en capa `CORTE` **en el orden de `board.pieces`** (línea 50–52), sin reordenar.
- **Transformación de coordenadas — inversión del eje Y:** confirmada explícitamente en el comentario del código (líneas 10–11) y en la fórmula real: `y1 = boardH - (y + h)`, `y2 = boardH - y` (línea 13). Motivo documentado: el optimizador usa Y creciente hacia abajo (como pantalla); DXF usa Y creciente hacia arriba.
- **Formato de línea:** cada grupo DXF termina en `\r\n` (CRLF) — confirmado en `grupoDxf` (línea 4: `codigo + '\r\n' + valor + '\r\n'`), la única función que construye texto DXF en todo el archivo.
- **Precisión de coordenadas:** `toFixed(2)` en `$EXTMAX` y en cada vértice (líneas 18, 34) — dos decimales, siempre.
- **Piezas sin descuento de kerf:** el comentario del código (línea 25–26) confirma explícitamente que las piezas se exportan a su tamaño final, "sin descuento de kerf porque el kerf ya se aplicó como separación entre piezas al acomodarlas" — no restar kerf de nuevo al tocar este archivo.
- **Nombre de archivo:** `nombreArchivoSeguro` reemplaza `/:*?"<>|` por `-` (línea 61) — caracteres inválidos en Windows/Mac/Linux; un archivo por tablero, nombrado `<materialLabel> - Tablero <indexEnMaterial>.dxf`.

## PROHIBICIÓN IMPORTANTE — no modernizar el formato

**No sustituir `POLYLINE`/`VERTEX`/`SEQEND` por `LWPOLYLINE`**, aunque sea un formato DXF más moderno y compacto. Esto es un **CAMBIO DE CONTRATO DE FABRICACIÓN**, no una mejora técnica neutra: el DXF generado se abre en software CAM/CNC real, y `10-CURRENT-STATE.md` documenta `POLYLINE`/`VERTEX`/`SEQEND` explícitamente como la elección deliberada "más compatible entre softwares de CNC/CAM" (comentario del propio código, línea 7–8: "el mas compatible... ya que es el formato base sin extensiones"). Requiere decisión explícita del usuario antes de aplicarse, con las mismas implicaciones que cualquier cambio funcional.

Lo mismo aplica a cualquier otro cambio de "modernización" no solicitado: cambiar `$ACADVER`, agregar secciones DXF nuevas, cambiar unidades, o alterar el orden de capas/entidades.

## Separación: generación pura del DXF vs. coordinación browser/ZIP

- **Generación pura del DXF** (`dxf-export.js`): `grupoDxf`, `polilineaRectDxf`, `construirDXFTablero`, `nombreArchivoSeguro`. No accede a `document`, `state` ni red — recibe un `board` y devuelve texto. Módulo puro, clasificado como estable en `44-CURRENT-ARCHITECTURE-INVENTORY.md`.
- **Coordinación browser/ZIP** (`main.js`, `exportarDXFZip`/`cargarJSZip`): control de botón (`disabled`/`textContent`), carga diferida de `JSZip` desde CDN (`cargarJSZip`, con manejo de error de red/bloqueo), construcción del ZIP (`zip.file(...)`, `zip.generateAsync`), descarga vía `URL.createObjectURL` + `<a download>`. Todo esto es infraestructura de navegador, no parte del contrato del formato DXF en sí.

## COMPORTAMIENTO ACTUAL / RIESGO CONOCIDO — `exportarDXFZip` recalcula antes de exportar

Confirmado por lectura directa: `exportarDXFZip()` (línea 4742) llama `recalcular()` de forma **síncrona y obligatoria** antes de generar cualquier DXF (línea 4744: `if(!recalcular()){ ... return; }`). `recalcular()` reconstruye `state.boards` desde cero vía `empacarMaterial()` (ver `proycut-sheet-optimizer`).

**Riesgo conocido, no corregido aquí:** si el usuario editó manualmente el acomodo de un tablero (mover, rotar, espejar, compactar — ver `proycut-board-interactions`) y luego exporta a DXF, ese ajuste manual **se descarta** antes de generar el archivo, porque `recalcular()` vuelve a correr el optimizador automático. El DXF exportado refleja el resultado **automático**, no el editado a mano. Esto coincide con lo que `10-CURRENT-STATE.md` sección 17 marcaba como "no confirmado si el Excel/DXF exportado refleja el acomodo manual" — aquí queda confirmado que **no** lo refleja, por la llamada explícita a `recalcular()`.

Esto se documenta como comportamiento actual a preservar. **No corregirlo** (por ejemplo, quitando la llamada a `recalcular()` o exportando `state.boards` tal cual está) sin aprobación explícita del usuario — sería un cambio funcional con implicaciones de fabricación real.

## Verificaciones obligatorias

- `node --check` sobre los archivos modificados.
- Prueba pura manual: generar el DXF de un tablero conocido y confirmar contra este contrato (versión, unidades, capas, orden, CRLF, inversión Y) — comparar contra una copia de referencia si existe (`10-CURRENT-STATE.md` sección 18).
- Si es posible, abrir el archivo generado en un visor/editor DXF real para confirmar que sigue siendo sintácticamente válido.
- Ver `proycut-regression-matrix` → fila "DXF (exportación)"; ver también `proycut-cnc-validation` para verificaciones adicionales antes de considerar el archivo fabricable.

## Condiciones para detenerse y pedir aclaración

- La tarea pide modernizar el formato (`LWPOLYLINE`, otra versión de `$ACADVER`, etc.) — bloquear y exigir decisión explícita del usuario, no aplicar de oficio.
- La tarea pide que la exportación DXF respete un layout editado manualmente — es un cambio funcional real (afectaría si se llama o no a `recalcular()`); confirmar alcance antes de tocarlo.
- No hay forma de abrir el DXF generado en un visor real durante la sesión — declarar la limitación en vez de asumir validez.
