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

function crearResultadoCostos(){
  return {
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
}

function crearCatalogo(){
  return {
    materiales:[{sku:'T-000001', precio:750, precioVenta:1200}],
    componentes:[{sku:'H-000001', precio:40, precioVenta:70}],
    tapacantos:[{sku:'E-000001', precio:10.5, precioVenta:18}],
    corte:{modo:'corte', precioVentaCorte:12, precioVentaCorteMetro:30}
  };
}

probar('calcula ResultadoPrecios solo con valores comerciales separados', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {metodo:'CATALOGO', catalogoComercial:crearCatalogo()}
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

probar('material usa precioVenta por tableros e ignora costo interno', () => {
  const resultadoCostos = crearResultadoCostos();
  resultadoCostos.costoMateriales = 2800;
  resultadoCostos.costoTotal = 2910.5;
  resultadoCostos.materiales[0] = {sku:'MAT-001', tableros:4};
  const catalogo = crearCatalogo();
  catalogo.materiales[0] = {sku:'MAT-001', precio:700, precioVenta:1000};
  const costosAntes = JSON.stringify(resultadoCostos);

  const resultado = calcularPrecioProyecto(
    resultadoCostos,
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );

  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioMateriales, 4000);
  assert.notStrictEqual(resultado.resultadoPrecios.precioMateriales, 2800);
  assert.strictEqual(JSON.stringify(resultadoCostos), costosAntes);
});

probar('encuentra precios comerciales con SKU normalizado', () => {
  const resultadoCostos = crearResultadoCostos();
  resultadoCostos.materiales[0].sku = ' t-000001 ';
  resultadoCostos.componentes[0].sku = 'h-000001';
  resultadoCostos.tapacantos[0].sku = ' e-000001';
  const resultado = calcularPrecioProyecto(
    resultadoCostos,
    {metodo:'CATALOGO', catalogoComercial:crearCatalogo()}
  );
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioMateriales, 1200);
  assert.strictEqual(resultado.resultadoPrecios.precioComponentes, 140);
  assert.strictEqual(resultado.resultadoPrecios.precioTapacanto, 18);
});

probar('actualiza ResultadoPrecios al cambiar precioVenta sin cambiar ResultadoCostos', () => {
  const resultadoCostos = crearResultadoCostos();
  const costosAntes = JSON.stringify(resultadoCostos);
  const catalogo = crearCatalogo();
  const inicial = calcularPrecioProyecto(
    resultadoCostos,
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );
  catalogo.materiales[0].precioVenta = 1500;
  const actualizado = calcularPrecioProyecto(
    resultadoCostos,
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );

  assert.strictEqual(inicial.ok, true);
  assert.strictEqual(inicial.resultadoPrecios.precioMateriales, 1200);
  assert.strictEqual(actualizado.ok, true);
  assert.strictEqual(actualizado.resultadoPrecios.precioMateriales, 1500);
  assert.strictEqual(actualizado.resultadoPrecios.precioTotal, inicial.resultadoPrecios.precioTotal + 300);
  assert.strictEqual(JSON.stringify(resultadoCostos), costosAntes);
});

probar('nuevo desglose tecnico actualiza Pricing sin alterar resultados de costos', () => {
  const resultadoCostosInicial = crearResultadoCostos();
  const resultadoCostosActualizado = crearResultadoCostos();
  resultadoCostosActualizado.materiales[0].tableros = 2;
  resultadoCostosActualizado.costoMateriales = 1500;
  resultadoCostosActualizado.costoTotal = 1610.5;
  const costosInicialesAntes = JSON.stringify(resultadoCostosInicial);
  const costosActualizadosAntes = JSON.stringify(resultadoCostosActualizado);
  const contextoComercial = {metodo:'CATALOGO', catalogoComercial:crearCatalogo()};

  const precioInicial = calcularPrecioProyecto(resultadoCostosInicial, contextoComercial);
  const precioActualizado = calcularPrecioProyecto(resultadoCostosActualizado, contextoComercial);

  assert.strictEqual(precioInicial.ok, true);
  assert.strictEqual(precioInicial.resultadoPrecios.precioMateriales, 1200);
  assert.strictEqual(precioActualizado.ok, true);
  assert.strictEqual(precioActualizado.resultadoPrecios.precioMateriales, 2400);
  assert.strictEqual(
    precioActualizado.resultadoPrecios.precioTotal,
    precioInicial.resultadoPrecios.precioTotal + 1200
  );
  assert.strictEqual(JSON.stringify(resultadoCostosInicial), costosInicialesAntes);
  assert.strictEqual(JSON.stringify(resultadoCostosActualizado), costosActualizadosAntes);
});

