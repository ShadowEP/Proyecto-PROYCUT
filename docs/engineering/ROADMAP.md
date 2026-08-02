# ROADMAP.md

## Estado
Aprobado

## Versión
1.0

## Última actualización
2026-08-01

## Propósito
Definir el orden de reorganización y desarrollo de ProyCut: fases, criterios de salida y orden inmediato de ejecución.

## Depende de
Toda la jerarquía de contenido anterior (ver `docs/meta/DOCUMENTATION-STANDARD.md`, sección 4.1)

## Referenciado por
`README.md` (repite parcialmente su "flujo inicial obligatorio")

## Responsable
PENDIENTE

---

ROADMAP.md
Hoja de Ruta de ProyCut

1. Propósito
Este documento define el orden de reorganización y desarrollo de ProyCut.
Su objetivo es evitar:
	•	agregar funciones sobre una base desordenada;
	•	modificar demasiadas áreas al mismo tiempo;
	•	perder funcionalidades existentes;
	•	consumir tiempo y tokens sin una dirección clara;
	•	conectar servicios antes de que el sistema esté preparado;
	•	construir módulos que todavía no son necesarios;
	•	aumentar la complejidad sin validar primero el producto.
El Roadmap no representa una lista rígida de fechas.
Representa un orden lógico de trabajo.
No deberá iniciarse una fase si los criterios de salida de la fase anterior no se han cumplido.

2. Principio general
Primero preservar. Después comprender. Luego reorganizar. Finalmente evolucionar.
El orden general será:
Preservar
   │
   ▼
Diagnosticar
   │
   ▼
Separar
   │
   ▼
Estabilizar
   │
   ▼
Modularizar
   │
   ▼
Conectar datos
   │
   ▼
Construir el SaaS
   │
   ▼
Integrar
   │
   ▼
Escalar

3. Reglas del Roadmap
Durante todas las fases deberán respetarse estas reglas:
	1	No agregar nuevas funciones durante la reorganización inicial.
	2	No eliminar código sin comprender su propósito.
	3	No reescribir el proyecto completo.
	4	No conectar Supabase antes de identificar los datos actuales.
	5	No migrar a un framework únicamente por moda.
	6	No modificar varias capas al mismo tiempo.
	7	Cada cambio deberá probarse antes de continuar.
	8	Cada fase deberá tener un commit en Git.
	9	Todo comportamiento crítico deberá documentarse.
	10	La estabilidad tendrá prioridad sobre la velocidad.
	11	La precisión de cálculos y datos será irrenunciable.
	12	Toda IA deberá leer docs/engineering/04-AI-RULES.md.

4. Estado inicial
ProyCut parte de un prototipo funcional desarrollado principalmente dentro de un archivo index.html.
Este archivo puede contener:
	•	estructura HTML;
	•	estilos CSS;
	•	JavaScript;
	•	estados globales;
	•	cálculos;
	•	optimización;
	•	impresión;
	•	exportaciones;
	•	personalización de interfaz;
	•	almacenamiento local;
	•	dependencias externas.
El archivo más reciente y completo será la referencia inicial.
El archivo antiguo podrá utilizarse únicamente como apoyo histórico.

FASE 0 — Preparación y preservación
Objetivo
Crear un entorno seguro antes de modificar el prototipo.
Tareas
	•	Crear la carpeta principal ProyCut. 
	•	Abrir la carpeta completa en Visual Studio Code. 
	•	Copiar el index.html más completo. 
	•	Confirmar que el archivo abre y funciona. 
	•	Crear legacy/index-original.html. 
	•	Confirmar que ambas copias son idénticas. 
	•	Agregar la carpeta docs. 
	•	Guardar la documentación inicial. 
	•	Crear .gitignore. 
	•	Inicializar Git. 
	•	Crear el primer commit. 
	•	Crear un repositorio privado en GitHub. 
	•	Subir el estado inicial. 
