(function(){
  function diferencia(diferencias, entidad, indice, campo, anterior, nuevo){
    if(anterior === nuevo) return;
    diferencias.push({entidad, indice, campo, anterior, nuevo});
  }

  function serializar(valor){
    return JSON.stringify(valor == null ? null : valor);
  }

  function metricasBoard(board){
    const ancho = Number(board && board.boardW) || 0;
    const alto = Number(board && board.boardH) || 0;
    const areaTablero = ancho * alto;
    const areaUtilizada = (board && Array.isArray(board.pieces) ? board.pieces : [])
      .reduce((total, pieza) => total + (Number(pieza.w) || 0) * (Number(pieza.h) || 0), 0);
    const desperdicio = areaTablero - areaUtilizada;
    return {
      areaTablero,
      areaUtilizada,
      desperdicio,
      aprovechamiento:areaTablero > 0 ? areaUtilizada / areaTablero * 100 : 0
    };
  }

  function compararPiezas(boardAnterior, boardNuevo, boardIndice, diferencias){
    const anteriores = Array.isArray(boardAnterior.pieces) ? boardAnterior.pieces : [];
    const nuevas = Array.isArray(boardNuevo.pieces) ? boardNuevo.pieces : [];
    diferencia(diferencias, 'board', boardIndice, 'cantidadPiezas', anteriores.length, nuevas.length);
    const campos = ['num', 'label', 'material', 'x', 'y', 'w', 'h', 'rotada'];
    const cantidad = Math.max(anteriores.length, nuevas.length);
    for(let indice=0; indice<cantidad; indice++){
      const anterior = anteriores[indice];
      const nuevo = nuevas[indice];
      const identidad = `${boardIndice}.${indice}`;
      if(!anterior || !nuevo){
        diferencia(diferencias, 'piezaColocada', identidad, 'existencia', Boolean(anterior), Boolean(nuevo));
        continue;
      }
      campos.forEach(campo => diferencia(
        diferencias, 'piezaColocada', identidad, campo, anterior[campo], nuevo[campo]
      ));
    }
  }

  function compararResultadoOptimizacion(resultadoActual, resultadoFabrication){
    const diferencias = [];
    const actual = resultadoActual || {};
    const nuevo = resultadoFabrication || {};
    const boardsActuales = Array.isArray(actual.boards) ? actual.boards : [];
    const boardsNuevos = Array.isArray(nuevo.boards) ? nuevo.boards : [];
    diferencia(diferencias, 'optimizacion', null, 'cantidadBoards', boardsActuales.length, boardsNuevos.length);
    diferencia(diferencias, 'optimizacion', null, 'totalCortes', actual.totalCortes, nuevo.totalCortes);
    diferencia(diferencias, 'optimizacion', null, 'totalCorteMm', actual.totalCorteMm, nuevo.totalCorteMm);
    diferencia(
      diferencias,
      'optimizacion',
      null,
      'tablerosPorMaterial',
      serializar(actual.tablerosPorMaterial),
      serializar(nuevo.tablerosPorMaterial)
    );
    const cantidad = Math.max(boardsActuales.length, boardsNuevos.length);
    for(let indice=0; indice<cantidad; indice++){
      const anterior = boardsActuales[indice];
      const boardNuevo = boardsNuevos[indice];
      if(!anterior || !boardNuevo){
        diferencia(diferencias, 'board', indice, 'existencia', Boolean(anterior), Boolean(boardNuevo));
        continue;
      }
      [
        'materialLabel', 'indexEnMaterial', 'boardW', 'boardH',
        'kerfValor', 'kerfEntrePiezas', 'kerfPiezaSobrante', 'kerfBordeExterior',
        'cortes', 'corteMm'
      ]
        .forEach(campo => diferencia(diferencias, 'board', indice, campo, anterior[campo], boardNuevo[campo]));
      ['areaUtil', 'areaColocacion', 'margenes', 'freeRects']
        .forEach(campo => diferencia(
          diferencias, 'board', indice, campo, serializar(anterior[campo]), serializar(boardNuevo[campo])
        ));
      compararPiezas(anterior, boardNuevo, indice, diferencias);
      const metricasAnteriores = metricasBoard(anterior);
      const metricasNuevas = metricasBoard(boardNuevo);
      Object.keys(metricasAnteriores).forEach(campo => diferencia(
        diferencias, 'metricasBoard', indice, campo, metricasAnteriores[campo], metricasNuevas[campo]
      ));
    }
    return {compatible:diferencias.length === 0, diferencias};
  }

  window.ProyCutOptimizationComparison = {
    compararResultadoOptimizacion,
    metricasBoard
  };
})();
