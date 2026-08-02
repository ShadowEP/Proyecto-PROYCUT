DOCUMENTATION-NORMALIZATION-REPORT.md
Informe de Normalización de Documentación de ProyCut

Fecha: 2026-08-01
Ejecutado bajo la autoridad de: `docs/meta/DOCUMENTATION-STANDARD.md`
Alcance: `README.md`, `docs/vision/`, `docs/engineering/`. No se tocó `docs/meta/` (excepto la creación de este reporte) ni `index.html`.

Este informe documenta una normalización **estructural**, no de contenido. Ningún significado técnico, regla de negocio, principio de diseño, decisión de arquitectura ni funcionalidad fue alterado. Los cambios se limitaron a: encabezado oficial, eliminación de listas de jerarquía duplicadas, eliminación de frases conversacionales, y verificación de referencias.

# Archivos modificados

11 documentos, la totalidad del alcance solicitado:

1. `README.md`
2. `docs/vision/00-LIBRO-FUNDACIONAL.md`
3. `docs/vision/01-DOCTRINA-PROYCUT.md`
4. `docs/vision/02-DESIGN-PHILOSOPHY.md`
5. `docs/vision/03-PROYCUT-BLUEPRINT.md`
6. `docs/engineering/04-AI-RULES.md`
7. `docs/engineering/05-ARCHITECTURE.md`
8. `docs/engineering/06-FUNCTIONALITIES.md`
9. `docs/engineering/07-DATABASE.md`
10. `docs/engineering/08-ENGINEERING-HANDBOOK.md`
11. `docs/engineering/ROADMAP.md`

Ningún archivo de `docs/meta/` fue modificado (se consultaron `DOCUMENTATION-STANDARD.md`, `DOCUMENTATION-INVENTORY.md` y `DOCUMENTATION-AUDIT.md` como fuente de los valores inferidos). `index.html` no fue leído ni tocado.

# Encabezados agregados

Se agregó el encabezado oficial, en el formato Markdown solicitado para esta tarea (`# Nombre` + secciones `##`), a los 11 documentos listados arriba. Ninguno de los 11 tenía previamente un encabezado de este tipo. El encabezado se insertó **antes** del título original de cada documento, sin eliminar ni modificar ese título — se agregó, no se reemplazó.

| Documento | Depende de | Referenciado por | Responsable |
|---|---|---|---|
| `README.md` | 10 documentos de vision/engineering (listados en el encabezado) | PENDIENTE | PENDIENTE |
| `docs/vision/00-LIBRO-FUNDACIONAL.md` | PENDIENTE | `01-DOCTRINA-PROYCUT.md`; jerarquía completa (indirecto) | PENDIENTE |
| `docs/vision/01-DOCTRINA-PROYCUT.md` | `00-LIBRO-FUNDACIONAL.md` | `06-FUNCTIONALITIES.md` (en espíritu) | PENDIENTE |
| `docs/vision/02-DESIGN-PHILOSOPHY.md` | `01-DOCTRINA-PROYCUT.md` | `04-AI-RULES.md` (secciones 15, 17) | PENDIENTE |
| `docs/vision/03-PROYCUT-BLUEPRINT.md` | `00-LIBRO-FUNDACIONAL.md`, `01-DOCTRINA-PROYCUT.md` | `05-ARCHITECTURE.md`, `06-FUNCTIONALITIES.md` | PENDIENTE |
| `docs/engineering/04-AI-RULES.md` | `vision/00` a `vision/03` | `ROADMAP.md` (regla 12) | PENDIENTE |
| `docs/engineering/05-ARCHITECTURE.md` | `03-PROYCUT-BLUEPRINT.md` | `04-AI-RULES.md` (secciones 11, 23) | PENDIENTE |
| `docs/engineering/06-FUNCTIONALITIES.md` | `03-PROYCUT-BLUEPRINT.md` | `07-DATABASE.md`, `ROADMAP.md` | PENDIENTE |
| `docs/engineering/07-DATABASE.md` | `06-FUNCTIONALITIES.md` | PENDIENTE | PENDIENTE |
| `docs/engineering/08-ENGINEERING-HANDBOOK.md` | `05-ARCHITECTURE.md` | `04-AI-RULES.md` (parcial) | PENDIENTE |
| `docs/engineering/ROADMAP.md` | Toda la jerarquía de contenido | `README.md` | PENDIENTE |

