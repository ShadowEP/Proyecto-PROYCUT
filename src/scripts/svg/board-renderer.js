(function(){
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

  window.ProyCutBoardRenderer = {
    dibujarBoard
  };
})();
