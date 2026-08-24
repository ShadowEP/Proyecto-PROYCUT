const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rutaAdapter = path.resolve(
  __dirname,
  '../../src/scripts/project/pricing-application-adapter.js'
);
const codigoAdapter = fs.readFileSync(rutaAdapter, 'utf8');

function crearEscenario(resultadoPricing){
  const contextoPrueba = vm.createContext({
    llamadas:[],
    resultadoPricing
  });

  vm.runInContext(
    `
      const ProyCutPricing = {
        calcularPrecioProyecto(resultadoCostos, contextoComercial){
          llamadas.push({resultadoCostos, contextoComercial});
          return resultadoPricing;
        }
      };
      ${codigoAdapter}
      globalThis.adapterPruebas = ProyCutPricingApplicationAdapter;
    `,
    contextoPrueba,
    {filename:rutaAdapter}
  );

  return contextoPrueba;
}

function crearEntradas(){
  return {
    resultadoCostos:Object.freeze({
      costoMateriales:500,
      costoComponentes:100,
      costoCorte:120,
      costoTapacanto:80,
      costoTotal:800
    }),
    contextoComercial:Object.freeze({
      metodo:'PRECIO_FIJO',
      precioManual:1500
    })
  };
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

probar('delega exactamente una vez con las mismas entradas', () => {
  const resultadoPricing = {ok:true, resultadoPrecio:{precioFinal:1500}};
  const escenario = crearEscenario(resultadoPricing);
  const entradas = crearEntradas();

  escenario.adapterPruebas.calcularPrecioDesdeAplicacion(entradas);

  assert.strictEqual(escenario.llamadas.length, 1);
  assert.strictEqual(escenario.llamadas[0].resultadoCostos, entradas.resultadoCostos);
  assert.strictEqual(escenario.llamadas[0].contextoComercial, entradas.contextoComercial);
});

probar('preserva exactamente el resultado exitoso', () => {
  const resultadoPricing = {
    ok:true,
    resultadoPrecio:{
      precioBase:1500,
      metodoAplicado:'PRECIO_FIJO',
      descuentoAplicado:null,
      precioFinal:1500,
      advertencias:[]
    }
  };
  const escenario = crearEscenario(resultadoPricing);

  const resultadoAdapter = escenario.adapterPruebas.calcularPrecioDesdeAplicacion(
    crearEntradas()
  );

  assert.strictEqual(resultadoAdapter, resultadoPricing);
});

probar('preserva exactamente el resultado de error', () => {
  const resultadoPricing = {
    ok:false,
    errores:[{
      codigo:'PRECIO_MANUAL_REQUERIDO',
      mensaje:'El precio manual es requerido.'
    }]
  };
  const escenario = crearEscenario(resultadoPricing);

  const resultadoAdapter = escenario.adapterPruebas.calcularPrecioDesdeAplicacion(
    crearEntradas()
  );

  assert.strictEqual(resultadoAdapter, resultadoPricing);
});

probar('no modifica las entradas', () => {
  const resultadoPricing = {ok:true, resultadoPrecio:{precioFinal:1500}};
  const escenario = crearEscenario(resultadoPricing);
  const entradas = crearEntradas();

  escenario.adapterPruebas.calcularPrecioDesdeAplicacion(entradas);

  assert.deepStrictEqual(entradas.resultadoCostos, {
    costoMateriales:500,
    costoComponentes:100,
    costoCorte:120,
    costoTapacanto:80,
    costoTotal:800
  });
  assert.deepStrictEqual(entradas.contextoComercial, {
    metodo:'PRECIO_FIJO',
    precioManual:1500
  });
});

probar('no agrega calculos comerciales ni autorizacion', () => {
  const resultadoPricing = Object.freeze({
    ok:true,
    resultadoPrecio:Object.freeze({precioFinal:1500})
  });
  const escenario = crearEscenario(resultadoPricing);

  const resultadoAdapter = escenario.adapterPruebas.calcularPrecioDesdeAplicacion({
    resultadoCostos:{costoTotal:800},
    contextoComercial:{metodo:'PRECIO_FIJO', precioManual:1500}
  });

  assert.strictEqual(resultadoAdapter, resultadoPricing);
  assert.deepStrictEqual(Object.keys(resultadoAdapter), ['ok', 'resultadoPrecio']);
  assert.deepStrictEqual(Object.keys(resultadoAdapter.resultadoPrecio), ['precioFinal']);
});
