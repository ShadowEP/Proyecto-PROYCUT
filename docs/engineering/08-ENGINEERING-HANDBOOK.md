# 08-ENGINEERING-HANDBOOK.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-01

## Propósito
Definir las normas de ingeniería que deberán seguirse durante el desarrollo, mantenimiento y evolución de ProyCut.

## Depende de
`docs/engineering/05-ARCHITECTURE.md`

## Referenciado por
`docs/engineering/04-AI-RULES.md` (superposición parcial de contenido)

## Responsable
PENDIENTE

---

08-ENGINEERING-HANDBOOK.md
Manual de Ingeniería de ProyCut

1. Propósito del documento
Este documento define las normas de ingeniería que deberán seguirse durante el desarrollo, mantenimiento y evolución de ProyCut.
Su objetivo es establecer una forma de trabajo común para:
	•	escribir código claro;
	•	proteger la arquitectura;
	•	reducir defectos;
	•	facilitar revisiones;
	•	mantener trazabilidad;
	•	acelerar la incorporación de colaboradores;
	•	evitar decisiones improvisadas;
	•	entregar cambios de forma segura;
	•	conservar la confianza del usuario.
Este manual aplica a:
	•	desarrolladores;
	•	revisores;
	•	arquitectos;
	•	responsables técnicos;
	•	proveedores externos;
	•	agentes de inteligencia artificial;
	•	cualquier persona o sistema que modifique el producto.

2. Principio central
La ingeniería de ProyCut deberá convertir complejidad técnica en simplicidad operativa.
El código no se considerará bueno únicamente porque funciona.
También deberá ser:
	•	comprensible;
	•	verificable;
	•	mantenible;
	•	seguro;
	•	observable;
	•	reversible;
	•	coherente con la arquitectura;
	•	coherente con el producto.
La velocidad de desarrollo nunca deberá medirse únicamente por la cantidad de código producido.

3. Orden de autoridad
Toda decisión de ingeniería deberá respetar la jerarquía documental oficial.
> La jerarquía documental oficial se encuentra en `docs/meta/DOCUMENTATION-STANDARD.md`.
Cuando exista contradicción, deberá prevalecer el documento de mayor autoridad.
El código existente no deberá utilizarse como justificación para conservar una decisión incorrecta.

4. Objetivos de ingeniería
La ingeniería de ProyCut deberá optimizar simultáneamente:
	•	corrección;
	•	claridad;
	•	seguridad;
	•	velocidad de entrega;
	•	capacidad de cambio;
	•	rendimiento;
	•	experiencia del usuario;
	•	costo operativo.
No deberá optimizarse una dimensión destruyendo las demás.
Ejemplo:
Una solución extremadamente rápida que sea imposible de mantener no será aceptable.
Una solución perfectamente abstracta que retrase innecesariamente el producto tampoco será aceptable.

5. Valores del equipo de ingeniería
Claridad sobre sofisticación
El código más simple que resuelva correctamente el problema deberá preferirse sobre una solución innecesariamente compleja.
Evidencia sobre intuición
Las decisiones importantes deberán apoyarse en:
	•	pruebas;
	•	métricas;
	•	perfiles;
	•	datos;
	•	comportamiento observado;
	•	requisitos documentados.
Cambios pequeños sobre reescrituras
Los cambios deberán ser incrementales, revisables y reversibles.
Prevención sobre reparación
Se deberán diseñar validaciones, tipos, pruebas y observabilidad antes de depender de correcciones manuales.
Responsabilidad compartida
La calidad no pertenece únicamente a quien revisa o prueba.
Toda persona que modifica ProyCut es responsable de la calidad del resultado.

6. Definición de código de calidad
El código de ProyCut deberá:
	•	expresar intención;
	•	utilizar lenguaje del dominio;
	•	tener responsabilidades claras;
	•	evitar duplicación significativa;
	•	manejar errores explícitamente;
	•	ser comprobable;
	•	respetar límites de módulos;
	•	proteger datos;
	•	registrar operaciones importantes;
	•	evitar efectos secundarios ocultos;
	•	ser proporcional al problema;
	•	estar documentado cuando sea necesario.

7. Antes de escribir código
Antes de implementar una funcionalidad o corrección deberá comprenderse:
	•	problema;
	•	usuario afectado;
	•	etapa del proyecto;
	•	comportamiento esperado;
	•	reglas de negocio;
	•	permisos;
	•	datos involucrados;
	•	efectos secundarios;
	•	errores posibles;
	•	criterios de aceptación;
	•	riesgos;
	•	impacto arquitectónico.
No se deberá comenzar por elegir una librería o escribir componentes.
Primero deberá comprenderse el comportamiento.

8. Proceso de trabajo recomendado
Todo cambio deberá seguir, en proporción a su tamaño, este proceso:
Comprender
    │
    ▼
Delimitar
    │
    ▼
Diseñar
    │
    ▼
Implementar
    │
    ▼
Probar
    │
    ▼
Revisar
    │
    ▼
Documentar
    │
    ▼
Entregar
    │
    ▼
Observar
Los cambios triviales podrán recorrerlo de forma rápida.
Los cambios críticos requerirán evidencia más profunda.

9. Delimitación del cambio
Antes de modificar código deberá definirse:
	•	qué se cambiará;
	•	qué no se cambiará;
	•	qué módulos están involucrados;
	•	qué comportamiento debe conservarse;
	•	qué dependencias podrían verse afectadas;
	•	cómo se comprobará el resultado.
Esto evita que una tarea pequeña se convierta en una reestructuración descontrolada.

10. Cambios incrementales
Los cambios deberán ser:
	•	pequeños;
	•	coherentes;
	•	revisables;
	•	comprobables;
	•	reversibles.
