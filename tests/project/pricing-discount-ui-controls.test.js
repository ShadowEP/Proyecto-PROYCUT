const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

function crearControl(checked){
  return {
    checked,
    disabled:false,
    listeners:{},
    addEventListener(tipo, listener){
      this.listeners[tipo] = listener;
    }
  };
}

function crearCampo(value, disabled){
  return {
    value,
    disabled,
    listeners:{},
    addEventListener(tipo, listener){
      this.listeners[tipo] = listener;
    }
  };
}

function crearEscenario(){
  const elementos = {
    usarUtilidadGlobalProyecto:crearControl(false),
    porcentajeUtilidadGlobalProyecto:crearCampo('30', true),
    aplicarDescuentoProyecto:crearControl(false),
    porcentajeDescuentoProyecto:crearCampo('10', true),
    incluirCostoCorteRentabilidad:crearControl(true),
    incluirPrecioCorteRentabilidad:crearControl(true),
    incluirCostoTapacantoRentabilidad:crearControl(true),
    incluirPrecioTapacantoRentabilidad:crearControl(true),
    avisoRentabilidadPrecioGlobal:{hidden:true}
  };
  const inicioFunciones = main.indexOf('function leerPoliticaPreciosDesdeDOM(){');
  const finFunciones = main.indexOf('function actualizarResultadoRentabilidad(', inicioFunciones);
  const inicioListeners = main.indexOf(
    "document.getElementById('usarUtilidadGlobalProyecto').addEventListener"
  );
  const finListeners = main.indexOf(
    "document.getElementById('nivelOptimizacionNormal').addEventListener",
    inicioListeners
  );
  const contexto = vm.createContext({
    document:{getElementById:id => elementos[id]},
    actualizacionesPrecio:0,
    actualizarPrecioCatalogoVisible(){
      contexto.actualizacionesPrecio++;
    }
  });
  vm.runInContext(
    main.slice(inicioFunciones, finFunciones) + '\n' +
    main.slice(inicioListeners, finListeners) + '\n' +
    'globalThis.leerPolitica = leerPoliticaPreciosDesdeDOM;\n' +
    'globalThis.actualizarDisponibilidad = actualizarDisponibilidadPreciosProyecto;',
    contexto,
    {filename:'pricing-discount-ui-controls'}
  );
  return {elementos, contexto};
}

probar('controles de descuento existen dentro de PRECIOS', () => {
  const inicio = html.indexOf('id="preciosProyectoPanel"');
  const fin = html.indexOf('</div>\n      </div>', inicio);
  const panel = html.slice(inicio, fin);
  assert.strictEqual((html.match(/id="aplicarDescuentoProyecto"/g) || []).length, 1);
  assert.strictEqual((html.match(/id="porcentajeDescuentoProyecto"/g) || []).length, 1);
  assert.ok(panel.includes('id="aplicarDescuentoProyecto"'));
  assert.ok(panel.includes('id="porcentajeDescuentoProyecto"'));
});

probar('checkbox inicia OFF e input inicia disabled con valor sugerido', () => {
  const checkbox = html.match(/<input[^>]+id="aplicarDescuentoProyecto"[^>]*>/)[0];
  const input = html.match(/<input[^>]+id="porcentajeDescuentoProyecto"[^>]*>/)[0];
  assert.ok(!checkbox.includes('checked'));
  assert.ok(input.includes('disabled'));
  assert.ok(input.includes('value="10"'));
});

probar('ON habilita, OFF deshabilita y conserva value', () => {
  const {elementos} = crearEscenario();
  elementos.porcentajeDescuentoProyecto.value = '12.5';
  elementos.aplicarDescuentoProyecto.checked = true;
  elementos.aplicarDescuentoProyecto.listeners.change();
  assert.strictEqual(elementos.porcentajeDescuentoProyecto.disabled, false);
  assert.strictEqual(elementos.porcentajeDescuentoProyecto.value, '12.5');
  elementos.aplicarDescuentoProyecto.checked = false;
  elementos.aplicarDescuentoProyecto.listeners.change();
  assert.strictEqual(elementos.porcentajeDescuentoProyecto.disabled, true);
  assert.strictEqual(elementos.porcentajeDescuentoProyecto.value, '12.5');
});

probar('OFF produce NINGUNO con porcentaje null', () => {
  const {contexto} = crearEscenario();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(contexto.leerPolitica().descuento)), {
    tipo:'NINGUNO',
    porcentaje:null
  });
});

probar('ON vacio produce PORCENTAJE con null sin convertirlo en cero', () => {
  const {elementos, contexto} = crearEscenario();
  elementos.aplicarDescuentoProyecto.checked = true;
  elementos.porcentajeDescuentoProyecto.value = '';
  assert.deepStrictEqual(JSON.parse(JSON.stringify(contexto.leerPolitica().descuento)), {
    tipo:'PORCENTAJE',
    porcentaje:null
  });
});

