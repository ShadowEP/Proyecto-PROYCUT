# 28-HIERARCHICAL-CONFIG-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción completa del bloque de configuración jerárquica "Etapa 4" (4A + 4B) desde `src/scripts/main.js` hacia `src/scripts/config/hierarchical-config.js`, siguiendo el plan propuesto en `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md` (sección 15, punto 1).

## Depende de
`src/scripts/main.js`; `src/scripts/config/hierarchical-config.js`; `index.html`; `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Evaluar y extraer únicamente el bloque completo de configuración jerárquica identificado como "Etapa 4" (constantes, esquema de validación y funciones de las secciones 4A y 4B) hacia `src/scripts/config/hierarchical-config.js`, conservando exactamente nombres, estructuras, valores, comentarios, firmas, mensajes, reglas, orden relativo y comportamiento, y sin activar ninguna funcionalidad hasta ahora desconectada.

# Alcance real de Etapa 4

El bloque, delimitado por los comentarios de sección propios del código (`// ---------- Etapa 4A: modelo central de configuracion (aun sin conectar al optimizador) ----------` en la línea 315 y `// ---------- Etapa 4B: resolucion de kerf, margenes y area util ----------` en la línea 588), ocupa las líneas **315 a 727** de `src/scripts/main.js` (antes de cualquier edición): 413 líneas.

**Elementos que forman parte de Etapa 4** (20 en total, en su orden original):

| # | Nombre | Tipo | Sub-bloque |
|---|---|---|---|
| 1 | `NIVELES_CONFIGURACION_ETAPA4` | constante (`Object.freeze`, arreglo) | 4A |
| 2 | `CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4` | constante (`Object.freeze`, arreglo) | 4A |
| 3 | `REGLAS_CONFIGURACION_ETAPA4` | constante (`Object.freeze`, esquema de 65 reglas) | 4A |
| 4 | `CONFIGURACION_SISTEMA_ETAPA4` | constante (`Object.freeze`, valores por defecto de sistema) | 4A |
| 5 | `CONFIGURACION_BAMTECK_ETAPA4` | constante (`Object.freeze`, valores por defecto de empresa) | 4A |
| 6 | `configuracionesEtapa4` | constante (objeto, no congelado) | 4A |
| 7 | `esObjetoPlanoConfiguracion` | función | 4A |
| 8 | `clonarValorConfiguracion` | función | 4A |
| 9 | `combinarConfiguraciones` | función | 4A |
| 10 | `obtenerValorConfiguracion` | función | 4A |
| 11 | `validarConfiguracionEtapa4` | función (con `validarNodo` anidada) | 4A |
| 12 | `resolverConfiguracionJerarquica` | función | 4A |
| 13 | `resolverValorPorJerarquia` | función | 4A |
| 14 | `leerNumeroConfiguracionCorte` | función | 4B |
| 15 | `obtenerControlesMargenesExteriores` | función | 4B |
| 16 | `actualizarControlesMargenesExteriores` | función | 4B |
| 17 | `crearConfiguracionProyectoCorteActual` | función | 4B |
| 18 | `fuentesConfiguracionCorteActual` | función | 4B |
| 19 | `mensajesParametrosCorte` | función | 4B |
| 20 | `resolverParametrosCorteEtapa4` | función | 4B |

No se incluyó ningún elemento fuera de este rango de líneas: `obtenerAreaColocacionBoard` (línea 729, inmediatamente después del bloque) no pertenece a Etapa 4 — es una utilidad de tablero no relacionada, tal como ya se documentó en `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md` (grupo 4).

# Elementos evaluados

## 1-6. Qué se llama entre sí (dentro del bloque)

