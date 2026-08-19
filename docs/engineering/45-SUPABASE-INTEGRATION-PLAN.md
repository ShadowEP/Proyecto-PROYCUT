# 45 — Plan de integración inicial de Supabase

## Estado

Propuesto para revisión antes de cualquier inicialización o implementación. **El modelo de ownership de este plan (propietario individual, `owner_id = auth.uid()`) quedó superado por la decisión registrada en `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md`** — ver "Aviso de vigencia — ownership" más abajo antes de leer el resto del documento.

## Versión

1.1

## Última actualización

2026-08-18

## Aviso de vigencia — ownership (2026-08-18)

El modelo de ownership propuesto en este plan — propietario individual mediante `owner_id = auth.uid()` — es **PROPUESTA ANTERIOR SUPERADA EN SU MODELO DE OWNERSHIP POR LA DECISIÓN 53** (`docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md`). Esa decisión confirma que los proyectos pertenecen a un **workspace**, al que los usuarios acceden mediante **membresía**, incluso cuando el workspace tiene un único miembro. Cualquier mención de `owner_id`, "propietario individual" o RLS basada directamente en `auth.uid()` en las secciones siguientes debe leerse en ese sentido histórico, no como diseño vigente para una migración real.

Siguen siendo válidos de este plan, en la medida en que no dependan del modelo de ownership: la separación de datos fuente vs. derivados (secciones 1–3), los snapshots de materiales/tapacantos/componentes (sección 7), el guardado transaccional (secciones 9, 23), el versionado optimista (`version`/`schema_version`), la exigencia de seguridad/RLS desde el inicio como principio general (sin fijar aún el predicado exacto), el aislamiento de datos entre proyectos, la separación repositorio/caso de uso (sección 12), el modo local sin backend (sección 21) y la prohibición de persistir boards/SVG/DXF/Excel/costos derivados (secciones 3, 24).

Quedan pendientes de rediseño antes de migrar, a partir de la decisión 53: las tablas y columnas relacionadas con ownership (`owner_id` en `projects` y cualquier índice que dependa de él), la relación exacta de proyecto con workspace, el modelo de membresías, las políticas RLS que hoy comparan directamente contra `owner_id = auth.uid()`, cualquier RPC que asuma `owner_id` (`save_project_v1` conceptual) y el conteo definitivo de tablas (hoy 5, sujeto a incorporar `workspaces`/`workspace_members` u otras). Ninguno de esos nombres está decidido; ver `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` para los candidatos de nomenclatura, todavía no implementados.

## Propósito

Definir cómo incorporar persistencia de proyectos a ProyCut de forma incremental, reversible y segura, preservando el prototipo local y el pipeline actual. Este plan no instala Supabase, no define el modelo SaaS completo y no autoriza cambios funcionales.

## Decisiones rectoras

- La primera persistencia representa las **entradas reproducibles** de un proyecto, no sus resultados.
- El DOM sigue siendo la fuente editable del proyecto activo durante la transición; Supabase es la fuente durable de la última versión guardada.
- La carga siempre hidrata entradas y ejecuta el pipeline existente; nunca restaura `boards` o HTML calculados.
- La integración usa cliente, repositorio y servicio de aplicación separados.
- El alcance es de propietario individual. No incluye multiempresa, equipos ni roles avanzados. **Modelo de ownership superado por la decisión 53 — ver "Aviso de vigencia — ownership" arriba; el aislamiento real debe redefinirse por workspace/membresía, no por "propietario individual".**
- No se habilita acceso remoto desde el navegador sin Auth y RLS efectivas.

## 1. Alcance inicial de persistencia

La primera fase permite guardar, listar, cargar, actualizar y eliminar lógicamente un proyecto de corte válido para un único propietario. El proyecto debe reconstruir:

- filas de piezas en su orden original;
- cantidad de proyectos;
- materiales utilizados y sus datos económicos/dimensionales;
- tapacantos utilizados;
- componentes agregados al proyecto;
- parámetros de corte, optimización y precios necesarios para recalcular.

Quedan fuera pagos, suscripciones, multiempresa, roles avanzados, catálogos compartidos, Storage, Edge Functions, tiempo real, colaboración, importación persistente, auditoría completa y rediseño de interfaz.

El alcance no reemplaza inmediatamente el funcionamiento actual. Guardar/cargar remoto será una capacidad optativa hasta superar las pruebas de round-trip.

## 2. Datos que se guardarán primero

### Metadatos del proyecto

- identificador UUID;
- propietario autenticado;
- nombre;
- estado técnico `draft`;
- versión del esquema del DTO;
- versión optimista del registro;
- fechas de creación, actualización y eliminación lógica.

### Entradas del proyecto

