(function(){
  const CAMPOS_COST_RESULT = Object.freeze([
    'ok',
    'datosReporte',
    'errores'
  ]);

  function crearCostResult(resultado){
    if(!resultado || typeof resultado !== 'object'){
      throw new TypeError('CostResult requiere un resultado de costeo existente.');
    }
    if(Object.prototype.hasOwnProperty.call(resultado, 'datosReporte') || resultado.ok === false){
      return resultado.ok === false
        ? {ok:false, errores:resultado.errores}
        : {ok:resultado.ok, datosReporte:resultado.datosReporte};
    }
    return {ok:true, datosReporte:resultado};
  }

  window.ProyCutCostResultContract = {
    CAMPOS_COST_RESULT,
    crearCostResult
  };
})();
