(function(){
  const {crearCostResult} = window.ProyCutCostResultContract;
  const CAMPOS_COSTO = Object.freeze([
    'costoMateriales',
    'costoTapacanto',
    'costoCorte',
    'costoComponentes',
    'costoTotal'
  ]);

  function obtenerDatos(resultado){
    return crearCostResult(resultado).datosReporte;
  }

  function compararResultadoCostos(resultadoActual, resultadoFabrication){
    const anterior = obtenerDatos(resultadoActual) || {};
    const nuevo = obtenerDatos(resultadoFabrication) || {};
    const diferencias = [];
    const contratoActual = crearCostResult(resultadoActual);
    const contratoFabrication = crearCostResult(resultadoFabrication);
    if(Boolean(contratoActual.ok) !== Boolean(contratoFabrication.ok)){
      diferencias.push({
        entidad:'costing',
        indice:null,
        campo:'ok',
        anterior:Boolean(contratoActual.ok),
        nuevo:Boolean(contratoFabrication.ok)
      });
    }
    CAMPOS_COSTO.forEach(campo => {
      if(anterior[campo] === nuevo[campo]) return;
      diferencias.push({
        entidad:'costing',
        indice:null,
        campo,
        anterior:anterior[campo],
        nuevo:nuevo[campo]
      });
    });
    return {compatible:diferencias.length === 0, diferencias};
  }

  window.ProyCutCostComparison = {
    CAMPOS_COSTO,
    compararResultadoCostos
  };
})();
