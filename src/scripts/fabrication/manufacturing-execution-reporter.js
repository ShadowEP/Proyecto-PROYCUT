(function(){
  const CAMPOS_MANUFACTURING_EXECUTION_REPORT = Object.freeze([
    'entrada',
    'optimizacion',
    'costing',
    'snapshot'
  ]);

  const MOTIVOS_DECISION_MANUFACTURING = Object.freeze({
    PROYECTO_NO_LIBRE:'proyecto no libre',
    EQUIVALENCIA_COMPATIBLE:'compatible',
    SIN_ERRORES:'sin errores',
    PROYECTO_LIBRE:'proyecto libre',
    EQUIVALENCIA_INCOMPATIBLE:'equivalencia incompatible',
    ERRORES_MANUFACTURING_INPUT:'errores ManufacturingInput',
    DATOS_INCOMPLETOS:'datos incompletos'
  });

  function crearManufacturingDecisionReport({
    usaManufacturingInput,
    libre,
    equivalenceReport,
    optimizerInput
  }){
    const motivos = [];
    const equivalenciaCompleta = Boolean(
      equivalenceReport && typeof equivalenceReport.compatible === 'boolean'
    );
    const entradaCompleta = Boolean(
      optimizerInput && Array.isArray(optimizerInput.errores)
    );

    if(typeof libre !== 'boolean' || !equivalenciaCompleta || !entradaCompleta){
      motivos.push(MOTIVOS_DECISION_MANUFACTURING.DATOS_INCOMPLETOS);
    }
    if(libre === true){
      motivos.push(MOTIVOS_DECISION_MANUFACTURING.PROYECTO_LIBRE);
    } else if(libre === false){
      motivos.push(MOTIVOS_DECISION_MANUFACTURING.PROYECTO_NO_LIBRE);
    }
    if(equivalenciaCompleta){
      motivos.push(equivalenceReport.compatible === true
        ? MOTIVOS_DECISION_MANUFACTURING.EQUIVALENCIA_COMPATIBLE
        : MOTIVOS_DECISION_MANUFACTURING.EQUIVALENCIA_INCOMPATIBLE);
    }
    if(entradaCompleta){
      motivos.push(optimizerInput.errores.length === 0
        ? MOTIVOS_DECISION_MANUFACTURING.SIN_ERRORES
        : MOTIVOS_DECISION_MANUFACTURING.ERRORES_MANUFACTURING_INPUT);
    }

    return {
      modo:usaManufacturingInput === true ? 'manufacturing' : 'legacy',
      motivos
    };
  }

  function crearManufacturingExecutionReport({
    manufacturingExecutionSnapshot,
    equivalenceReport
  }){
    return {
      entrada:equivalenceReport,
      optimizacion:manufacturingExecutionSnapshot.optimizationComparison,
      costing:manufacturingExecutionSnapshot.costComparison,
      snapshot:manufacturingExecutionSnapshot
    };
  }

  window.ProyCutManufacturingExecutionReporter = {
    CAMPOS_MANUFACTURING_EXECUTION_REPORT,
    MOTIVOS_DECISION_MANUFACTURING,
    crearManufacturingDecisionReport,
    crearManufacturingExecutionReport
  };
})();
