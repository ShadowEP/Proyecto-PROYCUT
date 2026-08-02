# 06-FUNCTIONALITIES.md

## Estado
Aprobado

## Versión
1.0

## Última actualización
2026-08-01

## Propósito
Definir las capacidades funcionales que formarán parte de ProyCut.

## Depende de
`docs/vision/03-PROYCUT-BLUEPRINT.md`

## Referenciado por
`docs/engineering/07-DATABASE.md`, `docs/engineering/ROADMAP.md`

## Responsable
PENDIENTE

---

06-FUNCTIONALITIES.md
Catálogo Funcional de ProyCut

1. Propósito del documento
Este documento define las capacidades funcionales que formarán parte de ProyCut.
Su objetivo es establecer:
	•	qué problemas resolverá el sistema;
	•	qué podrá hacer cada tipo de usuario;
	•	cómo se conectarán las funcionalidades;
	•	qué información entrará y saldrá de cada proceso;
	•	qué funciones son esenciales;
	•	qué funciones podrán desarrollarse posteriormente;
	•	qué funciones no pertenecen a ProyCut.
Este documento describe qué debe hacer el producto.
No define:
	•	tecnologías;
	•	tablas;
	•	endpoints;
	•	componentes visuales;
	•	estructura del código;
	•	proveedores específicos.
Esos detalles pertenecen a otros documentos.

2. Principio funcional
ProyCut acompaña un proyecto desde la primera idea hasta su entrega, reduciendo la incertidumbre en cada etapa.
Las funcionalidades no deberán diseñarse como herramientas aisladas.
Cada capacidad deberá responder:
	1	¿En qué etapa del proyecto aporta valor?
	2	¿Qué incertidumbre elimina?
	3	¿Qué decisión facilita?
	4	¿Qué información consume?
	5	¿Qué información produce?
	6	¿Qué paso habilita después?
	7	¿Qué usuario puede utilizarla?
	8	¿Cómo se verifica su resultado?

3. El Proyecto como unidad central
El Proyecto es la unidad principal de trabajo de ProyCut.
Todo proyecto podrá conectar:
	•	cliente;
	•	oportunidad comercial;
	•	diseño;
	•	espacios;
	•	muebles;
	•	piezas;
	•	materiales;
	•	herrajes;
	•	servicios;
	•	costos;
	•	cotizaciones;
	•	optimizaciones;
	•	compras;
	•	inventario;
	•	producción;
	•	calidad;
	•	instalación;
	•	entrega;
	•	documentos;
	•	comunicaciones;
	•	historial;
	•	rentabilidad.
Una funcionalidad que afecte un proyecto deberá conservar su trazabilidad.

4. Ciclo de vida del proyecto
El ciclo funcional principal será:
Idea
  │
  ▼
Registro del cliente
  │
  ▼
Definición del proyecto
  │
  ▼
Diseño y despiece
  │
  ▼
Selección de materiales
  │
  ▼
Costeo
  │
  ▼
Cotización
  │
  ▼
Aprobación
  │
  ▼
Planeación
  │
  ▼
Compras e inventario
  │
  ▼
Optimización
  │
  ▼
Producción
  │
  ▼
Control de calidad
  │
  ▼
Instalación o entrega
  │
  ▼
Cierre y análisis
No todos los proyectos deberán recorrer exactamente las mismas etapas.
El flujo podrá adaptarse según:
	•	tipo de empresa;
	•	tipo de proyecto;
	•	nivel de complejidad;
	•	modelo de producción;
	•	servicios contratados;
	•	permisos;
	•	configuración de la empresa.

5. Estados generales del proyecto
Estados iniciales propuestos:
Borrador
Definición
Diseño
Costeo
Cotizado
En negociación
Aprobado
Planificado
En preparación
En producción
En instalación
Entregado
Cerrado
Cancelado
Archivado
Cada estado deberá:
	•	tener un significado claro;
	•	definir acciones permitidas;
	•	impedir operaciones incompatibles;
	•	registrar quién realizó la transición;
	•	registrar fecha y motivo;
	•	conservar el historial.
Las empresas podrán configurar nombres visibles, pero las reglas internas deberán utilizar estados normalizados.

6. Tipos de usuario
ProyCut deberá contemplar, inicialmente, los siguientes perfiles funcionales:
Propietario de empresa
Administra la empresa, configuración, suscripción, usuarios y visión general.
Administrador
Gestiona operaciones, permisos, catálogos y procesos internos.
Vendedor
Registra clientes, crea proyectos, prepara cotizaciones y da seguimiento.
Diseñador
Define espacios, muebles, medidas, piezas, materiales y documentación técnica.
Costeador
Configura precios, costos, márgenes y valida cotizaciones.
Planificador
Convierte proyectos aprobados en planes de compra y producción.
Comprador
Gestiona proveedores, requisiciones, órdenes y recepciones.
Almacenista
Administra entradas, salidas, reservas, sobrantes y existencias.
Operador de corte
Consulta planes de corte, materiales, etiquetas y avances.
Operador de producción
Ejecuta operaciones, reporta avances, tiempos, consumos e incidencias.
Supervisor
Coordina producción, prioridades, cargas, calidad y bloqueos.
Instalador
Consulta información de entrega o instalación y registra evidencias.
Contabilidad o administración
Consulta documentos, costos, pagos, saldos e información financiera permitida.
Cliente externo
Podrá consultar o aprobar información específica mediante un portal controlado.
Usuario de centro de corte
Recibe solicitudes, procesa optimizaciones, prepara materiales y entrega resultados.
Los permisos reales no dependerán únicamente del nombre del perfil.
Se asignarán mediante roles y capacidades.

7. Acceso y cuenta
7.1 Registro de empresa
El sistema deberá permitir:
	•	crear una cuenta empresarial;
	•	definir nombre comercial;
	•	definir razón social cuando corresponda;
	•	seleccionar país;
	•	establecer moneda principal;
	•	seleccionar idioma;
	•	configurar zona horaria;
	•	establecer unidades predeterminadas;
	•	elegir tipo de operación;
	•	registrar datos fiscales opcionales;
	•	aceptar términos y políticas.
7.2 Inicio de sesión
El sistema deberá permitir:
	•	iniciar sesión;
	•	cerrar sesión;
	•	recuperar acceso;
	•	cambiar contraseña;
	•	gestionar sesiones activas;
	•	aplicar autenticación multifactor;
	•	bloquear accesos sospechosos;
	•	registrar intentos fallidos;
	•	aplicar políticas de seguridad configurables.
7.3 Perfil personal
Cada usuario podrá administrar:
	•	nombre;
	•	fotografía;
	•	idioma;
	•	zona horaria;
	•	preferencias;
	•	notificaciones;
	•	contraseña;
	•	métodos de autenticación;
	•	dispositivos o sesiones.

