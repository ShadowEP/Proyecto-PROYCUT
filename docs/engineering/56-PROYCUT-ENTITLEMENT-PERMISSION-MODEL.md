# 56 — Modelo conceptual de Entitlements y Permisos

## Estado

Modelo conceptual confirmado. Pendiente de traducción a diseño técnico.

## Versión

1.0

## Última actualización

2026-08-19

## Propósito

Crear el modelo conceptual que conecta suscripciones, capacidades del producto, tipos de workspace, roles internos y acceso conceptual a funcionalidades. Este documento es la capa conceptual entre el modelo de negocio (`docs/engineering/55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL.md`) y una futura arquitectura técnica. No se convierte todavía en diseño de implementación.

Este documento **no define**:

- tablas;
- columnas;
- SQL;
- RLS;
- políticas técnicas;
- funciones backend;
- RPC;
- triggers;
- Stripe;
- billing técnico.

## Depende de

- `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` — decisión de ownership por workspace, no reabierta aquí.
- `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` — modelo conceptual de workspace y membresías, no reabierto aquí.
- `docs/engineering/55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL.md` — modelo de negocio, suscripciones y capacidades, fuente de la matriz comercial; no se repite aquí, solo se referencia.
- `docs/engineering/52-PROYCUT-SUPABASE-SCHEMA-SKILL-REPORT.md` — estado del diseño técnico pendiente del esquema Supabase.

## Decisiones ya confirmadas — no se reabren en este documento

1. El término canónico de contenedor de ownership es `workspace`.
2. Cada proyecto pertenece exactamente a un workspace.
3. Roles internos mínimos de membresía: `owner`, `admin`, `member`.
4. `customer` no es un rol del workspace ni pertenece a `Workspace Membership`; es una relación comercial externa.
5. Un plan comercial (`Subscription Plan`) se traduce conceptualmente en capacidades (`Capabilities`).
6. Personal y Business son dos modelos de producto distintos; Business opera en dos modos (Workshop y Store) sobre el mismo núcleo ProyCut.

## 1. Principio general

ProyCut separa conceptualmente:

**Subscription Plan**

de

**Feature Access**

Un plan comercial no debe contener lógica directamente. El plan define qué capacidades están disponibles; no define por sí mismo quién puede usarlas ni cómo se aplican en cada contexto.

Modelo conceptual:

```text
Subscription Plan
        |
        define
        |
        v
   Capabilities
```

Ejemplo: Plan Personal 2 puede habilitar optimización, tapacantos, cotizador, exportaciones y funciones de producción (ver `55` para la matriz completa por plan).

Este documento **no define** cómo se almacenan o validan esas capacidades técnicamente. Esa traducción queda pendiente, tal como ya lo señala `docs/engineering/52-PROYCUT-SUPABASE-SCHEMA-SKILL-REPORT.md` para el esquema Supabase en general.

## 2. Modelo conceptual general

Subscription define las capacidades contratadas por el workspace. Workspace define el contexto donde existen esas capacidades. Membership Role define qué usuario puede utilizar o administrar esas capacidades. Feature Access es la combinación conceptual entre plan contratado, tipo de workspace y rol del usuario.

Representación conceptual:

```text
Subscription
      |
Capabilities
      |
  Workspace
      |
Membership Role
      |
Feature Access
```

Este documento no define permisos exactos: describe únicamente las dimensiones que, combinadas, determinan el acceso conceptual a una función.

## 3. Tipos de suscripción

La matriz comercial completa vive en `docs/engineering/55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL.md`; esta sección solo resume su relación con el modelo de entitlements, sin repetir precios ni límites exactos.

### Personal

Características:

- pertenece a Workspace Personal;
- normalmente corresponde a un usuario individual;
- sus capacidades dependen del plan contratado.

Planes conceptuales:

- **Plan Gratis:** optimización básica.
- **Plan Personal 1:** diseño, tapacantos, cotización, gestión básica.
- **Plan Personal 2:** funciones orientadas a producción.
- **Plan Personal 3:** funciones avanzadas, incluyendo modelado 3D.

La definición completa (precios, límites de proyectos, lista exacta de capacidades por plan) permanece en `55`.

### Business

Características:

- pertenece a Workspace Business;
- puede tener múltiples usuarios;
- puede tener recursos compartidos;
- puede manejar catálogos propios.

Los niveles Business futuros pueden depender de:

- cantidad de usuarios;
- volumen operativo;
- funciones avanzadas;
- capacidad comercial.

No se definen precios en este documento.

## 4. Tipos de workspace

### Workspace Personal

Contexto:

- usuario individual;
- proyectos personales;
- capacidades según suscripción.

### Workspace Business Workshop

Contexto:

- talleres;
- fábricas;
- producción interna.

Orientado a:

- fabricación;
- seguimiento operativo;
- documentación técnica.

### Workspace Business Store

Contexto:

- madererías;
- centros de corte;
- venta de materiales;
- servicio a clientes.

Orientado a:

- catálogo comercial;
- cotizaciones;
- clientes;
- pedidos;
- flujo comercial.

Workshop y Store no son aplicaciones diferentes. Son modos de operación del mismo núcleo ProyCut.

## 5. Roles y capacidades

Se usan los roles ya confirmados en `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md`:

- `owner`
- `admin`
- `member`

Los roles **no** definen qué plan tiene contratado el workspace. El plan define las capacidades disponibles; el rol define el nivel conceptual de interacción con esas capacidades.

**OWNER:**

- responsable principal del workspace;
- administra configuración sensible;
- administra membresías.

**ADMIN:**

- administra la operación del workspace;
- gestiona actividades operativas según las capacidades disponibles.

**MEMBER:**

- trabaja con proyectos;
- utiliza recursos permitidos;
- no administra configuración sensible por defecto.

Este documento no define permisos CRUD.

## 6. Relación entre plan y rol

El acceso conceptual depende de dos dimensiones:

1. Qué capacidades tiene contratado el Workspace (Subscription → Capabilities).
2. Qué rol tiene el usuario dentro del Workspace (Membership Role).

Ejemplo — Workspace Business con capacidad DXF habilitada:

- **Owner:** puede administrar y utilizar la capacidad.
- **Admin:** puede operar la capacidad según permisos futuros.
- **Member:** puede utilizar la capacidad dentro de los límites definidos.

Esto es conceptual. No define políticas técnicas ni predicados de autorización.

## 7. Customer

`customer` **no** pertenece a `Workspace Membership`.

`customer` **no** es un rol interno.

`customer` es una relación comercial externa.

`customer` puede tener capacidades futuras como:

- recibir cotizaciones;
- aprobar pedidos;
- consultar documentos propios.

`customer` **no** tiene acceso a:

- administración;
- configuración del workspace;
- recursos internos;
- miembros internos.

Este modelo se mantiene alineado con `docs/engineering/55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL.md` (secciones "Relaciones comerciales externas" y "Modelo de proyectos en Business Store"); no se reabre ni se redefine aquí.

## 8. Capacidades futuras

Las capacidades son conceptos de producto, no tablas ni nombres técnicos.

Ejemplos:

- optimización;
- tapacantos;
- cotizador;
- DXF;
- PDF;
- etiquetas;
- fichas técnicas;
- 3D;
- IA futura;
- integraciones futuras.

## 9. Decisiones pendientes

Todavía queda pendiente definir:

- matriz exacta de capacidades por plan;
- permisos detallados de owner/admin/member;
- capacidades exclusivas de Business;
- límites cuantitativos por plan;
- modelo técnico de entitlements;
- reglas futuras para Customer;
- integración futura de billing;
- promociones y cambios de plan.

## 10. Referencias

- [[53-PROYCUT-OWNERSHIP-DECISION]]
- [[54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL]]
- [[55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL]]
