const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rutaModulo = path.resolve(__dirname, '../../src/scripts/pricing/calculate-price.js');
const codigoModulo = fs.readFileSync(rutaModulo, 'utf8');
const contextoModulo = vm.createContext({});
vm.runInContext(
  `${codigoModulo}\n;globalThis.ProyCutPricingPruebas = ProyCutPricing;`,
  contextoModulo,
  {filename:rutaModulo}
);
const {calcularPrecioProyecto} = contextoModulo.ProyCutPricingPruebas;

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

function crearResultadoCostos(costoTotal = 1000){
  return {costoTotal};
}

function crearContexto(porcentajeSobreCosto){
  return {
    metodo:'GLOBAL_SOBRE_COSTO',
    porcentajeSobreCosto
  };
}

function calcular(costoTotal, porcentajeSobreCosto){
  return calcularPrecioProyecto(
    crearResultadoCostos(costoTotal),
    crearContexto(porcentajeSobreCosto)
  );
}

function verificarRechazo(resultado, codigoEsperado){
  assert.strictEqual(resultado.ok, false);
  assert.ok(Array.isArray(resultado.errores));
  assert.ok(resultado.errores.some(error => error.codigo === codigoEsperado));
}

[
  {porcentaje:0, precio:1000},
  {porcentaje:10, precio:1100},
  {porcentaje:30, precio:1300},
  {porcentaje:100, precio:2000}
].forEach(({porcentaje, precio}) => {
  probar(`costo 1000 con ${porcentaje} por ciento`, () => {
    const resultado = calcular(1000, porcentaje);
    assert.strictEqual(resultado.ok, true);
    assert.strictEqual(resultado.resultadoPrecios.precioFinal, precio);
  });
});

probar('porcentaje decimal conserva precision de dominio sin redondeo', () => {
  const porcentaje = 33.333;
  const resultado = calcular(1000, porcentaje);
  assert.strictEqual(
    resultado.resultadoPrecios.precioFinal,
    1000 * (1 + porcentaje / 100)
  );
});

probar('costo cero con porcentaje valido produce precio cero', () => {
  const resultado = calcular(0, 30);
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, 0);
});

[
  {nombre:'negativo', valor:-1},
  {nombre:'NaN', valor:NaN},
  {nombre:'Infinity', valor:Infinity},
  {nombre:'-Infinity', valor:-Infinity},
  {nombre:'null', valor:null},
  {nombre:'string', valor:'30'},
  {nombre:'vacio', valor:''}
].forEach(({nombre, valor}) => {
  probar(`porcentaje invalido: ${nombre}`, () => {
    verificarRechazo(
      calcular(1000, valor),
      'PORCENTAJE_SOBRE_COSTO_INVALIDO'
    );
  });
});

probar('porcentaje ausente es requerido', () => {
  verificarRechazo(
    calcularPrecioProyecto(
      crearResultadoCostos(),
      {metodo:'GLOBAL_SOBRE_COSTO'}
    ),
    'PORCENTAJE_SOBRE_COSTO_REQUERIDO'
  );
});

probar('porcentaje undefined es requerido', () => {
  verificarRechazo(
    calcular(1000, undefined),
    'PORCENTAJE_SOBRE_COSTO_REQUERIDO'
  );
});

[
  {nombre:'negativo', valor:-1},
  {nombre:'NaN', valor:NaN},
  {nombre:'Infinity', valor:Infinity},
  {nombre:'string', valor:'1000'}
].forEach(({nombre, valor}) => {
  probar(`costoTotal invalido: ${nombre}`, () => {
    verificarRechazo(
      calcular(valor, 30),
      'COSTO_TOTAL_INVALIDO'
    );
  });
});

probar('no consulta precios comerciales ni exige desglose tecnico', () => {
  const resultadoCostos = Object.freeze({costoTotal:1000});
  const contextoComercial = Object.freeze({
    metodo:'GLOBAL_SOBRE_COSTO',
    porcentajeSobreCosto:30
  });
  const resultado = calcularPrecioProyecto(resultadoCostos, contextoComercial);
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, 1300);
});

probar('produce el contrato global explicito sin desglose ficticio', () => {
  const resultado = calcular(1000, 30);
  const precios = resultado.resultadoPrecios;
  assert.strictEqual(precios.metodoAplicado, 'GLOBAL_SOBRE_COSTO');
  assert.strictEqual(precios.precioBase, 1300);
  assert.strictEqual(precios.precioFinal, 1300);
  assert.strictEqual(precios.precioTotal, 1300);
  assert.strictEqual(precios.porcentajeAplicado.tipo, 'MARKUP_SOBRE_COSTO');
  assert.strictEqual(precios.porcentajeAplicado.valor, 30);
  assert.strictEqual(precios.desgloseCategorias, null);
  assert.strictEqual(precios.descuentoAplicado, null);
  assert.deepStrictEqual(Array.from(precios.advertencias), []);
  [
    'precioMateriales',
    'precioComponentes',
    'precioCorte',
    'precioTapacanto'
  ].forEach(campo => {
    assert.ok(!Object.prototype.hasOwnProperty.call(precios, campo));
  });
});

probar('no modifica las entradas', () => {
  const resultadoCostos = {costoTotal:1000};
  const contextoComercial = crearContexto(30.5);
  const costosAntes = JSON.stringify(resultadoCostos);
  const contextoAntes = JSON.stringify(contextoComercial);
  calcularPrecioProyecto(resultadoCostos, contextoComercial);
  assert.strictEqual(JSON.stringify(resultadoCostos), costosAntes);
  assert.strictEqual(JSON.stringify(contextoComercial), contextoAntes);
});

probar('camino CATALOGO conserva sus valores comerciales historicos bajo el contrato P4B completo', () => {
  const resultado = calcularPrecioProyecto(
    {
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
    },
    {
      metodo:'CATALOGO',
      catalogoComercial:{
        materiales:[{sku:'T-000001', precioVenta:1200}],
        componentes:[{sku:'H-000001', precioVenta:70}],
        tapacantos:[{sku:'E-000001', precioVenta:18}],
        corte:{modo:'corte', precioVentaCorte:12, precioVentaCorteMetro:30}
      }
    }
  );
  assert.strictEqual(resultado.ok, true);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(resultado.resultadoPrecios)),
    {
      metodoAplicado:'CATALOGO',
      precioMateriales:1200,
      precioComponentes:140,
      precioCorte:48,
      precioTapacanto:18,
      precioBase:1406,
      descuentoAplicado:null,
      precioFinal:1406,
      precioTotal:1406
    }
  );
});
