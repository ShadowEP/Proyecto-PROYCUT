---
name: proycut-project-model
description: "Define qué significa 'Proyecto' en el código actual de ProyCut: qué datos son fuente (capturados por el usuario) y cuáles son derivados (calculables). Cubre state, el DOM de piezas, project-model.js y prepare-project.js. Activar antes de decidir qué persistir en Supabase o qué debe reconstruirse. Protege la regla 'Supabase debe almacenar intención y datos fuente, no resultados calculables'. No cubre el mecanismo de persistencia en sí (usar proycut-persistence) ni los formatos de import/export (usar proycut-import-export-contracts)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Modelo de proyecto (estado real)

## Propósito

Documentar, contra el código actual (no contra el modelo objetivo de `07-DATABASE.md`), qué objetos representan hoy un "proyecto" en ProyCut: dónde viven, quién los crea, quién los consume, y cuáles pueden reconstruirse a partir de cuáles otros. Esta Skill es la base para decidir, en la futura integración con Supabase, qué se guarda y qué se recalcula.

## Cuándo activar

- Antes de diseñar qué campos persistir en Supabase (aunque el diseño de tablas en sí no es tarea de esta Skill).
- Al decidir si un dato es "fuente" o "derivado" para cualquier propósito (persistencia, exportación, depuración).
- Al modificar `state`, `pieces/project-model.js`, `pieces/pieces-dom-reader.js` o `project/prepare-project.js`.
- Cualquier duda sobre "¿esto se guarda o se recalcula?".

## Cuándo NO activar

- El mecanismo real de guardar/cargar (hoy solo `localStorage` de preferencias visuales; mañana Supabase) → `proycut-persistence`.
- Los formatos de archivo import/export (CSV, Excel, DXF) → `proycut-import-export-contracts`.
- Las fórmulas de costeo/geometría en sí (ya cubiertas por `proycut-costing`, `proycut-cutting-geometry`, `proycut-sheet-optimizer`) — esta Skill solo clasifica sus entradas/salidas como fuente o derivado, no las reimplementa.

## Documentos y código canónicos

- `src/scripts/main.js` — definición de `state` (línea 132), `leerFilasPiezasDesdeDOM` (vía `pieces-dom-reader.js`), `recalcular()` (línea 4476).
- `src/scripts/pieces/project-model.js` — `construirModeloProyecto`.
- `src/scripts/pieces/pieces-dom-reader.js` — `leerFilasPiezasDesdeDOM`.
- `src/scripts/project/prepare-project.js` — `prepararProyectoParaOptimizacion`.
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md`, sección 5 ("Estado y fuentes de verdad") — ya documentaba esto; esta Skill lo confirma línea por línea contra el código.
- `docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md`, secciones 2–3 — lista ya aprobada de "qué se guarda primero" vs. "qué se recalcula"; esta Skill verifica que esa lista sea consistente con el código real.

## Procedimiento de análisis (cómo se confirmó lo documentado aquí)

1. Se buscó la definición completa de `state` en `main.js` (línea 132) para saber exactamente qué campos existen — no se asumió por memoria ni por documentación previa.
2. Se leyó `pieces-dom-reader.js` completo para confirmar que las piezas **nunca** se copian a `state`.
3. Se leyó `project-model.js` completo — su propio comentario declara textualmente que el modelo temporal "nunca se guarda en `state` ni en `localStorage`", confirmando por el propio código (no por inferencia) que es descartable.
4. Se buscó con `grep` cualquier concepto de `nombreProyecto`/`clienteId`/`companyId` en `main.js` e `index.html` — cero resultados, confirmando que esos conceptos **no existen** en el código actual.
5. Se contrastó la lista resultante contra `45-SUPABASE-INTEGRATION-PLAN.md` secciones 2–3 para verificar consistencia (ver "Excepciones" abajo).

Cualquier extensión futura de esta Skill debe seguir el mismo método: confirmar contra código antes de documentar, no asumir por el nombre de una variable o función.

## DATOS FUENTE (confirmados por lectura de código)

| Dato | Dónde vive hoy | Quién lo crea | Quién lo consume |
|---|---|---|---|
| Piezas capturadas (cantidad, largo, ancho, girar, material, tapaTipo, l1/l2/a1/a2, etiqueta) | **Solo en el DOM**, filas de `#piezasBody` — **nunca** copiadas a `state` | El usuario, vía `addPiezaRow` / importación CSV o Excel | `leerFilasPiezasDesdeDOM()` (único punto de lectura), consumido por `validarProyecto`, `leerPiezas`, exportación |
| `state.materiales` / `state.tapacantos` / `state.componentes` | `state` (objeto JS en memoria, se pierde al recargar) | Alta manual, importación de catálogo, combo "+ Crear..." | Piezas (buscadores), costeo, optimizador (medida de tablero) |
| `state.componentesProyecto` | `state` | Alta manual desde "+ Agregar componentes", importación | Costeo (`calculate-costs.js`) |
| Cantidad de proyectos | **Solo en el DOM**, input `#cantidadProyectos` | El usuario | `leerPiezas()` (expande piezas), `calcularCostosProyecto` (multiplica componentes) |
| Parámetros de corte (kerf, márgenes, modo guillotina/libre, nivel de optimización, redondeo de tapacanto, precios de corte) | **Solo en el DOM**, controles de "Ajustes de parámetros de corte" | El usuario | `resolverParametrosCorteEtapa4()`, leído de nuevo en cada ciclo de `recalcular()` |

