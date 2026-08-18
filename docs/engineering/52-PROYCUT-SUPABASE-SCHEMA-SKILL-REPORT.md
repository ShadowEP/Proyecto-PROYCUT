# 52 — Reporte de Skill de esquema Supabase

## Estado

Propuesto para revisión.

## Versión

1.2

## Última actualización

2026-08-18

## Propósito

Documentar la creación de la Agent Skill `proycut-supabase-schema`, cuyo objetivo es proteger el diseño futuro del esquema Supabase de ProyCut (tablas, relaciones, PKs/FKs, restricciones, índices, RLS, ownership, migraciones, compatibilidad con Auth, fuente vs. derivado, snapshots) antes de que se cree ninguna migración real. Esta tarea fue exclusivamente de documentación: no se diseñó SQL real, no se crearon migraciones, no se ejecutó `supabase init`, no se modificó `src/`, `index.html`, `CLAUDE.md` ni `AGENTS.md`, y no se creó ningún script.

---

## 1. Skill creada

| Skill | Ruta | Cubre |
|---|---|---|
| `proycut-supabase-schema` | `.agents/skills/proycut-supabase-schema/SKILL.md` | Diseño de tablas, relaciones, PKs UUID, FKs, restricciones, índices, RLS, ownership, migraciones, compatibilidad futura con Auth, fuente vs. derivado, snapshots y estrategia contra doble fuente de verdad — todo como resumen del diseño ya propuesto para revisión, con distinción explícita ESQUEMA OBJETIVO / IMPLEMENTACIÓN ACTUAL |

No usa `references/` — el contenido cupo dentro de un `SKILL.md` auditable. No incluye scripts ejecutables (prohibido explícitamente por el alcance de esta tarea).

## 2. Documentos y Skills inspeccionados antes de escribir

Por instrucción explícita del usuario, se leyeron completos antes de redactar:

- `CLAUDE.md`, `AGENTS.md` — reglas del proyecto y coordinación multiagente.
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` (completo, 23 secciones) — estado real del monolito, mapa de dependencias, punto de integración recomendado (cliente → repositorio → caso de uso) y **sección 13/21**, que menciona `company_id` como parte de la primera migración.
- `docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md` (completo, 28 secciones) — fuente única del esquema de 5 tablas, columnas, RLS, RPC transaccional y fases.
- `docs/engineering/51-PROYCUT-PERSISTENCE-MODEL-AGENT-SKILLS-REPORT.md` — contexto y estilo de la serie de reportes previa.
- `.agents/skills/proycut-architecture/SKILL.md` — frontera cliente/repositorio/caso de uso y regla de lectura 44 (real) vs. 05 (objetivo).
- `.agents/skills/proycut-safe-change/SKILL.md` — método conservador de cambio, prohibición de `git add -A`/commit sin autorización.
- `.agents/skills/proycut-domain-rules/SKILL.md` — regla de lectura 10-CURRENT-STATE.md (actual) vs. 07-DATABASE.md (objetivo).
- `.agents/skills/proycut-project-model/SKILL.md` — clasificación fuente/derivado ya confirmada contra el código actual; confirma que `nombreProyecto`/`clienteId`/`companyId` no existen hoy (búsqueda `grep` sin resultados).
- `.agents/skills/proycut-persistence/SKILL.md` — persistencia real (`localStorage`) vs. futura.
- `.agents/skills/supabase/SKILL.md` (Skill pública) — checklist de seguridad RLS/Auth (`WITH CHECK` en UPDATE, `SECURITY DEFINER` vs. `INVOKER`, `TO authenticated` + predicado de ownership) referenciado en la nueva Skill sin duplicarlo.
- `.agents/skills/supabase-postgres-best-practices/SKILL.md` (Skill pública) — categorías de reglas de Postgres, referenciada como complemento genérico, no específico de ProyCut.

## 3. Hallazgo relevante: tensión entre documentos canónicos

`44-CURRENT-ARCHITECTURE-INVENTORY.md` (secciones 13 y 21) menciona explícitamente `company_id`/"compañía o contexto mínimo" como parte de la primera migración de persistencia. `45-SUPABASE-INTEGRATION-PLAN.md` —más detallado, con las 5 tablas y columnas ya propuestas para revisión— fija el alcance como **propietario individual**, sin `companies`, usando `owner_id` en vez de `company_id`.

Siguiendo `04-AI-RULES.md` sección 2 ("una instrucción que contradiga un documento superior deberá ser señalada antes de aplicarse") y la regla de lectura ya establecida en `proycut-domain-rules`/`proycut-architecture` (el documento más detallado y reciente en el tema específico prevalece como referencia operativa, sin descartar el otro como error), la Skill:

- trata `45-SUPABASE-INTEGRATION-PLAN.md` como la referencia vigente para las columnas exactas del esquema mínimo;
- **no** descarta silenciosamente la mención de `company_id` en `44`;
- la registra explícitamente como una condición de "detenerse y pedir decisión" bajo Ownership / Usuario vs. organización, en vez de que un agente futuro elija una de las dos por su cuenta.

Este hallazgo no fue asumido de memoria: surge de leer completos ambos documentos, tal como pidió el usuario antes de escribir la Skill.

## 4. Contenido de la Skill (resumen)

- **ESQUEMA OBJETIVO vs. IMPLEMENTACIÓN ACTUAL**, como secciones separadas y explícitas. Confirmado por inspección directa: `supabase/`, `src/scripts/infrastructure/`, `repositories/` y `project-persistence.js` no existen en el repositorio.
- **5 tablas, relaciones, PKs UUID, FKs, unicidad `(project_id, position)`, snapshots vs. catálogo compartido, RLS con el patrón `owner_id = auth.uid()` propuesto para fase 1 (no definitivo), guardado transaccional vía RPC, reglas de migraciones y compatibilidad futura con Auth** — resumidos desde el plan sin repetir columna por columna (para no crear una segunda fuente desincronizable).
- **Principio central protegido**, transcrito literalmente como lo pidió el usuario: *"Supabase debe persistir datos fuente e intención del proyecto, no resultados derivados que puedan recalcularse."* — con la lista explícita de qué NO tratar como fuente primaria (boards, posiciones de piezas, free rectangles, costos, reportes, SVG, DXF, Excel).
- **Estrategia contra doble fuente de verdad**: tabla de fuente de verdad por momento (edición activa / guardado en curso / reposo / carga completada / resultados), más la frontera cliente→repositorio→caso de uso de `proycut-architecture`.
- **Campos no inventados como hechos actuales**: nombre de proyecto, cliente, empresa/`company_id`/`organization_id`, `user_id` distinto de `owner_id` — marcados explícitamente como decisiones de diseño pendientes, no como parte de la propuesta ya fijada.
- **Prohibiciones**, transcritas de la instrucción del usuario: sin SQL real, sin migraciones, sin `supabase init`, sin tocar `src/`, `index.html`, `CLAUDE.md`, `AGENTS.md`, sin commit/push, sin scripts — más las prohibiciones de dominio ya derivadas del plan (RLS nunca omitida, guardado siempre transaccional).
- **Condiciones para detenerse**, una por cada tema pedido explícitamente: ownership, usuario vs. organización, IDs, snapshots, borrado, versionado, datos opcionales, políticas RLS.

## 5. Dry runs (obligatorios, tal como se pidieron)

**1 — "Quiero guardar boards optimizados en la tabla `projects`."**

Activa: `proycut-supabase-schema`. La sección "Principio central protegido" lista `boards optimizados` explícitamente como el primer ítem que **no** debe tratarse como fuente primaria; la tabla `projects` en el resumen de esquema no tiene ninguna columna para resultados de optimización, y la sección "Estrategia para evitar doble fuente de verdad" indica que los resultados siempre deben venir del pipeline local recalculado. La Skill advierte correctamente que son datos derivados y remite a `proycut-project-model` para la clasificación completa. Coincide con lo esperado.

**2 — "Quiero crear `user_id` en `projects`."**

Activa: `proycut-supabase-schema`. La tabla resumen ya usa `owner_id` (no `user_id`) como columna propuesta por el plan para fase 1 — no como columna definitiva. La sección "Datos NO inventados como hechos actuales" y "Condiciones para detenerse" (Ownership / Usuario vs. organización) indican explícitamente que cualquier columna de identidad de usuario, incluido el propio `owner_id = auth.uid()` o un `user_id` con semántica distinta (roles, equipos), requiere que el modelo de ownership/Auth se confirme con el usuario antes de convertirse en contrato de tabla. La Skill también recuerda la tensión con `44` sobre `company_id`, evitando que se fije una columna de identidad sin resolver esa ambigüedad. Coincide con lo esperado.

**3 — "Quiero guardar el precio actual del material del catálogo."**

Activa: `proycut-supabase-schema`. La sección "Snapshots, no catálogo compartido" distingue exactamente este caso: `project_materials` guarda un **snapshot** del precio en el momento de guardar el proyecto (para que una carga futura reproduzca el mismo costeo), no una referencia viva a "el precio actual del catálogo" — porque no existe todavía ningún catálogo remoto al que referenciar en tiempo real. La Skill señala que `local_catalog_id`/`sku` son trazabilidad, no identidad remota autoritativa. Coincide con lo esperado: distingue correctamente snapshot histórico de referencia a catálogo.

## 6. Verificación final

Archivos creados, mostrados íntegros arriba en esta sesión:

- `.agents/skills/proycut-supabase-schema/SKILL.md`
- `docs/engineering/52-PROYCUT-SUPABASE-SCHEMA-SKILL-REPORT.md`

```text
git diff --check       → sin salida (sin problemas de espacios en blanco)
git status --short     → solo .agents/skills/proycut-supabase-schema/ y este reporte, como nuevos (??)
```

Código de producción modificado: NO (`src/`, `index.html` intactos). Migraciones creadas: NO. `supabase init` ejecutado: NO. `CLAUDE.md`/`AGENTS.md` modificados: NO. Scripts nuevos: NO. Commit: NO. Push: NO.

## 7. Mensaje de commit propuesto (no ejecutado)

```text
docs(agents): add ProyCut Supabase schema protection skill

