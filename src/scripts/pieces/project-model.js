(function(){
  // Modelo temporal de un solo ciclo de recalculo: agrupa la lectura cruda de piezas (ya hecha una
  // sola vez por el llamador, via leerFilasPiezasDesdeDOM) junto con la cantidad de proyectos vigente,
  // para que validarProyecto() y leerPiezas() dejen de leer el DOM de #piezasBody por separado dentro
  // del mismo recalculo. No es una fuente de verdad persistente: se construye dentro de recalcular(),
  // se usa solo durante esa llamada y se descarta — nunca se guarda en state ni en localStorage, y no
  // sustituye el DOM como origen de los datos.
  //
  // Deliberadamente NO incluye piezas normalizadas, expandidas ni el resultado de validarProyecto():
  // validarProyecto() necesita el texto crudo de cada campo (para validarCantidad/validarMedida) y
  // leerPiezas() necesita valores parseados, expandidos por cantidad y verificados contra el tablero
  // (ver docs/engineering/38-PIECES-DOM-READING-DECOUPLING-REPORT.md, seccion 2) — unificar esas dos
  // transformaciones en el modelo arriesgaria cambiar el comportamiento de alguna de las dos.
  function construirModeloProyecto({filasPiezas, cantidadProyectos}){
    return {
      filas: filasPiezas,
      cantidadProyectos: cantidadProyectos
    };
  }

  window.ProyCutProjectModel = {
    construirModeloProyecto
  };
})();