- `project_quantity` equivalente a `cantidadProyectos`;
- configuración de corte fuente: kerf, activación y forma de márgenes, valores por lado;
- configuración del optimizador: nivel y modo guillotina/libre;
- configuración económica: modo y precios de corte, redondeo de tapacanto;
- filas de piezas: posición, cantidad, largo, ancho, giro, etiqueta y cuatro lados de tapacanto;
- snapshots de materiales: SKU, nombre, largo, ancho, espesor y precio;
- snapshots de tapacantos: SKU, nombre y precio por metro;
- componentes del proyecto: SKU, producto, cantidad y precio unitario.

Solo se guardan proyectos que pasen el contrato de validación inicial. La capacidad de guardar filas incompletas como borrador queda para una fase posterior, porque exigiría persistir texto crudo y ampliar el contrato de validación.

## 3. Datos derivados que se recalcularán

No se persistirán inicialmente:

- `state.boards` ni `activeTab`;
- `freeRects` y `board._geom`;
- posiciones, rotaciones resueltas y tableros por material;
- sobrantes, áreas, fronteras, imanes, cortes y longitud de corte;
- costos, subtotales, `ultimoTotal` y `ultimoReporte`;
- HTML de reporte;
- SVG, PNG, Excel, DXF o ZIP;
- mensajes de validación y estado de paneles.

Son resultados reconstruibles. Guardarlos duplicaría fuentes de verdad y los volvería obsoletos cuando cambien entradas o algoritmos. Un futuro historial aprobado requerirá entidades versionadas propias; no reutilizará el estado efímero actual.

## 4. Tablas mínimas propuestas

**PROPUESTA ANTERIOR SUPERADA EN SU MODELO DE OWNERSHIP POR LA DECISIÓN 53** (ver "Aviso de vigencia — ownership" arriba). El conteo de cinco tablas, sus columnas de ownership y sus relaciones de propiedad fueron pensados para propietario individual y deben rediseñarse hacia workspace/membresía antes de migrar; la separación fuente/derivado y snapshots que motivan estas tablas sigue siendo válida.

La primera migración funcional propone cinco tablas:

1. `projects`;
2. `project_materials`;
3. `project_edge_bands`;
4. `project_parts`;
5. `project_components`.

No se crean `companies`, clientes, roles, catálogos globales ni tablas de resultados. Los materiales, tapacantos y componentes son snapshots pertenecientes al proyecto, no maestros compartidos.

## 5. Columnas y relaciones

### `projects`

| Columna | Tipo propuesto | Regla |
|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` |
| `owner_id` *(superado — ver nota)* | `uuid` | NOT NULL, FK a `auth.users(id)` |
| `name` | `text` | NOT NULL, longitud controlada |
| `status` | `text` | NOT NULL, inicialmente solo `draft` |
| `schema_version` | `smallint` | NOT NULL, inicia en 1 |
| `version` | `integer` | NOT NULL, inicia en 1; bloqueo optimista |
| `project_quantity` | `integer` | NOT NULL, entre 1 y el límite vigente |
| `cut_settings` | `jsonb` | NOT NULL, objeto versionado con configuración de corte/optimización |
| `pricing_settings` | `jsonb` | NOT NULL, objeto versionado con entradas económicas |
| `created_at` | `timestamptz` | NOT NULL, default `now()` |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` |
| `deleted_at` | `timestamptz` | NULL; eliminación lógica |

**Nota sobre `owner_id`:** esta columna refleja el modelo de propietario individual, **superado por la decisión 53** (`docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md`). El ownership real será por workspace/membresía; la columna, su FK y cualquier índice derivado (ver sección 5, índice `(owner_id, updated_at desc)`) deben rediseñarse antes de escribir esta tabla como migración real. Se conserva aquí como referencia histórica de la propuesta de fase 1, no como contrato vigente.

`cut_settings` es apropiado porque la configuración jerárquica ya es un objeto versionable y no se consultará por cada clave en la primera fase. No debe convertirse en contenedor genérico: su forma exacta queda definida por el DTO y validada en aplicación/pruebas.

Forma conceptual:

```json
{
  "kerf_mm": 3,
  "outer_margins_enabled": false,
  "outer_margins_uniform": true,
  "outer_margin_general_mm": 0,
  "outer_margins_mm": { "left": 0, "right": 0, "top": 0, "bottom": 0 },
  "optimization_level": "normal",
  "cut_mode": "guillotine"
}
```

`pricing_settings` contiene `cut_price_mode`, `price_per_cut`, `price_per_cut_meter` y `round_edge_band`. Los importes usan `numeric`, representados en JSON como strings canónicos en el DTO para evitar pérdida de precisión.

### `project_materials`