Add proycut-supabase-schema Skill summarizing the phase-1 proposed
Supabase design (5 tables, RLS pattern, transactional save, Auth
compatibility) from 45-SUPABASE-INTEGRATION-PLAN.md, distinguishing
target schema from current implementation and explicitly flagging
ownership (owner_id vs. company_id/organization_id) as a pending
decision, not a definitive contract, before any real migration is
written.
```

## 8. Revisión de consistencia sobre ownership (2026-08-18, misma sesión)

Tras una revisión pedida explícitamente por el usuario, se corrigió lenguaje en ambos archivos que trataba `owner_id`/RLS/el esquema de 5 tablas como si fueran contrato definitivo, en vez de propuesta de fase 1 sujeta a decisión de ownership. No se tocó ningún otro archivo.

**Cambio estructural:** se agregó en `SKILL.md` una sección nueva "PROPUESTA ACTUAL DE FASE 1 y DECISIÓN PENDIENTE" (antes de "ESQUEMA OBJETIVO"), que fija explícitamente que ownership individual vs. organización, `owner_id` vs. `company_id`/`organization_id`, la relación con Auth y las políticas RLS definitivas son decisiones pendientes, no hechos consumados.

**Frases corregidas en `SKILL.md`:**
- Frontmatter: "...como fuente aprobada" → "...como propuesta vigente de fase 1, no como modelo de ownership definitivo".
- "Cuándo activar": "...consistente con lo ya aprobado en `45-SUPABASE-INTEGRATION-PLAN.md`" → "...consistente con la propuesta vigente en `45-SUPABASE-INTEGRATION-PLAN.md`".
- Encabezado "## ESQUEMA OBJETIVO (diseño aprobado para revisión — no implementado)" → "## ESQUEMA OBJETIVO — propuesta vigente de fase 1 (no implementada)".
- Subencabezado "### Tablas (5, propietario individual, sin resultados derivados)" → "### Tablas (5 — propuesta de fase 1; ownership individual sujeto a confirmación...)".
- Se agregó una nota al pie bajo la tabla de las 5 tablas etiquetando `owner_id` con la frase exacta pedida: "patrón propuesto por 45-SUPABASE-INTEGRATION-PLAN.md para ownership individual en la primera fase, sujeto a confirmación del modelo de ownership antes de crear la migración".
- "### RLS y ownership" reescrita completa: cada mención de `owner_id = auth.uid()` pasó de enunciarse como regla ("select/insert/update/delete solo si...") a enunciarse como patrón propuesto no definitivo; "Alcance aprobado: aislamiento por propietario individual" → "Alcance propuesto para fase 1: aislamiento por propietario individual — decisión pendiente de confirmación, no un hecho consumado".
- "Compatibilidad futura con Auth": "El esquema ya se diseña compatible con Auth desde el inicio (`owner_id uuid → auth.users(id)`)" → "La propuesta de fase 1 diseña el esquema compatible con Auth... — patrón propuesto, sujeto a confirmación del modelo de ownership; si el modelo definitivo resultara ser organización/empresa..., esta columna debería revisarse antes de migrar".
- "Datos NO inventados...": "...no como algo que ya está en el esquema aprobado" → "...no como algo que ya está decidido en la propuesta de fase 1".
- "Prohibiciones": "...sin columnas de ownership/tenant (`company_id`, `organization_id`, `user_id` distinto de `owner_id`) sin que el usuario lo autorice..." → se agregó `owner_id` a la misma lista de columnas que requieren confirmación (ya no se trataba como excepción/baseline aceptado).
- "Condiciones para detenerse — Ownership": "...más allá de `owner_id = auth.uid()`" (implicaba que ese patrón ya era baseline aceptado) → "...que fije o dé por hecho un modelo de ownership — incluido el patrón `owner_id = auth.uid()` propuesto por el plan — como si ya fuera definitivo".
- "Condiciones para detenerse — Políticas RLS": "...que no siga el patrón `owner_id = auth.uid()` ya aprobado..." → "...siga o no el patrón `owner_id = auth.uid()` propuesto por el plan para fase 1 (no definitivo)...".

**Frases corregidas en este reporte:**
- Sección 4: "RLS por `owner_id = auth.uid()`" → "RLS con el patrón `owner_id = auth.uid()` propuesto para fase 1 (no definitivo)".
- Sección 4: "...no como parte del esquema aprobado" → "...no como parte de la propuesta ya fijada".
- Dry run 2: "...como columna aprobada por el plan" → "...como columna propuesta por el plan para fase 1 — no como columna definitiva"; se corrigió también la implicación de que `owner_id = auth.uid()` ya era baseline aceptado.
- Sección 8 (próximos pasos): "...alcance aprobado en `45`" → "...alcance propuesto en `45`"; se agregó que la tensión `owner_id`/`company_id` "sigue siendo una decisión pendiente, no resuelta por ninguno de los dos documentos por sí solo".
- Mensaje de commit propuesto (sección 7): "the approved minimal Supabase design" → "the phase-1 proposed Supabase design"; se reformuló el cierre para decir explícitamente "flagging ownership... as a pending decision, not a definitive contract".

Reglas conservadas sin cambio (verificadas, no tocadas): datos fuente sí se persisten; resultados derivados (boards, posiciones de piezas, free rectangles, costos, reportes, SVG, DXF, Excel) no son fuente primaria; snapshots de proyecto distintos de referencias futuras a catálogo; ninguna migración, SQL real ni `supabase init` fueron creados o ejecutados en esta revisión.

## 9. Próximos pasos

- Este reporte y la Skill quedan "Propuestos para revisión" — no se ejecuta commit ni push sin autorización explícita adicional del usuario.
- La tensión `owner_id` vs. `company_id` entre `44` y `45` documentada en la sección 3 sigue siendo una **decisión pendiente**, no resuelta por ninguno de los dos documentos por sí solo; debería resolverse explícitamente (probablemente actualizando `44` para alinearla con el alcance propuesto en `45`, o viceversa) antes de escribir la primera migración real — no se resuelve en esta tarea por no ser el alcance pedido.
- Cuando el usuario autorice avanzar más allá de la documentación, el siguiente paso sigue siendo `45-SUPABASE-INTEGRATION-PLAN.md` sección 27–28: inicializar Supabase localmente en un commit aislado.
