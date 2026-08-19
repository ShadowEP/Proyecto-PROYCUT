# 55 — Modelo conceptual de negocio, suscripciones y capacidades

## Estado

Modelo conceptual confirmado por el usuario. Pendiente de traducción a nomenclatura SQL, diseño de tablas, billing técnico y RLS.

## Versión

1.4

## Última actualización

2026-08-19

## Propósito

Formalizar, antes de diseñar cualquier tabla, migración o integración de billing, el modelo de negocio de ProyCut: sus dos grandes modelos de producto (Personal y Business), los tipos de workspace, los roles y la relación con clientes externos, los planes de suscripción y las capacidades que cada plan habilita o bloquea. Este documento no diseña SQL, no define nombres de columnas ni tablas, no define permisos RLS, no define billing técnico (Stripe u otro proveedor) ni arquitectura de implementación. Es la extensión conceptual de negocio sobre el modelo de identidad y ownership ya confirmado en `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` y `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md`.

## Depende de

- `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` — decisión de ownership por workspace, no reabierta aquí.
- `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` — modelo conceptual de workspace y membresías, no reabierto aquí.
- `docs/engineering/52-PROYCUT-SUPABASE-SCHEMA-SKILL-REPORT.md` — estado del diseño técnico pendiente del esquema Supabase.
- `docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md` — plan de integración de Supabase, con el ownership de fase 1 marcado como superado por `53`.

## Decisiones ya confirmadas — no se reabren en este documento

1. El término canónico de contenedor de ownership es `workspace`.
2. Cada proyecto pertenece exactamente a un workspace.
3. Un usuario puede pertenecer a uno o más workspaces mediante membresías.
4. Auth identifica usuarios; la autorización de acceso a proyectos depende de membresía al workspace, no de identidad directa del usuario.
5. Roles mínimos de membresía: `owner`, `admin`, `member`.
6. El proyecto no depende directamente de `owner_id = auth.uid()`.

## 1. Identidad de producto

ProyCut evoluciona desde un origen de **optimización de cortes** hacia un producto de **diseño + cotización + producción + ecosistema empresarial**.

El producto tendrá dos grandes modelos:

1. **Personal**
2. **Business**

Ambos modelos comparten el mismo modelo de identidad y ownership ya confirmado en `53` y `54`: un Auth User puede pertenecer a uno o más workspaces.

```text
Auth User
  |
  +---- Workspace Personal
  |
  +---- Workspace Business
```

## 2. Tipos de workspace

### Workspace Personal

- Pertenece a un usuario.
- Proyectos privados.
- Suscripción individual.
- No comparte miembros.

### Workspace Business

Orientado a:

- talleres;
- fábricas;
- madererías;
- empresas con servicio de corte.

Características:

- pertenece a una organización empresarial;
- múltiples usuarios;
- catálogo propio;
- precios propios;
- clientes externos.

## 3. Tipos de operación Business

Un Workspace Business puede operar bajo dos modos de uso, según su orientación de negocio: **Business Workshop** y **Business Store**. Ambos son el mismo tipo de workspace (`Workspace Business`); lo que cambia es qué recursos administra y con quién se relaciona.

### Business Workshop

Orientado a:

- talleres;
- fábricas;
- producción interna;
- miembros internos;
- proyectos de fabricación.

Modelo conceptual:

```text
Workspace Business
  |
  Members
  |
  Projects
```

Los clientes externos no son parte central de este modo: los proyectos son de producción interna, operados por los miembros del workspace. Su presencia es opcional y depende de configuración futura — ver la sección 10 ("Diferencia entre Business Workshop y Business Store") para el contraste completo con Business Store, donde los clientes externos sí son parte central del negocio.

### Business Store

Orientado a:

- madererías;
- proveedores;
- centros de corte;
- servicio a clientes externos.

Modelo conceptual:

```text
Workspace Business
  |
  + Members
  + Customers
  + Catalogs
  + Projects
         |
         + Customer
```

Confirmado:

- el proyecto pertenece al workspace empresarial, igual que en Workshop;
- `Customer` no es propietario del proyecto; aparece únicamente como una asociación del proyecto, no como su contenedor.

Este modelo detalla, a nivel de tipos de operación Business, la misma decisión de ownership desarrollada en la sección 6 ("Modelo de proyectos en Business Store").

## 4. Roles de membresía del Workspace

Los roles internos del workspace son únicamente:

- `owner`
- `admin`
- `member`

### OWNER

- responsable principal del workspace;
- puede administrar configuración sensible;
- puede administrar membresías;
- debe existir al menos un owner.

### ADMIN

- administra la operación del workspace;
- puede administrar proyectos y recursos según permisos futuros;
- no sustituye automáticamente al owner.

### MEMBER

- trabaja con proyectos del workspace;
- utiliza recursos compartidos;
- no administra configuración sensible por defecto.

