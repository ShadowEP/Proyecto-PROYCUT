DOCUMENTATION-STANDARD.md
Estándar de Documentación de ProyCut

---
Estado: Aprobado
Versión: 1.0.0
Última actualización: 2026-08-01
Propósito: Definir cómo debe escribirse, organizarse, referenciarse y evolucionar toda la documentación de ProyCut.
Depende de: docs/vision/00-LIBRO-FUNDACIONAL.md (principios filosóficos — no le impone autoridad de contenido)
Referenciado por: Todos los documentos de docs/ (una vez adopten el encabezado estándar); docs/meta/DOCUMENTATION-INVENTORY.md; docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md; docs/meta/DOCUMENTATION-AUDIT.md (como criterio para auditorías futuras)
Responsable: Documentation Governance Lead / Chief Software Architect
---

Este documento no describe ProyCut.
Describe cómo ProyCut se documenta a sí mismo.
Es la Constitución de la documentación: el único documento cuya autoridad no versa sobre el producto, sino sobre cómo se escribe, organiza y mantiene todo lo demás.

# 1. Propósito

ProyCut ya pasó por un episodio concreto que justifica este documento: dos archivos de arquitectura coexistieron bajo el mismo número (`05-ARCHITECTURE.md` y una versión paralela sin resolver), tres documentos definieron tres jerarquías de autoridad distintas entre sí, y una referencia rota (`02-DESIGN-PHILOSOPHY.md` en vez de `02-PROYCUT-DESIGN-PHILOSOPHY.md`) se repitió sin corregirse en tres archivos. Ninguno de esos problemas fue un error de visión. Fueron errores de gobernanza: nadie tenía la autoridad exclusiva de decidir cómo debía mantenerse la documentación.

Este documento existe para que eso no vuelva a ocurrir.

Su propósito es responder, de una vez y para siempre, las preguntas que cualquier persona o cualquier IA se hace antes de tocar un documento:

- ¿Dónde pertenece esta información?
- ¿Qué documento debo modificar, y cuál no?
- ¿Qué puedo repetir y qué nunca debo repetir?
- ¿Cuándo se justifica crear un documento nuevo?
- ¿Cómo se versiona un cambio?
- ¿Qué hago si dos documentos se contradicen?
- ¿Cómo referencio un documento sin duplicarlo?
- ¿Cómo sé si un documento está realmente terminado?

Este estándar aplica a toda persona, equipo o sistema de inteligencia artificial (Claude, ChatGPT, Codex o cualquier IA futura) que lea, escriba o mantenga documentación dentro de `docs/`. No es una guía de estilo opcional. Es la capa de gobierno bajo la cual operan todos los demás documentos.

# 2. Filosofía documental

La documentación de ProyCut se rige por seis principios. Ninguno es negociable por conveniencia editorial.

**Una responsabilidad por documento.**
Cada documento existe para responder un único tipo de pregunta. Un documento que mezcla visión con arquitectura, o arquitectura con catálogo funcional, ha fallado en su propósito aunque su contenido sea correcto.

**Una única fuente de verdad.**
Todo hecho, regla, lista o decisión tiene exactamente un documento dueño. Cualquier otro lugar que necesite mencionarlo debe **referenciarlo**, nunca **reescribirlo**. Si dos documentos afirman lo mismo con palabras distintas, ya existe una contradicción latente esperando a manifestarse — como ocurrió con el criterio de "vigencia a futuro", que un documento fijó en diez años y otro en cinco.

**Claridad antes que cantidad.**
Un documento más corto y preciso vale más que uno extenso y ambiguo. La extensión de un documento no es una medida de su calidad ni de su importancia.

**Referencias en lugar de duplicaciones.**
Cuando una idea ya vive en un documento, los demás la citan por ruta y sección. Copiar un párrafo, una lista o un diagrama de un documento a otro es un error de diseño documental, no un atajo inofensivo.

**Evolución incremental.**
La documentación cambia igual que el código: en pasos pequeños, revisables y reversibles. Ningún documento se reescribe por completo porque resulte más cómodo que editarlo.

**Documentación al servicio del producto.**
La documentación no existe para impresionar, para acumular volumen ni para parecer exhaustiva. Existe para que cualquier persona o IA pueda tomar la decisión correcta sin tener que preguntarle a otra persona primero. Un documento que nadie necesita consultar no está cumpliendo su función, sin importar cuán bien escrito esté.

# 3. Arquitectura documental

`docs/` se organiza en tres áreas. Cada una tiene un propósito exclusivo y una prueba de pertenencia clara.

## docs/vision/

