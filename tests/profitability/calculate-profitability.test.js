const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rutaModulo = path.resolve(
  __dirname,
  '../../src/scripts/profitability/calculate-profitability.js'
);
const codigoModulo = fs.readFileSync(rutaModulo, 'utf8');
const contextoModulo = vm.createContext({});

vm.runInContext(
  `${codigoModulo}\n;globalThis.ProyCutProfitabilityPruebas = ProyCutProfitability;`,
  contextoModulo,
  {filename:rutaModulo}
);

const {
  calcularRentabilidadProyecto
} = contextoModulo.ProyCutProfitabilityPruebas;

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

function crearResultadoPrecios(overrides = {}){
  return {
    precioMateriales:700,
    precioComponentes:150,
    precioCorte:200,
    precioTapacanto:150,
    precioTotal:1200,
    ...overrides
  };
}

function plano(valor){
  return JSON.parse(JSON.stringify(valor));
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

probar('calcula una rentabilidad completa', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios()
  });

  assert.deepStrictEqual(plano(resultado), {
    ok:true,
    resultadoRentabilidad:{
      estado:'PRECIO_COMPLETO',
      costoTotal:800,
      precioTotal:1200,
      precioDisponible:null,
      utilidad:400,
      markupPorcentaje:50,
      margenPorcentaje:400 / 1200 * 100,
      advertencias:[]
    }
  });
});

probar('conserva la precision de markup y margen sin redondeo', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos({costoTotal:3}),
    resultadoPrecios:crearResultadoPrecios({precioTotal:10})
  }).resultadoRentabilidad;

  assert.strictEqual(resultado.utilidad, 7);
  assert.strictEqual(resultado.markupPorcentaje, 7 / 3 * 100);
  assert.strictEqual(resultado.margenPorcentaje, 70);
});

probar('costo cero mantiene utilidad y margen pero deja markup indefinido', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos({costoTotal:0}),
    resultadoPrecios:crearResultadoPrecios()
  }).resultadoRentabilidad;

  assert.strictEqual(resultado.estado, 'PRECIO_COMPLETO');
  assert.strictEqual(resultado.utilidad, 1200);
  assert.strictEqual(resultado.markupPorcentaje, null);
  assert.strictEqual(resultado.margenPorcentaje, 100);
  assert.strictEqual(resultado.advertencias[0].codigo, 'MARKUP_INDEFINIDO_COSTO_CERO');
});

probar('precio cero mantiene utilidad y markup pero deja margen indefinido', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({
      precioMateriales:0,
      precioComponentes:0,
      precioCorte:0,
      precioTapacanto:0,
      precioTotal:0
    })
  }).resultadoRentabilidad;

  assert.strictEqual(resultado.estado, 'PRECIO_COMPLETO');
  assert.strictEqual(resultado.utilidad, -800);
  assert.strictEqual(resultado.markupPorcentaje, -100);
  assert.strictEqual(resultado.margenPorcentaje, null);
  assert.strictEqual(resultado.advertencias[0].codigo, 'MARGEN_INDEFINIDO_PRECIO_CERO');
});

probar('precio parcial no produce rentabilidad definitiva', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({
      precioTapacanto:null,
      precioTotal:1050
    })
  });

  assert.strictEqual(resultado.ok, true);
  assert.deepStrictEqual(plano(resultado.resultadoRentabilidad), {
    estado:'PRECIO_PARCIAL',
    costoTotal:800,
    precioTotal:null,
    precioDisponible:1050,
    utilidad:null,
    markupPorcentaje:null,
    margenPorcentaje:null,
    advertencias:[{
      codigo:'RENTABILIDAD_NO_CALCULABLE_PRECIO_PARCIAL',
      mensaje:'La rentabilidad requiere un precio de venta completo.'
    }]
  });
});

probar('datos invalidos devuelven estado explicito y errores', () => {
  const casos = [
    {resultadoCostos:null, resultadoPrecios:crearResultadoPrecios()},
    {resultadoCostos:crearResultadoCostos({costoTotal:Infinity}), resultadoPrecios:crearResultadoPrecios()},
    {resultadoCostos:crearResultadoCostos(), resultadoPrecios:null},
    {resultadoCostos:crearResultadoCostos(), resultadoPrecios:crearResultadoPrecios({precioCorte:-1})},
    {resultadoCostos:crearResultadoCostos(), resultadoPrecios:crearResultadoPrecios({precioTotal:NaN})}
  ];

  casos.forEach(entradas => {
    const resultado = calcularRentabilidadProyecto(entradas);
    assert.strictEqual(resultado.ok, false);
    assert.strictEqual(resultado.resultadoRentabilidad.estado, 'DATOS_INVALIDOS');
    assert.strictEqual(resultado.resultadoRentabilidad.utilidad, null);
    assert.ok(resultado.errores.length > 0);
  });
});

probar('no modifica resultadoCostos ni resultadoPrecios', () => {
  const resultadoCostos = crearResultadoCostos();
  const resultadoPrecios = crearResultadoPrecios();
  const costosAntes = JSON.stringify(resultadoCostos);
  const preciosAntes = JSON.stringify(resultadoPrecios);

  calcularRentabilidadProyecto({resultadoCostos, resultadoPrecios});

  assert.strictEqual(JSON.stringify(resultadoCostos), costosAntes);
  assert.strictEqual(JSON.stringify(resultadoPrecios), preciosAntes);
});

probar('el dominio no depende de productores ni plataforma', () => {
  [
    'ProyCutCosting',
    'ProyCutPricing',
    'document.',
    'window.',
    'localStorage',
    'fetch('
  ].forEach(identificador => assert.ok(!codigoModulo.includes(identificador)));
});
