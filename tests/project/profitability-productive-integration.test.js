const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');
const rutas = {
  pricing:'src/scripts/pricing/calculate-price.js',
  pricingAdapter:'src/scripts/project/pricing-application-adapter.js',
  pricingCasoUso:'src/scripts/project/calculate-project-price.js',
  profitability:'src/scripts/profitability/calculate-profitability.js',
  profitabilityCasoUso:'src/scripts/project/calculate-project-profitability.js'
};

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

function crearResultadoCostos(){
  return {
    costoMateriales:1000,
    costoComponentes:0,
    costoCorte:0,
    costoTapacanto:0,
    costoTotal:1000,
    materiales:[{
      sku:'MAT-001', nombre:'MDF', tableros:1,
      precioUnitario:1000, importe:1000
    }],
    componentes:[],
    tapacantos:[],
    cortes:0,
    corteMl:0,
    corteMlPresentacion:0,
    precioCorte:0,
    corteImporte:0
  };
}

function crearEscenario(){
  const elementos = {
    plantillaReporte:{value:'columnas'},
    disenoTotal:{value:'pastel'},
    resumenPreciosContenido:{innerHTML:''},
    estadoPrecioCatalogo:{textContent:''},
    modoPrecioCortePorMetro:{checked:false},
    precioVentaCorte:{value:'0'},
    precioVentaCorteMetro:{value:''},
    precioCorteMetro:{value:'0'},
    incluirCostoCorteRentabilidad:{checked:true},
    incluirPrecioCorteRentabilidad:{checked:true},
    incluirCostoTapacantoRentabilidad:{checked:true},
    incluirPrecioTapacantoRentabilidad:{checked:true}
  };
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
    llamadasProfitability:0
  });
  const inicio = main.indexOf('let ultimoResultadoPreciosVisible = null;');
  const fin = main.indexOf(
    "document.getElementById('mostrarCostosProyecto').addEventListener",
    inicio
  );
  const integracion = main.slice(inicio, fin);

  vm.runInContext(
    `${leer(rutas.pricing)}\n` +
    `${leer(rutas.pricingAdapter)}\n` +
    `${leer(rutas.pricingCasoUso)}\n` +
    `${leer(rutas.profitability)}\n` +
    `${leer(rutas.profitabilityCasoUso)}\n` +
    `const calcularPrecioCatalogoReal = ProyCutProjectPricing.calcularPrecioCatalogoProyecto;\n` +
    `ProyCutProjectPricing.calcularPrecioCatalogoProyecto = function(entrada){\n` +
    `  llamadasPricing++;\n` +
    `  return calcularPrecioCatalogoReal(entrada);\n` +
    `};\n` +
    `const calcularRentabilidadReal = ProyCutProjectProfitability.calcularRentabilidadDelProyecto;\n` +
    `ProyCutProjectProfitability.calcularRentabilidadDelProyecto = function(entrada){\n` +
    `  llamadasProfitability++;\n` +
    `  return calcularRentabilidadReal(entrada);\n` +
    `};\n` +
    `${integracion}\n` +
    `globalThis.actualizarPrecios = actualizarPrecioCatalogoVisible;\n` +
    `globalThis.obtenerRentabilidad = () => ultimoResultadoRentabilidadVisible;`,
    contexto,
    {filename:'profitability-productive-integration'}
  );

  return {contexto, elementos, state};
}

probar('carga H1 antes de H2 y H2 antes de main', () => {
  const posiciones = [
    rutas.profitability,
    rutas.profitabilityCasoUso,
    'src/scripts/main.js'
  ].map(ruta => html.indexOf(`src="./${ruta}"`));
  posiciones.forEach(posicion => assert.ok(posicion >= 0));
  assert.ok(posiciones[0] < posiciones[1]);
  assert.ok(posiciones[1] < posiciones[2]);
});

probar('main usa Application y tiene un unico punto directo de invocacion', () => {
  assert.strictEqual(
    contar(main, 'ProyCutProjectProfitability.calcularRentabilidadDelProyecto('),
    1
  );
  assert.strictEqual(contar(main, 'ProyCutProfitability'), 0);
});

probar('precio completo actualiza rentabilidad productiva', () => {
  const escenario = crearEscenario();
  assert.strictEqual(escenario.contexto.actualizarPrecios(), true);
  const resultado = escenario.contexto.obtenerRentabilidad();
  assert.strictEqual(resultado.estado, 'PRECIO_COMPLETO');
  assert.strictEqual(resultado.costoTotal, 1000);
  assert.strictEqual(resultado.precioTotal, 1500);
  assert.strictEqual(resultado.utilidad, 500);
});

probar('precio parcial actualiza y conserva precioDisponible', () => {
  const escenario = crearEscenario();
  escenario.state.ultimoCosto.cortes = 1;
  escenario.elementos.precioVentaCorte.value = '';
  assert.strictEqual(escenario.contexto.actualizarPrecios(), false);
  const resultado = escenario.contexto.obtenerRentabilidad();
  assert.strictEqual(resultado.estado, 'PRECIO_PARCIAL');
  assert.strictEqual(resultado.precioDisponible, 1500);
  assert.strictEqual(resultado.utilidad, null);
  assert.strictEqual(resultado.markupPorcentaje, null);
  assert.strictEqual(resultado.margenPorcentaje, null);
});

