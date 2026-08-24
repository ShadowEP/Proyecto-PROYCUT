const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const archivo = 'src/scripts/fabrication/manufacturing-metrics.js';
const codigo = fs.readFileSync(path.join(raiz, archivo), 'utf8');
const contexto = vm.createContext({window:{}});
vm.runInContext(codigo, contexto, {filename:archivo});

const {
  crearManufacturingMetrics
} = contexto.window.ProyCutManufacturingMetrics;

function plano(valor){
  return JSON.parse(JSON.stringify(valor));
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

probar('registra una decision manufacturing', () => {
  const metrics = crearManufacturingMetrics();
  metrics.registrarDecision({modo:'manufacturing', motivos:['compatible']});
  assert.deepStrictEqual(plano(metrics.obtenerSnapshot()), {
    decisionesManufacturing:1,
    decisionesLegacy:0,
    motivosFallback:{}
  });
});

probar('registra un fallback legacy', () => {
  const metrics = crearManufacturingMetrics();
  metrics.registrarDecision({modo:'legacy', motivos:['proyecto libre']});
  assert.strictEqual(metrics.obtenerSnapshot().decisionesLegacy, 1);
});

probar('acumula varios motivos de fallback', () => {
  const metrics = crearManufacturingMetrics();
  metrics.registrarDecision({
    modo:'legacy',
    motivos:['equivalencia incompatible', 'errores ManufacturingInput']
  });
  metrics.registrarDecision({
    modo:'legacy',
    motivos:['equivalencia incompatible']
  });
  assert.deepStrictEqual(plano(metrics.obtenerSnapshot().motivosFallback), {
    'equivalencia incompatible':2,
    'errores ManufacturingInput':1
  });
});

probar('no modifica el reporte original', () => {
  const metrics = crearManufacturingMetrics();
  const reporte = {
    modo:'legacy',
    motivos:['datos incompletos']
  };
  const antes = JSON.stringify(reporte);
  metrics.registrarDecision(reporte);
  assert.strictEqual(JSON.stringify(reporte), antes);
});

probar('no contiene dependencias de decision ni ejecucion productiva', () => {
  [
    'buildManufacturingPipeline',
    'optimizarProyectoPreparado',
    'calcularCostosProyecto',
    'puedeUsarManufacturingInput'
  ].forEach(identificador => assert.ok(!codigo.includes(identificador)));
  assert.ok(!codigo.includes('document.'));
  assert.ok(!codigo.includes('localStorage'));
});

probar('main registra el reporte existente y conserva un unico gate', () => {
  const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');
  const inicio = main.indexOf('const puedeUsarManufacturingInput =');
  const fin = main.indexOf('const costosAplicados = aplicarResultadoCostos({', inicio);
  const integracion = main.slice(inicio, fin);
  assert.ok(integracion.includes(
    'libre === false &&\n' +
    '      manufacturingPipeline.equivalenceReport.compatible === true &&\n' +
    '      manufacturingPipeline.optimizerInput.errores.length === 0;'
  ));
  assert.strictEqual(
    (main.match(/const puedeUsarManufacturingInput =/g) || []).length,
    1
  );
  assert.ok(integracion.indexOf('crearManufacturingDecisionReport({') <
    integracion.indexOf('ultimoManufacturingMetrics.registrarDecision('));
  assert.ok(integracion.includes(
    'ultimoManufacturingMetrics.registrarDecision(ultimoReporteDecisionManufacturing);'
  ));
  assert.ok(integracion.includes(
    "console.info('Manufacturing metrics', ultimoManufacturingMetrics.obtenerSnapshot());"
  ));
});

probar('carga metrics antes de main sin otros cambios de UI', () => {
  const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
  const posicionMetrics = html.indexOf('fabrication/manufacturing-metrics.js');
  const posicionMain = html.indexOf('src/scripts/main.js');
  assert.ok(posicionMetrics >= 0);
  assert.ok(posicionMetrics < posicionMain);
});
