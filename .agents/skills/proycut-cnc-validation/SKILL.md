---
name: proycut-cnc-validation
description: "Checklist de validación genérica para confirmar que una salida de fabricación de ProyCut (DXF) es estructural y geométricamente razonable antes de considerarla segura. Activar antes de declarar un DXF exportado como 'correcto' o 'listo para fabricación'. Clasifica cada verificación como automatizable, manual o dependiente de software CNC/CAM externo. No asume ningún dialecto, controlador ni postprocesador CNC específico — ProyCut no tiene esa integración documentada. 'DXF válido sintácticamente' no es lo mismo que 'DXF fabricable correctamente'. Usar junto con proycut-dxf-r12 para el contrato exacto del archivo."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Validación de salida CNC/DXF

## Cuándo se activa

- Antes de declarar que un DXF exportado por ProyCut es correcto o "listo para fabricación".
- Al diagnosticar un reporte de que una pieza no cortó bien, salió con medida incorrecta, o el archivo no abrió en el software del taller.
- Al modificar `dxf-export.js` y necesitar confirmar que el resultado sigue siendo razonable (complementa, no reemplaza, `proycut-dxf-r12`).

## Cuándo NO se activa

- El contrato exacto del formato (versión, capas, CRLF, inversión Y) → `proycut-dxf-r12`.
- Cualquier tarea que implique escribir G-code, configurar un postprocesador, o integrar con un controlador CNC específico — **no existe esa integración en ProyCut hoy**; ver "Límite explícito" abajo.

## Límite explícito — no inventar maquinaria

ProyCut **no** tiene documentado ni implementado ningún dialecto de máquina, controlador o postprocesador. No se ha encontrado en el código ni en `docs/` ninguna referencia a G-code, Biesse, Homag, SCM, WoodWOP, Xilog, ni a ningún postprocesador CAM. Esta Skill **no debe asumir ninguno de estos** salvo que aparezca evidencia real en el repositorio en el futuro. El alcance de ProyCut confirmado hoy termina en generar un archivo **DXF** (`proycut-dxf-r12`); lo que ocurre después (importarlo a un software CAM, generar rutas de herramienta, postprocesar a G-code) sucede **fuera** de ProyCut, en software de terceros no integrado.

## Principio central

**"DXF válido sintácticamente" ≠ "DXF fabricable correctamente."**

Un archivo puede cumplir el contrato de `proycut-dxf-r12` (secciones correctas, capas correctas, CRLF correcto) y aun así representar una geometría que no tiene sentido para fabricar (piezas fuera del tablero, dimensiones absurdas, entidades faltantes). Esta Skill valida lo segundo, apoyándose en el contrato ya verificado por la primera.

## Checklist de validación

Cada verificación se clasifica como:

- **AUTOMATIZABLE** — se puede comprobar leyendo el texto DXF o los datos del `board` con código/script desechable (no existe suite de pruebas automatizada en este repositorio — ver `proycut-regression-matrix`; "automatizable" significa que un script `node` desechable puede hacerlo, no que ya exista un comando para ello).
- **MANUAL** — requiere revisión humana del archivo o del dibujo (por ejemplo, abrirlo en un visor).
- **DEPENDIENTE DE SOFTWARE CNC/CAM** — solo puede confirmarse fuera de ProyCut, en el software del taller o de la máquina; ProyCut no puede validarlo por sí mismo.

