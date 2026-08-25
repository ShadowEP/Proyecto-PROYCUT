const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');
const idsPolitica = [
  'incluirCostoCorteRentabilidad',
  'incluirPrecioCorteRentabilidad',
  'incluirCostoTapacantoRentabilidad',
  'incluirPrecioTapacantoRentabilidad'
];

function leer(ruta){
  return fs.readFileSync(path.join(raiz, ruta), 'utf8');
}

function contar(texto, fragmento){
  return texto.split(fragmento).length - 1;
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

function crearControl(checked){
  return {
    checked,
    indeterminate:false,
    listeners:{},
    addEventListener(tipo, listener){
      this.listeners[tipo] = listener;
    }
  };
}

function crearResultadoCostos(){
  return {
    costoMateriales:1000,
    costoComponentes:0,
    costoCorte:100,
    costoTapacanto:50,
    costoTotal:1150,
    materiales:[{
      sku:'MAT-001', nombre:'MDF', tableros:1,
      precioUnitario:1000, importe:1000
    }],
    componentes:[],
    tapacantos:[],
    cortes:0,
    corteMl:0,
    corteMlPresentacion:0,
    precioCorte:100,
    corteImporte:100
  };
}

function crearEscenario(){
  const elementos = {
    plantillaReporte:{value:'columnas'},
    disenoTotal:{value:'pastel'},
    resumenPreciosContenido:{innerHTML:''},
    estadoPrecioCatalogo:{textContent:''},
    modoPrecioCortePorMetro:{checked:false},
    precioVentaCorte:{value:'20'},
    precioVentaCorteMetro:{value:''},
    precioCorteMetro:{value:'0'},
    toggleServiciosRentabilidad:crearControl(true)
  };
  idsPolitica.forEach(id => {
    elementos[id] = crearControl(true);
  });
  const state = {
    ultimoCosto:crearResultadoCostos(),
    materiales:[{sku:'MAT-001', nombre:'MDF', precioVenta:1500}],
    componentes:[],
    tapacantos:[]
  };
  const contexto = vm.createContext({
    document:{getElementById:id => elementos[id]},
    fmt:valor => String(valor),
    fmtMoney:valor => String(valor),
    normalizarSkuManual:valor => String(valor || '').trim().toUpperCase(),
    state,
    llamadasPricing:0,
    llamadasProfitability:0,
    entradasRentabilidad:[]
  });
  const inicioIntegracion = main.indexOf('let ultimoResultadoPreciosVisible = null;');
  const finIntegracion = main.indexOf(
    "document.getElementById('mostrarCostosProyecto').addEventListener",
    inicioIntegracion
  );
  const inicioListeners = main.indexOf("  [\n    'incluirCostoCorteRentabilidad'");
  const finListeners = main.indexOf(
    "  document.getElementById('nivelOptimizacionNormal')",
    inicioListeners
  );
  const integracion = main.slice(inicioIntegracion, finIntegracion);
  const listeners = main.slice(inicioListeners, finListeners);

  vm.runInContext(
    `${leer('src/scripts/pricing/calculate-price.js')}\n` +
    `${leer('src/scripts/project/pricing-application-adapter.js')}\n` +
    `${leer('src/scripts/project/calculate-project-price.js')}\n` +
    `${leer('src/scripts/profitability/calculate-profitability.js')}\n` +
    `${leer('src/scripts/project/calculate-project-profitability.js')}\n` +
    `const calcularPrecioCatalogoReal = ProyCutProjectPricing.calcularPrecioCatalogoProyecto;\n` +
    `ProyCutProjectPricing.calcularPrecioCatalogoProyecto = function(entrada){\n` +
    `  llamadasPricing++;\n` +
    `  return calcularPrecioCatalogoReal(entrada);\n` +
    `};\n` +
    `const calcularRentabilidadReal = ProyCutProjectProfitability.calcularRentabilidadDelProyecto;\n` +
    `ProyCutProjectProfitability.calcularRentabilidadDelProyecto = function(entrada){\n` +
    `  llamadasProfitability++;\n` +
    `  entradasRentabilidad.push(entrada);\n` +
    `  return calcularRentabilidadReal(entrada);\n` +
    `};\n` +
    `${integracion}\n` +
    `${listeners}\n` +
    `globalThis.actualizarPrecios = actualizarPrecioCatalogoVisible;\n` +
    `globalThis.leerPolitica = leerPoliticaRentabilidadDesdeDOM;\n` +
    `globalThis.obtenerRentabilidad = () => ultimoResultadoRentabilidadVisible;\n` +
    `globalThis.obtenerPrecios = () => ultimoResultadoPreciosVisible;`,
    contexto,
    {filename:'profitability-policy-controls'}
  );

  return {contexto, elementos, state};
}

probar('los cuatro checkboxes existen checked dentro de configPanel', () => {
  const inicioConfig = html.indexOf('id="configPanel"');
  const finConfig = html.indexOf('id="guardarConfigBtn"', inicioConfig);
  const config = html.slice(inicioConfig, finConfig);
  assert.ok(config.includes('Política de rentabilidad (Ganancias)'));
  assert.strictEqual(contar(html, 'id="toggleServiciosRentabilidad"'), 1);
  assert.ok(/id="toggleServiciosRentabilidad"[^>]*checked/.test(config));
  assert.ok(
    config.indexOf('id="toggleServiciosRentabilidad"') <
    config.indexOf('id="incluirCostoCorteRentabilidad"')
  );
  idsPolitica.forEach(id => {
    assert.strictEqual(contar(html, `id="${id}"`), 1);
    assert.ok(new RegExp(`id="${id}"[^>]*checked`).test(config));
  });
  assert.ok(config.indexOf('Opciones de corte y tapacanto') < config.indexOf('Política de rentabilidad (Ganancias)'));
});

probar('el maestro inicia activo y sin estado indeterminado', () => {
  const toggle = crearEscenario().elementos.toggleServiciosRentabilidad;
  assert.strictEqual(toggle.checked, true);
  assert.strictEqual(toggle.indeterminate, false);
});

probar('la lectura DOM produce exactamente cuatro booleanos', () => {
  const escenario = crearEscenario();
  escenario.elementos.incluirCostoCorteRentabilidad.checked = false;
  escenario.elementos.incluirPrecioTapacantoRentabilidad.checked = false;
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(escenario.contexto.leerPolitica())),
    {
      incluirCostoCorte:false,
      incluirPrecioCorte:true,
      incluirCostoTapacanto:true,
      incluirPrecioTapacanto:false
    }
  );
});

