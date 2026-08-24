(function(){
  const {crearPiezaFabricacion} = window.ProyCutManufacturingPart;
  const {crearTableroFabricacion} = window.ProyCutManufacturingBoard;

  function normalizarReferencia(valor){
    return String(valor == null ? '' : valor).trim().toUpperCase();
  }

  function buscarRegistro(catalogo, referencia, obtenerNombre){
    const buscado = normalizarReferencia(referencia);
    return (Array.isArray(catalogo) ? catalogo : []).find(registro => (
      normalizarReferencia(registro && registro.sku) === buscado ||
      normalizarReferencia(obtenerNombre(registro || {})) === buscado
    ));
  }

  function construirLadosTapacanto(fila, tapacantos){
    const tapacanto = buscarRegistro(tapacantos, fila.tapaTipo, registro => registro.nombre);
    const referencia = tapacanto
      ? {sku:tapacanto.sku || '', nombre:tapacanto.nombre || ''}
      : {sku:'', nombre:fila.tapaTipo || ''};
    return {
      tipo:fila.tapaTipo ? {...referencia} : null,
      l1:fila.l1 ? {...referencia} : null,
      l2:fila.l2 ? {...referencia} : null,
      a1:fila.a1 ? {...referencia} : null,
      a2:fila.a2 ? {...referencia} : null
    };
  }

  function buildManufacturingModel({filasPiezas, materiales, tapacantos}){
    const tableros = (Array.isArray(materiales) ? materiales : []).map(material => (
      crearTableroFabricacion({
        sku:material.sku || '',
        material:material.nombre,
        largo:material.largo,
        ancho:material.ancho,
        espesor:material.espesor,
        costo:material.precio,
        precioVenta:material.precioVenta
      })
    ));
    const piezasFabricacion = (Array.isArray(filasPiezas) ? filasPiezas : []).map(fila => {
      const material = buscarRegistro(materiales, fila.material, registro => registro.nombre);
      const id = fila.id;
      return crearPiezaFabricacion({
        id,
        nombre:String(fila.labelTexto || '').trim() || `Pieza ${id}`,
        cantidad:parseInt(fila.cantTexto, 10) || 0,
        largo:parseFloat(fila.largoTexto),
        ancho:parseFloat(fila.anchoTexto),
        espesor:material ? material.espesor : null,
        materialSKU:material ? (material.sku || '') : '',
        modoRotacion:fila.girarModo || 'auto',
        sentidoVeta:null,
        ladosTapacanto:construirLadosTapacanto(fila, tapacantos),
        operaciones:[],
        origen:{tipo:'PROYECTO_ACTUAL', referenciaId:id}
      });
    });

    return {
      piezasFabricacion,
      tableros,
      subensambles:[]
    };
  }

  function buildOptimizerInputFromManufacturingModel({
    modeloFabricacion,
    cantidadProyectos,
    permitirGirarAuto,
    obtenerParametrosTecnicos
  }){
    const piezas = [];
    const gruposPorMaterial = {};
    const errores = [];
    const multiplicador = Number.isInteger(cantidadProyectos) && cantidadProyectos > 0
      ? cantidadProyectos
      : 1;
    const tableros = modeloFabricacion && Array.isArray(modeloFabricacion.tableros)
      ? modeloFabricacion.tableros
      : [];
    const especificaciones = modeloFabricacion && Array.isArray(modeloFabricacion.piezasFabricacion)
      ? modeloFabricacion.piezasFabricacion
      : [];

    especificaciones.forEach(especificacion => {
      const tablero = tableros.find(item => item.sku === especificacion.materialSKU);
      const parametros = typeof obtenerParametrosTecnicos === 'function'
        ? obtenerParametrosTecnicos(especificacion)
        : {ok:false, errores:['Faltan parametros tecnicos de compatibilidad para la pieza.']};
      if(!tablero){
        errores.push(`No existe tablero para la pieza ${especificacion.id}.`);
        return;
      }
      if(!parametros || parametros.ok === false){
        errores.push(...((parametros && parametros.errores) || ['Parametros tecnicos invalidos.']));
        return;
      }
      let girarModo = especificacion.modoRotacion;
      if(girarModo === 'auto' && !permitirGirarAuto) girarModo = 'normal';
      const lados = especificacion.ladosTapacanto || {};
      const tapacanto = lados.tipo || lados.l1 || lados.l2 || lados.a1 || lados.a2;
      const cantidad = especificacion.cantidad * multiplicador;
      for(let indice=0; indice<cantidad; indice++){
        const pieza = {
          num:especificacion.id,
          label:especificacion.nombre,
          l:especificacion.largo,
          a:especificacion.ancho,
          girarModo,
          material:tablero.material,
          tapaTipo:tapacanto ? tapacanto.nombre : '',
          l1:Boolean(lados.l1),
          l2:Boolean(lados.l2),
          a1:Boolean(lados.a1),
          a2:Boolean(lados.a2),
          kerfEfectivo:parametros.kerfEfectivo,
          kerfEntrePiezasEfectivo:parametros.kerfEntrePiezasEfectivo,
          kerfPiezaSobranteEfectivo:parametros.kerfPiezaSobranteEfectivo,
          kerfBordeExteriorEfectivo:parametros.kerfBordeExteriorEfectivo
        };
        piezas.push(pieza);
        (gruposPorMaterial[pieza.material] = gruposPorMaterial[pieza.material] || []).push(pieza);
      }
    });

    return {piezas, gruposPorMaterial, errores};
  }

  window.ProyCutManufacturingModel = {
    buildManufacturingModel,
    buildOptimizerInputFromManufacturingModel
  };
})();
