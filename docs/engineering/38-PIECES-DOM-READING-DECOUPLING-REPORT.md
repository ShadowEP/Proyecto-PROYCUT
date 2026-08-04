# 38-PIECES-DOM-READING-DECOUPLING-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-04

## Propósito
Registrar el segundo desacoplamiento arquitectónico de ProyCut: centralizar la lectura cruda de las filas de `#piezasBody` en un único punto (`leerFilasPiezasDesdeDOM`, en `src/scripts/pieces/pieces-dom-reader.js`), sin crear `state.piezas`, sin convertir `state` en fuente de verdad y sin cambiar el comportamiento observable de `validarProyecto`, `leerPiezas`, `leerPiezasParaExportar`, `leerPiezasFormularioParaFormato` ni `aplicarPiezasPendientes`.

## Depende de
`src/scripts/main.js`; `src/scripts/pieces/pieces-dom-reader.js`; `index.html`; `docs/engineering/36-ARCHITECTURAL-DECOUPLING-PLAN.md` (identifica las piezas del DOM como fuente de verdad y anticipa este cambio); `docs/engineering/37-COST-CALCULATION-DECOUPLING-REPORT.md` (primer cambio de esta misma serie); `docs/engineering/10-CURRENT-STATE.md` (sección 16, ya documentaba que 5 funciones leían `#piezasBody` de forma independiente)

## Referenciado por
PENDIENTE

---

# 1. Lectores originales encontrados

Grep exhaustivo de `#piezasBody` y de cada clase de campo (`.p-cant`, `.p-l`, `.p-a`, `.p-girar`, `.p-material-input`, `.p-tapatipo-input`, `.p-l1/.p-l2/.p-a1/.p-a2`, `.p-label`) en `main.js` completo, clasificando cada aparición por la función que la contiene:

| Función | Líneas (antes del cambio) | Tipo de acceso |
|---|---|---|
| `leerPiezasFormularioParaFormato` | 910–931 | Lectura completa de fila → array posicional |
| `aplicarPiezasPendientes` | 2265–2268 | Lectura parcial (solo `.p-cant`, para sumar cantidad existente) |
| `refrescarSelects` | 2657–2683 | **Mutación** de `.p-material-input`/`.p-tapatipo-input` (no lectura de piezas) |
| `attachGirarToggle` / listener de `girarTodos` | 3142–3147 | **Mutación** de `.p-girar` en todas las filas |
| `addPiezaRow` | 2966 | Creación de fila nueva (no lectura) |
| `renumerarFilas` | 3151–3155 | **Mutación** de `dataset.id`/texto de la columna # |
| listener de `addPieza` | 3161–3170 | Lectura parcial (solo material/tapaTipo de la última fila, para heredar valores en la fila nueva) |
| `sincronizarCantoSelector` | 3068 | Lectura/repintado de una sola fila (`.p-l1/.p-l2/.p-a1/.p-a2`), efecto visual del selector de cantos |
| `validarProyecto` | 3359–3373 | Lectura completa de fila (parcial: no lee giro/cantos/tapacanto/etiqueta) → validación |
| `leerPiezas` | 3392–3468 | Lectura completa de fila → expansión y objetos de pieza |
| `leerPiezasParaExportar` | 4956–4972 | Lectura completa de fila → objetos de pieza (sin expandir) |

Cuatro funciones leen **todos o casi todos** los campos de cada fila para construir una salida propia: `leerPiezasFormularioParaFormato`, `validarProyecto` (parcial), `leerPiezas`, `leerPiezasParaExportar`. Una quinta, `aplicarPiezasPendientes`, lee un solo campo (`.p-cant`) repetido en cada fila, con el mismo patrón de recorrido. Las demás apariciones son mutaciones del DOM o lecturas de un solo campo ajenas al propósito de "leer una pieza completa" — se documentan pero **no se migran** (sección 5).

# 2. Diferencias entre los cuatro lectores completos