Un cambio deberá tener un propósito principal.
No deberán mezclarse, salvo necesidad justificada:
	•	nueva funcionalidad;
	•	refactorización extensa;
	•	actualización masiva de dependencias;
	•	cambio de formato;
	•	migración destructiva;
	•	rediseño visual completo.

11. Reescrituras
Una reescritura completa solo podrá considerarse cuando exista evidencia de que una evolución incremental no es viable.
La propuesta deberá documentar:
	•	problema actual;
	•	costo de continuar;
	•	alternativas;
	•	alcance;
	•	estrategia de migración;
	•	compatibilidad;
	•	riesgos;
	•	plan de reversión;
	•	pruebas;
	•	impacto operativo.
La insatisfacción con el estilo del código no es razón suficiente para reescribir.

12. Convenciones generales de código
El código deberá utilizar convenciones consistentes en todo el proyecto.
Estas convenciones deberán automatizarse mediante:
	•	formateador;
	•	linter;
	•	comprobación de tipos;
	•	pruebas;
	•	validaciones en integración continua.
Las discusiones repetitivas de formato deberán resolverse mediante herramientas, no durante cada revisión.

13. Lenguaje del código
Los identificadores técnicos deberán escribirse en inglés, salvo decisión formal distinta.
Ejemplos:
Project
Quotation
CostCalculation
InventoryReservation
ProductionOrder
La interfaz podrá mostrarse en español u otros idiomas.
No deberán mezclarse idiomas arbitrariamente dentro del código.
Incorrecto:
createProyecto
calcularTotalCost
estadoProject
Correcto:
createProject
calculateTotalCost
projectStatus

14. Nombres
Los nombres deberán expresar propósito.
Variables
Deberán describir el valor.
Incorrecto:
const x = 18;
const data = getData();
const result = calculate();
Correcto:
const boardThickness = 18;
const projectSummary = getProjectSummary();
const quotationTotal = calculateQuotationTotal();
Funciones
Deberán expresar una acción.
Ejemplos:
createProject()
approveQuotation()
reserveInventory()
calculateMaterialCost()
Booleanos
Deberán formularse como condición.
Ejemplos:
isApproved
hasInventory
canStartProduction
shouldNotifyClient
Colecciones
Deberán nombrarse en plural.
projects
quotationItems
availableRemnants

15. Abreviaciones
Se deberán evitar abreviaciones ambiguas.
Incorrecto:
proj
qty
cfg
usr
calc
Podrán utilizarse abreviaciones ampliamente comprendidas dentro del dominio o la tecnología.
Ejemplos aceptables:
id
url
api
dto
sku
La claridad deberá prevalecer sobre reducir caracteres.

16. Funciones
Una función deberá:
	•	tener una responsabilidad;
	•	tener un nombre preciso;
	•	recibir dependencias explícitas;
	•	devolver un resultado claro;
	•	evitar efectos secundarios inesperados;
	•	ser suficientemente pequeña para comprenderse;
	•	mantener un nivel de abstracción coherente.
Una función extensa no es incorrecta por su número de líneas.
Es incorrecta cuando combina responsabilidades que deberían separarse.

17. Parámetros
Se deberán evitar funciones con demasiados parámetros posicionales.
Incorrecto:
createProject(
  companyId,
  clientId,
  name,
  currency,
  userId,
  branchId,
  targetDate
);
Preferible:
createProject({
  companyId,
  clientId,
  name,
  currency,
  userId,
  branchId,
  targetDate,
});
Los objetos de entrada deberán utilizar tipos explícitos.

18. Valores mágicos
No deberán utilizarse valores sin significado evidente.
Incorrecto:
if (margin < 15) {
  requireApproval();
}
Correcto:
if (margin.isBelow(minimumApprovedMargin)) {
  requireApproval();
}
Los valores deberán provenir de:
	•	configuración;
	•	políticas;
	•	constantes nombradas;
	•	reglas del dominio.

19. Tipos
El sistema de tipos deberá utilizarse para prevenir estados inválidos.
Se deberán evitar tipos excesivamente generales como:
any
object
string
number
cuando exista un concepto más preciso.
Ejemplos:
ProjectId
Money
CurrencyCode
Dimension
QuotationStatus
No se deberá utilizar una cadena libre para representar un estado conocido.

20. Nulabilidad
La ausencia de un valor deberá ser explícita.
No deberán utilizarse indistintamente:
null
undefined
empty string
zero
Cada uno deberá tener un significado documentado.
Cuando un dato sea obligatorio, deberá validarse en el límite del sistema.

21. Inmutabilidad
Los datos deberán ser inmutables cuando su modificación accidental represente un riesgo.
Especialmente:
	•	objetos de valor;
	•	versiones aprobadas;
	•	eventos;
	•	configuraciones de cálculo;
	•	resultados históricos.
La mutabilidad deberá ser intencional y controlada.

22. Comentarios
Los comentarios deberán explicar:
	•	por qué existe una decisión;
	•	una restricción externa;
	•	una razón no evidente;
	•	una compensación;
	•	un riesgo;
	•	un comportamiento temporal.
No deberán repetir lo que el código ya expresa.
Incorrecto:
// Incrementa el contador
counter++;
Correcto:
// Se conserva el redondeo por tablero porque el proveedor
// no vende fracciones de hoja.
requiredSheets = Math.ceil(requiredSheets);
Un comentario obsoleto es peor que no tener comentario.

23. Código temporal
Toda solución temporal deberá:
	•	estar justificada;
	•	tener alcance limitado;
	•	incluir una tarea de seguimiento;
	•	indicar condición de eliminación;
	•	evitar comprometer integridad o seguridad.
No se aceptará un “parche temporal” sin estrategia de salida.

