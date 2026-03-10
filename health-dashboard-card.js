/**
 * HEALTH DASHBOARD CARD – V2.2.8
 * AJOUTS : RÉGLAGE HAUTEUR INDÉPENDANT + BORDURES PERSONNALISÉES
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  static getStubConfig() {
    return {
      type: "custom:health-dashboard-card",
      card_height: 600, card_round: 12,
      person1: {
        name: "Patrick", start: 85, comfort: 78, ideal: 72, image: "", sensors: [],
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 20, imc_y: 20, imc_w: 120, imc_h: 80, imc_circle: false, imc_b_w: 1, imc_b_c: "rgba(255,255,255,0.2)",
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 20, corp_y: 35, corp_w: 120, corp_h: 80, corp_circle: false, corp_b_w: 1, corp_b_c: "rgba(255,255,255,0.2)"
      },
      person2: { name: "Sandra", start: 70, comfort: 65, ideal: 60, sensors: [] }
    };
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  _num(val, d = 0) { const n = parseFloat(val); return isNaN(n) ? d : n; }

  updateSensors() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view || 'person1';
    const pData = this._config[view];
    if (!pData) return;
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const label = this.shadowRoot.getElementById('pointer-label');
        if(label) label.textContent = actuel + 'kg';
        const pct = range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0;
        const ptr = this.shadowRoot.getElementById('progression-pointer');
        if(ptr) ptr.style.left = `${Math.max(0, Math.min(100, pct))}%`;
    }

    const setV = (id, ent) => {
        const el = this.shadowRoot.getElementById(id);
        if (el && ent && this._hass.states[ent]) {
            const s = this._hass.states[ent];
            el.textContent = `${s.state}${s.attributes.unit_of_measurement || ''}`;
        }
    };
    setV('imc-val', pData.imc_entity);
    setV('corp-val', pData.corp_entity);

    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const vE = this.shadowRoot.getElementById(`value-${i}`);
            const st = this._hass.states[s.entity];
            if (vE && st) vE.textContent = `${st.state}${st.attributes.unit_of_measurement || ''}`;
        });
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view || 'person1';
    const pData = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';
    const round = this._config.card_round || 12;

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${round}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center 50%; background-size: cover; opacity: 0.4; z-index: 1; background-image: url('${pData.image}'); }
        .topbar { position: absolute; left: 5%; top: 3%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; font-weight: bold; }
        .btn.active { background: ${accent} !important; color: black; border-color: ${accent}; }
        
        .sensor-card { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(8px); text-align: center; overflow: hidden; }
        ha-icon { --mdc-icon-size: 26px; color: ${accent}; margin-bottom: 2px; }
        
        .rule-container { position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%); width: 90%; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; }
        .rule-fill { position: absolute; height: 100%; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 4px; width: 100%; opacity: 0.7; }
        .prog-pointer { position: absolute; top: -14px; width: 3px; height: 36px; background: white; transition: left 1s ease; box-shadow: 0 0 12px white; }
        .pointer-bubble { position: absolute; top: -42px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 900; border: 2px solid ${accent}; }
      </style>

      <div class="main-container">
        <div class="topbar">
            <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
            <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="bg-img"></div>

        <div class="sensor-card" style="left:${pData.imc_x}%; top:${pData.imc_y}%; width:${pData.imc_w}px; height:${pData.imc_circle ? pData.imc_w : pData.imc_h}px; border-radius:${pData.imc_circle ? '50%' : round + 'px'}; border: ${pData.imc_b_w || 0}px solid ${pData.imc_b_c || 'transparent'};">
            <ha-icon icon="${pData.imc_icon}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${pData.imc_name}</div>
            <div id="imc-val" style="font-weight:900;">--</div>
        </div>

        <div class="sensor-card" style="left:${pData.corp_x}%; top:${pData.corp_y}%; width:${pData.corp_w}px; height:${pData.corp_circle ? pData.corp_w : pData.corp_h}px; border-radius:${pData.corp_circle ? '50%' : round + 'px'}; border: ${pData.corp_b_w || 0}px solid ${pData.corp_b_c || 'transparent'};">
            <ha-icon icon="${pData.corp_icon}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${pData.corp_name}</div>
            <div id="corp-val" style="font-weight:900;">--</div>
        </div>

        ${(pData.sensors || []).map((s, i) => `
          <div class="sensor-card" style="left:${s.x}%; top:${s.y}%; width:${s.w || 100}px; height:${s.circle ? s.w : (s.h || 70)}px; border-radius:${s.circle ? '50%' : round + 'px'}; border: ${s.b_w || 0}px solid ${s.b_c || 'transparent'};">
            <ha-icon icon="${s.icon}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${s.name}</div>
            <div id="value-${i}" style="font-weight:900;">--</div>
          </div>
        `).join('')}

        <div class="rule-container">
            <div class="rule-track">
                <div class="rule-fill"></div>
                <div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-bubble">--</div></div>
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
  constructor() { super(); this._activeTab = 'health'; }
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = config; this.render(); }

  render() {
    if (!this._hass || !this._config) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <style>
        .ed-box { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid #444; }
        .tab { padding: 10px; cursor: pointer; background: #252525; border: none; color: #888; flex: 1; font-size: 11px; }
        .tab.active { background: #38bdf8; color: black; font-weight: bold; }
        .section { background: #252525; padding: 15px; border: 1px solid #444; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .sub-sec { background: #111; padding: 10px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #38bdf8; }
        .check { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
        .check input { width: auto; }
      </style>
      <div class="ed-box">
        <div class="tabs">
            <button class="tab ${this._activeTab === 'health' ? 'active' : ''}" id="tab-health">SANTÉ (IMC/CORP)</button>
            <button class="tab ${this._activeTab === 'sensors' ? 'active' : ''}" id="tab-sensors">CAPTEURS LIBRES</button>
            <button class="tab ${this._activeTab === 'design' ? 'active' : ''}" id="tab-design">CARTE</button>
        </div>
        <div class="section">
            ${this._activeTab === 'health' ? `
                <div class="sub-sec">
                    <label>IMC - Taille (W x H)</label>
                    <div class="grid"><input type="number" id="imcw" value="${p.imc_w}"> <input type="number" id="imch" value="${p.imc_h}"></div>
                    <div class="grid">
                        <div><label>Bordure (px)</label><input type="number" id="imcbw" value="${p.imc_b_w || 0}"></div>
                        <div><label>Couleur Bord</label><input type="text" id="imcbc" value="${p.imc_b_c || 'rgba(255,255,255,0.2)'}"></div>
                    </div>
                    <div class="check"><input type="checkbox" id="imcc" ${p.imc_circle?'checked':''}> <label>Rond (W = H)</label></div>
                </div>
                <div class="sub-sec">
                    <label>CORPULENCE - Taille (W x H)</label>
                    <div class="grid"><input type="number" id="corpw" value="${p.corp_w}"> <input type="number" id="corph" value="${p.corp_h}"></div>
                    <div class="grid">
                        <div><label>Bordure (px)</label><input type="number" id="corpbw" value="${p.corp_b_w || 0}"></div>
                        <div><label>Couleur Bord</label><input type="text" id="corpbc" value="${p.corp_b_c || 'rgba(255,255,255,0.2)'}"></div>
                    </div>
                    <div class="check"><input type="checkbox" id="corpc" ${p.corp_circle?'checked':''}> <label>Rond (W = H)</label></div>
                </div>
            ` : ''}
            ${this._activeTab === 'sensors' ? `
                ${(p.sensors || []).map((s, i) => `
                    <div class="sub-sec">
                        <label>${s.name} - Dimensions</label>
                        <div class="grid"><input type="number" class="s-w" data-idx="${i}" value="${s.w || 100}"> <input type="number" class="s-h" data-idx="${i}" value="${s.h || 70}"></div>
                        <div class="grid">
                            <div><label>Bordure (px)</label><input type="number" class="s-bw" data-idx="${i}" value="${s.b_w || 0}"></div>
                            <div><label>Couleur</label><input type="text" class="s-bc" data-idx="${i}" value="${s.b_c || 'rgba(255,255,255,0.2)'}"></div>
                        </div>
                        <div class="check"><input type="checkbox" class="s-c" data-idx="${i}" ${s.circle?'checked':''}> <label>Rond (W = H)</label></div>
                    </div>
                `).join('')}
            ` : ''}
            ${this._activeTab === 'design' ? `
                <label>Hauteur de la Carte (Pixels)</label><input type="number" id="ch" value="${this._config.card_height || 600}">
            ` : ''}
        </div>
      </div>
    `;
    this._attachEvents(pKey);
  }

  _attachEvents(pKey) {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._activeTab = t.id.replace('tab-',''); this.render(); });
    const p = this._config[pKey];
    const fire = () => this._fire();

    if(this._activeTab === 'health') {
        this.querySelector('#imcw').oninput = (e) => { p.imc_w = e.target.value; fire(); };
        this.querySelector('#imch').oninput = (e) => { p.imc_h = e.target.value; fire(); };
        this.querySelector('#imcbw').oninput = (e) => { p.imc_b_w = e.target.value; fire(); };
        this.querySelector('#imcbc').oninput = (e) => { p.imc_b_c = e.target.value; fire(); };
        this.querySelector('#imcc').onchange = (e) => { p.imc_circle = e.target.checked; fire(); this.render(); };
        this.querySelector('#corpw').oninput = (e) => { p.corp_w = e.target.value; fire(); };
        this.querySelector('#corph').oninput = (e) => { p.corp_h = e.target.value; fire(); };
        this.querySelector('#corpbw').oninput = (e) => { p.corp_b_w = e.target.value; fire(); };
        this.querySelector('#corpbc').oninput = (e) => { p.corp_b_c = e.target.value; fire(); };
        this.querySelector('#corpc').onchange = (e) => { p.corp_circle = e.target.checked; fire(); this.render(); };
    }
    if(this._activeTab === 'sensors') {
        this.querySelectorAll('.s-w').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].w = e.target.value; fire(); });
        this.querySelectorAll('.s-h').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].h = e.target.value; fire(); });
        this.querySelectorAll('.s-bw').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].b_w = e.target.value; fire(); });
        this.querySelectorAll('.s-bc').forEach(el => el.oninput = (e) => { p.sensors[el.dataset.idx].b_c = e.target.value; fire(); });
        this.querySelectorAll('.s-c').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.idx].circle = e.target.checked; fire(); this.render(); });
    }
    if(this._activeTab === 'design') {
        this.querySelector('#ch').oninput = (e) => { this._config.card_height = e.target.value; fire(); };
    }
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.2.8" });
