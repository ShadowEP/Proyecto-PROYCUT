# 51 — Reporte de Skills de modelo de proyecto y persistencia

## Estado

Propuesto para revisión.

## Versión

1.0

## Última actualización

2026-08-18

## Propósito

Documentar la creación de tres Agent Skills que capturan, contra el código real, qué significa "Proyecto" en ProyCut hoy, cómo se persiste (y cómo no), y cómo entran/salen los datos por sus fronteras externas (CSV, Excel, DXF) — como base de conocimiento previa a iniciar la integración con Supabase. Esta tarea fue exclusivamente de documentación: no se creó código, migraciones, ni configuración de Supabase.

---

## 1. Skills creadas

| Skill | Ruta | Cubre |
|---|---|---|
| `proycut-project-model` | `.agents/skills/proycut-project-model/SKILL.md` | Qué es fuente vs. derivado en el modelo actual de proyecto |
| `proycut-persistence` | `.agents/skills/proycut-persistence/SKILL.md` | Persistencia real (`localStorage`) vs. futura (Supabase, ya planeada) |
| `proycut-import-export-contracts` | `.agents/skills/proycut-import-export-contracts/SKILL.md` | Fronteras CSV/Excel/DXF: entrada/transformación/salida/riesgos |

Ninguna usa `references/` — el contenido cupo dentro de un `SKILL.md` auditable. Ninguna incluye scripts ejecutables.

## 2. Archivos inspeccionados

- `src/scripts/main.js` — definición de `state` (línea 132), bloque de estilo/`localStorage` (2494–2540), bloques de formato de proyecto y catálogo Excel (915–1370 aprox.), `construirLibroFormatoProyecto` (958–1031), `extraerProyectoDesdeLibroExcel` (1185–1260).
- `src/scripts/pieces/project-model.js` (completo)
- `src/scripts/pieces/pieces-dom-reader.js` (completo)
- `src/scripts/project/prepare-project.js` (completo)
- `src/scripts/utils/csv.js` (completo)
- `src/scripts/config/project-format.js` (completo)
- `grep` exhaustivo en `main.js` de: `localStorage`, `JSON.stringify`, `JSON.parse`, `nombreProyecto`/`clienteId`/`companyId`, `autosave`/`borrador`/`draft`/`recuperaci`.

Documentación: `README.md`, `05-ARCHITECTURE.md`, `07-DATABASE.md`, `10-CURRENT-STATE.md`, `44-CURRENT-ARCHITECTURE-INVENTORY.md`, `45-SUPABASE-INTEGRATION-PLAN.md`, y las doce Skills existentes (`CLAUDE.md`, `AGENTS.md` ya conocidos de tareas previas en esta misma sesión).

## 3. Fuente de verdad identificada

Confirmado por lectura directa, no por memoria de reportes anteriores:

- **Piezas** viven exclusivamente en el DOM (`#piezasBody`) — nunca copiadas a `state`. Único punto de lectura: `leerFilasPiezasDesdeDOM()`.
- **Catálogos** (`materiales`, `tapacantos`, `componentes`) y **componentes del proyecto** viven en `state` (memoria, se pierde al recargar).
- **Cantidad de proyectos** y **todos los parámetros de corte** (kerf, márgenes, modo, nivel, precios) viven exclusivamente en controles del DOM — no hay copia en `state`.
- **No existe** ningún concepto de nombre de proyecto, cliente o empresa en el código — confirmado por `grep` sin resultados, coincide con lo ya señalado en `44-CURRENT-ARCHITECTURE-INVENTORY.md`.
- `project-model.js` declara **textualmente en su propio comentario** que su modelo temporal nunca se guarda en `state` ni `localStorage` — evidencia directa del propio código, no una inferencia.

## 4. Datos derivados identificados

`modeloProyecto`, piezas expandidas, `state.boards`, `state.ultimoTotal`, `state.ultimoReporte`, el SVG en pantalla, y los archivos PNG/Excel/DXF exportados — todos reconstruibles desde los datos fuente de la sección 3. La lista resultante de esta tarea **coincide exactamente** con las secciones 2 y 3 de `45-SUPABASE-INTEGRATION-PLAN.md` ("qué se guarda primero" / "qué se recalcula") — no se encontró ninguna excepción real a la regla "Supabase debe almacenar intención y datos fuente, no resultados calculables", y así se documenta explícitamente en `proycut-project-model`.

## 5. Persistencia actual encontrada

- **Una sola clave de `localStorage` en todo el proyecto:** `occ_bamteck_estilo_v1` — confirmado por `grep` exhaustivo (exactamente 2 líneas usan `localStorage`, exactamente 2 usan `JSON.stringify`/`JSON.parse`, todas dentro del mismo bloque).
- Contiene únicamente preferencias visuales (~40 propiedades: colores, tamaños de letra, estilos de línea, plantilla de reporte, visibilidad de botones).
- Guardado en cada cambio de cualquier control de estilo; cargado una sola vez al inicio.
- **Manejo de errores silencioso confirmado:** ambas funciones usan `try/catch` que no informa al usuario si el guardado/carga falla — documentado como problema conocido, no corregido.
- **Ningún mecanismo de autosave, borrador o recuperación de sesión existe** — confirmado por `grep` sin resultados.
- Ningún dato de proyecto (piezas, catálogos, parámetros) se persiste hoy de ninguna forma.

## 6. Fronteras externas encontradas

