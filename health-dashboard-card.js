/**
 * HEALTH DASHBOARD CARD – V71.5
 * Ajout des labels Poids Idéal et Départ sur la barre + Éditeur complet.
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  _num(val, defaultVal = 0) {
    const n = parseFloat(val);
    return isNaN(n) ? defaultVal : n;
  }

  updateSensors() {
    if (!this._hass || !this.shadowRoot) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    if (!pData || !pData.sensors) return;

    const suffix = (view === 'person2') ? '_sandra' : '_patrick';
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    if (stPoids && progPointer) {
        const actuel = this._num(stPoids.state);
        const depart = this._num(pData.start);
        const ideal = this._num(pData.ideal);
        const range = depart - ideal;
        let pct = range !== 0 ? ((depart - actuel) / range) * 100 : 0;
        progPointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        progPointer.setAttribute('data-val', `${actuel} kg`);
    }

    pData.sensors.forEach((s, i) => {
        const valEl = this.shadowRoot.getElementById(`value-${i}`);
        const stateObj = this._hass.states[s.entity];
        if (valEl && stateObj) {
            valEl.textContent = `${stateObj.state}${stateObj.attributes.unit_of_measurement || ''}`;
        }
    });
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view] || { sensors: [] };
    const accentColor = pData.accent_color || (view === 'person1' ? '#2196f3' : '#e91e63');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._num(this._config.card_height, 600)}px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._num(this._config.img_offset)}%; background-size: cover; opacity: 0.45; z-index: 1; background-image: url('${pData.image || ''}'); }
        .topbar { position: absolute; top: 25px; width: 100%; display: flex; justify-content: center; gap: 15px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 30px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; font-weight: bold; backdrop-filter: blur(8px); transition: 0.3s; }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; box-shadow: 0 0 20px ${accentColor}66; }
        
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 88%; height: 75px; z-index: 30; background: rgba(15, 23, 42, 0.75); border-radius: 16px; padding: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 30px; }
        
        .limit-label { position: absolute; top: 18px; font-size: 10px; font-weight: bold; line-height: 1.1; }
        .start-label { left: 0; color: #f87171; }
        .ideal-label { right: 0; color: #4ade80; text-align: right; }

        .prog-pointer { position: absolute; top: -14px; width: 4px; height: 36px; background: ${accentColor}; border-radius: 2px; transition: left 1s ease; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -28px; left: 50%; transform: translateX(-50%); background: ${accentColor}; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: bold; color: #000; white-space: nowrap; }

        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 16px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 5px; backdrop-filter: blur(12px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        ha-icon { --mdc-icon-size: 24px; color: ${accentColor}; }
        .val-text { font-weight: 900; font-size: 15px; }
        .label-text { font-size: 9px; color: #94a3b8; text-transform: uppercase; text-align: center; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'Patrick'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'Sandra'}</button>
        </div>
        <div class="bg-img"></div>
        
        <div class="rule-container">
            <div class="rule-track">
                <div class="limit-label start-label">DÉPART<br>${this._num(pData.start)} kg</div>
                <div class="limit-label ideal-label">IDÉAL<br>${this._num(pData.ideal)} kg</div>
                <div id="progression-pointer" class="prog-pointer" data-val="--"></div>
            </div>
        </div>

        ${(pData.sensors || []).map((s, i) => {
            const isIMC = s.name && (s.name.toUpperCase() === 'IMC' || s.name.toUpperCase() === 'CORPULENCE');
            const w = isIMC ? this._num(this._config.imc_width, 250) : this._num(this._config.b_width, 160);
            const h = isIMC ? this._num(this._config.imc_height, 97) : this._num(this._config.b_height, 69);
            return `
            <div class="sensor" style="left:${this._num(s.x)}%; top:${this._num(s.y)}%; width:${w}px; height:${h}px;">
              <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
              <div class="label-text">${s.name}</div>
              <div id="value-${i}" class="val-text">--</div>
            </div>`;
        }).join('')}
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
    this.updateSensors();
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) { 
    this._config = config; 
    if (this._selIdx === undefined) this._selIdx = 0;
    this.render(); 
  }

  render() {
    if (!this._config) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey] || { sensors: [] };
    const sensors = p.sensors || [];
    const s = sensors[this._selIdx] || {};

    this.innerHTML = `
      <style>
        .master-ed { font-family: sans-serif; color: #e1e1e1; }
        .card-box { background: #2c2c2e; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #38bdf8; }
        .title { font-weight: bold; font-size: 11px; color: #38bdf8; text-transform: uppercase; margin-bottom: 10px; }
        label { font-size: 10px; color: #8e8e93; display: block; margin-top: 6px; }
        input, select { width: 100%; padding: 6px; background: #1c1c1e; color: white; border: 1px solid #444; border-radius: 4px; margin-top: 2px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      </style>
      <div class="master-ed">
        <div class="card-box" style="border-left-color: #f13ba6;">
            <div class="title">👤 Profil & Carte</div>
            <div class="row">
                <div><label>Profil actif</label><select id="ed-view"><option value="person1" ${pKey==='person1'?'selected':''}>Patrick</option><option value="person2" ${pKey==='person2'?'selected':''}>Sandra</option></select></div>
                <div><label>Hauteur Carte</label><input type="number" id="ed-h" value="${this._config.card_height || 600}"></div>
            </div>
            <label>Image URL</label><input type="text" id="ed-img" value="${p.image || ''}">
        </div>

        <div class="card-box">
            <div class="title">📍 Capteur : ${s.name || 'Sélectionner'}</div>
            <select id="sel-sensor">
                ${sensors.map((item, idx) => `<option value="${idx}" ${this._selIdx == idx ? 'selected' : ''}>${item.name || 'Capteur '+idx}</option>`).join('')}
            </select>
            <div class="row">
                <div><label>Position X (%)</label><input type="number" id="s-x" value="${parseFloat(s.x) || 0}"></div>
                <div><label>Position Y (%)</label><input type="number" id="s-y" value="${parseFloat(s.y) || 0}"></div>
            </div>
            <div class="row">
                <div><label>Nom</label><input type="text" id="s-name" value="${s.name || ''}"></div>
                <div><label>Icône</label><input type="text" id="s-icon" value="${s.icon || ''}"></div>
            </div>
        </div>

        <div class="card-box" style="border-left-color: #4ade80;">
            <div class="title">📏 Tailles des Bulles (px)</div>
            <div class="row">
                <div><label>Standard L</label><input type="number" id="ed-bw" value="${this._config.b_width || 160}"></div>
                <div><label>Standard H</label><input type="number" id="ed-bh" value="${this._config.b_height || 69}"></div>
            </div>
            <div class="row">
                <div><label>IMC Largeur</label><input type="number" id="ed-imcw" value="${this._config.imc_width || 250}"></div>
                <div><label>IMC Hauteur</label><input type="number" id="ed-imch" value="${this._config.imc_height || 97}"></div>
            </div>
        </div>

        <div class="card-box" style="border-left-color: #ff9f43;">
            <div class="title">⚖️ Poids & Règle</div>
            <div class="row">
                <div><label>Poids Départ</label><input type="number" id="ed-start" value="${p.start || 0}"></div>
                <div><label>Poids Idéal</label><input type="number" id="ed-ideal" value="${p.ideal || 0}"></div>
            </div>
        </div>
      </div>
    `;

    this.querySelector('#ed-view').onchange = (e) => this._upG('current_view', e.target.value);
    this.querySelector('#ed-h').onchange = (e) => this._upG('card_height', e.target.value);
    this.querySelector('#ed-bw').onchange = (e) => this._upG('b_width', e.target.value);
    this.querySelector('#ed-bh').onchange = (e) => this._upG('b_height', e.target.value);
    this.querySelector('#ed-imcw').onchange = (e) => this._upG('imc_width', e.target.value);
    this.querySelector('#ed-imch').onchange = (e) => this._upG('imc_height', e.target.value);
    this.querySelector('#ed-img').onchange = (e) => this._upL('image', e.target.value);
    this.querySelector('#ed-start').onchange = (e) => this._upL('start', e.target.value);
    this.querySelector('#ed-ideal').onchange = (e) => this._upL('ideal', e.target.value);
    this.querySelector('#sel-sensor').onchange = (e) => { this._selIdx = e.target.value; this.render(); };
    this.querySelector('#s-x').onchange = (e) => this._upS('x', e.target.value);
    this.querySelector('#s-y').onchange = (e) => this._upS('y', e.target.value);
    this.querySelector('#s-name').onchange = (e) => this._upS('name', e.target.value);
    this.querySelector('#s-icon').onchange = (e) => this._upS('icon', e.target.value);
  }

  _upG(f, v) { const nc = JSON.parse(JSON.stringify(this._config)); nc[f] = v; this._fire(nc); }
  _upL(f, v) { const nc = JSON.parse(JSON.stringify(this._config)); nc[nc.current_view][f] = v; this._fire(nc); }
  _upS(f, v) { const nc = JSON.parse(JSON.stringify(this._config)); nc[nc.current_view].sensors[this._selIdx][f] = v; this._fire(nc); }
  _fire(nc) { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: nc }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V71.5", preview: true });
