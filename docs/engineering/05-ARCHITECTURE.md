# 05-ARCHITECTURE.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-01

## Propósito
Definir la arquitectura técnica única de ProyCut: capas, dominio, módulos y reglas de dependencia.

## Depende de
`docs/vision/03-PROYCUT-BLUEPRINT.md`

## Referenciado por
`docs/engineering/04-AI-RULES.md` (secciones 11 y 23)

## Responsable
PENDIENTE

---

05-ARCHITECTURE.md
Arquitectura Técnica de ProyCut

1. Propósito del documento
Este documento define la arquitectura técnica de ProyCut.
Su objetivo es establecer una estructura estable para construir, mantener y evolucionar el sistema sin depender de una tecnología específica.
La arquitectura deberá permitir:
	•	desarrollar módulos de forma independiente;
	•	proteger las reglas del negocio;
	•	sustituir proveedores externos;
	•	reducir el acoplamiento;
	•	facilitar pruebas;
	•	conservar la claridad del código;
	•	escalar equipos y funcionalidades;
	•	evitar reescrituras completas.
La arquitectura no existe para hacer el proyecto más sofisticado.
Existe para que ProyCut pueda crecer sin perder claridad, estabilidad ni identidad.

2. Principio central
El Proyecto es el centro funcional de ProyCut, pero el Dominio es el centro técnico del sistema.
El Proyecto conecta la experiencia del usuario.
El Dominio protege las reglas que hacen posible esa experiencia.
Todo módulo deberá diseñarse considerando ambas ideas:
	•	qué valor aporta al ciclo de vida del proyecto;
	•	qué reglas de negocio necesita proteger.

3. Arquitectura por capas
ProyCut se organizará mediante cinco capas principales:
Presentación
     │
     ▼
Aplicación
     │
     ▼
Dominio
     ▲
     │
Infraestructura

Plataforma
La capa de Plataforma ofrece capacidades transversales a todas las demás.
La Infraestructura implementa contratos definidos por las capas internas.
El Dominio no conoce tecnologías, frameworks ni proveedores.

4. Capa de Presentación
La capa de Presentación contiene todo aquello con lo que interactúa el usuario.
Incluye:
	•	páginas;
	•	vistas;
	•	componentes;
	•	formularios;
	•	tablas;
	•	diálogos;
	•	navegación;
	•	visualizaciones;
	•	estados de carga;
	•	estados vacíos;
	•	mensajes de error;
	•	accesibilidad.
Su responsabilidad es:
	•	mostrar información;
	•	capturar acciones;
	•	representar estados;
	•	invocar casos de uso;
	•	comunicar resultados.
La Presentación no deberá:
	•	calcular costos;
	•	decidir permisos;
	•	modificar inventarios;
	•	validar reglas críticas;
	•	ejecutar consultas directas;
	•	contener lógica de fabricación;
	•	acceder directamente a proveedores externos.

5. Capa de Aplicación
La capa de Aplicación coordina los casos de uso del sistema.
Ejemplos:
	•	crear un proyecto;
	•	generar una cotización;
	•	aprobar una orden;
	•	reservar materiales;
	•	iniciar producción;
	•	cerrar un proyecto;
	•	emitir una factura;
	•	ejecutar una optimización.
La Aplicación deberá:
	•	recibir una solicitud;
	•	validar el contexto;
	•	verificar permisos;
	•	cargar información mediante contratos;
	•	invocar reglas del dominio;
	•	coordinar operaciones;
	•	persistir resultados;
	•	publicar eventos;
	•	devolver una respuesta.
La Aplicación no deberá:
	•	contener componentes visuales;
	•	ejecutar SQL directamente;
	•	depender de SDK externos;
	•	duplicar reglas del dominio;
	•	conocer detalles de almacenamiento;
	•	definir decisiones estratégicas del negocio.

6. Capa de Dominio
La capa de Dominio contiene el conocimiento esencial de ProyCut.
Aquí viven:
	•	entidades;
	•	objetos de valor;
	•	reglas;
	•	políticas;
	•	estados;
	•	invariantes;
	•	cálculos;
	•	eventos de dominio;
	•	contratos necesarios para operar.
El Dominio debe poder funcionar sin:
	•	interfaz gráfica;
	•	conexión a internet;
	•	base de datos real;
	•	proveedor de inteligencia artificial;
	•	proveedor de pagos;
	•	framework web.
