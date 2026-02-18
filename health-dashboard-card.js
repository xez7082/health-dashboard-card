/**
 * HEALTH DASHBOARD CARD – V2.0.1
 * Réglages individuels Taille (L/H) et Texte pour IMC/Corpulence.
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config || {}));
    const base = { 
        name: "Prénom", sensors: [], start: 80, goal: 75, ideal: 70, image: "", step_goal: 10000,
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:calculator-variant", imc_x: 20, imc_y: 20, imc_w: 160, imc_h: 69, imc_font: 14,
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-biceps", corp_x: 20, corp_y: 35, corp_w: 160, corp_h: 69, corp_font: 14
    };
    if (!this._config.person1) this._config.person1 = { ...base, name: "Patrick" };
    if (!this._config.person2) this._config.person2 = { ...base, name: "Sandra" };
    if (!this._config.current_view) this._config.current_view = 'person1';
    
    this._config.card_height = this._config.card_height || 600;
    this._config.b_width = this._config.b_width || 160;
    this._config.b_height = this._config.b_height || 69;
    
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
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    const updateVal = (id, entity) => {
        const el = this.shadowRoot.getElementById(id);
        if (el && entity && this._hass.states[entity]) {
            const st = this._hass.states[entity];
            el.textContent = `${st.state} ${st.attributes.unit_of_measurement || ''}`;
        }
    };
    updateVal('imc-val', pData.imc_entity);
    updateVal('corp-val', pData.corp_entity);

    // Poids et Pas (logique standard)
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const pct = range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0;
        const pointer = this.shadowRoot.getElementById('progression-pointer');
        if(pointer) pointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        const label = this.shadowRoot.getElementById('pointer-label');
        if(label) label.textContent = `${actuel} kg`;
    }
  }

  render() {
    const view = this._config.current_view;
    const pData = this._config[view];
    const accentColor = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._config.img_offset || 50}%; background-size: cover; opacity: 0.4; z-index: 1; pointer-events: none; background-image: url('${pData.image}'); }
        .topbar { position: absolute; left: 5%; top: 3%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 11px; font-weight: bold; }
        .btn.active { background: ${accentColor} !important; }
        
        .sensor-card { position: absolute; transform: translate(-50%, -50%); border-radius: 8px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 5px; backdrop-filter: blur(5px); }
        ha-icon { --mdc-icon-size: 24px; color: ${accentColor}; }
        
        .rule-container { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 85%; height: 75px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 10px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 5px; margin-top: 30px; }
        .prog-pointer { position: absolute; top: -12px; width: 3px; height: 34px; background: white; transition: left 1s ease; }
      </style>
      <div class="main-container">
        <div class="topbar">
            <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
            <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="bg-img"></div>

        ${pData.imc_entity ? `
        <div class="sensor-card" style="left:${pData.imc_x}%; top:${pData.imc_y}%; width:${pData.imc_w || 160}px; height:${pData.imc_h || 69}px;">
            <ha-icon icon="${pData.imc_icon}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${pData.imc_name}</div>
            <div id="imc-val" style="font-weight:900; font-size:${pData.imc_font || 14}px;">--</div>
        </div>` : ''}

        ${pData.corp_entity ? `
        <div class="sensor-card" style="left:${pData.corp_x}%; top:${pData.corp_y}%; width:${pData.corp_w || 160}px; height:${pData.corp_h || 69}px;">
            <ha-icon icon="${pData.corp_icon}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${pData.corp_name}</div>
            <div id="corp-val" style="font-weight:900; font-size:${pData.corp_font || 14}px;">--</div>
        </div>` : ''}

        <div class="rule-container">
            <div class="rule-track">
                <div id="progression-pointer" class="prog-pointer"><div id="pointer-label" style="position:absolute; top:-25px; left:50%; transform:translateX(-50%); background:white; color:black; padding:2px 5px; border-radius:4px; font-size:12px; font-weight:bold; white-space:nowrap;">--</div></div>
            </div>
        </div>
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._activeTab = 'profile'; }
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config || {})); this.render(); }

  render() {
    if (!this._hass) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <style>
        .ed-box { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 10px; border-bottom: 1px solid #444; }
        .tab { padding: 8px; cursor: pointer; background: #252525; border: none; color: #888; flex: 1; font-size: 11px; }
        .tab.active { background: #38bdf8; color: black; font-weight: bold; }
        .section { background: #252525; padding: 15px; border: 1px solid #444; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 10px; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sub-sec { background: #111; padding: 10px; border-radius: 5px; margin-bottom: 15px; border-left: 2px solid #38bdf8; }
      </style>
      <div class="ed-box">
        <div class="tabs">
            <button class="tab ${this._activeTab === 'profile' ? 'active' : ''}" id="tab-profile">PROFIL</button>
            <button class="tab ${this._activeTab === 'health' ? 'active' : ''}" id="tab-health">SANTÉ</button>
            <button class="tab ${this._activeTab === 'design' ? 'active' : ''}" id="tab-design">DESIGN</button>
        </div>
        <div class="section">
            ${this._activeTab === 'health' ? `
                <div class="sub-sec">
                    <label>MODULE IMC</label>
                    <input type="text" id="inp-imce" placeholder="Entité" value="${p.imc_entity || ''}">
                    <div class="grid">
                        <div><label>LARGEUR (PX)</label><input type="number" id="inp-imcw" value="${p.imc_w || 160}"></div>
                        <div><label>HAUTEUR (PX)</label><input type="number" id="inp-imch" value="${p.imc_h || 69}"></div>
                    </div>
                    <div class="grid">
                        <div><label>TAILLE TEXTE (PX)</label><input type="number" id="inp-imcf" value="${p.imc_font || 14}"></div>
                        <div><label>POS X %</label><input type="number" id="inp-imcx" value="${p.imc_x || 20}"></div>
                    </div>
                </div>
                <div class="sub-sec">
                    <label>MODULE CORPULENCE</label>
                    <input type="text" id="inp-corpe" placeholder="Entité" value="${p.corp_entity || ''}">
                    <div class="grid">
                        <div><label>LARGEUR (PX)</label><input type="number" id="inp-corpw" value="${p.corp_w || 160}"></div>
                        <div><label>HAUTEUR (PX)</label><input type="number" id="inp-corph" value="${p.corp_h || 69}"></div>
                    </div>
                    <div class="grid">
                        <div><label>TAILLE TEXTE (PX)</label><input type="number" id="inp-corpf" value="${p.corp_font || 14}"></div>
                        <div><label>POS X %</label><input type="number" id="inp-corpx" value="${p.corp_x || 20}"></div>
                    </div>
                </div>
            ` : ''}
            </div>
      </div>
    `;

    this._attachEvents(pKey);
  }

  _attachEvents(pKey) {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._activeTab = t.id.replace('tab-',''); this.render(); });
    const bind = (id, field) => {
        const el = this.querySelector(id);
        if(el) el.onchange = (e) => { this._config[pKey][field] = e.target.value; this._fire(); };
    };
    if(this._activeTab === 'health') {
        bind('#inp-imce', 'imc_entity'); bind('#inp-imcw', 'imc_w'); bind('#inp-imch', 'imc_h'); bind('#inp-imcf', 'imc_font'); bind('#inp-imcx', 'imc_x');
        bind('#inp-corpe', 'corp_entity'); bind('#inp-corpw', 'corp_w'); bind('#inp-corph', 'corp_h'); bind('#inp-corpf', 'corp_font'); bind('#inp-corpx', 'corp_x');
    }
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.0.1" });
