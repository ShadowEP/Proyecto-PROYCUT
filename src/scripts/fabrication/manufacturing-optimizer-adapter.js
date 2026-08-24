(function(){
  const {crearOptimizationResult} = window.ProyCutOptimizationResultContract;
  const {optimizarProyectoPreparado} = window.ProyCutProjectOptimization;

  function ejecutarManufacturingOptimization({
    manufacturingInput,
    parametrosCorteProyecto,
    opcionesProyecto,
    dependencias
  }){
    if(!manufacturingInput || typeof manufacturingInput !== 'object'){
      throw new TypeError('ManufacturingOptimizerAdapter requiere un ManufacturingInput existente.');
    }
    if(!manufacturingInput.gruposPorMaterial || typeof manufacturingInput.gruposPorMaterial !== 'object'){
      throw new TypeError('ManufacturingInput requiere gruposPorMaterial existentes.');
    }
    return crearOptimizationResult(optimizarProyectoPreparado({
      gruposPorMaterial:manufacturingInput.gruposPorMaterial,
      parametrosCorteProyecto,
      opcionesProyecto,
      dependencias
    }));
  }

  window.ProyCutManufacturingOptimizerAdapter = {
    ejecutarManufacturingOptimization
  };
})();
