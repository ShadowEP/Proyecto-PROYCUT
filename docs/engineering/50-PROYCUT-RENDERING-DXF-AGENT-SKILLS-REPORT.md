# 50 — Reporte de Skills de renderizado, interacción y DXF

## Estado

Propuesto para revisión.

## Versión

1.0

## Última actualización

2026-08-18

## Propósito

Documentar la creación de cuatro Agent Skills que capturan contratos reales del renderizado SVG de tableros, la interacción manual sobre piezas, la exportación DXF para fabricación, y una checklist de validación CNC genérica — todo verificado por lectura directa de código en esta tarea. No reemplaza el contenido de cada `SKILL.md`.

---

## 1. Skills creadas

| Skill | Ruta | Cubre |
|---|---|---|
| `proycut-board-rendering` | `.agents/skills/proycut-board-rendering/SKILL.md` | `svg/board-renderer.js` (`dibujarBoard`) |
| `proycut-board-interactions` | `.agents/skills/proycut-board-interactions/SKILL.md` | Drag/rotar/espejar/compactar en `main.js` (contrato de interacción, no el algoritmo) |
| `proycut-dxf-r12` | `.agents/skills/proycut-dxf-r12/SKILL.md` | `dxf/dxf-export.js`, `exportarDXFZip`, `cargarJSZip` |
| `proycut-cnc-validation` | `.agents/skills/proycut-cnc-validation/SKILL.md` | Checklist de validación genérica de la salida DXF |

Ninguna usa `references/` — el contenido de cada una cupo dentro de un `SKILL.md` auditable sin necesidad de detalle extenso adicional. Ninguna incluye scripts ejecutables.

## 2. Archivos inspeccionados

- `src/scripts/svg/board-renderer.js` (completo)
- `src/scripts/dxf/dxf-export.js` (completo)
- `src/scripts/excel/excel-diagrams.js` — sección `generarDiagramasParaExcel` (segundo consumidor de `dibujarBoard`)
- `src/scripts/main.js` — `renderDiagrama` (4425–4466), `cargarJSZip` (4709–4740), `exportarDXFZip` (4742–4778); más el bloque de edición interactiva ya leído en la tarea anterior de esta misma sesión (`rotarPieza`, `espejarBoard`, `espejarBoardHorizontal`, `compactarHacia*`, `calcularImanes`, `activarPiezasArrastrables`, `piezasSeEncimanConOtras`), releído para esta tarea contra los requisitos específicos de interacción.
- `grep` dirigido para confirmar todos los call sites reales de `dibujarBoard()` y `construirDXFTablero()` en el repositorio (solo dos y uno, respectivamente).
- `grep` dirigido para confirmar que el parámetro `kerf` de `dibujarBoard` no se usa en el cuerpo de la función.

Documentación: `05-ARCHITECTURE.md`, `08-ENGINEERING-HANDBOOK.md`, `10-CURRENT-STATE.md`, `12-MANUAL-TESTS.md`, `44-CURRENT-ARCHITECTURE-INVENTORY.md`, y las ocho Skills existentes (`CLAUDE.md`, `AGENTS.md`, y las Skills core + geometría/optimizador/costeo ya creadas).

## 3. Contratos SVG confirmados

- Firma real: `dibujarBoard(board, kerf, anchoDisponible, estilo) → string SVG`. Confirmada en los dos únicos call sites reales (`main.js` línea 4455, `excel-diagrams.js` línea 87).
- **`kerf` no se usa dentro del cuerpo de la función** — confirmado por `grep` dirigido (única aparición de la palabra es en la firma). Documentado explícitamente como compatibilidad actual, no como permiso de eliminación.
- `board._geom = {scale, margenIzq, margenSup}` se escribe como efecto colateral al final de `dibujarBoard` (línea 248) — mutación del parámetro de entrada, confirmada.
- `.pieza-drag`, `.pieza-rotar` y `data-idx` son contratos de interacción reales: `main.js` los consulta por selector CSS/atributo (`querySelectorAll('.pieza-drag')`, `querySelector('.pieza-rotar')`, `getAttribute('data-idx')`).
- **Un solo SVG sirve a dos consumidores** (pantalla y Excel-vía-PNG) — confirmado que no existe una ruta de dibujo separada para Excel; `generarDiagramasParaExcel` rasteriza el mismo string SVG.

