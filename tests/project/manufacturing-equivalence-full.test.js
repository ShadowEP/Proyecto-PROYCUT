const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const archivos = [
  'src/scripts/utils/format.js',
  'src/scripts/costing/calculate-costs.js',
  'src/scripts/fabrication/manufacturing-part.js',
  'src/scripts/fabrication/manufacturing-board.js',
  'src/scripts/fabrication/manufacturing-operation.js',
  'src/scripts/fabrication/subassembly.js',
  'src/scripts/fabrication/build-manufacturing-model.js',
  'src/scripts/fabrication/manufacturing-input.js',
  'src/scripts/fabrication/compare-manufacturing-input.js',
  'src/scripts/fabrication/compare-optimization-result.js',
  'src/scripts/fabrication/optimization-result.js',
  'src/scripts/fabrication/cost-result.js',
  'src/scripts/fabrication/manufacturing-execution-snapshot.js',
  'src/scripts/fabrication/manufacturing-cost-adapter.js',
  'src/scripts/fabrication/compare-cost-result.js',
  'src/scripts/project/manufacturing-pipeline.js',
  'src/scripts/project/prepare-project.js',
  'src/scripts/project/optimize-project.js',
  'src/scripts/fabrication/manufacturing-optimizer-adapter.js',
  'src/scripts/fabrication/manufacturing-execution-facade.js'
];
const contexto = vm.createContext({window:{}, console});
archivos.forEach(archivo => vm.runInContext(
  fs.readFileSync(path.join(raiz, archivo), 'utf8'),
  contexto,
  {filename:archivo}
));

const {buildManufacturingPipeline} = contexto.window.ProyCutManufacturingPipeline;
const {optimizarProyectoPreparado} = contexto.window.ProyCutProjectOptimization;
const {ejecutarManufacturingExecution} = contexto.window.ProyCutManufacturingExecutionFacade;
const {compararResultadoCostos} = contexto.window.ProyCutCostComparison;
const {calcularCostosProyecto} = contexto.window.ProyCutCosting;
const {prepararProyectoParaOptimizacion} = contexto.window.ProyCutProjectPreparation;

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

const materiales = [
  {sku:'MAT-1', nombre:'Melamina', largo:2440, ancho:1220, espesor:15, precio:700, precioVenta:1000},
  {sku:'MAT-2', nombre:'MDF', largo:2800, ancho:2070, espesor:18, precio:800, precioVenta:1200}
];
const tapacantos = [{sku:'TAP-1', nombre:'PVC', precio:10, precioVenta:20}];

function fila({
  id, cantidad=1, material='Melamina', largo=700, ancho=400, tapacanto=false,
  girarModo='normal', ladosTapacanto
}){
  const lados = ladosTapacanto || {
    l1:tapacanto, l2:false, a1:tapacanto, a2:false
  };
  return {
    id:String(id), cantTexto:String(cantidad), largoTexto:String(largo), anchoTexto:String(ancho),
    girarModo, material, tapaTipo:tapacanto ? 'PVC' : '',
    l1:lados.l1, l2:lados.l2, a1:lados.a1, a2:lados.a2, labelTexto:`Pieza ${id}`
  };
}

function expandirActual(filas, {permitirGirarAuto=false, parametros=parametrosTecnicos()}={}){
  const piezas = [];
  filas.forEach(item => {
    let girarModo = item.girarModo;
    if(girarModo === 'auto' && !permitirGirarAuto) girarModo = 'normal';
    for(let indice=0; indice<Number(item.cantTexto); indice++){
      piezas.push({
        num:item.id, label:item.labelTexto, l:Number(item.largoTexto), a:Number(item.anchoTexto),
        girarModo, material:item.material, tapaTipo:item.tapaTipo,
        l1:item.l1, l2:item.l2, a1:item.a1, a2:item.a2,
        kerfEfectivo:parametros.kerfEfectivo,
        kerfEntrePiezasEfectivo:parametros.kerfEntrePiezasEfectivo,
        kerfPiezaSobranteEfectivo:parametros.kerfPiezaSobranteEfectivo,
        kerfBordeExteriorEfectivo:parametros.kerfBordeExteriorEfectivo
      });
    }
  });
  return piezas;
}

function parametrosTecnicos(){
  return {
    ok:true, errores:[], kerfEfectivo:4, kerfEntrePiezasEfectivo:4,
    kerfPiezaSobranteEfectivo:4, kerfBordeExteriorEfectivo:0
  };
}

