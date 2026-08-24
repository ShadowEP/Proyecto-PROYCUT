(function(){
  function crearManufacturingMetrics(){
    let decisionesManufacturing = 0;
    let decisionesLegacy = 0;
    const motivosFallback = {};

    function registrarDecision(reporteDecision){
      if(!reporteDecision ||
        (reporteDecision.modo !== 'manufacturing' && reporteDecision.modo !== 'legacy') ||
        !Array.isArray(reporteDecision.motivos)){
        throw new TypeError('ManufacturingMetrics requiere un reporte de decision existente.');
      }

      if(reporteDecision.modo === 'manufacturing'){
        decisionesManufacturing += 1;
        return;
      }

      decisionesLegacy += 1;
      reporteDecision.motivos.forEach(motivo => {
        motivosFallback[motivo] = (motivosFallback[motivo] || 0) + 1;
      });
    }

    function obtenerSnapshot(){
      return {
        decisionesManufacturing,
        decisionesLegacy,
        motivosFallback:Object.assign({}, motivosFallback)
      };
    }

    return {registrarDecision, obtenerSnapshot};
  }

  window.ProyCutManufacturingMetrics = {
    crearManufacturingMetrics
  };
})();
