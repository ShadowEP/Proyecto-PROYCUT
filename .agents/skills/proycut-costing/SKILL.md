---
name: proycut-costing
description: "Contrato técnico real de src/scripts/costing/calculate-costs.js: entradas, salida, fórmulas de material/componentes/corte/tapacanto, y la separación verificada entre cálculo puro, formato de presentación y DOM/state. Activar antes de modificar cualquier fórmula de costo o sus entradas. Distingue fallback técnico de regla de negocio. Cualquier cambio en una fórmula es un CAMBIO FUNCIONAL. No cubre reglas de negocio generales (usar proycut-domain-rules) ni geometría/optimización (usar proycut-cutting-geometry / proycut-sheet-optimizer)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Costeo

## Cuándo se activa

- Modificar `src/scripts/costing/calculate-costs.js`.
- Modificar cómo `main.js` construye los parámetros que recibe esa función (bloque `recalcular()`, líneas ~4550–4565).
- Modificar cómo se consume su salida (`project/apply-project-results.js` → `aplicarResultadoCostos`, `reports/report-renderer.js`).

## Cuándo NO se activa

- Reglas de negocio generales fuera de costeo (Project, catálogo, persistencia) → `proycut-domain-rules`.
- Cambios que afectan cuántos tableros/cortes hay, sin tocar cómo se cobran → `proycut-sheet-optimizer` (costing no decide cuántos tableros hay, solo los multiplica por un precio).

## Documento y código canónico

