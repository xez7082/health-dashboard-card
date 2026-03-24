/**
 * HEALTH DASHBOARD CARD – V2.9.1
 * FIX : RÉINTÉGRATION DU SENSOR CORPULENCE DANS L'ONGLET SANTÉ
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  set hass(hass) { this._hass = hass; this.update(); }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    const setV = (id, ent) => {
      const el = this.shadowRoot.getElementById(id);
      if(el && ent && this._hass.states[ent]) el.textContent = this._hass.states[ent].state;
    };
    setV('imc-v', p.imc_entity);
    setV('corp-v', p.corp_entity);
    if(p.sensors) p.sensors.forEach((s, i) => setV(`s-${i}`, s.entity));
  }

  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    const rGlobal = this._config.card_round || 12;
    
    const getStyle = (o, prefix) => {
      const isCircle = o[prefix + 'circle'];
      const w = o[prefix + 'w'] || 100;
      const h = isCircle ? w : (o[prefix + 'h'] || 70);
      const rad = isCircle ? '50%' : (o[prefix + 'r'] || 8) + 'px';
      const rot = o[prefix + 'rot'] || 0;
      return `left:${o[prefix + 'x']}%; top:${o[prefix + 'y']}%; width:${w}px; height:${h}px; border-radius:${rad}; transform: translate(-50%, -50%) rotate(${rot}deg); border-width:${o[prefix + 'bw'] || 1}px; border-color:${o[prefix + 'bc'] || 'white'};`;
    };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${rGlobal}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.4; }
        .box { position: absolute; transform-origin: center; background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; border-style: solid; box-sizing: border-box; }
      </style>
      <div class="main">
        <div class="bg"></div>
        
        <div class="box" style="${getStyle(p, 'imc_')}">
            <div style="font-size:10px; opacity:0.8;">${p.imc_name || 'IMC'}</div><div id="imc-v" style="font-weight:bold;">--</div>
        </div>

        <div class="box" style="${getStyle(p, 'corp_')}">
            <div style="font-size:10px; opacity:0.8;">${p.corp_name || 'CORPULENCE'}</div><div id="corp-v" style="font-weight:bold;">--</div>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.circle ? s.w : s.h}px; border-radius:${s.circle ? '50%' : (s.r || 0) + 'px'}; border-width:${s.bw || 1}px; border-color:${s.bc || 'white'}; transform: translate(-50%, -50%) rotate(${s.rot || 0}deg);">
            <div style="font-size:10px; opacity:0.8;">${s.name}</div><div id="s-${i}" style="font-weight:bold;">--</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'poids'; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }

  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .ed { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
        .tab { flex: 1; padding: 10px; background: #333; cursor: pointer; text-align:center; border-radius: 4px; font-size: 11px; }
        .active { background: #38bdf8 !important; color: black !important; font-weight: bold; }
        .sec { background: #252525; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #111; color: white; border: 1px solid #444; border-radius: 4px; margin-bottom: 5px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .check-group { display: flex; align-items: center; gap: 10px; margin: 10px 0; background: #333; padding: 5px; border-radius: 4px; }
      </style>
      <div class="ed">
        <div class="tabs">
            <div class="tab ${this._tab==='poids'?'active':''}" data-t="poids">POIDS</div>
            <div class="tab ${this._tab==='sante'?'active':''}" data-t="sante">SANTÉ</div>
            <div class="tab ${this._tab==='sensors'?'active':''}" data-t="sensors">SENSORS</div>
            <div class="tab ${this._tab==='design'?'active':''}" data-t="design">DESIGN</div>
        </div>

        <div id="form">
            ${this._tab === 'sante' ? `
                ${this._boxUI(p, 'IMC', 'imc_')}
                ${this._boxUI(p, 'CORPULENCE', 'corp_')}
            ` : ''}
            
            ${this._tab === 'sensors' ? `
                ${(p.sensors || []).map((s, i) => this._boxUI(s, `Sensor ${i+1}`, '', true, i)).join('')}
                <button id="add-s" style="width:100%; padding:12px; background:#38bdf8; color:black; font-weight:bold; border:none; border-radius:4px; cursor:pointer;">+ AJOUTER UN CAPTEUR</button>
            ` : ''}

            ${this._tab === 'poids' ? `<div class="sec"><label>Nom</label><input type="text" data-f="name" value="${p.name}"></div>` : ''}

            ${this._tab === 'design' ? `
                <div class="sec">
                    <label>URL Fond</label><input type="text" data-f="image" value="${p.image}">
                    <label>Hauteur Carte</label><input type="number" id="ch" value="${this._config.card_height}">
                </div>
            ` : ''}
        </div>
      </div>
    `;
    this._attach();
  }

  _boxUI(obj, label, pr, isS = false, idx = 0) {
    const f = (n) => isS ? n : pr + n;
    const d = isS ? `data-idx="${idx}"` : '';
    return `
      <div class="sec">
        <label>${label} - ENTITÉ</label>
        <input type="text" ${d} data-f="${f('entity')}" value="${obj[f('entity')] || ''}">
        <label>LIBELLÉ AFFICHÉ</label>
        <input type="text" ${d} data-f="${f('name')}" value="${obj[f('name')] || ''}">
        <div class="grid">
            <div><label>X (%)</label><input type="number" ${d} data-f="${f('x')}" value="${obj[f('x')] || 50}"></div>
            <div><label>Y (%)</label><input type="number" ${d} data-f="${f('y')}" value="${obj[f('y')] || 50}"></div>
        </div>
        <div class="grid">
            <div><label>L (W)</label><input type="number" ${d} data-f="${f('w')}" value="${obj[f('w')] || 100}"></div>
            <div><label>H</label><input type="number" ${d} data-f="${f('h')}" value="${obj[f('h')] || 70}" ${obj[f('circle')]?'disabled':''}></div>
        </div>
        <div class="grid">
            <div><label>ARRONDI</label><input type="number" ${d} data-f="${f('r')}" value="${obj[f('r')] || 8}"></div>
            <div><label>ANGLE (°)</label><input type="number" ${d} data-f="${f('rot')}" value="${obj[f('rot')] || 0}"></div>
        </div>
        <div class="check-group">
            <input type="checkbox" style="width:auto;" ${d} data-f="${f('circle')}" ${obj[f('circle')]?'checked':''}> <span>CERCLE</span>
        </div>
        ${isS ? `<button style="width:100%; background:#ff5252; color:white; border:none; padding:5px; border-radius:4px;" data-del="${idx}">SUPPRIMER</button>` : ''}
      </div>
    `;
  }

  _attach() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._tab = t.dataset.t; this.render(); });
    this.querySelectorAll('input').forEach(el => {
        el.onchange = () => {
            let val = el.type === 'checkbox' ? el.checked : el.value;
            if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = val;
            else if(el.id === 'ch') this._config.card_height = val;
            else p[el.dataset.f] = val;
            this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
            this.render();
        };
    });
    this.querySelectorAll('[data-del]').forEach(btn => btn.onclick = () => { p.sensors.splice(btn.dataset.del, 1); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); });
    const add = this.querySelector('#add-s');
    if(add) add.onclick = () => { if(!p.sensors) p.sensors = []; p.sensors.push({name:'Nouveau', entity:'', x:50, y:50, w:100, h:70, r:8, rot:0, circle:false}); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); };
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