24. Manejo de errores
Los errores deberán ser:
	•	explícitos;
	•	clasificados;
	•	trazables;
	•	seguros;
	•	comprensibles en su capa correspondiente.
No se deberán ocultar errores mediante:
try {
  await operation();
} catch {
  return null;
}
Los errores deberán conservar contexto suficiente para diagnóstico.

25. Clasificación de errores
Errores de dominio
Ejemplos:
	•	transición inválida;
	•	material incompatible;
	•	medida fuera de rango;
	•	margen no permitido.
Errores de aplicación
Ejemplos:
	•	permiso insuficiente;
	•	recurso no encontrado;
	•	conflicto de versión;
	•	operación duplicada.
Errores de infraestructura
Ejemplos:
	•	base de datos no disponible;
	•	timeout;
	•	proveedor externo rechazó la solicitud;
	•	archivo inaccesible.
Errores inesperados
Representan defectos o condiciones no contempladas.
Deberán registrarse y monitorearse.

26. Mensajes para el usuario
Un mensaje de error deberá explicar:
	•	qué ocurrió;
	•	qué impacto tiene;
	•	qué puede hacer el usuario;
	•	si sus datos fueron conservados.
Incorrecto:
Error 500.
Preferible:
No pudimos guardar los cambios del proyecto. La información permanece en esta pantalla. Revisa tu conexión e inténtalo nuevamente.
Los detalles técnicos deberán registrarse internamente, no mostrarse al usuario.

27. Resultados explícitos
Las operaciones esperablemente fallibles podrán utilizar resultados tipados.
Ejemplo:
type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E };
Las excepciones deberán reservarse para condiciones realmente excepcionales o cuando el lenguaje y framework lo justifiquen.
La estrategia deberá ser consistente dentro de cada capa.

28. Validación
La validación deberá existir en varios límites:
Presentación
Ayuda inmediata al usuario.
Aplicación
Valida entrada, permisos y contexto.
Dominio
Protege invariantes.
Base de datos
Protege integridad estructural.
Una validación de interfaz nunca deberá ser la única defensa.

29. Seguridad por diseño
Todo cambio deberá considerar:
	•	autenticación;
	•	autorización;
	•	aislamiento multiempresa;
	•	validación;
	•	exposición de datos;
	•	registros;
	•	archivos;
	•	secretos;
	•	dependencias;
	•	abuso;
	•	límites.
La seguridad no deberá agregarse después de terminar la funcionalidad.

30. Principio de mínimo privilegio
Cada usuario, servicio y proceso deberá tener únicamente los permisos necesarios.
Esto aplica a:
	•	usuarios;
	•	tokens;
	•	servicios;
	•	base de datos;
	•	almacenamiento;
	•	integraciones;
	•	procesos de fondo;
	•	entornos.
No se deberán utilizar credenciales administrativas para operaciones ordinarias.

31. Secretos
Los secretos no deberán almacenarse en:
	•	código;
	•	repositorio;
	•	comentarios;
	•	registros;
	•	capturas;
	•	archivos de ejemplo;
	•	mensajes de error.
Deberán gestionarse mediante un sistema seguro de configuración.
Ejemplos:
	•	claves de API;
	•	contraseñas;
	•	tokens;
	•	certificados;
	•	claves de cifrado.

32. Datos personales y sensibles
Antes de registrar, copiar, exportar o enviar datos deberá verificarse:
	•	necesidad;
	•	permiso;
	•	propósito;
	•	retención;
	•	exposición;
	•	cifrado.
Los datos sensibles no deberán incluirse en telemetría ni registros salvo necesidad estricta y protección adecuada.

33. Dependencias externas
Toda dependencia deberá justificar:
	•	problema que resuelve;
	•	mantenimiento;
	•	licencia;
	•	seguridad;
	•	tamaño;
	•	estabilidad;
	•	compatibilidad;
	•	dificultad de reemplazo.
No se agregará una dependencia para evitar escribir una función trivial.
Tampoco se reconstruirá una solución compleja y sensible cuando exista una biblioteca madura y confiable.

34. Actualización de dependencias
Las dependencias deberán actualizarse de forma controlada.
El proceso deberá incluir:
	•	revisión de cambios;
	•	análisis de seguridad;
	•	pruebas;
	•	compatibilidad;
	•	plan de reversión;
	•	monitoreo posterior.
Las actualizaciones masivas no deberán mezclarse con funcionalidades sin relación.

35. Proveedores externos
Todo proveedor deberá estar detrás de un contrato o adaptador cuando afecte capacidades importantes.
Ejemplos:
	•	inteligencia artificial;
	•	almacenamiento;
	•	correo;
	•	pagos;
	•	autenticación;
	•	búsqueda;
	•	analítica.
Esto permitirá:
	•	pruebas;
	•	sustitución;
	•	degradación controlada;
	•	reducción de acoplamiento.

36. Pruebas
Las pruebas deberán proteger comportamiento, no simplemente aumentar cobertura.
Toda prueba deberá tener una razón clara.
Se deberán priorizar:
	•	reglas críticas;
	•	flujos de negocio;
	•	cálculos;
	•	permisos;
	•	aislamiento;
	•	errores;
	•	integraciones;
	•	recorridos principales.

37. Pirámide de pruebas
La estrategia general será:
         E2E
      Integración
  Aplicación y contratos
     Dominio unitario
Deberá existir mayor cantidad de pruebas rápidas y deterministas en las capas internas.
Las pruebas de extremo a extremo serán menos numerosas y cubrirán recorridos críticos.

38. Pruebas unitarias
Las pruebas unitarias deberán:
	•	ejecutarse rápidamente;
	•	evitar dependencias externas;
	•	probar una regla o comportamiento;
	•	usar entradas claras;
	•	producir resultados deterministas.
