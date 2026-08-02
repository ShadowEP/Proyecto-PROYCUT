# 00-SYSTEM-UNDERSTANDING.md

## Estado
Aprobado (como fotografía puntual de comprensión — ver sección 17)

## Versión
1.0

## Última actualización
2026-08-01

## Propósito
Demostrar y dejar registrada la comprensión técnica y funcional de ProyCut, construida a partir de la lectura completa de la documentación oficial, antes de iniciar el análisis del código fuente.

## Depende de
`README.md`; los cuatro documentos de `docs/vision/`; los seis documentos de `docs/engineering/` existentes antes de este; los cuatro documentos de `docs/meta/`

## Referenciado por
PENDIENTE (documento nuevo)

## Responsable
PENDIENTE

---

Este documento no resume la documentación de ProyCut. Es el resultado de haberla leído completa — `README.md`, los cuatro documentos de `docs/vision/`, los seis de `docs/engineering/` y los cuatro de `docs/meta/`, respetando la jerarquía de `docs/meta/DOCUMENTATION-STANDARD.md` — y de reconstruir, con palabras propias, qué es el sistema, por qué existe y qué reglas no pueden romperse. Donde la documentación deja preguntas abiertas, este documento las señala como tales, en vez de inventar una respuesta.

# 1. ¿Qué es ProyCut?

ProyCut es una plataforma para que negocios de fabricación de muebles a medida —talleres, carpinterías, placacentros y centros de corte— dejen de operar por intuición. Hoy, ese trabajo pasa por varias herramientas desconectadas y varios cálculos manuales antes de que alguien pueda decir con certeza "esto cuesta X, se puede fabricar así, y este es el material que se necesita". ProyCut busca convertir eso en un solo recorrido continuo: desde que una idea de mueble o proyecto entra al sistema, hasta que sale de él con un costo real, un precio, un plan de corte y una orden de fabricación, sin que la información se vuelva a capturar en cada paso.

No es, en su intención, un programa de dibujo, ni un optimizador de cortes, ni un sistema contable. Es la capa que conecta todas esas piezas alrededor de una sola unidad de trabajo: el proyecto. Hoy existe como un prototipo funcional concentrado en un único archivo (`index.html`), y el objetivo inmediato del equipo no es agregarle funciones, sino comprenderlo, ordenarlo y prepararlo para crecer sin perder lo que ya funciona.

# 2. ¿Qué problema resuelve?

El problema de fondo no es "falta un software para gestionar proyectos de muebles". Es que, en esta industria, comprometerse con un proyecto —cotizarlo a un cliente, comprar material, agendar producción— suele ocurrir antes de saber con certeza si es rentable, cuánto material se va a desperdiciar, o si realmente se puede fabricar como se pensó. Esa incertidumbre tiene un costo económico directo: material mal aprovechado, cotizaciones que no reflejan el costo real, tiempo invertido en recalcular a mano lo que ya se había calculado antes, y decisiones de producción tomadas con información parcial o desactualizada.

ProyCut no resuelve esto agregando más funciones a un catálogo. Lo resuelve haciendo que cada número importante —costo, desperdicio, margen, tiempo— se calcule una sola vez, a partir de datos reales, y se pueda explicar y verificar después. El problema de negocio, en una frase, es que la industria del mueble toma decisiones de fabricación con información aproximada, y ProyCut existe para que esa misma decisión pueda tomarse con información real.

# 3. ¿Quiénes son los usuarios?

La documentación describe un rango amplio de perfiles, agrupables en cinco frentes según qué necesitan obtener del sistema:

**Comercial** — propietario de empresa, administrador y vendedor. Esperan visibilidad del negocio completo, control sobre configuración y permisos, y la capacidad de convertir una conversación con un cliente en una cotización confiable sin fricción.

**Técnico/económico** — diseñador y costeador. Esperan capturar medidas y piezas sin ambigüedad, y obtener un costo que puedan defender: de dónde salió cada número, con qué reglas y con qué precios vigentes.

**Operación** — planificador, comprador, almacenista, operador de corte, operador de producción y supervisor. Esperan que lo que se aprobó comercialmente llegue convertido en trabajo ejecutable: qué comprar, qué cortar, qué ensamblar, en qué orden, sin tener que reinterpretar la cotización original.

**Entrega** — instalador. Espera la información mínima necesaria en el sitio de instalación (piezas, planos, herrajes, observaciones) sin depender de volver a preguntar a la oficina.

**Periféricos** — contabilidad/administración, cliente externo (vía portal) y usuario de centro de corte externo. Cada uno espera una ventana controlada sobre una porción específica de la información: financiera, comercial o de servicio, respectivamente, nunca el sistema completo.