Todos los valores de "Depende de" y "Referenciado por" se tomaron de relaciones ya observadas y documentadas en `docs/meta/DOCUMENTATION-INVENTORY.md` (secciones 2 y 3) — ninguno fue inferido de nuevo para esta tarea. Donde esa relación no estaba clara, se dejó "PENDIENTE" en vez de inventarse. **Ningún documento tiene un "Responsable" asignado**, porque ningún documento fuente del proyecto define propietarios individuales o por rol — se marcó "PENDIENTE" en los 11 casos, de forma consistente.

# Versiones asignadas

| Documento | Versión | Justificación |
|---|---|---|
| `README.md` | 0.9 | Clasificado "Casi completo" en `DOCUMENTATION-INVENTORY.md` (§6). |
| `docs/vision/00-LIBRO-FUNDACIONAL.md` | 0.9 | "Casi completo" — contenido íntegro salvo el fragmento ya retirado en esta misma tarea. |
| `docs/vision/01-DOCTRINA-PROYCUT.md` | 1.0 | "Completo" — sin hallazgos de vacío o fragmento. |
| `docs/vision/02-DESIGN-PHILOSOPHY.md` | 0.9 | "Casi completo". |
| `docs/vision/03-PROYCUT-BLUEPRINT.md` | 0.9 | "Casi completo" — persiste la inconsistencia de "Cotizaciones" no listada como módulo principal (no corregida en esta tarea, es contenido). |
| `docs/engineering/04-AI-RULES.md` | 0.9 | Completitud 90% según inventario, pese a estar clasificado "Requiere revisión" por duplicación de contenido (ver Riesgos). |
| `docs/engineering/05-ARCHITECTURE.md` | 0.9 | "Casi completo" — contenido sólido, sin ADR que respalde su propia sustitución. |
| `docs/engineering/06-FUNCTIONALITIES.md` | 1.0 | "Completo" — cumple su propio alcance declarado sin excepciones. |
| `docs/engineering/07-DATABASE.md` | 0.9 | Completitud 90%, clasificado "Requiere revisión" por la contradicción de Etapa 1 con README/ROADMAP. |
| `docs/engineering/08-ENGINEERING-HANDBOOK.md` | 0.9 | "Casi completo". |
| `docs/engineering/ROADMAP.md` | 1.0 | "Completo" — cumple su función de documento vivo. |

Ninguna versión se fijó por encima de 1.0, conforme a la instrucción de no inventar versiones altas. La escala (1.0 / 0.9 / 0.5) se aplicó reutilizando, sin reinterpretar, las clasificaciones ya publicadas en `docs/meta/DOCUMENTATION-INVENTORY.md`; ningún documento de este alcance calificó para 0.5.

# Estados asignados

| Documento | Estado | Justificación |
|---|---|---|
| `README.md` | En revisión | Casi completo; no presenta narrativamente los 4 documentos de `meta/`. |
| `docs/vision/00-LIBRO-FUNDACIONAL.md` | En revisión | El fragmento conversacional ya fue retirado en esta tarea, pero el documento no ha sido reaprobado formalmente tras el cambio. |
| `docs/vision/01-DOCTRINA-PROYCUT.md` | Aprobado | Sin hallazgos abiertos que impidan tratarlo como autoritativo. |
| `docs/vision/02-DESIGN-PHILOSOPHY.md` | En revisión | Igual razón que 00: contenido corregido en esta tarea, pendiente de reaprobación formal. |
| `docs/vision/03-PROYCUT-BLUEPRINT.md` | En revisión | Persiste la inconsistencia de "Cotizaciones" (contenido, no tocado aquí). |
| `docs/engineering/04-AI-RULES.md` | En revisión | Duplica contenido de `08-ENGINEERING-HANDBOOK.md`; nombra proveedores no aprobados como decisión. |
| `docs/engineering/05-ARCHITECTURE.md` | En revisión | Sin ADR que respalde su propia sustitución de contenido. |
| `docs/engineering/06-FUNCTIONALITIES.md` | Aprobado | Cumple su propio alcance declarado. |
| `docs/engineering/07-DATABASE.md` | En revisión | Contradice a README/ROADMAP en el alcance inicial de datos. |
| `docs/engineering/08-ENGINEERING-HANDBOOK.md` | En revisión | Su jerarquía interna (ya sustituida por una referencia en esta tarea) no incluía antes a `ROADMAP.md`; pendiente de una revisión de contenido más amplia. |
| `docs/engineering/ROADMAP.md` | Aprobado | Cumple su función de documento vivo; sin hallazgos de contenido abiertos. |

