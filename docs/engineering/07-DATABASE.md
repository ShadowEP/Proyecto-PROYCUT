# 07-DATABASE.md

## Estado
En revisión

## Versión
0.9

## Última actualización
2026-08-01

## Propósito
Definir los principios, entidades, relaciones y reglas que deberán gobernar la base de datos de ProyCut.

## Depende de
`docs/engineering/06-FUNCTIONALITIES.md`

## Referenciado por
PENDIENTE

## Responsable
PENDIENTE

---

07-DATABASE.md
Modelo de Datos de ProyCut

1. Propósito del documento
Este documento define los principios, entidades, relaciones y reglas que deberán gobernar la base de datos de ProyCut.
Su objetivo es asegurar que la información del sistema sea:
	•	precisa;
	•	consistente;
	•	segura;
	•	trazable;
	•	versionable;
	•	auditable;
	•	comprensible;
	•	escalable;
	•	aislada por empresa;
	•	resistente a errores.
Este documento no define todavía sentencias SQL definitivas.
Define el modelo conceptual y las reglas que cualquier implementación deberá respetar.

2. Principio central
La base de datos debe preservar la verdad operativa de cada proyecto.
Los datos no deberán limitarse a representar el estado actual.
También deberán permitir responder:
	•	qué ocurrió;
	•	cuándo ocurrió;
	•	quién lo hizo;
	•	por qué cambió;
	•	qué versión estaba vigente;
	•	qué reglas se utilizaron;
	•	qué información existía en ese momento;
	•	qué impacto produjo el cambio.
La base de datos no será únicamente un almacén.
Será la memoria verificable de ProyCut.

3. Principios de diseño
Toda decisión de datos deberá favorecer:
	•	integridad;
	•	claridad;
	•	normalización razonable;
	•	trazabilidad;
	•	seguridad;
	•	rendimiento medible;
	•	evolución controlada;
	•	aislamiento empresarial;
	•	reversibilidad;
	•	consistencia semántica.
No se deberá sacrificar integridad para acelerar una implementación temporal.

4. Multiempresa
ProyCut será una plataforma multiempresa.
Cada empresa será un límite de seguridad y propiedad de datos.
Toda entidad empresarial deberá relacionarse con una empresa mediante un identificador explícito.
Ejemplo conceptual:
company_id
Este identificador deberá estar presente en todas las entidades que pertenezcan a una empresa, incluso cuando pudiera inferirse mediante otra relación.
Esto permitirá:
	•	aplicar políticas de seguridad;
	•	simplificar auditorías;
	•	evitar filtraciones;
	•	mejorar consultas;
	•	facilitar migraciones;
	•	detectar inconsistencias.

5. Regla de aislamiento
Ningún dato de una empresa podrá ser leído, modificado o relacionado por otra empresa.
Toda operación deberá validar:
	•	empresa activa;
	•	usuario;
	•	rol;
	•	permisos;
	•	alcance;
	•	propiedad del registro.
El aislamiento deberá aplicarse tanto en la aplicación como en la base de datos.
Ocultar información en la interfaz no constituye seguridad.

6. Identificadores
Todas las entidades principales deberán utilizar identificadores únicos que no dependan de numeraciones visibles.
Ejemplo:
id
Podrán utilizarse identificadores universales o equivalentes técnicamente apropiados.
Las numeraciones visibles se almacenarán por separado.
Ejemplo:
id: identificador interno
project_number: número visible
Esto permitirá modificar formatos de numeración sin alterar relaciones internas.

7. Numeraciones empresariales
Las empresas podrán configurar numeraciones para:
	•	proyectos;
	•	clientes;
	•	cotizaciones;
	•	órdenes de compra;
	•	órdenes de producción;
	•	entregas;
	•	documentos;
	•	incidencias;
	•	facturas operativas.
Ejemplos:
PRO-2026-000145
COT-2026-000082
OC-2026-000031
La generación deberá ser:
	•	única dentro de su alcance;
	•	segura ante concurrencia;
	•	configurable;
	•	auditable;
	•	independiente del identificador interno.

8. Campos comunes
Las entidades persistentes deberán incluir, cuando corresponda:
id
company_id
created_at
created_by
updated_at
updated_by
deleted_at
deleted_by
version
Otros campos comunes podrán incluir:
status
metadata
source
external_id
El uso de cada campo deberá estar justificado.
No se agregará metadata como sustituto de un modelado correcto.

9. Eliminación lógica
Las entidades relevantes deberán utilizar eliminación lógica cuando su pérdida pudiera afectar:
	•	historial;
	•	documentos;
	•	relaciones;
	•	auditoría;
	•	cálculos;
	•	cumplimiento;
	•	recuperación.
La eliminación lógica podrá usar:
deleted_at
deleted_by
Un registro eliminado lógicamente:
	•	no deberá aparecer en operaciones normales;
	•	deberá conservar relaciones históricas;
	•	podrá restaurarse cuando sea válido;
	•	deberá quedar registrado en auditoría.
La eliminación física se reservará para:
	•	información temporal;
	•	datos técnicamente regenerables;
	•	cumplimiento legal;
	•	procesos de anonimización;
	•	depuración autorizada.

10. Datos históricos inmutables
Algunos datos deberán conservarse como instantáneas históricas.
Ejemplos:
	•	cotización aceptada;
	•	costo aprobado;
	•	precio utilizado;
	•	tipo de cambio;
	•	documento firmado;
	•	resultado de optimización;
	•	orden emitida;
	•	entrega confirmada.
Estos registros no deberán modificarse silenciosamente cuando cambie el catálogo original.
Ejemplo:
Si cambia el precio actual de un tablero, una cotización histórica debe conservar el precio que utilizó.

