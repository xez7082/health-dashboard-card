/**
 * HEALTH DASHBOARD CARD – V2.3.3
 * AJOUT : RÉGLAGE DE TAILLE DE POLICE INDIVIDUEL PAR CAPTEUR / ROND
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
      card_height: 600, card_round: 12, icon_size: 26,
      border_width: 1, border_color: "rgba(255,255,255,0.2)",
      font_size_label: 10, font_size_value: 14,
      person1: {
        name: "Patrick", start: 85, comfort: 78, ideal: 72, image: "", sensors: [], step_goal: 10000, 
        imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 20, imc_y: 20, imc_circle: false, imc_size: 80, imc_font_size: 0,
        corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 20, corp_y: 35, corp_circle: false, corp_size: 80, corp_font_size: 0
      },
      person2: {
        name: "Sandra", start: 70, comfort: 65, ideal: 60, image: "", sensors: [], step_goal: 10000,
        imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 20, imc_y: 20, imc_circle: false, imc_size: 80, imc_font_size: 0,
        corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 20, corp_y: 35, corp_circle: false, corp_size: 80, corp_font_size: 0
      }
    };
  }

  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  set hass(hass) { this._hass = hass; this.updateSensors(); }
  _num(val, d = 0) { const n = parseFloat(val); return isNaN(n) ? d : n; }

  updateSensors() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view || 'person1';
    const pData = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    const setV = (id, ent) => {
        const el = this.shadowRoot.getElementById(id);
        if (el && ent && this._hass.states[ent]) {
            const s = this._hass.states[ent];
            el.textContent = `${s.state}${s.attributes.unit_of_measurement || ''}`;
        }
    };

    setV('imc-val', pData.imc_entity);
    setV('corp-val', pData.corp_entity);
    const stepEnt = pData.step_entity || 'sensor.withings_pas' + suffix;
    const stSteps = this._hass.states[stepEnt];
    if (stSteps) {
        const valSteps = this._num(stSteps.state);
        const path = this.shadowRoot.getElementById('gauge-path');
        if(path) path.style.strokeDasharray = `${(Math.min(100, (valSteps / this._num(pData.step_goal, 10000)) * 100) * 125.6) / 100}, 125.6`;
        const vP = this.shadowRoot.getElementById('step-value');
        if(vP) vP.textContent = valSteps;
    }
    if (pData.sensors) pData.sensors.forEach((s, i) => setV(`value-${i}`, s.entity));
  }

  _renderBlock(x, y, w, h, icon, name, valId, isCircle, circleSize, individualFontSize, accent, round) {
      const finalW = isCircle ? (circleSize || 80) : (this._config.b_width || 160);
      const finalH = isCircle ? (circleSize || 80) : (this._config.b_height || 69);
      const fsLabel = this._config.font_size_label || 10;
      
      // Si une taille individuelle est définie (>0), on l'utilise, sinon on utilise la globale
      const fsVal = (individualFontSize && individualFontSize > 0) 
                    ? individualFontSize 
                    : (isCircle ? (finalH / 4) : (this._config.font_size_value || 14));
      
      return `
        <div class="sensor-card" style="left:${x}%; top:${y}%; width:${finalW}px; height:${finalH}px; border-radius:${isCircle ? '50%' : round + 'px'};">
            <ha-icon icon="${icon}"></ha-icon>
            <div class="label" style="font-size:${fsLabel}px; display:${isCircle ? 'none' : 'block'};">${name}</div>
            <div id="${valId}" class="value" style="font-size:${fsVal}px;">--</div>
        </div>
      `;
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
        .bg-img { position: absolute; inset: 0; background-position: center ${this._config.img_offset || 50}%; background-size: cover; opacity: 0.4; z-index: 1; pointer-events: none; background-image: url('${pData.image}'); }
        .topbar { position: absolute; left: 5%; top: 3%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; font-weight: bold; }
        .btn.active { background: ${accent} !important; border-color: ${accent}; }
        .sensor-card { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); border: ${this._config.border_width || 1}px solid ${this._config.border_color || 'rgba(255,255,255,0.2)'}; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 4px; backdrop-filter: blur(8px); overflow: hidden; }
        .label { opacity: 0.8; margin-bottom: 2px; text-align: center; }
        .value { font-weight: 900; }
        ha-icon { --mdc-icon-size: ${this._config.icon_size || 26}px; color: ${accent}; margin-bottom: 2px; }
        .steps-gauge { position: absolute; top: 15px; right: 15px; width: 85px; height: 85px; z-index: 100; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: ${this._config.border_width || 1}px solid ${this._config.border_color || 'rgba(255,255,255,0.2)'}; }
        .steps-data { position: absolute; text-align: center; font-size: ${this._config.font_size_value || 14}px; font-weight: 900; }
        .steps-gauge svg { transform: rotate(-90deg); width: 74px; height: 74px; }
        .steps-gauge .meter { fill: none; stroke: ${pData.step_color || accent}; stroke-width: 4.5; stroke-linecap: round; }
      </style>
      <div class="main-container">
        <div class="topbar"><button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button><button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button></div>
        <div class="steps-gauge"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4.5"/><circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0, 125.6"/></svg><div class="steps-data" id="step-value">--</div></div>
        <div class="bg-img"></div>
        ${this._renderBlock(pData.imc_x, pData.imc_y, 160, 69, pData.imc_icon, pData.imc_name, 'imc-val', pData.imc_circle, pData.imc_size, pData.imc_font_size, accent, round)}
        ${this._renderBlock(pData.corp_x, pData.corp_y, 160, 69, pData.corp_icon, pData.corp_name, 'corp-val', pData.corp_circle, pData.corp_size, pData.corp_font_size, accent, round)}
        ${(pData.sensors || []).map((s, i) => this._renderBlock(s.x, s.y, 160, 69, s.icon, s.name, `value-${i}`, s.is_circle, s.circle_size, s.font_size, accent, round)).join('')}
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
  setConfig(config) { this._config = config; this.render(); }

  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <style>
        .ed-box { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid #444; }
        .tab { padding: 10px; cursor: pointer; background: #252525; border: none; color: #888; flex: 1; font-size: 11px; }
        .tab.active { background: #38bdf8; color: black; font-weight: bold; }
        .section { background: #252525; padding: 15px; border: 1px solid #444; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 10px; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sub-sec { background: #111; padding: 10px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #38bdf8; }
      </style>
      <div class="ed-box">
        <div class="tabs">
            ${['profile','health','sensors','design'].map(t => `<button class="tab ${this._activeTab===t?'active':''}" id="tab-${t}">${t.toUpperCase()}</button>`).join('')}
        </div>
        <div class="section">
            ${this._activeTab === 'health' ? `
                <div class="sub-sec">
                    <label>IMC</label><input type="text" id="inp-imce" value="${p.imc_entity || ''}">
                    <div class="grid">
                        <div><label>Diamètre</label><input type="number" id="inp-imcs" value="${p.imc_size || 80}"></div>
                        <div><label>Police (px)</label><input type="number" id="inp-imcf" value="${p.imc_font_size || 0}"></div>
                    </div>
                </div>
            ` : ''}
            ${this._activeTab === 'sensors' ? `
                <div id="sensors-container">
                ${(p.sensors || []).map((s, i) => `
                  <div class="sub-sec">
                    <label>${s.name || 'Capteur'}</label>
                    <div class="grid">
                        <div><label>Diamètre</label><input type="number" class="s-size" data-idx="${i}" value="${s.circle_size || 80}"></div>
                        <div><label>Police (px)</label><input type="number" class="s-font" data-idx="${i}" value="${s.font_size || 0}"></div>
                    </div>
                  </div>
                `).join('')}
                </div>
            ` : ''}
            ${this._activeTab === 'design' ? `
                <div class="sub-sec"><label>Tailles Globales</label>
                    <div class="grid">
                        <div><label>Labels</label><input type="number" id="inp-fsl" value="${this._config.font_size_label || 10}"></div>
                        <div><label>Valeurs</label><input type="number" id="inp-fsv" value="${this._config.font_size_value || 14}"></div>
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
    const bind = (id, field, isRoot = false) => {
        const el = this.querySelector(id);
        if(el) el.oninput = (e) => { 
            if(isRoot) this._config[field] = e.target.value; else this._config[pKey][field] = e.target.value;
            this._fire(); 
        };
    };
    if(this._activeTab === 'health') { bind('#inp-imcs', 'imc_size'); bind('#inp-imcf', 'imc_font_size'); }
    if(this._activeTab === 'design') { bind('#inp-fsl', 'font_size_label', true); bind('#inp-fsv', 'font_size_value', true); }
    if(this._activeTab === 'sensors') {
        this.querySelectorAll('.s-size').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].circle_size = e.target.value; this._fire(); });
        this.querySelectorAll('.s-font').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].font_size = e.target.value; this._fire(); });
    }
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.3.3" });
