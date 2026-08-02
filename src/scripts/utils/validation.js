(function(){
  const LIMITES = window.ProyCutLimits;

  function validarNumeroEntrada(valor, nombre, opciones){
    const opts = opciones || {};
    const texto = String(valor === null || valor === undefined ? '' : valor).trim();
    if(texto === '') return {ok:false, error:nombre + ': el valor es obligatorio.'};
    const numero = Number(texto);
    if(!Number.isFinite(numero)) return {ok:false, error:nombre + ': debe ser un numero finito.'};
    if(opts.entero && !Number.isInteger(numero)) return {ok:false, error:nombre + ': debe ser un numero entero.'};
    if(opts.min !== undefined && numero < opts.min) return {ok:false, error:nombre + ': debe ser mayor o igual que ' + opts.min + '.'};
    if(opts.max !== undefined && numero > opts.max) return {ok:false, error:nombre + ': no puede ser mayor que ' + opts.max + '.'};
    return {ok:true, valor:numero};
  }

  function validarCantidad(valor, nombre){
    return validarNumeroEntrada(valor, nombre, {entero:true, min:1, max:LIMITES.cantidadPorFila});
  }

  function validarMedida(valor, nombre){
    return validarNumeroEntrada(valor, nombre, {min:Number.MIN_VALUE, max:LIMITES.medidaMm});
  }

  function validarPrecio(valor, nombre){
    return validarNumeroEntrada(valor, nombre, {min:0, max:LIMITES.precio});
  }

  window.ProyCutValidation = {
    validarNumeroEntrada,
    validarCantidad,
    validarMedida,
    validarPrecio
  };
})();
