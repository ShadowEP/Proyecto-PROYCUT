# 59 — Roadmap de arquitectura técnica ProyCut

## Estado

Documento conceptual de evolución técnica.
Pendiente de decisiones de implementación.

## Versión

1.0

## Última actualización

2026-08-19

## Depende de

- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` — estado real del código hoy; fuente de verdad de "qué existe".
- `docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md` — plan de integración de persistencia, con el modelo de ownership de fase 1 marcado como superado por `53`.
- `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` — decisión de ownership por workspace, no reabierta aquí.
- `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` — modelo conceptual de workspace y membresías, no reabierto aquí.
- `docs/engineering/55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL.md` — modelo de negocio, suscripciones y capacidades, no reabierto aquí.
- `docs/engineering/56-PROYCUT-ENTITLEMENT-PERMISSION-MODEL.md` — capa conceptual entre negocio y arquitectura técnica, no reabierta aquí.
- `docs/engineering/57-PROYCUT-DOMAIN-MODEL.md` — modelo de dominio consolidado, no reabierto aquí.
- `docs/engineering/58-PROYCUT-OPTIMIZER-ROADMAP.md` — roadmap del motor de optimización, no reabierto aquí.
- `docs/engineering/05-ARCHITECTURE.md` — arquitectura **objetivo** por capas, todavía no implementada.

## Propósito

Definir la hoja de ruta conceptual de evolución técnica de ProyCut: cómo pasar del prototipo actual (monolito frontend modularizado, sin backend ni persistencia real) hacia una arquitectura por capas capaz de sostener workspaces, membresías, suscripciones, producción e integraciones externas — sin fijar todavía ninguna decisión de implementación concreta.

Este documento consolida, desde el ángulo de arquitectura técnica, lo que los documentos 44, 45 y 53–58 ya establecieron desde sus propios ángulos (inventario real, plan de persistencia, ownership, negocio, dominio, optimizador). No reabre ninguna de esas decisiones; las conecta.

## Este documento NO define

- framework frontend definitivo;
- backend definitivo;
- proveedor definitivo de infraestructura;
- estructura SQL final, tablas ni columnas;
- APIs técnicas concretas;
- arquitectura cloud final;
- código, migraciones ni configuración de despliegue.

Este documento habla de **responsabilidades y límites arquitectónicos**, no de tecnologías concretas. Cuando se nombra una capa o una responsabilidad, se hace en términos conceptuales — qué debe saber y qué no debe saber — no en términos de qué producto o librería la implementa.

---

# 1. Contexto actual

ProyCut funciona hoy como una aplicación enfocada en optimización de cortes, según describe en detalle `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md`:

- lógica de optimización existente (`empacarMaterial` y el algoritmo de empaquetado, hoy en `main.js`);
- interfaz integrada (captura de piezas, catálogos, configuración de corte, todo en un único documento HTML/JS clásico);
- generación de resultados (diagramas SVG, reporte de costos, boards por material);
- módulos de exportación (DXF, Excel);
- almacenamiento limitado/no persistente: solo preferencias visuales en `localStorage`; el proyecto operativo vive en el DOM, en `state` y en variables del cierre de `main.js`, y se pierde al recargar.

Esta arquitectura actual — un monolito frontend modularizado alrededor de un coordinador grande (`main.js`, ~5.500 líneas) con 22 módulos extraídos bajo `src/scripts/` — permitió validar el producto: el optimizador funciona, produce resultados correctos y ya tiene responsabilidades separadas con contratos utilizables (geometría, costeo, renderizadores, pipeline de proyecto). Pero esa misma arquitectura no fue diseñada para soportar lo que el producto necesita a continuación, ya confirmado conceptualmente en los documentos 53–58:

- **usuarios** con sesión persistente, más allá de una pestaña de navegador abierta;
- **workspaces** como contenedor de ownership (`53`, `54`), en vez de un proyecto que solo existe en memoria del navegador;
- **suscripciones** que habilitan o bloquean capacidades del producto (`55`, `56`);
- **empresas** operando en modo taller o en modo tienda, con miembros, catálogos y clientes propios (`55`, `57`);
- **producción** como dominio futuro (órdenes de trabajo, listas de corte, etiquetas, seguimiento) (`57`, `58`);
- **integraciones** externas (Shopify, WooCommerce, ERP, CNC, IA) (`57`).

Ninguna de estas capacidades existe hoy en el código. El propósito de este documento es trazar cómo evolucionar hacia ellas sin perder lo que ya funciona ni introducir riesgo innecesario en el camino.

---

# 2. Principio arquitectónico general

ProyCut debe evolucionar hacia una arquitectura por capas. Este principio ya está registrado como arquitectura **objetivo** en `docs/engineering/05-ARCHITECTURE.md` y confirmado como dirección válida por la skill `proycut-architecture`; este documento no lo redefine, lo aplica como hoja de ruta.

Modelo conceptual de capas (dirección hacia la que se evoluciona, no estructura ya existente):

```text
Presentation Layer
        ↓
