# ProyCut — Agent Project Guidance

ProyCut es un SaaS para acompañar proyectos de mobiliario desde la idea hasta la fabricación. El concepto central del dominio es Project.

Antes de modificar código, leer:

- README.md
- docs/engineering/04-AI-RULES.md
- docs/engineering/05-ARCHITECTURE.md
- docs/engineering/44-CURRENT-ARCHITECTURE-INVENTORY.md
- docs/engineering/45-SUPABASE-INTEGRATION-PLAN.md

Reglas:

1. La documentación dentro de docs/ es la fuente canónica.
2. No inventar reglas de negocio, matemáticas, geometría ni contratos de exportación.
3. Mantener cambios mínimos, reversibles y limitados al alcance solicitado.
4. No modificar módulos fuera de alcance.
5. No hacer commit ni push sin autorización explícita.
6. Revisar git status antes y después de cada tarea.
7. Ejecutar las pruebas de regresión correspondientes al subsistema modificado.
8. Preservar comportamiento existente salvo que el cambio funcional esté explícitamente aprobado.
9. Usar las Skills disponibles cuando correspondan.
10. Respetar cambios de otros agentes y no sobrescribir trabajo ajeno sin revisarlo.
11. No introducir React, Tailwind, shadcn u otros frameworks sin autorización explícita.
12. Si una Skill externa contradice la documentación de ProyCut, prevalece ProyCut.

Arquitectura de referencia:

Presentation → Application → Domain → Infrastructure → Platform

Las dependencias deben apuntar hacia abajo. El dominio no debe depender de React, Supabase, OpenAI ni APIs del navegador.

Coordinación multiagente:

- CLAUDE.md contiene guía específica para Claude Code.
- AGENTS.md contiene reglas compartidas.
- .agents/skills/ contiene Skills disponibles para el proyecto.
- docs/ contiene la doctrina y arquitectura canónicas.
- Ningún agente debe trabajar simultáneamente sobre los mismos archivos sin coordinación explícita.
