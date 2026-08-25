const ProyCutPricing = (function(){
  const METODO_PRECIO_FIJO = 'PRECIO_FIJO';
  const METODO_CATALOGO = 'CATALOGO';
  const METODO_GLOBAL_SOBRE_COSTO = 'GLOBAL_SOBRE_COSTO';
  const TIPO_MARKUP_SOBRE_COSTO = 'MARKUP_SOBRE_COSTO';
  const CAMPOS_RESULTADO_COSTOS = [
    'costoMateriales',
    'costoComponentes',
    'costoCorte',
    'costoTapacanto',
    'costoTotal'
  ];

  function crearError(codigo, mensaje){
    return {codigo, mensaje};
  }

  function normalizarSku(sku){
    return String(sku == null ? '' : sku).trim().toUpperCase();
  }

  function validarResultadoCostos(resultadoCostos){
    if(!resultadoCostos || typeof resultadoCostos !== 'object' || Array.isArray(resultadoCostos)){
      return [crearError(
        'RESULTADO_COSTOS_REQUERIDO',
        'Se requiere un ResultadoCostos valido para calcular el precio.'
      )];
    }

    const camposInvalidos = CAMPOS_RESULTADO_COSTOS.filter(campo => (
      typeof resultadoCostos[campo] !== 'number' ||
      !Number.isFinite(resultadoCostos[campo]) ||
      resultadoCostos[campo] < 0
    ));

    if(camposInvalidos.length > 0){
      return [crearError(
        'RESULTADO_COSTOS_INVALIDO',
        `ResultadoCostos contiene campos canonicos invalidos: ${camposInvalidos.join(', ')}.`
      )];
    }

    return [];
  }

  function validarContextoPrecioFijo(contextoComercial){
    if(!contextoComercial || typeof contextoComercial !== 'object' || Array.isArray(contextoComercial)){
      return [crearError(
        'CONTEXTO_COMERCIAL_REQUERIDO',
        'Se requiere un contexto comercial valido para calcular el precio.'
      )];
    }

    const errores = [];
    if(contextoComercial.metodo !== METODO_PRECIO_FIJO){
      errores.push(crearError(
        'METODO_NO_SOPORTADO',
        'La primera version de Pricing Layer solo admite el metodo PRECIO_FIJO.'
      ));
    }

    if(!Object.prototype.hasOwnProperty.call(contextoComercial, 'precioManual')){
      errores.push(crearError(
        'PRECIO_MANUAL_REQUERIDO',
        'El metodo PRECIO_FIJO requiere un precioManual explicito.'
      ));
    }else if(
      typeof contextoComercial.precioManual !== 'number' ||
      !Number.isFinite(contextoComercial.precioManual)
    ){
      errores.push(crearError(
        'PRECIO_MANUAL_INVALIDO',
        'precioManual debe ser un numero finito.'
      ));
    }else if(contextoComercial.precioManual <= 0){
      errores.push(crearError(
        'PRECIO_MANUAL_NO_POSITIVO',
        'precioManual debe ser mayor que cero.'
      ));
    }

    return errores;
  }

  function buscarPrecioVenta(registros, sku, categoria){
    const skuNormalizado = normalizarSku(sku);
    const coincidencias = Array.isArray(registros)
      ? registros.filter(registro => (
        registro && normalizarSku(registro.sku) === skuNormalizado
      ))
      : [];
    if(!skuNormalizado || coincidencias.length !== 1){
      return {
        ok:false,
        error:crearError(
          'PRECIO_CATALOGO_NO_ENCONTRADO',
          `No existe un precio de venta comercial unico para ${categoria} con SKU ${skuNormalizado || '(sin SKU)'}.`
        )
      };
    }
    const precioVenta = coincidencias[0].precioVenta;
    if(typeof precioVenta !== 'number' || !Number.isFinite(precioVenta) || precioVenta < 0){
      return {
        ok:false,
        error:crearError(
          'PRECIO_VENTA_INVALIDO',
          `El precio de venta comercial de ${categoria} con SKU ${skuNormalizado} no es valido.`
        )
      };
    }
    return {ok:true, precioVenta};
  }

  function calcularLineasCatalogo(lineas, catalogo, obtenerCantidad, categoria){
    if(!Array.isArray(lineas)){
      return {ok:false, errores:[crearError('DESGLOSE_COSTOS_REQUERIDO', `Falta el desglose tecnico de ${categoria}.`)]};
    }
    let subtotal = 0;
    const errores = [];
    lineas.forEach(linea => {
      const cantidad = obtenerCantidad(linea);
      if(typeof cantidad !== 'number' || !Number.isFinite(cantidad) || cantidad < 0){
        errores.push(crearError('CANTIDAD_TECNICA_INVALIDA', `La cantidad tecnica de ${categoria} no es valida.`));
        return;
      }
      const precio = buscarPrecioVenta(catalogo, linea && linea.sku, categoria);
      if(!precio.ok){
        errores.push(precio.error);
        return;
      }
      subtotal += cantidad * precio.precioVenta;
    });
    return errores.length > 0 ? {ok:false, errores} : {ok:true, subtotal};
  }

  function calcularPrecioCatalogo(resultadoCostos, contextoComercial){
    const catalogo = contextoComercial.catalogoComercial;
    if(!catalogo || typeof catalogo !== 'object' || Array.isArray(catalogo)){
      return {ok:false, errores:[crearError('CATALOGO_COMERCIAL_REQUERIDO', 'Se requiere un catalogo comercial explicito.')]};
    }

    const materiales = calcularLineasCatalogo(
      resultadoCostos.materiales,
      catalogo.materiales,
      linea => linea.tableros,
      'material'
    );
    const componentes = calcularLineasCatalogo(
      resultadoCostos.componentes,
      catalogo.componentes,
      linea => linea.cantidadTotal,
      'componente'
    );
    const tapacantos = calcularLineasCatalogo(
      resultadoCostos.tapacantos,
      catalogo.tapacantos,
      linea => linea.metrosCobrables,
      'tapacanto'
    );
    const errores = [];
    [materiales, componentes, tapacantos].forEach(resultado => {
      if(!resultado.ok) errores.push(...resultado.errores);
    });

    const corte = catalogo.corte;
    let precioCorte = NaN;
    if(!corte || typeof corte !== 'object' || Array.isArray(corte)){
      errores.push(crearError('PRECIO_VENTA_CORTE_REQUERIDO', 'Se requiere la configuracion comercial del corte.'));
    }else if(corte.modo === 'metro'){
      if(typeof resultadoCostos.corteMl !== 'number' || !Number.isFinite(resultadoCostos.corteMl) || resultadoCostos.corteMl < 0){
        errores.push(crearError('CANTIDAD_TECNICA_CORTE_INVALIDA', 'El metraje tecnico de corte no es valido.'));
      }else if(resultadoCostos.corteMl === 0){
        precioCorte = 0;
      }else if(typeof corte.precioVentaCorteMetro !== 'number' || !Number.isFinite(corte.precioVentaCorteMetro) || corte.precioVentaCorteMetro < 0){
        errores.push(crearError('PRECIO_VENTA_CORTE_INVALIDO', 'precioVentaCorteMetro debe ser un numero finito no negativo.'));
      }else{
        precioCorte = resultadoCostos.corteMl * corte.precioVentaCorteMetro;
      }
    }else if(corte.modo === 'corte'){
      if(typeof resultadoCostos.cortes !== 'number' || !Number.isFinite(resultadoCostos.cortes) || resultadoCostos.cortes < 0){
        errores.push(crearError('CANTIDAD_TECNICA_CORTE_INVALIDA', 'La cantidad tecnica de cortes no es valida.'));
      }else if(resultadoCostos.cortes === 0){
        precioCorte = 0;
      }else if(typeof corte.precioVentaCorte !== 'number' || !Number.isFinite(corte.precioVentaCorte) || corte.precioVentaCorte < 0){
        errores.push(crearError('PRECIO_VENTA_CORTE_INVALIDO', 'precioVentaCorte debe ser un numero finito no negativo.'));
      }else{
        precioCorte = resultadoCostos.cortes * corte.precioVentaCorte;
      }
    }else{
      errores.push(crearError('MODO_PRECIO_CORTE_INVALIDO', 'El modo comercial del corte debe ser corte o metro.'));
    }

    const precioMateriales = materiales.ok ? materiales.subtotal : null;
    const precioComponentes = componentes.ok ? componentes.subtotal : null;
    const precioTapacanto = tapacantos.ok ? tapacantos.subtotal : null;
    const precioCorteResultado = Number.isFinite(precioCorte) ? precioCorte : null;
    const subtotales = [
      precioMateriales,
      precioComponentes,
      precioCorteResultado,
      precioTapacanto
    ];
    const precioTotal = subtotales
      .filter(Number.isFinite)
      .reduce((total, subtotal) => total + subtotal, 0);
    const resultadoPrecios = {
      precioMateriales,
      precioComponentes,
      precioCorte:precioCorteResultado,
      precioTapacanto,
      precioTotal
    };
    return errores.length > 0
      ? {ok:false, errores, resultadoPrecios}
      : {ok:true, resultadoPrecios};
  }

  function calcularPrecioGlobalSobreCosto(resultadoCostos, contextoComercial){
    if(
      !resultadoCostos ||
      typeof resultadoCostos !== 'object' ||
      Array.isArray(resultadoCostos) ||
      typeof resultadoCostos.costoTotal !== 'number' ||
      !Number.isFinite(resultadoCostos.costoTotal) ||
      resultadoCostos.costoTotal < 0
    ){
      return {
        ok:false,
        errores:[crearError(
          'COSTO_TOTAL_INVALIDO',
          'costoTotal debe ser un numero finito no negativo.'
        )]
      };
    }

    if(
      !Object.prototype.hasOwnProperty.call(contextoComercial, 'porcentajeSobreCosto') ||
      contextoComercial.porcentajeSobreCosto === undefined
    ){
      return {
        ok:false,
        errores:[crearError(
          'PORCENTAJE_SOBRE_COSTO_REQUERIDO',
          'El metodo GLOBAL_SOBRE_COSTO requiere un porcentajeSobreCosto explicito.'
        )]
      };
    }

    const porcentajeSobreCosto = contextoComercial.porcentajeSobreCosto;
    if(
      typeof porcentajeSobreCosto !== 'number' ||
      !Number.isFinite(porcentajeSobreCosto) ||
      porcentajeSobreCosto < 0
    ){
      return {
        ok:false,
        errores:[crearError(
          'PORCENTAJE_SOBRE_COSTO_INVALIDO',
          'porcentajeSobreCosto debe ser un numero finito no negativo.'
        )]
      };
    }

    const precioGlobal = resultadoCostos.costoTotal * (1 + porcentajeSobreCosto / 100);
    return {
      ok:true,
      resultadoPrecios:{
        metodoAplicado:METODO_GLOBAL_SOBRE_COSTO,
        precioBase:precioGlobal,
        precioFinal:precioGlobal,
        precioTotal:precioGlobal,
        porcentajeAplicado:{
          tipo:TIPO_MARKUP_SOBRE_COSTO,
          valor:porcentajeSobreCosto
        },
        desgloseCategorias:null,
        descuentoAplicado:null,
        advertencias:[]
      }
    };
  }

  function calcularPrecioProyecto(resultadoCostos, contextoComercial){
    if(contextoComercial && contextoComercial.metodo === METODO_GLOBAL_SOBRE_COSTO){
      return calcularPrecioGlobalSobreCosto(resultadoCostos, contextoComercial);
    }

    const erroresCostos = validarResultadoCostos(resultadoCostos);
    if(erroresCostos.length > 0){
      return {ok:false, errores:erroresCostos};
    }

    if(contextoComercial && contextoComercial.metodo === METODO_CATALOGO){
      return calcularPrecioCatalogo(resultadoCostos, contextoComercial);
    }

    const erroresContexto = validarContextoPrecioFijo(contextoComercial);
    if(erroresContexto.length > 0){
      return {ok:false, errores:erroresContexto};
    }

    const precioBase = contextoComercial.precioManual;
    return {
      ok:true,
      resultadoPrecio:{
        precioBase,
        metodoAplicado:METODO_PRECIO_FIJO,
        descuentoAplicado:null,
        precioFinal:precioBase,
        advertencias:[]
      }
    };
  }

  return {
    calcularPrecioProyecto
  };
})();
