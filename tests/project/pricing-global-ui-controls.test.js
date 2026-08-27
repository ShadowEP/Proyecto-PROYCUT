const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');

function leer(ruta){
  return fs.readFileSync(path.join(raiz, ruta), 'utf8');
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

function crearCampoNumerico(valor, disabled){
  return {
    value:valor,
    disabled:Boolean(disabled),
    listeners:{},
    addEventListener(tipo, listener){
      this.listeners[tipo] = listener;
    }
  };
}

function crearResultadoCostos(costoTotal){
  return {
    costoMateriales:costoTotal,
    costoComponentes:0,
    costoCorte:0,
    costoTapacanto:0,
    costoTotal,
    materiales:[{
      sku:'MAT-001', nombre:'MDF', tableros:1,
      precioUnitario:costoTotal, importe:costoTotal
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

function crearEscenario(opciones = {}){
  const elementos = {
    plantillaReporte:{value:'columnas'},
    disenoTotal:{value:'pastel'},
    resumenPreciosContenido:{innerHTML:''},
    estadoPrecioCatalogo:{textContent:''},
    modoPrecioCortePorMetro:{checked:false},
    precioVentaCorte:{value:'0'},
    precioVentaCorteMetro:{value:''},
    precioCorteMetro:{value:'0'},
    usarUtilidadGlobalProyecto:crearControl(false),
    porcentajeUtilidadGlobalProyecto:crearCampoNumerico(
      opciones.porcentaje === undefined ? '30' : opciones.porcentaje,
      true
    ),
    avisoRentabilidadPrecioGlobal:{hidden:true},
    toggleServiciosRentabilidad:crearControl(true),
    incluirCostoCorteRentabilidad:crearControl(true),
    incluirPrecioCorteRentabilidad:crearControl(true),
    incluirCostoTapacantoRentabilidad:crearControl(true),
    incluirPrecioTapacantoRentabilidad:crearControl(true)
  };
  const state = {
    ultimoCosto:crearResultadoCostos(opciones.costoTotal === undefined ? 1000 : opciones.costoTotal),
    materiales:[{sku:'MAT-001', nombre:'MDF', precioVenta:1500}],
    componentes:[],
    tapacantos:[]
  };
  const contexto = vm.createContext({
    document:{getElementById:id => elementos[id]},
    fmt:valor => (typeof valor === 'number' ? valor.toFixed(2) : String(valor)),
    fmtMoney:valor => `$${Number(valor).toFixed(2)}`,
    normalizarSkuManual:valor => String(valor || '').trim().toUpperCase(),
    state,
    llamadasPricing:0,
    llamadasProfitability:0
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
    `const calcularPrecioDelProyectoReal = ProyCutProjectPricing.calcularPrecioDelProyecto;\n` +
    `ProyCutProjectPricing.calcularPrecioDelProyecto = function(entrada){\n` +
    `  llamadasPricing++;\n` +
    `  return calcularPrecioDelProyectoReal(entrada);\n` +
    `};\n` +
    `const calcularRentabilidadReal = ProyCutProjectProfitability.calcularRentabilidadDelProyecto;\n` +
    `ProyCutProjectProfitability.calcularRentabilidadDelProyecto = function(entrada){\n` +
    `  llamadasProfitability++;\n` +
    `  return calcularRentabilidadReal(entrada);\n` +
    `};\n` +
    `${integracion}\n` +
    `${listeners}\n` +
    `globalThis.actualizarPrecios = actualizarPrecioCatalogoVisible;\n` +
    `globalThis.leerPoliticaPrecios = leerPoliticaPreciosDesdeDOM;\n` +
    `globalThis.obtenerPrecios = () => ultimoResultadoPreciosVisible;\n` +
    `globalThis.obtenerRentabilidad = () => ultimoResultadoRentabilidadVisible;`,
    contexto,
    {filename:'pricing-global-ui-controls'}
  );

  if(opciones.usarGlobal){
    elementos.usarUtilidadGlobalProyecto.checked = true;
    elementos.usarUtilidadGlobalProyecto.listeners.change();
  }

  return {contexto, elementos, state};
}

// ---------- Seccion 15: controles de precio global ----------

probar('1. Global OFF inicialmente', () => {
  const inicio = html.indexOf('id="usarUtilidadGlobalProyecto"');
  const etiqueta = html.slice(inicio, inicio + 120);
  assert.ok(!/checked/.test(etiqueta));
});

probar('2. Input global disabled cuando OFF (estado inicial en HTML)', () => {
  const inicio = html.indexOf('id="porcentajeUtilidadGlobalProyecto"');
  const etiqueta = html.slice(inicio, inicio + 120);
  assert.ok(/disabled/.test(etiqueta));
});

probar('controles ubicados en PRECIOS, no en Preferencias/Servicios/Politica/Ganancias', () => {
  const inicioPrecios = html.indexOf('id="preciosProyectoPanel"');
  const panel = html.slice(inicioPrecios, html.indexOf('</div>\n      </div>', inicioPrecios));
  assert.ok(panel.includes('id="usarUtilidadGlobalProyecto"'));
  assert.ok(panel.includes('id="porcentajeUtilidadGlobalProyecto"'));
  const inicioConfig = html.indexOf('id="configPanel"');
  const finConfig = html.indexOf('id="guardarConfigBtn"', inicioConfig);
  const config = html.slice(inicioConfig, finConfig);
  assert.ok(!config.includes('id="usarUtilidadGlobalProyecto"'));
  const inicioServicios = html.indexOf('id="serviciosPanel"');
  const finServicios = html.indexOf('</div>\n</div>\n\n<div class="split">', inicioServicios);
  const servicios = html.slice(inicioServicios, finServicios);
  assert.ok(!servicios.includes('id="usarUtilidadGlobalProyecto"'));
});

probar('3. Global ON habilita input', () => {
  const escenario = crearEscenario();
  escenario.elementos.usarUtilidadGlobalProyecto.checked = true;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.elementos.porcentajeUtilidadGlobalProyecto.disabled, false);
});

probar('4. OFF conserva valor del porcentaje y 5. ON nuevamente recupera ese valor', () => {
  const escenario = crearEscenario();
  escenario.elementos.porcentajeUtilidadGlobalProyecto.value = '42.5';
  escenario.elementos.usarUtilidadGlobalProyecto.checked = true;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.elementos.porcentajeUtilidadGlobalProyecto.value, '42.5');
  escenario.elementos.usarUtilidadGlobalProyecto.checked = false;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.elementos.porcentajeUtilidadGlobalProyecto.value, '42.5');
  assert.strictEqual(escenario.elementos.porcentajeUtilidadGlobalProyecto.disabled, true);
  escenario.elementos.usarUtilidadGlobalProyecto.checked = true;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.elementos.porcentajeUtilidadGlobalProyecto.value, '42.5');
});

probar('6. 0% valido', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'0', costoTotal:1000});
  assert.strictEqual(escenario.contexto.actualizarPrecios(), true);
  assert.strictEqual(escenario.contexto.obtenerPrecios().precioFinal, 1000);
});

