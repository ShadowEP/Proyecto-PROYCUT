---
name: proycut-supabase-schema
description: "Protege el diseño futuro del esquema Supabase de ProyCut antes de crear migraciones reales: tablas PostgreSQL, relaciones, claves primarias UUID, claves foráneas, restricciones, índices, RLS, ownership, compatibilidad futura con Auth, datos fuente frente a derivados, snapshots de materiales/tapacantos/componentes y cómo evitar doble fuente de verdad. Activar antes de diseñar, revisar o escribir cualquier tabla, migración SQL, política RLS o función RPC de persistencia de proyectos, y antes de decidir en qué columna debería vivir un dato nuevo. No diseña SQL real ni crea migraciones — remite siempre a docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md como propuesta vigente de fase 1, no como modelo de ownership definitivo. No cubre qué datos son fuente/derivados en el código actual (usar proycut-project-model primero) ni la persistencia local existente (usar proycut-persistence)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Esquema Supabase (protección del diseño futuro)

## Propósito

Proteger el diseño del esquema de Supabase de ProyCut **antes de que exista código real**: evitar que una migración, tabla o política se cree de forma improvisada, contradiga `45-SUPABASE-INTEGRATION-PLAN.md`, mezcle datos fuente con datos derivados, o invente conceptos (nombre de proyecto, cliente, empresa, `user_id`, `organization_id`) que hoy no existen en el código ni fueron decididos. Esta Skill no diseña un esquema nuevo: resume y hace cumplir uno ya propuesto para revisión, y marca explícitamente qué queda pendiente de decisión.

## Cuándo activar

- Antes de escribir o revisar cualquier migración SQL en `supabase/migrations/`.
- Antes de diseñar o revisar tablas, relaciones, claves primarias/foráneas, restricciones o índices para persistencia de proyectos.
- Antes de diseñar o revisar políticas RLS o la función RPC transaccional de guardado.
- Al decidir en qué tabla/columna debería vivir un dato nuevo de proyecto.
- Al evaluar si un dato propuesto es fuente (debe guardarse) o derivado (debe recalcularse, no guardarse).
- Al revisar si un cambio de esquema propuesto es consistente con la propuesta vigente en `45-SUPABASE-INTEGRATION-PLAN.md` y con `44-CURRENT-ARCHITECTURE-INVENTORY.md`.

## Cuándo NO activar

- Clasificar si un dato es fuente o derivado en el código **actual** (sin Supabase todavía) → `proycut-project-model` (úsala primero; esta Skill asume ese análisis ya está hecho).
- Persistencia actual con `localStorage` o separación local/remoto → `proycut-persistence`.
- Formatos de import/export CSV/Excel/DXF → `proycut-import-export-contracts`.
- Dónde debe vivir el código de infraestructura (cliente/repositorio/caso de uso) o estructura de carpetas → `proycut-architecture`.
- Procedimiento genérico de aplicar cualquier cambio con seguridad → `proycut-safe-change` (complementaria: úsala para el *cómo*, esta Skill protege el *qué*).
- Buenas prácticas genéricas de Postgres/RLS/rendimiento no específicas de ProyCut → `supabase`, `supabase-postgres-best-practices` (Skills públicas ya instaladas; esta Skill no las duplica, solo referencia cuándo aplican).
- Diseño del modelo SaaS completo a largo plazo (multiempresa madura, catálogos compartidos, roles avanzados) → `07-DATABASE.md`, fuera de esta fase.

## Estado real verificado (IMPLEMENTACIÓN ACTUAL)

Confirmado por inspección directa, no por memoria:

- `supabase/` **no existe** en el repositorio — ninguna migración, `config.toml` ni `seed.sql` fue creado.
- `src/scripts/infrastructure/`, `repositories/` o `project-persistence.js` **no existen** — ningún cliente, repositorio ni caso de uso de Supabase fue implementado.
- `index.html` y `src/scripts/main.js` no importan ni referencian el SDK de Supabase.
- La única persistencia real hoy es `localStorage` de preferencias visuales (ver `proycut-persistence`); ningún dato de proyecto persiste.
- Por lo tanto, todo lo descrito en esta Skill bajo "ESQUEMA OBJETIVO" es diseño **"Propuesto para revisión"**, no código ni esquema aplicado. El primer cambio técnico autorizable sigue siendo la inicialización local de Supabase (`45-SUPABASE-INTEGRATION-PLAN.md` sección 27, Cambio 1), todavía no ejecutada.

## PROPUESTA ACTUAL DE FASE 1 y DECISIÓN PENDIENTE

**PROPUESTA ACTUAL DE FASE 1** — esquema mínimo de 5 tablas descrito en `45-SUPABASE-INTEGRATION-PLAN.md`; útil como base de diseño; todavía no materializado en SQL ni migraciones (ver "Estado real verificado" arriba).

**DECISIÓN PENDIENTE** — nada de esto está decidido todavía, aunque el plan proponga un patrón concreto para la primera fase:

- ownership individual frente a organización/empresa;
- `owner_id` frente a `company_id`/`organization_id` (ver "Tensión entre documentos canónicos" más abajo);
- la relación exacta con Auth (qué se activa y cuándo);
- las políticas RLS definitivas.

Ningún contenido de esta Skill debe leerse como si estas decisiones ya estuvieran tomadas. Cada vez que aparezca `owner_id = auth.uid()` (sección "RLS y ownership"), debe entenderse como **el patrón propuesto por `45-SUPABASE-INTEGRATION-PLAN.md` para ownership individual en la primera fase, sujeto a confirmación del modelo de ownership antes de crear la migración** — nunca como una regla global definitiva de ProyCut.

## ESQUEMA OBJETIVO — propuesta vigente de fase 1 (no implementada)

Fuente única: `45-SUPABASE-INTEGRATION-PLAN.md`, secciones 4–7, 16–17, 23. Este resumen no sustituye al plan; ante cualquier duda de tipo exacto, constraint o nombre de columna, confirmar contra el plan, no memorizar desde aquí.

### Tablas (5 — propuesta de fase 1; ownership individual sujeto a confirmación, ver sección anterior)

| Tabla | Rol | Clave primaria | FK principal |
|---|---|---|---|
| `projects` | Cabecera: metadatos, versión optimista, `cut_settings`/`pricing_settings` en `jsonb`, soft delete | `id uuid`, `gen_random_uuid()` | `owner_id uuid` NOT NULL → `auth.users(id)` |
| `project_materials` | Snapshot de materiales usados por el proyecto | `id uuid` | `project_id uuid` NOT NULL → `projects` |
| `project_edge_bands` | Snapshot de tapacantos usados por el proyecto | `id uuid` | `project_id uuid` NOT NULL → `projects` |
| `project_parts` | Filas de piezas capturadas (una fila = una fila del formulario, no expandida por cantidad) | `id uuid` | `project_id`, `material_id` NOT NULL → `project_materials`; `edge_band_id` NULL → `project_edge_bands` |
| `project_components` | Componentes agregados al proyecto | `id uuid` | `project_id uuid` NOT NULL → `projects` |

No se crean `companies`, clientes, roles, catálogos globales ni tablas de resultados en esta fase.

*La columna `owner_id` en la tabla anterior es el patrón propuesto por `45-SUPABASE-INTEGRATION-PLAN.md` para ownership individual en la primera fase, sujeto a confirmación del modelo de ownership antes de crear la migración — no un contrato definitivo (ver "PROPUESTA ACTUAL DE FASE 1 y DECISIÓN PENDIENTE" arriba).*

### Relaciones, unicidad y restricciones clave

