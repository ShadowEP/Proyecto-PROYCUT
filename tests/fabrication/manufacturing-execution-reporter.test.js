const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const archivo = 'src/scripts/fabrication/manufacturing-execution-reporter.js';
const codigo = fs.readFileSync(path.join(raiz, archivo), 'utf8');
const contexto = vm.createContext({window:{}});
vm.runInContext(codigo, contexto, {filename:archivo});

const {
  CAMPOS_MANUFACTURING_EXECUTION_REPORT,
  crearManufacturingExecutionReport
} = contexto.window.ProyCutManufacturingExecutionReporter;

function plano(valor){
  return JSON.parse(JSON.stringify(valor));
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

function crearEntradas(){
  const optimizationComparison = {compatible:true, diferencias:[]};
  const costComparison = {compatible:true, diferencias:[]};
  const manufacturingExecutionSnapshot = {
    manufacturingModel:{piezasFabricacion:[]},
    manufacturingInput:{piezas:[], gruposPorMaterial:{}, errores:[]},
    optimizationResult:{ok:true, boards:[]},
    costResult:{ok:true, datosReporte:{}},
    optimizationComparison,
    costComparison
  };
  const equivalenceReport = {compatible:true, diferencias:[]};
  return {manufacturingExecutionSnapshot, equivalenceReport};
}

probar('devuelve exactamente el contrato observacional definido', () => {
  const reporte = crearManufacturingExecutionReport(crearEntradas());
  assert.deepStrictEqual(
    plano(Object.keys(reporte)),
    plano(CAMPOS_MANUFACTURING_EXECUTION_REPORT)
  );
  assert.strictEqual(Object.prototype.hasOwnProperty.call(reporte, 'pricing'), false);
});

probar('conserva las referencias originales', () => {
  const entradas = crearEntradas();
  const reporte = crearManufacturingExecutionReport(entradas);
  assert.strictEqual(reporte.entrada, entradas.equivalenceReport);
  assert.strictEqual(
    reporte.optimizacion,
    entradas.manufacturingExecutionSnapshot.optimizationComparison
  );
  assert.strictEqual(reporte.costing, entradas.manufacturingExecutionSnapshot.costComparison);
  assert.strictEqual(reporte.snapshot, entradas.manufacturingExecutionSnapshot);
});

probar('no modifica las entradas', () => {
  const entradas = crearEntradas();
  const antes = JSON.stringify(entradas);
  crearManufacturingExecutionReport(entradas);
  assert.strictEqual(JSON.stringify(entradas), antes);
});

probar('no ejecuta dominio ni accede a plataforma', () => {
  assert.ok(!codigo.includes('document.'));
  assert.ok(!codigo.includes('localStorage'));
  assert.ok(!codigo.includes('state.'));
  assert.ok(!codigo.includes('optimizarProyectoPreparado'));
  assert.ok(!codigo.includes('calcularCostosProyecto'));
  assert.ok(!codigo.includes('ejecutarManufacturingOptimization'));
  assert.ok(!codigo.includes('ejecutarManufacturingCosting'));
  assert.ok(!codigo.includes('compararResultado'));
});

probar('main usa el reporter solamente dentro de PROYCUT_DEV', () => {
  const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');
  const inicio = main.indexOf('if(window.PROYCUT_DEV === true){');
  const fin = main.indexOf('const costosAplicados = aplicarResultadoCostos({', inicio);
  const bloqueShadow = main.slice(inicio, fin);
  assert.ok(bloqueShadow.includes('crearManufacturingExecutionReport({'));
  assert.ok(bloqueShadow.includes('manufacturingExecutionSnapshot,'));
  assert.ok(bloqueShadow.includes('equivalenceReport:manufacturingPipeline.equivalenceReport'));
  assert.ok(!bloqueShadow.includes('pricing:true'));
});