**Qué pertenece aquí:** identidad, misión, visión, doctrina de decisión, filosofía de diseño de experiencia, y el plano conceptual de producto (Blueprint). Es contenido que responde "por qué existe ProyCut" y "cómo pensamos", no "cómo está construido".

**Prueba de pertenencia:** si el contenido seguiría siendo verdadero incluso si ProyCut cambiara de framework, de base de datos o de proveedor de IA, pertenece a `vision/`.

**Qué nunca debe colocarse aquí:** decisiones de tecnología, esquemas de datos, convenciones de código, listas de entidades, fases de trabajo, o cualquier contenido que cambie cuando cambia la implementación. `vision/` no versiona rápido; si un documento de `vision/` necesita cambiar cada pocas semanas, probablemente el contenido que se le agregó no pertenecía ahí.

## docs/engineering/

**Qué pertenece aquí:** reglas para IA, arquitectura técnica, catálogo funcional, modelo de datos, manual de ingeniería y hoja de ruta. Es contenido que responde "qué construimos" y "cómo lo construimos y lo mantenemos".

**Prueba de pertenencia:** si el contenido describe una capacidad del sistema, una regla de construcción, una entidad de datos o una secuencia de trabajo, pertenece a `engineering/`.

**Qué nunca debe colocarse aquí:** afirmaciones de identidad o misión (eso es `vision/`), ni contenido sobre cómo se gobierna la documentación (eso es `meta/`). Tampoco debe colocarse aquí una decisión de producto no aprobada presentada como si ya fuera definitiva (ver sección 16, "Anti-patrones").

## docs/meta/

**Qué pertenece aquí:** documentos *sobre* la documentación — este estándar, el inventario documental, los planes de consolidación y las auditorías. `meta/` no describe a ProyCut. Describe al sistema documental de ProyCut.

**Prueba de pertenencia:** si el documento dejara de tener sentido incluso en un ProyCut completamente distinto (otro producto, otra industria), pero se sigue aplicando a *cualquier* proyecto documentado con este mismo método, pertenece a `meta/`.

**Qué nunca debe colocarse aquí:** ninguna decisión de producto, ninguna regla de negocio, ningún modelo de datos, ninguna funcionalidad. `meta/` es el único lugar de `docs/` que tiene prohibido hablar de ProyCut como producto.

# 4. Jerarquía de autoridad

Existen **dos** jerarquías distintas en ProyCut, y no deben confundirse:

1. **Jerarquía de contenido** — qué documento prevalece cuando hay una contradicción sobre el producto.
2. **Jerarquía de gobernanza documental** — qué documento prevalece cuando hay una contradicción sobre cómo debe escribirse o mantenerse la documentación misma. Esa autoridad la ejerce, en exclusiva, este documento.

## 4.1 Jerarquía de contenido (orden oficial y único)

Este es el único listado autoritativo de la jerarquía de contenido de ProyCut. Ningún otro documento debe repetir esta lista completa; debe referenciar esta sección (`docs/meta/DOCUMENTATION-STANDARD.md`, sección 4.1).

1. `docs/vision/00-LIBRO-FUNDACIONAL.md`
2. `docs/vision/01-DOCTRINA-PROYCUT.md`
3. `docs/vision/02-DESIGN-PHILOSOPHY.md`
4. `docs/vision/03-PROYCUT-BLUEPRINT.md`
5. `docs/engineering/04-AI-RULES.md`
6. `docs/engineering/05-ARCHITECTURE.md`
7. `docs/engineering/06-FUNCTIONALITIES.md`
8. `docs/engineering/07-DATABASE.md`
9. `docs/engineering/08-ENGINEERING-HANDBOOK.md`
10. `docs/engineering/ROADMAP.md`
11. ADR vigentes (`docs/adr/`)
12. Documentación específica de un módulo
13. Código y pruebas existentes

Regla de resolución: cuando dos documentos se contradigan sobre el producto, prevalece el de menor número en esta lista. La contradicción debe señalarse explícitamente antes de actuar, nunca resolverse en silencio eligiendo la interpretación más conveniente.

## 4.2 Jerarquía de gobernanza documental

Sobre **cómo se escribe, nombra, versiona, referencia o audita** un documento — no sobre su contenido de producto — la autoridad es:

1. `docs/meta/DOCUMENTATION-STANDARD.md` (este documento)
2. `docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md` (decisiones de consolidación vigentes)
3. `docs/meta/DOCUMENTATION-INVENTORY.md` (estado actual, no prescriptivo)
4. `docs/meta/DOCUMENTATION-AUDIT.md` (diagnóstico histórico, no prescriptivo)

Ningún documento de `vision/` o `engineering/` tiene autoridad para definir su propia convención de nombres, su propio formato de encabezado o su propio criterio de versionado. Esas decisiones pertenecen exclusivamente a este estándar.