Ejemplos prioritarios:
	•	costos;
	•	márgenes;
	•	redondeos;
	•	desperdicio;
	•	transiciones;
	•	objetos de valor;
	•	políticas.

39. Pruebas de aplicación
Deberán comprobar:
	•	coordinación;
	•	autorización;
	•	repositorios simulados;
	•	eventos;
	•	respuestas;
	•	manejo de errores;
	•	idempotencia.

40. Pruebas de integración
Deberán comprobar contratos reales con:
	•	base de datos;
	•	almacenamiento;
	•	colas;
	•	proveedores;
	•	adaptadores;
	•	migraciones.
No deberán depender de servicios compartidos inestables cuando pueda utilizarse un entorno aislado.

41. Pruebas de extremo a extremo
Deberán cubrir recorridos de alto valor.
Ejemplos:
Crear cliente
→ Crear proyecto
→ Agregar piezas
→ Calcular costo
→ Generar cotización
→ Aprobar
Otro recorrido:
Optimizar
→ Generar etiquetas
→ Crear orden
→ Registrar producción
→ Entregar
Las pruebas E2E no deberán utilizarse para comprobar cada variante de una regla matemática.

42. Pruebas de regresión
Todo defecto corregido deberá incluir, cuando sea viable, una prueba que falle antes de la corrección y pase después.
Esto evita que el mismo defecto reaparezca.

43. Datos de prueba
Los datos de prueba deberán:
	•	ser legibles;
	•	ser mínimos;
	•	expresar el caso;
	•	evitar datos personales reales;
	•	evitar dependencias ocultas;
	•	poder reproducirse.
Los generadores de datos deberán mantener valores válidos por defecto y permitir variaciones explícitas.

44. Pruebas deterministas
Las pruebas no deberán depender innecesariamente de:
	•	hora actual;
	•	orden aleatorio;
	•	red;
	•	servicios externos;
	•	zona horaria del equipo;
	•	datos compartidos;
	•	ejecución previa.
La hora, aleatoriedad y proveedores deberán poder inyectarse o controlarse.

45. Cobertura
La cobertura será una señal, no un objetivo aislado.
Una cobertura alta no garantiza calidad.
Una cobertura baja en reglas críticas será inaceptable.
Se deberán definir umbrales razonables por tipo de módulo, priorizando riesgo.

46. Desarrollo guiado por pruebas
No será obligatorio escribir siempre la prueba antes del código.
Será especialmente recomendable cuando:
	•	la regla es compleja;
	•	existe un defecto;
	•	el cálculo es crítico;
	•	el comportamiento puede expresarse claramente;
	•	se realiza una refactorización sensible.

47. Revisión de código
Todo cambio relevante deberá ser revisado antes de integrarse.
La revisión deberá evaluar:
	•	corrección;
	•	alcance;
	•	arquitectura;
	•	seguridad;
	•	datos;
	•	pruebas;
	•	rendimiento;
	•	claridad;
	•	experiencia;
	•	documentación.
La revisión no deberá limitarse a estilo.

48. Responsabilidad del autor
Antes de solicitar revisión, el autor deberá:
	•	revisar su propio cambio;
	•	ejecutar pruebas;
	•	ejecutar validaciones;
	•	eliminar código temporal;
	•	explicar el propósito;
	•	señalar riesgos;
	•	documentar decisiones;
	•	mostrar evidencia cuando corresponda.
El revisor no deberá convertirse en el primer lector del código.

49. Responsabilidad del revisor
El revisor deberá:
	•	comprender el problema;
	•	verificar el comportamiento;
	•	buscar riesgos;
	•	cuestionar supuestos;
	•	distinguir preferencias de defectos;
	•	ofrecer observaciones accionables;
	•	evitar rediseñar innecesariamente el cambio.
Las observaciones deberán clasificarse cuando sea útil:
Bloqueante
Importante
Sugerencia
Pregunta
Detalle

50. Revisión respetuosa
La revisión deberá criticar el código, no a la persona.
Incorrecto:
No entendiste cómo funciona esto.
Correcto:
Esta implementación permite saltar la validación de empresa. Necesitamos ejecutar la operación mediante el caso de uso autorizado.

51. Pull requests
Toda solicitud de cambio deberá incluir:
	•	propósito;
	•	contexto;
	•	alcance;
	•	comportamiento anterior;
	•	comportamiento nuevo;
	•	pruebas realizadas;
	•	capturas o evidencia cuando corresponda;
	•	migraciones;
	•	riesgos;
	•	plan de reversión;
	•	documentación actualizada.
Los cambios deberán ser suficientemente pequeños para revisarse con atención.

52. Plantilla de pull request
## Problema

## Solución

## Alcance

## Fuera de alcance

## Riesgos

## Pruebas

## Migraciones

## Evidencia visual

## Documentación

## Reversión

## Checklist

53. Git
El historial de Git deberá contar la evolución del producto de forma comprensible.
Cada commit deberá:
	•	representar un cambio coherente;
	•	compilar cuando sea posible;
	•	mantener pruebas relevantes;
	•	tener un mensaje claro;
	•	evitar archivos accidentales;
	•	evitar secretos.

54. Mensajes de commit
Formato recomendado:
type(scope): description
Tipos sugeridos:
feat
fix
refactor
test
docs
build
ci
chore
perf
security
Ejemplos:
feat(quotations): add version comparison
fix(inventory): prevent cross-company reservations
refactor(costing): extract waste policy
test(projects): cover invalid status transition
docs(architecture): clarify module boundaries
La descripción deberá utilizar modo imperativo y ser concreta.

