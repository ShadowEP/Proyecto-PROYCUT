# 57 — Modelo conceptual de dominio ProyCut

## Estado

Modelo conceptual confirmado. Pendiente de traducción a arquitectura técnica, esquema SQL y APIs.

## Versión

1.0

## Última actualización

2026-08-19

## Depende de

- `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` — decisión de ownership por workspace, no reabierta aquí.
- `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` — modelo conceptual de workspace y membresías, no reabierto aquí.
- `docs/engineering/55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL.md` — modelo de negocio, suscripciones y capacidades, no reabierto aquí.
- `docs/engineering/56-PROYCUT-ENTITLEMENT-PERMISSION-MODEL.md` — capa conceptual entre negocio y arquitectura técnica, no reabierta aquí.

Este documento es el puente entre esos cuatro documentos y una futura arquitectura técnica: consolida sus entidades y relaciones en un único modelo de dominio, sin reabrir ninguna de sus decisiones.

Este documento **no define**:

- tablas SQL;
- columnas;
- PK/FK;
- tipos SQL;
- RLS;
- RPC;
- triggers;
- Stripe;
- APIs técnicas.

## 1. Objetivo del documento

ProyCut evoluciona desde un optimizador de cortes hacia una plataforma completa de:

- diseño;
- optimización;
- cotización;
- producción;
- gestión comercial.

Este documento formaliza el modelo conceptual de dominio que soporta esa evolución: qué entidades existen dentro del producto, qué relación tienen entre ellas, qué datos pertenecen al Workspace, qué datos pertenecen al Project, qué datos son privados, qué datos son compartidos, qué datos son fuente primaria y qué datos son derivados.

## 2. Principio fundamental

El Workspace es el contexto principal del negocio.

Modelo:

```text
Auth User
   |
Workspace Membership
   |
Workspace
   |
Resources and Operations
```

El usuario no es propietario directo de proyectos. Este principio ya está confirmado en `53` y `54`; este documento no lo reabre, solo lo extiende hacia el resto de entidades de dominio.

## 3. Modelo general de dominio

```text
Auth User
   |
Workspace Membership
   |
Workspace
   |
   +-- Projects
   +-- Catalogs
   +-- Customers
   +-- Quotes
   +-- Orders
   +-- Production
   +-- External Integrations
```

El Optimizer Engine es un servicio central, no un contenedor de ownership:

```text
Project Data
   |
Optimizer Engine
   |
Optimization Result
   |
Production Documents
```

## 4. Workspace

### Workspace Personal

Pertenece a un usuario individual.

Puede contener:

- proyectos personales;
- configuraciones propias;
- catálogos personales futuros.

### Workspace Business

Pertenece a una empresa.

Puede contener:

- miembros;
- proyectos;
- catálogos;
- clientes;
- cotizaciones;
- pedidos;
- producción.

Un Workspace Business puede operar como Workshop, Store, o ambos simultáneamente. No son aplicaciones diferentes.

Ejemplo: una empresa que vende materiales, realiza cortes y fabrica muebles opera todo eso dentro del mismo Workspace Business.

## 5. Workspace Membership

Se usan las decisiones ya confirmadas en `54`.

Roles internos:

- `owner`;
- `admin`;
- `member`.

`Customer` **no** es miembro. `Customer` es una relación comercial externa.

## 6. Project

Un proyecto pertenece exactamente a un Workspace.

Nunca pertenece directamente a:

- Auth User;
- Member.

El creador puede ser un usuario, pero el ownership conceptual pertenece al Workspace.

Puede contener:

- piezas;
- componentes;
- materiales;
- optimizaciones;
- resultados;
- documentos;
- historial.

## 7. Privacidad de proyectos

En Business Workshop, los proyectos son privados por defecto para el miembro creador.

Ejemplo:

```text
Workspace Business
   |
Member Juan
   |
Proyecto Cocina Juan
```

Reglas:

- otros miembros no ven el proyecto automáticamente;
- owner/admin tampoco tienen acceso automático al contenido;
- el proyecto sigue perteneciendo al Workspace.

Futuro (no diseñado todavía): supervisor, permisos administrativos, colaboración controlada.

## 8. Catalogs

Los catálogos pertenecen al Workspace.

Ejemplos:

- tableros;
- materiales;
- tapacantos;
- componentes;
- precios.

En Business, los catálogos son compartidos.

- **Owner/Admin:** pueden administrar conceptualmente.
- **Member:** puede utilizar.

No se definen permisos técnicos.

## 9. Snapshot de proyecto

Diferencia entre catálogo actual y proyecto histórico:

```text
Catálogo actual:
MDF Blanco
Precio actual $50

Proyecto histórico:
MDF Blanco utilizado
Precio aplicado $45
```

El proyecto debe conservar su información histórica. Los cambios futuros del catálogo no deben modificar proyectos anteriores.

## 10. Customer

`Customer` es una relación comercial externa.

NO es:

- owner;
- admin;
- member.

Puede:

- consultar catálogo comercial publicado;
- recibir cotizaciones;
- aprobar pedidos futuros;
- consultar sus propios proyectos/documentos mediante capacidades futuras.

No puede:

- ver costos internos;
- ver márgenes;
- ver proveedores;
- administrar catálogos;
- administrar miembros;
- modificar configuración interna.

## 11. Quote

Cotización como entidad comercial.

Relación:

```text
Customer
   |
Quote
   |
Project
```

Debe conservar conceptualmente:

- precio ofrecido;
- materiales;
- condiciones;
- historial comercial.

## 12. Order

Flujo:

```text
Quote
   |
Approval
   |
Order
   |
Production
```

Una orden representa compromiso de fabricación.

## 13. Production

Dominio futuro. Incluye:

- órdenes de trabajo;
- listas de corte;
- etiquetas;
- seguimiento;
- control de calidad;
- entrega.

## 14. Diferencia Business Workshop vs. Business Store

**Business Workshop:**

- fabricación interna;
- proyectos internos;
- miembros productores.

**Business Store:**

- venta;
- clientes;
- cotizaciones;
- pedidos;
- servicio de corte.

Ambos usan Workspace Business.

## 15. External Integrations

Capa externa:

- Shopify;
- WooCommerce;
- ERP;
- CNC;
- otros sistemas.

Modelo:

```text
External System
   |
Integration Layer
   |
ProyCut
```

ProyCut mantiene el dominio principal.

## 16. Optimizer Engine

El optimizador es el núcleo técnico del producto. No es dueño de datos.

Recibe:

- piezas;
- materiales;
- restricciones.

Entrega:

- diagramas;
- resultados;
- datos derivados.

## 17. Datos fuente vs. derivados

**Fuente:**

- piezas;
- materiales;
- clientes;
- precios acordados;
- pedidos;
- configuraciones.

**Derivados:**

- diagramas;
- desperdicio calculado;
- SVG;
- DXF;
- reportes;
- etiquetas.

## 18. Limitaciones del documento

Este documento **no define**:

- SQL;
- tablas;
- arquitectura backend;
- APIs;
- billing técnico;
- integración Shopify;
- integración WooCommerce;
- RLS.

## Referencias

- [[53-PROYCUT-OWNERSHIP-DECISION]]
- [[54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL]]
- [[55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL]]
- [[56-PROYCUT-ENTITLEMENT-PERMISSION-MODEL]]