# 5. Responsabilidad exclusiva

Para cada documento oficial:

## docs/vision/00-LIBRO-FUNDACIONAL.md
- **Propósito:** identidad, misión, visión y compromiso de ProyCut.
- **Contiene:** por qué existe ProyCut, qué transforma, qué principios son irrenunciables.
- **No debe contener:** reglas operativas, checklists de aprobación, tecnología, datos, funcionalidades.
- **Se modifica cuando:** cambia genuinamente la razón de ser de ProyCut. Debe ser el documento que menos cambia de todos.
- **Depende de él:** todos los demás documentos, de forma indirecta.

## docs/vision/01-DOCTRINA-PROYCUT.md
- **Propósito:** cómo se piensa y se decide en ProyCut.
- **Contiene:** criterios de decisión, definición de calidad, qué se rechaza.
- **No debe contener:** funcionalidades, arquitectura, checklists de interfaz (eso es `02-DESIGN-PHILOSOPHY.md`).
- **Se modifica cuando:** cambia un criterio de decisión de fondo, no cuando se quiere agregar una pregunta más a un checklist ya existente en otro documento.
- **Depende de él:** `06-FUNCTIONALITIES.md` (criterios de prioridad), cualquier propuesta de nueva función.

## docs/vision/02-DESIGN-PHILOSOPHY.md
- **Propósito:** cómo debe sentirse y comunicarse la interfaz.
- **Contiene:** principios de experiencia, personalidad visual, criterios de aprobación de pantallas.
- **No debe contener:** reglas de negocio, arquitectura, modelo de datos.
- **Se modifica cuando:** cambia un principio de experiencia de usuario, no por preferencia estética puntual.
- **Depende de él:** `04-AI-RULES.md` (sección de reglas de interfaz), cualquier trabajo de UI.

## docs/vision/03-PROYCUT-BLUEPRINT.md
- **Propósito:** el recorrido del usuario y los grandes módulos del sistema, a nivel conceptual.
- **Contiene:** ciclo de vida del proyecto, módulos, pilares.
- **No debe contener:** detalle técnico de arquitectura (eso es `05-ARCHITECTURE.md`) ni catálogo funcional exhaustivo (eso es `06-FUNCTIONALITIES.md`).
- **Se modifica cuando:** cambia el mapa conceptual del producto, no cuando se agrega una funcionalidad dentro de un módulo ya existente.
- **Depende de él:** `05-ARCHITECTURE.md` y `06-FUNCTIONALITIES.md`, que detallan lo que aquí se enumera.

## docs/engineering/04-AI-RULES.md
- **Propósito:** gobernanza del comportamiento de cualquier IA que participe en el proyecto.
- **Contiene:** rol de la IA, análisis previo obligatorio, integridad de datos, prohibiciones, formato de propuesta y entrega.
- **No debe contener:** el detalle completo de convenciones de código, pruebas o Git — eso pertenece a `08-ENGINEERING-HANDBOOK.md` y debe citarse por referencia, no repetirse.
- **Se modifica cuando:** cambia una regla de gobernanza de IA, no cuando cambia una convención técnica que ya vive en `08-ENGINEERING-HANDBOOK.md`.
- **Depende de él:** cualquier IA antes de proponer o ejecutar un cambio.

## docs/engineering/05-ARCHITECTURE.md
- **Propósito:** el plano técnico único de ProyCut.
- **Contiene:** capas, dominio, módulos, reglas de dependencia, entidades y objetos de valor a nivel arquitectónico, ADRs.
- **No debe contener:** catálogo funcional completo (`06-FUNCTIONALITIES.md`) ni modelo de datos detallado (`07-DATABASE.md`) — puede referenciarlos.
- **Se modifica cuando:** cambia una decisión estructural. Debe existir en todo momento un único archivo con este nombre y este número; nunca dos versiones paralelas.
- **Depende de él:** todo módulo nuevo, toda decisión de dependencia entre capas.

## docs/engineering/06-FUNCTIONALITIES.md
- **Propósito:** catálogo funcional completo de ProyCut (visión, no obligación de construcción inmediata).
- **Contiene:** capacidades del sistema, tipos de usuario, MVP, criterios de prioridad.
- **No debe contener:** tecnologías, tablas, endpoints, componentes visuales — lo declara explícitamente su propia sección 1, y debe seguir siendo así.
- **Se modifica cuando:** se agrega, ajusta o retira una capacidad del catálogo funcional.
- **Depende de él:** `07-DATABASE.md` (cada entidad debe corresponder a una funcionalidad aquí descrita), `ROADMAP.md` (secuencia qué se construye primero).

