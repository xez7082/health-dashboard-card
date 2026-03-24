/**
 * HEALTH DASHBOARD CARD – V3.3.6
 * RETOUR DES ICÔNES + PRÉCISION 2 DÉCIMALES + BULLE OPTIMISÉE
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
    const p = this._config[this._config.current_view];
    
    const setV = (idV, idU, ent) => {
      const elV = this.shadowRoot.getElementById(idV);
      const elU = this.shadowRoot.getElementById(idU);
      if(elV && elU && ent && this._hass.states[ent]) {
        const s = this._hass.states[ent];
        const val = parseFloat(s.state);
        elV.textContent = isNaN(val) ? s.state : val.toFixed(2);
        elU.textContent = " " + (s.attributes.unit_of_measurement || '');
      }
    };
    
    setV('imc-v', 'imc-u', p.imc_entity);
    setV('corp-v', 'corp-u', p.corp_entity);
    if(p.sensors) p.sensors.forEach((s, i) => setV(`s-${i}-v`, `s-${i}-u`, s.entity));

    const stateW = this._hass.states[p.weight_entity];
    if (stateW && p.start && p.ideal) {
        const actuel = parseFloat(stateW.state);
        const start = parseFloat(p.start);
        const ideal = parseFloat(p.ideal);
        const diff = (actuel - start).toFixed(2);
        const pct = Math.max(0, Math.min(100, ((start - actuel) / (start - ideal)) * 100));
        
        const ptr = this.shadowRoot.getElementById('ptr');
        if(ptr) ptr.style.left = pct + '%';
        
        const wVal = this.shadowRoot.getElementById('weight-val');
        if(wVal) wVal.textContent = actuel.toFixed(2) + ' kg';
        
        const dEl = this.shadowRoot.getElementById('diff-val');
        if(dEl) {
          dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
          dEl.style.background = diff < 0 ? '#4caf50' : (diff > 0 ? '#ff5252' : 'rgba(255,255,255,0.2)');
        }
    }
  }

  render() {
    if (!this._config) return;
    const p = this._config[this._config.current_view] || {};
    
    const getStyle = (obj, pr) => {
      const w = obj[pr+'w'] || 110;
      const h = obj[pr+'h'] || 80;
      return `left:${obj[pr+'x']||50}%; top:${obj[pr+'y']||50}%; width:${w}px; height:${h}px; border-radius:${obj[pr+'r']||8}px; border:${obj[pr+'bw']||1}px solid ${obj[pr+'bc']||'#fff'}; transform: translate(-50%, -50%); font-size:${obj[pr+'ts']||1}rem;`;
    };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.25; z-index:1; }
        .box { position: absolute; background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(10px); text-align: center; box-sizing: border-box; padding: 5px; }
        .ico { --mdc-icon-size: 24px; opacity: 0.8; margin-bottom: 4px; color: #fff; }
        .lbl { font-size: 0.65em; opacity: 0.7; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
        .val-wrap { font-weight: 900; line-height: 1; display: flex; align-items: baseline; justify-content: center; width: 100%; }
        .val { font-size: 1.4em; }
        .uni { font-size: 0.8em; opacity: 0.8; }

        .weight-track { position: absolute; left: 10%; width: 80%; height: 16px; background: rgba(255,255,255,0.1); border-radius: 8px; top: ${p.bar_y || 88}%; z-index:20; border: 1px solid rgba(255,255,255,0.2); }
        .ptr { position: absolute; top: -10px; width: 4px; height: 36px; background: #fff; border-radius: 2px; transition: left 1s; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        
        .bub { position: absolute; top: -85px; left: 50%; transform: translateX(-50%); background: ${p.bar_c || '#38bdf8'}; color: #000; padding: 8px 12px; border-radius: 10px; font-weight: 900; text-align: center; box-shadow: 0 6px 20px rgba(0,0,0,0.6); white-space: nowrap; min-width: 90px; }
        #weight-val { display: block; font-size: 14px; margin-bottom: 4px; }
        #diff-val { display: block; font-size: 11px; font-weight: 900; border-radius: 4px; padding: 2px 6px; color: #fff; }
        
        .mkr { position: absolute; top: 24px; transform: translateX(-50%); font-size: 10px; font-weight: bold; opacity: 0.7; text-align: center; line-height: 1.2; width: 60px; }
      </style>

      <div class="main">
        <div class="bg"></div>
        
        <div class="box" style="${getStyle(p, 'imc_')}">
          ${p.imc_icon ? `<ha-icon icon="${p.imc_icon}" class="ico"></ha-icon>` : ''}
          <div class="lbl">${p.imc_name||'IMC'}</div>
          <div class="val-wrap"><span id="imc-v" class="val">--</span><span id="imc-u" class="uni"></span></div>
        </div>

        <div class="box" style="${getStyle(p, 'corp_')}">
          ${p.corp_icon ? `<ha-icon icon="${p.corp_icon}" class="ico"></ha-icon>` : ''}
          <div class="lbl">${p.corp_name||'CORP'}</div>
          <div class="val-wrap"><span id="corp-v" class="val">--</span><span id="corp-u" class="uni"></span></div>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.h}px; border-radius:${s.r||8}px; border:${s.bw||1}px solid ${s.bc||'#fff'}; transform: translate(-50%, -50%); font-size:${s.ts||1}rem;">
            ${s.icon ? `<ha-icon icon="${s.icon}" class="ico"></ha-icon>` : ''}
            <div class="lbl">${s.name}</div>
            <div class="val-wrap"><span id="s-${i}-v" class="val">--</span><span id="s-${i}-u" class="uni"></span></div>
          </div>`).join('')}

        <div class="weight-track">
            <div class="mkr" style="left:0">DÉPART<br>${p.start||'-'}</div>
            <div class="mkr" style="left:50%">CONFORT<br>${p.confort||'-'}</div>
            <div class="mkr" style="left:100%">IDÉAL<br>${p.ideal||'-'}</div>
            <div id="ptr" class="ptr">
                <div class="bub">
                    <span id="weight-val">--</span>
                    <span id="diff-val">--</span>
                </div>
            </div>
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
        .tab { flex: 1; padding: 10px; background: #333; cursor: pointer; text-align:center; border-radius: 4px; font-size: 11px; border:none; color:white; font-weight:bold; }
        .active { background: #38bdf8 !important; color: black !important; }
        .sec { background: #252525; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input, select { width: 100%; padding: 8px; background: #111; color: white; border: 1px solid #444; border-radius: 4px; box-sizing: border-box; margin-bottom: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
      </style>
      <div class="ed">
        <div class="tabs">
            ${['poids', 'sante', 'sensors', 'design'].map(t => `<button class="tab ${this._tab===t?'active':''}" data-t="${t}">${t.toUpperCase()}</button>`).join('')}
        </div>
        ${this._tab === 'poids' ? `
            <div class="sec">
                <label>Entité Poids</label><input type="text" data-f="weight_entity" value="${p.weight_entity||''}">
                <div class="grid">
                    <div><label>Départ</label><input type="number" step="0.01" data-f="start" value="${p.start}"></div>
                    <div><label>Confort</label><input type="number" step="0.01" data-f="confort" value="${p.confort}"></div>
                    <div><label>Idéal</label><input type="number" step="0.01" data-f="ideal" value="${p.ideal}"></div>
                </div>
                <div class="grid">
                    <div><label>Pos Y %</label><input type="number" data-f="bar_y" value="${p.bar_y||88}"></div>
                    <div><label>Couleur Bulle</label><input type="color" data-f="bar_c" value="${p.bar_c||'#38bdf8'}"></div>
                </div>
            </div>` : ''}
        ${this._tab === 'sante' ? this._boxUI(p, 'IMC', 'imc_') + this._boxUI(p, 'CORPULENCE', 'corp_') : ''}
        ${this._tab === 'sensors' ? (p.sensors || []).map((s, i) => this._boxUI(s, `Sensor ${i+1}`, '', true, i)).join('') + '<button class="tab active" style="width:100%" id="add-s">+ AJOUTER SENSOR</button>' : ''}
        ${this._tab === 'design' ? `<div class="sec"><label>Fond (URL)</label><input type="text" data-f="image" value="${p.image||''}">
            <label>Hauteur Carte</label><input type="number" id="ch" value="${this._config.card_height||600}">
            <label>Vue Active</label><select id="ps"><option value="person1" ${v==='person1'?'selected':''}>Patrick</option><option value="person2" ${v==='person2'?'selected':''}>Sandra</option></select></div>` : ''}
      </div>
    `;
    this._attach();
  }

  _boxUI(obj, label, pr, isS = false, idx = 0) {
    const f = (n) => isS ? n : pr + n;
    const d = isS ? `data-idx="${idx}"` : '';
    return `<div class="sec">
        <label>${label}</label>
        <input type="text" ${d} data-f="${f('name')}" value="${obj[f('name')]||''}" placeholder="Nom">
        <div class="grid" style="grid-template-columns: 2fr 1fr;">
            <input type="text" ${d} data-f="${f('entity')}" value="${obj[f('entity')]||''}" placeholder="sensor.xxx">
            <input type="text" ${d} data-f="${f('icon')}" value="${obj[f('icon')]||''}" placeholder="mdi:icon">
        </div>
        <div class="grid">
            <div><label>X %</label><input type="number" ${d} data-f="${f('x')}" value="${obj[f('x')]||50}"></div>
            <div><label>Y %</label><input type="number" ${d} data-f="${f('y')}" value="${obj[f('y')]||50}"></div>
            <div><label>Taille (rem)</label><input type="number" step="0.1" ${d} data-f="${f('ts')}" value="${obj[f('ts')]||1}"></div>
        </div>
        <div class="grid">
            <div><label>W / H</label><input type="number" ${d} data-f="${f('w')}" value="${obj[f('w')]||110}"><input type="number" ${d} data-f="${f('h')}" value="${obj[f('h')]||80}"></div>
            <div><label>Bord / R</label><input type="number" ${d} data-f="${f('bw')}" value="${obj[f('bw')]||1}"><input type="number" ${d} data-f="${f('r')}" value="${obj[f('r')]||8}"></div>
            <div><label>Couleur</label><input type="color" ${d} data-f="${f('bc')}" value="${obj[f('bc')]||'#ffffff'}"></div>
        </div>
        ${isS?`<button style="width:100%;background:#ff5252;border:none;color:white;padding:5px;margin-top:5px;cursor:pointer;border-radius:4px;" class="del-s" data-idx="${idx}">SUPPRIMER</button>`:''}
    </div>`;
  }

  _attach() {
    this.querySelectorAll('.tab').forEach(btn => btn.onclick = () => { this._tab = btn.dataset.t; this.render(); });
    this.querySelectorAll('input, select').forEach(el => el.onchange = () => {
        const p = this._config[this._config.current_view];
        if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = el.value;
        else if(el.id === 'ch') this._config.card_height = el.value;
        else if(el.id === 'ps') this._config.current_view = el.value;
        else p[el.dataset.f] = el.value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
        if(el.id === 'ps') this.render();
    });
    const add = this.querySelector('#add-s'); if(add) add.onclick = () => { const p = this._config[this._config.current_view]; if(!p.sensors) p.sensors = []; p.sensors.push({name:'Nouveau', x:50, y:50, w:110, h:80, bc:'#ffffff', ts:1}); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); };
    this.querySelectorAll('.del-s').forEach(btn => btn.onclick = () => { this._config[this._config.current_view].sensors.splice(btn.dataset.idx, 1); this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); this.render(); });
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