## 4. Contratos de interacción confirmados

- Documentados en tabla ENTRADAS / ESTADO MODIFICADO / EFECTOS COLATERALES / RENDERIZADO POSTERIOR para las 7 acciones (arrastrar, rotar, espejo vertical, espejo horizontal, compactar×4 agrupadas).
- **Confirmado nuevamente en esta tarea, releyendo las funciones completas:** ninguna de las 7 acciones llama a `recalcular()` — todas terminan en `recalcularFreeRectsDesdeCero` (y, según el caso, `renderDiagrama()`). Esto se documenta como comportamiento actual a preservar, explícitamente **sin** calificarlo de correcto o incorrecto, tal como pidió la instrucción de esta tarea.
- Solo el manejador de arrastre usa `board._geom.scale` para convertir px→mm; las otras 6 acciones operan directamente en mm.
- Distinción explícita INTERACCIÓN VISUAL / CAMBIO DE GEOMETRÍA / RECÁLCULO DEL PROYECTO incluida en el `SKILL.md`, con la advertencia de que agregar recálculo automático de costo a estas acciones sería un CAMBIO FUNCIONAL.

## 5. Contrato DXF confirmado

Contra el código real de `dxf-export.js`:

- DXF R12 / `$ACADVER = 'AC1009'`.
- `$INSUNITS = 4` (mm), `$MEASUREMENT = 1` (métrico).
- `$EXTMIN = (0,0,0)`, `$EXTMAX = (board.boardW, board.boardH, 0)`.
- Entidades `POLYLINE`/`VERTEX`(×4)/`SEQEND`, nunca `LWPOLYLINE`.
- Capas `0`, `TABLERO`, `CORTE` (colores 7/8/5, `CONTINUOUS`).
- Orden: contorno `TABLERO` antes que piezas; piezas en capa `CORTE` en el orden de `board.pieces`.
- Inversión de eje Y confirmada con la fórmula exacta: `y1 = boardH-(y+h)`, `y2 = boardH-y`.
- CRLF (`\r\n`) en cada grupo DXF, único punto de construcción de texto (`grupoDxf`).
- Piezas exportadas a tamaño final, sin restar kerf de nuevo (comentario explícito del código).

**Prohibición aplicada:** el `SKILL.md` bloquea explícitamente sustituir `POLYLINE`/`VERTEX`/`SEQEND` por `LWPOLYLINE`, clasificándolo como cambio de contrato de fabricación, no como mejora técnica — verificado que la única mención de `LWPOLYLINE` en las cuatro Skills nuevas aparece exclusivamente como prohibición (confirmado con `grep` en la auditoría cruzada).

## 6. Riesgos CNC

- **Riesgo conocido documentado, no corregido:** `exportarDXFZip()` llama `recalcular()` de forma síncrona antes de generar el DXF (línea 4744), lo que descarta cualquier edición manual del layout (drag/rotar/espejar/compactar) antes de exportar. El DXF exportado siempre refleja el resultado automático del optimizador, nunca un ajuste manual. Confirmado por lectura directa; documentado como "COMPORTAMIENTO ACTUAL / RIESGO CONOCIDO" en `proycut-dxf-r12`, sin proponer corrección.
- `proycut-cnc-validation` distingue explícitamente qué se puede validar dentro de ProyCut (estructura del DXF, geometría, consistencia con el `board`) de lo que depende de software externo no integrado (importación a CAM, generación de rutas de herramienta, coincidencia con el kerf físico real de la máquina) — evitando que un agente futuro asuma una integración CNC que no existe.
- Ningún dialecto de máquina, controlador o postprocesador está documentado en el repositorio; la Skill lo declara como límite explícito para no inventar G-code, Biesse, Homag, SCM, WoodWOP o Xilog.

## 7. Comportamientos actuales que no deben corregirse automáticamente