| Aspecto | `leerPiezasFormularioParaFormato` | `validarProyecto` (fragmento) | `leerPiezas` | `leerPiezasParaExportar` |
|---|---|---|---|---|
| `cant` | `parseInt\|\|1`, sin expandir | validado como string (`validarCantidad`) | `parseInt\|\|0`, **expandido** ×`cantidadProyectos` en N piezas | `parseInt\|\|0`, guardado como campo (sin expandir) |
| `l`/`a` | `parseFloat`, fila omitida si `!l\|\|!a` | validado como string (`validarMedida`) | `parseFloat`, fila omitida si `!l\|\|!a\|\|cant<=0` | `parseFloat`, fila omitida si `!l\|\|!a\|\|cant<=0` |
| `girarModo` | `dataset.modo\|\|'auto'` | no se lee | `dataset.modo\|\|'auto'`, normalizado a `'normal'` si el nivel de optimización no permite girar en Auto | no se lee |
| `material` | `dataset.valor\|\|''` | solo para verificar que no esté vacío (trim) | `dataset.valor` sin default | `dataset.valor\|\|''` |
| `tapaTipo` | `dataset.valor\|\|''` | no se lee | `dataset.valor` sin default | `dataset.valor\|\|''` |
| `l1/l2/a1/a2` | `checked`, convertidos a `'SI'/'NO'` | no se lee | `checked`, booleanos | `checked`, booleanos |
| `label` | `.trim()`, sin fallback | no se lee | `.trim()`, con fallback `'Pieza ' + id` si queda vacío | `.trim()`, sin fallback |
| identificador de fila | no incluido en la salida | usado solo como índice (`i+1`), no `dataset.id` | `dataset.id`, usado como `num` **y** pasado a `resolverParametrosCorteEtapa4(id)` | `dataset.id`, usado como `num` |
| verificación de ajuste al tablero | no | no | sí (única función que hace fit-check y expansión) | no |
| validación de campos | no (omite en silencio) | sí (`validarCantidad`/`validarMedida`, acumula errores) | no (fit-check, no validación de formato) | no |
| forma de salida | array de arrays posicionales (11 columnas) | `{ok, errores}` | `{piezas:[...expandidas...], errores:[...]}` | array de objetos, uno por fila (sin expandir) |

Estas diferencias son el motivo por el que **ninguna de las cuatro funciones cambió su transformación**: cada una sigue decidiendo, a partir del mismo dato crudo, qué default aplicar, si expandir por cantidad, si normalizar el giro y qué validar.

# 3. Función central creada

`leerFilasPiezasDesdeDOM()` en `src/scripts/pieces/pieces-dom-reader.js`, expuesta como `window.ProyCutPiecesDomReader = { leerFilasPiezasDesdeDOM }`. Recorre `document.querySelectorAll('#piezasBody tr')` **una sola vez** y devuelve un array de objetos crudos, uno por fila, en el mismo orden en que aparecen en el DOM.

# 4. Contrato de salida cruda

Por cada fila, un objeto con exactamente estos campos — todos observados directamente de los controles, sin ningún `parseInt`/`parseFloat`/`trim`/normalización/default aplicado dentro del lector:

```js
{
  id,           // row.dataset.id (string)
  cantTexto,    // .p-cant.value (string, sin parsear)
  largoTexto,   // .p-l.value (string, sin parsear)
  anchoTexto,   // .p-a.value (string, sin parsear)
  girarModo,    // .p-girar.dataset.modo (string, sin default)
  material,     // .p-material-input.dataset.valor (string, sin default)
  tapaTipo,     // .p-tapatipo-input.dataset.valor (string, sin default)
  l1, l2, a1, a2, // .p-l1/.p-l2/.p-a1/.p-a2.checked (boolean)
  labelTexto    // .p-label.value (string, sin trim)
}
```

No incluye cantidad expandida, giro normalizado, defaults de material/tapacanto vacío, ni ningún campo que no exista como control real en la fila — no se inventó ninguna propiedad fuera de las que ya leían las cuatro funciones originales.

# 5. Funciones migradas

