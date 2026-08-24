const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
let implementarOptimizador = null;
const contexto = vm.createContext({window:{}});
vm.runInContext(
  fs.readFileSync(path.join(raiz, 'src/scripts/fabrication/optimization-result.js'), 'utf8'),
  contexto,
  {filename:'src/scripts/fabrication/optimization-result.js'}
);
contexto.window.ProyCutProjectOptimization = {
  optimizarProyectoPreparado:entrada => implementarOptimizador(entrada)
};
vm.runInContext(
  fs.readFileSync(path.join(raiz, 'src/scripts/fabrication/manufacturing-optimizer-adapter.js'), 'utf8'),
  contexto,
  {filename:'src/scripts/fabrication/manufacturing-optimizer-adapter.js'}
);

const {
  ejecutarManufacturingOptimization
} = contexto.window.ProyCutManufacturingOptimizerAdapter;

function plano(valor){
  return JSON.parse(JSON.stringify(valor));
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

function entradaBase(){
  const pieza = {num:'1', material:'Melamina'};
  return {
    pieza,
    manufacturingInput:{
      piezas:[pieza],
      gruposPorMaterial:{Melamina:[pieza]},
      errores:[]
    },
    parametrosCorteProyecto:{margenes:{superior:0}},
    opcionesProyecto:{libre:false, nivelOptimizacion:'normal'},
    dependencias:{empacarMaterial:() => []}
  };
}

probar('delega una vez usando directamente gruposPorMaterial', () => {
  const entrada = entradaBase();
  let llamada = null;
  let cantidadLlamadas = 0;
  implementarOptimizador = parametros => {
    cantidadLlamadas++;
    llamada = parametros;
    return {ok:true, boards:[], tablerosPorMaterial:{}, totalCortes:0, totalCorteMm:0};
  };
  ejecutarManufacturingOptimization(entrada);
  assert.strictEqual(cantidadLlamadas, 1);
  assert.strictEqual(llamada.gruposPorMaterial, entrada.manufacturingInput.gruposPorMaterial);
  assert.strictEqual(llamada.parametrosCorteProyecto, entrada.parametrosCorteProyecto);
  assert.strictEqual(llamada.opcionesProyecto, entrada.opcionesProyecto);
  assert.strictEqual(llamada.dependencias, entrada.dependencias);
});

probar('devuelve OptimizationResult y conserva referencias e importes tecnicos', () => {
  const entrada = entradaBase();
  const boards = [{materialLabel:'Melamina', pieces:[entrada.pieza]}];
  const tablerosPorMaterial = {Melamina:1};
  implementarOptimizador = () => ({
    ok:true,
    boards,
    tablerosPorMaterial,
    totalCortes:4,
    totalCorteMm:3200,
    interno:'no cruza la frontera'
  });
  const resultado = ejecutarManufacturingOptimization(entrada);
  assert.deepStrictEqual(plano(Object.keys(resultado)), [
    'ok', 'boards', 'tablerosPorMaterial', 'totalCortes', 'totalCorteMm'
  ]);
  assert.strictEqual(resultado.boards, boards);
  assert.strictEqual(resultado.tablerosPorMaterial, tablerosPorMaterial);
  assert.strictEqual(resultado.totalCortes, 4);
  assert.strictEqual(resultado.totalCorteMm, 3200);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(resultado, 'interno'), false);
});

probar('propaga exactamente los errores reales del optimizador', () => {
  const entrada = entradaBase();
  const errorReal = new Error('Fallo real del optimizador');
  implementarOptimizador = () => { throw errorReal; };
  assert.throws(
    () => ejecutarManufacturingOptimization(entrada),
    error => error === errorReal
  );
});

probar('no modifica ManufacturingInput', () => {
  const entrada = entradaBase();
  const antes = JSON.stringify(entrada.manufacturingInput);
  implementarOptimizador = () => ({
    ok:true, boards:[], tablerosPorMaterial:{}, totalCortes:0, totalCorteMm:0
  });
  ejecutarManufacturingOptimization(entrada);
  assert.strictEqual(JSON.stringify(entrada.manufacturingInput), antes);
  assert.strictEqual(
    entrada.manufacturingInput.gruposPorMaterial.Melamina[0],
    entrada.manufacturingInput.piezas[0]
  );
});

probar('valida solamente la frontera necesaria', () => {
  assert.throws(
    () => ejecutarManufacturingOptimization({manufacturingInput:null}),
    /ManufacturingInput existente/
  );
  assert.throws(
    () => ejecutarManufacturingOptimization({manufacturingInput:{piezas:[], errores:[]}}),
    /gruposPorMaterial existentes/
  );
});

probar('es puro y no agrupa expande calcula ni accede a plataforma', () => {
  const codigo = fs.readFileSync(
    path.join(raiz, 'src/scripts/fabrication/manufacturing-optimizer-adapter.js'),
    'utf8'
  );
  assert.ok(!codigo.includes('document.'));
  assert.ok(!codigo.includes('localStorage'));
  assert.ok(!codigo.includes('state.'));
  assert.ok(!codigo.includes('forEach'));
  assert.ok(!codigo.includes('empacarMaterial('));
  assert.ok(!codigo.includes('piezas.push'));
});
