const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rutaModulo = path.resolve(__dirname, '../../src/scripts/profitability/calculate-profitability.js');
const codigoModulo = fs.readFileSync(rutaModulo, 'utf8');
const contextoModulo = vm.createContext({});
vm.runInContext(
  `${codigoModulo}\n;globalThis.ProyCutProfitabilityPruebas = ProyCutProfitability;`,
  contextoModulo,
  {filename:rutaModulo}
);
const {calcularRentabilidadProyecto} = contextoModulo.ProyCutProfitabilityPruebas;

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

function politica(bits){
  return {
    incluirCostoCorte:Boolean(bits & 8),
    incluirPrecioCorte:Boolean(bits & 4),
    incluirCostoTapacanto:Boolean(bits & 2),
    incluirPrecioTapacanto:Boolean(bits & 1)
  };
}

probar('calcula rentabilidad completa y conserva totales historicos', () => {
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
      costoConsiderado:800,
      precioConsiderado:1200,
      utilidad:400,
      markupPorcentaje:50,
      margenPorcentaje:400 / 1200 * 100,
      advertencias:[]
    }
  });
});

for(let bits=0; bits<16; bits++){
  probar(`matriz exhaustiva de politica ${bits.toString(2).padStart(4, '0')}`, () => {
    const politicaRentabilidad = politica(bits);
    const resultadoCostos = crearResultadoCostos();
    const resultadoPrecios = crearResultadoPrecios();
    const costosAntes = JSON.stringify(resultadoCostos);
    const preciosAntes = JSON.stringify(resultadoPrecios);
    const politicaAntes = JSON.stringify(politicaRentabilidad);
    const costoConsiderado = 600 +
      (politicaRentabilidad.incluirCostoCorte ? 120 : 0) +
      (politicaRentabilidad.incluirCostoTapacanto ? 80 : 0);
    const precioConsiderado = 850 +
      (politicaRentabilidad.incluirPrecioCorte ? 200 : 0) +
      (politicaRentabilidad.incluirPrecioTapacanto ? 150 : 0);
    const utilidad = precioConsiderado - costoConsiderado;

    const resultado = calcularRentabilidadProyecto({
      resultadoCostos,
      resultadoPrecios,
      politicaRentabilidad
    }).resultadoRentabilidad;

    assert.strictEqual(resultado.estado, 'PRECIO_COMPLETO');
    assert.strictEqual(resultado.costoTotal, 800);
    assert.strictEqual(resultado.precioTotal, 1200);
    assert.strictEqual(resultado.costoConsiderado, costoConsiderado);
    assert.strictEqual(resultado.precioConsiderado, precioConsiderado);
    assert.strictEqual(resultado.utilidad, utilidad);
    assert.strictEqual(resultado.markupPorcentaje, utilidad / costoConsiderado * 100);
    assert.strictEqual(resultado.margenPorcentaje, utilidad / precioConsiderado * 100);
    assert.strictEqual(JSON.stringify(resultadoCostos), costosAntes);
    assert.strictEqual(JSON.stringify(resultadoPrecios), preciosAntes);
    assert.strictEqual(JSON.stringify(politicaRentabilidad), politicaAntes);
  });
}

probar('politica ausente activa los cuatro conceptos', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios()
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.costoConsiderado, 800);
  assert.strictEqual(resultado.precioConsiderado, 1200);
});

probar('propiedades ausentes conservan default true', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios(),
    politicaRentabilidad:{incluirCostoCorte:false}
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.costoConsiderado, 680);
  assert.strictEqual(resultado.precioConsiderado, 1200);
});

probar('flag no booleano produce DATOS_INVALIDOS sin coercion', () => {
  ['false', 0, 1, null, undefined].forEach(valor => {
    const resultado = calcularRentabilidadProyecto({
      resultadoCostos:crearResultadoCostos(),
      resultadoPrecios:crearResultadoPrecios(),
      politicaRentabilidad:{incluirPrecioCorte:valor}
    });
    assert.strictEqual(resultado.ok, false);
    assert.strictEqual(resultado.resultadoRentabilidad.estado, 'DATOS_INVALIDOS');
    assert.ok(resultado.errores.some(error => error.codigo === 'POLITICA_RENTABILIDAD_INVALIDA'));
  });
});

probar('precio corte excluido y nulo no bloquea', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({precioCorte:null, precioTotal:1000}),
    politicaRentabilidad:{incluirPrecioCorte:false}
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.estado, 'PRECIO_COMPLETO');
  assert.strictEqual(resultado.precioConsiderado, 1000);
});

probar('precio corte incluido y nulo produce PRECIO_PARCIAL', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({precioCorte:null, precioTotal:1000})
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.estado, 'PRECIO_PARCIAL');
  assert.strictEqual(resultado.costoConsiderado, 800);
  assert.strictEqual(resultado.precioConsiderado, null);
  assert.strictEqual(resultado.precioDisponible, 1000);
  assert.strictEqual(resultado.utilidad, null);
  assert.strictEqual(resultado.markupPorcentaje, null);
  assert.strictEqual(resultado.margenPorcentaje, null);
});

probar('precio disponible parcial suma solo categorias participantes', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({precioCorte:null, precioTotal:1000}),
    politicaRentabilidad:{incluirPrecioTapacanto:false}
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.estado, 'PRECIO_PARCIAL');
  assert.strictEqual(resultado.precioDisponible, 850);
});

probar('precio tapacanto excluido y nulo no bloquea', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({precioTapacanto:null, precioTotal:1050}),
    politicaRentabilidad:{incluirPrecioTapacanto:false}
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.estado, 'PRECIO_COMPLETO');
  assert.strictEqual(resultado.precioConsiderado, 1050);
});

