---
name: proycut-safe-change
description: "Aplica el método conservador de modificación de ProyCut: cambios mínimos, reversibles, con comportamiento preservado salvo aprobación explícita. Activar ante prácticamente cualquier modificación de código existente (index.html, src/scripts/, docs/), especialmente refactors, correcciones y extracciones de main.js. No sustituye a proycut-architecture (dónde debe vivir el código) ni a proycut-domain-rules (qué reglas de negocio son válidas) ni a proycut-regression-matrix (qué verificar según el subsistema); las complementa."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Cambio seguro

## Cuándo se activa

- Cualquier modificación de `index.html`, `src/scripts/**` o `legacy/index-original.html` (este último nunca debe editarse, ver Prohibiciones).
- Refactors, extracciones de responsabilidad, correcciones de bugs, actualizaciones de dependencias.
- Cambios que "parecen pequeños" pero tocan un módulo compartido (ver módulos sensibles en `44-CURRENT-ARCHITECTURE-INVENTORY.md`, sección 11).

## Cuándo NO se activa

- Creación de documentación nueva sin tocar código (aunque igual conviene revisar `git status` antes/después).
- Decisiones puramente de ubicación arquitectónica sin cambio de comportamiento (→ `proycut-architecture` primero, luego este ciclo para ejecutarlo).

## Documentos canónicos

- `docs/engineering/04-AI-RULES.md` — secciones 5–9 (análisis previo, cambios pequeños, prohibición de reescrituras masivas, conservación de funcionalidad), 34 (proceso de refactorización), 38–40 (formato de propuesta, de entrega y checklist final).
- `docs/engineering/08-ENGINEERING-HANDBOOK.md` — secciones 7–11 (antes de escribir código, proceso de trabajo, delimitación, cambios incrementales), 93 (refactorización), 105–112 (Definition of Ready/Done, checklists, plantillas).
- `docs/engineering/10-CURRENT-STATE.md` — comportamiento real documentado que cualquier refactor debe preservar, incluyendo comportamientos "pendientes de verificar" (sección 17) que no deben normalizarse silenciosamente.
- `README.md` — principio "Primero comprender. Después reorganizar. Finalmente desarrollar."

## Invariantes

- El comportamiento observable se conserva salvo que el cambio funcional haya sido solicitado explícitamente (`04-AI-RULES.md`, sección 8).
- Un cambio tiene un propósito único; no se mezcla refactor con funcionalidad nueva salvo necesidad justificada.
- Todo cambio debe ser revisable y reversible.
- La incertidumbre se declara, nunca se oculta ni se resuelve inventando (`04-AI-RULES.md`, sección 32).
- `legacy/index-original.html`, cuando exista, es inmutable — copia de referencia del prototipo original, nunca se edita (`README.md`).

## Prohibiciones

- Cambios colaterales fuera del alcance pedido.
- Refactors cosméticos no solicitados (renombrados, reformateo masivo, modernización de sintaxis) mezclados con el cambio pedido.
- Correcciones oportunistas de bugs no relacionados descubiertos en el camino, sin señalarlos aparte y pedir confirmación.
- Eliminar compatibilidad o funcionalidad existente para "simplificar" sin aprobación.
- Declarar un cambio terminado sin haber corrido las verificaciones aplicables.
- `git add -A` / `git add .` indiscriminado, o commit/push sin autorización explícita del usuario.

## Procedimiento recomendado

El ciclo completo, en proporción al tamaño del cambio:

1. **Inspeccionar Git.** `git status --short` antes de tocar nada; si hay cambios sin relación al alcance, detenerse y preguntar antes de continuar.
2. **Definir alcance.** Qué se cambiará, qué no, qué módulos están involucrados (ver `proycut-architecture` si hay duda de ubicación).
3. **Identificar contratos existentes.** Entradas, salidas, efectos secundarios, eventos, almacenamiento — de la función o módulo afectado (`04-AI-RULES.md`, sección 8).
4. **Cambio mínimo.** Aplicar solo lo necesario para el objetivo definido.
5. **Verificar equivalencia** cuando sea refactor: el comportamiento antes y después debe coincidir, salvo que el cambio funcional esté aprobado.
6. **Ejecutar pruebas.** Usar `proycut-regression-matrix` para determinar cuáles corresponden al subsistema tocado.
7. **Revisar el diff.** Confirmar que solo contiene lo esperado.
8. **Comprobar `git status`** de nuevo al terminar.
9. **Reportar** siguiendo el formato de entrega de `04-AI-RULES.md` sección 39: cambios realizados, archivos modificados, comportamiento conservado, pruebas, riesgos pendientes, documentación, siguiente paso.
10. **No hacer commit ni push** sin autorización explícita, aunque el usuario ya haya aprobado un commit anterior similar — la autorización no es indefinida.

## Verificaciones obligatorias

- `git status --short` ejecutado antes y después del cambio.
- El diff contiene únicamente archivos dentro del alcance declarado.
- Las verificaciones de `proycut-regression-matrix` correspondientes al subsistema se ejecutaron o se documentaron como no ejecutables (browser/manual) con instrucciones claras para el usuario.
- Ningún comportamiento de la sección "pendientes de verificar" de `10-CURRENT-STATE.md` fue alterado sin señalarlo explícitamente.

## Distinción REFACTOR vs CAMBIO FUNCIONAL

- **Refactor:** el comportamiento observable (entradas → salidas, efectos secundarios, mensajes, cálculos) permanece idéntico; solo cambia la estructura interna del código.
- **Cambio funcional:** algo que el usuario percibe cambia — un cálculo distinto, un mensaje distinto, un campo nuevo, un comportamiento nuevo o eliminado.

Principio rector: **"preservar comportamiento antes de mejorar comportamiento."**

Si durante un refactor aparece la necesidad de un cambio funcional (por ejemplo, corregir un bug detectado en el camino, o el refactor obliga a decidir un comportamiento ambiguo que hoy es inconsistente): **DETENERSE** y pedir aprobación explícita antes de aplicarlo. No decidir unilateralmente que "de paso" se corrige.

## Condiciones para detenerse y pedir aclaración

- `git status` no está limpio al iniciar y los cambios existentes no son evidentemente del propio trabajo en curso del usuario.
- No se puede determinar con seguridad qué comportamiento debe conservarse (`04-AI-RULES.md`, sección 8) — limitar el alcance y documentar la incertidumbre en vez de adivinar.
- Un refactor revela la necesidad de un cambio funcional no solicitado.
- El cambio tocaría un módulo marcado "riesgo muy alto" o "sensible" en `44-CURRENT-ARCHITECTURE-INVENTORY.md` fuera del alcance explícito.
- El usuario pide commit o push sin haberlo autorizado para este cambio específico.