| Columna | Tipo propuesto | Regla |
|---|---|---|
| `id` | `uuid` | PK |
| `project_id` | `uuid` | NOT NULL, FK `projects`, borrado en cascada físico solo dentro de reemplazo transaccional |
| `position` | `integer` | NOT NULL, >= 0 |
| `local_catalog_id` | `text` | NULL; trazabilidad de `idInterno`, no FK |
| `sku` | `text` | NULL |
| `name` | `text` | NOT NULL |
| `length_mm`, `width_mm`, `thickness_mm` | `numeric(12,3)` | Dimensiones no negativas; largo/ancho > 0 |
| `unit_price` | `numeric(14,4)` | NOT NULL, >= 0 |

Único por `(project_id, position)`. Puede añadirse unicidad de nombre normalizado solo después de comprobar reglas reales; no se inventa ahora.

### `project_edge_bands`

| Columna | Tipo propuesto | Regla |
|---|---|---|
| `id` | `uuid` | PK |
| `project_id` | `uuid` | NOT NULL, FK `projects` |
| `position` | `integer` | NOT NULL, >= 0 |
| `local_catalog_id` | `text` | NULL |
| `sku` | `text` | NULL |
| `name` | `text` | NOT NULL |
| `unit_price_per_meter` | `numeric(14,4)` | NOT NULL, >= 0 |

### `project_parts`

| Columna | Tipo propuesto | Regla |
|---|---|---|
| `id` | `uuid` | PK |
| `project_id` | `uuid` | NOT NULL, FK `projects` |
| `position` | `integer` | NOT NULL, orden de fila |
| `source_row_id` | `text` | Identidad visible/local, no PK |
| `label` | `text` | NOT NULL, admite vacío normalizado si el contrato lo decide |
| `quantity` | `integer` | NOT NULL, > 0; cantidad por proyecto, no expandida |
| `length_mm`, `width_mm` | `numeric(12,3)` | NOT NULL, > 0 |
| `rotation_mode` | `text` | `auto`, `normal` o `rotated` |
| `material_id` | `uuid` | NOT NULL, FK `project_materials` |
| `edge_band_id` | `uuid` | NULL, FK `project_edge_bands` |
| `edge_l1`, `edge_l2`, `edge_a1`, `edge_a2` | `boolean` | NOT NULL, default false |

Único por `(project_id, position)`. Las relaciones deben impedir referencias cruzadas entre proyectos mediante FK compuestas o validación transaccional, no solo mediante código cliente.

### `project_components`

| Columna | Tipo propuesto | Regla |
|---|---|---|
| `id` | `uuid` | PK |
| `project_id` | `uuid` | NOT NULL, FK `projects` |
| `position` | `integer` | NOT NULL |
| `local_catalog_id` | `text` | NULL |
| `sku` | `text` | NULL |
| `product_name` | `text` | NOT NULL |
| `quantity` | `integer` | NOT NULL, >= 0 |
| `unit_price` | `numeric(14,4)` | NOT NULL, >= 0 |

No se guarda subtotal. Todas las tablas hijas incluyen índice por `project_id`; `projects` incluye índice por `(owner_id, updated_at desc)` filtrado por `deleted_at is null` — índice dependiente de `owner_id`, superado por la decisión 53, debe rediseñarse para el contexto de workspace/membresía.

## 6. Estrategia para proyectos y piezas

Una fila de `project_parts` representa una fila capturada, no cada pieza expandida por cantidad ni cada pieza colocada. Esto coincide con `leerFilasPiezasDesdeDOM()` y evita multiplicar registros por `project_quantity`.

Al guardar:

- se asigna `position` según el orden DOM;
- se convierten textos ya validados a números canónicos;
- `girarModo='rotado'` se mapea a `rotation_mode='rotated'` y se revierte al cargar;
- material/tapacanto se resuelven contra snapshots del mismo proyecto;
- no se conserva `pieceCounter` como identidad durable; `source_row_id` solo ayuda a reproducir etiquetas/comportamiento local.

Al actualizar, el conjunto completo de hijos se reemplaza dentro de una única operación atómica. Es más seguro que un diff prematuro para los volúmenes actuales y evita filas huérfanas. `version` protege contra sobrescritura concurrente.

## 7. Tratamiento de materiales y tapacantos

La primera fase no crea catálogos globales. Cada proyecto guarda snapshots de los materiales y tapacantos que necesita para validar, optimizar y costear al cargar.

- `local_catalog_id` y SKU son trazabilidad, no identidad remota autoritativa.
- Las piezas referencian UUIDs de snapshots del mismo proyecto.
- Nombre, dimensiones y precio se preservan aunque el catálogo local cambie después.
- Un tapacanto es opcional si ningún lado está activo; si hay lados activos, el contrato exige referencia válida.
- Al cargar, los snapshots se incorporan al catálogo operativo temporal antes de crear las filas, evitando que `addPiezaRow()` descarte nombres inexistentes.
- La posterior introducción de catálogos compartidos deberá mantener snapshots históricos o versionados; no reemplazará silenciosamente precios/dimensiones ya guardados.

## 8. Fuente de verdad durante la migración