Esta definición es consistente con los roles mínimos ya confirmados en `53` y `54`; esta sección no introduce roles nuevos, solo formaliza su alcance conceptual dentro del modelo de negocio. Estos roles son exclusivamente internos: la membresía (`Workspace Membership`) es solo para usuarios internos del workspace, nunca para clientes externos — ver sección 5.

## 5. Relaciones comerciales externas

`customer` **no** es un rol del workspace.

`customer` **no** pertenece a Workspace Membership — no forma parte de la entidad conceptual `Workspace Membership` definida en `54`.

`customer` representa una **relación comercial externa** entre una empresa (Workspace Business) y su cliente.

`customer` puede tener cuenta gratuita.

`customer` puede, conceptualmente:

- recibir cotizaciones;
- aprobar pedidos;
- consultar sus propios proyectos;
- consultar documentos propios relacionados con sus pedidos.

`customer` puede consultar únicamente el **catálogo comercial** publicado por la empresa.

### Catálogo comercial vs. catálogo interno

**Catálogo comercial:**

- visible para clientes;
- utilizado para venta;
- contiene información publicada.

**Catálogo interno:**

- costos internos;
- márgenes;
- proveedores;
- configuración operativa;
- información estratégica del workspace.

`customer` **no** puede consultar:

- costos internos;
- márgenes;
- proveedores;
- catálogos internos;
- información estratégica del workspace.

`customer` **no** puede, además:

- ver otros clientes;
- administrar catálogos;
- administrar miembros;
- modificar configuración del workspace.

Se mantiene alineado con la decisión ya registrada en la sección 6 ("Modelo de proyectos en Business Store"):

```text
Workspace
  |
  Project
  |
  Customer
```

`customer` nunca es propietario ni contenedor del proyecto. No:

```text
Customer
  |
  Project
```

## 6. Modelo de proyectos en Business Store

Decisión confirmada: en un Business Store, el proyecto pertenece al workspace empresarial. El cliente solamente está asociado al proyecto, no es su contenedor.

Modelo conceptual correcto:

```text
Workspace Empresa
  |
  Project
  |
  Customer
```

Modelo conceptual **rechazado**:

```text
Customer
  |
  Project
```

**Motivo:** la empresa controla producción, precios, materiales, cotización y seguimiento. Si el proyecto perteneciera al cliente, la empresa perdería esa capacidad de control sobre su propio flujo de trabajo.

## 7. Planes de suscripción

### Plan Gratis

Precio: **$0**.

Objetivo: permitir probar el optimizador.

Incluye:

- creación de piezas;
- configuración de tableros;
- parámetros de corte;
- optimización;
- visualización del resultado.

No incluye:

- guardar proyectos;
- nube;
- tapacantos;
- componentes;
- cotizador;
- costos;
- exportaciones;
- producción;
- modelado 3D.

### Plan Personal 1

Precio provisional: **$49/mes**.

Objetivo: diseño, planificación y cotización.

Incluye:

- guardar proyectos;
- historial;
- tapacantos;
- componentes;
- materiales propios;
- costos de material;
- cotizador básico;
- clientes simples.

Límite confirmado: **10 proyectos**.

### Plan Personal 2

Precio provisional: **$79/mes**.

Incluye todo lo del Plan Personal 1, más:

- DXF;
- PDF;
- reportes de producción;
- fichas técnicas;
- etiquetas;
- formatos de exportación;
- documentación de taller.

Límite confirmado: **50 proyectos**.

### Plan Personal 3

Precio provisional: **$159/mes**.

Incluye todo lo anterior, además de:

- modelado 3D;
- funciones premium futuras.

Límite confirmado: **+100 proyectos**.

### Business

Los precios Business todavía no están definidos. Puede haber varios niveles Business futuros.

Todos los niveles Business tendrán:

- usuarios ilimitados;
- workspace empresarial;
- miembros;
- materiales propios;
- catálogo propio;
- precios propios.

## 8. Business Workshop

Orientado a talleres y fábricas.

Reglas:

- cada miembro puede tener máximo un proyecto activo guardado;
- al eliminarlo, puede crear otro;
- el historial/archivados no cuenta contra la cuota.

### Privacidad de proyectos

Los proyectos creados por miembros de Business Workshop pertenecen al miembro creador y no son visibles para otros miembros por defecto. La privacidad individual es la regla conceptual inicial.

Esto no cambia el ownership del proyecto: el proyecto sigue perteneciendo al workspace, no al miembro (ver `53` y `54`); es una regla de visibilidad por defecto, no de propiedad.

La empresa puede definir futuras reglas de colaboración o supervisión sobre estos proyectos.

