# 16-VALIDATION-UTILS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción de la función pura de validación `validarNumeroEntrada` de `src/scripts/main.js` a un archivo utilitario externo (`src/scripts/utils/validation.js`), documentar por qué el alcance se redujo respecto a lo originalmente solicitado (cuatro funciones), y dejar constancia de las pruebas automáticas y manuales pendientes.

## Depende de
`src/scripts/main.js`; `src/scripts/utils/format.js`; `src/scripts/utils/validation.js`; `index.html`; `docs/engineering/10-CURRENT-STATE.md`; `docs/engineering/12-MANUAL-TESTS.md`; `docs/engineering/15-FORMAT-UTILS-EXTRACTION-REPORT.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Extraer las funciones puras de validación de `src/scripts/main.js` a `src/scripts/utils/validation.js`, expuestas mediante `window.ProyCutValidation`, siguiendo el mismo patrón mecánico usado para `docs/engineering/15-FORMAT-UTILS-EXTRACTION-REPORT.md`. Cuarta refactorización de la reorganización.

# Desviación de alcance respecto a la tarea original (leer primero)

La tarea solicitó extraer cuatro funciones: `validarNumeroEntrada`, `validarCantidad`, `validarMedida`, `validarPrecio`, pidiendo confirmar antes que ninguna dependiera de variables internas de la IIFE.

Por lectura directa de `src/scripts/main.js` (líneas 796–818, antes de este cambio) se confirmó que:

- **`validarNumeroEntrada(valor, nombre, opciones)`** — recibe todo por parámetro, no accede a `document`, `state`, `localStorage` ni a ninguna variable externa. **Genuinamente pura.**
- **`validarCantidad(valor, nombre)`**, **`validarMedida(valor, nombre)`**, **`validarPrecio(valor, nombre)`** — cada una es un envoltorio delgado que llama a `validarNumeroEntrada` pasando límites tomados de **`LIMITES`** (`LIMITES.cantidadPorFila`, `LIMITES.medidaMm`, `LIMITES.precio` respectivamente). `LIMITES` es un `const` declarado dentro de la propia IIFE de `main.js` (línea 26), **no un parámetro**. Estas tres sí dependen de una variable interna de la IIFE.

Mover las tres funciones envolventes a `validation.js` tal cual habría dejado la referencia a `LIMITES` apuntando a nada en ese archivo (los cierres de JavaScript son léxicos, no dinámicos: `validation.js` se ejecuta en su propio ámbito y no ve el `LIMITES` declarado dentro de la IIFE de `main.js`), rompiendo la validación de piezas, materiales, tapacantos y componentes en tiempo de ejecución.

Se consultó al usuario antes de modificar cualquier archivo. Se autorizó explícitamente reducir el alcance a **extraer únicamente `validarNumeroEntrada`**, dejando `validarCantidad`, `validarMedida` y `validarPrecio` sin tocar en su ubicación original dentro de `main.js`, donde `LIMITES` sigue estando en su ámbito léxico correcto. Esas tres funciones siguen llamando a `validarNumeroEntrada` exactamente igual que antes; la única diferencia es que ese nombre ahora resuelve, por closure, contra la constante importada desde `window.ProyCutValidation` en vez de contra una declaración local.

# Funciones extraídas

| Función | Ubicación original en `main.js` (antes de este cambio) |
|---|---|
| `validarNumeroEntrada(valor, nombre, opciones)` | línea 796 |

**No se extrajeron** `validarCantidad`, `validarMedida` ni `validarPrecio` (ver sección anterior). **No se extrajo** `validarProyecto()` ni ninguna otra función.

# Evidencia de pureza

`validarNumeroEntrada`: recibe `valor`, `nombre` y `opciones` por parámetro; usa únicamente `String`, `Number`, `Number.isFinite`, `Number.isInteger` y comparaciones sobre sus propios parámetros; devuelve siempre un objeto explícito (`{ok:true, valor}` o `{ok:false, error}`). Sin acceso a `document`, `state`, `localStorage` ni a ninguna variable externa a su propio cuerpo.

# Archivos creados

- `src/scripts/utils/validation.js` — 18 líneas. Contiene `validarNumeroEntrada` (cuerpo, firma, comentarios y textos de error sin alterar), envuelta en su propia IIFE, expuesta mediante:
  ```js
  window.ProyCutValidation = {
    validarNumeroEntrada
  };
  ```
  Sin módulos ES, sin `import`/`export`, sin `type="module"`.

No se creó ninguna otra carpeta (`src/scripts/utils/` ya existía desde la extracción de `format.js`).

# Archivos modificados

- **`src/scripts/main.js`**: se eliminó únicamente la declaración original de `validarNumeroEntrada` (líneas 796–806). Se agregó, inmediatamente después del bloque de desestructuración de `window.ProyCutFormat` (y antes de `let BOARD_W = 2440;`):
  ```js
  const {
    validarNumeroEntrada
  } = window.ProyCutValidation;
  ```
  `validarCantidad`, `validarMedida`, `validarPrecio`, `validarProyecto()`, `leerPiezas()`, `recalcular()`, `LIMITES` y el resto del archivo **no se modificaron**. Las 13 llamadas existentes a `validarNumeroEntrada` en el archivo (3 dentro de los envoltorios `validarCantidad`/`validarMedida`/`validarPrecio`, y 10 usos directos en otras partes del código) siguen intactas y resuelven, por closure, contra la constante importada.

- **`index.html`**: se agregó `<script src="./src/scripts/utils/validation.js"></script>` entre `format.js` y `main.js`, sin `type="module"`, `defer` ni `async`.

No se modificó `src/scripts/utils/format.js` ni `src/styles/styles.css`.

# Comparaciones

- `diff` entre el cuerpo de `validarNumeroEntrada` en `validation.js` y su versión original en `main.js` (antes de editar): **sin diferencias**.
- Búsqueda de `function validarNumeroEntrada(` al inicio de línea en `main.js` tras el cambio: **sin coincidencias** (ya no existe la declaración local).
- `validation.js` no contiene `document`, `state` ni `localStorage`; su único uso de `window` es la asignación final.
- `format.js` sigue cargando antes que `validation.js`, y ambos antes que `main.js` (confirmado por el orden de las tres etiquetas `<script>` en `index.html`).
- `node --check` sobre `format.js`, `validation.js` y `main.js`: los tres sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `src/scripts/utils/format.js`, `src/scripts/utils/validation.js`, `src/scripts/main.js` y `src/styles/styles.css` respondieron `200`; `validation.js` con `Content-Type: text/javascript`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados), `src/scripts/utils/validation.js` y este reporte (nuevos) — ver sección final del chat.

# Pruebas automáticas

Ejecutadas en un sandbox de Node (`vm`, módulo incluido en Node, sin dependencias nuevas), simulando `window` y cargando `validation.js` tal cual. Los resultados son el comportamiento real de la función extraída, no valores supuestos:

| Caso | Entrada | Opciones | Resultado real |
|---|---|---|---|
| Cantidad válida | `5` | `{entero:true, min:1, max:1000}` | `{ok:true, valor:5}` |
| Cantidad cero | `0` | ídem | `{ok:false, error:"Cantidad: debe ser mayor o igual que 1."}` |
| Cantidad negativa | `-3` | ídem | `{ok:false, error:"Cantidad: debe ser mayor o igual que 1."}` |
| Cantidad decimal no permitida | `2.5` | ídem | `{ok:false, error:"Cantidad: debe ser un numero entero."}` |
| Medida válida | `600` | `{min:Number.MIN_VALUE, max:100000}` | `{ok:true, valor:600}` |
| Medida cero | `0` | ídem | `{ok:false, error:"Largo: debe ser mayor o igual que 5e-324."}` |
| Medida negativa | `-10` | ídem | `{ok:false, error:"Largo: debe ser mayor o igual que 5e-324."}` |
| Precio válido | `750` | `{min:0, max:100000000}` | `{ok:true, valor:750}` |
| Precio cero | `0` | ídem | `{ok:true, valor:0}` |
| Precio negativo | `-1` | ídem | `{ok:false, error:"Precio: debe ser mayor o igual que 0."}` |
| Valor vacío | `''` | `{min:Number.MIN_VALUE, max:100000}` | `{ok:false, error:"Campo: el valor es obligatorio."}` |
| Valor no numérico | `'abc'` | ídem | `{ok:false, error:"Campo: debe ser un numero finito."}` |

Las opciones usadas (`max:1000`, `max:100000`, `max:100000000`, `min:Number.MIN_VALUE`) replican exactamente los límites que `validarCantidad`, `validarMedida` y `validarPrecio` pasan hoy en `main.js` (`LIMITES.cantidadPorFila`, `LIMITES.medidaMm`, `LIMITES.precio`), para que las pruebas reflejen el comportamiento real que verá el usuario, aunque esas tres funciones no fueron movidas.

**Hallazgo real, no fabricado:** una medida de `0` se **rechaza** (el mínimo es `Number.MIN_VALUE`, no `0`), mientras que un precio de `0` **se acepta**. Es el comportamiento existente del código, documentado aquí como hecho observado, no como algo a corregir.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **PZ-01** — capturar una pieza válida (cantidad, largo, ancho, material dentro de los límites).
- **PZ-11** — intentar una cantidad inválida (vacía, cero, negativa o decimal) y confirmar el mensaje de error exacto y que el bloqueo impide continuar.
- **PZ-11** — intentar una medida inválida (incluyendo específicamente `0`, dado el hallazgo de esta sección) y confirmar mensaje y bloqueo.
- **MAT-03 / TAP-01 / COMP-01** (según corresponda) — intentar un precio inválido (negativo) y confirmar mensaje y bloqueo; confirmar que un precio de `0` sí se acepta, como predice la prueba automática.
- **ARR-01, OPT-01, REP-05** — confirmar que, con datos válidos, el diagrama se genera y el total se calcula con normalidad tras este cambio.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13, 14 y 15). La verificación funcional se limitó a un sandbox de Node fuera del navegador, a peticiones HTTP directas y a comparación textual del código.
- El alcance de esta extracción es menor al solicitado originalmente en la tarea (una función en vez de cuatro), por la razón técnica documentada arriba. Si en el futuro se decide extraer también `validarCantidad`, `validarMedida` y `validarPrecio`, esa extracción requerirá primero decidir cómo `LIMITES` (o los valores que esas funciones necesitan) se vuelve accesible fuera de la IIFE de `main.js` — una decisión de diseño explícitamente fuera del alcance de este cambio.
- No se verificó en ejecución si algún otro punto de `main.js`, fuera de las 13 llamadas ya contabilizadas, referencia `validarNumeroEntrada` de forma indirecta.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, la declaración original de `validarNumeroEntrada` en su ubicación previa (antes de `validarCantidad`), copiando el cuerpo de `src/scripts/utils/validation.js` (sin el envoltorio de IIFE ni la asignación a `window.ProyCutValidation`).
2. Eliminar el bloque `const { validarNumeroEntrada } = window.ProyCutValidation;` del inicio de la IIFE de `main.js`.
3. Eliminar la línea `<script src="./src/scripts/utils/validation.js"></script>` de `index.html`.
4. Opcionalmente, eliminar `src/scripts/utils/validation.js`.

Como la función movida está verificada como byte-idéntica a su versión original y `validarCantidad`/`validarMedida`/`validarPrecio` nunca se tocaron, este proceso de reversión es mecánico.