- `combinarConfiguraciones` llama a `esObjetoPlanoConfiguracion` y `clonarValorConfiguracion`, y se llama a sí misma recursivamente.
- `clonarValorConfiguracion` llama a `esObjetoPlanoConfiguracion` y usa `CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4`.
- `obtenerValorConfiguracion` usa `CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4`.
- `validarConfiguracionEtapa4` llama a `esObjetoPlanoConfiguracion`, usa `CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4` y `REGLAS_CONFIGURACION_ETAPA4` (dentro de su función anidada `validarNodo`).
- `resolverConfiguracionJerarquica` llama a `esObjetoPlanoConfiguracion` y `combinarConfiguraciones`.
- `resolverValorPorJerarquia` llama a `obtenerValorConfiguracion` y `resolverConfiguracionJerarquica`, y usa `configuracionesEtapa4` como valor por defecto (`fuentes || configuracionesEtapa4`).
- `obtenerControlesMargenesExteriores` no llama a nada más del bloque (solo `document`).
- `actualizarControlesMargenesExteriores` llama a `obtenerControlesMargenesExteriores`.
- `crearConfiguracionProyectoCorteActual` llama a `obtenerControlesMargenesExteriores` y `leerNumeroConfiguracionCorte`.
- `fuentesConfiguracionCorteActual` usa `configuracionesEtapa4` y llama a `combinarConfiguraciones` y `crearConfiguracionProyectoCorteActual`.
- `resolverParametrosCorteEtapa4` llama a `fuentesConfiguracionCorteActual`, `resolverConfiguracionJerarquica`, `validarConfiguracionEtapa4`, `mensajesParametrosCorte` y `obtenerValorConfiguracion`.

Todas estas relaciones internas se conservan dentro del mismo archivo destino, sin necesidad de exposición adicional.

## 4. Elementos usados actualmente desde otras partes de `main.js` (fuera del bloque)

Se verificó, para los 20 elementos, si existía alguna referencia fuera del rango de líneas 315-727 (antes de la edición). Solo 3 de los 20 tienen consumidores externos:

| Elemento | Líneas externas que lo usan (antes de editar) |
|---|---|
| `obtenerControlesMargenesExteriores` | 5622 (wiring de eventos de márgenes exteriores) |
| `actualizarControlesMargenesExteriores` | 5624, 5628, 5632, 5638 (mismo bloque de wiring) |
| `resolverParametrosCorteEtapa4` | 3707 (`validarProyecto`), 3811 y 3834 (`leerPiezas`), 5379 (`recalcular`) |

Los 17 elementos restantes (todas las constantes, `esObjetoPlanoConfiguracion`, `clonarValorConfiguracion`, `combinarConfiguraciones`, `obtenerValorConfiguracion`, `validarConfiguracionEtapa4`, `resolverConfiguracionJerarquica`, `resolverValorPorJerarquia`, `leerNumeroConfiguracionCorte`, `crearConfiguracionProyectoCorteActual`, `fuentesConfiguracionCorteActual`, `mensajesParametrosCorte`) **no tienen ninguna referencia fuera del bloque**: solo se usan entre sí, dentro del propio Etapa 4.

## 5. Elementos que dependen del DOM

4 de los 20 elementos acceden a `document` directamente o a través de otro elemento del mismo bloque:

- `leerNumeroConfiguracionCorte` — `document.getElementById(inputId)`.
- `obtenerControlesMargenesExteriores` — `document.getElementById(...)` (5 controles).
- `actualizarControlesMargenesExteriores` — llama a `obtenerControlesMargenesExteriores` y lee/escribe `.checked`/`.disabled`/`.value` de esos controles.
- `crearConfiguracionProyectoCorteActual` — depende de `obtenerControlesMargenesExteriores` y `leerNumeroConfiguracionCorte` (DOM indirecto).
- `fuentesConfiguracionCorteActual` y `resolverParametrosCorteEtapa4` dependen de `crearConfiguracionProyectoCorteActual` (DOM indirecto, dos niveles).

Los 15 elementos restantes (todas las constantes y las funciones de la sección 4A, más `mensajesParametrosCorte`) **no acceden a `document` en ningún momento**.

## 6. Elementos que dependen de `LIMITES` u otros módulos ya extraídos

**Ninguno.** Se realizó una búsqueda exhaustiva de `state.`, `LIMITES`, y de todos los nombres expuestos por los módulos ya extraídos (`format.js`, `validation.js`, `limits.js`, `text-normalization.js`, `csv.js`, `project-format.js`, `basic-geometry.js`, `free-rectangles.js`) dentro del rango de líneas 315-727: **cero coincidencias**. El bloque completo es autosuficiente; su única dependencia externa es la API global `document`, que no requiere ninguna referencia explícita adicional (es un global del navegador, disponible igual en cualquier archivo `<script>`).

## 7. Elementos definidos pero no conectados a la aplicación