8. Configuración de empresa
La empresa podrá configurar:
	•	información general;
	•	logotipo;
	•	identidad visual;
	•	moneda;
	•	impuestos;
	•	unidades;
	•	formatos de fecha;
	•	numeraciones;
	•	prefijos;
	•	políticas de redondeo;
	•	márgenes;
	•	desperdicios;
	•	estados personalizados;
	•	etapas del proyecto;
	•	plantillas;
	•	documentos;
	•	centros de trabajo;
	•	almacenes;
	•	sucursales;
	•	horarios;
	•	métodos de pago;
	•	términos comerciales;
	•	reglas de aprobación;
	•	notificaciones;
	•	integraciones.
La configuración deberá distinguir entre:
	•	valores globales;
	•	valores por sucursal;
	•	valores por almacén;
	•	valores por centro de trabajo;
	•	valores por usuario;
	•	valores por proyecto.

9. Usuarios, roles y permisos
9.1 Gestión de usuarios
El sistema deberá permitir:
	•	invitar usuarios;
	•	activar o desactivar cuentas;
	•	asignar sucursales;
	•	asignar centros de trabajo;
	•	asignar roles;
	•	definir permisos específicos;
	•	consultar actividad;
	•	revocar sesiones;
	•	transferir responsabilidades;
	•	conservar historial tras la baja.
9.2 Permisos
Los permisos deberán poder controlar:
	•	lectura;
	•	creación;
	•	edición;
	•	eliminación;
	•	aprobación;
	•	exportación;
	•	impresión;
	•	acceso financiero;
	•	acceso a costos;
	•	acceso a precios;
	•	acceso a clientes;
	•	acceso a proveedores;
	•	acceso a inventarios;
	•	acceso a producción;
	•	administración de usuarios;
	•	administración de configuración.
9.3 Alcance
Un permiso podrá limitarse por:
	•	empresa;
	•	sucursal;
	•	almacén;
	•	centro de trabajo;
	•	proyecto;
	•	equipo;
	•	propietario del registro.

10. Clientes
10.1 Registro de clientes
El sistema deberá permitir registrar:
	•	persona o empresa;
	•	nombre;
	•	razón social;
	•	identificación fiscal;
	•	teléfonos;
	•	correos;
	•	contactos;
	•	direcciones;
	•	referencias;
	•	notas;
	•	archivos;
	•	preferencias;
	•	condiciones comerciales;
	•	moneda;
	•	listas de precios;
	•	datos de facturación;
	•	historial.
10.2 Contactos
Un cliente podrá tener múltiples contactos con:
	•	cargo;
	•	datos de contacto;
	•	preferencias;
	•	nivel de decisión;
	•	proyectos relacionados;
	•	permisos de portal.
10.3 Historial del cliente
El sistema deberá mostrar:
	•	proyectos;
	•	cotizaciones;
	•	aprobaciones;
	•	comunicaciones;
	•	documentos;
	•	pagos registrados;
	•	incidencias;
	•	devoluciones;
	•	rentabilidad histórica;
	•	fechas relevantes.
10.4 Duplicados
ProyCut deberá detectar posibles duplicados mediante:
	•	nombre;
	•	correo;
	•	teléfono;
	•	identificación fiscal;
	•	dirección.
La fusión de clientes deberá conservar relaciones e historial.

11. Oportunidades y seguimiento comercial
Antes de crear un proyecto completo, podrá registrarse una oportunidad.
La oportunidad podrá incluir:
	•	cliente potencial;
	•	descripción;
	•	origen;
	•	tipo de trabajo;
	•	valor estimado;
	•	probabilidad;
	•	fecha esperada;
	•	responsable;
	•	prioridad;
	•	siguiente acción;
	•	notas;
	•	archivos.
Estados sugeridos:
Nuevo
Contactado
Calificado
Visita programada
Propuesta
Negociación
Ganado
Perdido
Suspendido
Cuando una oportunidad se confirme, podrá convertirse en proyecto sin duplicar información.

12. Proyectos
12.1 Creación
Un proyecto podrá crearse:
	•	desde cero;
	•	desde una oportunidad;
	•	desde una plantilla;
	•	duplicando otro proyecto;
	•	importando información;
	•	mediante una integración;
	•	desde una solicitud del cliente.
12.2 Información general
Cada proyecto podrá incluir:
	•	nombre;
	•	identificador;
	•	cliente;
	•	contactos;
	•	responsable;
	•	equipo;
	•	sucursal;
	•	ubicación;
	•	dirección de instalación;
	•	descripción;
	•	tipo;
	•	prioridad;
	•	fechas;
	•	presupuesto objetivo;
	•	moneda;
	•	etiquetas;
	•	estado;
	•	etapa;
	•	archivos;
	•	notas;
	•	restricciones.
12.3 Resumen
El sistema deberá ofrecer una vista central con:
	•	estado actual;
	•	siguiente paso;
	•	responsables;
	•	alertas;
	•	avance;
	•	costos;
	•	precio;
	•	margen;
	•	materiales;
	•	compras;
	•	producción;
	•	documentos;
	•	actividad reciente.
12.4 Línea de tiempo
Cada proyecto deberá mantener una línea de tiempo con:
	•	cambios de estado;
	•	comentarios;
	•	aprobaciones;
	•	cotizaciones;
	•	modificaciones;
	•	eventos de producción;
	•	entregas;
	•	documentos;
	•	incidencias;
	•	responsables.
12.5 Duplicación
Al duplicar un proyecto, el usuario deberá elegir qué copiar:
	•	estructura;
	•	muebles;
	•	piezas;
	•	materiales;
	•	costos;
	•	proveedores;
	•	cotización;
	•	archivos;
	•	tareas;
	•	configuraciones.
No deberán copiarse automáticamente datos históricos, pagos o avances de producción.

13. Levantamiento y espacios
ProyCut deberá permitir documentar el entorno donde se fabricará o instalará el proyecto.
13.1 Espacios
Un proyecto podrá contener:
	•	áreas;
	•	habitaciones;
	•	muros;
	•	zonas;
	•	ubicaciones;
	•	niveles;
	•	módulos.
13.2 Mediciones
Se podrán registrar:
	•	ancho;
	•	alto;
	•	profundidad;
	•	diagonales;
	•	desniveles;
	•	ángulos;
	•	obstáculos;
	•	instalaciones;
	•	tolerancias;
	•	referencias.
13.3 Evidencias
Se podrán adjuntar:
	•	fotografías;
	•	videos;
	•	dibujos;
	•	documentos;
	•	notas de voz;
	•	referencias;
	•	croquis.
