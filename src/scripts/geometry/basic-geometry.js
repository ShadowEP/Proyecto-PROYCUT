(function(){
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

  window.ProyCutBasicGeometry = {
    calcularRectanguloUtilTablero,
    calcularRectanguloColocacion,
    calcularHuellaEnRectangulo,
    capacidadLinealConKerf
  };
})();