Ningún documento se marcó "Obsoleto" ni "Archivado": los 11 están vigentes y en uso.

# Referencias corregidas

**Cero referencias nuevas corregidas en esta tarea.** Se verificó — mediante búsqueda exhaustiva sobre los 11 documentos — que todas las referencias a otros documentos ya usan la estructura `docs/vision/`, `docs/engineering/` o `docs/meta/`, porque esa corrección ya se había realizado íntegramente durante la reorganización física previa (creación de las carpetas `vision/`, `engineering/` y `meta/`). No se encontró ninguna referencia residual sin prefijo de carpeta.

# Jerarquías eliminadas

Se eliminaron las tres listas numeradas de jerarquía documental que existían dentro de `vision/`+`engineering/`, reemplazándolas por una referencia breve, exactamente como se especificó:

| Documento | Sección afectada | Reemplazo |
|---|---|---|
| `README.md` | "Jerarquía documental" | `> La jerarquía documental oficial se encuentra en \`docs/meta/DOCUMENTATION-STANDARD.md\`.` |
| `docs/engineering/04-AI-RULES.md` | "2. Documentos de autoridad" | Misma referencia |
| `docs/engineering/08-ENGINEERING-HANDBOOK.md` | "3. Orden de autoridad" | Misma referencia |

En los tres casos se conservó la oración introductoria original ajustándola mínimamente para que precediera a la referencia con sentido gramatical (por ejemplo, "deberá respetar, en este orden: [lista]" pasó a "deberá respetar la jerarquía documental oficial. [referencia]"). Este ajuste fue estructural, no técnico: no cambia qué debe respetarse, solo dónde se consulta.

**No se tocó** la lista de lectura de `docs/engineering/ROADMAP.md`, sección 6 ("Prompt para diagnóstico"), porque no es una jerarquía de autoridad en caso de contradicción — es una lista de documentos recomendados para una tarea específica (el diagnóstico de `index.html`). Se dejó fuera del alcance de esta instrucción deliberadamente.

# Frases conversacionales eliminadas

| Documento | Frase(s) eliminada(s) |
|---|---|
| `docs/vision/00-LIBRO-FUNDACIONAL.md` | Bloque completo de 18 líneas (entre "Y será el problema que seguiremos resolviendo mientras exista ProyCut." y la segunda aparición, ya conservada, de "Capítulo II. Nuestra Filosofía"), incluyendo: "Creo que aquí debemos hacer algo diferente.", "Yo quiero que ProyCut tenga algo más profundo...", "Te propongo que el siguiente capítulo no sea 'Misión'.", "Quiero que sea:", "Y me gustaría que empezara con una frase que, para mí, resume todo lo que hemos construido juntos:", "Y tengo la impresión de que...", la palabra suelta "contnuemos", y "Perfecto. A partir de aquí quiero escribirlo como si fuera un libro que pudiera publicarse. Sin pensar en el software, sino en la empresa." |
| `docs/vision/02-DESIGN-PHILOSOPHY.md` | "Y aquí quiero proponerte algo que, sinceramente, creo que puede convertirse en una herramienta muy poderosa para todo el equipo." |
| `docs/vision/03-PROYCUT-BLUEPRINT.md` | "Aquí quiero detenerme." y "Creo que ya descubrimos cuál es." (sección "4. El corazón de ProyCut"); "Y aquí quiero dejar escrita una regla que creo que será tan importante como las del Libro Fundacional." (sección "6. La gran regla de ProyCut") |

En los tres documentos, el contenido sustantivo que seguía inmediatamente a cada frase eliminada se conservó íntegro y sin reescribirse. Se verificó, mediante búsqueda exhaustiva sobre los 11 documentos del alcance, que no quedan frases conversacionales adicionales de este tipo.

# Cambios que NO se realizaron por seguridad

