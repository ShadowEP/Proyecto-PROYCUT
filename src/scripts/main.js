(function(){
  const {
    fmt,
    fmtMoney,
    normalizarMetrosLinealesParaPresentacion,
    argbDesdeHex,
    fuenteACss,
    fuenteAExcel
  } = window.ProyCutFormat;

  const {
    validarNumeroEntrada,
    validarCantidad,
    validarMedida,
    validarPrecio
  } = window.ProyCutValidation;

  const LIMITES = window.ProyCutLimits;

  const {
    normalizarSkuManual,
    normalizarNombreComponente,
    normalizarNombreMaterialImportado,
    normalizarGirarCSV,
    esValorAfirmativo
  } = window.ProyCutTextNormalization;

  const {
    separarLineaCSV
  } = window.ProyCutCSV;

  const {
    ENCABEZADO_FORMATO
  } = window.ProyCutProjectFormat;

  let BOARD_W = 2440; // largo -> eje X
  let BOARD_H = 1220; // ancho -> eje Y
  let pieceCounter = 0;

  const state = {
    materiales: [{sku:'', nombre:'Melamina de 15mm', precio:750, largo:2440, ancho:1220, espesor:15}],
    tapacantos: [{sku:'', nombre:'PVC 0.4mm', precio:10.5}],
    componentes: [{sku:'', producto:'', precio:0}],
    componentesProyecto: [], // componentes del catalogo ya agregados a este proyecto en especifico, con su cantidad
    boards: [], // resultado tras optimizar, uno por tablero (con .material)
    activeTab: 0,
    ultimoTotal: 0,
    ultimoReporte: null // copia de los datos del reporte de precio, para que "Exportar" use los mismos numeros
  };

  // ---------- Etapa 2D-A: identidad interna y SKU automatico de catalogos ----------
  const CONFIGURACION_SKU_CATALOGO = Object.freeze({
    material:{propiedad:'materiales', prefijo:'T'},
    componente:{propiedad:'componentes', prefijo:'H'},
    tapacanto:{propiedad:'tapacantos', prefijo:'E'}
  });
  const consecutivosSkuCatalogo = {material:0, componente:0, tapacanto:0};
  const ORIGENES_SKU_CATALOGO = Object.freeze([
    'automatico', 'manual', 'importado', 'woocommerce', 'shopify', 'odoo'
  ]);
  let consecutivoIdInternoCatalogo = 0;

  function configuracionSkuCategoria(categoria){
    const config = CONFIGURACION_SKU_CATALOGO[categoria];
    if(!config) throw new Error('Categoria de catalogo no valida: ' + categoria + '.');
    return config;
  }

  function crearIdInternoCatalogo(categoria, catalogos){
    configuracionSkuCategoria(categoria);
    const origen = catalogos || state;
    const usados = new Set();
    Object.keys(CONFIGURACION_SKU_CATALOGO).forEach(tipo => {
      const propiedad = CONFIGURACION_SKU_CATALOGO[tipo].propiedad;
      (origen[propiedad] || []).forEach(registro => {
        if(registro && typeof registro.idInterno === 'string' && registro.idInterno.trim()){
          usados.add(registro.idInterno);
        }
      });
    });
    let id = '';
    do {
      consecutivoIdInternoCatalogo++;
      if(typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'){
        id = 'catalogo-' + crypto.randomUUID();
      } else {
        id = 'catalogo-' + Date.now().toString(36) + '-' +
          consecutivoIdInternoCatalogo.toString(36) + '-' +
          Math.random().toString(36).slice(2,10);
      }
    } while(usados.has(id));
    return id;
  }

  function asegurarIdentidadInternaCatalogos(catalogos){
    const origen = catalogos || state;
    const usados = new Set();
    Object.keys(CONFIGURACION_SKU_CATALOGO).forEach(categoria => {
      const propiedad = configuracionSkuCategoria(categoria).propiedad;
      (origen[propiedad] || []).forEach(registro => {
        const idActual = registro && typeof registro.idInterno === 'string'
          ? registro.idInterno.trim()
          : '';
        if(idActual && !usados.has(idActual)){
          registro.idInterno = idActual;
          usados.add(idActual);
          return;
        }
        registro.idInterno = crearIdInternoCatalogo(categoria, origen);
        usados.add(registro.idInterno);
      });
    });
    return origen;
  }

  function actualizarMetadatosSku(registro, origen){
    if(!ORIGENES_SKU_CATALOGO.includes(origen)) return;
    registro.skuOrigen = origen;
    registro.skuActualizadoEn = new Date().toISOString();
  }

  function inicializarConsecutivosSku(catalogos){
    const origen = catalogos || state;
    Object.keys(CONFIGURACION_SKU_CATALOGO).forEach(categoria => {
      const config = configuracionSkuCategoria(categoria);
      const patron = new RegExp('^' + config.prefijo + '-(\\d{6})$');
      let maximo = consecutivosSkuCatalogo[categoria] || 0;
      (origen[config.propiedad] || []).forEach(registro => {
        const coincidencia = normalizarSkuManual(registro.sku).match(patron);
        if(coincidencia) maximo = Math.max(maximo, Number(coincidencia[1]));
      });
      consecutivosSkuCatalogo[categoria] = maximo;
    });
  }

  function generarSkuAutomatico(categoria, catalogos, reservados){
    const origen = catalogos || state;
    const config = configuracionSkuCategoria(categoria);
    inicializarConsecutivosSku(origen);
    const usados = new Set((origen[config.propiedad] || []).map(r => normalizarSkuManual(r.sku)).filter(Boolean));
    (reservados || []).forEach(sku => usados.add(normalizarSkuManual(sku)));
    let candidato = '';
    do {
      consecutivosSkuCatalogo[categoria]++;
      candidato = config.prefijo + '-' + String(consecutivosSkuCatalogo[categoria]).padStart(6, '0');
    } while(usados.has(candidato));
    return candidato;
  }

  function completarSkuVaciosCatalogos(catalogos){
    const origen = catalogos || state;
    inicializarConsecutivosSku(origen);
    Object.keys(CONFIGURACION_SKU_CATALOGO).forEach(categoria => {
      const config = configuracionSkuCategoria(categoria);
      (origen[config.propiedad] || []).forEach(registro => {
        if(!normalizarSkuManual(registro.sku)){
          registro.sku = generarSkuAutomatico(categoria, origen);
          actualizarMetadatosSku(registro, 'automatico');
        } else {
          registro.sku = normalizarSkuManual(registro.sku);
          if(!ORIGENES_SKU_CATALOGO.includes(registro.skuOrigen)){
            registro.skuOrigen = 'manual';
          }
        }
      });
    });
    return origen;
  }

  function crearRegistroCatalogo(categoria, datos, catalogos){
    const origen = catalogos || state;
    const registro = Object.assign({}, datos || {}, {
      idInterno:crearIdInternoCatalogo(categoria, origen),
      sku:normalizarSkuManual((datos || {}).sku)
    });
    if(!registro.sku){
      registro.sku = generarSkuAutomatico(categoria, origen);
      actualizarMetadatosSku(registro, 'automatico');
    } else if(!ORIGENES_SKU_CATALOGO.includes(registro.skuOrigen)){
      actualizarMetadatosSku(registro, 'manual');
    }
    return registro;
  }

  function prepararSkuCatalogo(categoria, registros, valoresSku, catalogos){
    configuracionSkuCategoria(categoria);
    const normalizados = (valoresSku || []).map(normalizarSkuManual);
    if(normalizados.length !== registros.length){
      return {ok:false, error:'No fue posible leer todos los SKU del catalogo.'};
    }
    const manuales = new Set();
    for(let i=0; i<normalizados.length; i++){
      const sku = normalizados[i];
      if(!sku) continue;
      if(manuales.has(sku)){
        return {
          ok:false,
          error:'El SKU "' + sku + '" esta duplicado. Cada registro de esta categoria debe tener un SKU unico.'
        };
      }
      manuales.add(sku);
    }
    const preparados = normalizados.slice();
    for(let i=0; i<preparados.length; i++){
      if(!preparados[i]){
        preparados[i] = generarSkuAutomatico(categoria, catalogos, manuales);
        manuales.add(preparados[i]);
      }
    }
    return {ok:true, valores:preparados};
  }

  function guardarSkuCatalogoDesdeTabla(categoria){
    const config = configuracionSkuCategoria(categoria);
    const selectores = {
      material:'.mat-sku',
      componente:'.comp-sku',
      tapacanto:'.tapa-sku'
    };
    const registros = state[config.propiedad];
    const inputs = Array.from(document.querySelectorAll(selectores[categoria]));
    const preparado = prepararSkuCatalogo(
      categoria,
      registros,
      inputs.map(input => input.value),
      state
    );
    if(!preparado.ok){
      alert(preparado.error);
      return false;
    }
    preparado.valores.forEach((sku, i) => {
      const teniaEdicion = Object.prototype.hasOwnProperty.call(registros[i], '_skuAntesEdicion');
      const skuAnterior = normalizarSkuManual(
        teniaEdicion ? registros[i]._skuAntesEdicion : registros[i].sku
      );
      const skuEsNuevoAutomatico = !normalizarSkuManual(registros[i].sku) && !!sku;
      registros[i].sku = sku;
      if(skuEsNuevoAutomatico){
        actualizarMetadatosSku(registros[i], 'automatico');
      } else if(teniaEdicion){
        actualizarMetadatosSku(registros[i], 'manual');
      }
      if(categoria === 'componente'){
        state.componentesProyecto.forEach(referencia => {
          const coincideId = referencia.catalogoIdInterno &&
            referencia.catalogoIdInterno === registros[i].idInterno;
          const coincideLegado = !referencia.catalogoIdInterno && (
            (skuAnterior && normalizarSkuManual(referencia.sku) === skuAnterior) ||
            (!skuAnterior && String(referencia.producto || '') === String(registros[i].producto || ''))
          );
          if(coincideId || coincideLegado){
            referencia.catalogoIdInterno = registros[i].idInterno;
            referencia.sku = sku;
          }
        });
      }
      delete registros[i]._skuAntesEdicion;
    });
    if(categoria === 'material') renderMateriales();
    if(categoria === 'tapacanto') renderTapacantos();
    if(categoria === 'componente') renderComponentes();
    if(categoria === 'componente') renderComponentesProyecto();
    return true;
  }

  function registrarEventosSkuCatalogo(selector, registros){
    document.querySelectorAll(selector).forEach(input => {
      input.addEventListener('input', evento => {
        const registro = registros[Number(evento.target.dataset.i)];
        if(!registro) return;
        if(!Object.prototype.hasOwnProperty.call(registro, '_skuAntesEdicion')){
          Object.defineProperty(registro, '_skuAntesEdicion', {
            value:registro.sku,
            writable:true,
            configurable:true,
            enumerable:false
          });
        }
        registro.sku = evento.target.value;
        actualizarMetadatosSku(registro, 'manual');
      });
      input.addEventListener('blur', evento => {
        const registro = registros[Number(evento.target.dataset.i)];
        if(!registro) return;
        const normalizado = normalizarSkuManual(evento.target.value);
        evento.target.value = normalizado;
        registro.sku = normalizado;
        actualizarMetadatosSku(registro, 'manual');
      });
    });
  }

  asegurarIdentidadInternaCatalogos(state);
  inicializarConsecutivosSku(state);
  completarSkuVaciosCatalogos(state);

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

  function calcularRectanguloUtilTablero(boardW, boardH, margenes){
    const m = margenes || {left:0, right:0, top:0, bottom:0};
    const valores = [boardW, boardH, m.left, m.right, m.top, m.bottom];
    if(!valores.every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0)){
      return {ok:false, error:'Las medidas del tablero y sus margenes deben ser numeros finitos no negativos.'};
    }
    const w = boardW - m.left - m.right;
    const h = boardH - m.top - m.bottom;
    if(!(w > 0) || !(h > 0)){
      return {ok:false, error:'Los margenes consumen todo el tablero; el area util debe tener ancho y alto mayores que 0.'};
    }
    return {
      ok:true,
      rect:{x:m.left, y:m.top, w, h},
      margenes:{left:m.left, right:m.right, top:m.top, bottom:m.bottom}
    };
  }

  // Los margenes se aplican primero. El kerf exterior, cuando esta habilitado, se reserva despues
  // hacia adentro en cada borde del area util, sin alterar las dimensiones fisicas del tablero.
  function calcularRectanguloColocacion(areaUtil, kerfBordeExterior){
    const area = areaUtil || {};
    const kerf = Number.isFinite(kerfBordeExterior) ? kerfBordeExterior : NaN;
    const valores = [area.x, area.y, area.w, area.h, kerf];
    if(!valores.every(v => typeof v === 'number' && Number.isFinite(v)) || kerf < 0){
      return {ok:false, error:'El area util y el kerf exterior deben ser numeros finitos no negativos.'};
    }
    const w = area.w - kerf * 2;
    const h = area.h - kerf * 2;
    if(!(w > 0) || !(h > 0)){
      return {ok:false, error:'El kerf exterior consume toda el area util del tablero.'};
    }
    return {ok:true, rect:{x:area.x+kerf, y:area.y+kerf, w, h}};
  }

  function obtenerAreaColocacionBoard(board){
    return board.areaColocacion || board.areaUtil || {
      x:0, y:0, w:board.boardW, h:board.boardH
    };
  }

  // Esta huella es exclusivamente provisional para colocar piezas: reserva kerf solo hacia los
  // huecos donde posteriormente puede colocarse otra pieza. Los sobrantes se clasifican despues,
  // desde las posiciones finales, y no reutilizan esta huella provisional.
  function calcularHuellaEnRectangulo(opcion, rect, kerf){
    const EPS = 0.001;
    const sobraW = rect.w - opcion.w;
    const sobraH = rect.h - opcion.h;
    if(sobraW < -EPS || sobraH < -EPS) return null;
    const fw = opcion.w + (sobraW > EPS ? kerf : 0);
    const fh = opcion.h + (sobraH > EPS ? kerf : 0);
    if(fw > rect.w + EPS || fh > rect.h + EPS) return null;
    return {...opcion, fw, fh};
  }

  function capacidadLinealConKerf(disponible, medida, kerf){
    if(!(disponible >= medida) || !(medida > 0)) return 0;
    if(kerf === 0) return Math.floor(disponible / medida);
    return Math.floor((disponible + kerf) / (medida + kerf));
  }

  function obtenerKerfMaterial(piezas, parametrosProyecto){
    const inicial = {
      valor:parametrosProyecto.kerf,
      entrePiezas:parametrosProyecto.kerfEntrePiezas,
      piezaSobrante:parametrosProyecto.kerfPiezaSobrante,
      bordeExterior:parametrosProyecto.kerfBordeExterior
    };
    return piezas.reduce((resultado, pieza) => ({
      valor:Math.max(
        resultado.valor,
        Number.isFinite(pieza.kerfEfectivo) ? pieza.kerfEfectivo : inicial.valor
      ),
      entrePiezas:Math.max(
        resultado.entrePiezas,
        Number.isFinite(pieza.kerfEntrePiezasEfectivo)
          ? pieza.kerfEntrePiezasEfectivo
          : inicial.entrePiezas
      ),
      piezaSobrante:Math.max(
        resultado.piezaSobrante,
        Number.isFinite(pieza.kerfPiezaSobranteEfectivo)
          ? pieza.kerfPiezaSobranteEfectivo
          : inicial.piezaSobrante
      ),
      bordeExterior:Math.max(
        resultado.bordeExterior,
        Number.isFinite(pieza.kerfBordeExteriorEfectivo)
          ? pieza.kerfBordeExteriorEfectivo
          : inicial.bordeExterior
      )
    }), inicial);
  }

  function textoSeguroParaExcel(valor){
    const texto = String(valor === null || valor === undefined ? '' : valor);
    if(/^\s*[=+\-@]/.test(texto)) return "'" + texto;
    return texto;
  }

  function resumenErrores(errores, maximo){
    const limite = maximo || 8;
    const visibles = errores.slice(0, limite);
    const restantes = errores.length - visibles.length;
    return visibles.join('\n') + (restantes > 0 ? '\n... y ' + restantes + ' error' + (restantes===1?'':'es') + ' mas.' : '');
  }

  // medida de tablero que se usa como valor inicial para un material nuevo (sea el que se agrega
  // con "+ Agregar material" o el que se crea al vuelo desde la tabla de piezas): toma lo que haya
  // en "Largo del tablero" / "Ancho del tablero" (Ajustes de parametros de corte), o 2440x1220 si
  // esos campos todavia no existen o estan vacios.
  function obtenerMedidaTableroDefault(){
    const inLargo = document.getElementById('tableroLargo');
    const inAncho = document.getElementById('tableroAncho');
    const largo = inLargo ? (parseFloat(inLargo.value) || 2440) : 2440;
    const ancho = inAncho ? (parseFloat(inAncho.value) || 1220) : 1220;
    return {largo, ancho};
  }
  // medida del tablero/placa configurada para un material especifico (columnas "Largo (mm)" /
  // "Ancho (mm)" de "Placas y tableros"); si ese material no existe o no tiene medida propia,
  // regresa la medida por defecto (Ajustes de parametros de corte).
  function medidaTableroDeMaterial(nombreMaterial){
    const cfg = state.materiales.find(m => m.nombre === nombreMaterial);
    if(cfg){
      if(cfg.largo > 0){
        if(cfg.ancho > 0) return {largo: cfg.largo, ancho: cfg.ancho};
      }
    }
    return obtenerMedidaTableroDefault();
  }

  // ---------- Config: materiales / tapacantos / componentes ----------
  function renderMateriales(){
    const tbody = document.querySelector('#tablaMateriales tbody');
    tbody.innerHTML = '';
    state.materiales.forEach((m, i) => {
      const tr = document.createElement('tr');
      const crearCeldaConInput = (tipo, clase, valor, opciones = {}) => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = tipo;
        input.dataset.i = i;
        input.className = clase;
        input.value = valor ?? '';
        if(opciones.min !== undefined) input.min = opciones.min;
        if(opciones.step !== undefined) input.step = opciones.step;
        if(opciones.ancho) input.style.width = opciones.ancho;
        td.appendChild(input);
        return td;
      };
      const medidaDefault = obtenerMedidaTableroDefault();
      tr.appendChild(crearCeldaConInput('text', 'mat-sku', m.sku || ''));
      tr.appendChild(crearCeldaConInput('text', 'mat-nombre', m.nombre));
      tr.appendChild(crearCeldaConInput('number', 'mat-largo', m.largo || medidaDefault.largo, { min: 1, step: 1, ancho: '90px' }));
      tr.appendChild(crearCeldaConInput('number', 'mat-ancho', m.ancho || medidaDefault.ancho, { min: 1, step: 1, ancho: '90px' }));
      tr.appendChild(crearCeldaConInput('number', 'mat-espesor', m.espesor || 15, { min: 0, step: 1, ancho: '80px' }));
      tr.appendChild(crearCeldaConInput('number', 'mat-precio', m.precio, { min: 0, step: 1 }));
      const tdAcciones = document.createElement('td');
      if(state.materiales.length > 1){
        const botonQuitar = document.createElement('button');
        botonQuitar.className = 'btn danger mat-del';
        botonQuitar.dataset.i = i;
        botonQuitar.textContent = 'Quitar';
        tdAcciones.appendChild(botonQuitar);
      }
      tr.appendChild(tdAcciones);
      tbody.appendChild(tr);
    });
    registrarEventosSkuCatalogo('.mat-sku', state.materiales);
    tbody.querySelectorAll('.mat-nombre').forEach(inp => inp.addEventListener('input', e => {
      state.materiales[e.target.dataset.i].nombre = e.target.value; refrescarSelects(); recalcularDebounced();
    }));
    tbody.querySelectorAll('.mat-largo').forEach(inp => inp.addEventListener('input', e => {
      state.materiales[e.target.dataset.i].largo = parseFloat(e.target.value)||0; recalcularDebounced();
    }));
    tbody.querySelectorAll('.mat-ancho').forEach(inp => inp.addEventListener('input', e => {
      state.materiales[e.target.dataset.i].ancho = parseFloat(e.target.value)||0; recalcularDebounced();
    }));
    tbody.querySelectorAll('.mat-espesor').forEach(inp => inp.addEventListener('input', e => {
      state.materiales[e.target.dataset.i].espesor = parseFloat(e.target.value)||0;
    }));
    tbody.querySelectorAll('.mat-precio').forEach(inp => inp.addEventListener('input', e => {
      state.materiales[e.target.dataset.i].precio = parseFloat(e.target.value)||0; recalcularDebounced();
    }));
    tbody.querySelectorAll('.mat-del').forEach(btn => btn.addEventListener('click', e => {
      state.materiales.splice(e.target.dataset.i,1); renderMateriales(); refrescarSelects(); recalcularDebounced();
    }));
  }

  function renderTapacantos(){
    const tbody = document.querySelector('#tablaTapacantos tbody');
    tbody.innerHTML = '';
    state.tapacantos.forEach((t, i) => {
      const tr = document.createElement('tr');
      const crearCeldaConInput = (tipo, clase, valor, opciones = {}) => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = tipo;
        input.dataset.i = i;
        input.className = clase;
        input.value = valor ?? '';
        if(opciones.min !== undefined) input.min = opciones.min;
        if(opciones.step !== undefined) input.step = opciones.step;
        td.appendChild(input);
        return td;
      };
      tr.appendChild(crearCeldaConInput('text', 'tapa-sku', t.sku || ''));
      tr.appendChild(crearCeldaConInput('text', 'tapa-nombre', t.nombre));
      tr.appendChild(crearCeldaConInput('number', 'tapa-precio', t.precio, { min: 0, step: 0.5 }));
      const tdAcciones = document.createElement('td');
      if(state.tapacantos.length > 1){
        const botonQuitar = document.createElement('button');
        botonQuitar.className = 'btn danger tapa-del';
        botonQuitar.dataset.i = i;
        botonQuitar.textContent = 'Quitar';
        tdAcciones.appendChild(botonQuitar);
      }
      tr.appendChild(tdAcciones);
      tbody.appendChild(tr);
    });
    registrarEventosSkuCatalogo('.tapa-sku', state.tapacantos);
    tbody.querySelectorAll('.tapa-nombre').forEach(inp => inp.addEventListener('input', e => {
      state.tapacantos[e.target.dataset.i].nombre = e.target.value; refrescarSelects(); recalcularDebounced();
    }));
    tbody.querySelectorAll('.tapa-precio').forEach(inp => inp.addEventListener('input', e => {
      state.tapacantos[e.target.dataset.i].precio = parseFloat(e.target.value)||0; recalcularDebounced();
    }));
    tbody.querySelectorAll('.tapa-del').forEach(btn => btn.addEventListener('click', e => {
      state.tapacantos.splice(e.target.dataset.i,1); renderTapacantos(); refrescarSelects(); recalcularDebounced();
    }));
  }

  function renderComponentes(){
    const tbody = document.querySelector('#tablaComponentes tbody');
    tbody.innerHTML = '';
    state.componentes.forEach((c, i) => {
      const tr = document.createElement('tr');
      const crearCeldaConInput = (tipo, clase, valor, opciones = {}) => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = tipo;
        input.dataset.i = i;
        input.className = clase;
        input.value = valor ?? '';
        if(opciones.min !== undefined) input.min = opciones.min;
        if(opciones.step !== undefined) input.step = opciones.step;
        td.appendChild(input);
        return td;
      };
      tr.appendChild(crearCeldaConInput('text', 'comp-sku', c.sku || ''));
      tr.appendChild(crearCeldaConInput('text', 'comp-producto', c.producto || ''));
      tr.appendChild(crearCeldaConInput('number', 'comp-precio', c.precio, { min: 0, step: 0.5 }));
      const tdAcciones = document.createElement('td');
      if(state.componentes.length > 1){
        const botonQuitar = document.createElement('button');
        botonQuitar.className = 'btn danger comp-del';
        botonQuitar.dataset.i = i;
        botonQuitar.textContent = 'Quitar';
        tdAcciones.appendChild(botonQuitar);
      }
      tr.appendChild(tdAcciones);
      tbody.appendChild(tr);
    });
    registrarEventosSkuCatalogo('.comp-sku', state.componentes);
    tbody.querySelectorAll('.comp-producto').forEach(inp => inp.addEventListener('input', e => {
      state.componentes[e.target.dataset.i].producto = e.target.value;
    }));
    tbody.querySelectorAll('.comp-precio').forEach(inp => inp.addEventListener('input', e => {
      state.componentes[e.target.dataset.i].precio = parseFloat(e.target.value)||0;
    }));
    tbody.querySelectorAll('.comp-del').forEach(btn => btn.addEventListener('click', e => {
      state.componentes.splice(e.target.dataset.i,1); renderComponentes();
    }));
  }

  // ---------- Componentes del proyecto (los que se usan en ESTE trabajo, con su cantidad) ----------
  // se eligen del catalogo de Componentes y se agregan al precio del proyecto despues del material.
  function etiquetaComponente(c){
    const nombre = (c.producto || '').trim() || '(sin nombre)';
    const sku = (c.sku || '').trim();
    return sku ? (nombre + ' [' + sku + ']') : nombre;
  }
  function renderComponentesProyecto(){
    const tbody = document.querySelector('#tablaComponentesProyecto tbody');
    tbody.innerHTML = '';
    state.componentesProyecto.forEach((c, i) => {
      const subtotal = (c.precio || 0) * (c.cantidad || 0);
      const tr = document.createElement('tr');
      const tdSku = document.createElement('td');
      tdSku.textContent = c.sku || '';
      tr.appendChild(tdSku);
      const tdProducto = document.createElement('td');
      tdProducto.textContent = c.producto || '(sin nombre)';
      tr.appendChild(tdProducto);
      const tdCantidad = document.createElement('td');
      const inputCantidad = document.createElement('input');
      inputCantidad.type = 'number';
      inputCantidad.className = 'cp-cant';
      inputCantidad.dataset.i = i;
      inputCantidad.min = 1;
      inputCantidad.value = c.cantidad;
      inputCantidad.style.width = '60px';
      tdCantidad.appendChild(inputCantidad);
      tr.appendChild(tdCantidad);
      const tdPrecio = document.createElement('td');
      tdPrecio.textContent = fmtMoney(c.precio || 0);
      tr.appendChild(tdPrecio);
      const tdSubtotal = document.createElement('td');
      tdSubtotal.className = 'cp-subtotal';
      tdSubtotal.textContent = fmtMoney(subtotal);
      tr.appendChild(tdSubtotal);
      const tdAcciones = document.createElement('td');
      const botonQuitar = document.createElement('button');
      botonQuitar.className = 'btn danger cp-del';
      botonQuitar.dataset.i = i;
      botonQuitar.textContent = 'Quitar';
      tdAcciones.appendChild(botonQuitar);
      tr.appendChild(tdAcciones);
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('.cp-cant').forEach(inp => inp.addEventListener('input', e => {
      const i = e.target.dataset.i;
      state.componentesProyecto[i].cantidad = parseInt(e.target.value, 10) || 0;
      const fila = e.target.closest('tr');
      const subtotal = (state.componentesProyecto[i].precio || 0) * state.componentesProyecto[i].cantidad;
      fila.querySelector('.cp-subtotal').textContent = fmtMoney(subtotal);
      recalcularDebounced();
    }));
    tbody.querySelectorAll('.cp-del').forEach(btn => btn.addEventListener('click', e => {
      state.componentesProyecto.splice(e.target.dataset.i, 1);
      renderComponentesProyecto();
      recalcularDebounced();
    }));
  }
  // "+ Agregar componentes" y "Importar" son subpaneles que comparten el mismo espacio debajo de
  // los botones: solo uno se queda abierto a la vez, asi que al abrir uno se cierra el otro.
  document.getElementById('toggleAgregarComponente').addEventListener('click', () => {
    const panel = document.getElementById('agregarComponentePanel');
    const seVaAbrir = !panel.classList.contains('open');
    document.getElementById('importarPanel').classList.remove('open');
    panel.classList.toggle('open', seVaAbrir);
  });
  // "Importar" ahora se despliega como un subpanel dentro del propio formulario de piezas
  // (igual que "+ Agregar componentes"), en vez de abrir una pantalla completa que oculta el
  // resto de la interfaz.
  document.getElementById('toggleImportar').addEventListener('click', () => {
    const panel = document.getElementById('importarPanel');
    const seVaAbrir = !panel.classList.contains('open');
    document.getElementById('agregarComponentePanel').classList.remove('open');
    panel.classList.toggle('open', seVaAbrir);
  });
  // menu desplegable del boton "Archivo" (agrupa Exportar formato / Importar en un solo boton).
  document.getElementById('btnArchivo').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('archivoMenu').classList.toggle('abierto');
  });
  document.querySelectorAll('.archivo-opcion').forEach(op => {
    op.addEventListener('click', () => {
      document.getElementById('archivoMenu').classList.remove('abierto');
    });
  });
  document.addEventListener('click', (e) => {
    const menuArchivo = document.getElementById('archivoMenu');
    if(!menuArchivo.classList.contains('abierto')) return;
    const wrapArchivo = document.querySelector('.archivo-menu-wrap');
    if(wrapArchivo.contains(e.target)) return;
    menuArchivo.classList.remove('abierto');
  });
  const nuevoComponenteInput = document.getElementById('nuevoComponenteInput');
  attachComboBuscable(nuevoComponenteInput, () => state.componentes.map(etiquetaComponente), (seleccion) => {
    nuevoComponenteInput.value = seleccion;
    nuevoComponenteInput.dataset.valor = seleccion;
  }, {tipo:'componente'});
  document.getElementById('agregarComponenteProyectoBtn').addEventListener('click', () => {
    const etiqueta = nuevoComponenteInput.dataset.valor || '';
    const comp = state.componentes.find(c => etiquetaComponente(c) === etiqueta);
    if(!comp) return;
    const cantidadValidada = validarCantidad(document.getElementById('nuevoComponenteCant').value, 'Cantidad del componente');
    if(!cantidadValidada.ok){
      alert(cantidadValidada.error);
      return;
    }
    const cantidad = cantidadValidada.valor;
    state.componentesProyecto.push({
      catalogoIdInterno:comp.idInterno,
      sku:comp.sku,
      producto:comp.producto,
      precio:comp.precio,
      cantidad:cantidad
    });
    renderComponentesProyecto();
    recalcularDebounced();
    nuevoComponenteInput.value = '';
    nuevoComponenteInput.dataset.valor = '';
    document.getElementById('nuevoComponenteCant').value = 1;
  });

  // Enter en "Componente" salta a "Cantidad" (como en las demas tablas); Enter en "Cantidad" es
  // el ultimo box de esta mini-linea, asi que dispara el boton "Agregar" y regresa el foco al
  // buscador de Componente (que ya quedo vacio) para seguir agregando otro de corrido.
  // Nota: el buscador ya tiene su propio manejo de Enter (elegir de la lista / crear nuevo); ese
  // listener corre primero y este corre despues, solo para mover el foco.
  const nuevoComponenteCantInput = document.getElementById('nuevoComponenteCant');
  nuevoComponenteInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      nuevoComponenteCantInput.focus();
      nuevoComponenteCantInput.select();
    }
  });
  nuevoComponenteCantInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      e.preventDefault();
      document.getElementById('agregarComponenteProyectoBtn').click();
      nuevoComponenteInput.focus();
    }
  });

  // pone el foco (y selecciona el texto) en el ultimo input de una clase dada, para que al
  // agregar una fila el usuario pueda escribir el SKU de inmediato sin tener que dar clic.
  function enfocarUltimoInput(claseInput){
    const inputs = document.querySelectorAll('.' + claseInput);
    if(inputs.length === 0) return;
    const ultimo = inputs[inputs.length - 1];
    ultimo.focus();
    if(typeof ultimo.select === 'function') ultimo.select();
  }

  document.getElementById('addMaterial').addEventListener('click', () => {
    const medida = obtenerMedidaTableroDefault();
    state.materiales.push(crearRegistroCatalogo('material', {sku:'', nombre:'Nuevo material', precio:700, largo:medida.largo, ancho:medida.ancho, espesor:15}));
    renderMateriales(); refrescarSelects(); recalcularDebounced();
    enfocarUltimoInput('mat-sku');
  });
  document.getElementById('addTapacanto').addEventListener('click', () => {
    state.tapacantos.push(crearRegistroCatalogo('tapacanto', {sku:'', nombre:'Nuevo tipo', precio:10}));
    renderTapacantos(); refrescarSelects(); recalcularDebounced();
    enfocarUltimoInput('tapa-sku');
  });
  document.getElementById('addComponente').addEventListener('click', () => {
    state.componentes.push(crearRegistroCatalogo('componente', {sku:'', producto:'', precio:0}));
    renderComponentes();
    enfocarUltimoInput('comp-sku');
  });

  // menu del encabezado: "Materiales" agrupa 3 sub-pestanas (Placas y tableros, Cubre canto,
  // Componentes) y "Preferencias" agrupa 2 (Ajuste de la interfaz, Ajustes de parametros de
  // corte); cada uno despliega su propio listado de texto justo debajo. Solo un panel puede
  // estar abierto a la vez, y mientras alguno lo esta se oculta el resto de la interfaz (piezas,
  // diagrama, precio) para dejar la pantalla enfocada en el panel. El logo de la empresa no tiene
  // panel propio: es el que regresa a la pantalla principal (piezas + diagrama + precio).
  const gruposPrincipales = [
    ['toggleEstilo', 'estiloPanel'],
    ['toggleConfig', 'configPanel']
  ];
  const subMaterial = [
    ['toggleTableros', 'tablerosPanel'],
    ['toggleCubrecanto', 'cubrecantoPanel'],
    ['toggleComponentes', 'componentesPanel']
  ];
  const todosLosPaneles = gruposPrincipales.map(par => par[1]).concat(subMaterial.map(par => par[1]));

  function actualizarVisibilidadInterfaz(){
    const algunoAbierto = todosLosPaneles.some(id => document.getElementById(id).classList.contains('open'));
    document.querySelector('.split').classList.toggle('oculto', algunoAbierto);
  }

  function cerrarTodoElMenu(){
    gruposPrincipales.forEach(par => {
      document.getElementById(par[1]).classList.remove('open');
      document.getElementById(par[0]).classList.remove('active');
    });
    subMaterial.forEach(par => {
      document.getElementById(par[1]).classList.remove('open');
      document.getElementById(par[0]).classList.remove('active');
    });
    document.getElementById('toggleMaterialesMenu').classList.remove('active');
    document.getElementById('togglePreferenciasMenu').classList.remove('active');
    cerrarMaterialesDropdown();
    cerrarPreferenciasDropdown();
    cerrarAyudaDropdown();
    cerrarHamburguesa();
  }

  document.getElementById('brandHome').addEventListener('click', () => {
    cerrarTodoElMenu();
    actualizarVisibilidadInterfaz();
  });

  gruposPrincipales.forEach(par => {
    const btnId = par[0], panelId = par[1];
    document.getElementById(btnId).addEventListener('click', () => {
      const panel = document.getElementById(panelId);
      const estabaAbierto = panel.classList.contains('open');
      cerrarTodoElMenu();
      if(!estabaAbierto){
        panel.classList.add('open');
        document.getElementById(btnId).classList.add('active');
        document.getElementById('togglePreferenciasMenu').classList.add('active');
      }
      actualizarVisibilidadInterfaz();
    });
  });

  subMaterial.forEach(par => {
    const btnId = par[0], panelId = par[1];
    document.getElementById(btnId).addEventListener('click', () => {
      // se cierran TODOS los paneles (incluyendo los de "Preferencias", no solo los otros de
      // "Materiales") antes de abrir este, para que nunca queden dos paneles abiertos a la vez.
      const panel = document.getElementById(panelId);
      const estabaAbierto = panel.classList.contains('open');
      cerrarTodoElMenu();
      if(!estabaAbierto){
        panel.classList.add('open');
        document.getElementById(btnId).classList.add('active');
        document.getElementById('toggleMaterialesMenu').classList.add('active');
      }
      actualizarVisibilidadInterfaz();
    });
  });

  // "Materiales", "Preferencias" y "Ayuda": enlaces de solo texto que despliegan un pequeno
  // listado justo debajo, en vez del icono de 3 rayitas de antes. Se cierran solos al elegir una
  // opcion, al hacer clic afuera o con la tecla Escape. Ademas son excluyentes entre si: abrir
  // uno cierra cualquier otro que haya quedado abierto (sin esto, un clic directo de un enlace a
  // otro no lo cerraba, porque cada uno detiene la propagacion del clic para no cerrarse a si
  // mismo de inmediato).
  const cerradoresMenuTexto = [];
  function crearMenuTexto(botonId, dropdownId){
    const boton = document.getElementById(botonId);
    const dropdown = document.getElementById(dropdownId);
    function cerrar(){
      dropdown.classList.remove('abierto');
      boton.setAttribute('aria-expanded', 'false');
    }
    boton.addEventListener('click', (e) => {
      e.stopPropagation();
      const abrir = !dropdown.classList.contains('abierto');
      cerradoresMenuTexto.forEach(otroCerrar => { if(otroCerrar !== cerrar) otroCerrar(); });
      dropdown.classList.toggle('abierto', abrir);
      boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    });
    dropdown.addEventListener('click', () => cerrar());
    document.addEventListener('click', (e) => {
      if(!dropdown.classList.contains('abierto')) return;
      if(dropdown.contains(e.target)) return;
      if(boton.contains(e.target)) return;
      cerrar();
    });
    cerradoresMenuTexto.push(cerrar);
    return cerrar;
  }
  const cerrarMaterialesDropdown = crearMenuTexto('toggleMaterialesMenu', 'materialesDropdown');
  const cerrarPreferenciasDropdown = crearMenuTexto('togglePreferenciasMenu', 'preferenciasDropdown');
  const cerrarAyudaDropdown = crearMenuTexto('toggleAyudaMenu', 'ayudaDropdown');

  // menu de 3 rayitas (solo visible en pantallas chicas / celulares, ver media query): colapsa
  // todo el menu de texto (Materiales, Preferencias, Ayuda, Mi cuenta) en un desplegable que se
  // abre debajo del encabezado. Se cierra solo, ademas de con su propio boton, cuando se elige
  // cualquier opcion de adentro (porque esas ya llaman a cerrarTodoElMenu / los alerts de abajo).
  const headerActionsEl = document.getElementById('headerActions');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  function cerrarHamburguesa(){
    headerActionsEl.classList.remove('abierto');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }
  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const abrir = !headerActionsEl.classList.contains('abierto');
    headerActionsEl.classList.toggle('abierto', abrir);
    hamburgerBtn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if(!headerActionsEl.classList.contains('abierto')) return;
    if(headerActionsEl.contains(e.target)) return;
    if(hamburgerBtn.contains(e.target)) return;
    cerrarHamburguesa();
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){ cerrarMaterialesDropdown(); cerrarPreferenciasDropdown(); cerrarAyudaDropdown(); cerrarHamburguesa(); }
  });

  // "Mi cuenta", "Academia" y "Centro de ayuda": todavia no hay backend/paginas propias para
  // estos, se dejan como aviso (igual que "Confirmar pedido"), para no dejar el boton sin
  // ninguna respuesta al usuario.
  document.getElementById('toggleMiCuenta').addEventListener('click', () => {
    cerrarHamburguesa();
    alert('Mi cuenta: proximamente disponible.');
  });
  document.getElementById('toggleAcademia').addEventListener('click', () => {
    cerrarHamburguesa();
    alert('Academia: proximamente disponible.');
  });
  document.getElementById('toggleCentroAyuda').addEventListener('click', () => {
    cerrarHamburguesa();
    alert('Centro de ayuda: proximamente disponible.');
  });

  // botones "Guardar": fuerzan la actualizacion inmediata (sin esperar el debounce) con todo
  // lo configurado y cierran todo el menu (panel, sub-menu de Material si aplica, etc.).
  function cerrarPanelGuardado(){
    cerrarTodoElMenu();
    actualizarVisibilidadInterfaz();
  }
  document.getElementById('guardarEstiloBtn').addEventListener('click', () => {
    clearTimeout(debounceTimer);
    recalcular();
    cerrarPanelGuardado();
  });
  document.getElementById('guardarConfigBtn').addEventListener('click', () => {
    clearTimeout(debounceTimer);
    recalcular();
    cerrarPanelGuardado();
  });
  document.getElementById('guardarTablerosBtn').addEventListener('click', () => {
    if(!guardarSkuCatalogoDesdeTabla('material')) return;
    clearTimeout(debounceTimer);
    recalcular();
    cerrarPanelGuardado();
  });
  document.getElementById('guardarCubrecantoBtn').addEventListener('click', () => {
    if(!guardarSkuCatalogoDesdeTabla('tapacanto')) return;
    clearTimeout(debounceTimer);
    recalcular();
    cerrarPanelGuardado();
  });
  document.getElementById('guardarComponentesBtn').addEventListener('click', () => {
    if(!guardarSkuCatalogoDesdeTabla('componente')) return;
    clearTimeout(debounceTimer);
    recalcular();
    cerrarPanelGuardado();
  });

  // ---------- Formato de proyecto (piezas + componentes) e Importar ----------
  const ENCABEZADO_COMPONENTES_FORMATO = ['SKU_o_codigo','Nombre_componente','Cantidad_por_proyecto','Precio_unitario_referencia'];
  const ENCABEZADO_MATERIALES_FORMATO = ['ID_interno','SKU_o_codigo','Nombre_material','Largo_mm','Ancho_mm','Espesor_mm','Precio_por_tablero'];
  const IDENTIFICADOR_FORMATO_PROYECTO = 'PROYCUT_PROJECT_FORMAT';
  const VERSION_FORMATO_PROYECTO = 1;

  // CAT-7: contrato del archivo de catalogo (Materiales + Tapacantos + Componentes,
  // sin cantidades de proyecto), independiente del formato de Piezas de arriba.
  const ENCABEZADO_TAPACANTOS_CATALOGO_FORMATO = ['ID_interno','SKU_o_codigo','Nombre_tapacanto','Precio_por_metro'];
  const ENCABEZADO_COMPONENTES_CATALOGO_FORMATO = ['ID_interno','SKU_o_codigo','Nombre_componente','Precio_referencia'];
  const IDENTIFICADOR_FORMATO_CATALOGO = 'PROYCUT_CATALOG_FORMAT';
  const VERSION_FORMATO_CATALOGO = 1;
  const COLUMNA_MARCADOR_CATALOGO = 20; // columna T, oculta en la hoja que la lleve
  const COLUMNA_VERSION_CATALOGO = 21;  // columna U, oculta en la hoja que la lleve

  // lee las piezas TAL CUAL estan en el formulario (incluye Girar, a diferencia de
  // leerPiezasParaExportar que es para el Excel de precio/diagramas), para que "Exportar
  // formato" descargue un Excel ya prellenado con lo capturado: el usuario solo tiene que
  // cambiar las medidas (u otro dato puntual) y volver a importarlo.
  function leerPiezasFormularioParaFormato(){
    const filas = [];
    document.querySelectorAll('#piezasBody tr').forEach(row => {
      const cant = parseInt(row.querySelector('.p-cant').value, 10) || 1;
      const l = parseFloat(row.querySelector('.p-l').value);
      const a = parseFloat(row.querySelector('.p-a').value);
      if(!l || !a) return;
      const girarModo = row.querySelector('.p-girar').dataset.modo || 'auto';
      const material = row.querySelector('.p-material-input').dataset.valor || '';
      const tapaTipo = row.querySelector('.p-tapatipo-input').dataset.valor || '';
      const l1 = row.querySelector('.p-l1').checked;
      const l2 = row.querySelector('.p-l2').checked;
      const a1 = row.querySelector('.p-a1').checked;
      const a2 = row.querySelector('.p-a2').checked;
      const label = row.querySelector('.p-label').value.trim();
      filas.push([
        cant, l, a, girarModo, material,
        l1 ? 'SI' : 'NO', l2 ? 'SI' : 'NO', a1 ? 'SI' : 'NO', a2 ? 'SI' : 'NO', tapaTipo, label
      ]);
    });
    return filas;
  }

  function construirLibroFormatoProyecto(ExcelJSLib, filasFormulario, componentesProyecto, materialesCatalogo){
    const wb = new ExcelJSLib.Workbook();
    wb.subject = IDENTIFICADOR_FORMATO_PROYECTO;
    wb.description = 'version: ' + VERSION_FORMATO_PROYECTO;

    const wsPiezasFormato = wb.addWorksheet('Piezas');
    wsPiezasFormato.addRow(ENCABEZADO_FORMATO);
    const filaEncabezado = wsPiezasFormato.getRow(1);
    filaEncabezado.font = {bold:true};
    filaEncabezado.eachCell(c => {
      c.fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FFE5E7EB'}};
    });
    if(filasFormulario.length){
      filasFormulario.forEach(fila => wsPiezasFormato.addRow(
        fila.map(valor => typeof valor === 'string' ? textoSeguroParaExcel(valor) : valor)
      ));
    } else {
      wsPiezasFormato.addRow([2,300,500,'auto','Melamina de 15mm','NO','NO','NO','NO','PVC 0.4mm','Lateral']);
      wsPiezasFormato.addRow(['','','','auto = automatico, normal = sin girar, rotado = girar 90','','SI o NO','SI o NO','SI o NO','SI o NO','','']);
    }
    wsPiezasFormato.columns = [
      {width:10}, {width:12}, {width:12}, {width:11}, {width:22},
      {width:7}, {width:7}, {width:7}, {width:7}, {width:18}, {width:16}
    ];
    wsPiezasFormato.getCell('M1').value = IDENTIFICADOR_FORMATO_PROYECTO;
    wsPiezasFormato.getCell('N1').value = 'version: ' + VERSION_FORMATO_PROYECTO;
    wsPiezasFormato.getColumn(13).hidden = true;
    wsPiezasFormato.getColumn(14).hidden = true;

    const wsComponentesFormato = wb.addWorksheet('Componentes');
    wsComponentesFormato.addRow(ENCABEZADO_COMPONENTES_FORMATO);
    const encabezadoComponentes = wsComponentesFormato.getRow(1);
    encabezadoComponentes.font = {bold:true};
    encabezadoComponentes.eachCell(c => {
      c.fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FFE5E7EB'}};
    });
    (componentesProyecto || []).forEach(comp => {
      const cantidad = Number(comp.cantidad);
      if(!Number.isFinite(cantidad) || !Number.isInteger(cantidad) || cantidad <= 0) return;
      wsComponentesFormato.addRow([
        textoSeguroParaExcel(comp.sku || ''),
        textoSeguroParaExcel(comp.producto || ''),
        cantidad,
        Number.isFinite(Number(comp.precio)) ? Number(comp.precio) : 0
      ]);
    });
    wsComponentesFormato.columns = [
      {width:18}, {width:30}, {width:24}, {width:26}
    ];

    const wsMaterialesFormato = wb.addWorksheet('Materiales');
    wsMaterialesFormato.addRow(ENCABEZADO_MATERIALES_FORMATO);
    const encabezadoMateriales = wsMaterialesFormato.getRow(1);
    encabezadoMateriales.font = {bold:true};
    encabezadoMateriales.eachCell(c => {
      c.fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FFE5E7EB'}};
    });
    (materialesCatalogo || []).forEach(material => {
      wsMaterialesFormato.addRow([
        textoSeguroParaExcel(material.idInterno || ''),
        textoSeguroParaExcel(material.sku || ''),
        textoSeguroParaExcel(material.nombre || ''),
        Number(material.largo),
        Number(material.ancho),
        Number(material.espesor),
        Number(material.precio)
      ]);
    });
    wsMaterialesFormato.columns = [
      {width:42}, {width:18}, {width:30}, {width:14},
      {width:14}, {width:14}, {width:22}
    ];
    return wb;
  }

  document.getElementById('descargarFormato').addEventListener('click', async () => {
    clearTimeout(debounceTimer);
    if(!recalcular()){
      alert('No se puede exportar el formato porque el proyecto contiene datos invalidos. Revisa los avisos del formulario.');
      return;
    }
    const btn = document.getElementById('descargarFormato');
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Generando...';
    try {
      const ExcelJSLib = await cargarExcelJS();
      const filasFormulario = leerPiezasFormularioParaFormato();
      const wb = construirLibroFormatoProyecto(
        ExcelJSLib,
        filasFormulario,
        state.componentesProyecto,
        state.materiales
      );
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'formato-proyecto-bamteck.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch(err){
      alert('No se pudo generar el archivo de formato: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  });

  function parsearCSV(texto){
    const lineas = texto.split(/\r\n|\n|\r/);
    const noVacias = [];
    lineas.forEach((linea, i) => {
      if(linea.trim().length > 0) noVacias.push({texto:linea, numero:i+1});
    });
    if(noVacias.length === 0) return {filas:[], errores:['El archivo CSV esta vacio.']};
    const encabezado = separarLineaCSV(noVacias[0].texto.replace(/^\uFEFF/, ''));
    const errores = [];
    if(encabezado.length !== LIMITES.csvColumnas){
      errores.push('Encabezado: se esperaban ' + LIMITES.csvColumnas + ' columnas y se encontraron ' + encabezado.length + '.');
    } else {
      ENCABEZADO_FORMATO.forEach((nombre, i) => {
        if(encabezado[i] !== nombre) errores.push('Encabezado, columna ' + (i+1) + ': se esperaba "' + nombre + '" y se encontro "' + encabezado[i] + '".');
      });
    }
    const datos = noVacias.slice(1);
    if(datos.length > LIMITES.csvFilas){
      errores.push('El CSV contiene ' + datos.length + ' filas de datos; el maximo permitido es ' + LIMITES.csvFilas + '.');
      return {filas:[], errores};
    }
    if(errores.length) return {filas:[], errores};
    const filas = datos.map(item => ({cols:separarLineaCSV(item.texto), numeroFila:item.numero}));
    return {filas, errores};
  }

  // agrega una pieza al formulario a partir de un arreglo de columnas, en el mismo orden que
  // el Excel/CSV de "Exportar formato" (Cantidad, Largo_mm, Ancho_mm, Girar, Material, L1, L2,
  // A1, A2, Tipo_tapacanto, Etiqueta). Devuelve la fila o los errores encontrados.
  function agregarPiezaDesdeColumnas(cols, numeroFila){
    const prefijo = 'Fila ' + numeroFila;
    const errores = [];
    if(!cols || cols.length !== LIMITES.csvColumnas){
      return {fila:null, cantidad:0, errores:[prefijo + ': se esperaban exactamente ' + LIMITES.csvColumnas + ' columnas y se encontraron ' + (cols ? cols.length : 0) + '.']};
    }
    const cantidadValidada = validarCantidad(cols[0], prefijo + ', Cantidad');
    const largoValidado = validarMedida(cols[1], prefijo + ', Largo_mm');
    const anchoValidado = validarMedida(cols[2], prefijo + ', Ancho_mm');
    if(!cantidadValidada.ok) errores.push(cantidadValidada.error);
    if(!largoValidado.ok) errores.push(largoValidado.error);
    if(!anchoValidado.ok) errores.push(anchoValidado.error);
    const girarModo = normalizarGirarCSV(cols[3]);
    const material = (cols[4] || '').trim();
    if(material === '') errores.push(prefijo + ', Material: el valor es obligatorio.');
    if(material !== '' && !state.materiales.some(m => m.nombre === material)){
      errores.push(prefijo + ', Material: "' + material + '" no existe en el catalogo.');
    }
    const l1 = esValorAfirmativo(cols[5]);
    const l2 = esValorAfirmativo(cols[6]);
    const a1 = esValorAfirmativo(cols[7]);
    const a2 = esValorAfirmativo(cols[8]);
    const tapaTipo = (cols[9] || '').trim();
    if(tapaTipo !== '' && !state.tapacantos.some(t => t.nombre === tapaTipo)){
      errores.push(prefijo + ', Tipo_tapacanto: "' + tapaTipo + '" no existe en el catalogo.');
    }
    const label = (cols[10] || '').trim();
    if(errores.length) return {fila:null, cantidad:0, errores};
    const fila = addPiezaRow({
      cant:cantidadValidada.valor, l:largoValidado.valor, a:anchoValidado.valor,
      girarModo:girarModo, material:material, l1:l1, l2:l2, a1:a1, a2:a2,
      tapaTipo:tapaTipo, label:label
    });
    return {fila, cantidad:cantidadValidada.valor, errores:[]};
  }

  function textoImportadoSeguro(valor){
    let texto = valor === null || valor === undefined ? '' : String(valor).trim();
    if(/^'[=+\-@]/.test(texto)) texto = texto.slice(1);
    return texto;
  }

  function valorPlanoCeldaExcel(celda){
    const valor = celda ? celda.value : null;
    if(valor === null || valor === undefined) return '';
    if(valor instanceof Date) return valor.toISOString();
    if(typeof valor === 'object'){
      if(typeof valor.text === 'string') return valor.text;
      if(Array.isArray(valor.richText)) return valor.richText.map(fragmento => fragmento.text || '').join('');
      if(Object.prototype.hasOwnProperty.call(valor, 'result')) return valor.result;
      return '';
    }
    return valor;
  }

  function validarEncabezadoHoja(ws, encabezadoEsperado, nombreHoja){
    const errores = [];
    encabezadoEsperado.forEach((nombre, indice) => {
      const valor = textoImportadoSeguro(valorPlanoCeldaExcel(ws.getRow(1).getCell(indice+1)));
      if(valor !== nombre){
        errores.push(
          nombreHoja + ', encabezado columna ' + (indice+1) +
          ': se esperaba "' + nombre + '" y se encontro "' + valor + '".'
        );
      }
    });
    return errores;
  }

  function leerRegistrosHoja(ws, numeroColumnas){
    const filas = [];
    if(!ws) return filas;
    ws.eachRow((row, numeroFila) => {
      if(numeroFila === 1) return;
      const cols = [];
      let tieneDatos = false;
      for(let c=1; c<=numeroColumnas; c++){
        const valor = valorPlanoCeldaExcel(row.getCell(c));
        if(valor !== '' && valor !== null && valor !== undefined) tieneDatos = true;
        cols.push(typeof valor === 'string' ? textoImportadoSeguro(valor) : valor);
      }
      if(tieneDatos) filas.push({cols, numeroFila});
    });
    return filas;
  }

  function leerRegistrosMaterialesHoja(ws){
    const filas = [];
    if(!ws) return filas;
    for(let numeroFila=2; numeroFila<=ws.rowCount; numeroFila++){
      const row = ws.getRow(numeroFila);
      const cols = [];
      const formulasDetectadas = [];
      let tieneDatos = false;
      for(let c=1; c<=ENCABEZADO_MATERIALES_FORMATO.length; c++){
        const celda = row.getCell(c);
        const valorOriginal = celda.value;
        if(valorOriginal && typeof valorOriginal === 'object' &&
           (Object.prototype.hasOwnProperty.call(valorOriginal, 'formula') ||
            Object.prototype.hasOwnProperty.call(valorOriginal, 'sharedFormula'))){
          formulasDetectadas.push(c);
        }
        const valor = valorPlanoCeldaExcel(celda);
        if(valor !== '' && valor !== null && valor !== undefined) tieneDatos = true;
        cols.push(typeof valor === 'string' ? textoImportadoSeguro(valor) : valor);
      }
      filas.push({
        cols,
        numeroFila,
        filaVacia:!tieneDatos,
        formulasDetectadas
      });
    }
    return filas;
  }

  function extraerProyectoDesdeLibroExcel(wb){
    const errores = [];
    const wsPiezas = wb.getWorksheet('Piezas') || wb.getWorksheet('Formato piezas') || wb.worksheets[0];
    if(!wsPiezas){
      return {filasPiezas:[], filasComponentes:[], errores:['El archivo no contiene ninguna hoja legible.'], tieneHojaComponentes:false};
    }
    const marcador = textoImportadoSeguro(valorPlanoCeldaExcel(wsPiezas.getCell('M1')));
    const textoVersion = textoImportadoSeguro(valorPlanoCeldaExcel(wsPiezas.getCell('N1')));
    if(marcador === IDENTIFICADOR_FORMATO_PROYECTO){
      const coincidenciaVersion = textoVersion.match(/^\s*version\s*:\s*(\d+)\s*$/i);
      const version = coincidenciaVersion ? Number(coincidenciaVersion[1]) : NaN;
      if(!Number.isInteger(version)){
        return {
          filasPiezas:[],
          filasComponentes:[],
          errores:['El archivo declara PROYCUT_PROJECT_FORMAT, pero su version no es valida.'],
          tieneHojaComponentes:!!wb.getWorksheet('Componentes'),
          versionIncompatible:true
        };
      }
      if(version > VERSION_FORMATO_PROYECTO){
        return {
          filasPiezas:[],
          filasComponentes:[],
          errores:[
            'La version ' + version + ' de PROYCUT_PROJECT_FORMAT no es compatible. ' +
            'Esta aplicacion admite hasta la version ' + VERSION_FORMATO_PROYECTO + '.'
          ],
          tieneHojaComponentes:!!wb.getWorksheet('Componentes'),
          versionIncompatible:true
        };
      }
      if(version !== VERSION_FORMATO_PROYECTO){
        return {
          filasPiezas:[],
          filasComponentes:[],
          errores:['La version ' + version + ' de PROYCUT_PROJECT_FORMAT no esta soportada.'],
          tieneHojaComponentes:!!wb.getWorksheet('Componentes'),
          versionIncompatible:true
        };
      }
    }
    errores.push(...validarEncabezadoHoja(wsPiezas, ENCABEZADO_FORMATO, 'Piezas'));
    const wsComponentes = wb.getWorksheet('Componentes');
    if(wsComponentes){
      errores.push(...validarEncabezadoHoja(wsComponentes, ENCABEZADO_COMPONENTES_FORMATO, 'Componentes'));
    }
    const wsMateriales = wb.getWorksheet('Materiales');
    if(wsMateriales){
      errores.push(...validarEncabezadoHoja(wsMateriales, ENCABEZADO_MATERIALES_FORMATO, 'Materiales'));
      for(let columna=ENCABEZADO_MATERIALES_FORMATO.length+1; columna<=wsMateriales.actualColumnCount; columna++){
        const valorExtra = textoImportadoSeguro(valorPlanoCeldaExcel(wsMateriales.getRow(1).getCell(columna)));
        if(valorExtra){
          errores.push(
            'Materiales, encabezado columna ' + columna +
            ': no se esperaba la columna adicional "' + valorExtra + '".'
          );
        }
      }
    }
    if(errores.length){
      return {
        filasPiezas:[], filasComponentes:[], filasMateriales:[], errores,
        tieneHojaComponentes:!!wsComponentes, tieneHojaMateriales:!!wsMateriales
      };
    }
    return {
      filasPiezas:leerRegistrosHoja(wsPiezas, ENCABEZADO_FORMATO.length),
      filasComponentes:wsComponentes ? leerRegistrosHoja(wsComponentes, ENCABEZADO_COMPONENTES_FORMATO.length) : [],
      filasMateriales:wsMateriales ? leerRegistrosMaterialesHoja(wsMateriales) : [],
      errores:[],
      tieneHojaComponentes:!!wsComponentes,
      tieneHojaMateriales:!!wsMateriales,
      versionFormato:marcador === IDENTIFICADOR_FORMATO_PROYECTO ? VERSION_FORMATO_PROYECTO : null
    };
  }

  // Lee el formato nuevo y tambien archivos anteriores que solo tienen piezas. La hoja
  // Componentes es opcional para mantener compatibilidad hacia atras.
  async function leerProyectoExcel(archivo){
    const ExcelJSLib = await cargarExcelJS();
    const wb = new ExcelJSLib.Workbook();
    const buffer = await archivo.arrayBuffer();
    await wb.xlsx.load(buffer);
    return extraerProyectoDesdeLibroExcel(wb);
  }

  // ---------- CAT-7: lectura/validacion del archivo de catalogo (Materiales +
  // Tapacantos + Componentes, sin cantidades de proyecto). Solo lectura: ninguna
  // de estas funciones toca `state` ni decide crear/actualizar/relacionar (eso
  // corresponde a CAT-1/CAT-3/CAT-5, todavia sin autorizar). ----------

  // detecta si el archivo cargado en el flujo de catalogo es en realidad un archivo
  // del formato de Piezas (siempre trae una hoja "Piezas"), para dar un mensaje claro
  // en vez de una lista de errores de encabezado dificil de interpretar.
  function esLibroFormatoPiezas(wb){
    return !!wb.getWorksheet('Piezas');
  }

  // igual que leerRegistrosMaterialesHoja(), pero generica para las tres hojas del
  // catalogo (Materiales, Tapacantos, Componentes-catalogo): detecta formulas de Excel
  // sin evaluarlas y no descarta filas vacias (las marca con filaVacia).
  function leerRegistrosCatalogoHoja(ws, numeroColumnas){
    const filas = [];
    if(!ws) return filas;
    for(let numeroFila=2; numeroFila<=ws.rowCount; numeroFila++){
      const row = ws.getRow(numeroFila);
      const cols = [];
      const formulasDetectadas = [];
      let tieneDatos = false;
      for(let c=1; c<=numeroColumnas; c++){
        const celda = row.getCell(c);
        const valorOriginal = celda.value;
        if(valorOriginal && typeof valorOriginal === 'object' &&
           (Object.prototype.hasOwnProperty.call(valorOriginal, 'formula') ||
            Object.prototype.hasOwnProperty.call(valorOriginal, 'sharedFormula'))){
          formulasDetectadas.push(c);
        }
        const valor = valorPlanoCeldaExcel(celda);
        if(valor !== '' && valor !== null && valor !== undefined) tieneDatos = true;
        cols.push(typeof valor === 'string' ? textoImportadoSeguro(valor) : valor);
      }
      filas.push({cols, numeroFila, filaVacia:!tieneDatos, formulasDetectadas});
    }
    return filas;
  }

  // detecta filas con el mismo SKU (normalizado) dentro de la misma hoja del catalogo;
  // es una comprobacion de integridad del archivo, no compara contra el catalogo actual.
  function skuDuplicadosEnFilasCatalogo(filas, indiceColumnaSku, nombreHoja){
    const vistos = new Map();
    const errores = [];
    filas.forEach(({cols, numeroFila, filaVacia}) => {
      if(filaVacia) return;
      const sku = normalizarSkuManual(cols[indiceColumnaSku]);
      if(!sku) return;
      if(vistos.has(sku)){
        errores.push(
          nombreHoja + ', fila ' + numeroFila + ': el SKU "' + sku +
          '" ya aparece en la fila ' + vistos.get(sku) + ' de la misma hoja.'
        );
      } else {
        vistos.set(sku, numeroFila);
      }
    });
    return errores;
  }

  // orquestador de lectura/validacion del archivo de catalogo. Las tres hojas son
  // opcionales entre si; nunca toca `state` ni aplica nada.
  function extraerCatalogoDesdeLibroExcel(wb){
    if(esLibroFormatoPiezas(wb)){
      return {
        filasMateriales:[], filasTapacantos:[], filasComponentes:[],
        errores:['Este archivo tiene el formato de Piezas (Exportar formato), no el de catalogo. Usa "Importar" en Piezas en vez de "Importar catalogo".'],
        tieneHojaMateriales:false, tieneHojaTapacantos:false, tieneHojaComponentes:false
      };
    }

    const wsMateriales = wb.getWorksheet('Materiales');
    const wsTapacantos = wb.getWorksheet('Tapacantos');
    const wsComponentes = wb.getWorksheet('Componentes');

    if(!wsMateriales && !wsTapacantos && !wsComponentes){
      return {
        filasMateriales:[], filasTapacantos:[], filasComponentes:[],
        errores:['El archivo no contiene ninguna hoja reconocible de catalogo (Materiales, Tapacantos o Componentes).'],
        tieneHojaMateriales:false, tieneHojaTapacantos:false, tieneHojaComponentes:false
      };
    }

    const errores = [];
    let versionFormato = null;

    const wsPrimera = wb.worksheets[0];
    if(wsPrimera){
      const marcador = textoImportadoSeguro(valorPlanoCeldaExcel(wsPrimera.getCell(1, COLUMNA_MARCADOR_CATALOGO)));
      const textoVersion = textoImportadoSeguro(valorPlanoCeldaExcel(wsPrimera.getCell(1, COLUMNA_VERSION_CATALOGO)));
      if(marcador === IDENTIFICADOR_FORMATO_CATALOGO){
        const coincidencia = textoVersion.match(/^\s*version\s*:\s*(\d+)\s*$/i);
        const version = coincidencia ? Number(coincidencia[1]) : NaN;
        if(!Number.isInteger(version)){
          errores.push('El archivo declara PROYCUT_CATALOG_FORMAT, pero su version no es valida.');
        } else if(version > VERSION_FORMATO_CATALOGO){
          errores.push('La version ' + version + ' de PROYCUT_CATALOG_FORMAT no es compatible. Esta aplicacion admite hasta la version ' + VERSION_FORMATO_CATALOGO + '.');
        } else if(version !== VERSION_FORMATO_CATALOGO){
          errores.push('La version ' + version + ' de PROYCUT_CATALOG_FORMAT no esta soportada.');
        } else {
          versionFormato = VERSION_FORMATO_CATALOGO;
        }
      }
    }
    if(errores.length){
      return {
        filasMateriales:[], filasTapacantos:[], filasComponentes:[], errores,
        tieneHojaMateriales:!!wsMateriales, tieneHojaTapacantos:!!wsTapacantos,
        tieneHojaComponentes:!!wsComponentes, versionIncompatible:true
      };
    }

    if(wsMateriales) errores.push(...validarEncabezadoHoja(wsMateriales, ENCABEZADO_MATERIALES_FORMATO, 'Materiales'));
    if(wsTapacantos) errores.push(...validarEncabezadoHoja(wsTapacantos, ENCABEZADO_TAPACANTOS_CATALOGO_FORMATO, 'Tapacantos'));
    if(wsComponentes) errores.push(...validarEncabezadoHoja(wsComponentes, ENCABEZADO_COMPONENTES_CATALOGO_FORMATO, 'Componentes'));

    [
      [wsMateriales, ENCABEZADO_MATERIALES_FORMATO, 'Materiales'],
      [wsTapacantos, ENCABEZADO_TAPACANTOS_CATALOGO_FORMATO, 'Tapacantos'],
      [wsComponentes, ENCABEZADO_COMPONENTES_CATALOGO_FORMATO, 'Componentes']
    ].forEach(([ws, encabezado, nombreHoja]) => {
      if(!ws) return;
      for(let columna=encabezado.length+1; columna<=ws.actualColumnCount; columna++){
        if(columna === COLUMNA_MARCADOR_CATALOGO || columna === COLUMNA_VERSION_CATALOGO) continue;
        const valorExtra = textoImportadoSeguro(valorPlanoCeldaExcel(ws.getRow(1).getCell(columna)));
        if(valorExtra){
          errores.push(nombreHoja + ', encabezado columna ' + columna + ': no se esperaba la columna adicional "' + valorExtra + '".');
        }
      }
    });

    if(errores.length){
      return {
        filasMateriales:[], filasTapacantos:[], filasComponentes:[], errores,
        tieneHojaMateriales:!!wsMateriales, tieneHojaTapacantos:!!wsTapacantos,
        tieneHojaComponentes:!!wsComponentes
      };
    }

    const filasMateriales = wsMateriales ? leerRegistrosCatalogoHoja(wsMateriales, ENCABEZADO_MATERIALES_FORMATO.length) : [];
    const filasTapacantos = wsTapacantos ? leerRegistrosCatalogoHoja(wsTapacantos, ENCABEZADO_TAPACANTOS_CATALOGO_FORMATO.length) : [];
    const filasComponentes = wsComponentes ? leerRegistrosCatalogoHoja(wsComponentes, ENCABEZADO_COMPONENTES_CATALOGO_FORMATO.length) : [];

    errores.push(...skuDuplicadosEnFilasCatalogo(filasMateriales, 1, 'Materiales'));
    errores.push(...skuDuplicadosEnFilasCatalogo(filasTapacantos, 1, 'Tapacantos'));
    errores.push(...skuDuplicadosEnFilasCatalogo(filasComponentes, 1, 'Componentes'));

    return {
      filasMateriales, filasTapacantos, filasComponentes,
      errores,
      tieneHojaMateriales:!!wsMateriales, tieneHojaTapacantos:!!wsTapacantos,
      tieneHojaComponentes:!!wsComponentes,
      versionFormato
    };
  }

  // punto de entrada async, mismo rol que leerProyectoExcel() pero para el archivo
  // de catalogo. No conectado a ningun boton ni menu todavia (CAT-7 no incluye UI).
  async function leerCatalogoExcel(archivo){
    const ExcelJSLib = await cargarExcelJS();
    const wb = new ExcelJSLib.Workbook();
    const buffer = await archivo.arrayBuffer();
    await wb.xlsx.load(buffer);
    return extraerCatalogoDesdeLibroExcel(wb);
  }

  // ---------- Etapa 2D-B: vista previa y aplicación controlada de componentes ----------
  let importacionPendiente2DB = null;

  function prepararVistaPreviaMateriales(registros, catalogoMateriales){
    const catalogo = catalogoMateriales || state.materiales;
    const nombresColumnas = ENCABEZADO_MATERIALES_FORMATO;
    const items = (registros || []).map((registro, indice) => {
      const cols = registro.cols || registro || [];
      const numeroFila = registro.numeroFila || (indice + 2);
      const item = {
        fila:numeroFila,
        idImportado:'',
        skuImportado:'',
        nombreImportado:'',
        largoImportado:NaN,
        anchoImportado:NaN,
        espesorImportado:NaN,
        precioImportado:NaN,
        precioActual:NaN,
        coincidencia:'nuevo',
        coincidenciaTexto:'Sin coincidencia',
        materialEncontrado:null,
        accionPropuesta:'Crear material nuevo en Placas y tableros',
        estado:'Material nuevo',
        errores:[],
        advertencias:[],
        bloqueado:false
      };
      if(registro.filaVacia || !cols.some(valor => valor !== '' && valor !== null && valor !== undefined)){
        item.estado = 'Rechazado';
        item.accionPropuesta = 'Rechazar fila vacía';
        item.errores.push('La fila está completamente vacía y no se acepta como material.');
        item.bloqueado = true;
        return item;
      }
      if(cols.length !== ENCABEZADO_MATERIALES_FORMATO.length){
        item.errores.push(
          'Se esperaban exactamente ' + ENCABEZADO_MATERIALES_FORMATO.length + ' columnas.'
        );
      }
      item.idImportado = textoImportadoSeguro(cols[0]);
      item.skuImportado = normalizarSkuManual(textoImportadoSeguro(cols[1]));
      item.nombreImportado = textoImportadoSeguro(cols[2]);
      [item.idImportado, item.skuImportado, item.nombreImportado].forEach((texto, posicion) => {
        if(/^[=+\-@]/.test(String(texto || ''))){
          item.advertencias.push(
            nombresColumnas[posicion] + ': texto potencialmente peligroso tratado como texto seguro.'
          );
        }
      });
      if((registro.formulasDetectadas || []).length){
        item.errores.push(
          'La fila contiene fórmula(s) real(es) en la(s) columna(s) ' +
          registro.formulasDetectadas.join(', ') + '; se rechazó por seguridad.'
        );
        item.estado = 'Rechazado';
      }
      if(!item.nombreImportado){
        item.errores.push('El nombre del material es obligatorio.');
      }
      const largo = validarNumeroEntrada(
        cols[3], 'Materiales, fila ' + numeroFila + ', Largo_mm',
        {min:0, max:LIMITES.medidaMm}
      );
      const ancho = validarNumeroEntrada(
        cols[4], 'Materiales, fila ' + numeroFila + ', Ancho_mm',
        {min:0, max:LIMITES.medidaMm}
      );
      const espesor = validarNumeroEntrada(
        cols[5], 'Materiales, fila ' + numeroFila + ', Espesor_mm',
        {min:0, max:LIMITES.medidaMm}
      );
      const precio = validarNumeroEntrada(
        cols[6], 'Materiales, fila ' + numeroFila + ', Precio_por_tablero',
        {min:0, max:LIMITES.precio}
      );
      if(largo.ok && largo.valor > 0) item.largoImportado = largo.valor;
      else item.errores.push(largo.ok ? 'Materiales, fila ' + numeroFila + ', Largo_mm: debe ser mayor que cero.' : largo.error);
      if(ancho.ok && ancho.valor > 0) item.anchoImportado = ancho.valor;
      else item.errores.push(ancho.ok ? 'Materiales, fila ' + numeroFila + ', Ancho_mm: debe ser mayor que cero.' : ancho.error);
      if(espesor.ok) item.espesorImportado = espesor.valor; else item.errores.push(espesor.error);
      if(precio.ok) item.precioImportado = precio.valor; else item.errores.push(precio.error);

      const porId = item.idImportado
        ? catalogo.filter(material => String(material.idInterno || '') === item.idImportado)
        : [];
      const porSku = item.skuImportado
        ? catalogo.filter(material => normalizarSkuManual(material.sku) === item.skuImportado)
        : [];
      if(porId.length > 1){
        item.errores.push('El ID interno importado coincide con varios materiales.');
        item.coincidencia = 'conflicto';
      }
      if(porSku.length > 1){
        item.errores.push('El SKU importado coincide con varios materiales.');
        item.coincidencia = 'conflicto';
      }
      if(porId.length === 1 && porSku.length === 1 && porId[0] !== porSku[0]){
        item.errores.push(
          'Conflicto bloqueante: el ID interno y el SKU apuntan a materiales diferentes.'
        );
        item.coincidencia = 'conflicto';
      }

      let encontrado = null;
      if(item.coincidencia !== 'conflicto' && porId.length === 1){
        encontrado = porId[0];
        item.coincidencia = 'id';
      } else if(item.coincidencia !== 'conflicto' && porSku.length === 1){
        encontrado = porSku[0];
        item.coincidencia = 'sku';
      } else if(item.coincidencia !== 'conflicto' && !item.skuImportado && item.nombreImportado){
        const nombreNormalizado = normalizarNombreMaterialImportado(item.nombreImportado);
        const porNombre = catalogo.filter(material =>
          normalizarNombreMaterialImportado(material.nombre) === nombreNormalizado
        );
        if(porNombre.length === 1){
          encontrado = porNombre[0];
          item.coincidencia = 'nombre';
        } else if(porNombre.length > 1){
          item.coincidencia = 'conflicto';
          item.errores.push('El nombre coincide con varios materiales y no puede resolverse de forma única.');
        }
      }
      if(item.idImportado && porId.length === 0){
        item.advertencias.push('ID interno no encontrado en el catálogo actual.');
      }
      if(item.skuImportado && porSku.length === 0){
        item.advertencias.push('SKU no encontrado; se presenta como material nuevo sin rechazarlo automáticamente.');
      }
      if(encontrado){
        item.materialEncontrado = {
          idInterno:encontrado.idInterno || '',
          sku:encontrado.sku || '',
          nombre:encontrado.nombre || '',
          precio:Number(encontrado.precio || 0)
        };
        item.precioActual = item.materialEncontrado.precio;
        item.coincidenciaTexto =
          item.materialEncontrado.nombre + ' [' + (item.materialEncontrado.sku || 'sin SKU') + ']';
        item.accionPropuesta = 'Usar material existente (precio se actualiza según política elegida)';
        if(item.coincidencia === 'id') item.estado = 'Existente por ID';
        if(item.coincidencia === 'sku') item.estado = 'Existente por SKU';
        if(item.coincidencia === 'nombre') item.estado = 'Existente por nombre';
      }
      if(item.coincidencia === 'conflicto'){
        item.estado = 'Conflicto';
        item.accionPropuesta = 'Resolver conflicto en una subetapa posterior';
      } else if(item.errores.length && item.estado !== 'Rechazado'){
        item.estado = 'Incompleto';
        item.accionPropuesta = 'Corregir archivo';
      }
      item.bloqueado = item.errores.length > 0;
      return item;
    });
    return {
      items,
      filasAnalizadas:(registros || []).length,
      bloqueadas:items.filter(item => item.bloqueado).length
    };
  }

  // ---------- M-1: contrato de decisiones para Materiales importados ----------
  // Funciones puras: reciben un item ya resuelto por prepararVistaPreviaMateriales() (coincidencia,
  // materialEncontrado, bloqueado) y devuelven la decision correspondiente, sin leer ni escribir
  // `state` ni el DOM. decisionPropuestaParaMaterial() es la que usa construirAplicacionAtomicaMateriales()
  // (M-2, mas abajo) para crear/actualizar materiales al confirmar la importacion.
  function opcionesAccionParaMaterial(item){
    if(item.bloqueado && item.coincidencia !== 'conflicto'){
      return [['rechazar','Rechazar (fila inválida)']];
    }
    if(item.coincidencia === 'conflicto'){
      return [
        ['relacionar','Relacionar manualmente'],
        ['rechazar','Rechazar']
      ];
    }
    if(item.materialEncontrado){
      return [
        ['usar_existente','Usar existente sin cambios'],
        ['actualizar_existente','Usar existente y actualizar campos'],
        ['relacionar','Relacionar manualmente'],
        ['rechazar','Rechazar']
      ];
    }
    return [
      ['crear_sku_importado','Crear con SKU importado'],
      ['crear_sku_automatico','Crear con SKU automático'],
      ['relacionar','Relacionar manualmente'],
      ['rechazar','Rechazar']
    ];
  }

  function decisionPropuestaParaMaterial(item){
    if(item.bloqueado && item.coincidencia !== 'conflicto') return 'rechazar';
    if(item.coincidencia === 'conflicto') return 'relacionar';
    if(item.materialEncontrado) return 'usar_existente';
    return item.skuImportado ? 'crear_sku_importado' : 'crear_sku_automatico';
  }

  function cantidadProyectoParaComponente(componente, proyecto){
    const filas = (proyecto || state.componentesProyecto).filter(ref => {
      if(componente.idInterno && ref.catalogoIdInterno){
        return ref.catalogoIdInterno === componente.idInterno;
      }
      const sku = normalizarSkuManual(componente.sku);
      if(sku) return normalizarSkuManual(ref.sku) === sku;
      return normalizarNombreComponente(ref.producto) === normalizarNombreComponente(componente.producto);
    });
    return filas.reduce((total, fila) => {
      const cantidad = Number(fila.cantidad);
      return total + (Number.isFinite(cantidad) ? cantidad : 0);
    }, 0);
  }

  function siguienteSkuAutomaticoComponentePrevisto(reservados){
    const usados = new Set(state.componentes.map(c => normalizarSkuManual(c.sku)).filter(Boolean));
    (reservados || []).forEach(sku => usados.add(normalizarSkuManual(sku)));
    let numero = consecutivosSkuCatalogo.componente || 0;
    state.componentes.forEach(c => {
      const coincidencia = normalizarSkuManual(c.sku).match(/^H-(\d{6})$/);
      if(coincidencia) numero = Math.max(numero, Number(coincidencia[1]));
    });
    let candidato = '';
    do {
      numero++;
      candidato = 'H-' + String(numero).padStart(6, '0');
    } while(usados.has(candidato));
    return candidato;
  }

  function prepararVistaPreviaComponentes(registros, catalogoComponentes){
    const catalogo = catalogoComponentes || state.componentes;
    const consolidados = new Map();
    let filasConsolidadas = 0;
    (registros || []).forEach((registro, indice) => {
      const cols = registro.cols || registro;
      const numeroFila = registro.numeroFila || (indice + 2);
      const itemBase = {
        filas:[numeroFila],
        idImportado:String(registro.idInterno || '').trim(),
        skuImportado:cols ? normalizarSkuManual(textoImportadoSeguro(cols[0])) : '',
        nombreImportado:cols ? textoImportadoSeguro(cols[1]) : '',
        cantidadImportada:0,
        precioImportado:NaN,
        catalogoIdInterno:'',
        indiceCatalogo:-1,
        coincidencia:'nuevo',
        accion:'',
        relacionId:'',
        actualizarNombre:false,
        usarSkuImportado:false,
        errores:[],
        advertencias:[],
        skuAutomaticoPrevisto:''
      };
      if(!cols || cols.length !== ENCABEZADO_COMPONENTES_FORMATO.length){
        itemBase.errores.push('Se esperaban exactamente ' + ENCABEZADO_COMPONENTES_FORMATO.length + ' columnas.');
      } else {
        const cantidad = validarNumeroEntrada(
          cols[2],
          'Componentes, fila ' + numeroFila + ', Cantidad_por_proyecto',
          {entero:true, min:1, max:LIMITES.cantidadPorFila}
        );
        const precio = validarNumeroEntrada(
          cols[3],
          'Componentes, fila ' + numeroFila + ', Precio_unitario_referencia',
          {min:0, max:LIMITES.precio}
        );
        if(cantidad.ok) itemBase.cantidadImportada = cantidad.valor;
        else itemBase.errores.push(cantidad.error);
        if(precio.ok) itemBase.precioImportado = precio.valor;
        else itemBase.errores.push(precio.error);
        if(!itemBase.nombreImportado){
          itemBase.errores.push('El nombre del componente es obligatorio.');
        }
      }

      let coincidencias = [];
      if(itemBase.idImportado){
        coincidencias = catalogo.filter(c => c.idInterno === itemBase.idImportado);
        if(coincidencias.length) itemBase.coincidencia = 'id';
      }
      if(coincidencias.length === 0 && itemBase.skuImportado){
        coincidencias = catalogo.filter(c => normalizarSkuManual(c.sku) === itemBase.skuImportado);
        if(coincidencias.length) itemBase.coincidencia = 'sku';
      }
      if(coincidencias.length === 0 && !itemBase.skuImportado && itemBase.nombreImportado){
        const nombreNormalizado = normalizarNombreComponente(itemBase.nombreImportado);
        coincidencias = catalogo.filter(c =>
          normalizarNombreComponente(c.producto) === nombreNormalizado
        );
        if(coincidencias.length) itemBase.coincidencia = 'nombre';
      }
      if(coincidencias.length === 1){
        const encontrado = coincidencias[0];
        itemBase.catalogoIdInterno = encontrado.idInterno || '';
        itemBase.indiceCatalogo = catalogo.indexOf(encontrado);
        itemBase.accion = 'usar_existente';
        if(itemBase.coincidencia === 'id' && itemBase.skuImportado){
          const propietarioSku = catalogo.find(c =>
            normalizarSkuManual(c.sku) === itemBase.skuImportado &&
            c.idInterno !== encontrado.idInterno
          );
          if(propietarioSku){
            itemBase.errores.push(
              'El ID interno corresponde a "' + (encontrado.producto || encontrado.sku) +
              '", pero el SKU importado ya pertenece a "' +
              (propietarioSku.producto || propietarioSku.sku) + '".'
            );
          }
        }
      } else if(coincidencias.length > 1){
        itemBase.coincidencia = 'conflicto';
        itemBase.accion = 'relacionar';
        itemBase.advertencias.push(
          'La identidad es ambigua: existen ' + coincidencias.length +
          ' coincidencias. Debe relacionarse manualmente o rechazarse.'
        );
      } else {
        itemBase.accion = itemBase.skuImportado ? 'crear_sku_importado' : 'crear_sku_automatico';
      }

      const clave = itemBase.errores.length
        ? 'invalida:' + numeroFila
        : (itemBase.catalogoIdInterno
          ? 'catalogo:' + itemBase.catalogoIdInterno
          : (itemBase.skuImportado
            ? 'nuevo-sku:' + itemBase.skuImportado
            : 'nuevo-nombre:' + normalizarNombreComponente(itemBase.nombreImportado)));
      if(consolidados.has(clave)){
        const existente = consolidados.get(clave);
        existente.filas.push(numeroFila);
        existente.cantidadImportada += itemBase.cantidadImportada;
        if(Math.abs(existente.precioImportado - itemBase.precioImportado) > 0.005){
          existente.errores.push('Las filas consolidadas tienen precios importados diferentes.');
        }
        if(existente.nombreImportado !== itemBase.nombreImportado){
          existente.advertencias.push('Las filas consolidadas contienen nombres distintos; se conservará el primero.');
        }
        filasConsolidadas++;
      } else {
        consolidados.set(clave, itemBase);
      }
    });

    const items = Array.from(consolidados.values());
    const reservados = [];
    items.forEach(item => {
      if(!item.catalogoIdInterno){
        item.skuAutomaticoPrevisto = siguienteSkuAutomaticoComponentePrevisto(reservados);
        reservados.push(item.skuAutomaticoPrevisto);
      }
      if(item.cantidadImportada > LIMITES.cantidadPorFila){
        item.errores.push('La cantidad consolidada supera el máximo de ' + LIMITES.cantidadPorFila + '.');
      }
    });
    return {items, filasConsolidadas, filasAnalizadas:(registros || []).length};
  }

  function componenteCatalogoPorId(id){
    return state.componentes.find(c => c.idInterno === id) || null;
  }

  function calcularResultadoVistaPrevia(item){
    const politicaCantidad = document.getElementById('importarPoliticaCantidad').value;
    const politicaPrecio = document.getElementById('importarPoliticaPrecio').value;
    const crearNuevos = document.getElementById('importarCrearNuevos').checked;
    const esCreacion = item.accion === 'crear_sku_importado' || item.accion === 'crear_sku_automatico';
    const objetivoId = item.accion === 'relacionar' ? item.relacionId : item.catalogoIdInterno;
    const encontrado = objetivoId ? componenteCatalogoPorId(objetivoId) : null;
    const errores = item.errores.slice();
    const advertencias = item.advertencias.slice();
    let skuResultado = encontrado ? normalizarSkuManual(encontrado.sku) : '';
    let nombreEncontrado = encontrado ? (encontrado.producto || '') : '';
    let cantidadActual = encontrado ? cantidadProyectoParaComponente(encontrado) : 0;
    let cantidadResultante = politicaCantidad === 'sumar'
      ? cantidadActual + item.cantidadImportada
      : item.cantidadImportada;
    let precioActual = encontrado ? Number(encontrado.precio || 0) : 0;
    let precioResultante = esCreacion || politicaPrecio === 'actualizar'
      ? item.precioImportado
      : precioActual;

    if(item.accion === 'rechazar'){
      return {
        bloqueado:false, rechazado:true, estado:'Rechazada por decisión del usuario',
        errores:[], advertencias, encontrado, skuResultado, nombreEncontrado,
        cantidadActual, cantidadResultante, precioActual, precioResultante
      };
    }
    if(esCreacion && !crearNuevos) errores.push('La creación de componentes nuevos está desactivada.');
    if(item.accion === 'crear_sku_importado'){
      skuResultado = item.skuImportado;
      if(!skuResultado) errores.push('No existe un SKU importado que pueda conservarse.');
    }
    if(item.accion === 'crear_sku_automatico'){
      skuResultado = item.skuAutomaticoPrevisto;
    }
    if((item.accion === 'usar_existente' || item.accion === 'relacionar') && !encontrado){
      errores.push('Selecciona un componente existente para relacionar esta fila.');
    }
    if(encontrado && item.usarSkuImportado && item.skuImportado){
      const propietario = state.componentes.find(c =>
        normalizarSkuManual(c.sku) === item.skuImportado && c.idInterno !== encontrado.idInterno
      );
      if(propietario) errores.push('El SKU importado ya pertenece a otro componente.');
      else skuResultado = item.skuImportado;
    }
    if(esCreacion){
      const propietario = state.componentes.find(c => normalizarSkuManual(c.sku) === skuResultado);
      if(propietario) errores.push('El SKU que se usaría ya pertenece a otro componente.');
      nombreEncontrado = '(componente nuevo)';
      cantidadActual = 0;
      cantidadResultante = item.cantidadImportada;
      precioActual = 0;
      precioResultante = item.precioImportado;
    }
    if(!Number.isInteger(cantidadResultante) || cantidadResultante <= 0 || cantidadResultante > LIMITES.cantidadPorFila){
      errores.push('La cantidad resultante no es válida o supera el máximo de ' + LIMITES.cantidadPorFila + '.');
    }
    if(!Number.isFinite(precioResultante) || precioResultante < 0){
      errores.push('El precio resultante no es válido.');
    }
    if(encontrado && politicaPrecio === 'conservar' &&
       Number.isFinite(item.precioImportado) &&
       Math.abs(precioActual - item.precioImportado) > 0.005){
      advertencias.push(
        'El archivo propone ' + fmtMoney(item.precioImportado) +
        ' y el catálogo conservará ' + fmtMoney(precioActual) + '.'
      );
    }
    return {
      bloqueado:errores.length > 0, rechazado:false,
      estado:errores.length ? 'Requiere resolución' : (advertencias.length ? 'Lista con advertencia' : 'Lista para confirmar'),
      errores, advertencias, encontrado, skuResultado, nombreEncontrado,
      cantidadActual, cantidadResultante, precioActual, precioResultante
    };
  }

  function agregarCeldaTexto(fila, texto, clase){
    const td = document.createElement('td');
    td.textContent = texto == null ? '' : String(texto);
    if(clase) td.className = clase;
    fila.appendChild(td);
    return td;
  }

  function opcionesAccionParaItem(item){
    if(item.catalogoIdInterno){
      return [
        ['usar_existente','Usar existente'],
        ['relacionar','Relacionar manualmente'],
        ['rechazar','Rechazar']
      ];
    }
    return [
      ['crear_sku_importado','Crear con SKU importado'],
      ['crear_sku_automatico','Crear con SKU automático'],
      ['relacionar','Relacionar manualmente'],
      ['rechazar','Rechazar']
    ];
  }

  function renderVistaPreviaMateriales(){
    if(!importacionPendiente2DB) return {bloqueadas:0};
    const tbody = document.querySelector('#tablaVistaPreviaMateriales tbody');
    tbody.replaceChildren();
    const materiales = importacionPendiente2DB.materiales;
    const resumen = document.getElementById('importacionMaterialesResumen');
    const tablaWrap = document.getElementById('importacionMaterialesTablaWrap');
    if(!importacionPendiente2DB.proyecto.tieneHojaMateriales){
      resumen.textContent = 'El archivo no incluye la hoja opcional Materiales. El catálogo no se modificará.';
      tablaWrap.style.display = 'none';
      return {bloqueadas:0};
    }
    tablaWrap.style.display = '';
    materiales.items.forEach(item => {
      const tr = document.createElement('tr');
      agregarCeldaTexto(tr, item.fila);
      agregarCeldaTexto(tr, item.idImportado || '(vacío)');
      agregarCeldaTexto(tr, item.skuImportado || '(vacío)');
      agregarCeldaTexto(tr, item.nombreImportado || '(vacío)');
      agregarCeldaTexto(tr, Number.isFinite(item.largoImportado) ? item.largoImportado : '(inválido)');
      agregarCeldaTexto(tr, Number.isFinite(item.anchoImportado) ? item.anchoImportado : '(inválido)');
      agregarCeldaTexto(tr, Number.isFinite(item.espesorImportado) ? item.espesorImportado : '(inválido)');
      agregarCeldaTexto(tr, Number.isFinite(item.precioActual) ? fmtMoney(item.precioActual) : '—');
      agregarCeldaTexto(tr, Number.isFinite(item.precioImportado) ? fmtMoney(item.precioImportado) : '(inválido)');
      agregarCeldaTexto(tr, item.coincidenciaTexto);
      agregarCeldaTexto(tr, item.accionPropuesta);
      const claseEstado = item.bloqueado
        ? 'import-estado-error'
        : (item.advertencias.length ? 'import-estado-warn' : 'import-estado-ok');
      agregarCeldaTexto(tr, item.estado, claseEstado);
      agregarCeldaTexto(
        tr,
        item.errores.concat(item.advertencias).join(' | ') || 'Sin observaciones',
        claseEstado
      );
      tbody.appendChild(tr);
    });
    resumen.textContent =
      'Hoja Materiales, vista previa: ' +
      materiales.filasAnalizadas + ' fila(s); ' +
      materiales.bloqueadas + ' bloqueada(s). Los cambios se aplican al confirmar la importación.';
    return {bloqueadas:materiales.bloqueadas};
  }

  function renderVistaPreviaComponentes(){
    if(!importacionPendiente2DB) return;
    const tbody = document.querySelector('#tablaVistaPreviaComponentes tbody');
    tbody.replaceChildren();
    let bloqueadas = 0;
    let rechazadas = 0;
    importacionPendiente2DB.componentes.items.forEach((item, indice) => {
      const calculado = calcularResultadoVistaPrevia(item);
      if(calculado.bloqueado) bloqueadas++;
      if(calculado.rechazado) rechazadas++;
      const tr = document.createElement('tr');
      agregarCeldaTexto(tr, item.filas.join(', '));
      agregarCeldaTexto(tr, calculado.encontrado ? calculado.encontrado.idInterno : item.idImportado);
      agregarCeldaTexto(tr, item.skuImportado || '(vacío)');
      agregarCeldaTexto(tr, calculado.skuResultado || '(pendiente)');
      agregarCeldaTexto(tr, item.nombreImportado || '(vacío)');
      agregarCeldaTexto(tr, calculado.nombreEncontrado || '(no encontrado)');
      agregarCeldaTexto(tr, calculado.cantidadActual);
      agregarCeldaTexto(tr, item.cantidadImportada);
      agregarCeldaTexto(tr, calculado.rechazado ? '—' : calculado.cantidadResultante);
      agregarCeldaTexto(tr, fmtMoney(calculado.precioActual));
      agregarCeldaTexto(tr, Number.isFinite(item.precioImportado) ? fmtMoney(item.precioImportado) : '(inválido)');
      agregarCeldaTexto(tr, calculado.rechazado ? '—' : fmtMoney(calculado.precioResultante));

      const tdAccion = document.createElement('td');
      const selector = document.createElement('select');
      selector.dataset.indice = indice;
      selector.className = 'import-accion';
      opcionesAccionParaItem(item).forEach(([valor, etiqueta]) => {
        if(valor === 'crear_sku_importado' && !item.skuImportado) return;
        const opcion = document.createElement('option');
        opcion.value = valor;
        opcion.textContent = etiqueta;
        opcion.selected = item.accion === valor;
        selector.appendChild(opcion);
      });
      selector.addEventListener('change', e => {
        item.accion = e.target.value;
        renderVistaPreviaComponentes();
      });
      tdAccion.appendChild(selector);

      if(item.accion === 'relacionar'){
        const relacion = document.createElement('select');
        relacion.style.display = 'block';
        relacion.style.marginTop = '5px';
        const vacia = document.createElement('option');
        vacia.value = '';
        vacia.textContent = 'Seleccionar componente…';
        relacion.appendChild(vacia);
        state.componentes.forEach(comp => {
          const opcion = document.createElement('option');
          opcion.value = comp.idInterno;
          opcion.textContent = etiquetaComponente(comp);
          opcion.selected = item.relacionId === comp.idInterno;
          relacion.appendChild(opcion);
        });
        relacion.addEventListener('change', e => {
          item.relacionId = e.target.value;
          renderVistaPreviaComponentes();
        });
        tdAccion.appendChild(relacion);
      }
      if((item.accion === 'usar_existente' || item.accion === 'relacionar') && calculado.encontrado){
        const etiquetaNombre = document.createElement('label');
        etiquetaNombre.style.display = 'block';
        etiquetaNombre.style.marginTop = '5px';
        const checkNombre = document.createElement('input');
        checkNombre.type = 'checkbox';
        checkNombre.checked = item.actualizarNombre;
        checkNombre.addEventListener('change', e => { item.actualizarNombre = e.target.checked; });
        etiquetaNombre.append(checkNombre, document.createTextNode(' Actualizar nombre'));
        tdAccion.appendChild(etiquetaNombre);
        if(item.skuImportado && item.skuImportado !== normalizarSkuManual(calculado.encontrado.sku)){
          const etiquetaSku = document.createElement('label');
          etiquetaSku.style.display = 'block';
          const checkSku = document.createElement('input');
          checkSku.type = 'checkbox';
          checkSku.checked = item.usarSkuImportado;
          checkSku.addEventListener('change', e => {
            item.usarSkuImportado = e.target.checked;
            renderVistaPreviaComponentes();
          });
          etiquetaSku.append(checkSku, document.createTextNode(' Conservar SKU importado'));
          tdAccion.appendChild(etiquetaSku);
        }
      }
      tr.appendChild(tdAccion);
      const mensajes = calculado.errores.concat(calculado.advertencias);
      const claseEstado = calculado.bloqueado
        ? 'import-estado-error'
        : (calculado.advertencias.length ? 'import-estado-warn' : 'import-estado-ok');
      agregarCeldaTexto(
        tr,
        calculado.estado + (mensajes.length ? ': ' + mensajes.join(' | ') : ''),
        claseEstado
      );
      tbody.appendChild(tr);
    });
    const resultadoMateriales = renderVistaPreviaMateriales();
    const piezas = importacionPendiente2DB.proyecto.filasPiezas.length;
    document.getElementById('importacionVistaPreviaResumen').textContent =
      'Archivo analizado sin aplicar cambios: ' + piezas + ' fila(s) de piezas; ' +
      importacionPendiente2DB.componentes.filasAnalizadas + ' fila(s) de componentes; ' +
      importacionPendiente2DB.componentes.filasConsolidadas + ' consolidada(s); ' +
      bloqueadas + ' componente(s) por resolver; ' +
      resultadoMateriales.bloqueadas + ' material(es) bloqueado(s); ' +
      rechazadas + ' componente(s) marcado(s) para rechazo.';
    document.getElementById('confirmarImportacionVistaPrevia').disabled =
      bloqueadas > 0 || resultadoMateriales.bloqueadas > 0;
  }

  function abrirVistaPreviaImportacion(proyecto){
    importacionPendiente2DB = {
      proyecto,
      componentes:prepararVistaPreviaComponentes(proyecto.filasComponentes || []),
      materiales:prepararVistaPreviaMateriales(proyecto.filasMateriales || [])
    };
    document.getElementById('importarPoliticaCantidad').value = 'reemplazar';
    document.getElementById('importarPoliticaPrecio').value = 'actualizar';
    document.getElementById('importarCrearNuevos').checked = true;
    document.getElementById('importacionVistaPrevia').classList.add('abierto');
    renderVistaPreviaComponentes();
  }

  function cancelarVistaPreviaImportacion(){
    importacionPendiente2DB = null;
    document.getElementById('importacionVistaPrevia').classList.remove('abierto');
    document.querySelector('#tablaVistaPreviaComponentes tbody').replaceChildren();
    document.querySelector('#tablaVistaPreviaMateriales tbody').replaceChildren();
    document.getElementById('importarEstado').textContent = 'Importación cancelada. No se modificó el proyecto ni el catálogo.';
    document.getElementById('importarEstado').className = 'sub';
  }

  ['importarPoliticaCantidad','importarPoliticaPrecio','importarCrearNuevos'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderVistaPreviaComponentes);
  });
  document.getElementById('cancelarImportacionVistaPrevia').addEventListener('click', cancelarVistaPreviaImportacion);

  function filasProyectoDelComponente(componente, proyecto){
    return (proyecto || []).filter(ref => {
      if(componente.idInterno && ref.catalogoIdInterno){
        return componente.idInterno === ref.catalogoIdInterno;
      }
      const sku = normalizarSkuManual(componente.sku);
      if(sku) return normalizarSkuManual(ref.sku) === sku;
      return normalizarNombreComponente(componente.producto) === normalizarNombreComponente(ref.producto);
    });
  }

  function construirAplicacionAtomicaComponentes(){
    if(!importacionPendiente2DB) throw new Error('No existe una importación pendiente.');
    if(importacionPendiente2DB.materiales && importacionPendiente2DB.materiales.bloqueadas > 0){
      throw new Error(
        'Existen ' + importacionPendiente2DB.materiales.bloqueadas +
        ' fila(s) de Materiales con errores o conflictos. Corrige el archivo antes de continuar.'
      );
    }
    const politicaCantidad = document.getElementById('importarPoliticaCantidad').value;
    const politicaPrecio = document.getElementById('importarPoliticaPrecio').value;
    const items = importacionPendiente2DB.componentes.items;
    const bloqueadas = items.filter(item => calcularResultadoVistaPrevia(item).bloqueado);
    if(bloqueadas.length){
      throw new Error('Existen ' + bloqueadas.length + ' fila(s) que todavía requieren resolución.');
    }

    const catalogo = state.componentes.map(comp => Object.assign({}, comp));
    let proyecto = state.componentesProyecto.map(comp => Object.assign({}, comp));
    const estadoTemporal = {
      materiales:state.materiales,
      tapacantos:state.tapacantos,
      componentes:catalogo
    };
    const resumen = {
      analizados:importacionPendiente2DB.componentes.filasAnalizadas,
      existentesUtilizados:0,
      nuevosCreados:0,
      consolidados:importacionPendiente2DB.componentes.filasConsolidadas,
      cantidadesReemplazadas:0,
      cantidadesSumadas:0,
      preciosActualizados:0,
      skuImportadosConservados:0,
      skuAutomaticosGenerados:0,
      filasRechazadas:0,
      conflictosPendientes:0
    };

    items.forEach(item => {
      const calculadoOriginal = calcularResultadoVistaPrevia(item);
      if(calculadoOriginal.rechazado){
        resumen.filasRechazadas += item.filas.length;
        return;
      }
      const esCreacion = item.accion === 'crear_sku_importado' || item.accion === 'crear_sku_automatico';
      let objetivo = null;
      if(esCreacion){
        const skuSolicitado = item.accion === 'crear_sku_importado' ? item.skuImportado : '';
        objetivo = crearRegistroCatalogo('componente', {
          sku:skuSolicitado,
          producto:item.nombreImportado,
          precio:item.precioImportado,
          skuOrigen:item.accion === 'crear_sku_importado' ? 'importado' : 'automatico'
        }, estadoTemporal);
        if(item.accion === 'crear_sku_importado'){
          actualizarMetadatosSku(objetivo, 'importado');
          resumen.skuImportadosConservados++;
        } else {
          resumen.skuAutomaticosGenerados++;
        }
        catalogo.push(objetivo);
        resumen.nuevosCreados++;
      } else {
        const objetivoId = item.accion === 'relacionar' ? item.relacionId : item.catalogoIdInterno;
        objetivo = catalogo.find(comp => comp.idInterno === objetivoId);
        if(!objetivo) throw new Error('No se encontró el componente relacionado para la(s) fila(s) ' + item.filas.join(', ') + '.');
        resumen.existentesUtilizados++;
        if(item.actualizarNombre && item.nombreImportado){
          objetivo.producto = item.nombreImportado;
        }
        if(item.usarSkuImportado && item.skuImportado){
          const propietario = catalogo.find(comp =>
            normalizarSkuManual(comp.sku) === item.skuImportado && comp.idInterno !== objetivo.idInterno
          );
          if(propietario) throw new Error('El SKU "' + item.skuImportado + '" ya pertenece a otro componente.');
          objetivo.sku = item.skuImportado;
          actualizarMetadatosSku(objetivo, 'importado');
          resumen.skuImportadosConservados++;
        }
        if(politicaPrecio === 'actualizar' &&
           Math.abs(Number(objetivo.precio || 0) - item.precioImportado) > 0.005){
          objetivo.precio = item.precioImportado;
          resumen.preciosActualizados++;
        }
      }

      const coincidenciasProyecto = filasProyectoDelComponente(objetivo, proyecto);
      const cantidadActual = coincidenciasProyecto.reduce((total, ref) => total + Number(ref.cantidad || 0), 0);
      const cantidadResultante = politicaCantidad === 'sumar'
        ? cantidadActual + item.cantidadImportada
        : item.cantidadImportada;
      if(!Number.isInteger(cantidadResultante) || cantidadResultante <= 0 ||
         cantidadResultante > LIMITES.cantidadPorFila){
        throw new Error(
          'La cantidad resultante de "' + (objetivo.producto || objetivo.sku) +
          '" no es válida o supera ' + LIMITES.cantidadPorFila + '.'
        );
      }
      if(coincidenciasProyecto.length > 1) resumen.consolidados += coincidenciasProyecto.length - 1;
      proyecto = proyecto.filter(ref => !filasProyectoDelComponente(objetivo, [ref]).length);
      proyecto.push({
        catalogoIdInterno:objetivo.idInterno,
        sku:objetivo.sku,
        producto:objetivo.producto,
        precio:Number(objetivo.precio || 0),
        cantidad:cantidadResultante
      });
      if(politicaCantidad === 'sumar') resumen.cantidadesSumadas++;
      else resumen.cantidadesReemplazadas++;
    });
    return {catalogo, proyecto, resumen};
  }

  // M-2: aplica la vista previa de Materiales (hoja opcional "Materiales" del formato) con el
  // mismo criterio que ya se usa para Componentes: los materiales que coinciden con el catálogo
  // (por ID interno, SKU o nombre) se reutilizan y, segun la politica de precio elegida, actualizan
  // su precio; los que no coinciden con nada se crean como productos nuevos de "Placas y tableros",
  // igual que "crearRegistroCatalogo('componente', ...)" crea componentes nuevos. No toca `state`;
  // solo regresa el plan para aplicarse junto con el de componentes en el mismo confirm.
  function construirAplicacionAtomicaMateriales(){
    if(!importacionPendiente2DB) throw new Error('No existe una importación pendiente.');
    const info = importacionPendiente2DB.materiales;
    const resumen = {
      analizados:info ? info.filasAnalizadas : 0,
      existentesUtilizados:0,
      nuevosCreados:0,
      preciosActualizados:0,
      filasOmitidas:0
    };
    if(!importacionPendiente2DB.proyecto.tieneHojaMateriales || !info || !info.items.length){
      return {materiales:state.materiales, resumen};
    }
    if(info.bloqueadas > 0){
      throw new Error(
        'Existen ' + info.bloqueadas +
        ' fila(s) de Materiales con errores o conflictos. Corrige el archivo antes de continuar.'
      );
    }
    const politicaPrecio = document.getElementById('importarPoliticaPrecio').value;
    const crearNuevos = document.getElementById('importarCrearNuevos').checked;
    const catalogo = state.materiales.map(material => Object.assign({}, material));
    const estadoTemporal = {materiales:catalogo, tapacantos:state.tapacantos, componentes:state.componentes};

    info.items.forEach(item => {
      if(item.bloqueado){
        resumen.filasOmitidas++;
        return;
      }
      const accion = decisionPropuestaParaMaterial(item);
      if(accion === 'rechazar' || accion === 'relacionar'){
        resumen.filasOmitidas++;
        return;
      }
      if(accion === 'usar_existente'){
        const objetivo = catalogo.find(material => material.idInterno === item.materialEncontrado.idInterno);
        if(!objetivo){
          throw new Error('No se encontró el material relacionado para la fila ' + item.fila + '.');
        }
        resumen.existentesUtilizados++;
        if(politicaPrecio === 'actualizar' &&
           Number.isFinite(item.precioImportado) &&
           Math.abs(Number(objetivo.precio || 0) - item.precioImportado) > 0.005){
          objetivo.precio = item.precioImportado;
          resumen.preciosActualizados++;
        }
        return;
      }
      // crear_sku_importado o crear_sku_automatico: producto nuevo en Placas y tableros.
      if(!crearNuevos){
        resumen.filasOmitidas++;
        return;
      }
      const skuSolicitado = accion === 'crear_sku_importado' ? item.skuImportado : '';
      const nuevo = crearRegistroCatalogo('material', {
        sku:skuSolicitado,
        nombre:item.nombreImportado,
        largo:item.largoImportado,
        ancho:item.anchoImportado,
        espesor:Number.isFinite(item.espesorImportado) ? item.espesorImportado : 0,
        precio:Number.isFinite(item.precioImportado) ? item.precioImportado : 0
      }, estadoTemporal);
      if(accion === 'crear_sku_importado') actualizarMetadatosSku(nuevo, 'importado');
      catalogo.push(nuevo);
      resumen.nuevosCreados++;
    });

    return {materiales:catalogo, resumen};
  }

  function aplicarPiezasPendientes(registros){
    let agregadas = 0;
    let rechazadas = 0;
    let ultimaFila = null;
    const errores = [];
    let cantidadAcumulada = Array.from(document.querySelectorAll('#piezasBody .p-cant')).reduce((total, inputCantidad) => {
      const resultado = validarCantidad(inputCantidad.value, 'Cantidad existente');
      return total + (resultado.ok ? resultado.valor : 0);
    }, 0);
    const proyectosActuales = validarNumeroEntrada(
      document.getElementById('cantidadProyectos').value,
      'Cantidad de proyectos',
      {entero:true, min:1, max:LIMITES.cantidadProyectos}
    );
    const multiplicador = proyectosActuales.ok ? proyectosActuales.valor : 1;
    (registros || []).forEach((registro, indice) => {
      const numeroFila = registro.numeroFila || (indice + 2);
      const resultado = agregarPiezaDesdeColumnas(registro.cols || registro, numeroFila);
      if(resultado.errores.length){
        rechazadas++;
        errores.push(...resultado.errores);
        return;
      }
      if((cantidadAcumulada + resultado.cantidad) * multiplicador > LIMITES.piezasExpandidas){
        rechazadas++;
        errores.push('Fila ' + numeroFila + ': la cantidad acumulada supera el máximo permitido.');
        if(resultado.fila) resultado.fila.remove();
        return;
      }
      cantidadAcumulada += resultado.cantidad;
      agregadas++;
      ultimaFila = resultado.fila;
    });
    return {agregadas, rechazadas, errores, ultimaFila};
  }

  document.getElementById('confirmarImportacionVistaPrevia').addEventListener('click', () => {
    const estadoEl = document.getElementById('importarEstado');
    const btn = document.getElementById('confirmarImportacionVistaPrevia');
    if(!importacionPendiente2DB) return;
    btn.disabled = true;
    try {
      const aplicacion = construirAplicacionAtomicaComponentes();
      const aplicacionMateriales = construirAplicacionAtomicaMateriales();
      const proyectoPendiente = importacionPendiente2DB.proyecto;
      // El estado de componentes y de materiales solo se confirma después de validar ambos planes.
      state.componentes = aplicacion.catalogo;
      state.componentesProyecto = aplicacion.proyecto;
      state.materiales = aplicacionMateriales.materiales;
      const piezas = aplicarPiezasPendientes(proyectoPendiente.filasPiezas || []);
      renderComponentes();
      renderComponentesProyecto();
      renderMateriales();
      refrescarSelects();
      renumerarFilas();
      ajustarAlturaTabla();
      clearTimeout(debounceTimer);
      recalcular();

      const r = aplicacion.resumen;
      const rm = aplicacionMateriales.resumen;
      const detallePiezas = piezas.errores.length
        ? ' Errores de piezas: ' + piezas.errores.slice(0,5).join(' | ') +
          (piezas.errores.length > 5 ? ' | …' : '')
        : '';
      estadoEl.textContent =
        'Importación confirmada. Piezas importadas: ' + piezas.agregadas +
        '; piezas rechazadas: ' + piezas.rechazadas +
        '. Componentes analizados: ' + r.analizados +
        '; existentes utilizados: ' + r.existentesUtilizados +
        '; nuevos creados: ' + r.nuevosCreados +
        '; consolidados: ' + r.consolidados +
        '; cantidades reemplazadas: ' + r.cantidadesReemplazadas +
        '; cantidades sumadas: ' + r.cantidadesSumadas +
        '; precios actualizados: ' + r.preciosActualizados +
        '; SKU importados conservados: ' + r.skuImportadosConservados +
        '; SKU automáticos generados: ' + r.skuAutomaticosGenerados +
        '; filas rechazadas: ' + r.filasRechazadas +
        '; conflictos pendientes: 0.' +
        ' Materiales analizados: ' + rm.analizados +
        '; existentes utilizados: ' + rm.existentesUtilizados +
        '; nuevos creados: ' + rm.nuevosCreados +
        '; precios actualizados: ' + rm.preciosActualizados +
        '; omitidos: ' + rm.filasOmitidas + '.' + detallePiezas;
      estadoEl.className = (piezas.rechazadas || r.filasRechazadas) ? 'warn' : 'sub';
      document.getElementById('archivoImportar').value = '';
      document.getElementById('importacionVistaPrevia').classList.remove('abierto');
      importacionPendiente2DB = null;
      if(piezas.ultimaFila){
        document.querySelector('.split').classList.remove('oculto');
        if(typeof piezas.ultimaFila.scrollIntoView === 'function'){
          piezas.ultimaFila.scrollIntoView({block:'nearest', behavior:'smooth'});
        }
      }
    } catch(error){
      estadoEl.textContent = 'No se aplicó la importación: ' + error.message;
      estadoEl.className = 'warn';
      renderVistaPreviaComponentes();
    } finally {
      if(importacionPendiente2DB) renderVistaPreviaComponentes();
      else btn.disabled = false;
    }
  });

  document.getElementById('importarArchivoBtn').addEventListener('click', async () => {
    const input = document.getElementById('archivoImportar');
    const estadoEl = document.getElementById('importarEstado');
    const btn = document.getElementById('importarArchivoBtn');
    if(!input.files || input.files.length === 0){
      estadoEl.textContent = 'Selecciona primero un archivo CSV o Excel.';
      estadoEl.className = 'warn';
      return;
    }
    const archivo = input.files[0];
    const esExcel = /.xlsx?$/i.test(archivo.name);
    if(!esExcel && archivo.size > LIMITES.csvBytes){
      estadoEl.textContent = 'El archivo CSV pesa ' + archivo.size + ' bytes; el maximo permitido es ' + LIMITES.csvBytes + ' bytes (2 MiB).';
      estadoEl.className = 'warn';
      return;
    }

    function procesarFilasCSV(filas, erroresIniciales){
      const resultadoPiezas = aplicarPiezasPendientes(filas);
      const errores = (erroresIniciales || []).concat(resultadoPiezas.errores);
      renumerarFilas();
      ajustarAlturaTabla();
      clearTimeout(debounceTimer);
      recalcular();
      const resumenErrores = errores.length
        ? ' Se detectaron ' + errores.length + ' error' + (errores.length===1?'':'es') + ': ' +
          errores.slice(0,8).join(' | ') +
          (errores.length>8 ? ' | ... y ' + (errores.length-8) + ' errores más.' : '')
        : '';
      if(resultadoPiezas.agregadas > 0){
        estadoEl.textContent =
          'Piezas importadas: ' + resultadoPiezas.agregadas +
          '; piezas rechazadas: ' + resultadoPiezas.rechazadas + '.' +
          resumenErrores + ' Los componentes solo pueden restaurarse desde un archivo XLSX.';
        estadoEl.className = errores.length ? 'warn' : 'sub';
        input.value = '';
        if(errores.length === 0){
          document.getElementById('importarPanel').classList.remove('open');
        }
        if(resultadoPiezas.ultimaFila){
          document.querySelector('.split').classList.remove('oculto');
          if(typeof resultadoPiezas.ultimaFila.scrollIntoView === 'function'){
            resultadoPiezas.ultimaFila.scrollIntoView({block:'nearest', behavior:'smooth'});
          }
        }
      } else {
        estadoEl.textContent = errores.length
          ? 'No se importaron datos válidos.' + resumenErrores
          : 'No se encontraron piezas válidas en el CSV.';
        estadoEl.className = 'warn';
      }
    }

    if(esExcel){
      const textoOriginal = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Importando...';
      try {
        const proyecto = await leerProyectoExcel(archivo);
        if(proyecto.errores.length){
          estadoEl.textContent = 'No se puede preparar la importación: ' + proyecto.errores.join(' | ');
          estadoEl.className = 'warn';
        } else if(proyecto.filasPiezas.length > LIMITES.csvFilas){
          estadoEl.textContent = 'El archivo contiene ' + proyecto.filasPiezas.length +
            ' filas de piezas; el máximo permitido es ' + LIMITES.csvFilas + '.';
          estadoEl.className = 'warn';
        } else if(proyecto.filasComponentes.length > LIMITES.csvFilas){
          estadoEl.textContent = 'La hoja Componentes contiene ' + proyecto.filasComponentes.length +
            ' filas; el máximo permitido es ' + LIMITES.csvFilas + '.';
          estadoEl.className = 'warn';
        } else if(proyecto.filasMateriales.length > LIMITES.csvFilas){
          estadoEl.textContent = 'La hoja Materiales contiene ' + proyecto.filasMateriales.length +
            ' filas; el máximo permitido es ' + LIMITES.csvFilas + '.';
          estadoEl.className = 'warn';
        } else {
          abrirVistaPreviaImportacion(proyecto);
          const detalleHojas = [
            proyecto.tieneHojaComponentes ? 'Componentes incluidos' : 'sin hoja Componentes',
            proyecto.tieneHojaMateriales ? 'Materiales en vista previa de solo lectura' : 'sin hoja Materiales'
          ].join('; ');
          estadoEl.textContent =
            'Archivo leído (' + detalleHojas + '). Revisa la vista previa antes de confirmar.';
          estadoEl.className = 'sub';
        }
      } catch(err){
        estadoEl.textContent = 'No se pudo leer el archivo de Excel: ' + err.message;
        estadoEl.className = 'warn';
      } finally {
        btn.disabled = false;
        btn.textContent = textoOriginal;
      }
    } else {
      const lector = new FileReader();
      lector.onload = (e) => {
        const resultado = parsearCSV(String(e.target.result || ''));
        procesarFilasCSV(resultado.filas, resultado.errores);
      };
      lector.onerror = () => {
        estadoEl.textContent = 'No se pudo leer el archivo CSV. Verifica que el archivo exista, sea legible y no este danado.';
        estadoEl.className = 'warn';
      };
      lector.readAsText(archivo);
    }
  });

  // ---------- Apariencia del diagrama (colores y tamanos de letra), guardada en el navegador ----------
  const ESTILO_KEY = 'occ_bamteck_estilo_v1';
  function cargarEstiloGuardado(){
    try{
      const raw = localStorage.getItem(ESTILO_KEY);
      if(!raw) return;
      const datos = JSON.parse(raw);
      const tieneDato = clave => Object.prototype.hasOwnProperty.call(datos, clave);
      function restaurarValor(clave, id, permitirCero){
        if(!tieneDato(clave)) return;
        const valor = datos[clave];
        if(!valor && !(permitirCero && valor === 0)) return;
        const el = document.getElementById(id || clave);
        if(el) el.value = valor;
      }
      function restaurarBooleano(clave, id){
        if(!tieneDato(clave) || typeof datos[clave] !== 'boolean') return;
        const el = document.getElementById(id || clave);
        if(el) el.checked = datos[clave];
      }
      [
        ['colorPieza'], ['colorPieza2'], ['colorSobrante'], ['colorSobrante2'],
        ['fsTablero'], ['fsPiezaMedida'], ['fsPiezaNum'], ['fsSobrante'],
        ['lineaCorte', 'estiloLineaCorte'], ['lineaTapacanto', 'estiloLineaTapacanto'],
        ['lineaSobrante', 'estiloLineaSobrante'], ['lineaHastaTope', 'estiloLineaHastaTope'],
        ['tipoFlechaSobrante'], ['tamanoPuntaFlecha'], ['grosorCorte'],
        ['grosorTapacanto'], ['grosorFlechaSobrante'], ['grosorLineaSobrante'],
        ['plantillaReporte'], ['fsTabs'], ['escalaDiagrama'], ['fuenteInterfaz'],
        ['colorPrincipal'], ['colorSecundario'], ['colorFondo'], ['fsTituloPrincipal'],
        ['fsTituloSeccion'], ['disenoTotal'], ['colorFondoTotal'], ['fsTablaPiezas'],
        ['colorHeaderPiezas'], ['colorTextoHeaderPiezas'], ['colorBordePiezas'],
        ['grosorBordePiezas'], ['altoTablaPiezas']
      ].forEach(([clave, id]) => restaurarValor(clave, id));
      [
        'mostrarNumero', 'mostrarMedidas', 'mostrarFlechas', 'mostrarListaSobrantes',
        'mostrarBtnAgregarComponente', 'mostrarBtnArchivo', 'mostrarBtnEspejo',
        'mostrarBtnExportar', 'mostrarBtnExportarDxf', 'mostrarBtnConfirmar',
        'mostrarColumnaEspesor'
      ].forEach(clave => restaurarBooleano(clave));
      restaurarValor('radioEsquinas', 'radioEsquinas', true);
    } catch(e){
      // el navegador no permite guardar preferencias (modo privado, etc): se usan los valores por defecto
    }
  }
  function guardarEstilo(estilo){
    try{ localStorage.setItem(ESTILO_KEY, JSON.stringify(estilo)); } catch(e){ /* no se pudo guardar, no pasa nada */ }
  }
  // aplica el formato, color y letra de TODA la interfaz (no solo el diagrama), mediante
  // variables CSS en la raiz del documento, para que se refleje en encabezados, botones,
  // pestanas, paneles, etc.
  function aplicarEstiloGlobal(estilo){
    const raiz = document.documentElement.style;
    raiz.setProperty('--fuente', fuenteACss(estilo.fuenteInterfaz));
    raiz.setProperty('--azul', estilo.colorPrincipal);
    raiz.setProperty('--azul2', estilo.colorSecundario);
    raiz.setProperty('--fondo', estilo.colorFondo);
    raiz.setProperty('--fs-h1', estilo.fsTituloPrincipal + 'px');
    raiz.setProperty('--fs-h2', estilo.fsTituloSeccion + 'px');
    raiz.setProperty('--radio', estilo.radioEsquinas + 'px');
    raiz.setProperty('--fondo-total', estilo.colorFondoTotal);
    raiz.setProperty('--piezas-fs', estilo.fsTablaPiezas + 'px');
    raiz.setProperty('--piezas-header-bg', estilo.colorHeaderPiezas);
    raiz.setProperty('--piezas-header-color', estilo.colorTextoHeaderPiezas);
    raiz.setProperty('--piezas-borde-color', estilo.colorBordePiezas);
    raiz.setProperty('--piezas-borde-grosor', estilo.grosorBordePiezas + 'px');
    raiz.setProperty('--piezas-alto', estilo.altoTablaPiezas + 'px');
  }
  // muestra u oculta los botones "+ Agregar componentes", "Archivo", "Espejo", "Exportar",
  // "Exportar DXF (CNC)" y "Confirmar pedido" segun los checkboxes de "Ajuste de la interfaz" ->
  // "Mostrar / ocultar botones". Si se oculta un boton que abre un subpanel (Agregar componentes,
  // Archivo), tambien se cierra ese subpanel para no dejarlo abierto sin forma de cerrarlo.
  function aplicarVisibilidadBotones(estilo){
    const setVis = (id, visible) => {
      const el = document.getElementById(id);
      if(el) el.style.display = visible ? '' : 'none';
    };
    const cerrarSiExiste = (id, clase) => {
      const el = document.getElementById(id);
      if(el) el.classList.remove(clase);
    };
    setVis('toggleAgregarComponente', estilo.mostrarBtnAgregarComponente);
    if(!estilo.mostrarBtnAgregarComponente){
      cerrarSiExiste('agregarComponentePanel', 'open');
    }
    setVis('archivoMenuWrap', estilo.mostrarBtnArchivo);
    if(!estilo.mostrarBtnArchivo){
      cerrarSiExiste('archivoMenu', 'abierto');
      cerrarSiExiste('importarPanel', 'open');
    }
    setVis('espejoMenuWrap', estilo.mostrarBtnEspejo);
    if(!estilo.mostrarBtnEspejo){
      cerrarSiExiste('espejoMenu', 'abierto');
    }
    setVis('exportar', estilo.mostrarBtnExportar);
    setVis('exportarDxf', estilo.mostrarBtnExportarDxf);
    setVis('confirmar', estilo.mostrarBtnConfirmar);
    const tablaMat = document.getElementById('tablaMateriales');
    if(tablaMat) tablaMat.classList.toggle('oculta-espesor', !estilo.mostrarColumnaEspesor);
  }
  function leerEstilo(){
    const valorDe = (id, predeterminado) => {
      const el = document.getElementById(id);
      return el ? el.value : predeterminado;
    };
    const marcadoDe = (id, predeterminado) => {
      const el = document.getElementById(id);
      return el ? el.checked : predeterminado;
    };
    const estilo = {
      colorPieza: valorDe('colorPieza', '#2563eb') || '#2563eb',
      colorPieza2: valorDe('colorPieza2', '#6b7280') || '#6b7280',
      colorSobrante: valorDe('colorSobrante', '#ea580c') || '#ea580c',
      colorSobrante2: valorDe('colorSobrante2', '#0d9488') || '#0d9488',
      fsTablero: parseFloat(valorDe('fsTablero', 11)) || 11,
      fsPiezaMedida: parseFloat(valorDe('fsPiezaMedida', 11)) || 11,
      fsPiezaNum: parseFloat(valorDe('fsPiezaNum', 13)) || 13,
      fsSobrante: parseFloat(valorDe('fsSobrante', 8)) || 8,
      mostrarNumero: marcadoDe('mostrarNumero', true),
      mostrarMedidas: marcadoDe('mostrarMedidas', true),
      mostrarFlechas: marcadoDe('mostrarFlechas', true),
      mostrarListaSobrantes: marcadoDe('mostrarListaSobrantes', true),
      mostrarBtnAgregarComponente: marcadoDe('mostrarBtnAgregarComponente', true),
      mostrarBtnArchivo: marcadoDe('mostrarBtnArchivo', true),
      mostrarBtnEspejo: marcadoDe('mostrarBtnEspejo', true),
      mostrarBtnExportar: marcadoDe('mostrarBtnExportar', true),
      mostrarBtnExportarDxf: marcadoDe('mostrarBtnExportarDxf', true),
      mostrarBtnConfirmar: marcadoDe('mostrarBtnConfirmar', true),
      mostrarColumnaEspesor: marcadoDe('mostrarColumnaEspesor', true),
      lineaCorte: valorDe('estiloLineaCorte', 'solida') || 'solida',
      lineaTapacanto: valorDe('estiloLineaTapacanto', 'solida') || 'solida',
      lineaSobrante: valorDe('estiloLineaSobrante', 'solida') || 'solida',
      lineaHastaTope: valorDe('estiloLineaHastaTope', 'punteada') || 'punteada',
      tipoFlechaSobrante: valorDe('tipoFlechaSobrante', 'triangulo') || 'triangulo',
      tamanoPuntaFlecha: parseFloat(valorDe('tamanoPuntaFlecha', 6)) || 6,
      grosorCorte: parseFloat(valorDe('grosorCorte', 1)) || 1,
      grosorTapacanto: parseFloat(valorDe('grosorTapacanto', 3)) || 3,
      grosorFlechaSobrante: parseFloat(valorDe('grosorFlechaSobrante', 1.3)) || 1.3,
      grosorLineaSobrante: parseFloat(valorDe('grosorLineaSobrante', 0.6)) || 0.6,
      plantillaReporte: valorDe('plantillaReporte', 'columnas') || 'columnas',
      fsTabs: parseFloat(valorDe('fsTabs', 10)) || 10,
      escalaDiagrama: parseFloat(valorDe('escalaDiagrama', 100)) || 100,
      fuenteInterfaz: valorDe('fuenteInterfaz', 'sistema') || 'sistema',
      colorPrincipal: valorDe('colorPrincipal', '#1e3a5f') || '#1e3a5f',
      colorSecundario: valorDe('colorSecundario', '#2c5282') || '#2c5282',
      colorFondo: valorDe('colorFondo', '#ffffff') || '#ffffff',
      fsTituloPrincipal: parseFloat(valorDe('fsTituloPrincipal', 16)) || 16,
      fsTituloSeccion: parseFloat(valorDe('fsTituloSeccion', 15)) || 15,
      radioEsquinas: parseFloat(valorDe('radioEsquinas', 10)),
      disenoTotal: valorDe('disenoTotal', 'pastel') || 'pastel',
      colorFondoTotal: valorDe('colorFondoTotal', '#eef2ff') || '#eef2ff',
      fsTablaPiezas: parseFloat(valorDe('fsTablaPiezas', 12)) || 12,
      colorHeaderPiezas: valorDe('colorHeaderPiezas', '#f4f5f7') || '#f4f5f7',
      colorTextoHeaderPiezas: valorDe('colorTextoHeaderPiezas', '#1f2430') || '#1f2430',
      colorBordePiezas: valorDe('colorBordePiezas', '#d7dbe0') || '#d7dbe0',
      grosorBordePiezas: parseFloat(valorDe('grosorBordePiezas', 1)) || 1,
      altoTablaPiezas: parseFloat(valorDe('altoTablaPiezas', 340)) || 340
    };
    if(isNaN(estilo.radioEsquinas)) estilo.radioEsquinas = 10;
    guardarEstilo(estilo);
    aplicarEstiloGlobal(estilo);
    aplicarVisibilidadBotones(estilo);
    return estilo;
  }
  cargarEstiloGuardado();
  [
    'colorPieza','colorPieza2','colorSobrante','colorSobrante2','fsTablero','fsPiezaMedida','fsPiezaNum','fsSobrante',
    'mostrarNumero','mostrarMedidas','mostrarFlechas','mostrarListaSobrantes',
    'mostrarBtnAgregarComponente','mostrarBtnArchivo','mostrarBtnEspejo',
    'mostrarBtnExportar','mostrarBtnExportarDxf','mostrarBtnConfirmar','mostrarColumnaEspesor',
    'estiloLineaCorte','estiloLineaTapacanto','estiloLineaSobrante','estiloLineaHastaTope',
    'tipoFlechaSobrante','tamanoPuntaFlecha',
    'grosorCorte','grosorTapacanto','grosorFlechaSobrante','grosorLineaSobrante',
    'plantillaReporte','fsTabs','escalaDiagrama',
    'fuenteInterfaz','colorPrincipal','colorSecundario','colorFondo',
    'fsTituloPrincipal','fsTituloSeccion','radioEsquinas',
    'disenoTotal','colorFondoTotal',
    'fsTablaPiezas','colorHeaderPiezas','colorTextoHeaderPiezas','colorBordePiezas','grosorBordePiezas','altoTablaPiezas'
  ].forEach(id => {
    const control = document.getElementById(id);
    if(!control) return;
    control.addEventListener('input', recalcularDebounced);
    control.addEventListener('change', recalcularDebounced);
  });

  // si el material/tapacanto que tenia seleccionado una fila ya no existe (se renombro o se
  // borro en el panel de Material/Cubre canto), la fila pasa al primero disponible. si la fila
  // estaba vacia a proposito (el usuario todavia no elige nada), se queda vacia.
  function refrescarSelects(){
    document.querySelectorAll('#piezasBody tr').forEach(tr => {
      const matInput = tr.querySelector('.p-material-input');
      if(matInput){
        const curMat = matInput.dataset.valor || '';
        if(curMat !== ''){
          const existeMat = state.materiales.some(m => m.nombre === curMat);
          if(!existeMat){
            const nuevoMat = (state.materiales[0] || {}).nombre || '';
            matInput.dataset.valor = nuevoMat;
            matInput.value = nuevoMat;
          }
        }
      }
      const tapaInput = tr.querySelector('.p-tapatipo-input');
      if(tapaInput){
        const curTapa = tapaInput.dataset.valor || '';
        if(curTapa !== ''){
          const existeTapa = state.tapacantos.some(t => t.nombre === curTapa);
          if(!existeTapa){
            const nuevoTapa = (state.tapacantos[0] || {}).nombre || '';
            tapaInput.dataset.valor = nuevoTapa;
            tapaInput.value = nuevoTapa;
          }
        }
      }
    });
  }

  // ---------- Combobox buscable (Material y Tipo de tapacanto en la tabla de piezas) ----------
  // un solo elemento flotante compartido, posicionado con position:fixed segun el input activo,
  // para que la lista nunca quede recortada por la barra de scroll de la tabla de piezas.
  const comboFlotante = document.getElementById('comboFlotante');
  let comboActivo = null;

  function cerrarComboFlotante(){
    comboFlotante.classList.remove('abierto');
    comboFlotante.innerHTML = '';
    comboActivo = null;
  }

  function posicionarComboFlotante(input){
    const rect = input.getBoundingClientRect();
    comboFlotante.style.left = Math.round(rect.left) + 'px';
    comboFlotante.style.width = Math.round(Math.max(rect.width, 140)) + 'px';
    const alturaLista = Math.min(200, comboFlotante.scrollHeight || 200);
    const espacioAbajo = window.innerHeight - rect.bottom;
    const espacioArriba = rect.top;
    let arriba = rect.bottom + 2;
    if(espacioAbajo < alturaLista){
      if(espacioArriba > espacioAbajo){
        arriba = rect.top - alturaLista - 2;
      }
    }
    comboFlotante.style.top = Math.round(arriba) + 'px';
  }

  // "crearInfo" (opcional) es {tipo:'material'|'tapacanto'|'componente'}: cuando se manda, y lo
  // que se escribio no coincide con nada de la lista, se ofrece darlo de alta ahi mismo (ver
  // "Crear nuevo desde el buscador" mas abajo).
  function renderComboOpciones(input, opciones, filtro, onSeleccion, crearInfo){
    const filtroBajo = (filtro || '').trim().toLowerCase();
    const filtradas = filtroBajo === '' ? opciones : opciones.filter(o => o.toLowerCase().indexOf(filtroBajo) !== -1);
    comboFlotante.innerHTML = '';
    if(filtradas.length === 0){
      const div = document.createElement('div');
      div.className = 'combo-item sin-resultados';
      div.textContent = 'Sin resultados';
      comboFlotante.appendChild(div);
      const textoNuevo = (filtro || '').trim();
      if(crearInfo){
        if(textoNuevo !== ''){
          const crear = document.createElement('div');
          crear.className = 'combo-item combo-item-crear';
          crear.textContent = '+ Crear "' + textoNuevo + '" (' + etiquetaTipoCrear(crearInfo.tipo) + ')';
          crear.addEventListener('mousedown', (e) => {
            e.preventDefault(); // evita que el input pierda el foco antes de procesar el clic
            iniciarCrearDesdeCombo(textoNuevo, crearInfo, onSeleccion);
          });
          comboFlotante.appendChild(crear);
        }
      }
    } else {
      filtradas.forEach(op => {
        const div = document.createElement('div');
        div.className = 'combo-item';
        div.textContent = op;
        div.addEventListener('mousedown', (e) => {
          e.preventDefault(); // evita que el input pierda el foco antes de procesar el clic
          onSeleccion(op);
          cerrarComboFlotante();
        });
        comboFlotante.appendChild(div);
      });
    }
    posicionarComboFlotante(input);
  }

  function abrirComboBuscable(input, obtenerOpciones, onSeleccion, crearInfo){
    comboActivo = {input:input, obtenerOpciones:obtenerOpciones, onSeleccion:onSeleccion};
    comboFlotante.classList.add('abierto');
    // al abrir (foco o clic) se muestra la lista completa sin filtrar; el filtro por texto
    // solo se aplica cuando el usuario empieza a escribir (evento 'input').
    renderComboOpciones(input, obtenerOpciones(), '', onSeleccion, crearInfo);
  }

  function attachComboBuscable(input, obtenerOpciones, onSeleccion, crearInfo){
    input.addEventListener('focus', () => {
      input.select();
      abrirComboBuscable(input, obtenerOpciones, onSeleccion, crearInfo);
    });
    input.addEventListener('click', () => {
      if(!comboActivo || comboActivo.input !== input) abrirComboBuscable(input, obtenerOpciones, onSeleccion, crearInfo);
    });
    input.addEventListener('input', () => {
      if(!comboActivo || comboActivo.input !== input){
        comboActivo = {input:input, obtenerOpciones:obtenerOpciones, onSeleccion:onSeleccion};
        comboFlotante.classList.add('abierto');
      }
      renderComboOpciones(input, obtenerOpciones(), input.value, onSeleccion, crearInfo);
    });
    input.addEventListener('keydown', (e) => {
      if(e.key === 'Escape'){
        cerrarComboFlotante();
        input.blur();
      }
      if(e.key === 'Enter'){
        e.preventDefault();
        const primero = comboFlotante.querySelector('.combo-item:not(.sin-resultados):not(.combo-item-crear)');
        if(primero){
          onSeleccion(primero.textContent);
          cerrarComboFlotante();
          return;
        }
        const itemCrear = comboFlotante.querySelector('.combo-item-crear');
        if(itemCrear){
          iniciarCrearDesdeCombo(input.value.trim(), crearInfo, onSeleccion);
        }
      }
    });
    input.addEventListener('blur', () => {
      // se cierra un poco despues para que el mousedown de un item alcance a procesarse antes
      setTimeout(() => {
        if(comboActivo){
          if(comboActivo.input === input) cerrarComboFlotante();
        }
        const valorGuardado = input.dataset.valor || '';
        if(input.value !== valorGuardado) input.value = valorGuardado;
      }, 150);
    });
  }
  document.addEventListener('scroll', () => { if(comboActivo) posicionarComboFlotante(comboActivo.input); }, true);
  window.addEventListener('resize', () => { if(comboActivo) cerrarComboFlotante(); });

  // ---------- Crear nuevo Material / Tapacanto / Componente desde el buscador ----------
  // Cuando lo que se escribe en el buscador de Material, Tipo de tapacanto o Componente no
  // coincide con nada ya dado de alta, se ofrece la opcion "+ Crear ..." (ver renderComboOpciones
  // arriba). Antes de darlo de alta se pide confirmar y capturar su precio: la idea es dejar claro
  // que la informacion que se capture ahi (el precio, sobre todo) es responsabilidad de quien la
  // esta creando, ya que afecta directo el calculo de precio del proyecto.
  const modalCrearOverlay = document.getElementById('modalCrearOverlay');
  const modalCrearTitulo = document.getElementById('modalCrearTitulo');
  const modalCrearAviso = document.getElementById('modalCrearAviso');
  const modalCrearPrecio = document.getElementById('modalCrearPrecio');
  let crearPendiente = null; // {nombre, tipo, onCreado}

  function etiquetaTipoCrear(tipo){
    if(tipo === 'material') return 'nuevo material';
    if(tipo === 'tapacanto') return 'nuevo tipo de tapacanto';
    return 'nuevo componente';
  }

  function iniciarCrearDesdeCombo(nombre, crearInfo, onSeleccion){
    if(!crearInfo) return;
    if(nombre === '') return;
    cerrarComboFlotante();
    abrirModalCrear(nombre, crearInfo.tipo, onSeleccion);
  }

  function abrirModalCrear(nombre, tipo, onCreado){
    crearPendiente = {nombre:nombre, tipo:tipo, onCreado:onCreado};
    modalCrearTitulo.textContent = 'Crear ' + etiquetaTipoCrear(tipo);
    modalCrearAviso.textContent = '"' + nombre + '" no esta dado de alta todavia. Estas a punto de crearlo como ' +
      etiquetaTipoCrear(tipo) + ': confirma el precio antes de guardar. La informacion que captures aqui (sobre ' +
      'todo el precio) es tu responsabilidad, ya que se usa de inmediato para calcular el costo del proyecto. ' +
      'Se puede editar o eliminar despues desde el menu correspondiente.';
    modalCrearPrecio.value = '0';
    modalCrearOverlay.classList.add('abierto');
    setTimeout(() => { modalCrearPrecio.focus(); modalCrearPrecio.select(); }, 30);
  }

  function cerrarModalCrear(){
    modalCrearOverlay.classList.remove('abierto');
    crearPendiente = null;
  }

  function confirmarCrear(){
    if(!crearPendiente) return;
    const precioValidado = validarPrecio(modalCrearPrecio.value, 'Precio');
    if(!precioValidado.ok){
      alert(precioValidado.error);
      modalCrearPrecio.focus();
      return;
    }
    const precio = precioValidado.valor;
    const nombre = crearPendiente.nombre;
    const tipo = crearPendiente.tipo;
    const onCreado = crearPendiente.onCreado;
    let valorSeleccion = nombre;
    if(tipo === 'material'){
      const medida = obtenerMedidaTableroDefault();
      const registro = crearRegistroCatalogo('material', {
        sku:'', nombre:nombre, precio:precio, largo:medida.largo, ancho:medida.ancho, espesor:15
      });
      state.materiales.push(registro);
      renderMateriales();
    } else if(tipo === 'tapacanto'){
      const registro = crearRegistroCatalogo('tapacanto', {sku:'', nombre:nombre, precio:precio});
      state.tapacantos.push(registro);
      renderTapacantos();
    } else {
      const registro = crearRegistroCatalogo('componente', {sku:'', producto:nombre, precio:precio});
      state.componentes.push(registro);
      renderComponentes();
      valorSeleccion = etiquetaComponente(registro);
    }
    cerrarModalCrear();
    onCreado(valorSeleccion);
  }

  document.getElementById('modalCrearCancelar').addEventListener('click', cerrarModalCrear);
  document.getElementById('modalCrearGuardar').addEventListener('click', confirmarCrear);
  modalCrearPrecio.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      e.preventDefault();
      confirmarCrear();
    }
    if(e.key === 'Escape'){
      e.preventDefault();
      cerrarModalCrear();
    }
  });
  modalCrearOverlay.addEventListener('mousedown', (e) => {
    if(e.target === modalCrearOverlay) cerrarModalCrear();
  });

  // ---------- selector visual de cantos (tapacanto), reemplaza los 4 checkboxes sueltos L1/L2/A1/A2 ----------
  // pinta cada lado del cuadrito segun el estado real de su checkbox escondido (.p-l1/.p-l2/.p-a1/.p-a2),
  // que sigue siendo la fuente de verdad que usan leerPiezas(), el CSV y el Excel.
  function sincronizarCantoSelector(tr){
    ['l1','l2','a1','a2'].forEach(lado => {
      const chk = tr.querySelector('.p-'+lado);
      const seg = tr.querySelector('.canto-seg[data-lado="'+lado+'"]');
      if(chk){
        if(seg) seg.classList.toggle('activo', chk.checked);
      }
    });
  }
  // clic en cualquiera de los 4 lados del cuadrito: alterna el checkbox escondido correspondiente,
  // repinta el selector y dispara el recalculo (igual que si se hubiera marcado el checkbox directo).
  function attachCantoSelector(tr){
    tr.querySelectorAll('.canto-seg').forEach(seg => {
      seg.addEventListener('click', () => {
        const lado = seg.dataset.lado;
        const chk = tr.querySelector('.p-'+lado);
        if(!chk) return;
        chk.checked = !chk.checked;
        sincronizarCantoSelector(tr);
        recalcularDebounced();
      });
    });
  }

  // ---------- Filas de piezas ----------
  // construye el cuadrito visual de cantos (SVG estatico, sin datos variables) con las APIs
  // seguras de espacio de nombres SVG, en vez de una plantilla de marcado.
  function crearCantoSelectorSvg(){
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const contenedor = document.createElement('div');
    contenedor.className = 'canto-selector';
    contenedor.title = 'Clic en cada lado para activar o desactivar el tapacanto: arriba = L1, abajo = L2, izquierda = A1, derecha = A2';
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 44 32');
    svg.setAttribute('width', '44');
    svg.setAttribute('height', '32');
    [
      ['l1', '0,0 44,0 37,7 7,7'],
      ['a2', '44,0 44,32 37,25 37,7'],
      ['l2', '44,32 0,32 7,25 37,25'],
      ['a1', '0,32 0,0 7,7 7,25']
    ].forEach(([lado, puntos]) => {
      const poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('class', 'canto-seg');
      poly.setAttribute('data-lado', lado);
      poly.setAttribute('points', puntos);
      svg.appendChild(poly);
    });
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', '7');
    rect.setAttribute('y', '7');
    rect.setAttribute('width', '30');
    rect.setAttribute('height', '18');
    rect.setAttribute('class', 'canto-centro');
    svg.appendChild(rect);
    contenedor.appendChild(svg);
    return contenedor;
  }

  function addPiezaRow(data){
    pieceCounter++;
    const tbody = document.getElementById('piezasBody');
    const tr = document.createElement('tr');
    tr.dataset.id = pieceCounter;
    const datoSeguro = data || {};

    const tdNum = document.createElement('td');
    tdNum.textContent = pieceCounter;
    tr.appendChild(tdNum);

    const crearCeldaInput = (tipo, clase, opciones = {}) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = tipo;
      input.className = clase;
      if(opciones.min !== undefined) input.min = opciones.min;
      if(opciones.value !== undefined) input.value = opciones.value;
      if(opciones.placeholder !== undefined) input.placeholder = opciones.placeholder;
      td.appendChild(input);
      tr.appendChild(td);
      return input;
    };
    const crearCeldaCheckbox = (clase) => {
      const td = document.createElement('td');
      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = clase;
      td.appendChild(chk);
      tr.appendChild(td);
      return chk;
    };

    crearCeldaInput('number', 'p-cant', {min:1, value: datoSeguro.cant || 1});
    crearCeldaInput('number', 'p-l', {min:1, value: datoSeguro.l || ''});
    crearCeldaInput('number', 'p-a', {min:1, value: datoSeguro.a || ''});

    const tdGirar = document.createElement('td');
    const spanGirar = document.createElement('span');
    spanGirar.className = 'p-girar girar-check';
    spanGirar.setAttribute('role', 'checkbox');
    spanGirar.tabIndex = 0;
    spanGirar.dataset.modo = datoSeguro.girarModo || 'auto';
    tdGirar.appendChild(spanGirar);
    tr.appendChild(tdGirar);

    const tdMaterial = document.createElement('td');
    const comboMaterial = document.createElement('div');
    comboMaterial.className = 'combo combo-material';
    const matInput = document.createElement('input');
    matInput.type = 'text';
    matInput.className = 'p-material-input';
    matInput.autocomplete = 'off';
    matInput.placeholder = 'Buscar...';
    comboMaterial.appendChild(matInput);
    tdMaterial.appendChild(comboMaterial);
    tr.appendChild(tdMaterial);

    const tdCantos = document.createElement('td');
    tdCantos.appendChild(crearCantoSelectorSvg());
    tr.appendChild(tdCantos);

    const chkL1 = crearCeldaCheckbox('p-l1');
    const chkL2 = crearCeldaCheckbox('p-l2');
    const chkA1 = crearCeldaCheckbox('p-a1');
    const chkA2 = crearCeldaCheckbox('p-a2');

    const tdTapa = document.createElement('td');
    const comboTapa = document.createElement('div');
    comboTapa.className = 'combo combo-tapatipo';
    const tapaInput = document.createElement('input');
    tapaInput.type = 'text';
    tapaInput.className = 'p-tapatipo-input';
    tapaInput.autocomplete = 'off';
    tapaInput.placeholder = 'Buscar...';
    comboTapa.appendChild(tapaInput);
    tdTapa.appendChild(comboTapa);
    tr.appendChild(tdTapa);

    const tdLabel = document.createElement('td');
    const inputLabel = document.createElement('input');
    inputLabel.type = 'text';
    inputLabel.className = 'p-label';
    inputLabel.value = datoSeguro.label || '';
    inputLabel.placeholder = 'ej. puerta';
    tdLabel.appendChild(inputLabel);
    tr.appendChild(tdLabel);

    const tdAcciones = document.createElement('td');
    const botonQuitar = document.createElement('button');
    botonQuitar.className = 'btn danger p-del';
    botonQuitar.textContent = 'Quitar';
    tdAcciones.appendChild(botonQuitar);
    tr.appendChild(tdAcciones);

    tbody.appendChild(tr);
    chkL1.checked = !!datoSeguro.l1;
    chkL2.checked = !!datoSeguro.l2;
    chkA1.checked = !!datoSeguro.a1;
    chkA2.checked = !!datoSeguro.a2;
    attachCantoSelector(tr);
    sincronizarCantoSelector(tr);
    // si se usan los checkboxes L1/L2/A1/A2 directamente (en vez del cuadrito visual), el
    // cuadrito se repinta igual para que ambos controles siempre queden de acuerdo.
    tr.querySelectorAll('.p-l1, .p-l2, .p-a1, .p-a2').forEach(chk => {
      chk.addEventListener('change', () => sincronizarCantoSelector(tr));
    });
    botonQuitar.addEventListener('click', () => { tr.remove(); renumerarFilas(); recalcularDebounced(); });
    attachGirarToggle(spanGirar);

    // combobox buscable de Material: empieza vacio (no se elige el primero automaticamente);
    // solo toma un valor si viene explicito en los datos (ejemplo inicial, importacion o al
    // repetir el de la fila anterior desde el boton "+ Agregar pieza").
    let matValorInicial = '';
    if(datoSeguro.material){
      if(state.materiales.some(m => m.nombre===datoSeguro.material)){
        matValorInicial = datoSeguro.material;
      }
    }
    matInput.value = matValorInicial;
    matInput.dataset.valor = matValorInicial;
    attachComboBuscable(matInput, () => state.materiales.map(m => m.nombre), (seleccion) => {
      matInput.value = seleccion;
      matInput.dataset.valor = seleccion;
      recalcularDebounced();
    }, {tipo:'material'});

    // combobox buscable de Tipo de tapacanto: mismo criterio, empieza vacio salvo dato explicito.
    let tapaValorInicial = '';
    if(datoSeguro.tapaTipo){
      if(state.tapacantos.some(t => t.nombre===datoSeguro.tapaTipo)){
        tapaValorInicial = datoSeguro.tapaTipo;
      }
    }
    tapaInput.value = tapaValorInicial;
    tapaInput.dataset.valor = tapaValorInicial;
    attachComboBuscable(tapaInput, () => state.tapacantos.map(t => t.nombre), (seleccion) => {
      tapaInput.value = seleccion;
      tapaInput.dataset.valor = seleccion;
      recalcularDebounced();
    }, {tipo:'tapacanto'});
    return tr;
  }

  // checkbox de 3 estados para la columna Girar: vacio=Auto, raya=Normal, marcado=Girar 90.
  // cada clic pasa al siguiente estado (el aspecto lo dibuja el CSS segun data-modo).
  function tituloGirar(modo){
    return modo === 'auto'
      ? 'Auto: el optimizador acomoda la pieza en la mejor posicion (clic para cambiar)'
      : modo === 'normal'
        ? 'Normal: mantiene la pieza tal cual la capturaste (clic para cambiar)'
        : 'Girar 90: voltea la pieza al otro lado (clic para volver a Auto)';
  }
  function siguienteModoGirar(modo){
    const orden = ['auto','normal','rotado'];
    return orden[(orden.indexOf(modo || 'auto')+1) % orden.length];
  }
  function attachGirarToggle(chk){
    chk.title = tituloGirar(chk.dataset.modo || 'auto');
    chk.addEventListener('click', () => {
      chk.dataset.modo = siguienteModoGirar(chk.dataset.modo);
      chk.title = tituloGirar(chk.dataset.modo);
      recalcularDebounced();
    });
    chk.addEventListener('keydown', (e) => {
      if(e.key === ' ' || e.key === 'Enter'){
        e.preventDefault();
        chk.dataset.modo = siguienteModoGirar(chk.dataset.modo);
        chk.title = tituloGirar(chk.dataset.modo);
        recalcularDebounced();
      }
    });
  }

  // casilla en el encabezado de Girar: marcada gira 90 grados todas las piezas de la tabla,
  // desmarcada las regresa todas a Auto.
  document.getElementById('girarTodos').addEventListener('change', (e) => {
    const modo = e.target.checked ? 'rotado' : 'auto';
    document.querySelectorAll('#piezasBody .p-girar').forEach(chk => {
      chk.dataset.modo = modo;
      chk.title = tituloGirar(modo);
    });
    recalcularDebounced();
  });

  // vuelve a numerar la columna # de forma secuencial (1,2,3...) segun el orden actual de las filas
  function renumerarFilas(){
    document.querySelectorAll('#piezasBody tr').forEach((row, i) => {
      row.dataset.id = i+1;
      row.querySelector('td:first-child').textContent = i+1;
    });
  }

  document.getElementById('addPieza').addEventListener('click', () => {
    // si ya hay una fila anterior, se repite su material y tipo de tapacanto para agilizar
    // la captura (no hace falta volver a elegirlos en cada pieza); si la tabla esta vacia,
    // la fila nueva arranca sin nada elegido.
    const filasActuales = document.querySelectorAll('#piezasBody tr');
    let materialRepetido = '';
    let tapaRepetida = '';
    if(filasActuales.length > 0){
      const ultimaFila = filasActuales[filasActuales.length - 1];
      const matPrev = ultimaFila.querySelector('.p-material-input');
      const tapaPrev = ultimaFila.querySelector('.p-tapatipo-input');
      if(matPrev) materialRepetido = matPrev.dataset.valor || '';
      if(tapaPrev) tapaRepetida = tapaPrev.dataset.valor || '';
    }
    const nuevaFila = addPiezaRow({material: materialRepetido, tapaTipo: tapaRepetida});
    renumerarFilas();
    recalcularDebounced();
    // salta a la nueva pieza y deja el campo de cantidad listo para escribir
    if(typeof nuevaFila.scrollIntoView === 'function'){
      nuevaFila.scrollIntoView({block:'nearest', behavior:'smooth'});
    }
    const cantInput = nuevaFila.querySelector('.p-cant');
    cantInput.focus();
    cantInput.select();
  });

  // Enter dentro de cualquier campo de una fila salta al SIGUIENTE campo de esa misma fila (como
  // si se diera Tab); al llegar al ultimo campo de una fila salta al primer campo de la fila de
  // abajo, y si ya no hay fila de abajo (es la ultima), agrega una fila nueva automaticamente
  // (igual que dar clic en su boton "+ Agregar ...") y salta directo a su primer campo. Asi se
  // puede capturar todo el formulario de corrido, sin usar el mouse ni la tecla Tab.
  // Nota: los combos buscables (Material/Tapacanto) y el icono de Girar ya tienen su propio
  // manejo de Enter (eligen la opcion resaltada / cambian de modo); como ese evento sigue
  // "burbujeando" hacia la tabla, este listener corre despues y solo se encarga de mover el
  // foco, sin pisar esa accion.
  function enfocarCampo(el){
    el.focus();
    if(el.select){
      if(el.type === 'text' || el.type === 'number') el.select();
    }
  }
  function attachEnterNavegable(tbody, camposSelector, botonAgregarId, focoAlFinalId){
    function camposDeFila(fila){
      return Array.from(fila.querySelectorAll(camposSelector));
    }
    tbody.addEventListener('keydown', (e) => {
      if(e.key !== 'Enter') return;
      const objetivo = e.target;
      if(!objetivo.matches(camposSelector)) return;
      const fila = objetivo.closest('tr');
      const campos = camposDeFila(fila);
      const idx = campos.indexOf(objetivo);
      if(idx === -1) return;
      e.preventDefault();
      if(idx < campos.length - 1){
        enfocarCampo(campos[idx+1]);
        return;
      }
      const filas = Array.from(tbody.querySelectorAll('tr'));
      const filaIdx = filas.indexOf(fila);
      if(filaIdx < filas.length - 1){
        const siguientes = camposDeFila(filas[filaIdx+1]);
        if(siguientes.length) enfocarCampo(siguientes[0]);
        return;
      }
      if(botonAgregarId){
        document.getElementById(botonAgregarId).click();
        const filasNuevas = tbody.querySelectorAll('tr');
        const filaNueva = filasNuevas[filasNuevas.length - 1];
        if(!filaNueva) return;
        const primeros = camposDeFila(filaNueva);
        if(primeros.length) enfocarCampo(primeros[0]);
        return;
      }
      // esta tabla no tiene boton propio de "+ agregar fila" (las filas se crean de otra forma,
      // por ejemplo eligiendo algo en un buscador): en vez de no hacer nada, se salta a ese
      // campo indicado para seguir capturando sin usar el mouse.
      if(focoAlFinalId){
        const foco = document.getElementById(focoAlFinalId);
        if(foco) enfocarCampo(foco);
      }
    });
  }
  attachEnterNavegable(document.getElementById('piezasBody'),
    '.p-cant, .p-l, .p-a, .p-girar, .p-material-input, .p-l1, .p-l2, .p-a1, .p-a2, .p-tapatipo-input, .p-label',
    'addPieza');
  attachEnterNavegable(document.querySelector('#tablaMateriales tbody'), '.mat-sku, .mat-nombre, .mat-largo, .mat-ancho, .mat-espesor, .mat-precio', 'addMaterial');
  attachEnterNavegable(document.querySelector('#tablaTapacantos tbody'), '.tapa-sku, .tapa-nombre, .tapa-precio', 'addTapacanto');
  attachEnterNavegable(document.querySelector('#tablaComponentes tbody'), '.comp-sku, .comp-producto, .comp-precio', 'addComponente');
  // "Componentes del proyecto" solo tiene un campo por fila (cantidad); Enter ahi salta a la
  // cantidad de la fila de abajo, y en la ultima fila salta al buscador de "agregar componente"
  // para seguir capturando sin usar el mouse (esta tabla no tiene boton "+ agregar fila" propio:
  // las filas se crean al elegir un componente del buscador).
  attachEnterNavegable(document.querySelector('#tablaComponentesProyecto tbody'), '.cp-cant', null, 'nuevoComponenteInput');

  // limita la tabla de piezas a 4.5 filas visibles; el resto se ve deslizando
  function ajustarAlturaTabla(){
    const scroll = document.querySelector('.table-scroll');
    if(!scroll) return;

    const thead = scroll.querySelector('thead');
    const primeraFila = scroll.querySelector('#piezasBody tr');
    if(!thead || !primeraFila) return;

    const headH = thead.getBoundingClientRect().height;
    const rowH = primeraFila.getBoundingClientRect().height;
    if(headH<=0 || rowH<=0) return; // el navegador aun no calculo el layout, se reintenta en el siguiente ajuste
    scroll.style.maxHeight = Math.round(headH + rowH*4.5) + 'px';
  }

  renderMateriales();
  renderTapacantos();
  renderComponentes();
  renderComponentesProyecto();

  // El proyecto inicia sin piezas capturadas.
  ajustarAlturaTabla();

  // valor del box "Cantidad de proyectos" (arriba de la tabla de Piezas a cortar): 1 si esta
  // vacio o invalido, para que nunca "desaparezcan" piezas por un numero mal escrito.
  function obtenerCantidadProyectos(){
    const valor = parseInt(document.getElementById('cantidadProyectos').value, 10);
    return valor > 0 ? valor : 1;
  }

  // 'normal' (por defecto) o 'completa', segun el radio "Calidad del optimizador" en Ajustes de
  // parametros de corte.
  function obtenerNivelOptimizacion(){
    const radio = document.querySelector('input[name="nivelOptimizacion"]:checked');
    return radio ? radio.value : 'normal';
  }

  function validarProyecto(){
    const errores = [];
    const parametrosCorte = resolverParametrosCorteEtapa4();
    if(!parametrosCorte.ok) errores.push(...parametrosCorte.errores);
    const cantidadProyectosValidada = validarNumeroEntrada(
      document.getElementById('cantidadProyectos').value,
      'Cantidad de proyectos',
      {entero:true, min:1, max:LIMITES.cantidadProyectos}
    );
    if(!cantidadProyectosValidada.ok) errores.push(cantidadProyectosValidada.error);

    const largoTablero = validarMedida(document.getElementById('tableroLargo').value, 'Largo del tablero');
    const anchoTablero = validarMedida(document.getElementById('tableroAncho').value, 'Ancho del tablero');
    if(!largoTablero.ok) errores.push(largoTablero.error);
    if(!anchoTablero.ok) errores.push(anchoTablero.error);

    [
      ['precioCorte', 'Precio por corte'],
      ['precioCorteMetro', 'Precio por metro de corte']
    ].forEach(item => {
      const resultado = validarPrecio(document.getElementById(item[0]).value, item[1]);
      if(!resultado.ok) errores.push(resultado.error);
    });

    document.querySelectorAll('#tablaMateriales tbody tr').forEach((tr, i) => {
      const n = i + 1;
      const nombre = tr.querySelector('.mat-nombre').value.trim();
      if(nombre === '') errores.push('Material ' + n + ': el nombre es obligatorio.');
      const largo = validarMedida(tr.querySelector('.mat-largo').value, 'Material ' + n + ', largo');
      const ancho = validarMedida(tr.querySelector('.mat-ancho').value, 'Material ' + n + ', ancho');
      const espesor = validarNumeroEntrada(tr.querySelector('.mat-espesor').value, 'Material ' + n + ', espesor', {min:0, max:LIMITES.medidaMm});
      const precio = validarPrecio(tr.querySelector('.mat-precio').value, 'Material ' + n + ', precio');
      if(!largo.ok) errores.push(largo.error);
      if(!ancho.ok) errores.push(ancho.error);
      if(!espesor.ok) errores.push(espesor.error);
      if(!precio.ok) errores.push(precio.error);
      if(largo.ok && ancho.ok && parametrosCorte.ok){
        const areaUtil = calcularRectanguloUtilTablero(largo.valor, ancho.valor, parametrosCorte.margenes);
        if(!areaUtil.ok){
          errores.push('Material ' + n + ' (' + (nombre || 'sin nombre') + '): ' + areaUtil.error);
        } else {
          const areaColocacion = calcularRectanguloColocacion(
            areaUtil.rect,
            parametrosCorte.kerfBordeExterior
          );
          if(!areaColocacion.ok){
            errores.push('Material ' + n + ' (' + (nombre || 'sin nombre') + '): ' + areaColocacion.error);
          }
        }
      }
    });

    document.querySelectorAll('#tablaTapacantos tbody tr').forEach((tr, i) => {
      const n = i + 1;
      if(tr.querySelector('.tapa-nombre').value.trim() === '') errores.push('Tipo de tapacanto ' + n + ': el nombre es obligatorio.');
      const precio = validarPrecio(tr.querySelector('.tapa-precio').value, 'Tipo de tapacanto ' + n + ', precio');
      if(!precio.ok) errores.push(precio.error);
    });

    document.querySelectorAll('#tablaComponentes tbody tr').forEach((tr, i) => {
      const n = i + 1;
      const precio = validarPrecio(tr.querySelector('.comp-precio').value, 'Componente ' + n + ', precio');
      if(!precio.ok) errores.push(precio.error);
    });

    document.querySelectorAll('#tablaComponentesProyecto tbody tr').forEach((tr, i) => {
      const cantidad = validarCantidad(tr.querySelector('.cp-cant').value, 'Componente del proyecto ' + (i+1) + ', cantidad');
      if(!cantidad.ok) errores.push(cantidad.error);
    });

    const filasPiezas = Array.from(document.querySelectorAll('#piezasBody tr'));
    if(filasPiezas.length === 0) errores.push('Agrega al menos una pieza antes de continuar.');
    let totalPorProyecto = 0;
    filasPiezas.forEach((tr, i) => {
      const n = i + 1;
      const cantidad = validarCantidad(tr.querySelector('.p-cant').value, 'Pieza ' + n + ', cantidad');
      const largo = validarMedida(tr.querySelector('.p-l').value, 'Pieza ' + n + ', largo');
      const ancho = validarMedida(tr.querySelector('.p-a').value, 'Pieza ' + n + ', ancho');
      if(!cantidad.ok) errores.push(cantidad.error); else totalPorProyecto += cantidad.valor;
      if(!largo.ok) errores.push(largo.error);
      if(!ancho.ok) errores.push(ancho.error);
      if((tr.querySelector('.p-material-input').dataset.valor || '').trim() === ''){
        errores.push('Pieza ' + n + ': selecciona un material.');
      }
    });
    if(cantidadProyectosValidada.ok && totalPorProyecto * cantidadProyectosValidada.valor > LIMITES.piezasExpandidas){
      errores.push('El proyecto genera ' + (totalPorProyecto * cantidadProyectosValidada.valor) + ' piezas; el maximo permitido es ' + LIMITES.piezasExpandidas + '.');
    }
    return {ok:errores.length === 0, errores};
  }

  function mostrarErroresProyecto(errores){
    const contenedor = document.getElementById('avisos');
    contenedor.replaceChildren();
    errores.forEach(error => {
      const p = document.createElement('p');
      p.className = 'warn';
      p.textContent = error;
      contenedor.appendChild(p);
    });
  }

  function leerPiezas(parametrosCorteProyecto){
    const rows = document.querySelectorAll('#piezasBody tr');
    const piezas = [];
    const errores = [];
    const parametrosProyecto = parametrosCorteProyecto || resolverParametrosCorteEtapa4();
    if(!parametrosProyecto.ok) return {piezas, errores:parametrosProyecto.errores.slice()};
    const cantidadProyectos = obtenerCantidadProyectos();
    // con la calidad "Normal" las piezas en Auto NO se giran: se tratan como si estuvieran fijas
    // en "Normal" (tal cual quedaron capturadas en la tabla). Solo con "Completa" el optimizador
    // tiene libertad de girarlas 90° para aprovechar mejor el material.
    const permitirGirarAuto = obtenerNivelOptimizacion() !== 'normal';
    rows.forEach(row => {
      const label = row.querySelector('.p-label').value.trim() || ('Pieza ' + row.dataset.id);
      const cant = (parseInt(row.querySelector('.p-cant').value, 10) || 0) * cantidadProyectos;
      const l = parseFloat(row.querySelector('.p-l').value);
      const a = parseFloat(row.querySelector('.p-a').value);
      let girarModo = row.querySelector('.p-girar').dataset.modo || 'auto'; // 'auto' | 'normal' | 'rotado'
      if(girarModo === 'auto'){
        if(!permitirGirarAuto) girarModo = 'normal';
      }
      const material = row.querySelector('.p-material-input').dataset.valor;
      const tapaTipo = row.querySelector('.p-tapatipo-input').dataset.valor;
      const l1 = row.querySelector('.p-l1').checked;
      const l2 = row.querySelector('.p-l2').checked;
      const a1 = row.querySelector('.p-a1').checked;
      const a2 = row.querySelector('.p-a2').checked;
      if(!l || !a || cant<=0) return;
      const parametrosPieza = resolverParametrosCorteEtapa4(row.dataset.id);
      if(!parametrosPieza.ok){
        errores.push(...parametrosPieza.errores.map(error => '"' + label + '": ' + error));
        return;
      }
      const medidaMat = medidaTableroDeMaterial(material);
      const areaUtil = calcularRectanguloUtilTablero(
        medidaMat.largo,
        medidaMat.ancho,
        parametrosProyecto.margenes
      );
      if(!areaUtil.ok){
        errores.push('"' + label + '": ' + areaUtil.error);
        return;
      }
      const areaColocacion = calcularRectanguloColocacion(
        areaUtil.rect,
        parametrosPieza.kerfBordeExterior
      );
      if(!areaColocacion.ok){
        errores.push('"' + label + '": ' + areaColocacion.error);
        return;
      }
      const cabeNormal = l <= areaColocacion.rect.w + 0.001
        && a <= areaColocacion.rect.h + 0.001;
      const cabeRotada = a <= areaColocacion.rect.w + 0.001
        && l <= areaColocacion.rect.h + 0.001;
      let cabe = cabeNormal || cabeRotada;
      if(girarModo === 'normal') cabe = cabeNormal;
      if(girarModo === 'rotado') cabe = cabeRotada;
      if(!cabe){
        const detalle = girarModo === 'normal' ? ' en orientación normal' : (girarModo === 'rotado' ? ' girada 90 grados' : ' en ninguna orientación');
        const m = parametrosProyecto.margenes;
        const hayMargenes = m.left>0 || m.right>0 || m.top>0 || m.bottom>0;
        const causa = hayMargenes
          ? ` ya no cabe en el area de colocacion (${areaColocacion.rect.w}x${areaColocacion.rect.h}) despues de aplicar margenes y kerf exterior`
          : ` no cabe en el tablero de "${material}" (${medidaMat.largo}x${medidaMat.ancho}) con el area de colocacion ${areaColocacion.rect.w}x${areaColocacion.rect.h}`;
        errores.push(`"${label}" (${l}x${a})${causa}${detalle}.`);
        return;
      }
      for(let i=0;i<cant;i++){
        piezas.push({
          num: row.dataset.id, label, l, a, girarModo,
          material, tapaTipo, l1, l2, a1, a2,
          kerfEfectivo:parametrosPieza.kerf,
          kerfEntrePiezasEfectivo:parametrosPieza.kerfEntrePiezas,
          kerfPiezaSobranteEfectivo:parametrosPieza.kerfPiezaSobrante,
          kerfBordeExteriorEfectivo:parametrosPieza.kerfBordeExterior
        });
      }
    });
    return {piezas, errores};
  }

  // ---------- Empaquetado tipo guillotina (rectangulos libres) con rotacion opcional ----------
  // A diferencia de un empaquetado por franjas de igual altura, aqui cada pieza se coloca en el
  // hueco libre que le quede mas justo y ese hueco se divide en hasta 2 rectangulos libres nuevos
  // mediante un corte recto de lado a lado (compatible con la sierra escuadradora). Asi se puede
  // seguir usando el espacio que sobra al lado de piezas mas bajas en vez de dejarlo muerto.
  // prueba varios criterios de orden de entrada (mismo algoritmo de guillotina para cada uno) y se
  // queda con el resultado que use menos tableros y, a igualdad, menos cortes. El orden en que se
  // van acomodando las piezas afecta bastante el desperdicio final, asi que probar varios y quedarse
  // con el mejor hace el corte mas eficiente sin cambiar el metodo de acomodo.
  // generador de numeros pseudoaleatorios con semilla fija: da resultados distintos entre si pero
  // siempre iguales para la misma lista de piezas (no cambia el resultado en cada recalculo).
  function pseudoAleatorio(semilla){
    let s = semilla >>> 0;
    return function(){
      s = (s*1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function barajar(lista, semilla){
    const copia = lista.slice();
    const rnd = pseudoAleatorio(semilla);
    for(let i=copia.length-1; i>0; i--){
      const j = Math.floor(rnd()*(i+1));
      const tmp = copia[i]; copia[i] = copia[j]; copia[j] = tmp;
    }
    return copia;
  }

  // cuantos criterios de orden fijo y cuantos ordenes al azar se prueban, segun el nivel elegido
  // en "Ajustes de parametros de corte" -> Optimizacion. Mas intentos = mas probabilidades de
  // encontrar un acomodo con menos tableros y sobrante mas aprovechable, pero tarda mas en
  // calcularse (cada intento vuelve a correr el empaquetado completo desde cero).
  // "nivel" viene del radio "Calidad del optimizador" (Ajustes de parametros de corte):
  //  - 'normal': las piezas en Auto NO se giran (ver leerPiezas, ahi se fuerzan a 'normal' antes
  //    de llegar aqui), asi que no hay nada que "mezclar": cada tamano de pieza solo tiene una
  //    orientacion posible.
  //  - 'optimizada': las piezas en Auto SI se pueden girar 90°, pero todas las copias de un mismo
  //    tamano quedan forzadas a la misma orientacion entre si (el "amarre" de empacarConLista
  //    sigue activo). Buen punto medio: aprovecha mejor el tablero que "normal" sin complicarle el
  //    corte al operador de la escuadradora.
  //  - 'completa': ademas de girar, permite que 2 copias identicas queden giradas cada una a su
  //    manera (sin exigir que todas usen la misma orientacion), para aprovechar mejor el material
  //    sin importar la veta. Esto desactiva el "amarre" de orientacion por tamano (ver mas abajo).
  function empacarMaterial(piezas, kerf, libre, nivel, datosTablero){
    const empacar = libre ? empacarConListaLibre : empacarConLista;
    const permitirMezclaOrientacion = nivel === 'completa';
    const criterios = [
      (x,y)=> Math.max(y.l,y.a) - Math.max(x.l,x.a),   // lado mas largo, descendente
      (x,y)=> (y.l*y.a) - (x.l*x.a),                    // area, descendente
      (x,y)=> Math.min(y.l,y.a) - Math.min(x.l,x.a),    // lado mas corto, descendente
      (x,y)=> (y.l+y.a) - (x.l+x.a)                     // perimetro, descendente
    ];
    // Solo en "Completa" se agregan estos 2 criterios extra (mas lentos de calcular, por eso no se
    // usan en Normal/Optimizada): agrupan primero las TANDAS mas grandes de piezas de un mismo
    // tamano (sin importar orientacion), para que el acomodo las procese juntas desde el principio
    // y tienda a formar cuadriculas densas (varias filas y columnas de la misma pieza pegadas)
    // en vez de dispersarlas entre huecos sueltos de otras piezas. Es justo lo que se busca cuando
    // hay muchas copias identicas de una pieza (por ejemplo 28 o mas repeticiones).
    if(nivel === 'completa'){
      const conteoPorTamano = {};
      piezas.forEach(p => {
        const clave = Math.min(p.l,p.a) + 'x' + Math.max(p.l,p.a);
        conteoPorTamano[clave] = (conteoPorTamano[clave]||0) + 1;
      });
      const claveDe = p => Math.min(p.l,p.a) + 'x' + Math.max(p.l,p.a);
      criterios.push((x,y) => {
        const dc = conteoPorTamano[claveDe(y)] - conteoPorTamano[claveDe(x)];
        if(dc !== 0) return dc;
        return (y.l*y.a) - (x.l*x.a);
      });
      criterios.push((x,y) => {
        const dc = conteoPorTamano[claveDe(y)] - conteoPorTamano[claveDe(x)];
        if(dc !== 0) return dc;
        return Math.max(y.l,y.a) - Math.max(x.l,x.a);
      });
    }
    let mejorResultado = null;
    function evaluar(boards){
      const totalCortes = boards.reduce((s,b)=> s+b.cortes, 0);
      let esMejor = !mejorResultado;
      if(!esMejor){
        if(boards.length < mejorResultado.boards.length) esMejor = true;
        else if(boards.length === mejorResultado.boards.length){
          if(totalCortes < mejorResultado.totalCortes) esMejor = true;
        }
      }
      if(esMejor) mejorResultado = {boards, totalCortes};
    }
    criterios.forEach(cmp => evaluar(empacar(
      piezas.slice().sort(cmp),
      kerf,
      permitirMezclaOrientacion,
      datosTablero
    )));
    // ademas de los criterios fijos, se prueban varios ordenes al azar (con semilla fija, para que
    // el resultado no cambie solo) por si algun acomodo distinto aprovecha mejor los sobrantes.
    // En "Completa" se prueban mas semillas (barajadas), porque ahi si importa tardar un poco mas
    // a cambio de un mejor acomodo; en Normal/Optimizada se mantienen las 6 de siempre.
    const semillas = nivel === 'completa' ? 14 : 6;
    for(let semilla=1; semilla<=semillas; semilla++){
      evaluar(empacar(
        barajar(piezas, semilla*97+1),
        kerf,
        permitirMezclaOrientacion,
        datosTablero
      ));
    }
    mejorResultado.boards.forEach(reconstruirSobrantesYFronteras);
    return mejorResultado.boards;
  }

  // ---------- Modo LIBRE (sin restriccion de corte de lado a lado) ----------
  // Igual que empacarConLista pero sin forzar que cada corte parta el hueco de extremo a
  // extremo: una pieza puede acomodarse en cualquier esquina de cualquier hueco libre, y el
  // sobrante puede quedar en forma de "L" (valido para caladora/router/CNC, NO para sierra
  // escuadradora). Se usa solo cuando el usuario desactiva "Corte de extremo a extremo".
  function empacarConListaLibre(ordenadas, kerf, _permitirMezclaOrientacion, datosTablero){
    const boards = [];
    const kerfEntrePiezas = Number.isFinite(datosTablero.kerfEntrePiezas)
      ? datosTablero.kerfEntrePiezas
      : kerf;
    const kerfPiezaSobrante = Number.isFinite(datosTablero.kerfPiezaSobrante)
      ? datosTablero.kerfPiezaSobrante
      : kerf;

    function nuevoTablero(){
      const area = datosTablero.areaColocacion;
      return {
        freeRects:[{x:area.x, y:area.y, w:area.w, h:area.h}],
        pieces:[], cortes:0, corteMm:0,
        boardW:datosTablero.boardW, boardH:datosTablero.boardH,
        areaUtil:{...datosTablero.areaUtil}, areaColocacion:{...area},
        margenes:{...datosTablero.margenes},
        kerf:datosTablero.kerfValor,
        kerfEntrePiezas,
        kerfPiezaSobrante,
        kerfBordeExterior:datosTablero.kerfBordeExterior
      };
    }

    function contenido(a, b){
      if(a.x < b.x-0.001) return false;
      if(a.y < b.y-0.001) return false;
      if(a.x+a.w > b.x+b.w+0.001) return false;
      if(a.y+a.h > b.y+b.h+0.001) return false;
      return true;
    }

    function podarContenidos(freeRects){
      const out = [];
      for(let i=0;i<freeRects.length;i++){
        let dominado = false;
        for(let j=0;j<freeRects.length;j++){
          if(i===j) continue;
          if(!contenido(freeRects[i], freeRects[j])) continue;
          if(contenido(freeRects[j], freeRects[i])){
            if(j<i){ dominado = true; break; }
            continue;
          }
          dominado = true; break;
        }
        if(!dominado) out.push(freeRects[i]);
      }
      return out;
    }

    // true si dos rectangulos se traslapan en area (no solo tocan el borde)
    function seTraslapan(a, b){
      if(a.x >= b.x+b.w-0.001) return false;
      if(a.x+a.w <= b.x+0.001) return false;
      if(a.y >= b.y+b.h-0.001) return false;
      if(a.y+a.h <= b.y+0.001) return false;
      return true;
    }

    // recorta "libre" quitandole el area ocupada por "pieza", regresando hasta 4 rectangulos
    // con la parte de "libre" que SI sigue disponible (metodo clasico de rectangulos libres).
    function recortarLibre(libre, pieza){
      const out = [];
      if(pieza.x > libre.x+0.001) out.push({x:libre.x, y:libre.y, w:pieza.x-libre.x, h:libre.h});
      if(pieza.x+pieza.w < libre.x+libre.w-0.001) out.push({x:pieza.x+pieza.w, y:libre.y, w:(libre.x+libre.w)-(pieza.x+pieza.w), h:libre.h});
      if(pieza.y > libre.y+0.001) out.push({x:libre.x, y:libre.y, w:libre.w, h:pieza.y-libre.y});
      if(pieza.y+pieza.h < libre.y+libre.h-0.001) out.push({x:libre.x, y:pieza.y+pieza.h, w:libre.w, h:(libre.y+libre.h)-(pieza.y+pieza.h)});
      return out.filter(r => Math.min(r.w, r.h) > 0.01);
    }

    ordenadas.forEach((p) => {
      let opciones;
      if(p.girarModo === 'normal'){
        opciones = [{w:p.l, h:p.a, rotada:false}];
      } else if(p.girarModo === 'rotado'){
        opciones = [{w:p.a, h:p.l, rotada:true}];
      } else {
        opciones = [{w:p.l, h:p.a, rotada:false}];
        if(p.l !== p.a) opciones.push({w:p.a, h:p.l, rotada:true});
      }

      // se busca, entre todos los huecos libres de todos los tableros abiertos, el que deje
      // menos area sobrante (mejor aprovechamiento posible), sin exigir que el hueco quede
      // partido de lado a lado.
      let mejor = null;
      boards.forEach((board, bi) => {
        board.freeRects.forEach((rect, ri) => {
          opciones.forEach(opcion => {
            const op = calcularHuellaEnRectangulo(opcion, rect, kerfEntrePiezas);
            if(!op) return;
            const areaSobrante = rect.w*rect.h - op.fw*op.fh;
            if(!mejor || areaSobrante < mejor.areaSobrante-0.001) mejor = {bi, ri, op, areaSobrante};
          });
        });
      });

      let board, rect;
      if(mejor){
        board = boards[mejor.bi];
        rect = board.freeRects[mejor.ri];
      } else {
        const rectBase = datosTablero.areaColocacion;
        const validas = opciones
          .map(opcion => calcularHuellaEnRectangulo(opcion, rectBase, kerfEntrePiezas))
          .filter(Boolean);
        if(!validas.length) return;
        board = nuevoTablero();
        boards.push(board);
        rect = board.freeRects[0];
        let mejorNuevo = null;
        validas.forEach(op => {
          const areaSobrante = rect.w*rect.h - op.fw*op.fh;
          if(!mejorNuevo || areaSobrante < mejorNuevo.areaSobrante-0.001) mejorNuevo = {op, areaSobrante};
        });
        mejor = mejorNuevo;
      }

      const op = mejor.op;
      const piezaRect = {x:rect.x, y:rect.y, w:op.fw, h:op.fh};
      board.pieces.push({...p, x:rect.x, y:rect.y, w:op.w, h:op.h, rotada:op.rotada});

      // se recortan TODOS los huecos libres que se traslapen con la pieza recien colocada
      // (no solo el elegido), como exige el metodo de rectangulos libres en modo libre.
      const nuevos = [];
      board.freeRects.forEach(r => {
        if(seTraslapan(r, piezaRect)){
          const partes = recortarLibre(r, piezaRect);
          nuevos.push(...partes);
          board.cortes += partes.length;
          partes.forEach(pt => { board.corteMm += (Math.abs(pt.w-r.w)<0.01 ? pt.w : pt.h); });
        } else {
          nuevos.push(r);
        }
      });
      board.freeRects = podarContenidos(nuevos);
    });

    return boards;
  }

  function empacarConLista(ordenadas, kerf, permitirMezclaOrientacion, datosTablero){
    const boards = [];
    const kerfEntrePiezas = Number.isFinite(datosTablero.kerfEntrePiezas)
      ? datosTablero.kerfEntrePiezas
      : kerf;
    const kerfPiezaSobrante = Number.isFinite(datosTablero.kerfPiezaSobrante)
      ? datosTablero.kerfPiezaSobrante
      : kerf;
    // Buena practica de corte con escuadradora: evitar que piezas del mismo tamano (mismo largo x
    // ancho, en modo automatico) terminen unas normales y otras giradas 90 grados dentro de la
    // misma optimizacion, porque eso obliga al operador a cambiar de referencia entre piezas
    // identicas. Aqui se recuerda, por tamano de pieza, cual orientacion se uso la PRIMERA vez que
    // se coloco una pieza automatica de ese tamano, para que todas las copias siguientes usen esa
    // misma orientacion (si el usuario ya fijo la pieza como "Normal" o "Girado 90" a mano, eso no
    // se toca: esto solo aplica a piezas en modo Auto).
    // Con la calidad "Completa" (permitirMezclaOrientacion=true) este amarre se desactiva por
    // completo: cada copia elige la orientacion que mejor le quede en ese momento, aunque termine
    // distinta a otra copia identica, para aprovechar mejor el material sin importar la veta.
    const orientacionElegida = {};

    function nuevoTablero(){
      // ultimaClaveTam / huecosRecientes: recuerdan el tamano de la ultima pieza colocada en
      // este tablero y en cuales huecos quedo justo al lado, para que la siguiente pieza IGUAL
      // se intente acomodar ahi primero (ver mas abajo) en vez de dispersarse por el tablero.
      // ultimaPos: posicion exacta de esa ultima pieza, usada como referencia de "adyacencia"
      // cuando el paso 1 no encuentra hueco y hay que buscar en todo el tablero (paso 2).
      const area = datosTablero.areaColocacion;
      return {
        freeRects:[{x:area.x, y:area.y, w:area.w, h:area.h}],
        pieces:[], cortes:0, corteMm:0,
        ultimaClaveTam:null, huecosRecientes:[], ultimaPos:null,
        boardW:datosTablero.boardW, boardH:datosTablero.boardH,
        areaUtil:{...datosTablero.areaUtil}, areaColocacion:{...area},
        margenes:{...datosTablero.margenes},
        kerf:datosTablero.kerfValor,
        kerfEntrePiezas,
        kerfPiezaSobrante,
        kerfBordeExterior:datosTablero.kerfBordeExterior
      };
    }

    // identifica el "tamano" de una pieza sin importar si quedo girada o no, para saber si dos
    // piezas son iguales entre si (mismo largo x ancho, en cualquier orientacion).
    function claveTamano(l, a){
      return Math.min(l,a) + 'x' + Math.max(l,a);
    }

    // tamano de la "corrida" (tanda de piezas consecutivas del mismo tamano, en el orden en que se
    // van a colocar) a la que pertenece cada indice de "ordenadas". Se usa para saber si a una
    // pieza le siguen (o le preceden) otras iguales, y asi preferir huecos grandes que alcancen
    // para toda la tanda en vez del ajuste mas apretado posible.
    const tamanoCorrida = new Array(ordenadas.length);
    {
      let inicio = 0;
      for(let i=1; i<=ordenadas.length; i++){
        const claveActual = i<ordenadas.length ? claveTamano(ordenadas[i].l, ordenadas[i].a) : null;
        const claveInicio = claveTamano(ordenadas[inicio].l, ordenadas[inicio].a);
        if(i===ordenadas.length || claveActual!==claveInicio){
          for(let j=inicio; j<i; j++) tamanoCorrida[j] = i-inicio;
          inicio = i;
        }
      }
    }

    // cuantas piezas automaticas (con largo distinto de ancho) hay de cada tamano, sin importar
    // el orden: una pieza SUELTA (solo 1 copia en todo el proyecto) no tiene con quien mantener
    // consistencia de orientacion, asi que a esas mejor se les deja libres las 2 orientaciones,
    // para que el buscador de huecos elija la que mejor aproveche el sobrante que ya exista en
    // algun tablero (en vez de forzarla a una orientacion "de fabrica" que a lo mejor no cabe en
    // ningun hueco libre real y obliga a abrir un tablero nuevo solo para ella).
    const conteoAutoPorTamano = {};
    ordenadas.forEach(p => {
      if(p.girarModo !== 'auto') return;
      if(p.l === p.a) return;
      const clave = claveTamano(p.l, p.a);
      conteoAutoPorTamano[clave] = (conteoAutoPorTamano[clave] || 0) + 1;
    });

    // se decide de una vez, ANTES de acomodar ninguna pieza, que orientacion usara cada tamano de
    // pieza automatica repetido (2 copias o mas): la que quepa mas veces en un tablero vacio en
    // cuadricula simple (fw x fh). Es un indicador rapido y confiable de que orientacion aprovecha
    // mejor el tablero para piezas repetidas, y evita que la orientacion "ganadora" quede decidida
    // al azar por donde le toco caer a la primera copia colocada (lo que a veces obligaba a abrir
    // un tablero de mas solo por consistencia).
    if(!permitirMezclaOrientacion){
      ordenadas.forEach(p => {
        if(p.girarModo !== 'auto') return;
        if(p.l === p.a) return;
        const clave = claveTamano(p.l, p.a);
        if(conteoAutoPorTamano[clave] <= 1) return;
        if(orientacionElegida[clave] !== undefined) return;
        const area = datosTablero.areaColocacion;
        const capNormal = capacidadLinealConKerf(area.w, p.l, kerfEntrePiezas)
          * capacidadLinealConKerf(area.h, p.a, kerfEntrePiezas);
        const capRotada = capacidadLinealConKerf(area.w, p.a, kerfEntrePiezas)
          * capacidadLinealConKerf(area.h, p.l, kerfEntrePiezas);
        orientacionElegida[clave] = capRotada > capNormal;
      });
    }

    // corta el rectangulo libre "rect" para sacarle, en su esquina superior izquierda, una pieza
    // de fw x fh (ya con el kerf incluido). Devuelve hasta 2 rectangulos libres sobrantes y
    // cuantos cortes rectos hicieron falta (para el reporte de costo de corte).
    function splitFreeRect(rect, fw, fh){
      const rects = [];
      const rightW = rect.w - fw, bottomH = rect.h - fh;
      let cortes = 0, corteMm = 0;
      if(rightW <= bottomH){
        if(bottomH > 0){ rects.push({x:rect.x, y:rect.y+fh, w:rect.w, h:bottomH}); cortes++; corteMm += rect.w; }
        if(rightW > 0){ rects.push({x:rect.x+fw, y:rect.y, w:rightW, h:fh}); cortes++; corteMm += fh; }
      } else {
        if(rightW > 0){ rects.push({x:rect.x+fw, y:rect.y, w:rightW, h:rect.h}); cortes++; corteMm += rect.h; }
        if(bottomH > 0){ rects.push({x:rect.x, y:rect.y+fh, w:fw, h:bottomH}); cortes++; corteMm += fw; }
      }
      return {rects, cortes, corteMm};
    }

    // true si el rectangulo "a" cabe completamente adentro de "b"
    function contenido(a, b){
      if(a.x < b.x-0.001) return false;
      if(a.y < b.y-0.001) return false;
      if(a.x+a.w > b.x+b.w+0.001) return false;
      if(a.y+a.h > b.y+b.h+0.001) return false;
      return true;
    }

    // quita rectangulos libres que quedaron totalmente adentro de otro (fragmentos inservibles)
    function podarContenidos(freeRects){
      const out = [];
      for(let i=0;i<freeRects.length;i++){
        let dominado = false;
        for(let j=0;j<freeRects.length;j++){
          if(i===j) continue;
          if(!contenido(freeRects[i], freeRects[j])) continue;
          if(contenido(freeRects[j], freeRects[i])){
            if(j<i){ dominado = true; break; }
            continue;
          }
          dominado = true; break;
        }
        if(!dominado) out.push(freeRects[i]);
      }
      return out;
    }

    // compara dos posibles colocaciones: se prefiere la que deje el sobrante mas parejo
    // (lado corto minimo y, a igualdad, lado largo minimo), asi se evitan tiras muy angostas.
    function esMejorCandidato(cand, actual){
      if(!actual) return true;
      if(cand.shortSide < actual.shortSide - 0.001) return true;
      if(cand.shortSide > actual.shortSide + 0.001) return false;
      return cand.longSide < actual.longSide;
    }

    ordenadas.forEach((p, idx) => {
      // orientaciones posibles: {w,h,rotada}, segun el modo elegido en la columna Girar
      let opciones;
      if(p.girarModo === 'normal'){
        opciones = [{w:p.l, h:p.a, rotada:false}];
      } else if(p.girarModo === 'rotado'){
        opciones = [{w:p.a, h:p.l, rotada:true}];
      } else {
        opciones = [{w:p.l, h:p.a, rotada:false}];
        if(p.l !== p.a) opciones.push({w:p.a, h:p.l, rotada:true});
      }
      const clave = claveTamano(p.l, p.a);
      // si ya se eligio una orientacion para este tamano de pieza (en una copia automatica
      // anterior), se descarta la otra opcion para que esta copia use forzosamente la misma.
      if(p.girarModo === 'auto'){
        if(opciones.length > 1){
          if(orientacionElegida[clave] !== undefined){
            opciones = opciones.filter(op => op.rotada === orientacionElegida[clave]);
          }
        }
      }
      // true si esta pieza viene en una tanda de mas de una del mismo tamano (aunque sea la
      // ultima de la tanda), para saber si conviene priorizar huecos "grandes" sobre el ajuste
      // mas apretado en la busqueda global (paso 2).
      const enTandaRepetida = tamanoCorrida[idx] > 1;

      // distancia (manhattan) de un hueco candidato al punto de "continuacion natural" (a la
      // derecha o debajo) de la ultima pieza IGUAL colocada en ese tablero; sirve para preferir,
      // entre varios huecos con la misma capacidad, el que quede pegado a la pieza anterior.
      function distanciaAdyacencia(board, rect){
        if(!board.ultimaPos || board.ultimaClaveTam !== clave) return Infinity;
        const last = board.ultimaPos;
        const dRight = Math.abs(rect.x-(last.x+last.w)) + Math.abs(rect.y-last.y);
        const dBelow = Math.abs(rect.y-(last.y+last.h)) + Math.abs(rect.x-last.x);
        return Math.min(dRight, dBelow);
      }

      // 1) prioridad: si la ULTIMA pieza colocada en algun tablero fue del mismo tamano que esta
      // (mismo largo x ancho, sin importar si alguna se giro), se intenta seguir justo al lado de
      // ella, en los huecos que dejo esa colocacion, antes de buscar en todo el tablero. Asi las
      // piezas iguales quedan juntas y pegadas a un borde en vez de dispersarse por rincones
      // sueltos que ademas fragmentan el sobrante en pedazos chicos e inutiles.
      let mejor = null;
      boards.forEach((board, bi) => {
        if(board.ultimaClaveTam !== clave) return;
        board.huecosRecientes.forEach(ri => {
          const rect = board.freeRects[ri];
          if(!rect) return;
          opciones.forEach(opcion => {
            const op = calcularHuellaEnRectangulo(opcion, rect, kerfEntrePiezas);
            if(!op) return;
            const leftoverW = rect.w-op.fw, leftoverH = rect.h-op.fh;
            const cand = {bi, ri, op, shortSide:Math.min(leftoverW,leftoverH), longSide:Math.max(leftoverW,leftoverH)};
            if(esMejorCandidato(cand, mejor)) mejor = cand;
          });
        });
      });

      // 2) si no hay una pieza igual justo antes (o no cupo a su lado), se busca entre TODOS los
      // huecos libres de TODOS los tableros ya abiertos. Si esta pieza pertenece a una tanda de
      // varias iguales, se prefiere el hueco con mas "capacidad" (cuantas copias de esta pieza
      // caben ahi, en cuadricula simple) para que la tanda completa quepa junta en el area grande,
      // en vez de ir a parar a un rincon ajustado que solo alcanza para una sola; a igualdad de
      // capacidad, se prefiere el hueco mas pegado a la ultima pieza igual ya colocada. Para
      // piezas sueltas (sin tanda), se mantiene el criterio original de ajuste mas parejo.
      if(!mejor){
        let mejorAux = null;
        boards.forEach((board, bi) => {
          board.freeRects.forEach((rect, ri) => {
            opciones.forEach(opcion => {
              const op = calcularHuellaEnRectangulo(opcion, rect, kerfEntrePiezas);
              if(!op) return;
              const leftoverW = rect.w-op.fw, leftoverH = rect.h-op.fh;
              const cand = {
                bi, ri, op,
                capacidad: capacidadLinealConKerf(rect.w, op.w, kerfEntrePiezas)
                  * capacidadLinealConKerf(rect.h, op.h, kerfEntrePiezas),
                adyacencia: distanciaAdyacencia(board, rect),
                shortSide: Math.min(leftoverW,leftoverH), longSide: Math.max(leftoverW,leftoverH)
              };
              const esMejor = (actual) => {
                if(!actual) return true;
                if(enTandaRepetida){
                  if(cand.capacidad !== actual.capacidad) return cand.capacidad > actual.capacidad;
                  if(cand.adyacencia !== actual.adyacencia) return cand.adyacencia < actual.adyacencia;
                }
                if(cand.shortSide < actual.shortSide - 0.001) return true;
                if(cand.shortSide > actual.shortSide + 0.001) return false;
                return cand.longSide < actual.longSide;
              };
              if(esMejor(mejorAux)) mejorAux = cand;
            });
          });
        });
        mejor = mejorAux;
      }

      let board, rect;
      if(mejor){
        board = boards[mejor.bi];
        rect = board.freeRects[mejor.ri];
      } else {
        // no cupo en ningun tablero existente: se abre uno nuevo
        const rectBase = datosTablero.areaColocacion;
        const validas = opciones
          .map(opcion => calcularHuellaEnRectangulo(opcion, rectBase, kerfEntrePiezas))
          .filter(Boolean);
        if(!validas.length) return; // no cabe en ninguna orientacion (ya se filtro antes en leerPiezas)
        board = nuevoTablero();
        boards.push(board);
        rect = board.freeRects[0];
        let mejorNuevo = null;
        validas.forEach(op => {
          const leftoverW = rect.w-op.fw, leftoverH = rect.h-op.fh;
          const cand = {op, shortSide:Math.min(leftoverW,leftoverH), longSide:Math.max(leftoverW,leftoverH)};
          if(esMejorCandidato(cand, mejorNuevo)) mejorNuevo = cand;
        });
        mejor = mejorNuevo;
      }

      const op = mejor.op;
      if(!permitirMezclaOrientacion){
        if(p.girarModo === 'auto'){
          if(p.l !== p.a){
            if(orientacionElegida[clave] === undefined){
              orientacionElegida[clave] = op.rotada;
            }
          }
        }
      }
      board.pieces.push({...p, x:rect.x, y:rect.y, w:op.w, h:op.h, rotada:op.rotada});
      const {rects: nuevos, cortes, corteMm} = splitFreeRect(rect, op.fw, op.fh);
      board.cortes += cortes;
      board.corteMm += corteMm;
      board.freeRects.splice(board.freeRects.indexOf(rect), 1, ...nuevos);
      board.freeRects = podarContenidos(board.freeRects);
      // se recuerda el tamano de esta pieza, en cuales huecos quedo (para el paso 1 de la
      // siguiente vuelta) y su posicion exacta (para el desempate por adyacencia del paso 2).
      board.ultimaClaveTam = clave;
      board.huecosRecientes = nuevos.map(r => board.freeRects.indexOf(r)).filter(i => i !== -1);
      board.ultimaPos = {x:rect.x, y:rect.y, w:op.w, h:op.h};
    });

    return boards;
  }

  // "limite" recorta cuantos sobrantes se devuelven (6 en pantalla, para no saturar la tarjeta);
  // sin limite (usado en el Excel exportable) regresa TODOS los sobrantes aprovechables del tablero.
  function calcularSobrantes(board, limite){
    const MIN_UTIL = 60; // mm minimos en cada lado para que un sobrante sea realmente aprovechable
    const lista = board.freeRects
      .filter(r => !(r.w<MIN_UTIL || r.h<MIN_UTIL))
      .map(r => ({w:Math.round(r.w), h:Math.round(r.h)}))
      .sort((a,z)=> (z.w*z.h)-(a.w*a.h));
    return limite ? lista.slice(0, limite) : lista;
  }

  // Area libre final, ya descontados kerf exterior, corredores entre piezas y separaciones contra
  // sobrante. freeRects se reconstruye sin traslapes, asi que sus areas se pueden sumar.
  function areaSobranteTotal(board){
    return Math.max(0, (board.freeRects || []).reduce((s,r) => s + r.w*r.h, 0));
  }

  function contarCortes(board){
    return {cortes: board.cortes, largoMm: board.corteMm};
  }

  // true si el rectangulo "a" cabe completamente adentro de "b" (con un pequeno margen de
  // tolerancia para redondeos). Se usa para descartar sobrantes que ya estan cubiertos por otro
  // sobrante mas grande, y asi no listar el mismo hueco dos veces.
  function rectContenidoEn(a, b){
    if(a.x < b.x-0.001) return false;
    if(a.y < b.y-0.001) return false;
    if(a.x+a.w > b.x+b.w+0.001) return false;
    if(a.y+a.h > b.y+b.h+0.001) return false;
    return true;
  }
  function podarRectsContenidos(rects){
    const out = [];
    for(let i=0;i<rects.length;i++){
      let dominado = false;
      for(let j=0;j<rects.length;j++){
        if(i===j) continue;
        if(!rectContenidoEn(rects[i], rects[j])) continue;
        if(rectContenidoEn(rects[j], rects[i])){
          if(j<i){ dominado = true; break; }
          continue;
        }
        dominado = true; break;
      }
      if(!dominado) out.push(rects[i]);
    }
    return out;
  }

  // Junta en uno solo los huecos vacios que quedan pegados uno junto a otro y miden exactamente
  // lo mismo de ancho (uno arriba del otro) o de alto (uno junto al otro): sin esto, un mismo hueco
  // "real" (por ejemplo la franja angosta entre dos columnas de piezas) puede quedar partido en
  // varios pedacitos nada mas porque distintas piezas lo fueron recortando por separado, y eso hacia
  // que se dibujaran cotas dobles o encimadas para lo que en realidad es un solo espacio.
  function fusionarRectsAdyacentes(rects){
    let actual = rects.slice();
    let siguioCambiando = true;
    while(siguioCambiando){
      siguioCambiando = false;
      busqueda:
      for(let i=0;i<actual.length;i++){
        for(let j=i+1;j<actual.length;j++){
          const a = actual[i], b = actual[j];
          const mismoAncho = Math.abs(a.x-b.x)<0.5 ? Math.abs(a.w-b.w)<0.5 : false;
          if(mismoAncho){
            if(Math.abs((a.y+a.h)-b.y)<0.5){
              const fusion = {x:a.x, y:a.y, w:a.w, h:a.h+b.h};
              actual = actual.filter((r,k) => k!==i ? k!==j : false);
              actual.push(fusion);
              siguioCambiando = true; break busqueda;
            }
            if(Math.abs((b.y+b.h)-a.y)<0.5){
              const fusion = {x:b.x, y:b.y, w:b.w, h:a.h+b.h};
              actual = actual.filter((r,k) => k!==i ? k!==j : false);
              actual.push(fusion);
              siguioCambiando = true; break busqueda;
            }
          }
          const mismoAlto = Math.abs(a.y-b.y)<0.5 ? Math.abs(a.h-b.h)<0.5 : false;
          if(mismoAlto){
            if(Math.abs((a.x+a.w)-b.x)<0.5){
              const fusion = {x:a.x, y:a.y, w:a.w+b.w, h:a.h};
              actual = actual.filter((r,k) => k!==i ? k!==j : false);
              actual.push(fusion);
              siguioCambiando = true; break busqueda;
            }
            if(Math.abs((b.x+b.w)-a.x)<0.5){
              const fusion = {x:b.x, y:b.y, w:a.w+b.w, h:a.h};
              actual = actual.filter((r,k) => k!==i ? k!==j : false);
              actual.push(fusion);
              siguioCambiando = true; break busqueda;
            }
          }
        }
      }
    }
    return actual;
  }

  function interseccionRectangulos(a, b){
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x+a.w, b.x+b.w);
    const y2 = Math.min(a.y+a.h, b.y+b.h);
    if(x2-x1 <= 0.001 || y2-y1 <= 0.001) return null;
    return {x:x1, y:y1, w:x2-x1, h:y2-y1};
  }

  // Resta un obstaculo rectangular produciendo regiones que no se traslapan entre si.
  function restarObstaculoRectangular(rect, obstaculo){
    const inter = interseccionRectangulos(rect, obstaculo);
    if(!inter) return [rect];
    const out = [];
    const arriba = inter.y-rect.y;
    const abajo = rect.y+rect.h-(inter.y+inter.h);
    const izquierda = inter.x-rect.x;
    const derecha = rect.x+rect.w-(inter.x+inter.w);
    if(arriba > 0.001) out.push({x:rect.x, y:rect.y, w:rect.w, h:arriba});
    if(abajo > 0.001) out.push({x:rect.x, y:inter.y+inter.h, w:rect.w, h:abajo});
    if(izquierda > 0.001) out.push({x:rect.x, y:inter.y, w:izquierda, h:inter.h});
    if(derecha > 0.001) out.push({x:inter.x+inter.w, y:inter.y, w:derecha, h:inter.h});
    return out;
  }

  function calcularRectsLibresDesdeObstaculos(area, obstaculos){
    let libres = [{x:area.x, y:area.y, w:area.w, h:area.h}];
    (obstaculos || []).forEach(obstaculo => {
      const siguientes = [];
      libres.forEach(rect => siguientes.push(...restarObstaculoRectangular(rect, obstaculo)));
      libres = siguientes;
    });
    return fusionarRectsAdyacentes(podarRectsContenidos(libres));
  }

  // Huecos provisionales para mover o girar una pieza. Solo reservan between_pieces; nunca
  // clasifican prematuramente material libre como sobrante definitivo.
  function calcularFreeRectsPara(pieces, idxExcluir, boardW, boardH, areaUtil, kerf){
    const area = areaUtil || {x:0, y:0, w:boardW, h:boardH};
    const kerfNum = Number.isFinite(kerf) ? kerf : 0;
    const obstaculos = [];
    pieces.forEach((p, i) => {
      if(i === idxExcluir) return;
      const ocupaW = p.w + ((p.x+p.w) < (area.x+area.w)-0.001 ? kerfNum : 0);
      const ocupaH = p.h + ((p.y+p.h) < (area.y+area.h)-0.001 ? kerfNum : 0);
      obstaculos.push({x:p.x, y:p.y, w:ocupaW, h:ocupaH});
    });
    return calcularRectsLibresDesdeObstaculos(area, obstaculos);
  }

  function crearFronterasEntrePiezas(board){
    const kerf = Number.isFinite(board.kerfEntrePiezas) ? board.kerfEntrePiezas : 0;
    if(!(kerf > 0)) return [];
    const fronteras = [];
    const piezas = board.pieces || [];
    for(let i=0;i<piezas.length;i++){
      for(let j=i+1;j<piezas.length;j++){
        const a = piezas[i], b = piezas[j];
        const pares = [[a,b],[b,a]];
        pares.forEach(par => {
          const izq = par[0], der = par[1];
          const gap = der.x-(izq.x+izq.w);
          const y1 = Math.max(izq.y, der.y);
          const y2 = Math.min(izq.y+izq.h, der.y+der.h);
          if(gap > 0.001 && gap <= kerf+0.001 && y2-y1 > 0.001){
            fronteras.push({x:izq.x+izq.w, y:y1, w:gap, h:y2-y1, tipo:'entre_piezas'});
          }
          const arriba = par[0], abajo = par[1];
          const gapY = abajo.y-(arriba.y+arriba.h);
          const x1 = Math.max(arriba.x, abajo.x);
          const x2 = Math.min(arriba.x+arriba.w, abajo.x+abajo.w);
          if(gapY > 0.001 && gapY <= kerf+0.001 && x2-x1 > 0.001){
            fronteras.push({x:x1, y:arriba.y+arriba.h, w:x2-x1, h:gapY, tipo:'entre_piezas'});
          }
        });
      }
    }
    return fronteras;
  }

  function crearFronterasPiezaSobrante(board, fronterasEntrePiezas){
    const kerf = Number.isFinite(board.kerfPiezaSobrante) ? board.kerfPiezaSobrante : 0;
    if(!(kerf > 0)) return [];
    const area = obtenerAreaColocacionBoard(board);
    const piezasFisicas = (board.pieces || []).map(p => ({x:p.x, y:p.y, w:p.w, h:p.h}));
    const obstaculosNoSobrante = piezasFisicas.concat(fronterasEntrePiezas || []);
    const fronteras = [];
    piezasFisicas.forEach(p => {
      const inflado = interseccionRectangulos(area, {
        x:p.x-kerf, y:p.y-kerf, w:p.w+kerf*2, h:p.h+kerf*2
      });
      if(!inflado) return;
      calcularRectsLibresDesdeObstaculos(inflado, obstaculosNoSobrante).forEach(r => {
        fronteras.push({...r, tipo:'pieza_sobrante'});
      });
    });
    return fronteras;
  }

  function crearFronterasExteriores(board){
    const kerf = Number.isFinite(board.kerfBordeExterior) ? board.kerfBordeExterior : 0;
    if(!(kerf > 0) || !board.areaUtil || !board.areaColocacion) return [];
    const a = board.areaUtil, c = board.areaColocacion;
    return [
      {x:a.x, y:a.y, w:a.w, h:c.y-a.y, tipo:'exterior_top'},
      {x:a.x, y:c.y+c.h, w:a.w, h:a.y+a.h-(c.y+c.h), tipo:'exterior_bottom'},
      {x:a.x, y:c.y, w:c.x-a.x, h:c.h, tipo:'exterior_left'},
      {x:c.x+c.w, y:c.y, w:a.x+a.w-(c.x+c.w), h:c.h, tipo:'exterior_right'}
    ].filter(r => r.w > 0.001 && r.h > 0.001);
  }

  function reconstruirSobrantesYFronteras(board){
    const area = obtenerAreaColocacionBoard(board);
    const piezasFisicas = (board.pieces || []).map(p => ({x:p.x, y:p.y, w:p.w, h:p.h}));
    const entrePiezas = crearFronterasEntrePiezas(board);
    const piezaSobrante = crearFronterasPiezaSobrante(board, entrePiezas);
    const exterior = crearFronterasExteriores(board);
    board.fronterasKerf = {entrePiezas, piezaSobrante, exterior};
    board.freeRects = calcularRectsLibresDesdeObstaculos(
      area,
      piezasFisicas.concat(entrePiezas, piezaSobrante)
    );
    board.areaSobranteMm2 = board.freeRects.reduce((s,r) => s+r.w*r.h, 0);
  }

  // Vuelve a calcular, desde cero, la lista de huecos vacios (freeRects) de un tablero a partir
  // de donde estan REALMENTE colocadas sus piezas en este momento. Hace falta llamarla despues de
  // mover, girar o cualquier ajuste manual del acomodo, porque esos ajustes ya no siguen la logica
  // del algoritmo de empacado automatico (que es el que normalmente mantiene freeRects al dia).
  function recalcularFreeRectsDesdeCero(board){
    reconstruirSobrantesYFronteras(board);
  }

  function dibujarBoard(board, kerf, anchoDisponible, estilo){
    const est = estilo || {};
    const colorPieza = est.colorPieza || '#2563eb';
    const colorPieza2 = est.colorPieza2 || '#6b7280';
    const colorSobrante = est.colorSobrante || '#ea580c';
    const colorSobrante2 = est.colorSobrante2 || '#0d9488';
    const capFsTablero = est.fsTablero || 11;
    const capFsPiezaMedida = est.fsPiezaMedida || 11;
    const capFsPiezaNum = est.fsPiezaNum || 13;
    const capFsSobrante = est.fsSobrante || 8;
    const mostrarNumero = est.mostrarNumero !== false;
    const mostrarMedidas = est.mostrarMedidas !== false;
    const mostrarFlechas = est.mostrarFlechas !== false;
    // estilo de linea (solida, punteada o discontinua), configurable por separado para el corte de
    // las piezas, el enchapado y la flecha de sobrantes.
    function estiloADash(valor){
      if(valor === 'punteada') return '1.5,2.5';
      if(valor === 'discontinua') return '6,3';
      return '';
    }
    const dashCorte = estiloADash(est.lineaCorte);
    const dashTapacanto = estiloADash(est.lineaTapacanto);
    const dashSobrante = estiloADash(est.lineaSobrante);
    // la linea que llega hasta la pieza por defecto es punteada (para distinguirla de la flecha),
    // pero tambien se puede poner solida o discontinua.
    function dashHastaTopeDe(valor){
      if(valor === 'solida') return '';
      if(valor === 'discontinua') return '6,3';
      return '2,2'; // punteada, o si no se eligio nada todavia
    }
    const dashHastaTope = dashHastaTopeDe(est.lineaHastaTope);
    const tipoFlecha = est.tipoFlechaSobrante || 'triangulo';
    const tamanoPunta = est.tamanoPuntaFlecha || 6;
    const grosorCorte = est.grosorCorte || 1;
    const grosorTapacanto = est.grosorTapacanto || 3;
    const grosorFlechaSobrante = est.grosorFlechaSobrante || 1.3;
    const grosorLineaSobrante = est.grosorLineaSobrante || 0.6;
    const scale = (anchoDisponible || 760) / board.boardW;

    // sobrantes que se van a acotar por fuera del tablero, como en un plano (maximo 4 para que no
    // se amontonen las lineas de cota). Se usa el mismo criterio de tamano minimo aprovechable.
    // si el usuario oculto las flechas de sobrantes, se trata como si no hubiera ninguno que acotar.
    const MIN_ANOTAR = 60;
    const sobrantesAnotar = !mostrarFlechas ? [] : board.freeRects
      .filter(r => !(r.w<MIN_ANOTAR || r.h<MIN_ANOTAR))
      .sort((a,z)=> (z.w*z.h)-(a.w*a.h))
      .slice(0,4);
    // la separacion entre cotas apiladas y el colchon para el numero "de afuera" escalan con el
    // tamano de letra elegido, para que no se encimen ni se corten si el usuario agranda la letra.
    const filaCota = Math.max(15, capFsSobrante*1.8); // separacion entre cada fila de cota apilada (arriba/abajo, horizontal)
    const filaCotaV = Math.max(20, capFsSobrante*2.3); // separacion entre cada columna de cota apilada (derecha, vertical)
    const colchonAfuera = Math.max(20, capFsSobrante*3); // espacio extra por si el numero se saca por fuera de las flechas

    // el ancho del sobrante se acota arriba del tablero, salvo que el sobrante llegue hasta el
    // borde de abajo del tablero: en ese caso se acota por debajo, junto a donde realmente esta.
    function tocaAbajo(r){ return (board.boardH - (r.y+r.h)) < 2; }
    const sobrantesArriba = sobrantesAnotar.filter(r => !tocaAbajo(r));
    const sobrantesAbajo = sobrantesAnotar.filter(r => tocaAbajo(r));

    // margenes en px de pantalla: se reserva una fila extra por cada sobrante anotado en cada lado
    // (arriba, abajo y a la derecha), ademas del espacio fijo para las medidas del tablero completo.
    const margenIzq = 34;
    const margenSup = 24 + sobrantesArriba.length*filaCota;
    // + colchonAfuera: si un sobrante es muy angosto/corto, su numero se saca por fuera de las
    // flechas y necesita ese espacio adicional para no quedar cortado por el borde del dibujo.
    const margenDer = 12 + sobrantesAnotar.length*filaCotaV + (sobrantesAnotar.length ? colchonAfuera : 0);
    const margenInf = 10 + sobrantesAbajo.length*filaCota + (sobrantesAbajo.length ? colchonAfuera : 0);
    const w = board.boardW*scale, h = board.boardH*scale;
    const svgW = w + margenIzq + margenDer;
    const svgH = h + margenSup + margenInf;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}" style="background:#fff;">`;
    svg += `<rect x="${margenIzq}" y="${margenSup}" width="${w}" height="${h}" fill="#ffffff" stroke="#333" stroke-width="1.5"/>`;
    // medida del largo del tablero (arriba, horizontal)
    svg += `<text x="${margenIzq + w/2}" y="${margenSup-8}" text-anchor="middle" font-size="${capFsTablero}" fill="#333">${board.boardW} mm</text>`;
    // medida del ancho del tablero (izquierda, vertical)
    const lxTab = margenIzq-11, lyTab = margenSup + h/2;
    svg += `<text x="${lxTab}" y="${lyTab}" text-anchor="middle" font-size="${capFsTablero}" fill="#333" transform="rotate(-90 ${lxTab} ${lyTab})">${board.boardH} mm</text>`;

    // ---- cotas de los sobrantes, por fuera del tablero (arriba el ancho, a la derecha el alto) ----
    // tamano de letra configurable para las medidas de sobrantes: mientras mas grande, mas facil
    // que el numero no quepa entre las dos flechas y se tenga que sacar por fuera para que se vea.
    const fsCota = capFsSobrante;
    const dashAttrSobrante = dashSobrante ? ` stroke-dasharray="${dashSobrante}"` : '';
    // dibuja la punta de una flecha horizontal en (x,y): el tipo (triangulo/abierta/tick) y el
    // tamano son configurables. dirX indica hacia donde se abre la base respecto de la punta
    // (+1 = la base queda a la derecha de la punta, -1 = a la izquierda).
    function puntaH(x, y, dirX, color){
      const mitad = tamanoPunta/2;
      if(tipoFlecha === 'abierta'){
        return `<line x1="${x}" y1="${y}" x2="${x+dirX*tamanoPunta}" y2="${y-mitad}" stroke="${color}" stroke-width="1.4"/>`
             + `<line x1="${x}" y1="${y}" x2="${x+dirX*tamanoPunta}" y2="${y+mitad}" stroke="${color}" stroke-width="1.4"/>`;
      }
      if(tipoFlecha === 'tick'){
        return `<line x1="${x-mitad*0.6}" y1="${y-mitad*0.9}" x2="${x+mitad*0.6}" y2="${y+mitad*0.9}" stroke="${color}" stroke-width="1.6"/>`;
      }
      return `<polygon points="${x},${y} ${x+dirX*tamanoPunta},${y-mitad} ${x+dirX*tamanoPunta},${y+mitad}" fill="${color}"/>`;
    }
    // igual que puntaH pero para una flecha vertical en (x,y); dirY indica hacia donde queda la
    // base respecto de la punta (+1 = abajo, -1 = arriba).
    function puntaV(x, y, dirY, color){
      const mitad = tamanoPunta/2;
      if(tipoFlecha === 'abierta'){
        return `<line x1="${x}" y1="${y}" x2="${x-mitad}" y2="${y+dirY*tamanoPunta}" stroke="${color}" stroke-width="1.4"/>`
             + `<line x1="${x}" y1="${y}" x2="${x+mitad}" y2="${y+dirY*tamanoPunta}" stroke="${color}" stroke-width="1.4"/>`;
      }
      if(tipoFlecha === 'tick'){
        return `<line x1="${x-mitad*0.9}" y1="${y-mitad*0.6}" x2="${x+mitad*0.9}" y2="${y+mitad*0.6}" stroke="${color}" stroke-width="1.6"/>`;
      }
      return `<polygon points="${x},${y} ${x-mitad},${y+dirY*tamanoPunta} ${x+mitad},${y+dirY*tamanoPunta}" fill="${color}"/>`;
    }
    function cotaHorizontal(x1, x2, y, texto, color){
      let s = `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="${grosorFlechaSobrante}"${dashAttrSobrante}/>`;
      s += puntaH(x1, y, 1, color);
      s += puntaH(x2, y, -1, color);
      const requerido = texto.length*fsCota*0.62+6;
      if((x2-x1) >= requerido){
        // cabe entre las dos flechas: se pone centrado arriba de la linea
        s += `<text x="${(x1+x2)/2}" y="${y-3}" text-anchor="middle" font-size="${fsCota}" font-weight="700" fill="${color}">${texto}</text>`;
      } else {
        // no cabe entre las flechas: se saca hacia afuera, despues del extremo derecho
        s += `<text x="${x2+4}" y="${y-3}" text-anchor="start" font-size="${fsCota}" font-weight="700" fill="${color}">${texto}</text>`;
      }
      return s;
    }
    function cotaVertical(y1, y2, x, texto, color){
      const xTexto = x+10; // separada de la linea para que el numero no quede tachado por ella
      const requerido = texto.length*fsCota*0.62+6;
      let yTextoCentro = (y1+y2)/2;
      if((y2-y1) < requerido){
        // no cabe entre las dos flechas: se saca hacia afuera, despues del extremo de abajo
        yTextoCentro = y2 + 4 + requerido/2;
      }
      let s = `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${color}" stroke-width="${grosorFlechaSobrante}"${dashAttrSobrante}/>`;
      s += puntaV(x, y1, 1, color);
      s += puntaV(x, y2, -1, color);
      // fondo blanco detras del numero, para que ninguna linea o borde le quede encima
      const boxLargo = texto.length*fsCota*0.62+4;
      s += `<rect x="${xTexto-5}" y="${yTextoCentro-boxLargo/2}" width="10" height="${boxLargo}" fill="#fff"/>`;
      s += `<text x="${xTexto}" y="${yTextoCentro}" text-anchor="middle" font-size="${fsCota}" font-weight="700" fill="${color}" transform="rotate(-90 ${xTexto} ${yTextoCentro})">${texto}</text>`;
      return s;
    }
    const dashAttrHastaTope = dashHastaTope ? ` stroke-dasharray="${dashHastaTope}"` : '';
    let filaArriba = 0, filaAbajo = 0;
    sobrantesAnotar.forEach((r, i) => {
      // toda la medida (flecha, numero, y la linea que llega hasta la pieza) usa UN solo color, que
      // se alterna entre cada sobrante (igual que el color de las piezas cortadas) para distinguir
      // cual medida es cual, sobre todo cuando hay varias juntas.
      const colorEsteSobrante = i % 2 === 0 ? colorSobrante : colorSobrante2;
      const rx1 = margenIzq + r.x*scale, rx2 = margenIzq + (r.x+r.w)*scale;
      const ry1 = margenSup + r.y*scale, ry2 = margenSup + (r.y+r.h)*scale;

      // ancho del sobrante: arriba del tablero, o por debajo si el sobrante llega hasta el fondo.
      // la linea de extension llega hasta topar con la pieza vecina, del mismo color que la flecha.
      if(tocaAbajo(r)){
        filaAbajo++;
        const yCota = margenSup + h + 8 + filaCota*filaAbajo;
        svg += `<line x1="${rx1}" y1="${ry1}" x2="${rx1}" y2="${yCota+2}" stroke="${colorEsteSobrante}" stroke-width="${grosorLineaSobrante}"${dashAttrHastaTope}/>`;
        svg += `<line x1="${rx2}" y1="${ry1}" x2="${rx2}" y2="${yCota+2}" stroke="${colorEsteSobrante}" stroke-width="${grosorLineaSobrante}"${dashAttrHastaTope}/>`;
        svg += cotaHorizontal(rx1, rx2, yCota, Math.round(r.w) + ' mm', colorEsteSobrante);
      } else {
        filaArriba++;
        const yCota = margenSup - 8 - filaCota*filaArriba;
        svg += `<line x1="${rx1}" y1="${ry2}" x2="${rx1}" y2="${yCota-2}" stroke="${colorEsteSobrante}" stroke-width="${grosorLineaSobrante}"${dashAttrHastaTope}/>`;
        svg += `<line x1="${rx2}" y1="${ry2}" x2="${rx2}" y2="${yCota-2}" stroke="${colorEsteSobrante}" stroke-width="${grosorLineaSobrante}"${dashAttrHastaTope}/>`;
        svg += cotaHorizontal(rx1, rx2, yCota, Math.round(r.w) + ' mm', colorEsteSobrante);
      }

      // alto del sobrante: siempre a la derecha del tablero, misma linea completa hasta la pieza
      const xCota = margenIzq + w + 8 + filaCotaV*(i+1);
      svg += `<line x1="${rx1}" y1="${ry1}" x2="${xCota-2}" y2="${ry1}" stroke="${colorEsteSobrante}" stroke-width="${grosorLineaSobrante}"${dashAttrHastaTope}/>`;
      svg += `<line x1="${rx1}" y1="${ry2}" x2="${xCota-2}" y2="${ry2}" stroke="${colorEsteSobrante}" stroke-width="${grosorLineaSobrante}"${dashAttrHastaTope}/>`;
      svg += cotaVertical(ry1, ry2, xCota, Math.round(r.h) + ' mm', colorEsteSobrante);
    });

    // tamano de letra unico para TODAS las piezas del tablero (mismo tamano en todas, chicas o
    // grandes): se calcula en base a la pieza mas chica, para que el texto quepa en todas.
    let minPw = Infinity, minPh = Infinity;
    board.pieces.forEach(p => {
      const pw = p.w*scale, ph = p.h*scale;
      if(pw < minPw) minPw = pw;
      if(ph < minPh) minPh = ph;
    });
    // el numero de pieza y las medidas de los lados tienen cada uno su propio tope de tamano
    // (configurable en "Apariencia"), pero ambos se siguen achicando si la pieza es muy chica.
    const fs = Math.max(6, Math.min(capFsPiezaNum, minPh/2.4, minPw/3.5));
    const fsLado = Math.max(5, Math.min(capFsPiezaMedida, minPh/2.6, minPw/4));

    const dashAttrCorte = dashCorte ? ` stroke-dasharray="${dashCorte}"` : '';
    const dashAttrTapacanto = dashTapacanto ? ` stroke-dasharray="${dashTapacanto}"` : '';
    board.pieces.forEach((p, idx) => {
        const pw = p.w*scale, ph = p.h*scale;
        const px = margenIzq + p.x*scale, py = margenSup + p.y*scale;
        // colores de pieza alternados (1,2,1,2...) para que se distingan mejor las piezas vecinas
        const colorEstaPieza = idx % 2 === 0 ? colorPieza : colorPieza2;
        // cada pieza va en su propio grupo (con su indice) para poder engancharle despues el
        // arrastre con el mouse y reacomodarla a otro lugar del tablero.
        svg += `<g class="pieza-drag" data-idx="${idx}" style="cursor:move;">`;
        svg += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${colorEstaPieza}" fill-opacity="0.18" stroke="${colorEstaPieza}" stroke-width="${grosorCorte}"${dashAttrCorte}/>`;

        // L1/L2 son siempre el lado MAS LARGO de la pieza y A1/A2 el lado MAS CORTO (sin importar
        // en cual columna, Largo o Ancho, se haya capturado el numero mayor). Por eso aqui se usa
        // el tamano real en pantalla (pw vs ph) para decidir cual par de lados es el largo, en vez
        // de asumirlo por la columna de origen.
        const horizontalEsElLargo = pw >= ph;
        const mapaLados = horizontalEsElLargo
          ? {top:'l1', bottom:'l2', left:'a1', right:'a2'}
          : {right:'l1', left:'l2', top:'a1', bottom:'a2'};
        const bx1 = px, by1 = py, bx2 = px+pw, by2 = py+ph;
        if(p[mapaLados.top])    svg += `<line x1="${bx1}" y1="${by1}" x2="${bx2}" y2="${by1}" stroke="#dc2626" stroke-width="${grosorTapacanto}"${dashAttrTapacanto}/>`;
        if(p[mapaLados.bottom]) svg += `<line x1="${bx1}" y1="${by2}" x2="${bx2}" y2="${by2}" stroke="#dc2626" stroke-width="${grosorTapacanto}"${dashAttrTapacanto}/>`;
        if(p[mapaLados.left])   svg += `<line x1="${bx1}" y1="${by1}" x2="${bx1}" y2="${by2}" stroke="#dc2626" stroke-width="${grosorTapacanto}"${dashAttrTapacanto}/>`;
        if(p[mapaLados.right])  svg += `<line x1="${bx2}" y1="${by1}" x2="${bx2}" y2="${by2}" stroke="#dc2626" stroke-width="${grosorTapacanto}"${dashAttrTapacanto}/>`;

        // numero de la pieza, centrado en medio del rectangulo (si esta activado en Apariencia)
        if(mostrarNumero){
          svg += `<text x="${px+pw/2}" y="${py+ph/2+fs/3}" font-size="${fs}" text-anchor="middle" fill="#1e293b" font-weight="700">#${p.num}</text>`;
        }
        if(mostrarMedidas){
          // medida del lado horizontal (ancho en pantalla), pegada al borde superior de la pieza
          if(pw > fsLado*(String(p.w).length*0.6+1.5)){
            svg += `<text x="${px+pw/2}" y="${py+fsLado+1.5}" font-size="${fsLado}" text-anchor="middle" fill="#475569">${p.w}</text>`;
          }
          // medida del lado vertical (alto en pantalla), pegada al borde izquierdo de la pieza
          if(ph > fsLado*(String(p.h).length*0.6+1.5)){
            const lx = px+fsLado*0.9, ly = py+ph/2;
            svg += `<text x="${lx}" y="${ly}" font-size="${fsLado}" text-anchor="middle" fill="#475569" transform="rotate(-90 ${lx} ${ly})">${p.h}</text>`;
          }
        }
        svg += `<title>Arrastra para mover la pieza #${p.num} a otro lugar del tablero</title>`;
        // boton de rotar (solo un circulo con el icono ⟳): queda oculto por CSS y solo aparece
        // al pasar el cursor sobre la pieza. No se dibuja si la pieza es muy chica para que quepa.
        const cabeBotonRotar = pw > 26 ? ph > 26 : false;
        if(cabeBotonRotar){
          const rCx = px+pw-11, rCy = py+11;
          svg += `<g class="pieza-rotar" data-idx="${idx}">`;
          svg += `<circle cx="${rCx}" cy="${rCy}" r="9" fill="#fff" stroke="#475569" stroke-width="1.2"/>`;
          svg += `<text x="${rCx}" y="${rCy+3.5}" text-anchor="middle" font-size="12" fill="#475569">⟳</text>`;
          svg += `<title>Girar 90° esta pieza</title>`;
          svg += `</g>`;
        }
        svg += `</g>`;
    });
    svg += `</svg>`;
    // guarda la escala y los margenes usados en este dibujo para poder convertir, despues,
    // el arrastre del mouse (en pixeles de pantalla) a milimetros reales dentro del tablero.
    board._geom = {scale, margenIzq, margenSup};
    return svg;
  }

  // Revisa si una pieza (identificada por su indice, para no compararla contra si misma), puesta
  // en el rectangulo x,y,w,h, quedaria encimada con alguna otra pieza ya colocada en el tablero.
  // Se deja un colchon chiquito (EPS) para que tocar el borde de otra pieza no cuente como encime.
  function piezasSeEncimanConOtras(board, idxPropio, x, y, w, h){
    const EPS = 0.5;
    const area = obtenerAreaColocacionBoard(board);
    const kerf = Number.isFinite(board.kerfEntrePiezas)
      ? board.kerfEntrePiezas
      : (Number.isFinite(board.kerf) ? board.kerf : 0);
    if(x < area.x-EPS || y < area.y-EPS) return true;
    if(x+w > area.x+area.w+EPS || y+h > area.y+area.h+EPS) return true;
    return board.pieces.some((otra, j) => {
      if(j === idxPropio) return false;
      const sinTraslape = (x+w+kerf <= otra.x+EPS) || (otra.x+otra.w+kerf <= x+EPS)
        || (y+h+kerf <= otra.y+EPS) || (otra.y+otra.h+kerf <= y+EPS);
      return !sinTraslape;
    });
  }

  // Gira 90° una pieza (intercambia ancho y alto). Primero intenta dejarla en su mismo lugar
  // (recortada si hace falta para no salirse del tablero); si ahi ya no cabe o queda encimada,
  // recorre todos los huecos vacios REALES del tablero (sin contar el espacio que hoy ocupa esta
  // misma pieza, porque ese espacio se libera en cuanto se mueve) y usa el primero donde la pieza
  // ya girada quepa completa y sin encimarse con ninguna otra. Solo si no cabe en ningun lado del
  // tablero se deja la pieza tal cual estaba, sin tocarla.
  function rotarPieza(board, idx){
    const p = board.pieces[idx];
    if(!p) return false;
    const nuevoW = p.h, nuevoH = p.w;
    const candidatos = [];
    const area = obtenerAreaColocacionBoard(board);

    const cabeEnAncho = nuevoW <= area.w;
    const cabeEnAlto = nuevoH <= area.h;
    if(cabeEnAncho){
      if(cabeEnAlto){
        candidatos.push({
          x:Math.max(area.x, Math.min(p.x, area.x+area.w-nuevoW)),
          y:Math.max(area.y, Math.min(p.y, area.y+area.h-nuevoH))
        });
      }
    }

    const libres = calcularFreeRectsPara(
      board.pieces,
      idx,
      board.boardW,
      board.boardH,
      area,
      Number.isFinite(board.kerfEntrePiezas) ? board.kerfEntrePiezas : board.kerf
    );
    libres.forEach(r => {
      if(nuevoW <= r.w){
        if(nuevoH <= r.h){
          candidatos.push({x:r.x, y:r.y});
        }
      }
    });

    for(let i=0;i<candidatos.length;i++){
      const c = candidatos[i];
      if(!piezasSeEncimanConOtras(board, idx, c.x, c.y, nuevoW, nuevoH)){
        p.w = nuevoW; p.h = nuevoH; p.x = c.x; p.y = c.y; p.rotada = !p.rotada;
        // como el hueco vacio del tablero cambia al girar la pieza, se vuelve a calcular de una
        // vez para que "Sobrantes aprovechables" y el area sobrante reflejen el acomodo actual.
        recalcularFreeRectsDesdeCero(board);
        return true;
      }
    }
    return false;
  }

  // Voltea de arriba a abajo el acomodo de piezas de un tablero (como si se le diera vuelta al
  // tablero de arriba a abajo). Es su propio inverso: aplicarlo dos veces deja todo igual que al
  // principio. Util para revisar como se ve el otro lado, sobre todo cuando importa la veta.
  function espejarBoard(board){
    const area = obtenerAreaColocacionBoard(board);
    board.pieces.forEach(p => {
      p.y = area.y + area.h - (p.y-area.y) - p.h;
      // al voltear de arriba a abajo, el borde que antes quedaba arriba ahora queda abajo
      // (y viceversa), asi que hay que intercambiar cual par logico (l1/l2 o a1/a2, segun cual de
      // los dos quede horizontal) es el que se dibuja arriba/abajo.
      if(p.w >= p.h){
        const tmp = p.l1; p.l1 = p.l2; p.l2 = tmp;
      } else {
        const tmp = p.a1; p.a1 = p.a2; p.a2 = tmp;
      }
    });
    recalcularFreeRectsDesdeCero(board);
  }

  // "Gravedad": recorre las piezas de abajo hacia arriba y las va recorriendo lo mas posible hacia
  // abajo (sin encimarse con otra ni salirse del tablero), como si el tablero se sacudiera y cada
  // pieza cayera hasta topar con algo. Con esto, los huecos vacios sueltos y chicos que quedan
  // repartidos entre varias piezas se juntan en un solo hueco mas grande y aprovechable (en vez de
  // dejar varios sobrantes chicos, deja uno solo mas completo). No gira ni voltea ninguna pieza,
  // solo las recorre verticalmente, asi que el enchape L1/L2/A1/A2 de cada una no cambia.
  function compactarHaciaAbajo(board){
    const area = obtenerAreaColocacionBoard(board);
    const kerf = Number.isFinite(board.kerfEntrePiezas)
      ? board.kerfEntrePiezas
      : (Number.isFinite(board.kerf) ? board.kerf : 0);
    const orden = board.pieces.map((p, i) => i).sort((a, b) => board.pieces[b].y - board.pieces[a].y);
    const asentadas = [];
    orden.forEach(i => {
      const p = board.pieces[i];
      let techo = area.y + area.h;
      asentadas.forEach(o => {
        const compartenX = !((p.x+p.w) <= o.x+0.001 || (o.x+o.w) <= p.x+0.001);
        if(compartenX){
          if(o.y-kerf < techo) techo = o.y-kerf;
        }
      });
      p.y = techo - p.h;
      asentadas.push(p);
    });
    recalcularFreeRectsDesdeCero(board);
  }

  // Lo mismo que compactarHaciaAbajo, pero al reves: cada pieza sube lo mas posible (hacia y=0)
  // sin encimarse con otra ni salirse del tablero, como si la gravedad jalara hacia arriba. Con
  // esto, todas las piezas quedan pegadas contra el borde de arriba y el hueco consolidado queda
  // abajo, en vez de al reves.
  function compactarHaciaArriba(board){
    const area = obtenerAreaColocacionBoard(board);
    const kerf = Number.isFinite(board.kerfEntrePiezas)
      ? board.kerfEntrePiezas
      : (Number.isFinite(board.kerf) ? board.kerf : 0);
    const orden = board.pieces.map((p, i) => i).sort((a, b) => board.pieces[a].y - board.pieces[b].y);
    const asentadas = [];
    orden.forEach(i => {
      const p = board.pieces[i];
      let piso = area.y;
      asentadas.forEach(o => {
        const compartenX = !((p.x+p.w) <= o.x+0.001 || (o.x+o.w) <= p.x+0.001);
        if(compartenX){
          const bordeInferior = o.y + o.h + kerf;
          if(bordeInferior > piso) piso = bordeInferior;
        }
      });
      p.y = piso;
      asentadas.push(p);
    });
    recalcularFreeRectsDesdeCero(board);
  }

  // Voltea de izquierda a derecha el acomodo de piezas (como espejarBoard, pero sobre el eje
  // horizontal en vez del vertical). Tambien es su propio inverso.
  function espejarBoardHorizontal(board){
    const area = obtenerAreaColocacionBoard(board);
    board.pieces.forEach(p => {
      p.x = area.x + area.w - (p.x-area.x) - p.w;
      // al voltear de izquierda a derecha, el borde que antes quedaba a la izquierda ahora queda
      // a la derecha (y viceversa); eso intercambia el OTRO par logico respecto al volteo vertical
      // (a1/a2 si el largo esta horizontal, l1/l2 si el largo esta vertical).
      if(p.w >= p.h){
        const tmp = p.a1; p.a1 = p.a2; p.a2 = tmp;
      } else {
        const tmp = p.l1; p.l1 = p.l2; p.l2 = tmp;
      }
    });
    recalcularFreeRectsDesdeCero(board);
  }

  // Igual que compactarHaciaAbajo/Arriba, pero corriendo las piezas horizontalmente: cada una se
  // recorre lo mas posible hacia la izquierda (x=0) sin encimarse con otra ni salirse del tablero.
  function compactarHaciaIzquierda(board){
    const area = obtenerAreaColocacionBoard(board);
    const kerf = Number.isFinite(board.kerfEntrePiezas)
      ? board.kerfEntrePiezas
      : (Number.isFinite(board.kerf) ? board.kerf : 0);
    const orden = board.pieces.map((p, i) => i).sort((a, b) => board.pieces[a].x - board.pieces[b].x);
    const asentadas = [];
    orden.forEach(i => {
      const p = board.pieces[i];
      let pared = area.x;
      asentadas.forEach(o => {
        const compartenY = !((p.y+p.h) <= o.y+0.001 || (o.y+o.h) <= p.y+0.001);
        if(compartenY){
          const bordeDerecho = o.x + o.w + kerf;
          if(bordeDerecho > pared) pared = bordeDerecho;
        }
      });
      p.x = pared;
      asentadas.push(p);
    });
    recalcularFreeRectsDesdeCero(board);
  }

  // Lo mismo, pero hacia la derecha (cada pieza se recorre lo mas posible hacia x=board.boardW).
  function compactarHaciaDerecha(board){
    const area = obtenerAreaColocacionBoard(board);
    const kerf = Number.isFinite(board.kerfEntrePiezas)
      ? board.kerfEntrePiezas
      : (Number.isFinite(board.kerf) ? board.kerf : 0);
    const orden = board.pieces.map((p, i) => i).sort((a, b) => board.pieces[b].x - board.pieces[a].x);
    const asentadas = [];
    orden.forEach(i => {
      const p = board.pieces[i];
      let pared = area.x + area.w;
      asentadas.forEach(o => {
        const compartenY = !((p.y+p.h) <= o.y+0.001 || (o.y+o.h) <= p.y+0.001);
        if(compartenY){
          if(o.x-kerf < pared) pared = o.x-kerf;
        }
      });
      p.x = pared - p.w;
      asentadas.push(p);
    });
    recalcularFreeRectsDesdeCero(board);
  }

  // Como iman: revisa si, cerca de donde se acaba de soltar una pieza (x,y candidatos), hay otra
  // pieza (o el borde del tablero) a la que convenga pegarse. Si esta lo bastante cerca (dentro del
  // UMBRAL), la ajusta para que quede justo pegada, respetando el mismo corte (kerf) que usa el
  // acomodo automatico -- ni encimada ni con un hueco de mas. Cada eje (X, Y) se resuelve aparte,
  // y solo se compara contra piezas cuyo rango en el otro eje se traslape con el de esta pieza
  // (si no, "pegarse" no tendria sentido porque ni siquiera quedarian una junto a la otra).
  function calcularImanes(board, idxPropio, kerf, w, h, x, y){
    const UMBRAL = 18; // mm: que tan cerca tiene que arrimarse para que se pegue solo
    const area = obtenerAreaColocacionBoard(board);
    let mejorX = null, mejorDX = UMBRAL;
    let mejorY = null, mejorDY = UMBRAL;
    function probarX(candidato){
      const d = Math.abs(candidato - x);
      if(d <= mejorDX){ mejorDX = d; mejorX = candidato; }
    }
    function probarY(candidato){
      const d = Math.abs(candidato - y);
      if(d <= mejorDY){ mejorDY = d; mejorY = candidato; }
    }
    probarX(area.x); probarX(area.x + area.w - w);
    probarY(area.y); probarY(area.y + area.h - h);
    board.pieces.forEach((otra, j) => {
      if(j === idxPropio) return;
      const seTraslapanEnY = !((y+h) <= otra.y || (otra.y+otra.h) <= y);
      const seTraslapanEnX = !((x+w) <= otra.x || (otra.x+otra.w) <= x);
      if(seTraslapanEnY){
        probarX(otra.x + otra.w + kerf);
        probarX(otra.x - kerf - w);
        probarX(otra.x);
        probarX(otra.x + otra.w - w);
      }
      if(seTraslapanEnX){
        probarY(otra.y + otra.h + kerf);
        probarY(otra.y - kerf - h);
        probarY(otra.y);
        probarY(otra.y + otra.h - h);
      }
    });
    return {
      x: mejorX===null ? x : mejorX,
      y: mejorY===null ? y : mejorY
    };
  }

  // Engancha el arrastre con el mouse a cada pieza dibujada del tablero activo, para poder
  // reacomodarla manualmente dentro del tablero. Al soltarla actua como iman: si queda cerca de
  // otra pieza (o del borde del tablero) se pega justo ahi, respetando el mismo corte (kerf) que
  // el acomodo automatico. No se permite soltarla encimada con otra pieza (si el iman la encimara,
  // se usa la posicion sin iman; si ni esa es valida, regresa a su lugar original) y siempre se
  // queda dentro de los limites del tablero. Tambien engancha el boton de girar (que solo se ve
  // al pasar el cursor sobre la pieza).
  function activarPiezasArrastrables(board, kerf){
    const wrapEl = document.getElementById('boardSvgWrap');
    const svgEl = wrapEl.querySelector('svg');
    if(!svgEl || !board._geom) return;
    const kerfNum = Number.isFinite(kerf) ? kerf : 0;
    const area = obtenerAreaColocacionBoard(board);
    const grupos = svgEl.querySelectorAll('.pieza-drag');
    grupos.forEach(g => {
      const idx = parseInt(g.getAttribute('data-idx'), 10);
      const p = board.pieces[idx];
      if(!p) return;
      let arrastrando = false;
      let startClientX = 0, startClientY = 0, ratio = 1;
      let startPx = p.x, startPy = p.y;
      function onMouseMove(e){
        if(!arrastrando) return;
        const dxSvg = (e.clientX - startClientX) * ratio;
        const dySvg = (e.clientY - startClientY) * ratio;
        g.setAttribute('transform', `translate(${dxSvg},${dySvg})`);
      }
      function onMouseUp(e){
        if(!arrastrando) return;
        arrastrando = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        const dxSvg = (e.clientX - startClientX) * ratio;
        const dySvg = (e.clientY - startClientY) * ratio;
        const scale = board._geom.scale;
        const dxMm = dxSvg / scale, dyMm = dySvg / scale;
        const nuevoX = Math.max(area.x, Math.min(area.x+area.w-p.w, startPx + dxMm));
        const nuevoY = Math.max(area.y, Math.min(area.y+area.h-p.h, startPy + dyMm));
        const iman = calcularImanes(board, idx, kerfNum, p.w, p.h, nuevoX, nuevoY);
        const imanX = Math.max(area.x, Math.min(area.x+area.w-p.w, iman.x));
        const imanY = Math.max(area.y, Math.min(area.y+area.h-p.h, iman.y));
        if(!piezasSeEncimanConOtras(board, idx, imanX, imanY, p.w, p.h)){
          p.x = imanX;
          p.y = imanY;
        } else if(!piezasSeEncimanConOtras(board, idx, nuevoX, nuevoY, p.w, p.h)){
          p.x = nuevoX;
          p.y = nuevoY;
        }
        // el hueco vacio del tablero cambio (la pieza ya no esta donde el acomodo automatico la
        // habia dejado), asi que se recalcula para que "Sobrantes aprovechables" y el area
        // sobrante siempre reflejen donde quedaron las piezas en este momento.
        recalcularFreeRectsDesdeCero(board);
        renderDiagrama();
      }
      g.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const rectSvg = svgEl.getBoundingClientRect();
        const viewBox = svgEl.viewBox.baseVal;
        ratio = 1;
        if(viewBox){
          if(rectSvg.width){
            ratio = viewBox.width / rectSvg.width;
          }
        }
        arrastrando = true;
        startClientX = e.clientX;
        startClientY = e.clientY;
        startPx = p.x;
        startPy = p.y;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      // boton de girar: hace su propia cosa y no debe disparar el arrastre de la pieza completa.
      const botonRotar = g.querySelector('.pieza-rotar');
      if(botonRotar){
        botonRotar.addEventListener('mousedown', (e) => { e.stopPropagation(); e.preventDefault(); });
        botonRotar.addEventListener('click', (e) => {
          e.stopPropagation();
          rotarPieza(board, idx);
          renderDiagrama();
        });
      }
    });
  }

  function renderDiagrama(){
    const tabsEl = document.getElementById('boardTabs');
    const wrapEl = document.getElementById('boardSvgWrap');
    const sobrantesEl = document.getElementById('sobrantesBox');
    const estilo = leerEstilo();
    const fsTabs = estilo.fsTabs || 10;
    tabsEl.innerHTML = '';
    if(state.boards.length===0){
      wrapEl.innerHTML = '';
      sobrantesEl.innerHTML = '';
      return;
    }
    state.boards.forEach((b, i) => {
      const btn = document.createElement('button');
      btn.className = 'tab-btn' + (i===state.activeTab ? ' active' : '');
      btn.style.fontSize = fsTabs + 'px';
      btn.textContent = `${b.materialLabel.toUpperCase()} · TABLERO ${b.indexEnMaterial}`;
      btn.addEventListener('click', () => { state.activeTab = i; renderDiagrama(); });
      tabsEl.appendChild(btn);
    });
    const activo = state.boards[state.activeTab];
    const kerf = Number.isFinite(activo.kerf) ? activo.kerf : 0;
    const kerfEntrePiezas = Number.isFinite(activo.kerfEntrePiezas)
      ? activo.kerfEntrePiezas
      : kerf;
    // wrapEl tiene 10px de padding en cada lado (20px) mas un pequeno margen de seguridad
    // para que el dibujo quepa completo, sin scroll, dentro de su recuadro. La escala del
    // diagrama (100% = ajuste automatico) permite agrandarlo o achicarlo a gusto del usuario.
    const escalaDiagrama = (estilo.escalaDiagrama || 100) / 100;
    const anchoDisponible = Math.max(280, ((wrapEl.clientWidth || 900) - 28) * escalaDiagrama);
    wrapEl.innerHTML = dibujarBoard(activo, kerf, anchoDisponible, estilo);
    activarPiezasArrastrables(activo, kerfEntrePiezas);
    if(!estilo.mostrarListaSobrantes){
      sobrantesEl.innerHTML = '';
    } else {
      const sobrantes = calcularSobrantes(activo, 6);
      const areaSobranteM2 = areaSobranteTotal(activo) / 1000000;
      sobrantesEl.innerHTML = '<b>Sobrantes aprovechables:</b><br>' +
        (sobrantes.length ? sobrantes.map(s=>`<span class="item">${s.w} x ${s.h} mm</span>`).join('') : 'Sin sobrantes relevantes en este tablero.') +
        '<br><b>Área total del sobrante: </b>' + fmt(areaSobranteM2) + ' m²';
    }
  }

  // ---------- Optimizar (recalculo completo: diagrama + costos) ----------
  let debounceTimer = null;
  function recalcularDebounced(){
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(recalcular, 200);
  }

  // ---------- Plantillas de diseño del reporte "Precio del proyecto" ----------
  function renderReporte(datos, plantilla, disenoTotal){
    if(plantilla === 'lista') return renderReporteLista(datos, disenoTotal);
    if(plantilla === 'tarjetas') return renderReporteTarjetas(datos, disenoTotal);
    if(plantilla === 'factura') return renderReporteFactura(datos, disenoTotal);
    return renderReporteColumnas(datos, disenoTotal);
  }
  // barra del total, con varios disenos seleccionables por separado de la plantilla de la tabla
  function totalBarHtml(datos, disenoTotal){
    let clase = 'total-bar';
    if(disenoTotal === 'solido') clase += ' tb-solido';
    if(disenoTotal === 'contorno') clase += ' tb-contorno';
    if(disenoTotal === 'linea') clase += ' tb-linea';
    return `
      <div class="${clase}">
        <span class="label">Total del proyecto</span>
        <span class="amount">${fmtMoney(datos.total)}</span>
      </div>`;
  }
  function lineasMaterialHtml(datos){
    return datos.materiales.map(m => `<div class="cost-line"><span>${m.nombre} (${m.tableros} tablero${m.tableros===1?'':'s'})</span><span>${fmtMoney(m.importe)}</span></div>`).join('');
  }
  function lineasTapaHtml(datos){
    if(datos.tapacantos.length === 0) return '<div class="cost-line"><span>Sin tapacanto en esta lista</span><span>$0.00</span></div>';
    return datos.tapacantos.map(t => `<div class="cost-line"><span>${t.tipo} (${fmt(t.metros)} m)</span><span>${fmtMoney(t.importe)}</span></div>`).join('');
  }
  function lineasComponentesHtml(datos){
    if(datos.componentes.length === 0) return '<div class="cost-line"><span>Sin componentes en este proyecto</span><span>$0.00</span></div>';
    return datos.componentes.map(c => `<div class="cost-line"><span>${c.producto || '(sin nombre)'} (x${c.cantidad})</span><span>${fmtMoney(c.importe)}</span></div>`).join('');
  }
  function renderReporteColumnas(datos, disenoTotal){
    const hayComponentes = datos.componentes.length > 0;
    const hayTapacanto = datos.tapacantos.length > 0;
    return `
      <div class="cost-grid">
        <div class="cost-col">
          <h3>Material</h3>
          ${lineasMaterialHtml(datos)}
          <div class="cost-line sub"><span>Subtotal material</span><span>${fmtMoney(datos.matSubtotal)}</span></div>
        </div>
        ${hayComponentes ? `
        <div class="cost-col">
          <h3>Componentes</h3>
          ${lineasComponentesHtml(datos)}
          <div class="cost-line sub"><span>Subtotal componentes</span><span>${fmtMoney(datos.componentesSubtotal)}</span></div>
        </div>` : ''}
        <div class="cost-col">
          <h3>Corte</h3>
          <div class="cost-line"><span>Tableros usados</span><span>${datos.tableros}</span></div>
          <div class="cost-line"><span>Cortes realizados</span><span>${datos.cortes}</span></div>
          <div class="cost-line"><span>Metros lineales de corte</span><span>${fmt(datos.corteMlPresentacion)} m</span></div>
          <div class="cost-line"><span>${datos.corteLineaLabel}</span><span>${fmtMoney(datos.corteImporte)}</span></div>
          <div class="cost-line sub"><span>Subtotal corte</span><span>${fmtMoney(datos.corteImporte)}</span></div>
        </div>
        ${hayTapacanto ? `
        <div class="cost-col">
          <h3>Tapacanto</h3>
          ${lineasTapaHtml(datos)}
          <div class="cost-line sub"><span>Subtotal tapacanto</span><span>${fmtMoney(datos.tapaSubtotal)}</span></div>
        </div>` : ''}
      </div>
      ${totalBarHtml(datos, disenoTotal)}`;
  }
  function renderReporteLista(datos, disenoTotal){
    const hayComponentes = datos.componentes.length > 0;
    const hayTapacanto = datos.tapacantos.length > 0;
    return `
      <div class="reporte-lista">
        <div class="rl-seccion">
          <div class="rl-titulo">Material</div>
          ${lineasMaterialHtml(datos)}
          <div class="cost-line sub"><span>Subtotal material</span><span>${fmtMoney(datos.matSubtotal)}</span></div>
        </div>
        ${hayComponentes ? `
        <div class="rl-seccion">
          <div class="rl-titulo">Componentes</div>
          ${lineasComponentesHtml(datos)}
          <div class="cost-line sub"><span>Subtotal componentes</span><span>${fmtMoney(datos.componentesSubtotal)}</span></div>
        </div>` : ''}
        <div class="rl-seccion">
          <div class="rl-titulo">Corte</div>
          <div class="cost-line"><span>Tableros usados</span><span>${datos.tableros}</span></div>
          <div class="cost-line"><span>Cortes realizados</span><span>${datos.cortes}</span></div>
          <div class="cost-line"><span>Metros lineales de corte</span><span>${fmt(datos.corteMlPresentacion)} m</span></div>
          <div class="cost-line"><span>${datos.corteLineaLabel}</span><span>${fmtMoney(datos.corteImporte)}</span></div>
          <div class="cost-line sub"><span>Subtotal corte</span><span>${fmtMoney(datos.corteImporte)}</span></div>
        </div>
        ${hayTapacanto ? `
        <div class="rl-seccion">
          <div class="rl-titulo">Tapacanto</div>
          ${lineasTapaHtml(datos)}
          <div class="cost-line sub"><span>Subtotal tapacanto</span><span>${fmtMoney(datos.tapaSubtotal)}</span></div>
        </div>` : ''}
      </div>
      ${totalBarHtml(datos, disenoTotal)}`;
  }
  function renderReporteTarjetas(datos, disenoTotal){
    const hayComponentes = datos.componentes.length > 0;
    const hayTapacanto = datos.tapacantos.length > 0;
    return `
      <div class="reporte-tarjetas">
        <div class="rt-card">
          <h3>Material</h3>
          ${lineasMaterialHtml(datos)}
          <div class="rt-subtotal"><span>Subtotal</span><span>${fmtMoney(datos.matSubtotal)}</span></div>
        </div>
        ${hayComponentes ? `
        <div class="rt-card rt-componentes">
          <h3>Componentes</h3>
          ${lineasComponentesHtml(datos)}
          <div class="rt-subtotal"><span>Subtotal</span><span>${fmtMoney(datos.componentesSubtotal)}</span></div>
        </div>` : ''}
        <div class="rt-card rt-corte">
          <h3>Corte</h3>
          <div class="cost-line"><span>Tableros usados</span><span>${datos.tableros}</span></div>
          <div class="cost-line"><span>Cortes realizados</span><span>${datos.cortes}</span></div>
          <div class="cost-line"><span>Metros lineales</span><span>${fmt(datos.corteMlPresentacion)} m</span></div>
          <div class="cost-line"><span>${datos.corteLineaLabel}</span><span>${fmtMoney(datos.corteImporte)}</span></div>
          <div class="rt-subtotal"><span>Subtotal</span><span>${fmtMoney(datos.corteImporte)}</span></div>
        </div>
        ${hayTapacanto ? `
        <div class="rt-card rt-tapa">
          <h3>Tapacanto</h3>
          ${lineasTapaHtml(datos)}
          <div class="rt-subtotal"><span>Subtotal</span><span>${fmtMoney(datos.tapaSubtotal)}</span></div>
        </div>` : ''}
      </div>
      ${totalBarHtml(datos, disenoTotal)}`;
  }
  function renderReporteFactura(datos, disenoTotal){
    let filas = '';
    filas += `<tr class="rf-seccion"><td colspan="4">Material</td></tr>`;
    datos.materiales.forEach(m => {
      filas += `<tr><td>${m.nombre}</td><td class="num">${m.tableros}</td><td class="num">${fmtMoney(m.importe / (m.tableros||1))}</td><td class="num">${fmtMoney(m.importe)}</td></tr>`;
    });
    filas += `<tr class="rf-sub"><td colspan="3">Subtotal material</td><td class="num">${fmtMoney(datos.matSubtotal)}</td></tr>`;
    if(datos.componentes.length > 0){
      filas += `<tr class="rf-seccion"><td colspan="4">Componentes</td></tr>`;
      datos.componentes.forEach(c => {
        filas += `<tr><td>${c.producto || '(sin nombre)'}</td><td class="num">${c.cantidad}</td><td class="num">${fmtMoney(c.precio)}</td><td class="num">${fmtMoney(c.importe)}</td></tr>`;
      });
      filas += `<tr class="rf-sub"><td colspan="3">Subtotal componentes</td><td class="num">${fmtMoney(datos.componentesSubtotal)}</td></tr>`;
    }
    filas += `<tr class="rf-seccion"><td colspan="4">Corte</td></tr>`;
    filas += `<tr><td>Cortes realizados (${fmt(datos.corteMlPresentacion)} m, ${datos.tableros} tablero${datos.tableros===1?'':'s'})</td><td class="num">${datos.corteLineaLabel}</td><td class="num"></td><td class="num">${fmtMoney(datos.corteImporte)}</td></tr>`;
    filas += `<tr class="rf-sub"><td colspan="3">Subtotal corte</td><td class="num">${fmtMoney(datos.corteImporte)}</td></tr>`;
    if(datos.tapacantos.length > 0){
      filas += `<tr class="rf-seccion"><td colspan="4">Tapacanto</td></tr>`;
      datos.tapacantos.forEach(t => {
        filas += `<tr><td>${t.tipo}</td><td class="num">${fmt(t.metros)} m</td><td class="num">${fmtMoney(t.importe / (t.metros||1))}</td><td class="num">${fmtMoney(t.importe)}</td></tr>`;
      });
      filas += `<tr class="rf-sub"><td colspan="3">Subtotal tapacanto</td><td class="num">${fmtMoney(datos.tapaSubtotal)}</td></tr>`;
    }
    return `
      <div class="reporte-factura">
        <table>
          <thead><tr><th>Concepto</th><th class="num">Cant.</th><th class="num">Precio unit.</th><th class="num">Importe</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
      ${totalBarHtml(datos, disenoTotal)}`;
  }

  function recalcular(){
    const validacion = validarProyecto();
    if(!validacion.ok){
      mostrarErroresProyecto(validacion.errores);
      document.getElementById('resultadoPanel').style.display = 'none';
      document.getElementById('reportePanel').style.display = 'none';
      state.boards = [];
      state.ultimoReporte = null;
      state.ultimoTotal = 0;
      return false;
    }
    const parametrosCorte = resolverParametrosCorteEtapa4();
    if(!parametrosCorte.ok){
      mostrarErroresProyecto(parametrosCorte.errores);
      document.getElementById('resultadoPanel').style.display = 'none';
      document.getElementById('reportePanel').style.display = 'none';
      state.boards = [];
      state.ultimoReporte = null;
      state.ultimoTotal = 0;
      return false;
    }
    const kerf = parametrosCorte.kerf;
    const precioCorte = parseFloat(document.getElementById('precioCorte').value) || 0;
    const precioCorteMetro = parseFloat(document.getElementById('precioCorteMetro').value) || 0;
    const modoPrecioCorte = document.getElementById('modoPrecioCortePorMetro').checked ? 'metro' : 'corte';
    const libre = !document.getElementById('corteGuillotina').checked;
    const nivelOptimizacion = obtenerNivelOptimizacion();

    const {piezas, errores} = leerPiezas(parametrosCorte);
    mostrarErroresProyecto(errores);

    if(piezas.length === 0){
      document.getElementById('resultadoPanel').style.display = 'none';
      document.getElementById('reportePanel').style.display = 'none';
      state.boards = [];
      state.ultimoReporte = null;
      return false;
    }

    // agrupar por material (batching)
    const porMaterial = {};
    piezas.forEach(p => { (porMaterial[p.material] = porMaterial[p.material] || []).push(p); });

    let totalCortes = 0, totalCorteMm = 0;
    const boardsAll = [];
    const tablerosPorMaterial = {};
    Object.keys(porMaterial).forEach(mat => {
      // cada material puede tener su propia medida de tablero (columnas "Largo (mm)"/"Ancho (mm)"
      // de "Placas y tableros"); se fija aqui como medida "activa" antes de empacar ESTE material,
      // y cada tablero que se cree se queda con su propia medida guardada (board.boardW/boardH)
      // para no depender de esta variable global despues (por ejemplo cuando ya se este empacando
      // el siguiente material con otra medida distinta).
      const medidaMat = medidaTableroDeMaterial(mat);
      BOARD_W = medidaMat.largo;
      BOARD_H = medidaMat.ancho;
      const areaUtil = calcularRectanguloUtilTablero(
        medidaMat.largo,
        medidaMat.ancho,
        parametrosCorte.margenes
      );
      if(!areaUtil.ok) return;
      const kerfMaterial = obtenerKerfMaterial(porMaterial[mat], parametrosCorte);
      const areaColocacion = calcularRectanguloColocacion(
        areaUtil.rect,
        kerfMaterial.bordeExterior
      );
      if(!areaColocacion.ok) return;
      const datosTablero = {
        boardW:medidaMat.largo,
        boardH:medidaMat.ancho,
        areaUtil:areaUtil.rect,
        areaColocacion:areaColocacion.rect,
        margenes:areaUtil.margenes,
        kerfValor:kerfMaterial.valor,
        kerfEntrePiezas:kerfMaterial.entrePiezas,
        kerfPiezaSobrante:kerfMaterial.piezaSobrante,
        kerfBordeExterior:kerfMaterial.bordeExterior
      };
      const boards = empacarMaterial(
        porMaterial[mat],
        kerfMaterial.entrePiezas,
        libre,
        nivelOptimizacion,
        datosTablero
      );
      // recorre (baja) las piezas de cada tablero recien optimizado para juntar los huecos sueltos
      // en uno solo mas grande y aprovechable, en vez de dejar varios sobrantes chicos repartidos.
      boards.forEach(b => compactarHaciaAbajo(b));
      tablerosPorMaterial[mat] = boards.length;
      boards.forEach((b, idx) => {
        b.materialLabel = mat;
        b.indexEnMaterial = idx+1;
        boardsAll.push(b);
        const {cortes, largoMm} = contarCortes(b);
        totalCortes += cortes;
        totalCorteMm += largoMm;
      });
    });
    // se trata de mantener la misma hoja/tablero que el usuario ya tenia abierto, en vez de
    // regresar siempre a la primera cada vez que se cambia una medida o un enchape.
    const tabAnterior = state.boards[state.activeTab];
    const idAnterior = tabAnterior ? (tabAnterior.materialLabel + '·' + tabAnterior.indexEnMaterial) : null;
    state.boards = boardsAll;
    let nuevoIndice = -1;
    if(idAnterior !== null){
      nuevoIndice = boardsAll.findIndex(b => (b.materialLabel + '·' + b.indexEnMaterial) === idAnterior);
    }
    if(nuevoIndice < 0) nuevoIndice = Math.min(state.activeTab, boardsAll.length-1);
    state.activeTab = Math.max(0, nuevoIndice);
    document.getElementById('resultadoPanel').style.display = 'block';
    renderDiagrama();

    // ---- costos: material ----
    let matSubtotal = 0;
    const materialesRep = Object.keys(tablerosPorMaterial).map(mat => {
      const cfg = state.materiales.find(m=>m.nombre===mat) ||
        {sku:'', nombre:mat, precio:0, largo:0, ancho:0, espesor:0};
      const n = tablerosPorMaterial[mat];
      const precioUnitario = cfg.precio;
      const importe = n * precioUnitario;
      matSubtotal += importe;
      return {
        sku:cfg.sku || '',
        nombre:mat,
        largo:cfg.largo,
        ancho:cfg.ancho,
        espesor:cfg.espesor,
        tableros:n,
        precioUnitario:precioUnitario,
        importe:importe
      };
    });

    // ---- costos: componentes del proyecto (bisagras, correderas, jaladeras, etc.) ----
    // la cantidad capturada en la tabla es "por proyecto"; aqui se multiplica por "Cantidad de
    // proyectos" (arriba de Piezas a cortar) para cobrar y reportar el total real que hace falta.
    const cantidadProyectosComponentes = obtenerCantidadProyectos();
    let componentesSubtotal = 0;
    const componentesRep = state.componentesProyecto.map(c => {
      // El componente del proyecto conserva una copia del SKU al agregarse. Si despues se edita
      // el catalogo, se usa su SKU actual solo cuando el nombre identifica un registro unico;
      // ante nombres duplicados se conserva la copia para no asociar un codigo por conjetura.
      const coincidenciasCatalogo = state.componentes.filter(cfg => cfg.producto === c.producto);
      const skuActual = coincidenciasCatalogo.length === 1
        ? coincidenciasCatalogo[0].sku
        : c.sku;
      const cantidadPorProyecto = c.cantidad || 0;
      const cantidadTotal = cantidadPorProyecto * cantidadProyectosComponentes;
      const precioUnitario = c.precio || 0;
      const importe = precioUnitario * cantidadTotal;
      componentesSubtotal += importe;
      return {
        sku:skuActual,
        producto:c.producto,
        cantidadPorProyecto:cantidadPorProyecto,
        cantidadProyectos:cantidadProyectosComponentes,
        cantidadTotal:cantidadTotal,
        cantidad:cantidadTotal,
        unidad:'pieza',
        precio:precioUnitario,
        importe:importe
      };
    });

    // ---- costos: corte (por corte, o por metro lineal segun la opcion elegida) ----
    const corteMl = totalCorteMm/1000;
    const corteMlPresentacion = normalizarMetrosLinealesParaPresentacion(corteMl);
    const corteImporte = modoPrecioCorte === 'metro' ? corteMl * precioCorteMetro : totalCortes * precioCorte;
    const corteLineaLabel = modoPrecioCorte === 'metro'
      ? `${fmt(corteMlPresentacion)} m × ${fmtMoney(precioCorteMetro)}`
      : `${totalCortes} × ${fmtMoney(precioCorte)}`;

    // ---- costos: tapacanto (agrupado por tipo, precio por metro) ----
    // L1/L2 siempre cobran la medida del lado MAS LARGO de la pieza y A1/A2 la del lado MAS CORTO,
    // sin importar en cual columna (Largo o Ancho) se haya capturado el numero mayor.
    const porTipo = {};
    piezas.forEach(p => {
      const largoReal = Math.max(p.l, p.a);
      const anchoReal = Math.min(p.l, p.a);
      let mm = 0;
      if(p.l1) mm += largoReal;
      if(p.l2) mm += largoReal;
      if(p.a1) mm += anchoReal;
      if(p.a2) mm += anchoReal;
      if(mm>0) porTipo[p.tapaTipo] = (porTipo[p.tapaTipo]||0) + mm;
    });
    let tapaSubtotal = 0;
    // si esta activo "Redondear metraje de tapacanto a 0.5 m", cada tipo se redondea hacia arriba
    // al siguiente 0.5 m (7.1 -> 7.5, 7.6 -> 8) antes de cobrarlo, para no comprar de menos.
    const redondearTapacanto = document.getElementById('redondearTapacanto').checked;
    const tapacantosRep = Object.keys(porTipo).map(tipo => {
      const cfg = state.tapacantos.find(t=>t.nombre===tipo) || {precio:0};
      const metrosExactos = porTipo[tipo]/1000;
      const metrosCobrables = redondearTapacanto
        ? Math.ceil(metrosExactos/0.5) * 0.5
        : metrosExactos;
      const precioMetro = cfg.precio;
      const importe = metrosCobrables * precioMetro;
      tapaSubtotal += importe;
      return {
        sku:cfg.sku || '',
        tipo:tipo,
        metrosExactos:metrosExactos,
        reglaRedondeo:redondearTapacanto ? '0.50 m' : 'Sin redondeo',
        metrosCobrables:metrosCobrables,
        metros:metrosCobrables,
        precioMetro:precioMetro,
        importe:importe
      };
    });

    const total = matSubtotal + componentesSubtotal + corteImporte + tapaSubtotal;
    const valoresCosto = [matSubtotal, componentesSubtotal, corteImporte, tapaSubtotal, total];
    if(!valoresCosto.every(Number.isFinite) || valoresCosto.some(v => v < 0)){
      mostrarErroresProyecto(['No se puede calcular el proyecto: uno o mas costos son negativos o no son numeros finitos. Revisa cantidades, precios y medidas.']);
      document.getElementById('resultadoPanel').style.display = 'none';
      document.getElementById('reportePanel').style.display = 'none';
      state.boards = [];
      state.ultimoReporte = null;
      state.ultimoTotal = 0;
      return false;
    }
    const datosReporte = {
      materiales: materialesRep,
      matSubtotal: matSubtotal,
      cantidadProyectos:cantidadProyectosComponentes,
      componentes: componentesRep,
      componentesSubtotal: componentesSubtotal,
      tableros: boardsAll.length,
      cortes: totalCortes,
      corteMl: corteMl,
      corteMlPresentacion: corteMlPresentacion,
      precioCorte: precioCorte,
      corteLineaLabel: corteLineaLabel,
      corteImporte: corteImporte,
      tapacantos: tapacantosRep,
      tapaSubtotal: tapaSubtotal,
      total: total
    };
    const plantilla = document.getElementById('plantillaReporte').value || 'columnas';
    const disenoTotal = document.getElementById('disenoTotal').value || 'pastel';
    document.getElementById('reporteContenido').innerHTML = renderReporte(datosReporte, plantilla, disenoTotal);
    document.getElementById('reportePanel').style.display = 'block';
    state.ultimoTotal = total;
    // se guarda una copia completa de los datos del reporte para que el boton "Exportar" arme el
    // Excel con exactamente los mismos numeros que se estan mostrando en pantalla.
    state.ultimoReporte = datosReporte;
    return true;
  }

  // recalculo automatico: cualquier cambio en la tabla de piezas actualiza el diagrama y el costo
  document.getElementById('piezasBody').addEventListener('input', recalcularDebounced);
  document.getElementById('piezasBody').addEventListener('change', recalcularDebounced);
  document.getElementById('kerf').addEventListener('input', recalcularDebounced);
  const controlesMargenesExteriores = obtenerControlesMargenesExteriores();
  controlesMargenesExteriores.aplicar.addEventListener('change', () => {
    actualizarControlesMargenesExteriores();
    recalcularDebounced();
  });
  controlesMargenesExteriores.mismo.addEventListener('change', () => {
    actualizarControlesMargenesExteriores();
    recalcularDebounced();
  });
  controlesMargenesExteriores.general.addEventListener('input', () => {
    actualizarControlesMargenesExteriores();
    recalcularDebounced();
  });
  controlesMargenesExteriores.individuales.forEach(input => {
    input.addEventListener('input', recalcularDebounced);
  });
  actualizarControlesMargenesExteriores();
  document.getElementById('cantidadProyectos').addEventListener('input', recalcularDebounced);
  // el largo y ancho del tablero son editables: si el usuario deja el box vacio o pone un
  // numero invalido (0 o negativo), se ignora el cambio y se mantiene la ultima medida valida.
  function actualizarMedidaTablero(inputId, esLargo){
    const valor = parseFloat(document.getElementById(inputId).value);
    if(!(valor > 0)) return;
    if(esLargo) BOARD_W = valor; else BOARD_H = valor;
    recalcularDebounced();
  }
  document.getElementById('tableroLargo').addEventListener('input', () => actualizarMedidaTablero('tableroLargo', true));
  document.getElementById('tableroAncho').addEventListener('input', () => actualizarMedidaTablero('tableroAncho', false));
  document.getElementById('precioCorte').addEventListener('input', recalcularDebounced);
  document.getElementById('precioCorteMetro').addEventListener('input', recalcularDebounced);
  document.getElementById('modoPrecioCortePorCorte').addEventListener('change', recalcularDebounced);
  document.getElementById('modoPrecioCortePorMetro').addEventListener('change', recalcularDebounced);
  document.getElementById('corteGuillotina').addEventListener('change', recalcularDebounced);
  document.getElementById('redondearTapacanto').addEventListener('change', recalcularDebounced);
  document.getElementById('nivelOptimizacionNormal').addEventListener('change', recalcularDebounced);
  document.getElementById('nivelOptimizacionOptimizada').addEventListener('change', recalcularDebounced);
  document.getElementById('nivelOptimizacionCompleta').addEventListener('change', recalcularDebounced);

  // botones chip para mostrar/ocultar los avisos informativos (colapsados por defecto)
  function attachToggleNota(toggleId, bodyId){
    const btn = document.getElementById(toggleId);
    const body = document.getElementById(bodyId);
    btn.addEventListener('click', () => {
      const oculto = body.style.display !== 'block';
      body.style.display = oculto ? 'block' : 'none';
    });
  }
  attachToggleNota('toggleNotaGirar', 'notaGirarBody');
  attachToggleNota('toggleNotaLados', 'notaLadosBody');

  // el boton Espejo abre un pequeno menu con las distintas formas de acomodar el tablero (pegado
  // arriba, abajo, a la izquierda o a la derecha); cada opcion voltea el tablero sobre el eje que
  // corresponda y luego junta los huecos sueltos contra ese mismo lado.
  document.getElementById('btnEspejo').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('espejoMenu').classList.toggle('abierto');
  });
  document.querySelectorAll('.espejo-opcion').forEach(op => {
    op.addEventListener('click', () => {
      document.getElementById('espejoMenu').classList.remove('abierto');
      if(state.boards.length === 0) return;
      const activo = state.boards[state.activeTab];
      const dir = op.getAttribute('data-dir');
      if(dir === 'arriba'){ espejarBoard(activo); compactarHaciaArriba(activo); }
      if(dir === 'abajo'){ espejarBoard(activo); compactarHaciaAbajo(activo); }
      if(dir === 'izquierda'){ espejarBoardHorizontal(activo); compactarHaciaIzquierda(activo); }
      if(dir === 'derecha'){ espejarBoardHorizontal(activo); compactarHaciaDerecha(activo); }
      renderDiagrama();
    });
  });
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('espejoMenu');
    if(!menu.classList.contains('abierto')) return;
    const wrap = document.querySelector('.espejo-menu-wrap');
    if(wrap.contains(e.target)) return;
    menu.classList.remove('abierto');
  });

  // si cambia el tamano de la ventana, vuelve a dibujar el diagrama para que siempre quepa completo
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if(state.boards.length>0) renderDiagrama();
      ajustarAlturaTabla();
    }, 150);
  });

  // ---------- Exportar a Excel (reporte tipo factura + piezas y diagramas) ----------
  // La libreria para armar el .xlsx (con imagenes incrustadas) se carga solo cuando hace falta,
  // para no aumentar el peso de la pagina en cada visita. Se guarda en cache la misma promesa
  // para que un segundo click no la vuelva a descargar.
  let promesaExcelJS = null;
  function cargarExcelJS(){
    if(window.ExcelJS) return Promise.resolve(window.ExcelJS);
    if(promesaExcelJS) return promesaExcelJS;
    promesaExcelJS = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
      let finalizado = false;
      function fallarCarga(mensaje){
        if(finalizado) return;
        finalizado = true;
        promesaExcelJS = null;
        s.remove();
        reject(new Error(mensaje));
      }
      s.onload = () => {
        if(window.ExcelJS){
          finalizado = true;
          resolve(window.ExcelJS);
          return;
        }
        fallarCarga('ExcelJS no esta disponible. La libreria se descargo, pero no pudo inicializarse. Intenta nuevamente.');
      };
      s.onerror = () => fallarCarga('ExcelJS no esta disponible. Revisa tu conexion a internet o si el navegador bloqueo cdnjs, y vuelve a intentarlo.');
      document.head.appendChild(s);
    });
    return promesaExcelJS;
  }

  // ---------- Exportar a DXF para maquinas CNC (un archivo por tablero, empacados en ZIP) ----------
  // JSZip tambien se carga solo cuando hace falta, igual que ExcelJS.
  let promesaJSZip = null;
  function cargarJSZip(){
    if(window.JSZip) return Promise.resolve(window.JSZip);
    if(promesaJSZip) return promesaJSZip;
    promesaJSZip = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      let finalizado = false;
      function fallarCarga(mensaje){
        if(finalizado) return;
        finalizado = true;
        promesaJSZip = null;
        s.onload = null;
        s.onerror = null;
        s.remove();
        reject(new Error(mensaje));
      }
      s.onload = () => {
        if(finalizado) return;
        if(window.JSZip){
          finalizado = true;
          s.onload = null;
          s.onerror = null;
          resolve(window.JSZip);
          return;
        }
        fallarCarga('JSZip no esta disponible. La libreria se descargo desde cdnjs, pero no pudo inicializarse. Revisa tu conexion o si el navegador bloqueo cdnjs, y vuelve a intentarlo.');
      };
      s.onerror = () => fallarCarga('JSZip no esta disponible. Revisa tu conexion a internet o si el navegador bloqueo cdnjs, y vuelve a intentarlo.');
      document.head.appendChild(s);
    });
    return promesaJSZip;
  }

  // Arma un renglon "codigonvalorn" (formato estandar de grupos DXF).
  function grupoDxf(codigo, valor){
    return codigo + '\r\n' + valor + '\r\n';
  }

  // Rectangulo cerrado (POLYLINE/VERTEX/SEQEND) en una capa dada, formato DXF R12 (AC1009),
  // el mas compatible entre softwares de CNC/CAM ya que es el formato base sin extensiones.
  function polilineaRectDxf(capa, x, y, w, h, boardH){
    // Las piezas en el optimizador usan Y creciendo hacia abajo (como una pantalla);
    // en DXF el eje Y crece hacia arriba, asi que se invierte usando el alto del tablero.
    const x1 = x, x2 = x + w;
    const y1 = boardH - (y + h), y2 = boardH - y;
    const puntos = [[x1,y1],[x2,y1],[x2,y2],[x1,y2]];
    let txt = '';
    txt += grupoDxf(0,'POLYLINE') + grupoDxf(8,capa) + grupoDxf(66,1) + grupoDxf(70,1);
    puntos.forEach(p => {
      txt += grupoDxf(0,'VERTEX') + grupoDxf(8,capa) + grupoDxf(10, p[0].toFixed(2)) + grupoDxf(20, p[1].toFixed(2)) + grupoDxf(30,'0.0');
    });
    txt += grupoDxf(0,'SEQEND') + grupoDxf(8,capa);
    return txt;
  }

  // Arma el DXF completo (HEADER/TABLES/BLOCKS/ENTITIES/EOF) de un tablero: su contorno
  // en la capa TABLERO y cada pieza cortada (tamano final, sin descuento de kerf porque
  // el kerf ya se aplico como separacion entre piezas al acomodarlas) en la capa CORTE.
  function construirDXFTablero(board){
    let dxf = '';
    dxf += grupoDxf(0,'SECTION') + grupoDxf(2,'HEADER');
    dxf += grupoDxf(9,'$ACADVER') + grupoDxf(1,'AC1009');
    dxf += grupoDxf(9,'$INSUNITS') + grupoDxf(70,4); // 4 = milimetros
    dxf += grupoDxf(9,'$MEASUREMENT') + grupoDxf(70,1); // 1 = metrico
    dxf += grupoDxf(9,'$EXTMIN') + grupoDxf(10,'0.0') + grupoDxf(20,'0.0') + grupoDxf(30,'0.0');
    dxf += grupoDxf(9,'$EXTMAX') + grupoDxf(10, board.boardW.toFixed(2)) + grupoDxf(20, board.boardH.toFixed(2)) + grupoDxf(30,'0.0');
    dxf += grupoDxf(0,'ENDSEC');

    dxf += grupoDxf(0,'SECTION') + grupoDxf(2,'TABLES');
    dxf += grupoDxf(0,'TABLE') + grupoDxf(2,'LAYER') + grupoDxf(70,3);
    dxf += grupoDxf(0,'LAYER') + grupoDxf(2,'0') + grupoDxf(70,0) + grupoDxf(62,7) + grupoDxf(6,'CONTINUOUS');
    dxf += grupoDxf(0,'LAYER') + grupoDxf(2,'TABLERO') + grupoDxf(70,0) + grupoDxf(62,8) + grupoDxf(6,'CONTINUOUS');
    dxf += grupoDxf(0,'LAYER') + grupoDxf(2,'CORTE') + grupoDxf(70,0) + grupoDxf(62,5) + grupoDxf(6,'CONTINUOUS');
    dxf += grupoDxf(0,'ENDTAB');
    dxf += grupoDxf(0,'ENDSEC');

    dxf += grupoDxf(0,'SECTION') + grupoDxf(2,'BLOCKS');
    dxf += grupoDxf(0,'ENDSEC');

    dxf += grupoDxf(0,'SECTION') + grupoDxf(2,'ENTITIES');
    dxf += polilineaRectDxf('TABLERO', 0, 0, board.boardW, board.boardH, board.boardH);
    board.pieces.forEach(p => {
      dxf += polilineaRectDxf('CORTE', p.x, p.y, p.w, p.h, board.boardH);
    });
    dxf += grupoDxf(0,'ENDSEC');

    dxf += grupoDxf(0,'EOF');
    return dxf;
  }

  // Nombre de archivo seguro (sin caracteres invalidos en Windows/Mac/Linux).
  function nombreArchivoSeguro(txt){
    return txt.replace(/[/:*?"<>|]/g, '-');
  }

  async function exportarDXFZip(){
    clearTimeout(debounceTimer);
    if(!recalcular()){
      alert('No se puede exportar el DXF porque el proyecto contiene datos invalidos. Revisa los avisos del formulario.');
      return;
    }
    if(state.boards.length === 0){
      alert('No hay piezas optimizadas para exportar. Agrega piezas primero.');
      return;
    }
    const btn = document.getElementById('exportarDxf');
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Generando DXF...';
    try {
      const JSZipLib = await cargarJSZip();
      const zip = new JSZipLib();
      state.boards.forEach((b, idx) => {
        const contenido = construirDXFTablero(b);
        const nombre = nombreArchivoSeguro(b.materialLabel + ' - Tablero ' + b.indexEnMaterial) + '.dxf';
        zip.file(nombre, contenido);
      });
      const blob = await zip.generateAsync({type:'blob'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fechaArchivo = new Date().toISOString().slice(0,10);
      a.href = url;
      a.download = 'optimizador-cortes-dxf-bamteck-' + fechaArchivo + '.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch(err){
      alert('No se pudo generar el DXF: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  }

  function fechaLegibleHoy(){
    return new Date().toLocaleDateString('es-MX', {day:'numeric', month:'long', year:'numeric'});
  }

  // saca el ancho y alto reales del svg del diagrama (incluye los margenes de las cotas de
  // sobrantes, que varian segun cuantos sobrantes se acotan), para poder rasterizarlo sin
  // deformarlo y para calcular la altura final que va a ocupar en el Excel.
  function extraerDimensionesSvg(svgTexto){
    const mW = svgTexto.match(/<svg[^>]*width="([0-9.]+)"/);
    const mH = svgTexto.match(/<svg[^>]*height="([0-9.]+)"/);
    return {
      w: mW ? parseFloat(mW[1]) : 800,
      h: mH ? parseFloat(mH[1]) : 400
    };
  }

  // dibuja el svg del diagrama sobre un canvas y devuelve el PNG resultante como ArrayBuffer,
  // listo para incrustarse en el Excel.
  function svgAPngBuffer(svgTexto, anchoPx, altoPx){
    return new Promise((resolve, reject) => {
      const svgBlob = new Blob([svgTexto], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = anchoPx;
        canvas.height = altoPx;
        const ctx = canvas.getContext('2d');
        if(!ctx){
          URL.revokeObjectURL(url);
          reject(new Error('El navegador no permite generar imagenes para el Excel.'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, anchoPx, altoPx);
        ctx.drawImage(img, 0, 0, anchoPx, altoPx);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if(!blob){ reject(new Error('No se pudo generar la imagen del diagrama.')); return; }
          blob.arrayBuffer().then(resolve, reject);
        }, 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo dibujar el diagrama del tablero.')); };
      img.src = url;
    });
  }

  // cuantos diagramas de corte entran por hoja impresa tamano carta: cambiar este numero
  // ajusta a la vez el tamano de la imagen y donde caen los saltos de pagina, para que
  // siempre quepan exactos (ni cortados a la mitad ni con espacio de sobra).
  const DIAGRAMAS_POR_HOJA = 2;
  // la hoja "Piezas y diagramas" se imprime a este porcentaje fijo (en vez de "ajustar a 1
  // pagina de ancho" automatico) para que las columnas de la tabla de piezas quepan en el
  // ancho de una hoja carta. Al ser un numero fijo (no calculado por Excel/Numbers al vuelo),
  // se puede calcular con precision cuanto espacio le queda disponible a los diagramas: con
  // el ajuste automatico, el porcentaje real terminaba siendo mucho menor de lo esperado y
  // los diagramas se veian chicos, con un hueco en blanco grande al final de la pagina.
  const ESCALA_IMPRESION_PIEZAS = 70;
  // filas (de 20px/15pt cada una; se fija esa altura con "defaultRowHeight" para que no
  // dependa de la app que abra el archivo) que caben en el alto imprimible de una hoja carta
  // vertical a la escala de arriba, ya restando el titulo "DIAGRAMAS DE CORTE" (una sola vez,
  // al principio) y un margen de seguridad.
  const FILAS_DISPONIBLES_DIAGRAMAS = 60;

  // dibuja y rasteriza el diagrama de cada tablero optimizado, en el mismo orden que se muestran
  // las pestanas. El SVG se construye al tamano visual final para conservar exactamente la
  // proporcion de letras, lineas, flechas y cotas que usa la pantalla. Solo el canvas PNG se
  // genera al doble de resolucion para mejorar la nitidez al imprimir: aumentar el ancho pasado
  // a dibujarBoard alteraria la geometria sin aumentar las fuentes y las dejaria artificialmente
  // pequenas al volver a reducir la imagen dentro de Excel.
  async function generarDiagramasParaExcel(estilo, boards, kerf){
    const filasPorBloque = Math.floor(FILAS_DISPONIBLES_DIAGRAMAS / DIAGRAMAS_POR_HOJA);
    const filasImagenObjetivo = Math.max(4, filasPorBloque - 2); // -2: fila de titulo + fila espaciadora
    const altoMaximoPx = filasImagenObjetivo * 20;
    // 0.55 es la proporcion ancho/alto tipica de un tablero horizontal (2440 x 1220 mm) ya
    // dibujado con sus margenes y cotas de sobrantes; se usa para calcular el ancho de
    // partida, y luego cada diagrama se reescala a su proporcion real exacta.
    const anchoPorAlto = Math.round(altoMaximoPx / 0.55);
    // tambien se limita por el ancho fisico de la hoja a la escala de impresion elegida (739px
    // = ancho imprimible de una hoja carta con 0.4in de margen a cada lado), para que la
    // imagen no quede cortada de lado a lado; el 0.95 deja un pequeno margen de seguridad.
    const anchoMaximoPorAncho = Math.round((739 / (ESCALA_IMPRESION_PIEZAS/100)) * 0.95);
    // la escala del diagrama configurada en "Ajuste de la interfaz" (la misma que usa la vista en
    // pantalla, ver renderDiagrama) tambien achica o agranda el diagrama exportado. Se aplica sobre
    // el ancho ideal antes de topar con el ancho maximo imprimible, para que valores por debajo de
    // 100% siempre se noten; por encima de 100% el diagrama deja de crecer al llegar al maximo que
    // cabe sin cortarse en la hoja impresa.
    const escalaDiagramaExport = Math.max(0.1, (estilo.escalaDiagrama || 100) / 100);
    const anchoObjetivo = Math.min(Math.round(anchoPorAlto * escalaDiagramaExport), anchoMaximoPorAncho);
    const sobremuestreo = 2;
    const imagenes = [];
    for(const board of boards){
      const kerfBoard = Number.isFinite(board.kerf) ? board.kerf : kerf;
      const svgTexto = dibujarBoard(board, kerfBoard, anchoObjetivo, estilo);
      const dim = extraerDimensionesSvg(svgTexto);
      const buffer = await svgAPngBuffer(
        svgTexto,
        Math.max(1, Math.round(dim.w * sobremuestreo)),
        Math.max(1, Math.round(dim.h * sobremuestreo))
      );
      const altoObjetivo = Math.round(anchoObjetivo * (dim.h/dim.w));
      imagenes.push({buffer: buffer, ancho: anchoObjetivo, alto: altoObjetivo});
    }
    return imagenes;
  }

  // lee la tabla de piezas tal cual esta capturada (una fila por renglon, sin repetir por
  // cantidad), para la hoja "Piezas y diagramas" del Excel.
  function leerPiezasParaExportar(){
    const rows = document.querySelectorAll('#piezasBody tr');
    const piezas = [];
    rows.forEach(row => {
      const label = row.querySelector('.p-label').value.trim();
      const cant = parseInt(row.querySelector('.p-cant').value, 10) || 0;
      const l = parseFloat(row.querySelector('.p-l').value);
      const a = parseFloat(row.querySelector('.p-a').value);
      const material = row.querySelector('.p-material-input').dataset.valor || '';
      const tapaTipo = row.querySelector('.p-tapatipo-input').dataset.valor || '';
      const l1 = row.querySelector('.p-l1').checked;
      const l2 = row.querySelector('.p-l2').checked;
      const a1 = row.querySelector('.p-a1').checked;
      const a2 = row.querySelector('.p-a2').checked;
      if(!l || !a || cant<=0) return;
      piezas.push({num: row.dataset.id, label: label, cant: cant, l: l, a: a, material: material, tapaTipo: tapaTipo, l1: l1, l2: l2, a1: a1, a2: a2});
    });
    return piezas;
  }

  // arma el libro de Excel completo: Reporte (estilo factura), Piezas y diagramas (con las
  // imagenes de corte, dos por hoja tamano carta) y Resumen y precio (desglose detallado).
  // Los colores y la letra se toman del mismo panel "Ajuste de la interfaz" que usa el resto
  // del widget, para que el Excel cambie de apariencia junto con la interfaz.
  function construirLibroExcel(ExcelJSLib, datos, piezas, boards, imagenesDiagramas, meta, estilo){
    const nombreFuente = fuenteAExcel(estilo.fuenteInterfaz);
    const colorPrincipal = argbDesdeHex(estilo.colorPrincipal);
    const colorSecundario = argbDesdeHex(estilo.colorSecundario);
    const colorHeaderBg = argbDesdeHex(estilo.colorHeaderPiezas);
    const colorHeaderTexto = argbDesdeHex(estilo.colorTextoHeaderPiezas);
    const colorFondoTotal = argbDesdeHex(estilo.colorFondoTotal);
    const colorEncabezadoNeutro = 'FFF2F2F2';
    function relleno(argb){ return {type:'pattern', pattern:'solid', fgColor:{argb:argb}}; }
    function fBase(extra){ return Object.assign({name:nombreFuente}, extra||{}); }
    function fTitulo(extra){ return fBase(Object.assign({bold:true, size:14, color:{argb:colorPrincipal}}, extra||{})); }
    function fSeccion(extra){ return fBase(Object.assign({bold:true, size:11, color:{argb:colorSecundario}}, extra||{})); }
    function fEncabezadoTabla(){ return fBase({bold:true, color:{argb:colorHeaderTexto}}); }
    function fTotal(){ return fBase({bold:true, size:12, color:{argb:colorPrincipal}}); }
    function fNormal(extra){ return fBase(extra); }
    // ancho fijo de columna en pt/cm no es igual entre motores de Excel: se usa fitToWidth
    // en vez de calcular anchos exactos, asi todo cabe en el ancho de una sola hoja impresa
    // sin importar cuantas columnas tenga la tabla.
    const pageSetupBase = {paperSize:1, orientation:'portrait', fitToWidth:1, fitToHeight:0};

    const wb = new ExcelJSLib.Workbook();
    wb.creator = 'Bamteck';
    wb.created = new Date();

    // ================= HOJA 1: PIEZAS Y DIAGRAMAS =================
    // esta hoja va primero porque es la que se usa en el taller para cortar; el reporte tipo
    // factura y el resumen de precio quedan como respaldo en las siguientes hojas.
    // aqui se usa una escala de impresion FIJA (ESCALA_IMPRESION_PIEZAS) en vez de "ajustar a
    // 1 pagina de ancho" automatico: asi se sabe con certeza a que porcentaje se va a imprimir
    // todo (columnas Y diagramas), y se puede calcular bien cuanto puede crecer cada diagrama
    // sin que sobre ni falte espacio en la hoja. Tambien se fija la altura de fila
    // (defaultRowHeight) para que el calculo de cuantas filas caben por pagina sea el mismo
    // sin importar con que programa se abra el archivo.
    const wsPiezas = wb.addWorksheet('Piezas y diagramas', {
      properties: {defaultRowHeight: 15},
      pageSetup: {paperSize:1, orientation:'portrait', scale: ESCALA_IMPRESION_PIEZAS,
        margins:{left:0.4, right:0.4, top:0.4, bottom:0.4, header:0.2, footer:0.2}}
    });
    wsPiezas.columns = [10,10,12,12,20,7,7,7,7,20,14].map(w => ({width:w}));

    let r2 = 1;
    wsPiezas.mergeCells(r2,1,r2,11);
    wsPiezas.getCell(r2,1).value = 'OPTIMIZACIÓN DE CORTE Y ENCHAPADO';
    wsPiezas.getCell(r2,1).font = fTitulo({size:13});
    r2++;
    wsPiezas.mergeCells(r2,1,r2,11);
    wsPiezas.getCell(r2,1).value = 'Fecha: ' + meta.fecha;
    wsPiezas.getCell(r2,1).font = fNormal();
    r2 += 2;

    ['Código','Cantidad','Largo (mm)','Ancho (mm)','Material','L1','L2','A1','A2','Tipo de tapacanto','Etiqueta'].forEach((h,i) => {
      const c = wsPiezas.getCell(r2,1+i); c.value = h; c.font = fEncabezadoTabla(); c.fill = relleno(colorEncabezadoNeutro);
    });
    r2++;
    piezas.forEach(p => {
      wsPiezas.getCell(r2,1).value = '#'+p.num;
      wsPiezas.getCell(r2,2).value = p.cant;
      wsPiezas.getCell(r2,3).value = p.l;
      wsPiezas.getCell(r2,4).value = p.a;
      wsPiezas.getCell(r2,5).value = textoSeguroParaExcel(p.material);
      wsPiezas.getCell(r2,6).value = p.l1 ? 'Sí' : 'No';
      wsPiezas.getCell(r2,7).value = p.l2 ? 'Sí' : 'No';
      wsPiezas.getCell(r2,8).value = p.a1 ? 'Sí' : 'No';
      wsPiezas.getCell(r2,9).value = p.a2 ? 'Sí' : 'No';
      wsPiezas.getCell(r2,10).value = textoSeguroParaExcel(p.tapaTipo || '— Sin tapacanto —');
      wsPiezas.getCell(r2,11).value = textoSeguroParaExcel(p.label || '');
      for(let col=1; col<=11; col++) wsPiezas.getCell(r2,col).font = fNormal();
      r2++;
    });
    r2++;

    // ---- tabla de sobrantes aprovechables por tablero, justo debajo de la tabla de piezas ----
    // se enumeran los tableros (1, 2, 3...) y se listan TODAS sus medidas de sobrante aprovechable
    // (no solo las primeras 6 como en pantalla), todas juntas en una sola celda por tablero. Se
    // omite por completo si el usuario desactivo "Lista de sobrantes" en Ajuste de la interfaz,
    // igual que en pantalla.
    const mostrarSobrantesExcel = boards.length > 0 ? estilo.mostrarListaSobrantes : false;
    if(mostrarSobrantesExcel){
      wsPiezas.mergeCells(r2,1,r2,11);
      wsPiezas.getCell(r2,1).value = 'SOBRANTES APROVECHABLES POR TABLERO';
      wsPiezas.getCell(r2,1).font = fSeccion({size:12});
      r2++;

      wsPiezas.getCell(r2,1).value = '#'; wsPiezas.getCell(r2,1).font = fEncabezadoTabla(); wsPiezas.getCell(r2,1).fill = relleno(colorEncabezadoNeutro);
      wsPiezas.getCell(r2,2).value = 'Material'; wsPiezas.getCell(r2,2).font = fEncabezadoTabla(); wsPiezas.getCell(r2,2).fill = relleno(colorEncabezadoNeutro);
      wsPiezas.getCell(r2,3).value = 'Tablero'; wsPiezas.getCell(r2,3).font = fEncabezadoTabla(); wsPiezas.getCell(r2,3).fill = relleno(colorEncabezadoNeutro);
      wsPiezas.mergeCells(r2,4,r2,9);
      wsPiezas.getCell(r2,4).value = 'Sobrantes aprovechables'; wsPiezas.getCell(r2,4).font = fEncabezadoTabla(); wsPiezas.getCell(r2,4).fill = relleno(colorEncabezadoNeutro);
      wsPiezas.getCell(r2,10).value = 'Área total del sobrante (m²)'; wsPiezas.getCell(r2,10).font = fEncabezadoTabla(); wsPiezas.getCell(r2,10).fill = relleno(colorEncabezadoNeutro);
      r2++;

      boards.forEach((b, idx) => {
        const todosLosSobrantes = calcularSobrantes(b);
        const listaSobrantes = todosLosSobrantes.length
          ? todosLosSobrantes.map(s => s.w + ' x ' + s.h + ' mm').join(', ')
          : 'Sin sobrantes relevantes';
        const areaM2 = areaSobranteTotal(b) / 1000000;
        wsPiezas.getCell(r2,1).value = idx+1;
        wsPiezas.getCell(r2,2).value = textoSeguroParaExcel(b.materialLabel);
        wsPiezas.getCell(r2,3).value = 'Tablero ' + b.indexEnMaterial;
        wsPiezas.mergeCells(r2,4,r2,9);
        wsPiezas.getCell(r2,4).value = listaSobrantes;
        wsPiezas.getCell(r2,4).alignment = {wrapText:true, vertical:'top'};
        wsPiezas.getCell(r2,10).value = Number(areaM2.toFixed(2));
        for(let col=1; col<=10; col++){ if(col!==4) wsPiezas.getCell(r2,col).font = fNormal(); }
        wsPiezas.getCell(r2,4).font = fNormal();
        r2++;
      });
      r2++;
    }

    // salto de pagina para que los diagramas empiecen en una hoja impresa nueva y limpia
    if(boards.length > 0) wsPiezas.getRow(r2-1).addPageBreak();

    wsPiezas.mergeCells(r2,1,r2,11);
    wsPiezas.getCell(r2,1).value = 'DIAGRAMAS DE CORTE';
    wsPiezas.getCell(r2,1).font = fSeccion({size:12});
    r2 += 2;

    let diagramasEnPagina = 0;
    boards.forEach((b, idx) => {
      const img = imagenesDiagramas[idx];
      wsPiezas.mergeCells(r2,1,r2,11);
      wsPiezas.getCell(r2,1).value = textoSeguroParaExcel(b.materialLabel + ' — Tablero ' + b.indexEnMaterial);
      wsPiezas.getCell(r2,1).font = fSeccion();
      r2++;

      const imageId = wb.addImage({buffer: img.buffer, extension:'png'});
      wsPiezas.addImage(imageId, {
        tl: {col:0, row:r2-1},
        ext: {width:img.ancho, height:img.alto}
      });
      const filasImagen = Math.ceil(img.alto / 20); // ~20px por fila a altura por defecto
      r2 += filasImagen;
      r2++; // espaciador

      diagramasEnPagina++;
      if(diagramasEnPagina === DIAGRAMAS_POR_HOJA){
        wsPiezas.getRow(r2-1).addPageBreak();
        diagramasEnPagina = 0;
      }
    });

    const formatoMoneda = '"$"#,##0.00';
    const formatoMetros = '0.00';
    function aplicarEncabezados(ws, fila, encabezados){
      encabezados.forEach((h,i) => {
        const c = ws.getCell(fila, i+1);
        c.value = h;
        c.font = fEncabezadoTabla();
        c.fill = relleno(colorEncabezadoNeutro);
        c.alignment = {wrapText:true, vertical:'middle'};
      });
    }
    function aplicarFilaTotal(ws, fila, ultimaColumna){
      for(let col=1; col<=ultimaColumna; col++){
        ws.getCell(fila,col).font = fTotal();
        ws.getCell(fila,col).border = {
          top:{style:'medium', color:{argb:colorPrincipal}}
        };
      }
    }
    function protegerTexto(valor, alternativo){
      const texto = valor === undefined || valor === null || valor === '' ? (alternativo || '') : String(valor);
      return textoSeguroParaExcel(texto);
    }
    const materialesReporte = Array.isArray(datos.materiales)
      ? datos.materiales.filter(m => Number.isFinite(m.tableros) && m.tableros > 0)
      : [];
    const componentesReporte = Array.isArray(datos.componentes)
      ? datos.componentes.filter(c => Number.isFinite(c.cantidadTotal) && c.cantidadTotal > 0)
      : [];
    const tapacantosReporte = Array.isArray(datos.tapacantos)
      ? datos.tapacantos.filter(t =>
          (Number.isFinite(t.metrosExactos) && t.metrosExactos > 0) ||
          (Number.isFinite(t.metrosCobrables) && t.metrosCobrables > 0)
        )
      : [];
    const hayMaterialesReporte = materialesReporte.length > 0;
    const hayComponentesReporte = componentesReporte.length > 0;
    const hayTapacantosReporte = tapacantosReporte.length > 0;
    const hayCorteReporte =
      (Number.isFinite(datos.cortes) && datos.cortes > 0) ||
      (Number.isFinite(datos.corteMl) && datos.corteMl > 0) ||
      (Number.isFinite(datos.corteImporte) && datos.corteImporte > 0);

    // ================= HOJA 2: REPORTE =================
    const wsReporte = wb.addWorksheet('Reporte', {
      views:[{showGridLines:false}],
      pageSetup: {
        paperSize:1,
        orientation:'portrait',
        fitToPage:true,
        fitToWidth:1,
        fitToHeight:0,
        horizontalCentered:true,
        showGridLines:false,
        margins:{left:0.35, right:0.35, top:0.35, bottom:0.35, header:0.2, footer:0.2}
      }
    });
    wsReporte.columns = [12,14,14,11,11,11,12,14,14].map(w => ({width:w}));
    const bordeReporte = {style:'thin', color:{argb:'FFD9E2F3'}};
    function estilizarBloqueReporte(desdeFila, hastaFila, desdeCol, hastaCol){
      for(let fila=desdeFila; fila<=hastaFila; fila++){
        for(let col=desdeCol; col<=hastaCol; col++){
          const celda = wsReporte.getCell(fila,col);
          celda.alignment = Object.assign(
            {vertical:'middle'},
            celda.alignment || {}
          );
          celda.border = {
            top:fila === desdeFila ? bordeReporte : undefined,
            bottom:fila === hastaFila ? bordeReporte : undefined,
            left:col === desdeCol ? bordeReporte : undefined,
            right:col === hastaCol ? bordeReporte : undefined
          };
        }
      }
    }
    function encabezadoBloqueReporte(fila, texto){
      const desdeCol = 1;
      const hastaCol = 9;
      wsReporte.mergeCells(fila,desdeCol,fila,hastaCol);
      const celda = wsReporte.getCell(fila,desdeCol);
      celda.value = texto;
      celda.font = fBase({bold:true, size:14, color:{argb:colorPrincipal}});
      celda.alignment = {vertical:'middle', horizontal:'left'};
      wsReporte.getRow(fila).height = 26;
    }
    function encabezadosTablaReporte(fila, definiciones){
      definiciones.forEach(def => {
        if(def.desde !== def.hasta) wsReporte.mergeCells(fila,def.desde,fila,def.hasta);
        const celda = wsReporte.getCell(fila,def.desde);
        celda.value = def.texto;
        celda.font = fBase({bold:true, size:11, color:{argb:colorHeaderTexto}});
        celda.fill = relleno(colorEncabezadoNeutro);
        celda.alignment = {vertical:'middle', horizontal:'center', wrapText:true};
      });
      wsReporte.getRow(fila).height = 38;
      estilizarBloqueReporte(fila,fila,1,9);
    }
    function escribirFilaReporte(fila, definiciones){
      definiciones.forEach(def => {
        if(def.desde !== def.hasta) wsReporte.mergeCells(fila,def.desde,fila,def.hasta);
        const celda = wsReporte.getCell(fila,def.desde);
        celda.value = def.valor;
        celda.font = fNormal({size:11});
        celda.alignment = {
          vertical:'middle',
          horizontal:def.numero ? 'right' : 'left',
          wrapText:!def.numero
        };
        if(def.formato) celda.numFmt = def.formato;
      });
      wsReporte.getRow(fila).height = 24;
      estilizarBloqueReporte(fila,fila,1,9);
    }
    function filaTotalReporte(fila, etiqueta, valor, formato){
      wsReporte.mergeCells(fila,1,fila,8);
      wsReporte.getCell(fila,1).value = etiqueta;
      wsReporte.getCell(fila,1).font = fBase({bold:true, size:12, color:{argb:colorPrincipal}});
      wsReporte.getCell(fila,1).alignment = {vertical:'middle', horizontal:'left'};
      wsReporte.getCell(fila,9).value = valor;
      wsReporte.getCell(fila,9).font = fBase({bold:true, size:12, color:{argb:colorPrincipal}});
      wsReporte.getCell(fila,9).alignment = {vertical:'middle', horizontal:'right'};
      if(formato) wsReporte.getCell(fila,9).numFmt = formato;
      wsReporte.getRow(fila).height = 25;
      estilizarBloqueReporte(fila,fila,1,9);
    }

    wsReporte.mergeCells('A1:I1');
    wsReporte.getCell('A1').value = 'OPTIMIZACIÓN DE CORTE Y ENCHAPADO — BAMTECK';
    wsReporte.getCell('A1').font = fBase({bold:true, size:17, color:{argb:colorPrincipal}});
    wsReporte.getCell('A1').alignment = {vertical:'middle', horizontal:'center'};
    wsReporte.getRow(1).height = 32;

    wsReporte.mergeCells('A2:I2');
    wsReporte.getCell('A2').value = protegerTexto('Fecha: ' + meta.fecha);
    wsReporte.getCell('A2').font = fNormal({size:12, italic:true, color:{argb:'FF6B7280'}});
    wsReporte.getCell('A2').alignment = {vertical:'middle', horizontal:'center'};
    wsReporte.getRow(2).height = 24;

    wsReporte.mergeCells('A3:B3');
    wsReporte.getCell('A3').value = 'Cantidad de proyectos';
    wsReporte.getCell('A3').font = fNormal({size:11, bold:true});
    wsReporte.getCell('C3').value = meta.cantidadProyectos;
    wsReporte.getCell('C3').font = fNormal({size:11, bold:true});
    wsReporte.getCell('C3').alignment = {vertical:'middle', horizontal:'right'};
    wsReporte.getCell('C3').numFmt = '#,##0';
    wsReporte.mergeCells('D3:H3');
    wsReporte.getCell('D3').value = 'Piezas capturadas';
    wsReporte.getCell('D3').font = fNormal({size:11, bold:true});
    wsReporte.getCell('I3').value = meta.piezasCapturadas;
    wsReporte.getCell('I3').font = fNormal({size:11, bold:true});
    wsReporte.getCell('I3').alignment = {vertical:'middle', horizontal:'right'};
    wsReporte.getCell('I3').numFmt = '#,##0';
    wsReporte.getRow(3).height = 24;
    estilizarBloqueReporte(3,3,1,9);

    let rr = 5;
    let haySeccionDetalleReporte = false;
    function iniciarSeccionDetalleReporte(titulo){
      if(haySeccionDetalleReporte) rr++;
      encabezadoBloqueReporte(rr++,titulo);
      haySeccionDetalleReporte = true;
    }

    if(hayMaterialesReporte){
      iniciarSeccionDetalleReporte('TABLEROS UTILIZADOS');
      encabezadosTablaReporte(rr++,[
      {desde:1,hasta:1,texto:'SKU o código'},
      {desde:2,hasta:3,texto:'Material o tablero'},
      {desde:4,hasta:4,texto:'Largo (mm)'},
      {desde:5,hasta:5,texto:'Ancho (mm)'},
      {desde:6,hasta:6,texto:'Espesor (mm)'},
      {desde:7,hasta:7,texto:'Cantidad'},
      {desde:8,hasta:8,texto:'Precio unitario'},
      {desde:9,hasta:9,texto:'Subtotal'}
      ]);
      materialesReporte.forEach(m => {
        escribirFilaReporte(rr++,[
          {desde:1,hasta:1,valor:protegerTexto(m.sku)},
          {desde:2,hasta:3,valor:protegerTexto(m.nombre)},
          {desde:4,hasta:4,valor:m.largo,numero:true},
          {desde:5,hasta:5,valor:m.ancho,numero:true},
          {desde:6,hasta:6,valor:m.espesor,numero:true},
          {desde:7,hasta:7,valor:m.tableros,numero:true,formato:'#,##0'},
          {desde:8,hasta:8,valor:m.precioUnitario,numero:true,formato:formatoMoneda},
          {desde:9,hasta:9,valor:m.importe,numero:true,formato:formatoMoneda}
        ]);
      });
      filaTotalReporte(
        rr++,
        'Total de tableros',
        materialesReporte.reduce((s,m) => s+m.tableros, 0),
        '#,##0'
      );
      filaTotalReporte(rr++,'Subtotal general de materiales',datos.matSubtotal,formatoMoneda);
    }

    if(hayComponentesReporte){
      iniciarSeccionDetalleReporte('COMPONENTES');
      encabezadosTablaReporte(rr++,[
      {desde:1,hasta:1,texto:'SKU o código'},
      {desde:2,hasta:3,texto:'Nombre'},
      {desde:4,hasta:4,texto:'Cant. por proyecto'},
      {desde:5,hasta:5,texto:'Proyectos'},
      {desde:6,hasta:6,texto:'Cantidad total'},
      {desde:7,hasta:7,texto:'Unidad'},
      {desde:8,hasta:8,texto:'Precio unitario'},
      {desde:9,hasta:9,texto:'Subtotal'}
      ]);
      componentesReporte.forEach(comp => {
        escribirFilaReporte(rr++,[
          {desde:1,hasta:1,valor:protegerTexto(comp.sku)},
          {desde:2,hasta:3,valor:protegerTexto(comp.producto,'(sin nombre)')},
          {desde:4,hasta:4,valor:comp.cantidadPorProyecto,numero:true,formato:'#,##0'},
          {desde:5,hasta:5,valor:comp.cantidadProyectos,numero:true,formato:'#,##0'},
          {desde:6,hasta:6,valor:comp.cantidadTotal,numero:true,formato:'#,##0'},
          {desde:7,hasta:7,valor:protegerTexto(comp.unidad,'pieza')},
          {desde:8,hasta:8,valor:comp.precio,numero:true,formato:formatoMoneda},
          {desde:9,hasta:9,valor:comp.importe,numero:true,formato:formatoMoneda}
        ]);
      });
      filaTotalReporte(
        rr++,
        'Cantidad total de componentes',
        componentesReporte.reduce((s,c) => s+c.cantidadTotal, 0),
        '#,##0'
      );
      filaTotalReporte(rr++,'Subtotal general de componentes',datos.componentesSubtotal,formatoMoneda);
    }

    if(hayTapacantosReporte){
      iniciarSeccionDetalleReporte('ENCHAPADOS Y TAPACANTOS');
      encabezadosTablaReporte(rr++,[
      {desde:1,hasta:1,texto:'SKU o código'},
      {desde:2,hasta:3,texto:'Nombre o tipo'},
      {desde:4,hasta:4,texto:'Metros exactos'},
      {desde:5,hasta:6,texto:'Regla de redondeo'},
      {desde:7,hasta:7,texto:'Metros cobrables'},
      {desde:8,hasta:8,texto:'Precio por metro'},
      {desde:9,hasta:9,texto:'Subtotal'}
      ]);
      tapacantosReporte.forEach(t => {
        escribirFilaReporte(rr++,[
          {desde:1,hasta:1,valor:protegerTexto(t.sku)},
          {desde:2,hasta:3,valor:protegerTexto(t.tipo)},
          {desde:4,hasta:4,valor:t.metrosExactos,numero:true,formato:formatoMetros},
          {desde:5,hasta:6,valor:protegerTexto(t.reglaRedondeo)},
          {desde:7,hasta:7,valor:t.metrosCobrables,numero:true,formato:formatoMetros},
          {desde:8,hasta:8,valor:t.precioMetro,numero:true,formato:formatoMoneda},
          {desde:9,hasta:9,valor:t.importe,numero:true,formato:formatoMoneda}
        ]);
      });
      filaTotalReporte(
        rr++,
        'Total de metros exactos',
        tapacantosReporte.reduce((s,t) => s+t.metrosExactos, 0),
        formatoMetros
      );
      filaTotalReporte(
        rr++,
        'Total de metros cobrables',
        tapacantosReporte.reduce((s,t) => s+t.metrosCobrables, 0),
        formatoMetros
      );
      filaTotalReporte(rr++,'Subtotal general de enchapado o tapacanto',datos.tapaSubtotal,formatoMoneda);
    }

    if(haySeccionDetalleReporte) rr++;
    encabezadoBloqueReporte(rr++,'REPORTE GENERAL');
    const filasReporteGeneral = [
      ['Cantidad de proyectos',meta.cantidadProyectos,'#,##0'],
      ['Piezas capturadas',meta.piezasCapturadas,'#,##0'],
      ['Tableros utilizados',datos.tableros,'#,##0'],
      ['Cortes realizados',datos.cortes,'#,##0'],
      ['Metros lineales de corte',datos.corteMlPresentacion,formatoMetros]
    ];
    if(hayMaterialesReporte){
      filasReporteGeneral.push(['Subtotal de materiales y tableros',datos.matSubtotal,formatoMoneda]);
    }
    if(hayComponentesReporte){
      filasReporteGeneral.push(['Subtotal de componentes',datos.componentesSubtotal,formatoMoneda]);
    }
    if(hayCorteReporte){
      filasReporteGeneral.push(['Subtotal de corte',datos.corteImporte,formatoMoneda]);
    }
    if(hayTapacantosReporte){
      filasReporteGeneral.push(['Subtotal de tapacanto',datos.tapaSubtotal,formatoMoneda]);
    }
    filasReporteGeneral.push(['Total general',datos.total,formatoMoneda]);
    filasReporteGeneral.forEach(linea => filaTotalReporte(rr++,linea[0],linea[1],linea[2]));

    wsReporte.mergeCells(rr,1,rr,8);
    wsReporte.getCell(rr,1).value = 'TOTAL DEL PROYECTO';
    wsReporte.getCell(rr,1).font = fBase({bold:true, size:17, color:{argb:colorPrincipal}});
    wsReporte.getCell(rr,1).alignment = {vertical:'middle', horizontal:'left'};
    wsReporte.getCell(rr,9).value = datos.total;
    wsReporte.getCell(rr,9).font = fBase({bold:true, size:17, color:{argb:colorPrincipal}});
    wsReporte.getCell(rr,9).alignment = {vertical:'middle', horizontal:'right'};
    wsReporte.getCell(rr,9).numFmt = formatoMoneda;
    wsReporte.getRow(rr).height = 34;
    estilizarBloqueReporte(rr,rr,1,9);
    for(let col=1; col<=9; col++){
      wsReporte.getCell(rr,col).border = Object.assign(
        {},
        wsReporte.getCell(rr,col).border || {},
        {top:{style:'medium', color:{argb:colorPrincipal}}}
      );
    }
    const ultimaFilaReporte = rr;
    wsReporte.pageSetup.printArea = 'A1:I' + ultimaFilaReporte;
    wsReporte.pageSetup.printTitlesRow = '1:3';

    // ================= HOJA 3: RESUMEN Y PRECIO =================
    const wsResumen = wb.addWorksheet('Resumen y precio', {
      pageSetup: Object.assign({}, pageSetupBase, {margins:{left:0.6, right:0.6, top:0.6, bottom:0.6, header:0.3, footer:0.3}})
    });
    wsResumen.columns = [{width:42},{width:18}];
    let r3 = 1;
    wsResumen.mergeCells(r3,1,r3,2);
    wsResumen.getCell(r3,1).value = 'OPTIMIZACIÓN DE CORTE Y ENCHAPADO';
    wsResumen.getCell(r3,1).font = fTitulo({size:13});
    r3++;
    wsResumen.mergeCells(r3,1,r3,2);
    wsResumen.getCell(r3,1).value = 'Fecha: ' + protegerTexto(meta.fecha);
    wsResumen.getCell(r3,1).font = fNormal();
    r3 += 2;
    aplicarEncabezados(wsResumen, r3, ['Concepto','Valor']);
    r3++;
    function filaConcepto(etiqueta, valor, formato){
      wsResumen.getCell(r3,1).value = protegerTexto(etiqueta);
      wsResumen.getCell(r3,2).value = valor;
      if(formato) wsResumen.getCell(r3,2).numFmt = formato;
      wsResumen.getCell(r3,1).font = fNormal();
      wsResumen.getCell(r3,2).font = fNormal();
      r3++;
    }
    if(hayMaterialesReporte){
      filaConcepto('Subtotal de materiales y tableros', datos.matSubtotal, formatoMoneda);
    }
    if(hayComponentesReporte){
      filaConcepto('Subtotal de componentes', datos.componentesSubtotal, formatoMoneda);
    }
    filaConcepto('Tableros utilizados', datos.tableros);
    filaConcepto('Cortes realizados', datos.cortes);
    filaConcepto('Metros lineales de corte', datos.corteMlPresentacion, formatoMetros);
    if(hayCorteReporte){
      filaConcepto('Subtotal de corte', datos.corteImporte, formatoMoneda);
    }
    if(hayTapacantosReporte){
      filaConcepto('Subtotal de tapacanto', datos.tapaSubtotal, formatoMoneda);
    }
    r3++;
    wsResumen.getCell(r3,1).value = 'TOTAL DEL PROYECTO';
    wsResumen.getCell(r3,2).value = datos.total;
    wsResumen.getCell(r3,2).numFmt = formatoMoneda;
    aplicarFilaTotal(wsResumen, r3, 2);

    return wb;
  }

  function copiarDatosParaExcel(valor){
    return JSON.parse(JSON.stringify(valor));
  }

  async function exportarExcel(){
    // no se exporta mientras exista un recalculo pendiente: se cancela el debounce y se calcula
    // inmediatamente para que boards y ultimoReporte representen los valores actuales del formulario.
    clearTimeout(debounceTimer);
    if(!recalcular()){
      alert('No se puede exportar el Excel porque el proyecto contiene datos invalidos. Revisa los avisos del formulario.');
      return;
    }
    if(state.boards.length === 0){
      alert('No hay piezas optimizadas para exportar. Agrega piezas primero.');
      return;
    }
    if(!state.ultimoReporte){
      alert('Todavia no hay un reporte de precio calculado.');
      return;
    }

    // Todo lo que sigue usa una sola instantanea tomada antes del primer await. Aunque el usuario
    // cambie el formulario durante la generacion, piezas, tableros, reporte e imagenes pertenecen
    // siempre a la misma version del proyecto.
    const instantanea = {
      estilo: copiarDatosParaExcel(leerEstilo()),
      boards: copiarDatosParaExcel(state.boards),
      reporte: copiarDatosParaExcel(state.ultimoReporte),
      piezas: copiarDatosParaExcel(leerPiezasParaExportar()),
      cantidadProyectos: obtenerCantidadProyectos(),
      kerf: state.boards.length && Number.isFinite(state.boards[0].kerf)
        ? state.boards[0].kerf
        : 0
    };
    instantanea.meta = {
      fecha: fechaLegibleHoy(),
      piezasCapturadas: instantanea.piezas.reduce((acc,p) => acc+p.cant, 0),
      cantidadProyectos: instantanea.cantidadProyectos
    };

    const btn = document.getElementById('exportar');
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Generando Excel...';
    try {
      const ExcelJSLib = await cargarExcelJS();
      const imagenesDiagramas = await generarDiagramasParaExcel(instantanea.estilo, instantanea.boards, instantanea.kerf);
      if(imagenesDiagramas.length !== instantanea.boards.length){
        throw new Error('No se pudieron generar todos los diagramas de la instantanea actual.');
      }
      const wb = construirLibroExcel(
        ExcelJSLib,
        instantanea.reporte,
        instantanea.piezas,
        instantanea.boards,
        imagenesDiagramas,
        instantanea.meta,
        instantanea.estilo
      );
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fechaArchivo = new Date().toISOString().slice(0,10);
      a.href = url;
      a.download = 'optimizador-cortes-bamteck-' + fechaArchivo + '.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch(err){
      alert('No se pudo generar el Excel: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  }
  document.getElementById('exportar').addEventListener('click', exportarExcel);
  document.getElementById('exportarDxf').addEventListener('click', exportarDXFZip);

  document.getElementById('confirmar').addEventListener('click', () => {
    clearTimeout(debounceTimer);
    if(!recalcular()){
      alert('No se puede confirmar el pedido porque el proyecto contiene datos invalidos. Revisa los avisos del formulario.');
      return;
    }
    if(!state.ultimoReporte || !Number.isFinite(state.ultimoReporte.total) || state.ultimoReporte.total < 0){
      alert('No se puede confirmar el pedido porque el total no es valido.');
      return;
    }
    alert('Pedido registrado (demo). La integración con el carrito de WooCommerce se conecta en la fase 2.');
  });

  // ---------- columnas de la tabla "Piezas a cortar" arrastrables ----------
  // se mide el ancho que cada columna ya tiene (con el layout automatico normal) y se deja fijo en
  // px antes de activar table-layout:fixed, para que la tabla se vea exactamente igual que antes
  // de poder arrastrarla; a partir de ahi, cada "manija" en el borde derecho de un encabezado deja
  // agrandar o achicar esa columna con el mouse.
  function activarColumnasRedimensionables(){
    const tabla = document.getElementById('tablaPiezas');
    if(!tabla) return;
    const ths = Array.from(tabla.querySelectorAll('thead th'));
    ths.forEach(th => {
      const anchoActual = th.getBoundingClientRect().width;
      if(anchoActual > 0) th.style.width = Math.round(anchoActual) + 'px';
    });
    // Las columnas marcadas con "data-w" en su <th> (Largo, Ancho, Material y Tipo de tapacanto)
    // siempre arrancan con el ancho ahi indicado, sin importar cuanto le haya tocado en el
    // repartido automatico de las demas columnas: sin esto, cambiar su ancho "de fabrica" en el
    // CSS no se notaba, porque arriba ya se les habia fijado el ancho que el layout automatico
    // les calculo (que no es lo mismo).
    ths.forEach(th => {
      if(th.dataset.w) th.style.width = th.dataset.w + 'px';
    });
    tabla.style.tableLayout = 'fixed';

    ths.forEach((th, i) => {
      if(i === ths.length - 1) return; // la ultima columna (boton Quitar) no necesita manija
      const handle = document.createElement('div');
      handle.className = 'col-resize-handle';
      th.appendChild(handle);
      let startX = 0, startWidth = 0, tooltip = null;
      function posicionarTooltip(e){
        tooltip.style.left = e.clientX + 'px';
        tooltip.style.top = (e.clientY - 8) + 'px';
      }
      function onMouseMove(e){
        const delta = e.clientX - startX;
        const anchoNuevo = Math.max(30, startWidth + delta);
        th.style.width = anchoNuevo + 'px';
        if(tooltip){
          tooltip.textContent = Math.round(anchoNuevo) + 'px';
          posicionarTooltip(e);
        }
      }
      function onMouseUp(){
        handle.classList.remove('arrastrando');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if(tooltip){
          tooltip.remove();
          tooltip = null;
        }
      }
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startWidth = th.getBoundingClientRect().width;
        handle.classList.add('arrastrando');
        tooltip = document.createElement('div');
        tooltip.className = 'col-resize-tooltip';
        tooltip.textContent = Math.round(startWidth) + 'px';
        document.body.appendChild(tooltip);
        posicionarTooltip(e);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  }

  // ---------- barra para arrastrar y cambiar el ancho entre las 2 columnas de la pantalla ----------
  // (piezas a cortar + precio del proyecto, del lado izquierdo; diagrama y botones, del derecho).
  function activarDivisorColumnas(){
    const cont = document.querySelector('.split');
    const resizer = document.getElementById('splitResizer');
    if(!cont || !resizer) return;
    const columnas = cont.querySelectorAll('.split-col');
    const izq = columnas[0], der = columnas[1];
    if(!izq || !der) return;
    function onMouseMove(e){
      const rect = cont.getBoundingClientRect();
      let pctIzq = ((e.clientX - rect.left) / rect.width) * 100;
      pctIzq = Math.min(75, Math.max(25, pctIzq));
      izq.style.width = pctIzq + '%';
      der.style.width = (100 - pctIzq) + '%';
    }
    function onMouseUp(){
      resizer.classList.remove('arrastrando');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
    resizer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      resizer.classList.add('arrastrando');
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  activarColumnasRedimensionables();
  activarDivisorColumnas();

  // corre una vez con los datos de ejemplo
  recalcular();
})();
