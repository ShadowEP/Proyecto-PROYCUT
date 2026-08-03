# 37-COST-CALCULATION-DECOUPLING-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-03

## Propósito
Registrar el primer desacoplamiento arquitectónico real (no mecánico) ejecutado sobre `recalcular()`: el bloque de cálculo de costos (127 líneas, `main.js` líneas 4713-4839 antes del cambio) se aisló en una función pura `calcularCostosProyecto`, en `src/scripts/costing/calculate-costs.js`, sin tocar `document`/`state`/`localStorage`, sin mutar sus entradas y preservando exactamente todas las fórmulas, redondeos, fallbacks y el comportamiento ante datos faltantes o inválidos.

## Depende de
`src/scripts/main.js`; `src/scripts/costing/calculate-costs.js`; `src/scripts/utils/format.js`; `index.html`; `docs/engineering/36-ARCHITECTURAL-DECOUPLING-PLAN.md` (define este cambio como el "primer punto de desacoplamiento")

## Referenciado por
PENDIENTE

---

# 1. Bloque original analizado

Bloque de cálculo de costos, dentro de `recalcular()`, líneas **4713-4839** de `main.js` en el commit vigente antes de este cambio (127 líneas). Cuatro sub-bloques secuenciales, todos alimentando un único objeto `datosReporte`:

1. **Costos de material**: recorre `tablerosPorMaterial` (conteo de tableros por material calculado más arriba en `recalcular()`), busca cada material en `state.materiales`, calcula `importe = tableros × precioUnitario`, acumula `matSubtotal`.
2. **Costos de componentes del proyecto**: recorre `state.componentesProyecto`, resuelve el SKU actual contra `state.componentes` solo si el nombre del producto es único en el catálogo, multiplica cantidad-por-proyecto por `obtenerCantidadProyectos()`, acumula `componentesSubtotal`.
3. **Costo de corte**: calcula metros lineales de corte (`totalCorteMm/1000`), normaliza su presentación, y calcula `corteImporte` según el modo (`'metro'` o por conteo de cortes).
4. **Costo de tapacanto**: agrupa milímetros de canto por tipo (usando lado más largo/más corto de cada pieza, sin importar en qué columna se capturó cada medida), aplica redondeo opcional a 0.5 m, calcula `tapaSubtotal`.

Al final: suma `total`, valida que los 5 valores de costo sean finitos y no negativos (si no, corta la ejecución con efectos secundarios sobre DOM/`state` y `return false`), y construye `datosReporte` (15 propiedades).

# 2. Entradas identificadas

Determinadas por grep exhaustivo de todo `document.`/`state.`/identificador usado dentro del bloque original, no por la lista sugerida en la instrucción (que incluía `parametrosCorte`, no usado, y omitía varias dependencias reales):

| Parámetro | Origen original | Uso |
|---|---|---|
| `piezas` | variable local de `recalcular()` (de `leerPiezas`) | cálculo de tapacanto |
| `boards` (antes `boardsAll`) | variable local | solo `.length`, para `datosReporte.tableros` |
| `tablerosPorMaterial` | variable local | costo de material |
| `totalCortes` | variable local | costo de corte (modo por conteo) y `datosReporte.cortes` |
| `totalCorteMm` | variable local | costo de corte (ambos modos) |
| `materiales` | `state.materiales` | catálogo, lookup de precio/SKU por material |
| `componentes` | `state.componentes` | catálogo, lookup de SKU por producto |
| `componentesProyecto` | `state.componentesProyecto` | fila por componente del proyecto |
| `tapacantos` | `state.tapacantos` | catálogo, lookup de precio/SKU por tipo |
| `cantidadProyectos` | `obtenerCantidadProyectos()` (lee DOM) | multiplicador de componentes |
| `modoPrecioCorte` | variable local (de DOM, resuelta antes en `recalcular()`) | selecciona fórmula de corte |
| `precioCorte` | variable local | costo de corte por conteo |
| `precioCorteMetro` | variable local | costo de corte por metro |
| `redondearTapacanto` | `document.getElementById('redondearTapacanto').checked` | regla de redondeo de tapacanto |

Confirmado por grep que **`parametrosCorte`/`kerf` no se usan en absoluto dentro de este bloque** — no se incluyeron como parámetro para no inventar una dependencia inexistente.

# 3. Salidas identificadas

