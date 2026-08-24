(function(){
  const CAMPOS_MANUFACTURING_INPUT = Object.freeze([
    'piezas',
    'gruposPorMaterial',
    'errores'
  ]);

  const CAMPOS_PIEZA_OPTIMIZADOR = Object.freeze([
    'num',
    'label',
    'l',
    'a',
    'girarModo',
    'material',
    'tapaTipo',
    'l1',
    'l2',
    'a1',
    'a2',
    'kerfEfectivo',
    'kerfEntrePiezasEfectivo',
    'kerfPiezaSobranteEfectivo',
    'kerfBordeExteriorEfectivo'
  ]);

  function crearManufacturingInput(optimizerInput){
    if(!optimizerInput || typeof optimizerInput !== 'object'){
      throw new TypeError('ManufacturingInput requiere una entrada existente del optimizador.');
    }
    return {
      piezas:optimizerInput.piezas,
      gruposPorMaterial:optimizerInput.gruposPorMaterial,
      errores:optimizerInput.errores
    };
  }

  window.ProyCutManufacturingInputContract = {
    CAMPOS_MANUFACTURING_INPUT,
    CAMPOS_PIEZA_OPTIMIZADOR,
    crearManufacturingInput
  };
})();