- Todas las claves primarias son `uuid`. Todas las tablas hijas tienen `project_id` NOT NULL con índice.
- `projects` tiene índice `(owner_id, updated_at desc)` filtrado por `deleted_at is null` — según el mismo patrón `owner_id` propuesto, pendiente de confirmación de ownership.
- `project_materials`, `project_parts`, `project_edge_bands`, `project_components` son únicas por `(project_id, position)` — el orden es significativo (orden de captura en el DOM), no un ID incidental.
- Las referencias entre tablas hijas (`project_parts.material_id`/`edge_band_id`) deben quedar confinadas al mismo `project_id`, mediante FK compuesta o validación transaccional dentro de la RPC — nunca solo por convención del cliente.
- Cantidades, dimensiones y precios llevan restricciones de dominio (`> 0`, `>= 0` según el campo) — el detalle exacto de cada constraint vive en el plan, sección 5; no se repite completo aquí para no crear una segunda fuente desincronizable.

### Snapshots, no catálogo compartido

- `project_materials`/`project_edge_bands`/`project_components` son **copias** pertenecientes al proyecto, no filas de un catálogo global compartido — no existe todavía ningún catálogo remoto.
- `local_catalog_id`/`sku` son trazabilidad hacia el catálogo local del navegador, **no** identidad remota autoritativa — nunca tratarlos como FK a una tabla de catálogo que no existe.
- Nombre, dimensiones y precio del snapshot se conservan aunque el catálogo local del usuario cambie después de guardar — es la única forma de que una carga futura reproduzca el mismo costeo, incluso si el precio del catálogo local ya cambió.

### RLS y ownership — propuesta de fase 1, no definitiva

El patrón siguiente es **el propuesto por `45-SUPABASE-INTEGRATION-PLAN.md` para ownership individual en la primera fase, sujeto a confirmación del modelo de ownership antes de crear la migración**. No es una regla global definitiva de ProyCut ni un contrato de RLS ya cerrado (ver "PROPUESTA ACTUAL DE FASE 1 y DECISIÓN PENDIENTE" arriba).

- `projects`: el patrón propuesto es `select/insert/update/delete` solo si `owner_id = auth.uid()`; `insert` exigiría que el valor coincida con el usuario autenticado.
- Tablas hijas: el mismo patrón propuesto condiciona el acceso a que el proyecto padre activo tenga `owner_id = auth.uid()`.
- `anon` no tendría ninguna política de acceso a datos de proyecto — esto es un principio de seguridad general (mínimo privilegio, `04-AI-RULES.md` sección 24), válido cualquiera que sea el modelo de ownership final, no específico del patrón `owner_id`.
- Cualquiera que sea el modelo de ownership que se confirme (individual u organización), las políticas nunca deben confiar en un identificador enviado por la UI para autorizar — siempre debe derivarse de `auth.uid()`/la sesión autenticada en el propio predicado (ver Skill pública `supabase`, checklist de seguridad, sobre `TO authenticated` + predicado de ownership, y sobre `WITH CHECK` obligatorio en `UPDATE`).
- `deleted_at` se filtraría en listados y cargas normales (soft delete; borrado físico solo dentro del reemplazo transaccional de hijos) — mecánica independiente del modelo de ownership que se elija.
- Alcance propuesto para fase 1: aislamiento por **propietario individual**, no multiempresa — **decisión pendiente de confirmación**, no un hecho consumado (ver "Tensión entre documentos canónicos" abajo).

### Guardado: operación transaccional obligatoria

Guardar/actualizar toca 5 tablas y debe ser una única transacción — nunca varias llamadas separadas del cliente. El plan recomienda una función RPC versionada (conceptual `save_project_v1(payload, expected_version, idempotency_key)`) que valida usuario, compara `version` (bloqueo optimista), reemplaza el conjunto completo de hijos (no hace diff incremental), valida relaciones dentro del mismo proyecto, incrementa `version`, y confirma o revierte todo. No calcula `boards` ni costos. Debe preferir `SECURITY INVOKER` sobre `SECURITY DEFINER` (ver checklist de seguridad de la Skill pública `supabase`) y limitar `search_path`.

### Migraciones