## docs/engineering/07-DATABASE.md
- **Propósito:** modelo conceptual de datos.
- **Contiene:** principios de datos, entidades, relaciones, reglas de integridad, orden recomendado de implementación.
- **No debe contener:** sentencias SQL definitivas — lo declara su propia sección 1, y debe seguir siendo así.
- **Se modifica cuando:** cambia una entidad, relación o principio de datos.
- **Depende de él:** cualquier migración, cualquier repositorio de persistencia.

## docs/engineering/08-ENGINEERING-HANDBOOK.md
- **Propósito:** normas de ingeniería para desarrollo, revisión y operación.
- **Contiene:** convenciones de código, manejo de errores, pruebas, revisión, Git, CI/CD, observabilidad, incidentes, Definition of Done.
- **No debe contener:** reglas exclusivas de gobernanza de IA (eso es `04-AI-RULES.md`, aunque ambos puedan citarse mutuamente).
- **Se modifica cuando:** cambia una práctica de ingeniería aplicable a cualquier persona o sistema que escriba código.
- **Depende de él:** todo desarrollador, revisor y agente de IA que escriba o revise código.

## docs/engineering/ROADMAP.md
- **Propósito:** orden de trabajo y fases de reorganización/desarrollo.
- **Contiene:** fases, criterios de salida, orden inmediato de ejecución.
- **No debe contener:** doctrina, arquitectura o funcionalidades — solo secuencia y orden.
- **Se modifica cuando:** se completa una fase, cambia una prioridad de secuencia, o se agrega una idea futura ya evaluada.
- **Depende de él:** cualquier persona o IA que necesite saber "qué sigue".

## docs/meta/DOCUMENTATION-STANDARD.md
- **Propósito:** este documento. Gobernanza de la documentación misma.
- **Contiene:** las 20 secciones de este estándar.
- **No debe contener:** ninguna afirmación sobre el producto ProyCut.
- **Se modifica cuando:** cambia una regla sobre cómo se gobierna la documentación — nunca para acomodar una excepción puntual.
- **Depende de él:** todos los documentos de `docs/`.

## docs/meta/DOCUMENTATION-INVENTORY.md
- **Propósito:** inventario vigente de todos los documentos (propósito, estado, responsable, relaciones).
- **Contiene:** una fila por documento activo.
- **No debe contener:** contenido de producto ni decisiones de consolidación (eso es `DOCUMENTATION-CONSOLIDATION-PLAN.md`).
- **Se modifica cuando:** se crea, mueve, renombra, aprueba u obsoleta cualquier documento.
- **Depende de él:** cualquier auditoría (sección 13).

## docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md
- **Propósito:** plan vigente para resolver duplicaciones y contradicciones detectadas.
- **Contiene:** acciones pendientes, con prioridad y responsable, derivadas de una auditoría.
- **No debe contener:** el diagnóstico en sí (eso es `DOCUMENTATION-AUDIT.md`), solo el plan de acción.
- **Se modifica cuando:** se completa, reprioriza o agrega una acción de consolidación.
- **Depende de él:** quien ejecute la consolidación documental.

## docs/meta/DOCUMENTATION-AUDIT.md
- **Propósito:** diagnóstico histórico de congruencia documental, en un momento dado.
- **Contiene:** hallazgos, contradicciones, duplicaciones, con cita exacta de archivo y sección.
- **No debe contener:** un plan de acción (eso es `DOCUMENTATION-CONSOLIDATION-PLAN.md`) — un audit informa, no decide.
- **Se modifica cuando:** nunca se edita retroactivamente. Cada auditoría nueva es un documento nuevo o una versión mayor nueva (ver sección 10); no se reescribe el diagnóstico de una auditoría pasada para que coincida con el estado actual.
- **Depende de él:** `DOCUMENTATION-CONSOLIDATION-PLAN.md`.

# 6. Reglas de duplicación

**Qué puede repetirse:** una mención breve de un principio ya definido en otro lugar, cuando ayuda a que un documento se entienda sin saltar de pestaña — siempre que la mención no reescriba el principio con palabras distintas, sino que lo enuncie igual y remita a la fuente. Ejemplo aceptable: *"Toda funcionalidad debe reducir la incertidumbre del usuario (ver `docs/vision/01-DOCTRINA-PROYCUT.md`, Capítulo II)"*.

**Qué nunca puede repetirse:**
- listas completas (módulos, entidades, checklists de más de tres preguntas);
- diagramas de arquitectura o de flujo;
- ejemplos de código;
- jerarquías documentales completas (deben citar la sección 4.1 de este documento);
- cifras o criterios numéricos definidos en otro documento (evita el caso ya ocurrido en ProyCut de un mismo criterio fijado en "diez años" en un documento y en "cinco años" en otro).