Esto permite probar las reglas principales de forma aislada y determinista.

7. Capa de Infraestructura
La Infraestructura conecta ProyCut con sistemas externos.
Incluye:
	•	persistencia;
	•	base de datos;
	•	almacenamiento de archivos;
	•	servicios de correo;
	•	pagos;
	•	inteligencia artificial;
	•	APIs;
	•	colas;
	•	proveedores de autenticación;
	•	analítica;
	•	impresión;
	•	integraciones externas.
La Infraestructura deberá implementar contratos definidos en las capas internas.
Ejemplo:
Dominio o Aplicación
        │
        ▼
ProjectRepository
        ▲
        │
SupabaseProjectRepository
El contrato pertenece al sistema.
La implementación pertenece a la Infraestructura.

8. Capa de Plataforma
La Plataforma contiene capacidades compartidas por todo el sistema.
Incluye:
	•	autenticación;
	•	autorización;
	•	contexto empresarial;
	•	configuración;
	•	auditoría;
	•	observabilidad;
	•	registros;
	•	manejo de errores;
	•	internacionalización;
	•	unidades;
	•	monedas;
	•	fechas;
	•	notificaciones;
	•	caché;
	•	tareas asíncronas;
	•	feature flags.
Estas capacidades deberán exponerse mediante interfaces estables y claramente documentadas.

9. Regla de dependencias
Las dependencias deberán apuntar hacia las reglas internas del sistema.
La capa externa puede conocer a la interna.
La interna no puede conocer a la externa.
Permitido:
Presentación → Aplicación
Aplicación → Dominio
Infraestructura → Aplicación
Infraestructura → Dominio
Prohibido:
Dominio → React
Dominio → Supabase
Dominio → Stripe
Dominio → OpenAI
Aplicación → componente visual
Aplicación → consulta SQL concreta
La Infraestructura puede depender de contratos internos para implementarlos.
El Dominio nunca deberá depender de implementaciones externas.

10. Arquitectura modular
ProyCut se dividirá por dominios funcionales.
Estructura inicial:
src/
├── modules/
│   ├── projects/
│   ├── clients/
│   ├── materials/
│   ├── costing/
│   ├── quotations/
│   ├── optimization/
│   ├── inventory/
│   ├── purchasing/
│   ├── production/
│   ├── deliveries/
│   ├── reports/
│   ├── billing/
│   └── ai/
│
├── platform/
├── shared/
└── app/
Cada módulo representa una capacidad real del negocio.
No se crearán módulos únicamente por razones técnicas.

11. Estructura interna de un módulo
Todos los módulos deberán seguir una estructura consistente.
Ejemplo para projects:
modules/
└── projects/
    ├── domain/
    │   ├── entities/
    │   ├── value-objects/
    │   ├── services/
    │   ├── policies/
    │   ├── events/
    │   ├── repositories/
    │   ├── errors/
    │   └── index.ts
    │
    ├── application/
    │   ├── commands/
    │   ├── queries/
    │   ├── use-cases/
    │   ├── dto/
    │   ├── mappers/
    │   ├── ports/
    │   └── index.ts
    │
    ├── infrastructure/
    │   ├── persistence/
    │   ├── integrations/
    │   ├── adapters/
    │   ├── mappers/
    │   └── index.ts
    │
    ├── presentation/
    │   ├── pages/
    │   ├── components/
    │   ├── hooks/
    │   ├── forms/
    │   ├── view-models/
    │   └── index.ts
    │
    ├── tests/
    │   ├── unit/
    │   ├── integration/
    │   └── fixtures/
    │
    └── README.md
No todas las carpetas deberán existir desde el inicio.
Solo se crearán cuando exista una responsabilidad real que las justifique.

12. Dominio de un módulo
La carpeta domain contiene las reglas centrales del módulo.
Debe ser la parte más estable.
Ejemplo:
projects/domain/
├── entities/
│   ├── Project.ts
│   └── ProjectStage.ts
├── value-objects/
│   ├── ProjectId.ts
│   ├── ProjectName.ts
│   └── ProjectStatus.ts
├── policies/
│   └── ProjectTransitionPolicy.ts
├── events/
│   ├── ProjectCreated.ts
│   └── ProjectCompleted.ts
├── repositories/
│   └── ProjectRepository.ts
└── errors/
    └── InvalidProjectTransitionError.ts
