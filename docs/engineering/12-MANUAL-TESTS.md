# 12-MANUAL-TESTS.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Establecer una línea base de pruebas manuales que permita comprobar el comportamiento observable del prototipo `index.html` antes y después de cualquier cambio de código.

## Depende de
`docs/engineering/10-CURRENT-STATE.md` (comportamiento documentado que estas pruebas protegen); `index.html` (sistema bajo prueba)

## Referenciado por
Pendiente de mapear (documento nuevo). Nota: `README.md` y `docs/engineering/ROADMAP.md` anticipan un entregable equivalente bajo el nombre `docs/MANUAL-TESTS.md`.

## Responsable
PENDIENTE

---

# 1. Propósito

Este documento protege el comportamiento observable del prototipo durante su reorganización. No valida si ese comportamiento es correcto, deseable o ideal — valida que **siga siendo el mismo** antes y después de cualquier cambio de código. Las pruebas describen el comportamiento existente tal como fue inferido en `docs/engineering/10-CURRENT-STATE.md`, incluso cuando parece incompleto o extraño (por ejemplo, que el costo no se recalcule tras mover una pieza a mano). Ninguna prueba asume todavía cuál sería el comportamiento ideal.

Este documento no debe ejecutarse todavía como parte de esta tarea. Es una línea base para ejecución futura.

# 2. Reglas de ejecución

- Toda ejecución deberá realizarse sobre una **copia controlada** del archivo (nunca sobre el original en producción, si existiera uno).
- Deberá usarse siempre el mismo conjunto de **datos maestros** (sección 5), salvo que la prueba indique explícitamente datos distintos.
- Antes de cada sesión de pruebas deberá registrarse: navegador, versión, sistema operativo, resolución, fecha y commit de Git (sección 3).
- El código **no deberá modificarse** durante la ejecución de las pruebas. Si se detecta la necesidad de un cambio, la prueba se marca `BLOCKED` y se documenta por qué.
- Toda prueba deberá guardar **evidencia** verificable (captura de pantalla, archivo exportado, o valor exacto observado) en el campo `Evidencia`.
- Cada prueba deberá cerrarse con exactamente uno de los cinco estados definidos en la sección 4 — nunca dejarse ambigua.

# 3. Entorno de prueba

Antes de cada sesión de ejecución deberá registrarse:

| Campo | Valor |
|---|---|
| Navegador | |
| Versión del navegador | |
| Sistema operativo | |
| Resolución de pantalla | |
| Nivel de zoom | |
| Fecha de ejecución | |
| Commit de Git (o ausencia de repositorio) | |
| Archivo probado (ruta) | |
| Conexión a internet | Sí / No — relevante porque `ExcelJS` y `JSZip` se cargan desde `cdnjs.cloudflare.com` (`docs/engineering/10-CURRENT-STATE.md`, sección 14) |
| Estado de `localStorage` al iniciar | Vacío / Con datos previos (clave `occ_bamteck_estilo_v1`) |

# 4. Convención de resultados

```text
PASS              El comportamiento observado coincide con el esperado.
FAIL              El comportamiento observado difiere del esperado.
BLOCKED           No pudo ejecutarse por una condición externa (ver Notas).
NOT RUN           Todavía no se ha ejecutado.
NOT APPLICABLE    La condición de la prueba no existe en este contexto.
```

Cada prueba registra: `Resultado real`, `Estado`, `Evidencia`, `Notas` y comportamiento inesperado (si lo hay, se documenta explícitamente en `Notas`, sin normalizarlo como si fuera esperado).

Al momento de crear este documento, **todas las pruebas están en `NOT RUN`**, sin excepción — no se ha ejecutado ninguna.

# 5. Datos maestros de prueba

Conjunto fijo, reutilizado por defecto en todas las pruebas salvo que se indique lo contrario. Los valores de `Melamina de 15mm` y `PVC 0.4mm` son los que trae el prototipo por defecto (`index.html`, líneas 1194–1195); el resto está marcado como **DATOS DE PRUEBA PROPUESTOS**.

**Materiales**

| Nombre | Precio | Largo | Ancho | Espesor | Origen |
|---|---|---|---|---|---|
| Melamina de 15mm | $750 | 2440 mm | 1220 mm | 15 mm | Valor semilla real del prototipo |
| Melamina de 18mm | $850 | 2440 mm | 1220 mm | 18 mm | **DATOS DE PRUEBA PROPUESTOS** |

**Tapacantos**

| Nombre | Precio | Origen |
|---|---|---|
| PVC 0.4mm | $10.50/m | Valor semilla real del prototipo |
| PVC 2mm | $25.00/m | **DATOS DE PRUEBA PROPUESTOS** |

**Componentes (catálogo)** — **DATOS DE PRUEBA PROPUESTOS** (el catálogo semilla trae un registro vacío, línea 1196, no utilizable como dato de prueba)

| Nombre | Precio |
|---|---|
| Bisagra recta | $15.00 |
| Corredera telescópica 45cm | $60.00 |
| Jaladera aluminio 128mm | $35.00 |

**Componentes agregados al proyecto** — **DATOS DE PRUEBA PROPUESTOS**: 2 × Bisagra recta, 1 × Corredera telescópica 45cm.

**Piezas** — **DATOS DE PRUEBA PROPUESTOS**

| # | Cant. | Largo | Ancho | Girar | Material | Cantos activos | Tipo tapacanto | Etiqueta |
|---|---|---|---|---|---|---|---|---|
| P1 | 4 | 600 mm | 400 mm | Auto | Melamina de 15mm | L1, L2 | PVC 0.4mm | Costado |
| P2 | 2 | 800 mm | 300 mm | Normal | Melamina de 15mm | A1 | PVC 0.4mm | Repisa |
| P3 | 3 | 1200 mm | 600 mm | Rotado | Melamina de 18mm | (ninguno) | — | Puerta |
| P4 | 6 | 2000 mm | 1000 mm | Auto | Melamina de 15mm | L1, L2, A1, A2 | PVC 2mm | Tapa |

Total de piezas expandidas: 15. P4 (2000×1000 mm, 6 unidades) se incluye deliberadamente como el **caso que requiere más de un tablero**: en un tablero de 2440×1220 mm solo cabe una pieza de 2000×1000 mm por tablero (el remanente de 440 mm de ancho no permite una segunda copia), por lo que 6 unidades exigen al menos 6 tableros de ese material — esto es una inferencia geométrica a confirmar en ejecución (`POR DETERMINAR MEDIANTE EJECUCIÓN` el número exacto si P1 comparte tablero con el sobrante de P4).

# 6. Prueba de arranque

**ARR-01**
- Prioridad: CRITICAL
- Tipo: Funcional
- Precondiciones: Archivo abierto por primera vez en la sesión, `localStorage` vacío.
- Datos: Ninguno (estado inicial del archivo).
- Pasos: 1) Abrir `index.html` en el navegador. 2) Observar la consola del navegador. 3) Observar la pantalla completa.
- Resultado observado esperado: La página carga sin errores visibles en pantalla; según `docs/engineering/10-CURRENT-STATE.md` (sección 6), se ejecutan en orden la inicialización de identidad/SKU, `cargarEstiloGuardado()`, los renders iniciales de catálogo, `ajustarAlturaTabla()`, la activación de redimensionamiento y `recalcular()`. No se puede confirmar sin ejecución si la consola queda libre de errores o advertencias.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Revisar explícitamente la consola del navegador (F12), no solo la pantalla.

**ARR-02**
- Prioridad: CRITICAL
- Tipo: Funcional
- Precondiciones: Igual que ARR-01.
- Datos: Ninguno.
- Pasos: 1) Abrir el panel "Materiales → Placas y tableros". 2) Abrir "Materiales → Cubre canto". 3) Abrir "Materiales → Componentes".
- Resultado observado esperado: El catálogo de materiales muestra una fila con "Melamina de 15mm", precio 750, largo 2440, ancho 1220, espesor 15 (línea 1194). El catálogo de tapacantos muestra "PVC 0.4mm", precio 10.5 (línea 1195). El catálogo de componentes muestra una fila con SKU/producto/precio vacíos (línea 1196).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**ARR-03**
- Prioridad: Alta
- Tipo: Interfaz
- Precondiciones: Igual que ARR-01.
- Datos: Ninguno.
- Pasos: 1) Observar el panel "Piezas a cortar". 2) Observar si el panel "Precio del proyecto" es visible. 3) Observar si el panel "Diagrama de corte" es visible.
- Resultado observado esperado: El panel "Piezas a cortar" es visible con la tabla vacía. Los paneles `reportePanel` y `resultadoPanel` tienen `style="display:none"` en el HTML (líneas 1122, 1136) y deberían permanecer ocultos porque `recalcular()` no genera reporte ni diagrama con 0 piezas.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**ARR-04**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Igual que ARR-01.
- Datos: Ninguno.
- Pasos: 1) Verificar que la tabla `#tablaPiezas` no tenga filas. 2) Verificar el encabezado y las columnas de la tabla.
- Resultado observado esperado: `#piezasBody` está vacío al cargar (ninguna llamada crea una fila inicial). Las columnas visibles son: #, Cant., Largo, Ancho, Girar, Material, Cantos, L1, L2, A1, A2, Tipo de tapacanto, Etiqueta.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**ARR-05**
- Prioridad: Media
- Tipo: Persistencia
- Precondiciones: `localStorage` vacío antes de abrir.
- Datos: Ninguno.
- Pasos: 1) Abrir el panel "Ajuste de la interfaz". 2) Observar los valores de color, fuente y tamaños.
- Resultado observado esperado: Al no existir la clave `occ_bamteck_estilo_v1`, `cargarEstiloGuardado()` no restaura nada y deberían mostrarse los valores predeterminados definidos en los atributos del HTML (por ejemplo color principal `#1e3a5f`, línea 609).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 7. Gestión de materiales

**MAT-01**
- Prioridad: CRITICAL
- Tipo: Funcional
- Precondiciones: Arranque limpio (sección 6).
- Datos: Nombre "Melamina de 18mm", precio 850, largo 2440, ancho 1220, espesor 18 (sección 5).
- Pasos: 1) Abrir "Materiales → Placas y tableros". 2) Clic en "+ Agregar material". 3) Completar los campos. 4) Clic en "Guardar".
- Resultado observado esperado: Se agrega una fila nueva con SKU generado automáticamente (`crearRegistroCatalogo`, líneas 1338–1351) y foco en el campo SKU de la fila nueva (`enfocarUltimoInput`, línea 2335).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**MAT-02**
- Prioridad: Alta
- Tipo: Funcional
- Precondiciones: MAT-01 ejecutada.
- Datos: Cambiar el nombre de "Melamina de 18mm" a "Melamina 18mm Blanca"; cambiar largo a 2750.
- Pasos: 1) Editar el campo "Material" de la fila. 2) Editar el campo "Largo (mm)". 3) Clic en "Guardar".
- Resultado observado esperado: El nombre y la medida se actualizan en `state.materiales` (líneas 2073–2081); `refrescarSelects()` no debería afectar esta fila porque el material sigue existiendo, solo cambió de nombre.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Verificar si alguna pieza que ya referenciaba "Melamina de 18mm" por nombre queda huérfana tras el renombrado (relacionado con MAT-06).