- **`resolverValorPorJerarquia`**: declarada, pero **nunca invocada** en ningún otro punto de `main.js` (confirmado por `grep` en el archivo completo, antes y después de la extracción). Se movió tal cual, sin activarla ni conectarla a nada.
- **`configuracionesEtapa4.sucursal`** y **`configuracionesEtapa4.proyecto`**: ambos se inicializan en `null` y ningún código del archivo les asigna un valor (`grep` de `configuracionesEtapa4\.` en todo el archivo solo encuentra lecturas, dentro del propio bloque, nunca escrituras). El comentario original de la línea 446 ya advertía: *"Sucursal, proyecto y piezas empiezan vacios... 'piezas' queda preparado para guardar en el futuro una configuracion parcial"* — esto se conserva exactamente igual, sin conectar nada nuevo.
- El propio comentario de cabecera del bloque (línea 315-318, conservado sin cambios) documenta que "ninguna funcion de geometria, precio, reporte o exportacion" consulta este modelo "todavia" — afirmación que sigue siendo cierta después de esta extracción: los tres consumidores externos (`validarProyecto`, `leerPiezas`, `recalcular`, vía `resolverParametrosCorteEtapa4`) ya existían antes de esta tarea y no se modificaron.

## 8. ¿Puede moverse completo sin cambiar comportamiento?

**Sí.** Los 20 elementos no tienen ninguna dependencia externa al bloque salvo `document` (global) y, en el caso de los 3 elementos con consumidores externos, pueden re-exponerse en `main.js` mediante una desestructuración explícita desde `window.ProyCutHierarchicalConfig`, exactamente como se hizo con los módulos anteriores. No fue necesario detenerse ni dejar ningún elemento fuera del bloque.

# Elementos extraídos

Los 20 elementos listados en "Alcance real de Etapa 4", sin excepción.

# Elementos descartados y motivo

Ninguno. El bloque completo cumplió el criterio de poder moverse sin cambiar comportamiento.

# Dependencias

- **Internas al módulo**: todas las relaciones descritas en el punto 1-6 se conservan dentro de `src/scripts/config/hierarchical-config.js`, sin cambios.
- **Externas**: `document` (global del navegador, sin necesidad de referencia explícita).
- **`LIMITES` u otro módulo ya expuesto**: no aplica; el bloque no los usa. No se agregó ninguna línea del tipo `const LIMITES = window.ProyCutLimits;` porque no habría tenido ningún uso real (se verificó explícitamente antes de descartar esta necesidad).
- **Referencias que `main.js` necesita de vuelta**: únicamente `obtenerControlesMargenesExteriores`, `actualizarControlesMargenesExteriores` y `resolverParametrosCorteEtapa4`, agregadas a la desestructuración local al inicio de la IIFE de `main.js`.

# Archivos creados

- **`src/scripts/config/hierarchical-config.js`**: extraído mecánicamente (vía `sed`, sin retipeo manual) de las líneas 315-727 originales de `main.js`, envuelto en su propia IIFE:
  ```js
  (function(){
    // ---------- Etapa 4A: modelo central de configuracion (aun sin conectar al optimizador) ----------
    ... (los 20 elementos, en su orden original) ...

    window.ProyCutHierarchicalConfig = {
      NIVELES_CONFIGURACION_ETAPA4,
      CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4,
      REGLAS_CONFIGURACION_ETAPA4,
      CONFIGURACION_SISTEMA_ETAPA4,
      CONFIGURACION_BAMTECK_ETAPA4,
      configuracionesEtapa4,
      esObjetoPlanoConfiguracion,
      clonarValorConfiguracion,
      combinarConfiguraciones,
      obtenerValorConfiguracion,
      validarConfiguracionEtapa4,
      resolverConfiguracionJerarquica,
      resolverValorPorJerarquia,
      leerNumeroConfiguracionCorte,
      obtenerControlesMargenesExteriores,
      actualizarControlesMargenesExteriores,
      crearConfiguracionProyectoCorteActual,
      fuentesConfiguracionCorteActual,
      mensajesParametrosCorte,
      resolverParametrosCorteEtapa4
    };
  })();
  ```

# Archivos modificados

- **`src/scripts/main.js`**: se eliminó únicamente el bloque completo (líneas 315-727 originales, más la línea en blanco que lo separaba del código anterior — 414 líneas en total), sin tocar ni una línea antes ni después de ese rango. Se agregó, al inicio de la IIFE (después del bloque de `window.ProyCutFreeRectangles`, antes de `let BOARD_W = 2440;`), la referencia local:
  ```js
  const {
    obtenerControlesMargenesExteriores,
    actualizarControlesMargenesExteriores,
    resolverParametrosCorteEtapa4
  } = window.ProyCutHierarchicalConfig;
  ```
  Los 17 elementos restantes **no** se destructuraron en `main.js`, porque ningún código fuera del bloque los invoca: solo se usan entre sí, y ahora viven exclusivamente dentro de `hierarchical-config.js`.

  No se modificó ninguna de las 6 invocaciones externas existentes (`obtenerControlesMargenesExteriores` ×1, `actualizarControlesMargenesExteriores` ×4, `resolverParametrosCorteEtapa4` ×4 — una de ellas era la propia declaración, quedando 3+4=... ver sección Comparación para el conteo exacto).

