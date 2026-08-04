# 41-PROJECT-OPTIMIZATION-COORDINATION-DECOUPLING-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-04

## Propósito
Registrar el quinto desacoplamiento arquitectónico de ProyCut: aislar la coordinación de optimización que ocurre después de `prepararProyectoParaOptimizacion()` y antes de actualizar `state.boards`, renderizar y calcular costos, manteniendo en `main.js` y sin cambios los algoritmos `empacarMaterial`, `empacarConLista`, `empacarConListaLibre`, `splitFreeRect` y sus funciones locales.

## Depende de
`src/scripts/main.js`; `src/scripts/project/prepare-project.js`; `src/scripts/project/optimize-project.js`; `index.html`; `docs/engineering/36-ARCHITECTURAL-DECOUPLING-PLAN.md`; `docs/engineering/37-COST-CALCULATION-DECOUPLING-REPORT.md`; `docs/engineering/38-PIECES-DOM-READING-DECOUPLING-REPORT.md`; `docs/engineering/39-PROJECT-MODEL-DECOUPLING-REPORT.md`; `docs/engineering/40-PROJECT-PREPARATION-DECOUPLING-REPORT.md`

## Referenciado por
PENDIENTE

---

# 1. Bloque original analizado

El bloque original correspondía a `src/scripts/main.js`, líneas **4670–4724**, inmediatamente después de consumir el resultado exitoso de `prepararProyectoParaOptimizacion()` y antes de preservar la pestaña activa, asignar `state.boards`, renderizar y calcular costos.

El bloque realizaba, en este orden:

1. Inicializar `totalCortes`, `totalCorteMm`, `boardsAll` y `tablerosPorMaterial`.
2. Recorrer `Object.keys(porMaterial)` en el orden de enumeración actual del objeto.
3. Resolver las medidas del tablero de cada material mediante `medidaTableroDeMaterial(mat)`.
4. Asignar esas medidas a las variables de cierre `BOARD_W` y `BOARD_H`.
5. Calcular el área útil con los márgenes resueltos del proyecto.
6. Omitir silenciosamente el material si el área útil era inválida.
7. Resolver el kerf efectivo del grupo mediante `obtenerKerfMaterial(...)`.
8. Calcular el área de colocación y omitir silenciosamente el material si era inválida.
9. Construir `datosTablero` con medidas, áreas, márgenes y cuatro valores efectivos de kerf.
10. Llamar `empacarMaterial(...)` con el grupo, kerf entre piezas, modo libre/guillotina, nivel de optimización y datos del tablero.
11. Compactar hacia abajo cada board recién producido.
12. Guardar el número de tableros del material.
13. Etiquetar cada board con `materialLabel` e `indexEnMaterial`.
14. Combinar los boards de todos los materiales en `boardsAll`, conservando orden.
15. Acumular cortes y longitud mediante `contarCortes(board)`.

No había lectura directa del DOM, escritura a `state`, renderizado ni cálculo de costos dentro de esas líneas.

# 2. Datos de entrada

El bloque recibía indirectamente desde la preparación:

- `porMaterial`: `preparacion.gruposPorMaterial`;
- `parametrosCorte`: `preparacion.parametrosCorteProyecto`;
- `libre`: `preparacion.opcionesProyecto.libre`;
- `nivelOptimizacion`: `preparacion.opcionesProyecto.nivelOptimizacion`.

También dependía de funciones existentes del cierre o de módulos ya cargados:

- `medidaTableroDeMaterial`;
- `calcularRectanguloUtilTablero`;
- `obtenerKerfMaterial`;
- `calcularRectanguloColocacion`;
- `empacarMaterial`;
- `compactarHaciaAbajo`;
- `contarCortes`.

La escritura temporal de `BOARD_W`/`BOARD_H` era un efecto sobre el cierre de `main.js`. Para conservarla sin acoplar el módulo nuevo, se convirtió en la dependencia explícita `establecerMedidaTableroActiva`.

# 3. Función creada

Se creó `optimizarProyectoPreparado(...)` en `src/scripts/project/optimize-project.js`, expuesta mediante:

```js
window.ProyCutProjectOptimization = {
  optimizarProyectoPreparado
};
```

La función contiene únicamente la coordinación previamente inline. No contiene criterios de orden, semillas, selección interna entre `empacarConLista`/`empacarConListaLibre`, colocación de piezas, división de rectángulos libres ni funciones locales del empaquetado.

# 4. Contrato de entrada

```js
optimizarProyectoPreparado({
  gruposPorMaterial,
  parametrosCorteProyecto,
  opcionesProyecto: {
    libre,
    nivelOptimizacion
  },
  dependencias: {
    medidaTableroDeMaterial,
    establecerMedidaTableroActiva,
    calcularRectanguloUtilTablero,
    obtenerKerfMaterial,
    calcularRectanguloColocacion,
    empacarMaterial,
    compactarHaciaAbajo,
    contarCortes
  }
})
```

