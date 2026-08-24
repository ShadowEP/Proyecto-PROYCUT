const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '../..');
const archivosFabricacion = [
  'src/scripts/fabrication/manufacturing-part.js',
  'src/scripts/fabrication/manufacturing-board.js',
  'src/scripts/fabrication/manufacturing-operation.js',
  'src/scripts/fabrication/subassembly.js',
  'src/scripts/fabrication/build-manufacturing-model.js'
];
const contexto = vm.createContext({window:{}});
archivosFabricacion.forEach(archivo => {
  vm.runInContext(
    fs.readFileSync(path.join(raiz, archivo), 'utf8'),
    contexto,
    {filename:archivo}
  );
});

function plano(valor){
  return JSON.parse(JSON.stringify(valor));
}

function probar(nombre, prueba){
  prueba();
  console.log(`PASS ${nombre}`);
}

const filas = [{
  id:'1',
  cantTexto:'2',
  largoTexto:'700',
  anchoTexto:'400',
  girarModo:'auto',
  material:'Melamina 15mm',
  tapaTipo:'PVC blanco',
  l1:true,
  l2:false,
  a1:true,
  a2:false,
  labelTexto:'Puerta'
}];
const materiales = [{
  sku:'T-000001',
  nombre:'Melamina 15mm',
  largo:2440,
  ancho:1220,
  espesor:15,
  precio:750,
  precioVenta:1200
}];
const tapacantos = [{sku:'E-000001', nombre:'PVC blanco', precio:10, precioVenta:20}];

probar('PiezaFabricacion conserva cantidad como especificacion sin expandir', () => {
  const modelo = contexto.window.ProyCutManufacturingModel.buildManufacturingModel({
    filasPiezas:filas,
    materiales,
    tapacantos
  });
  assert.strictEqual(modelo.piezasFabricacion.length, 1);
  assert.deepStrictEqual(plano(modelo.piezasFabricacion[0]), {
    id:'1',
    nombre:'Puerta',
    cantidad:2,
    largo:700,
    ancho:400,
    espesor:15,
    materialSKU:'T-000001',
    modoRotacion:'auto',
    sentidoVeta:null,
    ladosTapacanto:{
      tipo:{sku:'E-000001', nombre:'PVC blanco'},
      l1:{sku:'E-000001', nombre:'PVC blanco'},
      l2:null,
      a1:{sku:'E-000001', nombre:'PVC blanco'},
      a2:null
    },
    operaciones:[],
    origen:{tipo:'PROYECTO_ACTUAL', referenciaId:'1'}
  });
  assert.strictEqual(modelo.subensambles.length, 0);
});

probar('TableroFabricacion mapea costo y precio sin kerf ni desperdicio', () => {
  const modelo = contexto.window.ProyCutManufacturingModel.buildManufacturingModel({
    filasPiezas:filas,
    materiales,
    tapacantos
  });
  assert.deepStrictEqual(plano(modelo.tableros[0]), {
    sku:'T-000001',
    material:'Melamina 15mm',
    largo:2440,
    ancho:1220,
    espesor:15,
    costo:750,
    precioVenta:1200
  });
  assert.ok(!Object.prototype.hasOwnProperty.call(modelo.tableros[0], 'kerf'));
  assert.ok(!Object.prototype.hasOwnProperty.call(modelo.tableros[0], 'desperdicio'));
});

probar('OperacionFabricacion admite solo CORTE y TAPACANTO', () => {
  const operaciones = contexto.window.ProyCutManufacturingOperation;
  assert.deepStrictEqual(
    plano(operaciones.crearOperacionFabricacion({tipo:'CORTE', parametros:{lado:'L1'}})),
    {tipo:'CORTE', parametros:{lado:'L1'}}
  );
  assert.deepStrictEqual(
    plano(operaciones.crearOperacionFabricacion({tipo:'TAPACANTO', parametros:{lado:'A1'}})),
    {tipo:'TAPACANTO', parametros:{lado:'A1'}}
  );
  assert.throws(
    () => operaciones.crearOperacionFabricacion({tipo:'PERFORACION', parametros:{}}),
    /no permitido/
  );
});

probar('Subensamble prepara estructura sin generar piezas automaticamente', () => {
  const subensamble = contexto.window.ProyCutSubassembly.crearSubensamble({
    id:'S-1',
    nombre:'Cajon',
    piezas:[],
    herrajes:[],
    operaciones:[]
  });
  assert.deepStrictEqual(plano(subensamble), {
    id:'S-1', nombre:'Cajon', piezas:[], herrajes:[], operaciones:[]
  });
});

function expandirComoFlujoActual(filasPiezas, cantidadProyectos, permitirGirarAuto){
  const piezas = [];
  filasPiezas.forEach(fila => {
    let girarModo = fila.girarModo || 'auto';
    if(girarModo === 'auto' && !permitirGirarAuto) girarModo = 'normal';
    const cantidad = (parseInt(fila.cantTexto, 10) || 0) * cantidadProyectos;
    for(let indice=0; indice<cantidad; indice++){
      piezas.push({
        num:fila.id,
        label:fila.labelTexto.trim() || `Pieza ${fila.id}`,
        l:parseFloat(fila.largoTexto),
        a:parseFloat(fila.anchoTexto),
        girarModo,
        material:fila.material,
        tapaTipo:fila.tapaTipo,
        l1:fila.l1,
        l2:fila.l2,
        a1:fila.a1,
        a2:fila.a2,
        kerfEfectivo:4,
        kerfEntrePiezasEfectivo:4,
        kerfPiezaSobranteEfectivo:4,
        kerfBordeExteriorEfectivo:0
      });
    }
  });
  return piezas;
}