- `leerPiezasFormularioParaFormato` (main.js) — ahora recorre `leerFilasPiezasDesdeDOM()` en vez de `document.querySelectorAll('#piezasBody tr')`.
- `validarProyecto` (fragmento de piezas, dentro de la función) — mismo cambio.
- `leerPiezas` — mismo cambio; conserva `fila.id` en los lugares donde antes usaba `row.dataset.id` (como `num` de cada pieza y como argumento de `resolverParametrosCorteEtapa4`).
- `leerPiezasParaExportar` — mismo cambio.
- `aplicarPiezasPendientes` — el conteo de `cantidadAcumulada` (suma de `.p-cant` de las filas ya existentes, usada para verificar el límite antes de aplicar una importación) ahora usa `leerFilasPiezasDesdeDOM().reduce(...)` sobre `fila.cantTexto`, en vez de `document.querySelectorAll('#piezasBody .p-cant')` directo. Se incluyó porque es, igual que las cuatro anteriores, una lectura de piezas fila por fila (no una mutación ni un caso ajeno), y el cambio es idéntico en naturaleza y riesgo a los otros cuatro.

**No migradas, deliberadamente** (mutan el DOM o son lecturas de un solo campo ajenas al alcance de "leer una pieza completa", ver sección 1): `refrescarSelects`, el listener de `girarTodos`, `renumerarFilas`, el listener de `addPieza` (hereda material/tapaTipo de la última fila), `sincronizarCantoSelector`, `addPiezaRow`.

# 6. Comportamiento preservado

- Ningún nombre de función pública cambió.
- Ninguna firma cambió (`leerPiezas(parametrosCorteProyecto)` sigue recibiendo el mismo parámetro opcional; el resto sigue sin parámetros).
- Ningún mensaje de validación cambió (se preservó texto exacto en `validarProyecto`, incluyendo `'Agrega al menos una pieza antes de continuar.'` y `'Pieza ' + n + ': selecciona un material.'`).
- El orden de las validaciones dentro de `validarProyecto` no cambió (el fragmento de piezas sigue siendo el último bloque, después de materiales/tapacantos/componentes/componentes del proyecto).
- La expansión por cantidad sigue ocurriendo únicamente en `leerPiezas`.
- La normalización de giro (`'auto'` → `'normal'` cuando el nivel de optimización no permite girar en Auto) sigue ocurriendo únicamente en `leerPiezas`.
- La estructura de salida de exportación (`leerPiezasParaExportar`, array de objetos con `cant` sin expandir) no cambió.
- No se creó `state.piezas`; las piezas siguen viviendo únicamente en el DOM.
- No se agregaron event listeners nuevos.
- No se tocó `addPiezaRow`, la eliminación de piezas, la importación CSV/Excel, `validarNumeroEntrada`, `validarCantidad`, `validarMedida`, `recalcular`, `calcularCostosProyecto`, el optimizador, ni los reportes/exportación.

# 7. Comparación contra el original

Se construyeron, para cada una de las 4 funciones migradas y para `leerFilasPiezasDesdeDOM`, copias de control con el cuerpo **verbatim** de la versión original (pre-cambio, con `row.querySelector(...)` directo) y se compararon contra el cuerpo real actual de `main.js` (verificado además con lectura directa del archivo tras el cambio, no solo de memoria) ejecutando ambas sobre el mismo DOM simulado.

# 8. Pruebas automáticas

Entorno: Node, sin dependencias nuevas — DOM simulado construido a mano (`crearFilaMock`/`crearDocumentoMock` en el script de prueba), más los módulos **reales** del repo cargados con `vm.runInThisContext` (mismo realm, para evitar el falso-positivo de prototipos distintos ya documentado en el reporte 37): `limits.js`, `validation.js` (`validarCantidad`/`validarMedida` reales), `basic-geometry.js` (`calcularRectanguloUtilTablero`/`calcularRectanguloColocacion` reales, puras), `hierarchical-config.js` (`resolverParametrosCorteEtapa4` real, con un mock de los controles de kerf/márgenes que consume), y el propio `pieces-dom-reader.js` real.

**Prueba 1 — fidelidad cruda de `leerFilasPiezasDesdeDOM`**: comparada contra una lectura de control que hace `row.querySelector(...)` directo sobre el mismo mock, en 6 casos (cero filas, una fila, varias filas, campos vacíos/inválidos, valores decimales, orden de filas invertido). Confirma que el lector nuevo es un espejo exacto de cada campo que las funciones originales leían.

