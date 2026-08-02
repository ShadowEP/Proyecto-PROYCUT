DOCUMENTATION-INVENTORY.md
Inventario Maestro de Documentación de ProyCut

---
Estado: Aprobado (como fotografía puntual — ver "Nivel de estabilidad" de este mismo documento en la sección 2)
Versión: 1.0.0
Última actualización: 2026-08-01
Propósito: Servir de mapa maestro localizable de toda la documentación de ProyCut, para desarrolladores y agentes de IA.
Depende de: `docs/meta/DOCUMENTATION-STANDARD.md`
Referenciado por: Pendiente de mapear (documento nuevo)
Responsable: Documentation Governance Lead
---

Este documento observa, clasifica y describe la documentación existente de ProyCut al 2026-08-01. No corrige, no consolida y no inventa información: donde un dato no está declarado en el documento fuente (por ejemplo, un estado o una versión formal), se indica explícitamente como "no declarado" en vez de asumirse.

Se rige por `docs/meta/DOCUMENTATION-STANDARD.md`. Toda referencia en este documento sigue el formato de su sección 11.

# 1. Árbol oficial de documentación

```text
ProyCut/
├── README.md
│
├── index.html                                     (fuera del alcance de docs/)
│
└── docs/
    ├── vision/
    │   ├── 00-LIBRO-FUNDACIONAL.md
    │   ├── 01-DOCTRINA-PROYCUT.md
    │   ├── 02-DESIGN-PHILOSOPHY.md
    │   └── 03-PROYCUT-BLUEPRINT.md
    │
    ├── engineering/
    │   ├── 04-AI-RULES.md
    │   ├── 05-ARCHITECTURE.md
    │   ├── 06-FUNCTIONALITIES.md
    │   ├── 07-DATABASE.md
    │   ├── 08-ENGINEERING-HANDBOOK.md
    │   └── ROADMAP.md
    │
    └── meta/
        ├── DOCUMENTATION-STANDARD.md
        ├── DOCUMENTATION-INVENTORY.md              (este documento)
        ├── DOCUMENTATION-CONSOLIDATION-PLAN.md      (vacío — pendiente de desarrollo)
        └── DOCUMENTATION-AUDIT.md
```

14 documentos activos dentro de `docs/`, más `README.md` en la raíz. `docs/adr/` está referenciado desde `docs/engineering/ROADMAP.md` y `docs/engineering/05-ARCHITECTURE.md`, pero no existe todavía como carpeta.

# 2. Inventario detallado

## README.md
- **Ruta:** `README.md`
- **Estado documental:** No declarado (sin encabezado estándar).
- **Versión:** No declarada.
- **Propósito:** Punto de entrada del proyecto: estado actual, cómo abrirlo, jerarquía documental y flujo inicial obligatorio.
- **Responsabilidad exclusiva:** Onboarding operativo y mapa de navegación inicial — no doctrina, no arquitectura.
- **Depende de:** Todos los documentos de `docs/vision/` y `docs/engineering/` (los resume y enlaza).
- **Es referenciado por:** Ninguno detectado dentro de `docs/` (es el punto de entrada, no un documento citado desde dentro).
- **Completitud:** 80%. Enlaza correctamente los 10 documentos de `vision/`+`engineering/` con sus rutas actualizadas; su árbol de carpetas (sección "Estructura inicial del repositorio") sí incluye los 4 archivos de `meta/`, pero su sección narrativa "Documentación" no los presenta uno por uno como hace con los otros diez.
- **Nivel de estabilidad:** Media — cambia con el avance de fase del Roadmap (sección "Estado del proyecto").
- **Prioridad:** Alta (primer documento que lee cualquier persona o IA).
- **Observaciones:** Describe una estructura de repositorio (`legacy/`, `backups/`, `.gitignore`, README en la raíz) que a la fecha de este inventario ya incluye el README en la raíz, pero `legacy/`, `backups/` y `.gitignore` siguen sin existir físicamente — hallazgo ya registrado en `docs/meta/DOCUMENTATION-AUDIT.md`.