11. Entidades principales
El modelo inicial se organizará en los siguientes dominios:
Identidad y empresa
Clientes y comercial
Proyectos
Diseño y piezas
Catálogos
Costos y cotizaciones
Inventario
Compras
Optimización
Producción
Calidad
Entrega
Documentos
Colaboración
IA
Auditoría
Suscripciones
Integraciones

12. Identidad y empresa
12.1 companies
Representa una empresa dentro de ProyCut.
Campos conceptuales:
id
legal_name
trade_name
country_code
default_currency
default_language
timezone
status
created_at
12.2 company_settings
Almacena configuración empresarial.
Ejemplos:
	•	unidades;
	•	impuestos;
	•	redondeo;
	•	márgenes;
	•	formatos;
	•	numeraciones;
	•	políticas;
	•	preferencias.
La configuración deberá separar datos estructurados de preferencias flexibles.
12.3 branches
Representa sucursales.
Campos:
id
company_id
name
code
address_id
timezone
status
12.4 work_centers
Representa centros de trabajo.
Ejemplos:
	•	corte;
	•	enchapado;
	•	mecanizado;
	•	pintura;
	•	armado;
	•	instalación.
12.5 warehouses
Representa almacenes físicos o lógicos.
12.6 users
Representa la identidad de una persona en la plataforma.
La identidad global deberá separarse de la pertenencia a una empresa.
12.7 company_users
Relaciona usuarios con empresas.
Campos:
id
company_id
user_id
status
joined_at
default_branch_id
12.8 roles
Representa roles configurables.
12.9 permissions
Catálogo de capacidades autorizables.
12.10 role_permissions
Relaciona roles y permisos.
12.11 user_roles
Relaciona usuarios empresariales con roles.
Podrá incluir alcance por:
	•	sucursal;
	•	almacén;
	•	centro de trabajo;
	•	proyecto.

13. Direcciones y contactos
13.1 addresses
Entidad reutilizable para direcciones.
Campos:
id
company_id
type
street
external_number
internal_number
district
city
state
postal_code
country_code
latitude
longitude
Las coordenadas serán opcionales.
13.2 contacts
Representa personas de contacto vinculadas a clientes, proveedores o proyectos.
No deberá confundirse con usuarios del sistema.
Un contacto puede existir sin acceso a ProyCut.

14. Clientes y comercial
14.1 clients
Campos conceptuales:
id
company_id
client_number
type
display_name
legal_name
tax_identifier
currency
price_list_id
status
owner_user_id
created_at
14.2 client_contacts
Relaciona clientes con contactos.
14.3 client_addresses
Relaciona clientes con direcciones.
14.4 opportunities
Representa oportunidades comerciales.
Campos:
id
company_id
client_id
name
description
stage
estimated_value
probability
expected_close_date
owner_user_id
source
status
14.5 opportunity_activities
Registra llamadas, reuniones, seguimientos y notas.
14.6 opportunity_stage_history
Conserva cambios de etapa.

15. Proyectos
15.1 projects
Entidad central del sistema.
Campos conceptuales:
id
company_id
project_number
client_id
opportunity_id
name
description
project_type
status
stage
priority
currency
branch_id
owner_user_id
start_date
target_date
delivery_date
budget_target
created_at
15.2 project_members
Relaciona usuarios con proyectos.
Campos:
project_id
company_user_id
role
permissions_override
15.3 project_contacts
Relaciona contactos relevantes con un proyecto.
15.4 project_addresses
Relaciona direcciones de:
	•	levantamiento;
	•	instalación;
	•	entrega;
	•	facturación.
15.5 project_status_history
Registra:
project_id
previous_status
new_status
changed_by
changed_at
reason
15.6 project_stage_history
Conserva cambios de etapa operativa.
15.7 project_tags
Relaciona etiquetas con proyectos.
15.8 project_notes
Notas internas estructuradas.
15.9 project_snapshots
Podrá almacenar instantáneas verificables del estado integral de un proyecto en puntos críticos.
Ejemplos:
	•	aprobación;
	•	inicio de producción;
	•	entrega;
	•	cierre.

16. Espacios y levantamiento
16.1 project_spaces
Representa habitaciones, áreas, muros o zonas.
Campos:
id
company_id
project_id
parent_space_id
name
type
description
La relación parent_space_id permitirá jerarquías.
16.2 measurements
Representa mediciones.
Campos:
id
company_id
project_id
space_id
measurement_type
value
unit
tolerance
source
measured_at
measured_by
16.3 measurement_evidence
Relaciona mediciones con fotografías, croquis o archivos.
16.4 site_conditions
Registra:
	•	obstáculos;
	•	desniveles;
	•	instalaciones;
	•	restricciones;
	•	observaciones.

17. Muebles y estructura de diseño
17.1 furniture_items
Representa muebles o conjuntos.
Campos:
id
company_id
project_id
space_id
parent_furniture_id
code
name
type
quantity
status
width
height
depth
dimension_unit
17.2 furniture_modules
Representa módulos internos de un mueble.
17.3 design_versions
Conserva versiones del diseño.
Campos:
id
company_id
project_id
version_number
status
created_by
created_at
change_reason
17.4 design_version_items
Relaciona muebles y elementos con una versión de diseño.
La relación deberá permitir reconstruir qué diseño fue aprobado.

18. Piezas
18.1 parts
Representa una definición lógica de pieza.
Campos:
id
company_id
project_id
furniture_item_id
module_id
code
name
description
quantity
length
width
thickness
dimension_unit
material_id
grain_direction
rotation_allowed
status
18.2 part_edges
Representa los cantos de una pieza.
Campos:
id
part_id
edge_position
edge_material_id
edge_type
Posiciones sugeridas:
top
bottom
left
right
La terminología interna deberá ser estable e independiente del idioma visible.
18.3 part_operations
Representa operaciones necesarias.
Ejemplos:
	•	perforación;
	•	ranura;
	•	corte especial;
	•	mecanizado;
	•	lijado;
	•	pintura.
