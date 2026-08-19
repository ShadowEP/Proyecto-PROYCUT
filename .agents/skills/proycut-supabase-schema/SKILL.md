---
name: proycut-supabase-schema
description: "Protege el diseño futuro del esquema Supabase de ProyCut: tablas, relaciones, PKs/FKs UUID, restricciones, índices, RLS, ownership por workspace/membresía, Auth futura, fuente vs. derivados, snapshots y doble fuente de verdad. Activar antes de diseñar/escribir cualquier tabla, migración SQL, RLS o RPC de persistencia, o al decidir dónde vive un dato nuevo. Adopta docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md y docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md como fuentes canónicas de ownership y membresías (workspace + membership, roles owner/admin/member, no propietario individual); owner_id=auth.uid() de docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md queda superado, esquema SQL exacto pendiente. No diseña SQL real. No cubre fuente/derivado del código actual (usar proycut-project-model) ni persistencia local (usar proycut-persistence)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Esquema Supabase (protección del diseño futuro)

## Propósito

Proteger el diseño del esquema de Supabase de ProyCut **antes de que exista código real**: evitar que una migración, tabla o política se cree de forma improvisada, contradiga `53-PROYCUT-OWNERSHIP-DECISION.md`, `54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` o `45-SUPABASE-INTEGRATION-PLAN.md`, mezcle datos fuente con datos derivados, o invente conceptos (nombre de proyecto, cliente, esquema SQL exacto de `workspace`/membresía, permisos exactos por rol, `user_id` distinto de Auth, `company_id`/`organization_id`) que hoy no existen en el código ni tienen diseño técnico decidido. Esta Skill no diseña un esquema nuevo: adopta la decisión de ownership de `53-PROYCUT-OWNERSHIP-DECISION.md` y el modelo conceptual de `54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` (workspace + membership, roles `owner`/`admin`/`member`, no propietario individual) y resume/hace cumplir, en lo que no depende de ownership, la propuesta técnica de fase 1 ya existente, marcando explícitamente qué queda pendiente de decisión.

## Cuándo activar

- Antes de escribir o revisar cualquier migración SQL en `supabase/migrations/`.
- Antes de diseñar o revisar tablas, relaciones, claves primarias/foráneas, restricciones o índices para persistencia de proyectos.
- Antes de diseñar o revisar políticas RLS o la función RPC transaccional de guardado.
- Al decidir en qué tabla/columna debería vivir un dato nuevo de proyecto.
- Al evaluar si un dato propuesto es fuente (debe guardarse) o derivado (debe recalcularse, no guardarse).
- Al revisar si un cambio de esquema propuesto es consistente con la decisión de ownership de `53-PROYCUT-OWNERSHIP-DECISION.md`, el modelo conceptual de `54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` y la propuesta técnica de fase 1 en `45-SUPABASE-INTEGRATION-PLAN.md` y `44-CURRENT-ARCHITECTURE-INVENTORY.md`.
- Al evaluar si un agente está a punto de diseñar SQL (tablas, RLS, RPC) de workspace/membresía sin haber resuelto primero las decisiones pendientes de `54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` (ownership de catálogos, permisos detallados de owner/admin/member, transferencia de ownership, invitaciones/membresías, abandono/eliminación de workspace, RLS definitiva) — ver "Condiciones para detenerse".

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

## DECISIÓN CONFIRMADA DE OWNERSHIP Y MEMBRESÍAS, Y DISEÑO TÉCNICO PENDIENTE

**DECISIÓN CONFIRMADA** — `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` y `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` son las fuentes canónicas de ownership y membresías. `54` es la extensión conceptual directa de `53`, no la reabre:

- los proyectos pertenecen a un **workspace**, no directamente a un usuario individual;
- los usuarios acceden a un proyecto mediante **membresía** a su workspace;
- incluso un usuario individual tiene su propio workspace desde el primer proyecto;
- un usuario puede pertenecer a uno o más workspaces; un workspace puede tener uno o más miembros;
- usuario ↔ workspace se relacionan mediante **membresías** (Workspace Membership), no por comparación directa de identidad;
- los roles mínimos confirmados dentro de un workspace son `owner`, `admin` y `member`; debe existir al menos un `owner` por workspace;
- Auth identifica usuarios; la autorización de acceso a proyectos debe basarse en membresía activa al workspace propietario, nunca en comparar directamente contra el usuario autenticado;
- el proyecto no pertenece directamente a `auth.uid()`;
- esta decisión **reemplaza** el modelo de propietario individual (`owner_id = auth.uid()`) que proponía `45-SUPABASE-INTEGRATION-PLAN.md` para la fase 1 — ver "ESQUEMA OBJETIVO" y "RLS y ownership" más abajo, marcados como propuesta anterior superada.

### Modelo conceptual mínimo (de `54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md`, sin tablas SQL todavía)

```text
Auth User
    |
    | membership
    v
Workspace Membership
    |
    v
Workspace
    |
    +--> Project
    +--> Project
    +--> futuros recursos compartidos
```

- **Auth User**: identidad autenticada gestionada por Auth; no es propietario directo de ningún proyecto; puede tener varias membresías, una por cada workspace al que pertenece.
- **Workspace Membership**: relaciona un usuario con un workspace; contiene conceptualmente el rol (`owner`/`admin`/`member`) de ese usuario en ese workspace; relación muchos-a-muchos entre usuarios y workspaces.
- **Workspace**: contenedor de ownership; posee proyectos; agrupa miembros mediante membresías; punto natural futuro para billing y recursos compartidos.
- **Project**: pertenece exactamente a un workspace; su ownership se resuelve siempre a través del workspace, nunca directamente del usuario autenticado.

Esto es un modelo conceptual, no un esquema de tablas: no fija PK/FK, tipos SQL, enums, índices, RLS SQL, RPC, triggers, claims JWT ni número definitivo de tablas — ver "DISEÑO TÉCNICO AÚN PENDIENTE" abajo.

### Invariantes confirmadas (de `54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md`)

- Todo proyecto debe pertenecer a exactamente un workspace.
- Todo acceso remoto a un proyecto debe derivarse de una membresía válida.
- Un usuario puede pertenecer a varios workspaces.
- Un workspace puede tener varios usuarios.
- Un workspace debe conservar al menos un `owner`.
- `admin` no sustituye automáticamente al `owner`.
- `member` no administra configuración sensible del workspace por defecto.
- Cambiar de usuario no cambia el ownership del proyecto.
- Abandonar un workspace no transfiere automáticamente sus proyectos al usuario que abandona.
- Eliminar una cuenta de usuario no debe implicar automáticamente eliminar el workspace ni sus proyectos.
- Los datos derivados (boards, geometría, costos calculados, reportes, SVG, DXF, Excel) siguen sin ser fuente primaria — esta decisión de ownership no altera esa regla ya establecida.

### Candidatos futuros de nomenclatura (no implementados)

Registrados en `53` y `54` únicamente como candidatos conceptuales para un futuro esquema técnico. No son tablas, columnas ni FKs reales; no se implementan en esta Skill ni en ningún documento leído hasta ahora:

- `workspaces`
- `workspace_members`
- `workspace_id`

**DISEÑO TÉCNICO AÚN PENDIENTE** — las decisiones 53 y 54 fijan el modelo conceptual y los roles mínimos, pero explícitamente NO determinan todavía:

- número definitivo de tablas (`workspaces`, `workspace_members` son candidatos de nomenclatura, no tablas implementadas);
- columnas exactas, PKs/FKs exactas, tipos SQL, enums, índices;
- permisos CRUD/capacidades exactas de cada rol (`owner`/`admin`/`member`) por tabla;
- cardinalidad de membresías más allá de "una o más" (ya confirmada conceptualmente);
- transferencia de ownership, invitaciones y aceptación de membresías, abandono/eliminación de workspace;
- ownership de catálogos compartidos (materiales, tapacantos, componentes maestros, cuando dejen de ser snapshots por proyecto);
- políticas RLS SQL definitivas basadas en membresía;
- funciones RPC, triggers, claims JWT o migraciones.