55. Ramas
Las ramas deberán ser breves.
Formato sugerido:
feature/quotation-options
fix/inventory-reservation-race
refactor/cost-calculation
docs/engineering-handbook
Las ramas de larga duración aumentan conflictos y riesgo.

56. Integración
Se deberá integrar con frecuencia.
Podrá utilizarse:
	•	integración mediante pull request;
	•	squash;
	•	rebase;
	•	merge controlado.
La estrategia exacta deberá ser consistente y documentada.
El historial final deberá permanecer comprensible.

57. Conflictos
Los conflictos deberán resolverse comprendiendo ambos cambios.
No deberá elegirse automáticamente una versión sin revisar comportamiento.
Después de resolver conflictos deberán ejecutarse nuevamente las pruebas afectadas.

58. Integración continua
Todo cambio deberá pasar por controles automáticos.
Mínimos:
	•	formato;
	•	lint;
	•	tipos;
	•	pruebas unitarias;
	•	pruebas de aplicación;
	•	análisis de seguridad;
	•	compilación;
	•	validación de migraciones.
Según el cambio podrán incluirse:
	•	pruebas de integración;
	•	E2E;
	•	accesibilidad;
	•	rendimiento;
	•	análisis de dependencias.

59. Entornos
El flujo mínimo deberá contemplar:
Local
Testing
Staging
Production
Cada entorno deberá tener:
	•	configuración separada;
	•	secretos separados;
	•	datos separados;
	•	permisos separados;
	•	observabilidad apropiada.
No deberán reutilizarse credenciales de producción en desarrollo.

60. Staging
El entorno de staging deberá aproximarse a producción en:
	•	configuración;
	•	migraciones;
	•	integraciones;
	•	permisos;
	•	despliegue;
	•	observabilidad.
No deberá contener datos sensibles reales sin anonimización.

61. Despliegues
Los despliegues deberán ser:
	•	automatizados;
	•	repetibles;
	•	observables;
	•	reversibles;
	•	verificables.
Toda entrega deberá conocer:
	•	versión;
	•	cambios incluidos;
	•	migraciones;
	•	responsable;
	•	hora;
	•	resultado.

62. Estrategias de despliegue
Podrán utilizarse, según riesgo:
	•	despliegue gradual;
	•	blue-green;
	•	canary;
	•	feature flags;
	•	activación por empresa;
	•	activación por usuario.
No todas las funcionalidades deberán quedar visibles inmediatamente después del despliegue técnico.

63. Feature flags
Las banderas de funcionalidad podrán utilizarse para:
	•	lanzamiento gradual;
	•	pruebas;
	•	mitigación;
	•	activación por plan;
	•	activación por empresa.
Deberán tener:
	•	propietario;
	•	propósito;
	•	fecha de creación;
	•	condición de eliminación.
Una bandera permanente sin necesidad se convierte en deuda.

64. Reversión
Todo cambio de riesgo deberá tener estrategia de reversión.
Puede incluir:
	•	revertir código;
	•	desactivar bandera;
	•	restaurar configuración;
	•	usar versión anterior;
	•	ejecutar migración compensatoria.
No deberá asumirse que revertir código revierte automáticamente los datos.

65. Migraciones
Las migraciones deberán:
	•	estar versionadas;
	•	ser reproducibles;
	•	ser revisadas;
	•	probarse;
	•	considerar volumen;
	•	considerar bloqueo;
	•	incluir validación;
	•	conservar compatibilidad cuando sea necesario.
No deberán modificarse datos productivos manualmente sin registro.

66. Migraciones compatibles
Cuando código anterior y nuevo puedan coexistir durante un despliegue, deberá utilizarse una secuencia compatible.
Ejemplo:
Agregar
→ Poblar
→ Leer nuevo
→ Dejar de escribir antiguo
→ Eliminar antiguo
Las migraciones destructivas deberán separarse en varias entregas.

67. Observabilidad
Todo componente importante deberá permitir responder:
	•	qué ocurrió;
	•	cuándo;
	•	dónde;
	•	para qué empresa;
	•	para qué usuario;
	•	cuánto tardó;
	•	cuál fue el resultado;
	•	qué dependencia falló.
La observabilidad deberá diseñarse junto con la funcionalidad.

68. Registros
Los registros deberán ser estructurados.
Campos útiles:
timestamp
level
request_id
company_id
user_id
module
use_case
duration
result
error_code
No deberán registrarse secretos ni datos sensibles innecesarios.

69. Niveles de registro
Debug
Información detallada para diagnóstico controlado.
Info
Eventos operativos normales relevantes.
Warning
Condición inesperada recuperable.
Error
Operación fallida.
Critical
Fallo grave con impacto amplio o de seguridad.
No deberá utilizarse error para eventos normales.

70. Métricas técnicas
Deberán medirse, cuando sea relevante:
	•	latencia;
	•	tasa de errores;
	•	disponibilidad;
	•	uso de recursos;
	•	colas;
	•	reintentos;
	•	tiempo de consultas;
	•	fallos de proveedores;
	•	duración de optimizaciones;
	•	tiempo de generación de documentos.

71. Métricas funcionales
También deberán medirse eventos del negocio, sin comprometer privacidad.
Ejemplos:
	•	proyectos creados;
	•	cotizaciones generadas;
	•	optimizaciones completadas;
	•	órdenes producidas;
	•	errores de costeo;
	•	bloqueos;
	•	tiempo de flujo.
Las métricas técnicas y funcionales deberán poder correlacionarse.

72. Trazas
Los flujos distribuidos o complejos deberán conservar un identificador común.
Ejemplo:
request_id
trace_id
correlation_id
Esto permitirá rastrear una operación desde la interfaz hasta proveedores externos.