- Todo DDL vive en archivos versionados de `supabase/migrations/` — nunca se edita el esquema aplicado directamente.
- Cada migración debe poder aplicarse desde una base vacía (reset repetible) y documentar propósito, compatibilidad y reversión.
- Cambios destructivos siguen expandir → migrar → verificar → contraer, en entregas separadas.
- RLS se habilita **en la misma migración** que crea las tablas — nunca como paso posterior "por ahora sin políticas".
- `schema_version` (columna del DTO en `projects`) y la versión de la migración SQL son conceptos distintos.

### Compatibilidad futura con Auth

- Auth **no** es necesaria para redactar el esquema, ejecutar `supabase init`, levantar el entorno local o aplicar/probar migraciones (se puede probar con usuarios sintéticos).
- Auth **sí** es necesaria antes de que el navegador lea o escriba un proyecto remoto real — sin usuario autenticado, cualquier política para `anon` expondría proyectos públicamente o exigiría un secreto que no puede vivir en frontend.
- La propuesta de fase 1 diseña el esquema compatible con Auth desde el inicio mediante el patrón `owner_id uuid → auth.users(id)` — patrón propuesto, sujeto a confirmación del modelo de ownership; si el modelo definitivo resultara ser organización/empresa en vez de propietario individual, esta columna debería revisarse antes de migrar. Auth en sí se implementaría en una fase posterior separada (plan, sección 26, fase 7).
- No implementar Auth completa en el mismo cambio que el esquema o la persistencia funcional (regla explícita del plan, sección 20).

## Principio central protegido

**Supabase debe persistir datos fuente e intención del proyecto, no resultados derivados que puedan recalcularse.**

No tratar como fuente primaria en ninguna tabla de esta fase:

- boards optimizados;
- posiciones de piezas;
- free rectangles / rectángulos libres;
- costos calculados;
- reportes;
- SVG;
- DXF;
- Excel.

Todo lo anterior se recalcula siempre localmente después de cargar un proyecto (ver `proycut-project-model` para la clasificación completa fuente/derivado contra el código actual, y `45-SUPABASE-INTEGRATION-PLAN.md` secciones 2–3).

## Estrategia para evitar doble fuente de verdad

| Momento | Fuente de verdad |
|---|---|
| Edición activa antes de guardar | DOM para piezas/controles; `state` para catálogos y componentes |
| Guardado en curso | DTO inmutable capturado y validado antes de la llamada |
| Proyecto guardado en reposo | Filas de Supabase de la última versión confirmada |
| Carga completada | DOM/`state` hidratados desde el DTO; vuelven a ser fuente de edición activa |
| Resultados (boards, costos, reporte, SVG, exportaciones) | Siempre el pipeline local recalculado — nunca una copia guardada |

Reglas de frontera (ver `proycut-architecture`): el SDK de Supabase vive únicamente en un cliente de infraestructura; un repositorio traduce DTO ↔ filas sin tocar DOM/`state`; un caso de uso de persistencia decide modo remoto/local sin conocer SQL. `main.js` solo debe consumir el caso de uso, nunca el cliente. Ningún botón debe conocer el SDK directamente.

## Datos NO inventados como hechos actuales — decisiones de diseño pendientes

Estos campos **no existen hoy** en el código (confirmado por `proycut-project-model` mediante `grep` sin resultados) y esta Skill no los trata como decididos, aunque aparezcan mencionados como necesidad futura en `07-DATABASE.md` o parcialmente en `44-CURRENT-ARCHITECTURE-INVENTORY.md`:

- nombre de proyecto (como concepto de negocio distinto del `name` de cabecera ya incluido en el plan);
- cliente / `client_id`;
- empresa / `company_id` / `organization_id`;
- `user_id` como concepto distinto de `owner_id` (roles, invitaciones, equipos).

Cualquier tarea que necesite alguno de estos campos debe tratarlo como **propuesta pendiente de decisión explícita del usuario**, no como algo que ya está decidido en la propuesta de fase 1.

## Tensión entre documentos canónicos (señalar, no resolver silenciosamente)

