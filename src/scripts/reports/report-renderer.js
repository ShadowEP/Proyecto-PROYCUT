(function(){
  const {
    fmt,
    fmtMoney
  } = window.ProyCutFormat;

  // ---------- Plantillas de diseño del reporte "Precio del proyecto" ----------
  function renderReporte(datos, plantilla, disenoTotal){
    if(plantilla === 'lista') return renderReporteLista(datos, disenoTotal);
    if(plantilla === 'tarjetas') return renderReporteTarjetas(datos, disenoTotal);
    if(plantilla === 'factura') return renderReporteFactura(datos, disenoTotal);
    return renderReporteColumnas(datos, disenoTotal);
  }
  // barra del total, con varios disenos seleccionables por separado de la plantilla de la tabla
  function totalBarHtml(datos, disenoTotal){
    let clase = 'total-bar';
    if(disenoTotal === 'solido') clase += ' tb-solido';
    if(disenoTotal === 'contorno') clase += ' tb-contorno';
    if(disenoTotal === 'linea') clase += ' tb-linea';
    return `
      <div class="${clase}">
        <span class="label">Total del proyecto</span>
        <span class="amount">${fmtMoney(datos.costoTotal)}</span>
      </div>`;
  }
  function lineasMaterialHtml(datos){
    return datos.materiales.map(m => `<div class="cost-line"><span>${m.nombre} (${m.tableros} tablero${m.tableros===1?'':'s'})</span><span>${fmtMoney(m.importe)}</span></div>`).join('');
  }
  function lineasTapaHtml(datos){
    if(datos.tapacantos.length === 0) return '<div class="cost-line"><span>Sin tapacanto en esta lista</span><span>$0.00</span></div>';
    return datos.tapacantos.map(t => `<div class="cost-line"><span>${t.tipo} (${fmt(t.metros)} m)</span><span>${fmtMoney(t.importe)}</span></div>`).join('');
  }
  function lineasComponentesHtml(datos){
    if(datos.componentes.length === 0) return '<div class="cost-line"><span>Sin componentes en este proyecto</span><span>$0.00</span></div>';
    return datos.componentes.map(c => `<div class="cost-line"><span>${c.producto || '(sin nombre)'} (x${c.cantidad})</span><span>${fmtMoney(c.importe)}</span></div>`).join('');
  }
  function renderReporteColumnas(datos, disenoTotal){
    const hayComponentes = datos.componentes.length > 0;
    const hayTapacanto = datos.tapacantos.length > 0;
    return `
      <div class="cost-grid">
        <div class="cost-col">
          <h3>Material</h3>
          ${lineasMaterialHtml(datos)}
          <div class="cost-line sub"><span>Subtotal material</span><span>${fmtMoney(datos.costoMateriales)}</span></div>
        </div>
        ${hayComponentes ? `
        <div class="cost-col">
          <h3>Componentes</h3>
          ${lineasComponentesHtml(datos)}
          <div class="cost-line sub"><span>Subtotal componentes</span><span>${fmtMoney(datos.costoComponentes)}</span></div>
        </div>` : ''}
        <div class="cost-col">
          <h3>Corte</h3>
          <div class="cost-line"><span>Tableros usados</span><span>${datos.tableros}</span></div>
          <div class="cost-line"><span>Cortes realizados</span><span>${datos.cortes}</span></div>
          <div class="cost-line"><span>Metros lineales de corte</span><span>${fmt(datos.corteMlPresentacion)} m</span></div>
          <div class="cost-line"><span>${datos.corteLineaLabel}</span><span>${fmtMoney(datos.costoCorte)}</span></div>
          <div class="cost-line sub"><span>Subtotal corte</span><span>${fmtMoney(datos.costoCorte)}</span></div>
        </div>
        ${hayTapacanto ? `
        <div class="cost-col">
          <h3>Tapacanto</h3>
          ${lineasTapaHtml(datos)}
          <div class="cost-line sub"><span>Subtotal tapacanto</span><span>${fmtMoney(datos.costoTapacanto)}</span></div>
        </div>` : ''}
      </div>
      ${totalBarHtml(datos, disenoTotal)}`;
  }
  function renderReporteLista(datos, disenoTotal){
    const hayComponentes = datos.componentes.length > 0;
    const hayTapacanto = datos.tapacantos.length > 0;
    return `
      <div class="reporte-lista">
        <div class="rl-seccion">
          <div class="rl-titulo">Material</div>
          ${lineasMaterialHtml(datos)}
          <div class="cost-line sub"><span>Subtotal material</span><span>${fmtMoney(datos.costoMateriales)}</span></div>
        </div>
        ${hayComponentes ? `
        <div class="rl-seccion">
          <div class="rl-titulo">Componentes</div>
          ${lineasComponentesHtml(datos)}
          <div class="cost-line sub"><span>Subtotal componentes</span><span>${fmtMoney(datos.costoComponentes)}</span></div>
        </div>` : ''}
        <div class="rl-seccion">
          <div class="rl-titulo">Corte</div>
          <div class="cost-line"><span>Tableros usados</span><span>${datos.tableros}</span></div>
          <div class="cost-line"><span>Cortes realizados</span><span>${datos.cortes}</span></div>
          <div class="cost-line"><span>Metros lineales de corte</span><span>${fmt(datos.corteMlPresentacion)} m</span></div>
          <div class="cost-line"><span>${datos.corteLineaLabel}</span><span>${fmtMoney(datos.costoCorte)}</span></div>
          <div class="cost-line sub"><span>Subtotal corte</span><span>${fmtMoney(datos.costoCorte)}</span></div>
        </div>
        ${hayTapacanto ? `
        <div class="rl-seccion">
          <div class="rl-titulo">Tapacanto</div>
          ${lineasTapaHtml(datos)}
          <div class="cost-line sub"><span>Subtotal tapacanto</span><span>${fmtMoney(datos.costoTapacanto)}</span></div>
        </div>` : ''}
      </div>
      ${totalBarHtml(datos, disenoTotal)}`;
  }
  function renderReporteTarjetas(datos, disenoTotal){
    const hayComponentes = datos.componentes.length > 0;
    const hayTapacanto = datos.tapacantos.length > 0;
    return `
      <div class="reporte-tarjetas">
        <div class="rt-card">
          <h3>Material</h3>
          ${lineasMaterialHtml(datos)}
          <div class="rt-subtotal"><span>Subtotal</span><span>${fmtMoney(datos.costoMateriales)}</span></div>
        </div>
        ${hayComponentes ? `
        <div class="rt-card rt-componentes">
          <h3>Componentes</h3>
          ${lineasComponentesHtml(datos)}
          <div class="rt-subtotal"><span>Subtotal</span><span>${fmtMoney(datos.costoComponentes)}</span></div>
        </div>` : ''}
        <div class="rt-card rt-corte">
          <h3>Corte</h3>
          <div class="cost-line"><span>Tableros usados</span><span>${datos.tableros}</span></div>
          <div class="cost-line"><span>Cortes realizados</span><span>${datos.cortes}</span></div>
          <div class="cost-line"><span>Metros lineales</span><span>${fmt(datos.corteMlPresentacion)} m</span></div>
          <div class="cost-line"><span>${datos.corteLineaLabel}</span><span>${fmtMoney(datos.costoCorte)}</span></div>
          <div class="rt-subtotal"><span>Subtotal</span><span>${fmtMoney(datos.costoCorte)}</span></div>
        </div>
        ${hayTapacanto ? `
        <div class="rt-card rt-tapa">
          <h3>Tapacanto</h3>
          ${lineasTapaHtml(datos)}
          <div class="rt-subtotal"><span>Subtotal</span><span>${fmtMoney(datos.costoTapacanto)}</span></div>
        </div>` : ''}
      </div>
      ${totalBarHtml(datos, disenoTotal)}`;
  }
  function renderReporteFactura(datos, disenoTotal){
    let filas = '';
    filas += `<tr class="rf-seccion"><td colspan="4">Material</td></tr>`;
    datos.materiales.forEach(m => {
      filas += `<tr><td>${m.nombre}</td><td class="num">${m.tableros}</td><td class="num">${fmtMoney(m.importe / (m.tableros||1))}</td><td class="num">${fmtMoney(m.importe)}</td></tr>`;
    });
    filas += `<tr class="rf-sub"><td colspan="3">Subtotal material</td><td class="num">${fmtMoney(datos.costoMateriales)}</td></tr>`;
    if(datos.componentes.length > 0){
      filas += `<tr class="rf-seccion"><td colspan="4">Componentes</td></tr>`;
      datos.componentes.forEach(c => {
        filas += `<tr><td>${c.producto || '(sin nombre)'}</td><td class="num">${c.cantidad}</td><td class="num">${fmtMoney(c.precio)}</td><td class="num">${fmtMoney(c.importe)}</td></tr>`;
      });
      filas += `<tr class="rf-sub"><td colspan="3">Subtotal componentes</td><td class="num">${fmtMoney(datos.costoComponentes)}</td></tr>`;
    }
    filas += `<tr class="rf-seccion"><td colspan="4">Corte</td></tr>`;
    filas += `<tr><td>Cortes realizados (${fmt(datos.corteMlPresentacion)} m, ${datos.tableros} tablero${datos.tableros===1?'':'s'})</td><td class="num">${datos.corteLineaLabel}</td><td class="num"></td><td class="num">${fmtMoney(datos.costoCorte)}</td></tr>`;
    filas += `<tr class="rf-sub"><td colspan="3">Subtotal corte</td><td class="num">${fmtMoney(datos.costoCorte)}</td></tr>`;
    if(datos.tapacantos.length > 0){
      filas += `<tr class="rf-seccion"><td colspan="4">Tapacanto</td></tr>`;
      datos.tapacantos.forEach(t => {
        filas += `<tr><td>${t.tipo}</td><td class="num">${fmt(t.metros)} m</td><td class="num">${fmtMoney(t.importe / (t.metros||1))}</td><td class="num">${fmtMoney(t.importe)}</td></tr>`;
      });
      filas += `<tr class="rf-sub"><td colspan="3">Subtotal tapacanto</td><td class="num">${fmtMoney(datos.costoTapacanto)}</td></tr>`;
    }
    return `
      <div class="reporte-factura">
        <table>
          <thead><tr><th>Concepto</th><th class="num">Cant.</th><th class="num">Precio unit.</th><th class="num">Importe</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
      ${totalBarHtml(datos, disenoTotal)}`;
  }

  window.ProyCutReportRenderer = {
    renderReporte
  };
})();