| Momento | Fuente de verdad |
|---|---|
| Edición activa antes de guardar | DOM para piezas/controles; `state` para catálogos y componentes |
| Guardado en curso | DTO inmutable capturado y validado antes de la llamada |
| Proyecto guardado en reposo | Filas de Supabase de la última versión confirmada |
| Carga completada | DOM/`state` hidratados desde el DTO; luego vuelven a ser fuente de edición activa |
| Resultados | Siempre pipeline local recalculado |

No habrá sincronización bidireccional en tiempo real ni autosave inicial. La UI debe distinguir “cambios locales sin guardar”, “guardando”, “guardado” y “error”; el éxito remoto nunca se presume.

## 9. Flujo de guardar proyecto

```text
acción UI
→ construir snapshot de proyecto desde lector DOM + state + controles
→ validar con reglas actuales y contrato schemaVersion
→ convertir a ProyectoPersistible sin datos derivados
→ ProjectPersistence.guardarProyecto(dto, expectedVersion)
→ ProjectRepository llama una operación transaccional
→ base verifica usuario/RLS y versión
→ upsert de projects + reemplazo de hijos
→ devuelve proyecto, version y updated_at confirmados
→ UI marca guardado; no recalcula ni altera entradas
```

Durante la solicitud se usa un `operationId` local para ignorar respuestas antiguas y se deshabilita el doble envío. Un timeout no equivale a fracaso definitivo: antes de reintentar debe consultarse por ID/idempotency key o recargar la versión.

## 10. Flujo de cargar proyecto

```text
acción UI con projectId
→ ProjectPersistence.cargarProyecto
→ Repository consulta cabecera y cinco conjuntos relacionados bajo RLS
→ mapea filas a un DTO único, ordenado y versionado
→ Persistence valida integridad y compatibilidad
→ controlador solicita confirmación si hay cambios locales sin guardar
→ hidrata catálogos/snapshots, controles y filas
→ recalcula una sola vez
→ si todo es válido, activa el proyecto cargado y su version
```

Si la consulta o validación falla, no se toca el proyecto activo. La hidratación debe prepararse fuera del DOM y aplicarse como unidad lógica; si falla a mitad, restaura el snapshot local anterior.

## 11. Reconstrucción del DOM y recálculo

Orden obligatorio:

1. suspender `recalcularDebounced` durante hidratación;
2. guardar snapshot local para reversión;
3. reemplazar `state.materiales`, `tapacantos` y componentes requeridos;
4. renderizar catálogos y refrescar selects;
5. aplicar `cantidadProyectos`, tablero, corte, márgenes, precios y opciones;
6. vaciar `#piezasBody` y llamar `addPiezaRow()` en `position` ascendente;
7. restaurar exactamente giro, lados, material, tapacanto y etiqueta;
8. actualizar controles de márgenes y layout;
9. reactivar eventos y llamar `recalcular()` una vez;
10. aceptar la carga solo si el pipeline devuelve `true`.

Se reutilizan `addPiezaRow`, `renderMateriales`, `renderTapacantos`, `renderComponentesProyecto`, `refrescarSelects`, `actualizarControlesMargenesExteriores`, `construirModeloProyecto` y `recalcular`. La persistencia no llama estas funciones: lo hace un adaptador/controlador UI.

La prueba principal compara snapshot fuente vs. snapshot releído tras hidratar y, por separado, resultados recalculados. No se simulan eventos de teclado para cargar datos.

## 12. Estrategia de repositorios

Estructura evaluada:

```text
src/scripts/infrastructure/supabase-client.js
src/scripts/repositories/project-repository.js
src/scripts/project/project-persistence.js
```

### `project-repository.js`

Responsabilidad: traducir el contrato de proyecto a consultas/RPC de Supabase y viceversa.

- recibe el cliente por dependencia o desde la infraestructura, no desde `main.js`;
- expone `create`, `getById`, `update`, `softDelete` y `list`;
- no accede a DOM, `state`, renderizadores ni algoritmos;
- siempre filtra registros activos cuando corresponde;
- preserva orden de hijos;
- traduce errores PostgREST/Postgres a códigos del dominio de persistencia;
- usa una RPC transaccional para guardar/reemplazar agregados.

Objeto global sugerido: `window.ProyCutProjectRepository` con una fábrica `crearProjectRepository({ client })`, evitando una instancia rígida difícil de probar.

### `project-persistence.js`

Responsabilidad: caso de uso y política de modo remoto/local.

- valida `schemaVersion` y DTO;
- selecciona repositorio configurado;
- expone `guardarProyecto`, `cargarProyecto`, `actualizarProyecto`, `eliminarProyecto`, `listarProyectos`;
- devuelve resultados explícitos, nunca alerts;
- no conoce Supabase, SQL, DOM ni `state`.

Objeto global sugerido: `window.ProyCutProjectPersistence` con fábrica inyectable.