**MAT-03**
- Prioridad: CRITICAL
- Tipo: Cálculo
- Precondiciones: Al menos una pieza capturada usando "Melamina de 15mm" (por ejemplo P1 de la sección 5).
- Datos: Cambiar el precio de "Melamina de 15mm" de 750 a 900.
- Pasos: 1) Editar el campo "Precio / tablero" de "Melamina de 15mm". 2) Observar el reporte de precio sin hacer clic en "Guardar" (esperar el debounce de 200 ms).
- Resultado observado esperado: El input de precio dispara `recalcularDebounced()` (línea 2085–2087); el subtotal de material en el reporte debería actualizarse automáticamente sin necesidad de pulsar "Guardar".
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**MAT-04**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: Al menos dos materiales en el catálogo.
- Datos: Editar manualmente el campo SKU de un material existente.
- Pasos: 1) Borrar el SKU actual y escribir uno nuevo. 2) Clic fuera del campo (blur). 3) Clic en "Guardar".
- Resultado observado esperado: El SKU se normaliza a mayúsculas (`normalizarSkuManual`, línea 1280–1282) al perder el foco; si se deja vacío antes de "Guardar", `guardarSkuCatalogoDesdeTabla` genera uno automático (líneas 1381–1433).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**MAT-05**
- Prioridad: Alta
- Tipo: Funcional
- Precondiciones: Al menos dos materiales en el catálogo (la eliminación de material requiere que quede al menos uno, línea 2062).
- Datos: Eliminar "Melamina de 18mm".
- Pasos: 1) Clic en "Quitar" en la fila de "Melamina de 18mm". 2) Observar el catálogo y cualquier pieza que lo usara.
- Resultado observado esperado: La fila desaparece de `state.materiales`; `refrescarSelects()` debería reasignar cualquier pieza que apuntara a ese material al primero disponible en la lista (línea 4382–4392).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Confirmar el botón "Quitar" no aparece si solo queda un material en el catálogo (línea 2062: `if(state.materiales.length > 1)`).

**MAT-06**
- Prioridad: CRITICAL
- Tipo: Funcional
- Precondiciones: Al menos una pieza usando el material a renombrar (por ejemplo P1, que usa "Melamina de 15mm").
- Datos: Renombrar "Melamina de 15mm" a "Melamina 15mm Nogal" mientras P1 la sigue referenciando.
- Pasos: 1) Editar el nombre del material en el catálogo. 2) Guardar. 3) Revisar la columna "Material" de la fila de P1 en la tabla de piezas.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN`. El combobox de la fila guarda el valor elegido en `matInput.dataset.valor` (línea 4806); no está confirmado por lectura estática si ese valor se actualiza automáticamente al renombrarse el material en el catálogo, o si la pieza queda apuntando a un nombre que ya no existe hasta que `refrescarSelects()` se ejecute.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Prueba señalada explícitamente como pendiente de verificar en `docs/engineering/10-CURRENT-STATE.md`, sección 17.

**MAT-07**
- Prioridad: Alta
- Tipo: Funcional
- Precondiciones: Al menos una fila de pieza capturada.
- Datos: Escribir en el buscador de "Material" de una fila un nombre que no existe en el catálogo, por ejemplo "MDF 12mm".
- Pasos: 1) Escribir "MDF 12mm" en el combobox de Material de una pieza. 2) Observar la opción "+ Crear...". 3) Seleccionarla. 4) Capturar un precio en el modal. 5) Confirmar.
- Resultado observado esperado: Aparece la opción "+ Crear 'MDF 12mm' (nuevo material)" (líneas 4452–4459); al confirmar, se crea el material en `state.materiales` con la medida de tablero por defecto (`obtenerMedidaTableroDefault`) y se asigna automáticamente a la fila de la pieza (`confirmarCrear`, líneas 4587–4593).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 8. Gestión de tapacantos

**TAP-01**
- Prioridad: Alta
- Tipo: Funcional
- Precondiciones: Arranque limpio.
- Datos: Nombre "PVC 2mm", precio 25 (sección 5).
- Pasos: 1) Abrir "Materiales → Cubre canto". 2) Clic en "+ Agregar tipo". 3) Completar los campos. 4) Clic en "Guardar".
- Resultado observado esperado: Se agrega una fila con SKU automático, análogo a MAT-01.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**TAP-02**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: TAP-01 ejecutada.
- Datos: Cambiar nombre de "PVC 2mm" a "PVC 2mm Blanco"; cambiar precio a 27.
- Pasos: 1) Editar nombre. 2) Editar precio. 3) Guardar.
- Resultado observado esperado: Ambos campos se actualizan en `state.tapacantos`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**TAP-03**
- Prioridad: CRITICAL
- Tipo: Cálculo
- Precondiciones: Una pieza capturada (por ejemplo P1).
- Datos: Activar/desactivar cada lado del cuadrito de cantos: L1, L2, A1, A2.
- Pasos: 1) Clic en el lado superior del selector de cantos (L1). 2) Clic en el lado inferior (L2). 3) Clic en el lado izquierdo (A1). 4) Clic en el lado derecho (A2). 5) Observar el reporte de precio tras cada clic.
- Resultado observado esperado: Cada clic alterna el checkbox oculto correspondiente (`attachCantoSelector`, líneas 4639–4650) y dispara `recalcularDebounced()`; el metraje de tapacanto por tipo debería aumentar o disminuir según los lados activos (línea 6977–6985: L1/L2 cobran el lado más largo, A1/A2 el más corto).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**TAP-04**
- Prioridad: Alta
- Tipo: Funcional
- Precondiciones: Al menos dos tapacantos en el catálogo.
- Datos: Eliminar "PVC 2mm".
- Pasos: 1) Clic en "Quitar" en la fila de "PVC 2mm".
- Resultado observado esperado: Análogo a MAT-05 — `refrescarSelects()` reasigna piezas que apuntaban a ese tapacanto.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**TAP-05**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: Una pieza usando el tapacanto a renombrar.
- Datos: Renombrar "PVC 0.4mm" a "PVC 0.4mm Transparente" mientras P1 lo referencia.
- Pasos: Análogo a MAT-06.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN` — mismo patrón de incertidumbre que MAT-06.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**TAP-06**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: Al menos una fila de pieza.
- Datos: Escribir un nombre de tapacanto inexistente en el buscador "Tipo de tapacanto".
- Pasos: Análogo a MAT-07.
- Resultado observado esperado: Igual patrón — opción "+ Crear... (nuevo tipo de tapacanto)".
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 9. Gestión de componentes

**COMP-01**
- Prioridad: Alta
- Tipo: Funcional
- Precondiciones: Arranque limpio.
- Datos: "Bisagra recta", precio 15 (sección 5).
- Pasos: 1) Abrir "Materiales → Componentes". 2) Clic en "+ Agregar componente". 3) Completar campos. 4) Guardar.
- Resultado observado esperado: Se agrega una fila con SKU automático, análogo a MAT-01.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COMP-02**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: COMP-01 ejecutada.
- Datos: Cambiar nombre y precio de "Bisagra recta".
- Pasos: 1) Editar producto. 2) Editar precio. 3) Guardar.
- Resultado observado esperado: Actualiza `state.componentes`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COMP-03**
- Prioridad: Alta
- Tipo: Cálculo
- Precondiciones: Catálogo de componentes con "Bisagra recta" y "Corredera telescópica 45cm".
- Datos: Agregar 2 Bisagra recta y 1 Corredera telescópica al proyecto; luego cambiar la cantidad de Bisagra recta a 4.
- Pasos: 1) Clic en "+ Agregar componentes". 2) Buscar y seleccionar "Bisagra recta", cantidad 2, clic "Agregar". 3) Repetir con "Corredera telescópica 45cm", cantidad 1. 4) Editar la cantidad de Bisagra recta a 4 en la tabla de componentes del proyecto.
- Resultado observado esperado: Ambos componentes aparecen en `tablaComponentesProyecto` con su subtotal (`renderComponentesProyecto`, líneas 2186–2237); al cambiar la cantidad se recalcula el subtotal de esa fila y se dispara `recalcularDebounced()` (línea 2224–2231).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COMP-04**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: Al menos dos componentes en el catálogo.
- Datos: Eliminar "Jaladera aluminio 128mm" del catálogo (no agregada al proyecto).
- Pasos: 1) Clic en "Quitar" en la fila del catálogo.
- Resultado observado esperado: Se elimina de `state.componentes`; no debería afectar el proyecto porque no fue agregada a `state.componentesProyecto`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COMP-05**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: COMP-03 ejecutada.
- Datos: Eliminar "Corredera telescópica 45cm" de la tabla de componentes del proyecto (no del catálogo).
- Pasos: 1) Clic en "Quitar" en la fila de `tablaComponentesProyecto`.
- Resultado observado esperado: Se elimina de `state.componentesProyecto` únicamente; el componente sigue existiendo en el catálogo general.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COMP-06**
- Prioridad: Media
- Tipo: Importación
- Precondiciones: Ver sección 16.
- Datos: Archivo Excel con hoja "Componentes".
- Pasos: Ver XLS-04 y XLS-05.
- Resultado observado esperado: Referencia cruzada — no se repite aquí para no duplicar contenido.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Ver sección 16 para el detalle completo de importación de componentes.

# 10. Gestión de piezas

