# README.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-01

## Propósito
Punto de entrada del proyecto: describe el estado actual, cómo abrirlo, y resume la documentación oficial de ProyCut.

## Depende de
`docs/vision/00-LIBRO-FUNDACIONAL.md`, `docs/vision/01-DOCTRINA-PROYCUT.md`, `docs/vision/02-DESIGN-PHILOSOPHY.md`, `docs/vision/03-PROYCUT-BLUEPRINT.md`, `docs/engineering/04-AI-RULES.md`, `docs/engineering/05-ARCHITECTURE.md`, `docs/engineering/06-FUNCTIONALITIES.md`, `docs/engineering/07-DATABASE.md`, `docs/engineering/08-ENGINEERING-HANDBOOK.md`, `docs/engineering/ROADMAP.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

ProyCut
Plataforma integral para la industria del mueble
ProyCut es una plataforma SaaS diseñada para ayudar a fabricantes de muebles, carpinteros, talleres y placacentros a convertir una idea en un proyecto rentable para fabricar.
La plataforma busca centralizar y simplificar procesos como:
	•	definición de proyectos;
	•	registro de piezas;
	•	selección de materiales;
	•	cálculo de costos;
	•	creación de cotizaciones;
	•	optimización de tableros;
	•	generación de diagramas de corte;
	•	impresión de etiquetas;
	•	preparación de documentos;
	•	control de inventarios;
	•	seguimiento de producción.
ProyCut transforma la incertidumbre en confianza.

Estado actual del proyecto
ProyCut se encuentra actualmente en una etapa de reorganización y refactorización.
El prototipo existente fue desarrollado principalmente en un solo archivo index.html, que contiene:
	•	estructura HTML;
	•	estilos CSS;
	•	lógica JavaScript;
	•	cálculos;
	•	elementos de interfaz;
	•	funciones de personalización;
	•	exportaciones;
	•	impresión;
	•	optimización;
	•	almacenamiento local.
El objetivo inmediato no es agregar nuevas funciones.
El objetivo es comprender, documentar y reorganizar el código existente sin perder funcionalidades.

Objetivo de la etapa actual
La etapa actual deberá convertir el prototipo existente en una base de código:
	•	modular;
	•	comprensible;
	•	mantenible;
	•	comprobable;
	•	documentada;
	•	preparada para conectarse con Supabase;
	•	preparada para crecer como SaaS;
	•	protegida mediante Git;
	•	compatible con desarrollo asistido por IA.

Principio principal de trabajo
Primero comprender. Después reorganizar. Finalmente desarrollar.
Ninguna inteligencia artificial o desarrollador deberá reescribir el proyecto completo sin haber analizado primero su comportamiento.
La estabilidad y certeza de los resultados tienen prioridad sobre la velocidad de refactorización.

Estructura inicial del repositorio
ProyCut/
├── README.md
├── index.html
├── .gitignore
│
├── docs/
│   ├── vision/
│   │   ├── 00-LIBRO-FUNDACIONAL.md
│   │   ├── 01-DOCTRINA-PROYCUT.md
│   │   ├── 02-DESIGN-PHILOSOPHY.md
│   │   └── 03-PROYCUT-BLUEPRINT.md
│   │
│   ├── engineering/
│   │   ├── 04-AI-RULES.md
│   │   ├── 05-ARCHITECTURE.md
│   │   ├── 06-FUNCTIONALITIES.md
│   │   ├── 07-DATABASE.md
│   │   ├── 08-ENGINEERING-HANDBOOK.md
│   │   └── ROADMAP.md
│   │
│   └── meta/
│       ├── DOCUMENTATION-STANDARD.md
│       ├── DOCUMENTATION-INVENTORY.md
│       ├── DOCUMENTATION-CONSOLIDATION-PLAN.md
│       └── DOCUMENTATION-AUDIT.md
│
├── legacy/
│   └── index-original.html
│
└── backups/
Esta estructura es temporal.
Las carpetas definitivas de código se crearán después de analizar el prototipo actual.
No deberán crearse módulos vacíos ni estructuras complejas antes de conocer las dependencias reales del código.

Archivos principales
index.html
Es la versión de trabajo actual del prototipo.
Inicialmente será una copia del archivo más completo desarrollado hasta ahora.
Este archivo podrá modificarse únicamente después de:
	1	guardar el respaldo original;
	2	inicializar Git;
	3	crear el diagnóstico técnico;
	4	definir el plan de refactorización;
	5	documentar las pruebas manuales.

legacy/index-original.html
Es una copia exacta e inmutable del prototipo antes de la reorganización.
Su propósito es:
	•	conservar el estado original;
	•	comparar comportamientos;
	•	recuperar código;
	•	validar funcionalidades;
	•	servir como referencia.
Este archivo no deberá editarse.

docs/
Contiene la documentación oficial del proyecto.
Las decisiones de producto, diseño, arquitectura y desarrollo deberán respetar estos documentos.

Jerarquía documental
Cuando exista una contradicción, deberá seguirse el orden oficial de autoridad.
> La jerarquía documental oficial se encuentra en `docs/meta/DOCUMENTATION-STANDARD.md`.
El código actual representa el comportamiento disponible, pero no necesariamente la arquitectura deseada.

Documentación
Libro Fundacional
docs/vision/00-LIBRO-FUNDACIONAL.md
Define:
	•	por qué existe ProyCut;
	•	qué busca transformar;
	•	qué principios nunca deberán perderse;
	•	cuál es su compromiso con los usuarios.

Doctrina ProyCut
docs/vision/01-DOCTRINA-PROYCUT.md
Define:
	•	cómo se toman decisiones;
	•	cómo se evalúan nuevas funciones;
	•	qué significa calidad;
	•	qué prácticas se rechazan.

Filosofía de Diseño
docs/vision/02-DESIGN-PHILOSOPHY.md
Define:
	•	cómo debe sentirse la interfaz;
	•	cómo debe comunicarse el sistema;
	•	cómo se previenen errores;
	•	cómo se mantiene una experiencia simple y entretenida.

Blueprint
docs/vision/03-PROYCUT-BLUEPRINT.md
Describe:
	•	el recorrido completo del usuario;
	•	el ciclo de vida de un proyecto;
	•	los módulos principales;
	•	la relación entre las capacidades del sistema.

Reglas para IA
docs/engineering/04-AI-RULES.md
Toda IA deberá leer este documento antes de modificar archivos.
Incluye:
	•	análisis previo;
	•	protección de funcionalidad;
	•	cambios incrementales;
	•	documentación;
	•	pruebas;
	•	seguridad;
	•	manejo de incertidumbre;
	•	prohibición de reescrituras masivas.

Arquitectura
docs/engineering/05-ARCHITECTURE.md
Define:
	•	capas;
	•	módulos;
	•	dependencias;
	•	dominio;
	•	infraestructura;
	•	comunicación;
	•	pruebas;
	•	evolución técnica.

Funcionalidades
docs/engineering/06-FUNCTIONALITIES.md
Contiene:
	•	catálogo funcional;
	•	usuarios;
	•	módulos;
	•	recorrido del proyecto;
	•	alcance del producto;
	•	alcance inicial del MVP;
	•	funciones futuras.
Este documento describe la visión completa.
No significa que todas sus funciones deban construirse desde el inicio.

Base de datos
docs/engineering/07-DATABASE.md
Define:
	•	entidades;
	•	relaciones;
	•	multiempresa;
	•	versiones;
	•	historial;
	•	auditoría;
	•	integridad;
	•	seguridad;
	•	estrategia gradual de implementación.
La implementación inicial utilizará únicamente las entidades necesarias para la fase activa.

Manual de Ingeniería
docs/engineering/08-ENGINEERING-HANDBOOK.md
Define:
	•	convenciones;
	•	pruebas;
	•	Git;
	•	revisiones;
	•	errores;
	•	seguridad;
	•	rendimiento;
	•	despliegues;
	•	definición de terminado.

Roadmap
docs/engineering/ROADMAP.md
Definirá:
	•	orden de trabajo;
	•	fases;
	•	objetivos;
	•	entregables;
	•	dependencias;
	•	criterios para avanzar.
El Roadmap deberá impedir que se agreguen funciones sin completar primero los cimientos necesarios.

Cómo abrir el proyecto
Requisito
Tener instalado Visual Studio Code.
Procedimiento
	1	Abrir Visual Studio Code.
	2	Seleccionar Archivo.
	3	Seleccionar Abrir carpeta.
	4	Elegir la carpeta ProyCut.
	5	Confirmar que el explorador lateral muestre todos los archivos.
Siempre deberá abrirse la carpeta completa.
No únicamente index.html.

Cómo ejecutar el prototipo actual
Durante la primera fase, el proyecto podrá ejecutarse abriendo index.html en un navegador.
Sin embargo, se recomienda utilizar un servidor local para evitar problemas con archivos, módulos o políticas del navegador.
Podrá utilizarse una extensión de servidor local en Visual Studio Code o un comando definido posteriormente.
El método oficial se documentará después del diagnóstico técnico.

Flujo inicial obligatorio
Antes de reorganizar el código:
1. Copiar el index más completo.
2. Crear el respaldo original.
3. Confirmar que funciona.
4. Inicializar Git.
5. Crear el primer commit.
6. Leer la documentación.
7. Analizar el código sin modificarlo.
8. Crear CURRENT-STATE.md.
9. Crear REFACTOR-PLAN.md.
10. Crear una lista de pruebas manuales.
11. Separar únicamente el CSS.
12. Validar.
13. Continuar con JavaScript.

Documentos generados después del análisis
Después de analizar index.html, deberán crearse:
docs/CURRENT-STATE.md
Contendrá:
	•	inventario de funcionalidades actuales;
	•	estructura del archivo;
	•	variables;
	•	funciones;
	•	dependencias;
	•	almacenamiento;
	•	riesgos;
	•	duplicaciones;
	•	deuda técnica.
docs/REFACTOR-PLAN.md
Contendrá:
	•	etapas de reorganización;
	•	orden de extracción;
	•	riesgos;
	•	pruebas;
	•	criterios de aceptación;
	•	estrategia de reversión.
Estos documentos no deberán escribirse mediante suposiciones.
Deben surgir del análisis real del código.

Reglas para modificar el código
Toda modificación deberá cumplir:
	•	leer la documentación relacionada;
	•	conservar funcionalidades no incluidas en el alcance;
	•	trabajar con cambios pequeños;
	•	evitar reescrituras masivas;
	•	mantener un punto de regreso;
	•	ejecutar pruebas;
	•	documentar resultados;
	•	informar incertidumbres;
	•	evitar eliminar código que no se comprenda.

Uso de inteligencia artificial
ChatGPT, Codex, Claude u otra IA podrán ayudar con:
	•	análisis;
	•	documentación;
	•	separación de código;
	•	generación de pruebas;
	•	revisión;
	•	detección de riesgos;
	•	propuestas de arquitectura.
La IA no deberá utilizarse para:
	•	reescribir todo el proyecto de una vez;
	•	eliminar funciones sin autorización;
	•	inventar reglas de negocio;
	•	modificar datos críticos sin revisión;
	•	aplicar cambios destructivos;
	•	sustituir pruebas y validación.

Git
Git deberá inicializarse antes de modificar el prototipo.
Comandos iniciales:
git init
git add .
git commit -m "chore: preserve original ProyCut prototype"
Cada etapa de reorganización deberá generar un commit independiente.
Ejemplos:
docs: add foundational project documentation
refactor(styles): extract embedded CSS
refactor(core): extract shared application state
refactor(parts): isolate part management logic
test(regression): document prototype verification

.gitignore
Contenido inicial recomendado:
.env
.env.local
node_modules/
dist/
build/
coverage/
.DS_Store
Thumbs.db
Se actualizará cuando se definan las herramientas técnicas.

Supabase
Supabase no deberá conectarse antes de:
	1	analizar el prototipo;
	2	identificar los datos actuales;
	3	separar la lógica de negocio;
	4	definir el primer alcance;
	5	crear el Roadmap;
	6	seleccionar las primeras entidades.
La integración inicial propuesta incluirá únicamente:
companies
users
company_users
clients
projects
Después se agregarán progresivamente:
furniture_items
parts
materials
cost_calculations
quotations
No se implementará todo el modelo de datos desde el primer día.

Alcance inmediato
Durante la etapa de reorganización, no se deberán agregar:
	•	nuevas integraciones;
	•	funciones avanzadas de IA;
	•	pagos;
	•	comercio electrónico;
	•	modelado 3D complejo;
	•	microservicios;
	•	módulos administrativos secundarios.
El objetivo será estabilizar y organizar lo que ya existe.

Criterio de éxito de la reorganización
La primera etapa se considerará exitosa cuando:
	•	el prototipo conserve sus funcionalidades;
	•	HTML, CSS y JavaScript estén separados;
	•	las funciones estén inventariadas;
	•	la lógica crítica esté identificada;
	•	existan pruebas manuales;
	•	Git permita regresar a cualquier etapa;
	•	se conozca qué código debe conservarse;
	•	se conozca qué código puede eliminarse;
	•	exista un plan de migración gradual;
	•	el proyecto sea más fácil de comprender.

Estado del proyecto
Etapa actual:
Documentación y preparación para diagnóstico.

Siguiente objetivo:
Crear ROADMAP.md.

Después:
Preparar la carpeta local, agregar el prototipo e iniciar el diagnóstico técnico.

Regla final
ProyCut no deberá crecer agregando funciones sobre una base desordenada.
Primero deberá comprenderse.
Después deberá organizarse.
Luego podrá evolucionar.
Toda decisión deberá proteger:
	•	la estabilidad;
	•	los datos;
	•	la funcionalidad;
	•	la claridad;
	•	la experiencia;
	•	la confianza del usuario.