## 13. Cliente Supabase

`src/scripts/infrastructure/supabase-client.js` será el único archivo que importe/construya el cliente del SDK.

- lee URL y clave publicable desde configuración de runtime;
- crea una sola instancia;
- expone `crearClienteSupabase(config)` y estado de disponibilidad;
- no contiene nombres de tablas ni reglas de proyecto;
- no contiene service-role key;
- no aplica fallback silencioso a un proyecto remoto distinto;
- permite inyectar un cliente falso en pruebas.

Con el sistema actual de scripts clásicos, la decisión de carga del SDK (CDN fijado o paso de build) debe quedar en el cambio técnico que lo incorpore, con versión exacta y prueba offline. No se modifica `index.html` durante inicialización local ni primera migración.

## 14. Variables de entorno

Variables conceptuales:

- `SUPABASE_URL` / equivalente publicable en runtime;
- `SUPABASE_ANON_KEY` o nueva publishable key;
- variables exclusivas de CLI para enlazar entornos, nunca entregadas al navegador;
- `SUPABASE_SERVICE_ROLE_KEY` solo en automatización/servidor seguro si llegara a necesitarse, jamás en frontend, repositorio Git o `.env.example` con valor real.

El navegador sin bundler no puede leer `.env` por sí mismo. El plan técnico siguiente debe elegir un mecanismo explícito de configuración de runtime o build; no se debe incluir un archivo local con secretos mediante `<script>`. La URL y clave publicable no sustituyen RLS.

La `.gitignore` actual ya ignora `.env` y `.env.*`, y conserva `!.env.example`. No requiere cambio para redactar este plan. Antes de usar CLI se revisará qué archivos locales genera realmente la versión fijada; no se ignorarán migraciones, `config.toml` ni `seed.sql`.

## 15. Auth inicial y futura

**Auth no es necesaria para** redactar el plan, ejecutar `supabase init`, levantar el entorno local o aplicar/probar migraciones SQL.

**Auth sí es necesaria antes de que el navegador lea o escriba un proyecto remoto de forma segura.** Sin usuario autenticado, una política para el rol `anon` convertiría los proyectos en datos públicos o exigiría un secreto que no puede vivir en frontend.

Alcance inicial de Auth propuesto por esta fase 1 — **PROPUESTA ANTERIOR SUPERADA EN SU MODELO DE OWNERSHIP POR LA DECISIÓN 53**, ver "Aviso de vigencia — ownership" arriba:

- un usuario individual;
- sesión administrada por Supabase Auth;
- `projects.owner_id = auth.uid()`;
- sin empresas, invitaciones, equipos ni roles avanzados.

Auth identifica usuarios; conforme a la decisión 53, la autorización de acceso a un proyecto debe basarse en membresía activa al workspace propietario, no en `owner_id = auth.uid()` directo. Auth futura podrá incorporar recuperación, proveedores adicionales y roles dentro de un workspace. No se implementará Auth completa en el mismo commit que la persistencia funcional.

## 16. RLS

**PROPUESTA ANTERIOR SUPERADA EN SU MODELO DE OWNERSHIP POR LA DECISIÓN 53** (ver "Aviso de vigencia — ownership" arriba). El principio general —RLS habilitada desde la misma migración que crea las tablas, sin excepciones "temporales"— sigue vigente; el predicado concreto de las políticas debe rediseñarse hacia membresía al workspace en vez de comparar contra `owner_id`.

RLS debe habilitarse en las tablas desde su migración.

- `projects`: el patrón propuesto por esta fase 1 era `select/insert/update/delete` solo cuando `owner_id = auth.uid()`; insert exigiría el mismo valor. Este predicado queda superado: la política real deberá comprobar membresía activa al workspace propietario del proyecto.
- Hijas: el mismo patrón superado condicionaba el acceso a que el proyecto padre activo tuviera `owner_id = auth.uid()`; debe rediseñarse en los mismos términos que la cabecera.
- Las políticas no deben confiar en un identificador de ownership proporcionado por UI para autorizar, sea cual sea el modelo final (`auth.uid()`/sesión autenticada en el propio predicado).
- La RPC de guardado usa `security invoker` siempre que sea posible y valida ownership/version dentro de la transacción — el ownership a validar es membresía al workspace, no `owner_id`.
- `anon` no tiene políticas de acceso a datos de proyecto.
- `deleted_at` se filtra en listados y cargas normales.

Pruebas obligatorias (adaptar sujetos de "usuario" a "workspace/membresía" al rediseñar): un usuario sin membresía en el workspace de un proyecto no puede leer, relacionar, actualizar ni borrar sus datos; no autenticado no puede acceder; una pieza no puede apuntar a material/tapacanto de otro proyecto.

