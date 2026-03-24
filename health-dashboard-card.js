/**
 * HEALTH DASHBOARD CARD – V3.1.0
 * AJOUT : BARRE DE PROGRESSION & RÉGLAGE TAILLE TEXTE
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) { this._hass = hass; this.update(); }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const v = this._config.current_view;
    const p = this._config[v];
    
    const setV = (idV, idU, ent) => {
      const elV = this.shadowRoot.getElementById(idV);
      const elU = this.shadowRoot.getElementById(idU);
      if(elV && elU && ent && this._hass.states[ent]) {
        const s = this._hass.states[ent];
        elV.textContent = s.state;
        elU.textContent = s.attributes.unit_of_measurement || '';
      }
    };
    
    setV('imc-v', 'imc-u', p.imc_entity);
    setV('corp-v', 'corp-u', p.corp_entity);
    if(p.sensors) p.sensors.forEach((s, i) => setV(`s-${i}-v`, `s-${i}-u`, s.entity));

    // Logique de la barre de poids
    const weightSens = p.weight_entity || (v === 'person1' ? 'sensor.withings_poids_patrick' : 'sensor.withings_poids_sandra');
    const stateW = this._hass.states[weightSens];
    if (stateW && p.start && p.ideal) {
        const actuel = parseFloat(stateW.state);
        const start = parseFloat(p.start);
        const ideal = parseFloat(p.ideal);
        const pct = Math.max(0, Math.min(100, ((start - actuel) / (start - ideal)) * 100));
        this.shadowRoot.getElementById('ptr').style.left = pct + '%';
        this.shadowRoot.getElementById('ptr-v').textContent = actuel + 'kg';
    }
  }

  render() {
    if (!this._config) return;
    const v = this._config.current_view;
    const p = this._config[v] || {};
    const hCard = this._config.card_height || 600;

    const getBoxStyle = (o, prefix) => {
      const isC = o[prefix + 'circle'];
      const w = o[prefix + 'w'] || 100;
      const h = isC ? w : (o[prefix + 'h'] || 80);
      return `left:${o[prefix+'x']||50}%; top:${o[prefix+'y']||50}%; width:${w}px; height:${h}px; border-radius:${isC?'50%':(o[prefix+'r']||8)+'px'}; border:${o[prefix+'bw']||1}px solid ${o[prefix+'bc']||'#fff'}; transform: translate(-50%, -50%) rotate(${o[prefix+'rot']||0}deg); font-size:${o[prefix+'ts']||1.6}em;`;
    };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${hCard}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.3; z-index:1; }
        .box { position: absolute; background: rgba(15, 23, 42, 0.9); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; box-sizing: border-box; padding: 5px; }
        .ico { --mdc-icon-size: 20px; opacity: 0.6; margin-bottom: 2px; }
        .lbl { font-size: 10px; opacity: 0.7; text-transform: uppercase; font-weight: bold; }
        .val { font-weight: bold; line-height: 1; }
        .uni { font-size: 0.5em; opacity: 0.6; display: block; }
        
        .rule-wrap { position: absolute; left: 10%; width: 80%; z-index: 20; top: ${p.bar_y || 90}%; }
        .rule-track { position: relative; width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; }
        .ptr { position: absolute; top: -10px; width: 2px; height: 26px; background: white; transition: left 1s ease-out; }
        .bub { position: absolute; top: -35px; left: 50%; transform: translateX(-50%); background: #38bdf8; color: black; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; white-space: nowrap; }
      </style>
      <div class="main">
        <div class="bg"></div>
        
        <div class="box" style="${getBoxStyle(p, 'imc_')}">
            ${p.imc_icon ? `<ha-icon icon="${p.imc_icon}" class="ico"></ha-icon>` : ''}
            <div class="lbl">${p.imc_name || 'IMC'}</div>
            <div class="val"><span id="imc-v">--</span><span id="imc-u" class="uni"></span></div>
        </div>

        <div class="box" style="${getBoxStyle(p, 'corp_')}">
            ${p.corp_icon ? `<ha-icon icon="${p.corp_icon}" class="ico"></ha-icon>` : ''}
            <div class="lbl">${p.corp_name || 'CORP'}</div>
            <div class="val"><span id="corp-v">--</span><span id="corp-u" class="uni"></span></div>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.circle?s.w:s.h}px; border-radius:${s.circle?'50%':(s.r||8)+'px'}; border:${s.bw||1}px solid ${s.bc||'#fff'}; transform: translate(-50%, -50%) rotate(${s.rot||0}deg); font-size:${s.ts||1.6}em;">
            ${s.icon ? `<ha-icon icon="${s.icon}" class="ico"></ha-icon>` : ''}
            <div class="lbl">${s.name}</div>
            <div class="val"><span id="s-${i}-v">--</span><span id="s-${i}-u" class="uni"></span></div>
          </div>
        `).join('')}

        <div class="rule-wrap">
            <div class="rule-track"><div id="ptr" class="ptr"><div id="ptr-v" class="bub">--</div></div></div>
        </div>
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
        .tab { flex: 1; padding: 10px; background: #333; cursor: pointer; text-align:center; border-radius: 4px; font-size: 11px; border:none; color:white; }
        .active { background: #38bdf8 !important; color: black !important; font-weight: bold; }
        .sec { background: #252525; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #111; color: white; border: 1px solid #444; border-radius: 4px; margin-bottom: 5px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
      </style>
      <div class="ed">
        <div class="tabs">
            ${['poids', 'sante', 'sensors', 'design'].map(t => `<button class="tab ${this._tab===t?'active':''}" onclick="this.getRootNode().host._setTab('${t}')">${t.toUpperCase()}</button>`).join('')}
        </div>

        ${this._tab === 'poids' ? `
          <div class="sec">
            <label>Entité Poids (sensor.xxx)</label><input type="text" data-f="weight_entity" value="${p.weight_entity || ''}">
            <div class="grid">
              <div><label>Départ (kg)</label><input type="number" data-f="start" value="${p.start}"></div>
              <div><label>Objectif (kg)</label><input type="number" data-f="ideal" value="${p.ideal}"></div>
              <div><label>Pos Y barre %</label><input type="number" data-f="bar_y" value="${p.bar_y || 90}"></div>
            </div>
          </div>
        ` : ''}

        ${this._tab === 'sante' ? this._boxUI(p, 'IMC', 'imc_') + this._boxUI(p, 'CORPULENCE', 'corp_') : ''}
        ${this._tab === 'sensors' ? (p.sensors || []).map((s, i) => this._boxUI(s, `Sensor ${i+1}`, '', true, i)).join('') + '<button style="width:100%; padding:10px; background:#38bdf8; color:black; font-weight:bold; border:none; border-radius:4px;" onclick="this.getRootNode().host._addS()">+ AJOUTER</button>' : ''}
        
        ${this._tab === 'design' ? `
            <div class="sec">
                <label>Image de fond</label><input type="text" data-f="image" value="${p.image || ''}">
                <label>Hauteur Carte</label><input type="number" id="ch" value="${this._config.card_height || 600}">
                <select id="ps" style="width:100%; padding:10px; background:#111; color:white; margin-top:10px;">
                    <option value="person1" ${v==='person1'?'selected':''}>Patrick</option>
                    <option value="person2" ${v==='person2'?'selected':''}>Sandra</option>
                </select>
            </div>
        ` : ''}
      </div>
    `;
    this._attach();
  }

  _boxUI(obj, label, pr, isS = false, idx = 0) {
    const f = (n) => isS ? n : pr + n;
    const d = isS ? `data-idx="${idx}"` : '';
    return `
      <div class="sec">
        <label>${label} - ENTITÉ / ICÔNE</label>
        <div class="grid" style="grid-template-columns: 2fr 1fr;">
          <input type="text" ${d} data-f="${f('entity')}" value="${obj[f('entity')] || ''}">
          <input type="text" ${d} data-f="${f('icon')}" value="${obj[f('icon')] || ''}" placeholder="mdi:fire">
        </div>
        <div class="grid">
            <div><label>X %</label><input type="number" ${d} data-f="${f('x')}" value="${obj[f('x')] || 50}"></div>
            <div><label>Y %</label><input type="number" ${d} data-f="${f('y')}" value="${obj[f('y')] || 50}"></div>
            <div><label>Taille Texte</label><input type="number" step="0.1" ${d} data-f="${f('ts')}" value="${obj[f('ts')] || 1.6}"></div>
        </div>
        <div class="grid">
            <div><label>Largeur</label><input type="number" ${d} data-f="${f('w')}" value="${obj[f('w')] || 100}"></div>
            <div><label>Arrondi</label><input type="number" ${d} data-f="${f('r')}" value="${obj[f('r')] || 8}"></div>
            <div><label>Couleur</label><input type="color" ${d} data-f="${f('bc')}" value="${obj[f('bc')] || '#ffffff'}"></div>
        </div>
        ${isS ? `<button style="width:100%; background:red; color:white; border:none; padding:5px; margin-top:5px;" onclick="this.getRootNode().host._delS(${idx})">SUPPRIMER</button>` : ''}
      </div>
    `;
  }

  _setTab(t) { this._tab = t; this.render(); }
  _addS() { const p = this._config[this._config.current_view]; if(!p.sensors) p.sensors=[]; p.sensors.push({name:'Nouveau', x:50, y:50, w:100, bw:1, bc:'#ffffff', ts:1.6}); this._fire(); this.render(); }
  _delS(i) { this._config[this._config.current_view].sensors.splice(i,1); this._fire(); this.render(); }
  _attach() {
    this.querySelectorAll('input, select').forEach(el => el.onchange = () => {
      const p = this._config[this._config.current_view];
      const val = el.type === 'checkbox' ? el.checked : el.value;
      if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = val;
      else if(el.id === 'ch') this._config.card_height = val;
      else if(el.id === 'ps') this._config.current_view = val;
      else p[el.dataset.f] = val;
      this._fire();
      if(el.id === 'ps') this.render();
    });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
