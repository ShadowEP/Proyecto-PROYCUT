(function(){
  // separa una linea de CSV en columnas (no soporta comillas con comas adentro, suficiente
  // para el formato numerico/texto simple que se exporta desde el boton "Exportar formato").
  function separarLineaCSV(linea){
    return linea.split(',').map(c => c.trim());
  }

  window.ProyCutCSV = {
    separarLineaCSV
  };
})();