`44-CURRENT-ARCHITECTURE-INVENTORY.md` secciones 13 y 21 mencionan `company_id`/"compañía o contexto mínimo" como parte de la primera migración. `45-SUPABASE-INTEGRATION-PLAN.md` (más reciente en detalle, con tablas y columnas explícitas ya propuestas para revisión) fija explícitamente el alcance como **propietario individual**, sin `companies` ni multiempresa, y sus 5 tablas usan `owner_id`, no `company_id`. Esta Skill trata `45-SUPABASE-INTEGRATION-PLAN.md` como la referencia vigente para las columnas exactas (es el documento más detallado y el que enumera las tablas), pero **no descarta** la mención de `company_id` en `44` como error — es exactamente el tipo de ambigüedad de ownership que debe señalarse al usuario antes de fijar `owner_id` vs. un futuro `company_id`/`organization_id` en una migración real, no resolverse por elección silenciosa de un agente.

## Prohibiciones

- No diseñar SQL real, ni escribir DDL ejecutable, dentro de esta Skill o de una tarea que solo la invoque.
- No crear migraciones en `supabase/migrations/`.
- No ejecutar `supabase init` ni ningún comando de CLI de Supabase.
- No modificar `src/` (ningún archivo bajo `src/scripts/`).
- No modificar `index.html`.
- No modificar `CLAUDE.md` ni `AGENTS.md`.
- No hacer commit ni push.
- No crear scripts (de shell, Node, SQL suelto, etc.).
- No crear tablas fuera de las 5 propuestas, ni fijar como definitiva ninguna columna de ownership/tenant (`owner_id`, `company_id`, `organization_id`, `user_id` distinto de `owner_id`) sin que el usuario confirme el modelo de ownership — ver "PROPUESTA ACTUAL DE FASE 1 y DECISIÓN PENDIENTE".
- No omitir RLS "temporalmente" para simplificar una prueba local.
- No implementar guardado como varias llamadas separadas del cliente en vez de la función RPC transaccional.
- No mezclar este esquema mínimo con el modelo objetivo completo de `07-DATABASE.md` como si ya fueran el mismo diseño.

## Condiciones para detenerse y pedir decisión explícita

- **Ownership:** cualquier tarea que fije o dé por hecho un modelo de ownership — incluido el patrón `owner_id = auth.uid()` propuesto por el plan — como si ya fuera definitivo; confirmar el modelo de ownership con el usuario antes de fijar cualquier columna en una migración real.
- **Usuario vs. organización:** cualquier tarea que introduzca `company_id`/`organization_id`/equipos — ver "Tensión entre documentos" arriba; nunca decidir esto de oficio.
- **IDs:** cualquier ambigüedad entre UUID remoto, `local_catalog_id`, SKU, nombre o `source_row_id` como identidad — confirmar cuál es la identidad autoritativa antes de diseñar una FK.
- **Snapshots:** duda sobre si un dato nuevo debe guardarse como snapshot del proyecto o como referencia a un catálogo (que todavía no existe como tabla remota) — no asumir, preguntar.
- **Borrado:** cualquier propuesta de borrado físico fuera del reemplazo transaccional de hijos ya descrito — el plan solo aprueba soft delete (`deleted_at`) para la cabecera.
- **Versionado:** cualquier cambio a la semántica de `version` (bloqueo optimista) o `schema_version` (versión del DTO) — son conceptos distintos, no fusionarlos ni cambiarlos sin confirmar impacto.
- **Datos opcionales:** duda sobre si un campo debe ser NOT NULL u opcional (por ejemplo, `edge_band_id` cuando ningún lado tiene tapacanto) — confirmar contra el plan o preguntar, no asumir NULL por conveniencia.
- **Políticas RLS:** cualquier política, siga o no el patrón `owner_id = auth.uid()` propuesto por el plan para fase 1 (no definitivo), o que otorgue acceso a `anon` — detenerse y confirmar explícitamente, nunca aplicar "para probar más fácil".
- La tarea pide crear o aplicar una migración real, ejecutar `supabase init`, o cualquier acción marcada como prohibida arriba — confirmar autorización explícita de salir de la fase de documentación antes de continuar.