- Ninguna interacción manual (drag/rotar/espejar/compactar) recalcula costo.
- `rotarPieza` no reescribe `l1/l2/a1/a2`; solo los espejos lo hacen.
- El parámetro `kerf` de `dibujarBoard` no se usa dentro de la función.
- `exportarDXFZip` recalcula antes de exportar, descartando ediciones manuales previas.
- El uso de `POLYLINE`/`VERTEX`/`SEQEND` en vez de `LWPOLYLINE` es una elección deliberada de compatibilidad, no deuda técnica.

Todos estos hallazgos están marcados en las Skills correspondientes como "comportamiento actual a preservar salvo decisión funcional explícita", siguiendo el mismo criterio ya aplicado en las Skills de geometría/optimizador/costeo de la tarea anterior.

## 8. Dry runs

**A — "Cambiar el SVG para que las piezas tengan otra estructura HTML/SVG."**
Activa: `proycut-board-rendering`, `proycut-board-interactions`, `proycut-safe-change`, `proycut-regression-matrix`. `proycut-board-rendering` advierte explícitamente que `.pieza-drag`/`.pieza-rotar`/`data-idx` son contratos de interacción, no solo nombres de estilo. Coincide con lo esperado.

**B — "Que al rotar manualmente una pieza también se recalculen automáticamente los costos."**
Activa: `proycut-board-interactions`, `proycut-costing`, `proycut-domain-rules`, `proycut-safe-change`, `proycut-regression-matrix`. `proycut-board-interactions` lo marca explícitamente como **CAMBIO FUNCIONAL** en su sección de hallazgo confirmado. Coincide con lo esperado.

**C — "Cambiar el DXF a LWPOLYLINE porque es más moderno."**
Activa: `proycut-dxf-r12`, `proycut-cnc-validation`, `proycut-safe-change`, `proycut-regression-matrix`. `proycut-dxf-r12` **bloquea** la modernización automática explícitamente y exige decisión del usuario. Coincide con lo esperado.

**D — "Comprobar si los DXF generados son utilizables por fabricación."**
Activa: `proycut-dxf-r12`, `proycut-cnc-validation`, `proycut-regression-matrix`. `proycut-cnc-validation` distingue explícitamente la checklist AUTOMATIZABLE/MANUAL de lo que depende de software CAM/CNC externo. Coincide con lo esperado.

## 9. Limitaciones

- No se ejecutó ningún DXF generado en un visor real durante esta tarea (sin navegador/CAD disponible en la sesión) — las verificaciones MANUAL/DEPENDIENTE DE SOFTWARE CNC de `proycut-cnc-validation` quedan sin ejecutar, tal como esa misma Skill exige declarar.
- El riesgo de `exportarDXFZip` descartando ediciones manuales se documenta por lectura de código; no se confirmó por ejecución en navegador (coincide con el patrón ya establecido en `proycut-sheet-optimizer`/`proycut-board-interactions` para hallazgos equivalentes).
- No se investigó si existe algún plan futuro de integración CNC en documentación no listada explícitamente en el alcance de esta tarea; si existiera, `proycut-cnc-validation` debería revisarse.

## 10. Siguientes Skills recomendadas

- `proycut-export-contracts` (ya recomendada en los reportes 48 y 49) — ahora parcialmente cubierta por `proycut-dxf-r12`; seguiría pendiente el contrato del Excel exportado (`excel/excel-diagrams.js`, `excel-utils.js`, constructor de libro en `main.js`), que comparte el mismo SVG pero tiene su propio contrato de hojas/formato.
- `proycut-catalog-identity` — sigue pendiente de los reportes anteriores.
- Ninguna Skill nueva para CNC/G-code específico hasta que exista evidencia real en el repositorio de esa integración.

## 11. Verificación final

```text
git diff --check       → sin salida (sin problemas de espacios en blanco)
git status --short     → solo directorios nuevos bajo .agents/skills/ y este reporte
```

Código de producción modificado: NO. Scripts ejecutables nuevos: NO. Commit: NO. Push: NO.