- Camino inválido: `{ ok:false, errores: [mensaje exacto original] }`.
- Camino válido: `{ ok:true, datosReporte }`, con `datosReporte` estructuralmente idéntico al original (mismas 15 claves, mismo orden de construcción, mismos nombres): `materiales`, `matSubtotal`, `cantidadProyectos`, `componentes`, `componentesSubtotal`, `tableros`, `cortes`, `corteMl`, `corteMlPresentacion`, `precioCorte`, `corteLineaLabel`, `corteImporte`, `tapacantos`, `tapaSubtotal`, `total`.

# 4. Función creada

`calcularCostosProyecto(params)` en `src/scripts/costing/calculate-costs.js`, expuesta como `window.ProyCutCosting = { calcularCostosProyecto }`. Script plano (IIFE), sin `type="module"`, cargado en `index.html` inmediatamente antes de `main.js` (después de `excel-diagrams.js`), consistente con el orden acumulativo de scripts ya establecido. Depende únicamente de `window.ProyCutFormat` (`fmt`, `fmtMoney`, `normalizarMetrosLinealesParaPresentacion`), ya cargado antes en la secuencia.

# 5. Contrato de entrada

Objeto único desestructurado con 14 propiedades (ver tabla de la sección 2). Todas se reciben explícitamente; ninguna se lee de `document`, `state` ni `localStorage` dentro de la función.

# 6. Contrato de salida

```js
{ ok:false, errores:string[] }               // costos inválidos (no finitos o negativos)
{ ok:true, datosReporte:{...15 propiedades} } // caso normal
```

El llamador es responsable de decidir qué hacer con cada forma — la función no decide nada sobre UI o persistencia.

# 7. Dependencias

- `window.ProyCutFormat.fmt`
- `window.ProyCutFormat.fmtMoney`
- `window.ProyCutFormat.normalizarMetrosLinealesParaPresentacion`

Ninguna dependencia de módulos extraídos previamente relacionados con geometría, DXF, Excel o SVG.

# 8. Efectos secundarios eliminados del núcleo

El bloque original, en su rama inválida, hacía 6 cosas directamente sobre DOM/`state`:
`mostrarErroresProyecto(...)`, ocultar `#resultadoPanel`, ocultar `#reportePanel`, `state.boards = []`, `state.ultimoReporte = null`, `state.ultimoTotal = 0`, y `return false` desde dentro de `recalcular()`.

Todos esos efectos se movieron íntegramente a `recalcular()`, que ahora los ejecuta cuando `resultadoCostos.ok === false`, reproduciendo exactamente la misma secuencia y los mismos valores. La función pura solo devuelve `{ok:false, errores}`; no decide ni ejecuta ningún efecto.

# 9. Comparación contra el original

Se armó una copia de control (`calcularCostosProyectoOriginal`) con el cuerpo **verbatim** del bloque original (líneas 4713-4839 antes del cambio), envuelto en una función que recibe los mismos datos por parámetro en vez de por closure/DOM, para poder ejecutarla en Node sin navegador. Se comparó, escenario por escenario, contra `calcularCostosProyecto` real (cargada desde el archivo del repo).

# 10. Pruebas automáticas

Entorno: Node `vm` + `assert.deepStrictEqual`, script en el sandbox de la sesión (`test-cost-comparison.js`). 17 escenarios (las 16 categorías pedidas + 1 caso inválido explícito):

1. Una pieza, un tablero
2. Varias piezas, un tablero
3. Varios tableros
4. Cantidad de proyectos > 1
5. Precio de material en 0
6. Precio de componente en 0
7. Sin componentes
8. Tapacanto en un solo lado
9. Tapacanto en los cuatro lados
10. Sin tapacanto
11. Precio por corte
12. Precio por metro lineal
13. Kerf y márgenes ya reflejados en `totalCorteMm`/piezas (el bloque no lee kerf directamente, así que se verificó que el resultado depende solo de los valores derivados, no de kerf en sí)
14. Redondeos de tapacanto a 0.5 m
15. Datos faltantes tolerados (material y tipo de tapacanto sin coincidencia en catálogo, SKU vacío)
16. Proyecto con varios materiales, varios componentes (uno con SKU duplicado en catálogo) y ambos modos de precio de corte combinados en la misma corrida
17. Caso inválido: precio de material negativo → verifica la rama `{ok:false, errores}`

Para cada escenario se comparó, con `assert.deepStrictEqual`, el resultado completo (`ok`, `errores` o `datosReporte` con las 15 propiedades, incluyendo arrays `materiales`/`componentes`/`tapacantos`) entre la copia de control y la función nueva, y además se verificó **no-mutación** (snapshot profundo antes/después) de `piezas`, `boards`, `materiales`, `componentes`, `componentesProyecto`, `tapacantos` y `tablerosPorMaterial`.