Commit recomendado
chore: preserve original ProyCut prototype
Criterios de salida
La fase se considera terminada cuando:
	•	existe una copia original inmutable;
	•	el prototipo sigue funcionando;
	•	Git permite regresar al estado inicial;
	•	la documentación está dentro del proyecto;
	•	el repositorio remoto es privado;
	•	no se ha modificado el código funcional.

FASE 1 — Diagnóstico del estado actual
Objetivo
Comprender completamente el prototipo antes de reorganizarlo.
Tareas
	•	Leer los documentos de docs. 
	•	Analizar index.html completo. 
	•	Identificar secciones HTML. 
	•	Identificar estilos CSS. 
	•	Inventariar funciones JavaScript. 
	•	Identificar variables globales. 
	•	Identificar estados de la interfaz. 
	•	Identificar dependencias externas. 
	•	Identificar almacenamiento local. 
	•	Identificar cálculos críticos. 
	•	Identificar funciones de impresión. 
	•	Identificar exportaciones. 
	•	Identificar funciones de optimización. 
	•	Identificar personalizaciones. 
	•	Detectar posibles duplicaciones. 
	•	Detectar riesgos. 
	•	Detectar código aparentemente no utilizado sin eliminarlo. 
Documentos a generar
docs/CURRENT-STATE.md
docs/REFACTOR-PLAN.md
docs/MANUAL-TESTS.md
CURRENT-STATE.md
Deberá incluir:
	•	inventario real de funciones;
	•	estructura del archivo;
	•	dependencias;
	•	almacenamiento;
	•	cálculos;
	•	estados;
	•	riesgos;
	•	deuda técnica;
	•	comportamiento conocido.
REFACTOR-PLAN.md
Deberá incluir:
	•	orden de separación;
	•	archivos afectados;
	•	riesgos;
	•	estrategia de pruebas;
	•	estrategia de reversión;
	•	criterios de aceptación.
MANUAL-TESTS.md
Deberá incluir las pruebas para validar el prototipo antes y después de cada cambio.
Criterios de salida
	•	todas las funcionalidades conocidas están inventariadas;
	•	se conoce qué información utiliza el sistema;
	•	se conocen los puntos críticos;
	•	existe un plan incremental;
	•	no se ha modificado funcionalidad;
	•	existe una lista de pruebas reproducibles.

FASE 2 — Línea base de pruebas
Objetivo
Crear una referencia confiable del funcionamiento actual.
Tareas
	•	Ejecutar todas las pruebas manuales. 
	•	Registrar resultados. 
	•	Tomar capturas de las pantallas principales. 
	•	Grabar el flujo principal cuando sea conveniente. 
	•	Guardar ejemplos de exportaciones. 
	•	Guardar ejemplos de impresión. 
	•	Guardar entradas y resultados de optimización. 
	•	Registrar datos de prueba. 
	•	Documentar errores conocidos. 
	•	Clasificar funciones críticas y secundarias. 
Funciones críticas iniciales
Se deberá confirmar, según lo que realmente exista:
	•	creación de piezas;
	•	edición de piezas;
	•	eliminación de piezas;
	•	materiales;
	•	cálculo de costos;
	•	optimización;
	•	diagramas;
	•	impresión;
	•	etiquetas;
	•	exportación;
	•	almacenamiento;
	•	recuperación de datos;
	•	personalización.
Criterios de salida
	•	existe evidencia de cómo funciona el prototipo;
	•	los cálculos principales tienen ejemplos;
	•	se pueden repetir las pruebas;
	•	los errores conocidos están documentados;
	•	se conoce qué no debe romperse.

FASE 3 — Separación de CSS
Objetivo
Extraer los estilos sin modificar el comportamiento ni la apariencia.
Estructura inicial
src/
└── styles/
    ├── main.css
    ├── variables.css
    └── components.css