73. Alertas operativas
Las alertas técnicas deberán ser:
	•	accionables;
	•	específicas;
	•	priorizadas;
	•	vinculadas a un responsable;
	•	resistentes al ruido.
No se deberá alertar por toda anomalía menor.
Una alerta ignorada repetidamente pierde valor.

74. Rendimiento
El rendimiento deberá evaluarse desde la experiencia del usuario.
No solo desde métricas internas.
Se deberán considerar:
	•	tiempo de carga;
	•	tiempo de respuesta;
	•	percepción;
	•	retroalimentación;
	•	tareas largas;
	•	dispositivos modestos;
	•	conexiones inestables.

75. Presupuestos de rendimiento
Podrán definirse presupuestos para:
	•	carga inicial;
	•	interacción;
	•	tamaño de recursos;
	•	consultas;
	•	generación de documentos;
	•	optimizaciones;
	•	tareas de fondo.
Los límites deberán basarse en el contexto real de uso.

76. Optimización de rendimiento
Antes de optimizar deberá:
	1	medirse;
	2	localizarse el cuello;
	3	definirse el impacto;
	4	aplicarse un cambio;
	5	volver a medirse.
No se deberá introducir complejidad por optimizaciones especulativas.

77. Consultas a datos
Las consultas deberán:
	•	seleccionar solo lo necesario;
	•	respetar empresa;
	•	utilizar índices relevantes;
	•	evitar cargas repetitivas;
	•	limitar colecciones;
	•	paginar;
	•	proteger permisos.
Se deberá evitar el problema de consultas repetidas por cada elemento.

78. Caché
La caché podrá utilizarse cuando exista beneficio medido.
Toda caché deberá definir:
	•	fuente de verdad;
	•	clave;
	•	expiración;
	•	invalidación;
	•	alcance empresarial;
	•	comportamiento ante fallo.
La caché nunca deberá mezclar datos de empresas.

79. Procesos largos
Operaciones como:
	•	optimización;
	•	importación;
	•	generación masiva;
	•	sincronización;
	•	reportes complejos;
deberán considerar ejecución asíncrona.
El usuario deberá poder conocer:
	•	estado;
	•	avance;
	•	resultado;
	•	errores;
	•	posibilidad de reintento.

80. Reintentos
Los reintentos deberán aplicarse únicamente a fallos potencialmente temporales.
Deberán incluir:
	•	límite;
	•	espera progresiva;
	•	idempotencia;
	•	registro;
	•	condición de abandono.
No deberá reintentarse una validación inválida como si fuera un fallo de red.

81. Timeouts
Toda llamada externa deberá tener un tiempo límite razonable.
No deberán existir esperas indefinidas.
El timeout deberá considerar:
	•	tipo de operación;
	•	experiencia;
	•	reintentos;
	•	capacidad del proveedor.

82. Degradación controlada
Cuando una capacidad externa falle, ProyCut deberá conservar, cuando sea posible, las funciones esenciales.
Ejemplos:
	•	si falla IA, el usuario continúa trabajando;
	•	si falla correo, la cotización permanece generada;
	•	si falla analítica, la operación principal no se pierde.
Las dependencias secundarias no deberán derribar procesos críticos.

83. Accesibilidad técnica
La accesibilidad deberá incluirse en desarrollo y pruebas.
Se deberán verificar:
	•	semántica;
	•	teclado;
	•	foco;
	•	contraste;
	•	lectores;
	•	mensajes;
	•	formularios;
	•	estados dinámicos.
No deberá tratarse como revisión opcional al final.

84. Diseño responsivo
Las interfaces deberán funcionar en los dispositivos definidos para cada tarea.
No todas las pantallas deberán tener la misma densidad en móvil.
Se deberá priorizar el contexto de uso:
	•	oficina;
	•	taller;
	•	almacén;
	•	instalación;
	•	campo.

85. Internacionalización
Los textos visibles no deberán estar dispersos como literales difíciles de traducir.
Se deberán separar:
	•	textos;
	•	formatos;
	•	monedas;
	•	fechas;
	•	unidades;
	•	pluralización.
Los valores internos deberán permanecer independientes del idioma.

86. Compatibilidad
La compatibilidad deberá definirse explícitamente para:
	•	navegadores;
	•	dispositivos;
	•	sistemas;
	•	formatos de archivo;
	•	integraciones;
	•	versiones de API.
No se deberá intentar soportar indefinidamente plataformas sin uso demostrado.

87. API
Las interfaces externas deberán:
	•	ser consistentes;
	•	estar versionadas;
	•	validar entrada;
	•	autenticar;
	•	autorizar;
	•	limitar abuso;
	•	manejar idempotencia;
	•	documentar errores;
	•	evitar exponer modelos internos.
La API deberá expresar capacidades del producto, no simplemente tablas.

88. Compatibilidad de API
Los cambios incompatibles deberán:
	•	versionarse;
	•	anunciarse;
	•	documentarse;
	•	tener periodo de transición;
	•	incluir guía de migración.
No deberán romperse consumidores silenciosamente.

89. Documentación técnica
Toda documentación deberá mantenerse cerca de la decisión que describe.
Podrá incluir:
	•	README de módulo;
	•	ADR;
	•	contratos;
	•	diagramas;
	•	ejemplos;
	•	guías operativas;
	•	decisiones de seguridad;
	•	procedimientos.
La documentación desactualizada deberá corregirse o eliminarse.

90. README de módulo
Cada módulo relevante deberá incluir:
Propósito
Límites
Conceptos
API pública
Dependencias
Eventos
Persistencia
Permisos
Pruebas
Riesgos
Decisiones
No deberá duplicar innecesariamente documentos superiores.

