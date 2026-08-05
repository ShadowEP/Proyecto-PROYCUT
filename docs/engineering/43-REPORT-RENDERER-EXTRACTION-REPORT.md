# 43-REPORT-RENDERER-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-04

## Propósito
Registrar la extracción completa del subsistema que genera el HTML del reporte de precio, trasladándolo desde `src/scripts/main.js` a `src/scripts/reports/report-renderer.js` sin cambiar plantillas, textos, clases, formato monetario, inserción en DOM ni estado.

## Depende de
`src/scripts/main.js`; `src/scripts/reports/report-renderer.js`; `src/scripts/utils/format.js`; `src/scripts/costing/calculate-costs.js`; `src/scripts/project/apply-project-results.js`; `index.html`; `docs/engineering/37-COST-CALCULATION-DECOUPLING-REPORT.md`; `docs/engineering/42-PROJECT-RESULTS-APPLICATION-DECOUPLING-REPORT.md`

## Referenciado por
PENDIENTE

---

# 1. Bloque original analizado

El subsistema ocupaba exactamente `src/scripts/main.js`, líneas **4471–4632** antes de la extracción. Comenzaba con el comentario de “Plantillas de diseño del reporte Precio del proyecto” y terminaba al cerrar `renderReporteFactura`, inmediatamente antes de `recalcular()`.

El bloque no accedía a `document`, `state`, `localStorage` ni variables privadas del cierre, salvo las utilidades `fmt` y `fmtMoney` ya obtenidas desde `window.ProyCutFormat` al inicio de `main.js`.

No tenía efectos secundarios: recorría arreglos únicamente para construir strings, no asignaba propiedades a los datos y no insertaba HTML en el DOM.

# 2. Funciones extraídas

Se trasladaron completas y sin reformatear:

- `renderReporte`;
- `totalBarHtml`;
- `lineasMaterialHtml`;
- `lineasTapaHtml`;
- `lineasComponentesHtml`;
- `renderReporteColumnas`;
- `renderReporteLista`;
- `renderReporteTarjetas`;
- `renderReporteFactura`.

Aunque la solicitud enumeraba “las cuatro plantillas” además de cinco funciones auxiliares, el bloque contiene nueve declaraciones en total: la función de despacho, cuatro helpers y cuatro plantillas.

Relación interna:

```text
renderReporte
  ├─ renderReporteColumnas
  ├─ renderReporteLista
  ├─ renderReporteTarjetas
  └─ renderReporteFactura

cada plantilla
  ├─ totalBarHtml
  ├─ fmt / fmtMoney
  └─ helpers de líneas según corresponda
```

Ninguna función interna tiene consumidores externos. Solo `renderReporte` se expone públicamente.

# 3. Módulo creado

Se creó `src/scripts/reports/report-renderer.js` con el patrón de módulos clásico del proyecto:

```js
window.ProyCutReportRenderer = {
  renderReporte
};
```

No se introdujeron módulos ES, `import`, `export` ni `type="module"`.

`index.html` carga el archivo después de `format.js` y de los demás módulos existentes, pero antes de `main.js`, por lo que `window.ProyCutFormat` y `window.ProyCutReportRenderer` están disponibles cuando se ejecuta la IIFE principal.

# 4. Contrato de entrada

Se conservó la firma original:

```js
renderReporte(datosReporte, plantilla, disenoTotal)
```

## `datosReporte`

Es el objeto producido por `calcularCostosProyecto()` y contiene estas propiedades reales:

```js
{
  materiales,
  matSubtotal,
  cantidadProyectos,
  componentes,
  componentesSubtotal,
  tableros,
  cortes,
  corteMl,
  corteMlPresentacion,
  precioCorte,
  corteLineaLabel,
  corteImporte,
  tapacantos,
  tapaSubtotal,
  total
}
```

Propiedades internas consumidas por el renderer:

- `materiales[]`: `nombre`, `tableros`, `importe`;
- `componentes[]`: `producto`, `cantidad`, `precio`, `importe`;
- `tapacantos[]`: `tipo`, `metros`, `importe`;
- subtotales `matSubtotal`, `componentesSubtotal`, `corteImporte`, `tapaSubtotal`;
- métricas `tableros`, `cortes`, `corteMlPresentacion`;
- texto ya calculado `corteLineaLabel`;
- `total`.

El renderer no usa directamente `cantidadProyectos`, `corteMl` ni `precioCorte`, aunque forman parte del contrato completo de `datosReporte` para otros consumidores.

Todos los valores monetarios, cantidades, metrajes, subtotales y textos de fórmula ya llegan calculados. El renderer solo selecciona una plantilla y aplica `fmt`/`fmtMoney` para presentación.

## `plantilla`

- `'lista'` → lista compacta;
- `'tarjetas'` → tarjetas;
- `'factura'` → factura clásica;
- cualquier otro valor, incluido `'columnas'` → columnas.

## `disenoTotal`

Controla exclusivamente las clases de la barra final:

- `'solido'` → `tb-solido`;
- `'contorno'` → `tb-contorno`;
- `'linea'` → `tb-linea`;
- cualquier otro valor mantiene únicamente `total-bar`.

No existe un argumento ni objeto `estilo` en el contrato real. Colores, tipografía y demás apariencia se resuelven mediante las clases CSS existentes, fuera del renderer. No se inventó esa propiedad.

# 5. Contrato de salida

`renderReporte(...)` devuelve un único string HTML. No modifica DOM ni datos.

Las cuatro plantillas conservan exactamente:

- etiquetas y orden de secciones;
- clases CSS;
- textos;
- condicionales para componentes y tapacantos vacíos;
- singular/plural de tableros;
- estructura de subtotales;
- estilos mediante clases de la barra total;
- formato monetario y numérico.

