(function(){
  const {
    buildManufacturingModel,
    buildOptimizerInputFromManufacturingModel
  } = window.ProyCutManufacturingModel;
  const {compararEntradaFabricacion} = window.ProyCutManufacturingComparison;
  const {crearManufacturingInput} = window.ProyCutManufacturingInputContract;

  function buildManufacturingPipeline({
    filasPiezas,
    materiales,
    tapacantos,
    cantidadProyectos,
    permitirGirarAuto,
    piezasActuales,
    obtenerParametrosTecnicos,
    desarrollo,
    logger
  }){
    const manufacturingModel = buildManufacturingModel({filasPiezas, materiales, tapacantos});
    const optimizerInput = crearManufacturingInput(buildOptimizerInputFromManufacturingModel({
      modeloFabricacion:manufacturingModel,
      cantidadProyectos,
      permitirGirarAuto,
      obtenerParametrosTecnicos
    }));
    const equivalenceReport = compararEntradaFabricacion({
      piezasAnteriores:piezasActuales || [],
      piezasNuevas:optimizerInput.piezas,
      materialesAnteriores:materiales || [],
      tablerosNuevos:manufacturingModel.tableros
    });
    if(optimizerInput.errores.length > 0){
      equivalenceReport.compatible = false;
      optimizerInput.errores.forEach((error, indice) => {
        equivalenceReport.diferencias.push({
          entidad:'adapter', indice, campo:'error', anterior:null, nuevo:error
        });
      });
    }
    if(desarrollo === true && logger && typeof logger.info === 'function'){
      logger.info('Manufacturing equivalence', equivalenceReport);
    }
    return {manufacturingModel, optimizerInput, equivalenceReport};
  }

  window.ProyCutManufacturingPipeline = {
    buildManufacturingPipeline
  };
})();