13.4 Validaciones
El sistema deberá advertir:
	•	medidas incompletas;
	•	medidas contradictorias;
	•	unidades inconsistentes;
	•	tolerancias faltantes;
	•	espacios sin evidencia;
	•	modificaciones posteriores al diseño.

14. Diseño conceptual
La etapa conceptual permitirá:
	•	definir necesidades;
	•	registrar estilo;
	•	establecer restricciones;
	•	seleccionar referencias;
	•	organizar muebles;
	•	establecer dimensiones generales;
	•	comparar alternativas;
	•	estimar rangos de costo;
	•	registrar decisiones del cliente.
No deberá presentarse un cálculo preliminar como costo definitivo.

15. Muebles, conjuntos y componentes
La estructura técnica propuesta será:
Proyecto
  └── Espacio
       └── Mueble o conjunto
            └── Módulo
                 └── Pieza
15.1 Mueble o conjunto
Podrá contener:
	•	nombre;
	•	tipo;
	•	ubicación;
	•	dimensiones;
	•	cantidad;
	•	acabado;
	•	imagen;
	•	estado;
	•	notas;
	•	precio;
	•	costo;
	•	componentes.
15.2 Módulo
Permitirá agrupar partes funcionales, como:
	•	gabinete;
	•	cajonera;
	•	puerta;
	•	repisa;
	•	cubierta;
	•	estructura;
	•	accesorio.
15.3 Plantillas paramétricas
El sistema podrá ofrecer plantillas de muebles configurables mediante:
	•	ancho;
	•	alto;
	•	profundidad;
	•	número de divisiones;
	•	tipo de puertas;
	•	número de cajones;
	•	material;
	•	espesor;
	•	herrajes;
	•	reglas de construcción.
Las plantillas deberán producir resultados editables y trazables.

16. Piezas
Cada pieza podrá incluir:
	•	identificador;
	•	nombre;
	•	descripción;
	•	mueble;
	•	cantidad;
	•	largo;
	•	ancho;
	•	espesor;
	•	material;
	•	veta;
	•	rotación permitida;
	•	cantos;
	•	perforaciones;
	•	mecanizados;
	•	acabado;
	•	prioridad;
	•	observaciones;
	•	código de etiqueta.
16.1 Validación de piezas
El sistema deberá detectar:
	•	dimensiones imposibles;
	•	espesor incompatible;
	•	material no disponible;
	•	pieza mayor al tablero;
	•	cantidades inválidas;
	•	cantos incompletos;
	•	orientación contradictoria;
	•	mecanizado fuera del área útil;
	•	duplicados probables.
16.2 Operaciones sobre piezas
Se podrán:
	•	crear;
	•	editar;
	•	copiar;
	•	duplicar;
	•	agrupar;
	•	dividir;
	•	importar;
	•	exportar;
	•	reemplazar materiales;
	•	cambiar dimensiones masivamente;
	•	asignar cantos;
	•	generar etiquetas.

17. Catálogo de materiales
17.1 Tableros
Cada tablero podrá incluir:
	•	fabricante;
	•	línea;
	•	código;
	•	nombre;
	•	tipo;
	•	acabado;
	•	color;
	•	textura;
	•	largo;
	•	ancho;
	•	espesor;
	•	veta;
	•	densidad;
	•	unidad;
	•	costo;
	•	precio;
	•	proveedor;
	•	disponibilidad;
	•	imagen;
	•	ficha técnica.
17.2 Cantos
Cada canto podrá incluir:
	•	material;
	•	color;
	•	espesor;
	•	ancho;
	•	unidad;
	•	costo;
	•	rendimiento;
	•	proveedor;
	•	compatibilidad.
17.3 Herrajes
Los herrajes podrán incluir:
	•	categoría;
	•	marca;
	•	modelo;
	•	código;
	•	unidad;
	•	costo;
	•	proveedor;
	•	compatibilidad;
	•	capacidad;
	•	dimensiones;
	•	documentación técnica.
17.4 Consumibles
Ejemplos:
	•	adhesivos;
	•	tornillos;
	•	lijas;
	•	pinturas;
	•	solventes;
	•	empaques;
	•	protectores.
17.5 Servicios
Ejemplos:
	•	corte;
	•	enchapado;
	•	perforado;
	•	mecanizado;
	•	pintura;
	•	transporte;
	•	instalación.
17.6 Sustituciones
El sistema podrá sugerir materiales alternativos considerando:
	•	dimensiones;
	•	espesor;
	•	acabado;
	•	disponibilidad;
	•	costo;
	•	compatibilidad;
	•	proveedor;
	•	autorización requerida.
Nunca deberá sustituir silenciosamente un material aprobado.

18. Proveedores
El sistema deberá permitir gestionar:
	•	datos generales;
	•	contactos;
	•	condiciones;
	•	monedas;
	•	tiempos de entrega;
	•	listas de precios;
	•	productos;
	•	ubicaciones;
	•	documentos;
	•	calificaciones;
	•	incidencias;
	•	historial de compras.
18.1 Evaluación
Los proveedores podrán evaluarse por:
	•	precio;
	•	calidad;
	•	cumplimiento;
	•	disponibilidad;
	•	devoluciones;
	•	tiempo de respuesta;
	•	precisión de entrega.

19. Listas de precios
ProyCut deberá permitir:
	•	múltiples listas;
	•	precios por proveedor;
	•	precios por sucursal;
	•	precios por volumen;
	•	monedas diferentes;
	•	vigencias;
	•	descuentos;
	•	historial;
	•	importaciones;
	•	actualizaciones masivas;
	•	comparación.
Todo precio deberá registrar:
	•	fuente;
	•	fecha;
	•	moneda;
	•	unidad;
	•	impuestos incluidos o excluidos;
	•	vigencia;
	•	responsable.

20. Costeo
20.1 Componentes del costo
El costeo podrá incluir:
	•	materiales;
	•	cantos;
	•	herrajes;
	•	consumibles;
	•	mano de obra;
	•	maquinaria;
	•	servicios externos;
	•	transporte;
	•	instalación;
	•	empaque;
	•	desperdicio;
	•	gastos indirectos;
	•	costos administrativos;
	•	contingencia.
20.2 Tipos de costo
El sistema deberá diferenciar:
	•	costo estimado;
	•	costo presupuestado;
	•	costo comprometido;
	•	costo real;
	•	costo pendiente;
	•	costo histórico.
20.3 Mano de obra
Podrá calcularse por:
	•	hora;
	•	operación;
	•	pieza;
	•	lote;
	•	mueble;
	•	proyecto;
	•	tarifa;
	•	centro de trabajo.
20.4 Maquinaria
Podrá considerar:
	•	tiempo;
	•	tarifa;
	•	preparación;
	•	desgaste;
	•	consumo;
	•	operador;
	•	mantenimiento.
