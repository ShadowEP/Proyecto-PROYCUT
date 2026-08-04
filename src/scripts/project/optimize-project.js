(function(){
  // Coordina los algoritmos existentes sin implementarlos ni conocer DOM, state o localStorage.
  // Cada dependencia se recibe de forma explicita para mantener el nucleo en main.js.
  function optimizarProyectoPreparado({
    gruposPorMaterial,
    parametrosCorteProyecto,
    opcionesProyecto,
    dependencias
  }){
    let totalCortes = 0;
    let totalCorteMm = 0;
    const boards = [];
    const tablerosPorMaterial = {};

    Object.keys(gruposPorMaterial).forEach(material => {
      const medidaMaterial = dependencias.medidaTableroDeMaterial(material);
      dependencias.establecerMedidaTableroActiva(medidaMaterial);
      const areaUtil = dependencias.calcularRectanguloUtilTablero(
        medidaMaterial.largo,
        medidaMaterial.ancho,
        parametrosCorteProyecto.margenes
      );
      if(!areaUtil.ok) return;
      const kerfMaterial = dependencias.obtenerKerfMaterial(
        gruposPorMaterial[material],
        parametrosCorteProyecto
      );
      const areaColocacion = dependencias.calcularRectanguloColocacion(
        areaUtil.rect,
        kerfMaterial.bordeExterior
      );
      if(!areaColocacion.ok) return;
      const datosTablero = {
        boardW:medidaMaterial.largo,
        boardH:medidaMaterial.ancho,
        areaUtil:areaUtil.rect,
        areaColocacion:areaColocacion.rect,
        margenes:areaUtil.margenes,
        kerfValor:kerfMaterial.valor,
        kerfEntrePiezas:kerfMaterial.entrePiezas,
        kerfPiezaSobrante:kerfMaterial.piezaSobrante,
        kerfBordeExterior:kerfMaterial.bordeExterior
      };
      const boardsMaterial = dependencias.empacarMaterial(
        gruposPorMaterial[material],
        kerfMaterial.entrePiezas,
        opcionesProyecto.libre,
        opcionesProyecto.nivelOptimizacion,
        datosTablero
      );
      boardsMaterial.forEach(board => dependencias.compactarHaciaAbajo(board));
      tablerosPorMaterial[material] = boardsMaterial.length;
      boardsMaterial.forEach((board, indice) => {
        board.materialLabel = material;
        board.indexEnMaterial = indice + 1;
        boards.push(board);
        const conteo = dependencias.contarCortes(board);
        totalCortes += conteo.cortes;
        totalCorteMm += conteo.largoMm;
      });
    });

    return {
      ok:true,
      boards,
      tablerosPorMaterial,
      totalCortes,
      totalCorteMm
    };
  }

  window.ProyCutProjectOptimization = {
    optimizarProyectoPreparado
  };
})();
