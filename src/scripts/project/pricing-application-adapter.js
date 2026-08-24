const ProyCutPricingApplicationAdapter = (function(){
  function calcularPrecioDesdeAplicacion({
    resultadoCostos,
    contextoComercial
  }){
    return ProyCutPricing.calcularPrecioProyecto(
      resultadoCostos,
      contextoComercial
    );
  }

  return {
    calcularPrecioDesdeAplicacion
  };
})();