## docs/vision/00-LIBRO-FUNDACIONAL.md
- **Estado documental:** No declarado.
- **Versión:** No declarada.
- **Propósito:** Identidad, misión, visión y compromiso de ProyCut.
- **Responsabilidad exclusiva:** Por qué existe ProyCut. Nivel más alto de la jerarquía de contenido.
- **Depende de:** Ninguno — es la raíz de la jerarquía de contenido.
- **Es referenciado por:** `docs/vision/01-DOCTRINA-PROYCUT.md` (continuación conceptual); toda la jerarquía de forma indirecta (`docs/meta/DOCUMENTATION-STANDARD.md`, sección 4.1).
- **Completitud:** 90%. Prólogo, Convicción, Filosofía, Misión y Visión completos; conserva fragmentos de conversación sin depurar (líneas 39–56, incluida la palabra suelta "contnuemos" en la línea 54).
- **Nivel de estabilidad:** Alta — debería ser, por diseño, el documento que menos cambia de todos.
- **Prioridad:** Alta.
- **Observaciones:** Hallazgo ya registrado en `docs/meta/DOCUMENTATION-AUDIT.md`.

## docs/vision/01-DOCTRINA-PROYCUT.md
- **Estado documental:** No declarado.
- **Versión:** No declarada.
- **Propósito:** Cómo se piensa y se decide en ProyCut.
- **Responsabilidad exclusiva:** Criterios de decisión y evaluación de ideas.
- **Depende de:** `docs/vision/00-LIBRO-FUNDACIONAL.md`.
- **Es referenciado por:** `docs/engineering/06-FUNCTIONALITIES.md` (sus "Criterios de prioridad" siguen el mismo espíritu), cualquier propuesta de nueva función.
- **Completitud:** 95%. Nueve capítulos completos y coherentes.
- **Nivel de estabilidad:** Alta.
- **Prioridad:** Alta.
- **Observaciones:** Su criterio de "Escalabilidad" (Capítulo VI) fija la vigencia en diez años, cifra que difiere de la de `docs/vision/02-DESIGN-PHILOSOPHY.md` (ver Riesgos).

## docs/vision/02-DESIGN-PHILOSOPHY.md
- **Estado documental:** No declarado.
- **Versión:** No declarada.
- **Propósito:** Cómo debe sentirse y comunicarse la interfaz.
- **Responsabilidad exclusiva:** Filosofía de experiencia de usuario e interfaz.
- **Depende de:** `docs/vision/01-DOCTRINA-PROYCUT.md` (mismo tipo de criterio de aprobación).
- **Es referenciado por:** `docs/engineering/04-AI-RULES.md` (secciones 15 y 17, reglas de interfaz para la IA).
- **Completitud:** 90%. Diez principios, personalidad visual, "Regla de Oro del Diseño" y "Test ProyCut" completos; conserva un fragmento conversacional sin depurar (línea 144).
- **Nivel de estabilidad:** Alta.
- **Prioridad:** Media-Alta.
- **Observaciones:** Fue renombrado desde `02-PROYCUT-DESIGN-PHILOSOPHY.md` durante la reorganización a `vision/`; su título interno (línea 1) ya coincide con el nombre de archivo actual.

## docs/vision/03-PROYCUT-BLUEPRINT.md
- **Estado documental:** No declarado.
- **Versión:** No declarada.
- **Propósito:** El recorrido del usuario y los grandes módulos del sistema, a nivel conceptual.
- **Responsabilidad exclusiva:** Plano conceptual de producto, previo a la arquitectura técnica.
- **Depende de:** `docs/vision/00-LIBRO-FUNDACIONAL.md`, `docs/vision/01-DOCTRINA-PROYCUT.md`.
- **Es referenciado por:** `docs/engineering/05-ARCHITECTURE.md` (retoma "el Proyecto es el centro"), `docs/engineering/06-FUNCTIONALITIES.md` (detalla los módulos aquí enumerados).
- **Completitud:** 85%. "Cotizaciones" aparece como submódulo del pilar Comercial (sección 5) pero no en la lista de "grandes módulos" (sección 3); conserva dos fragmentos conversacionales sin depurar (líneas 126–127 y 191–192).
- **Nivel de estabilidad:** Alta.
- **Prioridad:** Alta.
- **Observaciones:** Hallazgos ya registrados en `docs/meta/DOCUMENTATION-AUDIT.md`.

## docs/engineering/04-AI-RULES.md
- **Estado documental:** No declarado.
- **Versión:** No declarada.
- **Propósito:** Reglas obligatorias para cualquier IA que participe en el proyecto.
- **Responsabilidad exclusiva:** Gobernanza del comportamiento de la IA.
- **Depende de:** `docs/vision/00-LIBRO-FUNDACIONAL.md` a `docs/vision/03-PROYCUT-BLUEPRINT.md` (los cita como jerarquía en su sección 2).
- **Es referenciado por:** `docs/engineering/ROADMAP.md` (regla 12: "Toda IA deberá leer docs/engineering/04-AI-RULES.md"); cualquier IA antes de actuar.
- **Completitud:** 90%. 40 secciones completas; duplica de forma casi literal contenido de `docs/engineering/08-ENGINEERING-HANDBOOK.md` (ejemplo de comentarios, convenciones de nombres, plantillas de propuesta/entrega) en vez de referenciarlo — contradice la sección 6 de `docs/meta/DOCUMENTATION-STANDARD.md`.
- **Nivel de estabilidad:** Media-Alta.
- **Prioridad:** Alta.
- **Observaciones:** Su sección 23 menciona "Supabase, Stripe, OpenAI, Claude, Shopify" como proveedores concretos. Su sección 2 ("Documentos de autoridad") no incluye `docs/engineering/08-ENGINEERING-HANDBOOK.md` ni `docs/engineering/ROADMAP.md`.