probar('cuatro flags ON preservan el resultado historico', () => {
  const escenario = crearEscenario();
  assert.strictEqual(escenario.contexto.actualizarPrecios(), true);
  const resultado = escenario.contexto.obtenerRentabilidad();
  assert.strictEqual(resultado.costoTotal, 1150);
  assert.strictEqual(resultado.costoConsiderado, 1150);
  assert.strictEqual(resultado.precioTotal, 1500);
  assert.strictEqual(resultado.precioConsiderado, 1500);
  assert.strictEqual(resultado.utilidad, 350);
  const entrada = escenario.contexto.entradasRentabilidad[0];
  assert.deepStrictEqual(JSON.parse(JSON.stringify(entrada.politicaRentabilidad)), {
    incluirCostoCorte:true,
    incluirPrecioCorte:true,
    incluirCostoTapacanto:true,
    incluirPrecioTapacanto:true
  });
});

idsPolitica.forEach(id => {
  probar(`change de ${id} recalcula solo Profitability`, () => {
    const escenario = crearEscenario();
    escenario.contexto.actualizarPrecios();
    const costosAntes = JSON.stringify(escenario.state.ultimoCosto);
    const preciosAntes = JSON.stringify(escenario.contexto.obtenerPrecios());
    const llamadasPricingAntes = escenario.contexto.llamadasPricing;
    const llamadasProfitabilityAntes = escenario.contexto.llamadasProfitability;

    escenario.elementos[id].checked = false;
    escenario.elementos[id].listeners.change();

    assert.strictEqual(escenario.contexto.llamadasPricing, llamadasPricingAntes);
    assert.strictEqual(
      escenario.contexto.llamadasProfitability,
      llamadasProfitabilityAntes + 1
    );
    assert.strictEqual(JSON.stringify(escenario.state.ultimoCosto), costosAntes);
    assert.strictEqual(JSON.stringify(escenario.contexto.obtenerPrecios()), preciosAntes);
    const entrada = escenario.contexto.entradasRentabilidad.at(-1);
    assert.strictEqual(entrada.resultadoCostos, escenario.state.ultimoCosto);
    assert.strictEqual(entrada.resultadoPrecios, escenario.contexto.obtenerPrecios());
    assert.strictEqual(escenario.elementos.toggleServiciosRentabilidad.checked, false);
    assert.strictEqual(escenario.elementos.toggleServiciosRentabilidad.indeterminate, true);
  });
});