18.4 part_hardware
Relaciona piezas con herrajes.
18.5 part_versions
Conserva versiones cuando una pieza ya haya sido utilizada en:
	•	cotización;
	•	optimización;
	•	producción;
	•	documentación aprobada.

19. Plantillas paramétricas
19.1 furniture_templates
Representa plantillas reutilizables.
19.2 template_parameters
Define parámetros como:
	•	ancho;
	•	alto;
	•	profundidad;
	•	divisiones;
	•	número de puertas;
	•	material.
19.3 template_rules
Contiene reglas declarativas de generación.
Las reglas críticas no deberán almacenarse únicamente como texto ejecutable inseguro.
19.4 template_versions
Toda modificación importante deberá generar una nueva versión.

20. Catálogo de productos y materiales
20.1 catalog_items
Entidad base para artículos comprables, consumibles o utilizables.
Campos:
id
company_id
item_type
sku
name
description
unit
status
brand_id
category_id
Tipos posibles:
board
edge
hardware
consumable
service
finished_product
20.2 boards
Extensión específica para tableros.
Campos:
catalog_item_id
length
width
thickness
dimension_unit
grain_direction
density
finish
color
texture
20.3 edges
Extensión para cantos.
20.4 hardware
Extensión para herrajes.
20.5 consumables
Extensión para consumibles.
20.6 services
Extensión para servicios.
20.7 brands
Catálogo de marcas.
20.8 categories
Catálogo jerárquico de categorías.
20.9 item_compatibilities
Relaciona artículos compatibles.
Ejemplos:
	•	tablero con canto;
	•	bisagra con placa;
	•	corredera con cajón;
	•	acabado con sustrato.
20.10 item_substitutions
Registra alternativas aprobadas o sugeridas.

21. Proveedores y precios
21.1 suppliers
Campos:
id
company_id
supplier_number
display_name
legal_name
tax_identifier
currency
status
21.2 supplier_contacts
21.3 supplier_addresses
21.4 supplier_items
Relaciona proveedores con artículos.
Campos:
supplier_id
catalog_item_id
supplier_sku
minimum_order
lead_time_days
status
21.5 price_lists
Representa listas de precios.
21.6 price_list_items
Campos:
price_list_id
catalog_item_id
supplier_id
price
currency
unit
valid_from
valid_to
tax_included
minimum_quantity
21.7 price_history
Conserva cambios de precios.
Nunca deberá sobrescribirse un precio histórico utilizado en un cálculo aprobado.

22. Unidades y conversiones
22.1 units
Catálogo de unidades.
Ejemplos:
	•	mm;
	•	cm;
	•	m;
	•	pieza;
	•	hoja;
	•	metro lineal;
	•	kilogramo;
	•	litro;
	•	hora.
22.2 unit_conversions
Contiene conversiones válidas dentro de una misma dimensión.
Ejemplo:
mm → cm
cm → m
No se permitirán conversiones semánticamente inválidas.
La unidad deberá almacenarse junto con todo valor dimensional crítico.

23. Monedas y tipos de cambio
23.1 currencies
Catálogo de monedas.
23.2 exchange_rates
Campos:
base_currency
quote_currency
rate
effective_at
source
Los cálculos históricos deberán conservar el tipo de cambio utilizado.
No deberán recalcularse automáticamente con el tipo actual.

24. Costos
24.1 cost_calculations
Representa una ejecución de costeo.
Campos:
id
company_id
project_id
design_version_id
version_number
status
currency
exchange_rate_reference
calculation_rule_version
created_by
created_at
24.2 cost_items
Representa cada componente del costo.
Campos:
id
cost_calculation_id
category
source_type
source_id
description
quantity
unit
unit_cost
subtotal
waste_amount
total
Categorías:
	•	material;
	•	canto;
	•	herraje;
	•	consumible;
	•	mano de obra;
	•	maquinaria;
	•	servicio;
	•	transporte;
	•	instalación;
	•	indirecto;
	•	contingencia.
24.3 cost_assumptions
Registra supuestos explícitos.
24.4 cost_adjustments
Registra ajustes manuales.
Toda modificación deberá identificar:
	•	usuario;
	•	motivo;
	•	valor anterior;
	•	valor nuevo.
24.5 labor_rates
Tarifas de mano de obra.
24.6 machine_rates
Tarifas de maquinaria.
24.7 overhead_policies
Políticas de gastos indirectos.
24.8 waste_policies
Políticas de desperdicio.

25. Precios, márgenes y políticas comerciales
25.1 pricing_calculations
Representa una ejecución de determinación de precio.
25.2 pricing_items
Conserva:
	•	costo;
	•	margen;
	•	utilidad;
	•	descuento;
	•	impuesto;
	•	precio.
25.3 margin_policies
Políticas por:
	•	empresa;
	•	tipo de proyecto;
	•	categoría;
	•	cliente;
	•	usuario;
	•	rango de importe.
25.4 discount_policies
Define descuentos permitidos y niveles de aprobación.
25.5 tax_rules
Representa reglas fiscales configurables.
La base de datos no deberá asumir una sola legislación fiscal.

26. Cotizaciones
26.1 quotations
Campos:
id
company_id
project_id
quotation_number
current_version_id
status
currency
valid_until
client_id
created_by
created_at
26.2 quotation_versions
Cada versión deberá ser inmutable tras envío o aprobación.
Campos:
id
quotation_id
version_number
status
subtotal
discount_total
tax_total
total
cost_total
margin_amount
margin_percentage
terms_snapshot
created_at
26.3 quotation_items
Representa conceptos visibles o internos.
26.4 quotation_options
Representa alternativas.
26.5 quotation_option_items
26.6 quotation_approvals
Registra aprobaciones internas.
26.7 quotation_client_responses
Registra:
	•	aceptación;
	•	rechazo;
	•	solicitud de cambios;
	•	comentarios;
	•	firma;
	•	evidencia.
