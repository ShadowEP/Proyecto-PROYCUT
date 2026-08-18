# 48 — Reporte de Skills propias del núcleo de ProyCut

## Estado

Propuesto para revisión.

## Versión

1.0

## Última actualización

2026-08-18

## Propósito

Documentar la creación de las primeras cuatro Agent Skills propias de ProyCut bajo `.agents/skills/`, sus fuentes, decisiones de diseño, invariantes principales, resultado de los dry runs de activación y limitaciones conocidas. No reemplaza el contenido de cada `SKILL.md`.

---

## 1. Skills creadas

| Skill | Ruta | Propósito |
|---|---|---|
| `proycut-architecture` | `.agents/skills/proycut-architecture/SKILL.md` | Protege la arquitectura de ProyCut y orienta dónde debe vivir el código, dirección de dependencias e integración de infraestructura. |
| `proycut-safe-change` | `.agents/skills/proycut-safe-change/SKILL.md` | Aplica el método conservador de modificación: cambio mínimo, comportamiento preservado, distinción explícita entre refactor y cambio funcional. |
| `proycut-domain-rules` | `.agents/skills/proycut-domain-rules/SKILL.md` | Protege conceptos y reglas del dominio (Project, piezas, materiales, costos, optimización); impide inventar reglas de negocio no documentadas. |
| `proycut-regression-matrix` | `.agents/skills/proycut-regression-matrix/SKILL.md` (+ `references/matrix.md`) | Determina qué verificaciones mínimas corresponden según el subsistema modificado, sin inventar comandos de prueba inexistentes. |

Ninguna incluye scripts ejecutables. Solo `proycut-regression-matrix` usa `references/`, porque su matriz por subsistema es voluminosa y no aporta valor dentro del cuerpo principal del `SKILL.md`.

## 2. Fuentes utilizadas

Visión: `README.md`, `docs/vision/00-LIBRO-FUNDACIONAL.md`, `01-DOCTRINA-PROYCUT.md`, `02-DESIGN-PHILOSOPHY.md`, `03-PROYCUT-BLUEPRINT.md`.

Ingeniería: `docs/engineering/04-AI-RULES.md`, `05-ARCHITECTURE.md`, `07-DATABASE.md`, `08-ENGINEERING-HANDBOOK.md`, `10-CURRENT-STATE.md`, `12-MANUAL-TESTS.md`, `44-CURRENT-ARCHITECTURE-INVENTORY.md`, `45-SUPABASE-INTEGRATION-PLAN.md`, `47-AGENT-SKILLS-FOUNDATION-REPORT.md`.

Estructura de referencia (solo formato, no contenido): `.agents/skills/supabase/SKILL.md`, `supabase-postgres-best-practices/SKILL.md`, `ui-ux-pro-max/SKILL.md`, `design-system/SKILL.md`.

Todas las rutas solicitadas existían; no fue necesario sustituir ninguna por una equivalente.

## 3. Decisiones de diseño

- **05 vs. 44 como fuente de "arquitectura".** `05-ARCHITECTURE.md` describe la arquitectura por capas *objetivo* (`src/modules/`, Presentación/Aplicación/Dominio/Infraestructura/Plataforma), que **no existe todavía** en el repositorio. `44-CURRENT-ARCHITECTURE-INVENTORY.md` describe el monolito modularizado *real* (`src/scripts/` + `main.js`). `proycut-architecture` distingue explícitamente ambas fuentes para evitar que un agente futuro trate la estructura objetivo como si ya estuviera implementada.
- **07-DATABASE.md vs. 10-CURRENT-STATE.md como fuente de "dominio".** El modelo de datos de `07-DATABASE.md` (multiempresa, `parts`, `cost_calculations`, etc.) es objetivo; el comportamiento de negocio realmente implementado hoy (fórmulas de costo, kerf, tapacanto) vive en el código y está documentado en `10-CURRENT-STATE.md` sección 12. `proycut-domain-rules` señala esta diferencia para no mezclar "lo que existe" con "lo que se planea".
- **Sin scripts, sin comandos de prueba inventados.** El repositorio no tiene `package.json` ni framework de pruebas automatizadas (confirmado por inspección directa). `proycut-regression-matrix` documenta esto explícitamente y solo ofrece `node --check` (sintaxis) como verificación automatizable genérica; todo lo demás se describe como prueba manual referenciando los casos ya existentes en `12-MANUAL-TESTS.md`.
- **Comportamientos "pendientes de verificar" no se tratan como bugs.** `10-CURRENT-STATE.md` sección 17 documenta comportamientos inferidos por lectura de código (p. ej., que mover una pieza en el diagrama no dispara recálculo de costo) sin confirmación por ejecución. `proycut-safe-change` y `proycut-regression-matrix` instruyen explícitamente a no "corregir" estos comportamientos de oficio, solo señalarlos.