20.5 Desperdicio
Podrá calcularse por:
	•	porcentaje;
	•	material;
	•	proceso;
	•	resultado del optimizador;
	•	política empresarial;
	•	historial.
20.6 Costeo por versiones
Cada cálculo deberá conservar:
	•	versión;
	•	fecha;
	•	usuario;
	•	reglas;
	•	precios utilizados;
	•	moneda;
	•	tipo de cambio;
	•	redondeo;
	•	supuestos.

21. Precio y margen
El sistema deberá permitir definir:
	•	margen sobre costo;
	•	margen sobre venta;
	•	utilidad fija;
	•	precio objetivo;
	•	descuento máximo;
	•	comisión;
	•	impuestos;
	•	redondeo comercial.
El usuario deberá poder distinguir:
Costo
Utilidad
Margen
Descuento
Impuestos
Precio final
El sistema deberá advertir:
	•	margen inferior al permitido;
	•	descuento excesivo;
	•	costo incompleto;
	•	precio desactualizado;
	•	moneda inconsistente;
	•	cambios después de una aprobación.

22. Cotizaciones
22.1 Creación
Una cotización podrá generarse desde el proyecto.
Podrá incluir:
	•	conceptos;
	•	cantidades;
	•	precios;
	•	descuentos;
	•	impuestos;
	•	condiciones;
	•	vigencia;
	•	tiempos estimados;
	•	alcance;
	•	exclusiones;
	•	forma de pago;
	•	garantía;
	•	archivos;
	•	imágenes.
22.2 Presentación
El usuario podrá elegir qué mostrar al cliente:
	•	precio global;
	•	precio por mueble;
	•	precio por categoría;
	•	desglose parcial;
	•	opciones;
	•	adicionales;
	•	imágenes;
	•	especificaciones.
Los costos internos nunca deberán exponerse sin autorización explícita.
22.3 Versiones
Cada modificación deberá generar una versión identificable.
El sistema deberá permitir:
	•	comparar versiones;
	•	recuperar versiones;
	•	marcar la versión vigente;
	•	conocer qué cambió;
	•	registrar motivo;
	•	conservar aprobaciones anteriores.
22.4 Opciones
Una cotización podrá presentar:
	•	alternativa económica;
	•	alternativa recomendada;
	•	alternativa premium;
	•	materiales distintos;
	•	alcances distintos;
	•	extras opcionales.
22.5 Estados
Borrador
En revisión
Aprobación interna
Enviada
Vista
En negociación
Aceptada
Rechazada
Vencida
Cancelada

23. Aprobaciones
ProyCut deberá permitir aprobaciones internas y externas.
23.1 Aprobación interna
Podrá requerirse para:
	•	descuentos;
	•	márgenes;
	•	precios;
	•	materiales especiales;
	•	compras extraordinarias;
	•	cambios de alcance;
	•	costos elevados;
	•	producción.
23.2 Aprobación del cliente
El cliente podrá:
	•	aceptar;
	•	rechazar;
	•	solicitar cambios;
	•	comentar;
	•	seleccionar opciones;
	•	confirmar condiciones;
	•	firmar;
	•	adjuntar evidencia.
23.3 Trazabilidad
Toda aprobación deberá registrar:
	•	persona;
	•	fecha;
	•	versión;
	•	contenido aprobado;
	•	método;
	•	comentarios;
	•	evidencia;
	•	dirección o dispositivo cuando sea legalmente apropiado.

24. Contratos, anticipos y pagos
Sin convertirse en un sistema contable completo, ProyCut podrá registrar:
	•	condiciones de pago;
	•	anticipos;
	•	parcialidades;
	•	fechas esperadas;
	•	pagos recibidos;
	•	saldo;
	•	referencias;
	•	comprobantes;
	•	estado.
Los registros financieros deberán distinguir entre:
	•	información operativa;
	•	documento fiscal;
	•	movimiento contable.
La contabilidad formal podrá integrarse con sistemas especializados.

25. Planeación del proyecto
Después de la aprobación, ProyCut deberá convertir el proyecto en un plan ejecutable.
El sistema podrá definir:
	•	entregables;
	•	responsables;
	•	fechas;
	•	hitos;
	•	dependencias;
	•	recursos;
	•	materiales;
	•	compras;
	•	operaciones;
	•	capacidad;
	•	prioridades;
	•	riesgos.
25.1 Hitos
Ejemplos:
	•	diseño aprobado;
	•	anticipo recibido;
	•	materiales confirmados;
	•	corte terminado;
	•	armado terminado;
	•	instalación programada;
	•	entrega completada.
25.2 Alertas
El sistema deberá detectar:
	•	fechas en riesgo;
	•	materiales faltantes;
	•	tareas bloqueadas;
	•	capacidad insuficiente;
	•	aprobación pendiente;
	•	pago pendiente;
	•	dependencia retrasada.

26. Tareas y colaboración
Cada proyecto podrá contener tareas con:
	•	título;
	•	descripción;
	•	responsable;
	•	participantes;
	•	prioridad;
	•	fecha;
	•	estado;
	•	dependencia;
	•	comentarios;
	•	archivos;
	•	checklist;
	•	relación con una etapa.
Estados sugeridos:
Pendiente
En curso
Bloqueada
En revisión
Completada
Cancelada
Las tareas deberán integrarse en el flujo del proyecto, no funcionar como un gestor separado.

27. Inventario
27.1 Existencias
El sistema deberá administrar:
	•	tableros completos;
	•	retazos;
	•	cantos;
	•	herrajes;
	•	consumibles;
	•	producto en proceso;
	•	producto terminado;
	•	materiales reservados.
27.2 Ubicaciones
El inventario podrá organizarse por:
	•	empresa;
	•	sucursal;
	•	almacén;
	•	zona;
	•	pasillo;
	•	estante;
	•	ubicación específica.
27.3 Movimientos
Tipos iniciales:
	•	entrada;
	•	salida;
	•	reserva;
	•	liberación;
	•	transferencia;
	•	ajuste;
	•	consumo;
	•	devolución;
	•	merma;
	•	transformación.
Cada movimiento deberá registrar:
	•	artículo;
	•	cantidad;
	•	unidad;
	•	origen;
	•	destino;
	•	motivo;
	•	proyecto;
	•	usuario;
	•	fecha;
	•	costo;
	•	evidencia.
27.4 Reservas
Los materiales podrán reservarse para un proyecto.
El sistema deberá distinguir:
	•	existencia física;
	•	existencia disponible;
	•	existencia reservada;
	•	existencia comprometida;
	•	existencia en tránsito.
27.5 Retazos
Los retazos deberán registrar:
	•	material;
	•	largo;
	•	ancho;
	•	espesor;
	•	veta;
	•	ubicación;
	•	estado;
	•	origen;
	•	identificador;
	•	imagen opcional.
