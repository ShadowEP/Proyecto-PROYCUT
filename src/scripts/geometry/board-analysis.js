(function(){
  const {
    calcularRectsLibresDesdeObstaculos,
    interseccionRectangulos
  } = window.ProyCutFreeRectangles;

  const {
    obtenerAreaColocacionBoard
  } = window.ProyCutBoardArea;

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

  window.ProyCutBoardAnalysis = {
    calcularSobrantes,
    areaSobranteTotal,
    contarCortes,
    calcularFreeRectsPara,
    crearFronterasEntrePiezas,
    crearFronterasPiezaSobrante,
    crearFronterasExteriores
  };
})();
