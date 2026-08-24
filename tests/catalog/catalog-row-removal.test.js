const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class ElementoFalso {
  constructor(tagName){
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.className = '';
    this.listeners = {};
    this.disabled = false;
    this.style = {};
  }

  set innerHTML(valor){
    if(valor === '') this.children = [];
  }

  appendChild(elemento){
    this.children.push(elemento);
    return elemento;
  }

  addEventListener(tipo, listener){
    this.listeners[tipo] = listener;
  }

  querySelectorAll(selector){
    const clase = selector.startsWith('.') ? selector.slice(1) : null;
    const encontrados = [];
    const recorrer = elemento => {
      if(clase && elemento.className.split(/\s+/).includes(clase)) encontrados.push(elemento);
      elemento.children.forEach(recorrer);
    };
    this.children.forEach(recorrer);
    return encontrados;
  }

  click(){
    if(!this.disabled && this.listeners.click) this.listeners.click({target:this});
  }
}

const raiz = path.resolve(__dirname, '../..');
const main = fs.readFileSync(path.join(raiz, 'src/scripts/main.js'), 'utf8');
const inicio = main.indexOf('  function renderMateriales(){');
const fin = main.indexOf('  // ---------- Componentes del proyecto', inicio);
const codigoRenderers = main.slice(inicio, fin);
const cuerpos = {
  '#tablaMateriales tbody':new ElementoFalso('tbody'),
  '#tablaTapacantos tbody':new ElementoFalso('tbody'),
  '#tablaComponentes tbody':new ElementoFalso('tbody')
};
const state = {
  materiales:[{sku:'T-1', nombre:'Melamina', precio:700, precioVenta:1000, largo:2440, ancho:1220, espesor:15}],
  tapacantos:[{sku:'E-1', nombre:'PVC', precio:10, precioVenta:20}],
  componentes:[{sku:'H-1', producto:'Bisagra', precio:30, precioVenta:50}]
};
const contexto = vm.createContext({
  state,
  document:{
    querySelector:selector => cuerpos[selector],
    createElement:tagName => new ElementoFalso(tagName)
  },
  obtenerMedidaTableroDefault:() => ({largo:2440, ancho:1220}),
  registrarEventosSkuCatalogo:() => {},
  refrescarSelects:() => {},
  recalcularDebounced:() => {},
  actualizarPrecioCatalogoVisible:() => {}
});

vm.runInContext(
  `${codigoRenderers}\n` +
    ';globalThis.renderers={renderMateriales,renderTapacantos,renderComponentes};',
  contexto,
  {filename:'catalog-renderers'}
);

function probarCatalogo({nombre, array, selector, clase, agregar, render}){
  render();
  let botones = cuerpos[selector].querySelectorAll(`.${clase}`);
  assert.strictEqual(botones.length, 1, `${nombre}: la primera fila muestra Quitar`);
  assert.strictEqual(botones[0].disabled, true, `${nombre}: no permite borrar la ultima fila`);

  array.push(agregar);
  render();
  botones = cuerpos[selector].querySelectorAll(`.${clase}`);
  assert.strictEqual(botones.length, 2, `${nombre}: agregar crea Quitar en ambas filas`);
  assert.strictEqual(botones[1].disabled, false);
  botones[1].click();

  assert.strictEqual(array.length, 1, `${nombre}: Quitar elimina solo una fila`);
  assert.strictEqual(array[0].sku, agregar.sku === 'T-2' ? 'T-1' : agregar.sku === 'E-2' ? 'E-1' : 'H-1');
}

probarCatalogo({
  nombre:'Materiales',
  array:state.materiales,
  selector:'#tablaMateriales tbody',
  clase:'mat-del',
  agregar:{sku:'T-2', nombre:'MDF', precio:600, precioVenta:900, largo:2440, ancho:1220, espesor:15},
  render:contexto.renderers.renderMateriales
});

probarCatalogo({
  nombre:'Tapacantos',
  array:state.tapacantos,
  selector:'#tablaTapacantos tbody',
  clase:'tapa-del',
  agregar:{sku:'E-2', nombre:'ABS', precio:12, precioVenta:22},
  render:contexto.renderers.renderTapacantos
});

probarCatalogo({
  nombre:'Componentes',
  array:state.componentes,
  selector:'#tablaComponentes tbody',
  clase:'comp-del',
  agregar:{sku:'H-2', producto:'Corredera', precio:80, precioVenta:120},
  render:contexto.renderers.renderComponentes
});

console.log('PASS agregar y quitar filas reales de Materiales, Componentes y Tapacantos');
