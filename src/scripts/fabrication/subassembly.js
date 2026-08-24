(function(){
  function crearSubensamble({id, nombre, piezas, herrajes, operaciones}){
    return {
      id,
      nombre,
      piezas:Array.isArray(piezas) ? piezas.slice() : [],
      herrajes:Array.isArray(herrajes) ? herrajes.slice() : [],
      operaciones:Array.isArray(operaciones) ? operaciones.slice() : []
    };
  }

  window.ProyCutSubassembly = {
    crearSubensamble
  };
})();
