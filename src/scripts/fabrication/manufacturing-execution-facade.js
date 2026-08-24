(function(){
  const {
    ejecutarManufacturingOptimization
  } = window.ProyCutManufacturingOptimizerAdapter;
  const {
    ejecutarManufacturingCosting
  } = window.ProyCutManufacturingCostAdapter;
  const {
    compararResultadoOptimizacion
  } = window.ProyCutOptimizationComparison;
  const {
    compararResultadoCostos
  } = window.ProyCutCostComparison;
  const {
    crearManufacturingExecutionSnapshot
  } = window.ProyCutManufacturingExecutionSnapshotContract;

  function ejecutarManufacturingExecution({
    manufacturingPipeline,
    parametrosCorteProyecto,
    opcionesProyecto,
    dependenciasOptimizer,
    datosProyectoCosting,
    dependenciasCosting,
    resultadoLegacy
  }){
    const optimizationResult = ejecutarManufacturingOptimization({
      manufacturingInput:manufacturingPipeline.optimizerInput,
      parametrosCorteProyecto,
      opcionesProyecto,
      dependencias:dependenciasOptimizer
    });
    const costResult = ejecutarManufacturingCosting({
      optimizationResult,
      datosProyecto:datosProyectoCosting,
      dependencias:dependenciasCosting
    });
    const optimizationComparison = compararResultadoOptimizacion(
      resultadoLegacy.optimizationResult,
      optimizationResult
    );
    const costComparison = compararResultadoCostos(
      resultadoLegacy.costResult,
      costResult
    );
    const manufacturingExecutionSnapshot = crearManufacturingExecutionSnapshot({
      manufacturingModel:manufacturingPipeline.manufacturingModel,
      manufacturingInput:manufacturingPipeline.optimizerInput,
      optimizationResult,
      costResult,
      optimizationComparison,
      costComparison
    });
    return {
      optimizationResult,
      costResult,
      optimizationComparison,
      costComparison,
      manufacturingExecutionSnapshot
    };
  }

  window.ProyCutManufacturingExecutionFacade = {
    ejecutarManufacturingExecution
  };
})();