El optimizador podrá considerar retazos disponibles.

28. Compras
28.1 Necesidades
El sistema deberá calcular necesidades a partir de:
	•	proyecto;
	•	producción;
	•	reservas;
	•	inventario;
	•	mínimos;
	•	desperdicio;
	•	materiales en tránsito.
28.2 Requisiciones
Una requisición podrá contener:
	•	materiales;
	•	cantidades;
	•	fecha requerida;
	•	proyecto;
	•	prioridad;
	•	responsable;
	•	justificación;
	•	aprobación.
28.3 Comparación de proveedores
El sistema podrá comparar:
	•	precio;
	•	disponibilidad;
	•	tiempo;
	•	envío;
	•	mínimos;
	•	condiciones;
	•	calidad histórica.
28.4 Órdenes de compra
Podrán incluir:
	•	proveedor;
	•	artículos;
	•	precios;
	•	impuestos;
	•	moneda;
	•	condiciones;
	•	fechas;
	•	destino;
	•	proyecto;
	•	aprobaciones;
	•	documentos.
28.5 Recepción
Al recibir materiales se podrá registrar:
	•	cantidad recibida;
	•	cantidad faltante;
	•	daño;
	•	lote;
	•	ubicación;
	•	costo;
	•	documento;
	•	evidencia;
	•	devolución.

29. Optimización de corte
29.1 Entrada
El optimizador deberá recibir:
	•	piezas;
	•	cantidades;
	•	dimensiones;
	•	material;
	•	espesor;
	•	veta;
	•	rotación;
	•	tablero disponible;
	•	retazos;
	•	ancho de corte;
	•	márgenes;
	•	restricciones;
	•	prioridad.
29.2 Resultado
Deberá producir:
	•	planos de corte;
	•	tableros requeridos;
	•	distribución de piezas;
	•	desperdicio;
	•	aprovechamiento;
	•	secuencia;
	•	retazos resultantes;
	•	advertencias;
	•	piezas no ubicadas;
	•	métricas;
	•	versión del algoritmo.
29.3 Modos
Podrán existir:
	•	optimización por proyecto;
	•	optimización por material;
	•	optimización combinada;
	•	optimización por lote;
	•	optimización con inventario;
	•	optimización para centro de corte.
29.4 Edición manual
El usuario podrá:
	•	mover piezas;
	•	rotar cuando esté permitido;
	•	bloquear posiciones;
	•	cambiar tablero;
	•	excluir piezas;
	•	agregar cortes;
	•	recalcular.
Todo ajuste manual deberá conservarse y diferenciarse del resultado automático.
29.5 Comparación
El sistema podrá comparar soluciones por:
	•	desperdicio;
	•	número de tableros;
	•	tiempo de corte;
	•	complejidad;
	•	retazos recuperables;
	•	costo.

30. Etiquetas
El sistema podrá generar etiquetas para:
	•	piezas;
	•	tableros;
	•	retazos;
	•	paquetes;
	•	muebles;
	•	órdenes;
	•	materiales.
Las etiquetas podrán incluir:
	•	proyecto;
	•	cliente;
	•	mueble;
	•	pieza;
	•	dimensiones;
	•	material;
	•	canto;
	•	operación siguiente;
	•	código QR;
	•	código de barras;
	•	orientación;
	•	prioridad.
Las plantillas deberán ser configurables.

31. Producción
31.1 Órdenes de producción
Una orden podrá agrupar trabajo por:
	•	proyecto;
	•	mueble;
	•	lote;
	•	material;
	•	operación;
	•	fecha;
	•	centro de trabajo.
31.2 Operaciones
Ejemplos:
	•	corte;
	•	seccionado;
	•	enchapado;
	•	perforado;
	•	mecanizado;
	•	lijado;
	•	pintura;
	•	armado;
	•	inspección;
	•	empaque;
	•	carga.
31.3 Ruta de fabricación
Cada pieza o conjunto podrá tener una secuencia de operaciones.
Corte
  │
  ▼
Enchapado
  │
  ▼
Mecanizado
  │
  ▼
Armado
  │
  ▼
Inspección
31.4 Seguimiento
Los operadores podrán registrar:
	•	inicio;
	•	pausa;
	•	reanudación;
	•	terminación;
	•	cantidad;
	•	tiempo;
	•	desperdicio;
	•	incidencia;
	•	material consumido;
	•	evidencia.
31.5 Estados
Pendiente
Preparación
En proceso
Pausada
Bloqueada
En revisión
Terminada
Cancelada

32. Capacidad y programación
El sistema podrá apoyar la programación considerando:
	•	centros de trabajo;
	•	maquinaria;
	•	personal;
	•	turnos;
	•	capacidad;
	•	duración estimada;
	•	mantenimiento;
	•	prioridades;
	•	dependencias;
	•	fechas comprometidas.
La programación deberá poder mostrar:
	•	carga;
	•	saturación;
	•	disponibilidad;
	•	cuellos de botella;
	•	proyectos en riesgo;
	•	alternativas.

33. Control de calidad
ProyCut deberá permitir definir puntos de inspección.
33.1 Inspecciones
Podrán evaluar:
	•	dimensiones;
	•	acabado;
	•	perforaciones;
	•	cantos;
	•	cantidad;
	•	funcionamiento;
	•	empaque;
	•	instalación.
33.2 Resultado
Una inspección podrá ser:
	•	aprobada;
	•	aprobada con observaciones;
	•	rechazada;
	•	requiere retrabajo.
33.3 No conformidades
Se deberá registrar:
	•	problema;
	•	causa;
	•	responsable;
	•	pieza;
	•	operación;
	•	evidencia;
	•	acción;
	•	costo;
	•	resolución.

34. Incidencias y retrabajos
El sistema deberá registrar:
	•	piezas dañadas;
	•	errores de medida;
	•	material incorrecto;
	•	faltantes;
	•	problemas de maquinaria;
	•	errores de diseño;
	•	errores de producción;
	•	daños en transporte;
	•	problemas de instalación.
Cada incidencia podrá generar:
	•	bloqueo;
	•	tarea;
	•	nueva pieza;
	•	consumo;
	•	compra;
	•	costo adicional;
	•	ajuste de fecha;
	•	análisis de causa.

35. Empaque y preparación de entrega
ProyCut podrá:
	•	agrupar piezas por mueble;
	•	definir paquetes;
	•	generar listas;
	•	verificar contenido;
	•	imprimir etiquetas;
	•	registrar protección;
	•	registrar peso y dimensiones;
	•	asociar fotografías;
	•	marcar paquetes completos;
	•	preparar carga.