26.8 quotation_events
Conserva eventos como:
	•	enviada;
	•	vista;
	•	vencida;
	•	aceptada.

27. Contratos y pagos operativos
27.1 contracts
Relaciona contratos con proyectos y cotizaciones aprobadas.
27.2 payment_schedules
Representa fechas e importes esperados.
27.3 payments
Registra pagos operativos.
Campos:
id
company_id
project_id
client_id
amount
currency
payment_date
method
reference
status
Esto no sustituye un sistema contable.
27.4 payment_allocations
Permite asignar un pago a:
	•	anticipo;
	•	parcialidad;
	•	proyecto;
	•	documento;
	•	saldo.

28. Inventario
28.1 inventory_items
Representa un artículo controlado en inventario.
Puede relacionarse con catalog_items.
28.2 inventory_locations
Jerarquía de ubicaciones.
Ejemplo:
Almacén
  └── Zona
       └── Pasillo
            └── Estante
28.3 inventory_balances
Mantiene saldos derivados o materializados.
Campos:
company_id
warehouse_id
location_id
inventory_item_id
on_hand
reserved
available
in_transit
unit
El saldo no deberá modificarse arbitrariamente.
Deberá derivarse de movimientos o procesos controlados.
28.4 inventory_movements
Entidad principal para trazabilidad.
Campos:
id
company_id
inventory_item_id
movement_type
quantity
unit
source_location_id
destination_location_id
project_id
reference_type
reference_id
unit_cost
occurred_at
created_by
28.5 inventory_reservations
Campos:
id
company_id
project_id
inventory_item_id
quantity
unit
status
expires_at
28.6 inventory_adjustments
Registra ajustes autorizados con motivo y evidencia.
28.7 stock_counts
Representa conteos físicos.
28.8 stock_count_items
Compara cantidad esperada y observada.

29. Retazos
29.1 remnants
Representa retazos individualizados.
Campos:
id
company_id
catalog_item_id
length
width
thickness
dimension_unit
grain_direction
warehouse_id
location_id
status
origin_project_id
origin_optimization_id
barcode
Estados sugeridos:
available
reserved
consumed
discarded
missing
Cada retazo deberá poder rastrearse desde su origen hasta su consumo o descarte.

30. Compras
30.1 purchase_requisitions
Representa necesidades de compra.
30.2 purchase_requisition_items
30.3 supplier_quotes
Representa cotizaciones recibidas de proveedores.
30.4 supplier_quote_items
30.5 purchase_orders
Campos:
id
company_id
purchase_order_number
supplier_id
status
currency
order_date
expected_date
warehouse_id
project_id
total
30.6 purchase_order_items
30.7 purchase_order_approvals
30.8 goods_receipts
Registra recepciones.
30.9 goods_receipt_items
Permite recepción parcial.
30.10 supplier_returns
Registra devoluciones.

31. Optimización
31.1 optimization_runs
Representa una ejecución del motor.
Campos:
id
company_id
project_id
design_version_id
algorithm_version
status
parameters
started_at
completed_at
created_by
31.2 optimization_input_parts
Instantánea de piezas utilizadas.
31.3 optimization_input_sheets
Instantánea de tableros o retazos disponibles.
31.4 optimization_solutions
Una ejecución podrá producir varias soluciones.
Campos:
id
optimization_run_id
solution_number
score
sheet_count
waste_percentage
estimated_cut_time
selected
31.5 cutting_layouts
Representa cada tablero de una solución.
31.6 cutting_layout_parts
Representa la posición de cada pieza.
Campos:
x
y
rotation
length
width
part_reference
31.7 optimization_warnings
Registra:
	•	piezas no ubicadas;
	•	restricciones incumplidas;
	•	datos faltantes;
	•	resultados subóptimos.
31.8 generated_remnants
Registra retazos esperados.
Solo se convertirán en inventario real cuando el proceso de corte los confirme.

32. Producción
32.1 production_orders
Campos:
id
company_id
production_order_number
project_id
status
priority
planned_start
planned_end
actual_start
actual_end
32.2 production_order_items
Relaciona muebles, piezas o lotes.
32.3 operation_definitions
Catálogo de operaciones.
32.4 production_routes
Representa rutas de fabricación.
32.5 production_route_steps
Secuencia de operaciones.
32.6 work_orders
Representa trabajo asignado a un centro de trabajo.
32.7 work_order_items
32.8 work_sessions
Registra:
	•	inicio;
	•	pausa;
	•	reanudación;
	•	terminación;
	•	operador;
	•	tiempo.
32.9 production_consumptions
Registra materiales realmente consumidos.
32.10 production_outputs
Registra piezas o conjuntos producidos.
32.11 production_scrap
Registra mermas.
32.12 production_events
Conserva eventos operativos.

33. Capacidad y calendario operativo
33.1 shifts
Turnos de trabajo.
33.2 resources
Representa:
	•	máquinas;
	•	estaciones;
	•	vehículos;
	•	herramientas especializadas.
33.3 resource_availability
Disponibilidad programada.
33.4 resource_assignments
Asignaciones de recursos.
33.5 maintenance_windows
Bloqueos por mantenimiento.
33.6 production_schedule_entries
Entradas de programación.

34. Calidad
34.1 quality_checklists
Plantillas de inspección.
34.2 quality_checklist_items
34.3 inspections
Campos:
id
company_id
project_id
reference_type
reference_id
status
inspected_by
inspected_at
34.4 inspection_results
Resultados por criterio.
34.5 nonconformities
Registra problemas de calidad.
34.6 corrective_actions
Acciones correctivas.
34.7 rework_orders
Órdenes de retrabajo.

35. Incidencias
35.1 incidents
Campos:
id
company_id
project_id
incident_number
type
severity
status
description
reported_by
reported_at
35.2 incident_links
Relaciona la incidencia con:
	•	pieza;
	•	material;
	•	orden;
	•	operación;
	•	entrega;
	•	proveedor.
