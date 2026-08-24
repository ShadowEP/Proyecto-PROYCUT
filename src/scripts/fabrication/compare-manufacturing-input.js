(function(){
  function agregarDiferencia(diferencias, entidad, indice, campo, anterior, nuevo){
    if(anterior === nuevo) return;
    diferencias.push({entidad, indice, campo, anterior, nuevo});
  }

  function compararPiezas(piezasAnteriores, piezasNuevas, diferencias){
    agregarDiferencia(diferencias, 'piezas', null, 'cantidadTotal', piezasAnteriores.length, piezasNuevas.length);
    const campos = [
      'num', 'label', 'l', 'a', 'material', 'tapaTipo',
      'girarModo', 'l1', 'l2', 'a1', 'a2',
      'kerfEfectivo', 'kerfEntrePiezasEfectivo',
      'kerfPiezaSobranteEfectivo', 'kerfBordeExteriorEfectivo'
    ];
    const cantidad = Math.max(piezasAnteriores.length, piezasNuevas.length);
    for(let indice=0; indice<cantidad; indice++){
      const anterior = piezasAnteriores[indice];
      const nuevo = piezasNuevas[indice];
      if(!anterior || !nuevo){
        agregarDiferencia(diferencias, 'pieza', indice, 'existencia', Boolean(anterior), Boolean(nuevo));
        continue;
      }
      campos.forEach(campo => agregarDiferencia(
        diferencias, 'pieza', indice, campo, anterior[campo], nuevo[campo]
      ));
    }
  }

  function compararTableros(materialesAnteriores, tablerosNuevos, diferencias){
    agregarDiferencia(diferencias, 'tableros', null, 'cantidadTotal', materialesAnteriores.length, tablerosNuevos.length);
    const campos = [
      ['sku', 'sku'],
      ['nombre', 'material'],
      ['largo', 'largo'],
      ['ancho', 'ancho'],
      ['espesor', 'espesor'],
      ['precio', 'costo'],
      ['precioVenta', 'precioVenta']
    ];
    const cantidad = Math.max(materialesAnteriores.length, tablerosNuevos.length);
    for(let indice=0; indice<cantidad; indice++){
      const anterior = materialesAnteriores[indice];
      const nuevo = tablerosNuevos[indice];
      if(!anterior || !nuevo){
        agregarDiferencia(diferencias, 'tablero', indice, 'existencia', Boolean(anterior), Boolean(nuevo));
        continue;
      }
      campos.forEach(([campoAnterior, campoNuevo]) => agregarDiferencia(
        diferencias, 'tablero', indice, campoNuevo, anterior[campoAnterior], nuevo[campoNuevo]
      ));
    }
  }

  function compararEntradaFabricacion({
    piezasAnteriores,
    piezasNuevas,
    materialesAnteriores,
    tablerosNuevos
  }){
    const diferencias = [];
    compararPiezas(piezasAnteriores || [], piezasNuevas || [], diferencias);
    compararTableros(materialesAnteriores || [], tablerosNuevos || [], diferencias);
    return {compatible:diferencias.length === 0, diferencias};
  }

  window.ProyCutManufacturingComparison = {
    compararEntradaFabricacion
  };
})();
