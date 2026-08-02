DOCUMENTATION-AUDIT.md
Auditoría de Congruencia Documental de ProyCut

Alcance: `docs/README.md` y todos los archivos numerados de `docs/` (00 a 08), más `docs/ROADMAP.md`.
No incluye `index.html` (excluido explícitamente del alcance de esta auditoría).
No se modificó, reescribió ni eliminó ningún archivo existente.

# Resumen ejecutivo

La documentación de ProyCut tiene una intención clara y un sistema de valores consistente: reducir incertidumbre, proteger al Proyecto como centro del sistema, avanzar de forma incremental y no reescribir el prototipo sin comprenderlo primero. Esa filosofía se repite de forma coherente en los 12 documentos revisados y puede servir como base conceptual del proyecto.

Sin embargo, la documentación **no es congruente en su forma actual** y no debería usarse todavía como base operativa para iniciar la reorganización del código, por tres razones concretas:

1. **Existen dos documentos de arquitectura distintos con el mismo número (`05-`) y contenido incompatible entre sí** (`05-ARCHITECTURE.md` y `05-ARCHITECTURE0.md`). No es una duplicación menor: describen dos arquitecturas técnicas diferentes (una basada en "Core + módulos", otra en capas DDD/hexagonales de 5 capas), con listas de módulos distintas. Mientras esto no se resuelva, "05-ARCHITECTURE.md" —posición 6 en la jerarquía documental— es ambiguo.
2. **La jerarquía documental para resolver contradicciones está definida tres veces, de tres formas distintas** (`README.md`, `04-AI-RULES.md`, `08-ENGINEERING-HANDBOOK.md`), y ninguna de las tres coincide exactamente con las otras dos. Un documento cuyo propósito es "decir qué hacer cuando hay contradicciones" no puede, él mismo, contradecirse.
3. **El alcance inicial de datos (qué entidades se crean primero al conectar Supabase) se define de dos formas distintas** en `README.md`/`ROADMAP.md` frente a `07-DATABASE.md`.

A esto se suman problemas menores pero reales: una referencia de archivo rota repetida en tres documentos (`02-DESIGN-PHILOSOPHY.md`, que no existe — el archivo real es `02-PROYCUT-DESIGN-PHILOSOPHY.md`), fragmentos de texto conversacional sin editar que quedaron dentro de documentos fundacionales, tecnologías de terceros (Stripe, Shopify, OpenAI) mencionadas como si ya estuvieran decididas cuando el propio Roadmap las coloca muy adelante en el tiempo, y una estructura de repositorio descrita en `README.md` que no coincide con lo que existe físicamente hoy en el proyecto.

Ninguno de estos problemas es una falla de visión — la visión es consistente. Son fallas de sincronización entre documentos que probablemente se escribieron en sesiones distintas. Son corregibles sin reescribir nada, mediante consolidación puntual.

**Veredicto:** Requiere consolidación antes de comenzar (ver sección de Conclusión).

# Inventario de documentos

## docs/README.md
- **Propósito:** Punto de entrada del proyecto; describe el estado actual, cómo abrirlo, la jerarquía documental y el flujo inicial obligatorio.
- **Contenido principal:** Descripción de ProyCut, estado del prototipo, estructura de carpetas propuesta, jerarquía documental, instrucciones de Git, alcance de Supabase, criterios de éxito.
- **Responsabilidad:** Orientación operativa de arranque (onboarding), no doctrina ni arquitectura.
- **Se relaciona con:** Todos los documentos de `docs/` (los enumera y resume); `ROADMAP.md` (repite el flujo inicial); `07-DATABASE.md` (repite el alcance de Supabase).
- **Problemas detectados:** Referencia rota a `02-DESIGN-PHILOSOPHY.md` (línea 60 y 106); describe una estructura de repositorio (`README.md` en la raíz, carpetas `legacy/` y `backups/`) que no existe físicamente hoy; repite contenido operativo que también aparece, con más detalle, en `ROADMAP.md`.

## docs/00-LIBRO-FUNDACIONAL.md
- **Propósito:** Explicar por qué existe ProyCut (misión, visión, filosofía fundacional).
- **Contenido principal:** Prólogo, Convicción, Filosofía, Misión, Visión.
- **Responsabilidad:** Identidad y propósito de la empresa/producto. Nivel más alto de la jerarquía.
- **Se relaciona con:** `01-DOCTRINA-PROYCUT.md` (la Doctrina se presenta como su continuación operativa); `02-PROYCUT-DESIGN-PHILOSOPHY.md` (comparte principios como "reducir incertidumbre").
- **Problemas detectados:** Contiene fragmentos de una conversación sin depurar, ajenos a un documento fundacional terminado (líneas 39–56: *"Creo que aquí debemos hacer algo diferente... Te propongo que el siguiente capítulo no sea 'Misión'..."* y la palabra suelta *"contnuemos"* en la línea 54). Esto indica que el documento es un borrador de conversación pegado directamente, no un texto editorial final.

