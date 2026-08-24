(function(){
  function crearTableroFabricacion({
    sku,
    material,
    largo,
    ancho,
    espesor,
    costo,
    precioVenta
  }){
    return {
      sku,
      material,
      largo,
      ancho,
      espesor,
      costo,
      precioVenta
    };
  }

  window.ProyCutManufacturingBoard = {
    crearTableroFabricacion
  };
})();
