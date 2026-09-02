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
const {aplicarDescuentoPrecio} = contextoModulo.ProyCutPricingPruebas;

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

function verificarRechazo(resultado, codigoEsperado){
  assert.strictEqual(resultado.ok, false);
  assert.ok(Array.isArray(resultado.errores));
  assert.ok(
    resultado.errores.some(error => error.codigo === codigoEsperado),
    `Se esperaba el error ${codigoEsperado}, se obtuvo: ${JSON.stringify(resultado.errores)}`
  );
}

probar('1. NINGUNO + precio 1000 -> final 1000', () => {
  const resultado = aplicarDescuentoPrecio(1000, {tipo:'NINGUNO', porcentaje:null});
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.descuentoAplicado, null);
  assert.strictEqual(resultado.precioFinal, 1000);
});

probar('2. PORCENTAJE 0% -> final 1000, monto 0', () => {
  const resultado = aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:0});
  assert.strictEqual(resultado.ok, true);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(resultado.descuentoAplicado)), {tipo:'PORCENTAJE', porcentaje:0, monto:0});
  assert.strictEqual(resultado.precioFinal, 1000);
});

probar('3. 10% -> final 900, monto 100', () => {
  const resultado = aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:10});
  assert.strictEqual(resultado.ok, true);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(resultado.descuentoAplicado)), {tipo:'PORCENTAJE', porcentaje:10, monto:100});
  assert.strictEqual(resultado.precioFinal, 900);
});

probar('caso del enunciado: 13000 con 10% -> monto 1300, final 11700', () => {
  const resultado = aplicarDescuentoPrecio(13000, {tipo:'PORCENTAJE', porcentaje:10});
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.descuentoAplicado.monto, 1300);
  assert.strictEqual(resultado.precioFinal, 11700);
});

probar('4. 30.5% -> precision exacta sin redondeo', () => {
  const porcentaje = 30.5;
  const precioBase = 1000;
  const resultado = aplicarDescuentoPrecio(precioBase, {tipo:'PORCENTAJE', porcentaje});
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.descuentoAplicado.monto, precioBase * porcentaje / 100);
  assert.strictEqual(resultado.precioFinal, precioBase - (precioBase * porcentaje / 100));
});

probar('5. 100% -> final 0, monto 1000', () => {
  const resultado = aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:100});
  assert.strictEqual(resultado.ok, true);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(resultado.descuentoAplicado)), {tipo:'PORCENTAJE', porcentaje:100, monto:1000});
  assert.strictEqual(resultado.precioFinal, 0);
});

probar('6. porcentaje negativo -> rechazo FUERA_DE_RANGO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:-1}),
    'DESCUENTO_PORCENTAJE_FUERA_DE_RANGO'
  );
});

probar('7. >100 -> rechazo FUERA_DE_RANGO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:100.0001}),
    'DESCUENTO_PORCENTAJE_FUERA_DE_RANGO'
  );
});

probar('8. NaN -> rechazo INVALIDO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:NaN}),
    'DESCUENTO_PORCENTAJE_INVALIDO'
  );
});

probar('9. Infinity -> rechazo INVALIDO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:Infinity}),
    'DESCUENTO_PORCENTAJE_INVALIDO'
  );
});

probar('10. -Infinity -> rechazo INVALIDO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:-Infinity}),
    'DESCUENTO_PORCENTAJE_INVALIDO'
  );
});

probar('11. string -> rechazo INVALIDO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:'10'}),
    'DESCUENTO_PORCENTAJE_INVALIDO'
  );
});

probar('11b. string vacio -> rechazo INVALIDO (Presentation debe convertir a null antes)', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:''}),
    'DESCUENTO_PORCENTAJE_INVALIDO'
  );
});

probar('12. null con PORCENTAJE -> rechazo INVALIDO (mismo criterio que porcentajeSobreCosto de GLOBAL)', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:null}),
    'DESCUENTO_PORCENTAJE_INVALIDO'
  );
});

probar('13. undefined con PORCENTAJE -> rechazo REQUERIDO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE', porcentaje:undefined}),
    'DESCUENTO_PORCENTAJE_REQUERIDO'
  );
});

probar('13b. clave porcentaje ausente con PORCENTAJE -> rechazo REQUERIDO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'PORCENTAJE'}),
    'DESCUENTO_PORCENTAJE_REQUERIDO'
  );
});

probar('14. tipo desconocido -> rechazo TIPO_DESCUENTO_INVALIDO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(1000, {tipo:'FIJO', porcentaje:null}),
    'TIPO_DESCUENTO_INVALIDO'
  );
});

probar('14b. descuento null/undefined/array -> rechazo TIPO_DESCUENTO_INVALIDO', () => {
  verificarRechazo(aplicarDescuentoPrecio(1000, null), 'TIPO_DESCUENTO_INVALIDO');
  verificarRechazo(aplicarDescuentoPrecio(1000, undefined), 'TIPO_DESCUENTO_INVALIDO');
  verificarRechazo(aplicarDescuentoPrecio(1000, []), 'TIPO_DESCUENTO_INVALIDO');
});

probar('15. precioBase 0 -> valido', () => {
  const resultado = aplicarDescuentoPrecio(0, {tipo:'PORCENTAJE', porcentaje:10});
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.descuentoAplicado.monto, 0);
  assert.strictEqual(resultado.precioFinal, 0);
});

