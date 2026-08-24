(function(){
  const CAMPOS_MANUFACTURING_SNAPSHOT = Object.freeze([
    'manufacturingModel',
    'optimizerInput',
    'optimizationResult',
    'costResult'
  ]);

  function crearManufacturingSnapshot({
    manufacturingModel,
    optimizerInput,
    optimizationResult,
    costResult
  }){
    return {
      manufacturingModel,
      optimizerInput,
      optimizationResult,
      costResult
    };
  }

  window.ProyCutManufacturingSnapshotContract = {
    CAMPOS_MANUFACTURING_SNAPSHOT,
    crearManufacturingSnapshot
  };
})();