probar('ResultadoCostos no recibe campos comerciales', () => {
  const resultadoCostos = crearResultadoCostos();
  calcularPrecioProyecto(resultadoCostos, {metodo:'CATALOGO', catalogoComercial:crearCatalogo()});
  ['precioMateriales', 'precioComponentes', 'precioTapacanto', 'precioTotal'].forEach(campo => {
    assert.ok(!Object.prototype.hasOwnProperty.call(resultadoCostos, campo));
  });
});

probar('ResultadoPrecios no contiene costos', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {metodo:'CATALOGO', catalogoComercial:crearCatalogo()}
  );
  Object.keys(resultado.resultadoPrecios).forEach(campo => assert.ok(!campo.startsWith('costo')));
});

probar('costos internos nunca sustituyen precios comerciales ausentes', () => {
  const catalogo = crearCatalogo();
  catalogo.materiales[0].precioVenta = null;
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );
  assert.strictEqual(resultado.ok, false);
  assert.ok(resultado.errores.some(error => error.codigo === 'PRECIO_VENTA_INVALIDO'));
  assert.strictEqual(resultado.resultadoPrecios.precioMateriales, null);
  assert.strictEqual(resultado.resultadoPrecios.precioComponentes, 140);
  assert.strictEqual(resultado.resultadoPrecios.precioTapacanto, 18);
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, 48);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 206);
});

probar('precio de corte faltante no elimina precios validos de otras categorias', () => {
  const catalogo = crearCatalogo();
  catalogo.corte.precioVentaCorte = null;
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );

  assert.strictEqual(resultado.ok, false);
  assert.ok(resultado.errores.some(error => (
    error.codigo === 'PRECIO_VENTA_CORTE_INVALIDO' &&
    error.mensaje.includes('precioVentaCorte')
  )));
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(resultado.resultadoPrecios)),
    {
      precioMateriales:1200,
      precioComponentes:140,
      precioCorte:null,
      precioTapacanto:18,
      precioTotal:1358
    }
  );
});

probar('precio de corte faltante mantiene total de categorias comerciales validas', () => {
  const resultadoCostos = crearResultadoCostos();
  resultadoCostos.materiales = [{sku:'T-000001', tableros:10}];
  resultadoCostos.tapacantos = [{sku:'E-000001', metrosCobrables:240}];
  resultadoCostos.componentes = [{sku:'H-000001', cantidadTotal:30}];
  const catalogo = crearCatalogo();
  catalogo.materiales[0].precioVenta = 1200;
  catalogo.tapacantos[0].precioVenta = 20;
  catalogo.componentes[0].precioVenta = 25;
  catalogo.corte.precioVentaCorte = null;

  const resultado = calcularPrecioProyecto(
    resultadoCostos,
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );

  assert.strictEqual(resultado.ok, false);
  assert.strictEqual(resultado.resultadoPrecios.precioMateriales, 12000);
  assert.strictEqual(resultado.resultadoPrecios.precioTapacanto, 4800);
  assert.strictEqual(resultado.resultadoPrecios.precioComponentes, 750);
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, null);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 17550);
});

probar('corte por pieza no utilizado no exige tarifa comercial', () => {
  const resultadoCostos = crearResultadoCostos();
  resultadoCostos.cortes = 0;
  const catalogo = crearCatalogo();
  catalogo.corte.precioVentaCorte = null;

  const resultado = calcularPrecioProyecto(
    resultadoCostos,
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );

  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, 0);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 1358);
});