**PZ-01**
- Prioridad: CRITICAL
- Tipo: Funcional
- Precondiciones: Arranque limpio.
- Datos: P1 de la sección 5.
- Pasos: 1) Clic en "+ Agregar pieza". 2) Completar cantidad, largo, ancho, material, cantos, tapacanto, etiqueta.
- Resultado observado esperado: Se agrega una fila nueva (`addPiezaRow`, líneas 4687–4829); el foco pasa al campo de cantidad de la nueva fila (líneas 4901–4903); si ya existía una fila previa, el nuevo renglón hereda su material y tapacanto (líneas 4884–4893).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PZ-02**
- Prioridad: CRITICAL
- Tipo: Cálculo
- Precondiciones: Al menos una pieza capturada.
- Datos: Cambiar largo de 600 a 750.
- Pasos: 1) Editar el campo "Largo" de la fila.
- Resultado observado esperado: Dispara `recalcularDebounced()` (evento delegado en `#piezasBody`, línea 7052–7053); el diagrama y el reporte deberían reflejar la nueva medida tras 200 ms.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PZ-03**
- Prioridad: Alta
- Tipo: Cálculo
- Precondiciones: Al menos una pieza capturada.
- Datos: Cambiar cantidad de 4 a 10.
- Pasos: 1) Editar el campo "Cant." de P1.
- Resultado observado esperado: `leerPiezas()` expande la fila en 10 piezas individuales al recalcular (línea 5181); el número de tableros y el costo deberían aumentar en consecuencia.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PZ-04**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: Al menos una pieza capturada, al menos dos materiales en catálogo.
- Datos: Cambiar el material de P1 de "Melamina de 15mm" a "Melamina de 18mm".
- Pasos: 1) Clic en el buscador de Material. 2) Seleccionar "Melamina de 18mm".
- Resultado observado esperado: `matInput.dataset.valor` se actualiza (línea 4808–4812); el costo de material y la medida de tablero usada por esa pieza cambian.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PZ-05**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: Al menos una pieza capturada, al menos dos tapacantos en catálogo.
- Datos: Cambiar el tipo de tapacanto de P1 de "PVC 0.4mm" a "PVC 2mm".
- Pasos: 1) Clic en el buscador de "Tipo de tapacanto". 2) Seleccionar "PVC 2mm".
- Resultado observado esperado: Análogo a PZ-04, aplicado al tapacanto.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PZ-06**
- Prioridad: Alta
- Tipo: Funcional
- Precondiciones: Al menos una pieza capturada.
- Datos: Activar y desactivar L1, L2, A1, A2 individualmente.
- Pasos: Ver TAP-03 (misma interacción, documentada una sola vez).
- Resultado observado esperado: Ver TAP-03.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Prueba deliberadamente redundante con TAP-03 para cubrir el bullet solicitado en esta sección sin duplicar el detalle.

**PZ-07**
- Prioridad: CRITICAL
- Tipo: Funcional
- Precondiciones: Al menos una pieza capturada.
- Datos: Alternar el checkbox "Girar" de una pieza tres veces.
- Pasos: 1) Clic en el ícono de Girar (pasa de vacío a raya). 2) Clic de nuevo (pasa de raya a marcado). 3) Clic de nuevo (regresa a vacío).
- Resultado observado esperado: El estado avanza en el orden `auto → normal → rotado → auto` (`siguienteModoGirar`, líneas 4840–4843); el título del control cambia según el estado (`tituloGirar`, líneas 4833–4839); cada clic dispara `recalcularDebounced()`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PZ-08**
- Prioridad: Media
- Tipo: Cálculo
- Precondiciones: Ninguna pieza capturada.
- Datos: Una fila con cantidad 5.
- Pasos: 1) Agregar una pieza con cantidad 5. 2) Ejecutar la optimización (recálculo automático). 3) Contar cuántas piezas individuales aparecen en el diagrama.
- Resultado observado esperado: `leerPiezas()` expande la fila en 5 objetos de pieza independientes (línea 5181); el diagrama debería mostrar 5 piezas con el mismo número `#` (todas comparten `row.dataset.id`).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PZ-09**
- Prioridad: Alta
- Tipo: Funcional
- Precondiciones: Al menos dos piezas capturadas.
- Datos: Ninguno adicional.
- Pasos: 1) Clic en "Quitar" en la primera fila. 2) Observar la numeración de la columna "#".
- Resultado observado esperado: La fila se elimina y `renumerarFilas()` renumera secuencialmente las filas restantes (líneas 4873–4878, 4794).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PZ-10**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Al menos una fila de pieza.
- Datos: Ninguno adicional.
- Pasos: 1) Ubicarse en el campo "Cant." de la última fila. 2) Presionar Enter repetidamente hasta recorrer todos los campos de la fila y llegar al último.
- Resultado observado esperado: Enter mueve el foco al siguiente campo de la misma fila; al llegar al último campo de la última fila, Enter agrega una fila nueva automáticamente y mueve el foco a su primer campo (`attachEnterNavegable`, líneas 4921–4962).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PZ-11**
- Prioridad: Alta
- Tipo: Cálculo
- Precondiciones: Al menos una fila de pieza.
- Datos: Cantidad vacía, largo negativo, ancho como texto ("abc"), material no seleccionado.
- Pasos: 1) Dejar el campo "Cant." vacío y forzar recálculo. 2) Escribir un número negativo en "Largo". 3) Escribir texto no numérico en "Ancho". 4) Dejar el buscador de Material vacío.
- Resultado observado esperado: `validarProyecto()` debería reportar errores específicos por fila mostrados en el área de avisos (`mostrarErroresProyecto`, líneas 5103–5112); ejemplos de mensaje esperado: "Pieza N: selecciona un material." (línea 5094) y validaciones de cantidad/medida vía `validarCantidad`/`validarMedida`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 11. Parámetros de corte

**COR-01**
- Prioridad: Alta
- Tipo: Cálculo
- Precondiciones: Al menos dos piezas capturadas del mismo material.
- Datos: Cambiar el kerf de 4 a 8.
- Pasos: 1) Abrir "Preferencias → Ajustes de parámetros de corte". 2) Cambiar el valor de "Kerf (mm)".
- Resultado observado esperado: Dispara `recalcularDebounced()` (línea 7054); `resolverParametrosCorteEtapa4()` deriva los 4 valores de kerf efectivos a partir de este único valor (líneas 1841–1855); el acomodo y el desperdicio deberían cambiar.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COR-02**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: Panel de configuración de corte abierto.
- Datos: Activar "Aplicar márgenes exteriores", dejar "Usar el mismo margen en los cuatro lados" marcado, valor 20.
- Pasos: 1) Activar el checkbox "Aplicar márgenes exteriores". 2) Escribir 20 en "Margen general (mm)".
- Resultado observado esperado: Los cuatro campos individuales de margen se sincronizan automáticamente con el valor general y quedan deshabilitados (`actualizarControlesMargenesExteriores`, líneas 1763–1779).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COR-03**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: "Aplicar márgenes exteriores" activo.
- Datos: Desmarcar "Usar el mismo margen en los cuatro lados"; asignar 10/20/15/25 a izquierdo/derecho/superior/inferior.
- Pasos: 1) Desmarcar el checkbox. 2) Editar los cuatro campos individuales.
- Resultado observado esperado: Los campos individuales se habilitan y aceptan valores independientes (línea 1769–1773); el área útil del tablero se calcula restando cada margen por separado (`calcularRectanguloUtilTablero`, líneas 1880–1896).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COR-04**
- Prioridad: Alta
- Tipo: Cálculo
- Precondiciones: Al menos 3 piezas del mismo tamaño capturadas con Girar en "Auto".
- Datos: Alternar entre "Normal", "Optimizada" y "Completa" en "Calidad del optimizador".
- Pasos: 1) Seleccionar "Normal", observar el diagrama. 2) Seleccionar "Optimizada", observar. 3) Seleccionar "Completa", observar.
- Resultado observado esperado: En "Normal" las piezas en Auto no giran (`leerPiezas`, línea 5124: `permitirGirarAuto = obtenerNivelOptimizacion() !== 'normal'`); en "Optimizada" pueden girar pero todas las copias iguales comparten orientación; en "Completa" pueden mezclarse orientaciones entre copias idénticas (`empacarConLista`, líneas 5535–5549).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COR-05**
- Prioridad: Media
- Tipo: Cálculo
- Precondiciones: Piezas capturadas.
- Datos: Desactivar "Corte de extremo a extremo (sierra escuadradora)".
- Pasos: 1) Desmarcar el checkbox `corteGuillotina`.
- Resultado observado esperado: El acomodo pasa a usar `empacarConListaLibre` en vez de `empacarConLista` (línea 6826: `libre = !document.getElementById('corteGuillotina').checked`); pueden aparecer huecos en forma de "L".
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COR-06**
- Prioridad: Media
- Tipo: Cálculo
- Precondiciones: Piezas capturadas y optimizadas.
- Datos: Cambiar "Cobrar el corte por" de "Por corte" a "Por metro lineal"; ajustar los precios respectivos.
- Pasos: 1) Seleccionar "Por metro lineal". 2) Cambiar "Precio por metro lineal de corte" a 25.
- Resultado observado esperado: El costo de corte se calcula como metros lineales × precio por metro en vez de número de cortes × precio por corte (líneas 6968–6971).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COR-07**
- Prioridad: Baja
- Tipo: Cálculo
- Precondiciones: Igual que COR-06, modo "Por corte".
- Datos: Cambiar "Precio por corte" de 5 a 8.
- Pasos: 1) Editar el campo.
- Resultado observado esperado: El subtotal de corte cambia proporcionalmente al número de cortes ya calculado.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**COR-08**
- Prioridad: Media
- Tipo: Cálculo
- Precondiciones: Piezas con tapacanto capturadas, metraje resultante no múltiplo exacto de 0.5 m (por ejemplo P1 con L1+L2 activos).
- Datos: Activar y desactivar "Redondear metraje de tapacanto a 0.5 m".
- Pasos: 1) Con la casilla activa, registrar el metraje cobrado. 2) Desactivarla y registrar de nuevo.
- Resultado observado esperado: Con la casilla activa, el metraje se redondea hacia arriba al siguiente 0.5 m (`Math.ceil(metrosExactos/0.5) * 0.5`, líneas 6994–6996); desactivada, se cobra el metraje exacto.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 12. Optimización

**OPT-01**
- Prioridad: CRITICAL
- Tipo: Cálculo
- Precondiciones: Arranque limpio.
- Datos: Solo P1 (4 piezas de 600×400 mm) de la sección 5.
- Pasos: 1) Capturar únicamente P1. 2) Observar el diagrama.
- Resultado observado esperado: Las 4 piezas deberían caber en un solo tablero de 2440×1220 mm; se espera 1 pestaña en el diagrama.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Registrar cantidad de tableros, desperdicio y sobrantes obtenidos (sección 29).

**OPT-02**
- Prioridad: CRITICAL
- Tipo: Cálculo
- Precondiciones: Arranque limpio.
- Datos: Conjunto completo de la sección 5 (P1–P4, 15 piezas expandidas).
- Pasos: 1) Capturar las 4 filas de la sección 5. 2) Observar el diagrama y contar pestañas.
- Resultado observado esperado: Se espera más de un tablero, principalmente por P4 (2000×1000 mm × 6, sección 5). El número exacto de tableros y cómo se distribuyen P1/P2/P3 entre ellos es `POR DETERMINAR MEDIANTE EJECUCIÓN`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Registrar en la tabla de la sección 29.

