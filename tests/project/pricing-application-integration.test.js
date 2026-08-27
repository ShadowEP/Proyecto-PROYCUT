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
const rutaCasoUso = path.resolve(
  __dirname,
  '../../src/scripts/project/calculate-project-price.js'
);
const codigoPricing = fs.readFileSync(rutaPricing, 'utf8');
const codigoAdapter = fs.readFileSync(rutaAdapter, 'utf8');
const codigoCasoUso = fs.readFileSync(rutaCasoUso, 'utf8');
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
    ${codigoCasoUso}
    globalThis.adapterIntegrado = ProyCutPricingApplicationAdapter;
    globalThis.casoUsoIntegrado = ProyCutProjectPricing;
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

probar('Application integra GLOBAL 0% sin catalogo comercial', () => {
  const resultadoCostos = crearResultadoCostos();
  const resultado = contextoPrueba.casoUsoIntegrado.calcularPrecioDelProyecto({
    resultadoCostos,
    politicaPrecios:{modo:'GLOBAL_SOBRE_COSTO', porcentajeSobreCosto:0}
  });

  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, 800);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 800);
});

probar('Application integra GLOBAL 30% y conserva precision del Domain', () => {
  const resultadoCostos = crearResultadoCostos();
  const politicaPrecios = {
    modo:'GLOBAL_SOBRE_COSTO',
    porcentajeSobreCosto:30.5
  };
  const costosAntes = JSON.stringify(resultadoCostos);
  const politicaAntes = JSON.stringify(politicaPrecios);

  const resultado = contextoPrueba.casoUsoIntegrado.calcularPrecioDelProyecto({
    resultadoCostos,
    catalogoComercial:null,
    politicaPrecios
  });

  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, 800 * 1.305);
  assert.strictEqual(resultado.resultadoPrecios.metodoAplicado, 'GLOBAL_SOBRE_COSTO');
  assert.strictEqual(resultado.resultadoPrecios.desgloseCategorias, null);
  assert.strictEqual(JSON.stringify(resultadoCostos), costosAntes);
  assert.strictEqual(JSON.stringify(politicaPrecios), politicaAntes);
});

probar('Application propaga validacion matematica GLOBAL del Domain', () => {
  const resultado = contextoPrueba.casoUsoIntegrado.calcularPrecioDelProyecto({
    resultadoCostos:crearResultadoCostos(),
    politicaPrecios:{modo:'GLOBAL_SOBRE_COSTO', porcentajeSobreCosto:'30'}
  });

  assert.strictEqual(resultado.ok, false);
  assert.ok(resultado.errores.some(error => (
    error.codigo === 'PORCENTAJE_SOBRE_COSTO_INVALIDO'
  )));
});

// ---------- P4B: ejemplo obligatorio GLOBAL + descuento (Domain real) ----------

probar('caso obligatorio: costo 10000, markup 30%, descuento 10% -> base 13000, final 11700', () => {
  const resultado = contextoPrueba.casoUsoIntegrado.calcularPrecioDelProyecto({
    resultadoCostos:{
      costoMateriales:6000,
      costoComponentes:2000,
      costoCorte:1500,
      costoTapacanto:500,
      costoTotal:10000
    },
    politicaPrecios:{
      modo:'GLOBAL_SOBRE_COSTO',
      porcentajeSobreCosto:30,
      descuento:{tipo:'PORCENTAJE', porcentaje:10}
    }
  });

  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioBase, 13000);
  assert.strictEqual(resultado.resultadoPrecios.descuentoAplicado.monto, 1300);
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, 11700);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 11700);
});

probar('GLOBAL + descuento invalido produce error sin fallback a NINGUNO', () => {
  const resultado = contextoPrueba.casoUsoIntegrado.calcularPrecioDelProyecto({
    resultadoCostos:crearResultadoCostos(),
    politicaPrecios:{
      modo:'GLOBAL_SOBRE_COSTO',
      porcentajeSobreCosto:30,
      descuento:{tipo:'PORCENTAJE', porcentaje:-5}
    }
  });

  assert.strictEqual(resultado.ok, false);
  assert.ok(resultado.errores.some(error => error.codigo === 'DESCUENTO_PORCENTAJE_FUERA_DE_RANGO'));
  assert.ok(!Object.prototype.hasOwnProperty.call(resultado, 'resultadoPrecios'));
});

probar('INDIVIDUAL + descuento via Domain real produce CATALOGO completo con descuento', () => {
  const resultadoCostos = {
    costoMateriales:750,
    costoComponentes:80,
    costoCorte:20,
    costoTapacanto:10.5,
    costoTotal:860.5,
    materiales:[{sku:'T-000001', tableros:1}],
    componentes:[{sku:'H-000001', cantidadTotal:2}],
    tapacantos:[{sku:'E-000001', metrosCobrables:1}],
    cortes:4,
    corteMl:2
  };
  const catalogoComercial = {
    materiales:[{sku:'T-000001', precioVenta:1200}],
    componentes:[{sku:'H-000001', precioVenta:70}],
    tapacantos:[{sku:'E-000001', precioVenta:18}],
    corte:{modo:'corte', precioVentaCorte:12, precioVentaCorteMetro:30}
  };

  const resultado = contextoPrueba.casoUsoIntegrado.calcularPrecioDelProyecto({
    resultadoCostos,
    catalogoComercial,
    politicaPrecios:{
      modo:'INDIVIDUAL',
      descuento:{tipo:'PORCENTAJE', porcentaje:10}
    }
  });

  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.metodoAplicado, 'CATALOGO');
  assert.strictEqual(resultado.resultadoPrecios.precioBase, 1406);
  assert.strictEqual(resultado.resultadoPrecios.descuentoAplicado.monto, 140.6);
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, 1265.4);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 1265.4);
  // los subtotales por categoria permanecen brutos
  assert.strictEqual(resultado.resultadoPrecios.precioMateriales, 1200);
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, 48);
});