Un mismo negocio pequeño probablemente concentre varios de estos perfiles en una sola persona; la documentación los separa por responsabilidad, no porque asuma que cada uno es un puesto distinto.

# 4. ¿Cuál es la propuesta de valor?

La diferencia de ProyCut no está en cuántas funciones ofrece, sino en que se niega a presentar una aproximación como si fuera un hecho. Evita que el mismo dato (una medida, un precio, una pieza) se capture varias veces en herramientas distintas que después hay que reconciliar a mano. Evita que un cálculo de costo se pierda o se vuelva inexplicable una vez que el proyecto avanza. Evita que la interfaz exija que el usuario aprenda a pensar como el software, en vez de al revés.

Lo que mejora es la velocidad y la confianza con la que alguien puede pasar de "tengo una idea" a "sé exactamente qué me va a costar, qué material necesito y cómo lo voy a cortar". Y lo que en última instancia intenta transformar no es la herramienta que usa la industria, sino la relación que la industria tiene con la incertidumbre: que planificar un proyecto de mueble deje de ser un acto de fe respaldado por cálculos aproximados, y pase a ser una decisión respaldada por datos verificables.

# 5. ¿Cuál es la visión a largo plazo?

Entiendo la evolución de ProyCut como un crecimiento deliberadamente escalonado, no como una lista de funciones por lanzar. Empieza como un prototipo de un solo archivo que se comprende y se ordena sin reescribirse de golpe. De ahí evoluciona a una base de código modular donde la lógica de negocio queda separada de la interfaz y del almacenamiento, todavía como una sola aplicación (no varios servicios). Sobre esa base se construye el núcleo multiempresa —empresas, usuarios, permisos— y recién entonces se conecta una persistencia real, entidad por entidad, no de golpe.

A partir de ahí, el crecimiento es progresivo y siempre condicionado a evidencia: primero se valida que el recorrido central (idea → cotización → optimización → producción) funcione con usuarios reales; solo después se profundiza en inventario y producción avanzada, se agrega visualización 3D como apoyo (no como sustituto de herramientas de diseño especializadas), se conectan integraciones comerciales externas, y se incorpora inteligencia artificial como asistente dentro del producto. La ambición de largo plazo no es acumular módulos, sino que ProyCut se convierta en la referencia con la que la industria del mueble planifica y fabrica — medido por cuántos negocios confían en él, no por cuántas funciones tiene.

# 6. ¿Cuáles son los principios que nunca deben romperse?

- **El proyecto es el centro de todo.** Ningún módulo —ni clientes, ni cotizaciones, ni inventario— es el punto de partida del sistema; todos existen para servir al ciclo de vida de un proyecto. Romper esto convierte a ProyCut en una colección de herramientas inconexas, exactamente lo que busca reemplazar.
- **Reducir la incertidumbre es el criterio final de cualquier decisión.** Una función, por atractiva que parezca, no pertenece al producto si no ahorra tiempo, no simplifica el trabajo o no genera confianza. Este principio es el que evita que el catálogo funcional, deliberadamente enorme, se convierta en obligación de construcción.
- **La tecnología se adapta al usuario, nunca al revés.** Si una herramienta exige que el carpintero cambie su forma de trabajar para poder usarla, la herramienta falló, no el usuario.
- **Ningún cálculo aproximado se presenta como definitivo.** Cuando falta información o existe un supuesto, debe declararse explícitamente. Esto protege la propuesta de valor central: si ProyCut alguna vez muestra un número con más certeza de la que realmente tiene, deja de ser distinto de las hojas de cálculo que reemplaza.
- **Separación estricta entre interfaz, lógica de negocio y persistencia.** La interfaz no calcula ni decide; la base de datos no contiene reglas de negocio. Esto es lo que permite que el sistema evolucione y cambie de proveedor técnico sin poner en riesgo las reglas que protegen al usuario.
- **Aislamiento multiempresa absoluto.** Ningún dato de una empresa es visible ni accesible para otra, sin excepción. Es una condición de confianza, no solo una condición técnica.
- **Cambios pequeños, reversibles y comprendidos antes de aplicarse — nunca reescrituras masivas.** Es el principio que gobierna cómo se construye todo lo demás, incluyendo esta misma etapa de reorganización.
- **La inteligencia artificial asiste, nunca decide por el usuario ni es indispensable para operar.** Si la IA falla o se apaga, el sistema debe seguir funcionando.

# 7. ¿Cómo entiendes la arquitectura propuesta?