**OPT-03**
- Prioridad: CRITICAL
- Tipo: Cálculo
- Precondiciones: Arranque limpio.
- Datos: Una pieza de 2500×1300 mm (mayor que el tablero de 2440×1220 mm en ambas dimensiones), material "Melamina de 15mm", Girar "Normal".
- Pasos: 1) Capturar la pieza. 2) Forzar el recálculo.
- Resultado observado esperado: `leerPiezas()` debería rechazar la pieza y agregar un mensaje de error indicando que no cabe (líneas 5164–5179); no debería generarse ningún tablero para esa pieza.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Confirmar el texto exacto del mensaje mostrado.

**OPT-04**
- Prioridad: Media
- Tipo: Cálculo
- Precondiciones: Al menos 4 piezas idénticas, no cuadradas, con Girar en distintos estados.
- Datos: 2 piezas 600×400 en "Auto", 2 piezas 600×400 en "Normal", 2 piezas 600×400 en "Rotado".
- Pasos: 1) Capturar las 6 filas descritas. 2) Ejecutar la optimización en modo "Completa".
- Resultado observado esperado: Las piezas en "Normal" deberían mantenerse sin girar; las en "Rotado" deberían aparecer giradas 90°; las en "Auto" pueden variar según el criterio ganador del optimizador.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**OPT-05**
- Prioridad: Media
- Tipo: Cálculo
- Precondiciones: Conjunto de la sección 5, modo guillotina activo (por defecto).
- Datos: Igual que OPT-02.
- Pasos: 1) Ejecutar con "Corte de extremo a extremo" activo.
- Resultado observado esperado: Cada corte debería ir de lado a lado del tablero o de la franja (compatible con sierra escuadradora), sin huecos en "L".
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**OPT-06**
- Prioridad: Media
- Tipo: Cálculo
- Precondiciones: Igual que OPT-05, pero con "Corte de extremo a extremo" desactivado.
- Datos: Igual que OPT-02.
- Pasos: 1) Desactivar el checkbox. 2) Ejecutar.
- Resultado observado esperado: El acomodo puede aprovechar huecos en forma de "L" (`empacarConListaLibre`); el número de tableros podría ser menor o igual que en modo guillotina.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Comparar directamente el resultado contra OPT-05 con el mismo conjunto de piezas.

**OPT-07**
- Prioridad: Media
- Tipo: Cálculo
- Precondiciones: Conjunto de la sección 5.
- Datos: Ejecutar el mismo conjunto en los 3 niveles de calidad.
- Pasos: 1) Normal. 2) Optimizada. 3) Completa. Registrar tableros y desperdicio de cada uno.
- Resultado observado esperado: Se espera que "Completa" iguale o mejore (menos tableros o menos desperdicio) el resultado de "Optimizada", y que esta iguale o mejore a "Normal" — no confirmado, `POR DETERMINAR MEDIANTE EJECUCIÓN`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**OPT-08**
- Prioridad: Alta
- Tipo: Cálculo
- Precondiciones: Conjunto de la sección 5.
- Datos: Ejecutar el mismo conjunto de piezas dos veces, recargando la página entre una ejecución y otra (recapturando los mismos datos).
- Pasos: 1) Capturar el conjunto y anotar el resultado (tableros, desperdicio, posiciones). 2) Recargar la página. 3) Volver a capturar exactamente el mismo conjunto. 4) Comparar.
- Resultado observado esperado: El resultado debería ser idéntico, porque `pseudoAleatorio`/`barajar` usan una semilla fija (líneas 5206–5221) — el algoritmo está diseñado para ser determinista.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Esta prueba verifica estabilidad/determinismo, no corrección del resultado.

# 13. Edición manual del diagrama

**DIAG-01**
- Prioridad: CRITICAL
- Tipo: Interfaz
- Precondiciones: Al menos un tablero optimizado con 2 o más piezas.
- Datos: Conjunto de la sección 5 ya optimizado.
- Pasos: 1) Registrar el total mostrado en el reporte. 2) Arrastrar una pieza a otra posición libre del mismo tablero. 3) Observar si el total del reporte cambia sin acción adicional.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN`. `activarPiezasArrastrables` no llama `recalcular()` (`docs/engineering/10-CURRENT-STATE.md`, sección 17); se infiere que el total del reporte **no** se actualiza automáticamente tras el arrastre, pero esto no está confirmado en ejecución.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Verificar explícitamente el campo de costo de corte en el reporte antes y después del arrastre.

**DIAG-02**
- Prioridad: CRITICAL
- Tipo: Interfaz
- Precondiciones: Igual que DIAG-01.
- Datos: Igual que DIAG-01.
- Pasos: 1) Registrar el total del reporte. 2) Pasar el mouse sobre una pieza y clic en el botón de rotar (⟳). 3) Observar si el total cambia.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN`. `rotarPieza()` tampoco llama `recalcular()` (sección 17 de `10-CURRENT-STATE.md`); se infiere que el total no cambia automáticamente.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Verificar también si los indicadores de tapacanto (rojo) se mantienen consistentes tras rotar, dado que `rotarPieza` no reescribe `l1/l2/a1/a2`.

**DIAG-03**
- Prioridad: Alta
- Tipo: Interfaz
- Precondiciones: Igual que DIAG-01.
- Datos: Igual que DIAG-01.
- Pasos: 1) Clic en el botón "Espejo". 2) Seleccionar "Pegar arriba". 3) Repetir el proceso con "Pegar abajo", "Pegar a la izquierda" y "Pegar a la derecha" (en sesiones o tableros separados). 4) Observar el total tras cada acción.
- Resultado observado esperado: Cada opción llama `espejarBoard`/`espejarBoardHorizontal` seguido de `compactarHaciaArriba/Abajo/Izquierda/Derecha` (líneas 7118–7121); ninguna de estas rutas llama `recalcular()`, así que el total no debería actualizarse — `POR DETERMINAR MEDIANTE EJECUCIÓN`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**DIAG-04**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Un tablero con piezas dispersas dejando huecos pequeños.
- Datos: Igual que DIAG-01.
- Pasos: 1) Mover manualmente 2-3 piezas para crear huecos dispersos. 2) Usar "Espejo → Pegar abajo" (que incluye compactado). 3) Observar la lista de sobrantes antes y después.
- Resultado observado esperado: Los huecos sueltos deberían consolidarse en uno más grande (`compactarHaciaAbajo`, líneas 6343–6363); la lista de "Sobrantes aprovechables" debería reflejar el cambio porque `renderDiagrama()` sí se llama tras esta acción.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**DIAG-05**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Un tablero con al menos 2 piezas cercanas entre sí o al borde.
- Datos: Igual que DIAG-01.
- Pasos: 1) Arrastrar una pieza hasta acercarla (dentro de ~18 mm) a otra pieza o al borde del tablero. 2) Soltar.
- Resultado observado esperado: La pieza debería "pegarse" automáticamente a la pieza vecina o al borde, respetando el kerf configurado (`calcularImanes`, líneas 4464–4500), en vez de quedar en la posición exacta donde se soltó el mouse.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**DIAG-06**
- Prioridad: Baja
- Tipo: Interfaz
- Precondiciones: Optimización con 2 o más tableros (por ejemplo OPT-02).
- Datos: Igual que OPT-02.
- Pasos: 1) Clic en la pestaña del segundo tablero. 2) Observar el diagrama y la lista de sobrantes.
- Resultado observado esperado: `renderDiagrama()` cambia `state.activeTab` y redibuja el tablero seleccionado (línea 6605); la lista de sobrantes debería corresponder únicamente al tablero activo.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 14. Costos y reporte

**REP-01**
- Prioridad: Alta
- Tipo: Cálculo
- Precondiciones: Conjunto de la sección 5 capturado y optimizado.
- Datos: Igual que sección 5.
- Pasos: 1) Registrar el subtotal de "Material" mostrado en el reporte.
- Resultado observado esperado: Suma de (tableros usados por material × precio de ese material), según líneas 6915–6932.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Registrar el valor exacto en la tabla de la sección 29.

**REP-02**
- Prioridad: Alta
- Tipo: Cálculo
- Precondiciones: Igual que REP-01, con los componentes de la sección 5 agregados al proyecto.
- Datos: Igual que sección 5.
- Pasos: 1) Registrar el subtotal de "Componentes".
- Resultado observado esperado: Suma de (precio × cantidad por proyecto × cantidad de proyectos) por componente, líneas 6939–6963.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**REP-03**
- Prioridad: Alta
- Tipo: Cálculo
- Precondiciones: Igual que REP-01.
- Datos: Igual que sección 5.
- Pasos: 1) Registrar el subtotal de "Corte".
- Resultado observado esperado: Según el modo elegido, número de cortes × precio por corte, o metros lineales × precio por metro (líneas 6965–6971).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**REP-04**
- Prioridad: Alta
- Tipo: Cálculo
- Precondiciones: Igual que REP-01.
- Datos: Igual que sección 5.
- Pasos: 1) Registrar el subtotal de "Tapacanto".
- Resultado observado esperado: Suma por tipo de tapacanto de metros cobrables × precio por metro (líneas 6991–7010).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**REP-05**
- Prioridad: CRITICAL
- Tipo: Cálculo
- Precondiciones: Igual que REP-01.
- Datos: Igual que sección 5.
- Pasos: 1) Registrar el total general. 2) Editar un precio de material. 3) Volver a registrar el total. 4) Revertir el cambio. 5) Confirmar que el total regresa al valor original.
- Resultado observado esperado: El total es la suma de los cuatro subtotales (línea 7012); debería ser consistente y reproducible ante el mismo conjunto de datos.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**REP-06**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Reporte generado.
- Datos: Igual que sección 5.
- Pasos: 1) En "Ajuste de la interfaz", cambiar "Plantilla del reporte" entre Columnas, Lista compacta, Tarjetas y Factura clásica.
- Resultado observado esperado: El contenido (subtotales y total) debería ser idéntico entre plantillas; solo cambia la presentación visual (`renderReporte`, líneas 6638–6644).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**Tabla de valores exactos a registrar (llenar durante la ejecución):**

| Concepto | Valor obtenido |
|---|---|
| Subtotal material | |
| Subtotal componentes | |
| Subtotal corte | |
| Subtotal tapacanto | |
| Total general | |

# 15. Importación CSV