Esto era aislamiento por propietario individual en la propuesta de fase 1; la decisión 53 lo reemplaza por aislamiento por workspace, con acceso mediante membresía — no multiempresa en el sentido de organizaciones con jerarquías avanzadas, pero sí compatible desde el inicio con más de un miembro por workspace.

## 17. Migraciones

- Todo DDL, restricciones, funciones, políticas e índices se crea mediante archivos versionados en `supabase/migrations/`.
- Nunca se edita producción manualmente como fuente principal.
- Cada migración debe arrancar desde una base vacía y documentar propósito, compatibilidad y reversión.
- Cambios destructivos siguen expandir → migrar → verificar → contraer en entregas distintas.
- Los tipos/constraints se basan en límites actuales, pero evitan acoplar mensajes UI a SQL.
- `schema_version` del DTO y migración SQL son conceptos distintos.
- El historial de migraciones se versiona en Git.

La primera migración no debe incluir datos derivados ni las capacidades excluidas. La reversión local puede reconstruir desde cero; una reversión remota con datos exige migración compensatoria, no borrar el historial aplicado.

## 18. Desarrollo local

El entorno local esperado, todavía no creado, contiene:

```text
supabase/
├── config.toml
├── migrations/
└── seed.sql
```

Proceso futuro:

1. fijar versiones de CLI/SDK en documentación;
2. ejecutar inicialización en un commit aislado;
3. verificar archivos generados antes de agregarlos;
4. iniciar servicios locales;
5. aplicar migraciones desde cero;
6. ejecutar seed únicamente con datos sintéticos;
7. probar reset repetible;
8. confirmar que ProyCut sigue abriendo y calculando sin servicios.

`seed.sql` no contiene credenciales reales, datos personales ni copias de producción. Inicialmente puede estar vacío o contener solo fixtures de pruebas claramente identificados.

## 19. Proyecto remoto

No se crea ni enlaza un proyecto remoto durante los primeros dos cambios. Después de validar migraciones y RLS localmente:

- crear un proyecto de desarrollo separado de producción;
- registrar región y política de backups;
- enlazar CLI mediante credenciales locales no versionadas;
- aplicar migraciones versionadas, nunca cambios manuales no capturados;
- configurar únicamente URL/clave publicable en el entorno autorizado;
- ejecutar pruebas smoke con un usuario de desarrollo y datos sintéticos;
- conservar producción fuera de alcance hasta aprobar round-trip y seguridad.

No se usa un proyecto remoto como sustituto del entorno local ni se comparten credenciales por Git.

## 20. Estrategia Git

- Un objetivo arquitectónico por commit.
- No mezclar documentación, CLI, migración, cliente, repositorio, Auth y UI.
- Versionar `supabase/config.toml`, migraciones y seed seguro.
- No versionar `.env*` salvo `.env.example` sin valores reales.
- Revisar `git diff --check`, migración desde cero y `git status --short` antes de cada commit.
- No reescribir migraciones ya aplicadas a un entorno compartido; crear otra.
- Etiquetar o registrar el último commit local-only funcional antes de conectar la UI.

Secuencia de commits sugerida: plan → inicialización local → esquema/RLS → cliente → repositorio → persistencia → Auth mínima → adaptador UI → guardar → cargar.

## 21. Modo local sin backend

El modo actual debe seguir funcionando al abrir el proyecto sin Supabase disponible.

- La ausencia de configuración remota no impide captura, cálculo, diagrama o exportación.
- `project-persistence` expone capacidad `remoteAvailable=false`; la UI oculta o deshabilita solo guardar/cargar remoto con explicación.
- No se realiza fallback automático de una escritura fallida a `localStorage`, porque podría aparentar sincronización inexistente.
- Las preferencias visuales continúan en `localStorage`.
- No se convierte `localStorage` en base paralela de proyectos durante esta fase.
- Importación/exportación manual siguen siendo la vía de respaldo del usuario local.

El modo local no significa una cola offline inicial. La sincronización offline requeriría IDs, conflictos e idempotencia adicionales y queda fuera del alcance.

## 22. Manejo de errores de red

Contrato de error normalizado:

```text
validation | unauthenticated | forbidden | not-found | conflict
network | timeout | unavailable | partial-operation | incompatible-data | unknown
```

Reglas:

- conservar siempre el proyecto local ante un fallo;
- no limpiar DOM ni `state` por error remoto;
- diferenciar “no se guardó” de “resultado desconocido por timeout”;
- permitir reintento explícito solo si es seguro/idempotente;
- no mostrar detalles SQL, tokens ni respuestas sensibles;
- registrar en consola solo contexto técnico redactado en desarrollo;
- no encadenar carga o navegación después de un guardado fallido;
- ante conflicto de versión, ofrecer recargar o conservar/exportar la copia local; no sobrescribir automáticamente.

## 23. Operaciones atómicas

