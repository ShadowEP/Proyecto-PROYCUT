const ProyCutProjectProfitability = (function(){
  function calcularRentabilidadDelProyecto({
    resultadoCostos,
    resultadoPrecios,
    politicaRentabilidad
  } = {}){
    return ProyCutProfitability.calcularRentabilidadProyecto({
      resultadoCostos,
      resultadoPrecios,
      politicaRentabilidad
    });
  }

  return {
    calcularRentabilidadDelProyecto
  };
})();