La carpeta domain no deberá importar código desde:
	•	presentation;
	•	infrastructure;
	•	frameworks;
	•	SDK externos;
	•	clientes HTTP;
	•	bibliotecas de interfaz.

13. Entidades
Una entidad representa un concepto del negocio con identidad propia.
Ejemplos:
	•	Proyecto;
	•	Cliente;
	•	Pieza;
	•	Material;
	•	Cotización;
	•	Orden de producción;
	•	Movimiento de inventario.
Una entidad deberá proteger sus reglas internas.
Ejemplo conceptual:
class Project {
  complete(): void {
    if (!this.canBeCompleted()) {
      throw new InvalidProjectTransitionError();
    }

    this.status = ProjectStatus.Completed;
  }
}
No deberá permitirse cambiar estados críticos mediante asignaciones arbitrarias.
Incorrecto:
project.status = "completed";
Correcto:
project.complete();
La entidad debe expresar la intención del negocio.

14. Objetos de valor
Un objeto de valor representa un concepto sin identidad propia.
Ejemplos:
	•	dinero;
	•	moneda;
	•	dimensión;
	•	porcentaje;
	•	cantidad;
	•	unidad;
	•	dirección;
	•	intervalo de fechas;
	•	color;
	•	espesor.
Un objeto de valor deberá:
	•	validarse al crearse;
	•	ser inmutable cuando sea posible;
	•	encapsular su comportamiento;
	•	evitar combinaciones inválidas.
Ejemplo:
Money.create(1500, "MXN");
Dimension.create(18, "mm");
Percentage.create(12.5);
No se utilizarán números sin contexto para representar cantidades críticas.
Incorrecto:
const price = 1500;
const thickness = 18;
Correcto:
const price = Money.create(1500, "MXN");
const thickness = Dimension.create(18, "mm");

15. Servicios de dominio
Un servicio de dominio contendrá una regla que no pertenece naturalmente a una sola entidad.
Ejemplos:
	•	calcular el costo total de un proyecto;
	•	determinar la viabilidad de fabricación;
	•	asignar materiales a piezas;
	•	evaluar desperdicio;
	•	calcular necesidades de compra.
Los servicios de dominio deberán trabajar con conceptos del negocio.
No deberán ejecutar consultas, mostrar interfaces ni llamar proveedores externos directamente.

16. Políticas
Una política representa una decisión del negocio que puede variar según el contexto.
Ejemplos:
	•	política de margen;
	•	política de desperdicio;
	•	política de aprobación;
	•	política de redondeo;
	•	política de reserva de inventario;
	•	política de transición de estados.
Las políticas deberán ser explícitas.
No deberán estar escondidas dentro de condicionales dispersos.

17. Eventos de dominio
Un evento de dominio representa algo relevante que ya ocurrió.
Ejemplos:
	•	ProjectCreated;
	•	QuotationApproved;
	•	InventoryReserved;
	•	OptimizationCompleted;
	•	ProductionStarted;
	•	ProjectDelivered.
Los eventos deberán expresarse en pasado.
Un evento no es una orden.
Es un hecho.
Los eventos permiten que distintos módulos reaccionen sin crear dependencias directas.
Ejemplo:
QuotationApproved
        │
        ├── reserva inventario
        ├── genera orden de producción
        ├── registra auditoría
        └── envía notificación

18. Repositorios
Un repositorio representa el contrato mediante el cual el sistema obtiene o guarda entidades.
Ejemplo:
interface ProjectRepository {
  findById(projectId: ProjectId): Promise<Project | null>;
  save(project: Project): Promise<void>;
}
El contrato deberá vivir en una capa interna.
La implementación deberá vivir en Infraestructura.
Ejemplo:
domain/repositories/ProjectRepository.ts
infrastructure/persistence/SupabaseProjectRepository.ts
Los repositorios no deberán devolver estructuras específicas del proveedor.
Incorrecto:
Promise<SupabaseResponse<ProjectRow>>
Correcto:
Promise<Project | null>

