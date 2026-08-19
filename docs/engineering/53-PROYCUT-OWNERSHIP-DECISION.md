# 53 — Decisión de ownership de proyectos: workspace/organización, no usuario individual

## Estado

Decisión confirmada por el usuario. Pendiente de traducción a nomenclatura SQL, diseño de tablas y RLS.

## Versión

1.0

## Última actualización

2026-08-18

## Propósito

Registrar, antes de tocar el plan de integración de Supabase o crear migraciones, una decisión de producto ya tomada: la propiedad (ownership) de un proyecto en ProyCut no será un usuario individual, sino un workspace/organización al que ese usuario pertenece. Este documento no diseña SQL, no define nombres de columnas ni tablas definitivas y no autoriza ningún cambio de código o esquema. Es un registro de decisión que condicionará documentos y migraciones futuras.

## Decisión confirmada

ProyCut adopta la **opción B**: los proyectos pertenecen a una organización/workspace, no directamente a un usuario individual. Esto aplica incluso para un usuario que trabaja solo: ese usuario tendrá su propio workspace, y el proyecto pertenecerá a ese workspace, no al usuario como tal.

Puntos confirmados:

1. Un proyecto pertenece a un workspace/organización.
2. Un usuario pertenece a uno o más workspaces mediante una membresía.
3. Un workspace puede tener un solo usuario inicialmente (caso individual/taller pequeño).
4. El proyecto no debe depender directamente de `owner_id = auth.uid()` como modelo definitivo.
5. Auth identifica usuarios, pero la autorización de acceso a proyectos debe basarse en membresía al workspace, no en identidad directa del usuario.
6. La RLS futura debe validar que el usuario autenticado tenga una membresía activa en el workspace propietario del proyecto, no que el usuario sea directamente el propietario.
7. Equipos, roles e invitaciones pueden incorporarse después sin cambiar el ownership fundamental del proyecto (el proyecto ya pertenece a un workspace desde el inicio; agregar colaboradores es una extensión de membresía, no un cambio de propietario).
8. Billing/planes deberán poder asociarse en el futuro al workspace, no obligatoriamente a un usuario individual.
9. El modelo debe soportar sin cambiar la propiedad fundamental del proyecto: usuario individual, taller pequeño y empresa con varios trabajadores.
10. Los datos derivados siguen sin ser fuente primaria: boards, geometría, costos calculados, reportes, SVG, DXF y Excel se recalculan. Esta decisión de ownership no altera esa regla ya establecida.

## Motivación

Modelar el ownership como `projects.owner_id = auth.uid()` desde el inicio obligaría a una migración de ruptura en cuanto apareciera el primer caso de colaboración (taller con dos personas, empresa con varios trabajadores). Modelar el ownership como pertenencia a un workspace desde el primer proyecto evita ese cambio de forma posterior: el caso de "un solo usuario" es simplemente un workspace con una membresía, no un modelo distinto que deba migrarse después.

## Decisión técnica confirmada: nombre canónico

El nombre canónico interno de arquitectura y modelo de datos será **`workspace`**. Esta decisión reemplaza la ambigüedad anterior entre `workspace`, `organization` y `company`, y queda registrada como sigue:

1. `workspace` es el contenedor propietario de proyectos.
2. Un usuario accede a uno o más workspaces mediante membresías.
3. Un usuario individual tendrá su propio workspace.
4. Un taller pequeño compartirá un workspace entre varios miembros.
5. Una empresa también operará dentro de un workspace.
6. La UI podrá mostrar en el futuro términos como "Empresa", "Taller" o "Espacio de trabajo" según contexto, pero el término canónico interno seguirá siendo `workspace`.
7. El modelo de proyecto futuro deberá apuntar al workspace, no directamente al usuario.
8. Auth identifica usuarios; autorización futura valida membresía al workspace.
9. Billing/planes futuros deben poder asociarse al workspace.
10. Esta decisión reemplaza la ambigüedad anterior entre `workspace`, `organization` y `company`.

### Candidatos futuros de nomenclatura (no implementados)

Los siguientes nombres se registran únicamente como candidatos de nomenclatura técnica para un cambio posterior. No son tablas, columnas, FKs ni SQL reales; no se implementan en este documento:

- `workspaces`
- `workspace_members`
- `workspace_id`

## Consecuencias arquitectónicas

Esta decisión no se implementa todavía, pero obliga a revisar los siguientes artefactos existentes antes de avanzar con esquema o migraciones, porque hoy asumen un modelo de propietario individual o lo mezclan de forma inconsistente con una noción de compañía:

- **`docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md`**: la sección 13 ("Datos a persistir primero") ya menciona `company_id` explícito como parte del proyecto, y la sección 15 (contrato de persistencia) usa `companyId` como parámetro en `guardarProyecto`, `cargarProyecto`, etc. Esto es compatible en espíritu con la decisión de workspace, pero usa nomenclatura de "compañía" sin que exista todavía una decisión de nombre canónico, y no describe membresías ni RLS por membresía.
- **`docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md`**: este documento propone explícitamente un modelo de propietario individual (`projects.owner_id` con FK a `auth.users(id)`, sección 5) y declara "El alcance es de propietario individual. No incluye multiempresa, equipos ni roles avanzados" (Decisiones rectoras) y RLS basada en `owner_id = auth.uid()` (sección 16). Esta propuesta de fase 1 queda desactualizada frente a la decisión aquí registrada y deberá revisarse antes de aprobar cualquier migración basada en ella.
- **`proycut-supabase-schema`** (skill en `.agents/skills/proycut-supabase-schema`, documentada en `docs/engineering/52-PROYCUT-SUPABASE-SCHEMA-SKILL-REPORT.md`): si esta skill codifica o asume un esquema de propietario individual, deberá revisarse para alinearse con el modelo de workspace/membresía antes de usarse para generar o validar esquema real.

Ningún archivo de estos tres se modifica en este cambio. Se registra aquí como trabajo pendiente explícito, a resolver en un cambio posterior y aislado.

## Decisiones pendientes

Las siguientes decisiones técnicas quedan explícitamente **no tomadas** por este documento y deberán resolverse en un cambio posterior, antes de escribir SQL o migraciones:

- **Cardinalidad inicial de membresías**: si un usuario puede pertenecer a varios workspaces desde el primer lanzamiento o si se restringe a uno por simplicidad inicial.
- **Roles mínimos**: qué roles existen dentro de un workspace (p. ej. owner/admin/member) y cuáles son obligatorios desde la primera migración.
- **Ownership de catálogos**: si materiales, tapacantos y componentes maestros (cuando dejen de ser snapshots por proyecto) pertenecen al workspace o a otra entidad.
- **Billing por workspace**: cómo se asocia un plan/suscripción a un workspace, y qué pasa con el billing cuando hay varios miembros.
- **Comportamiento al eliminar o abandonar un workspace**: qué ocurre con los proyectos, membresías y datos asociados cuando se elimina un workspace o un usuario lo abandona.
- **RLS definitiva**: la forma exacta de las políticas que validan membresía activa (tabla de membresías, funciones auxiliares, manejo de roles) en vez de comparación directa contra `owner_id`.

## Referencias

- [[44-CURRENT-ARCHITECTURE-INVENTORY]] — inventario de arquitectura actual, pendiente de revisión por esta decisión.
- [[45-SUPABASE-INTEGRATION-PLAN]] — plan de integración de Supabase, pendiente de revisión por esta decisión.
- [[52-PROYCUT-SUPABASE-SCHEMA-SKILL-REPORT]] — reporte de la skill de esquema Supabase, pendiente de revisión por esta decisión.