probar('16. precioBase negativo -> rechazo PRECIO_BASE_INVALIDO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(-1, {tipo:'NINGUNO', porcentaje:null}),
    'PRECIO_BASE_INVALIDO'
  );
});

probar('17. precioBase NaN -> rechazo PRECIO_BASE_INVALIDO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(NaN, {tipo:'NINGUNO', porcentaje:null}),
    'PRECIO_BASE_INVALIDO'
  );
});

probar('18. precioBase Infinity -> rechazo PRECIO_BASE_INVALIDO', () => {
  verificarRechazo(
    aplicarDescuentoPrecio(Infinity, {tipo:'NINGUNO', porcentaje:null}),
    'PRECIO_BASE_INVALIDO'
  );
});

probar('18b. precioBase string/null/undefined -> rechazo PRECIO_BASE_INVALIDO', () => {
  verificarRechazo(aplicarDescuentoPrecio('1000', {tipo:'NINGUNO', porcentaje:null}), 'PRECIO_BASE_INVALIDO');
  verificarRechazo(aplicarDescuentoPrecio(null, {tipo:'NINGUNO', porcentaje:null}), 'PRECIO_BASE_INVALIDO');
  verificarRechazo(aplicarDescuentoPrecio(undefined, {tipo:'NINGUNO', porcentaje:null}), 'PRECIO_BASE_INVALIDO');
});

probar('19. no redondeo: precision float exacta preservada', () => {
  const precioBase = 1000;
  const porcentaje = 33.333;
  const resultado = aplicarDescuentoPrecio(precioBase, {tipo:'PORCENTAJE', porcentaje});
  assert.strictEqual(resultado.descuentoAplicado.monto, precioBase * porcentaje / 100);
  assert.strictEqual(resultado.precioFinal, precioBase - (precioBase * porcentaje / 100));
});

probar('20. no mutacion del objeto descuento', () => {
  const descuento = Object.freeze({tipo:'PORCENTAJE', porcentaje:10});
  const descuentoAntes = JSON.stringify(descuento);
  const resultado = aplicarDescuentoPrecio(1000, descuento);
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(JSON.stringify(descuento), descuentoAntes);
});

probar('20b. no mutacion tampoco en caso de error', () => {
  const descuento = Object.freeze({tipo:'PORCENTAJE', porcentaje:-1});
  const descuentoAntes = JSON.stringify(descuento);
  aplicarDescuentoPrecio(1000, descuento);
  assert.strictEqual(JSON.stringify(descuento), descuentoAntes);
});

probar('21. NINGUNO ignora porcentaje residual sin modificarlo', () => {
  const descuento = Object.freeze({tipo:'NINGUNO', porcentaje:50});
  const resultado = aplicarDescuentoPrecio(1000, descuento);
  assert.strictEqual(resultado.ok, true);
  assert.strictEqual(resultado.descuentoAplicado, null);
  assert.strictEqual(resultado.precioFinal, 1000);
  assert.strictEqual(descuento.porcentaje, 50);
});

probar('22. la formula de descuento existe una unica vez, solo en calculate-price.js', () => {
  assert.strictEqual(
    (codigoModulo.match(/precioBase \* porcentaje \/ 100/g) || []).length,
    1
  );
  const rutaMain = path.resolve(__dirname, '../../src/scripts/main.js');
  const rutaCasoUso = path.resolve(__dirname, '../../src/scripts/project/calculate-project-price.js');
  const rutaProfitability = path.resolve(__dirname, '../../src/scripts/profitability/calculate-profitability.js');
  [rutaMain, rutaCasoUso, rutaProfitability].forEach(ruta => {
    const codigo = fs.readFileSync(ruta, 'utf8');
    assert.ok(!codigo.includes('montoDescuento'));
    assert.ok(!/precioBase\s*\*\s*porcentaje/.test(codigo));
  });
  // Presentation puede leer el resultado canónico para mostrarlo, pero no calcularlo.
  const codigoMain = fs.readFileSync(rutaMain, 'utf8');
  assert.ok(codigoMain.includes('resultadoPrecios.descuentoAplicado'));
  assert.ok(codigoMain.includes('descuentoAplicado.monto'));
  assert.ok(codigoMain.includes('descuentoAplicado.porcentaje'));
  [
    /descuentoAplicado\.(?:monto|porcentaje)\s*=/,
    /descuentoAplicado\.(?:monto|porcentaje)\s*[+\-*/]/,
    /[+\-*/]\s*descuentoAplicado\.(?:monto|porcentaje)/,
    /Math\.round\s*\([^)]*descuentoAplicado/,
    /descuentoAplicado[^;\n]*\.toFixed\s*\(/,
    /porcentajeDescuento\s*(?:<=|>=|<|>)/
  ].forEach(patron => assert.ok(!patron.test(codigoMain)));

  // Application solo transporta la política de entrada.
  assert.ok(!fs.readFileSync(rutaCasoUso, 'utf8').includes('descuentoAplicado'));
  // Profitability (P4B) SI necesita detectar la forma de descuentoAplicado para decidir
  // precioConsiderado, pero nunca debe leer su monto ni su porcentaje (no calcula descuento).
  const codigoProfitability = fs.readFileSync(rutaProfitability, 'utf8');
  assert.ok(!/descuentoAplicado\.monto/.test(codigoProfitability));
  assert.ok(!/descuentoAplicado\.porcentaje/.test(codigoProfitability));
});

probar('funcion exportada para uso directo en tests', () => {
  assert.strictEqual(typeof aplicarDescuentoPrecio, 'function');
});