19. Casos de uso
Un caso de uso representa una acción completa que ProyCut puede ejecutar.
Ejemplos:
	•	CreateProject;
	•	UpdateProjectMeasurements;
	•	ApproveQuotation;
	•	ReserveProjectMaterials;
	•	GenerateCutOptimization;
	•	StartProduction;
	•	CompleteDelivery.
Cada caso de uso deberá:
	1	recibir una entrada explícita;
	2	validar autorización;
	3	obtener dependencias;
	4	ejecutar reglas;
	5	guardar resultados;
	6	publicar eventos;
	7	devolver una respuesta clara.
Ejemplo:
type CreateProjectInput = {
  companyId: string;
  clientId: string;
  name: string;
};

type CreateProjectOutput = {
  projectId: string;
};

20. Commands y Queries
Cuando resulte útil, ProyCut separará las operaciones que modifican información de las que solo consultan.
Command
Solicita un cambio.
Ejemplos:
	•	crear proyecto;
	•	aprobar cotización;
	•	reservar material;
	•	cerrar orden.
Query
Solicita información.
Ejemplos:
	•	obtener resumen del proyecto;
	•	consultar materiales faltantes;
	•	mostrar avance de producción;
	•	obtener costos históricos.
Una Query no deberá modificar el estado del sistema.

21. DTO
Los objetos de transferencia de datos permiten mover información entre capas.
No son entidades.
No deberán contener lógica de negocio.
Ejemplo:
type ProjectSummaryDto = {
  id: string;
  name: string;
  status: string;
  totalCost: number;
  currency: string;
};
Las entidades no deberán enviarse directamente a la interfaz cuando eso exponga detalles internos innecesarios.

22. Mappers
Los mappers transforman datos entre representaciones.
Ejemplos:
Database Row → Entity
Entity → Database Row
Entity → DTO
API Response → Internal Model
Un mapper deberá evitar que las capas internas dependan del formato de un proveedor.

23. Ports y adapters
Los puertos definen capacidades que ProyCut necesita.
Los adaptadores conectan esas capacidades con implementaciones reales.
Ejemplo:
interface AIRecommendationPort {
  generateRecommendation(
    context: RecommendationContext
  ): Promise<Recommendation>;
}
Implementaciones posibles:
OpenAIRecommendationAdapter
ClaudeRecommendationAdapter
LocalRecommendationAdapter
La Aplicación conoce el puerto.
No conoce el proveedor.

24. Comunicación entre módulos
Los módulos podrán comunicarse mediante tres mecanismos:
	1	Casos de uso públicos.
	2	Contratos explícitos.
	3	Eventos.
No deberán:
	•	importar repositorios internos de otro módulo;
	•	acceder directamente a sus tablas;
	•	modificar sus entidades;
	•	utilizar componentes privados;
	•	depender de detalles de implementación.
Ejemplo incorrecto:
production → inventory database table
Ejemplo correcto:
production → ReserveInventory use case
O bien:
ProductionOrderCreated
        │
        ▼
Inventory event handler

25. API pública de un módulo
Cada módulo deberá exponer únicamente aquello que otros módulos pueden utilizar.
Ejemplo:
projects/
├── public/
│   ├── commands/
│   ├── queries/
│   ├── events/
│   └── types/
└── internal/
Los consumidores externos no deberán importar archivos internos mediante rutas profundas.
Incorrecto:
import { ProjectEntity } from
  "@/modules/projects/domain/entities/Project";
Correcto:
import { GetProjectSummary } from
  "@/modules/projects/public";

26. Shared no es un almacén de código
La carpeta shared deberá utilizarse con extrema moderación.
Solo contendrá conceptos verdaderamente compartidos y estables.
Ejemplos aceptables:
	•	Money;
	•	Dimension;
	•	Percentage;
	•	Result;
	•	identificadores base;
	•	errores comunes;
	•	contratos técnicos pequeños.
No se deberá mover código a shared únicamente porque dos módulos lo utilizan.
Primero deberá determinarse si existe un concepto real compartido.

27. Contexto empresarial
ProyCut será una plataforma multiempresa.
Toda operación deberá ejecutarse dentro de un contexto empresarial explícito.
Ejemplo:
type ExecutionContext = {
  companyId: string;
  userId: string;
  roles: string[];
  permissions: string[];
};
Ningún caso de uso deberá asumir implícitamente la empresa activa.
Toda consulta, comando, evento y registro deberá conservar el contexto empresarial.