91. ADR
Se deberá crear un registro de decisión arquitectónica cuando una decisión:
	•	afecte varios módulos;
	•	sea difícil de revertir;
	•	cambie límites;
	•	introduzca proveedor estratégico;
	•	modifique seguridad;
	•	cambie persistencia;
	•	altere contratos públicos.

92. Deuda técnica
La deuda técnica deberá registrarse cuando se acepte conscientemente una solución inferior por una razón válida.
Cada registro deberá incluir:
	•	deuda;
	•	motivo;
	•	impacto;
	•	riesgo;
	•	condición de pago;
	•	prioridad;
	•	propietario.
No deberá llamarse deuda técnica a cualquier código que simplemente no guste.

93. Refactorización
Una refactorización deberá:
	•	conservar comportamiento;
	•	estar respaldada por pruebas;
	•	tener objetivo claro;
	•	reducir complejidad;
	•	evitar mezclar funcionalidades;
	•	medirse cuando afecte rendimiento.
Antes de refactorizar deberá comprenderse el comportamiento actual.

94. Código legado
El código legado deberá tratarse con evidencia, no desprecio.
Antes de modificarlo deberá:
	•	caracterizarse;
	•	cubrirse con pruebas;
	•	identificarse dependencias;
	•	cambiarse gradualmente;
	•	verificarse comportamiento.
La antigüedad no convierte automáticamente al código en incorrecto.

95. Eliminación de código
Antes de eliminar código deberá verificarse:
	•	referencias;
	•	rutas dinámicas;
	•	configuraciones;
	•	procesos asíncronos;
	•	integraciones;
	•	migraciones;
	•	documentación;
	•	métricas de uso.
El código muerto deberá eliminarse cuando exista evidencia suficiente.

96. Incidentes de producción
Todo incidente deberá gestionarse con prioridad sobre la culpa.
El proceso deberá incluir:
	1	detectar;
	2	contener;
	3	comunicar;
	4	recuperar;
	5	investigar;
	6	corregir;
	7	prevenir.
Durante el incidente deberá priorizarse restaurar el servicio de forma segura.

97. Severidad de incidentes
SEV-1
Interrupción crítica, pérdida de datos o riesgo de seguridad amplio.
SEV-2
Función principal severamente afectada.
SEV-3
Impacto parcial con alternativa disponible.
SEV-4
Defecto menor sin impacto operativo relevante.
La clasificación deberá determinar respuesta y comunicación.

98. Postmortem
Los incidentes relevantes deberán producir un análisis sin culpabilización.
Deberá incluir:
	•	resumen;
	•	impacto;
	•	línea de tiempo;
	•	detección;
	•	causa;
	•	factores contribuyentes;
	•	respuesta;
	•	acciones correctivas;
	•	responsables;
	•	fechas.
El objetivo será mejorar el sistema.

99. Correcciones urgentes
Un hotfix podrá reducir temporalmente el proceso normal, pero no deberá eliminar:
	•	revisión mínima;
	•	prueba crítica;
	•	trazabilidad;
	•	reversión;
	•	monitoreo.
Después de estabilizar deberá completarse la documentación y las pruebas faltantes.

100. Seguridad de la cadena de suministro
Se deberán proteger:
	•	dependencias;
	•	herramientas de construcción;
	•	imágenes;
	•	artefactos;
	•	pipelines;
	•	credenciales;
	•	permisos de publicación.
Se deberán revisar vulnerabilidades y procedencia de artefactos.

101. Calidad de IA generativa
El código generado por IA deberá tratarse como código no confiable hasta ser revisado.
Deberá verificarse:
	•	exactitud;
	•	seguridad;
	•	arquitectura;
	•	licencias;
	•	pruebas;
	•	dependencias;
	•	comportamiento;
	•	datos inventados.
La velocidad de generación no reemplaza la responsabilidad humana o técnica.

102. Uso de IA por el equipo
La IA podrá utilizarse para:
	•	explorar;
	•	explicar;
	•	generar borradores;
	•	proponer pruebas;
	•	documentar;
	•	refactorizar;
	•	detectar riesgos.
No deberá utilizarse para:
	•	aprobar cambios automáticamente sin controles;
	•	copiar secretos;
	•	compartir datos sensibles;
	•	inventar requisitos;
	•	reemplazar validación;
	•	ejecutar cambios destructivos sin revisión.

103. Propiedad del código
Todo cambio deberá tener una persona o equipo responsable.
La propiedad no significa exclusividad.
Significa:
	•	conocimiento;
	•	mantenimiento;
	•	revisión;
	•	respuesta ante incidentes;
	•	evolución.
Los módulos críticos no deberán depender de una sola persona.

104. Transferencia de conocimiento
Los cambios relevantes deberán compartirse mediante:
	•	documentación;
	•	revisión;
	•	sesiones breves;
	•	ejemplos;
	•	pruebas;
	•	ADR;
	•	notas de entrega.
El conocimiento esencial no deberá permanecer únicamente en conversaciones privadas.

105. Definition of Ready
Una tarea estará suficientemente preparada cuando:
	•	el problema sea claro;
	•	el usuario esté identificado;
	•	el alcance esté delimitado;
	•	existan criterios de aceptación;
	•	las reglas conocidas estén documentadas;
	•	los permisos estén definidos;
	•	los datos estén identificados;
	•	los riesgos principales sean visibles;
	•	las dependencias estén disponibles.
No se exige perfección absoluta.
Se exige suficiente claridad para comenzar sin inventar decisiones fundamentales.