**Pruebas 2–5 — las 4 funciones migradas**, cada una con su copia de control (cuerpo original verbatim) contra su versión nueva (cuerpo actual, llamando al lector real), ejecutadas sobre 12 escenarios: cero filas, una fila, varias filas, campos vacíos e inválidos (cantidad/largo como texto o negativos), cantidad de proyectos > 1, giro Auto en nivel Normal (se normaliza), giro Auto en nivel Completa (se conserva), giro Rotado explícito, tapacantos en cada lado y en los cuatro lados a la vez, material y tapacanto vacíos, valores decimales, y orden de filas invertido. Además, un caso adicional dedicado a una pieza que no cabe en el tablero, para confirmar que `leerPiezas` preserva el mensaje de error exacto.

En cada escenario se verificó también que los datos de entrada del mock (representando los controles del DOM) no fueran mutados por ninguna de las funciones bajo prueba.

**Resultado: 65/65 verificaciones OK** (6 de fidelidad cruda + 4 funciones × 12 escenarios + 12 verificaciones de no-mutación + 1 caso de ajuste al tablero).

Verificaciones estructurales adicionales:
- `node --check` sin errores en `pieces-dom-reader.js` y en `main.js`.
- Grep de `state.`/`localStorage` en `pieces-dom-reader.js`: ninguna coincidencia.
- Grep de asignaciones (`.value =`, `.checked =`, `.dataset.x =`, `createElement`, `appendChild`, `removeChild`) en `pieces-dom-reader.js`: ninguna coincidencia — no muta el DOM.
- Grep de `querySelectorAll('#piezasBody` en `main.js` tras el cambio: solo quedan las 4 apariciones ya identificadas como mutaciones/lecturas parciales ajenas al alcance (`refrescarSelects`, listener de `girarTodos`, `renumerarFilas`, listener de `addPieza`) — ninguna de las funciones migradas ejecuta ya ese `querySelectorAll` directamente.
- Servidor estático local + `curl` independientes: `index.html` → 200, `src/scripts/pieces/pieces-dom-reader.js` → 200, `src/scripts/main.js` → 200.
- `index.html`: `pieces-dom-reader.js` carga después de `calculate-costs.js` y antes de `main.js`, sin reordenar ningún otro script.

# 9. Pruebas manuales pendientes (no ejecutadas, no aprobadas)

- Agregar pieza.
- Editar largo/ancho.
- Cambiar cantidad.
- Cambiar material.
- Cambiar tapacanto.
- Activar L1/L2/A1/A2.
- Cambiar los tres modos de giro (Auto, Normal, Rotado).
- Eliminar pieza.
- Importar CSV.
- Importar Excel.
- Exportar formato.
- Exportar Excel.
- Optimizar.
- Comprobar costos.
- Consola sin errores.

# 10. Riesgos

- **Riesgo bajo, campo compartido sin default centralizado**: como el lector devuelve valores crudos (por ejemplo `material`/`tapaTipo` sin `|| ''`), cada función migrada sigue siendo responsable de aplicar su propio default. Si en el futuro se agrega una quinta función que lea piezas y se olvida aplicar el default que necesita, el error sería silencioso (string vacío vs. `undefined`) en vez de una excepción inmediata. Mitigación: este mismo reporte documenta explícitamente, por función, qué default aplica cada una (sección 2).
- **Riesgo bajo de nueva dependencia de carga**: `pieces-dom-reader.js` debe cargar antes que `main.js` en `index.html`; si algún cambio futuro reordena scripts sin cuidado, `window.ProyCutPiecesDomReader` sería `undefined` al ejecutarse la IIFE de `main.js`. Mismo patrón de riesgo que los 17 módulos ya extraídos previamente, sin mitigación adicional específica de este cambio.
- **Sin riesgo de comportamiento**: las 65 verificaciones automatizadas cubren exactamente los mismos campos, defaults, expansión, normalización y validación que existían antes del cambio.

# 11. Reversión

Cambio contenido en 3 archivos, sin combinarse con ninguna otra modificación:

1. `git checkout -- src/scripts/main.js index.html` (o revertir el commit una vez creado).
2. `rm -rf src/scripts/pieces/`.

No hay migración de datos ni cambios en `localStorage` — la reversión es puramente de código.
