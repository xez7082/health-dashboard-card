/**
 * HEALTH DASHBOARD CARD – V2.9.2
 * AJOUT : SÉLECTEUR DE COULEUR VISUEL ET ÉPAISSEUR DE BORDURE
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
    
    const getStyle = (o, prefix) => {
      const isC = o[prefix + 'circle'];
      const w = o[prefix + 'w'] || 100;
      const h = isC ? w : (o[prefix + 'h'] || 70);
      const rad = isC ? '50%' : (o[prefix + 'r'] || 8) + 'px';
      return `left:${o[prefix + 'x']}%; top:${o[prefix + 'y']}%; width:${w}px; height:${h}px; border-radius:${rad}; transform: translate(-50%, -50%) rotate(${o[prefix + 'rot'] || 0}deg); border:${o[prefix + 'bw'] || 1}px solid ${o[prefix + 'bc'] || '#ffffff'};`;
    };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .box { position: absolute; background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; box-sizing: border-box; }
      </style>
      <div class="main">
        <div class="box" style="${getStyle(p, 'imc_')}"><div style="font-size:10px; opacity:0.8;">${p.imc_name || 'IMC'}</div><div id="imc-v" style="font-weight:bold;">--</div></div>
        <div class="box" style="${getStyle(p, 'corp_')}"><div style="font-size:10px; opacity:0.8;">${p.corp_name || 'CORPULENCE'}</div><div id="corp-v" style="font-weight:bold;">--</div></div>
        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.circle ? s.w : s.h}px; border-radius:${s.circle ? '50%' : (s.r || 0) + 'px'}; border:${s.bw || 1}px solid ${s.bc || '#ffffff'}; transform: translate(-50%, -50%) rotate(${s.rot || 0}deg);">
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
    const p = this._config[this._config.current_view || 'person1'];
    this.innerHTML = `
      <style>
        .ed { padding: 12px; background: #1a1a1a; color: white; }
        .sec { background: #252525; padding: 10px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { font-size: 9px; color: #38bdf8; text-transform: uppercase; display: block; margin: 5px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; }
        input[type="color"] { width: 100%; height: 30px; border: none; cursor: pointer; background: none; }
      </style>
      <div class="ed">
        <div style="display:flex; gap:5px; margin-bottom:10px;">
          ${['poids', 'sante', 'sensors', 'design'].map(t => `<button style="flex:1; padding:10px; background:${this._tab===t?'#38bdf8':'#333'};" onclick="this.getRootNode().host._setTab('${t}')">${t.toUpperCase()}</button>`).join('')}
        </div>
        ${this._tab === 'sante' ? this._boxUI(p, 'IMC', 'imc_') + this._boxUI(p, 'CORPULENCE', 'corp_') : ''}
        ${this._tab === 'sensors' ? (p.sensors || []).map((s, i) => this._boxUI(s, `Sensor ${i+1}`, '', true, i)).join('') + '<button onclick="this.getRootNode().host._addS()">+ AJOUTER</button>' : ''}
      </div>
    `;
    this._attach();
  }

  _boxUI(obj, label, pr, isS = false, idx = 0) {
    const f = (n) => isS ? n : pr + n;
    const d = isS ? `data-idx="${idx}"` : '';
    return `
      <div class="sec">
        <label>${label} - ENTITÉ</label><input type="text" ${d} data-f="${f('entity')}" value="${obj[f('entity')] || ''}">
        <div class="grid">
            <div><label>X%</label><input type="number" ${d} data-f="${f('x')}" value="${obj[f('x')] || 50}"></div>
            <div><label>Y%</label><input type="number" ${d} data-f="${f('y')}" value="${obj[f('y')] || 50}"></div>
            <div><label>BORDURE</label><input type="number" ${d} data-f="${f('bw')}" value="${obj[f('bw')] || 1}"></div>
        </div>
        <div class="grid">
            <div><label>LARGEUR</label><input type="number" ${d} data-f="${f('w')}" value="${obj[f('w')] || 100}"></div>
            <div><label>ARRONDI</label><input type="number" ${d} data-f="${f('r')}" value="${obj[f('r')] || 8}"></div>
            <div><label>COULEUR</label><input type="color" ${d} data-f="${f('bc')}" value="${obj[f('bc')] || '#ffffff'}"></div>
        </div>
        <input type="checkbox" ${d} data-f="${f('circle')}" ${obj[f('circle')]?'checked':''}> CERCLE
        ${isS ? `<button style="width:100%; color:red;" onclick="this.getRootNode().host._delS(${idx})">SUPPRIMER</button>` : ''}
      </div>
    `;
  }

  _setTab(t) { this._tab = t; this.render(); }
  _addS() { const p = this._config[this._config.current_view]; if(!p.sensors) p.sensors=[]; p.sensors.push({name:'N', x:50, y:50, w:100, bw:1, bc:'#ffffff', r:8}); this._fire(); this.render(); }
  _delS(i) { this._config[this._config.current_view].sensors.splice(i,1); this._fire(); this.render(); }
  _attach() { this.querySelectorAll('input').forEach(el => el.onchange = () => {
      const p = this._config[this._config.current_view];
      const val = el.type === 'checkbox' ? el.checked : el.value;
      if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = val;
      else p[el.dataset.f] = val;
      this._fire();
  }); }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}
customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