function agruparPiezasPorMaterial(piezas){
  const grupos = {};
  piezas.forEach(pieza => {
    (grupos[pieza.material] = grupos[pieza.material] || []).push(pieza);
  });
  return grupos;
}

function dependenciasOptimizador(){
  return {
    medidaTableroDeMaterial:nombre => {
      const material = materiales.find(item => item.nombre === nombre);
      return {largo:material.largo, ancho:material.ancho};
    },
    establecerMedidaTableroActiva:() => {},
    calcularRectanguloUtilTablero:(largo, ancho, margenes) => ({
      ok:true, rect:{x:0, y:0, w:largo, h:ancho}, margenes
    }),
    obtenerKerfMaterial:() => ({valor:4, entrePiezas:4, piezaSobrante:4, bordeExterior:0}),
    calcularRectanguloColocacion:rect => ({ok:true, rect:{...rect}}),
    empacarMaterial:(piezas, kerf, libre, nivel, datosTablero) => [{
      boardW:datosTablero.boardW,
      boardH:datosTablero.boardH,
      areaUtil:{...datosTablero.areaUtil},
      areaColocacion:{...datosTablero.areaColocacion},
      margenes:{...datosTablero.margenes},
      freeRects:[],
      pieces:piezas.map((pieza, indice) => ({
        ...pieza,
        x:(indice % 3) * (pieza.l + kerf),
        y:Math.floor(indice / 3) * (pieza.a + kerf),
        w:pieza.l,
        h:pieza.a,
        rotada:false
      }))
    }],
    compactarHaciaAbajo:() => {},
    contarCortes:board => ({
      cortes:board.pieces.length * 2,
      largoMm:board.pieces.reduce((total, pieza) => total + pieza.w + pieza.h, 0)
    })
  };
}

function ejecutarProyecto(filas, configuracion={}){
  const nivelOptimizacion = configuracion.nivelOptimizacion || 'normal';
  const libre = configuracion.libre === true;
  const permitirGirarAuto = nivelOptimizacion !== 'normal';
  const parametros = configuracion.parametrosTecnicos || parametrosTecnicos();
  const margenes = configuracion.margenes || {superior:0, derecho:0, inferior:0, izquierdo:0};
  const piezasActuales = expandirActual(filas, {permitirGirarAuto, parametros});
  const pipeline = buildManufacturingPipeline({
    filasPiezas:filas,
    materiales,
    tapacantos,
    cantidadProyectos:1,
    permitirGirarAuto,
    piezasActuales,
    obtenerParametrosTecnicos:() => parametros,
    desarrollo:false
  });
  const parametrosCorteProyecto = {margenes};
  const opcionesProyecto = {libre, nivelOptimizacion};
  const dependenciasOptimizer = dependenciasOptimizador();
  const resultadoActual = optimizarProyectoPreparado({
    gruposPorMaterial:agruparPiezasPorMaterial(piezasActuales),
    parametrosCorteProyecto,
    opcionesProyecto,
    dependencias:dependenciasOptimizer
  });
  const costoBase = {
    materiales,
    componentes:[],
    componentesProyecto:[],
    tapacantos,
    cantidadProyectos:1,
    modoPrecioCorte:'corte',
    precioCorte:5,
    precioCorteMetro:2,
    redondearTapacanto:false
  };
  const costoActual = calcularCostosProyecto({
    ...costoBase,
    piezas:piezasActuales,
    boards:resultadoActual.boards,
    tablerosPorMaterial:resultadoActual.tablerosPorMaterial,
    totalCortes:resultadoActual.totalCortes,
    totalCorteMm:resultadoActual.totalCorteMm
  });
  const execution = ejecutarManufacturingExecution({
    manufacturingPipeline:pipeline,
    parametrosCorteProyecto,
    opcionesProyecto,
    dependenciasOptimizer,
    datosProyectoCosting:{
      ...costoBase,
      piezas:pipeline.optimizerInput.piezas
    },
    dependenciasCosting:{calcularCostosProyecto},
    resultadoLegacy:{
      optimizationResult:resultadoActual,
      costResult:costoActual
    }
  });
  const costoMixto = calcularCostosProyecto({
    ...costoBase,
    piezas:piezasActuales,
    boards:execution.optimizationResult.boards,
    tablerosPorMaterial:execution.optimizationResult.tablerosPorMaterial,
    totalCortes:execution.optimizationResult.totalCortes,
    totalCorteMm:execution.optimizationResult.totalCorteMm
  });
  return {
    piezasActuales,
    pipeline,
    resultadoActual,
    execution,
    costoActual,
    costoFabrication:execution.costResult,
    costoMixto
  };
}

