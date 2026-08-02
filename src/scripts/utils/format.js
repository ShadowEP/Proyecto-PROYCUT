(function(){
  // convierte el valor elegido en el select de fuente a una pila de fuentes CSS real
  function fuenteACss(valor){
    if(valor === 'arial') return 'Arial, Helvetica, sans-serif';
    if(valor === 'georgia') return 'Georgia, "Times New Roman", serif';
    if(valor === 'verdana') return 'Verdana, Geneva, sans-serif';
    if(valor === 'tahoma') return 'Tahoma, Geneva, sans-serif';
    if(valor === 'monoespaciada') return '"Courier New", Courier, monospace';
    return '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  }

  function fmt(n){ return (n||0).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2}); }
  function fmtMoney(n){ return '$' + fmt(n); }

  // Redondeo unico de presentacion para metros lineales. Se calcula una sola vez desde la suma
  // global en milimetros; el valor preciso se conserva para precios y calculos. La tolerancia
  // compensa exclusivamente la representacion binaria de empates decimales como 60.345.
  function normalizarMetrosLinealesParaPresentacion(metrosPrecisos){
    if(!Number.isFinite(metrosPrecisos)) return NaN;
    const factor = 100;
    const tolerancia = Number.EPSILON * Math.max(1, Math.abs(metrosPrecisos));
    return Math.round((metrosPrecisos + tolerancia) * factor) / factor;
  }

  // convierte el valor guardado del selector de fuente de la interfaz a un nombre de fuente
  // real que Excel pueda usar (Excel necesita un solo nombre de fuente instalada, no una lista
  // de respaldo como en CSS).
  function fuenteAExcel(valor){
    if(valor === 'arial') return 'Arial';
    if(valor === 'georgia') return 'Georgia';
    if(valor === 'verdana') return 'Verdana';
    if(valor === 'tahoma') return 'Tahoma';
    if(valor === 'monoespaciada') return 'Courier New';
    return 'Calibri';
  }
  // convierte un color "#rrggbb" (o "#rgb") del selector de color de la interfaz al formato
  // ARGB que usa ExcelJS para fuentes y rellenos.
  function argbDesdeHex(hex){
    let limpio = (hex || '#000000').replace('#','').toUpperCase();
    if(limpio.length === 3) limpio = limpio.split('').map(c => c+c).join('');
    if(limpio.length !== 6) limpio = '000000';
    return 'FF' + limpio;
  }

  window.ProyCutFormat = {
    fmt,
    fmtMoney,
    normalizarMetrosLinealesParaPresentacion,
    argbDesdeHex,
    fuenteACss,
    fuenteAExcel
  };
})();