No será obligatorio crear todos los archivos desde el primer cambio.
Orden recomendado
	1	Extraer el bloque <style> sin modificarlo.
	2	Enlazar el archivo CSS externo.
	3	Confirmar que la interfaz se ve igual.
	4	Crear un commit.
	5	Identificar variables visuales.
	6	Separar gradualmente estilos globales y componentes.
	7	Eliminar duplicaciones únicamente después de validar.
Prohibiciones
	•	no rediseñar la interfaz;
	•	no cambiar colores;
	•	no renombrar todas las clases;
	•	no eliminar estilos aparentemente duplicados sin revisar;
	•	no introducir un framework CSS todavía;
	•	no mezclar esta fase con JavaScript.
Commit recomendado
refactor(styles): extract embedded CSS
Criterios de salida
	•	no existe CSS principal incrustado;
	•	la interfaz conserva su apariencia;
	•	las pruebas visuales pasan;
	•	los selectores siguen funcionando;
	•	no se ha cambiado funcionalidad.

FASE 4 — Separación inicial de JavaScript
Objetivo
Extraer el JavaScript del HTML sin cambiar su comportamiento.
Estructura inicial
src/
└── scripts/
    └── main.js
Orden recomendado
	1	Extraer el bloque <script>.
	2	Enlazar main.js.
	3	Mantener nombres y orden de ejecución.
	4	Confirmar que todo sigue funcionando.
	5	Crear un commit.
	6	Identificar grupos funcionales.
	7	Preparar la separación modular.
Prohibiciones
	•	no renombrar funciones masivamente;
	•	no convertir todo a clases;
	•	no migrar todavía a TypeScript;
	•	no cambiar almacenamiento;
	•	no sustituir librerías;
	•	no eliminar variables globales sin análisis;
	•	no optimizar cálculos en esta etapa.
Commit recomendado
refactor(scripts): extract embedded JavaScript
Criterios de salida
	•	HTML, CSS y JavaScript están físicamente separados;
	•	el prototipo mantiene su comportamiento;
	•	las pruebas manuales pasan;
	•	no se han introducido errores visibles;
	•	existe un commit seguro.

FASE 5 — Identificación y extracción de módulos
Objetivo
Dividir main.js por responsabilidades reales.
Posibles módulos iniciales
La lista definitiva deberá surgir del análisis real.
src/
└── modules/
    ├── parts/
    ├── materials/
    ├── costing/
    ├── optimization/
    ├── printing/
    ├── labels/
    ├── exports/
    ├── persistence/
    ├── ui/
    └── settings/
Orden recomendado
	1	Utilidades sin efectos secundarios.
	2	Constantes y configuración.
	3	Manejo de datos.
	4	Persistencia local.
	5	Gestión de piezas.
	6	Materiales.
	7	Cálculos.
	8	Optimización.
	9	Impresión y etiquetas.
	10	Exportaciones.
	11	Interfaz.
	12	Personalizaciones.
Reglas
Cada extracción deberá:
	•	afectar un grupo funcional;
	•	conservar la API existente cuando sea posible;
	•	incluir pruebas o validación manual;
	•	generar un commit independiente;
	•	actualizar CURRENT-STATE.md;
	•	actualizar REFACTOR-PLAN.md.
Criterios de salida
	•	el archivo principal coordina en lugar de contener todo;
	•	los cálculos críticos están identificados;
	•	la impresión está separada de la optimización;
	•	las exportaciones consumen datos, no recalculan;
	•	la persistencia está separada de la interfaz;
	•	no existen dependencias circulares evidentes.

FASE 6 — Estabilización de la lógica del negocio
Objetivo
Separar los cálculos y reglas de la interfaz.
Funciones prioritarias
	•	cálculo de materiales;
	•	cálculo de costos;
	•	desperdicio;
	•	margen;
	•	precios;
	•	unidades;
	•	validación de piezas;
	•	parámetros de corte;
	•	resultados de optimización.
Reglas
La lógica deberá:
	•	recibir entradas explícitas;
	•	devolver resultados explícitos;
	•	evitar leer directamente del DOM;
	•	evitar modificar la interfaz;
	•	evitar depender de almacenamiento;
	•	poder probarse de forma aislada;
	•	documentar supuestos;
	•	documentar redondeos;
	•	documentar unidades.