function verificarEquivalencia(resultado){
  assert.strictEqual(resultado.pipeline.equivalenceReport.compatible, true);
  assert.strictEqual(resultado.execution.optimizationComparison.compatible, true);
  assert.strictEqual(resultado.execution.costComparison.compatible, true);
  assert.strictEqual(compararResultadoCostos(resultado.costoActual, resultado.costoMixto).compatible, true);
}

probar('pieza simple conserva board posicion cortes y costo', () => {
  const resultado = ejecutarProyecto([fila({id:1})]);
  verificarEquivalencia(resultado);
  assert.strictEqual(resultado.resultadoActual.boards.length, 1);
  assert.strictEqual(resultado.resultadoActual.boards[0].pieces[0].x, 0);
  assert.strictEqual(resultado.costoActual.datosReporte.costoTotal, resultado.costoFabrication.datosReporte.costoTotal);
});

probar('dos materiales conservan agrupacion y boards', () => {
  const resultado = ejecutarProyecto([
    fila({id:1, material:'Melamina'}),
    fila({id:2, material:'MDF', largo:600, ancho:300})
  ]);
  verificarEquivalencia(resultado);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(resultado.resultadoActual.tablerosPorMaterial)),
    {Melamina:1, MDF:1}
  );
});

probar('cantidad diez permanece especificacion y se expande a diez unidades', () => {
  const resultado = ejecutarProyecto([fila({id:1, cantidad:10})]);
  verificarEquivalencia(resultado);
  assert.strictEqual(resultado.pipeline.manufacturingModel.piezasFabricacion[0].cantidad, 10);
  assert.strictEqual(resultado.pipeline.optimizerInput.piezas.length, 10);
  assert.strictEqual(resultado.execution.optimizationResult.boards[0].pieces.length, 10);
});

probar('tapacanto conserva lados metraje y costo', () => {
  const resultado = ejecutarProyecto([fila({id:1, cantidad:2, tapacanto:true})]);
  verificarEquivalencia(resultado);
  assert.strictEqual(resultado.pipeline.optimizerInput.piezas[0].l1, true);
  assert.strictEqual(resultado.pipeline.optimizerInput.piezas[0].a1, true);
  assert.strictEqual(
    resultado.costoActual.datosReporte.costoTapacanto,
    resultado.costoFabrication.datosReporte.costoTapacanto
  );
});

probar('proyecto completo conserva boards cortes metricas y costos', () => {
  const resultado = ejecutarProyecto([
    fila({id:1, cantidad:4, material:'Melamina', tapacanto:true}),
    fila({id:2, cantidad:3, material:'Melamina', largo:500, ancho:250}),
    fila({id:3, cantidad:2, material:'MDF', largo:900, ancho:350, tapacanto:true})
  ]);
  verificarEquivalencia(resultado);
  assert.strictEqual(resultado.resultadoActual.totalCortes, resultado.execution.optimizationResult.totalCortes);
  assert.strictEqual(resultado.resultadoActual.totalCorteMm, resultado.execution.optimizationResult.totalCorteMm);
  assert.strictEqual(resultado.resultadoActual.boards.length, resultado.execution.optimizationResult.boards.length);
});

probar('rotacion normal rotada y auto conserva entrada por nivel real', () => {
  ['normal', 'optimizada', 'completa'].forEach(nivelOptimizacion => {
    const resultado = ejecutarProyecto([
      fila({id:1, girarModo:'normal'}),
      fila({id:2, girarModo:'rotado'}),
      fila({id:3, girarModo:'auto'})
    ], {nivelOptimizacion});
    verificarEquivalencia(resultado);
    assert.deepStrictEqual(
      JSON.parse(JSON.stringify(resultado.pipeline.optimizerInput.piezas.map(item => item.girarModo))),
      nivelOptimizacion === 'normal'
        ? ['normal', 'rotado', 'normal']
        : ['normal', 'rotado', 'auto']
    );
  });
});