## docs/01-DOCTRINA-PROYCUT.md
- **Propósito:** Definir cómo se piensa y se decide en ProyCut (no qué se construye).
- **Contenido principal:** Forma de pensar, criterios de decisión, diseño, desarrollo, uso de IA, priorización, calidad, rechazos, definición de éxito.
- **Responsabilidad:** Reglas de decisión y evaluación de ideas.
- **Se relaciona con:** `00-LIBRO-FUNDACIONAL.md` (extiende sus principios); `02-PROYCUT-DESIGN-PHILOSOPHY.md` (su "Regla de Oro" es casi idéntica al criterio de decisión aquí definido); `06-FUNCTIONALITIES.md` (los "Criterios de prioridad" repiten estas preguntas).
- **Problemas detectados:** El listado de 5 preguntas del Capítulo II ("¿Reduce la incertidumbre?", etc.) es casi idéntico al de `00-LIBRO-FUNDACIONAL.md` ("Nuestra forma de construir") — ver sección de Duplicaciones. El criterio de "Escalabilidad" (Capítulo VI) pregunta si algo "seguirá siendo útil dentro de **diez** años", cifra que no coincide con la de `02-PROYCUT-DESIGN-PHILOSOPHY.md`.

## docs/02-PROYCUT-DESIGN-PHILOSOPHY.md
- **Propósito:** Definir cómo debe sentirse y comunicarse la interfaz.
- **Contenido principal:** Diez principios de diseño, personalidad visual, "Regla de Oro del Diseño", "Test ProyCut" (10 preguntas).
- **Responsabilidad:** Filosofía de experiencia de usuario e interfaz.
- **Se relaciona con:** `01-DOCTRINA-PROYCUT.md` (mismo tipo de checklist); `04-AI-RULES.md` sección 15 y 17 (reglas de interfaz para la IA); `06-FUNCTIONALITIES.md` (estados vacíos, alertas).
- **Problemas detectados:** El nombre del archivo no coincide con el que usan `README.md`, `04-AI-RULES.md` y `08-ENGINEERING-HANDBOOK.md` al citarlo (`02-DESIGN-PHILOSOPHY.md`). Contiene otro fragmento conversacional sin depurar (línea 144: *"Y aquí quiero proponerte algo que, sinceramente, creo que puede convertirse en una herramienta muy poderosa para todo el equipo."*). El "Test ProyCut" (10 preguntas) se superpone en propósito con la "Regla de Oro" (6 preguntas) del mismo documento y con los checklists de `01-DOCTRINA-PROYCUT.md`, `06-FUNCTIONALITIES.md` y `04-AI-RULES.md`.

## docs/03-PROYCUT-BLUEPRINT.md
- **Propósito:** Describir el recorrido del usuario y los módulos del sistema a alto nivel.
- **Contenido principal:** Recorrido del usuario, lista de módulos, "corazón" del sistema (el Proyecto), pilares del sistema.
- **Responsabilidad:** Plano conceptual/producto, previo a la arquitectura técnica.
- **Se relaciona con:** `05-ARCHITECTURE.md` / `05-ARCHITECTURE0.md` (ambos retoman "el Proyecto es el centro"); `06-FUNCTIONALITIES.md` (detalla cada módulo aquí solo enumerado).
- **Problemas detectados:** Contiene un fragmento conversacional no depurado (línea 126: *"Aquí quiero detenerme. Creo que ya descubrimos cuál es."*, y línea 192: *"Y aquí quiero dejar escrita una regla que creo que será tan importante como las del Libro Fundacional."*). "Cotizaciones" aparece como submódulo del pilar Comercial (sección 5) pero no aparece en la lista de "grandes módulos" (sección 3), que sí incluye Clientes, Proyectos, Diseño, Materiales, Costeo, Optimización, Producción, Inventarios, Reportes e IA — inconsistencia menor de completitud entre dos listados del mismo documento.

## docs/04-AI-RULES.md
- **Propósito:** Reglas obligatorias para cualquier IA que participe en el proyecto.
- **Contenido principal:** Documentos de autoridad, rol de la IA, análisis previo, integridad de datos, arquitectura, seguridad, pruebas, documentación, formato de propuestas y entregas, checklist final.
- **Responsabilidad:** Gobernanza del comportamiento de la IA (no ingeniería general, no arquitectura completa).
- **Se relaciona con:** Todos los documentos superiores (los cita como jerarquía en su sección 2); `05-ARCHITECTURE.md`/`05-ARCHITECTURE0.md` (duplica reglas de capas y proveedores reemplazables); `08-ENGINEERING-HANDBOOK.md` (duplica convenciones de nombres, comentarios, pruebas, Git, seguridad).
- **Problemas detectados:** Su jerarquía de documentos (sección 2) omite `08-ENGINEERING-HANDBOOK.md` y `ROADMAP.md` por completo y también usa el nombre incorrecto `02-DESIGN-PHILOSOPHY.md`. La sección 23 nombra "Supabase, Stripe, OpenAI, Claude, Shopify" como proveedores ya contemplados, lo cual choca con el alcance inmediato definido en `README.md` y con `ROADMAP.md` (Stripe/Shopify pertenecen a la FASE 16, muy posterior). Duplica de forma casi literal contenido de `08-ENGINEERING-HANDBOOK.md` (ver sección de Duplicaciones).