probar('precio tapacanto incluido y nulo produce PRECIO_PARCIAL', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({precioTapacanto:null, precioTotal:1050})
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.estado, 'PRECIO_PARCIAL');
  assert.strictEqual(resultado.precioDisponible, 1050);
});

probar('precio incluido igual a cero es valido', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({precioCorte:0, precioTotal:1000})
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.estado, 'PRECIO_COMPLETO');
  assert.strictEqual(resultado.precioConsiderado, 1000);
});

['precioMateriales', 'precioComponentes'].forEach(campo => {
  probar(`${campo} nulo siempre produce PRECIO_PARCIAL`, () => {
    const resultadoPrecios = crearResultadoPrecios({[campo]:null});
    resultadoPrecios.precioTotal = Object.keys(resultadoPrecios)
      .filter(clave => clave !== 'precioTotal' && Number.isFinite(resultadoPrecios[clave]))
      .reduce((total, clave) => total + resultadoPrecios[clave], 0);
    const resultado = calcularRentabilidadProyecto({
      resultadoCostos:crearResultadoCostos(),
      resultadoPrecios,
      politicaRentabilidad:{incluirPrecioCorte:false, incluirPrecioTapacanto:false}
    }).resultadoRentabilidad;
    assert.strictEqual(resultado.estado, 'PRECIO_PARCIAL');
  });
});

probar('precio excluido invalido no nulo produce DATOS_INVALIDOS', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({precioCorte:NaN}),
    politicaRentabilidad:{incluirPrecioCorte:false}
  });
  assert.strictEqual(resultado.ok, false);
  assert.strictEqual(resultado.resultadoRentabilidad.estado, 'DATOS_INVALIDOS');
});

probar('conserva precision sin redondeo', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos({
      costoMateriales:1, costoComponentes:2, costoCorte:0, costoTapacanto:0, costoTotal:3
    }),
    resultadoPrecios:crearResultadoPrecios({
      precioMateriales:7, precioComponentes:3, precioCorte:0, precioTapacanto:0, precioTotal:10
    })
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.utilidad, 7);
  assert.strictEqual(resultado.markupPorcentaje, 7 / 3 * 100);
  assert.strictEqual(resultado.margenPorcentaje, 70);
});

probar('costo considerado cero deja markup indefinido', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos({
      costoMateriales:0, costoComponentes:0, costoCorte:120, costoTapacanto:80, costoTotal:200
    }),
    resultadoPrecios:crearResultadoPrecios(),
    politicaRentabilidad:{incluirCostoCorte:false, incluirCostoTapacanto:false}
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.costoTotal, 200);
  assert.strictEqual(resultado.costoConsiderado, 0);
  assert.strictEqual(resultado.markupPorcentaje, null);
  assert.ok(resultado.advertencias.some(aviso => aviso.codigo === 'MARKUP_INDEFINIDO_COSTO_CERO'));
});

probar('precio considerado cero deja margen indefinido', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({
      precioMateriales:0, precioComponentes:0, precioCorte:200, precioTapacanto:150, precioTotal:350
    }),
    politicaRentabilidad:{incluirPrecioCorte:false, incluirPrecioTapacanto:false}
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.precioTotal, 350);
  assert.strictEqual(resultado.precioConsiderado, 0);
  assert.strictEqual(resultado.margenPorcentaje, null);
  assert.ok(resultado.advertencias.some(aviso => aviso.codigo === 'MARGEN_INDEFINIDO_PRECIO_CERO'));
});

probar('conserva una perdida negativa', () => {
  const resultado = calcularRentabilidadProyecto({
    resultadoCostos:crearResultadoCostos(),
    resultadoPrecios:crearResultadoPrecios({
      precioMateriales:300, precioComponentes:100, precioCorte:100, precioTapacanto:100, precioTotal:600
    })
  }).resultadoRentabilidad;
  assert.strictEqual(resultado.utilidad, -200);
  assert.ok(resultado.markupPorcentaje < 0);
  assert.ok(resultado.margenPorcentaje < 0);
});

probar('datos invalidos tienen campos considerados nulos', () => {
  const casos = [
    {resultadoCostos:null, resultadoPrecios:crearResultadoPrecios()},
    {resultadoCostos:crearResultadoCostos({costoCorte:Infinity}), resultadoPrecios:crearResultadoPrecios()},
    {resultadoCostos:crearResultadoCostos(), resultadoPrecios:null},
    {resultadoCostos:crearResultadoCostos(), resultadoPrecios:crearResultadoPrecios({precioCorte:-1})},
    {resultadoCostos:crearResultadoCostos(), resultadoPrecios:crearResultadoPrecios({precioTotal:NaN})}
  ];
  casos.forEach(entradas => {
    const resultado = calcularRentabilidadProyecto(entradas);
    assert.strictEqual(resultado.ok, false);
    assert.strictEqual(resultado.resultadoRentabilidad.estado, 'DATOS_INVALIDOS');
    assert.strictEqual(resultado.resultadoRentabilidad.costoConsiderado, null);
    assert.strictEqual(resultado.resultadoRentabilidad.precioConsiderado, null);
    assert.ok(resultado.errores.length > 0);
  });
});

probar('el dominio no depende de productores ni plataforma', () => {
  ['ProyCutCosting', 'ProyCutPricing', 'document.', 'window.', 'localStorage', 'fetch(']
    .forEach(identificador => assert.ok(!codigoModulo.includes(identificador)));
});
