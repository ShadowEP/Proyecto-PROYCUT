const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rutaCasoUso = path.resolve(
  __dirname,
  '../../src/scripts/project/calculate-project-price.js'
);
const codigoCasoUso = fs.readFileSync(rutaCasoUso, 'utf8');

function crearEscenario(resultadoAdapter){
  const contextoPrueba = vm.createContext({
    llamadasAdapter:[],
    resultadoAdapter
  });

  vm.runInContext(
    `
      const ProyCutPricingApplicationAdapter = {
        calcularPrecioDesdeAplicacion(solicitud){
          llamadasAdapter.push(solicitud);
          return resultadoAdapter;
        }
      };
      ${codigoCasoUso}
      globalThis.casoUsoPruebas = ProyCutProjectPricing;
    `,
    contextoPrueba,
    {filename:rutaCasoUso}
  );

  return contextoPrueba;
}

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

probar('construye contexto PRECIO_FIJO y delega una vez', () => {
  const resultadoAdapter = {ok:true, resultadoPrecio:{precioFinal:1500}};
  const escenario = crearEscenario(resultadoAdapter);
  const resultadoCostos = crearResultadoCostos();

  escenario.casoUsoPruebas.calcularPrecioFijoProyecto({
    resultadoCostos,
    precioManual:1500
  });

  assert.strictEqual(escenario.llamadasAdapter.length, 1);
  assert.strictEqual(
    escenario.llamadasAdapter[0].resultadoCostos,
    resultadoCostos
  );
  assert.strictEqual(escenario.llamadasAdapter[0].contextoComercial.metodo, 'PRECIO_FIJO');
  assert.strictEqual(escenario.llamadasAdapter[0].contextoComercial.precioManual, 1500);
  assert.deepStrictEqual(
    Object.keys(escenario.llamadasAdapter[0].contextoComercial),
    ['metodo', 'precioManual']
  );
});

probar('devuelve exactamente el resultado exitoso del adapter', () => {
  const resultadoAdapter = {
    ok:true,
    resultadoPrecio:{
      precioBase:1500,
      metodoAplicado:'PRECIO_FIJO',
      descuentoAplicado:null,
      precioFinal:1500,
      advertencias:[]
    }
  };
  const escenario = crearEscenario(resultadoAdapter);

  const resultado = escenario.casoUsoPruebas.calcularPrecioFijoProyecto({
    resultadoCostos:crearResultadoCostos(),
    precioManual:1500
  });

  assert.strictEqual(resultado, resultadoAdapter);
});

probar('devuelve exactamente el error del adapter', () => {
  const resultadoAdapter = {
    ok:false,
    errores:[{codigo:'PRECIO_MANUAL_INVALIDO', mensaje:'Precio invalido.'}]
  };
  const escenario = crearEscenario(resultadoAdapter);

  const resultado = escenario.casoUsoPruebas.calcularPrecioFijoProyecto({
    resultadoCostos:crearResultadoCostos(),
    precioManual:'1500'
  });

  assert.strictEqual(resultado, resultadoAdapter);
});

probar('no modifica ResultadoCostos ni usa costoTotal como precio', () => {
  const resultadoAdapter = {ok:true, resultadoPrecio:{precioFinal:1500}};
  const escenario = crearEscenario(resultadoAdapter);
  const resultadoCostos = crearResultadoCostos();

  escenario.casoUsoPruebas.calcularPrecioFijoProyecto({
    resultadoCostos,
    precioManual:1500
  });

  assert.strictEqual(resultadoCostos.costoTotal, 800);
  assert.strictEqual(
    escenario.llamadasAdapter[0].contextoComercial.precioManual,
    1500
  );
  assert.notStrictEqual(
    escenario.llamadasAdapter[0].contextoComercial.precioManual,
    resultadoCostos.costoTotal
  );
});

probar('construye contexto CATALOGO y delega sin transformar el catalogo', () => {
  const resultadoAdapter = {ok:true, resultadoPrecios:{precioTotal:1406}};
  const escenario = crearEscenario(resultadoAdapter);
  const resultadoCostos = crearResultadoCostos();
  const catalogoComercial = {materiales:[], componentes:[], tapacantos:[], corte:{}};

  const resultado = escenario.casoUsoPruebas.calcularPrecioCatalogoProyecto({
    resultadoCostos,
    catalogoComercial
  });

  assert.strictEqual(resultado, resultadoAdapter);
  assert.strictEqual(escenario.llamadasAdapter.length, 1);
  assert.strictEqual(escenario.llamadasAdapter[0].resultadoCostos, resultadoCostos);
  assert.strictEqual(escenario.llamadasAdapter[0].contextoComercial.metodo, 'CATALOGO');
  assert.strictEqual(
    escenario.llamadasAdapter[0].contextoComercial.catalogoComercial,
    catalogoComercial
  );
});
