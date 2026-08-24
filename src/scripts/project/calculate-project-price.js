const ProyCutProjectPricing = (function(){
  function calcularPrecioFijoProyecto({
    resultadoCostos,
    precioManual
  }){
    const contextoComercial = {
      metodo:'PRECIO_FIJO',
      precioManual
    };

    return ProyCutPricingApplicationAdapter.calcularPrecioDesdeAplicacion({
      resultadoCostos,
      contextoComercial
    });
  }

  function calcularPrecioCatalogoProyecto({
    resultadoCostos,
    catalogoComercial
  }){
    const contextoComercial = {
      metodo:'CATALOGO',
      catalogoComercial
    };

    return ProyCutPricingApplicationAdapter.calcularPrecioDesdeAplicacion({
      resultadoCostos,
      contextoComercial
    });
  }

  return {
    calcularPrecioFijoProyecto,
    calcularPrecioCatalogoProyecto
  };
})();