Guardar/actualizar un agregado involucra cinco tablas y debe ser una transacción PostgreSQL. Se recomienda una función RPC versionada, por ejemplo conceptual `save_project_v1(payload, expected_version, idempotency_key)`, definida en migración.

La operación:

1. valida usuario;
2. bloquea/lee proyecto y comprueba `version`;
3. inserta o actualiza cabecera;
4. reemplaza snapshots e hijos;
5. valida relaciones dentro del mismo proyecto;
6. incrementa versión y actualiza timestamp;
7. confirma todo o revierte todo;
8. devuelve identidad y versión canónicas.

La función no calcula boards/costos. Debe limitar `search_path`, usar tipos conocidos, validar tamaño del payload y evitar `security definer` salvo justificación y pruebas específicas. La eliminación lógica también verifica versión.

## 24. Riesgos

- Dos fuentes editables si se intenta actualizar Supabase en cada evento DOM.
- Snapshot incompleto de parámetros que cambie el recálculo después de cargar.
- Pérdida del valor `rotado` por traducción incorrecta a `rotated`.
- `addPiezaRow()` descarta referencias si los snapshots no se hidratan primero.
- Identidad confundida entre UUID, `idInterno`, SKU, nombre y `source_row_id`.
- Inconsistencia entre cinco tablas sin RPC transaccional.
- Políticas RLS correctas en cabecera pero débiles en tablas hijas.
- Clave privilegiada expuesta al navegador.
- Manejo incorrecto de decimales JS/Postgres/JSON.
- Sobrescritura concurrente sin `version`.
- Timeout con commit exitoso seguido de reintento duplicado.
- Romper modo local al cargar SDK/configuración obligatoria.
- Querer introducir Auth, UI, esquema y repositorio en un solo cambio.
- Convertir snapshots iniciales en catálogos globales sin migración explícita.
- Crecimiento prematuro hacia entidades excluidas.

## 25. Pruebas

### Base de datos

- migración y reset desde cero;
- constraints de cantidades, dimensiones, precios, estados y giro;
- relaciones dentro del mismo proyecto;
- cascada/reemplazo esperado y soft delete;
- bloqueo optimista;
- transacción revierte ante cualquier hijo inválido;
- idempotencia del guardado;
- índices utilizados por listar/cargar.

### Seguridad

Categorías de prueba propuestas por esta fase 1 en términos de `owner_id`; ownership superado por la decisión 53 — al rediseñar, adaptar "propietario"/`owner_id` a "miembro del workspace propietario"/membresía, conservando el mismo tipo de cobertura:

- anónimo sin acceso;
- miembro del workspace con CRUD de los proyectos de ese workspace;
- usuario sin membresía en el workspace sin acceso a cabecera ni hijos;
- intento de cambiar la relación de ownership (workspace del proyecto) rechazado;
- RPC no evade RLS/ownership;
- ninguna clave privilegiada en archivos servidos o Git.

### Repositorio y persistencia

- cliente falso para éxito y cada error normalizado;
- mapeo exacto DTO ↔ filas;
- orden estable de piezas/materiales/componentes;
- decimales sin pérdida;
- datos incompatibles no llegan al DOM;
- listados excluyen eliminados.

### Integración con el proyecto

- round-trip DOM → DTO → base → DTO → DOM;
- una y varias piezas/materiales/tableros esperados;
- tres modos de giro y cuatro lados de tapacanto;
- márgenes uniformes e individuales, kerf cero/positivo;
- guillotina/libre y niveles de optimización;
- componentes y total cero/positivo;
- paridad de boards, costos y reporte después de recalcular;
- fallo remoto conserva UI y modo local;
- carga fallida revierte hidratación;
- exportaciones siguen funcionando tras una carga.

Las pruebas manuales críticas existentes continúan: plantillas del reporte, drag/rotación/espejo, importación CSV/Excel, Excel/DXF y preferencias.

## 26. Fases incrementales

1. **Plan aprobado:** contrato, alcance, riesgos y decisiones cerradas.
2. **Base local:** CLI/configuración reproducible, sin app conectada.
3. **Esquema mínimo:** tablas, constraints, RPC y RLS probadas localmente — el conteo y las columnas de ownership de la propuesta de fase 1 (5 tablas, `owner_id`) están superados por la decisión 53 y deben rediseñarse hacia workspace/membresía antes de esta fase.
4. **Cliente aislado:** configuración publicable y fábrica, aún sin botones.
5. **Repositorio:** CRUD/RPC probado con cliente falso y local.
6. **Persistencia:** DTO y servicio de aplicación con modo remoto desactivable.
7. **Auth mínima:** usuario autenticado con membresía a su workspace, sin roles avanzados — reemplaza el "usuario propietario" de la propuesta de fase 1, superado por la decisión 53.
8. **Adaptador de snapshot/hidratación:** sin red en sus pruebas.
9. **Guardar remoto:** acción explícita y estados de error.
10. **Cargar/listar:** protección de cambios locales y recálculo único.
11. **Proyecto remoto de desarrollo:** smoke/RLS; producción sigue fuera.