probar('tapacanto conserva simultaneamente L1 L2 A1 A2 y expansion', () => {
  const resultado = ejecutarProyecto([fila({
    id:1,
    cantidad:3,
    tapacanto:true,
    ladosTapacanto:{l1:true, l2:true, a1:true, a2:true}
  })]);
  verificarEquivalencia(resultado);
  assert.strictEqual(resultado.pipeline.optimizerInput.piezas.length, 3);
  resultado.pipeline.optimizerInput.piezas.forEach(item => {
    assert.strictEqual(item.tapaTipo, 'PVC');
    assert.deepStrictEqual([item.l1, item.l2, item.a1, item.a2], [true, true, true, true]);
  });
});

probar('margenes distintos y kerfs efectivos distintos conservan optimizacion y costos', () => {
  const parametros = {
    ok:true,
    errores:[],
    kerfEfectivo:6,
    kerfEntrePiezasEfectivo:4,
    kerfPiezaSobranteEfectivo:3,
    kerfBordeExteriorEfectivo:2
  };
  const margenes = {superior:11, derecho:17, inferior:23, izquierdo:29};
  const resultado = ejecutarProyecto([fila({id:1, cantidad:2})], {
    parametrosTecnicos:parametros,
    margenes
  });
  verificarEquivalencia(resultado);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(resultado.pipeline.optimizerInput.piezas[0])),
    JSON.parse(JSON.stringify(resultado.piezasActuales[0]))
  );
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(resultado.execution.optimizationResult.boards[0].margenes)),
    margenes
  );
});

probar('dimensiones distintas cantidades y materiales intercalados conservan orden fisico', () => {
  const resultado = ejecutarProyecto([
    fila({id:1, cantidad:2, material:'Melamina'}),
    fila({id:2, cantidad:3, material:'MDF'}),
    fila({id:3, cantidad:2, material:'Melamina'})
  ]);
  verificarEquivalencia(resultado);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(resultado.pipeline.optimizerInput.piezas.map(item => item.num))),
    ['1', '1', '2', '2', '2', '3', '3']
  );
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(resultado.pipeline.manufacturingModel.tableros.map(item => [
      item.sku, item.material, item.largo, item.ancho, item.espesor
    ]))),
    [
      ['MAT-1', 'Melamina', 2440, 1220, 15],
      ['MAT-2', 'MDF', 2800, 2070, 18]
    ]
  );
});

probar('modo libre se propaga igual por ambas rutas sin sustituir el packer real', () => {
  const resultado = ejecutarProyecto([
    fila({id:1, cantidad:4, material:'Melamina'}),
    fila({id:2, cantidad:2, material:'MDF'})
  ], {libre:true, nivelOptimizacion:'completa'});
  verificarEquivalencia(resultado);
  assert.strictEqual(resultado.execution.optimizationResult.boards.length, resultado.resultadoActual.boards.length);
  assert.strictEqual(resultado.execution.optimizationResult.totalCortes, resultado.resultadoActual.totalCortes);
  assert.strictEqual(resultado.execution.optimizationResult.totalCorteMm, resultado.resultadoActual.totalCorteMm);
});

probar('la barrera legacy bloquea validacion parametros y piezas antes del optimizer', () => {
  let llamadasLeerPiezas = 0;
  const base = {
    modeloProyecto:{},
    validarProyecto:() => ({ok:true, errores:[]}),
    resolverParametrosCorte:() => ({ok:true, errores:[]}),
    leerOpcionesProyecto:() => ({libre:false, nivelOptimizacion:'normal'}),
    leerPiezas:() => {
      llamadasLeerPiezas++;
      return {piezas:[], errores:['Pieza invalida o no cabe en el tablero.']};
    }
  };
  const dimensionCantidadMaterial = prepararProyectoParaOptimizacion(base);
  assert.strictEqual(dimensionCantidadMaterial.ok, false);
  assert.strictEqual(dimensionCantidadMaterial.etapa, 'piezas');
  assert.strictEqual(llamadasLeerPiezas, 1);

  const validacion = prepararProyectoParaOptimizacion({
    ...base,
    validarProyecto:() => ({ok:false, errores:['Dimension, cantidad o material invalido.']})
  });
  assert.strictEqual(validacion.ok, false);
  assert.strictEqual(validacion.etapa, 'validacion');
  assert.strictEqual(llamadasLeerPiezas, 1);

  const parametros = prepararProyectoParaOptimizacion({
    ...base,
    resolverParametrosCorte:() => ({ok:false, errores:['Parametros tecnicos invalidos.']})
  });
  assert.strictEqual(parametros.ok, false);
  assert.strictEqual(parametros.etapa, 'parametros-corte');
  assert.strictEqual(llamadasLeerPiezas, 1);
});