**CSV-01**
- Prioridad: CRITICAL
- Tipo: Importación
- Precondiciones: Catálogo con los materiales/tapacantos referenciados en el CSV ya existentes.
- Datos: Archivo CSV con encabezado `ENCABEZADO_FORMATO` (línea 2538) y 2 filas válidas referenciando "Melamina de 15mm" y "PVC 0.4mm".
- Pasos: 1) Abrir "Archivo → Importar". 2) Seleccionar el CSV. 3) Clic en "Importar archivo".
- Resultado observado esperado: Las filas válidas se agregan a la tabla de piezas (`parsearCSV` + `agregarPiezaDesdeColumnas`, líneas 2693–2774); se muestra un mensaje con la cantidad importada y rechazada (líneas 4107–4111).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**CSV-02**
- Prioridad: Alta
- Tipo: Importación
- Precondiciones: Ninguna especial.
- Datos: Archivo CSV con solo 9 columnas en vez de 11.
- Pasos: 1) Importar el archivo.
- Resultado observado esperado: Error de encabezado: "se esperaban 11 columnas y se encontraron 9" (línea 2702–2703); no se importa ninguna fila.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**CSV-03**
- Prioridad: Alta
- Tipo: Importación
- Precondiciones: Ninguna especial.
- Datos: Archivo CSV con una fila con largo negativo y otra con cantidad vacía.
- Pasos: 1) Importar el archivo.
- Resultado observado esperado: Cada fila inválida genera un mensaje específico ("Fila N, Largo_mm: ..."); las filas válidas restantes sí se importan (líneas 2740–2774).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**CSV-04**
- Prioridad: Media
- Tipo: Importación
- Precondiciones: Ninguna especial.
- Datos: Archivo CSV que referencia un material "MDF 12mm" que no existe en el catálogo.
- Pasos: 1) Importar el archivo.
- Resultado observado esperado: Error: 'Material: "MDF 12mm" no existe en el catálogo.' (línea 2756); la fila se rechaza (no se crea el material automáticamente desde CSV, a diferencia del combobox de la interfaz).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Confirmar que la importación CSV, a diferencia de la de Excel, no ofrece crear materiales nuevos.

**CSV-05**
- Prioridad: Media
- Tipo: Importación
- Precondiciones: Ninguna especial.
- Datos: Archivo CSV con dos filas idénticas (misma medida, mismo material).
- Pasos: 1) Importar el archivo.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN`. No se detectó en el código ninguna validación de "fila duplicada" para CSV — se infiere que ambas filas se importan como piezas independientes, pero no está confirmado.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**CSV-06**
- Prioridad: Media
- Tipo: Importación
- Precondiciones: Ninguna especial.
- Datos: Cualquier CSV válido.
- Pasos: 1) Seleccionar el archivo en el campo. 2) Cerrar el subpanel "Importar" sin hacer clic en "Importar archivo" (equivalente a cancelar, ya que no existe un botón "Cancelar" explícito para CSV).
- Resultado observado esperado: Ninguna pieza debería agregarse mientras no se haga clic en "Importar archivo".
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: A diferencia de la importación de Excel (sección 16), el flujo de CSV no tiene un paso de vista previa ni un botón de cancelación explícito.

**CSV-07**
- Prioridad: Alta
- Tipo: Importación
- Precondiciones: Igual que CSV-01.
- Datos: Igual que CSV-01.
- Pasos: 1) Completar la importación exitosa. 2) Verificar el estado final de la tabla de piezas y el mensaje mostrado.
- Resultado observado esperado: Mensaje "Piezas importadas: N; piezas rechazadas: M." (líneas 4108–4110); la vista se desplaza hasta la última fila importada (líneas 4117–4122).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 16. Importación Excel

**XLS-01**
- Prioridad: CRITICAL
- Tipo: Importación
- Precondiciones: Archivo Excel generado previamente con "Exportar formato" (sección 17) o construido manualmente con el marcador `PROYCUT_PROJECT_FORMAT`.
- Datos: Archivo con hoja "Piezas" válida.
- Pasos: 1) Seleccionar el archivo Excel. 2) Clic en "Importar archivo".
- Resultado observado esperado: Se abre la vista previa de importación (`abrirVistaPreviaImportacion`, línea 3748); no se aplica ningún cambio todavía.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**XLS-02**
- Prioridad: Alta
- Tipo: Importación
- Precondiciones: Excel con hoja "Materiales" donde una fila coincide por nombre con "Melamina de 15mm" ya existente.
- Datos: Fila con SKU vacío, nombre "Melamina de 15mm", precio distinto (por ejemplo 800).
- Pasos: 1) Importar y abrir la vista previa. 2) Revisar la columna "Coincidencia encontrada" para esa fila.
- Resultado observado esperado: `prepararVistaPreviaMateriales()` debería detectar coincidencia por nombre y proponer "Usar material existente" (líneas 3239–3271).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**XLS-03**
- Prioridad: Alta
- Tipo: Importación
- Precondiciones: Excel con hoja "Materiales" con una fila cuyo nombre no existe en el catálogo.
- Datos: Fila con nombre "Triplay 9mm".
- Pasos: 1) Importar y abrir la vista previa.
- Resultado observado esperado: Estado "Material nuevo", acción propuesta "Crear material nuevo en Placas y tableros" (líneas 3149–3151).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**XLS-04**
- Prioridad: Alta
- Tipo: Importación
- Precondiciones: Excel con hoja "Componentes" donde una fila coincide por nombre con "Bisagra recta" ya existente en el catálogo.
- Datos: Fila con nombre "Bisagra recta", cantidad 3.
- Pasos: 1) Importar y abrir vista previa. 2) Revisar columna "Componente encontrado".
- Resultado observado esperado: Coincidencia detectada, acción propuesta "usar_existente" (líneas 3422–3426).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**XLS-05**
- Prioridad: Alta
- Tipo: Importación
- Precondiciones: Excel con hoja "Componentes" con un nombre nuevo.
- Datos: Fila con nombre "Tornillo confirmat 7x50".
- Pasos: 1) Importar y abrir vista previa.
- Resultado observado esperado: Acción propuesta "crear_sku_automatico" o "crear_sku_importado" según si trae SKU (líneas 3447–3449).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**XLS-06**
- Prioridad: Media
- Tipo: Importación
- Precondiciones: XLS-01 a XLS-05 disponibles como referencia de contenido.
- Datos: Cualquier archivo válido con las 3 hojas.
- Pasos: 1) Revisar las columnas de `tablaVistaPreviaComponentes` y `tablaVistaPreviaMateriales` en pantalla.
- Resultado observado esperado: La vista previa muestra, sin aplicar cambios, filas analizadas, cantidad bloqueada, y por cada fila su estado (Existente por ID/SKU/nombre, Material nuevo, Conflicto, Incompleto) — líneas 3592–3746.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**XLS-07**
- Prioridad: Media
- Tipo: Importación
- Precondiciones: Vista previa abierta con al menos un componente coincidente.
- Datos: Alternar "Cantidades del proyecto" entre "Reemplazar" y "Sumar"; alternar "Precios del catálogo" entre "Actualizar" y "Conservar".
- Pasos: 1) Cambiar cada selector y observar la columna "Cant. resultante" / "Precio resultante".
- Resultado observado esperado: Con "Sumar", la cantidad resultante es cantidad actual + importada; con "Reemplazar", es solo la importada (líneas 3503–3506); con "Actualizar", el precio resultante es el importado; con "Conservar", se mantiene el actual (línea 3508–3510).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**XLS-08**
- Prioridad: CRITICAL
- Tipo: Importación
- Precondiciones: Vista previa sin filas bloqueadas.
- Datos: Igual que XLS-01.
- Pasos: 1) Clic en "Confirmar importación".
- Resultado observado esperado: Se ejecuta `construirAplicacionAtomicaComponentes`/`Materiales`, se reasignan `state.componentes`, `state.componentesProyecto`, `state.materiales`, se aplican las piezas pendientes y se llama `recalcular()` (líneas 4010–4076); se muestra un resumen con conteos.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**XLS-09**
- Prioridad: Media
- Tipo: Importación
- Precondiciones: Vista previa abierta.
- Datos: Igual que XLS-01.
- Pasos: 1) Clic en "Cancelar" dentro de la vista previa.
- Resultado observado esperado: `cancelarVistaPreviaImportacion()` limpia `importacionPendiente2DB` y las tablas de vista previa, sin aplicar ningún cambio a `state` (líneas 3761–3768).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**XLS-10**
- Prioridad: CRITICAL
- Tipo: Importación
- Precondiciones: Vista previa con al menos una fila de Materiales bloqueada (por ejemplo con columnas faltantes) y el resto de las filas válidas.
- Datos: Excel con una fila de Materiales inválida y varias filas de Componentes válidas.
- Pasos: 1) Intentar confirmar la importación con la fila de Materiales bloqueada.
- Resultado observado esperado: `construirAplicacionAtomicaMateriales` lanza un error si hay filas bloqueadas (líneas 3917–3922), lo que debería impedir que se apliquen incluso los cambios de Componentes ya válidos — comportamiento de "todo o nada" a nivel de la confirmación completa.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Verificar en ejecución si realmente ningún cambio parcial se aplica cuando una sola sección tiene bloqueos.

**XLS-11**
- Prioridad: Alta
- Tipo: Importación
- Precondiciones: Un tablero ya optimizado con al menos una pieza movida manualmente (ver sección 13).
- Datos: Cualquier Excel válido de proyecto.
- Pasos: 1) Mover una pieza manualmente en el diagrama. 2) Importar un archivo Excel adicional y confirmar.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN`. La confirmación de importación termina llamando `recalcular()`, que reconstruye `state.boards` desde cero — se infiere que el ajuste manual previo se pierde, pero no está confirmado en ejecución (`docs/engineering/10-CURRENT-STATE.md`, sección 17).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 17. Exportar formato

**FMT-01**
- Prioridad: CRITICAL
- Tipo: Exportación
- Precondiciones: Conjunto de la sección 5 capturado y válido.
- Datos: Igual que sección 5.
- Pasos: 1) Clic en "Archivo → Exportar formato". 2) Observar el nombre del archivo descargado.
- Resultado observado esperado: Se descarga `formato-proyecto-bamteck.xlsx` (línea 2678); antes de generar, se ejecuta `recalcular()` y si el proyecto es inválido se cancela con una alerta (líneas 2656–2660).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**FMT-02**
- Prioridad: Alta
- Tipo: Exportación
- Precondiciones: Igual que FMT-01.
- Datos: Igual que sección 5.
- Pasos: 1) Abrir el archivo descargado. 2) Revisar las hojas presentes y su contenido.
- Resultado observado esperado: Tres hojas: "Piezas" (con marcador oculto `PROYCUT_PROJECT_FORMAT` en M1/N1), "Componentes", "Materiales" (líneas 2585–2652); las piezas se listan tal cual están capturadas (sin expandir por cantidad).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Requiere abrir el archivo en un programa real de hojas de cálculo (ver sección 30).

**FMT-03**
- Prioridad: CRITICAL
- Tipo: Exportación
- Precondiciones: Archivo generado en FMT-01.
- Datos: El mismo archivo.
- Pasos: 1) Vaciar la tabla de piezas actual. 2) Importar el archivo generado (sección 16). 3) Confirmar.
- Resultado observado esperado: Las piezas, componentes y materiales exportados deberían reimportarse correctamente, dado que el propio formato está diseñado para ese ciclo.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**FMT-04**
- Prioridad: Media
- Tipo: Exportación
- Precondiciones: Igual que FMT-03.
- Datos: Igual que FMT-03.
- Pasos: 1) Comparar los valores de piezas/materiales/componentes antes de exportar y después de reimportar.
- Resultado observado esperado: Los datos deberían conservarse sin pérdida ni alteración de medidas, precios o cantidades.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 18. Exportar Excel completo

