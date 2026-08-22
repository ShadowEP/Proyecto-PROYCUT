# 60 — Roadmap de arquitectura frontend ProyCut

## Estado

Documento conceptual de evolución frontend.

Pendiente de implementación.

## Versión

1.0

## Última actualización

2026-08-19

## Depende de

- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` — estado real del frontend hoy; fuente de verdad de "qué existe".
- `docs/engineering/05-ARCHITECTURE.md` — arquitectura objetivo por capas, todavía no implementada.
- `docs/engineering/57-PROYCUT-DOMAIN-MODEL.md` — modelo de dominio consolidado, no reabierto aquí.
- `docs/engineering/58-PROYCUT-OPTIMIZER-ROADMAP.md` — roadmap del motor de optimización, no reabierto aquí.
- `docs/engineering/59-PROYCUT-TECHNICAL-ARCHITECTURE-ROADMAP.md` — roadmap de arquitectura técnica general (capas, persistencia, backend, integraciones), no reabierto aquí.

## Propósito

Definir la hoja de ruta conceptual de evolución del **frontend** de ProyCut: cómo pasar de la interfaz actual (HTML y JavaScript clásico coordinado por una IIFE en `main.js`) hacia una organización interna por responsabilidades — Presentación, Aplicación, Dominio e Infraestructura — dentro del propio frontend, sin fijar todavía framework, librería de componentes, bundler ni estructura de carpetas definitiva.

Este documento es la extensión específica de frontend de `docs/engineering/59-PROYCUT-TECHNICAL-ARCHITECTURE-ROADMAP.md`. No repite sus secciones sobre cuándo introducir persistencia, backend o integraciones externas — remite a `59` para eso — y se concentra en cómo se organiza internamente el código que corre en el navegador.

## Este documento NO define

- framework frontend definitivo (React, Vue, Svelte u otro);
- librería de componentes ni sistema de diseño técnico;
- bundler ni herramienta de build;
- estructura de carpetas definitiva;
- nombres de componentes, hooks ni archivos concretos;
- SQL, backend, migraciones ni infraestructura remota (ver `59`);
- código, refactors ni movimiento de archivos.

Este documento habla de **responsabilidades y límites dentro del frontend**, no de tecnologías concretas.

---

# 1. Contexto actual

El frontend de ProyCut es hoy toda la aplicación: no existe una separación entre "frontend" y "backend" porque no hay backend. `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` describe en detalle el estado real:

- **Interfaz existente:** un único `index.html` que carga, en orden, 22 módulos JavaScript bajo `src/scripts/` y finalmente `main.js`, una IIFE de aproximadamente 5.500 líneas que coordina todo: captura de piezas, catálogos (materiales, tapacantos, componentes), configuración de corte, navegación, paneles, importación/exportación.
- **Lógica integrada:** validación, geometría, costeo y coordinación del pipeline conviven en el mismo documento que la manipulación del DOM. No hay una frontera técnica entre "lo que decide" y "lo que muestra".
- **Archivos principales:** `index.html` (marcado y orquestación de carga de scripts), `src/scripts/main.js` (coordinador central), y los 22 módulos extraídos bajo `config/`, `costing/`, `dxf/`, `excel/`, `geometry/`, `pieces/`, `project/`, `reports/`, `svg/`, `utils/` — cada uno con una responsabilidad y API pública documentada en `44`.
- **Interacción con el optimizador:** el frontend llama directamente `empacarMaterial(piezas, kerf, libre, nivel, datosTablero)`, expuesta desde `main.js`, y aplica su resultado a `state.boards` a través de `apply-project-results.js`. No existe hoy una frontera de puerto/adaptador entre la UI y el motor — la relación es una llamada de función directa dentro del mismo archivo, tal como confirma `docs/engineering/58-PROYCUT-OPTIMIZER-ROADMAP.md` (sección 3, "matiz verificado sobre la separación actual").
- **Generación de resultados:** el frontend renderiza el diagrama SVG del tablero (`board-renderer.js`), construye el reporte de costos en HTML (`report-renderer.js`) y genera artefactos de exportación (Excel, DXF) — todo ejecutado en el navegador, sin backend involucrado.
- **Fuente de verdad:** el DOM. Piezas, catálogos y parámetros de corte se leen directamente de inputs y tablas HTML en cada ciclo de `recalcular()`; no hay un modelo de estado independiente de la interfaz.

Esta arquitectura permitió validar el producto: el optimizador funciona, genera resultados correctos, y ya tiene partes de su lógica separadas en módulos con contratos utilizables. No es un prototipo descuidado — es un monolito frontend deliberadamente modularizado hasta el punto que el riesgo de seguir extrayendo sin un motivo concreto superaría el beneficio (`44`, sección 19). El objetivo de este documento no es señalar carencias, sino trazar cómo evoluciona desde aquí.

**Realidad actual vs. arquitectura objetivo:** `docs/engineering/05-ARCHITECTURE.md` describe una estructura futura con `src/modules/<dominio>/{domain,application,infrastructure,presentation}/`. Esa estructura **no existe hoy** en ningún módulo de ProyCut. La regla de lectura de la skill `proycut-architecture` aplica igual aquí: ante cualquier duda sobre "qué existe", `44` es la fuente real; `05` es la dirección, no el estado actual.

---

# 2. Principio general

El frontend debe evolucionar desde una aplicación centrada en archivos y funciones hacia una arquitectura organizada por responsabilidades.

Modelo objetivo (dirección, no estructura ya existente):

```text
Presentation
      ↓