**Cuándo usar un resumen:** cuando el lector necesita contexto suficiente para decidir si debe abrir el documento fuente, pero no necesita el detalle completo. Un resumen debe ser deliberadamente incompleto y decirlo, no una copia parcial disfrazada de resumen.

**Cuándo usar una referencia:** siempre que el contenido completo ya exista en otro documento. La referencia (ver sección 11) es la herramienta por defecto; el resumen es la excepción, no al revés.

**Cómo evitar contradicciones:** antes de escribir una regla, un criterio o una lista, buscar primero si ya existe en otro documento. Si existe, se referencia. Si no existe, se crea en el documento cuya responsabilidad exclusiva (sección 5) la reclama — nunca en el documento donde resulte más cómodo escribirla en ese momento.

# 7. Convención de nombres

**Carpetas:** minúsculas, en inglés, sin espacios ni guiones: `vision`, `engineering`, `meta`.

**Documentos secuenciales de doctrina y producto** (`vision/` y el núcleo de `engineering/`): formato `NN-NOMBRE-EN-MAYUSCULAS.md`, donde `NN` es un prefijo numérico de dos dígitos que fija su posición en la jerarquía de contenido (sección 4.1). El número nunca se reutiliza ni se comparte entre dos archivos. **Ningún archivo puede llevar un sufijo de versión en el nombre** (nada de `-v2`, `-final`, `-old`, ni un dígito adicional pegado al nombre como ocurrió con una versión paralela de arquitectura que llegó a coexistir sin resolverse). Si una versión nueva reemplaza a la anterior, reemplaza el archivo (ver sección 10, versionado); si conviene conservar la anterior, se archiva explícitamente (sección 9), nunca se deja coexistiendo con el mismo prefijo numérico.

**Documentos de proceso continuo** (`ROADMAP.md` y todo `meta/`): formato `NOMBRE-EN-MAYUSCULAS.md`, sin prefijo numérico. Esto es intencional, no un descuido: estos documentos no ocupan una posición fija en una jerarquía de contradicción de contenido, sino un rol continuo que no compite por orden de autoridad numerado.

**Mayúsculas:** el nombre del archivo va siempre en mayúsculas con guiones (`KEBAB-CASE-MAYÚSCULAS`), sin acentos, sin `ñ`, sin espacios.

**Idioma:** el nombre del archivo se escribe en inglés. El contenido se escribe en español, que es el idioma de trabajo del equipo, salvo términos técnicos que ya tienen convención en inglés (ver `08-ENGINEERING-HANDBOOK.md`, sección 13, sobre el idioma del código).

**Extensión:** siempre `.md`.

**Consistencia interna:** la primera línea de contenido de un documento numerado debe repetir exactamente el nombre del archivo. Si el archivo se renombra, esa línea se actualiza en el mismo cambio — nunca deben quedar desincronizados, como ocurrió antes en este proyecto.

# 8. Encabezado estándar

Todo documento de `docs/` — nuevo o revisado — debe abrir con este bloque, inmediatamente después del título:

```text
---
Estado: <Borrador | En revisión | Aprobado | Obsoleto | Archivado>
Versión: <Mayor.Menor.Parche>
Última actualización: <YYYY-MM-DD>
Propósito: <una sola frase, sin ambigüedad>
Depende de: <lista de documentos de los que este documento hereda autoridad o contexto, o "Ninguno">
Referenciado por: <lista de documentos que citan a este, o "Pendiente de mapear">
Responsable: <rol, no necesariamente una persona>
---
```

Ejemplo real, aplicado a este mismo documento:

```text
---
Estado: Aprobado
Versión: 1.0.0
Última actualización: 2026-08-01
Propósito: Definir cómo debe escribirse, organizarse, referenciarse y evolucionar toda la documentación de ProyCut.
Depende de: docs/vision/00-LIBRO-FUNDACIONAL.md (principios filosóficos — no le impone autoridad de contenido)
Referenciado por: Todos los documentos de docs/ (una vez adopten el encabezado estándar)
Responsable: Documentation Governance Lead / Chief Software Architect
---
```

Este encabezado se adopta de forma incremental: no se exige reescribir de golpe los documentos existentes solo para agregarlo (eso violaría la sección 2, "evolución incremental"), pero **todo documento nuevo lo incluye desde su primera versión**, y todo documento existente lo incorpora la próxima vez que reciba una modificación de fondo.

# 9. Estados documentales

