(function(){
  const CAMPOS_MANUFACTURING_EXECUTION_SNAPSHOT = Object.freeze([
    'manufacturingModel',
    'manufacturingInput',
    'optimizationResult',
    'costResult',
    'optimizationComparison',
    'costComparison'
  ]);

  function crearManufacturingExecutionSnapshot({
    manufacturingModel,
    manufacturingInput,
    optimizationResult,
    costResult,
    optimizationComparison,
    costComparison
  }){
    return {
      manufacturingModel,
      manufacturingInput,
      optimizationResult,
      costResult,
      optimizationComparison,
      costComparison
    };
  }

  window.ProyCutManufacturingExecutionSnapshotContract = {
    CAMPOS_MANUFACTURING_EXECUTION_SNAPSHOT,
    crearManufacturingExecutionSnapshot
  };
})();
