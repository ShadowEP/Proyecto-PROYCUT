---
name: proycut-regression-matrix
description: "Determina qué verificaciones mínimas corresponden según el subsistema de ProyCut modificado (configuración, validación, CSV, geometría, optimizador, costos, SVG, board interactivo, Excel, DXF, reportes, modelo de proyecto, persistencia). Activar antes de declarar una tarea terminada, después de refactors o cambios funcionales, y antes de recomendar commit. No inventa comandos de prueba que no existen en el repositorio: el proyecto no tiene package.json ni framework de pruebas automatizadas."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Matriz de regresión

## Cuándo se activa

- Antes de declarar cualquier tarea de código terminada.
- Después de un refactor o un cambio funcional en `index.html` o `src/scripts/**`.
- Antes de recomendar o ejecutar un commit.

## Cuándo NO se activa

- Cambios exclusivos de documentación en `docs/`.
- Decisiones de dónde debe vivir el código (→ `proycut-architecture`) o si una regla de negocio es válida (→ `proycut-domain-rules`) — esta skill asume que esas decisiones ya se tomaron y solo responde "¿qué verifico ahora?".

## Realidad del repositorio (no inventar más allá de esto)

- No existe `package.json`, ni framework de pruebas (Jest, Vitest, etc.), ni comando `npm test`.
- No hay bundler: los módulos son scripts clásicos cargados como globales (`window.ProyCut*`) en `index.html`, coordinados por `main.js`.
- La única suite de pruebas del proyecto es **manual**: `docs/engineering/12-MANUAL-TESTS.md`, organizada por subsistema, con casos identificados (`ARR-`, `MAT-`, `TAP-`, `COMP-`, `PZ-`, `COR-`, `OPT-`, `DIAG-`, `REP-`, `CSV-`, `XLS-`, …). Todas sus pruebas estaban en estado `NOT RUN` a la fecha de creación del documento.
- La única verificación automatizable disponible de forma genérica es `node --check <archivo>.js` (verifica sintaxis, no comportamiento; no requiere configuración del proyecto).
- Los "datos de referencia" a comparar antes/después de un cambio están definidos en `docs/engineering/10-CURRENT-STATE.md`, sección 18 (subtotales, tableros, desperdicio, posiciones, archivos exportados de referencia).

Cuando el subsistema no tenga un comando automatizado, la verificación correcta es **describir la prueba manual requerida y pedir al usuario que la ejecute en el navegador**, nunca inventar un comando de test que no existe en el repositorio.

## Procedimiento recomendado

1. Identificar qué archivo(s) de `src/scripts/` o qué bloque de `main.js` fueron tocados.
2. Ubicar el subsistema correspondiente en `references/matrix.md`.
3. Aplicar, en orden, las verificaciones listadas para ese subsistema: primero las automatizables (sintaxis), después las manuales.
4. Si el subsystem tocado es "estable" o "sensible" según `44-CURRENT-ARCHITECTURE-INVENTORY.md` (secciones 10–11), añadir las pruebas manuales de mayor prioridad (`CRITICAL`/`Alta`) de la sección relacionada en `12-MANUAL-TESTS.md`, no solo las triviales.
5. Reportar exactamente qué se ejecutó y qué quedó pendiente por requerir navegador — nunca declarar "probado" algo que no se pudo correr.

## Verificaciones obligatorias antes de cerrar cualquier tarea

- `node --check` sobre cada archivo `.js` modificado.
- `git diff --check` (espacios en blanco / conflictos) y `git status --short` (ver `proycut-safe-change`).
- Identificación explícita, en el reporte final, de qué pruebas manuales de `12-MANUAL-TESTS.md` aplican y si fueron ejecutadas o quedan pendientes para el usuario.
- Si el cambio toca un cálculo (costeo, kerf, optimización), comparación contra los "Datos de referencia" de `10-CURRENT-STATE.md` sección 18 cuando existan.

## Condiciones para detenerse y pedir aclaración

- El subsistema tocado no aparece en la matriz y no es evidente a qué categoría pertenece.
- La única forma de verificar el cambio es ejecución manual en navegador y el usuario espera una confirmación automática — aclarar la limitación en vez de simular un resultado.
- El cambio afecta un archivo exportado (Excel/DXF) y no hay copia de referencia disponible para comparar — señalarlo como riesgo pendiente, no omitirlo.

## Referencia detallada

Ver `references/matrix.md` para la tabla completa por subsistema (archivos involucrados, tipo de verificación aplicable, casos de `12-MANUAL-TESTS.md` relacionados).