## docs/engineering/05-ARCHITECTURE.md
- **Estado documental:** No declarado.
- **Versión:** No declarada.
- **Propósito:** El plano técnico único de ProyCut.
- **Responsabilidad exclusiva:** Arquitectura técnica (capas, dominio, módulos, dependencias).
- **Depende de:** `docs/vision/03-PROYCUT-BLUEPRINT.md`.
- **Es referenciado por:** `docs/engineering/04-AI-RULES.md` (secciones 11 y 23); cualquier módulo nuevo.
- **Completitud:** 95%. Documento extenso (999 líneas), internamente coherente: cinco capas (Presentación, Aplicación, Dominio, Infraestructura, Plataforma), entidades, casos de uso, ADRs, checklist arquitectónico de 20 puntos.
- **Nivel de estabilidad:** Alta ahora — este archivo reemplazó, en algún punto entre la auditoría documental previa y esta entrega, a una versión distinta de 229 líneas que coexistió bajo el mismo número. La sustitución ya ocurrió; el riesgo de duplicidad detectado por `docs/meta/DOCUMENTATION-AUDIT.md` está resuelto de facto.
- **Prioridad:** Alta.
- **Observaciones:** No existe ningún ADR ni nota de versión que documente por qué o cuándo se reemplazó el contenido anterior — la sustitución no dejó rastro documental, lo cual contradice la propia sección 91 de `docs/engineering/08-ENGINEERING-HANDBOOK.md` ("Se deberá crear un ADR... cuando una decisión... introduzca proveedor estratégico [o] cambie límites"). Menciona "Stripe. OpenAI. Claude. Shopify." como ejemplos de proveedor reemplazable.

## docs/engineering/06-FUNCTIONALITIES.md
- **Estado documental:** No declarado.
- **Versión:** No declarada.
- **Propósito:** Catálogo funcional completo de ProyCut.
- **Responsabilidad exclusiva:** Qué debe poder hacer el producto — explícitamente no define tecnologías, tablas, endpoints ni componentes visuales.
- **Depende de:** `docs/vision/03-PROYCUT-BLUEPRINT.md`.
- **Es referenciado por:** `docs/engineering/07-DATABASE.md` (cada entidad corresponde a una funcionalidad aquí descrita); `docs/engineering/ROADMAP.md` (secuencia qué se construye primero).
- **Completitud:** 95%. 72 secciones; declara explícitamente sus límites en la sección 1 y los respeta en todo el documento.
- **Nivel de estabilidad:** Media — 2073 líneas en un único archivo dificultan su mantenimiento y localización de secciones.
- **Prioridad:** Alta.
- **Observaciones:** Es, según `docs/meta/DOCUMENTATION-AUDIT.md`, el documento con mejor separación de responsabilidades del conjunto. Candidato a dividirse por dominio (comercial, producción, calidad) sin perder valor — no se propone aquí esa división, solo se deja constancia de que ya fue señalada.

## docs/engineering/07-DATABASE.md
- **Estado documental:** No declarado.
- **Versión:** No declarada.
- **Propósito:** Modelo conceptual de datos.
- **Responsabilidad exclusiva:** Entidades, relaciones, reglas de integridad — explícitamente no define SQL definitivo.
- **Depende de:** `docs/engineering/06-FUNCTIONALITIES.md`.
- **Es referenciado por:** Cualquier migración o repositorio de persistencia futuro.
- **Completitud:** 90%. Modelo muy completo (~90 entidades en 17 dominios); su sección 86 ("Orden recomendado de implementación") define una Etapa 1 distinta de la que proponen `README.md` y `docs/engineering/ROADMAP.md` para el mismo momento del proyecto.
- **Nivel de estabilidad:** Alta.
- **Prioridad:** Alta.
- **Observaciones:** Contradicción abierta, ya señalada en `docs/meta/DOCUMENTATION-AUDIT.md` y todavía sin resolver (ver Riesgos).

