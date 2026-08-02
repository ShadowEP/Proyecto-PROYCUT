(function(){
  function normalizarSkuManual(valor){
    return String(valor == null ? '' : valor).trim().toUpperCase();
  }

  function esValorAfirmativo(valor){
    if(!valor) return false;
    const v = valor.trim().toUpperCase();
    if(v === 'SI') return true;
    if(v === 'SÍ') return true;
    if(v === '1') return true;
    if(v === 'TRUE') return true;
    if(v === 'X') return true;
    return false;
  }
  function normalizarGirarCSV(valor){
    const v = (valor || '').trim().toLowerCase();
    if(v === 'normal') return 'normal';
    if(v === 'rotado') return 'rotado';
    if(v === 'girar') return 'rotado';
    if(v === '90') return 'rotado';
    return 'auto';
  }

  function normalizarNombreComponente(valor){
    return String(valor == null ? '' : valor)
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  function normalizarNombreMaterialImportado(valor){
    return String(valor == null ? '' : valor)
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  window.ProyCutTextNormalization = {
    normalizarSkuManual,
    normalizarNombreComponente,
    normalizarNombreMaterialImportado,
    normalizarGirarCSV,
    esValorAfirmativo
  };
})();
