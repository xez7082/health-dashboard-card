/**
 * HEALTH DASHBOARD CARD – V1.9.6 (FULL SIZE CONTROLS)
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config || {}));
    const base = { name: "Patrick", sensors: [], start: 80, goal: 75, ideal: 70, image: "", step_goal: 10000 };
    if (!this._config.person1) this._config.person1 = { ...base };
    if (!this._config.person2) this._config.person2 = { ...base, name: "Sandra" };
    if (!this._config.current_view) this._config.current_view = 'person1';
    
    // Valeurs par défaut pour le design
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

    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const stDiff = this._hass.states['sensor.difference_poids' + suffix];
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    
    if (stPoids && progPointer) {
        const actuel = this._num(stPoids.state);
        const start = this._num(pData.start);
        const ideal = this._num(pData.ideal);
        const range = start - ideal;
        const pct = range !== 0 ? ((start - actuel) / range) * 100 : 0;
        progPointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        
        let diffHtml = '';
        if (stDiff) {
            const valDiff = this._num(stDiff.state);
            const color = valDiff <= 0 ? '#4ade80' : '#f87171';
            diffHtml = ` <span style="color:${color}; font-size:0.8em; margin-left:4px;">(${valDiff > 0 ? '+' : ''}${valDiff} kg)</span>`;
        }
        const labelEl = this.shadowRoot.getElementById('pointer-label');
        if (labelEl) labelEl.innerHTML = `${actuel} kg${diffHtml}`;
    }

    const stSteps = this._hass.states['sensor.withings_pas' + suffix];
    const circle = this.shadowRoot.getElementById('gauge-path');
    const stepVal = this.shadowRoot.getElementById('step-value');
    if (stSteps && circle && stepVal) {
        const steps = this._num(stSteps.state);
        const goal = this._num(pData.step_goal, 10000);
        const pct = Math.min(100, (steps / goal) * 100);
        circle.style.strokeDasharray = `${(pct * 125.6) / 100}, 125.6`;
        stepVal.textContent = steps >= 1000 ? (steps/1000).toFixed(1) + 'k' : steps;
    }

    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (valEl && stateObj) {
                valEl.textContent = `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`;
            }
        });
    }
  }

  render() {
    const view = this._config.current_view;
    const pData = this._config[view] || { sensors: [] };
    const accentColor = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._num(this._config.card_height, 600)}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._num(this._config.img_offset, 50)}%; background-size: cover; opacity: 0.4; z-index: 1; pointer-events: none; background-image: url('${pData.image || ''}'); }
        .topbar { position: absolute; left: ${this._num(this._config.btn_x, 5)}%; top: ${this._num(this._config.btn_y, 3)}%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 11px; font-weight: bold; }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; }
        
        .steps-gauge { position: absolute; top: 10px; right: 15px; width: 80px; height: 80px; z-index: 100; background: rgba(0,0,0,0.4); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .steps-gauge svg { transform: rotate(-90deg); width: 70px; height: 70px; }
        .steps-gauge .meter { fill: none; stroke: ${accentColor}; stroke-width: 4; stroke-linecap: round; }
        .steps-data { position: absolute; text-align: center; }
        .steps-data .val { font-size: 14px; font-weight: 900; }
        .steps-data .unit { font-size: 8px; color: ${accentColor}; font-weight: bold; display: block; }

        .rule-container { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 85%; height: 75px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 10px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 5px; margin-top: 30px; }
        .marker { position: absolute; top: 20px; font-size: 9px; transform: translateX(-50%); text-align: center; font-weight: 900; line-height: 1.1; }
        .prog-pointer { position: absolute; top: -12px; width: 3px; height: 34px; background: white; transition: left 1s ease; border-radius: 2px; }
        .pointer-info { position: absolute; top: -26px; left: 50%; transform: translateX(-50%); background: white; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; color: #000; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.5); }
        
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 5px; backdrop-filter: blur(5px); }
        ha-icon { --mdc-icon-size: 24px; color: ${accentColor}; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'P1'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'P2'}</button>
        </div>
        <div class="steps-gauge"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/><circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0, 125.6"/></svg><div class="steps-data"><span id="step-value" class="val">--</span><span class="unit">Pas</span></div></div>
        <div class="bg-img"></div>
        <div class="rule-container">
            <div class="rule-track">
                <div class="marker" style="left: 0; color: #f87171;">DÉPART<br>${pData.start}kg</div>
                <div class="marker" style="left: 65%; color: #fbbf24;">CONFORT<br>${pData.goal}kg</div>
                <div class="marker" style="left: 100%; color: #4ade80;">IDÉAL<br>${pData.ideal}kg</div>
                <div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-info">--</div></div>
            </div>
        </div>
        ${(pData.sensors || []).map((s, i) => `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%; width:${this._config.b_width}px; height:${this._config.b_height}px;">
              <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
              <div style="font-size:10px; color:#cbd5e1; font-weight:bold;">${s.name}</div>
              <div id="value-${i}" style="font-weight:900; font-size:1.1em;">--</div>
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
    if (!this._config.person1) this._config.person1 = { name: "Patrick", sensors: [] };
    if (!this._config.person2) this._config.person2 = { name: "Sandra", sensors: [] };
    this.render();
  }

  render() {
    if (!this._hass) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];
    const allEntities = Object.keys(this._hass.states).filter(e => e.startsWith('sensor.')).sort();

    this.innerHTML = `
      <style>
        .ed-box { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 10px; border-bottom: 1px solid #444; }
        .tab { padding: 8px; cursor: pointer; background: #252525; border: none; color: #888; font-size: 11px; flex: 1; border-radius: 4px 4px 0 0; }
        .tab.active { background: #38bdf8; color: black; font-weight: bold; }
        .section { background: #252525; padding: 15px; border-radius: 0 0 5px 5px; border: 1px solid #444; border-top: none; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 12px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .s-card { background: #111; padding: 10px; margin-bottom: 15px; border-left: 4px solid #38bdf8; position: relative; }
        .del-btn { position: absolute; top: 5px; right: 5px; background: #f87171; border: none; color: white; cursor: pointer; padding: 2px 6px; border-radius: 3px; }
        .res-box { background: #333; border: 1px solid #38bdf8; max-height: 100px; overflow-y: auto; display: none; position: absolute; width: 90%; z-index: 100; }
        .res-item { padding: 8px; cursor: pointer; font-size: 11px; }
        .res-item:hover { background: #38bdf8; color: black; }
        .version { font-size: 8px; color: #555; text-align: right; margin-top: 15px; }
        h3 { margin: 0 0 10px 0; font-size: 14px; color: #fff; border-bottom: 1px solid #38bdf8; display: inline-block; }
      </style>
      <div class="ed-box">
        <div style="display:flex; gap:8px; margin-bottom:10px;">
            <button style="flex:1; padding:8px; background:${pKey==='person1'?'#38bdf8':'#444'}; border:none; color:white; font-weight:bold; cursor:pointer;" id="t-p1">PATRICK</button>
            <button style="flex:1; padding:8px; background:${pKey==='person2'?'#38bdf8':'#444'}; border:none; color:white; font-weight:bold; cursor:pointer;" id="t-p2">SANDRA</button>
        </div>

        <div class="tabs">
            <button class="tab ${this._activeTab === 'profile' ? 'active' : ''}" id="tab-profile">PROFIL</button>
            <button class="tab ${this._activeTab === 'sensors' ? 'active' : ''}" id="tab-sensors">CAPTEURS</button>
            <button class="tab ${this._activeTab === 'design' ? 'active' : ''}" id="tab-design">DESIGN</button>
        </div>

        <div class="section">
            ${this._activeTab === 'profile' ? `
                <h3>INFORMATIONS</h3>
                <label>NOM D'AFFICHAGE</label><input type="text" id="inp-name" value="${p.name}">
                <label>IMAGE DE FOND (URL)</label><input type="text" id="inp-img" value="${p.image || ''}">
                <div class="grid">
                    <div><label>POIDS DÉPART</label><input type="number" id="inp-start" value="${p.start}"></div>
                    <div><label>OBJECTIF PAS</label><input type="number" id="inp-sgoal" value="${p.step_goal || 10000}"></div>
                </div>
                <div class="grid">
                    <div><label>POIDS CONFORT</label><input type="number" id="inp-goal" value="${p.goal}"></div>
                    <div><label>POIDS IDÉAL</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
                </div>
            ` : ''}

            ${this._activeTab === 'sensors' ? `
                <div id="sensors-container">
                ${(p.sensors || []).map((s, i) => `
                  <div class="s-card">
                    <button class="del-btn" data-idx="${i}">X</button>
                    <label>NOM</label><input type="text" class="s-name" data-idx="${i}" value="${s.name}">
                    <label>ICÔNE MDI</label><input type="text" class="s-icon" data-idx="${i}" value="${s.icon || 'mdi:heart'}">
                    <label>ENTITÉ</label><input type="text" class="search-in" data-idx="${i}" value="${s.entity}">
                    <div class="res-box" id="res-${i}"></div>
                    <div class="grid">
                        <div><label>POS X %</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div>
                        <div><label>POS Y %</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div>
                    </div>
                  </div>
                `).join('')}
                </div>
                <button style="width:100%; padding:10px; background:#4ade80; border:none; font-weight:bold; cursor:pointer;" id="add-s">➕ AJOUTER UN CAPTEUR</button>
            ` : ''}

            ${this._activeTab === 'design' ? `
                <h3>DIMENSIONS GLOBALES</h3>
                <div class="grid">
                    <div><label>HAUTEUR CARTE</label><input type="number" id="inp-ch" value="${this._config.card_height}"></div>
                    <div><label>IMAGE OFFSET %</label><input type="number" id="inp-off" value="${this._config.img_offset || 50}"></div>
                </div>
                <div class="grid">
                    <div><label>BOUTONS X %</label><input type="number" id="inp-bx" value="${this._config.btn_x || 5}"></div>
                    <div><label>BOUTONS Y %</label><input type="number" id="inp-by" value="${this._config.btn_y || 3}"></div>
                </div>

                <h3 style="margin-top:20px;">CARTES CAPTEURS</h3>
                <div class="grid">
                    <div><label>LARGEUR (PX)</label><input type="number" id="inp-bw" value="${this._config.b_width}"></div>
                    <div><label>HAUTEUR (PX)</label><input type="number" id="inp-bh" value="${this._config.b_height}"></div>
                </div>
                <p style="font-size:9px; color:#888; margin-top:5px;">Note: Ces dimensions s'appliquent à tous les capteurs ajoutés.</p>
            ` : ''}
            <div class="version">V80.1 - Design Settings Updated</div>
        </div>
      </div>
    `;

    this._attachEvents(pKey, allEntities);
  }

  _attachEvents(pKey, allEntities) {
    this.querySelector('#tab-profile').onclick = () => { this._activeTab = 'profile'; this.render(); };
    this.querySelector('#tab-sensors').onclick = () => { this._activeTab = 'sensors'; this.render(); };
    this.querySelector('#tab-design').onclick = () => { this._activeTab = 'design'; this.render(); };
    this.querySelector('#t-p1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#t-p2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };

    const setVal = (id, path, isRoot = false) => {
        const el = this.querySelector(id);
        if(el) el.onchange = (e) => { 
            if(isRoot) this._config[path] = e.target.value;
            else this._config[pKey][path] = e.target.value;
            this._fire(); 
        };
    };

    if(this._activeTab === 'profile'){
        setVal('#inp-name', 'name'); setVal('#inp-img', 'image'); setVal('#inp-start', 'start');
        setVal('#inp-sgoal', 'step_goal'); setVal('#inp-goal', 'goal'); setVal('#inp-ideal', 'ideal');
    }
    if(this._activeTab === 'design'){
        setVal('#inp-ch', 'card_height', true); setVal('#inp-off', 'img_offset', true);
        setVal('#inp-bx', 'btn_x', true); setVal('#inp-by', 'btn_y', true);
        setVal('#inp-bw', 'b_width', true); setVal('#inp-bh', 'b_height', true);
    }
    if(this._activeTab === 'sensors'){
        this.querySelectorAll('.search-in').forEach(input => {
            input.oninput = (e) => {
                const val = e.target.value.toLowerCase();
                const idx = e.target.dataset.idx;
                const box = this.querySelector(`#res-${idx}`);
                if (val.length < 2) { box.style.display = 'none'; return; }
                const hits = allEntities.filter(en => en.toLowerCase().includes(val)).slice(0, 10);
                box.style.display = hits.length ? 'block' : 'none';
                box.innerHTML = hits.map(h => `<div class="res-item" data-en="${h}">${h}</div>`).join('');
                box.querySelectorAll('.res-item').forEach(item => {
                    item.onclick = () => {
                        this._config[pKey].sensors[idx].entity = item.dataset.en;
                        this._fire(); this.render();
                    };
                });
            };
        });
        this.querySelectorAll('.s-name').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
        this.querySelectorAll('.s-icon').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].icon = e.target.value; this._fire(); });
        this.querySelectorAll('.s-x').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
        this.querySelectorAll('.s-y').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].y = e.target.value; this._fire(); });
        
        this.querySelector('#add-s').onclick = () => {
            if(!this._config[pKey].sensors) this._config[pKey].sensors = [];
            this._config[pKey].sensors.push({ name: "Nouveau", entity: "", icon: "mdi:heart", x: 50, y: 50 });
            this._fire(); this.render();
        };
        this.querySelectorAll('.del-btn').forEach(btn => btn.onclick = (e) => {
            this._config[pKey].sensors.splice(e.target.dataset.idx, 1);
            this._fire(); this.render();
        });
    }
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V80.1" });