probar('maestro OFF y ON copia su estado y recalcula solo Profitability una vez', () => {
  const escenario = crearEscenario();
  escenario.contexto.actualizarPrecios();
  const costosAntes = JSON.stringify(escenario.state.ultimoCosto);
  const preciosAntes = JSON.stringify(escenario.contexto.obtenerPrecios());
  const pricingAntes = escenario.contexto.llamadasPricing;
  let profitabilityAntes = escenario.contexto.llamadasProfitability;
  const toggle = escenario.elementos.toggleServiciosRentabilidad;

  toggle.checked = false;
  toggle.listeners.change();
  idsPolitica.forEach(id => assert.strictEqual(escenario.elementos[id].checked, false));
  assert.strictEqual(toggle.indeterminate, false);
  assert.strictEqual(escenario.contexto.llamadasProfitability, profitabilityAntes + 1);
  assert.strictEqual(escenario.contexto.llamadasPricing, pricingAntes);
  assert.strictEqual(JSON.stringify(escenario.state.ultimoCosto), costosAntes);
  assert.strictEqual(JSON.stringify(escenario.contexto.obtenerPrecios()), preciosAntes);

  profitabilityAntes = escenario.contexto.llamadasProfitability;
  toggle.checked = true;
  toggle.listeners.change();
  idsPolitica.forEach(id => assert.strictEqual(escenario.elementos[id].checked, true));
  assert.strictEqual(toggle.indeterminate, false);
  assert.strictEqual(escenario.contexto.llamadasProfitability, profitabilityAntes + 1);
  assert.strictEqual(escenario.contexto.llamadasPricing, pricingAntes);
});

probar('individuales sincronizan maestro para todos true, todos false y mezclas', () => {
  const escenario = crearEscenario();
  const toggle = escenario.elementos.toggleServiciosRentabilidad;
  const aplicar = valores => {
    idsPolitica.forEach((id, indice) => {
      escenario.elementos[id].checked = valores[indice];
    });
    const antes = escenario.contexto.llamadasProfitability;
    escenario.elementos[idsPolitica[0]].listeners.change();
    assert.strictEqual(escenario.contexto.llamadasProfitability, antes + 1);
  };

  aplicar([true, true, true, true]);
  assert.strictEqual(toggle.checked, true);
  assert.strictEqual(toggle.indeterminate, false);
  aplicar([false, false, false, false]);
  assert.strictEqual(toggle.checked, false);
  assert.strictEqual(toggle.indeterminate, false);
  aplicar([true, false, true, false]);
  assert.strictEqual(toggle.checked, false);
  assert.strictEqual(toggle.indeterminate, true);
  aplicar([false, true, true, true]);
  assert.strictEqual(toggle.checked, false);
  assert.strictEqual(toggle.indeterminate, true);
});

probar('el maestro nunca forma parte del contrato de politica', () => {
  const escenario = crearEscenario();
  assert.deepStrictEqual(Object.keys(escenario.contexto.leerPolitica()).sort(), [
    'incluirCostoCorte',
    'incluirCostoTapacanto',
    'incluirPrecioCorte',
    'incluirPrecioTapacanto'
  ]);
  assert.ok(!main.includes('incluirServiciosRentabilidad'));
});

