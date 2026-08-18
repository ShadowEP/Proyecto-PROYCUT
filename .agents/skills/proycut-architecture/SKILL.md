---
name: proycut-architecture
description: "Protege la arquitectura de ProyCut y guía decisiones de dependencia, modularización e integración. Activar al crear módulos, mover responsabilidades fuera de main.js, introducir repositorios, integrar Supabase, cambiar fronteras entre capas, decidir dónde debe vivir una función nueva, revisar dependencias entre archivos de src/scripts/, o diseñar infraestructura nueva (cliente Supabase, adaptadores, puertos). No cubre reglas de negocio del dominio (usar proycut-domain-rules) ni el procedimiento de cambio seguro en sí (usar proycut-safe-change)."
metadata:
  type: proycut-domain
  scope: project
---

# ProyCut — Arquitectura

## Cuándo se activa

- Crear un módulo o archivo nuevo bajo `src/scripts/`.
- Mover código fuera de `main.js` (extracción de responsabilidades).
- Introducir un repositorio, cliente, adaptador o puerto (especialmente para Supabase).
- Decidir en qué capa o archivo debe vivir una función nueva.
- Revisar o cuestionar una dependencia entre archivos existentes.
- Diseñar cualquier infraestructura nueva (persistencia, IA, exportación).
- Evaluar si algo debería convertirse en módulo o quedarse donde está.

## Cuándo NO se activa

- Ajustes de una fórmula de negocio ya existente sin tocar estructura (→ `proycut-domain-rules`).
- El procedimiento paso a paso de cómo aplicar cualquier cambio con seguridad (→ `proycut-safe-change`).
- Elegir qué pruebas correr tras un cambio (→ `proycut-regression-matrix`).
- Cambios puramente visuales/CSS sin mover lógica.

## Documentos canónicos

- `docs/engineering/05-ARCHITECTURE.md` — arquitectura **objetivo**: capas, dominio, reglas de dependencia, estructura `src/modules/` con Presentación/Aplicación/Dominio/Infraestructura/Platform. Todavía **no implementada**; es la dirección a respetar cuando se agregue estructura nueva.
- `docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md` — estado **real** al 2026-08-05: monolito modularizado en `src/scripts/`, coordinado por una IIFE en `main.js` (~5.497 líneas), 22 módulos extraídos bajo `config/`, `costing/`, `dxf/`, `excel/`, `geometry/`, `pieces/`, `project/`, `reports/`, `svg/`, `utils/`. No existe todavía `src/modules/`, `src/platform/`, `src/app/` ni ninguna capa de infraestructura real.
- `docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md` — punto de integración recomendado (`infrastructure/supabase-client.js` → `repositories/project-repository.js` → `project/project-persistence.js`) para cuando corresponda tocar persistencia.

**Regla de lectura:** ante cualquier duda sobre "qué existe hoy", confiar en 44, no en 05. El documento 05 describe hacia dónde se dirige el sistema, no lo que ya está construido. No tratar la estructura de 05 como si ya existiera en el repositorio.

## Invariantes

- Las dependencias deben apuntar hacia las reglas internas: Presentación → Aplicación → Dominio; Infraestructura y Aplicación pueden depender del Dominio, nunca al revés.
- El Dominio (cálculos, reglas, geometría, costeo) no depende de React, Supabase, OpenAI, el DOM ni `localStorage`.
- Los módulos hoy "puros" y estables según 44 (`geometry/*`, `dxf/*`, `costing/*`, `reports/*`, `utils/*`, `config/limits.js`, `config/project-format.js`) no acceden a `document`, `state` ni almacenamiento — deben seguir así.
- `Project` es el concepto central del negocio (ver `docs/vision/03-PROYCUT-BLUEPRINT.md`, capítulo 4); cualquier módulo nuevo debe poder explicar qué aporta al ciclo de vida del proyecto.
- Infraestructura externa (Supabase, IA, pagos) debe quedar detrás de contratos/adaptadores reemplazables — nunca un SDK esparcido por el código de dominio o de coordinación.
- El modo local (sin backend) debe seguir funcionando; ninguna integración nueva puede volverlo obligatorio (regla explícita de `45-SUPABASE-INTEGRATION-PLAN.md`, sección 21).
- No modularizar únicamente para reducir líneas de `main.js`: una extracción se justifica cuando aísla una responsabilidad real y estable (ver criterios de 44, sección 19 y 21).

## Prohibiciones

- Crear `src/modules/`, capas de Presentación/Aplicación formales, o cualquier estructura de `05-ARCHITECTURE.md` como si ya existiera, sin que el usuario haya pedido esa migración explícitamente.
- Importar el SDK de Supabase (o cualquier proveedor externo) fuera de un archivo de infraestructura dedicado.
- Mover código de `main.js` calificado como "riesgo muy alto" en 44 (algoritmo de empaquetado, edición interactiva de boards) como parte de una tarea de arquitectura no solicitada — son de alto riesgo de regresión y su extracción no es gratuita.
- Introducir microservicios, bundlers o frameworks de UI (React, etc.) para resolver un problema de organización de código.
- Duplicar un cálculo crítico (costeo, kerf, empaquetado) en un módulo nuevo en vez de reutilizar el existente.

## Procedimiento recomendado

1. Releer `44-CURRENT-ARCHITECTURE-INVENTORY.md` (secciones 2–4) para confirmar el estado real del archivo o módulo afectado antes de proponer un cambio.
2. Ubicar la responsabilidad exacta a mover o crear y verificar que no exista ya en otro módulo (evitar duplicación, regla 13 de `04-AI-RULES.md`).
3. Confirmar la dirección de dependencia resultante contra la sección 9 de `05-ARCHITECTURE.md`.
4. Si el cambio toca un módulo "estable" (44, sección 10) o "sensible" (44, sección 11), tratarlo como alto riesgo y aplicar `proycut-safe-change`.
5. Si el cambio introduce infraestructura nueva, seguir la estructura de tres capas de `45-SUPABASE-INTEGRATION-PLAN.md` (cliente → repositorio → caso de uso) en vez de inventar una propia.
6. Documentar la decisión si es estructural relevante (ADR sugerido por `05-ARCHITECTURE.md`, sección 39).

## Verificaciones obligatorias

- La nueva ubicación no introduce una dependencia prohibida (Dominio → framework/proveedor).
- El módulo afectado sigue siendo puro si estaba clasificado como puro en 44.
- No se rompió el contrato de comunicación entre módulos documentado en 44, sección 3 (mapa de dependencias).
- El modo local sigue arrancando sin servicios externos.
- Se ejecutaron las verificaciones de `proycut-regression-matrix` correspondientes al subsistema tocado.

## Condiciones para detenerse y pedir aclaración

- La tarea pide migrar a la estructura de `05-ARCHITECTURE.md` (`src/modules/`, capas formales) sin que el usuario lo haya pedido explícitamente.
- No es claro si una función pertenece al Dominio o a la Aplicación y la decisión afecta a múltiples consumidores.
- La tarea requiere tocar un módulo marcado "riesgo muy alto" en 44 (algoritmo de empaquetado, edición de boards) fuera del alcance explícito solicitado.
- Se necesita introducir un proveedor externo nuevo no cubierto por `45-SUPABASE-INTEGRATION-PLAN.md` ni por instrucciones del usuario.
