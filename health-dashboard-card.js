/**
 * HEALTH DASHBOARD CARD – V3.4.2
 * GESTION PAR ZONES THÉMATIQUES ET SENSORS APPROPRIÉS
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

  _setView(view) {
    this._config.current_view = view;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    this.render();
  }

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
        this.shadowRoot.getElementById('weight-val').textContent = actuel.toFixed(2) + ' kg';
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
    const cv = this._config.current_view;
    
    const getBoxStyle = (s) => `left:${s.x}%; top:${s.y}%; width:${s.w||110}px; height:${s.h||80}px; border-radius:15px; border:1px solid ${s.bc||'rgba(255,255,255,0.1)'}; transform: translate(-50%, -50%);`;

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 750}px; background: #0f172a; border-radius: 24px; overflow: hidden; font-family: 'Segoe UI', system-ui, sans-serif; color: white; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.15; z-index:1; }
        
        .sw-btns { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 100; }
        .sw-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px 20px; border-radius: 14px; font-size: 11px; font-weight: 800; cursor: pointer; backdrop-filter: blur(15px); transition: 0.3s; }
        .sw-btn.active { background: #38bdf8; color: #000; box-shadow: 0 0 20px rgba(56, 189, 248, 0.3); }

        .section-header { position: absolute; left: 25px; display: flex; align-items: center; gap: 10px; z-index: 5; }
        .section-header span { font-size: 11px; font-weight: 900; letter-spacing: 2px; color: #38bdf8; text-transform: uppercase; }
        .section-line { height: 1px; flex-grow: 1; background: linear-gradient(90deg, #38bdf8, transparent); width: 100px; }

        .box { position: absolute; background: rgba(30, 41, 59, 0.6); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(10px); text-align: center; box-sizing: border-box; padding: 10px; border: 1px solid rgba(255,255,255,0.1); transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .box:hover { background: rgba(56, 189, 248, 0.1); border-color: #38bdf8; transform: translate(-50%, -55%) scale(1.05); }
        
        .ico { --mdc-icon-size: 28px; color: #38bdf8; margin-bottom: 5px; filter: drop-shadow(0 0 5px rgba(56, 189, 248, 0.5)); }
        .lbl { font-size: 0.7em; opacity: 0.5; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
        .val-wrap { font-weight: 800; line-height: 1; display: flex; align-items: baseline; justify-content: center; }
        .val { font-size: 1.5em; color: #fff; }
        .uni { font-size: 0.8em; opacity: 0.4; margin-left: 3px; }

        .weight-area { position: absolute; bottom: 40px; left: 5%; width: 90%; z-index: 20; background: rgba(255,255,255,0.03); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); box-sizing: border-box; }
        .weight-track { position: relative; width: 100%; height: 12px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 50px; }
        .ptr { position: absolute; top: -10px; width: 6px; height: 32px; background: #fff; border-radius: 3px; transition: left 1s cubic-bezier(0.17, 0.67, 0.83, 0.67); }
        .bub { position: absolute; top: -85px; left: 50%; transform: translateX(-50%); background: #38bdf8; color: #000; padding: 10px 18px; border-radius: 15px; font-weight: 900; box-shadow: 0 10px 25px rgba(0,0,0,0.4); min-width: 100px; }
        #weight-val { display: block; font-size: 16px; margin-bottom: 4px; }
        #diff-val { display: block; font-size: 11px; border-radius: 5px; padding: 2px 8px; color: #fff; font-weight: 800; }
        .mkr { position: absolute; top: 20px; transform: translateX(-50%); font-size: 9px; font-weight: bold; opacity: 0.4; text-align: center; }
      </style>

      <div class="main">
        <div class="bg"></div>

        <div class="sw-btns">
            <button class="sw-btn ${cv==='person1'?'active':''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv==='person2'?'active':''}" id="btn-p2">SANDRA</button>
        </div>

        <div class="section-header" style="top: 90px;"><span>⚡ ÉTAT DE FORME</span><div class="section-line"></div></div>
        <div class="section-header" style="top: 280px;"><span>🌙 SOMMEIL</span><div class="section-line"></div></div>
        <div class="section-header" style="top: 470px;"><span>🏥 SANTÉ</span><div class="section-line"></div></div>

        <div class="box" style="left:30%; top:540px; width:120px; height:90px; border-radius:18px; transform: translate(-50%, -50%);">
          <ha-icon icon="mdi:human-measure" class="ico"></ha-icon>
          <div class="lbl">IMC</div>
          <div class="val-wrap"><span id="imc-v" class="val">--</span><span id="imc-u" class="uni"></span></div>
        </div>
        <div class="box" style="left:70%; top:540px; width:120px; height:90px; border-radius:18px; transform: translate(-50%, -50%);">
          <ha-icon icon="mdi:body-proportions" class="ico"></ha-icon>
          <div class="lbl">CORP.</div>
          <div class="val-wrap"><span id="corp-v" class="val">--</span><span id="corp-u" class="uni"></span></div>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="${getBoxStyle(s)}">
            ${s.icon ? `<ha-icon icon="${s.icon}" class="ico"></ha-icon>` : ''}
            <div class="lbl">${s.name}</div>
            <div class="val-wrap"><span id="s-${i}-v" class="val">--</span><span id="s-${i}-u" class="uni"></span></div>
          </div>`).join('')}

        <div class="weight-area">
            <div class="weight-track">
                <div class="mkr" style="left:0">START<br>${p.start||'-'}</div>
                <div class="mkr" style="left:50%">CONFORT<br>${p.confort||'-'}</div>
                <div class="mkr" style="left:100%">GOAL<br>${p.ideal||'-'}</div>
                <div id="ptr" class="ptr"><div class="bub"><span id="weight-val">--</span><span id="diff-val">--</span></div></div>
            </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('btn-p1').onclick = () => this._setView('person1');
    this.shadowRoot.getElementById('btn-p2').onclick = () => this._setView('person2');
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
        .ed { padding: 20px; background: #111; color: #eee; font-family: system-ui; border-radius: 12px; }
        .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
        .tab { flex: 1; padding: 12px; background: #222; cursor: pointer; text-align:center; border-radius: 8px; font-size: 11px; border:none; color:#aaa; font-weight:bold; transition: 0.2s; }
        .active { background: #38bdf8 !important; color: #000 !important; }
        .sec { background: #1a1a1a; padding: 18px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #333; }
        label { color: #38bdf8; font-size: 11px; font-weight: bold; display: block; margin-top: 12px; text-transform: uppercase; letter-spacing: 1px; }
        input, select { width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #333; border-radius: 8px; margin-top: 6px; font-size: 13px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
      </style>
      <div class="ed">
        <div class="tabs">
            ${['poids', 'sante', 'sensors', 'design'].map(t => `<button class="tab ${this._tab===t?'active':''}" data-t="${t}">${t.toUpperCase()}</button>`).join('')}
        </div>
        ${this._tab === 'poids' ? `
            <div class="sec">
                <label>Capteur Poids (kg)</label><input type="text" data-f="weight_entity" value="${p.weight_entity||''}">
                <div class="grid">
                    <div><label>Départ</label><input type="number" step="0.1" data-f="start" value="${p.start}"></div>
                    <div><label>Confort</label><input type="number" step="0.1" data-f="confort" value="${p.confort}"></div>
                    <div><label>Objectif</label><input type="number" step="0.1" data-f="ideal" value="${p.ideal}"></div>
                </div>
            </div>` : ''}
        ${this._tab === 'sante' ? this._boxUI(p, 'IMC', 'imc_') + this._boxUI(p, 'CORPULENCE', 'corp_') : ''}
        ${this._tab === 'sensors' ? (p.sensors || []).map((s, i) => `
            <div class="sec">
                <label>Sensor ${i+1}</label>
                <div class="grid" style="grid-template-columns: 2fr 1fr;">
                    <input type="text" data-idx="${i}" data-f="name" value="${s.name}" placeholder="Nom">
                    <input type="text" data-idx="${i}" data-f="icon" value="${s.icon}" placeholder="mdi:icon">
                </div>
                <input type="text" data-idx="${i}" data-f="entity" value="${s.entity}" placeholder="sensor.xxx">
                <div class="grid">
                    <div><label>X % (0-100)</label><input type="number" data-idx="${i}" data-f="x" value="${s.x}"></div>
                    <div><label>Y % (0-100)</label><input type="number" data-idx="${i}" data-f="y" value="${s.y}"></div>
                    <div><label>Taille W</label><input type="number" data-idx="${i}" data-f="w" value="${s.w||110}"></div>
                </div>
                <button style="width:100%;background:#ff5252;border:none;color:white;padding:8px;margin-top:10px;cursor:pointer;border-radius:6px;" class="del-s" data-idx="${i}">SUPPRIMER</button>
            </div>`).join('') + '<button class="tab active" style="width:100%" id="add-s">+ AJOUTER SENSOR</button>' : ''}
        ${this._tab === 'design' ? `<div class="sec"><label>Image Fond</label><input type="text" data-f="image" value="${p.image||''}">
            <label>Hauteur Totale</label><input type="number" id="ch" value="${this._config.card_height||750}"></div>` : ''}
      </div>
    `;
    this._attach();
  }

  _boxUI(obj, label, pr) {
    return `<div class="sec"><label>${label}</label>
        <input type="text" data-f="${pr+'entity'}" value="${obj[pr+'entity']||''}" placeholder="sensor.xxx">
        <input type="text" data-f="${pr+'icon'}" value="${obj[pr+'icon']||''}" placeholder="mdi:icon">
    </div>`;
  }

  _attach() {
    this.querySelectorAll('.tab').forEach(btn => btn.onclick = () => { this._tab = btn.dataset.t; this.render(); });
    this.querySelectorAll('input, select').forEach(el => el.onchange = () => {
        const p = this._config[this._config.current_view];
        if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = el.value;
        else if(el.id === 'ch') this._config.card_height = el.value;
        else p[el.dataset.f] = el.value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
    });
    const add = this.querySelector('#add-s'); if(add) add.onclick = () => { 
        const p = this._config[this._config.current_view]; 
        if(!p.sensors) p.sensors = []; 
        p.sensors.push({name:'Nouveau', x:50, y:150, w:110, h:80, icon:'mdi:heart'}); 
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); 
        this.render(); 
    };
    this.querySelectorAll('.del-s').forEach(btn => btn.onclick = () => { 
        this._config[this._config.current_view].sensors.splice(btn.dataset.idx, 1); 
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); 
        this.render(); 
    });
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