probar('corte por metro no utilizado no exige tarifa comercial', () => {
  const resultadoCostos = crearResultadoCostos();
  resultadoCostos.corteMl = 0;
  const catalogo = crearCatalogo();
  catalogo.corte.modo = 'metro';
  catalogo.corte.precioVentaCorteMetro = null;

  const resultado = calcularPrecioProyecto(
    resultadoCostos,
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );

  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, 0);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 1358);
});

probar('corte utilizado acepta tarifa comercial cero', () => {
  const catalogo = crearCatalogo();
  catalogo.corte.precioVentaCorte = 0;

  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );

  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, 0);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 1358);
});

probar('cantidad tecnica invalida de corte por pieza conserva su error', () => {
  const resultadoCostos = crearResultadoCostos();
  resultadoCostos.cortes = -1;
  const catalogo = crearCatalogo();
  catalogo.corte.precioVentaCorte = null;

  const resultado = calcularPrecioProyecto(
    resultadoCostos,
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );

  assert.strictEqual(resultado.ok, false);
  assert.ok(resultado.errores.some(error => error.codigo === 'CANTIDAD_TECNICA_CORTE_INVALIDA'));
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, null);
});

probar('cantidad tecnica invalida de corte por metro conserva su error', () => {
  const resultadoCostos = crearResultadoCostos();
  resultadoCostos.corteMl = Infinity;
  const catalogo = crearCatalogo();
  catalogo.corte.modo = 'metro';
  catalogo.corte.precioVentaCorteMetro = null;

  const resultado = calcularPrecioProyecto(
    resultadoCostos,
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );

  assert.strictEqual(resultado.ok, false);
  assert.ok(resultado.errores.some(error => error.codigo === 'CANTIDAD_TECNICA_CORTE_INVALIDA'));
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, null);
});

probar('precio de corte usa valor comercial y no costoCorte', () => {
  const resultadoCostos = crearResultadoCostos();
  resultadoCostos.costoCorte = 999;
  const resultado = calcularPrecioProyecto(
    resultadoCostos,
    {metodo:'CATALOGO', catalogoComercial:crearCatalogo()}
  );
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, 48);
  assert.notStrictEqual(resultado.resultadoPrecios.precioCorte, 999);
});

probar('precio de corte por metro usa precioVentaCorteMetro', () => {
  const catalogo = crearCatalogo();
  catalogo.corte.modo = 'metro';
  catalogo.corte.precioVentaCorte = 999;
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {metodo:'CATALOGO', catalogoComercial:catalogo}
  );
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, 60);
  assert.notStrictEqual(resultado.resultadoPrecios.precioCorte, 999);
});

probar('precio manual existente continua funcionando', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {metodo:'PRECIO_FIJO', precioManual:1500}
  );
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecio.precioFinal, 1500);
});

// ---------- P4B: CATALOGO completo + descuento ----------

probar('CATALOGO completo + NINGUNO explicito produce el mismo resultado que sin descuento', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {
      metodo:'CATALOGO',
      catalogoComercial:crearCatalogo(),
      descuento:{tipo:'NINGUNO', porcentaje:null}
    }
  );
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioBase, 1406);
  assert.strictEqual(resultado.resultadoPrecios.descuentoAplicado, null);
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, 1406);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 1406);
});

probar('CATALOGO completo + 0% produce precioFinal igual a precioBase con monto 0', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {
      metodo:'CATALOGO',
      catalogoComercial:crearCatalogo(),
      descuento:{tipo:'PORCENTAJE', porcentaje:0}
    }
  );
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioBase, 1406);
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(resultado.resultadoPrecios.descuentoAplicado)),
    {tipo:'PORCENTAJE', porcentaje:0, monto:0}
  );
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, 1406);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 1406);
});

probar('CATALOGO completo + 10% aplica el descuento sobre la suma bruta de categorias', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {
      metodo:'CATALOGO',
      catalogoComercial:crearCatalogo(),
      descuento:{tipo:'PORCENTAJE', porcentaje:10}
    }
  );
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.precioMateriales, 1200);
  assert.strictEqual(resultado.resultadoPrecios.precioComponentes, 140);
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, 48);
  assert.strictEqual(resultado.resultadoPrecios.precioTapacanto, 18);
  assert.strictEqual(resultado.resultadoPrecios.precioBase, 1406);
  assert.strictEqual(resultado.resultadoPrecios.descuentoAplicado.monto, 140.6);
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, 1265.4);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 1265.4);
});