Cada fase debe poder revertirse al commit anterior y mantener el cálculo local.

## 27. Primeros tres cambios técnicos

### Cambio 1 — Inicialización local de Supabase

- Objetivo: crear estructura CLI local reproducible sin conectar la aplicación.
- Archivos esperados: `supabase/config.toml` y estructura generada necesaria; documentación del comando/versión. No tocar `main.js` ni `index.html`.
- Verificación: `supabase start/status/stop`, revisión de archivos, Git sin secretos y aplicación local intacta.
- Riesgo: versionar configuración específica de máquina o introducir archivos generados innecesarios.
- Commit: `chore(supabase): initialize local development environment`.

### Cambio 2 — Primera migración y RLS

- Objetivo: implementar tablas, constraints, índices, función transaccional y políticas de acceso. **No ejecutable tal cual**: el esquema de ownership de esta fase 1 (`owner_id`, "políticas del propietario") está superado por la decisión 53; requiere rediseño formal de workspace/membresía antes de escribirse como migración real — ver "Aviso de vigencia — ownership" arriba y la Skill `proycut-supabase-schema`.
- Archivos esperados: `supabase/migrations/<timestamp>_create_initial_project_schema.sql`; `supabase/seed.sql` solo si las pruebas requieren fixtures sintéticos.
- Verificación: reset desde cero, pruebas SQL de integridad, atomicidad y aislamiento.
- Riesgo: diseñar capacidades fuera del alcance, depender de Auth UI todavía inexistente, o migrar con un modelo de ownership ya superado.
- Commit: `feat(database): add initial project persistence schema`.

### Cambio 3 — Contrato y repositorio sin UI

- Objetivo: crear cliente inyectable, repositorio y servicio de persistencia, probados contra entorno local, sin botones ni hidratación DOM.
- Archivos esperados: `src/scripts/infrastructure/supabase-client.js`, `src/scripts/repositories/project-repository.js`, `src/scripts/project/project-persistence.js` y pruebas; cualquier carga en `index.html` debe ser un cambio pequeño y explícitamente justificado dentro de este alcance.
- Verificación: sintaxis, cliente falso, CRUD local, errores normalizados y modo sin configuración.
- Riesgo: filtrar SDK hacia `main.js` o habilitar acceso anónimo para evitar Auth.
- Commit: `feat(project): add Supabase persistence boundary`.

## 28. Primer cambio exacto recomendado

El siguiente cambio exacto es **inicializar Supabase localmente en un commit aislado**, después de aprobar este plan.

Debe:

1. verificar y fijar una versión compatible de Supabase CLI;
2. ejecutar `supabase init` en la raíz;
3. inventariar los archivos generados;
4. conservar `supabase/config.toml` y directorios versionables necesarios;
5. comprobar que no aparezcan secretos;
6. documentar comandos de iniciar, consultar estado, detener y resetear;
7. demostrar que el prototipo sigue funcionando sin levantar Supabase.

No debe crear migraciones, proyecto remoto, cliente JavaScript, variables de producción, Auth, tablas ni cambios en `index.html`, `main.js` o `.gitignore`. Su salida es únicamente una base local reproducible para que la primera migración sea el cambio siguiente.

## Resumen final

- **Ownership:** el modelo de esta fase 1 (propietario individual, `owner_id = auth.uid()`) quedó **superado** por `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` — los proyectos pertenecen a un workspace, accedido por membresía. Ver "Aviso de vigencia — ownership" al inicio del documento.
- **Tablas iniciales (propuesta de fase 1, ownership superado, conteo y columnas de propiedad sujetas a rediseño):** `projects`, `project_materials`, `project_edge_bands`, `project_parts`, `project_components`.
- **Datos persistidos:** metadatos/versiones, cantidad, configuración de corte/optimización/precios, filas fuente y snapshots project-scoped de materiales, tapacantos y componentes — sigue vigente, independiente del ownership.
- **Datos recalculados:** boards, posiciones, rectángulos libres, sobrantes, fronteras, cortes, costos, total, reporte, SVG, Excel y DXF — sigue vigente.
- **¿Auth es necesaria al inicio?** No para inicialización y migraciones locales; sí antes de permitir persistencia remota segura desde el navegador. La autorización real deberá validar membresía al workspace, no `owner_id`.
- **Primer cambio técnico:** ejecutar y documentar `supabase init` local en un commit aislado, sin esquema ni conexión de aplicación — sigue siendo el primer paso, no depende del ownership.
- **Riesgos principales:** doble fuente de verdad, hidratación incompleta, referencias/IDs, falta de atomicidad, RLS débil, secretos frontend, decimales, concurrencia, pérdida del modo local, y migrar con un modelo de ownership ya superado por la decisión 53.