36. Entrega e instalación
36.1 Programación
El sistema deberá permitir:
	•	definir fecha;
	•	asignar equipo;
	•	asignar vehículo;
	•	registrar dirección;
	•	calcular requisitos;
	•	preparar checklist;
	•	informar al cliente.
36.2 Instalación
El equipo podrá consultar:
	•	planos;
	•	piezas;
	•	paquetes;
	•	herrajes;
	•	instrucciones;
	•	contactos;
	•	observaciones;
	•	tareas.
36.3 Evidencias
Se podrán registrar:
	•	fotografías;
	•	firma;
	•	ubicación;
	•	hora;
	•	observaciones;
	•	faltantes;
	•	daños;
	•	aceptación.
36.4 Cierre
La entrega podrá quedar:
	•	completa;
	•	parcial;
	•	rechazada;
	•	pendiente de corrección;
	•	pendiente de firma.

37. Postventa y garantías
El sistema podrá registrar:
	•	garantía;
	•	solicitud;
	•	problema;
	•	prioridad;
	•	diagnóstico;
	•	visita;
	•	reparación;
	•	piezas;
	•	costos;
	•	resolución;
	•	satisfacción.
Cada solicitud deberá relacionarse con:
	•	proyecto;
	•	cliente;
	•	entrega;
	•	mueble;
	•	pieza cuando corresponda.

38. Documentos
ProyCut podrá generar y administrar:
	•	cotizaciones;
	•	órdenes de compra;
	•	órdenes de producción;
	•	listas de corte;
	•	etiquetas;
	•	planos;
	•	fichas técnicas;
	•	contratos;
	•	entregas;
	•	garantías;
	•	reportes;
	•	comprobantes;
	•	listas de materiales.
Cada documento deberá registrar:
	•	tipo;
	•	número;
	•	versión;
	•	fecha;
	•	responsable;
	•	proyecto;
	•	estado;
	•	archivo;
	•	firma;
	•	historial.

39. Archivos
Los usuarios podrán adjuntar:
	•	imágenes;
	•	PDF;
	•	hojas de cálculo;
	•	modelos;
	•	planos;
	•	contratos;
	•	comprobantes;
	•	fichas;
	•	videos.
Los archivos deberán poder:
	•	clasificarse;
	•	vincularse a un proyecto;
	•	vincularse a una pieza o mueble;
	•	versionarse;
	•	comentarse;
	•	protegerse;
	•	auditarse.

40. Comentarios y comunicación
El sistema podrá permitir conversaciones contextuales sobre:
	•	proyecto;
	•	cotización;
	•	mueble;
	•	pieza;
	•	tarea;
	•	compra;
	•	orden;
	•	incidencia.
Los comentarios podrán:
	•	mencionar usuarios;
	•	adjuntar archivos;
	•	generar notificaciones;
	•	resolverse;
	•	conservar historial.

41. Notificaciones
El usuario podrá recibir notificaciones por eventos como:
	•	asignación;
	•	comentario;
	•	aprobación requerida;
	•	cotización aceptada;
	•	material faltante;
	•	compra retrasada;
	•	producción bloqueada;
	•	fecha próxima;
	•	entrega programada;
	•	incidencia;
	•	pago pendiente.
Los canales podrán incluir:
	•	notificación interna;
	•	correo;
	•	aplicación móvil;
	•	mensajería externa mediante integración.
Cada usuario podrá configurar preferencias dentro de los límites de seguridad.

42. Calendario
El calendario podrá mostrar:
	•	visitas;
	•	levantamientos;
	•	entregas;
	•	instalaciones;
	•	tareas;
	•	compras;
	•	producción;
	•	mantenimientos;
	•	vencimientos;
	•	pagos esperados.
Los eventos deberán conservar su relación con el proyecto.

43. Búsqueda
ProyCut deberá ofrecer búsqueda por:
	•	proyecto;
	•	cliente;
	•	contacto;
	•	cotización;
	•	pieza;
	•	material;
	•	proveedor;
	•	orden;
	•	documento;
	•	etiqueta;
	•	código;
	•	comentario.
La búsqueda deberá respetar permisos y contexto empresarial.

44. Filtros y vistas
Los usuarios podrán filtrar información por:
	•	estado;
	•	responsable;
	•	fecha;
	•	cliente;
	•	proyecto;
	•	prioridad;
	•	sucursal;
	•	almacén;
	•	etapa;
	•	material;
	•	proveedor.
Podrán guardarse vistas personales o compartidas.

45. Dashboard
El dashboard deberá mostrar información accionable, no decoración.
Podrá incluir:
	•	proyectos en riesgo;
	•	cotizaciones pendientes;
	•	ventas;
	•	margen;
	•	producción;
	•	compras;
	•	materiales faltantes;
	•	entregas próximas;
	•	bloqueos;
	•	tareas;
	•	capacidad;
	•	alertas.
El contenido dependerá del rol.

46. Reportes
46.1 Comerciales
	•	oportunidades;
	•	conversión;
	•	cotizaciones;
	•	ventas;
	•	clientes;
	•	descuentos;
	•	tiempos de cierre.
46.2 Financieros operativos
	•	costos;
	•	precios;
	•	márgenes;
	•	desviaciones;
	•	rentabilidad;
	•	compras;
	•	inventario valorizado.
46.3 Producción
	•	avance;
	•	tiempos;
	•	eficiencia;
	•	retrabajo;
	•	desperdicio;
	•	carga;
	•	cumplimiento.
46.4 Materiales
	•	consumo;
	•	desperdicio;
	•	rotación;
	•	faltantes;
	•	retazos;
	•	proveedores.
46.5 Proyectos
	•	estado;
	•	duración;
	•	retrasos;
	•	responsables;
	•	rentabilidad;
	•	incidencias.
Cada reporte deberá explicar:
	•	fuente;
	•	periodo;
	•	filtros;
	•	moneda;
	•	unidades;
	•	fecha de actualización.

47. Exportaciones
El sistema podrá exportar, según permisos:
	•	PDF;
	•	CSV;
	•	XLSX;
	•	imágenes;
	•	formatos de corte;
	•	formatos de etiquetas;
	•	archivos de integración.
Las exportaciones deberán:
	•	respetar filtros;
	•	indicar fecha;
	•	registrar responsable;
	•	evitar exposición no autorizada;
	•	conservar unidades y moneda.

48. Importaciones
ProyCut podrá importar:
	•	clientes;
	•	materiales;
	•	precios;
	•	proveedores;
	•	piezas;
	•	inventarios;
	•	proyectos;
	•	listas de corte.
Toda importación deberá incluir:
	1	vista previa;
	2	validación;
	3	detección de duplicados;
	4	reporte de errores;
	5	confirmación;
	6	posibilidad de reversión cuando sea viable.

