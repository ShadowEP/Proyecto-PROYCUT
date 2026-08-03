(function(){
  const {
    ENCABEZADO_FORMATO
  } = window.ProyCutProjectFormat;

  const LIMITES = window.ProyCutLimits;

  // separa una linea de CSV en columnas (no soporta comillas con comas adentro, suficiente
  // para el formato numerico/texto simple que se exporta desde el boton "Exportar formato").
  function separarLineaCSV(linea){
    return linea.split(',').map(c => c.trim());
  }

  function parsearCSV(texto){
    const lineas = texto.split(/\r\n|\n|\r/);
    const noVacias = [];
    lineas.forEach((linea, i) => {
      if(linea.trim().length > 0) noVacias.push({texto:linea, numero:i+1});
    });
    if(noVacias.length === 0) return {filas:[], errores:['El archivo CSV esta vacio.']};
    const encabezado = separarLineaCSV(noVacias[0].texto.replace(/^\uFEFF/, ''));
    const errores = [];
    if(encabezado.length !== LIMITES.csvColumnas){
      errores.push('Encabezado: se esperaban ' + LIMITES.csvColumnas + ' columnas y se encontraron ' + encabezado.length + '.');
    } else {
      ENCABEZADO_FORMATO.forEach((nombre, i) => {
        if(encabezado[i] !== nombre) errores.push('Encabezado, columna ' + (i+1) + ': se esperaba "' + nombre + '" y se encontro "' + encabezado[i] + '".');
      });
    }
    const datos = noVacias.slice(1);
    if(datos.length > LIMITES.csvFilas){
      errores.push('El CSV contiene ' + datos.length + ' filas de datos; el maximo permitido es ' + LIMITES.csvFilas + '.');
      return {filas:[], errores};
    }
    if(errores.length) return {filas:[], errores};
    const filas = datos.map(item => ({cols:separarLineaCSV(item.texto), numeroFila:item.numero}));
    return {filas, errores};
  }
  window.ProyCutCSV = {
    separarLineaCSV,
    parsearCSV
  };
})();