| Frontera | Entrada | Toca `state` directamente | Salida |
|---|---|---|---|
| CSV (piezas) | Texto, 11 columnas fijas | No (agrega filas al DOM) | Filas nuevas en `#piezasBody` |
| Excel — formato de proyecto | `.xlsx` con hoja Piezas + opcionales | No en la etapa de extracción (confirmado por comentario textual del código); sí en la etapa de aplicación atómica posterior, tras confirmación del usuario | `state` + DOM actualizados |
| Excel — formato de catálogo (CAT-7) | `.xlsx` con 3 hojas | No | Ninguna — sin interfaz que lo invoque |
| Excel — "Exportar formato" | `state` + DOM | Lee, no escribe | Archivo `.xlsx` reimportable |
| Excel — "Excel completo" | `state.boards`/`ultimoReporte` | Lee, no escribe | Archivo `.xlsx` de reporte, no reimportable |
| DXF | `state.boards` | Lee, no escribe | ZIP con un `.dxf` por tablero (contrato completo en `proycut-dxf-r12`) |

**Patrón confirmado y documentado como invariante a preservar:** las funciones de extracción de Excel son de solo lectura/validación (declarado textualmente en su propio comentario); la aplicación real ocurre en un paso separado, solo tras confirmación explícita del usuario.

## 7. Riesgos para Supabase

- **Doble fuente de verdad en la transición:** hoy las piezas viven solo en el DOM; cualquier integración con Supabase necesitará un paso de "leer DOM → construir DTO" explícito, ya anticipado por el plan pero ahora confirmado contra el código real de `pieces-dom-reader.js`.
- **Fallo silencioso ya existente en `localStorage`** podría replicarse por descuido en la capa de Supabase si no se diseña explícitamente el manejo de errores (el plan ya lo contempla con su contrato de errores normalizado, sección 22 de `45-SUPABASE-INTEGRATION-PLAN.md`).
- **Duplicación de encabezados de Excel** (`ENCABEZADO_COMPONENTES_FORMATO`, `ENCABEZADO_MATERIALES_FORMATO`) definidos una sola vez pero sin módulo compartido — riesgo de desincronización si se toca solo un lado del round-trip; no es un riesgo de Supabase en sí, pero es relevante si el DTO de Supabase termina reutilizando estos mismos nombres de campo.
- **Ambigüedad de identidad** (SKU/`idInterno`/nombre) al importar Excel es el mismo tipo de riesgo ya señalado en `45-SUPABASE-INTEGRATION-PLAN.md` sección 24 para snapshots de materiales/tapacantos — confirmado aquí como un patrón que ya existe hoy en Excel, no algo nuevo que introduciría Supabase.
- **Ningún dato de proyecto persiste hoy** — la primera integración con Supabase será la primera vez que un usuario pueda perder o recuperar trabajo entre sesiones; el riesgo de una migración/carga incorrecta es mayor porque no hay comportamiento previo con el que comparar en producción.

## 8. Dry runs

**A — "Quiero guardar boards optimizados directamente en Supabase."**
Activa: `proycut-project-model`, `proycut-persistence`, `proycut-safe-change`. `proycut-project-model` advierte explícitamente que `boards` es un dato derivado (reconstruible desde piezas + catálogos + parámetros), no debe guardarse directamente. Coincide con lo esperado.

**B — "Quiero migrar localStorage a Supabase."**
Activa: `proycut-persistence`, `proycut-project-model`, más las Skills públicas `supabase` y `supabase-postgres-best-practices` (ya instaladas en el proyecto) para el detalle técnico de SDK/RLS/SQL. `proycut-persistence` advierte que primero hay que definir qué es fuente de verdad en cada momento (DOM/`state` mientras se edita, Supabase para lo último guardado) antes de mover nada. Coincide con lo esperado.

**C — "Quiero cambiar el formato Excel."**
Activa: `proycut-import-export-contracts`, `proycut-domain-rules`, `proycut-regression-matrix`. `proycut-import-export-contracts` advierte explícitamente que Excel es una frontera externa con contrato de encabezados exacto compartido entre import/export, y que romperlo de un solo lado rompe el round-trip silenciosamente. Coincide con lo esperado.

## 9. Próximos pasos

- Cuando el usuario autorice avanzar más allá de la documentación, el siguiente paso ya está definido en `45-SUPABASE-INTEGRATION-PLAN.md` sección 27: inicializar Supabase localmente en un commit aislado (sin tocar `index.html`/`main.js`, sin esquema, sin conexión de aplicación).
- Antes de esa inicialización, sería razonable una Skill `proycut-supabase-boundary` (ya recomendada en el reporte 49) que documente el contrato exacto cliente→repositorio→persistencia una vez que ese código exista — todavía no, porque no hay código que documentar.
- El hallazgo de duplicación de encabezados de Excel (sección 6) podría justificar, en una tarea futura explícitamente autorizada, extraer `ENCABEZADO_COMPONENTES_FORMATO`/`ENCABEZADO_MATERIALES_FORMATO` a `config/project-format.js` junto con `ENCABEZADO_FORMATO` — no se propone hacerlo ahora, solo se deja registrado como oportunidad.

## 10. Verificación final

```text
git diff --check       → sin salida (sin problemas de espacios en blanco)
git status --short     → solo directorios nuevos bajo .agents/skills/ y este reporte
```

Código de producción modificado: NO. Migraciones creadas: NO. Scripts nuevos: NO. Commit: NO. Push: NO.