35.3 incident_actions
Registra seguimiento y resolución.
35.4 incident_costs
Registra impacto económico.

36. Empaque, entrega e instalación
36.1 packages
Representa paquetes físicos.
36.2 package_items
Relaciona piezas o componentes.
36.3 delivery_orders
Campos:
id
company_id
project_id
delivery_number
status
scheduled_at
address_id
assigned_team_id
vehicle_id
36.4 delivery_items
36.5 delivery_events
36.6 installation_orders
36.7 installation_tasks
36.8 delivery_confirmations
Registra:
	•	firma;
	•	fotografías;
	•	hora;
	•	ubicación;
	•	observaciones;
	•	aceptación.

37. Postventa
37.1 warranties
Representa garantías.
37.2 service_requests
Registra solicitudes de postventa.
37.3 service_visits
37.4 service_actions
37.5 service_parts
37.6 service_costs

38. Tareas y colaboración
38.1 tasks
Campos:
id
company_id
project_id
title
description
status
priority
assigned_to
due_at
parent_task_id
38.2 task_dependencies
Relaciona dependencias.
38.3 task_checklist_items
38.4 comments
Entidad polimórfica controlada.
Podrá relacionarse con:
	•	proyecto;
	•	tarea;
	•	cotización;
	•	pieza;
	•	orden;
	•	incidencia.
38.5 comment_mentions
38.6 activity_feed
Podrá materializar eventos relevantes para la línea de tiempo.

39. Archivos y documentos
39.1 files
Representa metadatos de archivos.
Campos:
id
company_id
storage_provider
storage_key
file_name
mime_type
size
checksum
uploaded_by
uploaded_at
39.2 file_links
Relaciona archivos con entidades.
39.3 documents
Representa documentos de negocio.
39.4 document_versions
Conserva versiones.
39.5 document_signatures
Registra firmas y evidencias.
39.6 document_templates
Plantillas configurables.
39.7 document_template_versions

40. Notificaciones
40.1 notifications
Registra notificaciones internas.
40.2 notification_preferences
Preferencias por usuario.
40.3 notification_deliveries
Registra intentos por canal.
40.4 notification_templates
Plantillas por idioma y evento.

41. IA
41.1 ai_requests
Registra solicitudes realizadas a servicios de IA.
Campos:
id
company_id
user_id
project_id
purpose
provider
model
status
created_at
41.2 ai_context_references
Registra qué datos autorizados se utilizaron.
No deberá almacenar información sensible innecesaria.
41.3 ai_responses
Almacena resultados normalizados cuando sea necesario.
41.4 ai_recommendations
Representa recomendaciones revisables.
Campos:
status
confidence
explanation
accepted_by
accepted_at
rejected_reason
41.5 ai_actions
Registra acciones propuestas.
Una acción no deberá ejecutarse sin pasar por un caso de uso autorizado.
41.6 ai_feedback
Permite evaluar utilidad y precisión.

42. Auditoría
42.1 audit_events
Registra acciones relevantes.
Campos:
id
company_id
user_id
action
entity_type
entity_id
occurred_at
request_id
ip_address
user_agent
42.2 audit_changes
Registra cambios de valores.
Campos:
audit_event_id
field_name
old_value
new_value
Los datos sensibles deberán protegerse o redactarse.
42.3 security_events
Registra:
	•	accesos fallidos;
	•	cambios de permisos;
	•	sesiones sospechosas;
	•	bloqueos;
	•	operaciones administrativas.

43. Integraciones
43.1 integrations
Representa una integración configurada.
43.2 integration_credentials
Las credenciales deberán almacenarse cifradas y separadas.
43.3 external_mappings
Relaciona identificadores internos con externos.
43.4 synchronization_runs
Registra sincronizaciones.
43.5 synchronization_errors
Registra fallos y reintentos.
43.6 webhooks
Registra configuraciones y estado.
43.7 webhook_deliveries
Conserva intentos de entrega.

44. Suscripciones SaaS
44.1 plans
44.2 plan_features
44.3 subscriptions
44.4 subscription_items
44.5 usage_records
44.6 billing_events
44.7 invoices
Estas facturas corresponden al servicio SaaS de ProyCut, no necesariamente a la facturación comercial de los clientes de cada empresa.

45. Relaciones principales
Relaciones conceptuales centrales:
Company
 ├── Users
 ├── Clients
 ├── Suppliers
 ├── Catalog Items
 ├── Warehouses
 └── Projects

Client
 └── Projects

Project
 ├── Spaces
 ├── Furniture
 │    └── Parts
 ├── Design Versions
 ├── Cost Calculations
 ├── Quotations
 ├── Inventory Reservations
 ├── Optimization Runs
 ├── Production Orders
 ├── Deliveries
 ├── Tasks
 ├── Documents
 └── Incidents

46. Relación entre versiones
Una versión aprobada deberá enlazar explícitamente las versiones utilizadas.
Ejemplo:
Quotation Version
 ├── Design Version
 ├── Cost Calculation Version
 ├── Pricing Calculation Version
 ├── Price List References
 ├── Tax Rule Version
 └── Terms Version
Esto permitirá reproducir el resultado histórico.

47. Datos derivados
Los datos derivados incluyen:
	•	totales;
	•	saldos;
	•	porcentajes;
	•	indicadores;
	•	métricas;
	•	resúmenes.
Siempre deberá definirse cuál es la fuente de verdad.
Ejemplo:
El saldo de inventario proviene de movimientos válidos.
Una tabla de saldos podrá existir para rendimiento, pero deberá poder reconstruirse.

