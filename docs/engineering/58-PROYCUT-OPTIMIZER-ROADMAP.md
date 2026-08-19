# 58 — Roadmap del Optimizer Engine ProyCut

## Estado

Documento conceptual de evolución del motor optimizador. Pendiente de implementación técnica.

## Versión

1.1

## Última actualización

2026-08-19

## Depende de

- `docs/engineering/53-PROYCUT-OWNERSHIP-DECISION.md` — decisión de ownership por workspace, no reabierta aquí.
- `docs/engineering/54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL.md` — modelo conceptual de workspace y membresías, no reabierto aquí.
- `docs/engineering/55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL.md` — qué capacidades habilita cada plan, no reabierto aquí.
- `docs/engineering/56-PROYCUT-ENTITLEMENT-PERMISSION-MODEL.md` — relación plan/rol/acceso, no reabierta aquí.
- `docs/engineering/57-PROYCUT-DOMAIN-MODEL.md` — modelo de dominio (Workspace, Project, Optimizer Engine como servicio), no reabierto aquí.
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md`, `docs/engineering/05-ARCHITECTURE.md` sección 36, y las Skills `proycut-sheet-optimizer`, `proycut-cutting-geometry`, `proycut-free-rectangles`, `proycut-costing`, `proycut-dxf-r12`, `proycut-board-rendering` — fuente de lo documentado en la sección 3 sobre el estado actual real del optimizador y sus generadores de salida; leídas para este documento, no modificadas.

## Propósito

Definir la hoja de ruta conceptual del motor optimizador de ProyCut: qué hace actualmente, qué responsabilidades tiene, qué responsabilidades NO debe tener, qué mejoras futuras necesita, qué funciones dependen del negocio y qué funciones dependen de producción. El Optimizer Engine se trata como un núcleo independiente, consistente con el modelo de dominio de `57` (recibe `Project Data`, no es propietario de datos).

Este documento **no define**:

- código;
- arquitectura frontend;
- arquitectura backend;
- SQL;
- APIs;
- Supabase;
- implementación del algoritmo.

## 1. Propósito del Optimizer Engine

El optimizador es el núcleo diferencial de ProyCut.

ProyCut evoluciona desde "herramienta de optimización de tableros" hacia "plataforma completa de diseño, cotización y producción" (ver `docs/engineering/55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL.md`, sección 1), pero el Optimizer Engine continúa siendo el núcleo matemático de esa plataforma, no una función más entre otras.

## 2. Principio arquitectónico

El optimizador **no** es propietario de datos. Recibe información, procesa, y devuelve resultados.

Modelo:

```text
Project Data
     |
Optimizer Engine
     |
Optimization Result
     |
Output Generators
     |
     +-- DXF
     +-- PDF
     +-- Excel
     +-- Labels
     +-- Reports
     +-- Production Documents