Conceptualmente, la arquitectura separa dos preguntas que suelen mezclarse: qué es verdad sobre el negocio, y cómo se muestra o se guarda esa verdad. En el centro está el conocimiento del dominio —qué es un proyecto, qué es una pieza, cómo se calcula un costo, qué transiciones de estado son válidas— y ese conocimiento debe poder existir y verificarse sin depender de una pantalla, de una base de datos concreta ni de un proveedor de inteligencia artificial. Alrededor de ese centro, una capa de coordinación traduce una solicitud real (crear un proyecto, aprobar una cotización) en una secuencia de reglas de negocio, permisos y efectos, sin ella misma contener las reglas. Más afuera, la interfaz solo muestra información y captura acciones, y la infraestructura conecta con el mundo exterior (bases de datos, archivos, proveedores) implementando contratos que el centro define, nunca al revés.

La consecuencia práctica de esta forma de pensar es que las dependencias solo pueden apuntar hacia adentro: la interfaz puede conocer las reglas de negocio, pero las reglas de negocio jamás dependen de cómo se ve una pantalla o de qué proveedor de base de datos se usa. Esto es lo que permite, por ejemplo, cambiar de proveedor de persistencia o de IA sin reescribir lo que realmente importa: cómo se calcula un costo o cómo se decide una transición de estado. Y todo esto arranca, deliberadamente, como una sola aplicación con fronteras internas claras —no como servicios separados— porque esa complejidad adicional solo se justifica cuando exista evidencia real de que hace falta.

# 8. ¿Cómo entiendes el flujo principal del producto?

El recorrido empieza cuando alguien registra un cliente (o una oportunidad comercial todavía no confirmada) y, a partir de ahí, abre un proyecto. Ese proyecto se llena con una descripción real del trabajo: los espacios donde va a instalarse, los muebles que lo componen y, dentro de ellos, cada pieza con sus medidas, su material y sus operaciones necesarias (cantos, perforaciones, acabado). Esa misma información de piezas se cruza con un catálogo de materiales, herrajes y proveedores con precios vigentes, y de ahí sale un costo real —no una aproximación— que distingue material, mano de obra, maquinaria, desperdicio y gastos indirectos. Sobre ese costo se aplica una política de margen y se genera una cotización, que puede tener versiones y opciones, y que se le presenta al cliente sin exponer los números internos que no le corresponden.

Cuando el cliente aprueba, esa misma información de piezas —sin volver a capturarse— alimenta un motor de optimización que decide cómo cortar tableros reales con el menor desperdicio posible, produciendo planos de corte y etiquetas. La producción ejecuta ese plan: corta, arma, controla calidad, empaca y entrega o instala, dejando un registro de lo que realmente ocurrió. El proyecto se cierra con esa evidencia, y ese cierre —costos reales, tiempos reales, desperdicio real— es lo que permite que el siguiente proyecto se cotice con información cada vez más precisa. La idea que sostiene todo el recorrido es que el dato se captura una sola vez, al principio, y viaja intacto hasta la fabricación.

# 9. ¿Qué módulos identifico?

Como capacidades de negocio, no como componentes técnicos: gestión de clientes y contactos; seguimiento comercial de oportunidades; gestión de proyectos como unidad central; levantamiento de espacios y medidas; diseño de muebles y piezas; catálogo de materiales, herrajes y proveedores; costeo; definición de precios y márgenes; cotizaciones y aprobaciones; planeación del proyecto aprobado; compras; inventario (incluyendo retazos); optimización de corte; generación de etiquetas; producción y control de operaciones; capacidad y programación; control de calidad e incidencias; empaque, entrega e instalación; postventa y garantías; documentos y archivos; reportes y analítica del negocio; asistencia de inteligencia artificial; portal de consulta para el cliente; soporte para centros de corte que prestan servicio a terceros; y administración de la suscripción del propio ProyCut como servicio.

# 10. ¿Qué módulos NO forman parte del MVP?

La documentación es explícita en que la primera versión utilizable se concentra únicamente en el recorrido central —cliente, proyecto, piezas, materiales, costeo, cotización, optimización, planos, etiquetas e inventario y producción básicos— y deja fuera, por ahora: un sistema de contabilidad completo (ProyCut registra información operativa, no sustituye una contabilidad formal); programación de capacidad avanzada y mantenimiento industrial (siguen dependiendo de que el flujo de producción básico ya esté probado); logística compleja; inteligencia artificial autónoma (la IA solo debe asistir, nunca operar sin supervisión); modelado o CAD avanzado (la visualización 3D se plantea como apoyo posterior, no como reemplazo de herramientas de diseño especializadas); nómina y un CRM genérico (ProyCut no busca convertirse en una plataforma de recursos humanos ni de ventas desconectada de proyectos); microservicios (la arquitectura arranca intencionalmente como una sola aplicación); un marketplace; y comercio electrónico o integraciones de pago completas. La razón común a toda esta lista no es que sean malas ideas, sino que ninguna de ellas es necesaria para demostrar que el recorrido central —idea, costo real, cotización, fabricación— ya funciona con usuarios reales.

