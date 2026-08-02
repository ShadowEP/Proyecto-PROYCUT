(function(){
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

  window.ProyCutValidation = {
    validarNumeroEntrada
  };
})();