Ningún contenido de esta Skill debe leerse como si el diseño técnico ya estuviera decidido, ni el modelo de ownership individual (`owner_id = auth.uid()`, sección "RLS y ownership") como una opción todavía vigente para ProyCut — quedó superado por la decisión 53, no pendiente de confirmación. El antiguo esquema de 5 tablas de `45-SUPABASE-INTEGRATION-PLAN.md` (`projects`, `project_materials`, `project_edge_bands`, `project_parts`, `project_components`, con `owner_id` como único punto de ownership) **ya no puede convertirse directamente en una migración**: al introducir `workspace` y `workspace membership` como entidades propias del modelo (no como una columna suelta en `projects`), esas cinco tablas probablemente ya no son suficientes para representar el modelo completo, y ninguna de las dos nuevas entidades tiene todavía columnas, PK/FK ni RLS definidas. Cualquier tarea que intente escribir una migración real de `projects` (o tablas relacionadas con ownership) antes de que exista un diseño formal de `workspace` + membresía aprobado explícitamente por el usuario debe **detenerse** — ver "Condiciones para detenerse".

## ESQUEMA OBJETIVO — propuesta de fase 1, ownership superado por la decisión 53 (no implementada)

Fuente única: `45-SUPABASE-INTEGRATION-PLAN.md`, secciones 4–7, 16–17, 23. Este resumen no sustituye al plan; ante cualquier duda de tipo exacto, constraint o nombre de columna, confirmar contra el plan, no memorizar desde aquí.

**Aviso de vigencia:** las columnas y políticas de este resumen que usan `owner_id`/`auth.uid()` describen el patrón de propietario individual propuesto por el plan de fase 1. Ese modelo de ownership quedó **superado** por `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` y `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md`: los proyectos pertenecen a un workspace, no a un `owner_id` individual, y el acceso se resuelve por membresía (roles `owner`/`admin`/`member`). Este resumen se conserva como referencia histórica de la propuesta de fase 1 y como inventario de qué debe rediseñarse (relación de proyecto con workspace, entidad de membresía, RLS, índices dependientes de `owner_id`), **no como esquema listo para implementar ni como base directa de una migración** — ver "el antiguo esquema de 5 tablas... ya no puede convertirse directamente en una migración" arriba.

### Tablas (5 — propuesta de fase 1; ownership individual superado por la decisión 53, ver aviso arriba)

| Tabla | Rol | Clave primaria | FK principal |
|---|---|---|---|
| `projects` | Cabecera: metadatos, versión optimista, `cut_settings`/`pricing_settings` en `jsonb`, soft delete | `id uuid`, `gen_random_uuid()` | `owner_id uuid` NOT NULL → `auth.users(id)` *(superado, ver nota bajo la tabla)* |
| `project_materials` | Snapshot de materiales usados por el proyecto | `id uuid` | `project_id uuid` NOT NULL → `projects` |
| `project_edge_bands` | Snapshot de tapacantos usados por el proyecto | `id uuid` | `project_id uuid` NOT NULL → `projects` |
| `project_parts` | Filas de piezas capturadas (una fila = una fila del formulario, no expandida por cantidad) | `id uuid` | `project_id`, `material_id` NOT NULL → `project_materials`; `edge_band_id` NULL → `project_edge_bands` |
| `project_components` | Componentes agregados al proyecto | `id uuid` | `project_id uuid` NOT NULL → `projects` |

No se crean `companies`, clientes, roles, catálogos globales ni tablas de resultados en esta fase.

*La columna `owner_id` en la tabla anterior es el patrón que proponía `45-SUPABASE-INTEGRATION-PLAN.md` para ownership individual en la primera fase. Ese modelo quedó **superado** por `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md`: el ownership real es por workspace/membresía, no por `owner_id` individual — no un contrato a implementar (ver "DECISIÓN CONFIRMADA DE OWNERSHIP Y DISEÑO TÉCNICO PENDIENTE" arriba).*

### Relaciones, unicidad y restricciones clave

