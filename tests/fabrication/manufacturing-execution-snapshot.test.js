const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const archivo = 'src/scripts/fabrication/manufacturing-execution-snapshot.js';
const contexto = vm.createContext({window:{}});
vm.runInContext(
  fs.readFileSync(path.join(raiz, archivo), 'utf8'),
  contexto,
  {filename:archivo}
);

const {
  CAMPOS_MANUFACTURING_EXECUTION_SNAPSHOT,
  crearManufacturingExecutionSnapshot
} = contexto.window.ProyCutManufacturingExecutionSnapshotContract;

function plano(valor){
  return JSON.parse(JSON.stringify(valor));
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

function crearEntradas({error=false}={}){
  return {
    manufacturingModel:{piezasFabricacion:[], tableros:[], subensambles:[]},
    manufacturingInput:{piezas:[], gruposPorMaterial:{}, errores:[]},
    optimizationResult:error
      ? {ok:false, boards:[], tablerosPorMaterial:{}, totalCortes:0, totalCorteMm:0}
      : {ok:true, boards:[], tablerosPorMaterial:{}, totalCortes:0, totalCorteMm:0},
    costResult:error
      ? {ok:false, errores:['Costo invalido']}
      : {ok:true, datosReporte:{costoTotal:0}},
    optimizationComparison:error
      ? {compatible:false, diferencias:[{campo:'boards'}]}
      : {compatible:true, diferencias:[]},
    costComparison:error
      ? {compatible:false, diferencias:[{campo:'costoTotal'}]}
      : {compatible:true, diferencias:[]}
  };
}

function verificarReferencias(snapshot, entradas){
  CAMPOS_MANUFACTURING_EXECUTION_SNAPSHOT.forEach(campo => {
    assert.strictEqual(snapshot[campo], entradas[campo]);
  });
}

probar('devuelve exactamente el contrato definido', () => {
  const entradas = crearEntradas();
  const snapshot = crearManufacturingExecutionSnapshot(entradas);
  assert.deepStrictEqual(
    plano(Object.keys(snapshot)),
    plano(CAMPOS_MANUFACTURING_EXECUTION_SNAPSHOT)
  );
});

probar('conserva todas las referencias sin crear copias', () => {
  const entradas = crearEntradas();
  const snapshot = crearManufacturingExecutionSnapshot(entradas);
  verificarReferencias(snapshot, entradas);
  assert.notStrictEqual(snapshot, entradas);
});

probar('no modifica las entradas', () => {
  const entradas = crearEntradas();
  const antes = JSON.stringify(entradas);
  crearManufacturingExecutionSnapshot(entradas);
  assert.strictEqual(JSON.stringify(entradas), antes);
});

probar('acepta resultados y comparaciones de exito', () => {
  const entradas = crearEntradas();
  const snapshot = crearManufacturingExecutionSnapshot(entradas);
  verificarReferencias(snapshot, entradas);
  assert.strictEqual(snapshot.optimizationResult.ok, true);
  assert.strictEqual(snapshot.costResult.ok, true);
});

probar('acepta resultados y comparaciones de error sin transformarlos', () => {
  const entradas = crearEntradas({error:true});
  const snapshot = crearManufacturingExecutionSnapshot(entradas);
  verificarReferencias(snapshot, entradas);
  assert.strictEqual(snapshot.optimizationResult.ok, false);
  assert.strictEqual(snapshot.costResult.errores, entradas.costResult.errores);
});

probar('es puro y no ejecuta dominio ni accede a plataforma', () => {
  const codigo = fs.readFileSync(path.join(raiz, archivo), 'utf8');
  assert.ok(!codigo.includes('document.'));
  assert.ok(!codigo.includes('localStorage'));
  assert.ok(!codigo.includes('state.'));
  assert.ok(!codigo.includes('optimizarProyectoPreparado'));
  assert.ok(!codigo.includes('calcularCostosProyecto'));
  assert.ok(!codigo.includes('JSON.parse'));
  assert.ok(!codigo.includes('structuredClone'));
});

probar('se conecta solamente dentro del bloque shadow de desarrollo', () => {
  const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');
  const inicio = main.indexOf('if(window.PROYCUT_DEV === true){');
  const fin = main.indexOf('const costosAplicados = aplicarResultadoCostos({', inicio);
  const bloqueShadow = main.slice(inicio, fin);
  assert.ok(bloqueShadow.includes('ejecutarManufacturingExecution({'));
  assert.ok(bloqueShadow.includes('manufacturingPipeline,'));
  assert.ok(bloqueShadow.includes('manufacturingExecutionSnapshot'));
});