| Estado | Significado | Quién puede cambiarlo |
|---|---|---|
| **Borrador** | Contenido en desarrollo activo. Puede contradecirse a sí mismo entre secciones. No es citable como autoridad por otros documentos. | El autor. |
| **En revisión** | El contenido está completo y se está verificando contra la sección 17 (checklist de calidad) y contra la jerarquía de autoridad. | El responsable del documento. |
| **Aprobado** | Cumple los criterios de la sección 18. Es citable como autoridad. | El responsable del documento, tras revisión. |
| **Obsoleto** | El contenido ya no refleja la decisión vigente, pero se conserva por valor histórico o de trazabilidad. Debe indicar explícitamente qué documento lo reemplaza. | El responsable del documento que lo reemplaza. |
| **Archivado** | Se retira de la navegación activa de `docs/` (se traslada a `docs/meta/archive/` o equivalente) sin eliminarse. Conserva su historial completo. | Decisión de consolidación documentada en `DOCUMENTATION-CONSOLIDATION-PLAN.md`. |

Un documento cambia de estado cuando su contenido cambia de forma material, no cuando se corrige un typo (eso es una corrección editorial, sección 10). Un documento **Aprobado** que recibe un cambio de fondo vuelve a **En revisión** hasta ser aprobado de nuevo; no permanece "Aprobado" con contenido sin verificar.

# 10. Versionado

Cada documento usa versionado de tres números: `Mayor.Menor.Parche`.

**Versión mayor** (`X.0.0`): cambia el alcance o la responsabilidad del documento; se fusiona con otro; se divide en varios; su contenido nuevo contradice intencionalmente una versión anterior (una decisión que se revierte o reemplaza).

**Versión menor** (`X.Y.0`): se agregan secciones nuevas o se expande contenido existente sin alterar el significado de lo que ya estaba aprobado.

**Corrección editorial** (`X.Y.Z`): typos, formato, referencias rotas, aclaraciones de redacción que no cambian el significado. No requiere pasar de nuevo por revisión completa (sección 9), pero sí actualizar la fecha de "Última actualización".

Ningún documento retrocede de versión. Si una decisión se revierte, se registra como una versión mayor nueva que explica el cambio — no se restaura silenciosamente un número de versión anterior.

# 11. Referencias

**Formato oficial:** ruta completa desde la raíz del repositorio, entre comillas invertidas (código en línea), siempre incluyendo la carpeta (`vision/`, `engineering/` o `meta/`).

Correcto:
```text
`docs/engineering/07-DATABASE.md`
```

Incorrecto (ambiguo, sin carpeta):
```text
07-DATABASE.md
```

Incorrecto (ruta relativa frágil, se rompe si el archivo que referencia se mueve):
```text
../engineering/07-DATABASE.md
```

**Referencia a una sección específica:** ruta completa, seguida de un guion largo y el número o nombre de la sección.

```text
`docs/engineering/07-DATABASE.md` — sección 86, "Orden recomendado de implementación"
```

**Referencia a la jerarquía de autoridad:** nunca se repite la lista; se cita:

```text
Ver `docs/meta/DOCUMENTATION-STANDARD.md`, sección 4.1.
```

Un enlace que no pueda verificarse abriendo exactamente esa ruta desde la raíz del repositorio no es una referencia válida.

# 12. Flujo de modificación

Todo cambio de fondo a un documento sigue este flujo. Los cambios triviales (correcciones editoriales, sección 10) pueden saltarse los pasos intermedios, pero nunca el registro final.

```text
Idea
  │
  ▼
Análisis          → ¿ya existe este contenido en otro documento? ¿a qué documento pertenece según la sección 5?
  │
  ▼
Propuesta         → qué cambia, por qué, qué documento(s) afecta
  │
  ▼
Edición           → cambio incremental, no reescritura completa
  │
  ▼
Revisión          → validación contra el checklist de la sección 17
  │
  ▼
Auditoría         → verificación de que no introduce duplicación ni contradicción (sección 13)
  │
  ▼
Aprobación        → cumple los criterios de la sección 18
  │
  ▼
Versión nueva     → se actualiza el encabezado (Estado, Versión, Última actualización)
```

Este flujo aplica igual a una persona y a una IA. Ninguna IA debe saltarse el paso de "Análisis": antes de escribir, debe confirmar en qué documento pertenece el contenido según la sección 5, y si ya existe contenido equivalente en otro lugar.

# 13. Auditorías

**Cada cuánto:** al cierre de cada fase de `docs/engineering/ROADMAP.md` (una auditoría documental es parte de los criterios de salida de fase, igual que las pruebas lo son para el código), y siempre antes de aprobar un documento que modifique la jerarquía de autoridad, la estructura de carpetas o cualquier archivo de `vision/`.

