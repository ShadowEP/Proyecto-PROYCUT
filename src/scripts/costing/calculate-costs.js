(function(){
  const {
    fmt,
    fmtMoney,
    normalizarMetrosLinealesParaPresentacion
  } = window.ProyCutFormat;

  // Aisla el bloque de calculo de costos que antes vivia dentro de recalcular() (main.js).
  // Recibe explicitamente todo lo que el bloque original leia de piezas/boards/catalogos/DOM,
  // y devuelve {ok:false, errores} o {ok:true, datosReporte}, sin tocar document/state/localStorage
  // y sin mutar ninguno de sus parametros. El llamador (recalcular()) sigue siendo responsable de
  // reaccionar ante un resultado invalido (ocultar paneles, limpiar state, mostrar errores) exactamente
  // igual que antes.
  function calcularCostosProyecto({
    piezas,
    boards,
    tablerosPorMaterial,
    totalCortes,
    totalCorteMm,
    materiales,
    componentes,
    componentesProyecto,
    tapacantos,
    cantidadProyectos,
    modoPrecioCorte,
    precioCorte,
    precioCorteMetro,
    redondearTapacanto
  }){
    // ---- costos: material ----
    let matSubtotal = 0;
    const materialesRep = Object.keys(tablerosPorMaterial).map(mat => {
      const cfg = materiales.find(m=>m.nombre===mat) ||
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
    const cantidadProyectosComponentes = cantidadProyectos;
    let componentesSubtotal = 0;
    const componentesRep = componentesProyecto.map(c => {
      // El componente del proyecto conserva una copia del SKU al agregarse. Si despues se edita
      // el catalogo, se usa su SKU actual solo cuando el nombre identifica un registro unico;
      // ante nombres duplicados se conserva la copia para no asociar un codigo por conjetura.
      const coincidenciasCatalogo = componentes.filter(cfg => cfg.producto === c.producto);
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
    const tapacantosRep = Object.keys(porTipo).map(tipo => {
      const cfg = tapacantos.find(t=>t.nombre===tipo) || {precio:0};
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
      return {
        ok:false,
        errores:['No se puede calcular el proyecto: uno o mas costos son negativos o no son numeros finitos. Revisa cantidades, precios y medidas.']
      };
    }
    const datosReporte = {
      materiales: materialesRep,
      matSubtotal: matSubtotal,
      cantidadProyectos:cantidadProyectosComponentes,
      componentes: componentesRep,
      componentesSubtotal: componentesSubtotal,
      tableros: boards.length,
      cortes: totalCortes,
      corteMl: corteMl,
      corteMlPresentacion: corteMlPresentacion,
      precioCorte: precioCorte,
      corteLineaLabel: corteLineaLabel,
      corteImporte: corteImporte,
      tapacantos: tapacantosRep,
      tapaSubtotal: tapaSubtotal,
      total: total,
      costoMateriales: matSubtotal,
      costoComponentes: componentesSubtotal,
      costoCorte: corteImporte,
      costoTapacanto: tapaSubtotal,
      costoTotal: total
    };
    return {ok:true, datosReporte};
  }

  window.ProyCutCosting = {
    calcularCostosProyecto
  };
})();