- Todas las claves primarias son `uuid`. Todas las tablas hijas tienen `project_id` NOT NULL con índice.
- `projects` tiene índice `(owner_id, updated_at desc)` filtrado por `deleted_at is null` — índice dependiente de `owner_id`, superado por la decisión 53; debe rediseñarse para el contexto de workspace/membresía.
- `project_materials`, `project_parts`, `project_edge_bands`, `project_components` son únicas por `(project_id, position)` — el orden es significativo (orden de captura en el DOM), no un ID incidental.
- Las referencias entre tablas hijas (`project_parts.material_id`/`edge_band_id`) deben quedar confinadas al mismo `project_id`, mediante FK compuesta o validación transaccional dentro de la RPC — nunca solo por convención del cliente.
- Cantidades, dimensiones y precios llevan restricciones de dominio (`> 0`, `>= 0` según el campo) — el detalle exacto de cada constraint vive en el plan, sección 5; no se repite completo aquí para no crear una segunda fuente desincronizable.

### Snapshots, no catálogo compartido

- `project_materials`/`project_edge_bands`/`project_components` son **copias** pertenecientes al proyecto, no filas de un catálogo global compartido — no existe todavía ningún catálogo remoto.
- `local_catalog_id`/`sku` son trazabilidad hacia el catálogo local del navegador, **no** identidad remota autoritativa — nunca tratarlos como FK a una tabla de catálogo que no existe.
- Nombre, dimensiones y precio del snapshot se conservan aunque el catálogo local del usuario cambie después de guardar — es la única forma de que una carga futura reproduzca el mismo costeo, incluso si el precio del catálogo local ya cambió.

### RLS y ownership — propuesta de fase 1, superada por la decisión 53

El patrón siguiente es **el que proponía `45-SUPABASE-INTEGRATION-PLAN.md` para ownership individual en la primera fase**. La decisión 53 confirma que el ownership es por **workspace/membresía**, no por `owner_id` individual — este patrón queda **superado** y no debe usarse como base de una política RLS real. Se conserva aquí únicamente como referencia de lo que debe reemplazarse: la RLS futura deberá comprobar **membresía activa al workspace propietario del proyecto**, en vez de comparar `owner_id = auth.uid()`.

- `projects`: el patrón superado era `select/insert/update/delete` solo si `owner_id = auth.uid()`; `insert` exigiría que el valor coincida con el usuario autenticado. La política real deberá comprobar membresía activa al workspace propietario.
- Tablas hijas: el mismo patrón superado condicionaba el acceso a que el proyecto padre activo tuviera `owner_id = auth.uid()`; debe rediseñarse en los mismos términos que la cabecera.
- `anon` no tendría ninguna política de acceso a datos de proyecto — esto es un principio de seguridad general (mínimo privilegio, `04-AI-RULES.md` sección 24), válido con cualquier modelo de ownership, no específico del patrón `owner_id`.
- Cualquiera que sea la forma final del esquema de workspace/membresía, las políticas nunca deben confiar en un identificador enviado por la UI para autorizar — siempre debe derivarse de `auth.uid()`/la sesión autenticada en el propio predicado (ver Skill pública `supabase`, checklist de seguridad, sobre `TO authenticated` + predicado de ownership, y sobre `WITH CHECK` obligatorio en `UPDATE`).
- `deleted_at` se filtraría en listados y cargas normales (soft delete; borrado físico solo dentro del reemplazo transaccional de hijos) — mecánica independiente del modelo de ownership.
- Alcance confirmado: aislamiento por **workspace**, con acceso mediante **membresía** — ya no es propietario individual (decisión 53, ver "Tensión entre documentos canónicos" abajo, resuelta a nivel conceptual; el diseño técnico exacto de la RLS sigue pendiente).

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
- La propuesta de fase 1 diseñaba el esquema compatible con Auth mediante el patrón `owner_id uuid → auth.users(id)` — patrón **superado por la decisión 53**. El esquema real deberá vincular el proyecto a su workspace, y Auth deberá validarse mediante membresía activa a ese workspace, no mediante ownership directo. Auth en sí se implementaría en una fase posterior separada (plan, sección 26, fase 7).
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

Estos campos **no existen hoy** en el código (confirmado por `proycut-project-model` mediante `grep` sin resultados) ni como tablas/columnas implementadas, aunque aparezcan mencionados como necesidad futura en `07-DATABASE.md`, `44-CURRENT-ARCHITECTURE-INVENTORY.md` o como candidatos de nomenclatura en `53-PROYCUT-OWNERSHIP-DECISION.md`/`54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md`:

- nombre de proyecto (como concepto de negocio distinto del `name` de cabecera ya incluido en el plan);
- cliente / `client_id`;
- `workspace` / `workspaces` / `workspace_members` / `workspace_id` — término canónico ya confirmado por las decisiones 53/54 para el modelo de ownership y membresía, pero **sin tabla, columna ni FK implementada**; son candidatos de nomenclatura, no esquema real;
- `company_id` / `organization_id` — nomenclatura descartada por la decisión 53 en favor de `workspace`; no reintroducir como nombre de columna real;
- permisos/capacidades exactas de `owner`/`admin`/`member` por tabla — los roles están confirmados conceptualmente por `54`, pero sus capacidades CRUD exactas no están implementadas ni tienen SQL;
- `user_id` como concepto distinto de la identidad de Auth (invitaciones, equipos dentro de un workspace).

Cualquier tarea que necesite alguno de estos campos debe tratarlo como **diseño técnico pendiente de definición formal**, no como algo ya decidido como esquema real — ver "DECISIÓN CONFIRMADA DE OWNERSHIP Y DISEÑO TÉCNICO PENDIENTE" arriba.

## Tensión entre documentos canónicos — resuelta a nivel conceptual por las decisiones 53 y 54

`44-CURRENT-ARCHITECTURE-INVENTORY.md` mencionaba `company_id`/"compañía o contexto mínimo", y `45-SUPABASE-INTEGRATION-PLAN.md` proponía `owner_id` para propietario individual: dos nomenclaturas distintas de ownership, ninguna decidida formalmente. `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` resuelve esa ambigüedad: el término canónico interno es **`workspace`**, y el ownership del proyecto es por workspace/membresía — ni `owner_id` individual ni un `company_id` implícito. `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` formaliza el modelo conceptual resultante (Auth User → Workspace Membership → Workspace → Project), confirma los roles mínimos `owner`/`admin`/`member` y sus invariantes, sin reabrir la decisión de `53`. Esta Skill trata `53` y `54` como las decisiones de ownership/membresía vigentes; `45-SUPABASE-INTEGRATION-PLAN.md` sigue siendo la referencia más detallada para columnas/constraints no relacionadas con ownership, y `44` conserva su descripción del monolito actual, ya alineada con `workspace` en sus secciones de persistencia.

Lo que sigue sin decidirse (ver "DISEÑO TÉCNICO AÚN PENDIENTE" arriba) es el esquema SQL exacto de `workspace`/`workspace_members`/`workspace_id`: número de tablas, columnas, tipos, PK/FK, enums, índices, permisos exactos por rol y RLS. No inventar ese esquema en esta Skill ni en ninguna tarea que la invoque; confirmar con el usuario antes de fijarlo en una migración real.

## Prohibiciones

- No diseñar SQL real, ni escribir DDL ejecutable, dentro de esta Skill o de una tarea que solo la invoque.
- No crear migraciones en `supabase/migrations/`.
- No ejecutar `supabase init` ni ningún comando de CLI de Supabase.
- No modificar `src/` (ningún archivo bajo `src/scripts/`).
- No modificar `index.html`.
- No modificar `CLAUDE.md` ni `AGENTS.md`.
- No hacer commit ni push.
- No crear scripts (de shell, Node, SQL suelto, etc.).
- No crear tablas fuera de las propuestas de fase 1 ni fijar como definitiva ninguna columna de ownership/tenant (`owner_id`, `company_id`, `organization_id`, `workspace_id`, `user_id` distinto de la identidad de Auth) sin que exista un diseño formal de `workspace`/membresía aprobado explícitamente por el usuario — ver "DECISIÓN CONFIRMADA DE OWNERSHIP Y DISEÑO TÉCNICO PENDIENTE".
- No escribir ni proponer una migración real de `projects` (o tablas relacionadas) usando `owner_id = auth.uid()` como ownership del proyecto — ese patrón contradice la decisión 53 y no es una alternativa válida "mientras se decide".
- No omitir RLS "temporalmente" para simplificar una prueba local.
- No implementar guardado como varias llamadas separadas del cliente en vez de la función RPC transaccional.
- No mezclar este esquema mínimo con el modelo objetivo completo de `07-DATABASE.md` como si ya fueran el mismo diseño.