- **`index.html`**: se insertó `<script src="./src/scripts/config/hierarchical-config.js"></script>` entre `free-rectangles.js` y `main.js`, sin alterar ninguna otra etiqueta:
  ```html
  <script src="./src/scripts/utils/format.js"></script>
  <script src="./src/scripts/config/limits.js"></script>
  <script src="./src/scripts/utils/validation.js"></script>
  <script src="./src/scripts/utils/text-normalization.js"></script>
  <script src="./src/scripts/config/project-format.js"></script>
  <script src="./src/scripts/utils/csv.js"></script>
  <script src="./src/scripts/geometry/basic-geometry.js"></script>
  <script src="./src/scripts/geometry/free-rectangles.js"></script>
  <script src="./src/scripts/config/hierarchical-config.js"></script>
  <script src="./src/scripts/main.js"></script>
  ```
  El módulo no depende de ningún otro archivo de configuración ya cargado (ver "Dependencias"), por lo que su posición exacta entre `free-rectangles.js` y `main.js` es la más conservadora posible: no se modificó el orden de ningún script existente.

No se modificaron reglas de configuración, no se activó ninguna función previamente desconectada, no se conectaron nuevas claves, no se cambiaron prioridades sistema/empresa/sucursal/proyecto/pieza, no se cambió kerf ni márgenes, y no se tocó `validarProyecto`, `leerPiezas`, `recalcular`, el optimizador, `state`, el DOM (fuera de la reubicación física del código que ya lo consultaba), ni ningún otro módulo.

# Comparación

- `diff` entre el bloque completo (líneas 315-727) en `main.js` (antes de editar) y el cuerpo insertado en `hierarchical-config.js`: **sin diferencias (IDÉNTICO)**.
- Búsqueda de las 20 declaraciones (`const NOMBRE`/`function NOMBRE(`) en `main.js` tras el cambio: **sin coincidencias** para ninguna.
- Confirmación de que el inicio del archivo (líneas 1-314) y el resto del archivo (antes 729 en adelante, ahora reubicado) permanecen byte-idénticos: verificado por `diff` de ambos tramos por separado — **sin diferencias**.
- Conteo total de apariciones de `obtenerControlesMargenesExteriores` en el commit `HEAD`: 4 (1 declaración + 2 llamadas internas al bloque + 1 llamada externa). Tras el cambio: `hierarchical-config.js` tiene 3 (1 declaración + 2 internas), `main.js` tiene 1 (la externa) — **4 en total, sin pérdidas ni duplicados**.
- Comparación textual (sin números de línea) de la llamada externa a `obtenerControlesMargenesExteriores`, las 4 llamadas a `actualizarControlesMargenesExteriores`, y las 4 llamadas a `resolverParametrosCorteEtapa4`, entre el commit `HEAD` y el `main.js` actual: **sin diferencias** en `actualizarControlesMargenesExteriores` y `resolverParametrosCorteEtapa4`; en `obtenerControlesMargenesExteriores` la única diferencia esperada es la desaparición de las 2 llamadas internas (que se movieron junto con el bloque), confirmada explícitamente.
- `node --check` sobre `hierarchical-config.js` y `main.js`: ambos sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `hierarchical-config.js` y `main.js` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados) y `src/scripts/config/hierarchical-config.js` (nuevo), además de este reporte. (El archivo `docs/engineering/27-JAVASCRIPT-MODULE-ROADMAP.md` también aparece como no rastreado en `git status`, pero es un entregable de la tarea anterior, no de esta.)

# Verificaciones (según lo pedido)