probar('maestro OFF ignora precios de servicios faltantes y ON restaura parcial', () => {
  const escenario = crearEscenario();
  escenario.state.ultimoCosto.cortes = 1;
  escenario.state.ultimoCosto.tapacantos = [{sku:'TAP-001', tipo:'PVC', metrosCobrables:1}];
  escenario.state.tapacantos = [{sku:'TAP-001', nombre:'PVC', precioVenta:null}];
  escenario.elementos.precioVentaCorte.value = '';
  assert.strictEqual(escenario.contexto.actualizarPrecios(), false);
  assert.strictEqual(escenario.contexto.obtenerRentabilidad().estado, 'PRECIO_PARCIAL');

  const toggle = escenario.elementos.toggleServiciosRentabilidad;
  toggle.checked = false;
  toggle.listeners.change();
  assert.strictEqual(escenario.contexto.obtenerRentabilidad().estado, 'PRECIO_COMPLETO');
  toggle.checked = true;
  toggle.listeners.change();
  assert.strictEqual(escenario.contexto.obtenerRentabilidad().estado, 'PRECIO_PARCIAL');
});

probar('excluir precio de corte evita parcial y volver a incluirlo restaura parcial', () => {
  const escenario = crearEscenario();
  escenario.state.ultimoCosto.cortes = 1;
  escenario.elementos.precioVentaCorte.value = '';
  escenario.elementos.incluirPrecioCorteRentabilidad.checked = false;
  assert.strictEqual(escenario.contexto.actualizarPrecios(), false);
  assert.strictEqual(escenario.contexto.obtenerRentabilidad().estado, 'PRECIO_COMPLETO');

  escenario.elementos.incluirPrecioCorteRentabilidad.checked = true;
  escenario.elementos.incluirPrecioCorteRentabilidad.listeners.change();
  assert.strictEqual(escenario.contexto.obtenerRentabilidad().estado, 'PRECIO_PARCIAL');
});

probar('excluir precio de tapacanto evita parcial y volver a incluirlo restaura parcial', () => {
  const escenario = crearEscenario();
  escenario.state.ultimoCosto.tapacantos = [{
    sku:'TAP-001', tipo:'PVC', metrosCobrables:1
  }];
  escenario.state.tapacantos = [{sku:'TAP-001', nombre:'PVC', precioVenta:null}];
  escenario.elementos.incluirPrecioTapacantoRentabilidad.checked = false;
  assert.strictEqual(escenario.contexto.actualizarPrecios(), false);
  assert.strictEqual(escenario.contexto.obtenerRentabilidad().estado, 'PRECIO_COMPLETO');

  escenario.elementos.incluirPrecioTapacantoRentabilidad.checked = true;
  escenario.elementos.incluirPrecioTapacantoRentabilidad.listeners.change();
  assert.strictEqual(escenario.contexto.obtenerRentabilidad().estado, 'PRECIO_PARCIAL');
});

probar('controles no introducen recalculo tecnico ni segundo call-site', () => {
  const inicio = main.indexOf('function actualizarRentabilidadPorPolitica(){');
  const fin = main.indexOf('\n  }', inicio) + 4;
  const handler = main.slice(inicio, fin);
  const inicioMaestro = main.indexOf('function actualizarServiciosRentabilidad(){');
  const finMaestro = main.indexOf('\n  }', inicioMaestro) + 4;
  const handlerMaestro = main.slice(inicioMaestro, finMaestro);
  [
    'recalcular(',
    'calcularCostosProyecto',
    'calcularPrecioCatalogoProyecto',
    'optimizarProyectoPreparado',
    'buildManufacturingPipeline',
    'leerPiezas'
  ].forEach(fragmento => {
    assert.ok(!handler.includes(fragmento));
    assert.ok(!handlerMaestro.includes(fragmento));
  });
  assert.strictEqual(
    contar(main, 'ProyCutProjectProfitability.calcularRentabilidadDelProyecto('),
    1
  );
});

probar('P2 no modifica UI de Ganancias ni persistencia', () => {
  assert.ok(!html.includes('id="gananciasPanel"'));
  assert.ok(!main.includes('localStorage') || main.includes('ESTILO_KEY'));
  assert.ok(!main.includes('politicaRentabilidad') || main.includes('leerPoliticaRentabilidadDesdeDOM'));
});