- `src/scripts/costing/calculate-costs.js` — única fuente de esta lógica.
- `src/scripts/project/apply-project-results.js` — `aplicarResultadoCostos`, único punto donde el resultado toca `state`/DOM.
- `docs/engineering/10-CURRENT-STATE.md`, sección 12 — cálculos documentados como comportamiento real vigente.
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` — clasifica `costing/*` como módulo puro y estable.

## Función pública confirmada

`ProyCutCosting.calcularCostosProyecto({ piezas, boards, tablerosPorMaterial, totalCortes, totalCorteMm, materiales, componentes, componentesProyecto, tapacantos, cantidadProyectos, modoPrecioCorte, precioCorte, precioCorteMetro, redondearTapacanto })` → `{ok:true, datosReporte}` o `{ok:false, errores:[...]}`.

**Único consumidor confirmado:** `recalcular()` en `main.js` (línea 4550).

## Contrato puro (verificado, no solo doctrina)

El propio código lo declara textualmente en su comentario (líneas 8–13): no toca `document`/`state`/`localStorage`, no muta ninguno de sus parámetros. Esto es verificable línea por línea: ninguna referencia a `document.`/`state.`/`localStorage.` existe en el archivo, y cada salida se construye como objeto nuevo sin reasignar los parámetros recibidos. Tratar esto como contrato a preservar, no como una casualidad.

## Fuente vs. derivado

- **Fuente** (entra desde fuera, no se calcula en esta función): `materiales`, `componentes`, `tapacantos` (catálogos), `componentesProyecto` (cantidades capturadas), `cantidadProyectos`, `modoPrecioCorte`/`precioCorte`/`precioCorteMetro`/`redondearTapacanto` (configuración), `piezas` (con `l`, `a`, `l1`, `l2`, `a1`, `a2`).
- **Ya derivado antes de llegar aquí** (viene del optimizador, no de costing — ver `proycut-sheet-optimizer`): `boards`, `tablerosPorMaterial`, `totalCortes`, `totalCorteMm`. Costing no decide cuántos tableros hay ni cuántos cortes; solo los multiplica por un precio.
- **Derivado dentro de esta función:** `matSubtotal`, `componentesSubtotal`, `corteImporte`, `tapaSubtotal`, `total`, y los desgloses por línea (`materialesRep`, `componentesRep`, `tapacantosRep`).

## Fórmulas confirmadas (con línea exacta)

- **Material** (líneas 32–49): por cada material con tableros usados, `importe = tableros × precioUnitario` (precio del catálogo; si el material ya no existe en `materiales`, usa un objeto por defecto `{precio:0,...}`). `matSubtotal` = suma de todos los importes.
- **Componentes** (líneas 51–80): `cantidadTotal = cantidadPorProyecto × cantidadProyectos`; `importe = precioUnitario × cantidadTotal`. `c.cantidad || 0` y `c.precio || 0` son fallback técnico a 0 — ver advertencia abajo.
- **Corte** (líneas 82–88): si `modoPrecioCorte === 'metro'`, `corteImporte = (totalCorteMm/1000) × precioCorteMetro`; si no, `corteImporte = totalCortes × precioCorte`.
- **Tapacanto** (líneas 90–126): por pieza, `largoReal = max(l,a)`, `anchoReal = min(l,a)`; `L1`/`L2` suman `largoReal` cada uno si están activos, `A1`/`A2` suman `anchoReal` cada uno si están activos — agrupado por `tapaTipo`. Si `redondearTapacanto`, `metrosCobrables = Math.ceil(metrosExactos/0.5) * 0.5`; si no, se cobra el metraje exacto. `importe = metrosCobrables × precioMetro` (mismo patrón de fallback a `precio:0` si el tipo ya no existe en `tapacantos`).
- **Total** (línea 128): `total = matSubtotal + componentesSubtotal + corteImporte + tapaSubtotal` — suma simple. No existen impuestos, descuentos ni márgenes en el código actual; no inventarlos.

## Cantidad de proyectos — aplicada dos veces, en lugares distintos (no es doble conteo)

`cantidadProyectos` multiplica las piezas **antes** de llegar aquí (dentro de `leerPiezas()` en `main.js`, que ya expande cada fila `cant × cantidadProyectos` piezas individuales antes del empaquetado). Dentro de `calcularCostosProyecto`, `cantidadProyectos` se usa **de nuevo**, pero solo para `componentesProyecto` (que no pasa por `leerPiezas`, ya que los componentes no se empaquetan). Esto es intencional en la implementación actual, no una duplicación accidental — no "corregirlo" asumiendo que ya está multiplicado.

## Precio cero

El código **no** rechaza precio `0`: un material, componente o tapacanto con precio `0` simplemente aporta `0` al subtotal correspondiente, sin error ni advertencia. No confundir con "precio faltante", que se resuelve mediante el mismo fallback a `precio:0` cuando el nombre ya no existe en el catálogo (líneas 33–34 y 108).

## Validación de salida

Si `matSubtotal`/`componentesSubtotal`/`corteImporte`/`tapaSubtotal`/`total` no son todos `Number.isFinite` y `>= 0`, retorna `{ok:false, errores:['...un solo mensaje genérico...']}` (línea 130–135) — no desglosa cuál subtotal específico falló.

## Separación pura ≠ formato ≠ DOM/state (verificada, no solo doctrina)

- **Cálculo puro:** `calculate-costs.js` (esta función).
- **Formato de presentación:** `ProyCutFormat.fmt`/`fmtMoney`/`normalizarMetrosLinealesParaPresentacion` (de `utils/format.js`), usado únicamente para construir `corteLineaLabel`, una etiqueta de texto — no participa en ningún cálculo, solo en cómo se muestra.
- **DOM/state:** `main.js` `recalcular()` es el único llamador; construye los parámetros leyendo `state.materiales/componentes/componentesProyecto/tapacantos` y varios `document.getElementById(...).value`, y pasa el resultado a `aplicarResultadoCostos`, que sí toca `state.ultimoTotal`/`state.ultimoReporte`, `reportePanel.style.display` y `reporteContenido.innerHTML`. `calculate-costs.js` nunca hace esto directamente.

## No convertir `|| 0` en regla de negocio

Los fallbacks `c.cantidad || 0`, `c.precio || 0`, y el objeto por defecto `{precio:0}` cuando un nombre no se encuentra en catálogo, son manejo técnico de datos ausentes, **no** una decisión de negocio documentada de "cobrar cero cuando falta el precio". Si una tarea futura necesita cambiar este comportamiento (por ejemplo, rechazar en vez de asumir 0), es un **cambio funcional** que requiere aprobación explícita — no una corrección de bug que se pueda aplicar de oficio.

## Advertencia obligatoria

Cualquier cambio en las 4 fórmulas (material/componentes/corte/tapacanto) o en el total es un **CAMBIO FUNCIONAL**. Requiere aprobación explícita antes de aplicarse (ver `proycut-safe-change`, distinción REFACTOR vs. CAMBIO FUNCIONAL) y debe declarar entradas, unidades, moneda, redondeo y supuestos (`proycut-domain-rules`, procedimiento).

## Verificaciones obligatorias

- `node --check` sobre el archivo modificado.
- Prueba pura manual con los datos maestros de `12-MANUAL-TESTS.md` sección 5, comparando subtotales a mano contra el resultado de la función.
- Confirmar en navegador (`MAT-03`, `REP-01` a `REP-06` de `12-MANUAL-TESTS.md`) que el reporte en pantalla coincide.
- Ver `proycut-regression-matrix` → fila "Costos".

## Condiciones para detenerse y pedir aclaración

- La tarea pide agregar un concepto de costo que no existe hoy (impuesto, descuento, margen) sin que el usuario lo haya definido explícitamente.
- No es claro si un cambio en un fallback (`|| 0`) es una corrección técnica o un cambio de regla de negocio — tratarlo como cambio funcional por defecto y preguntar.
- El precio de un material/tapacanto/componente falta en el catálogo y no es evidente si debe seguir usando el fallback a `0` o generar un error visible.