## docs/05-ARCHITECTURE.md
- **Propósito (declarado en su propio texto):** "el plano técnico de ProyCut."
- **Contenido principal:** 10 "Reglas" numeradas (el Proyecto como centro, arquitectura modular tipo `/modules`, el Core, no dependencias entre módulos, responsabilidad única, proveedores reemplazables).
- **Responsabilidad:** Arquitectura técnica — **en conflicto directo con `05-ARCHITECTURE0.md`**, que reclama la misma responsabilidad.
- **Se relaciona con:** `03-PROYCUT-BLUEPRINT.md` (repite el diagrama "Proyecto al centro"); `04-AI-RULES.md` sección 11 y 23 (duplicado casi literal).
- **Problemas detectados:** El propio documento se autodenomina **"04-ARCHITECTURE.md"** en sus dos primeras líneas, aunque el archivo se llama `05-ARCHITECTURE.md`. Coexiste con `05-ARCHITECTURE0.md`, un documento mucho más extenso (999 líneas vs. 229) con un modelo arquitectónico distinto (capas DDD/hexagonales frente al modelo "Core + módulos" de este archivo). No queda claro cuál de los dos es el `05-ARCHITECTURE.md` válido citado por la jerarquía documental.

## docs/05-ARCHITECTURE0.md
- **Propósito (declarado en su propio texto):** "definir la arquitectura técnica de ProyCut" — el mismo propósito que `05-ARCHITECTURE.md`.
- **Contenido principal:** Arquitectura por 5 capas (Presentación, Aplicación, Dominio, Infraestructura, Plataforma), entidades/objetos de valor, casos de uso, eventos de dominio, ADRs, checklist arquitectónico de 20 puntos, prohibiciones arquitectónicas.
- **Responsabilidad:** Arquitectura técnica detallada, con vocabulario DDD/hexagonal.
- **Se relaciona con:** `07-DATABASE.md` (coherente en el vocabulario de versiones, aislamiento multiempresa, ADRs); `08-ENGINEERING-HANDBOOK.md` (coherente en pruebas por capa y ADRs).
- **Problemas detectados:** Su propio encabezado interno dice **"05-ARCHITECTURE.md"** (el nombre "correcto" según la numeración), lo que sugiere que el contenido de este archivo (`05-ARCHITECTURE0.md`) podría ser el que estaba destinado a ocupar el nombre `05-ARCHITECTURE.md`, y que el archivo actualmente llamado así (229 líneas, con encabezado interno "04-ARCHITECTURE.md") sea en realidad una versión anterior o un borrador. La lista de módulos en `/src/modules` (sección 10) no coincide con la de `05-ARCHITECTURE.md` (ver sección de Contradicciones). Ningún documento de la jerarquía (`README.md`, `04-AI-RULES.md`, `08-ENGINEERING-HANDBOOK.md`) menciona la existencia de `05-ARCHITECTURE0.md`; es un archivo "huérfano" de la jerarquía documental oficial.

## docs/06-FUNCTIONALITIES.md
- **Propósito:** Catálogo funcional completo de ProyCut (declara explícitamente qué NO define: tecnologías, tablas, endpoints).
- **Contenido principal:** 72 secciones que cubren desde acceso/cuentas hasta MVP, criterios de prioridad y "lo que ProyCut no deberá convertirse".
- **Responsabilidad:** Alcance funcional completo (visión, no obligación de construcción inmediata — lo aclara explícitamente en README.md línea 186-187).
- **Se relaciona con:** `07-DATABASE.md` (cada entidad de datos corresponde a una funcionalidad aquí descrita); `03-PROYCUT-BLUEPRINT.md` (detalla los módulos ahí enumerados).
- **Problemas detectados:** Es el documento con mejor separación de responsabilidades de todo el conjunto (declara explícitamente sus límites en la sección 1). Su única fricción es de volumen: 2073 líneas en un solo archivo hacen difícil su mantenimiento y localización de secciones específicas; varias de sus 72 secciones podrían vivir como documentos independientes por dominio (comercial, producción, calidad) sin perder valor.

## docs/07-DATABASE.md
- **Propósito:** Modelo conceptual de datos (declara explícitamente que no define SQL definitivo).
- **Contenido principal:** Principios de datos, multiempresa, ~90 entidades agrupadas en 17 dominios, reglas de integridad, convenciones de nombres, orden de implementación por etapas.
- **Responsabilidad:** Modelo de datos conceptual — coherente y bien acotado en su propio alcance.
- **Se relaciona con:** `06-FUNCTIONALITIES.md` (mapea 1 a 1 casi todas las entidades); `README.md`/`ROADMAP.md` (ambos definen también un alcance inicial de Supabase, que no coincide con el de este documento).
- **Problemas detectados:** Sección 86 ("Orden recomendado de implementación") define una Etapa 1 (companies, users, company_users, roles, permissions, branches, settings, audit_events) distinta de la que proponen `README.md` y `ROADMAP.md` (companies, users, company_users, clients, projects) para el mismo momento del proyecto — ver Contradicciones.