# 11. ¿Qué riesgos identifico?

- **Alcance funcional desproporcionado para la etapa actual.** El catálogo funcional describe, con mucho detalle, algo cercano a un sistema integral de gestión para toda la industria. El riesgo no es que esa visión exista, sino que se empiece a construir en profundidad antes de validar que el recorrido central funciona.
- **Pérdida de simplicidad por exceso de configurabilidad temprana.** La documentación permite configurar numeraciones, estados personalizados, plantillas y valores por sucursal, almacén, centro de trabajo, proyecto y usuario desde el diseño. Ofrecer todo eso desde el primer día contradice el principio de que la interfaz debe pensar antes que el usuario, no multiplicar sus decisiones.
- **Funciones descritas con gran profundidad pero sin validar con un usuario real.** Capacidades como el portal del cliente, el soporte a centros de corte externos o la asistencia de IA dentro del producto están completamente especificadas, pero nada en la documentación confirma que ya exista una empresa real usando el flujo básico.
- **Modelo de datos más ambicioso que el alcance inicial.** El documento de base de datos describe cerca de noventa entidades agrupadas en diecisiete dominios; construir de más antes de que exista necesidad comprobada reintroduce exactamente la complejidad que el proyecto busca evitar.
- **Riesgo de que la documentación y el prototipo real no coincidan.** Toda la comprensión reflejada aquí proviene de documentos de intención, no del código. Es un riesgo inherente a esta etapa, no un defecto de la documentación, pero debe reconocerse antes de asumir que el prototipo ya se comporta como se describe.
- **Crecimiento desordenado si no se respeta la secuencia planeada.** El propio proyecto advierte que no debe agregarse funcionalidad sobre una base todavía no comprendida ni ordenada; el riesgo es más de disciplina de ejecución que de diseño.

# 12. ¿Qué fortalezas identifico?

ProyCut parte de un principio organizador poco común en esta etapa de un producto: casi cualquier decisión, por dispersa que parezca, puede evaluarse contra una sola pregunta — ¿esto reduce la incertidumbre del usuario? Esa disciplina, aplicada de forma consistente en toda la documentación, da coherencia real a un alcance que de otro modo sería enorme. El proyecto también distingue con claridad entre "todo lo que el producto podría llegar a ser" y "lo mínimo que hay que construir primero", lo cual reduce directamente el riesgo de sobreconstrucción antes de validar.

El problema que ataca —costo real y desperdicio real en la fabricación de muebles— es un problema económico concreto y verificable, no una necesidad genérica de "gestión de proyectos", lo que le da a ProyCut un terreno natural para reglas de negocio precisas, calculables y comprobables. Y, para un producto todavía en etapa de prototipo, la existencia de un sistema de gobernanza documental explícito, capaz de auditarse y corregirse a sí mismo, es una señal de madurez de proceso que reduce el riesgo de que la reorganización técnica se haga a ciegas.

# 13. ¿Qué dudas permanecen?

- ¿Cuál es, en la práctica, el alcance real de las primeras entidades a persistir? `README.md` y `docs/engineering/ROADMAP.md` proponen un conjunto; `docs/engineering/07-DATABASE.md` propone otro distinto para el mismo momento del proyecto, y la documentación no resuelve cuál prevalece.
- ¿Los proveedores externos mencionados junto a Supabase (por ejemplo, un proveedor de pagos o de inteligencia artificial específico) son ejemplos ilustrativos del principio de "todo debe ser reemplazable", o decisiones de producto ya tomadas? El texto no lo distingue.
- ¿Quién es responsable de cada documento y, por extensión, de cada módulo de negocio? Ningún documento asigna propietarios.
- ¿Qué tan fiel es el prototipo actual (`index.html`) a lo que aquí se describe como visión e intención? Esta comprensión es enteramente documental; no hay todavía ningún punto de contraste con el comportamiento real del sistema.
- ¿Existen ya negocios o usuarios reales interesados en usar ProyCut, o el conjunto de perfiles de usuario es todavía una hipótesis de producto?
- ¿Qué tecnología base (lenguaje, framework, herramientas) se usará? La documentación es explícita en que esa decisión se pospone deliberadamente hasta después de analizar el código existente.