## docs/engineering/08-ENGINEERING-HANDBOOK.md
- **Estado documental:** No declarado.
- **Versión:** No declarada.
- **Propósito:** Normas de ingeniería para desarrollo, revisión y operación.
- **Responsabilidad exclusiva:** Práctica de ingeniería aplicable a cualquier persona o sistema que escriba código.
- **Depende de:** `docs/engineering/05-ARCHITECTURE.md`.
- **Es referenciado por:** `docs/engineering/04-AI-RULES.md` (superposición parcial de contenido).
- **Completitud:** 95%. 115 secciones; el documento de mayor densidad temática del conjunto (convenciones, pruebas, Git, CI/CD, observabilidad, incidentes, Definition of Done).
- **Nivel de estabilidad:** Media-Alta.
- **Prioridad:** Alta.
- **Observaciones:** Su sección 3 ("Orden de autoridad") no incluye `docs/engineering/ROADMAP.md` y agrega "ADR vigentes" como nivel propio, distinto tanto de `README.md` como de `docs/engineering/04-AI-RULES.md` (ver Riesgos).

## docs/engineering/ROADMAP.md
- **Estado documental:** No declarado.
- **Versión:** No declarada.
- **Propósito:** Orden de trabajo y fases de reorganización/desarrollo.
- **Responsabilidad exclusiva:** Secuencia temporal — no doctrina, no arquitectura, no catálogo funcional.
- **Depende de:** Todos los documentos anteriores en la jerarquía de contenido.
- **Es referenciado por:** `README.md` (repite parcialmente su "flujo inicial obligatorio").
- **Completitud:** 90%. 19 fases (0–18) con criterios de salida definidos; el documento más orientado a acción concreta del conjunto.
- **Nivel de estabilidad:** Baja — por diseño, es el documento que más debe actualizarse a medida que el proyecto avanza de fase.
- **Prioridad:** Alta.
- **Observaciones:** Es el único documento de `vision/`+`engineering/` sin prefijo numérico en su nombre; `docs/meta/DOCUMENTATION-STANDARD.md` (sección 7) ya formalizó esa ausencia como una convención intencional para documentos de proceso continuo, no como un defecto pendiente de corregir.

## docs/meta/DOCUMENTATION-STANDARD.md
- **Estado documental declarado:** Aprobado.
- **Versión declarada:** 1.0.0.
- **Propósito:** Definir cómo debe escribirse, organizarse, referenciarse y evolucionar toda la documentación de ProyCut.
- **Responsabilidad exclusiva:** Gobernanza documental — no describe producto.
- **Depende de:** `docs/vision/00-LIBRO-FUNDACIONAL.md` (principios filosóficos, no autoridad de contenido).
- **Es referenciado por:** Este mismo inventario (matriz de autoridad, sección 4); en adelante, todo documento que adopte el encabezado estándar.
- **Completitud:** 100% en contenido propio (sus 20 secciones están completas); 0% en adopción — ningún otro documento del proyecto usa todavía el encabezado que define en su sección 8, ni referencia su sección 4.1 en vez de repetir su propia jerarquía.
- **Nivel de estabilidad:** Alta, por diseño (sección 19: "nunca se congela por respeto a su propia autoridad", pero cambia solo cuando deja de ajustarse a la realidad).
- **Prioridad:** Alta.
- **Observaciones:** En su propia sección 5 ("Responsabilidad exclusiva"), varias menciones a otros documentos usan el nombre de archivo sin la ruta completa (por ejemplo, "05-ARCHITECTURE.md" en vez de "`docs/engineering/05-ARCHITECTURE.md`"), lo cual no sigue estrictamente el formato que su propia sección 11 exige (ver Riesgos).

## docs/meta/DOCUMENTATION-INVENTORY.md (este documento)
- **Estado documental declarado:** Aprobado, como fotografía puntual.
- **Versión declarada:** 1.0.0.
- **Propósito:** Inventario maestro localizable de toda la documentación de ProyCut.
- **Responsabilidad exclusiva:** Describir la documentación — no el producto, no las decisiones de consolidación.
- **Depende de:** `docs/meta/DOCUMENTATION-STANDARD.md`.
- **Es referenciado por:** Pendiente de mapear (documento nuevo).
- **Completitud:** 100% respecto del alcance de esta entrega: los 14 documentos existentes en `docs/` al momento de escribirse quedaron inventariados.
- **Nivel de estabilidad:** Baja — es una fotografía puntual; queda desactualizado en cuanto cualquier documento cambie de estado, versión o ubicación. No se edita para reflejar drift; se regenera como versión nueva.
- **Prioridad:** Alta — es el mapa que hace localizable a todo lo demás.
- **Observaciones:** Ninguna.

## docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md
- **Estado documental:** No declarado (placeholder explícito: "Pendiente de desarrollo").
- **Versión:** No declarada.
- **Propósito declarado:** Definir el plan para resolver las duplicaciones, contradicciones e inconsistencias identificadas en `docs/meta/DOCUMENTATION-AUDIT.md`.
- **Responsabilidad exclusiva:** Plan de acción — no diagnóstico (eso es `DOCUMENTATION-AUDIT.md`).
- **Depende de:** `docs/meta/DOCUMENTATION-AUDIT.md`.
- **Es referenciado por:** Nadie todavía.
- **Completitud:** 0%. Archivo vacío con encabezado de "pendiente de desarrollo".
- **Nivel de estabilidad:** No aplica (sin contenido).
- **Prioridad:** Alta para desarrollarse a continuación (ver Resumen ejecutivo).
- **Observaciones:** Existen al menos seis hallazgos abiertos en `docs/meta/DOCUMENTATION-AUDIT.md` (y varios más detectados por este mismo inventario en la sección de Riesgos) sin una acción de consolidación registrada todavía.

## docs/meta/DOCUMENTATION-AUDIT.md
- **Estado documental:** No declarado formalmente (sin encabezado), pero su propio contenido concluye con un veredicto explícito: "Requiere consolidación antes de comenzar".
- **Versión:** No declarada.
- **Propósito:** Diagnóstico histórico de congruencia documental, en un momento dado.
- **Responsabilidad exclusiva:** Diagnóstico — no plan de acción.
- **Depende de:** Los 12 documentos que auditó (`README.md` y los 11 documentos entonces existentes en `docs/`, antes de la reorganización a `vision/`+`engineering/`+`meta/`).
- **Es referenciado por:** `docs/meta/DOCUMENTATION-STANDARD.md` (como caso de estudio, secciones 1, 7 y 16); este inventario.
- **Completitud:** 100% respecto de su propio alcance declarado (excluye explícitamente `index.html`).
- **Nivel de estabilidad:** Alta — por regla de `docs/meta/DOCUMENTATION-STANDARD.md` (sección 5), nunca se edita retroactivamente; una auditoría nueva se registra como versión o documento nuevo.
- **Prioridad:** Media — ya cumplió su función inmediata; su valor actual es servir de insumo directo a `docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md`.
- **Observaciones:** Fue escrito antes de la reorganización a `vision/`+`engineering/`+`meta/`; sus rutas citadas (por ejemplo, `docs/05-ARCHITECTURE.md` sin carpeta) reflejan la estructura anterior a esta y, por la regla anterior, no deben actualizarse retroactivamente.

# 3. Matriz de dependencias

Qué documento lee o utiliza a cuál, según lo declarado en la sección 2:

| Documento | Depende de | Es referenciado por |
|---|---|---|
| `README.md` | `vision/00-03`, `engineering/04-08`, `ROADMAP.md` | — |
| `docs/vision/00-LIBRO-FUNDACIONAL.md` | — | `01-DOCTRINA-PROYCUT.md`; toda la jerarquía |
| `docs/vision/01-DOCTRINA-PROYCUT.md` | `00-LIBRO-FUNDACIONAL.md` | `06-FUNCTIONALITIES.md` |
| `docs/vision/02-DESIGN-PHILOSOPHY.md` | `01-DOCTRINA-PROYCUT.md` | `04-AI-RULES.md` |
| `docs/vision/03-PROYCUT-BLUEPRINT.md` | `00-LIBRO-FUNDACIONAL.md`, `01-DOCTRINA-PROYCUT.md` | `05-ARCHITECTURE.md`, `06-FUNCTIONALITIES.md` |
| `docs/engineering/04-AI-RULES.md` | `vision/00-03` | `ROADMAP.md` |
| `docs/engineering/05-ARCHITECTURE.md` | `03-PROYCUT-BLUEPRINT.md` | `04-AI-RULES.md` |
| `docs/engineering/06-FUNCTIONALITIES.md` | `03-PROYCUT-BLUEPRINT.md` | `07-DATABASE.md`, `ROADMAP.md` |
| `docs/engineering/07-DATABASE.md` | `06-FUNCTIONALITIES.md` | migraciones futuras (no documental) |
| `docs/engineering/08-ENGINEERING-HANDBOOK.md` | `05-ARCHITECTURE.md` | `04-AI-RULES.md` (parcial) |
| `docs/engineering/ROADMAP.md` | Toda la jerarquía de contenido anterior | `README.md` |
| `docs/meta/DOCUMENTATION-STANDARD.md` | `00-LIBRO-FUNDACIONAL.md` (principios) | Este inventario; futuros documentos con encabezado |
| `docs/meta/DOCUMENTATION-INVENTORY.md` | `DOCUMENTATION-STANDARD.md` | Pendiente de mapear |
| `docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md` | `DOCUMENTATION-AUDIT.md` | Nadie todavía |
| `docs/meta/DOCUMENTATION-AUDIT.md` | Los 12 documentos que auditó | `DOCUMENTATION-STANDARD.md`, este inventario |

