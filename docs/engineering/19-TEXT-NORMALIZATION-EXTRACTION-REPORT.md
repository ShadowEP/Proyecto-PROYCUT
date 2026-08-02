# 19-TEXT-NORMALIZATION-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción de las funciones puras de normalización de texto de `src/scripts/main.js` a un archivo utilitario externo (`src/scripts/utils/text-normalization.js`), la evidencia de pureza evaluada para cada candidata, y un incidente de transcripción detectado y corregido durante la propia tarea.

## Depende de
`src/scripts/main.js`; `src/scripts/utils/format.js`; `src/scripts/utils/validation.js`; `src/scripts/config/limits.js`; `src/scripts/utils/text-normalization.js`; `index.html`; `docs/engineering/18-VALIDATION-MODULE-COMPLETE.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Extraer únicamente las funciones puras de normalización de texto de `src/scripts/main.js` a `src/scripts/utils/text-normalization.js`, expuestas mediante `window.ProyCutTextNormalization`. Séptima refactorización mecánica de la reorganización.

# Funciones evaluadas

Las cinco candidatas indicadas en la tarea, evaluadas una por una contra los siete criterios de pureza pedidos (sin `document`, sin `state`, sin `localStorage`, sin depender de variables internas de la IIFE, reciben todo por parámetro, devuelven resultado explícito, sin efectos secundarios):

| Función | Ubicación original (antes de este cambio) | Cumple los 7 criterios |
|---|---|---|
| `normalizarSkuManual(valor)` | `main.js`, línea 100 | Sí |
| `esValorAfirmativo(valor)` | `main.js`, línea 1514 | Sí |
| `normalizarGirarCSV(valor)` | `main.js`, línea 1524 | Sí |
| `normalizarNombreComponente(valor)` | `main.js`, línea 1909 | Sí |
| `normalizarNombreMaterialImportado(valor)` | `main.js`, línea 1918 | Sí |

# Funciones extraídas

Las cinco. Ninguna candidata fue descartada.

# Funciones descartadas y motivo

Ninguna. A diferencia de la extracción de `docs/engineering/16-VALIDATION-UTILS-EXTRACTION-REPORT.md` (donde `validarCantidad`/`validarMedida`/`validarPrecio` dependían de `LIMITES`, una variable interna de la IIFE, en ese momento no accesible), ninguna de estas cinco funciones depende de otra función, de otra variable externa a su propio cuerpo, ni de las demás candidatas entre sí — cada una recibe únicamente `valor` como parámetro y no llama a ninguna de las otras cuatro.

# Evidencia de pureza

- **`normalizarSkuManual(valor)`**: `String(valor == null ? '' : valor).trim().toUpperCase();` — una sola expresión sobre su parámetro.
- **`esValorAfirmativo(valor)`**: compara `valor.trim().toUpperCase()` contra un conjunto fijo (`'SI'`, `'SÍ'`, `'1'`, `'TRUE'`, `'X'`); retorna `false` de inmediato si `valor` es falsy.
- **`normalizarGirarCSV(valor)`**: compara `(valor || '').trim().toLowerCase()` contra `'normal'`, `'rotado'`, `'girar'`, `'90'`; retorna `'auto'` por defecto.
- **`normalizarNombreComponente(valor)`** y **`normalizarNombreMaterialImportado(valor)`**: cadena de transformaciones (`trim`, `toLocaleLowerCase('es')`, `normalize('NFD')`, `replace` de marcas diacríticas, `replace` de espacios múltiples) aplicada únicamente sobre su parámetro. Son dos implementaciones idénticas pero independientes (no se llaman entre sí); se conservaron ambas por separado, sin fusionarlas, porque la tarea no autorizó consolidar código.

Ninguna de las cinco accede a `document`, `state` ni `localStorage`; ninguna depende de otra variable de la IIFE de `main.js`.

# Incidente detectado durante la tarea (transparencia obligatoria)

Al escribir por primera vez `src/scripts/utils/text-normalization.js` con la herramienta de creación de archivos, la expresión regular `/[̀-ͯ]/g` (usada para eliminar marcas diacríticas) se transcribió incorrectamente: los caracteres de escape literales `̀-ͯ` quedaron convertidos en los caracteres Unicode combinados reales, en vez de conservarse como texto de escape. Esto se detectó de inmediato comparando bytes (`od -c`) entre el original y el archivo recién creado, **antes de tocar `main.js`**. Se corrigió reconstruyendo el archivo mediante extracción mecánica mediante `sed` mediante bloques exactos de líneas (sin retipear el cuerpo de ninguna función), y se verificó de nuevo byte a byte, con coincidencia exacta (`diff` sin salida y checksum MD5 idéntico) antes de continuar. Se documenta aquí en cumplimiento de la regla de no ocultar incertidumbres ni errores propios (`docs/engineering/04-AI-RULES.md`).

# Archivos creados

- `src/scripts/utils/text-normalization.js` — 51 líneas. Contiene las cinco funciones (cuerpo, firma y comentarios sin alterar, verificadas byte a byte tras la corrección descrita arriba), envueltas en su propia IIFE, expuestas mediante:
  ```js
  window.ProyCutTextNormalization = {
    normalizarSkuManual,
    normalizarNombreComponente,
    normalizarNombreMaterialImportado,
    normalizarGirarCSV,
    esValorAfirmativo
  };
  ```
  El orden de las declaraciones dentro del archivo conserva el orden relativo original de aparición en `main.js` (`normalizarSkuManual`, `esValorAfirmativo`, `normalizarGirarCSV`, `normalizarNombreComponente`, `normalizarNombreMaterialImportado`); el orden de las claves del objeto expuesto sigue exactamente el orden indicado en la plantilla de la tarea. Sin módulos ES, sin `import`/`export`, sin `type="module"`.

No se creó ninguna carpeta nueva (`src/scripts/utils/` ya existía).

# Archivos modificados

- **`src/scripts/main.js`**: se eliminaron únicamente las cinco declaraciones originales, en sus tres ubicaciones (`normalizarSkuManual` en solitario; `esValorAfirmativo` + `normalizarGirarCSV` juntas; `normalizarNombreComponente` + `normalizarNombreMaterialImportado` juntas). Se agregó, al final del bloque de referencias externas al inicio de la IIFE (después de `const LIMITES = window.ProyCutLimits;`, antes de `let BOARD_W`):
  ```js
  const {
    normalizarSkuManual,
    normalizarNombreComponente,
    normalizarNombreMaterialImportado,
    normalizarGirarCSV,
    esValorAfirmativo
  } = window.ProyCutTextNormalization;
  ```
  Las 40 llamadas existentes a estas cinco funciones en el archivo (concentradas sobre todo en la identidad/SKU de catálogo y en la vista previa de importación) siguen escritas exactamente igual.

- **`index.html`**: se agregó `<script src="./src/scripts/utils/text-normalization.js"></script>` entre `validation.js` y `main.js`, en el orden exacto solicitado.

No se modificó `validarProyecto()`, `leerPiezas()`, `recalcular()`, el optimizador, `format.js`, `validation.js`, `limits.js`, CSS, `state`, ni ninguna función de geometría o de parseo de CSV.

# Comparaciones

- `diff` entre cada bloque de función en `text-normalization.js` y su versión original en `main.js` (antes de editar), en los tres grupos de extracción: **sin diferencias** en los tres casos (verificado dos veces: antes y después de corregir el incidente de transcripción).
- Checksum MD5 del bloque `normalizarSkuManual` en ambos archivos: idéntico (`fd0e6da43dacedb42ce64da66d4cb2d0`).
- Búsqueda de las cinco declaraciones (`function normalizarSkuManual(`, etc.) al inicio de línea en `main.js` tras el cambio: **sin coincidencias**.
- Conteo de llamadas a las cinco funciones en `main.js` tras el cambio: **40**, todas intactas.
- `node --check` sobre `limits.js`, `validation.js`, `format.js`, `text-normalization.js` y `main.js`: los cinco sintácticamente válidos.
- Servido con `python3 -m http.server` (sin instalar nada): `index.html`, `format.js`, `limits.js`, `validation.js`, `text-normalization.js`, `main.js` y `styles.css` respondieron `200`.
- Alcance del cambio confirmado con `git status --short`: únicamente `index.html`, `src/scripts/main.js` (modificados), `src/scripts/utils/text-normalization.js` y este reporte (nuevos) — ver sección final del chat.

# Pruebas automáticas

Ejecutadas en un sandbox de Node (`vm`, sin dependencias nuevas), cargando `text-normalization.js` tal cual. Resultados reales, no supuestos:

**`normalizarSkuManual`**
| Entrada | Resultado real |
|---|---|
| `""` | `""` |
| `"  abc123  "` (espacios al inicio/final, minúsculas) | `"ABC123"` |
| `"abc-123"` | `"ABC-123"` |
| `null` | `""` |
| `undefined` | `""` |

**`esValorAfirmativo`**
| Entrada | Resultado real |
|---|---|
| `"SI"`, `"si"`, `" Sí "`, `"1"`, `"true"`, `"x"`, `"X "` | `true` |
| `"NO"`, `""`, `null`, `"yes"` | `false` |

**`normalizarGirarCSV`**
| Entrada | Resultado real |
|---|---|
| `"normal"`, `"Normal"` | `"normal"` |
| `"ROTADO"`, `"girar"`, `"90"`, `" Rotado "` | `"rotado"` |
| `""`, `"auto"`, `"xyz"`, `null` | `"auto"` |

**`normalizarNombreComponente`** (idéntico comportamiento en `normalizarNombreMaterialImportado`)
| Entrada | Resultado real |
|---|---|
| `""` | `""` |
| `"  Bisagra   Recta  "` (espacios múltiples) | `"bisagra recta"` |
| `"CORREDERA"` | `"corredera"` |
| `"Jaladera Ñandú"` (caracteres especiales/acentos) | `"jaladera nandu"` |
| `null` | `""` |

El caso `"Jaladera Ñandú"` confirma en ejecución real que la eliminación de marcas diacríticas (la expresión regular corregida tras el incidente descrito arriba) sigue funcionando exactamente igual que antes de la extracción.

# Pruebas manuales pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Quedan pendientes, en navegador real:

- **ARR-01** — cargar la aplicación sin errores en consola.
- **MAT-01, MAT-07** — crear un material y confirmar que el SKU se normaliza igual que antes.
- **XLS-02 a XLS-05** (importación Excel) — confirmar que la detección de materiales/componentes coincidentes por nombre normalizado sigue funcionando igual, incluyendo nombres con acentos o mayúsculas mixtas.
- **CSV-01** — importar un CSV con la columna `Girar` en distintas variantes (`normal`, `ROTADO`, `girar`, `90`, vacío) y confirmar que cada una produce el mismo resultado que antes.
- **CSV-01** — importar un CSV con columnas `L1`/`L2`/`A1`/`A2` en distintas variantes afirmativas (`SI`, `1`, `X`) y confirmar el mismo comportamiento.

# Riesgos

- No se pudo abrir `index.html` en un navegador real dentro de este entorno sin instalar herramientas adicionales (mismo motivo documentado en los reportes 13 a 18). La verificación se limitó a un sandbox de Node, peticiones HTTP directas y comparación textual/checksum del código.
- El incidente de transcripción descrito arriba, aunque detectado y corregido antes de tocar `main.js`, es un recordatorio de que cualquier extracción manual de contenido con expresiones regulares o caracteres especiales requiere verificación byte a byte explícita, no solo visual — práctica que ya se venía aplicando en las extracciones anteriores y que aquí resultó indispensable.
- No se verificó en ejecución si algún otro punto del código, fuera de las 40 llamadas ya contabilizadas, referencia estas funciones de forma indirecta.

# Reversión

1. Restaurar, dentro de `src/scripts/main.js`, las cinco declaraciones originales en sus tres ubicaciones previas, copiando el contenido de `src/scripts/utils/text-normalization.js` (sin el envoltorio de IIFE ni la asignación a `window.ProyCutTextNormalization`).
2. Eliminar el bloque `const { normalizarSkuManual, normalizarNombreComponente, normalizarNombreMaterialImportado, normalizarGirarCSV, esValorAfirmativo } = window.ProyCutTextNormalization;` del inicio de la IIFE de `main.js`.
3. Eliminar la línea `<script src="./src/scripts/utils/text-normalization.js"></script>` de `index.html`.
4. Opcionalmente, eliminar `src/scripts/utils/text-normalization.js`.

Como las cinco funciones movidas están verificadas como byte-idénticas a su versión original (incluida la corrección del incidente de transcripción), este proceso de reversión es mecánico.