Ejemplo conceptual
Incorrecto:
Botón
→ lee campos
→ calcula
→ modifica tabla
→ guarda datos
→ imprime
Objetivo:
Interfaz
→ prepara entrada
→ caso de uso
→ cálculo
→ resultado
→ interfaz muestra
→ persistencia guarda
Criterios de salida
	•	los cálculos principales funcionan sin depender del DOM;
	•	las unidades son explícitas;
	•	los resultados son reproducibles;
	•	existen pruebas para reglas críticas;
	•	impresión y exportación consumen los mismos resultados.

FASE 7 — Limpieza controlada
Objetivo
Eliminar duplicación y código innecesario con evidencia.
Tareas
	•	Confirmar referencias reales. 
	•	Identificar funciones duplicadas. 
	•	Identificar estilos duplicados. 
	•	Identificar variables obsoletas. 
	•	Identificar eventos repetidos. 
	•	Identificar funciones sin uso comprobado. 
	•	Eliminar una categoría a la vez. 
	•	Ejecutar pruebas después de cada eliminación. 
	•	Documentar lo eliminado. 
	•	Mantener posibilidad de reversión. 
Prohibiciones
	•	no eliminar por intuición;
	•	no limpiar mientras se agrega funcionalidad;
	•	no cambiar comportamiento ocultamente;
	•	no eliminar personalizaciones sin decidir primero su valor;
	•	no borrar el respaldo original.
Criterios de salida
	•	existe menos duplicación;
	•	el código es más comprensible;
	•	no se han perdido funciones;
	•	cada eliminación está registrada;
	•	las pruebas continúan pasando.

FASE 8 — Decisión de la base tecnológica
Objetivo
Decidir si el prototipo continuará con JavaScript modular o migrará progresivamente a otra estructura.
Decisiones posibles
	•	JavaScript modular con herramientas ligeras;
	•	TypeScript;
	•	framework de interfaz;
	•	sistema de construcción;
	•	gestor de dependencias;
	•	librería de pruebas;
	•	librería de visualización 3D;
	•	motor de optimización;
	•	sistema de componentes.
Criterios de decisión
	•	complejidad actual;
	•	necesidades futuras;
	•	rendimiento;
	•	mantenimiento;
	•	aprendizaje;
	•	disponibilidad de herramientas;
	•	compatibilidad con el prototipo;
	•	costo de migración;
	•	riesgo;
	•	comunidad y soporte.
Regla
La tecnología deberá elegirse después de entender el sistema, no antes.
Entregable
Crear un ADR:
docs/adr/0001-base-tecnologica.md
Criterios de salida
	•	existe una decisión documentada;
	•	se conocen alternativas;
	•	se conoce el costo de migración;
	•	existe una estrategia gradual;
	•	no se requiere reescribir todo.

FASE 9 — Preparación de Supabase
Objetivo
Crear la primera capa persistente del SaaS sin migrar todo al mismo tiempo.
Tareas
	•	Crear proyecto en Supabase. 
	•	Configurar entornos. 
	•	Crear variables de entorno. 
	•	Proteger claves. 
	•	Configurar autenticación. 
	•	Crear primeras migraciones. 
	•	Configurar aislamiento multiempresa. 
	•	Crear pruebas de acceso. 
	•	Configurar respaldos. 
	•	Documentar conexión. 
Primeras entidades
companies
users
company_users
clients
projects
Reglas
	•	ninguna clave privada en frontend;
	•	ninguna tabla sin política de acceso;
	•	ninguna consulta sin empresa;
	•	ninguna migración manual sin registro;
	•	ningún dato real sensible en pruebas.
Criterios de salida
	•	registro e inicio de sesión funcionan;
	•	un usuario pertenece a una empresa;
	•	los datos están aislados;
	•	se pueden crear clientes y proyectos;
	•	existe migración versionada;
	•	existen pruebas de aislamiento.

