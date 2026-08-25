const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raizProyecto = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(raizProyecto, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(raizProyecto, 'src/scripts/main.js'), 'utf8');
const styles = fs.readFileSync(path.join(raizProyecto, 'src/styles/styles.css'), 'utf8');
const rutasCadena = [
  'src/scripts/pricing/calculate-price.js',
  'src/scripts/project/pricing-application-adapter.js',
  'src/scripts/project/calculate-project-price.js'
];
const rutasProfitability = [
  'src/scripts/profitability/calculate-profitability.js',
  'src/scripts/project/calculate-project-profitability.js'
];

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

probar('carga la cadena Pricing antes de main.js y en orden', () => {
  const posiciones = rutasCadena.map(ruta => html.indexOf(`src="./${ruta}"`));
  const posicionMain = html.indexOf('src="./src/scripts/main.js"');
  posiciones.forEach(posicion => assert.ok(posicion >= 0));
  assert.ok(posiciones[0] < posiciones[1]);
  assert.ok(posiciones[1] < posiciones[2]);
  assert.ok(posiciones[2] < posicionMain);
});

probar('conserva catalogos separados y tabs con componentes visuales existentes', () => {
  assert.ok(html.includes('<th>Costo tablero</th><th>Precio venta tablero</th>'));
  assert.ok(html.includes('<th>Costo unidad</th><th>Precio venta unidad</th>'));
  assert.ok(html.includes('<th>Costo metro</th><th>Precio metro venta</th>'));
  assert.ok(html.includes('id="precioVentaCorte"'));
  assert.ok(html.includes('id="precioVentaCorteMetro"'));
  assert.ok(html.includes('class="tabs" role="tablist" aria-label="Resumen económico"'));
  assert.ok(html.includes('class="tab-btn active" id="mostrarCostosProyecto"'));
  assert.ok(html.includes('class="tab-btn" id="mostrarPreciosProyecto"'));
  assert.ok(!styles.includes('.resumen-economico-'));
  assert.ok(!styles.includes('.factura-a4'));
  assert.ok(!html.includes('facturaModal'));
  assert.ok(!html.includes('invoice-renderer.js'));
});

probar('mueve precios comerciales de corte a Servicios sin duplicarlos', () => {
  const inicioParametros = html.indexOf('id="configPanel"');
  const inicioServicios = html.indexOf('id="serviciosPanel"');
  const finServicios = html.indexOf('</div>\n</div>\n\n<div class="split">', inicioServicios);
  const parametros = html.slice(inicioParametros, inicioServicios);
  const servicios = html.slice(inicioServicios, finServicios);

  assert.ok(html.includes('id="toggleServiciosMenu"'));
  assert.ok(html.includes('id="serviciosDropdown"'));
  assert.ok(html.includes('id="toggleServicioCorte"'));
  assert.ok(html.includes('id="toggleCubrecanto"'));
  assert.ok(servicios.includes('<h2>Servicios</h2>'));
  assert.ok(servicios.includes('<div class="config-sub">Servicio de corte</div>'));
  assert.ok(!parametros.includes('id="precioCorte"'));
  assert.ok(!parametros.includes('id="precioCorteMetro"'));
  assert.ok(!parametros.includes('id="precioVentaCorte"'));
  assert.ok(!parametros.includes('id="precioVentaCorteMetro"'));
  assert.strictEqual((html.match(/id="precioCorte"/g) || []).length, 1);
  assert.strictEqual((html.match(/id="precioCorteMetro"/g) || []).length, 1);
  assert.strictEqual((html.match(/id="precioVentaCorte"/g) || []).length, 1);
  assert.strictEqual((html.match(/id="precioVentaCorteMetro"/g) || []).length, 1);
  assert.ok(servicios.includes('id="precioCorte"'));
  assert.ok(servicios.includes('id="precioCorteMetro"'));
  assert.ok(servicios.includes('id="precioVentaCorte"'));
  assert.ok(servicios.includes('id="precioVentaCorteMetro"'));
  assert.ok(main.includes("['toggleCubrecanto', 'cubrecantoPanel']"));
  assert.ok(main.includes("'tapa-precio'"));
  assert.ok(main.includes("'tapa-precio-venta'"));
  assert.ok(main.includes("document.getElementById('precioVentaCorte').addEventListener"));
  assert.ok(main.includes("document.getElementById('precioVentaCorteMetro').addEventListener"));
});

probar('catalogos muestran Accion y reutilizan Quitar sin borrar la ultima fila', () => {
  assert.strictEqual((html.match(/<th>Acción<\/th>/g) || []).length, 3);
  [
    ['materiales', 'mat-del'],
    ['tapacantos', 'tapa-del'],
    ['componentes', 'comp-del']
  ].forEach(([catalogo, clase]) => {
    assert.ok(main.includes(`botonQuitar.className = 'btn danger btn-remove ${clase}'`));
    assert.ok(main.includes(`botonQuitar.disabled = state.${catalogo}.length === 1`));
    assert.ok(main.includes(`if(state.${catalogo}.length === 1) return;`));
    assert.ok(main.includes(`state.${catalogo}.splice(e.target.dataset.i,1)`));
  });
  assert.ok(styles.includes('#tablaMateriales th:nth-child(8), #tablaMateriales td:nth-child(8){width:12%;}'));
  assert.ok(styles.includes('#tablaTapacantos th:nth-child(5), #tablaTapacantos td:nth-child(5),'));
  assert.ok(styles.includes('#tablaComponentes th:nth-child(5), #tablaComponentes td:nth-child(5){width:14%;}'));
  assert.ok(!styles.includes('.btn-remove{'));
});