**Qué revisar:**
- que la jerarquía de autoridad (sección 4.1) no se haya repetido ni divergido en otro documento;
- que ningún nombre de archivo referenciado deje de existir;
- que ningún archivo tenga un número de secuencia duplicado;
- que el encabezado (sección 8) coincida con el contenido real (fecha, dependencias, estado);
- que ninguna lista, checklist o diagrama esté copiado en más de un documento sin ser una referencia.

**Cómo detectar duplicaciones:** buscar, entre todos los documentos, frases, listas o checklists que compartan más de tres elementos consecutivos idénticos o casi idénticos. Toda coincidencia debe resolverse con una de las dos: se convierte en referencia, o se confirma como repetición aceptable según la sección 6 y se documenta por qué.

**Cómo detectar contradicciones:** para cada concepto que aparezca en más de un documento (una cifra, un criterio, una lista de entidades, un listado de módulos), comparar su definición exacta en cada lugar donde aparece. Cualquier diferencia de valor, alcance o cifra —por mínima que parezca— se registra como contradicción, no se descarta por ser "de poca importancia". Este es, en esencia, el mismo método con el que se construyó `docs/meta/DOCUMENTATION-AUDIT.md`, y debe seguir siendo el método de referencia para las auditorías futuras.

El resultado de una auditoría se registra en una versión nueva o adicional de `docs/meta/DOCUMENTATION-AUDIT.md`; las acciones derivadas se registran en `docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md`.

# 14. Creación de nuevos documentos

Un documento nuevo se justifica únicamente cuando se cumplen **todas** las siguientes condiciones:

1. El contenido representa una responsabilidad que hoy no tiene dueño exclusivo en ningún documento existente (sección 5).
2. Forzar ese contenido dentro de un documento existente rompería su responsabilidad única (obligaría a mezclar dos tipos de pregunta distintos).
3. Se espera que otros documentos lo referencien de forma recurrente, no una sola vez.
4. Tiene un responsable claro que puede mantenerlo vigente.

**Lo que nunca justifica un documento nuevo:**
- una idea de funcionalidad — pertenece a `docs/engineering/06-FUNCTIONALITIES.md`, usando su plantilla de especificación funcional (sección 68 de ese documento);
- una integración nueva — pertenece a `docs/engineering/06-FUNCTIONALITIES.md` (sección 55, "Integraciones") hasta que exista evidencia de que necesita su propio espacio;
- una decisión técnica puntual — pertenece a un ADR dentro de `docs/adr/`, no a un documento nuevo en `docs/engineering/`;
- una nota personal, un borrador de discusión o una idea sin evaluar — pertenece a un espacio de trabajo fuera de `docs/`, nunca a `docs/` directamente (ver sección 16, anti-patrones).

Cuando exista duda, la respuesta por defecto es **no crear un documento nuevo**. Es más barato agregar una sección a un documento existente y dividirla después, si crece, que mantener un documento nuevo cuya responsabilidad nunca quedó del todo clara.

# 15. Buenas prácticas

- **Escribe para humanos primero.** Una IA puede procesar ambigüedad razonando sobre contexto; una persona nueva en el equipo no siempre puede. Si el texto es claro para un desarrollador nuevo, también lo será para cualquier IA.
- **Las IA son colaboradoras, no autoras finales.** Un documento generado por una IA se revisa con el mismo criterio que uno escrito por una persona — ni con más sospecha ni con menos.
- **Evita lenguaje ambiguo.** ProyCut ya usa, de forma consistente en todos sus documentos, la distinción entre *"deberá"* (obligatorio) y *"podrá"* (opcional o posible). Este estándar la adopta formalmente: ningún documento debe usar "debería", "se recomienda" o "sería bueno" para expresar una obligación real — o es "deberá", o es "podrá".
- **Usa ejemplos solo cuando aporten valor real.** Un ejemplo que solo repite lo ya dicho con otras palabras no aclara, distrae.
- **Una sola responsabilidad, en cada nivel.** No solo el documento completo — cada sección dentro de él debe responder una sola pregunta.
- **Consistencia terminológica.** Un mismo concepto se llama siempre igual en todos los documentos. Si `07-DATABASE.md` usa `project_id`, ningún otro documento debe referirse al mismo concepto como `id_proyecto` o `projectId` en prosa.

# 16. Anti-patrones

Errores ya observados en la documentación de ProyCut, o previsibles si no se corrige el hábito que los produjo:

- **Duplicar un checklist en vez de referenciarlo.** ProyCut llegó a tener cinco variantes del mismo tipo de checklist de aprobación repartidas en cuatro documentos distintos, con distinto número de preguntas cada una.
- **Mezclar arquitectura con funcionalidades**, o funcionalidades con modelo de datos. Cada uno responde una pregunta distinta (cómo vs. qué vs. con qué datos) y debe mantenerse separado aunque describan lo mismo desde ángulos distintos.
- **Usar un documento oficial como notas personales o como transcripción de una conversación sin editar.** Un documento de `docs/` terminado no debe contener frases como "creo que aquí deberíamos..." o "y aquí quiero proponerte algo" — eso es material de borrador, no de documento aprobado.
- **Crear documentación sin propósito**, "por si acaso" o porque parece que todo proyecto serio debe tener muchos documentos. El volumen no es una señal de madurez documental.
- **Presentar una decisión no aprobada como si fuera definitiva.** Nombrar un proveedor externo concreto (una tecnología de pagos, un proveedor de IA específico) como ejemplo ilustrativo de un principio, sin aclarar que es un ejemplo y no una decisión de producto, genera exactamente ese malentendido.
- **Dejar coexistir dos versiones de un mismo documento** bajo nombres casi idénticos, confiando en que "ya se sabrá cuál es la buena". Nunca se sabe; ambas terminan citándose indistintamente.
- **Desincronizar el nombre del archivo de su título interno.** Si el archivo se renombra y la primera línea no se actualiza en el mismo cambio, el documento pasa a "creer" que se llama distinto a como se llama.
- **Repetir una jerarquía de autoridad completa en cada documento nuevo**, en vez de referenciar la sección 4.1 de este estándar.

# 17. Checklist de calidad

Antes de marcar cualquier documento como terminado, verificar:

- Tiene una sola responsabilidad clara e identificable.
- Pertenece a la carpeta correcta (`vision/`, `engineering/` o `meta/`) según la sección 3.
- Su nombre sigue la convención de la sección 7.
- Su primera línea de contenido coincide exactamente con el nombre del archivo.
- Incluye el encabezado estándar de la sección 8, completo y veraz.
- No duplica contenido que ya vive en otro documento; lo referencia según la sección 11.
- No contiene ninguna lista, checklist o diagrama copiado literalmente de otro documento.
- Usa "deberá" y "podrá" de forma consistente y sin ambigüedad.
- No contiene fragmentos de conversación sin editar ni notas personales.
- No presenta ninguna tecnología, proveedor o decisión no aprobada como si fuera definitiva.
- Todas sus referencias a otros documentos usan el formato de la sección 11 y apuntan a una ruta que existe.
- No contradice ningún documento de mayor autoridad según la sección 4.1.
- Es comprensible para una persona que nunca ha visto el proyecto.
- Tiene un responsable identificable.
- Su versión y estado reflejan su contenido real, no un estado aspiracional.

# 18. Criterios de aprobación

Un documento puede marcarse como **Aprobado** únicamente cuando:

1. Pasó completo el checklist de calidad (sección 17).
2. No existe ninguna contradicción sin resolver con un documento de mayor autoridad (sección 4.1).
3. Fue revisado por el responsable definido en su propio encabezado.
4. Todas sus referencias fueron verificadas — ninguna apunta a un archivo o sección inexistente.
5. Tiene asignada una versión conforme a la sección 10.

Un documento no se aprueba "en general" ni "en su mayoría". O cumple los cinco criterios, o permanece en **En revisión**.

# 19. Mantenimiento futuro

La documentación de un proyecto que vive muchos años no se mantiene por buena voluntad puntual; se mantiene porque el costo de dejarla desactualizada está explícitamente reconocido, igual que la deuda técnica lo está en `docs/engineering/08-ENGINEERING-HANDBOOK.md`, sección 92.

Para sostener esto durante años:

- Toda auditoría (sección 13) es obligatoria en los puntos que este estándar define, no opcional cuando "haya tiempo".
- `docs/meta/DOCUMENTATION-INVENTORY.md` se mantiene vivo — un documento que no aparece ahí, para efectos prácticos, no existe.
- `meta/` no debe crecer sin control: cada documento nuevo dentro de `meta/` debe justificarse con la misma exigencia que cualquier otro (sección 14).
- Este mismo estándar evoluciona cuando deja de ajustarse a la realidad del proyecto — nunca se congela por respeto a su propia autoridad. Cuando eso ocurra, se corrige mediante el flujo de la sección 12, igual que cualquier otro documento, y se refleja en una versión mayor de este archivo.
- La responsabilidad de la documentación no recae en una sola persona. Igual que en `08-ENGINEERING-HANDBOOK.md` (sección 103, "Propiedad del código"), ningún documento crítico depende del conocimiento exclusivo de una sola persona o de una sola sesión de IA.

# 20. Principio final

ProyCut no desperdicia material en el taller ni verdad en su documentación: cada cosa se corta, se escribe y se guarda una sola vez, en el lugar correcto.
