(function(){
  // ---------- Etapa 4A: modelo central de configuracion (aun sin conectar al optimizador) ----------
  // Las fuentes se combinan de la mas general a la mas especifica. En esta etapa el modelo queda
  // preparado en memoria, pero ninguna funcion de geometria, precio, reporte o exportacion lo
  // consulta todavia; por eso no cambia el comportamiento actual de la aplicacion.
  const NIVELES_CONFIGURACION_ETAPA4 = Object.freeze([
    'sistema', 'empresa', 'sucursal', 'proyecto', 'pieza'
  ]);
  const CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4 = Object.freeze([
    '__proto__', 'prototype', 'constructor'
  ]);

  // Reglas basicas del esquema inicial. Las rutas no declaradas se rechazan para detectar errores
  // de escritura antes de que una configuracion llegue a usarse en etapas posteriores.
  const REGLAS_CONFIGURACION_ETAPA4 = Object.freeze({
    'units.length': {tipo:'enum', valores:['mm']},
    'units.area': {tipo:'enum', valores:['mm2']},
    'pricing.currency': {tipo:'string', patron:/^[A-Z]{3}$/},
    'pricing.tax_included': {tipo:'boolean'},
    'reporting.linear_decimals': {tipo:'integer', min:0, max:4},
    'reporting.money_decimals': {tipo:'integer', min:0, max:4},
    'kerf.enabled': {tipo:'boolean'},
    'kerf.value_mm': {tipo:'number', min:0, max:20},
    'kerf.source_type': {tipo:'enum', valores:['fixed','machine','material','tool','project']},
    'kerf.between_pieces': {tipo:'boolean'},
    'kerf.piece_to_offcut': {tipo:'boolean'},
    'kerf.apply_at_outer_edges': {tipo:'boolean'},
    'kerf.zero_allowed_in_simulation': {tipo:'boolean'},
    'outer_margins.left_mm': {tipo:'number', min:0, max:500},
    'outer_margins.right_mm': {tipo:'number', min:0, max:500},
    'outer_margins.top_mm': {tipo:'number', min:0, max:500},
    'outer_margins.bottom_mm': {tipo:'number', min:0, max:500},
    'squaring.mode': {tipo:'enum', valores:['none','optional','required']},
    'squaring.edges': {tipo:'array-enum', valores:['left','right','top','bottom']},
    'squaring.charge_mode': {tipo:'enum', valores:['none','per_edge','per_board']},
    'exact_fit_policy': {tipo:'enum', valores:['zero_cuts','square_if_enabled','reject_if_margins']},
    'cut_pricing.mode': {tipo:'enum', valores:['geometric_cut','machine_operation','linear_meter','board','piece','combined']},
    'cut_pricing.show_technical_meters': {tipo:'boolean'},
    'cut_pricing.optimization_objective': {tipo:'enum', valores:['boards','geometric_cuts','operations','linear_meters','total_cost','offcut_quality']},
    'shared_cuts.geometric_counting': {tipo:'enum', valores:['unique_line','per_piece']},
    'shared_cuts.operation_counting': {tipo:'enum', valores:['machine_sequence','unique_line','per_piece']},
    'shared_cuts.show_both_metrics': {tipo:'boolean'},
    'shared_cuts.collinear_tolerance_mm': {tipo:'number', min:0, max:1},
    'stacking.enabled': {tipo:'boolean'},
    'stacking.assignment_mode': {tipo:'enum', valores:['manual','automatic']},
    'stacking.max_sheets': {tipo:'integer', min:1, max:100},
    'edgebanding.side_semantics': {tipo:'enum', valores:['captured_dimensions','long_short']},
    'edgebanding.rounding_increment_m': {tipo:'enum-number', valores:[0,0.10,0.25,0.50,1]},
    'edgebanding.rounding_scope': {tipo:'enum', valores:['side','piece','project','type']},
    'edgebanding.waste_percent': {tipo:'number', min:0, max:100},
    'edgebanding.charge_modes': {tipo:'array-enum', valores:['per_meter','per_side','per_piece']},
    'edgebanding.preserve_side_identity': {tipo:'boolean'},
    'offcuts.min_length_mm': {tipo:'number', min:0},
    'offcuts.min_width_mm': {tipo:'number', min:0},
    'offcuts.min_area_mm2': {tipo:'number', min:0},
    'offcuts.min_board_percent': {tipo:'number', min:0, max:100},
    'offcuts.retention_mode': {tipo:'enum', valores:['all','usable_only','none']},
    'offcuts.valuation_mode': {tipo:'enum', valores:['none','area_ratio','fixed','catalog']},
    'offcuts.discount_from_project': {tipo:'boolean'},
    'grain.material_direction': {tipo:'enum', valores:['none','longitudinal','transverse']},
    'grain.piece_requirement': {tipo:'enum', valores:['none','parallel','perpendicular','preserve_captured']},
    'rotation.mode': {tipo:'enum', valores:['free','automatic','forbidden','manual_90','preserve_captured','ask','grain_safe_only']},
    'rotation.allow_mixed_identical_pieces': {tipo:'boolean'},
    'rotation.visual_rotation_separate': {tipo:'boolean'},
    'rotation.exception_requires_reason': {tipo:'boolean'},
    'optimization.cut_mode': {tipo:'enum', valores:['guillotine','free']},
    'optimization.quality': {tipo:'enum', valores:['normal','advanced','complete']},
    'optimization.profile_type': {tipo:'enum', valores:['panel_saw','cnc_router','custom']},
    'optimization.manual_edits_policy': {tipo:'enum', valores:['recalculate','invalidate','forbid']},
    'optimization.tie_breakers': {tipo:'array-enum', valores:['boards','cost','operations','geometric_cuts','linear_meters','usable_offcut_area']},
    'unfit_piece.calculation_action': {tipo:'enum', valores:['block_all','continue_valid']},
    'unfit_piece.show_incident': {tipo:'boolean'},
    'unfit_piece.try_alternative_board': {tipo:'boolean'},
    'unfit_piece.suggest_rotation': {tipo:'boolean'},
    'unfit_piece.suggest_board_format': {tipo:'boolean'},
    'unfit_piece.suggest_split': {tipo:'boolean'},
    'unfit_piece.block_export': {tipo:'boolean'},
    'unfit_piece.block_confirmation': {tipo:'boolean'},
    'unfit_piece.allow_silent_omission': {tipo:'boolean'}
  });

  const CONFIGURACION_SISTEMA_ETAPA4 = Object.freeze({
    units: {length:'mm', area:'mm2'},
    reporting: {linear_decimals:3, money_decimals:2},
    shared_cuts: {collinear_tolerance_mm:0.01},
    edgebanding: {preserve_side_identity:true},
    rotation: {visual_rotation_separate:true},
    unfit_piece: {show_incident:true, allow_silent_omission:false}
  });

  const CONFIGURACION_BAMTECK_ETAPA4 = Object.freeze({
    pricing: {currency:'MXN', tax_included:false},
    kerf: {
      enabled:true, value_mm:4, source_type:'fixed', between_pieces:true,
      piece_to_offcut:true, apply_at_outer_edges:false, zero_allowed_in_simulation:true
    },
    outer_margins: {left_mm:0, right_mm:0, top_mm:0, bottom_mm:0},
    squaring: {mode:'optional', edges:[], charge_mode:'none'},
    exact_fit_policy: 'zero_cuts',
    cut_pricing: {
      mode:'geometric_cut', show_technical_meters:true, optimization_objective:'boards'
    },
    shared_cuts: {
      geometric_counting:'unique_line', operation_counting:'machine_sequence',
      show_both_metrics:true
    },
    stacking: {enabled:false, assignment_mode:'manual', max_sheets:1},
    edgebanding: {
      side_semantics:'long_short', rounding_increment_m:0, rounding_scope:'type',
      waste_percent:0, charge_modes:['per_meter']
    },
    offcuts: {
      min_length_mm:60, min_width_mm:60, min_area_mm2:0, min_board_percent:0,
      retention_mode:'usable_only', valuation_mode:'none', discount_from_project:false
    },
    grain: {material_direction:'none', piece_requirement:'none'},
    rotation: {
      mode:'grain_safe_only', allow_mixed_identical_pieces:false,
      exception_requires_reason:true
    },
    optimization: {
      cut_mode:'guillotine', quality:'normal', profile_type:'panel_saw',
      manual_edits_policy:'invalidate',
      tie_breakers:['boards','geometric_cuts','usable_offcut_area']
    },
    unfit_piece: {
      calculation_action:'block_all', try_alternative_board:false,
      suggest_rotation:true, suggest_board_format:true, suggest_split:false,
      block_export:true, block_confirmation:true
    }
  });

  // Sucursal, proyecto y piezas empiezan vacios. "piezas" queda preparado para guardar en el
  // futuro una configuracion parcial bajo el identificador estable de cada pieza.
  const configuracionesEtapa4 = {
    sistema: CONFIGURACION_SISTEMA_ETAPA4,
    empresa: CONFIGURACION_BAMTECK_ETAPA4,
    sucursal: null,
    proyecto: null,
    piezas: Object.create(null)
  };

  function esObjetoPlanoConfiguracion(valor){
    if(valor === null || typeof valor !== 'object' || Array.isArray(valor)) return false;
    const proto = Object.getPrototypeOf(valor);
    return proto === Object.prototype || proto === null;
  }

  function clonarValorConfiguracion(valor){
    if(Array.isArray(valor)) return valor.map(clonarValorConfiguracion);
    if(!esObjetoPlanoConfiguracion(valor)) return valor;
    const copia = {};
    Object.keys(valor).forEach(clave => {
      if(CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4.includes(clave)) return;
      copia[clave] = clonarValorConfiguracion(valor[clave]);
    });
    return copia;
  }

  function combinarConfiguraciones(){
    const resultado = {};
    Array.from(arguments).forEach(fuente => {
      if(!esObjetoPlanoConfiguracion(fuente)) return;
      Object.keys(fuente).forEach(clave => {
        if(CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4.includes(clave)) return;
        const valor = fuente[clave];
        if(valor === undefined) return;
        if(esObjetoPlanoConfiguracion(valor)){
          const base = esObjetoPlanoConfiguracion(resultado[clave]) ? resultado[clave] : {};
          resultado[clave] = combinarConfiguraciones(base, valor);
        } else {
          resultado[clave] = clonarValorConfiguracion(valor);
        }
      });
    });
    return resultado;
  }

  function obtenerValorConfiguracion(configuracion, ruta){
    if(typeof ruta !== 'string' || ruta.trim() === '') return undefined;
    const partes = ruta.split('.');
    let actual = configuracion;
    for(let i=0; i<partes.length; i++){
      const clave = partes[i];
      if(CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4.includes(clave)) return undefined;
      if(actual === null || actual === undefined || !Object.prototype.hasOwnProperty.call(Object(actual), clave)){
        return undefined;
      }
      actual = actual[clave];
    }
    return actual;
  }

  function validarConfiguracionEtapa4(configuracion){
    const errores = [];
    if(!esObjetoPlanoConfiguracion(configuracion)){
      return {ok:false, errores:['La configuracion debe ser un objeto plano.']};
    }

    function validarNodo(nodo, prefijo){
      Object.keys(nodo).forEach(clave => {
        const ruta = prefijo ? prefijo + '.' + clave : clave;
        if(CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4.includes(clave)){
          errores.push(ruta + ': clave no permitida.');
          return;
        }
        const valor = nodo[clave];
        if(esObjetoPlanoConfiguracion(valor)){
          validarNodo(valor, ruta);
          return;
        }
        const regla = REGLAS_CONFIGURACION_ETAPA4[ruta];
        if(!regla){
          errores.push(ruta + ': clave de configuracion desconocida.');
          return;
        }
        if(valor === undefined){
          errores.push(ruta + ': no se permite undefined; omite la clave para heredar.');
          return;
        }
        if(regla.tipo === 'boolean' && typeof valor !== 'boolean'){
          errores.push(ruta + ': debe ser booleano.');
        } else if(regla.tipo === 'string'){
          if(typeof valor !== 'string' || (regla.patron && !regla.patron.test(valor))){
            errores.push(ruta + ': debe ser una cadena valida.');
          }
        } else if(regla.tipo === 'number' || regla.tipo === 'integer'){
          if(typeof valor !== 'number' || !Number.isFinite(valor)){
            errores.push(ruta + ': debe ser un numero finito.');
          } else {
            if(regla.tipo === 'integer' && !Number.isInteger(valor)) errores.push(ruta + ': debe ser entero.');
            if(regla.min !== undefined && valor < regla.min) errores.push(ruta + ': no puede ser menor que ' + regla.min + '.');
            if(regla.max !== undefined && valor > regla.max) errores.push(ruta + ': no puede ser mayor que ' + regla.max + '.');
          }
        } else if(regla.tipo === 'enum'){
          if(typeof valor !== 'string' || !regla.valores.includes(valor)){
            errores.push(ruta + ': valor no permitido.');
          }
        } else if(regla.tipo === 'enum-number'){
          if(typeof valor !== 'number' || !Number.isFinite(valor) || !regla.valores.includes(valor)){
            errores.push(ruta + ': valor numerico no permitido.');
          }
        } else if(regla.tipo === 'array-enum'){
          if(!Array.isArray(valor) || valor.some(item => !regla.valores.includes(item))){
            errores.push(ruta + ': contiene valores no permitidos.');
          }
        }
      });
    }

    validarNodo(configuracion, '');
    return {ok:errores.length === 0, errores};
  }

  function resolverConfiguracionJerarquica(fuentes, piezaId){
    const origen = esObjetoPlanoConfiguracion(fuentes) ? fuentes : {};
    const porPieza = esObjetoPlanoConfiguracion(origen.piezas) ? origen.piezas : {};
    const configuracionPieza = piezaId === null || piezaId === undefined ? null : porPieza[piezaId];
    return combinarConfiguraciones(
      origen.sistema,
      origen.empresa,
      origen.sucursal,
      origen.proyecto,
      configuracionPieza
    );
  }

  function resolverValorPorJerarquia(ruta, fuentes, piezaId){
    return obtenerValorConfiguracion(
      resolverConfiguracionJerarquica(fuentes || configuracionesEtapa4, piezaId),
      ruta
    );
  }

  // ---------- Etapa 4B: resolucion de kerf, margenes y area util ----------
  // Los controles representan una configuracion explicita del proyecto. La jerarquia puede
  // resolver excepciones por pieza, pero el empaquetado actual sigue usando valores agregados
  // unicos por material; por eso todavia no se ofrece kerf diferente por pieza como soporte real.
  function leerNumeroConfiguracionCorte(inputId){
    const input = document.getElementById(inputId);
    const texto = input ? String(input.value).trim() : '';
    return texto === '' ? NaN : Number(texto);
  }

  function obtenerControlesMargenesExteriores(){
    return {
      aplicar: document.getElementById('aplicarMargenesExteriores'),
      mismo: document.getElementById('mismoMargenExterior'),
      general: document.getElementById('margenExteriorGeneral'),
      individuales: [
        document.getElementById('margenExteriorIzquierdo'),
        document.getElementById('margenExteriorDerecho'),
        document.getElementById('margenExteriorSuperior'),
        document.getElementById('margenExteriorInferior')
      ]
    };
  }

  function actualizarControlesMargenesExteriores(opciones){
    const opts = opciones || {};
    const controles = obtenerControlesMargenesExteriores();
    if(!controles.aplicar || !controles.mismo || !controles.general) return;
    const aplicar = controles.aplicar.checked;
    const mismo = controles.mismo.checked;
    controles.mismo.disabled = !aplicar;
    controles.general.disabled = !aplicar || !mismo;
    controles.individuales.forEach(input => {
      if(input) input.disabled = !aplicar || mismo;
    });
    if(aplicar && mismo && opts.sincronizar !== false){
      controles.individuales.forEach(input => {
        if(input) input.value = controles.general.value;
      });
    }
  }

  function crearConfiguracionProyectoCorteActual(){
    const controles = obtenerControlesMargenesExteriores();
    const aplicar = controles.aplicar ? controles.aplicar.checked : false;
    const mismo = controles.mismo ? controles.mismo.checked : true;
    const general = leerNumeroConfiguracionCorte('margenExteriorGeneral');
    const margenes = !aplicar
      ? {left_mm:0, right_mm:0, top_mm:0, bottom_mm:0}
      : mismo
        ? {left_mm:general, right_mm:general, top_mm:general, bottom_mm:general}
        : {
            left_mm:leerNumeroConfiguracionCorte('margenExteriorIzquierdo'),
            right_mm:leerNumeroConfiguracionCorte('margenExteriorDerecho'),
            top_mm:leerNumeroConfiguracionCorte('margenExteriorSuperior'),
            bottom_mm:leerNumeroConfiguracionCorte('margenExteriorInferior')
          };
    return {
      kerf: {
        value_mm: leerNumeroConfiguracionCorte('kerf')
      },
      outer_margins: margenes
    };
  }

  function fuentesConfiguracionCorteActual(){
    return {
      sistema: configuracionesEtapa4.sistema,
      empresa: configuracionesEtapa4.empresa,
      sucursal: configuracionesEtapa4.sucursal,
      proyecto: combinarConfiguraciones(
        configuracionesEtapa4.proyecto,
        crearConfiguracionProyectoCorteActual()
      ),
      piezas: configuracionesEtapa4.piezas
    };
  }

  function mensajesParametrosCorte(errores){
    return errores.map(error => {
      if(error.indexOf('kerf.value_mm:') === 0){
        return 'Kerf: debe ser un numero finito entre 0 y 20 mm.';
      }
      const lados = {
        'outer_margins.left_mm:':'Margen izquierdo',
        'outer_margins.right_mm:':'Margen derecho',
        'outer_margins.top_mm:':'Margen superior',
        'outer_margins.bottom_mm:':'Margen inferior'
      };
      const prefijo = Object.keys(lados).find(ruta => error.indexOf(ruta) === 0);
      if(prefijo) return lados[prefijo] + ': debe ser un numero finito entre 0 y 500 mm.';
      return 'Configuracion de corte: ' + error;
    });
  }

  function resolverParametrosCorteEtapa4(piezaId){
    const fuentes = fuentesConfiguracionCorteActual();
    const resuelta = resolverConfiguracionJerarquica(fuentes, piezaId);
    const validacion = validarConfiguracionEtapa4(resuelta);
    if(!validacion.ok){
      return {ok:false, errores:mensajesParametrosCorte(validacion.errores), configuracion:resuelta};
    }
    const kerfHabilitado = obtenerValorConfiguracion(resuelta, 'kerf.enabled') !== false;
    const kerfConfigurado = obtenerValorConfiguracion(resuelta, 'kerf.value_mm');
    const aplicarEntrePiezas = obtenerValorConfiguracion(resuelta, 'kerf.between_pieces') !== false;
    const aplicarPiezaSobrante = obtenerValorConfiguracion(resuelta, 'kerf.piece_to_offcut') !== false;
    const aplicarBordesExteriores = obtenerValorConfiguracion(resuelta, 'kerf.apply_at_outer_edges') === true;
    const margenes = {
      left: obtenerValorConfiguracion(resuelta, 'outer_margins.left_mm'),
      right: obtenerValorConfiguracion(resuelta, 'outer_margins.right_mm'),
      top: obtenerValorConfiguracion(resuelta, 'outer_margins.top_mm'),
      bottom: obtenerValorConfiguracion(resuelta, 'outer_margins.bottom_mm')
    };
    const kerf = kerfHabilitado ? kerfConfigurado : 0;
    const kerfEntrePiezas = aplicarEntrePiezas ? kerf : 0;
    const kerfPiezaSobrante = aplicarPiezaSobrante ? kerf : 0;
    const kerfBordeExterior = aplicarBordesExteriores ? kerf : 0;
    const valores = [
      kerf, kerfEntrePiezas, kerfPiezaSobrante, kerfBordeExterior,
      margenes.left, margenes.right, margenes.top, margenes.bottom
    ];
    if(!valores.every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0)){
      return {
        ok:false,
        errores:['Kerf y margenes: todos los valores deben ser numeros finitos mayores o iguales que 0.'],
        configuracion:resuelta
      };
    }
    return {
      ok:true,
      errores:[],
      kerf,
      kerfEntrePiezas,
      kerfPiezaSobrante,
      kerfBordeExterior,
      margenes,
      configuracion:resuelta,
      fuentes
    };
  }

  window.ProyCutHierarchicalConfig = {
    NIVELES_CONFIGURACION_ETAPA4,
    CLAVES_PROHIBIDAS_CONFIGURACION_ETAPA4,
    REGLAS_CONFIGURACION_ETAPA4,
    CONFIGURACION_SISTEMA_ETAPA4,
    CONFIGURACION_BAMTECK_ETAPA4,
    configuracionesEtapa4,
    esObjetoPlanoConfiguracion,
    clonarValorConfiguracion,
    combinarConfiguraciones,
    obtenerValorConfiguracion,
    validarConfiguracionEtapa4,
    resolverConfiguracionJerarquica,
    resolverValorPorJerarquia,
    leerNumeroConfiguracionCorte,
    obtenerControlesMargenesExteriores,
    actualizarControlesMargenesExteriores,
    crearConfiguracionProyectoCorteActual,
    fuentesConfiguracionCorteActual,
    mensajesParametrosCorte,
    resolverParametrosCorteEtapa4
  };
})();