La inserción permanece en `aplicarResultadoCostos()`:

```js
reporteContenido.innerHTML = renderReporte(
  datosReporte,
  opcionesReporte.plantilla,
  opcionesReporte.disenoTotal
);
```

Después de esa escritura se sigue mostrando `reportePanel` y se actualizan `state.ultimoTotal` y `state.ultimoReporte` en el mismo orden.

# 6. Dependencias

El módulo obtiene únicamente:

```js
const {
  fmt,
  fmtMoney
} = window.ProyCutFormat;
```

No se duplicaron funciones, redondeos, moneda ni fórmulas. `normalizarMetrosLinealesParaPresentacion` permanece exclusivamente en costos porque el renderer recibe `corteMlPresentacion` ya calculado.

# 7. HTML de las plantillas

- **Columnas**: `cost-grid` con columnas condicionales de Material, Componentes, Corte y Tapacanto.
- **Lista**: `reporte-lista` con secciones `rl-seccion` y títulos `rl-titulo`.
- **Tarjetas**: `reporte-tarjetas` con cards de Material, Componentes, Corte y Tapacanto.
- **Factura**: `reporte-factura` con tabla, encabezado, filas de sección, cantidades, precios unitarios e importes.

Todas terminan llamando `totalBarHtml(datos, disenoTotal)`. Componentes y tapacantos se omiten como secciones en las cuatro plantillas cuando sus listas están vacías. Los mensajes de lista vacía presentes en los helpers se conservaron literalmente, aunque las plantillas principales solo llaman esos helpers cuando la sección correspondiente existe.

# 8. Cambio en `main.js`

Al inicio de la IIFE se agregó:

```js
const {
  renderReporte
} = window.ProyCutReportRenderer;
```

Se eliminaron únicamente las nueve declaraciones originales. No se modificó `recalcular()`, `aplicarResultadoCostos`, `calcularCostosProyecto`, CSS ni ninguna llamada existente.

# 9. Comparación byte a byte

La prueba cargó:

1. el bloque original desde `git show HEAD:src/scripts/main.js`;
2. las utilidades reales de `src/scripts/utils/format.js`;
3. el módulo real `src/scripts/reports/report-renderer.js`.

El bloque de control se evaluó con sus dependencias `fmt` y `fmtMoney`, y su salida se comparó mediante `assert.strictEqual` contra el renderer nuevo.

Se usaron once conjuntos de datos:

1. reporte vacío permitido por el código;
2. total cero;
3. total positivo;
4. solo materiales;
5. materiales y tapacanto;
6. componentes;
7. varios materiales;
8. varios tableros y desperdicios/métricas distintos;
9. valores decimales;
10. textos largos y símbolos;
11. reporte completo con varias entradas de cada tipo.

Cada conjunto se ejecutó con:

- cuatro plantillas: columnas, lista, tarjetas y factura;
- cuatro diseños de total: default/pastel, sólido, contorno y línea.

**Resultado: 176/176 comparaciones byte a byte OK.**

# 10. Pruebas automáticas adicionales

- snapshot profundo antes y después de cada render: `datosReporte` y sus arreglos internos no fueron mutados;
- todos los archivos JavaScript de `src/scripts/` pasaron `node --check`;
- `git diff --check` pasó;
- búsqueda de declaraciones originales en `main.js`: ninguna coincidencia;
- búsqueda de `document.`, `state.` y `localStorage` en el módulo: ninguna coincidencia;
- las cuatro plantillas y todos sus helpers permanecen juntos en el módulo.

# 11. Pruebas manuales pendientes

No se ejecutaron ni se aprueban en este reporte:

- plantilla Columnas;
- plantilla Lista compacta;
- plantilla Tarjetas;
- plantilla Factura clásica;
- total cero;
- total positivo;
- materiales;
- tapacantos;
- componentes;
- varios tableros;
- cada diseño de la barra total;
- cambios globales de estilo y tipografía;
- exportación Excel y comparación de totales;
- impresión o vista visual;
- consola del navegador sin errores durante los cambios de plantilla.

# 12. Riesgos

- **Dependencia de carga**: `report-renderer.js` debe ejecutarse después de `format.js` y antes de `main.js`.
- **Contrato estructural implícito**: el renderer espera que `materiales`, `componentes` y `tapacantos` sean arreglos. El comportamiento ante propiedades ausentes no se amplió ni se corrigió.
- **Sin escape HTML adicional**: nombres y textos se interpolan como antes. Añadir escape sería un cambio funcional y de seguridad separado, fuera de esta extracción.
- **Helpers de listas vacías parcialmente inaccesibles**: se conservaron mensajes fallback aunque las plantillas omiten esas secciones antes de llamarlos. No se eliminó código aparentemente redundante porque cambiarlo no formaba parte del alcance.
- **Acoplamiento a clases CSS**: el módulo devuelve clases definidas fuera de él. Renombrar clases en el futuro requiere coordinar renderer y estilos.
- **No se probó visualmente**: la igualdad byte a byte garantiza el mismo HTML, no sustituye la validación del navegador ni de impresión.

# 13. Reversión

La reversión es puramente de código y documentación:

1. Restaurar las nueve funciones originales en `main.js`, antes de `recalcular()`.
2. Eliminar la destructuración de `window.ProyCutReportRenderer` en `main.js`.
3. Eliminar la etiqueta de `report-renderer.js` en `index.html`.
4. Eliminar `src/scripts/reports/report-renderer.js`; eliminar `src/scripts/reports/` solo si queda vacía.
5. Eliminar este reporte si también se revierte la documentación.

No hay migraciones, cambios de datos, cambios en `state`, cambios en costos ni cambios de DOM. En un árbol con modificaciones adicionales sin commit, la reversión debe hacerse de forma dirigida.