FASE 10 — Migración gradual de datos
Objetivo
Reemplazar progresivamente el almacenamiento local por persistencia en el backend.
Orden recomendado
	1	Empresas y usuarios.
	2	Clientes.
	3	Proyectos.
	4	Muebles.
	5	Piezas.
	6	Materiales.
	7	Cálculos.
	8	Cotizaciones.
	9	Resultados de optimización.
	10	Documentos.
Estrategia
Cada módulo deberá pasar por:
Analizar datos actuales
→ Diseñar entidad
→ Crear migración
→ Crear repositorio
→ Integrar caso de uso
→ Migrar datos
→ Validar
→ Retirar almacenamiento anterior
Criterios de salida
	•	los datos migrados no se duplican;
	•	existe estrategia de reversión;
	•	el almacenamiento local deja de ser la fuente principal;
	•	los errores de red no provocan pérdida;
	•	las operaciones son trazables.

FASE 11 — Núcleo SaaS
Objetivo
Convertir el prototipo reorganizado en una plataforma multiusuario.
Funciones
	•	autenticación;
	•	empresas;
	•	usuarios;
	•	roles;
	•	permisos;
	•	clientes;
	•	proyectos;
	•	configuración;
	•	auditoría;
	•	recuperación;
	•	sesiones;
	•	aislamiento.
Criterios de salida
	•	múltiples empresas pueden utilizar el sistema;
	•	una empresa no ve datos de otra;
	•	los permisos funcionan;
	•	existe trazabilidad;
	•	el proyecto sigue siendo el centro;
	•	los cálculos conservan precisión.

FASE 12 — MVP funcional
Objetivo
Lanzar una versión enfocada en el problema principal.
Alcance propuesto
	•	registro de empresa;
	•	usuarios básicos;
	•	clientes;
	•	proyectos;
	•	piezas;
	•	materiales;
	•	precios;
	•	costos;
	•	margen;
	•	cotización;
	•	optimización;
	•	diagramas;
	•	etiquetas;
	•	impresión;
	•	exportación;
	•	historial básico.
Fuera del MVP
	•	modelado 3D complejo;
	•	inventario avanzado;
	•	producción avanzada;
	•	compras completas;
	•	IA autónoma;
	•	Shopify;
	•	WooCommerce;
	•	microservicios;
	•	ERP completo.
Criterios de salida
Un pequeño fabricante o placacentro puede:
	1	crear un proyecto;
	2	registrar piezas;
	3	seleccionar materiales;
	4	calcular costos;
	5	obtener un precio;
	6	optimizar tableros;
	7	generar una cotización;
	8	imprimir diagramas y etiquetas;
	9	guardar el proyecto;
	10	recuperar la información.

FASE 13 — Validación con usuarios
Objetivo
Comprobar que ProyCut resuelve el problema real.
Usuarios iniciales
	•	pequeños fabricantes;
	•	carpinteros;
	•	placacentros.
Métricas iniciales
	•	tiempo para crear una cotización;
	•	errores detectados;
	•	precisión percibida;
	•	desperdicio;
	•	facilidad de uso;
	•	pasos necesarios;
	•	funciones utilizadas;
	•	bloqueos;
	•	satisfacción;
	•	disposición a pagar.
Regla
No deberá construirse una gran cantidad de funciones futuras antes de validar el flujo principal.
Criterios de salida
	•	usuarios reales completan el flujo;
	•	se identifican problemas repetidos;
	•	existe evidencia de valor;
	•	se conocen las funciones prioritarias;
	•	se ajusta el Roadmap con datos reales.

FASE 14 — Inventario y producción básica
Objetivo
Extender ProyCut después de validar el MVP.
Funciones posibles
	•	inventario;
	•	reservas;
	•	retazos;
	•	movimientos;
	•	órdenes de producción;
	•	estados;
	•	consumo;
	•	etiquetas operativas;
	•	seguimiento;
	•	incidencias básicas.
