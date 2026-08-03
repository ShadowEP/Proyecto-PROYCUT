(function(){
  function obtenerAreaColocacionBoard(board){
    return board.areaColocacion || board.areaUtil || {
      x:0, y:0, w:board.boardW, h:board.boardH
    };
  }

  function obtenerKerfMaterial(piezas, parametrosProyecto){
    const inicial = {
      valor:parametrosProyecto.kerf,
      entrePiezas:parametrosProyecto.kerfEntrePiezas,
      piezaSobrante:parametrosProyecto.kerfPiezaSobrante,
      bordeExterior:parametrosProyecto.kerfBordeExterior
    };
    return piezas.reduce((resultado, pieza) => ({
      valor:Math.max(
        resultado.valor,
        Number.isFinite(pieza.kerfEfectivo) ? pieza.kerfEfectivo : inicial.valor
      ),
      entrePiezas:Math.max(
        resultado.entrePiezas,
        Number.isFinite(pieza.kerfEntrePiezasEfectivo)
          ? pieza.kerfEntrePiezasEfectivo
          : inicial.entrePiezas
      ),
      piezaSobrante:Math.max(
        resultado.piezaSobrante,
        Number.isFinite(pieza.kerfPiezaSobranteEfectivo)
          ? pieza.kerfPiezaSobranteEfectivo
          : inicial.piezaSobrante
      ),
      bordeExterior:Math.max(
        resultado.bordeExterior,
        Number.isFinite(pieza.kerfBordeExteriorEfectivo)
          ? pieza.kerfBordeExteriorEfectivo
          : inicial.bordeExterior
      )
    }), inicial);
  }

  function textoSeguroParaExcel(valor){
    const texto = String(valor === null || valor === undefined ? '' : valor);
    if(/^\s*[=+\-@]/.test(texto)) return "'" + texto;
    return texto;
  }

  function resumenErrores(errores, maximo){
    const limite = maximo || 8;
    const visibles = errores.slice(0, limite);
    const restantes = errores.length - visibles.length;
    return visibles.join('\n') + (restantes > 0 ? '\n... y ' + restantes + ' error' + (restantes===1?'':'es') + ' mas.' : '');
  }

  window.ProyCutBoardArea = {
    obtenerAreaColocacionBoard,
    obtenerKerfMaterial,
    textoSeguroParaExcel,
    resumenErrores
  };
})();