## docs/08-ENGINEERING-HANDBOOK.md
- **Propósito:** Normas de ingeniería para desarrollo, revisión y operación.
- **Contenido principal:** Principios de calidad, convenciones de código, manejo de errores, pruebas, revisión de código, Git, CI/CD, observabilidad, rendimiento, incidentes, Definition of Ready/Done, plantillas técnicas.
- **Responsabilidad:** Manual operativo de ingeniería de software — el documento más "técnico-práctico" del conjunto.
- **Se relaciona con:** `04-AI-RULES.md` (fuerte solapamiento, ver Duplicaciones); `05-ARCHITECTURE0.md` (coherente en ADRs y pruebas por capa).
- **Problemas detectados:** Su jerarquía de autoridad (sección 3) tampoco coincide con la de `README.md` ni con la de `04-AI-RULES.md` (omite `ROADMAP.md`, agrega "ADR vigentes" como nivel propio). Usa el nombre incorrecto `02-DESIGN-PHILOSOPHY.md`. Duplica, casi textualmente, contenido de `04-AI-RULES.md` (comentarios, nombres, definición de terminado, plantillas de propuesta/entrega).

## docs/ROADMAP.md
- **Propósito:** Orden de trabajo y fases de reorganización/desarrollo.
- **Contenido principal:** 19 fases (0 a 18), reglas del roadmap, orden inmediato de ejecución, prompt de diagnóstico, criterio para avanzar de fase.
- **Responsabilidad:** Secuenciación temporal del trabajo — es el documento más operativo y accionable de todos.
- **Se relaciona con:** `README.md` (ambos describen el "flujo inicial obligatorio", con overlap notable); `07-DATABASE.md` (FASE 9 define las "primeras entidades", que coincide con `README.md` pero no con `07-DATABASE.md` sección 86).
- **Problemas detectados:** Es el único documento de los 12 sin prefijo numérico en su nombre, rompiendo la convención `00-`…`08-` del resto de `docs/`. Su sección 6 ("Prompt para diagnóstico") cita `05-ARCHITECTURE.md` sin indicar que existen dos archivos candidatos con ese número.

# Contradicciones encontradas

### 1. Dos documentos de arquitectura con contenido incompatible
- **Archivos:** `docs/05-ARCHITECTURE.md` (líneas 1–229) vs. `docs/05-ARCHITECTURE0.md` (líneas 1–999).
- **Secciones afectadas:** `05-ARCHITECTURE.md` "Regla Nº2 — Arquitectura Modular" (lista `/modules`: core, clients, projects, materials, costing, optimizer, production, inventory, reports, ai, settings, billing, notifications) vs. `05-ARCHITECTURE0.md` sección 10 "Arquitectura modular" (lista `src/modules`: projects, clients, materials, costing, **quotations**, optimization, inventory, **purchasing**, production, **deliveries**, reports, billing, ai — sin "settings" ni "notifications" ni "core" como módulo).
- **Por qué existe:** Todo indica que son dos versiones del mismo documento escritas en momentos distintos (una más simple tipo "Core + módulos", otra un rediseño DDD/hexagonal mucho más profundo), y ninguna reemplazó formalmente a la otra. El encabezado interno de `05-ARCHITECTURE.md` dice literalmente "04-ARCHITECTURE.md", y el de `05-ARCHITECTURE0.md` dice literalmente "05-ARCHITECTURE.md" — evidencia de que se trata de versiones sucesivas mal resueltas al renombrar archivos.
- **Recomendación:** Decidir cuál de los dos representa la arquitectura vigente (por el nivel de detalle y coherencia con `07-DATABASE.md`, `05-ARCHITECTURE0.md` parece ser la versión más madura), conservar solo uno bajo el nombre `05-ARCHITECTURE.md`, y archivar el otro explícitamente (por ejemplo en una carpeta `docs/history/` o similar) en vez de dejarlo en `docs/` con un nombre que sugiere que es una alternativa vigente.

### 2. Tres jerarquías documentales distintas
- **Archivos:** `docs/README.md` (sección "Jerarquía documental"), `docs/04-AI-RULES.md` (sección 2 "Documentos de autoridad"), `docs/08-ENGINEERING-HANDBOOK.md` (sección 3 "Orden de autoridad").
- **Secciones afectadas:** Las tres listas de orden de prevalencia documental.
- **Por qué existe:** `README.md` incluye 12 niveles (con `ROADMAP.md` en el puesto 10); `04-AI-RULES.md` incluye solo 10 niveles y omite tanto `08-ENGINEERING-HANDBOOK.md` como `ROADMAP.md`; `08-ENGINEERING-HANDBOOK.md` incluye 12 niveles pero agrega "ADR vigentes" como nivel propio y tampoco menciona `ROADMAP.md`. Cada documento parece haber definido su propia jerarquía sin sincronizarla con las otras.
- **Recomendación:** Definir la jerarquía documental **en un solo lugar** (idealmente `README.md`, por ser el punto de entrada) y hacer que el resto de documentos la referencien en vez de repetirla.