# 4. Matriz de autoridad

Esta matriz **no es una segunda fuente de verdad**: es una vista de consulta rápida, generada a partir de `docs/meta/DOCUMENTATION-STANDARD.md`, secciones 4.1 y 4.2. Si en el futuro cambia la jerarquía, se edita primero el Estándar y esta tabla se regenera a partir de él — nunca al revés. (Esta tensión entre "reproducir la matriz" y la propia regla de "no duplicar jerarquías" del Estándar se deja registrada como riesgo en la sección 6.)

## 4.1 Jerarquía de contenido (producto)

| # | Documento |
|---|---|
| 1 | `docs/vision/00-LIBRO-FUNDACIONAL.md` |
| 2 | `docs/vision/01-DOCTRINA-PROYCUT.md` |
| 3 | `docs/vision/02-DESIGN-PHILOSOPHY.md` |
| 4 | `docs/vision/03-PROYCUT-BLUEPRINT.md` |
| 5 | `docs/engineering/04-AI-RULES.md` |
| 6 | `docs/engineering/05-ARCHITECTURE.md` |
| 7 | `docs/engineering/06-FUNCTIONALITIES.md` |
| 8 | `docs/engineering/07-DATABASE.md` |
| 9 | `docs/engineering/08-ENGINEERING-HANDBOOK.md` |
| 10 | `docs/engineering/ROADMAP.md` |
| 11 | ADR vigentes (`docs/adr/`) |
| 12 | Documentación específica de un módulo |
| 13 | Código y pruebas existentes |

## 4.2 Jerarquía de gobernanza documental

| # | Documento |
|---|---|
| 1 | `docs/meta/DOCUMENTATION-STANDARD.md` |
| 2 | `docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md` |
| 3 | `docs/meta/DOCUMENTATION-INVENTORY.md` |
| 4 | `docs/meta/DOCUMENTATION-AUDIT.md` |

# 5. Cobertura documental

| Documento | Categoría |
|---|---|
| `docs/vision/00-LIBRO-FUNDACIONAL.md` | Identidad |
| `docs/vision/01-DOCTRINA-PROYCUT.md` | Identidad |
| `docs/vision/02-DESIGN-PHILOSOPHY.md` | Producto |
| `docs/vision/03-PROYCUT-BLUEPRINT.md` | Producto |
| `docs/engineering/04-AI-RULES.md` | Ingeniería |
| `docs/engineering/05-ARCHITECTURE.md` | Arquitectura |
| `docs/engineering/06-FUNCTIONALITIES.md` | Producto |
| `docs/engineering/07-DATABASE.md` | Datos |
| `docs/engineering/08-ENGINEERING-HANDBOOK.md` | Desarrollo |
| `docs/engineering/ROADMAP.md` | Planificación |
| `docs/meta/DOCUMENTATION-STANDARD.md` | Gobierno documental |
| `docs/meta/DOCUMENTATION-INVENTORY.md` | Gobierno documental |
| `docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md` | Gobierno documental |
| `docs/meta/DOCUMENTATION-AUDIT.md` | Gobierno documental |
| `README.md` | Transversal — no encaja en una sola categoría de las ocho definidas; funciona como onboarding operativo que toca Identidad, Producto e Ingeniería a la vez. Se deja indicado en vez de forzarlo a una categoría. |

# 6. Estado general