Application
      ↓
Domain
      ↑
Infrastructure
```

Esto es la misma regla de dependencias que ya fija `05-ARCHITECTURE.md` (sección 9) y `59-PROYCUT-TECHNICAL-ARCHITECTURE-ROADMAP.md` (sección 2), aplicada específicamente al código que hoy vive bajo `index.html` y `src/scripts/`:

- la Presentación conoce la Aplicación; la Aplicación conoce el Dominio; el Dominio no conoce a ninguna de las dos;
- la Infraestructura (incluida cualquier API del navegador: `document`, `localStorage`, `Blob`, `canvas`, `FileReader`) implementa contratos que el Dominio y la Aplicación definen, nunca al revés;
- el Dominio del frontend (geometría, costeo, reglas de optimización) no debe depender de un framework de UI, de Supabase ni de ninguna API del navegador — principio que **ya se cumple hoy** en los módulos puros identificados por `44` (sección 10), aunque todavía no estén organizados bajo esta nomenclatura de capas.

El frontend no empieza esta evolución desde cero: ya tiene, sin llamarlos así, fragmentos de Dominio (`geometry/*`, `costing/*`, `dxf/*`), fragmentos de Aplicación (`project/prepare-project.js`, `optimize-project.js`, `apply-project-results.js`) y una Presentación todavía no separada (el resto de `main.js` e `index.html`). La evolución consiste en reconocer y reforzar esas fronteras, no en inventarlas de nuevo.

---

# 3. Presentación en el frontend: hoy y a futuro

**Hoy:** la Presentación no es una capa aislada. Vive mezclada dentro de `main.js` junto con lectura de catálogos, validación y coordinación: creación/edición de filas de piezas, render de tablas de materiales/tapacantos/componentes, navegación, paneles, combos de alta rápida, preferencias visuales. Lee y escribe el DOM directamente, y en el camino también muta `state` (el catálogo operativo).

**A futuro:** la Presentación debe limitarse a mostrar información, capturar acciones del usuario e invocar casos de uso — sin decidir permisos, sin calcular costos, sin ejecutar reglas de negocio directamente (mismo límite ya fijado por `05-ARCHITECTURE.md`, sección 4). Su relación con el Optimizer Engine, en particular, debe ser la que ya anticipa `58-PROYCUT-OPTIMIZER-ROADMAP.md` (sección 11): la interfaz es un consumidor del `Optimization Result` a través de un Output Generator, no parte del núcleo del optimizador.

Esta separación no exige adoptar un framework de componentes. Puede prepararse conceptualmente incluso dentro de la estructura actual, aislando primero *qué* función decide algo de *qué* función solo refleja ese resultado en el DOM.

---

# 4. Aplicación en el frontend: coordinación de casos de uso

**Hoy:** el pipeline `pieces-dom-reader.js → project-model.js → prepare-project.js → optimize-project.js → apply-project-results.js`, coordinado por `recalcular()` en `main.js`, ya se comporta como una capa de Aplicación embrionaria: recibe una solicitud (recalcular), prepara datos, invoca reglas del Dominio (optimización, costeo) y aplica resultados. `44` (sección 6) documenta este pipeline completo.

**A futuro:** esta capa debe ser la única que coordina un caso de uso completo — "recalcular proyecto", "guardar proyecto" (cuando exista, ver `59`), "exportar DXF", "exportar Excel" — recibiendo entradas explícitas de la Presentación y devolviendo resultados explícitos, sin conocer el DOM directamente ni el SDK de un proveedor externo. El principio ya confirmado en `59` (sección 4) aplica aquí en su forma más concreta: *ningún botón debe conocer directamente un proveedor externo o un algoritmo central; siempre a través de un controlador/fachada.*

La brecha real hoy, documentada explícitamente por `58` (sección 3): `exportarDXFZip()` llama a `recalcular()` de forma síncrona antes de generar el DXF, y `recalcular()` vuelve a ejecutar el optimizador desde cero en vez de reutilizar el `Optimization Result` ya existente en `state.boards`. Esto es una brecha real entre el principio de esta sección y la orquestación actual — no se propone corregirla en este documento, solo se registra como parte del contexto que la evolución del frontend deberá resolver eventualmente.

---

# 5. Dominio en el frontend: lo que ya es puro

**Hoy:** ProyCut ya tiene, sin llamarlo "Dominio", el núcleo de reglas más valioso del sistema separado y puro, según `44` (sección 10): `geometry/*`, `costing/*`, `dxf/*`, `svg/board-renderer.js`, `reports/*`, y las funciones estables de `utils/*` y `config/`. Ninguno de estos accede a `document`, `state` ni `localStorage`.

**A futuro:** este es el candidato natural a convertirse en el Dominio formal del frontend (o, según evolucione `59`, a compartirse entre frontend y un futuro backend si el cálculo necesita ejecutarse también fuera del navegador). El Optimizer Engine, tal como lo define `58` (sección 2), pertenece conceptualmente aquí: recibe datos, ejecuta lógica matemática, devuelve un resultado, sin conocer DOM ni formatos de archivo.

No se propone mover este código ahora. Ya cumple, en la práctica, el invariante de pureza que el Dominio exige — moverlo de carpeta sin necesidad real no aportaría nada que `44` no haya dejado ya documentado.

---

# 6. Infraestructura en el frontend: APIs del navegador y proveedores externos

**Hoy:** el frontend ya usa infraestructura del navegador de forma directa — `document.createElement('canvas')`, `Image`, `Blob`, `URL`, `FileReader`, `localStorage` — dentro de módulos como `excel-diagrams.js` o las secciones de importación/exportación de `main.js`. No hay todavía proveedores remotos: `44` confirma que no existe cliente HTTP ni dependencia de Supabase en el grafo de dependencias actual.

**A futuro:** cualquier acceso a una API del navegador que sirva a una regla de negocio (no solo a la interacción visual) debe quedar detrás de un contrato reemplazable, igual que exige `05-ARCHITECTURE.md` (sección 7) para proveedores externos. Esto incluye, cuando corresponda, el futuro cliente de persistencia descrito en `45-SUPABASE-INTEGRATION-PLAN.md` y retomado por `59` (sección 6): el frontend no debe importar un SDK externo dentro de su Dominio ni de su capa de coordinación — solo dentro de un archivo de infraestructura dedicado.

Los Output Generators ya identificados por `58` (sección 2) — SVG, DXF, Excel, y a futuro PDF/etiquetas — son, en este modelo, infraestructura de salida: consumen un resultado ya calculado y producen una representación, sin formar parte del algoritmo central.

---

# 7. Qué debe permanecer sin cambios ahora

Consistente con `59` (sección 3) y con `44` (secciones 10–11), lo siguiente no debe tocarse como parte de esta evolución de frontend:

- los módulos puros ya identificados (`geometry/*`, `dxf/*`, `costing/*`, `reports/*`, `svg/board-renderer.js`, `utils/*`, `config/limits.js`, `config/project-format.js`);
- el algoritmo concreto de empaquetado y la edición interactiva de tableros (rotar, espejar, compactar, drag) — de riesgo muy alto según `44` y `58`, no deben moverse sin protecciones de regresión;
- la estructura actual de `index.html` cargando scripts en orden — cambiarla implica decisiones de bundler/build que este documento no toma;
- cualquier decisión de framework de UI — introducir uno no resuelve, por sí solo, ningún problema de organización que la separación de responsabilidades no resuelva primero (ver sección 10).

---

# 8. Qué responsabilidades deben separarse gradualmente

Retomando el mapa de `main.js` de `44` (sección 4) desde el ángulo específico de frontend, las siguientes responsabilidades hoy mezcladas son candidatas a separarse — cuándo y en qué orden es una decisión posterior, no de este documento:

- **catálogos e identidad** (materiales, tapacantos, componentes): CRUD, render de tablas y combos hoy mezclados con `state` mutable;
- **importadores** (CSV, Excel): esquemas y vista previa propios, hoy coordinados desde `main.js`;
- **controladores de interacción** (filas de piezas, navegación por teclado, renumeración) — frontera de hidratación futura, según ya señala `44` (sección 19);
- **preferencias visuales**: hoy leídas/escritas directamente en `localStorage` desde controles dispersos.

El criterio para separar cualquiera de estas es el mismo que ya aplica la skill `proycut-architecture`: una extracción se justifica cuando aísla una responsabilidad real y estable, no para reducir líneas de `main.js` por sí solo.

---

# 9. Cuándo introducir un framework de UI

Este documento no decide si ProyCut adoptará un framework de componentes ni cuál. Fija únicamente el criterio conceptual para esa decisión futura:

- un framework de UI no debe introducirse **para resolver un problema de organización de código** — esa es una prohibición explícita ya registrada en la skill `proycut-architecture` y en `05-ARCHITECTURE.md` (sección 42, "monolito modular inicial: no se utilizarán microservicios ni frameworks de UI sin necesidad comprobada");
- la separación de responsabilidades descrita en las secciones 3–8 es independiente de la tecnología: puede empezar a prepararse conceptualmente dentro del `index.html`/`main.js` actual, antes de cualquier decisión de framework;
- la introducción de un framework, si llega a justificarse, es una decisión estructural que merece su propio ADR (`05-ARCHITECTURE.md`, sección 39) — no una consecuencia automática de este roadmap.

---

# 10. Relación con persistencia y backend

`59-PROYCUT-TECHNICAL-ARCHITECTURE-ROADMAP.md` (secciones 6–7) ya define cuándo introducir persistencia y backend a nivel de todo el sistema; este documento no lo reabre. Desde el ángulo específico de frontend, dos consecuencias directas:

- el frontend debe seguir funcionando en modo local (sin backend) durante toda esta evolución — ninguna separación de capas dentro del frontend puede volverse una excusa para requerir un servicio remoto obligatorio;
- cuando la persistencia entre (según el criterio ya fijado en `59`), lo hará como infraestructura del frontend (sección 6 de este documento) detrás de la fachada de caso de uso, nunca como una llamada directa desde un controlador de Presentación.

---

# 11. Relación con el modelo de dominio de negocio

`docs/engineering/57-PROYCUT-DOMAIN-MODEL.md` anticipa entidades futuras (`Project`, `Workspace`, `Customer`, `Quote`, `Order`) que hoy no existen como tales en el frontend — el "proyecto" actual está distribuido entre el DOM, cuatro catálogos y variables del cierre, tal como documenta `44` (sección 5). Este roadmap de frontend no exige construir esas entidades ahora. Exige que, cuando el negocio esté listo para representarlas (por ejemplo, una vista de cotización), ya exista una separación de Presentación/Aplicación/Dominio suficientemente clara como para ubicar esa nueva responsabilidad sin volver a mezclarla con el resto de la interfaz.

---

# 12. Cómo reducir riesgo en la evolución del frontend

Los mismos principios ya fijados por `59` (sección 9) y por la skill `proycut-safe-change` aplican íntegramente al frontend, sin variación:

1. un objetivo arquitectónico por cambio — no mezclar separación de responsabilidades con cambios funcionales;
2. no tocar los módulos de riesgo muy alto (algoritmo de empaquetado, edición de boards) sin protecciones de regresión ya definidas en `58` (sección 4);
3. preservar el modo local en cada paso;
4. registrar mediante ADR cualquier decisión estructural (por ejemplo, adoptar un framework, introducir un bundler);
5. ejecutar `proycut-regression-matrix` para cualquier cambio de código real que se derive de este roadmap — este documento, al ser conceptual, no lo activa por sí mismo.

---

# 13. Próximos pasos conceptuales

Sin fijar tecnología ni alcance de implementación:

1. Identificar, dentro de `main.js`, los primeros candidatos de Presentación que puedan aislarse sin tocar módulos de riesgo alto (por ejemplo, preferencias visuales o navegación).
2. Formalizar el pipeline ya embrionario de Aplicación (`prepare-project.js` → `optimize-project.js` → `apply-project-results.js`) como el patrón a repetir para futuros casos de uso, antes de decidir si necesita una carpeta `application/` propia.
3. Evaluar, cuando exista una necesidad concreta (no antes), si el volumen y la complejidad de la Presentación justifican un framework de UI — decisión que requiere su propio documento y ADR.
4. Mantener sincronizada esta hoja de ruta con `59` cada vez que cambie una decisión de persistencia o backend que afecte a la Infraestructura del frontend.

---

## Limitaciones de este documento

Este documento **no define**:

- framework, librería ni bundler;
- estructura de carpetas definitiva;
- componentes, hooks ni nombres de archivos concretos;
- SQL, backend ni migraciones;
- cronograma ni estimaciones de esfuerzo;
- refactors ni movimiento de código.

## Referencias

- [[44-CURRENT-ARCHITECTURE-INVENTORY]]
- [[05-ARCHITECTURE]]
- [[57-PROYCUT-DOMAIN-MODEL]]
- [[58-PROYCUT-OPTIMIZER-ROADMAP]]
- [[59-PROYCUT-TECHNICAL-ARCHITECTURE-ROADMAP]]
- `.agents/skills/proycut-architecture/SKILL.md`
- `.agents/skills/proycut-safe-change/SKILL.md`