- No se modificó ningún archivo de `docs/meta/`, salvo la creación de este reporte.
- No se leyó ni se modificó `index.html`.
- No se resolvió ninguna contradicción de contenido (alcance inicial de datos entre `README.md`/`ROADMAP.md` y `07-DATABASE.md`; cifra de "vigencia a futuro" distinta entre `01-DOCTRINA-PROYCUT.md` y `02-DESIGN-PHILOSOPHY.md`; mención de proveedores no aprobados en `04-AI-RULES.md` y `05-ARCHITECTURE.md`) — son cambios de contenido, fuera del alcance de una normalización estructural.
- No se dividió `docs/engineering/06-FUNCTIONALITIES.md` pese a su extensión (2073 líneas), ya señalada como candidata a división en `docs/meta/DOCUMENTATION-AUDIT.md`.
- No se creó ningún ADR para documentar la sustitución de contenido de `docs/engineering/05-ARCHITECTURE.md`.
- No se completó ningún campo "Responsable": se dejó "PENDIENTE" en los 11 documentos en vez de asignar un nombre o rol no confirmado.
- No se completaron los campos "Depende de" o "Referenciado por" cuando la relación no estaba ya documentada en `docs/meta/DOCUMENTATION-INVENTORY.md`.
- No se movió contenido entre documentos, no se resumió ningún documento y no se creó ningún documento funcional nuevo.

# Riesgos detectados

**Dos convenciones de encabezado distintas y sin reconciliar.** El formato de encabezado usado en estos 11 documentos (título `#` seguido de secciones `##` independientes) es el que esta tarea solicitó explícitamente, pero **no coincide** con el formato que `docs/meta/DOCUMENTATION-STANDARD.md`, sección 8, define de forma literal (un bloque delimitado por `---` con líneas `Campo: valor`, ya usado en `DOCUMENTATION-STANDARD.md` y `DOCUMENTATION-INVENTORY.md`). El proyecto tiene ahora, simultáneamente, dos convenciones de encabezado activas — una en `meta/`, otra en `vision/`+`engineering/`. No se resolvió esta divergencia porque hacerlo unilateralmente habría excedido el alcance de "normalizar", y porque `docs/meta/` estaba explícitamente fuera de alcance salvo consulta.

**Las contradicciones de contenido ya conocidas siguen abiertas.** Esta normalización fue deliberadamente estructural; ninguna de las contradicciones registradas en `docs/meta/DOCUMENTATION-AUDIT.md` ni en `docs/meta/DOCUMENTATION-INVENTORY.md` (sección 7) fue tocada.

**El bloque eliminado de `docs/vision/00-LIBRO-FUNDACIONAL.md` fue la intervención de mayor riesgo de esta tarea.** Eran 18 líneas continuas que mezclaban planificación editorial entre dos personas con una mención duplicada de la frase central de la filosofía del proyecto ("La tecnología debe adaptarse a quien construye, nunca quien construye a la tecnología."). Se eliminó el bloque completo, no frase por frase, porque tras revisión la totalidad del bloque resultó ser conversacional de principio a fin; la frase central y todo el contenido sustantivo permanecen intactos en su segunda aparición, la que efectivamente abre el Capítulo II. Se deja constancia explícita para que el equipo pueda verificar manualmente que no se perdió ningún matiz de intención.

**Ningún documento tiene "Responsable" asignado.** Esto no es un defecto de esta normalización: refleja que el proyecto, hasta ahora, no ha definido propietarios por documento en ningún lugar.

# Recomendaciones

En orden de prioridad:

1. Decidir formalmente si el formato de encabezado H1/H2 usado en `vision/`+`engineering/` reemplaza al definido en `docs/meta/DOCUMENTATION-STANDARD.md`, sección 8, o si esa sección debe actualizarse para coincidir con este, o si ambos deben coexistir según el tipo de documento. Hoy son inconsistentes entre sí.
2. Usar `docs/meta/DOCUMENTATION-CONSOLIDATION-PLAN.md` (todavía vacío) para registrar y resolver, en orden, las contradicciones de contenido que esta normalización dejó intencionalmente sin tocar.
3. Completar los campos "Responsable" de los 11 documentos, asignando un rol o persona real.
4. Completar los campos "Depende de" / "Referenciado por" marcados "PENDIENTE" en cuanto se confirme la relación real.
5. Documentar mediante un ADR la sustitución de contenido de `docs/engineering/05-ARCHITECTURE.md`, tal como exige `docs/engineering/08-ENGINEERING-HANDBOOK.md`, sección 91.
6. Revisar manualmente la eliminación del bloque conversacional de `docs/vision/00-LIBRO-FUNDACIONAL.md` (ver Riesgos) antes de marcar ese documento como "Aprobado".