```

**Optimizer Engine:**

- recibe datos fuente necesarios para optimizar;
- ejecuta lógica matemática;
- devuelve un resultado de optimización;
- no debe conocer formatos de archivo ni detalles de presentación.

**Optimization Result:**

- representa el resultado derivado del proceso de optimización;
- puede ser consumido por pantalla, reportes y generadores de archivos.

**Output Generators:**

- consumen `Optimization Result`;
- producen representaciones o documentos;
- no forman parte del algoritmo matemático central.

Principio a preservar: agregar un nuevo formato de salida no debería requerir modificar el algoritmo del optimizador.

Este principio es consistente con `docs/engineering/57-PROYCUT-DOMAIN-MODEL.md` (sección 16, "Optimizer Engine") y con la arquitectura objetivo ya registrada en `docs/engineering/05-ARCHITECTURE.md` sección 36: el motor de optimización debe mantenerse independiente de la interfaz y del proveedor de almacenamiento.

## 3. Estado actual del optimizador

Lo siguiente está confirmado por lectura directa del código y de las Skills de dominio que lo documentan (`proycut-sheet-optimizer`, `proycut-cutting-geometry`, `proycut-free-rectangles`, `proycut-dxf-r12`, `proycut-board-rendering`); no se inventa ninguna función adicional.

**Entrada real:** `empacarMaterial(piezas, kerf, libre, nivel, datosTablero)`, expuesta desde `src/scripts/main.js`. `piezas` llega ya expandida y filtrada por `leerPiezas()` (una entrada por unidad física, no agrupada por cantidad).

**Reglas que utiliza:** prueba 4 criterios de orden fijo (6 en nivel `'completa'`) más 6 órdenes aleatorios con semilla fija, corre el empaquetador correspondiente (`empacarConLista` en modo guillotina, `empacarConListaLibre` en modo libre) para cada orden, y se queda con el resultado que use menos tableros y, en empate, menos cortes totales. El generador aleatorio es determinista (congruencial lineal con semilla fija, sin `Math.random()`).

**Resultados que genera (`Optimization Result` real hoy):** distribución de piezas por tablero (posición, rotación), cantidad de tableros por material, sobrantes/huecos libres reconstruidos con fronteras de kerf, y conteo de cortes. `optimize-project.js` aplica automáticamente `compactarHaciaAbajo(board)` sobre cada tablero resultante como parte del pipeline normal, antes de que el resultado llegue a `state.boards`.

**Output Generators existentes hoy** (consumidores confirmados de ese resultado, no parte del algoritmo):

- **SVG/render de tablero** (`src/scripts/svg/board-renderer.js`, `dibujarBoard`) — recibe un `board` ya calculado (`board.pieces`/`board.freeRects`) y devuelve un string SVG; no recalcula geometría ni corre el optimizador.
- **DXF** (`src/scripts/dxf/dxf-export.js`, `construirDXFTablero`) — módulo puro: recibe un `board` y devuelve texto DXF; no accede a `document`/`state`/red ni conoce el algoritmo de empaquetado.
- **Excel** (`src/scripts/excel/excel-diagrams.js`) — reutiliza el mismo SVG de `dibujarBoard` y lo rasteriza a PNG para incrustarlo; no tiene una ruta de dibujo propia.
- **Reporte de costos** (`src/scripts/reports/report-renderer.js`) — consume `boards`/`tablerosPorMaterial`/`totalCortes` ya calculados.

**Futuro (no existen hoy como generadores independientes):**

- PDF;
- etiquetas;
- otros documentos de producción listados en la sección 11.

**Matiz verificado sobre la separación actual (no ocultar):** aunque los módulos individuales (`dxf-export.js`, `board-renderer.js`) son puros y no conocen el algoritmo, la **orquestación** en `main.js` hoy no logra el desacople completo descrito en la sección 2: `exportarDXFZip()` llama a `recalcular()` de forma síncrona y obligatoria antes de generar el DXF, y `recalcular()` vuelve a ejecutar `empacarMaterial()` desde cero. En la práctica, el flujo de exportación DXF re-dispara el optimizador en vez de reutilizar directamente el `Optimization Result` ya existente en `state.boards` (y, como efecto conocido, descarta cualquier edición manual del acomodo hecha antes de exportar — ver `proycut-dxf-r12`). Esto es una brecha real entre la separación conceptual de la sección 2 y la orquestación actual, no algo ya resuelto; no se propone corregirla en este documento.

**Ubicación real (no objetivo):** el algoritmo concreto (`empacarMaterial`/`empacarConLista`/`empacarConListaLibre`) y la edición interactiva de un tablero (rotar, espejar, compactar, imanes, drag) viven hoy en `src/scripts/main.js`, junto al DOM — no están extraídos como servicio independiente. `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` clasifica esto explícitamente como "no mover ahora" por riesgo de regresión; este documento no propone esa extracción como parte de este roadmap, solo constata la brecha frente al objetivo de la sección 2. Ver sección 4 para la estrategia de evolución hacia esa separación.

## 4. Estrategia de evolución arquitectónica del Optimizer Engine

### Estado actual

El algoritmo de optimización todavía está parcialmente integrado con `main.js` y con coordinadores de aplicación/UI (ver sección 3, "Ubicación real"). Esta situación está documentada y **no debe interpretarse como autorización para hacer una extracción grande ahora**.

### Dirección futura

Conceptualmente, ProyCut debería evolucionar hacia una estructura similar a:

```text
Optimizer Core
      +
