const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const archivos = [
  'src/scripts/fabrication/optimization-result.js',
  'src/scripts/fabrication/cost-result.js',
  'src/scripts/fabrication/manufacturing-snapshot.js'
];
const contexto = vm.createContext({window:{}});
archivos.forEach(archivo => vm.runInContext(
  fs.readFileSync(path.join(raiz, archivo), 'utf8'),
  contexto,
  {filename:archivo}
));

const {
  CAMPOS_OPTIMIZATION_RESULT,
  crearOptimizationResult
} = contexto.window.ProyCutOptimizationResultContract;
const {
  CAMPOS_COST_RESULT,
  crearCostResult
} = contexto.window.ProyCutCostResultContract;
const {
  CAMPOS_MANUFACTURING_SNAPSHOT,
  crearManufacturingSnapshot
} = contexto.window.ProyCutManufacturingSnapshotContract;

function plano(valor){
  return JSON.parse(JSON.stringify(valor));
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

probar('OptimizationResult representa exactamente el retorno real del optimizador', () => {
  const boards = [{materialLabel:'Melamina', pieces:[]}];
  const tablerosPorMaterial = {Melamina:1};
  const actual = {
    ok:true,
    boards,
    tablerosPorMaterial,
    totalCortes:4,
    totalCorteMm:3200
  };
  const contrato = crearOptimizationResult(actual);
  assert.deepStrictEqual(plano(Object.keys(contrato)), plano(CAMPOS_OPTIMIZATION_RESULT));
  assert.strictEqual(contrato.boards, boards);
  assert.strictEqual(contrato.tablerosPorMaterial, tablerosPorMaterial);
  assert.deepStrictEqual(plano(contrato), actual);
});

probar('OptimizationResult no modifica ni duplica boards', () => {
  const actual = {ok:true, boards:[], tablerosPorMaterial:{}, totalCortes:0, totalCorteMm:0};
  const copiaAntes = JSON.stringify(actual);
  const contrato = crearOptimizationResult(actual);
  assert.strictEqual(JSON.stringify(actual), copiaAntes);
  assert.notStrictEqual(contrato, actual);
  assert.strictEqual(contrato.boards, actual.boards);
});

probar('CostResult conserva el contrato exitoso y el desglose existente', () => {
  const datosReporte = {
    costoMateriales:700,
    costoComponentes:50,
    costoCorte:20,
    costoTapacanto:10,
    costoTotal:780,
    materiales:[],
    componentes:[],
    tapacantos:[]
  };
  const contrato = crearCostResult({ok:true, datosReporte});
  assert.deepStrictEqual(plano(Object.keys(contrato)), ['ok', 'datosReporte']);
  assert.strictEqual(contrato.datosReporte, datosReporte);
  assert.strictEqual(contrato.datosReporte.costoTotal, 780);
});

probar('CostResult conserva errores reales sin inventar fallback', () => {
  const errores = ['Costo invalido'];
  const contrato = crearCostResult({ok:false, errores});
  assert.deepStrictEqual(plano(Object.keys(contrato)), ['ok', 'errores']);
  assert.strictEqual(contrato.errores, errores);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(contrato, 'datosReporte'), false);
  assert.deepStrictEqual(plano(CAMPOS_COST_RESULT), ['ok', 'datosReporte', 'errores']);
});

probar('CostResult mantiene compatibilidad con datosReporte directos del comparador shadow', () => {
  const datosReporte = {costoTotal:100};
  const contrato = crearCostResult(datosReporte);
  assert.strictEqual(contrato.ok, true);
  assert.strictEqual(contrato.datosReporte, datosReporte);
});

probar('ManufacturingSnapshot agrupa referencias existentes sin crear otra fuente de verdad', () => {
  const manufacturingModel = {piezasFabricacion:[], tableros:[], subensambles:[]};
  const optimizerInput = {piezas:[], errores:[]};
  const optimizationResult = {ok:true, boards:[], tablerosPorMaterial:{}, totalCortes:0, totalCorteMm:0};
  const costResult = {ok:true, datosReporte:{costoTotal:0}};
  const snapshot = crearManufacturingSnapshot({
    manufacturingModel,
    optimizerInput,
    optimizationResult,
    costResult
  });
  assert.deepStrictEqual(plano(Object.keys(snapshot)), plano(CAMPOS_MANUFACTURING_SNAPSHOT));
  assert.strictEqual(snapshot.manufacturingModel, manufacturingModel);
  assert.strictEqual(snapshot.optimizerInput, optimizerInput);
  assert.strictEqual(snapshot.optimizationResult, optimizationResult);
  assert.strictEqual(snapshot.costResult, costResult);
});

probar('los contratos son puros y no dependen de DOM state o almacenamiento', () => {
  archivos.forEach(archivo => {
    const codigo = fs.readFileSync(path.join(raiz, archivo), 'utf8');
    assert.ok(!codigo.includes('document.'));
    assert.ok(!codigo.includes('localStorage'));
    assert.ok(!codigo.includes('state.'));
  });
});
