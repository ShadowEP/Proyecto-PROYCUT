# 13-CSS-EXTRACTION-REPORT.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-02

## Propósito
Registrar la extracción del bloque `<style>` embebido de `index.html` a un archivo CSS externo, junto con las verificaciones estructurales realizadas y las pruebas manuales que quedan pendientes de ejecutar.

## Depende de
`index.html`; `src/styles/styles.css`; `docs/engineering/10-CURRENT-STATE.md`; `docs/engineering/12-MANUAL-TESTS.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

# Objetivo

Extraer el contenido completo del bloque `<style>` de `index.html` a un archivo CSS externo (`src/styles/styles.css`), sin modificar ninguna regla, selector, valor, comentario ni orden, y reemplazar el bloque original por una referencia `<link rel="stylesheet">` en la misma posición del `<head>`. Es la primera refactorización de código de la reorganización (Fase 3 de `docs/engineering/ROADMAP.md`), limitada exclusivamente a separar el CSS.

# Archivos creados

- `src/styles/styles.css` — 476 líneas, contenido idéntico byte a byte al que existía entre `<style>` y `</style>` en `index.html` (líneas 8–483 del archivo original). Verificado mediante `diff` (sin diferencias) y comparación de checksum MD5 (`cc665afda25089d3f793605c6a532378` en ambos lados).

Solo se creó la carpeta `src/styles/` (y `src/` como contenedora necesaria); no se creó ninguna otra carpeta.

# Archivos modificados

- `index.html` — se eliminó el bloque `<style>...</style>` completo (antes en las líneas 7–484) y se reemplazó por una sola línea:
  ```html
  <link rel="stylesheet" href="./src/styles/styles.css">
  ```
  en la misma posición dentro de `<head>`. El archivo pasó de 8,162 a 7,685 líneas (−477 líneas: 478 líneas eliminadas del bloque `<style>` y sus etiquetas, +1 línea del `<link>`).

No se modificó ningún otro archivo, ni el bloque `<script>`, ni ningún identificador o clase del HTML.

**Nota sobre permisos:** `index.html` estaba configurado como solo lectura (`-r--------`) antes de este cambio — coincide con la condición documentada en `README.md` y `docs/engineering/ROADMAP.md` de no modificar `index.html` hasta contar con respaldo y Git, ninguno de los cuales existe todavía en el proyecto. Se consultó al usuario antes de proceder; se autorizó explícitamente quitar la protección de solo lectura para esta tarea. Tras aplicar el cambio, el archivo quedó con permisos `-rw-r--r--`, igual al resto de los archivos del proyecto.

# Verificaciones realizadas

**Estructurales (completadas, mediante comparación directa de contenido, no visual):**

1. Todo el contenido que estaba dentro de `<style>` fue copiado — confirmado por `diff` sin diferencias entre las líneas 8–483 del `index.html` original y `src/styles/styles.css`.
2. El orden de las reglas es idéntico — la extracción se realizó con `sed` sobre el rango de líneas exacto, sin reordenar ni retipear contenido.
3. No quedó ningún bloque `<style>` principal en `index.html` — confirmado con una búsqueda de la cadena `<style` sobre el archivo resultante (sin coincidencias).
4. La ruta del `<link>` existe y es correcta — `src/styles/styles.css` existe en la ubicación referenciada por la ruta relativa `./src/styles/styles.css` desde la raíz del proyecto, donde reside `index.html`.
5. No se modificó el bloque `<script>` — confirmado por `diff` entre el contenido posterior a `</style>` en el archivo original (línea 485 en adelante) y el contenido posterior al `<link>` en el archivo nuevo (línea 8 en adelante): idénticos.
6. No se modificaron identificadores ni clases del HTML — se deriva del mismo `diff` del punto 5, que cubre también el `<body>` completo.
7. El diff resultante contiene únicamente tres cambios: la creación de `src/styles/styles.css`, la eliminación del bloque `<style>` de `index.html`, y la incorporación de la etiqueta `<link>` en su lugar — no se detectó ningún otro cambio.

**De ejecución local (parcialmente completadas, sin agregar herramientas ni dependencias):**

- Se sirvió el proyecto con un servidor estático ya presente en el sistema (`python3 -m http.server`, herramienta del sistema operativo, no una dependencia del proyecto).
- `index.html` respondió `200 OK`.
- `src/styles/styles.css` respondió `200 OK` en la misma ruta relativa que usa el `<link>` (`/src/styles/styles.css`), con encabezado `Content-Type: text/css` y contenido correcto al inspeccionar los primeros bytes servidos.

**No completadas (ver "Riesgos o incertidumbres"):** carga visual en un navegador real, revisión de la consola del navegador, y comparación visual de la pantalla inicial antes/después del cambio.

# Pruebas pendientes

Ninguna prueba de `docs/engineering/12-MANUAL-TESTS.md` fue ejecutada ni se marca como aprobada. Son especialmente relevantes para confirmar este cambio:

- **ARR-01 a ARR-05** (Prueba de arranque) — carga sin errores visibles, catálogos iniciales, paneles, apariencia predeterminada o restaurada.
- **PERS-01 a PERS-07** (Personalización) — dependen directamente de las variables y reglas CSS ahora servidas externamente.
- **RSZ-01 a RSZ-05** (Redimensionamiento) — dependen de reglas CSS de layout, tablas y media queries.
- **MENU-01 a MENU-08** (Menús y paneles) — dependen de las clases CSS que controlan apertura/cierre/visibilidad.
- Cualquier prueba que incluya inspección visual del diagrama SVG (por ejemplo **OPT-01**, **DIAG-01**) — depende de reglas CSS del diagrama y de las variables de estilo.

# Riesgos o incertidumbres

- No se pudo cargar `index.html` en un navegador real ni revisar la consola del navegador dentro de este entorno: hacerlo con Playwright hubiera requerido descargar binarios de navegador no presentes en el sistema, lo cual se evitó deliberadamente por no contar con autorización para agregar herramientas o dependencias en esta tarea. La verificación de carga se limitó a peticiones HTTP directas (`curl`) contra un servidor estático ya disponible en el sistema.
- No se realizó comparación visual humana de la pantalla inicial antes y después del cambio (no fue posible generar una captura de pantalla real sin un navegador).
- Aunque la extracción está verificada como estructuralmente idéntica byte a byte, **no está confirmado en ejecución** si algún selector CSS dependía implícitamente de que las reglas estuvieran embebidas en el mismo documento (por ejemplo, referencias relativas dentro del CSS, como la URL de datos SVG en la línea `background:#fff url("data:image/svg+xml..."` del combobox) — una revisión rápida del contenido no mostró rutas relativas a archivos externos dentro del CSS, pero esto no reemplaza la verificación visual pendiente.
- El permiso de solo lectura de `index.html` fue removido con autorización explícita del usuario; no se restauró a solo lectura después del cambio, ya que el resto de los archivos del proyecto son de lectura/escritura normal y no existe todavía una carpeta de respaldo (`legacy/`) ni Git que ofrezca esa protección de otra forma.

# Reversión

Este cambio puede revertirse de forma sencilla:

1. Restaurar el bloque `<style>...</style>` original dentro de `<head>` de `index.html`, copiando el contenido íntegro de `src/styles/styles.css` entre esas etiquetas, en el lugar exacto donde hoy está la línea `<link rel="stylesheet" href="./src/styles/styles.css">`.
2. Eliminar esa línea `<link>`.
3. Opcionalmente, eliminar `src/styles/styles.css` y la carpeta `src/styles/` (y `src/` si queda vacía).

Como el contenido de `src/styles/styles.css` es una copia exacta y verificada del bloque original, este proceso de reversión es mecánico y no requiere reconstruir ninguna regla desde memoria.
