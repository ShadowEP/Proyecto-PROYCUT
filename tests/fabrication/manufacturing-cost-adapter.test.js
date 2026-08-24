const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const archivos = [
  'src/scripts/fabrication/cost-result.js',
  'src/scripts/fabrication/manufacturing-cost-adapter.js'
];
const contexto = vm.createContext({window:{}});
archivos.forEach(archivo => vm.runInContext(
  fs.readFileSync(path.join(raiz, archivo), 'utf8'),
  contexto,
  {filename:archivo}
));
const {ejecutarManufacturingCosting} = contexto.window.ProyCutManufacturingCostAdapter;

function plano(valor){
  return JSON.parse(JSON.stringify(valor));
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

function entradaBase(calcularCostosProyecto){
  const boards = [{materialLabel:'Melamina', pieces:[]}];
  const tablerosPorMaterial = {Melamina:1};
  const piezas = [{num:'1', material:'Melamina'}];
  const materiales = [{nombre:'Melamina', precio:700}];
  return {
    boards,
    tablerosPorMaterial,
    piezas,
    materiales,
    entrada:{
      optimizationResult:{
        ok:true,
        boards,
        tablerosPorMaterial,
        totalCortes:4,
        totalCorteMm:3200
      },
      datosProyecto:{
        piezas,
        materiales,
        componentes:[],
        componentesProyecto:[],
        tapacantos:[],
        cantidadProyectos:1,
        modoPrecioCorte:'corte',
        precioCorte:5,
        precioCorteMetro:2,
        redondearTapacanto:false
      },
      dependencias:{calcularCostosProyecto}
    }
  };
}

probar('delega una vez con OptimizationResult y datosProyecto intactos', () => {
  let llamada = null;
  let cantidadLlamadas = 0;
  const base = entradaBase(parametros => {
    cantidadLlamadas++;
    llamada = parametros;
    return {ok:true, datosReporte:{costoTotal:720}};
  });
  ejecutarManufacturingCosting(base.entrada);
  assert.strictEqual(cantidadLlamadas, 1);
  assert.strictEqual(llamada.boards, base.boards);
  assert.strictEqual(llamada.tablerosPorMaterial, base.tablerosPorMaterial);
  assert.strictEqual(llamada.totalCortes, 4);
  assert.strictEqual(llamada.totalCorteMm, 3200);
  assert.strictEqual(llamada.piezas, base.piezas);
  assert.strictEqual(llamada.materiales, base.materiales);
});

probar('conserva datosReporte e importes mediante CostResult', () => {
  const datosReporte = {
    costoMateriales:700,
    costoComponentes:0,
    costoCorte:20,
    costoTapacanto:0,
    costoTotal:720
  };
  const base = entradaBase(() => ({ok:true, datosReporte}));
  const resultado = ejecutarManufacturingCosting(base.entrada);
  assert.deepStrictEqual(plano(Object.keys(resultado)), ['ok', 'datosReporte']);
  assert.strictEqual(resultado.datosReporte, datosReporte);
  assert.strictEqual(resultado.datosReporte.costoMateriales, 700);
  assert.strictEqual(resultado.datosReporte.costoCorte, 20);
  assert.strictEqual(resultado.datosReporte.costoTotal, 720);
});

probar('conserva el resultado de error real de Costing', () => {
  const errores = ['Costo invalido'];
  const base = entradaBase(() => ({ok:false, errores}));
  const resultado = ejecutarManufacturingCosting(base.entrada);
  assert.strictEqual(resultado.ok, false);
  assert.strictEqual(resultado.errores, errores);
});

probar('propaga exactamente excepciones reales de Costing', () => {
  const errorReal = new Error('Fallo real de Costing');
  const base = entradaBase(() => { throw errorReal; });
  assert.throws(
    () => ejecutarManufacturingCosting(base.entrada),
    error => error === errorReal
  );
});

probar('no modifica OptimizationResult ni datosProyecto', () => {
  const base = entradaBase(() => ({ok:true, datosReporte:{costoTotal:720}}));
  const optimizationAntes = JSON.stringify(base.entrada.optimizationResult);
  const proyectoAntes = JSON.stringify(base.entrada.datosProyecto);
  ejecutarManufacturingCosting(base.entrada);
  assert.strictEqual(JSON.stringify(base.entrada.optimizationResult), optimizationAntes);
  assert.strictEqual(JSON.stringify(base.entrada.datosProyecto), proyectoAntes);
});

probar('valida solamente las fronteras necesarias', () => {
  assert.throws(
    () => ejecutarManufacturingCosting({optimizationResult:null}),
    /OptimizationResult existente/
  );
  assert.throws(
    () => ejecutarManufacturingCosting({optimizationResult:{}, datosProyecto:null}),
    /datosProyecto existentes/
  );
  assert.throws(
    () => ejecutarManufacturingCosting({optimizationResult:{}, datosProyecto:{}, dependencias:{}}),
    /calcularCostosProyecto existente/
  );
});

probar('es puro y no contiene formulas precios ni acceso a plataforma', () => {
  const codigo = fs.readFileSync(
    path.join(raiz, 'src/scripts/fabrication/manufacturing-cost-adapter.js'),
    'utf8'
  );
  assert.ok(!codigo.includes('document.'));
  assert.ok(!codigo.includes('localStorage'));
  assert.ok(!codigo.includes('state.'));
  assert.ok(!codigo.includes('precioVenta'));
  assert.ok(!codigo.includes('costoTotal ='));
  assert.ok(!codigo.includes('reduce('));
});