48. Fuente de verdad
Cada concepto deberá tener una sola fuente de verdad.
Ejemplos:
Movimientos → fuente del inventario
Cost items → fuente del costo
Quotation version items → fuente de la cotización
Work sessions → fuente de tiempo real
Audit events → fuente de historial de acciones
No deberán existir múltiples campos independientes que representen el mismo dato sin reglas de sincronización claras.

49. Estados normalizados
Los estados internos deberán usar valores estables.
La traducción deberá ocurrir en la interfaz.
Ejemplo interno:
in_production
Ejemplo visible:
En producción
No se deberán almacenar textos traducidos como lógica del sistema.

50. Reglas de integridad
La base de datos deberá impedir:
	•	referencias a empresas distintas;
	•	cantidades negativas no permitidas;
	•	monedas vacías en importes;
	•	unidades vacías en dimensiones;
	•	versiones duplicadas;
	•	transiciones inválidas críticas;
	•	relaciones huérfanas;
	•	identificadores visibles duplicados;
	•	reservas mayores que la disponibilidad cuando la política lo prohíba;
	•	documentos firmados sin versión;
	•	movimientos sin origen verificable.

51. Restricciones empresariales cruzadas
Una relación entre dos entidades deberá verificar que ambas pertenezcan a la misma empresa.
Ejemplo:
Un proyecto de la empresa A no puede relacionarse con un cliente de la empresa B.
Esto deberá protegerse mediante:
	•	validación de aplicación;
	•	claves compuestas cuando sea apropiado;
	•	funciones controladas;
	•	políticas de acceso;
	•	pruebas de aislamiento.

52. Concurrencia
Procesos sensibles deberán manejar concurrencia.
Ejemplos:
	•	numeraciones;
	•	reservas;
	•	inventario;
	•	aprobaciones;
	•	pagos;
	•	programación;
	•	versiones.
Se podrán utilizar:
	•	bloqueos optimistas;
	•	campos de versión;
	•	transacciones;
	•	restricciones únicas;
	•	bloqueos selectivos.
No deberán aplicarse bloqueos globales innecesarios.

53. Bloqueo optimista
Las entidades editables podrán incluir un campo:
version
Al guardar, deberá verificarse que la versión no haya cambiado.
Esto evitará sobrescribir modificaciones concurrentes sin advertencia.

54. Transacciones
Deberán ejecutarse en una misma transacción las operaciones que no puedan quedar parcialmente aplicadas.
Ejemplos:
	•	aprobar cotización y crear su versión final;
	•	registrar movimiento y actualizar saldo derivado;
	•	recibir compra y generar inventario;
	•	cerrar producción y registrar consumos;
	•	aceptar entrega y registrar evidencia.
Las notificaciones o analítica podrán ejecutarse posteriormente mediante eventos.

55. Patrón de eventos confiables
Cuando una operación crítica publique eventos, deberá evitarse que:
	•	la transacción se confirme;
	•	pero el evento se pierda.
Podrá utilizarse un patrón como tabla de salida transaccional.
Ejemplo conceptual:
outbox_events
Esto permitirá procesar eventos de manera confiable.

56. Idempotencia
Las operaciones que puedan repetirse deberán ser idempotentes.
Ejemplos:
	•	webhooks;
	•	sincronizaciones;
	•	importaciones;
	•	pagos;
	•	recepciones;
	•	generación de documentos;
	•	eventos asíncronos.
Podrá utilizarse:
idempotency_key
Una solicitud repetida con la misma clave no deberá duplicar el efecto.

57. Importaciones
Toda importación deberá utilizar un proceso controlado.
Entidades sugeridas:
import_jobs
import_rows
import_errors
Cada fila podrá tener estados:
pending
valid
invalid
imported
skipped
La importación deberá conservar:
	•	archivo;
	•	usuario;
	•	fecha;
	•	configuración;
	•	errores;
	•	resultado;
	•	posibilidad de reversión.

58. Búsqueda
La búsqueda deberá respetar:
	•	empresa;
	•	permisos;
	•	estados eliminados;
	•	alcance;
	•	privacidad.
Podrán construirse índices de búsqueda derivados.
El índice nunca deberá convertirse en fuente de verdad.

59. Índices
Los índices deberán definirse con base en consultas reales.
Candidatos iniciales:
	•	company_id;
	•	claves externas;
	•	estados;
	•	fechas;
	•	números visibles;
	•	relaciones frecuentes;
	•	combinaciones de empresa y código;
	•	empresa y estado;
	•	empresa y fecha.
No se deberán crear índices indiscriminadamente.
Cada índice afecta escritura, almacenamiento y mantenimiento.

60. Particionamiento
No se implementará particionamiento prematuro.
Podrá considerarse para tablas de gran volumen como:
	•	auditoría;
	•	eventos;
	•	registros;
	•	notificaciones;
	•	telemetría;
	•	movimientos.
La decisión deberá basarse en evidencia.

61. Datos flexibles
Los campos flexibles o JSON podrán utilizarse para:
	•	metadatos no críticos;
	•	respuestas externas;
	•	configuraciones variables;
	•	evidencia técnica;
	•	parámetros versionados.
No deberán utilizarse para ocultar:
	•	relaciones;
	•	importes;
	•	estados;
	•	permisos;
	•	datos que requieran consultas frecuentes;
	•	reglas de negocio centrales.

62. Archivos
Los archivos no deberán almacenarse directamente en tablas principales, salvo necesidad justificada.
La base de datos almacenará:
	•	metadatos;
	•	ubicación;
	•	checksum;
	•	permisos;
	•	relaciones;
	•	versiones.
El contenido residirá en almacenamiento especializado.

63. Seguridad de datos
La base de datos deberá proteger:
	•	credenciales;
	•	tokens;
	•	información fiscal;
	•	datos personales;
	•	firmas;
	•	documentos;
	•	información financiera;
	•	secretos de integración.
Se deberán aplicar:
	•	cifrado en tránsito;
	•	cifrado en reposo;
	•	acceso mínimo;
	•	rotación de secretos;
	•	auditoría;
	•	redacción de registros;
	•	políticas por empresa.

