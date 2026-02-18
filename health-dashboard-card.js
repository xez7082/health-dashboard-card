/**
 * HEALTH DASHBOARD CARD – V2.1.2
 * Inclus : Delta Poids, Dimensions Blocs, Positions Boutons, Tailles Polices.
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
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:scale-bathroom", imc_x: 20, imc_y: 20, imc_w: 160, imc_h: 69, imc_font: 14,
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-male", corp_x: 20, corp_y: 35, corp_w: 160, corp_h: 69, corp_font: 14
    };
    if (!this._config.person1) this._config.person1 = { ...base, name: "Patrick" };
    if (!this._config.person2) this._config.person2 = { ...base, name: "Sandra" };
    if (!this._config.current_view) this._config.current_view = 'person1';
    
    // Valeurs par défaut globales
    this._config.card_height = this._config.card_height || 600;
    this._config.b_width = this._config.b_width || 160;
    this._config.b_height = this._config.b_height || 69;
    this._config.btn_x = this._config.btn_x || 5;
    this._config.btn_y = this._config.btn_y || 3;
    
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

    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const stDiff = this._hass.states['sensor.difference_poids' + suffix];
    
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const depart = this._num(pData.start);
        const ideal = this._num(pData.ideal);
        const diffVal = stDiff ? stDiff.state : "0";
        const label = this.shadowRoot.getElementById('pointer-label');
        if(label) {
            const valFloat = parseFloat(diffVal);
            const color = valFloat <= 0 ? '#4ade80' : '#f87171';
            const sign = valFloat > 0 ? '+' : '';
            label.innerHTML = `${actuel}kg <span style="color:${color}; margin-left:5px; font-size:0.85em;">(${sign}${diffVal}kg)</span>`;
        }
        const range = depart - ideal;
        const pct = range !== 0 ? ((depart - actuel) / range) * 100 : 0;
        const pointer = this.shadowRoot.getElementById('progression-pointer');
        if(pointer) pointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
    }

    const setVal = (id, entity) => {
        const el = this.shadowRoot.getElementById(id);
        if (el && entity && this._hass.states[entity]) {
            const st = this._hass.states[entity];
            el.textContent = `${st.state}${st.attributes.unit_of_measurement || ''}`;
        }
    };
    setVal('imc-val', pData.imc_entity);
    setVal('corp-val', pData.corp_entity);

    const stSteps = this._hass.states['sensor.withings_pas' + suffix];
    if (stSteps) {
        const pct = Math.min(100, (this._num(stSteps.state) / this._num(pData.step_goal, 10000)) * 100);
        const path = this.shadowRoot.getElementById('gauge-path');
        if(path) path.style.strokeDasharray = `${(pct * 125.6) / 100}, 125.6`;
        const valPas = this.shadowRoot.getElementById('step-value');
        if(valPas) valPas.textContent = stSteps.state;
    }

    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const st = this._hass.states[s.entity];
            if (valEl && st) valEl.textContent = `${st.state}${st.attributes.unit_of_measurement || ''}`;
        });
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
        .topbar { position: absolute; left: ${this._config.btn_x}%; top: ${this._config.btn_y}%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; font-weight: bold; }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; }
        .sensor-card { position: absolute; transform: translate(-50%, -50%); border-radius: 10px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 4px; backdrop-filter: blur(8px); }
        ha-icon { --mdc-icon-size: 26px; color: ${accentColor}; margin-bottom: 2px; }
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 88%; height: 80px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 10px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 5px; margin-top: 35px; }
        .prog-pointer { position: absolute; top: -12px; width: 4px; height: 34px; background: white; transition: left 1s ease; box-shadow: 0 0 10px white; border-radius: 2px; }
        .weight-marks { position: absolute; width: 100%; top: 22px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; }
        .steps-gauge { position: absolute; top: 15px; right: 15px; width: 85px; height: 85px; z-index: 100; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .steps-gauge svg { transform: rotate(-90deg); width: 74px; height: 74px; }
        .steps-gauge .meter { fill: none; stroke: ${accentColor}; stroke-width: 4.5; stroke-linecap: round; }
        .steps-data { position: absolute; text-align: center; }
      </style>
      <div class="main-container">
        <div class="topbar"><button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button><button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button></div>
        <div class="steps-gauge"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4.5"/><circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0, 125.6"/></svg><div class="steps-data"><span id="step-value" style="font-weight:900;">--</span></div></div>
        <div class="bg-img"></div>
        
        <div class="sensor-card" style="left:${pData.imc_x}%; top:${pData.imc_y}%; width:${pData.imc_w}px; height:${pData.imc_h}px;"><ha-icon icon="${pData.imc_icon || 'mdi:scale-bathroom'}"></ha-icon><div style="font-size:10px; opacity:0.8;">${pData.imc_name}</div><div id="imc-val" style="font-weight:900; font-size:${pData.imc_font}px;">--</div></div>
        
        <div class="sensor-card" style="left:${pData.corp_x}%; top:${pData.corp_y}%; width:${pData.corp_w}px; height:${pData.corp_h}px;"><ha-icon icon="${pData.corp_icon || 'mdi:human-male'}"></ha-icon><div style="font-size:10px; opacity:0.8;">${pData.corp_name}</div><div id="corp-val" style="font-weight:900; font-size:${pData.corp_font}px;">--</div></div>
        
        ${(pData.sensors || []).map((s, i) => `<div class="sensor-card" style="left:${s.x}%; top:${s.y}%; width:${this._config.b_width}px; height:${this._config.b_height}px;"><ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon><div style="font-size:10px; opacity:0.8;">${s.name}</div><div id="value-${i}" style="font-weight:900;">--</div></div>`).join('')}
        
        <div class="rule-container"><div class="rule-track"><div id="progression-pointer" class="prog-pointer"><div id="pointer-label" style="position:absolute; top:-38px; left:50%; transform:translateX(-50%); background:white; color:black; padding:5px 12px; border-radius:10px; font-size:14px; font-weight:900; border: 2.5px solid ${accentColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">--</div></div><div class="weight-marks"><span>${pData.start}kg</span><span>${pData.ideal}kg</span></div></div></div>
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
            <button style="flex:1; padding:10px; background:${pKey==='person1'?'#38bdf8':'#444'};" id="t-p1">PATRICK</button>
            <button style="flex:1; padding:10px; background:${pKey==='person2'?'#38bdf8':'#444'};" id="t-p2">SANDRA</button>
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
                    <div><label>Objectif</label><input type="number" id="inp-goal" value="${p.goal}"></div>
                    <div><label>Idéal</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
                    <div><label>Pas</label><input type="number" id="inp-sgoal" value="${p.step_goal}"></div>
                </div>
            ` : ''}
            ${this._activeTab === 'health' ? `
                <div class="sub-sec">
                    <label>IMC</label><input type="text" id="inp-imce" value="${p.imc_entity || ''}">
                    <div class="grid">
                        <div><label>L</label><input type="number" id="inp-imcw" value="${p.imc_w}"></div>
                        <div><label>H</label><input type="number" id="inp-imch" value="${p.imc_h}"></div>
                        <div><label>X %</label><input type="number" id="inp-imcx" value="${p.imc_x}"></div>
                        <div><label>Y %</label><input type="number" id="inp-imcy" value="${p.imc_y}"></div>
                        <div><label>Police</label><input type="number" id="inp-imcf" value="${p.imc_font}"></div>
                    </div>
                </div>
                <div class="sub-sec">
                    <label>CORPULENCE</label><input type="text" id="inp-corpe" value="${p.corp_entity || ''}">
                    <div class="grid">
                        <div><label>L</label><input type="number" id="inp-corpw" value="${p.corp_w}"></div>
                        <div><label>H</label><input type="number" id="inp-corph" value="${p.corp_h}"></div>
                        <div><label>X %</label><input type="number" id="inp-corpx" value="${p.corp_x}"></div>
                        <div><label>Y %</label><input type="number" id="inp-corpy" value="${p.corp_y}"></div>
                        <div><label>Police</label><input type="number" id="inp-corpf" value="${p.corp_font}"></div>
                    </div>
                </div>
            ` : ''}
            ${this._activeTab === 'sensors' ? `
                <div id="sensors-container">
                ${(p.sensors || []).map((s, i) => `
                  <div class="sub-sec">
                    <label>Nom</label><input type="text" class="s-name" data-idx="${i}" value="${s.name}">
                    <label>Entité</label><input type="text" class="s-ent" data-idx="${i}" value="${s.entity}">
                    <div class="grid"><div><label>X %</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div><div><label>Y %</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div></div>
                    <button class="del-btn" data-idx="${i}">Supprimer</button>
                  </div>
                `).join('')}
                </div>
                <button style="width:100%; padding:12px; background:#4ade80; border:none; font-weight:bold;" id="add-s">➕ AJOUTER</button>
            ` : ''}
            ${this._activeTab === 'design' ? `
                <label>Hauteur Carte</label><input type="number" id="inp-ch" value="${this._config.card_height}">
                <label>Image Offset %</label><input type="number" id="inp-off" value="${this._config.img_offset || 50}">
                <div class="grid">
                    <div><label>Pos Boutons X%</label><input type="number" id="inp-bx" value="${this._config.btn_x}"></div>
                    <div><label>Pos Boutons Y%</label><input type="number" id="inp-by" value="${this._config.btn_y}"></div>
                </div>
                <div class="grid">
                    <div><label>Largeur Blocs</label><input type="number" id="inp-bw" value="${this._config.b_width}"></div>
                    <div><label>Hauteur Blocs</label><input type="number" id="inp-bh" value="${this._config.b_height}"></div>
                </div>
            ` : ''}
        </div>
      </div>
    `;
    this._attachEvents(pKey);
  }

  _attachEvents(pKey) {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._activeTab = t.id.replace('tab-',''); this.render(); });
    this.querySelector('#t-p1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#t-p2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };

    const bind = (id, field, isRoot = false) => {
        const el = this.querySelector(id);
        if(el) el.onchange = (e) => { 
            if(isRoot) this._config[field] = e.target.value;
            else this._config[pKey][field] = e.target.value; 
            this._fire(); 
        };
    };

    if(this._activeTab === 'profile') { bind('#inp-name', 'name'); bind('#inp-img', 'image'); bind('#inp-start', 'start'); bind('#inp-goal', 'goal'); bind('#inp-ideal', 'ideal'); bind('#inp-sgoal', 'step_goal'); }
    if(this._activeTab === 'health') { 
        bind('#inp-imce', 'imc_entity'); bind('#inp-imcw', 'imc_w'); bind('#inp-imch', 'imc_h'); bind('#inp-imcx', 'imc_x'); bind('#inp-imcy', 'imc_y'); bind('#inp-imcf', 'imc_font');
        bind('#inp-corpe', 'corp_entity'); bind('#inp-corpw', 'corp_w'); bind('#inp-corph', 'corp_h'); bind('#inp-corpx', 'corp_x'); bind('#inp-corpy', 'corp_y'); bind('#inp-corpf', 'corp_font');
    }
    if(this._activeTab === 'design') { bind('#inp-ch', 'card_height', true); bind('#inp-off', 'img_offset', true); bind('#inp-bx', 'btn_x', true); bind('#inp-by', 'btn_y', true); bind('#inp-bw', 'b_width', true); bind('#inp-bh', 'b_height', true); }
    
    if(this._activeTab === 'sensors') {
        this.querySelectorAll('.s-name').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
        this.querySelectorAll('.s-ent').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
        this.querySelectorAll('.s-x').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
        this.querySelectorAll('.s-y').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].y = e.target.value; this._fire(); });
        this.querySelectorAll('.del-btn').forEach(btn => btn.onclick = () => { this._config[pKey].sensors.splice(btn.dataset.idx, 1); this._fire(); this.render(); });
        this.querySelector('#add-s').onclick = () => { if(!this._config[pKey].sensors) this._config[pKey].sensors = []; this._config[pKey].sensors.push({name:"Nouveau", entity:"", x:50, y:50}); this._fire(); this.render(); };
    }
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.1.2" });