probar('error de ManufacturingInput invalida equivalencia sin alterar fallback legacy especificado', () => {
  const piezasActuales = expandirActual([fila({id:1, material:'Material inexistente'})]);
  const pipeline = buildManufacturingPipeline({
    filasPiezas:[fila({id:1, material:'Material inexistente'})],
    materiales,
    tapacantos,
    cantidadProyectos:1,
    permitirGirarAuto:false,
    piezasActuales,
    obtenerParametrosTecnicos:parametrosTecnicos,
    desarrollo:false
  });
  assert.strictEqual(pipeline.equivalenceReport.compatible, false);
  assert.ok(pipeline.optimizerInput.errores.length > 0);
  const fuenteSeleccionada = pipeline.equivalenceReport.compatible === true
    && pipeline.optimizerInput.errores.length === 0
    ? pipeline.optimizerInput.gruposPorMaterial
    : agruparPiezasPorMaterial(piezasActuales);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(fuenteSeleccionada)),
    JSON.parse(JSON.stringify(agruparPiezasPorMaterial(piezasActuales)))
  );
});

probar('comparadores reportan diferencias sin corregir resultados', () => {
  const resultado = ejecutarProyecto([fila({id:1})]);
  resultado.execution.optimizationResult.boards[0].pieces[0].x = 25;
  const comparacion = contexto.window.ProyCutOptimizationComparison.compararResultadoOptimizacion(
    resultado.resultadoActual,
    resultado.execution.optimizationResult
  );
  assert.strictEqual(comparacion.compatible, false);
  assert.ok(comparacion.diferencias.some(item => item.campo === 'x'));
  const costoAlterado = JSON.parse(JSON.stringify(resultado.costoFabrication));
  costoAlterado.datosReporte.costoTotal += 1;
  assert.strictEqual(compararResultadoCostos(resultado.costoActual, costoAlterado).compatible, false);
});

probar('selector productivo conserva referencias y aplica gate con fallback legacy', () => {
  const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');
  const selector = main.slice(
    main.indexOf('const puedeUsarManufacturingInput ='),
    main.indexOf('const optimizacion = optimizarProyectoPreparado({')
  );
  const evaluarSelector = new Function(
    'libre',
    'manufacturingPipeline',
    'porMaterial',
    `${selector}; return gruposPorMaterialOptimizer;`
  );
  const manufacturing = {Melamina:[{num:'manufacturing'}]};
  const legacy = {Melamina:[{num:'legacy'}]};
  function seleccionar({compatible, errores, libre}){
    return evaluarSelector(libre, {
      equivalenceReport:{compatible},
      optimizerInput:{errores, gruposPorMaterial:manufacturing}
    }, legacy);
  }
  assert.strictEqual(seleccionar({compatible:true, errores:[], libre:false}), manufacturing);
  assert.strictEqual(seleccionar({compatible:false, errores:[], libre:false}), legacy);
  assert.strictEqual(seleccionar({compatible:true, errores:['error'], libre:false}), legacy);
  assert.strictEqual(seleccionar({compatible:false, errores:['error'], libre:false}), legacy);
  assert.strictEqual(seleccionar({compatible:true, errores:[], libre:true}), legacy);
  assert.ok(selector.includes('manufacturingPipeline.optimizerInput.gruposPorMaterial'));
  assert.ok(!selector.includes('.map('));
  assert.ok(!selector.includes('Object.assign'));
  assert.ok(!selector.includes('structuredClone'));
});

probar('main mantiene Costing legacy y limita facade a PROYCUT_DEV', () => {
  const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');
  const activo = main.slice(
    main.indexOf('const optimizacion = optimizarProyectoPreparado({'),
    main.indexOf('if(window.PROYCUT_DEV === true){')
  );
  assert.ok(activo.includes('gruposPorMaterial: gruposPorMaterialOptimizer'));
  assert.ok(activo.includes('const resultadoCostos = calcularCostosProyecto({'));
  assert.ok(activo.includes('piezas,'));
  assert.ok(main.includes('if(window.PROYCUT_DEV === true){'));
  assert.ok(main.includes('ejecutarManufacturingExecution({'));
  assert.ok(main.includes("console.info('Manufacturing full equivalence'"));
});
