(function(){
  const CAMPOS_OPTIMIZATION_RESULT = Object.freeze([
    'ok',
    'boards',
    'tablerosPorMaterial',
    'totalCortes',
    'totalCorteMm'
  ]);

  function crearOptimizationResult(resultado){
    if(!resultado || typeof resultado !== 'object'){
      throw new TypeError('OptimizationResult requiere un resultado de optimizacion existente.');
    }
    return {
      ok:resultado.ok,
      boards:resultado.boards,
      tablerosPorMaterial:resultado.tablerosPorMaterial,
      totalCortes:resultado.totalCortes,
      totalCorteMm:resultado.totalCorteMm
    };
  }

  window.ProyCutOptimizationResultContract = {
    CAMPOS_OPTIMIZATION_RESULT,
    crearOptimizationResult
  };
})();
