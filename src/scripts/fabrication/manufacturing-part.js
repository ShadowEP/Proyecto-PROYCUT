(function(){
  function crearPiezaFabricacion({
    id,
    nombre,
    cantidad,
    largo,
    ancho,
    espesor,
    materialSKU,
    modoRotacion,
    sentidoVeta,
    ladosTapacanto,
    operaciones,
    origen
  }){
    return {
      id,
      nombre,
      cantidad,
      largo,
      ancho,
      espesor,
      materialSKU,
      modoRotacion,
      sentidoVeta,
      ladosTapacanto:{...ladosTapacanto},
      operaciones:Array.isArray(operaciones) ? operaciones.slice() : [],
      origen:{...origen}
    };
  }

  window.ProyCutManufacturingPart = {
    crearPiezaFabricacion
  };
})();