106. Definition of Done
Un cambio estará terminado cuando:
	•	el comportamiento requerido funcione;
	•	los criterios de aceptación se cumplan;
	•	la arquitectura se respete;
	•	los permisos se validen;
	•	el aislamiento empresarial esté protegido;
	•	los errores se manejen;
	•	las pruebas necesarias existan;
	•	la integración continua pase;
	•	la observabilidad esté incluida;
	•	la documentación esté actualizada;
	•	las migraciones estén probadas;
	•	no existan secretos;
	•	la accesibilidad haya sido considerada;
	•	el rendimiento sea aceptable;
	•	exista estrategia de reversión cuando corresponda;
	•	el cambio pueda ser explicado.
Código escrito no significa trabajo terminado.

107. Checklist antes de solicitar revisión
	•	Comprendí el problema. 
	•	Delimité el alcance. 
	•	Revisé documentación relevante. 
	•	Respeté límites de módulos. 
	•	Evité lógica de negocio en presentación. 
	•	Validé permisos. 
	•	Protegí multiempresa. 
	•	Manejé errores. 
	•	Añadí pruebas. 
	•	Ejecuté pruebas existentes. 
	•	Revisé seguridad. 
	•	Revisé rendimiento. 
	•	Actualicé documentación. 
	•	Revisé mi propio cambio. 
	•	Eliminé código temporal. 
	•	Expliqué riesgos. 
	•	Incluí reversión cuando aplica. 

108. Checklist de revisión
	•	El cambio resuelve el problema. 
	•	El alcance es apropiado. 
	•	No rompe comportamiento existente. 
	•	Las reglas están en la capa correcta. 
	•	Los nombres son claros. 
	•	Los errores son explícitos. 
	•	Los datos están protegidos. 
	•	No hay acceso cruzado entre empresas. 
	•	Las pruebas cubren riesgos. 
	•	Las migraciones son seguras. 
	•	La observabilidad es suficiente. 
	•	El rendimiento es razonable. 
	•	La documentación coincide. 
	•	Puede revertirse. 
	•	Reduce incertidumbre. 

109. Checklist antes de producción
	•	CI completado. 
	•	Revisión aprobada. 
	•	Migraciones verificadas. 
	•	Configuración preparada. 
	•	Secretos disponibles. 
	•	Feature flags configuradas. 
	•	Métricas y alertas disponibles. 
	•	Reversión definida. 
	•	Compatibilidad confirmada. 
	•	Comunicación preparada cuando aplica. 
	•	Datos protegidos. 
	•	Responsable de seguimiento asignado. 

110. Prácticas prohibidas
Queda prohibido:
	1	Introducir secretos en el repositorio.
	2	Saltar permisos porque la interfaz oculta una acción.
	3	Acceder a datos sin contexto empresarial.
	4	Modificar producción manualmente sin trazabilidad.
	5	Ignorar pruebas fallidas.
	6	Desactivar validaciones para entregar más rápido.
	7	Capturar errores y descartarlos.
	8	Reescribir módulos sin evidencia.
	9	Introducir dependencias sin revisión.
	10	Mezclar cambios no relacionados.
	11	Desplegar migraciones destructivas en un solo paso.
	12	Utilizar datos reales sensibles en pruebas.
	13	Aprobar código generado por IA sin revisión.
	14	Registrar contraseñas o tokens.
	15	Duplicar reglas críticas.
	16	Optimizar sin medir.
	17	Crear abstracciones sin necesidad.
	18	Utilizar any para evitar modelar.
	19	Modificar estados críticos directamente.
	20	Considerar terminado un cambio sin documentación y pruebas necesarias.

111. Plantilla para una propuesta técnica
Título:

Problema:

Contexto:

Objetivo:

Alcance:

Fuera de alcance:

Solución propuesta:

Alternativas consideradas:

Impacto arquitectónico:

Impacto en datos:

Impacto en seguridad:

Impacto en experiencia:

Impacto en rendimiento:

Migración:

Pruebas:

Observabilidad:

Reversión:

Riesgos:

Preguntas abiertas:

112. Plantilla para entrega técnica
Cambio realizado:

Problema resuelto:

Archivos o módulos afectados:

Comportamiento anterior:

Comportamiento nuevo:

Pruebas ejecutadas:

Migraciones:

Riesgos conocidos:

Observabilidad:

Documentación actualizada:

Reversión:

Trabajo posterior:

113. Indicadores de salud de ingeniería
El equipo deberá observar tendencias como:
	•	frecuencia de despliegue;
	•	tiempo desde cambio hasta producción;
	•	tasa de fallos;
	•	tiempo de recuperación;
	•	defectos reabiertos;
	•	regresiones;
	•	duración de CI;
	•	tiempo de revisión;
	•	vulnerabilidades;
	•	deuda técnica;
	•	estabilidad de módulos;
	•	uso de funcionalidades;
	•	incidentes por aislamiento;
	•	fallos de migración.
Las métricas deberán utilizarse para aprender, no para castigar.

114. Evolución del manual
Este documento deberá evolucionar cuando:
	•	aparezca un patrón repetido;
	•	ocurra un incidente relevante;
	•	cambie la arquitectura;
	•	cambie el flujo de entrega;
	•	surja una nueva obligación;
	•	una regla deje de aportar valor.
Los cambios importantes deberán documentar su razón.
No deberán agregarse reglas únicamente para reaccionar emocionalmente a un caso aislado.

115. Regla final
La ingeniería de ProyCut deberá hacer que el sistema sea más fácil de entender después de cada cambio, no más difícil.
Cada entrega deberá proteger:
	•	al usuario;
	•	sus datos;
	•	el negocio;
	•	la arquitectura;
	•	al siguiente desarrollador;
	•	al futuro de ProyCut.
El mejor código no es el más ingenioso.
Es el que permite avanzar con confianza.
Porque en ProyCut, incluso la ingeniería deberá cumplir la promesa central:
Eliminar incertidumbre.