64. Datos sensibles
Los datos deberán clasificarse.
Categorías sugeridas:
Público
Interno
Confidencial
Sensible
Crítico
La clasificación determinará:
	•	acceso;
	•	registro;
	•	exportación;
	•	retención;
	•	cifrado;
	•	anonimización.

65. Retención
Cada categoría deberá tener política de retención.
Ejemplos:
	•	registros de seguridad;
	•	documentos firmados;
	•	auditoría;
	•	archivos temporales;
	•	solicitudes de IA;
	•	sesiones;
	•	importaciones.
La retención deberá cumplir legislación y necesidades operativas.

66. Anonimización y eliminación
Cuando exista una solicitud válida de eliminación de datos personales, el sistema deberá distinguir entre:
	•	eliminación;
	•	anonimización;
	•	restricción;
	•	conservación obligatoria.
No se deberán romper registros históricos esenciales.
Podrá anonimizarse la identidad manteniendo la evidencia operativa requerida.

67. Respaldos
La estrategia deberá contemplar:
	•	respaldos automáticos;
	•	cifrado;
	•	retención;
	•	copias separadas;
	•	restauración probada;
	•	recuperación puntual;
	•	monitoreo de fallos.
Un respaldo no se considera confiable hasta haber probado su restauración.

68. Recuperación ante desastres
Deberán definirse:
	•	objetivo de recuperación;
	•	pérdida máxima tolerable;
	•	responsables;
	•	procedimiento;
	•	validación;
	•	comunicación.
La criticidad podrá variar por componente.

69. Migraciones
Toda modificación estructural deberá ejecutarse mediante migraciones versionadas.
Una migración deberá incluir:
	•	propósito;
	•	cambio;
	•	impacto;
	•	estrategia de datos;
	•	validación;
	•	reversión;
	•	compatibilidad.
No deberán modificarse esquemas productivos manualmente sin registro.

70. Migraciones destructivas
Una migración destructiva deberá seguir varias etapas.
Ejemplo:
1. Agregar nueva estructura
2. Escribir en ambas estructuras
3. Migrar datos históricos
4. Validar consistencia
5. Cambiar lecturas
6. Detener escritura antigua
7. Eliminar estructura anterior
No se deberá eliminar una columna utilizada en la misma entrega en que se reemplaza.

71. Datos semilla
Los datos iniciales deberán separarse en:
	•	datos obligatorios del sistema;
	•	catálogos regionales;
	•	datos de demostración;
	•	datos de pruebas.
Los datos de demostración nunca deberán mezclarse con producción.

72. Entornos
Los datos deberán estar separados por entorno.
Ejemplos:
development
testing
staging
production
Nunca deberán utilizarse datos reales sensibles en desarrollo sin anonimización.

73. Pruebas de base de datos
Deberán existir pruebas para:
	•	aislamiento multiempresa;
	•	restricciones;
	•	migraciones;
	•	repositorios;
	•	concurrencia;
	•	transacciones;
	•	políticas de acceso;
	•	integridad;
	•	cálculos derivados;
	•	reversión;
	•	restauración.
La seguridad multiempresa deberá tener pruebas automatizadas específicas.

74. Convenciones de nombres
Las convenciones deberán ser consistentes.
Propuesta:
	•	nombres en inglés para estructuras técnicas;
	•	snake_case para tablas y columnas;
	•	tablas en plural;
	•	claves primarias como id;
	•	claves externas como <entity>_id;
	•	fechas como <event>_at;
	•	usuarios como <action>_by;
	•	estados como status;
	•	versiones como version_number.
Ejemplos:
quotation_versions
project_id
approved_at
approved_by

75. Fechas y zonas horarias
Las fechas técnicas deberán almacenarse en un formato temporal universal.
La zona horaria deberá aplicarse en presentación y contexto empresarial.
Se deberá distinguir entre:
	•	instante exacto;
	•	fecha local;
	•	hora local;
	•	zona horaria.
Una fecha de entrega local no siempre representa el mismo concepto que un timestamp.

76. Precisión numérica
Los valores monetarios y dimensionales deberán usar tipos precisos.
No se deberán usar representaciones que introduzcan errores de punto flotante en cálculos críticos.
Cada valor deberá definir:
	•	precisión;
	•	escala;
	•	unidad;
	•	moneda;
	•	regla de redondeo.

77. Dinero
Un importe deberá almacenarse con:
amount
currency
Cuando corresponda, también:
exchange_rate
base_amount
base_currency
Nunca deberá asumirse una moneda por contexto en registros históricos críticos.

78. Dimensiones
Una dimensión deberá almacenar:
value
unit
En ciertos dominios podrá normalizarse adicionalmente a una unidad base para comparación.
La unidad original deberá conservarse cuando sea relevante.

79. Porcentajes
Los porcentajes deberán tener una convención única.
Ejemplo:
12.5 representa 12.5 %
o:
0.125 representa 12.5 %
La decisión deberá documentarse y mantenerse en todo el sistema.

80. Auditoría frente a historial de dominio
La auditoría y el historial funcional no son lo mismo.
Auditoría
Responde:
	•	quién modificó un campo;
	•	cuándo;
	•	desde dónde.
Historial de dominio
Responde:
	•	por qué cambió el proyecto;
	•	qué transición ocurrió;
	•	qué impacto tuvo.
Ambos deberán coexistir.

81. Soft delete frente a estado
Un registro inactivo no siempre está eliminado.
Ejemplo:
supplier.status = inactive
significa que el proveedor ya no se utiliza.
supplier.deleted_at != null
significa que fue eliminado lógicamente.
No se deberán confundir ambos conceptos.

82. Datos temporales
Los borradores, archivos intermedios, cachés y resultados temporales deberán tener:
	•	fecha de expiración;
	•	proceso de limpieza;
	•	responsable;
	•	regla de conservación.