## Condiciones para detenerse y pedir decisión explícita

- **Ownership:** el modelo de ownership YA está confirmado (workspace/membresía, `53-PROYCUT-OWNERSHIP-DECISION.md` y `54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md`) — no volver a pedir esa confirmación al usuario. Sí debe detenerse cualquier tarea que use `owner_id = auth.uid()` como ownership real del proyecto, o que intente fijar una columna/tabla de ownership en una migración real antes de que el esquema de `workspace`/membresía esté formalmente diseñado y aprobado.
- **Migración antes de esquema formal:** cualquier intento de escribir, aplicar o aprobar una migración SQL real de `projects` (o tablas relacionadas con ownership) antes de que exista un diseño formal de `workspace` + membresía (tablas, columnas, roles, RLS) aprobado explícitamente por el usuario — detenerse de inmediato, sin excepciones, aunque la tarea solo pida "adaptar" el esquema de 5 tablas de la propuesta de fase 1.
- **Diseño de SQL de workspace/membresía sin decisiones previas resueltas:** cualquier tarea que intente diseñar SQL (tablas, columnas, RLS, RPC, triggers) para `workspace`/`workspace_members` sin haber resuelto explícitamente primero, con el usuario, cada una de estas decisiones pendientes de `54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` — detenerse de inmediato si falta cualquiera de ellas:
  - ownership de catálogos (materiales, tapacantos, componentes maestros compartidos);
  - permisos detallados de `owner`/`admin`/`member` (capacidades CRUD exactas por tabla, gestión de miembros, configuración sensible);
  - transferencia de ownership (cómo se transfiere el rol `owner` a otro miembro);
  - invitaciones y aceptación de membresías;
  - abandono/eliminación de workspace (qué ocurre con proyectos, membresías y datos asociados);
  - RLS definitiva (forma exacta de las políticas que validan membresía activa).
- **Usuario vs. organización:** ya resuelto a nivel conceptual — el término canónico es `workspace`, no `company_id`/`organization_id` (ver "Tensión entre documentos canónicos" arriba). Cualquier tarea que reintroduzca `company_id`/`organization_id` como nombre de columna real, o que fije roles/equipos concretos dentro de un workspace, debe detenerse: esos detalles siguen pendientes de diseño técnico.
- **IDs:** cualquier ambigüedad entre UUID remoto, `local_catalog_id`, SKU, nombre o `source_row_id` como identidad — confirmar cuál es la identidad autoritativa antes de diseñar una FK.
- **Snapshots:** duda sobre si un dato nuevo debe guardarse como snapshot del proyecto o como referencia a un catálogo (que todavía no existe como tabla remota) — no asumir, preguntar.
- **Borrado:** cualquier propuesta de borrado físico fuera del reemplazo transaccional de hijos ya descrito — el plan solo aprueba soft delete (`deleted_at`) para la cabecera.
- **Versionado:** cualquier cambio a la semántica de `version` (bloqueo optimista) o `schema_version` (versión del DTO) — son conceptos distintos, no fusionarlos ni cambiarlos sin confirmar impacto.
- **Datos opcionales:** duda sobre si un campo debe ser NOT NULL u opcional (por ejemplo, `edge_band_id` cuando ningún lado tiene tapacanto) — confirmar contra el plan o preguntar, no asumir NULL por conveniencia.
- **Políticas RLS:** cualquier política que use `owner_id = auth.uid()` como predicado de ownership del proyecto — ese patrón está superado por la decisión 53; la RLS real debe validar membresía activa al workspace propietario, y su forma exacta sigue pendiente de diseño. También detenerse ante cualquier política que otorgue acceso a `anon`, o ante cualquier RLS aplicada "para probar más fácil" sin ese diseño.
- La tarea pide crear o aplicar una migración real, ejecutar `supabase init`, o cualquier acción marcada como prohibida arriba — confirmar autorización explícita de salir de la fase de documentación antes de continuar.
