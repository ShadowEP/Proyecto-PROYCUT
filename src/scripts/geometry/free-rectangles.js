(function(){
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

  window.ProyCutFreeRectangles = {
    fusionarRectsAdyacentes,
    interseccionRectangulos,
    restarObstaculoRectangular
  };
})();