probar('7. Decimal valido', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'12.5', costoTotal:1000});
  assert.strictEqual(escenario.contexto.actualizarPrecios(), true);
  assert.strictEqual(escenario.contexto.obtenerPrecios().precioFinal, 1125);
});

probar('8. Vacio produce null hacia Application', () => {
  const escenario = crearEscenario({usarGlobal:false, porcentaje:''});
  assert.strictEqual(escenario.contexto.leerPoliticaPrecios().porcentajeSobreCosto, null);
  const escenarioGlobal = crearEscenario({usarGlobal:true, porcentaje:''});
  assert.strictEqual(escenarioGlobal.contexto.leerPoliticaPrecios().porcentajeSobreCosto, null);
});

probar('9. No usa Number(vacio)', () => {
  const inicio = main.indexOf('function leerPoliticaPreciosDesdeDOM(){');
  const fin = main.indexOf('\n  }', inicio) + 4;
  const cuerpo = main.slice(inicio, fin);
  assert.ok(!cuerpo.includes("Number('')"));
  assert.ok(cuerpo.includes("=== '' ? null : Number("));
});

probar('10. OFF construye modo INDIVIDUAL', () => {
  const escenario = crearEscenario({usarGlobal:false, porcentaje:'30'});
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(escenario.contexto.leerPoliticaPrecios())),
    {modo:'INDIVIDUAL', porcentajeSobreCosto:30}
  );
});