Todos los datos y funciones necesarios llegan explícitamente. El módulo no accede a `document`, `state` ni `localStorage`, y no expone globalmente el núcleo del optimizador.

# 5. Contrato de salida

```js
{
  ok: true,
  boards,
  tablerosPorMaterial,
  totalCortes,
  totalCorteMm
}
```

- **`boards`**: combinación ordenada de los boards producidos por cada grupo de material; equivale a `boardsAll`.
- **`tablerosPorMaterial`**: número de boards producido para cada material, consumido por costos.
- **`totalCortes`**: suma de `contarCortes(board).cortes`, consumida por costos.
- **`totalCorteMm`**: suma de `contarCortes(board).largoMm`, consumida por costos.

No se añadió una rama artificial `{ok:false, errores}` porque el bloque original no generaba errores propios. Cuando `calcularRectanguloUtilTablero` o `calcularRectanguloColocacion` devolvían `ok:false`, el `forEach` omitía ese material silenciosamente y continuaba. El coordinador conserva exactamente ese comportamiento y devuelve `ok:true` con los datos acumulados.

# 6. Calidad, modo y selección de estrategia

El coordinador pasa sin transformar:

- `opcionesProyecto.libre` como tercer argumento de `empacarMaterial`;
- `opcionesProyecto.nivelOptimizacion` como cuarto argumento;
- `kerfMaterial.entrePiezas` como kerf de empaquetado.

La selección real de estrategia sigue dentro de `empacarMaterial`:

```js
const empacar = libre ? empacarConListaLibre : empacarConLista;
```

También permanecen allí:

- la interpretación de `normal`, `optimizada` y `completa`;
- la mezcla de orientación solo en `completa`;
- los cuatro o seis criterios fijos;
- las seis o catorce semillas deterministas;
- la evaluación por número de boards y cortes;
- la reconstrucción de sobrantes y fronteras.

No cambió ninguna fórmula ni condición del núcleo.

# 7. Orden y estructura de boards

El orden se conserva en dos niveles:

1. Los grupos se recorren mediante `Object.keys(gruposPorMaterial)`, igual que antes.
2. Los boards de cada material se recorren en el orden devuelto por `empacarMaterial`.

Cada board se etiqueta antes de añadirse al resultado:

```js
board.materialLabel = material;
board.indexEnMaterial = indice + 1;
```

No se clona ni reconstruye la estructura del board. Se conservan los mismos objetos producidos por el optimizador y compactados por `compactarHaciaAbajo`, incluyendo `boardW`, `boardH`, kerf, piezas, posiciones, dimensiones, rotación, `freeRects`, sobrantes, fronteras y cortes.

# 8. Efectos secundarios

## 8.1 Dentro del coordinador

- Llama `establecerMedidaTableroActiva` por material para reproducir las asignaciones originales de `BOARD_W` y `BOARD_H`.
- Llama `compactarHaciaAbajo` sobre cada board recién creado, igual que antes.
- Añade `materialLabel` e `indexEnMaterial` a esos boards de salida, igual que antes.

No modifica `gruposPorMaterial`, sus piezas, `parametrosCorteProyecto` ni `opcionesProyecto`. Los algoritmos reciben los mismos grupos que antes; `empacarMaterial` trabaja con copias para ordenar (`slice().sort(...)` y `barajar(...)`).

## 8.2 Efectos que permanecen en `recalcular()`

- leer y preparar el proyecto;
- mostrar errores de preparación;
- gestionar salidas tempranas;
- leer el estado anterior de pestañas;
- asignar `state.boards` exactamente en el punto posterior a optimización;
- actualizar `state.activeTab`;
- mostrar `resultadoPanel`;
- llamar `renderDiagrama()`;
- llamar `calcularCostosProyecto()`;
- gestionar errores de costos;
- renderizar el reporte;
- actualizar `state.ultimoTotal` y `state.ultimoReporte`;
- devolver el booleano final de `recalcular()`.

No se añadió cancelación de debounce dentro de `recalcular()`: se preservó el comportamiento real existente, donde los flujos que necesitan cancelarlo lo hacen antes de llamar a `recalcular()`.

# 9. Consumidores posteriores

`calcularCostosProyecto()` recibe del resultado:

- `boards`;
- `tablerosPorMaterial`;
- `totalCortes`;
- `totalCorteMm`.

También recibe las mismas `piezas` preparadas y los mismos catálogos/opciones que antes, directamente desde `recalcular()`.

`renderDiagrama()` no recibe parámetros; después de que `recalcular()` asigna `state.boards = boardsAll`, lee esos mismos boards desde `state` y conserva el manejo de `state.activeTab`.

# 10. Comparación contra el bloque original

Se implementó una copia de control del bloque original de coordinación y se ejecutó contra el módulo real `optimize-project.js` cargado con `vm.runInThisContext`. Ambas rutas recibieron entradas equivalentes y dependencias controladas independientes.