| Documento | Clasificación | Justificación |
|---|---|---|
| `README.md` | Casi completo | Enlaza correctamente los 10 documentos de `vision/`+`engineering/`, pero no presenta narrativamente los 4 de `meta/` y describe carpetas (`legacy/`, `backups/`, `.gitignore`) que aún no existen. |
| `docs/vision/00-LIBRO-FUNDACIONAL.md` | Casi completo | Contenido íntegro, pero conserva fragmentos de conversación sin depurar. |
| `docs/vision/01-DOCTRINA-PROYCUT.md` | Completo | Nueve capítulos coherentes, sin fragmentos ni vacíos detectados. |
| `docs/vision/02-DESIGN-PHILOSOPHY.md` | Casi completo | Contenido íntegro, pero conserva un fragmento de conversación sin depurar. |
| `docs/vision/03-PROYCUT-BLUEPRINT.md` | Casi completo | Fragmentos conversacionales sin depurar y una inconsistencia interna ("Cotizaciones" no aparece en la lista principal de módulos). |
| `docs/engineering/04-AI-RULES.md` | Requiere revisión | Duplica contenido de `08-ENGINEERING-HANDBOOK.md` en vez de referenciarlo; nombra proveedores externos no aprobados como decisión; su jerarquía interna omite dos documentos oficiales. |
| `docs/engineering/05-ARCHITECTURE.md` | Casi completo | Contenido sólido y coherente, pero su historial de sustitución no está documentado mediante ADR. |
| `docs/engineering/06-FUNCTIONALITIES.md` | Completo | Cumple su propio alcance declarado sin excepciones detectadas. |
| `docs/engineering/07-DATABASE.md` | Requiere revisión | Contradice a `README.md`/`ROADMAP.md` en el alcance inicial de datos (Etapa 1). |
| `docs/engineering/08-ENGINEERING-HANDBOOK.md` | Casi completo | Contenido extenso y sólido, pero su jerarquía interna no coincide con la de `README.md` ni con la de `04-AI-RULES.md`. |
| `docs/engineering/ROADMAP.md` | Completo | Cumple su función de documento vivo; su naturaleza es estar siempre vigente, no "terminado" en sentido estático. |
| `docs/meta/DOCUMENTATION-STANDARD.md` | Completo | Cumple las 20 secciones solicitadas y su propio checklist de calidad (sección 17), salvo por el formato de referencia interno señalado en Riesgos. |
| `docs/meta/DOCUMENTATION-INVENTORY.md` | Completo | Cumple el alcance de esta entrega. |
| `docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md` | Borrador | Placeholder vacío, explícitamente marcado como "pendiente de desarrollo". |
| `docs/meta/DOCUMENTATION-AUDIT.md` | Completo | Cumple el alcance que declaró desde su origen. |

# 7. Riesgos

**Documentos con posibles duplicaciones:**
- `docs/engineering/04-AI-RULES.md` y `docs/engineering/08-ENGINEERING-HANDBOOK.md` comparten, casi de forma literal, el ejemplo de comentario de código ("Incrementar contador"), las convenciones de nombres y dos plantillas distintas para el mismo propósito (proponer/entregar un cambio) — ya registrado en `docs/meta/DOCUMENTATION-AUDIT.md`.
- Los checklists de aprobación de `docs/vision/00-LIBRO-FUNDACIONAL.md`, `01-DOCTRINA-PROYCUT.md`, `02-DESIGN-PHILOSOPHY.md` y `docs/engineering/06-FUNCTIONALITIES.md` siguen siendo cinco variantes independientes del mismo tipo de pregunta, sin una referencia cruzada entre ellas.

**Documentos que aún no cumplen totalmente el estándar:**
- 13 de los 14 documentos de `docs/` no tienen el encabezado oficial definido en `docs/meta/DOCUMENTATION-STANDARD.md`, sección 8.
- El propio `docs/meta/DOCUMENTATION-STANDARD.md` no sigue estrictamente su sección 11 (formato de referencia) en varias menciones dentro de su sección 5, donde cita otros documentos por nombre de archivo sin ruta completa.
- `README.md`, `docs/engineering/04-AI-RULES.md` y `docs/engineering/08-ENGINEERING-HANDBOOK.md` mantienen cada uno su propia lista de jerarquía de contenido en vez de referenciar `docs/meta/DOCUMENTATION-STANDARD.md`, sección 4.1, tal como esa misma sección exige ("Ningún otro documento debe repetir esta lista completa; debe referenciar esta sección"). Las tres listas, además, siguen sin coincidir exactamente entre sí en cuántos y cuáles documentos incluyen.

**Documentos sin encabezado oficial:** todos excepto `docs/meta/DOCUMENTATION-STANDARD.md` (13 de 14).

**Referencias antiguas:**
- `docs/meta/DOCUMENTATION-AUDIT.md` cita rutas previas a la reorganización (por ejemplo, `docs/05-ARCHITECTURE.md` sin carpeta, o `docs/README.md`). Esto es intencional y correcto según la regla de no edición retroactiva (sección 5 de `docs/meta/DOCUMENTATION-STANDARD.md`), no un defecto a corregir.