probar('11. ON construye modo GLOBAL_SOBRE_COSTO', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'30'});
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(escenario.contexto.leerPoliticaPrecios())),
    {modo:'GLOBAL_SOBRE_COSTO', porcentajeSobreCosto:30}
  );
});

probar('12. Cambiar modo llama Pricing + Profitability', () => {
  const escenario = crearEscenario({usarGlobal:false, porcentaje:'30', costoTotal:1000});
  escenario.contexto.actualizarPrecios();
  const pricingAntes = escenario.contexto.llamadasPricing;
  const profitabilityAntes = escenario.contexto.llamadasProfitability;
  escenario.elementos.usarUtilidadGlobalProyecto.checked = true;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.contexto.llamadasPricing, pricingAntes + 1);
  assert.strictEqual(escenario.contexto.llamadasProfitability, profitabilityAntes + 1);
});

probar('13-15. No llama Costing, Optimizer ni Manufacturing', () => {
  const inicioCheckbox = main.indexOf("document.getElementById('usarUtilidadGlobalProyecto').addEventListener");
  const finCheckbox = main.indexOf('});', inicioCheckbox) + 3;
  const inicioInput = main.indexOf("document.getElementById('porcentajeUtilidadGlobalProyecto').addEventListener", finCheckbox);
  const finInput = main.indexOf(';', inicioInput) + 1;
  const bloque = main.slice(inicioCheckbox, finInput);
  [
    'calcularCostosProyecto',
    'optimizarProyectoPreparado',
    'buildManufacturingPipeline',
    'ejecutarManufacturingExecution',
    'recalcular(',
    'recalcularDebounced'
  ].forEach(fragmento => assert.ok(!bloque.includes(fragmento)));
  assert.ok(bloque.includes('actualizarPrecioCatalogoVisible'));
});

probar('16. Cambiar porcentaje global llama Pricing + Profitability', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'30', costoTotal:1000});
  escenario.contexto.actualizarPrecios();
  const pricingAntes = escenario.contexto.llamadasPricing;
  const profitabilityAntes = escenario.contexto.llamadasProfitability;
  escenario.elementos.porcentajeUtilidadGlobalProyecto.value = '40';
  escenario.elementos.porcentajeUtilidadGlobalProyecto.listeners.input();
  assert.strictEqual(escenario.contexto.llamadasPricing, pricingAntes + 1);
  assert.strictEqual(escenario.contexto.llamadasProfitability, profitabilityAntes + 1);
  assert.strictEqual(escenario.contexto.obtenerPrecios().precioFinal, 1400);
});

probar('17. No altera inputs de precios individuales', () => {
  const escenario = crearEscenario({usarGlobal:false, porcentaje:'30', costoTotal:1000});
  escenario.contexto.actualizarPrecios();
  escenario.elementos.usarUtilidadGlobalProyecto.checked = true;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.state.materiales[0].precioVenta, 1500);
});

probar('18. GLOBAL no requiere precios individuales', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'30', costoTotal:1000});
  escenario.state.materiales[0].precioVenta = null;
  assert.strictEqual(escenario.contexto.actualizarPrecios(), true);
  assert.strictEqual(escenario.contexto.obtenerPrecios().precioFinal, 1300);
});