Application / Adapters
      +
Presentation
```

**Optimizer Core:**

- lógica matemática pura;
- geometría;
- reglas de colocación;
- estrategias de optimización;
- sin DOM;
- sin Supabase;
- sin UI;
- sin formatos de archivo.

**Application / Adapters:**

- preparan datos de entrada;
- invocan el motor;
- adaptan `Optimization Result` para otros módulos (incluidos los Output Generators de la sección 2);
- coordinan integración con el dominio superior.

**Presentation:**

- visualización;
- interacción;
- edición manual;
- controles;
- feedback al usuario.

Esta es una dirección arquitectónica futura. **NO significa:**

- reescribir ahora el optimizador;
- mover inmediatamente `empacarMaterial`;
- cambiar algoritmos existentes;
- modificar resultados;
- cambiar contratos sin pruebas.

### Condición para una extracción futura

Una futura extracción del Optimizer Core solo debería realizarse cuando existan suficientes protecciones de regresión, incluyendo conceptualmente:

- casos de prueba reproducibles;
- fixtures de proyectos;
- comparación de resultados antes/después;
- validación geométrica;
- pruebas de rotación/veta/kerf;
- comparación de cantidad de tableros;
- comparación de desperdicio;
- pruebas de interacciones manuales relevantes.

Esas pruebas no se implementan en este documento; se registran como condición previa a cualquier extracción futura.

## 5. Responsabilidades actuales

### Entrada

- dimensiones de piezas;
- cantidades;
- dimensiones de tableros;
- margen;
- kerf;
- orientación;
- veta.

### Procesamiento

- cálculo de acomodo;
- búsqueda de distribución;
- reducción de desperdicio.

### Salida

- diagramas;
- posiciones;
- cantidad de tableros;
- desperdicio calculado.

## 6. Lo que NO debe hacer el Optimizer Engine

El optimizador no debe manejar directamente:

- usuarios;
- permisos;
- billing;
- suscripciones;
- clientes;
- cotizaciones;
- pedidos;
- producción.

Esos pertenecen al dominio superior (ver `docs/engineering/57-PROYCUT-DOMAIN-MODEL.md`). El optimizador procesa `Project Data` y entrega `Optimization Result`; no decide quién puede pedir esa optimización ni qué se hace comercialmente con el resultado — eso lo determinan Workspace, Membership Role y Subscription Plan (ver `56`).

## 7. Roadmap de mejoras

### P0 — Calidad del motor

Prioridad máxima:

- precisión;
- estabilidad;
- rendimiento;
- casos extremos;
- validaciones.

### P1 — Funciones de producto

Funciones relacionadas con planes Personal (ver `55`):

- tapacantos;
- materiales;
- componentes;
- costos derivados;
- mejores configuraciones de optimización;
- comparación de resultados.

### P2 — Producción profesional

Funciones relacionadas con Business (ver `55`), la mayoría Output Generators sobre el `Optimization Result` (ver sección 2):

- etiquetas;
- reportes;
- listas de corte;
- DXF;
- CNC;
- postprocesadores;
- configuraciones de máquina.

### P3 — Funciones avanzadas futuras

Registradas como futuro, sin diseño ni compromiso de alcance:

- optimización multicriterio;
- inteligencia artificial;
- sugerencias automáticas;
- integración con máquinas;
- aprendizaje de patrones.

## 8. Tapacantos y Optimizer

Tapacantos no es solamente una característica visual. Afecta dimensiones reales, consumo, piezas, costos y producción — confirmado por el contrato real de costeo (`proycut-costing`): el metraje de tapacanto se calcula a partir de las dimensiones reales de cada pieza y sus lados activos, no de forma independiente a la geometría.

El motor debe recibir información correcta de tapacanto para que el resultado de optimización y el costo derivado sean consistentes entre sí.

## 9. Componentes y muebles

**Actualmente:** el optimizador procesa piezas individuales.

**Futuro:**

```text
Mueble
   |
