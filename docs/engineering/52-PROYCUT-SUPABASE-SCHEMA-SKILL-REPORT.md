# 52 — Reporte de Skill de esquema Supabase

## Estado

Propuesto para revisión.

## Versión

1.4

## Última actualización

2026-08-19

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

## 9. Revisión tras la decisión de ownership por workspace (2026-08-18, sesión posterior)

La tensión `owner_id` vs. `company_id` señalada en la sección 3 y dejada como "decisión pendiente" en la sección 8 fue resuelta por el usuario mediante `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md`: los proyectos pertenecen a un **workspace**, al que los usuarios acceden mediante **membresía** — no a un usuario individual ni a un `company_id` implícito. Esta revisión actualizó la Skill y sus documentos de referencia para reflejar esa decisión, sin diseñar el esquema SQL exacto (sigue pendiente) ni crear código o migraciones.

**Qué cambió respecto a la sesión anterior (sección 8):**
- El modelo de ownership individual (`owner_id = auth.uid()`) dejó de tratarse como "propuesta no definitiva, sujeta a confirmación" y pasó a tratarse como **superado** — la decisión de ownership ya está tomada (workspace/membresía); lo que sigue pendiente es solo el diseño técnico exacto (tablas, columnas, roles, RLS).
- Se agregó a `SKILL.md` la sección "DECISIÓN CONFIRMADA DE OWNERSHIP Y DISEÑO TÉCNICO PENDIENTE", reemplazando "PROPUESTA ACTUAL DE FASE 1 y DECISIÓN PENDIENTE".
- "Tensión entre documentos canónicos" se reescribió como resuelta a nivel conceptual por la decisión 53 (aunque el esquema SQL exacto de `workspace`/`workspace_members`/`workspace_id` sigue sin definirse).
- Se agregó una condición de detención explícita en "Condiciones para detenerse": cualquier intento de escribir una migración real de `projects` antes de que exista un diseño formal de `workspace` + membresía aprobado por el usuario.
- Se actualizaron `44-CURRENT-ARCHITECTURE-INVENTORY.md` (secciones 12, 13, 15, 16, 17, 18, 20, 21) y `45-SUPABASE-INTEGRATION-PLAN.md` (secciones "Decisiones rectoras", 4, 5, 15, 16, 25, 26, 27, "Resumen final") para dejar de presentar `owner_id`/"propietario individual"/`company_id` como modelo vigente: `45` marca explícitamente su propuesta de 5 tablas y RLS como "PROPUESTA ANTERIOR SUPERADA EN SU MODELO DE OWNERSHIP POR LA DECISIÓN 53", conservando como válido lo que no depende de ownership (fuente vs. derivado, snapshots, guardado transaccional, versionado, RLS-desde-el-inicio como principio, aislamiento, repositorio/caso de uso, modo local).
- No se determinó número definitivo de tablas, columnas, PK/FK, roles, políticas RLS SQL, triggers, RPC ni migraciones — permanecen como diseño técnico pendiente, igual que antes de esta revisión.
- No se creó `supabase/`, SQL ni scripts. No se ejecutó `supabase init`. No se modificó `src/`, `index.html`, `AGENTS.md` ni `CLAUDE.md`. No se hizo commit ni push.

## 10. Próximos pasos (superado en parte por la sección 11)

- Este reporte y la Skill quedan "Propuestos para revisión" — no se ejecuta commit ni push sin autorización explícita adicional del usuario.
- La ambigüedad `owner_id` vs. `company_id` entre `44` y `45` está **resuelta a nivel conceptual** por la decisión 53 (workspace/membresía); lo que sigue pendiente es el diseño técnico exacto (tablas, columnas, roles, RLS) — ver sección 9.
- Cuando el usuario autorice avanzar más allá de la documentación, el siguiente paso sigue siendo diseñar formalmente el esquema de `workspace`/membresía a partir de `53-PROYCUT-OWNERSHIP-DECISION.md`, antes de retomar `45-SUPABASE-INTEGRATION-PLAN.md` sección 27–28 (inicializar Supabase localmente en un commit aislado).

## 11. Incorporación del modelo conceptual de membresías — `54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` (2026-08-19, sesión posterior)

El usuario formalizó en `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` el modelo conceptual de workspace + membresías que la sección 9 dejaba pendiente de diseño técnico. Esta revisión actualizó la Skill `proycut-supabase-schema` para adoptar `54` como fuente canónica junto con `53`, sin diseñar SQL, sin crear migraciones ni ejecutar `supabase init`. Alcance de la tarea: exclusivamente `.agents/skills/proycut-supabase-schema/SKILL.md` y este reporte.

