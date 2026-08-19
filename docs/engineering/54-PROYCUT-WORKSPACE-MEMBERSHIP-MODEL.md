# 54 — Modelo conceptual de workspace y membresías

## Estado

Modelo conceptual confirmado por el usuario. Pendiente de traducción a nomenclatura SQL, diseño de tablas, columnas, PK/FK y RLS.

## Versión

1.0

## Última actualización

2026-08-18

## Propósito

Definir formalmente, antes de diseñar cualquier tabla o migración, el modelo conceptual de **workspace + membresías** que reemplazará el antiguo ownership directo por `owner_id` descrito en la propuesta de fase 1 de `docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md`. Este documento no diseña SQL, no define nombres de columnas ni tablas definitivas, no fija número de tablas, no autoriza ninguna migración ni cambio de código. Es la extensión conceptual directa de la decisión ya registrada en `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md`.

## Depende de

- `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` — decisión de ownership por workspace, no reabierta aquí.
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` — inventario de arquitectura actual, ya alineado con `workspace`.
- `docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md` — plan de integración, con el modelo de ownership de fase 1 marcado como superado.
- `docs/engineering/07-DATABASE.md` — modelo de datos objetivo a largo plazo, fuente de principios generales (aislamiento, campos comunes, versionado).
- `.agents/skills/proycut-supabase-schema/SKILL.md` — skill que protege el diseño futuro del esquema Supabase.

## Decisiones ya confirmadas — no se reabren en este documento

1. El término canónico es `workspace`.
2. Cada proyecto pertenece exactamente a un workspace.
3. Un usuario puede pertenecer a uno o más workspaces.
4. Usuario ↔ workspace se relacionan mediante membresías.
5. Incluso un usuario individual tiene un workspace propio.
6. Roles mínimos: `owner`, `admin`, `member`.
7. Auth identifica usuarios.
8. La autorización de acceso a proyectos depende de membresía al workspace.
9. Billing futuro debe poder asociarse al workspace.
10. El proyecto no pertenece directamente a `auth.uid()`.

## Modelo conceptual mínimo

### Auth User

- Identidad autenticada gestionada por Auth.
- No es propietario directo de ningún proyecto.
- Puede tener múltiples membresías, una por cada workspace al que pertenece.

### Workspace

- Contenedor de ownership.
- Posee proyectos.
- Agrupa miembros mediante membresías.
- Punto natural futuro para billing y recursos compartidos (catálogos, planes, configuración).

### Workspace Membership

- Relaciona un usuario con un workspace.
- Contiene conceptualmente el rol de ese usuario dentro de ese workspace.
- Roles confirmados: `owner`, `admin`, `member`.
- Permite una relación muchos-a-muchos entre usuarios y workspaces: un usuario puede tener varias membresías (una por workspace), y un workspace puede tener varias membresías (una por miembro).

### Project

- Pertenece exactamente a un workspace.
- Conserva su identidad propia (nombre, versión, configuración de corte/precios, etc., como ya describe `45-SUPABASE-INTEGRATION-PLAN.md` fuera del ámbito de ownership).
- No depende directamente del usuario autenticado; su ownership se resuelve siempre a través del workspace al que pertenece.

## Diagrama conceptual

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

Aclaración importante: la membresía conecta conceptualmente **User ↔ Workspace**. La flecha "membership" desde Auth User hacia Workspace Membership, y de ahí hacia Workspace, describe cómo un usuario alcanza un workspace a través de su membresía — el diagrama no implica que la membresía sea propietaria del workspace, ni que el workspace pertenezca a la membresía. El workspace es el contenedor de ownership; la membresía es únicamente el vínculo de acceso entre un usuario y ese workspace.

## Invariantes

- Todo proyecto debe pertenecer a exactamente un workspace.
- Todo acceso remoto a un proyecto debe derivarse de una membresía válida.
- Un usuario puede pertenecer a varios workspaces.
- Un workspace puede tener varios usuarios.
- Un workspace debe conservar al menos un owner.
- Admin no sustituye automáticamente al owner.
- Member no administra configuración sensible por defecto.
- Cambiar de usuario no cambia el ownership del proyecto.
- Abandonar un workspace no transfiere automáticamente sus proyectos al usuario que abandona.
- Eliminar una cuenta de usuario no debe implicar automáticamente eliminar el workspace ni sus proyectos.
- Los datos derivados (boards, geometría, costos calculados, reportes, SVG, DXF, Excel) siguen sin ser fuente primaria; esta decisión de ownership no altera esa regla ya establecida en `45-SUPABASE-INTEGRATION-PLAN.md` y `07-DATABASE.md`.

## Candidatos de nomenclatura (no implementados)

Los siguientes nombres se registran únicamente como candidatos conceptuales para un futuro esquema técnico. No son tablas, columnas, FKs ni SQL reales; no se implementan en este documento:

- `workspaces`
- `workspace_members`
- `workspace_id`

## Consecuencias para el futuro esquema Supabase

La propuesta de fase 1 de `45-SUPABASE-INTEGRATION-PLAN.md` (sección 4) proponía cinco tablas: `projects`, `project_materials`, `project_edge_bands`, `project_parts`, `project_components`, con `projects.owner_id` como único punto de ownership. Ese modelo de ownership ya quedó superado por `53-PROYCUT-OWNERSHIP-DECISION.md`.

Este documento agrega una consecuencia adicional sobre el conteo de tablas: al introducir el concepto de workspace y de membresía como entidades propias del modelo (no como una columna suelta en `projects`), la propuesta original de cinco tablas **probablemente ya no será suficiente** para representar el modelo completo — un modelo de workspace + membresías requiere, como mínimo, representar conceptualmente tanto el workspace en sí como la relación de membresía entre usuario y workspace, además de la cabecera de proyecto y sus tablas hijas ya descritas.

Esto **no fija todavía el número definitivo de tablas**, ni sus nombres, columnas, tipos, PK/FK, constraints, índices ni políticas RLS. Ese diseño técnico exacto queda pendiente y deberá resolverse en un cambio posterior y aislado, siguiendo las condiciones para detenerse ya descritas en la skill `proycut-supabase-schema`.

## Decisiones pendientes antes del esquema SQL

- Ownership de catálogos (materiales, tapacantos, componentes maestros compartidos, cuando dejen de ser snapshots por proyecto).
- Billing por workspace.
- Transferencia de ownership (cómo se transfiere el rol de owner a otro miembro).
- Invitaciones y aceptación de membresías.
- Comportamiento al abandonar un workspace.
- Eliminación de workspace.
- Permisos detallados de owner/admin/member (capacidades CRUD exactas, gestión de miembros, configuración sensible).
- RLS definitiva (forma exacta de las políticas que validan membresía activa).

## Dry runs conceptuales

1. **Usuario A crea un proyecto.**
   → El proyecto pertenece al workspace activo, no a Usuario A directamente.

2. **Usuario B entra al mismo workspace.**
   → Puede acceder según su membresía/rol; no cambia el ownership del proyecto.

3. **Usuario A pertenece a dos workspaces.**
   → Los proyectos permanecen aislados por workspace.

4. **Usuario A abandona un workspace.**
   → Los proyectos no se mueven automáticamente a su otro workspace.

5. **Un usuario individual usa ProyCut.**
   → Tiene un workspace de un solo miembro; no necesita un modelo de datos distinto.

## No decidido todavía

Explícitamente fuera de alcance de este documento:

- tipos SQL;
- UUID/FK concretas;
- constraints SQL;
- enums SQL;
- índices;
- políticas RLS SQL;
- funciones RPC;
- triggers;
- claims JWT personalizados;
- invitaciones exactas;
- transferencia exacta de owner;
- reglas de eliminación;
- billing concreto;
- ownership definitivo de catálogos.

## Referencias

- [[53-PROYCUT-OWNERSHIP-DECISION]] — decisión de ownership por workspace, base conceptual de este documento.
- [[44-CURRENT-ARCHITECTURE-INVENTORY]] — inventario de arquitectura actual, ya alineado con `workspace`.
- [[45-SUPABASE-INTEGRATION-PLAN]] — plan de integración de Supabase, con ownership de fase 1 superado.
- [[07-DATABASE]] — modelo de datos objetivo a largo plazo.