Ver la sección 10 ("Diferencia entre Business Workshop y Business Store") para el contraste con Business Store, y la sección 11 ("Modelo de cuotas de proyectos") para el detalle de cómo esta regla se diferencia del modelo de cuotas de Workspace Personal y de Workspace Business Store.

## 9. Business Store

Orientado a madererías, venta de materiales y servicio de corte.

Características:

- clientes externos;
- catálogo empresarial;
- listas de precios;
- cotizaciones;
- pedidos futuros.

Ver la sección 10 ("Diferencia entre Business Workshop y Business Store") para el contraste con Business Workshop, y la sección 11 ("Modelo de cuotas de proyectos") — Business Store **no** utiliza la regla de un proyecto activo por miembro aplicable a Business Workshop.

## 10. Diferencia entre Business Workshop y Business Store

Aunque ambos utilizan Workspace Business, representan modelos operativos diferentes.

| Característica | Business Workshop | Business Store |
|---|---|---|
| Objetivo | fabricación interna | venta de materiales y servicio de corte |
| Usuarios | empleados internos | empleados comerciales/operativos |
| Clientes externos | opcionales | parte central del negocio |
| Proyectos | producción interna | proyectos asociados a clientes |
| Catálogos | producción | venta y precios comerciales |
| Cotizaciones | secundarias | función principal |
| Cuota principal | proyectos activos por miembro | volumen comercial |

No son dos aplicaciones diferentes. Son dos modos de operación sobre el mismo modelo ProyCut.

Modelo:

```text
ProyCut Core
+
Workspace Business
+
Capacidades habilitadas
```

Business Store representa principalmente un flujo comercial completo:

```text
Customer
  |
  Cotización
  |
  Aprobación
  |
  Pedido
  |
  Producción
  |
  Entrega
```

El objetivo principal de Business Store es administrar la relación comercial entre la empresa y sus clientes, desde la cotización hasta la entrega.

Business Workshop está enfocado en producción interna. Business Store está enfocado en venta, cotización y servicio a clientes.

Este flujo confirma que Business Workshop y Business Store no son dos aplicaciones diferentes: son dos modos de operación sobre el mismo núcleo ProyCut.

## 11. Modelo de cuotas de proyectos

La cuota de proyectos **no** funciona igual en todo el producto: depende del tipo de workspace y, dentro de Business, del modo de operación. Esta sección diferencia explícitamente el modelo de cuotas de Workspace Personal, Workspace Business Workshop y Workspace Business Store, para evitar tratarlos como una única regla genérica.

### Proyecto activo e historial (concepto general)

- **Proyecto activo**: proyecto operativo actual.
- **Historial**: versiones, documentos generados, archivos exportados, proyectos archivados y datos técnicos derivados.

El historial no consume cuota de proyectos activos, en ningún tipo de workspace.

### Workspace Personal

La cuota representa la **cantidad máxima de proyectos almacenados**.

- Plan Personal 1: **10 proyectos**.
- Plan Personal 2: **50 proyectos**.
- Plan Personal 3: **+100 proyectos**.

Los proyectos almacenados cuentan contra la cuota, independientemente de si están en edición activa o simplemente guardados.

### Workspace Business Workshop

La cuota representa **proyectos activos simultáneos por miembro**, no una cantidad total almacenada.

Regla confirmada: cada miembro puede tener un proyecto activo.

El historial no cuenta:

- versiones;
- documentos;
- archivos exportados;
- proyectos archivados.

Ejemplo:

```text
Member A

Proyecto activo:
Cocina Juan
```

Member A no puede crear otro proyecto activo hasta eliminar o cerrar el actual. Eliminar un proyecto activo permite crear otro. Esta regla ya estaba registrada en la sección 8 ("Business Workshop"); esta sección la desarrolla como parte del modelo de cuotas aplicable a todo el producto.

### Workspace Business Store

Business Store **no** utiliza la regla de un proyecto activo por miembro.

Business Store representa una operación comercial donde existen múltiples cotizaciones y pedidos simultáneos: limitar a un proyecto activo por miembro no corresponde a ese modelo de negocio.

Business Store no utilizará necesariamente la misma lógica de cuota que Business Workshop. La capacidad comercial puede depender de:

- cantidad de usuarios;
- volumen de cotizaciones;
- volumen de pedidos;
- almacenamiento;
- funciones avanzadas.

Business Store está orientado a capacidad operativa y comercial, no únicamente a cantidad de proyectos almacenados.

No se definen todavía:

- límites numéricos;
- precios;
- niveles definitivos Business.

Ejemplo conceptual de niveles futuros (sin precios ni límites técnicos):

- **Business Store Starter**: menor volumen comercial.
- **Business Store Pro**: mayor volumen.
- **Enterprise**: mayor capacidad.

Estos nombres son ejemplos conceptuales, no decisiones finales de naming ni de niveles Business.

## 12. Catálogos Business

