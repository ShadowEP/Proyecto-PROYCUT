---
name: proycut-persistence
description: "Captura la persistencia real de ProyCut antes de introducir Supabase: una sola clave de localStorage (occ_bamteck_estilo_v1) con preferencias visuales, y ninguna persistencia de datos de proyecto. Activar antes de tocar guardar/cargar, localStorage, o al planear la integración con Supabase. Separa explícitamente persistencia actual de persistencia futura. No diseña tablas SQL, migraciones ni arquitectura nueva — eso pertenece a docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md. No cubre qué es fuente vs. derivado (usar proycut-project-model) ni formatos de archivo (usar proycut-import-export-contracts)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Persistencia (estado real)

## Propósito

Documentar, contra el código actual, exactamente qué se persiste hoy en ProyCut, cómo, y qué NO se persiste — como línea base verificable antes de introducir Supabase. Esta Skill no diseña la persistencia futura; remite al plan ya aprobado.

## Cuándo activar

- Antes de modificar `localStorage`, `cargarEstiloGuardado`, `guardarEstilo`, o cualquier código de guardar/cargar.
- Al planear cualquier paso de la integración con Supabase (`45-SUPABASE-INTEGRATION-PLAN.md`).
- Al diagnosticar un reporte de "se perdió mi trabajo al recargar la página".

## Cuándo NO activar

- Clasificar si un dato es fuente o derivado → `proycut-project-model` (complementaria: úsala primero para saber *qué* debería persistirse).
- Formatos de archivo de import/export (CSV, Excel, DXF) → `proycut-import-export-contracts` — son mecanismos de intercambio manual, no persistencia automática.
- Diseño de tablas, RLS, migraciones o cliente Supabase → todavía no autorizado; pertenece a fases posteriores de `45-SUPABASE-INTEGRATION-PLAN.md`, no a esta Skill.

## Documentos y código canónicos

- `src/scripts/main.js` — único archivo con persistencia real: `ESTILO_KEY` (línea 2495), `cargarEstiloGuardado()` (2496–2537), `guardarEstilo()` (2538–2540).
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md`, sección 9 — ya documentaba esto; confirmado aquí línea por línea.
- `docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md` — plan ya aprobado para la persistencia futura (ver sección propia abajo).

## Procedimiento de análisis (cómo se confirmó lo documentado aquí)

1. `grep` exhaustivo de `localStorage` en `src/scripts/main.js` — exactamente 2 coincidencias, ambas dentro del mismo bloque (`cargarEstiloGuardado`/`guardarEstilo`).
2. `grep` exhaustivo de `JSON.stringify`/`JSON.parse` en el mismo archivo — exactamente 2 coincidencias, las mismas dos líneas.
3. `grep` de `autosave`/`auto-save`/`borrador`/`draft`/`recuperaci` (insensible a mayúsculas) en `main.js` — cero resultados: no existe ningún mecanismo de recuperación automática o borrador.
4. Lectura completa del bloque `cargarEstiloGuardado`/`guardarEstilo` para confirmar estructura, manejo de errores y alcance exacto de lo que se restaura.

No se asumió ninguna de estas conclusiones por memoria — todas están respaldadas por el `grep` o la lectura citados.

## PERSISTENCIA ACTUAL (confirmada por lectura de código)

- **Clave real:** `occ_bamteck_estilo_v1` (constante `ESTILO_KEY`, única clave de `localStorage` en todo el proyecto).
- **Estructura:** un objeto JSON con ~40 propiedades de apariencia — colores (`colorPieza`, `colorPieza2`, `colorSobrante`, `colorSobrante2`, `colorPrincipal`, `colorSecundario`, `colorFondo`, etc.), tamaños de letra, estilos y grosores de línea, tipo de flecha, plantilla de reporte, diseño del total, y un conjunto de booleanos de visibilidad (`mostrarNumero`, `mostrarBtnExportar`, etc.). Lista completa y exacta en `cargarEstiloGuardado()` líneas 2514–2532.
- **Ciclo de guardado:** `guardarEstilo(estilo)` escribe (`localStorage.setItem` + `JSON.stringify`) en **cada cambio** de cualquier control de estilo — no hay debounce ni guardado explícito por botón.
- **Ciclo de carga:** `cargarEstiloGuardado()` se ejecuta **una sola vez**, como parte del flujo de inicialización de la página (antes de los primeros renders de catálogo, según `10-CURRENT-STATE.md` sección 6).
- **Manejo de errores — problema conocido real:** ambas funciones envuelven su operación en `try/catch` que **silencia** cualquier fallo (cuota excedida, modo privado del navegador, JSON corrupto no parseable). El usuario **nunca se entera** si sus preferencias no se guardaron o no se restauraron — no hay mensaje, log visible, ni indicador. Confirmado por lectura directa de los comentarios del propio código (`// no se pudo guardar, no pasa nada`).
- **Restauración parcial tolerante:** `cargarEstiloGuardado` restaura clave por clave (`hasOwnProperty` individual) — si el JSON es válido pero le faltan propiedades (por ejemplo, de una versión anterior de la clave), las claves ausentes simplemente conservan su valor por defecto del HTML; no falla en bloque. Si el JSON **no es parseable en absoluto**, el `catch` externo descarta todo y no restaura nada (comportamiento distinto: total, no parcial, en ese caso). Esto era "pendiente de confirmar en ejecución" en `10-CURRENT-STATE.md` sección 17; aquí se confirma que el **diseño del código** contempla ambos casos de forma distinta.
- **Qué NO se persiste — confirmado exhaustivamente:** piezas, catálogos (`state.materiales/tapacantos/componentes/componentesProyecto`), cantidad de proyectos, parámetros de corte, `state.boards`, `ultimoReporte`, `ultimoTotal`. Todo esto se pierde al recargar la página. No existe ningún mecanismo de guardado automático, borrador, ni recuperación de sesión — confirmado por `grep` sin resultados.

