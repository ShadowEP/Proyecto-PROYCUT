const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rutaModulo = path.resolve(
  __dirname,
  '../../src/scripts/pricing/calculate-price.js'
);
const codigoModulo = fs.readFileSync(rutaModulo, 'utf8');
const contextoModulo = vm.createContext({});

vm.runInContext(
  `${codigoModulo}\n;globalThis.ProyCutPricingPruebas = ProyCutPricing;`,
  contextoModulo,
  {filename:rutaModulo}
);

const {calcularPrecioProyecto} = contextoModulo.ProyCutPricingPruebas;

function crearResultadoCostos(overrides = {}){
  return {
    costoMateriales:500,
    costoComponentes:100,
    costoCorte:120,
    costoTapacanto:80,
    costoTotal:800,
    ...overrides
  };
}

function verificarRechazo(resultado, codigoEsperado){
  assert.strictEqual(resultado.ok, false);
  assert.ok(Array.isArray(resultado.errores));
  assert.ok(
    resultado.errores.some(error => error.codigo === codigoEsperado),
    `Se esperaba el error ${codigoEsperado}.`
  );
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

probar('precio fijo valido', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {metodo:'PRECIO_FIJO', precioManual:1500}
  );

  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecio.precioBase, 1500);
  assert.strictEqual(resultado.resultadoPrecio.precioFinal, 1500);
  assert.strictEqual(resultado.resultadoPrecio.metodoAplicado, 'PRECIO_FIJO');
  assert.strictEqual(resultado.resultadoPrecio.descuentoAplicado, null);
  assert.ok(Array.isArray(resultado.resultadoPrecio.advertencias));
  assert.strictEqual(resultado.resultadoPrecio.advertencias.length, 0);
});

probar('costo tecnico no se convierte en precio', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos({costoTotal:800}),
    {metodo:'PRECIO_FIJO', precioManual:1500}
  );

  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecio.precioFinal, 1500);
  assert.notStrictEqual(resultado.resultadoPrecio.precioFinal, 800);
});

probar('precio manual ausente', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {metodo:'PRECIO_FIJO'}
  );

  verificarRechazo(resultado, 'PRECIO_MANUAL_REQUERIDO');
});

probar('metodo no soportado', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {metodo:'MARKUP', precioManual:1500}
  );

  verificarRechazo(resultado, 'METODO_NO_SOPORTADO');
});

probar('alias heredado no sustituye costoTotal', () => {
  const resultado = calcularPrecioProyecto(
    {
      costoMateriales:500,
      costoComponentes:100,
      costoCorte:120,
      costoTapacanto:80,
      total:800
    },
    {metodo:'PRECIO_FIJO', precioManual:1500}
  );

  verificarRechazo(resultado, 'RESULTADO_COSTOS_INVALIDO');
});

[
  {nombre:'string', valor:'1500', codigo:'PRECIO_MANUAL_INVALIDO'},
  {nombre:'NaN', valor:NaN, codigo:'PRECIO_MANUAL_INVALIDO'},
  {nombre:'Infinity', valor:Infinity, codigo:'PRECIO_MANUAL_INVALIDO'},
  {nombre:'cero', valor:0, codigo:'PRECIO_MANUAL_NO_POSITIVO'},
  {nombre:'negativo', valor:-1, codigo:'PRECIO_MANUAL_NO_POSITIVO'}
].forEach(({nombre, valor, codigo}) => {
  probar(`precio manual invalido: ${nombre}`, () => {
    const resultado = calcularPrecioProyecto(
      crearResultadoCostos(),
      {metodo:'PRECIO_FIJO', precioManual:valor}
    );

    verificarRechazo(resultado, codigo);
  });
});
