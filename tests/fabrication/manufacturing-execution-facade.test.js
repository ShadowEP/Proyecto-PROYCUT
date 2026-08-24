const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const llamadas = {
  optimizer:[],
  cost:[],
  optimizationComparison:[],
  costComparison:[],
  snapshot:[]
};
const optimizationResult = {ok:true, boards:[], tablerosPorMaterial:{}, totalCortes:0, totalCorteMm:0};
const costResult = {ok:true, datosReporte:{costoTotal:0}};
const optimizationComparison = {compatible:true, diferencias:[]};
const costComparison = {compatible:true, diferencias:[]};
let errorAdapter = null;
const contexto = vm.createContext({window:{
  ProyCutManufacturingOptimizerAdapter:{
    ejecutarManufacturingOptimization:entrada => {
      llamadas.optimizer.push(entrada);
      if(errorAdapter) throw errorAdapter;
      return optimizationResult;
    }
  },
  ProyCutManufacturingCostAdapter:{
    ejecutarManufacturingCosting:entrada => {
      llamadas.cost.push(entrada);
      return costResult;
    }
  },
  ProyCutOptimizationComparison:{
    compararResultadoOptimizacion:(legacy, fabrication) => {
      llamadas.optimizationComparison.push([legacy, fabrication]);
      return optimizationComparison;
    }
  },
  ProyCutCostComparison:{
    compararResultadoCostos:(legacy, fabrication) => {
      llamadas.costComparison.push([legacy, fabrication]);
      return costComparison;
    }
  },
  ProyCutManufacturingExecutionSnapshotContract:{
    crearManufacturingExecutionSnapshot:entrada => {
      llamadas.snapshot.push(entrada);
      return entrada;
    }
  }
}});
const archivo = 'src/scripts/fabrication/manufacturing-execution-facade.js';
vm.runInContext(
  fs.readFileSync(path.join(raiz, archivo), 'utf8'),
  contexto,
  {filename:archivo}
);
const {ejecutarManufacturingExecution} = contexto.window.ProyCutManufacturingExecutionFacade;

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

function limpiarLlamadas(){
  Object.values(llamadas).forEach(lista => lista.length = 0);
  errorAdapter = null;
}

function entradaBase(){
  const manufacturingModel = {piezasFabricacion:[]};
  const manufacturingInput = {piezas:[], gruposPorMaterial:{}, errores:[]};
  return {
    manufacturingModel,
    manufacturingInput,
    entrada:{
      manufacturingPipeline:{manufacturingModel, optimizerInput:manufacturingInput},
      parametrosCorteProyecto:{margenes:{}},
      opcionesProyecto:{libre:false},
      dependenciasOptimizer:{empacarMaterial:() => []},
      datosProyectoCosting:{piezas:[]},
      dependenciasCosting:{calcularCostosProyecto:() => ({})},
      resultadoLegacy:{
        optimizationResult:{ok:true, boards:['legacy']},
        costResult:{ok:true, datosReporte:{costoTotal:1}}
      }
    }
  };
}

probar('coordina cada dependencia exactamente una vez', () => {
  limpiarLlamadas();
  const base = entradaBase();
  ejecutarManufacturingExecution(base.entrada);
  Object.values(llamadas).forEach(lista => assert.strictEqual(lista.length, 1));
  assert.strictEqual(llamadas.optimizer[0].manufacturingInput, base.manufacturingInput);
  assert.strictEqual(llamadas.cost[0].optimizationResult, optimizationResult);
});

probar('compara contra resultados legacy y devuelve contratos por referencia', () => {
  limpiarLlamadas();
  const base = entradaBase();
  const resultado = ejecutarManufacturingExecution(base.entrada);
  assert.strictEqual(llamadas.optimizationComparison[0][0], base.entrada.resultadoLegacy.optimizationResult);
  assert.strictEqual(llamadas.optimizationComparison[0][1], optimizationResult);
  assert.strictEqual(llamadas.costComparison[0][0], base.entrada.resultadoLegacy.costResult);
  assert.strictEqual(llamadas.costComparison[0][1], costResult);
  assert.strictEqual(resultado.optimizationResult, optimizationResult);
  assert.strictEqual(resultado.costResult, costResult);
  assert.strictEqual(resultado.optimizationComparison, optimizationComparison);
  assert.strictEqual(resultado.costComparison, costComparison);
  assert.strictEqual(resultado.manufacturingExecutionSnapshot, llamadas.snapshot[0]);
});

probar('snapshot conserva referencias originales', () => {
  limpiarLlamadas();
  const base = entradaBase();
  ejecutarManufacturingExecution(base.entrada);
  const snapshot = llamadas.snapshot[0];
  assert.strictEqual(snapshot.manufacturingModel, base.manufacturingModel);
  assert.strictEqual(snapshot.manufacturingInput, base.manufacturingInput);
  assert.strictEqual(snapshot.optimizationResult, optimizationResult);
  assert.strictEqual(snapshot.costResult, costResult);
  assert.strictEqual(snapshot.optimizationComparison, optimizationComparison);
  assert.strictEqual(snapshot.costComparison, costComparison);
});

probar('propaga errores reales y detiene coordinacion posterior', () => {
  limpiarLlamadas();
  const base = entradaBase();
  const errorReal = new Error('Fallo real');
  errorAdapter = errorReal;
  assert.throws(
    () => ejecutarManufacturingExecution(base.entrada),
    error => error === errorReal
  );
  assert.strictEqual(llamadas.optimizer.length, 1);
  assert.strictEqual(llamadas.cost.length, 0);
  assert.strictEqual(llamadas.snapshot.length, 0);
});

probar('no modifica las entradas ni duplica ejecuciones', () => {
  limpiarLlamadas();
  const base = entradaBase();
  const antes = JSON.stringify(base.entrada);
  ejecutarManufacturingExecution(base.entrada);
  assert.strictEqual(JSON.stringify(base.entrada), antes);
  assert.strictEqual(llamadas.optimizer.length, 1);
  assert.strictEqual(llamadas.cost.length, 1);
});

probar('es pura y no contiene algoritmos ni acceso a plataforma', () => {
  const codigo = fs.readFileSync(path.join(raiz, archivo), 'utf8');
  assert.ok(!codigo.includes('document.'));
  assert.ok(!codigo.includes('localStorage'));
  assert.ok(!codigo.includes('state.'));
  assert.ok(!codigo.includes('forEach'));
  assert.ok(!codigo.includes('empacarMaterial'));
  assert.ok(!codigo.includes('calcularCostosProyecto'));
  assert.ok(!codigo.includes('gruposPorMaterial'));
  assert.ok(!codigo.includes('piezas.push'));
});
