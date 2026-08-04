(function(){
  // Punto unico de acceso a las filas de #piezasBody. Devuelve, por cada fila, una representacion
  // cruda y fiel de los controles observables (valores de texto sin parsear, checked de checkboxes,
  // dataset.modo/dataset.valor de los combos), sin aplicar todavia expansion por cantidad, normalizacion
  // de giro, validacion ni transformacion para exportacion — cada funcion consumidora sigue aplicando
  // esas transformaciones exactamente como antes, ahora a partir de este mismo dato crudo en vez de
  // volver a consultar el DOM por su cuenta.
  function leerFilasPiezasDesdeDOM(){
    return Array.from(document.querySelectorAll('#piezasBody tr')).map(row => ({
      id: row.dataset.id,
      cantTexto: row.querySelector('.p-cant').value,
      largoTexto: row.querySelector('.p-l').value,
      anchoTexto: row.querySelector('.p-a').value,
      girarModo: row.querySelector('.p-girar').dataset.modo,
      material: row.querySelector('.p-material-input').dataset.valor,
      tapaTipo: row.querySelector('.p-tapatipo-input').dataset.valor,
      l1: row.querySelector('.p-l1').checked,
      l2: row.querySelector('.p-l2').checked,
      a1: row.querySelector('.p-a1').checked,
      a2: row.querySelector('.p-a2').checked,
      labelTexto: row.querySelector('.p-label').value
    }));
  }

  window.ProyCutPiecesDomReader = {
    leerFilasPiezasDesdeDOM
  };
})();