probar('19. Volver a INDIVIDUAL recupera flujo historico', () => {
  const escenario = crearEscenario({usarGlobal:false, porcentaje:'30', costoTotal:1000});
  assert.strictEqual(escenario.contexto.actualizarPrecios(), true);
  const precioIndividualOriginal = escenario.contexto.obtenerPrecios().precioTotal;
  assert.strictEqual(precioIndividualOriginal, 1500);

  escenario.elementos.usarUtilidadGlobalProyecto.checked = true;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.contexto.obtenerPrecios().precioFinal, 1300);

  escenario.elementos.usarUtilidadGlobalProyecto.checked = false;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.contexto.obtenerPrecios().precioTotal, 1500);
  assert.strictEqual(escenario.state.materiales[0].precioVenta, 1500);
});

probar('20. Error global no hace fallback a INDIVIDUAL', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'', costoTotal:1000});
  assert.strictEqual(escenario.contexto.actualizarPrecios(), false);
  assert.strictEqual(escenario.contexto.obtenerPrecios(), null);
  assert.ok(escenario.elementos.estadoPrecioCatalogo.textContent.length > 0);
});

probar('21. Error global no reutiliza precio anterior como valido', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'30', costoTotal:1000});
  assert.strictEqual(escenario.contexto.actualizarPrecios(), true);
  assert.strictEqual(escenario.contexto.obtenerPrecios().precioFinal, 1300);

  escenario.elementos.porcentajeUtilidadGlobalProyecto.value = '-5';
  assert.strictEqual(escenario.contexto.actualizarPrecios(), false);
  assert.strictEqual(escenario.contexto.obtenerPrecios(), null);
  assert.strictEqual(escenario.elementos.resumenPreciosContenido.innerHTML.includes('1,300'), false);
});

probar('22. UI global no muestra desglose comercial ficticio', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'30', costoTotal:1000});
  escenario.contexto.actualizarPrecios();
  const contenido = escenario.elementos.resumenPreciosContenido.innerHTML;
  ['Materiales', 'Componentes', 'Corte', 'Tapacantos'].forEach(categoria => {
    assert.ok(!contenido.includes('>' + categoria + '<'));
  });
  assert.ok(contenido.includes('Utilidad global sobre costo'));
  assert.ok(contenido.includes('Costo base'));
  assert.ok(contenido.includes('Precio de venta'));
});

probar('23. Precio final global se muestra correctamente', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'30', costoTotal:1000});
  escenario.contexto.actualizarPrecios();
  const contenido = escenario.elementos.resumenPreciosContenido.innerHTML;
  assert.ok(contenido.includes('$1300.00'));
});

// ---------- Seccion 16: interaccion P2 + P3C ----------

probar('16.1 GLOBAL OFF: cuatro controles P2 normales (no disabled)', () => {
  const escenario = crearEscenario({usarGlobal:false});
  assert.strictEqual(escenario.elementos.incluirCostoCorteRentabilidad.disabled, undefined);
  assert.strictEqual(escenario.elementos.incluirPrecioCorteRentabilidad.disabled, undefined);
  assert.strictEqual(escenario.elementos.incluirCostoTapacantoRentabilidad.disabled, undefined);
  assert.strictEqual(escenario.elementos.incluirPrecioTapacantoRentabilidad.disabled, undefined);
});

probar('16.2-16.5 GLOBAL ON deshabilita solo los flags de precio, no los de costo', () => {
  const escenario = crearEscenario({usarGlobal:false});
  escenario.elementos.usarUtilidadGlobalProyecto.checked = true;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.elementos.incluirPrecioCorteRentabilidad.disabled, true);
  assert.strictEqual(escenario.elementos.incluirPrecioTapacantoRentabilidad.disabled, true);
  assert.ok(!escenario.elementos.incluirCostoCorteRentabilidad.disabled);
  assert.ok(!escenario.elementos.incluirCostoTapacantoRentabilidad.disabled);
  assert.strictEqual(escenario.elementos.avisoRentabilidadPrecioGlobal.hidden, false);
});

