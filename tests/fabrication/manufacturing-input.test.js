const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const archivos = [
  'src/scripts/fabrication/manufacturing-part.js',
  'src/scripts/fabrication/manufacturing-board.js',
  'src/scripts/fabrication/build-manufacturing-model.js',
  'src/scripts/fabrication/manufacturing-input.js'
];
const contexto = vm.createContext({window:{}});
archivos.forEach(archivo => vm.runInContext(
  fs.readFileSync(path.join(raiz, archivo), 'utf8'),
  contexto,
  {filename:archivo}
));

const {
  buildManufacturingModel,
  buildOptimizerInputFromManufacturingModel
} = contexto.window.ProyCutManufacturingModel;
const {
  CAMPOS_MANUFACTURING_INPUT,
  CAMPOS_PIEZA_OPTIMIZADOR,
  crearManufacturingInput
} = contexto.window.ProyCutManufacturingInputContract;

function plano(valor){
  return JSON.parse(JSON.stringify(valor));
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

const materiales = [{
  sku:'MAT-1', nombre:'Melamina', largo:2440, ancho:1220,
  espesor:15, precio:700, precioVenta:1000
}];
const tapacantos = [{sku:'TAP-1', nombre:'PVC', precio:10, precioVenta:20}];

function crearEntrada(cantidad=2){
  const modeloFabricacion = buildManufacturingModel({
    filasPiezas:[{
      id:'1', cantTexto:String(cantidad), largoTexto:'700', anchoTexto:'400',
      girarModo:'normal', material:'Melamina', tapaTipo:'PVC',
      l1:true, l2:false, a1:true, a2:false, labelTexto:'Puerta'
    }],
    materiales,
    tapacantos
  });
  const salidaAdaptador = buildOptimizerInputFromManufacturingModel({
    modeloFabricacion,
    cantidadProyectos:1,
    permitirGirarAuto:false,
    obtenerParametrosTecnicos:() => ({
      ok:true,
      kerfEfectivo:4,
      kerfEntrePiezasEfectivo:4,
      kerfPiezaSobranteEfectivo:4,
      kerfBordeExteriorEfectivo:0
    })
  });
  return {modeloFabricacion, salidaAdaptador};
}

probar('ManufacturingInput representa exactamente la salida real del adapter', () => {
  const {salidaAdaptador} = crearEntrada();
  const contrato = crearManufacturingInput(salidaAdaptador);
  assert.deepStrictEqual(plano(Object.keys(contrato)), plano(CAMPOS_MANUFACTURING_INPUT));
  assert.deepStrictEqual(plano(contrato), plano(salidaAdaptador));
  assert.strictEqual(contrato.piezas, salidaAdaptador.piezas);
  assert.strictEqual(contrato.gruposPorMaterial, salidaAdaptador.gruposPorMaterial);
  assert.strictEqual(contrato.errores, salidaAdaptador.errores);
});

probar('conserva cantidad agrupada en Manufacturing Model y expansion fisica en la entrada', () => {
  const {modeloFabricacion, salidaAdaptador} = crearEntrada(5);
  const contrato = crearManufacturingInput(salidaAdaptador);
  assert.strictEqual(modeloFabricacion.piezasFabricacion.length, 1);
  assert.strictEqual(modeloFabricacion.piezasFabricacion[0].cantidad, 5);
  assert.strictEqual(contrato.piezas.length, 5);
  assert.strictEqual(contrato.piezas, salidaAdaptador.piezas);
  assert.strictEqual(contrato.gruposPorMaterial.Melamina.length, 5);
  contrato.gruposPorMaterial.Melamina.forEach((pieza, indice) => {
    assert.strictEqual(pieza, contrato.piezas[indice]);
  });
});

probar('cada pieza conserva solamente el contrato fisico actual del optimizador', () => {
  const {salidaAdaptador} = crearEntrada(1);
  const contrato = crearManufacturingInput(salidaAdaptador);
  assert.deepStrictEqual(
    plano(Object.keys(contrato.piezas[0])),
    plano(CAMPOS_PIEZA_OPTIMIZADOR)
  );
  assert.deepStrictEqual(plano(contrato.piezas[0]), {
    num:'1', label:'Puerta', l:700, a:400, girarModo:'normal',
    material:'Melamina', tapaTipo:'PVC', l1:true, l2:false, a1:true, a2:false,
    kerfEfectivo:4, kerfEntrePiezasEfectivo:4,
    kerfPiezaSobranteEfectivo:4, kerfBordeExteriorEfectivo:0
  });
});

probar('no recalcula geometria ni duplica PiezaFabricacion', () => {
  const {modeloFabricacion, salidaAdaptador} = crearEntrada(2);
  const antes = JSON.stringify(modeloFabricacion);
  const contrato = crearManufacturingInput(salidaAdaptador);
  assert.strictEqual(JSON.stringify(modeloFabricacion), antes);
  assert.notStrictEqual(contrato, salidaAdaptador);
  assert.strictEqual(contrato.piezas, salidaAdaptador.piezas);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(contrato, 'piezasFabricacion'), false);
});

probar('preserva errores del adapter sin fallback ni correccion automatica', () => {
  const errores = ['No existe tablero para la pieza 1.'];
  const gruposPorMaterial = {};
  const entrada = {piezas:[], gruposPorMaterial, errores};
  const contrato = crearManufacturingInput(entrada);
  assert.strictEqual(contrato.gruposPorMaterial, gruposPorMaterial);
  assert.strictEqual(contrato.errores, errores);
  assert.deepStrictEqual(plano(contrato), plano(entrada));
});

probar('el contrato es puro y no depende de DOM state o almacenamiento', () => {
  const codigo = fs.readFileSync(
    path.join(raiz, 'src/scripts/fabrication/manufacturing-input.js'),
    'utf8'
  );
  assert.ok(!codigo.includes('document.'));
  assert.ok(!codigo.includes('localStorage'));
  assert.ok(!codigo.includes('state.'));
});