49. Portal del cliente
El cliente podrá acceder, de forma controlada, a:
	•	cotizaciones;
	•	opciones;
	•	documentos;
	•	comentarios;
	•	aprobaciones;
	•	avances;
	•	fechas;
	•	entregas;
	•	garantías.
El cliente no deberá ver:
	•	costos internos;
	•	márgenes;
	•	proveedores;
	•	información de otros clientes;
	•	notas internas;
	•	procesos no autorizados.

50. Centros de corte y fabricación externa
ProyCut podrá ofrecer funciones específicas para centros de servicio.
Podrán:
	•	recibir solicitudes;
	•	validar archivos;
	•	cotizar servicios;
	•	optimizar;
	•	asignar materiales;
	•	producir etiquetas;
	•	registrar avance;
	•	preparar entrega;
	•	informar al cliente.
Una empresa podrá actuar como:
	•	fabricante;
	•	centro de corte;
	•	proveedor de servicios;
	•	combinación de los anteriores.

51. Inteligencia artificial en el producto
La IA podrá participar como asistente en tareas concretas.
51.1 Asistencia comercial
Podrá:
	•	resumir requerimientos;
	•	detectar información faltante;
	•	sugerir preguntas;
	•	preparar descripciones;
	•	explicar opciones.
51.2 Asistencia técnica
Podrá:
	•	detectar inconsistencias;
	•	advertir medidas faltantes;
	•	sugerir materiales compatibles;
	•	explicar errores;
	•	comparar alternativas.
51.3 Asistencia de costos
Podrá:
	•	detectar precios desactualizados;
	•	señalar costos omitidos;
	•	explicar variaciones;
	•	identificar márgenes inusuales.
51.4 Asistencia de producción
Podrá:
	•	resumir bloqueos;
	•	identificar riesgos;
	•	sugerir prioridades;
	•	explicar retrasos;
	•	encontrar patrones de retrabajo.
51.5 Condiciones obligatorias
Toda recomendación deberá:
	•	mostrar su naturaleza sugerida;
	•	indicar datos utilizados;
	•	explicar supuestos;
	•	respetar permisos;
	•	permitir revisión;
	•	evitar acciones destructivas;
	•	conservar trazabilidad.

52. Automatizaciones
ProyCut podrá automatizar acciones como:
	•	cambiar etapas tras eventos válidos;
	•	generar tareas;
	•	enviar recordatorios;
	•	crear requisiciones;
	•	notificar faltantes;
	•	preparar documentos;
	•	actualizar indicadores;
	•	solicitar aprobaciones.
Las automatizaciones deberán:
	•	ser visibles;
	•	ser configurables;
	•	registrar su ejecución;
	•	manejar errores;
	•	permitir desactivación;
	•	no ocultar decisiones críticas.

53. Auditoría
El sistema deberá registrar acciones relevantes:
	•	creación;
	•	modificación;
	•	eliminación;
	•	aprobación;
	•	cambio de precio;
	•	cambio de costo;
	•	cambio de permisos;
	•	movimiento de inventario;
	•	transición de estado;
	•	exportación sensible;
	•	acceso administrativo.
El registro deberá indicar:
	•	quién;
	•	cuándo;
	•	qué cambió;
	•	valor anterior;
	•	valor nuevo;
	•	contexto;
	•	origen.

54. Historial y recuperación
ProyCut deberá conservar historial cuando sea necesario para:
	•	proyectos;
	•	cotizaciones;
	•	costos;
	•	documentos;
	•	diseños;
	•	configuraciones;
	•	estados;
	•	permisos;
	•	listas de precios.
Las funciones de recuperación podrán incluir:
	•	deshacer;
	•	restaurar versión;
	•	recuperar borrador;
	•	recuperar archivo;
	•	reabrir proyecto;
	•	revertir importación.

55. Integraciones
Posibles categorías:
	•	contabilidad;
	•	facturación;
	•	comercio electrónico;
	•	pagos;
	•	almacenamiento;
	•	correo;
	•	mensajería;
	•	calendarios;
	•	maquinaria;
	•	software CAD;
	•	optimizadores;
	•	logística;
	•	proveedores;
	•	catálogos.
Toda integración deberá:
	•	estar desacoplada;
	•	normalizar datos;
	•	manejar fallos;
	•	registrar sincronizaciones;
	•	evitar duplicados;
	•	permitir reintentos;
	•	mostrar su estado.

56. Suscripciones y facturación SaaS
ProyCut podrá administrar:
	•	planes;
	•	periodos;
	•	usuarios incluidos;
	•	límites;
	•	funciones disponibles;
	•	pruebas;
	•	renovaciones;
	•	facturas del servicio;
	•	métodos de pago;
	•	suspensión;
	•	reactivación.
La suspensión no deberá provocar pérdida inmediata de información.

57. Aplicación móvil
Las funciones móviles prioritarias podrán incluir:
	•	consulta de proyectos;
	•	fotografías;
	•	levantamientos;
	•	tareas;
	•	inventario;
	•	producción;
	•	incidencias;
	•	etiquetas;
	•	instalación;
	•	firmas;
	•	notificaciones.
No todas las funciones de escritorio deberán replicarse en móvil.
La experiencia deberá adaptarse al contexto operativo.

58. Modo sin conexión
Para actividades de campo, el sistema podrá permitir trabajo limitado sin conexión.
Ejemplos:
	•	consultar datos previamente sincronizados;
	•	capturar medidas;
	•	tomar fotografías;
	•	completar checklists;
	•	registrar avances;
	•	capturar firmas.
Al recuperar conexión deberá:
	•	sincronizar;
	•	detectar conflictos;
	•	informar errores;
	•	evitar duplicados;
	•	conservar evidencia.

59. Internacionalización
ProyCut deberá soportar:
	•	idiomas;
	•	monedas;
	•	impuestos;
	•	zonas horarias;
	•	unidades;
	•	formatos de fecha;
	•	formatos numéricos;
	•	direcciones;
	•	documentos regionales.
La conversión de unidades y monedas deberá ser explícita.

60. Accesibilidad
Las funciones deberán considerar:
	•	navegación por teclado;
	•	contraste;
	•	lectores de pantalla;
	•	etiquetas;
	•	estados visibles;
	•	tamaño de objetivos;
	•	mensajes comprensibles;
	•	alternativas a información únicamente visual.

61. Ayuda y aprendizaje
ProyCut deberá enseñar dentro del flujo.
Podrá incluir:
	•	explicaciones contextuales;
	•	ejemplos;
	•	asistentes de configuración;
	•	recomendaciones;
	•	validaciones educativas;
	•	recorridos;
	•	documentación;
	•	centro de ayuda.
El usuario no deberá depender de un manual para ejecutar tareas esenciales.