1. El bloque extraído pertenece realmente a Etapa 4 — confirmado: los 20 elementos están delimitados exactamente por los comentarios de sección "Etapa 4A"/"Etapa 4B" del propio código, sin incluir nada antes ni después de esos límites.
2. Cada declaración y función es equivalente al original — confirmado por `diff` byte a byte del bloque completo.
3. `main.js` ya no contiene las declaraciones movidas — confirmado por `grep` (las 20, sin coincidencias).
4. Todas las referencias externas permanecen intactas — confirmado por comparación textual contra `HEAD` para las 3 funciones con consumidores externos.
5. Las dependencias se resuelven de forma explícita — confirmado: `main.js` desestructura exactamente los 3 elementos que necesita desde `window.ProyCutHierarchicalConfig`; no se detectó ninguna dependencia de `LIMITES` u otro módulo que resolver.
6. `hierarchical-config.js` carga antes de `main.js` — confirmado.
7. `node --check` correcto en ambos archivos — confirmado.
8. `index.html`, `hierarchical-config.js` y `main.js` responden `200` por HTTP — confirmado.
9. No se activó ninguna funcionalidad previamente desconectada — confirmado: `resolverValorPorJerarquia` sigue sin invocarse en ningún lugar (mismo resultado de `grep` antes y después), y `configuracionesEtapa4.sucursal`/`.proyecto` siguen en `null` sin ninguna escritura nueva.
10. Sin cambios fuera de `index.html`, `src/scripts/main.js`, `src/scripts/config/hierarchical-config.js` y este reporte — confirmado por `git status --short` (aparte del reporte 27, preexistente de la tarea anterior).

# Pruebas automáticas

Se ejecutó un sandbox de Node (`vm`, sin dependencias nuevas) que compara dos implementaciones cargadas de forma independiente: (a) el módulo real extraído en `hierarchical-config.js`, y (b) una copia de control ensamblada directamente desde el mismo fragmento de código original (`HEAD`, extraído por `sed`). Ambas se ejecutaron con un `document` simulado mínimo (`getElementById` respaldado por un mapa de controles falsos con `.value`/`.checked`), necesario para probar las funciones de la sección 4B.

**Incidente detectado y corregido durante la tarea**: la primera versión de las pruebas construía los objetos de entrada (`fuentes`, `configuracion`) en el realm de Node (fuera del sandbox de `vm`) y los pasaba como argumento a las funciones del sandbox. Esto provocó que `esObjetoPlanoConfiguracion` los rechazara silenciosamente (`Object.getPrototypeOf(valor) === Object.prototype` compara contra el `Object.prototype` del sandbox, distinto al del realm anfitrión), generando resultados vacíos/degenerados en ambas implementaciones por igual — un falso positivo de "coinciden" que en realidad no ejercitaba el código real. Se detectó por inspección de los resultados antes de reportarlos, y se corrigió reconstruyendo cada caso de prueba como una expresión evaluada *dentro* del propio sandbox (mismo realm que las funciones bajo prueba). Los resultados que siguen son los de la versión corregida.

| Caso | Resultado real |
|---|---|
| Combinación sistema + empresa | Objeto combinado con las 15 secciones de `CONFIGURACION_SISTEMA_ETAPA4` y `CONFIGURACION_BAMTECK_ETAPA4` fusionadas correctamente |
| Valores de sucursal nulos | Igual al resultado de combinar solo sistema + empresa (sucursal `null` no aporta ni rompe nada) |
| Valores de proyecto nulos, sucursal con dato propio (`kerf.value_mm:6`) | `kerf.value_mm` resuelto en `6` (la sucursal sí se aplica; el proyecto nulo no interfiere) |
| Sobrescritura por nivel superior (proyecto `kerf.value_mm:12` sobre empresa `4`) | `12` (el nivel más específico gana, como documenta el comentario original) |
| Valor válido (`kerf.value_mm:8`) | `{"ok":true,"errores":[]}` |
| Valor fuera de regla (`kerf.value_mm:999`, fuera de 0-20) | `{"ok":false,"errores":["kerf.value_mm: no puede ser mayor que 20."]}` |
| Clave desconocida (`clave_inventada.x`) | `{"ok":false,"errores":["clave_inventada.x: clave de configuracion desconocida."]}` |
| Resolución de kerf (DOM simulado: kerf=4, sin márgenes exteriores) | `kerf:4, kerfEntrePiezas:4, kerfPiezaSobrante:4, kerfBordeExterior:0` |
| Resolución de márgenes: margen único = 15 | `margenes:{left:15,right:15,top:15,bottom:15}` |
| Resolución de márgenes: independientes 1/2/3/4 | `margenes:{left:1,right:2,top:3,bottom:4}` |
| No mutación de las configuraciones de entrada | Confirmado: los objetos `entradaSistema`/`entradaEmpresa` pasados a `combinarConfiguraciones` permanecen `JSON.stringify`-idénticos antes y después de la llamada |

