const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const archivos = [
  'src/scripts/fabrication/manufacturing-part.js',
  'src/scripts/fabrication/manufacturing-board.js',
  'src/scripts/fabrication/manufacturing-operation.js',
  'src/scripts/fabrication/subassembly.js',
  'src/scripts/fabrication/build-manufacturing-model.js',
  'src/scripts/fabrication/manufacturing-input.js',
  'src/scripts/fabrication/compare-manufacturing-input.js',
  'src/scripts/project/manufacturing-pipeline.js'
];
const contexto = vm.createContext({window:{}});
archivos.forEach(archivo => vm.runInContext(
  fs.readFileSync(path.join(raiz, archivo), 'utf8'),
  contexto,
  {filename:archivo}
));
const {buildManufacturingPipeline} = contexto.window.ProyCutManufacturingPipeline;

function plano(valor){
  return JSON.parse(JSON.stringify(valor));
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

const material = {
  sku:'T-000001', nombre:'Melamina', largo:2440, ancho:1220,
  espesor:15, precio:700, precioVenta:1000
};
const tapacanto = {sku:'E-000001', nombre:'PVC', precio:10, precioVenta:20};

function crearFila(cantidad){
  return {
    id:'1', cantTexto:String(cantidad), largoTexto:'700', anchoTexto:'400',
    girarModo:'normal', material:'Melamina', tapaTipo:'PVC',
    l1:true, l2:false, a1:true, a2:false, labelTexto:'Puerta'
  };
}

function piezaActual(){
  return {
    num:'1', label:'Puerta', l:700, a:400, girarModo:'normal',
    material:'Melamina', tapaTipo:'PVC', l1:true, l2:false, a1:true, a2:false,
    kerfEfectivo:4, kerfEntrePiezasEfectivo:4,
    kerfPiezaSobranteEfectivo:4, kerfBordeExteriorEfectivo:0
  };
}

function parametros(){
  return {
    ok:true, kerfEfectivo:4, kerfEntrePiezasEfectivo:4,
    kerfPiezaSobranteEfectivo:4, kerfBordeExteriorEfectivo:0
  };
}

function ejecutar({cantidad, piezasActuales, desarrollo, logger}){
  return buildManufacturingPipeline({
    filasPiezas:[crearFila(cantidad)],
    materiales:[material],
    tapacantos:[tapacanto],
    cantidadProyectos:1,
    permitirGirarAuto:false,
    piezasActuales,
    obtenerParametrosTecnicos:parametros,
    desarrollo,
    logger
  });
}

probar('una pieza produce entrada equivalente', () => {
  const resultado = ejecutar({cantidad:1, piezasActuales:[piezaActual()]});
  assert.strictEqual(resultado.manufacturingModel.piezasFabricacion.length, 1);
  assert.strictEqual(resultado.optimizerInput.piezas.length, 1);
  assert.strictEqual(resultado.optimizerInput.gruposPorMaterial.Melamina[0], resultado.optimizerInput.piezas[0]);
  assert.deepStrictEqual(plano(resultado.optimizerInput.piezas[0]), piezaActual());
  assert.deepStrictEqual(plano(resultado.equivalenceReport), {compatible:true, diferencias:[]});
});

probar('cantidad cinco permanece agrupada y se expande solo para optimizer input', () => {
  const actuales = Array.from({length:5}, piezaActual);
  const resultado = ejecutar({cantidad:5, piezasActuales:actuales});
  assert.strictEqual(resultado.manufacturingModel.piezasFabricacion[0].cantidad, 5);
  assert.strictEqual(resultado.manufacturingModel.piezasFabricacion.length, 1);
  assert.strictEqual(resultado.optimizerInput.piezas.length, 5);
  assert.strictEqual(resultado.equivalenceReport.compatible, true);
});

probar('tapacanto conserva tipo SKU y lados', () => {
  const resultado = ejecutar({cantidad:1, piezasActuales:[piezaActual()]});
  const lados = resultado.manufacturingModel.piezasFabricacion[0].ladosTapacanto;
  assert.deepStrictEqual(plano(lados), {
    tipo:{sku:'E-000001', nombre:'PVC'},
    l1:{sku:'E-000001', nombre:'PVC'},
    l2:null,
    a1:{sku:'E-000001', nombre:'PVC'},
    a2:null
  });
  assert.strictEqual(resultado.optimizerInput.piezas[0].tapaTipo, 'PVC');
  assert.strictEqual(resultado.optimizerInput.piezas[0].l1, true);
  assert.strictEqual(resultado.optimizerInput.piezas[0].a1, true);
});

probar('comparador informa campo diferente sin corregirlo', () => {
  const anterior = piezaActual();
  anterior.material = 'MDF';
  const resultado = ejecutar({cantidad:1, piezasActuales:[anterior]});
  assert.strictEqual(resultado.equivalenceReport.compatible, false);
  assert.deepStrictEqual(plano(resultado.equivalenceReport.diferencias[0]), {
    entidad:'pieza',
    indice:0,
    campo:'material',
    anterior:'MDF',
    nuevo:'Melamina'
  });
  assert.strictEqual(resultado.optimizerInput.piezas[0].material, 'Melamina');
});

probar('log se emite solo con bandera de desarrollo', () => {
  const llamadas = [];
  const logger = {info:(mensaje, reporte) => llamadas.push([mensaje, reporte])};
  ejecutar({cantidad:1, piezasActuales:[piezaActual()], desarrollo:false, logger});
  assert.strictEqual(llamadas.length, 0);
  ejecutar({cantidad:1, piezasActuales:[piezaActual()], desarrollo:true, logger});
  assert.strictEqual(llamadas.length, 1);
  assert.strictEqual(llamadas[0][0], 'Manufacturing equivalence');
});

probar('main integra pipeline y shadow sin sustituir grupos legacy productivos', () => {
  const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');
  const inicio = main.indexOf('const manufacturingPipeline = buildManufacturingPipeline({');
  const fin = main.indexOf('const resultadoCostos = calcularCostosProyecto({', inicio);
  const integracion = main.slice(inicio, fin);
  assert.ok(inicio >= 0);
  assert.ok(integracion.includes('piezasActuales:piezas'));
  assert.ok(integracion.includes('const optimizacion = optimizarProyectoPreparado({'));
  assert.ok(integracion.includes('gruposPorMaterial: porMaterial'));
  assert.ok(!integracion.includes('gruposPorMaterialOptimizer'));
  assert.ok(!integracion.includes('puedeUsarManufacturingInput'));
  assert.ok(!integracion.includes('piezas = manufacturingPipeline'));
  assert.ok(main.includes('if(window.PROYCUT_DEV === true){'));
  assert.ok(main.includes('ejecutarManufacturingExecution({'));
});

probar('scripts de fabrication y pipeline cargan antes de main', () => {
  const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
  const orden = [
    'fabrication/manufacturing-part.js',
    'fabrication/manufacturing-board.js',
    'fabrication/build-manufacturing-model.js',
    'fabrication/compare-manufacturing-input.js',
    'project/manufacturing-pipeline.js',
    'main.js'
  ].map(referencia => html.indexOf(referencia));
  orden.forEach(posicion => assert.ok(posicion >= 0));
  for(let indice=1; indice<orden.length; indice++){
    assert.ok(orden[indice - 1] < orden[indice]);
  }
});
