const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rutaPricing = path.resolve(
  __dirname,
  '../../src/scripts/pricing/calculate-price.js'
);
const rutaAdapter = path.resolve(
  __dirname,
  '../../src/scripts/project/pricing-application-adapter.js'
);
const codigoPricing = fs.readFileSync(rutaPricing, 'utf8');
const codigoAdapter = fs.readFileSync(rutaAdapter, 'utf8');
const contextoPrueba = vm.createContext({
  invocacionesPricing:[],
  ultimoResultadoPricing:null
});

vm.runInContext(
  `
    ${codigoPricing}
    const calcularPrecioProyectoReal = ProyCutPricing.calcularPrecioProyecto;
    ProyCutPricing.calcularPrecioProyecto = function(resultadoCostos, contextoComercial){
      invocacionesPricing.push({resultadoCostos, contextoComercial});
      ultimoResultadoPricing = calcularPrecioProyectoReal(
        resultadoCostos,
        contextoComercial
      );
      return ultimoResultadoPricing;
    };
    ${codigoAdapter}
    globalThis.adapterIntegrado = ProyCutPricingApplicationAdapter;
  `,
  contextoPrueba,
  {filename:'pricing-application-integration'}
);

function crearResultadoCostos(){
  return Object.freeze({
    costoMateriales:500,
    costoComponentes:100,
    costoCorte:120,
    costoTapacanto:80,
    costoTotal:800
  });
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

probar('adapter delega entradas sin transformar y Pricing real calcula precio fijo', () => {
  const resultadoCostos = crearResultadoCostos();
  const contextoComercial = Object.freeze({
    metodo:'PRECIO_FIJO',
    precioManual:1500
  });

  const resultado = contextoPrueba.adapterIntegrado.calcularPrecioDesdeAplicacion({
    resultadoCostos,
    contextoComercial
  });

  assert.strictEqual(contextoPrueba.invocacionesPricing.length, 1);
  assert.strictEqual(
    contextoPrueba.invocacionesPricing[0].resultadoCostos,
    resultadoCostos
  );
  assert.strictEqual(
    contextoPrueba.invocacionesPricing[0].contextoComercial,
    contextoComercial
  );
  assert.strictEqual(resultado, contextoPrueba.ultimoResultadoPricing);
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecio.precioBase, 1500);
  assert.strictEqual(
    resultado.resultadoPrecio.precioFinal,
    resultado.resultadoPrecio.precioBase
  );
  assert.strictEqual(resultado.resultadoPrecio.descuentoAplicado, null);
  assert.notStrictEqual(resultado.resultadoPrecio.precioFinal, resultadoCostos.costoTotal);
});

probar('adapter propaga exactamente los errores reales de Pricing', () => {
  const resultadoCostos = crearResultadoCostos();
  const contextoComercial = Object.freeze({metodo:'PRECIO_FIJO'});

  const resultado = contextoPrueba.adapterIntegrado.calcularPrecioDesdeAplicacion({
    resultadoCostos,
    contextoComercial
  });

  assert.strictEqual(contextoPrueba.invocacionesPricing.length, 2);
  assert.strictEqual(
    contextoPrueba.invocacionesPricing[1].resultadoCostos,
    resultadoCostos
  );
  assert.strictEqual(
    contextoPrueba.invocacionesPricing[1].contextoComercial,
    contextoComercial
  );
  assert.strictEqual(resultado, contextoPrueba.ultimoResultadoPricing);
  assert.strictEqual(resultado.ok, false);
  assert.ok(Array.isArray(resultado.errores));
  assert.ok(
    resultado.errores.some(error => error.codigo === 'PRECIO_MANUAL_REQUERIDO')
  );
});
