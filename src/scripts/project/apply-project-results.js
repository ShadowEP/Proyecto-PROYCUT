(function(){
  function aplicarResultadoOptimizacion({
    state,
    boards,
    resultadoPanel,
    renderDiagrama
  }){
    const tabAnterior = state.boards[state.activeTab];
    const idAnterior = tabAnterior
      ? (tabAnterior.materialLabel + '·' + tabAnterior.indexEnMaterial)
      : null;
    state.boards = boards;
    let nuevoIndice = -1;
    if(idAnterior !== null){
      nuevoIndice = boards.findIndex(board => (
        board.materialLabel + '·' + board.indexEnMaterial
      ) === idAnterior);
    }
    if(nuevoIndice < 0) nuevoIndice = Math.min(state.activeTab, boards.length - 1);
    state.activeTab = Math.max(0, nuevoIndice);
    resultadoPanel.style.display = 'block';
    renderDiagrama();
  }

  function aplicarResultadoCostos({
    state,
    resultadoCostos,
    resultadoPanel,
    reportePanel,
    reporteContenido,
    leerOpcionesReporte,
    mostrarErroresProyecto,
    renderReporte
  }){
    if(!resultadoCostos.ok){
      mostrarErroresProyecto(resultadoCostos.errores);
      resultadoPanel.style.display = 'none';
      reportePanel.style.display = 'none';
      state.boards = [];
      state.ultimoReporte = null;
      state.ultimoTotal = 0;
      return false;
    }
    const datosReporte = resultadoCostos.datosReporte;
    const opcionesReporte = leerOpcionesReporte();
    reporteContenido.innerHTML = renderReporte(
      datosReporte,
      opcionesReporte.plantilla,
      opcionesReporte.disenoTotal
    );
    reportePanel.style.display = 'block';
    state.ultimoTotal = datosReporte.total;
    state.ultimoReporte = datosReporte;
    return true;
  }

  window.ProyCutProjectResults = {
    aplicarResultadoOptimizacion,
    aplicarResultadoCostos
  };
})();
