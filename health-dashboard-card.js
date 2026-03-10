/**
 * HEALTH DASHBOARD CARD – V2.6.0
 * INCLUS : IMC, Corpulence, Pas (Jauge), Règle de poids, Multi-personnes, Éditeur total.
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
      card_height: 600, card_round: 15, icon_size: 28,
      border_width: 2, border_color: "rgba(56, 189, 248, 0.5)",
      font_size_label: 11, font_size_value: 15,
      person1: {
        name: "Patrick", start: 85, comfort: 78, ideal: 72, step_goal: 10000,
        imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 25, imc_y: 20, imc_circle: true, imc_size: 100, imc_font_size: 18,
        corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 25, corp_y: 40, corp_circle: false, corp_size: 100,
        sensors: []
      },
      person2: { name: "Sandra", start: 70, comfort: 65, ideal: 60, step_goal: 8000, sensors: [] }
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

    // 1. Valeurs Textuelles (IMC, Corpulence, Capteurs)
    const setV = (id, ent) => {
        const el = this.shadowRoot.getElementById(id);
        if (el && ent && this._hass.states[ent]) {
            const s = this._hass.states[ent];
            el.textContent = `${s.state}${s.attributes.unit_of_measurement || ''}`;
        }
    };
    setV('imc-val', pData.imc_entity);
    setV('corp-val', pData.corp_entity);
    if (pData.sensors) pData.sensors.forEach((s, i) => setV(`value-${i}`, s.entity));

    // 2. Jauge des Pas
    const stepEnt = pData.step_entity || 'sensor.withings_pas' + suffix;
    const stSteps = this._hass.states[stepEnt];
    if (stSteps) {
        const valSteps = this._num(stSteps.state);
        const goal = this._num(pData.step_goal, 10000);
        const path = this.shadowRoot.getElementById('gauge-path');
        if(path) path.style.strokeDasharray = `${(Math.min(100, (valSteps / goal) * 100) * 125.6) / 100}, 125.6`;
        const vP = this.shadowRoot.getElementById('step-value');
        if(vP) vP.textContent = valSteps;
    }

    // 3. Règle de Poids
    const pEnt = pData.weight_entity || 'sensor.withings_poids' + suffix;
    const stPoids = this._hass.states[pEnt];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const label = this.shadowRoot.getElementById('pointer-label');
        if(label) label.textContent = `${actuel}kg`;
        const ptr = this.shadowRoot.getElementById('progression-pointer');
        if(ptr) ptr.style.left = `${Math.max(0, Math.min(100, range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0))}%`;
    }
  }

  _renderBlock(x, y, w, h, icon, name, valId, isCircle, circleSize, individualFontSize, accent, round) {
      const finalW = isCircle ? (circleSize || 80) : (w || 150);
      const finalH = isCircle ? (circleSize || 80) : (h || 70);
      const fsLabel = this._config.font_size_label || 10;
      const fsVal = (individualFontSize > 0) ? individualFontSize : (isCircle ? (finalH / 4) : (this._config.font_size_value || 14));
      
      return `
        <div class="sensor-card" style="left:${x}%; top:${y}%; width:${finalW}px; height:${finalH}px; border-radius:${isCircle ? '50%' : round + 'px'};">
            <ha-icon icon="${icon}"></ha-icon>
            <div class="label" style="font-size:${fsLabel}px;">${name}</div>
            <div id="${valId}" class="value" style="font-size:${fsVal}px;">--</div>
        </div>
      `;
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view || 'person1';
    const pData = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: ${this._config.card_round || 15}px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center 50%; background-size: cover; opacity: 0.4; background-image: url('${pData.image}'); z-index:0; }
        .topbar { position: absolute; left: 5%; top: 3%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 25px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-weight: bold; backdrop-filter: blur(5px); }
        .btn.active { background: ${accent} !important; border-color: ${accent}; color: #000; }
        
        .sensor-card { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.8); border: ${this._config.border_width || 2}px solid ${this._config.border_color || accent}; display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; backdrop-filter: blur(10px); text-align: center; }
        .label { opacity: 0.7; text-transform: uppercase; font-weight: 500; }
        .value { font-weight: 900; }
        ha-icon { --mdc-icon-size: ${this._config.icon_size || 26}px; color: ${accent}; }

        .steps-gauge { position: absolute; top: 20px; right: 20px; width: 100px; height: 100px; z-index: 100; background: rgba(0,0,0,0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.1); }
        .steps-data { position: absolute; text-align: center; font-size: 14px; font-weight: 900; }
        .steps-gauge svg { transform: rotate(-90deg); width: 85px; height: 85px; }
        .steps-gauge .meter { fill: none; stroke: ${accent}; stroke-width: 5; stroke-linecap: round; transition: stroke-dasharray 1s ease; }

        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 90%; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; margin-top: 30px; }
        .rule-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 5px; }
        .prog-pointer { position: absolute; top: -10px; width: 4px; height: 30px; background: white; transition: left 1s ease; box-shadow: 0 0 10px white; }
        .pointer-bubble { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 3px 10px; border-radius: 8px; font-weight: 900; border: 2px solid ${accent}; font-size: 12px; }
        .mark { position: absolute; top: 15px; transform: translateX(-50%); font-size: 10px; font-weight: bold; text-align: center; }
      </style>
      <div class="main-container">
        <div class="topbar">
            <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
            <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="steps-gauge">
            <svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="5"/><circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0, 125.6"/></svg>
            <div class="steps-data"><span id="step-value">0</span><br><small style="font-size:8px; opacity:0.6;">PAS</small></div>
        </div>
        <div class="bg-img"></div>
        ${this._renderBlock(pData.imc_x, pData.imc_y, pData.imc_w, pData.imc_h, pData.imc_icon, pData.imc_name, 'imc-val', pData.imc_circle, pData.imc_size, pData.imc_font_size, accent, this._config.card_round)}
        ${this._renderBlock(pData.corp_x, pData.corp_y, pData.corp_w, pData.corp_h, pData.corp_icon, pData.corp_name, 'corp-val', pData.corp_circle, pData.corp_size, pData.corp_font_size, accent, this._config.card_round)}
        ${(pData.sensors || []).map((s, i) => this._renderBlock(s.x, s.y, s.w, s.h, s.icon, s.name, `value-${i}`, s.is_circle, s.circle_size, s.font_size, accent, this._config.card_round)).join('')}
        
        <div class="rule-container">
            <div class="rule-track"><div class="rule-fill"></div><div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-bubble">--</div></div></div>
            <div class="mark" style="left:0%">${pData.start}kg</div>
            <div class="mark" style="left:50%">${pData.comfort || ''}kg</div>
            <div class="mark" style="left:100%">${pData.ideal}kg</div>
        </div>
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._activeTab = 'design'; }
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = config; this.render(); }

  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <style>
        .ed-box { padding: 15px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
        .tab { padding: 8px; cursor: pointer; background: #252525; border: none; color: #aaa; flex: 1; font-size: 10px; border-radius: 4px; }
        .tab.active { background: #38bdf8; color: black; font-weight: bold; }
        .section { background: #252525; padding: 12px; border-radius: 6px; border: 1px solid #444; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; }
        input, select { width: 100%; padding: 6px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; margin-top: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .sub-sec { background: #111; padding: 10px; border-radius: 4px; margin-bottom: 10px; border-left: 3px solid #38bdf8; }
      </style>
      <div class="ed-box">
        <div class="tabs">
            ${['design','profile','health','sensors'].map(t => `<button class="tab ${this._activeTab===t?'active':''}" id="tab-${t}">${t.toUpperCase()}</button>`).join('')}
        </div>
        <div class="section">
            ${this._activeTab === 'design' ? `
                <div class="grid">
                    <div><label>Hauteur Carte</label><input type="number" id="inp-ch" value="${this._config.card_height || 600}"></div>
                    <div><label>Arrondi</label><input type="number" id="inp-round" value="${this._config.card_round || 15}"></div>
                </div>
                <div class="grid">
                    <div><label>Police Noms</label><input type="number" id="inp-fsl" value="${this._config.font_size_label || 10}"></div>
                    <div><label>Police Chiffres</label><input type="number" id="inp-fsv" value="${this._config.font_size_value || 14}"></div>
                </div>
            ` : ''}
            ${this._activeTab === 'profile' ? `
                <label>Nom</label><input type="text" id="inp-name" value="${p.name}">
                <div class="grid">
                    <div><label>Départ (kg)</label><input type="number" id="inp-start" value="${p.start}"></div>
                    <div><label>Idéal (kg)</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
                </div>
                <label>Objectif Pas</label><input type="number" id="inp-stepg" value="${p.step_goal}">
                <label>Image Fond</label><input type="text" id="inp-img" value="${p.image}">
            ` : ''}
            ${this._activeTab === 'health' ? `
                <div class="sub-sec">
                    <label>IMC - Entité</label><input type="text" id="inp-imce" value="${p.imc_entity || ''}">
                    <div class="grid">
                        <div><label>X / Y %</label><div class="grid"><input type="number" id="inp-imcx" value="${p.imc_x}"> <input type="number" id="inp-imcy" value="${p.imc_y}"></div></div>
                        <div><label>Rond / Taille</label><div class="grid"><input type="number" id="inp-imcs" value="${p.imc_size}"> <input type="number" id="inp-imcf" value="${p.imc_font_size}"></div></div>
                    </div>
                </div>
                <div class="sub-sec">
                    <label>CORPULENCE - Entité</label><input type="text" id="inp-corpe" value="${p.corp_entity || ''}">
                    <div class="grid">
                        <div><label>X / Y %</label><div class="grid"><input type="number" id="inp-corpx" value="${p.corp_x}"> <input type="number" id="inp-corpy" value="${p.corp_y}"></div></div>
                    </div>
                </div>
            ` : ''}
            ${this._activeTab === 'sensors' ? `
                <button style="width:100%; padding:10px; background:#4ade80; border:none; font-weight:bold; margin-bottom:10px;" id="add-s">➕ AJOUTER CAPTEUR</button>
                <div id="sensors-container">
                ${(p.sensors || []).map((s, i) => `
                  <div class="sub-sec">
                    <label>${s.name}</label>
                    <div class="grid">
                        <div><label>X/Y %</label><div class="grid"><input type="number" class="s-x" data-idx="${i}" value="${s.x}"> <input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div></div>
                        <div><label>Police</label><input type="number" class="s-font" data-idx="${i}" value="${s.font_size}"></div>
                    </div>
                  </div>
                `).join('')}
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
        if(!el) return;
        el.oninput = (e) => { 
            if(isRoot) this._config[field] = e.target.value; else this._config[pKey][field] = e.target.value;
            this._fire(); 
        };
    };
    if(this._activeTab === 'design') { bind('#inp-ch','card_height',true); bind('#inp-round','card_round',true); bind('#inp-fsl','font_size_label',true); bind('#inp-fsv','font_size_value',true); }
    if(this._activeTab === 'profile') { bind('#inp-name','name'); bind('#inp-start','start'); bind('#inp-ideal','ideal'); bind('#inp-stepg','step_goal'); bind('#inp-img','image'); }
    if(this._activeTab === 'health') { bind('#inp-imce','imc_entity'); bind('#inp-imcx','imc_x'); bind('#inp-imcy','imc_y'); bind('#inp-imcs','imc_size'); bind('#inp-imcf','imc_font_size'); bind('#inp-corpe','corp_entity'); bind('#inp-corpx','corp_x'); bind('#inp-corpy','corp_y'); }
    if(this._activeTab === 'sensors') {
        this.querySelectorAll('.s-x').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
        this.querySelectorAll('.s-font').forEach(el => el.oninput = (e) => { this._config[pKey].sensors[el.dataset.idx].font_size = e.target.value; this._fire(); });
        this.querySelector('#add-s').onclick = () => { if(!this._config[pKey].sensors) this._config[pKey].sensors = []; this._config[pKey].sensors.push({name:"Nouveau", entity:"", x:50, y:50, w:150, h:70, icon:"mdi:heart", is_circle:true, circle_size:90, font_size:0}); this._fire(); this.render(); };
    }
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.6.0" });