# 14. ¿Qué decisiones ya considero cerradas?

- El proyecto es el centro del sistema; ningún módulo puede convertirse en el punto de partida en su lugar.
- La incertidumbre reducida es el criterio último para aceptar o rechazar cualquier función.
- El sistema será multiempresa, con aislamiento estricto de datos entre empresas.
- La arquitectura arranca como una sola aplicación modular (monolito modular), no como microservicios.
- Las reglas de negocio viven separadas de la interfaz y de la persistencia, sin excepción.
- Ningún cálculo aproximado puede mostrarse como si fuera un costo definitivo.
- La inteligencia artificial es un módulo desacoplado y nunca una condición para que el sistema funcione.
- El prototipo actual no se reescribe de golpe: primero se comprende su comportamiento real, después se reorganiza.
- Supabase ya es el proveedor de persistencia elegido para la primera capa de backend (aunque el alcance exacto de qué entidades se conectan primero todavía está en disputa entre documentos, según se señaló en la sección 13).

# 15. ¿Qué decisiones todavía deben validarse?

- Qué funciones descritas en la documentación existen realmente hoy en el prototipo, y cuáles son visión todavía no construida.
- Qué comportamientos actuales del prototipo son intencionales y deben conservarse tal cual, frente a cuáles son errores o efectos secundarios no deseados.
- Cuál es, en la práctica, el conjunto real de entidades necesarias para la primera etapa de datos, resolviendo la discrepancia señalada en la sección 13 con evidencia del código y no solo con documentación.
- Qué subconjunto real de los perfiles de usuario descritos corresponde a los primeros negocios que usarán ProyCut.
- Si la arquitectura de capas propuesta es proporcional al tamaño y complejidad reales del prototipo heredado, o si conviene adoptarla de forma más gradual.
- Qué base tecnológica concreta se usará, decisión explícitamente pospuesta hasta después del diagnóstico del código.

# 16. ¿Cuál debería ser el siguiente paso?

La siguiente actividad de ingeniería es el diagnóstico técnico del prototipo existente: leer y analizar el código real sin modificarlo, inventariar su comportamiento, su estructura y sus dependencias reales, y dejar constancia de qué debe conservarse antes de tomar cualquier decisión de reorganización. Ese diagnóstico es también el momento natural para contrastar, con evidencia real, las dudas señaladas en la sección 13 y confirmar cuáles de las decisiones que hoy parecen cerradas (sección 14) siguen sosteniéndose frente al comportamiento real del sistema.

# 17. Nivel de comprensión

**85%.**

La comprensión de la intención, la filosofía, el modelo funcional y la arquitectura conceptual de ProyCut es sólida: la documentación es extensa, internamente referenciada y —salvo las contradicciones puntuales ya identificadas— coherente entre sus distintos niveles de autoridad. El 15% restante no es un vacío de lectura, sino una limitación honesta de esta etapa: existen contradicciones abiertas dentro de la propia documentación (alcance inicial de datos, estatus real de ciertos proveedores) que impiden afirmar con certeza total "así es como va a funcionar", y no existe todavía ningún punto de contraste con el prototipo real, que es, en última instancia, la fuente de verdad sobre lo que el sistema hace hoy.

# 18. Checklist de comprensión

- ¿Entiendo el propósito del producto? Sí
- ¿Entiendo el flujo principal? Sí
- ¿Entiendo el MVP? Sí
- ¿Entiendo la arquitectura conceptual? Sí
- ¿Entiendo los principios? Sí
- ¿Entiendo qué no debo modificar? Sí
- ¿Estoy listo para analizar el código? Sí, con las dudas de la sección 13 explícitamente pendientes de contrastar contra el código, no contra más documentación.

# 19. Conclusión

La documentación oficial de ProyCut es suficiente para comenzar el análisis técnico del código. No porque esté libre de contradicciones —no lo está, y este mismo documento señala cuáles siguen abiertas— sino porque da un marco claro y consistente de qué debe protegerse, qué problema resuelve el sistema y en qué orden debe crecer, que es exactamente lo que se necesita para analizar un prototipo existente sin perderse ni improvisar criterios sobre la marcha. Las contradicciones detectadas no bloquean el diagnóstico del código; lo que exigen es que, durante ese diagnóstico, cualquier hallazgo que confirme una interpretación sobre otra (por ejemplo, qué entidades de datos usa realmente el prototipo) se documente explícitamente, en vez de asumirse en silencio. En ese sentido, la documentación es una base suficiente para empezar a comprender el código — no todavía una base suficiente para tomar decisiones definitivas de arquitectura, que es, por diseño, el paso siguiente al diagnóstico y no este.