probar('adapter produce exactamente las piezas expandidas del flujo actual', () => {
  const modelo = contexto.window.ProyCutManufacturingModel.buildManufacturingModel({
    filasPiezas:filas,
    materiales,
    tapacantos
  });
  const adaptado = contexto.window.ProyCutManufacturingModel.buildOptimizerInputFromManufacturingModel({
    modeloFabricacion:modelo,
    cantidadProyectos:3,
    permitirGirarAuto:false,
    obtenerParametrosTecnicos:() => ({
      ok:true,
      kerfEfectivo:4,
      kerfEntrePiezasEfectivo:4,
      kerfPiezaSobranteEfectivo:4,
      kerfBordeExteriorEfectivo:0
    })
  });
  const anterior = expandirComoFlujoActual(filas, 3, false);
  assert.deepStrictEqual(plano(adaptado), {
    piezas:anterior,
    gruposPorMaterial:{'Melamina 15mm':anterior},
    errores:[]
  });
  assert.strictEqual(adaptado.piezas.length, 6);
  adaptado.gruposPorMaterial['Melamina 15mm'].forEach((pieza, indice) => {
    assert.strictEqual(pieza, adaptado.piezas[indice]);
  });
});

probar('entrada anterior y adaptada producen igual optimizacion y costo', () => {
  const modelo = contexto.window.ProyCutManufacturingModel.buildManufacturingModel({
    filasPiezas:filas,
    materiales,
    tapacantos
  });
  const anterior = expandirComoFlujoActual(filas, 1, false);
  const adaptado = contexto.window.ProyCutManufacturingModel.buildOptimizerInputFromManufacturingModel({
    modeloFabricacion:modelo,
    cantidadProyectos:1,
    permitirGirarAuto:false,
    obtenerParametrosTecnicos:() => ({
      ok:true,
      kerfEfectivo:4,
      kerfEntrePiezasEfectivo:4,
      kerfPiezaSobranteEfectivo:4,
      kerfBordeExteriorEfectivo:0
    })
  }).piezas;

  const contextoPipeline = vm.createContext({window:{}});
  ['src/scripts/utils/format.js', 'src/scripts/project/optimize-project.js', 'src/scripts/costing/calculate-costs.js']
    .forEach(archivo => vm.runInContext(
      fs.readFileSync(path.join(raiz, archivo), 'utf8'),
      contextoPipeline,
      {filename:archivo}
    ));
  const optimizar = contextoPipeline.window.ProyCutProjectOptimization.optimizarProyectoPreparado;
  const dependencias = {
    medidaTableroDeMaterial:() => ({largo:2440, ancho:1220}),
    establecerMedidaTableroActiva:() => {},
    calcularRectanguloUtilTablero:(largo, ancho) => ({
      ok:true,
      rect:{x:0, y:0, w:largo, h:ancho},
      margenes:{left:0, right:0, top:0, bottom:0}
    }),
    obtenerKerfMaterial:() => ({valor:4, entrePiezas:4, piezaSobrante:4, bordeExterior:0}),
    calcularRectanguloColocacion:rect => ({ok:true, rect}),
    empacarMaterial:piezas => [{
      pieces:piezas.map((pieza, indice) => ({...pieza, x:indice*704, y:0, w:700, h:400, rotada:false})),
      cortes:4,
      corteMm:2200
    }],
    compactarHaciaAbajo:() => {},
    contarCortes:board => ({cortes:board.cortes, largoMm:board.corteMm})
  };
  function ejecutarOptimizacion(piezas){
    return optimizar({
      gruposPorMaterial:{'Melamina 15mm':piezas},
      parametrosCorteProyecto:{margenes:{left:0, right:0, top:0, bottom:0}},
      opcionesProyecto:{libre:false, nivelOptimizacion:'normal'},
      dependencias
    });
  }
  const optimizacionAnterior = ejecutarOptimizacion(anterior);
  const optimizacionNueva = ejecutarOptimizacion(adaptado);
  assert.deepStrictEqual(plano(optimizacionNueva), plano(optimizacionAnterior));

  const calcularCostos = contextoPipeline.window.ProyCutCosting.calcularCostosProyecto;
  function ejecutarCosto(piezas, optimizacion){
    return calcularCostos({
      piezas,
      boards:optimizacion.boards,
      tablerosPorMaterial:optimizacion.tablerosPorMaterial,
      totalCortes:optimizacion.totalCortes,
      totalCorteMm:optimizacion.totalCorteMm,
      materiales,
      componentes:[],
      componentesProyecto:[],
      tapacantos,
      cantidadProyectos:1,
      modoPrecioCorte:'corte',
      precioCorte:5,
      precioCorteMetro:20,
      redondearTapacanto:false
    });
  }
  assert.deepStrictEqual(
    plano(ejecutarCosto(adaptado, optimizacionNueva)),
    plano(ejecutarCosto(anterior, optimizacionAnterior))
  );
});
