(function(){
  const {
    dibujarBoard
  } = window.ProyCutBoardRenderer;

  const {
    extraerDimensionesSvg
  } = window.ProyCutExcelUtils;

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

  window.ProyCutExcelDiagrams = {
    DIAGRAMAS_POR_HOJA,
    ESCALA_IMPRESION_PIEZAS,
    FILAS_DISPONIBLES_DIAGRAMAS,
    svgAPngBuffer,
    generarDiagramasParaExcel
  };
})();
