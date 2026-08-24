(function(){
  const CAMPOS_MANUFACTURING_EXECUTION_REPORT = Object.freeze([
    'entrada',
    'optimizacion',
    'costing',
    'snapshot'
  ]);

  function crearManufacturingExecutionReport({
    manufacturingExecutionSnapshot,
    equivalenceReport
  }){
    return {
      entrada:equivalenceReport,
      optimizacion:manufacturingExecutionSnapshot.optimizationComparison,
      costing:manufacturingExecutionSnapshot.costComparison,
      snapshot:manufacturingExecutionSnapshot
    };
  }

  window.ProyCutManufacturingExecutionReporter = {
    CAMPOS_MANUFACTURING_EXECUTION_REPORT,
    crearManufacturingExecutionReport
  };
})();