28. Autorización
La autorización deberá validarse en la capa de Aplicación o en servicios de Plataforma.
La interfaz puede ocultar acciones no permitidas, pero eso no reemplaza la validación del servidor.
Ejemplo:
Usuario pulsa “Aprobar cotización”
        │
        ▼
Aplicación valida permiso
        │
        ▼
Dominio valida estado
        │
        ▼
Se ejecuta la operación
La autorización y la regla de negocio son controles distintos.
Ambos son obligatorios.

29. Estados y transiciones
Los estados importantes deberán modelarse explícitamente.
Ejemplo para un proyecto:
Draft
  │
  ▼
Defined
  │
  ▼
Quoted
  │
  ▼
Approved
  │
  ▼
InProduction
  │
  ▼
Completed
  │
  ▼
Delivered
  │
  ▼
Closed
No todas las transiciones estarán permitidas.
Las reglas deberán estar centralizadas en políticas o entidades.
No deberán depender de condicionales distribuidos por la interfaz.

30. Consistencia de datos
Las operaciones que afecten varias áreas deberán definir su nivel de consistencia.
Ejemplo:
Al aprobar una cotización puede ser necesario:
	•	cambiar el estado del proyecto;
	•	crear una orden;
	•	reservar inventario;
	•	registrar auditoría;
	•	emitir una notificación.
Las operaciones críticas deberán ejecutarse de forma transaccional cuando sea posible.
Las tareas secundarias podrán ejecutarse mediante eventos.
Ejemplo:
Transacción crítica
├── aprobar cotización
├── actualizar proyecto
└── crear orden

Procesamiento posterior
├── enviar notificación
├── actualizar analítica
└── generar documento

31. Errores
Cada capa deberá utilizar errores apropiados a su responsabilidad.
Dominio
Errores de reglas:
	•	estado inválido;
	•	medida inválida;
	•	material incompatible;
	•	margen no permitido.
Aplicación
Errores de operación:
	•	recurso no encontrado;
	•	permiso insuficiente;
	•	conflicto;
	•	dependencia no disponible.
Infraestructura
Errores técnicos:
	•	conexión fallida;
	•	timeout;
	•	proveedor rechazó solicitud;
	•	archivo no disponible.
La Presentación deberá transformar estos errores en mensajes comprensibles.

32. Resultados explícitos
Las operaciones relevantes deberán devolver resultados claros.
Ejemplo:
type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };
No deberán utilizarse valores ambiguos como:
null
undefined
false
cuando representen múltiples causas posibles.

33. Pruebas por capa
Cada capa deberá probarse de acuerdo con su responsabilidad.
Dominio
Pruebas unitarias.
	•	reglas;
	•	cálculos;
	•	estados;
	•	políticas;
	•	objetos de valor.
Aplicación
Pruebas de casos de uso.
	•	coordinación;
	•	permisos;
	•	errores;
	•	eventos;
	•	respuestas.
Infraestructura
Pruebas de integración.
	•	repositorios;
	•	proveedores;
	•	archivos;
	•	colas;
	•	contratos.
Presentación
Pruebas de interacción.
	•	formularios;
	•	navegación;
	•	estados;
	•	accesibilidad;
	•	mensajes.
Sistema
Pruebas de extremo a extremo.
	•	recorridos críticos;
	•	cotización;
	•	optimización;
	•	producción;
	•	entrega.

34. Observabilidad
Toda operación importante deberá poder rastrearse.
El sistema deberá registrar:
	•	identificador de solicitud;
	•	empresa;
	•	usuario;
	•	caso de uso;
	•	duración;
	•	resultado;
	•	errores;
	•	proveedor involucrado;
	•	eventos publicados.
Nunca se deberán registrar:
	•	contraseñas;
	•	tokens;
	•	secretos;
	•	datos financieros sensibles sin protección;
	•	contenido privado innecesario.

35. Arquitectura para IA
La inteligencia artificial será una capacidad desacoplada.
Se dividirá en:
AI Application
    │
    ▼
AI Port
    │
    ▼
AI Adapter
    │
    ▼
Proveedor
Las respuestas deberán normalizarse antes de entrar al sistema.
La IA no deberá modificar directamente:
	•	proyectos;
	•	costos;
	•	inventarios;
	•	permisos;
	•	órdenes;
	•	pagos.
