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

probar('politica ausente conserva el camino CATALOGO historico', () => {
  const resultadoAdapter = {ok:true, resultadoPrecios:{precioTotal:1406}};
  const escenario = crearEscenario(resultadoAdapter);
  const resultadoCostos = crearResultadoCostos();
  const catalogoComercial = {materiales:[], componentes:[], tapacantos:[], corte:{}};

  const resultado = escenario.casoUsoPruebas.calcularPrecioDelProyecto({
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

probar('modo INDIVIDUAL conserva el camino CATALOGO historico', () => {
  const resultadoAdapter = {ok:true, resultadoPrecios:{precioTotal:1406}};
  const escenario = crearEscenario(resultadoAdapter);
  const resultadoCostos = crearResultadoCostos();
  const catalogoComercial = {materiales:[], componentes:[], tapacantos:[], corte:{}};

  escenario.casoUsoPruebas.calcularPrecioDelProyecto({
    resultadoCostos,
    catalogoComercial,
    politicaPrecios:{modo:'INDIVIDUAL', porcentajeSobreCosto:30}
  });

  assert.strictEqual(escenario.llamadasAdapter.length, 1);
  assert.strictEqual(escenario.llamadasAdapter[0].contextoComercial.metodo, 'CATALOGO');
  assert.strictEqual(
    escenario.llamadasAdapter[0].contextoComercial.catalogoComercial,
    catalogoComercial
  );
});

probar('modo GLOBAL delega porcentaje exacto sin exigir catalogo', () => {
  const resultadoAdapter = {ok:true, resultadoPrecios:{precioFinal:1066.664}};
  const escenario = crearEscenario(resultadoAdapter);
  const resultadoCostos = crearResultadoCostos();
  const politicaPrecios = Object.freeze({
    modo:'GLOBAL_SOBRE_COSTO',
    porcentajeSobreCosto:33.333
  });

  const resultado = escenario.casoUsoPruebas.calcularPrecioDelProyecto({
    resultadoCostos,
    politicaPrecios
  });

  assert.strictEqual(resultado, resultadoAdapter);
  assert.strictEqual(escenario.llamadasAdapter.length, 1);
  assert.strictEqual(escenario.llamadasAdapter[0].resultadoCostos, resultadoCostos);
  assert.strictEqual(
    escenario.llamadasAdapter[0].contextoComercial.metodo,
    'GLOBAL_SOBRE_COSTO'
  );
  assert.strictEqual(
    escenario.llamadasAdapter[0].contextoComercial.porcentajeSobreCosto,
    33.333
  );
  assert.deepStrictEqual(politicaPrecios, {
    modo:'GLOBAL_SOBRE_COSTO',
    porcentajeSobreCosto:33.333
  });
});

probar('modo desconocido produce error explicito sin fallback ni delegacion', () => {
  const escenario = crearEscenario({ok:true});
  const resultado = escenario.casoUsoPruebas.calcularPrecioDelProyecto({
    resultadoCostos:crearResultadoCostos(),
    catalogoComercial:{},
    politicaPrecios:{modo:'DESCONOCIDO', porcentajeSobreCosto:30}
  });

  assert.strictEqual(resultado.ok, false);
  assert.strictEqual(resultado.errores[0].codigo, 'MODO_POLITICA_PRECIOS_INVALIDO');
  assert.strictEqual(escenario.llamadasAdapter.length, 0);
});

probar('politica explicita invalida no activa el fallback individual', () => {
  [null, 'GLOBAL_SOBRE_COSTO', [], {}].forEach(politicaPrecios => {
    const escenario = crearEscenario({ok:true});
    const resultado = escenario.casoUsoPruebas.calcularPrecioDelProyecto({
      resultadoCostos:crearResultadoCostos(),
      catalogoComercial:{},
      politicaPrecios
    });
    assert.strictEqual(resultado.ok, false);
    assert.strictEqual(escenario.llamadasAdapter.length, 0);
  });
});

probar('Application no contiene formula global ni redondeo', () => {
  assert.ok(!codigoCasoUso.includes('costoTotal *'));
  assert.ok(!codigoCasoUso.includes('Math.round'));
  assert.ok(!codigoCasoUso.includes('toFixed'));
});
