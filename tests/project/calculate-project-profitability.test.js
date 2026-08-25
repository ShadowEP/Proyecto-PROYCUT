const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rutaCasoUso = path.resolve(
  __dirname,
  '../../src/scripts/project/calculate-project-profitability.js'
);
const codigoCasoUso = fs.readFileSync(rutaCasoUso, 'utf8');

function crearEscenario(resultadoDominio){
  const contextoPrueba = vm.createContext({
    llamadasDominio:[],
    resultadoDominio
  });

  vm.runInContext(
    `
      const ProyCutProfitability = {
        calcularRentabilidadProyecto(entradas){
          llamadasDominio.push(entradas);
          return resultadoDominio;
        }
      };
      ${codigoCasoUso}
      globalThis.casoUsoPruebas = ProyCutProjectProfitability;
    `,
    contextoPrueba,
    {filename:rutaCasoUso}
  );

  return contextoPrueba;
}

function crearEntradas(){
  return {
    resultadoCostos:Object.freeze({costoTotal:800}),
    resultadoPrecios:Object.freeze({precioTotal:1200})
  };
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

probar('expone calcularRentabilidadDelProyecto', () => {
  const escenario = crearEscenario({ok:true});

  assert.strictEqual(
    typeof escenario.casoUsoPruebas.calcularRentabilidadDelProyecto,
    'function'
  );
});

probar('delega exactamente una vez con las mismas referencias', () => {
  const escenario = crearEscenario({ok:true});
  const entradas = crearEntradas();

  escenario.casoUsoPruebas.calcularRentabilidadDelProyecto(entradas);

  assert.strictEqual(escenario.llamadasDominio.length, 1);
  assert.strictEqual(
    escenario.llamadasDominio[0].resultadoCostos,
    entradas.resultadoCostos
  );
  assert.strictEqual(
    escenario.llamadasDominio[0].resultadoPrecios,
    entradas.resultadoPrecios
  );
});

probar('delega entradas ausentes al dominio sin clasificarlas', () => {
  const resultadoDominio = Object.freeze({ok:false, origen:'dominio'});
  const escenario = crearEscenario(resultadoDominio);

  const resultado = escenario.casoUsoPruebas.calcularRentabilidadDelProyecto();

  assert.strictEqual(escenario.llamadasDominio.length, 1);
  assert.strictEqual(escenario.llamadasDominio[0].resultadoCostos, undefined);
  assert.strictEqual(escenario.llamadasDominio[0].resultadoPrecios, undefined);
  assert.strictEqual(resultado, resultadoDominio);
  assert.deepStrictEqual(Object.keys(resultado), ['ok', 'origen']);
});

probar('retorna exactamente la referencia entregada por el dominio', () => {
  const resultadoDominio = Object.freeze({
    ok:true,
    resultadoRentabilidad:Object.freeze({estado:'PRECIO_COMPLETO'})
  });
  const escenario = crearEscenario(resultadoDominio);

  const resultado = escenario.casoUsoPruebas.calcularRentabilidadDelProyecto(
    crearEntradas()
  );

  assert.strictEqual(resultado, resultadoDominio);
});

[
  'PRECIO_COMPLETO',
  'PRECIO_PARCIAL',
  'DATOS_INVALIDOS'
].forEach(estado => {
  probar(`conserva sin reinterpretar ${estado}`, () => {
    const resultadoDominio = {
      ok:estado !== 'DATOS_INVALIDOS',
      resultadoRentabilidad:{estado}
    };
    const escenario = crearEscenario(resultadoDominio);

    const resultado = escenario.casoUsoPruebas.calcularRentabilidadDelProyecto(
      crearEntradas()
    );

    assert.strictEqual(resultado, resultadoDominio);
    assert.strictEqual(resultado.resultadoRentabilidad.estado, estado);
  });
});

probar('no modifica las entradas', () => {
  const escenario = crearEscenario({ok:true});
  const entradas = crearEntradas();

  escenario.casoUsoPruebas.calcularRentabilidadDelProyecto(entradas);

  assert.deepStrictEqual(entradas.resultadoCostos, {costoTotal:800});
  assert.deepStrictEqual(entradas.resultadoPrecios, {precioTotal:1200});
});

probar('no contiene dependencias prohibidas', () => {
  [
    'document',
    'window',
    'localStorage',
    'fetch',
    'piezas',
    'catalog',
    'Optimizer',
    'Manufacturing',
    'calcularCostosProyecto',
    'calcularPrecioCatalogoProyecto'
  ].forEach(identificador => assert.ok(!codigoCasoUso.includes(identificador)));
});

probar('no duplica formulas economicas ni estados del dominio', () => {
  [
    'precioTotal - costoTotal',
    '/ costoTotal',
    '/ precioTotal',
    'PRECIO_COMPLETO',
    'PRECIO_PARCIAL',
    'DATOS_INVALIDOS'
  ].forEach(identificador => assert.ok(!codigoCasoUso.includes(identificador)));
});