**No existe hoy** ningún concepto de nombre de proyecto, cliente o empresa en el código — confirmado por búsqueda exhaustiva (`grep`) sin resultados. Esto coincide con lo ya documentado en `44-CURRENT-ARCHITECTURE-INVENTORY.md` sección 1 ("no hay concepto de proyecto, cliente ni empresa dentro del archivo").

## DATOS DERIVADOS (confirmados por lectura de código)

| Dato | Dónde vive | Quién lo crea | Reconstruible desde |
|---|---|---|---|
| `modeloProyecto` (`{filas, cantidadProyectos}`) | Variable local dentro de `recalcular()`, descartado al terminar el ciclo — **por declaración textual del propio código**, nunca en `state` ni `localStorage` | `construirModeloProyecto()` | DOM de piezas + input de cantidad, en cualquier momento |
| Piezas expandidas (`leerPiezas()`) | Variable local, una por unidad física, existe solo durante el ciclo | `leerPiezas()` | Piezas fuente × cantidad de proyectos |
| `state.boards` | `state` (persiste en memoria entre ciclos, pero se **reemplaza por completo** en cada `recalcular()`) | `empacarMaterial()` vía `optimize-project.js` | Piezas fuente + catálogos + parámetros de corte (determinista, ver `proycut-sheet-optimizer`) |
| `state.ultimoTotal` / `state.ultimoReporte` | `state` | `calcularCostosProyecto()` | `state.boards` + catálogos + configuración económica |
| SVG en pantalla | DOM (`wrapEl.innerHTML`), no persistido | `dibujarBoard()` | `state.boards` + estilo |
| PNG/Excel/DXF exportados | Archivos descargados, no persistidos en el sistema | `generarDiagramasParaExcel`, `construirLibroExcel`, `construirDXFTablero` | `state.boards` + `state.ultimoReporte` + catálogos |

## Regla protegida

**"Supabase debe almacenar intención y datos fuente, no resultados calculables."**

Contra el código actual, esto se traduce exactamente en:

- **Guardar:** piezas (fuente DOM), cantidad de proyectos, parámetros de corte, catálogos usados (materiales/tapacantos/componentes del proyecto, como snapshots — ver `proycut-persistence`).
- **Recalcular siempre, nunca guardar:** `state.boards`, `freeRects`, sobrantes, fronteras, costos, `ultimoReporte`, `ultimoTotal`, SVG, PNG, Excel, DXF.

## Excepciones encontradas

Ninguna. La lista de "datos fuente" confirmada por lectura de código en esta tarea coincide con la lista de "Datos que se guardarán primero" de `45-SUPABASE-INTEGRATION-PLAN.md` sección 2, y la lista de "datos derivados" coincide con su sección 3. No se encontró ningún dato derivado que no sea reconstruible, ni ningún dato fuente adicional no contemplado ya en el plan. Si una tarea futura encuentra una excepción real, debe documentarse aquí y contrastarse contra el plan antes de actuar.

## Invariantes

- Las piezas viven **solo** en el DOM hoy; cualquier función que necesite "el proyecto actual" debe pasar por `leerFilasPiezasDesdeDOM()`, no inventar una copia paralela.
- `state.boards`/`ultimoReporte`/`ultimoTotal` se **reemplazan por completo** en cada `recalcular()` — no se acumulan ni se mezclan con el resultado anterior.
- `modeloProyecto` es deliberadamente mínimo (`filas` + `cantidadProyectos`) — no incluye piezas normalizadas ni el resultado de validación, para no arriesgar el comportamiento de `validarProyecto()`/`leerPiezas()` (ver comentario textual en `project-model.js`).

## Prohibiciones

- No tratar `state.boards`, el reporte o cualquier resultado calculable como si fuera "el proyecto" al diseñar qué persistir — son derivados, no intención del usuario.
- No inventar campos de proyecto (nombre, cliente, empresa) como si ya existieran en el código actual — no existen; su diseño pertenece a una fase posterior ya anticipada en `07-DATABASE.md`/`45-SUPABASE-INTEGRATION-PLAN.md`, no a esta Skill.
- No ampliar `modeloProyecto` para incluir más datos "ya que se está tocando ese archivo" — su comentario explica por qué se mantiene mínimo; ampliarlo es un cambio de contrato, no una limpieza.
- No asumir que un dato es derivado o fuente por su nombre — confirmar contra el código (ver procedimiento de análisis).

## Condiciones para detenerse y pedir aclaración

- No es claro si un dato nuevo (por ejemplo, algo agregado en una tarea reciente) es fuente o derivado — releer el código antes de clasificarlo, no asumir por analogía.
- La tarea pide diseñar el esquema de persistencia — eso corresponde a `proycut-persistence` y, en última instancia, al plan ya aprobado en `45-SUPABASE-INTEGRATION-PLAN.md`, no a esta Skill.