Los catálogos (materiales, tapacantos, componentes, precios) son compartidos dentro del workspace.

Permisos conceptuales:

**Owner/Admin:**

- administrar materiales;
- administrar tapacantos;
- administrar componentes;
- administrar precios.

**Member:**

- utilizar catálogos.

## 13. Cambios de plan

Al bajar de plan:

- los datos se conservan;
- las funciones premium quedan bloqueadas (no se eliminan).

## 14. Billing conceptual

- **Personal:** la suscripción pertenece al Workspace Personal.
- **Business:** la suscripción pertenece al Workspace Business.
- En ningún caso la suscripción pertenece directamente al usuario individual (Auth User).

Esto es consistente con `53`, que ya establece que billing/planes futuros deben poder asociarse al workspace, no obligatoriamente a un usuario individual.

## 15. Capacidades como entitlements conceptuales

Los planes comerciales descritos en la sección 7 no se consumen directamente: se traducen conceptualmente en **capacidades** (entitlements). Un plan es, conceptualmente, un conjunto de capacidades habilitadas.

Modelo conceptual:

```text
Subscription Plan
        |
        Capabilities
```

Ejemplos de capacidades:

- optimización;
- tapacantos;
- cotizador;
- exportación DXF;
- PDF;
- etiquetas;
- 3D.

Cada capacidad de la lista anterior corresponde directamente a un ítem ya descrito como "incluye"/"no incluye" en los planes de la sección 7 (por ejemplo, "tapacantos" y "cotizador básico" en Plan Personal 1; "DXF", "PDF" y "etiquetas" en Plan Personal 2; "modelado 3D" en Plan Personal 3). Esta sección no agrega capacidades nuevas: solo nombra el mecanismo conceptual (plan → capacidades) mediante el cual un plan habilita o bloquea las funciones ya listadas.

Las capacidades son conceptos de producto, no tablas técnicas: describen qué funciones habilita un plan, no cómo se representan o validan en el esquema de datos.

Este documento no define:

- tablas de entitlements;
- SQL;
- permisos técnicos de aplicación de capacidades;
- billing;
- Stripe.

## 16. Futuras capacidades

Se registran únicamente como futuras, sin diseño ni compromiso de alcance:

- postprocesadores CNC;
- configuraciones por máquina;
- herramientas;
- velocidades de corte;
- IA;
- ERP;
- APIs;
- integraciones.

## 17. Limitaciones de este documento

Este documento **no define**:

- tablas;
- columnas;
- SQL;
- permisos RLS;
- billing técnico;
- Stripe;
- arquitectura de implementación.

## Decisiones pendientes

Las siguientes decisiones quedan explícitamente **no tomadas** por este documento y deberán resolverse en un cambio posterior, antes de escribir SQL, migraciones o integrar un proveedor de billing:

- Precios definitivos de los niveles Business.
- Número y naming exacto de los niveles Business Store futuros (Starter/Pro/Enterprise son ejemplos conceptuales, no una decisión de naming final).
- Modelo técnico y numérico de cuotas para Workspace Business Store (límites exactos de usuarios, volumen de proyectos, almacenamiento y funciones avanzadas por nivel).
- Modelo técnico de cuotas (cómo se cuenta y aplica el límite de proyectos por plan, en cada tipo de workspace).
- Modelo técnico de "proyecto activo guardado" en Business Workshop (qué distingue activo de archivado a nivel de datos).
- Relación técnica exacta entre `customer` y el workspace (tabla de clientes, invitación, cuenta gratuita de cliente).
- Configuración exacta de la presencia opcional de clientes externos en Business Workshop.
- Reglas futuras de colaboración o supervisión sobre proyectos privados en Business Workshop (más allá de la regla de privacidad por defecto al miembro creador, ya confirmada).
- Proveedor de billing y su integración técnica (Stripe u otro).
- Reglas de facturación al cambiar de plan (prorrateo, ciclo de cobro, downgrade inmediato vs. al final del ciclo).
- Permisos CRUD exactos por rol sobre catálogos, precios y proyectos (más allá de la distinción conceptual Owner/Admin vs. Member ya registrada aquí).
- RLS definitiva para capacidades y planes.
- Modelo técnico exacto de entitlements (cómo se representa "Subscription Plan → Capabilities" como dato, y cómo se valida en tiempo de ejecución).

## Referencias

- [[53-PROYCUT-OWNERSHIP-DECISION]] — decisión de ownership por workspace, base de este documento.
- [[54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL]] — modelo conceptual de workspace y membresías, base de este documento.
- [[52-PROYCUT-SUPABASE-SCHEMA-SKILL-REPORT]] — reporte de la skill de esquema Supabase, diseño técnico pendiente.
- [[45-SUPABASE-INTEGRATION-PLAN]] — plan de integración de Supabase, con ownership de fase 1 superado por `53`.
