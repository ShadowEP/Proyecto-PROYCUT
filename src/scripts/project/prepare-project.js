(function(){
  // Coordina la preparacion del proyecto sin conocer DOM, state ni la implementacion concreta de
  // sus dependencias. Los efectos visuales y las salidas tempranas siguen a cargo de recalcular().
  function prepararProyectoParaOptimizacion({
    modeloProyecto,
    validarProyecto,
    resolverParametrosCorte,
    leerOpcionesProyecto,
    leerPiezas
  }){
    const validacion = validarProyecto(modeloProyecto);
    if(!validacion.ok){
      return {
        ok:false,
        etapa:'validacion',
        errores:validacion.errores
      };
    }

    const parametrosCorteProyecto = resolverParametrosCorte();
    if(!parametrosCorteProyecto.ok){
      return {
        ok:false,
        etapa:'parametros-corte',
        errores:parametrosCorteProyecto.errores
      };
    }

    const opcionesProyecto = leerOpcionesProyecto();
    const resultadoPiezas = leerPiezas(parametrosCorteProyecto, modeloProyecto);
    const piezas = resultadoPiezas.piezas;
    const errores = resultadoPiezas.errores;
    if(piezas.length === 0){
      return {
        ok:false,
        etapa:'piezas',
        errores
      };
    }

    const gruposPorMaterial = {};
    piezas.forEach(pieza => {
      (gruposPorMaterial[pieza.material] = gruposPorMaterial[pieza.material] || []).push(pieza);
    });

    return {
      ok:true,
      parametrosCorteProyecto,
      piezas,
      gruposPorMaterial,
      opcionesProyecto,
      errores
    };
  }

  window.ProyCutProjectPreparation = {
    prepararProyectoParaOptimizacion
  };
})();
