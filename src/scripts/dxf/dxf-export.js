(function(){
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

  window.ProyCutDxfExport = {
    grupoDxf,
    polilineaRectDxf,
    construirDXFTablero,
    nombreArchivoSeguro
  };
})();