Componentes
   |
Piezas
   |
Optimización
```

El optimizador procesa piezas; el dominio superior (Project, ver `57`) organiza componentes y muebles. Esta jerarquía es una dirección futura de producto, no un contrato ya implementado.

## 10. Optimización manual y automática

**Automático:** el motor calcula.

**Manual:** el usuario puede ajustar (la edición interactiva actual — rotar, espejar, compactar, mover con imán — ya existe hoy en `main.js`, ver sección 3).

Debe conservarse conceptualmente:

- resultado del motor;
- cambios manuales;
- historial.

## 11. Vista y experiencia de usuario

Mejoras futuras a registrar:

- nueva visualización;
- interacción con tablero;
- mover piezas;
- comparar alternativas;
- vista producción;
- vista cliente.

UI ≠ Motor: la interfaz es un consumidor del `Optimization Result` (a través de un Output Generator, ver sección 2), no parte del núcleo del optimizador.

## 12. Integración con producción

```text
Optimization Result
        |
Output Generators
        |
        +-- etiquetas
        +-- DXF
        +-- PDF
        +-- fichas técnicas
        +-- órdenes de trabajo
```

## 13. Datos fuente vs. derivados

**Fuente:**

- piezas;
- materiales;
- reglas;
- parámetros.

**Derivado:**

- acomodo;
- desperdicio;
- diagramas;
- DXF;
- reportes.

Esto es consistente con la separación fuente/derivado ya confirmada en `docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md` y `docs/engineering/57-PROYCUT-DOMAIN-MODEL.md` (sección 17): los resultados del optimizador son siempre recalculables, nunca la fuente primaria a persistir.

## 14. Decisiones futuras pendientes

- algoritmo exacto (mantener el actual, reemplazarlo o complementarlo);
- estrategia de optimización;
- soporte CNC;
- prioridades del motor;
- optimización multicriterio;
- edición manual avanzada;
- 3D;
- diseño concreto de las protecciones de regresión requeridas para una futura extracción del Optimizer Core (ver sección 4).

## 15. Limitaciones del documento

Este documento **no define**:

- código;
- arquitectura frontend;
- arquitectura backend;
- SQL;
- APIs;
- Supabase;
- implementación del algoritmo;
- pseudocódigo de algoritmo detallado;
- tablas;
- RLS;
- migraciones;
- implementación de pruebas;
- refactors.

## Referencias

- [[53-PROYCUT-OWNERSHIP-DECISION]]
- [[54-PROYCUT-WORKSPACE-MEMBERSHIP-MODEL]]
- [[55-PROYCUT-SUBSCRIPTION-AND-CAPABILITY-MODEL]]
- [[56-PROYCUT-ENTITLEMENT-PERMISSION-MODEL]]
- [[57-PROYCUT-DOMAIN-MODEL]]
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md`
- `docs/engineering/05-ARCHITECTURE.md` (sección 36)
- `.agents/skills/proycut-sheet-optimizer/SKILL.md`
- `.agents/skills/proycut-cutting-geometry/SKILL.md`
- `.agents/skills/proycut-free-rectangles/SKILL.md`
- `.agents/skills/proycut-costing/SKILL.md`
- `.agents/skills/proycut-dxf-r12/SKILL.md`
- `.agents/skills/proycut-board-rendering/SKILL.md`