probar('16.6 Deshabilitar controles de precio NO cambia checked', () => {
  const escenario = crearEscenario({usarGlobal:false});
  escenario.elementos.incluirPrecioCorteRentabilidad.checked = false;
  escenario.elementos.usarUtilidadGlobalProyecto.checked = true;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.elementos.incluirPrecioCorteRentabilidad.checked, false);
  assert.strictEqual(escenario.elementos.incluirPrecioTapacantoRentabilidad.checked, true);
});

probar('16.7 Volver a INDIVIDUAL: controles de precio vuelven a habilitarse', () => {
  const escenario = crearEscenario({usarGlobal:true});
  escenario.elementos.usarUtilidadGlobalProyecto.checked = false;
  escenario.elementos.usarUtilidadGlobalProyecto.listeners.change();
  assert.strictEqual(escenario.elementos.incluirPrecioCorteRentabilidad.disabled, false);
  assert.strictEqual(escenario.elementos.incluirPrecioTapacantoRentabilidad.disabled, false);
  assert.strictEqual(escenario.elementos.avisoRentabilidadPrecioGlobal.hidden, true);
});

probar('16.8 Master P2 sigue sincronizando checked con GLOBAL activo', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'30', costoTotal:1000});
  escenario.contexto.actualizarPrecios();
  const master = escenario.elementos.toggleServiciosRentabilidad;
  master.checked = false;
  master.listeners.change();
  [
    'incluirCostoCorteRentabilidad',
    'incluirPrecioCorteRentabilidad',
    'incluirCostoTapacantoRentabilidad',
    'incluirPrecioTapacantoRentabilidad'
  ].forEach(id => assert.strictEqual(escenario.elementos[id].checked, false));
  // Los dos controles de precio permanecen disabled por no aplicabilidad, sin importar su checked.
  assert.strictEqual(escenario.elementos.incluirPrecioCorteRentabilidad.disabled, true);
  assert.strictEqual(escenario.elementos.incluirPrecioTapacantoRentabilidad.disabled, true);
});

probar('16.9 Master P2 NO modifica politicaPrecios', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'30', costoTotal:1000});
  escenario.contexto.actualizarPrecios();
  const politicaAntes = JSON.stringify(escenario.contexto.leerPoliticaPrecios());
  escenario.elementos.toggleServiciosRentabilidad.checked = false;
  escenario.elementos.toggleServiciosRentabilidad.listeners.change();
  assert.strictEqual(JSON.stringify(escenario.contexto.leerPoliticaPrecios()), politicaAntes);
});

probar('16.10 Master P2 NO cambia precioFinal global', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'30', costoTotal:1000});
  escenario.contexto.actualizarPrecios();
  const precioAntes = escenario.contexto.obtenerPrecios().precioFinal;
  const pricingAntes = escenario.contexto.llamadasPricing;
  escenario.elementos.toggleServiciosRentabilidad.checked = false;
  escenario.elementos.toggleServiciosRentabilidad.listeners.change();
  assert.strictEqual(escenario.contexto.obtenerPrecios().precioFinal, precioAntes);
  assert.strictEqual(escenario.contexto.llamadasPricing, pricingAntes);
});

// ---------- Seccion 17: caso obligatorio de integracion economica ----------

probar('caso obligatorio: costoTotal 10000, GLOBAL 30% => precioFinal 13000 y rentabilidad correcta', () => {
  const escenario = crearEscenario({usarGlobal:true, porcentaje:'30', costoTotal:10000});
  assert.strictEqual(escenario.contexto.actualizarPrecios(), true);
  const precios = escenario.contexto.obtenerPrecios();
  assert.strictEqual(precios.precioFinal, 13000);

  const rentabilidad = escenario.contexto.obtenerRentabilidad();
  assert.strictEqual(rentabilidad.estado, 'PRECIO_COMPLETO');
  assert.strictEqual(rentabilidad.costoTotal, 10000);
  assert.strictEqual(rentabilidad.precioTotal, 13000);
  assert.strictEqual(rentabilidad.utilidad, 3000);
  assert.strictEqual(rentabilidad.markupPorcentaje, 30);
  assert.strictEqual(rentabilidad.margenPorcentaje, (3000 / 13000) * 100);
});