En los 11 casos comparativos (más la verificación de no-mutación), el resultado de la implementación extraída coincidió exactamente con el de la copia de control ensamblada independientemente desde el código original — **11/11 OK**.

Verificaciones adicionales sobre el objeto expuesto:
- `window.ProyCutHierarchicalConfig` existe y es un objeto.
- `CONFIGURACION_SISTEMA_ETAPA4` y `CONFIGURACION_BAMTECK_ETAPA4` siguen congeladas (`Object.isFrozen(...) === true` en ambas).
- `configuracionesEtapa4.sucursal` y `.proyecto` siguen en `null` (sin conectar).

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **Cargar la aplicación** (ARR-01): confirmar que `index.html` carga sin errores en la consola, con el nuevo `<script>` de `hierarchical-config.js` en su lugar.
- **Agregar una pieza** (PZ-01): confirmar que el flujo normal de captura de piezas sigue funcionando (usa `resolverParametrosCorteEtapa4` indirectamente vía `leerPiezas`/`validarProyecto`).
- **Cambiar kerf** (COR-01): cambiar el valor de "Kerf (mm)" y confirmar que el recálculo usa el nuevo valor, igual que antes del cambio.
- **Activar márgenes exteriores**: marcar la casilla "Aplicar márgenes exteriores" y confirmar que los controles de margen se habilitan (mismo comportamiento de `actualizarControlesMargenesExteriores`).
- **Usar margen único**: con "Mismo margen en los 4 lados" activado, cambiar el valor general y confirmar que los 4 lados se sincronizan visualmente.
- **Usar márgenes independientes**: desactivar "Mismo margen" y capturar 4 valores distintos, confirmar que el área de colocación los respeta cada uno por su lado.
- **Confirmar diagrama** (OPT-01/DIAG-01): confirmar que el diagrama de corte se genera igual que antes del cambio, con los mismos tableros y piezas.
- **Confirmar total** (REP-01): confirmar que el total del reporte de costos no cambia respecto al comportamiento anterior a esta extracción.
- **Revisar consola**: confirmar que no aparece ningún error ni advertencia nueva relacionada con `ProyCutHierarchicalConfig`, `resolverParametrosCorteEtapa4`, `obtenerControlesMargenesExteriores` o `actualizarControlesMargenesExteriores`.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 27). La verificación se limitó a un sandbox de Node con un `document` simulado mínimo, peticiones HTTP directas y comparación textual del código.
- El `document` simulado usado en las pruebas automáticas es deliberadamente mínimo (solo `getElementById` respaldado por un mapa fijo); no reproduce comportamientos reales del DOM como `disabled`, herencia de estilos, o eventos de verdad — las funciones `actualizarControlesMargenesExteriores`/`obtenerControlesMargenesExteriores` solo quedan parcialmente cubiertas por esta vía, y dependen de las pruebas manuales pendientes para una validación completa.
- Este módulo, como advertía su propio comentario original (conservado sin cambios), sigue sin estar conectado al optimizador, precio, reporte o exportación más allá de lo que ya existía antes de esta tarea (`validarProyecto`, `leerPiezas`, `recalcular` vía `resolverParametrosCorteEtapa4`, y el wiring de eventos de márgenes exteriores). Cualquier expansión futura de su uso real es una decisión de producto/arquitectura fuera del alcance de esta extracción mecánica.
- `resolverValorPorJerarquia` permanece expuesta en `window.ProyCutHierarchicalConfig` pero sin ningún llamador; si en el futuro se decide usarla, deberá evaluarse por separado (no se validó su comportamiento más allá de la comparación automática contra el original, ya que el propio código nunca la ejercita en producción).

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, el bloque completo de Etapa 4 (los 20 elementos, con sus comentarios de sección) en su ubicación previa (después de `completarSkuVaciosCatalogos(state);`, antes de `function obtenerAreaColocacionBoard`), copiando su contenido desde `src/scripts/config/hierarchical-config.js`.
2. Eliminar, del inicio de la IIFE de `main.js`, el bloque:
   ```js
   const {
     obtenerControlesMargenesExteriores,
     actualizarControlesMargenesExteriores,
     resolverParametrosCorteEtapa4
   } = window.ProyCutHierarchicalConfig;
   ```
3. Eliminar `src/scripts/config/hierarchical-config.js`.
4. Eliminar la etiqueta `<script src="./src/scripts/config/hierarchical-config.js"></script>` de `index.html`.

Como el bloque movido está verificado como byte-idéntico a su versión original, este proceso de reversión es mecánico.