Toda acción propuesta por IA deberá pasar por un caso de uso normal y por las mismas reglas que una acción humana.

36. Arquitectura para optimización
El motor de optimización deberá mantenerse independiente de la interfaz y del proveedor de almacenamiento.
Entrada:
	•	piezas;
	•	materiales;
	•	dimensiones;
	•	restricciones;
	•	parámetros de corte;
	•	unidades.
Salida:
	•	distribución;
	•	aprovechamiento;
	•	desperdicio;
	•	secuencia;
	•	advertencias;
	•	métricas;
	•	explicación del resultado.
El motor deberá ser:
	•	determinista cuando use los mismos parámetros;
	•	versionable;
	•	reproducible;
	•	medible;
	•	independiente de la interfaz;
	•	comprobable mediante pruebas.
Cada resultado deberá guardar la versión del algoritmo y sus parámetros.

37. Arquitectura para cálculos
Los cálculos críticos deberán estar centralizados.
Esto incluye:
	•	costos;
	•	precios;
	•	desperdicio;
	•	cantidades;
	•	márgenes;
	•	impuestos;
	•	conversiones;
	•	inventario;
	•	rendimiento.
No deberán existir múltiples implementaciones del mismo cálculo.
Cada cálculo deberá definir:
	•	entradas;
	•	unidades;
	•	moneda;
	•	precisión;
	•	redondeo;
	•	supuestos;
	•	salida;
	•	versión.

38. Versionado de reglas
Las reglas importantes podrán evolucionar.
Cuando un cambio afecte resultados históricos, deberá considerarse el versionado.
Ejemplos:
	•	versión del cálculo de costos;
	•	versión del optimizador;
	•	versión de una cotización;
	•	versión de una plantilla;
	•	versión de una política de margen.
Un proyecto histórico deberá poder explicar con qué reglas fue calculado.

39. Decisiones de arquitectura
Toda decisión estructural importante deberá registrarse mediante un ADR.
Estructura:
docs/adr/
├── 0001-arquitectura-modular.md
├── 0002-eventos-de-dominio.md
├── 0003-aislamiento-multiempresa.md
└── 0004-versionado-de-calculos.md
Cada ADR deberá incluir:
	•	contexto;
	•	decisión;
	•	alternativas;
	•	consecuencias;
	•	riesgos;
	•	estado.

40. Criterios para crear un módulo
Antes de crear un nuevo módulo deberá verificarse que:
	•	representa una capacidad real del negocio;
	•	tiene lenguaje propio;
	•	posee reglas identificables;
	•	puede evolucionar de manera independiente;
	•	tiene límites claros;
	•	no duplica otro dominio;
	•	aporta valor al ciclo del proyecto.
No se creará un módulo por cada pantalla.
No se creará un módulo por cada tabla.
No se creará un módulo por cada funcionalidad pequeña.

41. Criterios para dividir un módulo
Un módulo podrá dividirse cuando:
	•	tenga demasiadas responsabilidades;
	•	maneje conceptos de negocio distintos;
	•	sus reglas evolucionen por separado;
	•	tenga equipos diferentes;
	•	requiera escalabilidad independiente;
	•	genere dependencias internas excesivas.
La división deberá basarse en límites del dominio, no únicamente en cantidad de archivos.

42. Monolito modular inicial
ProyCut deberá comenzar como un monolito modular.
Esto significa:
	•	una aplicación desplegable;
	•	módulos internos bien separados;
	•	una base técnica compartida;
	•	contratos explícitos;
	•	límites preparados para evolucionar.
No se utilizarán microservicios desde el inicio.
Los microservicios solo se considerarán cuando exista una necesidad comprobada de:
	•	escalabilidad independiente;
	•	aislamiento operativo;
	•	despliegue separado;
	•	seguridad especializada;
	•	equipos autónomos;
	•	carga claramente diferenciada.
La complejidad distribuida no deberá introducirse antes de ser necesaria.

43. Evolución de la arquitectura
La arquitectura podrá evolucionar de forma gradual.
Posible recorrido:
Monolito modular
        │
        ▼
Procesos asíncronos separados
        │
        ▼
Servicios especializados
        │
        ▼
