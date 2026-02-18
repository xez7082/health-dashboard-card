/**
 * HEALTH DASHBOARD CARD – V2.0.0
 * Gestion complète des modules IMC & Corpulence dans l'onglet SANTÉ.
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
        imc_entity: "", imc_name: "IMC", imc_icon: "mdi:calculator-variant", imc_x: 20, imc_y: 20,
        corp_entity: "", corp_name: "Corpulence", corp_icon: "mdi:human-biceps", corp_x: 20, corp_y: 35
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

    // 1. POIDS
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const pct = range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0;
        const pointer = this.shadowRoot.getElementById('progression-pointer');
        if(pointer) pointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        
        const label = this.shadowRoot.getElementById('pointer-label');
        if(label) {
            const stDiff = this._hass.states['sensor.difference_poids' + suffix];
            let diffHtml = '';
            if (stDiff) {
                const valDiff = this._num(stDiff.state);
                diffHtml = ` <span style="color:${valDiff <= 0 ? '#4ade80' : '#f87171'}; font-size:0.8em; margin-left:4px;">(${valDiff > 0 ? '+' : ''}${valDiff} kg)</span>`;
            }
            label.innerHTML = `${actuel} kg${diffHtml}`;
        }
    }

    // 2. IMC & CORPULENCE
    const updateVal = (id, entity) => {
        const el = this.shadowRoot.getElementById(id);
        if (el && entity && this._hass.states[entity]) {
            const st = this._hass.states[entity];
            el.textContent = `${st.state} ${st.attributes.unit_of_measurement || ''}`;
        }
    };
    updateVal('imc-val', pData.imc_entity);
    updateVal('corp-val', pData.corp_entity);

    // 3. PAS & CAPTEURS
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
            if (valEl && st) valEl.textContent = `${st.state} ${st.attributes.unit_of_measurement || ''}`;
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
        .topbar { position: absolute; left: ${this._config.btn_x || 5}%; top: ${this._config.btn_y || 3}%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 11px; font-weight: bold; }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; }
        
        .sensor-card { position: absolute; transform: translate(-50%, -50%); border-radius: 8px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 5px; backdrop-filter: blur(5px); width:${this._config.b_width}px; height:${this._config.b_height}px; }
        ha-icon { --mdc-icon-size: 24px; color: ${accentColor}; }
        
        .rule-container { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 85%; height: 75px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 10px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 5px; margin-top: 30px; }
        .marker { position: absolute; top: 20px; font-size: 9px; transform: translateX(-50%); text-align: center; font-weight: 900; }
        .prog-pointer { position: absolute; top: -12px; width: 3px; height: 34px; background: white; transition: left 1s ease; border-radius: 2px; }
        .pointer-info { position: absolute; top: -26px; left: 50%; transform: translateX(-50%); background: white; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; color: #000; white-space: nowrap; }

        .steps-gauge { position: absolute; top: 10px; right: 15px; width: 80px; height: 80px; z-index: 100; background: rgba(0,0,0,0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .steps-gauge svg { transform: rotate(-90deg); width: 70px; height: 70px; }
        .steps-gauge .meter { fill: none; stroke: ${accentColor}; stroke-width: 4; stroke-linecap: round; }
        .steps-data { position: absolute; text-align: center; }
        .steps-data .val { font-size: 14px; font-weight: 900; }
      </style>
      <div class="main-container">
        <div class="topbar">
            <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
            <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        
        <div class="steps-gauge"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/><circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0, 125.6"/></svg><div class="steps-data"><span id="step-value" class="val">--</span><span style="font-size:8px; display:block;">Pas</span></div></div>

        <div class="bg-img"></div>

        ${pData.imc_entity ? `
        <div class="sensor-card" style="left:${pData.imc_x}%; top:${pData.imc_y}%;">
            <ha-icon icon="${pData.imc_icon || 'mdi:calculator-variant'}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${pData.imc_name || 'IMC'}</div>
            <div id="imc-val" style="font-weight:900;">--</div>
        </div>` : ''}

        ${pData.corp_entity ? `
        <div class="sensor-card" style="left:${pData.corp_x}%; top:${pData.corp_y}%;">
            <ha-icon icon="${pData.corp_icon || 'mdi:human-biceps'}"></ha-icon>
            <div style="font-size:10px; opacity:0.8;">${pData.corp_name || 'Corpulence'}</div>
            <div id="corp-val" style="font-weight:900;">--</div>
        </div>` : ''}

        <div class="rule-container">
            <div class="rule-track">
                <div class="marker" style="left:0;">DÉPART<br>${pData.start}</div>
                <div class="marker" style="left:65%;">CONFORT<br>${pData.goal}</div>
                <div class="marker" style="left:100%;">IDÉAL<br>${pData.ideal}</div>
                <div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-info">--</div></div>
            </div>
        </div>

        ${(pData.sensors || []).map((s, i) => `
            <div class="sensor-card" style="left:${s.x}%; top:${s.y}%;">
              <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
              <div style="font-size:10px; opacity:0.8;">${s.name}</div>
              <div id="value-${i}" style="font-weight:900;">--</div>
            </div>`).join('')}
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
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config || {}));
    this.render();
  }

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
        .section { background: #252525; padding: 15px; border: 1px solid #444; border-top: none; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 10px; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sub-sec { background: #111; padding: 10px; border-radius: 5px; margin-bottom: 15px; border-left: 2px solid #38bdf8; }
      </style>
      <div class="ed-box">
        <div style="display:flex; gap:8px; margin-bottom:10px;">
            <button style="flex:1; padding:8px; background:${pKey==='person1'?'#38bdf8':'#444'}; border:none; color:white;" id="t-p1">PATRICK</button>
            <button style="flex:1; padding:8px; background:${pKey==='person2'?'#38bdf8':'#444'}; border:none; color:white;" id="t-p2">SANDRA</button>
        </div>
        <div class="tabs">
            <button class="tab ${this._activeTab === 'profile' ? 'active' : ''}" id="tab-profile">PROFIL</button>
            <button class="tab ${this._activeTab === 'health' ? 'active' : ''}" id="tab-health">SANTÉ</button>
            <button class="tab ${this._activeTab === 'sensors' ? 'active' : ''}" id="tab-sensors">CAPTEURS</button>
            <button class="tab ${this._activeTab === 'design' ? 'active' : ''}" id="tab-design">DESIGN</button>
        </div>
        <div class="section">
            ${this._activeTab === 'health' ? `
                <div class="sub-sec">
                    <label>MODULE IMC</label>
                    <input type="text" id="inp-imce" placeholder="Entité (ex: sensor.imc)" value="${p.imc_entity || ''}">
                    <div class="grid">
                        <div><label>NOM</label><input type="text" id="inp-imcn" value="${p.imc_name || 'IMC'}"></div>
                        <div><label>ICÔNE</label><input type="text" id="inp-imci" value="${p.imc_icon || 'mdi:calculator-variant'}"></div>
                    </div>
                    <div class="grid">
                        <div><label>POS X %</label><input type="number" id="inp-imcx" value="${p.imc_x || 20}"></div>
                        <div><label>POS Y %</label><input type="number" id="inp-imcy" value="${p.imc_y || 20}"></div>
                    </div>
                </div>
                <div class="sub-sec">
                    <label>MODULE CORPULENCE</label>
                    <input type="text" id="inp-corpe" placeholder="Entité (ex: sensor.corp)" value="${p.corp_entity || ''}">
                    <div class="grid">
                        <div><label>NOM</label><input type="text" id="inp-corpn" value="${p.corp_name || 'Corpulence'}"></div>
                        <div><label>ICÔNE</label><input type="text" id="inp-corpi" value="${p.corp_icon || 'mdi:human-biceps'}"></div>
                    </div>
                    <div class="grid">
                        <div><label>POS X %</label><input type="number" id="inp-corpx" value="${p.corp_x || 20}"></div>
                        <div><label>POS Y %</label><input type="number" id="inp-corpy" value="${p.corp_y || 35}"></div>
                    </div>
                </div>
            ` : ''}

            ${this._activeTab === 'profile' ? `
                <label>NOM</label><input type="text" id="inp-name" value="${p.name}">
                <label>URL IMAGE</label><input type="text" id="inp-img" value="${p.image}">
                <div class="grid">
                    <div><label>DÉPART (KG)</label><input type="number" id="inp-start" value="${p.start}"></div>
                    <div><label>OBJECTIF PAS</label><input type="number" id="inp-sgoal" value="${p.step_goal}"></div>
                </div>
                <div class="grid">
                    <div><label>CONFORT (KG)</label><input type="number" id="inp-goal" value="${p.goal}"></div>
                    <div><label>IDÉAL (KG)</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
                </div>
            ` : ''}

            ${this._activeTab === 'design' ? `
                <div class="grid">
                    <div><label>HAUTEUR CARTE</label><input type="number" id="inp-ch" value="${this._config.card_height}"></div>
                    <div><label>IMAGE OFFSET %</label><input type="number" id="inp-off" value="${this._config.img_offset || 50}"></div>
                </div>
                <div class="grid" style="margin-top:15px;">
                    <div><label>LARGEUR BLOCS</label><input type="number" id="inp-bw" value="${this._config.b_width}"></div>
                    <div><label>HAUTEUR BLOCS</label><input type="number" id="inp-bh" value="${this._config.b_height}"></div>
                </div>
            ` : ''}

            ${this._activeTab === 'sensors' ? `
                <div id="sensors-container">
                ${(p.sensors || []).map((s, i) => `
                  <div style="background:#111; padding:10px; margin-bottom:10px; border-left:4px solid #38bdf8; position:relative;">
                    <button class="del-btn" data-idx="${i}" style="position:absolute; top:5px; right:5px; background:#f87171; border:none; color:white; cursor:pointer;">X</button>
                    <label>NOM</label><input type="text" class="s-name" data-idx="${i}" value="${s.name}">
                    <label>ENTITÉ</label><input type="text" class="s-ent" data-idx="${i}" value="${s.entity}">
                    <div class="grid">
                        <div><label>POS X %</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div>
                        <div><label>POS Y %</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div>
                    </div>
                  </div>
                `).join('')}
                </div>
                <button style="width:100%; padding:10px; background:#4ade80; border:none; font-weight:bold; cursor:pointer;" id="add-s">➕ AJOUTER UN CAPTEUR</button>
            ` : ''}
            <div style="font-size:9px; color:#555; text-align:right; margin-top:10px;">V2.0.0</div>
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

    if(this._activeTab === 'health') {
        bind('#inp-imce', 'imc_entity'); bind('#inp-imcn', 'imc_name'); bind('#inp-imci', 'imc_icon'); bind('#inp-imcx', 'imc_x'); bind('#inp-imcy', 'imc_y');
        bind('#inp-corpe', 'corp_entity'); bind('#inp-corpn', 'corp_name'); bind('#inp-corpi', 'corp_icon'); bind('#inp-corpx', 'corp_x'); bind('#inp-corpy', 'corp_y');
    }
    if(this._activeTab === 'profile') {
        bind('#inp-name', 'name'); bind('#inp-img', 'image'); bind('#inp-start', 'start'); bind('#inp-sgoal', 'step_goal'); bind('#inp-goal', 'goal'); bind('#inp-ideal', 'ideal');
    }
    if(this._activeTab === 'design') {
        bind('#inp-ch', 'card_height', true); bind('#inp-off', 'img_offset', true);
        bind('#inp-bw', 'b_width', true); bind('#inp-bh', 'b_height', true);
    }
    if(this._activeTab === 'sensors') {
        this.querySelectorAll('.s-name').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
        this.querySelectorAll('.s-ent').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
        this.querySelectorAll('.s-x').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
        this.querySelectorAll('.s-y').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].y = e.target.value; this._fire(); });
        this.querySelector('#add-s').onclick = () => { if(!this._config[pKey].sensors) this._config[pKey].sensors = []; this._config[pKey].sensors.push({name:"Nouveau", entity:"", x:50, y:50}); this._fire(); this.render(); };
        this.querySelectorAll('.del-btn').forEach(btn => btn.onclick = (e) => { this._config[pKey].sensors.splice(e.target.dataset.idx, 1); this._fire(); this.render(); });
    }
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V2.0.0" });