Dependencia
Esta fase depende de que:
	•	proyectos;
	•	piezas;
	•	materiales;
	•	optimización;
	•	usuarios;
	•	base de datos;
sean estables.

FASE 15 — Modelado y visualización 3D
Objetivo
Agregar visualización útil sin intentar construir un CAD universal.
Alcance inicial
	•	generación 3D a partir de piezas;
	•	dimensiones;
	•	posiciones;
	•	orientación;
	•	agrupaciones;
	•	identificación visual;
	•	indicaciones de armado;
	•	selección de piezas;
	•	vistas básicas.
Fuera de alcance inicial
	•	herramientas complejas de modelado libre;
	•	reemplazar SketchUp;
	•	renderizado profesional;
	•	simulación física completa;
	•	CAD industrial universal.
Regla
El modelado deberá apoyar la cotización y fabricación.
No convertirse en un producto separado.

FASE 16 — Integraciones comerciales
Objetivo
Conectar el núcleo validado con sistemas externos.
Posibles integraciones
	•	Stripe;
	•	Shopify;
	•	WooCommerce;
	•	contabilidad;
	•	facturación;
	•	almacenamiento;
	•	correo;
	•	calendarios;
	•	proveedores.
Requisitos previos
Antes de una integración deberá existir:
	•	caso de uso estable;
	•	API o contrato interno;
	•	permisos;
	•	manejo de errores;
	•	idempotencia;
	•	auditoría;
	•	estrategia de sincronización;
	•	mapeo de datos.
Regla
Las integraciones no deberán definir el núcleo del producto.
Deberán conectarse al núcleo ya existente.

FASE 17 — Inteligencia artificial de producto
Objetivo
Agregar IA únicamente donde reduzca incertidumbre o trabajo repetitivo.
Casos posibles
	•	detectar datos faltantes;
	•	explicar costos;
	•	encontrar inconsistencias;
	•	resumir proyectos;
	•	sugerir materiales;
	•	identificar riesgos;
	•	explicar optimizaciones;
	•	apoyar cotizaciones;
	•	enseñar al usuario.
Prohibiciones
La IA no deberá:
	•	inventar precios;
	•	inventar medidas;
	•	modificar costos sin autorización;
	•	ejecutar acciones destructivas;
	•	ocultar incertidumbre;
	•	sustituir reglas deterministas;
	•	ser necesaria para operar funciones esenciales.

FASE 18 — Escalabilidad operativa
Objetivo
Preparar el sistema para mayor volumen únicamente cuando exista evidencia.
Áreas
	•	rendimiento;
	•	procesos asíncronos;
	•	colas;
	•	caché;
	•	almacenamiento;
	•	observabilidad;
	•	optimización de consultas;
	•	distribución de carga;
	•	recuperación;
	•	alta disponibilidad.
Regla
No se implementarán microservicios o infraestructura compleja por anticipación.
La arquitectura evolucionará según mediciones reales.

5. Orden inmediato de ejecución
Las siguientes acciones deberán realizarse ahora:
1. Guardar README.md.
2. Guardar ROADMAP.md.
3. Crear la carpeta ProyCut.
4. Abrirla en Visual Studio Code.
5. Copiar el index más completo.
6. Crear legacy/index-original.html.
7. Agregar la carpeta docs.
8. Guardar los documentos.
9. Crear .gitignore.
10. Inicializar Git.
11. Crear el primer commit.
12. Confirmar que el prototipo funciona.
13. Ejecutar el prompt de diagnóstico.
14. Crear CURRENT-STATE.md.
15. Crear REFACTOR-PLAN.md.
16. Crear MANUAL-TESTS.md.
17. Validar el prototipo.
18. Separar únicamente el CSS.
No deberá iniciarse Supabase, React, TypeScript o una nueva funcionalidad antes de completar el diagnóstico.

6. Prompt para diagnóstico
Lee primero todos los documentos de la carpeta `docs`, especialmente:

- `docs/vision/00-LIBRO-FUNDACIONAL.md`
- `docs/vision/03-PROYCUT-BLUEPRINT.md`
- `docs/engineering/04-AI-RULES.md`
- `docs/engineering/05-ARCHITECTURE.md`
- `docs/engineering/06-FUNCTIONALITIES.md`
- `docs/engineering/ROADMAP.md`

Después analiza completamente `index.html`.

No modifiques ningún archivo todavía.

Crea:

1. `docs/CURRENT-STATE.md`
2. `docs/REFACTOR-PLAN.md`
3. `docs/MANUAL-TESTS.md`

El diagnóstico debe incluir:

- inventario de funcionalidades;
- estructura HTML;
- CSS incorporado;
- funciones JavaScript;
- variables y estados globales;
- almacenamiento;
- dependencias;
- cálculos;
- impresión;
- exportación;
- optimización;
- personalización;
- posibles duplicaciones;
- código de uso incierto;
- riesgos;
- módulos propuestos;
- orden de refactorización;
- pruebas necesarias;
- estrategia de reversión.

No elimines código.
No renombres funciones.
No reorganices todavía.
No supongas que algo no se utiliza.
No agregues tecnologías.
No conectes Supabase.
No cambies el comportamiento.

Primero comprende.
Después documenta.

7. Criterio para avanzar de fase
Antes de avanzar deberá responderse afirmativamente:
	•	¿La fase tiene un objetivo cumplido? 
	•	¿Las pruebas pasan? 
	•	¿La funcionalidad existente permanece? 
	•	¿Existe un commit? 
	•	¿La documentación está actualizada? 
	•	¿Los riesgos están identificados? 
	•	¿Puede revertirse? 
	•	¿El siguiente paso está claro? 
	•	¿Se redujo la incertidumbre? 
	•	¿El proyecto es más comprensible? 
Si alguna respuesta crítica es negativa, no deberá avanzarse.

8. Qué no hacer ahora
Durante las primeras fases no deberá:
	•	agregar más personalización;
	•	agregar nuevas integraciones;
	•	conectar Stripe;
	•	conectar Shopify;
	•	conectar WooCommerce;
	•	construir inventario avanzado;
	•	construir producción completa;
	•	agregar IA al producto;
	•	crear microservicios;
	•	rediseñar toda la interfaz;
	•	migrar todo a un framework;
	•	eliminar funciones;
	•	crear todas las tablas del modelo futuro;
	•	intentar completar el SaaS de una sola vez.

9. Regla para nuevas ideas
Las ideas nuevas no deberán desarrollarse inmediatamente.
Deberán registrarse en una sección de ideas futuras.
Formato:
Nombre:

Problema que resuelve:

Usuario:

Valor:

Dependencias:

Riesgos:

Fase posible:
La idea podrá revisarse al planificar una fase futura.
Registrar una idea no significa comprometerse a construirla.

10. Definición del primer gran éxito
La reorganización inicial será exitosa cuando:
	•	el archivo original esté protegido;
	•	Git funcione;
	•	la documentación esté disponible;
	•	el prototipo esté inventariado;
	•	existan pruebas;
	•	HTML, CSS y JavaScript estén separados;
	•	los módulos principales estén identificados;
	•	los cálculos críticos estén aislados;
	•	no se haya perdido funcionalidad;
	•	exista claridad sobre cómo conectar Supabase;
	•	el siguiente desarrollo pueda realizarse sin improvisar.

11. Regla final
ProyCut deberá crecer en capas de confianza, no en acumulaciones de código.
Cada fase deberá dejar una base más estable que la anterior.
El Roadmap no deberá premiar la cantidad de funciones terminadas.
Deberá proteger:
	•	el orden;
	•	la precisión;
	•	la estabilidad;
	•	la claridad;
	•	la experiencia;
	•	la capacidad de continuar.
El objetivo no es avanzar rápido durante una semana.
Es poder avanzar con seguridad durante muchos años.