### 3. Alcance inicial de datos (Supabase / Etapa 1) distinto
- **Archivos:** `docs/README.md` (sección "Supabase") y `docs/ROADMAP.md` (FASE 9 "Primeras entidades") vs. `docs/07-DATABASE.md` (sección 86 "Orden recomendado de implementación", Etapa 1).
- **Secciones afectadas:** README.md líneas 348–360; ROADMAP.md líneas 433–438; 07-DATABASE.md líneas 1777–1791.
- **Por qué existe:** README.md y ROADMAP.md coinciden entre sí (`companies, users, company_users, clients, projects`), pero `07-DATABASE.md` define una Etapa 1 distinta (`companies, users, company_users, roles, permissions, branches, settings, audit_events`) que pospone `clients` y `projects` a su propia "Etapa 2". No es solo una diferencia de detalle: son dos secuencias distintas de qué se construye primero.
- **Recomendación:** Unificar el criterio de "primera etapa de datos" en un único lugar (probablemente `07-DATABASE.md`, por ser el documento de autoridad en modelo de datos) y hacer que `README.md`/`ROADMAP.md` lo referencien en vez de duplicar una lista que puede desalinearse.

### 4. Cifra distinta para el mismo criterio de evaluación ("vigencia a futuro")
- **Archivos:** `docs/01-DOCTRINA-PROYCUT.md` (Capítulo VI, criterio "Escalabilidad") vs. `docs/02-PROYCUT-DESIGN-PHILOSOPHY.md` ("El Test ProyCut", pregunta 9).
- **Secciones afectadas:** 01-DOCTRINA-PROYCUT.md línea 85 ("¿Seguirá siendo útil dentro de **diez** años?") vs. 02-PROYCUT-DESIGN-PHILOSOPHY.md línea 156 ("¿Seguirá siendo útil dentro de **cinco** años?").
- **Por qué existe:** Ambas preguntas evalúan el mismo concepto (vigencia futura de una función/decisión) con checklists redactados de forma independiente.
- **Recomendación:** Unificar la cifra (o aclarar que son dos horizontes distintos y por qué), y considerar que una sola función de evaluación de esta naturaleza cubra ambos documentos por referencia, no por repetición literal.

### 5. Tecnologías de terceros presentadas como decisión vigente frente a "no decidir tecnología todavía"
- **Archivos:** `docs/04-AI-RULES.md` (sección 23) y `docs/05-ARCHITECTURE.md`/`05-ARCHITECTURE0.md` (Regla Nº10 / sección 9) vs. `docs/README.md` ("Alcance inmediato") y `docs/ROADMAP.md` (sección 8 "Qué no hacer ahora", FASE 16).
- **Secciones afectadas:** 04-AI-RULES.md línea 319 ("Supabase, Stripe, OpenAI, Claude, Shopify... deberán integrarse mediante capas de abstracción"); 05-ARCHITECTURE.md líneas 178–188 ("Todo debe poder reemplazarse: Supabase. Stripe. OpenAI. Claude. Shopify."); README.md líneas 362–371 ("no se deberán agregar: nuevas integraciones... pagos; comercio electrónico"); ROADMAP.md líneas 782–797 y FASE 16 (Stripe/Shopify/WooCommerce aparecen recién en la fase 16, muy posterior al núcleo).
- **Por qué existe:** Los documentos de reglas de IA y arquitectura usan Stripe/OpenAI/Claude/Shopify como *ejemplos ilustrativos* del principio "todo proveedor debe ser reemplazable", pero al nombrarlos explícitamente sin aclarar que son ejemplos hipotéticos, dan la impresión de que ya son decisiones de producto, lo cual contradice el propio Roadmap, que los ubica muy adelante en el tiempo y explícitamente fuera del alcance inmediato.
- **Recomendación:** En `04-AI-RULES.md` y en el archivo de arquitectura vigente, sustituir los nombres de proveedores concretos por placeholders genéricos (p. ej. "proveedor de pagos", "proveedor de IA") o agregar una nota explícita de que son ejemplos ilustrativos, no decisiones de producto.

### 6. Estructura de repositorio documentada vs. estructura real
- **Archivos:** `docs/README.md` (sección "Estructura inicial del repositorio").
- **Secciones afectadas:** README.md líneas 51–73, que describen `README.md` en la raíz del proyecto, y las carpetas `legacy/` y `backups/`.
- **Por qué existe:** El proyecto real hoy solo contiene `docs/` e `index.html` en la raíz; no existe `README.md` en la raíz (está dentro de `docs/`), ni `legacy/`, ni `backups/`, ni `.gitignore`, y el repositorio Git aún no se ha inicializado. Esto es información desactualizada u objetivo aún no ejecutado, no necesariamente un error, pero el documento no distingue entre "estructura deseada" y "estructura actual".
- **Recomendación:** Marcar explícitamente esa sección como "estructura objetivo de la Fase 0" (que ya remite a `ROADMAP.md`) en vez de presentarla como si ya existiera.

# Duplicaciones encontradas