probar('ON conserva cero y decimal como number', () => {
  const {elementos, contexto} = crearEscenario();
  elementos.aplicarDescuentoProyecto.checked = true;
  elementos.porcentajeDescuentoProyecto.value = '0';
  assert.strictEqual(contexto.leerPolitica().descuento.porcentaje, 0);
  elementos.porcentajeDescuentoProyecto.value = '12.5';
  assert.strictEqual(contexto.leerPolitica().descuento.porcentaje, 12.5);
});

probar('reactividad ejecuta solo Pricing visible una vez por cambio', () => {
  const {elementos, contexto} = crearEscenario();
  elementos.aplicarDescuentoProyecto.checked = true;
  elementos.aplicarDescuentoProyecto.listeners.change();
  assert.strictEqual(contexto.actualizacionesPrecio, 1);
  elementos.porcentajeDescuentoProyecto.listeners.input();
  assert.strictEqual(contexto.actualizacionesPrecio, 2);
});

probar('INDIVIDUAL sin descuento habilita flags de precio', () => {
  const {elementos, contexto} = crearEscenario();
  contexto.actualizarDisponibilidad();
  assert.strictEqual(elementos.incluirPrecioCorteRentabilidad.disabled, false);
  assert.strictEqual(elementos.incluirPrecioTapacantoRentabilidad.disabled, false);
});

probar('descuento o GLOBAL deshabilitan solo flags de precio y conservan checked', () => {
  const {elementos, contexto} = crearEscenario();
  elementos.incluirPrecioCorteRentabilidad.checked = false;
  elementos.aplicarDescuentoProyecto.checked = true;
  contexto.actualizarDisponibilidad();
  assert.strictEqual(elementos.incluirPrecioCorteRentabilidad.disabled, true);
  assert.strictEqual(elementos.incluirPrecioTapacantoRentabilidad.disabled, true);
  assert.strictEqual(elementos.incluirPrecioCorteRentabilidad.checked, false);
  assert.strictEqual(elementos.incluirCostoCorteRentabilidad.disabled, false);
  assert.strictEqual(elementos.incluirCostoTapacantoRentabilidad.disabled, false);
  elementos.aplicarDescuentoProyecto.checked = false;
  elementos.usarUtilidadGlobalProyecto.checked = true;
  contexto.actualizarDisponibilidad();
  assert.strictEqual(elementos.incluirPrecioCorteRentabilidad.disabled, true);
  elementos.aplicarDescuentoProyecto.checked = true;
  contexto.actualizarDisponibilidad();
  assert.strictEqual(elementos.incluirPrecioTapacantoRentabilidad.disabled, true);
});

probar('volver a INDIVIDUAL y NINGUNO rehabilita flags y conserva checked', () => {
  const {elementos, contexto} = crearEscenario();
  elementos.incluirPrecioCorteRentabilidad.checked = false;
  elementos.usarUtilidadGlobalProyecto.checked = true;
  elementos.aplicarDescuentoProyecto.checked = true;
  contexto.actualizarDisponibilidad();
  elementos.usarUtilidadGlobalProyecto.checked = false;
  elementos.aplicarDescuentoProyecto.checked = false;
  contexto.actualizarDisponibilidad();
  assert.strictEqual(elementos.incluirPrecioCorteRentabilidad.disabled, false);
  assert.strictEqual(elementos.incluirPrecioTapacantoRentabilidad.disabled, false);
  assert.strictEqual(elementos.incluirPrecioCorteRentabilidad.checked, false);
});

probar('Presentation no contiene formula economica ni redondeo de descuento', () => {
  const inicio = main.indexOf('function leerPoliticaPreciosDesdeDOM(){');
  const fin = main.indexOf('function actualizarResultadoRentabilidad(', inicio);
  const bloque = main.slice(inicio, fin);
  ['precioBase *', '/ 100', 'Math.round', 'toFixed'].forEach(fragmento => {
    assert.ok(!bloque.includes(fragmento));
  });
  assert.ok(bloque.includes("valorDescuento === '' ? null : Number(valorDescuento)"));
});

probar('listeners de descuento no llaman Costing Optimizer Manufacturing ni exportaciones', () => {
  const inicio = main.indexOf(
    "document.getElementById('aplicarDescuentoProyecto').addEventListener"
  );
  const fin = main.indexOf(
    "document.getElementById('nivelOptimizacionNormal').addEventListener",
    inicio
  );
  const bloque = main.slice(inicio, fin);
  [
    'calcularCostosProyecto',
    'optimizarProyectoPreparado',
    'buildManufacturingPipeline',
    'exportarExcel',
    'exportarDXFZip',
    'dibujarBoard',
    'recalcular('
  ].forEach(fragmento => assert.ok(!bloque.includes(fragmento)));
});
