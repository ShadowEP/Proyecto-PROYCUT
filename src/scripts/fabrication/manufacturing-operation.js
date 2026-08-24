(function(){
  const TIPOS_OPERACION_FABRICACION = Object.freeze([
    'CORTE',
    'TAPACANTO'
  ]);

  function crearOperacionFabricacion({tipo, parametros}){
    if(!TIPOS_OPERACION_FABRICACION.includes(tipo)){
      throw new Error(`Tipo de operacion de fabricacion no permitido: ${tipo}.`);
    }
    return {
      tipo,
      parametros:{...(parametros || {})}
    };
  }

  window.ProyCutManufacturingOperation = {
    TIPOS_OPERACION_FABRICACION,
    crearOperacionFabricacion
  };
})();