probar('CATALOGO completo + decimal conserva precision exacta sin redondeo', () => {
  const porcentaje = 12.5;
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {
      metodo:'CATALOGO',
      catalogoComercial:crearCatalogo(),
      descuento:{tipo:'PORCENTAJE', porcentaje}
    }
  );
  const precioBase = 1406;
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.descuentoAplicado.monto, precioBase * porcentaje / 100);
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, precioBase - (precioBase * porcentaje / 100));
});

probar('CATALOGO completo + 100% produce precioFinal 0', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {
      metodo:'CATALOGO',
      catalogoComercial:crearCatalogo(),
      descuento:{tipo:'PORCENTAJE', porcentaje:100}
    }
  );
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.resultadoPrecios.descuentoAplicado.monto, 1406);
  assert.strictEqual(resultado.resultadoPrecios.precioFinal, 0);
  assert.strictEqual(resultado.resultadoPrecios.precioTotal, 0);
  // los subtotales por categoria NUNCA se tocan, incluso con 100% de descuento
  assert.strictEqual(resultado.resultadoPrecios.precioMateriales, 1200);
  assert.strictEqual(resultado.resultadoPrecios.precioCorte, 48);
});

probar('CATALOGO completo + descuento invalido propaga el error del Domain sin fabricar precio', () => {
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {
      metodo:'CATALOGO',
      catalogoComercial:crearCatalogo(),
      descuento:{tipo:'PORCENTAJE', porcentaje:150}
    }
  );
  assert.strictEqual(resultado.ok, false);
  assert.ok(resultado.errores.some(error => error.codigo === 'DESCUENTO_PORCENTAJE_FUERA_DE_RANGO'));
  assert.ok(!Object.prototype.hasOwnProperty.call(resultado, 'resultadoPrecios'));
});

probar('CATALOGO parcial ignora el descuento por completo y conserva el diagnostico historico', () => {
  const catalogo = crearCatalogo();
  catalogo.materiales[0].precioVenta = null;
  const resultado = calcularPrecioProyecto(
    crearResultadoCostos(),
    {
      metodo:'CATALOGO',
      catalogoComercial:catalogo,
      descuento:{tipo:'PORCENTAJE', porcentaje:10}
    }
  );
  assert.strictEqual(resultado.ok, false);
  assert.ok(resultado.errores.some(error => error.codigo === 'PRECIO_VENTA_INVALIDO'));
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(resultado.resultadoPrecios)),
    {
      precioMateriales:null,
      precioComponentes:140,
      precioCorte:48,
      precioTapacanto:18,
      precioTotal:206
    }
  );
  assert.ok(!Object.prototype.hasOwnProperty.call(resultado.resultadoPrecios, 'metodoAplicado'));
  assert.ok(!Object.prototype.hasOwnProperty.call(resultado.resultadoPrecios, 'precioBase'));
  assert.ok(!Object.prototype.hasOwnProperty.call(resultado.resultadoPrecios, 'descuentoAplicado'));
  assert.ok(!Object.prototype.hasOwnProperty.call(resultado.resultadoPrecios, 'precioFinal'));
});

probar('CATALOGO + descuento no muta resultadoCostos, catalogoComercial ni el objeto descuento', () => {
  const resultadoCostos = crearResultadoCostos();
  const catalogo = crearCatalogo();
  const descuento = Object.freeze({tipo:'PORCENTAJE', porcentaje:10});
  const costosAntes = JSON.stringify(resultadoCostos);
  const catalogoAntes = JSON.stringify(catalogo);
  const descuentoAntes = JSON.stringify(descuento);

  calcularPrecioProyecto(resultadoCostos, {metodo:'CATALOGO', catalogoComercial:catalogo, descuento});

  assert.strictEqual(JSON.stringify(resultadoCostos), costosAntes);
  assert.strictEqual(JSON.stringify(catalogo), catalogoAntes);
  assert.strictEqual(JSON.stringify(descuento), descuentoAntes);
});