**EXC-01**
- Prioridad: CRITICAL
- Tipo: Exportación
- Precondiciones: Conjunto de la sección 5 optimizado.
- Datos: Igual que sección 5.
- Pasos: 1) Clic en "Exportar". 2) Observar el nombre del archivo.
- Resultado observado esperado: Se descarga `optimizador-cortes-bamteck-<fecha>.xlsx` (línea 8032); antes de generar, se toma una "instantánea" de estilo, tableros, reporte y piezas (líneas 7991–8000).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**EXC-02**
- Prioridad: Media
- Tipo: Exportación
- Precondiciones: Archivo generado en EXC-01.
- Datos: El mismo archivo.
- Pasos: 1) Abrir el archivo en un programa de hojas de cálculo real.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN` — requiere software externo (ver sección 30).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**EXC-03**
- Prioridad: Alta
- Tipo: Exportación
- Precondiciones: Igual que EXC-01.
- Datos: Igual que EXC-01.
- Pasos: 1) Revisar las hojas presentes.
- Resultado observado esperado: Tres hojas: "Piezas y diagramas", "Reporte", "Resumen y precio" (líneas 7497, 7651, 7920).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**EXC-04**
- Prioridad: Alta
- Tipo: Exportación
- Precondiciones: Igual que EXC-01.
- Datos: Igual que EXC-01.
- Pasos: 1) Comparar los subtotales y el total de la hoja "Reporte" contra lo mostrado en pantalla (sección 14).
- Resultado observado esperado: Deberían coincidir exactamente, porque ambos provienen de la misma instantánea de `state.ultimoReporte`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**EXC-05**
- Prioridad: Media
- Tipo: Exportación
- Precondiciones: Igual que EXC-01.
- Datos: Igual que EXC-01.
- Pasos: 1) Revisar la hoja "Piezas y diagramas" y confirmar que cada tablero tiene una imagen asociada.
- Resultado observado esperado: Una imagen PNG por tablero, generada a partir del mismo `dibujarBoard()` que usa la pantalla (`generarDiagramasParaExcel`, líneas 7382–7416).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**EXC-06**
- Prioridad: Baja
- Tipo: Exportación
- Precondiciones: Igual que EXC-01.
- Datos: Igual que EXC-01.
- Pasos: 1) Imprimir o previsualizar impresión de la hoja "Piezas y diagramas" y "Reporte".
- Resultado observado esperado: Escala de impresión fija del 70% para "Piezas y diagramas" (`ESCALA_IMPRESION_PIEZAS`, línea 7369); "Reporte" usa ajuste automático de ancho (`fitToWidth:1`, línea 7657).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Requiere una vista de impresión real, no solo lectura del archivo.

**EXC-07**
- Prioridad: Media
- Tipo: Exportación
- Precondiciones: Preferencias visuales personalizadas (colores/fuente distintos del valor por defecto).
- Datos: Cambiar color principal y fuente antes de exportar.
- Pasos: 1) Cambiar preferencias. 2) Exportar. 3) Revisar colores/fuente del Excel.
- Resultado observado esperado: El Excel debería usar los mismos colores y fuente elegidos, convertidos mediante `argbDesdeHex`/`fuenteAExcel` (líneas 7443–7458).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**EXC-08**
- Prioridad: Alta
- Tipo: Exportación
- Precondiciones: Igual que EXC-01.
- Datos: Igual que EXC-01.
- Pasos: 1) Comparar visualmente el diagrama de la hoja "Piezas y diagramas" contra el diagrama mostrado en pantalla en el momento de exportar.
- Resultado observado esperado: Deberían coincidir en distribución de piezas y colores, dado que ambos usan `dibujarBoard()` con los mismos `boards` y el mismo `estilo`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Requiere comparación visual humana (ver sección 30).

# 19. Exportar DXF

**DXF-01**
- Prioridad: CRITICAL
- Tipo: Exportación
- Precondiciones: Conjunto de la sección 5 optimizado en más de un tablero (por ejemplo OPT-02).
- Datos: Igual que OPT-02.
- Pasos: 1) Clic en "Exportar DXF (CNC)". 2) Observar la descarga.
- Resultado observado esperado: Se descarga un ZIP `optimizador-cortes-dxf-bamteck-<fecha>.zip` (línea 7301) con un archivo `.dxf` por tablero, nombrado `<material> - Tablero <n>.dxf` (líneas 7292–7294); la cantidad de archivos dentro del ZIP debería igualar la cantidad de tableros mostrados en pantalla.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**DXF-02**
- Prioridad: Media
- Tipo: Exportación
- Precondiciones: ZIP generado en DXF-01.
- Datos: El mismo ZIP.
- Pasos: 1) Abrir cada archivo `.dxf` en un software CAD/CNC real.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN` — requiere software externo (ver sección 30).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**DXF-03**
- Prioridad: Alta
- Tipo: Exportación
- Precondiciones: Igual que DXF-01.
- Datos: Igual que DXF-01.
- Pasos: 1) Revisar el contorno de capa "TABLERO" en cada archivo.
- Resultado observado esperado: Un rectángulo de `board.boardW` × `board.boardH`, en milímetros (`$INSUNITS=4`, línea 7241; `polilineaRectDxf`, líneas 7219–7232).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**DXF-04**
- Prioridad: Alta
- Tipo: Exportación
- Precondiciones: Igual que DXF-01, con al menos una pieza girada.
- Datos: Igual que DXF-01.
- Pasos: 1) Comparar las posiciones y rotaciones de las piezas en la capa "CORTE" del DXF contra las mostradas en pantalla.
- Resultado observado esperado: Cada pieza se traza como un rectángulo en su tamaño final ya rotado (`p.w`/`p.h` post-rotación), con el eje Y invertido respecto a pantalla porque DXF usa Y creciente hacia arriba (líneas 7220–7223).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**DXF-05**
- Prioridad: Media
- Tipo: Exportación
- Precondiciones: Un tablero con al menos una pieza movida manualmente (sección 13).
- Datos: Igual que DIAG-01, tras mover una pieza.
- Pasos: 1) Mover una pieza manualmente. 2) Exportar DXF sin recalcular explícitamente. 3) Revisar la posición de esa pieza en el DXF resultante.
- Resultado observado esperado: `exportarDXFZip()` llama `recalcular()` antes de generar el DXF (línea 7276) — a diferencia de la edición manual en pantalla, se infiere que esto **reconstruye** el acomodo automático y podría descartar el movimiento manual previo, pero no está confirmado en ejecución.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Prueba directamente relacionada con la incertidumbre de la sección 13 (DIAG-01/02/03).

# 20. Personalización

