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
        utilidad:null,
        markupPorcentaje:null,
        margenPorcentaje:null,
        advertencias:[]
      },
      errores
    };
  }

  function calcularRentabilidadProyecto({resultadoCostos, resultadoPrecios} = {}){
    const errores = [];
    if(
      !resultadoCostos ||
      typeof resultadoCostos !== 'object' ||
      Array.isArray(resultadoCostos) ||
      !esImporteValido(resultadoCostos.costoTotal)
    ){
      errores.push(crearMensaje(
        'RESULTADO_COSTOS_INVALIDO',
        'ResultadoCostos debe incluir un costoTotal finito no negativo.'
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

    const costoTotal = resultadoCostos.costoTotal;
    const precioCompleto = CAMPOS_PRECIO.every(campo => esImporteValido(resultadoPrecios[campo]));
    if(!precioCompleto){
      return {
        ok:true,
        resultadoRentabilidad:{
          estado:ESTADO_PRECIO_PARCIAL,
          costoTotal,
          precioTotal:null,
          precioDisponible:resultadoPrecios.precioTotal,
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
    const utilidad = precioTotal - costoTotal;
    const advertencias = [];
    let markupPorcentaje = null;
    let margenPorcentaje = null;

    if(costoTotal === 0){
      advertencias.push(crearMensaje(
        'MARKUP_INDEFINIDO_COSTO_CERO',
        'El markup no puede calcularse cuando el costo total es cero.'
      ));
    }else{
      markupPorcentaje = (utilidad / costoTotal) * 100;
    }

    if(precioTotal === 0){
      advertencias.push(crearMensaje(
        'MARGEN_INDEFINIDO_PRECIO_CERO',
        'El margen no puede calcularse cuando el precio total es cero.'
      ));
    }else{
      margenPorcentaje = (utilidad / precioTotal) * 100;
    }

    return {
      ok:true,
      resultadoRentabilidad:{
        estado:ESTADO_PRECIO_COMPLETO,
        costoTotal,
        precioTotal,
        precioDisponible:null,
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