| Contenido duplicado | Documentos | Clasificación | Justificación |
|---|---|---|---|
| "El Proyecto es el centro del sistema" (concepto y diagrama) | `03-PROYCUT-BLUEPRINT.md` (sección 4/6), `05-ARCHITECTURE.md` (Regla Nº1), `05-ARCHITECTURE0.md` (sección 2) | **Repetición necesaria** | Es el principio estructural central; repetirlo en cada nivel de la jerarquía refuerza coherencia, siempre que el diagrama de módulos no varíe (aquí sí varía — ver Contradicción 1). |
| Checklist de 5 preguntas "¿Reduce la incertidumbre? / ¿Ahorra tiempo? / ¿Hace más sencillo el trabajo? / ¿Genera confianza?" | `00-LIBRO-FUNDACIONAL.md` ("Nuestra forma de construir"), `01-DOCTRINA-PROYCUT.md` (Capítulo II) | **Repetición aceptable** | Mismo espíritu, redactado de forma independiente en dos niveles jerárquicos distintos (visión vs. doctrina operativa); aceptable si se mantiene sincronizado, pero hoy no hay una fuente única. |
| Checklists de aprobación ("Regla de Oro del Diseño", "Test ProyCut", checklist de `01-DOCTRINA`, checklist final de `04-AI-RULES` sección 40, checklist funcional de `06-FUNCTIONALITIES` sección 71) | `01-DOCTRINA-PROYCUT.md`, `02-PROYCUT-DESIGN-PHILOSOPHY.md`, `04-AI-RULES.md`, `06-FUNCTIONALITIES.md` | **Repetición aceptable / posible contradicción** | Cinco variantes del mismo tipo de checklist con distinto número de preguntas (5, 6, 10, 20, 20). Aceptable como refuerzo de valores, pero sin una tabla de equivalencia es difícil saber cuál aplica en qué momento del ciclo de vida de una decisión. |
| Ejemplo de comentario "// Incrementar contador / counter++;" (incorrecto) y su corrección | `04-AI-RULES.md` (sección 30) y `08-ENGINEERING-HANDBOOK.md` (sección 22) | **Repetición innecesaria** | Es prácticamente el mismo ejemplo copiado en ambos documentos. `08-ENGINEERING-HANDBOOK.md` es el documento de ingeniería detallado; `04-AI-RULES.md` debería referenciarlo en vez de repetir el ejemplo. |
| Plantilla de "propuesta antes de un cambio" y "entrega al terminar un cambio" | `04-AI-RULES.md` (secciones 38–39) y `08-ENGINEERING-HANDBOOK.md` (secciones 111–112) | **Posible contradicción** | Son dos plantillas distintas para el mismo propósito, con campos diferentes (la de `04-AI-RULES.md` es más corta: Objetivo/Estado actual/Alcance/Riesgos/Plan/Validación/Reversión; la de `08-ENGINEERING-HANDBOOK.md` es mucho más extensa). No está definido cuál debe usarse, o si la de `04-AI-RULES.md` es un resumen obligatorio de la otra. |
| Reglas de capas (interfaz no calcula, dominio no depende de infraestructura, proveedores reemplazables) | `04-AI-RULES.md` (secciones 11, 23) y `05-ARCHITECTURE.md`/`05-ARCHITECTURE0.md` | **Repetición aceptable** | `04-AI-RULES.md` resume reglas que ya están descritas con más detalle en el/los documento(s) de arquitectura. Aceptable como recordatorio operativo, siempre que la fuente de arquitectura sea única (hoy no lo es — ver Contradicción 1). |
| Convenciones de nombres (evitar `data`, `temp`, `manager`, `helper`, `utils`) | `04-AI-RULES.md` (sección 14) y `08-ENGINEERING-HANDBOOK.md` (secciones 14–15) | **Repetición aceptable** | Mismo principio con ejemplos distintos; no hay contradicción de fondo, pero sí mantenimiento duplicado. |
| Reglas de seguridad (mínimo privilegio, no secretos en código, aislamiento multiempresa) | `04-AI-RULES.md` (secciones 24–25) y `08-ENGINEERING-HANDBOOK.md` (secciones 29–35) | **Repetición aceptable** | Igual que el caso anterior: mismo principio, dos redacciones independientes. |
| "Definición de terminado" / Definition of Done | `04-AI-RULES.md` (sección 36) y `08-ENGINEERING-HANDBOOK.md` (sección 106) | **Repetición aceptable** | Listas de criterios parecidas pero no idénticas; conviene declarar una como autoritativa. |

# Inconsistencias de nombres y numeración

- **Referencia rota repetida:** `README.md` (líneas 60, 106), `04-AI-RULES.md` (línea 13) y `08-ENGINEERING-HANDBOOK.md` (línea 43) citan `02-DESIGN-PHILOSOPHY.md`. El archivo real es `docs/02-PROYCUT-DESIGN-PHILOSOPHY.md`. Cualquier automatización, enlace o IA que intente abrir el nombre citado fallará.
- **Doble archivo con el mismo número de secuencia:** `05-ARCHITECTURE.md` y `05-ARCHITECTURE0.md` comparten el prefijo `05-`. Ningún documento de la jerarquía reconoce la existencia de ambos ni explica cuál es el vigente.
- **Encabezados internos que no coinciden con el nombre del archivo:** `05-ARCHITECTURE.md` se autotitula "04-ARCHITECTURE.md" en su primera línea; `05-ARCHITECTURE0.md` se autotitula "05-ARCHITECTURE.md" en su primera línea. Es decir, cada archivo "cree" ser el otro.
- **Convención de nombres inconsistente dentro de `docs/`:** algunos archivos incluyen "PROYCUT" en el nombre (`01-DOCTRINA-PROYCUT.md`, `02-PROYCUT-DESIGN-PHILOSOPHY.md`, `03-PROYCUT-BLUEPRINT.md`) y otros no (`04-AI-RULES.md`, `05-ARCHITECTURE.md`, `06-FUNCTIONALITIES.md`, `07-DATABASE.md`, `08-ENGINEERING-HANDBOOK.md`). No es un error funcional, pero rompe la previsibilidad del patrón de nombres.
- **`ROADMAP.md` sin prefijo numérico:** es el único documento de los 12 auditados que no sigue el patrón `NN-NOMBRE.md` usado por el resto de `docs/`, aunque `README.md` lo ubica en la posición 10 de la jerarquía.
- **`README.md` fuera de su ubicación documentada:** el propio `README.md` (línea 53) indica que debería estar en la raíz del repositorio (junto a `index.html`), pero el archivo real reside en `docs/README.md`, y no existe ningún `README.md` en la raíz del proyecto.

