---
name: proycut-domain-rules
description: "Protege los conceptos y reglas centrales del dominio de ProyCut: Project como concepto central, piezas, materiales, tapacantos, componentes, cantidades, costos, optimización y fabricación. Activar ante cualquier tarea que toque estas áreas o persistencia de entidades del proyecto. Impide inventar reglas de negocio, unidades, tolerancias, kerf, precios o defaults no documentados. No cubre estructura de archivos/capas (usar proycut-architecture) ni el procedimiento de aplicar el cambio (usar proycut-safe-change)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Reglas del dominio

## Cuándo se activa

- Tareas que tocan: `Project`, piezas, materiales, tapacantos, componentes, cantidades, costos, optimización de corte, fabricación.
- Persistencia de entidades del proyecto (guardar/cargar, hoy y en la futura integración con Supabase).
- Validaciones de negocio (medidas, cantidades, precios, kerf, márgenes).
- Cualquier duda sobre "cómo debería calcularse X" o "qué significa este campo".

## Cuándo NO se activa

- Decisiones puramente estructurales sin tocar una regla de negocio (→ `proycut-architecture`).
- El procedimiento de cómo aplicar el cambio una vez la regla está confirmada (→ `proycut-safe-change`).

## Documentos canónicos

- `docs/vision/03-PROYCUT-BLUEPRINT.md` — capítulo 4 y 6: `Project` es el corazón de ProyCut; toda funcionalidad debe poder explicar qué aporta al ciclo de vida del proyecto (Idea → Cliente → Proyecto → Diseño → Materiales → Costeo → Optimización → Producción → Control → Entrega → Historial).
- `docs/vision/00-LIBRO-FUNDACIONAL.md` y `docs/vision/01-DOCTRINA-PROYCUT.md` — por qué existe cada regla: reducir incertidumbre, no inventar información, declarar supuestos explícitamente.
- `docs/engineering/10-CURRENT-STATE.md`, sección 12 — cálculos **realmente implementados hoy** en el código (costo de material, componentes, corte, tapacanto, kerf, redondeos). Esta es la fuente de verdad del comportamiento actual, no una aspiración.
- `docs/engineering/07-DATABASE.md` — modelo de datos **objetivo** (multiempresa, versionado, `parts`, `cost_calculations`, etc.). Describe hacia dónde se dirige el dominio, no lo que existe hoy en `index.html`/`src/scripts/`.
- `docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md`, secciones 1–7 — qué datos de proyecto se persistirán primero y cuáles se recalculan siempre (no se guardan `boards`, costos ni resultados derivados).
- `docs/engineering/04-AI-RULES.md`, secciones 9–10 — integridad de datos y reglas para costos y cotizaciones.

**Regla de lectura:** el código actual (`10-CURRENT-STATE.md`) documenta el comportamiento real de negocio hoy vigente. `07-DATABASE.md` y el Blueprint documentan el dominio objetivo. Ante una tarea sobre comportamiento actual, confiar en 10-CURRENT-STATE.md; ante una tarea de diseño de la futura persistencia, confiar en 07-DATABASE.md y 45-SUPABASE-INTEGRATION-PLAN.md. No mezclar ambos como si ya coexistieran.

## Idea central

**`Project` es el concepto alrededor del cual gira todo el workflow.** ProyCut acompaña un proyecto de mobiliario desde la idea hasta la fabricación. Ninguna funcionalidad nueva debería diseñarse de forma aislada del ciclo de vida del proyecto.

## Invariantes conocidos (verificados contra el código actual)

Según `10-CURRENT-STATE.md`, sección 12:

- Costo de materiales = número de tableros usados × precio por tablero, agrupado por material.
- Costo de componentes = precio unitario × cantidad por proyecto × cantidad de proyectos.
- Costo de corte = número de cortes × precio por corte, **o** metros lineales de corte × precio por metro (según modo elegido).
- Costo de tapacanto = metros por tipo × precio por metro, con redondeo opcional hacia arriba a 0.5 m.
- El kerf capturado por el usuario deriva 4 valores efectivos (`kerf`, `kerfEntrePiezas`, `kerfPiezaSobrante`, `kerfBordeExterior`) según configuración.
- El optimizador es determinista con semilla fija (`pseudoAleatorio`/`barajar`) — mismo input, mismo resultado.

Estos son hechos observados por lectura de código, **no confirmados aún por ejecución** (ver `10-CURRENT-STATE.md`, sección 21). No se deben presentar como verdad absoluta sin esa salvedad cuando sea relevante para la tarea.

## Prohibiciones

No inventar, sin evidencia documental o en el código:

- Reglas de precio, márgenes, impuestos o descuentos.
- Unidades o conversiones no definidas.
- Tolerancias de fabricación o corte.
- Comportamientos de rotación de piezas no documentados.
- Lógica de kerf distinta a la ya implementada.
- Reglas de materiales, compatibilidad o sustitución.
- Contratos de componentes (qué campos son obligatorios, cómo se calculan subtotales).
- Reglas de fabricación (tiempos, secuencias, capacidad).
- Valores por defecto de negocio (precios semilla, medidas de tablero por defecto) que no estén ya en el código o en datos de prueba marcados explícitamente como tales.

## Procedimiento recomendado

1. Determinar si la pregunta es sobre comportamiento **actual** (código) o **objetivo** (documentación de visión/base de datos futura) — no responder con la fuente equivocada.
2. Buscar evidencia en el código (`src/scripts/costing/`, `src/scripts/geometry/`, `main.js`) antes de asumir una regla.
3. Si la regla existe en código pero no en documentación (caso común, ver `10-CURRENT-STATE.md` sección 21 sobre comportamientos no confirmados), tratarla como comportamiento observado, no como especificación aprobada — señalar la diferencia si es relevante.
4. Si la tarea requiere una regla que no está en código ni en documentación: no asumir. Buscar evidencia adicional; si sigue ambigua, **DETENERSE y preguntar**.
5. Para cualquier cálculo, declarar explícitamente entradas, unidades, moneda, redondeo y supuestos usados (`04-AI-RULES.md`, sección 10).

## Verificaciones obligatorias

- Toda regla de negocio usada en el cambio tiene respaldo en código actual, en `docs/`, o fue confirmada explícitamente por el usuario en esta conversación.
- Los cálculos de costeo distinguen material, componentes, corte y tapacanto por separado, como hoy lo hace el código.
- No se mezclaron unidades ni monedas sin conversión explícita.
- Si el cambio toca persistencia, se respetó la lista de "qué se guarda primero" vs "qué se recalcula siempre" de `45-SUPABASE-INTEGRATION-PLAN.md`, secciones 2–3.

## Condiciones para detenerse y pedir aclaración

- La tarea requiere una regla de negocio (precio, tolerancia, unidad, comportamiento de rotación) que no está documentada ni implementada.
- Existe conflicto aparente entre lo que hace el código hoy y lo que describe la documentación de visión — señalarlo en vez de elegir una versión silenciosamente.
- La tarea pide tratar el modelo de `07-DATABASE.md` como si ya existiera en la base de código actual.
- Se necesita inventar un default de negocio (precio, medida, política) para completar la tarea.