probar('proyecto solo con material y sin corte produce rentabilidad completa', () => {
  const escenario = crearEscenario();
  escenario.elementos.precioVentaCorte.value = '';

  assert.strictEqual(escenario.contexto.actualizarPrecios(), true);
  const resultado = escenario.contexto.obtenerRentabilidad();
  assert.strictEqual(resultado.estado, 'PRECIO_COMPLETO');
  assert.strictEqual(resultado.precioTotal, 1500);
  assert.strictEqual(resultado.utilidad, 500);
});

probar('material utilizado sin precio comercial mantiene rentabilidad parcial', () => {
  const escenario = crearEscenario();
  escenario.state.materiales[0].precioVenta = null;
  escenario.elementos.precioVentaCorte.value = '';

  assert.strictEqual(escenario.contexto.actualizarPrecios(), false);
  const resultado = escenario.contexto.obtenerRentabilidad();
  assert.strictEqual(resultado.estado, 'PRECIO_PARCIAL');
  assert.strictEqual(resultado.precioDisponible, 0);
  assert.strictEqual(resultado.utilidad, null);
});

probar('Pricing sin resultado invalida la rentabilidad anterior', () => {
  const escenario = crearEscenario();
  escenario.contexto.actualizarPrecios();
  escenario.state.ultimoCosto = {costoTotal:null};
  assert.strictEqual(escenario.contexto.actualizarPrecios(), false);
  assert.strictEqual(
    escenario.contexto.obtenerRentabilidad().estado,
    'DATOS_INVALIDOS'
  );
});

probar('falta de costo vigente invalida la rentabilidad anterior', () => {
  const escenario = crearEscenario();
  escenario.contexto.actualizarPrecios();
  escenario.state.ultimoCosto = null;
  assert.strictEqual(escenario.contexto.actualizarPrecios(), false);
  assert.strictEqual(
    escenario.contexto.obtenerRentabilidad().estado,
    'DATOS_INVALIDOS'
  );
});

probar('cambio comercial recalcula Pricing y Profitability una vez', () => {
  const escenario = crearEscenario();
  escenario.contexto.actualizarPrecios();
  assert.strictEqual(escenario.contexto.llamadasPricing, 1);
  assert.strictEqual(escenario.contexto.llamadasProfitability, 1);
  escenario.state.materiales[0].precioVenta = 1800;
  escenario.contexto.actualizarPrecios();
  assert.strictEqual(escenario.contexto.llamadasPricing, 2);
  assert.strictEqual(escenario.contexto.llamadasProfitability, 2);
  assert.strictEqual(escenario.contexto.obtenerRentabilidad().precioTotal, 1800);
});

probar('rutas fallidas de recalcular invalidan Profitability', () => {
  const preparacionFallida = main.slice(
    main.indexOf('if(!preparacion.ok){'),
    main.indexOf('const parametrosCorte =', main.indexOf('if(!preparacion.ok){'))
  );
  const aplicacionCostos = main.slice(
    main.indexOf('const costosAplicados = aplicarResultadoCostos({'),
    main.indexOf('return costosAplicados;', main.indexOf('const costosAplicados = aplicarResultadoCostos({'))
  );
  assert.ok(preparacionFallida.includes('actualizarResultadoRentabilidad('));
  assert.ok(aplicacionCostos.includes('}else{\n      actualizarResultadoRentabilidad('));
  assert.ok(preparacionFallida.includes('leerPoliticaRentabilidadDesdeDOM()'));
  assert.ok(aplicacionCostos.includes('leerPoliticaRentabilidadDesdeDOM()'));
  assert.ok(!preparacionFallida.includes('state.ultimoCosto'));
});

probar('no duplica Costing ni Pricing', () => {
  assert.strictEqual(contar(main, 'const resultadoCostos = calcularCostosProyecto({'), 1);
  assert.strictEqual(
    contar(main, 'ProyCutProjectPricing.calcularPrecioCatalogoProyecto({'),
    1
  );
});

probar('main no contiene formulas economicas de Profitability', () => {
  [
    'precioTotal - costoTotal',
    'markupPorcentaje =',
    'margenPorcentaje ='
  ].forEach(fragmento => assert.ok(!main.includes(fragmento)));
});

probar('H3 no agrega UI de Ganancias ni toca exportaciones', () => {
  assert.ok(!html.includes('GANANCIAS'));
  assert.ok(!main.includes('resumenGanancias'));
  const integracion = main.slice(
    main.indexOf('let ultimoResultadoPreciosVisible = null;'),
    main.indexOf("document.getElementById('mostrarCostosProyecto').addEventListener")
  );
  ['exportarExcel', 'exportarDXFZip', 'construirLibroExcel', 'construirDXFTablero']
    .forEach(fragmento => assert.ok(!integracion.includes(fragmento)));
});