# Separación de responsabilidades

| Documento | ¿Cumple una función única? | Observación |
|---|---|---|
| `README.md` | Sí, con solapamiento | Onboarding operativo; repite el "flujo inicial obligatorio" que también está en `ROADMAP.md` con más detalle. |
| `00-LIBRO-FUNDACIONAL.md` | Sí | Identidad/misión/visión. No define reglas operativas. |
| `01-DOCTRINA-PROYCUT.md` | Sí, con solapamiento | Criterios de decisión; se superpone con checklists de `02` y `06`. |
| `02-PROYCUT-DESIGN-PHILOSOPHY.md` | Sí | Exclusivamente experiencia/interfaz; no define arquitectura ni datos. |
| `03-PROYCUT-BLUEPRINT.md` | Sí | Plano conceptual de producto; no entra en detalle técnico (correctamente delega a `05-` y `06-`). |
| `04-AI-RULES.md` | **No completamente** | Mezcla gobernanza de IA (su responsabilidad propia) con contenido que pertenece a `08-ENGINEERING-HANDBOOK.md` (convenciones de código, pruebas, Git) y a `05-ARCHITECTURE.md` (reglas de capas). |
| `05-ARCHITECTURE.md` | **No** — en disputa | Comparte responsabilidad con `05-ARCHITECTURE0.md` sin que quede claro cuál prevalece. |
| `05-ARCHITECTURE0.md` | Sí, en su propio contenido | Internamente coherente y bien delimitado (capas, entidades, ADRs), pero fuera de la jerarquía documental oficial. |
| `06-FUNCTIONALITIES.md` | Sí — el mejor ejemplo | Declara explícitamente qué no define (sección 1) y lo respeta en las 72 secciones siguientes. |
| `07-DATABASE.md` | Sí | Modelo conceptual; declara explícitamente que no define SQL. Coherente en todo su contenido. |
| `08-ENGINEERING-HANDBOOK.md` | Sí, con solapamiento | Ingeniería operativa; se superpone con `04-AI-RULES.md` en varias secciones (ver Duplicaciones). |
| `ROADMAP.md` | Sí | Secuenciación temporal; es el documento más orientado a acción concreta, sin mezclar doctrina ni arquitectura. |

# Información faltante

Antes de analizar `index.html`, sería útil (no obligatorio) resolver lo siguiente para que el diagnóstico técnico no arranque sobre una base ambigua:

1. **Cuál de los dos archivos de arquitectura es el vigente** (`05-ARCHITECTURE.md` o `05-ARCHITECTURE0.md`), ya que `ROADMAP.md` (sección 6, "Prompt para diagnóstico") instruye leer `05-ARCHITECTURE.md` antes de analizar el prototipo, y hoy esa referencia es ambigua.
2. **Una jerarquía documental única y definitiva**, para que cuando el diagnóstico de `index.html` encuentre comportamiento que contradiga la documentación, quede claro qué documento prevalece.
3. **Confirmación de si `docs/02-DESIGN-PHILOSOPHY.md` debe renombrarse a como aparece referenciado, o si las referencias deben corregirse** — actualmente ningún documento es "correcto" de forma unánime.
4. No es indispensable, pero sería conveniente **una nota que aclare que `legacy/`, `backups/`, `.gitignore` y el propio `README.md` en la raíz aún no existen** y pertenecen a la Fase 0 del Roadmap, para que quien abra el proyecto hoy no piense que faltan archivos por error.

No se detectó información de negocio, de producto ni de reglas de negocio faltante: la documentación funcional (`06-FUNCTIONALITIES.md`) y de datos (`07-DATABASE.md`) es, dentro de su propio alcance, inusualmente completa.

# Recomendaciones

En orden de prioridad:

1. **Resolver la duplicidad de `05-ARCHITECTURE.md` / `05-ARCHITECTURE0.md`.** Elegir una versión vigente y mover la otra fuera de `docs/` activo (p. ej. a un historial), o fusionar ambas si contienen ideas complementarias. Es el bloqueador más importante porque toda la jerarquía documental depende de un `05-ARCHITECTURE.md` sin ambigüedad.
2. **Unificar la jerarquía documental en un solo documento** (recomendado: `README.md`) y hacer que `04-AI-RULES.md` y `08-ENGINEERING-HANDBOOK.md` la referencien por enlace en vez de repetirla con variaciones.
3. **Corregir las tres referencias a `02-DESIGN-PHILOSOPHY.md`** para que apunten al nombre real del archivo, `02-PROYCUT-DESIGN-PHILOSOPHY.md` (o decidir formalmente renombrar el archivo real, si se prefiere el nombre corto — cualquiera de las dos opciones es válida, pero debe ser una sola).
4. **Unificar el "alcance inicial de datos"** entre `README.md`/`ROADMAP.md` y `07-DATABASE.md` sección 86, dejando una sola fuente de verdad (recomendado: `07-DATABASE.md`, por ser el documento de autoridad en modelo de datos).
5. **Retirar los fragmentos conversacionales sin editar** de `00-LIBRO-FUNDACIONAL.md` (líneas 39–56), `02-PROYCUT-DESIGN-PHILOSOPHY.md` (línea 144) y `03-PROYCUT-BLUEPRINT.md` (líneas 126–127, 191–192). No cambian el significado, pero delatan que el texto no ha pasado por una revisión editorial final.
6. **Sustituir los nombres de proveedores concretos (Stripe, Shopify, OpenAI, Claude) por descripciones genéricas** en `04-AI-RULES.md` sección 23 y en el archivo de arquitectura vigente, o aclarar explícitamente que son ejemplos ilustrativos y no decisiones de producto — para no contradecir el alcance inmediato definido en `README.md` y `ROADMAP.md`.
7. **Decidir cuál plantilla de propuesta/entrega de cambios es la oficial** (`04-AI-RULES.md` secciones 38–39, o `08-ENGINEERING-HANDBOOK.md` secciones 111–112), o declarar explícitamente que una es la versión resumida de la otra.
8. **Actualizar la sección "Estructura inicial del repositorio" de `README.md`** para distinguir claramente entre lo que existe hoy (`docs/`, `index.html`) y lo que es objetivo de la Fase 0 del Roadmap (`legacy/`, `backups/`, `.gitignore`, `README.md` en la raíz).
9. **Añadir el prefijo numérico a `ROADMAP.md`** (o documentar explícitamente por qué es la excepción) para mantener la previsibilidad del patrón `NN-NOMBRE.md`.
10. *(Menor, no urgente)* Unificar la cifra de "vigencia a futuro" (cinco vs. diez años) entre `01-DOCTRINA-PROYCUT.md` y `02-PROYCUT-DESIGN-PHILOSOPHY.md`.

# Propuesta de estructura documental definitiva

No se proponen tecnologías nuevas ni cambios de visión — únicamente resolución de duplicados, un archivo consolidado y nomenclatura consistente con lo que ya existe:

```
ProyCut/
├── README.md                          (movido a la raíz, según su propio texto)
├── index.html
├── .gitignore                         (pendiente de Fase 0)
│
├── docs/
│   ├── 00-LIBRO-FUNDACIONAL.md
│   ├── 01-DOCTRINA-PROYCUT.md
│   ├── 02-PROYCUT-DESIGN-PHILOSOPHY.md
│   ├── 03-PROYCUT-BLUEPRINT.md
│   ├── 04-AI-RULES.md
│   ├── 05-ARCHITECTURE.md             (una sola versión, resultado de fusionar/elegir entre la actual 05-ARCHITECTURE.md y 05-ARCHITECTURE0.md)
│   ├── 06-FUNCTIONALITIES.md
│   ├── 07-DATABASE.md
│   ├── 08-ENGINEERING-HANDBOOK.md
│   ├── 09-ROADMAP.md                  (renombrado, con prefijo numérico)
│   ├── DOCUMENTATION-AUDIT.md         (este documento)
│   │
│   └── adr/                           (carpeta ya referenciada por 05-ARCHITECTURE0.md y ROADMAP.md, aún no creada)
│
├── legacy/                            (pendiente de Fase 0, según ROADMAP.md)
│   └── index-original.html
│
└── backups/                           (pendiente de Fase 0, según ROADMAP.md)
```

Nota: esta propuesta no elimina ni reescribe contenido — únicamente reubica, renombra y consolida duplicados detectados, respetando la jerarquía y el contenido ya definidos por el equipo.

# Conclusión

**Requiere consolidación antes de comenzar.**

La visión, la doctrina y el alcance funcional de ProyCut son sólidos, coherentes entre sí y no requieren cambios de fondo. El bloqueador no es de producto ni de negocio: es que el propio sistema de documentación —cuyo trabajo es decir qué prevalece cuando hay dudas— hoy contiene una ambigüedad estructural (dos documentos de arquitectura con el mismo número y contenido incompatible) y tres definiciones distintas de su propia jerarquía de autoridad. Iniciar el diagnóstico de `index.html` sobre esa base obligaría a tomar decisiones de arquitectura implícitas y no documentadas para poder avanzar, exactamente lo que `04-AI-RULES.md` y `08-ENGINEERING-HANDBOOK.md` prohíben.

Las correcciones necesarias son puntuales, no estructurales: elegir un documento de arquitectura, unificar una jerarquía, corregir tres referencias de nombre y limpiar fragmentos de texto sin editar. Ninguna requiere reescribir contenido ni reconsiderar la visión del producto.