No deberán acumularse indefinidamente.

83. Vistas y proyecciones
Podrán utilizarse vistas o proyecciones para:
	•	dashboards;
	•	reportes;
	•	búsquedas;
	•	resúmenes;
	•	lectura rápida.
Las vistas no deberán ocultar reglas de negocio críticas.
Su fuente deberá estar claramente definida.

84. Métricas y analítica
La analítica del producto deberá separarse de los datos operativos principales.
Los eventos analíticos deberán evitar contener datos sensibles innecesarios.
Las métricas no deberán ser utilizadas como fuente para operaciones críticas.

85. Decisiones pendientes
Este documento deja abiertas decisiones que deberán resolverse al elegir la implementación:
	•	motor de base de datos;
	•	proveedor administrado;
	•	estrategia exacta de aislamiento;
	•	política de acceso a nivel de fila;
	•	formato de identificadores;
	•	motor de búsqueda;
	•	almacenamiento de archivos;
	•	procesamiento de eventos;
	•	estrategia de caché;
	•	herramienta de migraciones.
Estas decisiones deberán documentarse mediante ADR.

86. Orden recomendado de implementación
El modelo deberá implementarse gradualmente.
Etapa 1: Núcleo
	•	companies;
	•	users;
	•	company_users;
	•	roles;
	•	permissions;
	•	branches;
	•	settings;
	•	audit_events.
Etapa 2: Comercial y proyectos
	•	clients;
	•	contacts;
	•	projects;
	•	project_members;
	•	project_status_history.
Etapa 3: Diseño
	•	project_spaces;
	•	furniture_items;
	•	design_versions;
	•	parts;
	•	part_edges;
	•	part_operations.
Etapa 4: Catálogos y costos
	•	catalog_items;
	•	boards;
	•	edges;
	•	hardware;
	•	suppliers;
	•	prices;
	•	cost_calculations;
	•	cost_items.
Etapa 5: Cotización
	•	quotations;
	•	quotation_versions;
	•	quotation_items;
	•	approvals.
Etapa 6: Inventario y optimización
	•	inventory_movements;
	•	inventory_balances;
	•	remnants;
	•	optimization_runs;
	•	cutting_layouts.
Etapa 7: Compras y producción
	•	purchase_orders;
	•	goods_receipts;
	•	production_orders;
	•	work_orders;
	•	work_sessions.
Etapa 8: Entrega y calidad
	•	inspections;
	•	incidents;
	•	packages;
	•	delivery_orders;
	•	confirmations.

87. Checklist para una nueva entidad
Antes de crear una tabla o entidad:
	•	Representa un concepto real. 
	•	Tiene una responsabilidad clara. 
	•	Tiene una empresa propietaria cuando corresponde. 
	•	Tiene una fuente de verdad definida. 
	•	Sus relaciones están identificadas. 
	•	Sus estados están definidos. 
	•	Su historial está considerado. 
	•	Su eliminación está definida. 
	•	Sus permisos están definidos. 
	•	Sus unidades y monedas están explícitas. 
	•	Sus restricciones están documentadas. 
	•	Su volumen esperado está considerado. 
	•	Puede migrarse. 
	•	Puede auditarse. 
	•	Puede probarse. 
	•	No duplica información existente. 
	•	No depende innecesariamente de un proveedor. 
	•	Protege el aislamiento multiempresa. 

88. Checklist para una migración
Antes de aplicar una migración:
	•	Tiene un objetivo único. 
	•	Está versionada. 
	•	Fue probada con datos representativos. 
	•	Considera datos existentes. 
	•	Conserva compatibilidad cuando sea necesario. 
	•	Tiene validación posterior. 
	•	Tiene estrategia de reversión. 
	•	No elimina información prematuramente. 
	•	Respeta multiempresa. 
	•	No expone datos. 
	•	Está documentada. 
	•	Tiene respaldo cuando corresponde. 

89. Prohibiciones
Queda prohibido:
	1	Crear tablas sin propietario empresarial cuando corresponda.
	2	Confiar únicamente en filtros de la interfaz.
	3	Sobrescribir datos históricos aprobados.
	4	Almacenar dinero sin moneda.
	5	Almacenar dimensiones sin unidad.
	6	Utilizar texto libre para relaciones importantes.
	7	Duplicar fuentes de verdad.
	8	Modificar saldos sin movimientos.
	9	Eliminar registros críticos sin trazabilidad.
	10	Mezclar datos de prueba y producción.
	11	Incluir secretos sin cifrado.
	12	Utilizar campos flexibles para evitar modelar.
	13	Aplicar cambios manuales sin migración.
	14	Crear relaciones entre empresas.
	15	Recalcular historia con reglas actuales.
	16	Ejecutar migraciones destructivas sin transición.
	17	Utilizar datos reales sensibles en desarrollo.
	18	Declarar un respaldo válido sin probar restauración.
	19	Crear índices sin propósito.
	20	Sacrificar integridad por velocidad de implementación.

90. Regla final
Los datos de ProyCut deberán permitir comprender el presente, reconstruir el pasado y evolucionar hacia el futuro sin perder la verdad.
Cada proyecto deberá poder explicar:
	•	cómo fue definido;
	•	con qué materiales;
	•	con qué medidas;
	•	con qué precios;
	•	bajo qué reglas;
	•	quién lo aprobó;
	•	cómo fue optimizado;
	•	qué se consumió;
	•	qué se produjo;
	•	qué se entregó;
	•	qué resultado obtuvo.
La base de datos deberá reducir incertidumbre, no trasladarla a otra capa.
Cuando exista duda entre guardar menos información o preservar la trazabilidad necesaria, deberá protegerse la capacidad de explicar el proyecto.
La tecnología podrá cambiar.
La verdad operativa de cada proyecto no.
