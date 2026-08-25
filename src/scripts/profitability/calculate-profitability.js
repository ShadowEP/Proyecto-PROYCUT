const ProyCutProfitability = (function(){
  const ESTADO_PRECIO_COMPLETO = 'PRECIO_COMPLETO';
  const ESTADO_PRECIO_PARCIAL = 'PRECIO_PARCIAL';
  const ESTADO_DATOS_INVALIDOS = 'DATOS_INVALIDOS';
  const CAMPOS_PRECIO = [
    'precioMateriales',
    'precioComponentes',
    'precioCorte',
    'precioTapacanto'
  ];
  const CAMPOS_COSTO = [
    'costoMateriales',
    'costoComponentes',
    'costoCorte',
    'costoTapacanto',
    'costoTotal'
  ];
  const POLITICA_POR_DEFECTO = Object.freeze({
    incluirCostoCorte:true,
    incluirPrecioCorte:true,
    incluirCostoTapacanto:true,
    incluirPrecioTapacanto:true
  });

  function crearMensaje(codigo, mensaje){
    return {codigo, mensaje};
  }

  function esImporteValido(valor){
    return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;
  }

  function crearResultadoInvalido(errores){
    return {
      ok:false,
      resultadoRentabilidad:{
        estado:ESTADO_DATOS_INVALIDOS,
        costoTotal:null,
        precioTotal:null,
        precioDisponible:null,
        costoConsiderado:null,
        precioConsiderado:null,
        utilidad:null,
        markupPorcentaje:null,
        margenPorcentaje:null,
        advertencias:[]
      },
      errores
    };
  }

  function resolverPoliticaRentabilidad(politicaRentabilidad){
    if(politicaRentabilidad === undefined) return {ok:true, politica:{...POLITICA_POR_DEFECTO}};
    if(
      !politicaRentabilidad ||
      typeof politicaRentabilidad !== 'object' ||
      Array.isArray(politicaRentabilidad)
    ){
      return {ok:false};
    }
    const politica = {...POLITICA_POR_DEFECTO};
    const camposInvalidos = Object.keys(POLITICA_POR_DEFECTO).filter(campo => {
      if(!Object.prototype.hasOwnProperty.call(politicaRentabilidad, campo)) return false;
      if(typeof politicaRentabilidad[campo] !== 'boolean') return true;
      politica[campo] = politicaRentabilidad[campo];
      return false;
    });
    return camposInvalidos.length > 0 ? {ok:false} : {ok:true, politica};
  }

  function calcularRentabilidadProyecto({
    resultadoCostos,
    resultadoPrecios,
    politicaRentabilidad
  } = {}){
    const errores = [];
    const politicaResuelta = resolverPoliticaRentabilidad(politicaRentabilidad);
    if(!politicaResuelta.ok){
      errores.push(crearMensaje(
        'POLITICA_RENTABILIDAD_INVALIDA',
        'PoliticaRentabilidad debe contener exclusivamente valores booleanos para sus flags conocidos.'
      ));
    }
    if(
      !resultadoCostos ||
      typeof resultadoCostos !== 'object' ||
      Array.isArray(resultadoCostos) ||
      CAMPOS_COSTO.some(campo => !esImporteValido(resultadoCostos[campo]))
    ){
      errores.push(crearMensaje(
        'RESULTADO_COSTOS_INVALIDO',
        'ResultadoCostos debe incluir subtotales canonicos y costoTotal finitos no negativos.'
      ));
    }

    const preciosSonObjeto = Boolean(
      resultadoPrecios &&
      typeof resultadoPrecios === 'object' &&
      !Array.isArray(resultadoPrecios)
    );
    const camposPrecioInvalidos = preciosSonObjeto
      ? CAMPOS_PRECIO.filter(campo => (
        resultadoPrecios[campo] !== null &&
        !esImporteValido(resultadoPrecios[campo])
      ))
      : CAMPOS_PRECIO.slice();
    if(
      !preciosSonObjeto ||
      camposPrecioInvalidos.length > 0 ||
      !esImporteValido(resultadoPrecios && resultadoPrecios.precioTotal)
    ){
      errores.push(crearMensaje(
        'RESULTADO_PRECIOS_INVALIDO',
        'ResultadoPrecios debe incluir subtotales nulos o finitos no negativos y un precioTotal finito no negativo.'
      ));
    }

    if(errores.length > 0) return crearResultadoInvalido(errores);

    const politica = politicaResuelta.politica;
    const costoTotal = resultadoCostos.costoTotal;
    const costoConsiderado =
      resultadoCostos.costoMateriales +
      resultadoCostos.costoComponentes +
      (politica.incluirCostoCorte ? resultadoCostos.costoCorte : 0) +
      (politica.incluirCostoTapacanto ? resultadoCostos.costoTapacanto : 0);
    const camposPrecioParticipantes = [
      'precioMateriales',
      'precioComponentes',
      ...(politica.incluirPrecioCorte ? ['precioCorte'] : []),
      ...(politica.incluirPrecioTapacanto ? ['precioTapacanto'] : [])
    ];
    const precioCompleto = camposPrecioParticipantes.every(campo => (
      esImporteValido(resultadoPrecios[campo])
    ));
    if(!precioCompleto){
      const precioDisponible = camposPrecioParticipantes
        .filter(campo => esImporteValido(resultadoPrecios[campo]))
        .reduce((total, campo) => total + resultadoPrecios[campo], 0);
      return {
        ok:true,
        resultadoRentabilidad:{
          estado:ESTADO_PRECIO_PARCIAL,
          costoTotal,
          precioTotal:null,
          precioDisponible,
          costoConsiderado,
          precioConsiderado:null,
          utilidad:null,
          markupPorcentaje:null,
          margenPorcentaje:null,
          advertencias:[crearMensaje(
            'RENTABILIDAD_NO_CALCULABLE_PRECIO_PARCIAL',
            'La rentabilidad requiere un precio de venta completo.'
          )]
        }
      };
    }

    const precioTotal = resultadoPrecios.precioTotal;
    const precioConsiderado = camposPrecioParticipantes
      .reduce((total, campo) => total + resultadoPrecios[campo], 0);
    const utilidad = precioConsiderado - costoConsiderado;
    const advertencias = [];
    let markupPorcentaje = null;
    let margenPorcentaje = null;

    if(costoConsiderado === 0){
      advertencias.push(crearMensaje(
        'MARKUP_INDEFINIDO_COSTO_CERO',
        'El markup no puede calcularse cuando el costo total es cero.'
      ));
    }else{
      markupPorcentaje = (utilidad / costoConsiderado) * 100;
    }

    if(precioConsiderado === 0){
      advertencias.push(crearMensaje(
        'MARGEN_INDEFINIDO_PRECIO_CERO',
        'El margen no puede calcularse cuando el precio total es cero.'
      ));
    }else{
      margenPorcentaje = (utilidad / precioConsiderado) * 100;
    }

    return {
      ok:true,
      resultadoRentabilidad:{
        estado:ESTADO_PRECIO_COMPLETO,
        costoTotal,
        precioTotal,
        precioDisponible:null,
        costoConsiderado,
        precioConsiderado,
        utilidad,
        markupPorcentaje,
        margenPorcentaje,
        advertencias
      }
    };
  }

  return {
    calcularRentabilidadProyecto
  };
})();