probar('costos y precios usan constructores directos y el mismo renderer', () => {
  assert.ok(main.includes('function construirResumenCostos(resultadoCostos)'));
  assert.ok(main.includes('function construirResumenPrecios(resultadoCostos, resultadoPrecios)'));
  assert.ok(main.includes("renderResumenEconomico(\n      'resumenCostosContenido'"));
  assert.ok(main.includes("renderResumenEconomico(\n      'resumenPreciosContenido'"));
  assert.ok(!main.includes('crearModeloEconomicoPresentacion'));
  assert.ok(!main.includes('construirModeloFactura'));
});

probar('precio de catalogo se actualiza sin accion manual', () => {
  assert.ok(!html.includes('id="calcularPrecioCatalogoProyecto"'));
  assert.ok(!html.includes('id="calcularPrecioProyecto"'));
  assert.ok(main.includes('function actualizarPrecioCatalogoVisible()'));
  assert.ok(main.includes('ProyCutProjectPricing.calcularPrecioCatalogoProyecto'));
  assert.ok(main.includes('if(costosAplicados)'));
  assert.ok(main.includes('actualizarPrecioCatalogoVisible();'));
});

probar('COSTOS 4 x 700 y PRECIOS 4 x 1000 conservan identidad y cantidad', () => {
  const codigoCadena = rutasCadena.map(ruta => (
    fs.readFileSync(path.join(raizProyecto, ruta), 'utf8')
  )).join('\n');
  const codigoProfitability = rutasProfitability.map(ruta => (
    fs.readFileSync(path.join(raizProyecto, ruta), 'utf8')
  )).join('\n');
  const inicio = main.indexOf('let ultimoResultadoPreciosVisible = null;');
  const fin = main.indexOf(
    "document.getElementById('mostrarCostosProyecto').addEventListener",
    inicio
  );
  const codigoIntegracion = main.slice(inicio, fin);
  const elementos = {
    plantillaReporte:{value:'columnas'},
    disenoTotal:{value:'pastel'},
    resumenCostosContenido:{innerHTML:''},
    resumenPreciosContenido:{innerHTML:''},
    estadoPrecioCatalogo:{textContent:''},
    modoPrecioCortePorMetro:{checked:false},
    precioCorteMetro:{value:'20'},
    precioVentaCorte:{value:'0'},
    precioVentaCorteMetro:{value:''},
    incluirCostoCorteRentabilidad:{checked:true},
    incluirPrecioCorteRentabilidad:{checked:true},
    incluirCostoTapacantoRentabilidad:{checked:true},
    incluirPrecioTapacantoRentabilidad:{checked:true}
  };
  const resultadoCostos = {
    costoMateriales:2800,
    costoComponentes:0,
    costoCorte:40,
    costoTapacanto:0,
    costoTotal:2840,
    materiales:[{
      sku:'MAT-001',
      nombre:'Melamina 15mm',
      tableros:4,
      precioUnitario:700,
      importe:2800
    }],
    componentes:[],
    tapacantos:[],
    cortes:8,
    corteMl:0,
    corteMlPresentacion:0,
    precioCorte:5,
    corteImporte:40
  };
  const state = {
    ultimoCosto:resultadoCostos,
    materiales:[{sku:' mat-001 ', nombre:'Melamina 15mm', precio:700, precioVenta:1000}],
    componentes:[],
    tapacantos:[]
  };
  const contexto = vm.createContext({
    document:{getElementById:id => elementos[id]},
    fmt:valor => Number(valor).toFixed(2),
    fmtMoney:valor => `$${Number(valor).toLocaleString('en-US', {
      minimumFractionDigits:2,
      maximumFractionDigits:2
    })}`,
    normalizarSkuManual:valor => String(valor || '').trim().toUpperCase(),
    state
  });

  vm.runInContext(
    `${codigoCadena}\n${codigoProfitability}\n${codigoIntegracion}\n` +
      ';globalThis.mostrarCostos = mostrarResumenCostos;' +
      ';globalThis.actualizarPrecios = actualizarPrecioCatalogoVisible;',
    contexto,
    {filename:'pricing-ui-real-flow'}
  );

  contexto.mostrarCostos(resultadoCostos);
  const costos = elementos.resumenCostosContenido.innerHTML;
  assert.strictEqual(contexto.actualizarPrecios(), true);
  const precios = elementos.resumenPreciosContenido.innerHTML;

  ['Melamina 15mm', 'MAT-001', '>Cantidad<', '>4<', '>Tableros<'].forEach(valor => {
    assert.ok(costos.includes(valor));
    assert.ok(precios.includes(valor));
  });
  assert.ok(costos.includes('$700.00'));
  assert.ok(costos.includes('$2,800.00'));
  assert.ok(precios.includes('$1,000.00'));
  assert.ok(precios.includes('$4,000.00'));
  assert.ok(!precios.includes('$700.00'));
  assert.strictEqual(resultadoCostos.costoMateriales, 2800);
  assert.ok(!Object.prototype.hasOwnProperty.call(resultadoCostos, 'precioMateriales'));

  state.materiales[0].precioVenta = 1250;
  assert.strictEqual(contexto.actualizarPrecios(), true);
  assert.ok(elementos.resumenPreciosContenido.innerHTML.includes('$5,000.00'));
  assert.strictEqual(elementos.resumenCostosContenido.innerHTML, costos);

  elementos.precioVentaCorte.value = '';
  assert.strictEqual(contexto.actualizarPrecios(), false);
  assert.ok(elementos.resumenPreciosContenido.innerHTML.includes('$5,000.00'));
  assert.ok(elementos.estadoPrecioCatalogo.textContent.includes('precioVentaCorte'));
});