## PERSISTENCIA FUTURA SUPABASE (ya planeada — solo referenciada, no diseñada aquí)

`docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md` ya define, con estado "Propuesto para revisión":

- 5 tablas mínimas: `projects`, `project_materials`, `project_edge_bands`, `project_parts`, `project_components` (sección 4).
- Contrato de operaciones asíncronas con resultado explícito (`{ok:true,...}` / `{ok:false, error}`), nunca `alert()` (sección 15 del inventario / sección 9-11 del plan).
- Fuente de verdad por momento: DOM/`state` mientras se edita; Supabase para la última versión guardada; resultados siempre recalculados localmente tras cargar (sección 8 del plan).
- El modo local (sin Supabase) debe seguir funcionando siempre — regla explícita (`45-SUPABASE-INTEGRATION-PLAN.md` sección 21).

Esta Skill **no** amplía, cuestiona ni rediseña ese plan — lo usa como referencia de destino. Cualquier diseño de tablas/SQL/RLS pertenece a las fases del plan, no a esta tarea.

## Separación obligatoria

- `localStorage` (`occ_bamteck_estilo_v1`) seguirá existiendo **exclusivamente** para preferencias visuales, incluso después de integrar Supabase — regla explícita del plan (sección 21: "No se convierte `localStorage` en base paralela de proyectos").
- No mezclar la persistencia de preferencias (local, sincrónica, por-clave) con la futura persistencia de proyectos (remota, asíncrona, por-agregado) en el mismo mecanismo o la misma clave.

## Invariantes

- La única clave de `localStorage` en el proyecto es `ESTILO_KEY = 'occ_bamteck_estilo_v1'` — cualquier persistencia nueva debe usar una clave distinta y explícita, nunca reutilizar ni sobrescribir esta.
- El fallo silencioso de `localStorage` es un hecho conocido del código actual, no algo a "corregir" dentro del alcance de esta Skill — solo documentarlo.

## Prohibiciones

- No diseñar tablas SQL, políticas RLS, ni migraciones dentro de esta Skill — eso pertenece a fases posteriores ya secuenciadas en `45-SUPABASE-INTEGRATION-PLAN.md`.
- No instalar ni configurar el SDK de Supabase, ni crear `infrastructure/supabase-client.js` u otros archivos de esa arquitectura — no autorizado en esta tarea.
- No "corregir" el manejo de errores silencioso de `cargarEstiloGuardado`/`guardarEstilo` de oficio — es un cambio funcional (agregar feedback visible al usuario) que requiere aprobación explícita.
- No convertir `localStorage` en almacén de datos de proyecto como atajo antes de tener Supabase — contradice la regla explícita del plan.

## Procedimiento de análisis para tareas futuras

1. Antes de tocar cualquier cosa relacionada con guardar/cargar, releer `cargarEstiloGuardado`/`guardarEstilo` completas — no asumir que "ya se sabe" cómo funcionan.
2. Confirmar con `grep` si apareció alguna clave nueva de `localStorage` desde la última vez que se documentó esta Skill (el código puede haber cambiado).
3. Contrastar cualquier propuesta de persistencia de proyecto contra `45-SUPABASE-INTEGRATION-PLAN.md` antes de proponer una alternativa — el plan ya fue revisado y aprobado como punto de partida.

## Condiciones para detenerse y pedir aclaración

- La tarea pide implementar cualquier parte de la integración con Supabase (cliente, repositorio, tablas) — confirmar que el usuario autoriza explícitamente salir de la fase de "solo documentación" antes de proceder.
- La tarea pide agregar persistencia de datos de proyecto usando `localStorage` como solución provisional — señalar que contradice el plan aprobado antes de implementarlo.
- No es claro si un dato nuevo debería vivir en la futura tabla `projects` o en una de sus tablas hijas — remitir a `proycut-project-model` para clasificarlo como fuente/derivado primero.