**PERS-01**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Al menos un tablero con piezas visibles en el diagrama.
- Datos: Cambiar "Color principal" y "Color secundario" a valores distintos.
- Pasos: 1) Cambiar los colores en "Ajuste de la interfaz".
- Resultado observado esperado: Las variables CSS `--azul`/`--azul2` cambian de inmediato (`aplicarEstiloGlobal`, líneas 4242–4257), afectando encabezados y botones en toda la interfaz, no solo el diagrama.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PERS-02**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Igual que PERS-01.
- Datos: Cambiar "Fuente de la interfaz" a "Monoespaciada"; cambiar "Tamaño del título principal" y "Tamaño de los títulos de sección".
- Pasos: 1) Cambiar los tres controles.
- Resultado observado esperado: La tipografía de toda la interfaz cambia (`fuenteACss`, líneas 4231–4238); los tamaños de título se aplican vía variables CSS `--fs-h1`/`--fs-h2`.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PERS-03**
- Prioridad: Baja
- Tipo: Interfaz
- Precondiciones: Igual que PERS-01.
- Datos: Cambiar estilo de "Línea de corte" a "Punteada" y de "Línea de enchapado" a "Discontinua".
- Pasos: 1) Cambiar ambos controles. 2) Observar el diagrama.
- Resultado observado esperado: Las líneas de corte y de tapacanto en el SVG deberían cambiar su patrón (`estiloADash`, líneas 6011–6015).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PERS-04**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Igual que PERS-01.
- Datos: Desactivar "+ Agregar componentes", "Archivo" y "Espejo" en "Mostrar / ocultar botones".
- Pasos: 1) Desmarcar los tres checkboxes.
- Resultado observado esperado: Los botones/menús correspondientes desaparecen; si tenían un subpanel abierto, este se cierra automáticamente (`aplicarVisibilidadBotones`, líneas 4263–4290).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PERS-05**
- Prioridad: CRITICAL
- Tipo: Persistencia
- Precondiciones: Cambios de PERS-01 a PERS-04 aplicados.
- Datos: Los mismos cambios.
- Pasos: 1) Verificar que `localStorage['occ_bamteck_estilo_v1']` contiene los valores nuevos.
- Resultado observado esperado: `guardarEstilo()` escribe en `localStorage` en cada cambio de cualquier control de estilo (línea 4227–4229).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PERS-06**
- Prioridad: CRITICAL
- Tipo: Persistencia
- Precondiciones: PERS-05 ejecutada.
- Datos: Ninguno adicional.
- Pasos: 1) Recargar la página (F5). 2) Revisar "Ajuste de la interfaz".
- Resultado observado esperado: `cargarEstiloGuardado()` debería restaurar exactamente los valores guardados (líneas 4185–4226).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PERS-07**
- Prioridad: Baja
- Tipo: Interfaz
- Precondiciones: Ninguna especial.
- Datos: Tamaño de letra de piezas en 20 (máximo permitido según `max="16"` en el HTML — probar también el valor fuera de rango); tamaño de diagrama al 160% (máximo del control).
- Pasos: 1) Llevar los controles a sus valores extremos permitidos por el HTML.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN` — no está confirmado por lectura estática si el SVG y las tablas manejan con claridad los valores extremos (por ejemplo texto que se sale de una pieza muy chica) sin ejecutarlo.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 21. Redimensionamiento

**RSZ-01**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Al menos una pieza capturada.
- Datos: Ninguno.
- Pasos: 1) Arrastrar el borde derecho del encabezado "Material" en la tabla de piezas. 2) Observar el ancho de la columna y el tooltip que muestra el valor en px.
- Resultado observado esperado: La columna cambia de ancho en tiempo real; aparece un tooltip con el ancho en píxeles mientras se arrastra (`activarColumnasRedimensionables`, líneas 8086–8121).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**RSZ-02**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Al menos una pieza capturada y un diagrama visible.
- Datos: Ninguno.
- Pasos: 1) Arrastrar el divisor central entre la columna de piezas/precio y la columna del diagrama.
- Resultado observado esperado: El ancho relativo de ambas columnas cambia, limitado entre 25% y 75% (`activarDivisorColumnas`, líneas 8134–8139).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**RSZ-03**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Ninguna especial.
- Datos: Resoluciones de referencia: 1920×1080, 1366×768, 768×1024 (o el equivalente disponible), y niveles de zoom del navegador 100%/125%/150%.
- Pasos: 1) Probar la interfaz en cada resolución/zoom.
- Resultado observado esperado: Por debajo de 1050px de ancho, el layout de dos columnas debería apilarse verticalmente (`@media (max-width:1050px)`); por debajo de 860px, el menú de texto debería colapsar en el botón de hamburguesa (`@media (max-width:860px)`).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: `POR DETERMINAR MEDIANTE EJECUCIÓN` el comportamiento visual exacto en cada punto de quiebre.

**RSZ-04**
- Prioridad: Baja
- Tipo: Interfaz
- Precondiciones: Ninguna especial.
- Datos: Ventana del navegador redimensionada a un ancho menor a 400px.
- Pasos: 1) Achicar la ventana al mínimo práctico.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN` — no hay una regla CSS específica documentada para anchos extremadamente pequeños más allá de los dos puntos de quiebre ya mencionados.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**RSZ-05**
- Prioridad: Baja
- Tipo: Interfaz
- Precondiciones: RSZ-01 y RSZ-02 ejecutadas.
- Datos: Ninguno.
- Pasos: 1) Tras redimensionar columnas y el divisor, agregar una pieza nueva o recalcular. 2) Observar si las medidas ajustadas se conservan.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN` — no se detectó código que persista estos anchos entre acciones distintas de redimensionar; se infiere que se mantienen mientras no se recargue la página, pero no está confirmado si alguna acción (como cambiar de pestaña de tablero) los resetea.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 22. Menús y paneles

**MENU-01**
- Prioridad: Alta
- Tipo: Interfaz
- Precondiciones: Arranque limpio.
- Datos: Ninguno.
- Pasos: 1) Abrir cada uno de los 5 paneles de configuración (Placas y tableros, Cubre canto, Componentes, Ajuste de la interfaz, Ajustes de parámetros de corte). 2) Cerrar cada uno con "Guardar" o volviendo al logo.
- Resultado observado esperado: Cada panel se abre/cierra mediante las clases `open`/`active` (líneas 2392–2422); al abrir cualquiera, el resto de la interfaz (`split`) se oculta (`actualizarVisibilidadInterfaz`, líneas 2365–2368).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**MENU-02**
- Prioridad: Alta
- Tipo: Interfaz
- Precondiciones: Igual que MENU-01.
- Datos: Ninguno.
- Pasos: 1) Abrir "Placas y tableros". 2) Sin cerrarlo, abrir "Cubre canto".
- Resultado observado esperado: Solo un panel permanece abierto a la vez; `cerrarTodoElMenu()` se ejecuta antes de abrir el nuevo (líneas 2392–2422).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**MENU-03**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Un menú de texto (Materiales/Preferencias/Ayuda) desplegado.
- Datos: Ninguno.
- Pasos: 1) Abrir el menú "Materiales". 2) Hacer clic en un punto vacío de la página, fuera del menú.
- Resultado observado esperado: El menú se cierra (`crearMenuTexto`, líneas 2446–2451).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**MENU-04**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Ventana angosta (menor a 860px, ver RSZ-03).
- Datos: Ninguno.
- Pasos: 1) Reducir el ancho de la ventana. 2) Clic en el botón de hamburguesa.
- Resultado observado esperado: El menú de texto completo (Materiales/Preferencias/Ayuda/Mi cuenta) se despliega debajo del encabezado (líneas 2463–2480).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**MENU-05**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Al menos una fila de pieza.
- Datos: Ninguno.
- Pasos: 1) Clic en el botón "Archivo".
- Resultado observado esperado: Se despliega un menú con "Exportar formato" e "Importar" (líneas 2256–2264); clic fuera lo cierra (líneas 2265–2271).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**MENU-06**
- Prioridad: Media
- Tipo: Interfaz
- Precondiciones: Un tablero optimizado visible.
- Datos: Ninguno.
- Pasos: 1) Clic en el botón "Espejo".
- Resultado observado esperado: Se despliega un menú con 4 opciones direccionales (líneas 7108–7124); clic fuera lo cierra (líneas 7125–7131).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**MENU-07**
- Prioridad: Baja
- Tipo: Interfaz
- Precondiciones: Arranque limpio.
- Datos: Ninguno.
- Pasos: 1) Clic en "Preferencias" en el encabezado.
- Resultado observado esperado: Se despliegan las opciones "Ajuste de la interfaz" y "Ajustes de parámetros de corte" (líneas 503–511).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**MENU-08**
- Prioridad: Baja
- Tipo: Interfaz
- Precondiciones: Arranque limpio.
- Datos: Ninguno.
- Pasos: 1) Clic en "Ayuda" en el encabezado.
- Resultado observado esperado: Se despliegan las opciones "Academia" y "Centro de ayuda" (líneas 513–520); cada una dispara un `alert()` de "próximamente disponible" al seleccionarse (ver sección 23).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 23. Funciones demostrativas

**DEMO-01**
- Prioridad: CRITICAL
- Tipo: Funcional
- Precondiciones: Conjunto de la sección 5 capturado y válido.
- Datos: Igual que sección 5.
- Pasos: 1) Clic en "Confirmar pedido".
- Resultado observado esperado: Alerta con el texto exacto: "Pedido registrado (demo). La integración con el carrito de WooCommerce se conecta en la fase 2." (línea 8055). No ocurre ninguna otra acción — no se guarda ni envía nada.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Si el proyecto es inválido o el total no es un número finito ≥ 0, debería mostrarse en su lugar una alerta de error distinta (líneas 8047–8054).

**DEMO-02**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: Arranque limpio.
- Datos: Ninguno.
- Pasos: 1) Clic en "Mi cuenta".
- Resultado observado esperado: Alerta con el texto exacto: "Mi cuenta: proximamente disponible." (línea 2491).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**DEMO-03**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: Arranque limpio.
- Datos: Ninguno.
- Pasos: 1) Clic en "Ayuda → Academia".
- Resultado observado esperado: Alerta con el texto exacto: "Academia: proximamente disponible." (línea 2495).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**DEMO-04**
- Prioridad: Media
- Tipo: Funcional
- Precondiciones: Arranque limpio.
- Datos: Ninguno.
- Pasos: 1) Clic en "Ayuda → Centro de ayuda".
- Resultado observado esperado: Alerta con el texto exacto: "Centro de ayuda: proximamente disponible." (línea 2499).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 24. Persistencia

**PST-01**
- Prioridad: CRITICAL
- Tipo: Persistencia
- Precondiciones: Conjunto de la sección 5 capturado, catálogos modificados, componentes agregados al proyecto.
- Datos: Igual que sección 5.
- Pasos: 1) Capturar todos los datos maestros. 2) Recargar la página (F5). 3) Revisar qué se conserva y qué no.
- Resultado observado esperado: Deberían perderse: piezas, catálogo de materiales/tapacantos/componentes añadidos, componentes del proyecto, resultado de optimización, reporte. Debería conservarse: preferencias visuales, si fueron guardadas (`docs/engineering/10-CURRENT-STATE.md`, sección 5).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PST-02**
- Prioridad: Media
- Tipo: Persistencia
- Precondiciones: `localStorage` vacío (limpiar manualmente la clave `occ_bamteck_estilo_v1` antes de esta prueba).
- Datos: Ninguno.
- Pasos: 1) Cargar la página con `localStorage` vacío.
- Resultado observado esperado: `cargarEstiloGuardado()` no encuentra la clave y retorna sin hacer nada (línea 4186–4187); se usan los valores predeterminados del HTML.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**PST-03**
- Prioridad: Media
- Tipo: Persistencia
- Precondiciones: `localStorage` con una entrada previa válida de una sesión anterior.
- Datos: Preferencias guardadas en PERS-05.
- Pasos: 1) Cargar la página con esa entrada presente.
- Resultado observado esperado: Igual que PERS-06 — se restauran los valores guardados.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Prueba redundante con PERS-06, incluida aquí para completar la cobertura de esta sección.

**PST-04**
- Prioridad: Baja
- Tipo: Persistencia
- Precondiciones: Poder editar manualmente `localStorage` desde las herramientas de desarrollo del navegador (acción seura de ejecutar, no afecta el archivo fuente).
- Datos: Escribir un valor no-JSON (por ejemplo el texto `"{rota"`) en la clave `occ_bamteck_estilo_v1`.
- Pasos: 1) Corromper manualmente el valor de la clave. 2) Recargar la página.
- Resultado observado esperado: `cargarEstiloGuardado()` está envuelto en un `try/catch` (líneas 4185–4225); se infiere que un error de `JSON.parse` se captura silenciosamente y la aplicación continúa con los valores por defecto, pero esto no está confirmado en ejecución.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Prueba explícitamente marcada como segura de ejecutar porque no modifica `index.html`, solo el almacenamiento del navegador.

# 25. Casos límite

**LIM-01**
- Prioridad: Alta
- Tipo: Límite
- Precondiciones: Arranque limpio, cero piezas.
- Datos: Ninguno.
- Pasos: 1) Sin agregar ninguna pieza, observar el estado de los paneles de reporte y diagrama.
- Resultado observado esperado: `recalcular()` retorna `false` cuando `piezas.length === 0` y oculta ambos paneles (líneas 6832–6838).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**LIM-02**
- Prioridad: Media
- Tipo: Límite
- Precondiciones: Ninguna especial.
- Datos: Pieza de 1×1 mm.
- Pasos: 1) Capturar una pieza de 1×1 mm.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN` — `validarMedida` acepta cualquier valor mayor que `Number.MIN_VALUE` (línea 1991); se infiere que la pieza es válida y se coloca, pero el resultado visual con una pieza tan pequeña no está confirmado.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**LIM-03**
- Prioridad: Media
- Tipo: Límite
- Precondiciones: Ninguna especial.
- Datos: Pieza de 100000×100000 mm (el máximo permitido por `LIMITES.medidaMm`, línea 1211).
- Pasos: 1) Capturar la pieza. 2) Observar el resultado.
- Resultado observado esperado: Debería rechazarse por no caber en ningún tablero estándar (2440×1220), generando el mensaje de "no cabe" (líneas 5171–5179).
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**LIM-04**
- Prioridad: Media
- Tipo: Límite
- Precondiciones: Ninguna especial.
- Datos: Una pieza con cantidad 1000 (el máximo permitido, `LIMITES.cantidadPorFila`, línea 1208).
- Pasos: 1) Capturar la fila con cantidad 1000.
- Resultado observado esperado: `validarCantidad` la acepta (línea 1987); `leerPiezas()` debería expandirla en 1000 piezas individuales, pudiendo acercarse al límite `LIMITES.piezasExpandidas` (50000, línea 1210) si se combina con "Cantidad de proyectos".
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Prueba potencialmente lenta de ejecutar; medir el tiempo de recálculo.