Application Layer
        ↓
Domain Layer
        ↑
Infrastructure Layer

Platform Layer (transversal a todas)
```

Reglas de dependencia (ya fijadas por `05-ARCHITECTURE.md`, sección 9, y por el invariante correspondiente de la skill `proycut-architecture`):

- las dependencias apuntan hacia las reglas internas: Presentación → Aplicación → Dominio;
- Infraestructura y Aplicación pueden depender del Dominio; el Dominio nunca depende de ellas;
- el Dominio no depende de React, Supabase, OpenAI, el DOM ni `localStorage`;
- Platform expone capacidades transversales (auth, tenancy, permisos, configuración, observabilidad) mediante interfaces estables, consumidas por las demás capas sin que el Dominio dependa de su implementación concreta.

**Distancia entre el estado real y este principio.** `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` es explícito: hoy no existe `src/modules/`, `src/platform/`, `src/app/` ni ninguna capa de infraestructura real. Existe un monolito frontend con módulos extraídos bajo `src/scripts/` (`config/`, `costing/`, `dxf/`, `excel/`, `geometry/`, `pieces/`, `project/`, `reports/`, `svg/`, `utils/`), coordinados por una IIFE en `main.js`. Ese inventario, no `05-ARCHITECTURE.md`, es la fuente de verdad sobre "qué existe hoy" — regla de lectura que este documento hereda sin excepción.

La distancia entre 44 (estado real) y 05 (arquitectura objetivo) no se cierra de una vez. Las secciones siguientes definen el criterio para cerrarla gradualmente, capa por responsabilidad, evitando tratar la estructura de `05` como si ya existiera.

---

# 3. Qué debe permanecer del prototipo actual

No todo el código actual es deuda técnica. `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` (sección 10) ya identifica los módulos estables — puros, sin acceso a DOM/`state`/persistencia, con contratos utilizables — que deben conservarse tal como están durante la evolución:

- `geometry/*` — geometría de corte, rectángulos libres, análisis de tableros;
- `dxf/*` — construcción de texto DXF, salida derivada e independiente de persistencia;
- `svg/*` — renderer de tablero, aislado y reutilizado por Excel;
- `costing/*` — cálculo puro de costos;
- `reports/*` — presentación pura del resultado de costos;
- `project/prepare-project.js`, `optimize-project.js`, `apply-project-results.js` — pipeline de coordinación ya estabilizado, contratos recién probados;
- `utils/*`, `config/limits.js`, `config/project-format.js` — funciones pequeñas, estables y reutilizables.

El algoritmo concreto de empaquetado (`empacarMaterial`/`empacarConLista`/`empacarConListaLibre`) y la edición interactiva de tableros (rotar, espejar, compactar, drag) también deben permanecer donde están por ahora. `docs/engineering/58-PROYCUT-OPTIMIZER-ROADMAP.md` (secciones 3 y 4) y `44` (sección 11) coinciden: son de riesgo muy alto, su extracción no es gratuita, y moverlos sin protecciones de regresión (fixtures, comparación de resultados antes/después, pruebas de rotación/veta/kerf) sería agregar superficie de regresión sin mejorar el contrato de datos.

Principio general: **estable no significa inmutable para siempre; significa fuera del alcance de la primera fase de evolución.** El criterio para tocar un módulo estable es el mismo que ya define `proycut-architecture`: solo cuando exista una responsabilidad real y estable que lo justifique, nunca para reducir líneas de `main.js` por sí solo.

---

# 4. Qué responsabilidades deben separarse

`main.js` concentra hoy responsabilidades que un monolito modular por capas no debería mezclar en un mismo archivo (ver `44`, sección 4, para el mapa completo por rango de líneas):

- **coordinación de UI y estado** — listeners, render de tablas, `state` mutable como fuente local de catálogos;
- **catálogos e identidad** (materiales, tapacantos, componentes) — CRUD, SKU, referencias por texto en vez de ID remoto estable;
- **importadores** (CSV, Excel) — con sus propios esquemas, políticas y aplicación atómica;
- **algoritmo concreto de optimización** — lógica matemática mezclada con el coordinador;
- **edición interactiva de boards** — mutación directa de datos derivados junto a listeners de UI;
- **exportación** (Excel, DXF) — construcción de artefactos junto a lectura de DOM.

La dirección de separación, ya validada por `45-SUPABASE-INTEGRATION-PLAN.md` para el caso de persistencia y generalizable al resto, es: **ningún botón debe conocer directamente un proveedor externo o un algoritmo central; siempre a través de un controlador/fachada.** Esto es consistente con `05-ARCHITECTURE.md` (regla de dependencias, sección 9) y con el principio ya confirmado para el propio optimizador en `58` (sección 2): el motor no debe conocer formatos de archivo ni detalles de presentación, y agregar un formato de salida nuevo no debería requerir modificar el algoritmo central.

La separación no es un fin en sí mismo. Cada extracción debe aislar una responsabilidad real y estable — el mismo criterio que ya aplica `proycut-architecture` para evaluar si algo debe convertirse en módulo.

---

# 5. Capas que necesita la aplicación

Traduciendo el modelo de `05-ARCHITECTURE.md` al vocabulario ya confirmado por los documentos de dominio y negocio (`53`–`58`), cada capa cumple un rol conceptual distinto en ProyCut:

**Presentación** — captura de piezas, catálogos, configuración de corte, visualización de diagramas y reportes, paneles de importación/exportación. No decide permisos ni calcula costos; invoca casos de uso y muestra resultados.

**Aplicación** — casos de uso como "guardar proyecto", "cargar proyecto", "generar cotización" (futuro), "ejecutar optimización". Coordina: recibe una solicitud, verifica contexto de workspace/membresía, invoca reglas del Dominio, persiste mediante contratos de Infraestructura, devuelve un resultado explícito. El pipeline actual (`prepare-project.js` → `optimize-project.js` → `apply-project-results.js`) ya se comporta como una capa de aplicación embrionaria, aunque todavía vive junto al resto en `src/scripts/project/`.

**Dominio** — el conocimiento esencial de ProyCut: geometría, costeo, reglas de optimización, y a futuro las entidades de negocio (`Project`, `Workspace`, `Quote`, `Order` — ver `57-PROYCUT-DOMAIN-MODEL.md`). El Optimizer Engine, tal como lo define `58` (sección 2), pertenece conceptualmente aquí: recibe datos, ejecuta lógica matemática, devuelve un resultado, sin conocer DOM, Supabase ni formatos de archivo. Los módulos ya identificados como estables en la sección 3 de este documento son, en espíritu, los primeros candidatos naturales del Dominio.

**Infraestructura** — todo proveedor externo detrás de un contrato reemplazable: cliente de persistencia, repositorios, Output Generators (DXF, Excel, PDF futuro, etiquetas futuras — ver `58`, sección 2), proveedores de IA o pagos si se incorporan. `45-SUPABASE-INTEGRATION-PLAN.md` ya modela esto para persistencia con su estructura de tres capas (cliente → repositorio → caso de uso); ese mismo patrón es el que debe repetirse para cualquier proveedor externo nuevo, no una estructura distinta inventada por integración.

**Plataforma** — capacidades transversales: autenticación, autorización, contexto de workspace/membresía (tenancy), configuración, observabilidad. Esta es la capa donde deben resolverse técnicamente, cuando corresponda, los conceptos ya confirmados en `53`/`54` (membresía activa a un workspace) y en `56` (relación entre plan contratado, tipo de workspace y rol del usuario) — sin que este documento defina todavía cómo.

No todas estas capas deben existir como carpetas separadas desde el primer cambio. `05-ARCHITECTURE.md` (sección 11) ya lo aclara: "no todas las carpetas deberán existir desde el inicio; solo se crearán cuando exista una responsabilidad real que las justifique." La secuencia de introducción de estas capas es progresiva, no un cambio estructural único.

---

# 6. Cuándo introducir persistencia

El criterio ya está definido en detalle por `45-SUPABASE-INTEGRATION-PLAN.md` y por los criterios de salida de fase de `44` (sección 22); este documento no los reabre, los resume como parte de la hoja de ruta general:

1. **Solo después de que la modularización previa esté cerrada** — `44` (sección 20) ya concluyó que el proyecto está "suficientemente modularizado para comenzar una integración incremental con Supabase", no para reemplazar de una vez el modo local ni introducir Auth completa.
2. **Solo datos fuente reproducibles, nunca datos derivados** — piezas, cantidad, parámetros de corte y snapshots mínimos de material/tapacanto; nunca boards, geometría, costos, reporte o archivos exportados (`45`, secciones 2–3).
3. **Solo detrás de un contrato de tres capas** — cliente → repositorio → caso de uso (`45`, sección 12) — nunca un SDK esparcido por el código de dominio o de coordinación.
4. **Solo con el modelo de ownership conceptual ya resuelto antes de tocar SQL** — la decisión de que los proyectos pertenecen a un workspace, no a un usuario individual, ya está confirmada (`53`, `54`); pero el esquema técnico exacto (tablas, columnas, PK/FK, políticas RLS) sigue pendiente de diseño, tal como advierten `44` y `45` explícitamente en cada sección que antes asumía `owner_id`.
5. **Sin romper el modo local** — el modo sin backend debe seguir funcionando; ninguna integración nueva puede volverlo obligatorio (`45`, sección 21).

En términos de esta hoja de ruta: la persistencia se introduce cuando existe un DTO versionado, una prueba de round-trip DOM → DTO → DOM planificada, y un modelo de ownership conceptual resuelto — no antes, y no como parte del mismo cambio que introduce Auth o UI de guardar/cargar.

---

# 7. Cuándo introducir backend

Hoy ProyCut no tiene backend propio: es una aplicación de navegador sin servidor de aplicación. La introducción de "backend" en ProyCut no es un evento único, sino una escalera de necesidad creciente:

**Primer escalón — backend como servicio (BaaS), no servidor propio.** `45-SUPABASE-INTEGRATION-PLAN.md` ya define este primer paso: un proveedor de base de datos con autenticación y políticas de seguridad a nivel de fila (RLS) actuando como backend de datos, consumido desde el navegador a través de una clave publicable — nunca una clave privilegiada. Esto cubre persistencia de proyectos y, a futuro, autorización basada en membresía a un workspace (`53`, sección "RLS futura").

**Segundo escalón — lógica que no puede vivir de forma segura en el cliente ni resolverse solo con RLS.** Ejemplos ya anticipados por los documentos de negocio, sin que este documento decida su implementación:
   - operaciones de billing que requieran una clave privilegiada o webhooks de un proveedor de pagos (`55`, sección 14; explícitamente fuera de alcance de ese documento);
   - validación de entitlements compleja que combine plan, tipo de workspace y rol de forma que no sea expresable únicamente como una política RLS (`56`, sección 6);
   - integraciones externas que requieran credenciales de servidor (Shopify, WooCommerce, ERP — `57`, sección 15);
   - procesamiento que no debe ejecutarse en el navegador del usuario por costo, latencia o exposición de lógica propietaria (por ejemplo, si el Optimizer Core eventualmente se ejecuta fuera del cliente).

El criterio de esta hoja de ruta es: **no introducir un servidor de aplicación propio hasta que exista una necesidad concreta que el BaaS con RLS no pueda resolver de forma segura.** Esto es consistente con el principio de "monolito modular inicial" de `05-ARCHITECTURE.md` (sección 42): sin microservicios ni infraestructura distribuida sin necesidad comprobada. Cuál proveedor, qué lenguaje o qué arquitectura de despliegue use ese eventual servidor queda explícitamente fuera de alcance de este documento.

---

# 8. Cómo preparar integraciones futuras

ProyCut ya tiene, en dos lugares distintos, el mismo patrón conceptual para integraciones futuras, y este documento lo generaliza como principio de arquitectura:

- **Puertos y adaptadores** (`05-ARCHITECTURE.md`, sección 23): la Aplicación conoce el puerto (una interfaz que expresa una capacidad que ProyCut necesita), no el proveedor concreto. Los proveedores concretos son adaptadores intercambiables.
- **Optimizer Engine + Output Generators** (`58-PROYCUT-OPTIMIZER-ROADMAP.md`, sección 2): el motor entrega un `Optimization Result`; cualquier formato de salida nuevo (PDF, etiquetas, documentos de producción) se agrega como un Output Generator que consume ese resultado, sin tocar el algoritmo central.
- **External Integrations** (`57-PROYCUT-DOMAIN-MODEL.md`, sección 15): sistemas externos (Shopify, WooCommerce, ERP, CNC) se conectan mediante una capa de integración explícita; ProyCut conserva el dominio principal.

Preparar una integración futura significa, en esta hoja de ruta, definir el puerto (qué necesita ProyCut de esa capacidad, en lenguaje de negocio) antes que el adaptador (cómo un proveedor concreto la implementa). Esto vale igual para persistencia (ya resuelto en `45`), para IA (ya modelado como puerto en `05`, sección 35), para billing (pendiente, `55`) y para cualquier integración de producción futura (`58`, sección 12).

Ninguna integración nueva debe:

- filtrar su SDK hacia el Dominio o hacia `main.js` directamente;
- duplicar un cálculo crítico ya existente en vez de reutilizarlo;
- volverse obligatoria para que el modo local funcione.

---

# 9. Cómo reducir riesgo durante la evolución

Esta hoja de ruta no introduce reglas nuevas de gestión de riesgo; consolida las que ya rigen el proyecto en `proycut-safe-change`, `proycut-architecture`, `44` y `45`:

1. **Un objetivo arquitectónico por cambio.** `45` (sección 20) ya lo aplica a la integración de Supabase: no mezclar documentación, CLI, migración, cliente, repositorio, Auth y UI en un mismo cambio. Este documento extiende el mismo principio a cualquier evolución de capas.
2. **No tocar módulos de riesgo muy alto sin protección de regresión.** El algoritmo de empaquetado y la edición interactiva de boards (`44`, sección 11; `58`, sección 4) solo deben moverse cuando existan fixtures reproducibles, comparación de resultados antes/después y pruebas de rotación/veta/kerf — condición ya registrada, no diseñada todavía.
3. **Preservar el modo local en cada fase.** Ninguna capa nueva de persistencia, backend o integración puede volver obligatorio un servicio externo para que ProyCut arranque y calcule (`45`, sección 21).
4. **Registrar decisiones estructurales mediante ADR.** `05-ARCHITECTURE.md` (sección 39) ya define el formato: contexto, decisión, alternativas, consecuencias, riesgos, estado. Cualquier cambio que introduzca una capa nueva o mueva una responsabilidad de forma permanente debería dejar ese registro.
5. **Resolver el modelo conceptual antes que el esquema técnico.** El orden ya seguido por `53` → `54` → `55` → `56` → `57` → `58` — decisión de negocio antes que estructura de datos, estructura de datos antes que SQL — es el patrón a repetir para cualquier dominio nuevo (billing, producción, integraciones).
6. **Ejecutar las verificaciones del subsistema tocado.** Cualquier cambio de código derivado de esta hoja de ruta debe pasar por `proycut-regression-matrix` y por el ciclo completo de `proycut-safe-change`; este documento, al ser puramente conceptual, no lo activa por sí mismo.

---

# 10. Relación entre este roadmap y los documentos de dominio y negocio

Este documento no repite el contenido de `53`–`58`; señala cómo cada uno condiciona una capa de la arquitectura técnica:

- **`53`/`54` (ownership y membresía)** definen el contexto de tenancy que la capa de Plataforma deberá exponer (auth + contexto de workspace) y que la Aplicación deberá verificar en cada caso de uso, sin que el Dominio dependa de cómo se implemente.
- **`55`/`56` (suscripción, capacidades, entitlements)** definen qué debe poder consultar la Aplicación antes de ejecutar un caso de uso ("¿este workspace tiene esta capacidad habilitada? ¿este rol puede usarla?"), sin definir todavía cómo se almacena o valida técnicamente esa respuesta.
- **`57` (modelo de dominio)** anticipa las entidades futuras del Dominio y su agrupación en capacidades reales de negocio (`Project`, `Catalog`, `Customer`, `Quote`, `Order`, `Production`) — el mismo criterio que `05-ARCHITECTURE.md` (sección 40) exige para justificar un módulo nuevo bajo `src/modules/`.
- **`58` (roadmap del optimizador)** es, dentro de esta arquitectura, el caso más avanzado de un módulo de Dominio ya identificado con su propia dirección de evolución (Optimizer Core + Application/Adapters + Presentation) — un patrón replicable para otros subdominios cuando llegue su turno.

Ninguna de estas relaciones autoriza a crear la estructura completa de `05-ARCHITECTURE.md` de una sola vez. Autorizan a que, cuando una responsabilidad concreta de negocio esté lista para separarse (por ejemplo, cotizaciones), ya exista un lenguaje y un modelo conceptual con el que diseñar su lugar en la arquitectura — no a anticipar la construcción de módulos que el producto todavía no necesita.

---

# 11. Próximos pasos conceptuales

Sin fijar tecnología ni alcance de implementación, la secuencia conceptual que se desprende de este documento y de los que dependen de él es:

1. Cerrar, si quedara pendiente, cualquier decisión conceptual de negocio adicional (billing técnico, ownership de catálogos, invitaciones) siguiendo el mismo patrón de `53`–`56` antes de tocar esquema.
2. Diseñar el esquema técnico de persistencia inicial (tablas, columnas, RLS) a partir de `54` y `45`, en un documento y cambio aislado — no autorizado por este documento.
3. Evaluar, cuando exista una necesidad concreta identificada en la sección 7, si esa necesidad requiere backend propio o puede resolverse dentro del BaaS con RLS.
4. Definir el modelo técnico de entitlements (cómo se representa y valida "Subscription → Capabilities" en tiempo de ejecución), a partir de `56`, en un documento posterior.
5. Planear, solo cuando existan las protecciones de regresión descritas en `58` (sección 4), la extracción gradual del Optimizer Core hacia un módulo de Dominio independiente.

Cada uno de estos pasos requiere su propio documento o ADR antes de convertirse en código, siguiendo el mismo principio que ya gobierna `53`–`58`: decisión de producto y modelo conceptual primero, diseño técnico después, código al final.

---

## Limitaciones de este documento

Este documento **no define**:

- código;
- arquitectura frontend definitiva;
- arquitectura backend definitiva;
- SQL, tablas, columnas ni RLS;
- APIs técnicas;
- proveedor de infraestructura ni de billing;
- cronograma ni estimaciones de esfuerzo;
- implementación de pruebas ni de migraciones.

## Referencias

- [[44-CURRENT-ARCHITECTURE-INVENTORY]]
- [[45-SUPABASE-INTEGRATION-PLAN]]
- [[53-PROYCUT-OWNERSHIP-DECISION]]
- [[54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL]]
- [[55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL]]
- [[56-PROYCUT-ENTITLEMENT-PERMISSION-MODEL]]
- [[57-PROYCUT-DOMAIN-MODEL]]
- [[58-PROYCUT-OPTIMIZER-ROADMAP]]
- `docs/engineering/05-ARCHITECTURE.md`
- `.agents/skills/proycut-architecture/SKILL.md`
- `.agents/skills/proycut-safe-change/SKILL.md`