62. Estados vacíos
Cuando no exista información, el sistema deberá explicar:
	•	qué representa el espacio;
	•	por qué está vacío;
	•	qué acción puede realizarse;
	•	qué ocurrirá después.
Ejemplo:
Aún no hay materiales asignados. Agrega las piezas del mueble o selecciona un material para comenzar el costeo.

63. Alertas
Las alertas deberán clasificarse por severidad:
Informativa
No requiere acción inmediata.
Recomendación
Sugiere una mejora.
Advertencia
Existe riesgo.
Bloqueo
La operación no puede continuar.
Crítica
Existe riesgo de pérdida, seguridad o incumplimiento grave.
Toda alerta deberá explicar:
	•	qué ocurrió;
	•	impacto;
	•	acción recomendada;
	•	si puede ignorarse;
	•	quién puede resolverla.

64. Funcionalidades esenciales del MVP
La primera versión utilizable deberá concentrarse en el flujo central.
Núcleo MVP
	•	registro de empresa;
	•	usuarios y permisos básicos;
	•	clientes;
	•	proyectos;
	•	muebles;
	•	piezas;
	•	materiales;
	•	precios;
	•	costeo;
	•	margen;
	•	cotizaciones;
	•	versiones;
	•	aprobación;
	•	optimización;
	•	planos de corte;
	•	etiquetas;
	•	inventario básico;
	•	órdenes de producción;
	•	seguimiento básico;
	•	documentos;
	•	auditoría esencial.
Fuera del MVP inicial
Podrán aplazarse:
	•	contabilidad completa;
	•	programación avanzada;
	•	mantenimiento industrial;
	•	logística compleja;
	•	IA autónoma;
	•	CAD avanzado;
	•	nómina;
	•	CRM general;
	•	microservicios;
	•	marketplace;
	•	comercio electrónico completo.

65. Criterios de prioridad
Una funcionalidad tendrá mayor prioridad cuando:
	•	reduzca incertidumbre crítica;
	•	complete el flujo principal;
	•	evite trabajo manual repetitivo;
	•	prevenga pérdidas;
	•	proteja datos;
	•	habilite ingresos;
	•	sea necesaria para fabricar;
	•	beneficie a muchos usuarios;
	•	permita validar el producto.
Una funcionalidad tendrá menor prioridad cuando:
	•	sea principalmente decorativa;
	•	duplique otra herramienta;
	•	no tenga usuario definido;
	•	no resuelva un problema comprobado;
	•	aumente complejidad desproporcionadamente;
	•	dependa de procesos aún no definidos.

66. Lo que ProyCut no deberá convertirse
ProyCut no deberá intentar ser, por sí solo:
	•	un sistema contable universal;
	•	una plataforma genérica de recursos humanos;
	•	un gestor de redes sociales;
	•	un CRM sin relación con proyectos;
	•	un sistema de nómina;
	•	un editor gráfico general;
	•	un CAD industrial universal;
	•	una tienda en línea genérica;
	•	un gestor de proyectos para cualquier industria;
	•	una plataforma de inteligencia artificial sin enfoque.
Podrá integrarse con herramientas especializadas.
No deberá perder su propósito intentando reemplazarlas.

67. Regla para nuevas funcionalidades
Toda propuesta deberá documentar:
Problema
¿Qué problema real resuelve?
Usuario
¿Quién lo experimenta?
Etapa
¿Dónde aparece en el ciclo del proyecto?
Entrada
¿Qué información necesita?
Salida
¿Qué resultado produce?
Decisión
¿Qué decisión facilita?
Riesgo
¿Qué puede salir mal?
Permisos
¿Quién puede utilizarla?
Métrica
¿Cómo sabremos que genera valor?
Coherencia
¿Cómo reduce incertidumbre y hace que ProyCut sea más ProyCut?

68. Plantilla de especificación funcional
Nombre:

Descripción:

Problema:

Usuarios:

Etapa del proyecto:

Precondiciones:

Flujo principal:

Flujos alternativos:

Entradas:

Salidas:

Reglas de negocio:

Estados:

Permisos:

Errores:

Alertas:

Eventos:

Datos generados:

Documentos relacionados:

Dependencias:

Criterios de aceptación:

Métricas:

Fuera de alcance:

69. Criterios de aceptación generales
Toda funcionalidad deberá:
	•	tener un objetivo comprensible;
	•	proteger los datos;
	•	respetar permisos;
	•	mostrar estados;
	•	manejar errores;
	•	conservar trazabilidad;
	•	permitir validación;
	•	integrarse con el proyecto;
	•	evitar capturas duplicadas;
	•	utilizar lenguaje claro;
	•	documentarse;
	•	incluir pruebas;
	•	funcionar con datos incompletos de forma segura;
	•	indicar incertidumbre;
	•	ser utilizable sin conocimientos técnicos avanzados.

70. Indicadores de éxito del producto
ProyCut deberá medir si sus funciones logran:
	•	reducir tiempo de cotización;
	•	reducir errores de medida;
	•	reducir desperdicio;
	•	mejorar precisión de costos;
	•	mejorar margen;
	•	disminuir retrabajos;
	•	reducir retrasos;
	•	aumentar proyectos entregados a tiempo;
	•	mejorar trazabilidad;
	•	reducir capturas duplicadas;
	•	acelerar aprendizaje;
	•	aumentar confianza del usuario.
Las métricas deberán utilizarse para mejorar el producto, no para complicar el trabajo.

71. Checklist funcional
Antes de aprobar una funcionalidad:
	•	Resuelve un problema real. 
	•	Tiene un usuario identificado. 
	•	Pertenece a una etapa del proyecto. 
	•	Tiene entradas y salidas claras. 
	•	Reduce incertidumbre. 
	•	Facilita una decisión. 
	•	Evita trabajo repetido. 
	•	Respeta permisos. 
	•	Conserva trazabilidad. 
	•	Maneja estados vacíos. 
	•	Maneja errores. 
	•	Explica alertas. 
	•	Protege información sensible. 
	•	No duplica otra capacidad. 
	•	No convierte ProyCut en un sistema genérico. 
	•	Puede medirse. 
	•	Puede probarse. 
	•	Puede documentarse. 
	•	Se integra con el ciclo del proyecto. 
	•	Hace que ProyCut sea más ProyCut. 

72. Regla final
Una funcionalidad no es valiosa por todo lo que permite hacer, sino por la incertidumbre que elimina.
ProyCut no deberá competir por tener más botones, más menús o más módulos.
Deberá competir por hacer que el trabajo sea:
	•	más claro;
	•	más rápido;
	•	más preciso;
	•	más rentable;
	•	más confiable.
El usuario no deberá sentir que utiliza muchas herramientas.
Deberá sentir que su proyecto avanza.
Desde la primera idea hasta la entrega final.