**LIM-05**
- Prioridad: Baja
- Tipo: Límite
- Precondiciones: Ninguna especial.
- Datos: Precio de material en 0.
- Pasos: 1) Establecer el precio de "Melamina de 15mm" en 0.
- Resultado observado esperado: `validarPrecio` acepta 0 como válido (mínimo permitido, línea 1995); el subtotal de material para ese material debería ser 0 sin generar error.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**LIM-06**
- Prioridad: Baja
- Tipo: Límite
- Precondiciones: Ninguna especial.
- Datos: Precio de material en 100,000,000 (el máximo permitido, `LIMITES.precio`, línea 1212).
- Pasos: 1) Establecer ese precio.
- Resultado observado esperado: Debería aceptarse y reflejarse en el subtotal sin error de validación.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**LIM-07**
- Prioridad: Baja
- Tipo: Límite
- Precondiciones: Ninguna especial.
- Datos: Nombre de material con 200 caracteres; nombre con caracteres especiales (`Melamina "18mm" <Blanca> & Ñoño`).
- Pasos: 1) Crear un material con un nombre muy largo. 2) Crear otro con caracteres especiales, incluyendo comillas y símbolos.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN` — no se detectó ninguna validación de longitud máxima ni de caracteres permitidos para el nombre de un material; se infiere que se acepta cualquier texto, pero el efecto visual (recorte, desbordamiento) no está confirmado. Al exportar, `textoSeguroParaExcel()` neutraliza texto que empiece con `=`, `+`, `-` o `@` para evitar inyección de fórmulas (líneas 1998–2002) — este caso puntual sí está confirmado por código.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: Probar también un nombre que empiece con "=" (por ejemplo "=SUMA(A1:A10)") para confirmar la neutralización al exportar.

**LIM-08**
- Prioridad: Media
- Tipo: Límite
- Precondiciones: Ninguna especial.
- Datos: 50 filas de piezas distintas capturadas manualmente o vía CSV.
- Pasos: 1) Capturar o importar 50 piezas distintas.
- Resultado observado esperado: `POR DETERMINAR MEDIANTE EJECUCIÓN` — no está confirmado el tiempo de respuesta ni la estabilidad de la interfaz (scroll, redimensionamiento) con un catálogo o lista de piezas de ese tamaño.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

**LIM-09**
- Prioridad: Alta
- Tipo: Límite
- Precondiciones: Ninguna especial.
- Datos: Una pieza de 3000×1500 mm con un material cuyo tablero mide 2440×1220 mm (menor que la pieza en ambas dimensiones).
- Pasos: 1) Capturar la pieza con ese material.
- Resultado observado esperado: Debería rechazarse con un mensaje indicando que no cabe en el tablero de ese material en ninguna orientación (líneas 5171–5179), citando las medidas del material y del área de colocación.
- Resultado real: —
- Estado: NOT RUN
- Evidencia: —
- Notas: —

# 26. Pruebas críticas de regresión

Las siguientes pruebas están marcadas como `Prioridad: CRITICAL` en su propia definición (secciones 6–25) y deberán ejecutarse después de cualquier cambio de código, sin excepción. Se listan aquí como índice, sin repetir su contenido completo.

```text
ARR-01   Carga inicial sin errores visibles
ARR-02   Catálogos iniciales correctos (materiales/tapacantos semilla)
MAT-01   Crear un material nuevo
MAT-03   Cambiar precio de material y verificar efecto en costo
MAT-06   Renombrar un material en uso por una pieza
TAP-03   Asignar/quitar tapacanto por lado y verificar efecto en costo
PZ-01    Agregar una pieza
PZ-02    Editar medidas de una pieza y verificar recálculo
PZ-07    Cambiar el giro de una pieza en sus 3 estados
OPT-01   Optimización que produce un solo tablero
OPT-02   Optimización que produce varios tableros
OPT-03   Pieza que no cabe en ningún tablero
DIAG-01  Arrastrar una pieza y verificar si el costo se actualiza
DIAG-02  Rotar una pieza y verificar si el costo se actualiza
REP-05   Total general y su consistencia antes/después de un cambio
CSV-01   Importación CSV válida
XLS-01   Importación Excel válida (apertura de vista previa)
XLS-08   Confirmación de importación Excel
XLS-10   Aplicación atómica ante filas bloqueadas
FMT-01   Generación de "Exportar formato"
FMT-03   Reimportación del archivo de "Exportar formato"
EXC-01   Generación del Excel completo
DXF-01   Generación del ZIP con archivos DXF
PERS-05  Guardado de preferencias en localStorage
PERS-06  Restauración de preferencias tras recargar
PST-01   Qué sobrevive y qué se pierde al recargar la página
DEMO-01  Mensaje exacto de "Confirmar pedido"
```

Total: 26 pruebas críticas (dentro del rango solicitado de 15–25 se listan las estrictamente indispensables; se documentan todas las que quedaron marcadas `CRITICAL` en el cuerpo del documento, ligeramente por encima del rango sugerido dado el número de áreas funcionales independientes que el prototipo cubre — ver resumen final).

# 27. Matriz de trazabilidad

Relación entre cada grupo de pruebas y las secciones correspondientes de `docs/engineering/10-CURRENT-STATE.md`:

| Grupo de pruebas | Secciones de 10-CURRENT-STATE.md |
|---|---|
| Arranque (sección 6) | Sección 6 (Flujo de inicialización) |
| Materiales / Tapacantos / Componentes (7–9) | Secciones 3, 8 (Catálogos, Estado y almacenamiento) |
| Piezas (10) | Secciones 3, 7 (Piezas, Flujo principal de actualización) |
| Parámetros de corte (11) | Secciones 3, 12 (Cálculos actuales, kerf/márgenes) |
| Optimización (12) | Sección 13 (Optimización) |
| Edición manual del diagrama (13) | Secciones 13, 17 (Optimización; Comportamientos pendientes de verificar) |
| Costos y reporte (14) | Sección 12 (Cálculos actuales) |
| Importación CSV / Excel (15–16) | Sección 14 (Importación y exportación) |
| Exportar formato / Excel / DXF (17–19) | Sección 14 (Importación y exportación) |
| Personalización (20) | Sección 15 (Personalización) |
| Redimensionamiento (21) | Sección 4 (Interfaz actual) |
| Menús y paneles (22) | Sección 4 (Interfaz actual) |
| Funciones demostrativas (23) | Sección 3 (Funcionalidades actuales) |
| Persistencia (24) | Sección 5 (Estado y almacenamiento) |
| Casos límite (25) | Secciones 12, 19 (Cálculos actuales; Funcionalidad no implementada, para los límites relacionados con validación) |

# 28. Registro de resultados

Plantilla reutilizable para documentar cada ejecución individual, por fuera del cuerpo de este documento (por ejemplo en una hoja de cálculo o issue tracker):

```text
ID:
Fecha:
Commit:
Resultado:
Evidencia:
Observaciones:
```

# 29. Resultados de referencia

Tablas vacías para completar durante la primera ejecución con los datos maestros de la sección 5, y usarse como referencia de comparación en ejecuciones futuras.

**Subtotales y total** (ver también sección 14)

| Concepto | Valor |
|---|---|
| Subtotal material | |
| Subtotal componentes | |
| Subtotal corte | |
| Subtotal tapacanto | |
| Total general | |

**Tableros y desperdicio**

| Material | Tableros usados | Área de sobrante total (m²) |
|---|---|---|
| Melamina de 15mm | | |
| Melamina de 18mm | | |

**Sobrantes aprovechables** (por tablero)

| Tablero | Medidas de sobrantes (mm) |
|---|---|
| | |

**Posiciones de piezas** (al menos una muestra por tablero)

| Pieza # | Tablero | x | y | w | h | Rotada |
|---|---|---|---|---|---|---|
| | | | | | | |

**Archivos exportados**

| Tipo | Nombre de archivo | Tamaño | Hash/checksum |
|---|---|---|---|
| Exportar formato | | | |
| Excel completo | | | |
| DXF (ZIP) | | | |

**Apariencia**

| Elemento | Valor guardado en localStorage |
|---|---|
| Contenido completo de `occ_bamteck_estilo_v1` | |

# 30. Límites

- **Requieren Excel real (o software equivalente de hojas de cálculo)**: FMT-02, EXC-02 a EXC-08 — la lectura estática del código solo confirma cómo se construye el archivo, no cómo se comporta al abrirse.
- **Requieren software DXF/CAD/CNC real**: DXF-02 a DXF-05 — la validez del archivo DXF para maquinaria real no puede confirmarse sin abrirlo en ese software.
- **Requieren ejecución en distintos navegadores**: ARR-01 a ARR-05 (posibles diferencias de renderizado o de política de `localStorage`), PST-02 a PST-04, y cualquier prueba que dependa de `crypto.randomUUID` (con reserva de compatibilidad, línea 1248) o de comportamiento de descarga de archivos.
- **Requieren dispositivos táctiles**: DIAG-01, DIAG-05 (arrastre e imanes), RSZ-01, RSZ-02 (redimensionamiento) — todos los manejadores de arrastre observados en el código usan eventos de mouse (`mousedown`/`mousemove`/`mouseup`); su comportamiento en pantallas táctiles no está confirmado.
- **Requieren comparación visual humana**: EXC-08, PERS-01 a PERS-04, RSZ-03 — no hay forma de automatizar la verificación de que un color, una fuente o un diagrama "se ven bien" sin criterio humano.
- **Requieren carga con conexión a internet real**: EXC-01, DXF-01 y cualquier prueba de exportación, porque `ExcelJS` y `JSZip` se cargan desde un CDN externo (`docs/engineering/10-CURRENT-STATE.md`, sección 14); debe probarse también el caso de falla de red, aunque no se incluyó como prueba separada en este documento por no estar solicitado explícitamente en la estructura obligatoria.

# 31. Conclusión de alcance

Este documento cubre las 25 áreas funcionales solicitadas con 134 pruebas individuales. Ninguna prueba fue ejecutada ni marcada como aprobada. Los comportamientos que dependen de una decisión de diseño no documentada en el código (en particular, si el costo se actualiza tras una edición manual del diagrama, secciones 13 y 16) quedaron explícitamente señalados con `POR DETERMINAR MEDIANTE EJECUCIÓN` en lugar de asumirse.
