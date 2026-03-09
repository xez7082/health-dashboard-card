/**
 * HEALTH DASHBOARD CARD – V2.2.5
 * AJOUTS : ENTITÉS PAS PERSONNALISABLES + ARRONDI DES CARTES
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
      card_height: 600,
      card_round: 12,
      person1: {
        name: "Patrick", start: 85, comfort: 78, ideal: 72, image: "", sensors: [], step_entity: "", step_goal: 10000,
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 20, imc_y: 20, imc_w: 160, imc_h: 69, imc_font: 14,
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 20, corp_y: 35, corp_w: 160, corp_h: 69, corp_font: 14
      },
      person2: {
        name: "Sandra", start: 70, comfort: 65, ideal: 60, image: "", sensors: [], step_entity: "", step_goal: 10000,
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 20, imc_y: 20, imc_w: 160, imc_h: 69, imc_font: 14,
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 20, corp_y: 35, corp_w: 160, corp_h: 69, corp_font: 14
      }
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

    // POIDS
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const stDiff = this._hass.states['sensor.difference_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const label = this.shadowRoot.getElementById('pointer-label');
        if(label) {
            const diffVal = stDiff ? stDiff.state : "0";
            const valF = parseFloat(diffVal);
            label.innerHTML = `${actuel}kg <span style="color:${valF <= 0 ? '#4ade80' : '#f87171'}; margin-left:4px; font-size:0.8em;">(${valF > 0 ? '+' : ''}${diffVal})</span>`;
        }
        const pct = range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0;
        const ptr = this.shadowRoot.getElementById('progression-pointer');
        if(ptr) ptr.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        const cmf = this.shadowRoot.getElementById('mark-comfort');
        if(cmf) cmf.style.left = `${range !== 0 ? ((this._num(pData.start) - this._num(pData.comfort)) / range) * 100 : 50}%`;
    }

    // IMC & CORPULENCE
    const setV = (id, ent) => {
        const el = this.shadowRoot.getElementById(id);
        if (el && ent && this._hass.states[ent]) {
            const s = this._hass.states[ent];
            el.textContent = `${s.state}${s.attributes.unit_of_measurement || ''}`;
        }
    };
    setV('imc-val', pData.imc_entity);
    setV('corp-val', pData.corp_entity);

    // PAS (NOUVEAUTÉ : ENTITÉ PERSO)
    const stepEnt = pData.step_entity || 'sensor.withings_pas' + suffix;
    const stSteps = this._hass.states[stepEnt];
    if (stSteps) {
        const valSteps = this._num(stSteps.state);
        const goal = this._num(pData.step_goal, 10000);
        const pctS = Math.min(100, (valSteps / goal) * 100);
        const path = this.shadowRoot.getElementById('gauge-path');
        if(path) path.style.strokeDasharray = `${(pctS * 125.6) / 100}, 125.6`;
        const vP = this.shadowRoot.getElementById('step-value');
        if(vP) vP.textContent = valSteps;
    }

    // AUTRES CAPTEURS
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
    if(!pData) return;
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';
    const round = this._config.card_round || 12;

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${round}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._config.img_offset || 50}%; background-size: cover; opacity: 0.4; z-index: 1; pointer-events: none; background-image: url('${pData.image}'); }
        .topbar { position: absolute; left: ${this._config.btn_x || 5}%; top: ${this._config.btn_y || 3}%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; font-weight: bold; }
        .btn.active { background: ${accent} !important; border-color: ${accent}; }
        .sensor-card { position: absolute; transform: translate(-50%, -50%); border-radius: ${round}px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 4px; backdrop-filter: blur(8px); }
        ha-icon { --mdc-icon-size: 26px; color: ${accent}; margin-bottom: 2px; }
        .rule-container { position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%); width: 90%; height: 80px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 40px; }
        .rule-fill { position: absolute; height: 100%; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 4px; width: 100%; opacity: 0.7; }
        .prog-pointer { position: absolute; top: -14px; width: 3px; height: 36px; background: white; transition: left 1s ease; box-shadow: 0 0 12px white; z-index: 5; }
        .pointer-bubble { position: absolute; top: -42px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 900; white-space: nowrap; border: 2px solid ${accent}; }
        .mark { position: absolute; top: 12px; transform: translateX(-50%); font-size: 10px; font-weight: bold; text-align: center; line-height: 1.2; }
        .mark-confort { position: absolute; top: -4px; width: 12px; height: 12px; background: #fbbf24; border: 2px solid #0f172a; border-radius: 50%; transform: translateX(-50%); z-index: 4; }
        .steps-gauge { position: absolute; top: 15px; right: 15px; width: 85px; height: 85px; z-index: 100; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .steps-data { position: absolute; text-align: center; }
        .steps-gauge svg { transform: rotate(-90deg); width: 74px; height: 74px; }
        .steps-gauge .meter { fill: none; stroke: ${accent}; stroke-width: 4.5; stroke-linecap: round; }
      </style>
      <div class="main-container">
        <div class="topbar"><button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button><button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button></div>
        <div class="steps-gauge"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4.5"/><circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0, 125.6"/></svg><div class="steps-data"><span id="step-value" style="font-weight:900;">--</span></div></div>
        <div class="bg-img"></div>
        <div class="sensor-card" style="left:${pData.imc_x}%; top:${pData.imc_y}%; width:${pData.imc_w}px; height:${pData.imc_h}px;"><ha-icon icon="${pData.imc_icon}"></ha-icon><div style="font-size:10px; opacity:0.8;">${pData.imc_name}</div><div id="imc-val" style="font-weight:900; font-size:${pData.imc_font}px;">--</div></div>
        <div class="sensor-card" style="left:${pData.corp_x}%; top:${pData.corp_y}%; width:${pData.corp_w}px; height:${pData.corp_h}px;"><ha-icon icon="${pData.corp_icon}"></ha-icon><div style="font-size:10px; opacity:0.8;">${pData.corp_name}</div><div id="corp-val" style="font-weight:900; font-size:${pData.corp_font}px;">--</div></div>
        ${(pData.sensors || []).map((s, i) => `<div class="sensor-card" style="left:${s.x}%; top:${s.y}%; width:${this._config.b_width || 160}px; height:${this._config.b_height || 69}px;"><ha-icon icon="${s.icon}"></ha-icon><div style="font-size:10px; opacity:0.8;">${s.name}</div><div id="value-${i}" style="font-weight:900;">--</div></div>`).join('')}
        <div class="rule-container">
            <div class="rule-track">
                <div class="rule-fill"></div>
                <div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-bubble">--</div></div>
                <div class="mark" style="left: 0%;">DÉPART<br>${pData.start}kg</div>
                <div id="mark-comfort" class="mark" style="left: 50%; color:#fbbf24;"><div class="mark-confort"></div>CONFORT<br>${pData.comfort}kg</div>
                <div class="mark" style="left: 100%;">IDÉAL<br>${pData.ideal}kg</div>
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
  setConfig(config) { this._config = config; this.render(); }

  render() {
    if (!this._hass || !this._config) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];
    if (!p) return;

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
        .del-btn { width: 100%; margin-top: 10px; background: #f87171; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; }
      </style>
      <div class="ed-box">
        <div style="display:flex; gap:8px; margin-bottom:12px;">
            <button style="flex:1; padding:10px; background:${pKey==='person1'?'#38bdf8':'#444'};" id="t-p1">${this._config.person1.name}</button>
            <button style="flex:1; padding:10px; background:${pKey==='person2'?'#38bdf8':'#444'};" id="t-p2">${this._config.person2.name}</button>
        </div>
        <div class="tabs">
            <button class="tab ${this._activeTab === 'profile' ? 'active' : ''}" id="tab-profile">PROFIL</button>
            <button class="tab ${this._activeTab === 'health' ? 'active' : ''}" id="tab-health">SANTÉ</button>
            <button class="tab ${this._activeTab === 'sensors' ? 'active' : ''}" id="tab-sensors">CAPTEURS</button>
            <button class="tab ${this._activeTab === 'design' ? 'active' : ''}" id="tab-design">DESIGN</button>
        </div>
        <div class="section">
            ${this._activeTab === 'profile' ? `
                <label>Nom</label><input type="text" id="inp-name" value="${p.name}">
                <label>Image URL</label><input type="text" id="inp-img" value="${p.image}">
                <div class="grid">
                    <div><label>Départ</label><input type="number" id="inp-start" value="${p.start}"></div>
                    <div><label>Confort</label><input type="number" id="inp-conf" value="${p.comfort}"></div>
                    <div><label>Idéal</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
                </div>
            ` : ''}
            ${this._activeTab === 'health' ? `
                <div class="sub-sec">
                    <label>PAS (ENTITÉ)</label><input type="text" id="inp-stepe" value="${p.step_entity || ''}" placeholder="sensor.withings_pas...">
                    <label>OBJECTIF PAS</label><input type="number" id="inp-stepg" value="${p.step_goal || 10000}">
                </div>
                <div class="sub-sec">
                    <label>IMC</label><input type="text" id="inp-imce" value="${p.imc_entity || ''}">
                    <div class="grid">
                        <div><label>Nom</label><input type="text" id="inp-imcn" value="${p.imc_name}"></div>
                        <div><label>Icône</label><input type="text" id="inp-imci" value="${p.imc_icon}"></div>
                        <div><label>L/H</label><div style="display:flex;gap:4px;"><input type="number" id="inp-imcw" value="${p.imc_w}"><input type="number" id="inp-imch" value="${p.imc_h}"></div></div>
                        <div><label>X/Y %</label><div style="display:flex;gap:4px;"><input type="number" id="inp-imcx" value="${p.imc_x}"><input type="number" id="inp-imcy" value="${p.imc_y}"></div></div>
                        <div><label>Police</label><input type="number" id="inp-imcf" value="${p.imc_font}"></div>
                    </div>
                </div>
                <div class="sub-sec">
                    <label>CORPULENCE</label><input type="text" id="inp-corpe" value="${p.corp_entity || ''}">
                    <div class="grid">
                        <div><label>Nom</label><input type="text" id="inp-corpn" value="${p.corp_name}"></div>
                        <div><label>Icône</label><input type="text" id="inp-corpi" value="${p.corp_icon}"></div>
                        <div><label>L/H</label><div style="display:flex;gap:4px;"><input type="number" id="inp-corpw" value="${p.corp_w}"><input type="number" id="inp-corph" value="${p.corp_h}"></div></div>
                        <div><label>X/Y %</label><div style="display:flex;gap:4px;"><input type="number" id="inp-corpx" value="${p.corp_x}"><input type="number" id="inp-corpy" value="${p.corp_y}"></div></div>
                        <div><label>Police</label><input type="number" id="inp-corpf" value="${p.corp_font}"></div>
                    </div>
                </div>
            ` : ''}
            ${this._activeTab === 'sensors' ? `
                <div id="sensors-container">
                ${(p.sensors || []).map((s,