**Qué se registra como auditable:**

- **El documento 54 formalizó el modelo conceptual.** `54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` (versión 1.0, estado "Modelo conceptual confirmado por el usuario") define formalmente el diagrama Auth User → Workspace Membership → Workspace → Project, sin reabrir la decisión de ownership ya tomada en `53`.
- **La Skill ahora incorpora workspace + membership.** Se reescribió la sección "DECISIÓN CONFIRMADA DE OWNERSHIP Y DISEÑO TÉCNICO PENDIENTE" (renombrada "...Y MEMBRESÍAS, Y DISEÑO TÉCNICO PENDIENTE") para citar `53` y `54` como fuentes conjuntas, y se agregaron dentro de ella: el diagrama conceptual (sin tablas SQL), la lista completa de invariantes de `54` (proyecto → exactamente un workspace; usuario → uno o más workspaces; workspace → uno o más miembros; acceso remoto → membresía válida; al menos un owner por workspace; admin no sustituye a owner; member no administra configuración sensible por defecto; abandonar/eliminar usuario no transfiere proyectos automáticamente; cambiar de usuario no cambia el ownership del proyecto; datos derivados siguen sin ser fuente primaria), y la lista de candidatos futuros de nomenclatura (`workspaces`, `workspace_members`, `workspace_id`) marcados explícitamente como no implementados.
- **Roles owner/admin/member están confirmados conceptualmente.** La Skill ahora declara explícitamente los tres roles mínimos y su semántica conceptual (owner: al menos uno por workspace, administra configuración sensible y membresías; admin: administra operación y proyectos, no sustituye al owner; member: trabaja con proyectos, no administra configuración sensible por defecto), dejando igual de explícito que los permisos CRUD exactos por tabla y rol **no** están decididos.
- **El esquema SQL exacto sigue pendiente.** Se amplió la lista "DISEÑO TÉCNICO AÚN PENDIENTE" para incluir de forma explícita: tipos SQL, enums, índices, claims JWT y funciones RPC/triggers, además de lo ya listado (número de tablas, columnas, PK/FK, permisos exactos por rol, transferencia de ownership, invitaciones, abandono/eliminación de workspace, ownership de catálogos, RLS SQL definitiva). Se agregó una frase explícita: el antiguo esquema de 5 tablas de `45-SUPABASE-INTEGRATION-PLAN.md` **ya no puede convertirse directamente en una migración**, porque `workspace` y `workspace membership` son entidades propias del modelo, no una columna suelta en `projects`.
- **No se creó código, SQL ni migraciones.** No se creó ni modificó ningún archivo bajo `supabase/`, `src/scripts/`, `index.html`, `CLAUDE.md` ni `AGENTS.md`. No se ejecutó `supabase init`. No se creó ninguna Skill nueva. No se hizo commit ni push.

**Condición de detención añadida:** se agregó a "Condiciones para detenerse y pedir decisión explícita" un nuevo punto específico: cualquier tarea que intente diseñar SQL de workspace/membresía sin haber resuelto explícitamente, con el usuario, cada una de las seis decisiones pendientes de `54` (ownership de catálogos, permisos detallados de owner/admin/member, transferencia de ownership, invitaciones/membresías, abandono/eliminación de workspace, RLS definitiva) debe detenerse de inmediato.

## 12. Próximos pasos (vigente)

- Este reporte y la Skill quedan "Propuestos para revisión" — no se ejecuta commit ni push sin autorización explícita adicional del usuario.
- El modelo conceptual de workspace/membresía está **formalizado** por `53` y `54`; lo que sigue pendiente es exclusivamente el diseño técnico exacto (número de tablas, columnas, tipos, PK/FK, enums, índices, permisos exactos por rol, RLS SQL, RPC, triggers, claims JWT) — ver sección 11.
- Antes de diseñar ese esquema SQL, deben resolverse explícitamente con el usuario las seis decisiones pendientes listadas en `54` y repetidas como condición de detención en la Skill: ownership de catálogos, permisos detallados de owner/admin/member, transferencia de ownership, invitaciones/membresías, abandono/eliminación de workspace y RLS definitiva.
- Solo después de ese diseño formal y aprobado corresponde retomar `45-SUPABASE-INTEGRATION-PLAN.md` sección 27–28 (inicializar Supabase localmente en un commit aislado).