Se comparó con `assert.deepStrictEqual` la salida completa, no solo la cantidad de boards. La comparación incluyó:

- `ok`;
- cantidad y orden de boards;
- `boardW` y `boardH`;
- `materialLabel` e `indexEnMaterial`;
- valores de kerf;
- piezas y su orden;
- posiciones `x`/`y`;
- dimensiones `w`/`h`;
- `rotada`;
- `freeRects`;
- sobrantes;
- fronteras de kerf;
- cortes y longitud;
- `tablerosPorMaterial`;
- orden y argumentos de todas las dependencias;
- actualizaciones de medida activa por material.

También se tomaron snapshots profundos antes y después para verificar no mutación de grupos, piezas, parámetros y opciones.

# 11. Pruebas automáticas

Se ejecutaron **19 escenarios**:

1. una pieza;
2. varias piezas;
3. un material;
4. varios materiales;
5. varios tableros;
6. giro Auto;
7. giro Normal;
8. giro Rotado;
9. calidad rápida real (`normal`);
10. calidad intermedia real (`optimizada`);
11. calidad alta real (`completa`);
12. modo guillotina;
13. modo libre;
14. kerf cero;
15. kerf positivo;
16. márgenes exteriores;
17. pieza que ocupa casi todo el tablero;
18. orden de grupos;
19. orden de boards.

**Resultado: 19/19 escenarios OK.**

Verificaciones estructurales adicionales:

- todos los archivos JavaScript de `src/scripts/` pasaron `node --check`;
- `git diff --check` pasó;
- `optimize-project.js` no contiene `document.`, `state.`, `localStorage` ni definiciones de los algoritmos protegidos;
- `empacarMaterial`, `empacarConLista`, `empacarConListaLibre` y `splitFreeRect` permanecen en `main.js`;
- `index.html`, `prepare-project.js`, `optimize-project.js` y `main.js` respondieron HTTP 200 desde un servidor estático local;
- `optimize-project.js` carga después de `prepare-project.js` y antes de `main.js`.

# 12. Pruebas manuales pendientes

No se ejecutaron ni se aprueban en este reporte:

- una pieza;
- varias piezas;
- un material;
- varios materiales;
- varios tableros;
- las tres calidades (`normal`, `optimizada`, `completa`);
- modo guillotina;
- modo libre;
- giro Auto, Normal y Rotado;
- kerf cero y positivo;
- márgenes exteriores;
- costos y subtotales;
- diagramas y pestañas;
- arrastre, rotación, espejo y compactación manual;
- exportación Excel;
- exportación DXF;
- consola del navegador sin errores durante todo el flujo.

# 13. Riesgos

- **Dependencias explícitas numerosas**: el coordinador recibe ocho funciones porque el núcleo debe permanecer privado en `main.js`. Es un costo deliberado de esta fase incremental; reducirlas moviendo algoritmos o exponiéndolos globalmente habría violado el alcance.
- **Efecto de medida activa conservado mediante callback**: aunque `BOARD_W`/`BOARD_H` apenas se usan después del recálculo, eliminar esas asignaciones habría cambiado comportamiento interno. `establecerMedidaTableroActiva` conserva el efecto sin introducir acceso global desde el módulo.
- **Mutación deliberada de boards de salida**: compactación y etiquetado modifican boards recién producidos. No es mutación de entradas del proyecto; es la misma construcción progresiva del resultado que realizaba el bloque original.
- **Omisión silenciosa heredada**: áreas útiles o de colocación inválidas se omiten sin convertirlas en errores. El coordinador no corrige este comportamiento conocido.
- **Contrato dependiente de `empacarMaterial`**: el coordinador presupone que devuelve un arreglo de boards, igual que antes. Cualquier cambio futuro a ese contrato deberá actualizarse por separado.
- **Pruebas con dependencias controladas**: la comparación demuestra equivalencia exacta del coordinador y de su contrato, orden y propagación de estructuras. Las pruebas manuales siguen siendo necesarias para validar el algoritmo real y el renderizado completo en navegador.
- **Dependencia de carga**: `optimize-project.js` debe cargarse después de `prepare-project.js` y antes de `main.js`.

# 14. Reversión

La reversión es puramente de código y documentación:

1. Restaurar en `recalcular()` el bloque inline original de coordinación de optimización.
2. Eliminar la destructuración de `window.ProyCutProjectOptimization` en `main.js`.
3. Eliminar la carga de `src/scripts/project/optimize-project.js` en `index.html`.
4. Eliminar `src/scripts/project/optimize-project.js`.
5. Eliminar este reporte si también se revierte la documentación.

No hay migración de datos, cambios en `localStorage`, cambios a `state` ni cambios en la estructura de boards. En un árbol de trabajo con cambios previos sin commit, la reversión debe ser dirigida a estas líneas y archivos; no debe usarse una restauración amplia que elimine los desacoplamientos anteriores.