Extracción de dominios concretos
Cada extracción deberá estar respaldada por evidencia.
No por moda.

44. Estructura general propuesta
src/
├── app/
│   ├── bootstrap/
│   ├── routing/
│   ├── providers/
│   └── composition/
│
├── modules/
│   ├── projects/
│   ├── clients/
│   ├── materials/
│   ├── quotations/
│   ├── costing/
│   ├── optimization/
│   ├── inventory/
│   ├── purchasing/
│   ├── production/
│   ├── deliveries/
│   ├── reports/
│   ├── billing/
│   └── ai/
│
├── platform/
│   ├── auth/
│   ├── permissions/
│   ├── tenancy/
│   ├── audit/
│   ├── logging/
│   ├── events/
│   ├── jobs/
│   ├── notifications/
│   ├── storage/
│   ├── configuration/
│   └── observability/
│
├── shared/
│   ├── domain/
│   ├── application/
│   └── technical/
│
└── tests/
    ├── integration/
    ├── e2e/
    └── fixtures/

45. Regla de composición
Las dependencias concretas deberán conectarse únicamente en la raíz de composición de la aplicación.
Ejemplo conceptual:
const projectRepository =
  new SupabaseProjectRepository(database);

const eventPublisher =
  new PlatformEventPublisher(eventBus);

const createProject =
  new CreateProject(
    projectRepository,
    eventPublisher,
    permissionService
  );
Las clases del dominio no deberán construir sus propias dependencias.
No deberán utilizarse instancias globales ocultas.

46. Lista de prohibiciones arquitectónicas
Queda prohibido:
	1	Acceder directamente a la base de datos desde la interfaz.
	2	Colocar reglas de negocio en componentes.
	3	Importar código interno de otro módulo.
	4	Crear dependencias circulares.
	5	Utilizar SDK externos dentro del Dominio.
	6	Duplicar cálculos críticos.
	7	Compartir tablas como mecanismo de integración entre módulos.
	8	Crear carpetas genéricas sin responsabilidad.
	9	Utilizar shared como almacén de código.
	10	Ejecutar acciones de IA fuera de los casos de uso.
	11	Permitir operaciones sin contexto empresarial.
	12	Utilizar microservicios sin necesidad demostrada.
	13	Exponer modelos internos directamente al exterior.
	14	Mezclar cambios funcionales con migraciones estructurales masivas.
	15	Modificar estados críticos sin métodos de dominio.
	16	Ocultar errores técnicos sin trazabilidad.
	17	Depender directamente de un proveedor en las reglas del negocio.
	18	Crear módulos por pantalla o tabla.
	19	Introducir abstracciones sin un concepto real.
	20	Sacrificar claridad para parecer técnicamente sofisticados.

47. Checklist arquitectónico
Antes de aprobar un módulo o una funcionalidad:
	•	Pertenece a un dominio claro.
	•	Aporta valor al ciclo del proyecto.
	•	Tiene una responsabilidad definida.
	•	Las reglas viven en el Dominio.
	•	La interfaz no contiene lógica crítica.
	•	La persistencia está abstraída.
	•	Los proveedores son reemplazables.
	•	No accede a detalles internos de otro módulo.
	•	Respeta el contexto empresarial.
	•	Valida autorización.
	•	Maneja errores explícitamente.
	•	Publica eventos cuando corresponde.
	•	Tiene pruebas por capa.
	•	Los cálculos son reproducibles.
	•	La operación puede rastrearse.
	•	La documentación está actualizada.
	•	No introduce complejidad prematura.
	•	Puede evolucionar sin reescribir todo el sistema.
	•	Reduce incertidumbre.
	•	Hace que ProyCut sea más ProyCut.

48. Regla final
La arquitectura de ProyCut deberá proteger el negocio de la tecnología, no encerrar el negocio dentro de ella.
Las tecnologías cambiarán.
Los proveedores cambiarán.
Los frameworks cambiarán.
Las reglas esenciales del mueble, los proyectos, los materiales, los costos y la fabricación deberán permanecer protegidas.
Una buena arquitectura permitirá que ProyCut evolucione durante años sin perder claridad.
Y deberá cumplir siempre una condición:
Que el usuario pueda trabajar de forma simple, aunque por dentro el sistema resuelva problemas complejos.
