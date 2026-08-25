const ProyCutProjectProfitability = (function(){
  function calcularRentabilidadDelProyecto({
    resultadoCostos,
    resultadoPrecios
  } = {}){
    return ProyCutProfitability.calcularRentabilidadProyecto({
      resultadoCostos,
      resultadoPrecios
    });
  }

  return {
    calcularRentabilidadDelProyecto
  };
})();
