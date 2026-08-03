(function(){
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

  function copiarDatosParaExcel(valor){
    return JSON.parse(JSON.stringify(valor));
  }

  window.ProyCutExcelUtils = {
    fechaLegibleHoy,
    extraerDimensionesSvg,
    copiarDatosParaExcel
  };
})();