| Verificación | Clasificación | Qué confirma |
|---|---|---|
| Unidades correctas (`$INSUNITS=4`, `$MEASUREMENT=1`, `AC1009`) | AUTOMATIZABLE | El archivo declara mm y R12 tal como `proycut-dxf-r12` exige |
| Extents dentro del tablero (`$EXTMAX` = `board.boardW`/`board.boardH`) | AUTOMATIZABLE | El contorno declarado coincide con las dimensiones reales del tablero |
| Dimensiones de cada pieza positivas (`w>0`, `h>0`) | AUTOMATIZABLE | Ninguna pieza exportada tiene medida cero o negativa |
| Perfiles cerrados (`POLYLINE` con `70=1` y `SEQEND` presente por cada `POLYLINE`) | AUTOMATIZABLE | Cada rectángulo (tablero y piezas) es un contorno cerrado válido |
| Capas esperadas presentes y usadas correctamente (`0`, `TABLERO`, `CORTE`) | AUTOMATIZABLE | El tablero está en `TABLERO`, las piezas en `CORTE`, sin mezclar |
| Número de entidades razonable (1 contorno de tablero + N piezas, N = `board.pieces.length`) | AUTOMATIZABLE | No faltan ni sobran piezas respecto al resultado del optimizador |
| Ausencia de `NaN`/`Infinity` en coordenadas | AUTOMATIZABLE | Ningún valor numérico corrupto llegó al archivo (posible si una pieza tiene datos inválidos que pasaron sin validar) |
| Coordenadas válidas (dentro de `[0, board.boardW]` × `[0, board.boardH]` tras la inversión Y) | AUTOMATIZABLE | Ninguna pieza quedó fuera de los límites físicos del tablero |
| Consistencia ancho/alto entre `board` y lo exportado | AUTOMATIZABLE | El `$EXTMAX` y el contorno `TABLERO` usan exactamente `board.boardW`/`board.boardH`, sin redondeos que los desajusten |
| Transformación Y aplicada correctamente (`y1 = boardH-(y+h)`, `y2 = boardH-y`) | AUTOMATIZABLE | Cada pieza se invirtió una sola vez, no cero ni dos veces |
| Orden esperado de entidades (tablero antes que piezas, piezas en orden de `board.pieces`) | AUTOMATIZABLE | Coincide con el contrato de `proycut-dxf-r12` |
| Geometría fuera del tablero (pieza cuyo rectángulo excede `$EXTMAX`) | AUTOMATIZABLE | Detecta piezas mal colocadas antes de enviarlas a corte |
| Solapes inesperados entre piezas exportadas | AUTOMATIZABLE (con el mismo criterio de `proycut-free-rectangles`) | Dos piezas no deberían ocupar el mismo espacio físico — relevante sobre todo tras una edición manual (`proycut-board-interactions`) |
| Correspondencia entre número de piezas y geometrías exportadas | AUTOMATIZABLE | `board.pieces.length` piezas en pantalla = mismo número de contornos `CORTE` en el DXF |
| El archivo abre sin errores en un visor DXF real | MANUAL | Confirma que ningún software rechaza el archivo por corrupción o estructura inesperada |
| Las medidas visibles en el visor coinciden con las capturadas por el usuario | MANUAL | Confirma round-trip visual, no solo numérico |
| El archivo importa correctamente a un software CAM específico del taller | DEPENDIENTE DE SOFTWARE CNC/CAM | Fuera del alcance de ProyCut; cada taller usa su propio software |
| Las rutas de corte/herramienta generadas a partir del DXF son seguras para la máquina | DEPENDIENTE DE SOFTWARE CNC/CAM | Depende enteramente del postprocesador y la máquina real, no de ProyCut |
| El material físico y el kerf real de la sierra/router coinciden con lo asumido al optimizar | DEPENDIENTE DE SOFTWARE CNC/CAM (o del taller) | Verificación operativa fuera del alcance de este repositorio |

## No inventar comandos de AutoCAD/CAM

Esta Skill no prescribe comandos específicos de AutoCAD, LibreCAD, ni ningún software CAM (no hay evidencia de cuál usa el usuario). Cuando una verificación requiera "abrir el archivo en un visor DXF", queda a criterio del usuario cuál usar — no asumir uno concreto ni instruir comandos de una herramienta no confirmada en este repositorio.

## Relación con `proycut-dxf-r12`

Esta Skill **no repite** el contrato exacto del formato (eso vive en `proycut-dxf-r12`); lo usa como referencia para saber qué es "correcto" antes de validar que además sea "razonable". Si una verificación de esta checklist falla, primero confirmar si es un problema de **contrato** (formato incorrecto → `proycut-dxf-r12`) o de **geometría/datos** (formato correcto pero contenido sin sentido → esta Skill).

## Verificaciones obligatorias

- Ejecutar al menos las verificaciones AUTOMATIZABLE de la tabla sobre un archivo DXF real generado por ProyCut antes de declarar una exportación como validada.
- Documentar explícitamente cuáles verificaciones quedaron sin ejecutar por depender de software externo no disponible en la sesión.
- Ver `proycut-regression-matrix` → fila "DXF (exportación)".

## Condiciones para detenerse y pedir aclaración

- Se necesita confirmar algo que depende de software CAM/CNC específico y no hay forma de hacerlo en la sesión actual — declarar la limitación, no asumir que "probablemente funciona".
- La tarea pide validar contra un dialecto de máquina o postprocesador específico no documentado en este repositorio — preguntar cuál, no asumir uno.
- Una verificación automatizable falla y no es claro si el origen es el contrato DXF (`proycut-dxf-r12`) o los datos de entrada (geometría/optimizador).
