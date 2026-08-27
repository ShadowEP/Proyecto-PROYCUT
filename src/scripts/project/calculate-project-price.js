const ProyCutProjectPricing = (function(){
  const MODO_INDIVIDUAL = 'INDIVIDUAL';
  const MODO_GLOBAL_SOBRE_COSTO = 'GLOBAL_SOBRE_COSTO';

  function crearError(codigo, mensaje){
    return {codigo, mensaje};
  }

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
    catalogoComercial,
    descuento
  }){
    const contextoComercial = {
      metodo:'CATALOGO',
      catalogoComercial
    };
    if(descuento !== undefined){
      contextoComercial.descuento = descuento;
    }

    return ProyCutPricingApplicationAdapter.calcularPrecioDesdeAplicacion({
      resultadoCostos,
      contextoComercial
    });
  }

  function calcularPrecioDelProyecto({
    resultadoCostos,
    catalogoComercial,
    politicaPrecios
  } = {}){
    if(politicaPrecios === undefined){
      return calcularPrecioCatalogoProyecto({
        resultadoCostos,
        catalogoComercial
      });
    }

    if(
      !politicaPrecios ||
      typeof politicaPrecios !== 'object' ||
      Array.isArray(politicaPrecios)
    ){
      return {
        ok:false,
        errores:[crearError(
          'POLITICA_PRECIOS_INVALIDA',
          'PoliticaPrecios debe ser un objeto con un modo explicito.'
        )]
      };
    }

    if(politicaPrecios.modo === MODO_INDIVIDUAL){
      return calcularPrecioCatalogoProyecto({
        resultadoCostos,
        catalogoComercial,
        descuento:politicaPrecios.descuento
      });
    }

    if(politicaPrecios.modo === MODO_GLOBAL_SOBRE_COSTO){
      const contextoComercial = {
        metodo:MODO_GLOBAL_SOBRE_COSTO,
        porcentajeSobreCosto:politicaPrecios.porcentajeSobreCosto
      };
      if(politicaPrecios.descuento !== undefined){
        contextoComercial.descuento = politicaPrecios.descuento;
      }
      return ProyCutPricingApplicationAdapter.calcularPrecioDesdeAplicacion({
        resultadoCostos,
        contextoComercial
      });
    }

    return {
      ok:false,
      errores:[crearError(
        'MODO_POLITICA_PRECIOS_INVALIDO',
        'El modo de PoliticaPrecios debe ser INDIVIDUAL o GLOBAL_SOBRE_COSTO.'
      )]
    };
  }

  return {
    calcularPrecioFijoProyecto,
    calcularPrecioCatalogoProyecto,
    calcularPrecioDelProyecto
  };
})();