## 4. Invariantes principales por skill

- **Arquitectura:** dirección de dependencias (Presentación→Aplicación→Dominio; Infraestructura/Aplicación→Dominio, nunca al revés); Dominio sin React/Supabase/OpenAI/DOM/localStorage; módulos "puros" de 44 deben seguir siéndolo; modo local siempre funcional.
- **Cambio seguro:** comportamiento observable preservado salvo aprobación explícita; un propósito por cambio; `git status` antes y después; sin commit/push sin autorización explícita y no indefinida.
- **Reglas del dominio:** `Project` como concepto central; no inventar precios, unidades, tolerancias, kerf, reglas de materiales o defaults de negocio; declarar supuestos explícitamente.
- **Matriz de regresión:** verificación proporcional al subsistema tocado; nunca declarar "probado" lo que solo puede verificarse manualmente en navegador sin haberlo hecho.

## 5. Dry runs

**Caso A — mover responsabilidad de `main.js` a un módulo nuevo sin cambiar comportamiento.**
Activa: `proycut-architecture` (dónde debe vivir), `proycut-safe-change` (ciclo de refactor, preservar comportamiento), `proycut-regression-matrix` (verificaciones del subsistema movido). Coincide con lo esperado.

**Caso B — cambiar cómo se calcula el precio de una pieza.**
Activa: `proycut-domain-rules` (confirmar que la nueva regla no es inventada), `proycut-safe-change` (esto es un **cambio funcional**, no un refactor — requiere aprobación explícita antes de aplicarse), `proycut-regression-matrix` (verificaciones de costeo). Coincide con lo esperado; la skill de cambio seguro marca correctamente la advertencia de cambio funcional.

**Caso C — integrar guardado de proyectos con Supabase.**
Activa: `proycut-architecture` (capas cliente→repositorio→persistencia), `proycut-domain-rules` (qué datos de proyecto son la fuente de verdad, qué se recalcula), `proycut-safe-change` (incrementalidad, un objetivo por commit), `proycut-regression-matrix` (subsistema persistencia, remite a `45-SUPABASE-INTEGRATION-PLAN.md` sección 25), más las skills públicas `supabase` y `supabase-postgres-best-practices` para el detalle técnico de SDK/RLS/SQL. Coincide con lo esperado.

## 6. Conflictos encontrados

Ninguno. Las cuatro Skills no se contradicen entre sí, no duplican bloques grandes de contenido (cada una remite a las otras en vez de repetir su alcance), no contradicen `CLAUDE.md`, `AGENTS.md` ni `docs/`, y no sugieren React/Tailwind/shadcn como requisito — las únicas menciones a React son prohibiciones textuales alineadas con `05-ARCHITECTURE.md` y con la regla 11 de `AGENTS.md`.

## 7. Limitaciones

- La numeración de `docs/engineering/` salta de `45` a `47` (no existe `46`); no se investigó esa discrepancia por estar fuera del alcance de esta tarea.
- El contenido de `proycut-domain-rules` sobre cálculos actuales depende de `10-CURRENT-STATE.md`, que documenta comportamiento **no confirmado por ejecución** (ver su sección 21). Si en el futuro se ejecutan las pruebas de `12-MANUAL-TESTS.md` y se detectan diferencias, la skill deberá actualizarse.
- No se leyó `docs/meta/DOCUMENTATION-STANDARD.md` (jerarquía documental oficial) como parte de esta tarea; las Skills asumen la jerarquía implícita ya usada por `CLAUDE.md`/`AGENTS.md` (docs/ como fuente canónica).

## 8. Próximas Skills recomendadas

- `proycut-supabase-boundary` — específica para la frontera cliente/repositorio/persistencia descrita en `45-SUPABASE-INTEGRATION-PLAN.md` una vez que exista código real de infraestructura.
- `proycut-catalog-identity` — para el manejo de SKU/`idInterno`/nombre en catálogos, señalado como "módulo sensible" en `44-CURRENT-ARCHITECTURE-INVENTORY.md` sección 11.
- `proycut-export-contracts` — específica para los contratos de exportación DXF/Excel (formato R12/AC1009, capas, CRLF, hojas versionadas) mencionados como "contratos conocidos" en esta tarea.
