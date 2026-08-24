(function(){
  const {crearCostResult} = window.ProyCutCostResultContract;

  function ejecutarManufacturingCosting({
    optimizationResult,
    datosProyecto,
    dependencias
  }){
    if(!optimizationResult || typeof optimizationResult !== 'object'){
      throw new TypeError('ManufacturingCostAdapter requiere un OptimizationResult existente.');
    }
    if(!datosProyecto || typeof datosProyecto !== 'object'){
      throw new TypeError('ManufacturingCostAdapter requiere datosProyecto existentes.');
    }
    if(!dependencias || typeof dependencias.calcularCostosProyecto !== 'function'){
      throw new TypeError('ManufacturingCostAdapter requiere calcularCostosProyecto existente.');
    }
    return crearCostResult(dependencias.calcularCostosProyecto({
      ...datosProyecto,
      boards:optimizationResult.boards,
      tablerosPorMaterial:optimizationResult.tablerosPorMaterial,
      totalCortes:optimizationResult.totalCortes,
      totalCorteMm:optimizationResult.totalCorteMm
    }));
  }

  window.ProyCutManufacturingCostAdapter = {
    ejecutarManufacturingCosting
  };
})();