**Resultado: 17/17 escenarios OK.**

Nota técnica de la ejecución: la primera corrida falló en los 17 casos porque el módulo se cargó con `vm.createContext` (un *realm* de V8 separado, con su propio `Object.prototype`), lo que hacía que `assert.deepStrictEqual` reportara los objetos como distintos aunque su contenido fuera idéntico (confirmado con un diff estructural propio que no encontró ninguna diferencia de valores). Se corrigió cargando el módulo con `vm.runInThisContext` para que comparta el realm del proceso de prueba; tras eso, los 17 escenarios pasaron sin más cambios de código de producción.

Verificaciones adicionales:
- `node --check` en `calculate-costs.js` y en `main.js`: sin errores.
- Grep de `document.`/`state.`/`localStorage` en `calculate-costs.js`: solo aparece dentro de un comentario explicativo, ninguna referencia real en código ejecutable.
- Servidor estático local (`python3 -m http.server`) + `curl` independientes: `index.html` → 200, `src/scripts/costing/calculate-costs.js` → 200, `src/scripts/main.js` → 200.
- Revisión manual del cuerpo resultante de `recalcular()`: no quedó ninguna variable local huérfana del bloque removido (`matSubtotal`, `componentesSubtotal`, `tapaSubtotal`, `porTipo`, etc. ya no existen fuera de la función nueva); se corrigió una referencia residual (`state.ultimoTotal = total` → `state.ultimoTotal = datosReporte.total`, ya que la variable local `total` dejó de existir en `recalcular()`).

# 11. Pruebas manuales pendientes (no ejecutadas, no aprobadas)

- Proyecto con una sola pieza y un solo tablero, revisando visualmente el reporte en pantalla.
- Proyecto con varias piezas y varios tableros.
- Proyecto con varios materiales simultáneos.
- Proyecto con componentes (uno o más, incluyendo cantidad de proyectos > 1).
- Piezas con tapacanto en 1, 2, 3 y 4 lados, y piezas sin tapacanto.
- Material con precio en 0.
- Componente con precio en 0.
- Cambiar parámetros de corte (kerf, márgenes, modo de precio de corte) y confirmar que el total se recalcula igual que antes del cambio.
- Verificar que el total y los subtotales mostrados en pantalla coinciden con lo esperado manualmente.
- Verificar que las plantillas de reporte (todas las opciones de `plantillaReporte`/`disenoTotal`) siguen renderizando igual.
- Exportar a Excel y confirmar que `construirLibroExcel` sigue usando `state.ultimoReporte` sin diferencias.
- Exportar a DXF y confirmar que no se vio afectado (el bloque de costos no interviene en esa ruta).
- Revisar la consola del navegador en todo el flujo anterior, confirmando ausencia de errores.

# 12. Riesgos

- **Riesgo bajo de desincronización de contrato**: si en el futuro se agrega un nuevo campo de costo dentro de `recalcular()` sin pasar por `calcularCostosProyecto`, se rompería la garantía de "una sola fuente de verdad" para el cálculo de costos. Mitigación: cualquier cambio futuro a las fórmulas de costo debe hacerse dentro de `calculate-costs.js`, no reintroduciendo lógica en `main.js`.
- **Riesgo bajo de nombres de parámetros**: el contrato de entrada usa nombres (`boards`, `materiales`, `componentes`, etc.) distintos a los nombres de las variables originales en `recalcular()` (`boardsAll`, `state.materiales`, etc.). Un futuro editor que no lea este reporte podría pasar el parámetro equivocado sin que haya error de sintaxis (p. ej. confundir `materiales` con `componentes`, ambos arrays de objetos). Mitigación: los nombres de los parámetros son suficientemente descriptivos y no intercambiables entre sí en la práctica.
- **Sin riesgo de comportamiento**: los 17 escenarios automatizados cubren exactamente los mismos caminos de cálculo que existían antes del cambio, byte por byte en sus fórmulas.

# 13. Reversión

Revertir es directo porque el cambio está contenido en 3 archivos y no se combinó con ninguna otra modificación:

1. `git checkout -- src/scripts/main.js index.html` (o revertir el commit una vez creado).
2. `rm -rf src/scripts/costing/`.

No hay migraciones de datos, no hay cambios en `localStorage`, no hay cambios en el formato de `state.ultimoReporte` — la reversión es puramente de código.