**Referencias a documentos que todavía no existen** (entregables futuros ya previstos, no errores):
- `docs/CURRENT-STATE.md`, `docs/REFACTOR-PLAN.md` y `docs/MANUAL-TESTS.md`, citados en `README.md` y `docs/engineering/ROADMAP.md` como parte de la Fase 1.
- `docs/adr/` (y sus archivos de ejemplo `0001-arquitectura-modular.md`, etc.), citado en `docs/engineering/ROADMAP.md` (Fase 8) y en `docs/engineering/05-ARCHITECTURE.md` (sección 39).

**Posibles conflictos** (todos ya detectados por `docs/meta/DOCUMENTATION-AUDIT.md`; ninguno resuelto a la fecha de este inventario):
- Alcance inicial de datos: `README.md`/`docs/engineering/ROADMAP.md` (companies, users, company_users, clients, projects) frente a `docs/engineering/07-DATABASE.md`, sección 86 (companies, users, company_users, roles, permissions, branches, settings, audit_events).
- Criterio de "vigencia a futuro": diez años (`docs/vision/01-DOCTRINA-PROYCUT.md`) frente a cinco años (`docs/vision/02-DESIGN-PHILOSOPHY.md`).
- Proveedores externos nombrados como si fueran decisión (Stripe, Shopify, OpenAI, Claude) en `docs/engineering/04-AI-RULES.md` y `docs/engineering/05-ARCHITECTURE.md`, frente al alcance inmediato de `README.md` y `docs/engineering/ROADMAP.md`, que los excluye por ahora.
- `docs/engineering/05-ARCHITECTURE.md` fue reemplazado en algún momento sin dejar rastro documental (ni ADR ni nota de versión) — cumple la letra de "un solo documento con este nombre", pero no la práctica de trazabilidad que el propio proyecto exige en otros lugares.

# 8. Resumen ejecutivo

**¿La documentación ya puede utilizarse para desarrollar ProyCut?**
Parcialmente. La visión, el catálogo funcional y el modelo de datos son sólidos y usables como referencia diaria. Pero persisten contradicciones sin resolver — alcance inicial de datos, jerarquía documental todavía triplicada, proveedores no aprobados presentados como decisión — que `docs/meta/DOCUMENTATION-AUDIT.md` ya señaló y que `docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md`, todavía vacío, no ha resuelto. Puede empezar a usarse citando siempre `docs/meta/DOCUMENTATION-STANDARD.md`, sección 4.1, como criterio de desempate ante cualquier duda, pero no debe tratarse como una base cerrada.

**¿Qué porcentaje de madurez documental tiene el proyecto?**
No es un solo número — hay dos dimensiones y conviene no mezclarlas. La **madurez de contenido** (qué tan completo y coherente es lo escrito en cada documento) ronda el 85–90%, con los diez documentos de `vision/`+`engineering/` en su mayoría "Completo" o "Casi completo" (sección 6). La **madurez de gobernanza** (qué tan adoptado está el sistema que acaba de crearse) es baja, cercana al 30–35%: el Estándar existe pero ningún documento adoptó todavía su encabezado, y las tres jerarquías divergentes preexistentes no fueron reemplazadas por una referencia a la jerarquía única.

**¿Cuáles son los tres documentos más importantes?**
1. `docs/meta/DOCUMENTATION-STANDARD.md` — gobierna cómo se comportan todos los demás.
2. `docs/vision/00-LIBRO-FUNDACIONAL.md` — autoridad máxima de la jerarquía de contenido; todo lo demás se justifica en función de él.
3. `docs/engineering/ROADMAP.md` — es el documento de consulta más frecuente en el día a día, porque responde "qué sigue" en cualquier momento del proyecto.

**¿Qué documento debería consolidarse primero?**
`docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md` debería ser el primero en desarrollarse: está vacío y es exactamente el documento diseñado para resolver, de forma ordenada, los riesgos ya identificados tanto por `docs/meta/DOCUMENTATION-AUDIT.md` como por la sección 7 de este inventario. Dentro de esos riesgos, la acción individual de mayor apalancamiento es unificar las tres jerarquías de contenido divergentes (`README.md`, `docs/engineering/04-AI-RULES.md`, `docs/engineering/08-ENGINEERING-HANDBOOK.md`) para que las tres referencien `docs/meta/DOCUMENTATION-STANDARD.md`, sección 4.1, en vez de mantener cada una su propia versión — porque de esa jerarquía única depende, en última instancia, la resolución ordenada de cualquier otra contradicción del proyecto.
