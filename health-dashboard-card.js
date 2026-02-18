/**
 * HEALTH DASHBOARD CARD – V80.1 (ULTRA-STABLE)
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    this._config = JSON.parse(JSON.stringify(config));
    
    // SÉCURITÉ ABSOLUE : Initialisation des blocs si manquants
    const defaultPerson = { name: "Nouveau", sensors: [], start: 0, goal: 0, ideal: 0, step_goal: 10000 };
    if (!this._config.person1) this._config.person1 = { ...defaultPerson, name: "Patrick" };
    if (!this._config.person2) this._config.person2 = { ...defaultPerson, name: "Sandra" };
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

  _getRelativeTime(lastChanged) {
    if (!lastChanged) return "n/a";
    const now = new Date();
    const passed = new Date(lastChanged);
    const diff = Math.floor((now - passed) / 1000);
    if (diff < 60) return `à l'instant`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
  }

  updateSensors() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view] || { sensors: [] };
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const stDiff = this._hass.states['sensor.difference_poids' + suffix];
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    
    if (stPoids && progPointer) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const pct = range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0;
        progPointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        
        let diffHtml = '';
        if (stDiff) {
            const valDiff = this._num(stDiff.state);
            diffHtml = ` <span style="color:${valDiff <= 0 ? '#4ade80' : '#f87171'}; margin-left:4px;">(${valDiff > 0 ? '+' : ''}${valDiff} kg)</span>`;
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
            const timeEl = this.shadowRoot.getElementById(`time-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (stateObj) {
                if (valEl) valEl.textContent = `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`;
                if (timeEl) timeEl.textContent = this._getRelativeTime(stateObj.last_changed);
                this._renderTrends(s.entity, i, view === 'person1' ? '#38bdf8' : '#f43f5e');
            }
        });
    }
  }

  async _renderTrends(entity, i, color) {
    try {
      const history = await this._hass.callApi('GET', `history/period/${new Date(Date.now()-86400000).toISOString()}?filter_entity_id=${entity}`);
      if (!history || !history[0] || history[0].length < 2) return;
      const points = history[0].map(entry => parseFloat(entry.state)).filter(v => !isNaN(v));
      const min = Math.min(...points); const max = Math.max(...points); const range = max - min === 0 ? 1 : max - min;
      const coords = points.map((p, idx) => `${(idx / (points.length - 1)) * 100},${30 - ((p - min) / range) * 30}`).join(' ');
      const sparkEl = this.shadowRoot.getElementById(`spark-${i}`);
      if (sparkEl) sparkEl.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none" style="opacity:0.25;"><polyline fill="none" stroke="${color}" stroke-width="2" points="${coords}" /></svg>`;
    } catch (e) {}
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view] || { name: "Erreur", sensors: [], start:0, goal:0, ideal:0 };
    const accentColor = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._num(this._config.card_height, 600)}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._num(this._config.img_offset)}%; background-size: cover; opacity: 0.4; z-index: 1; pointer-events: none; background-image: url('${pData.image || ''}'); }
        .topbar { position: absolute; left: ${this._num(this._config.btn_x, 5)}%; top: ${this._num(this._config.btn_y, 3)}%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 11px; font-weight: bold; }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; box-shadow: 0 0 15px ${accentColor}; }
        .steps-gauge { position: absolute; top: 10px; right: 15px; width: 80px; height: 80px; z-index: 100; background: rgba(0,0,0,0.4); border-radius: 50%; backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
        .steps-gauge svg { transform: rotate(-90deg); width: 70px; height: 70px; }
        .steps-gauge .bg { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 4; }
        .steps-gauge .meter { fill: none; stroke: ${accentColor}; stroke-width: 4; stroke-linecap: round; transition: stroke-dasharray 1s ease; }
        .steps-data { position: absolute; text-align: center; }
        .steps-data .val { font-size: 14px; font-weight: 900; }
        .steps-data .unit { font-size: 8px; color: ${accentColor}; font-weight: bold; display: block; }
        .rule-container { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 85%; height: 75px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 10px; background: linear-gradient(to right, #f87171 0%, #fbbf24 65%, #4ade80 100%); border-radius: 5px; margin-top: 30px; }
        .marker-label { position: absolute; top: 20px; font-size: 9px; transform: translateX(-50%); text-align: center; font-weight: 900; text-shadow: 1px 1px 2px black; }
        .prog-pointer { position: absolute; top: -12px; width: 3px; height: 34px; background: white; transition: left 1s ease; border-radius: 2px; }
        .pointer-info { position: absolute; top: -26px; left: 50%; transform: translateX(-50%); background: white; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; color: #000; white-space: nowrap; }
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 5px; backdrop-filter: blur(5px); overflow: hidden; }
        .sparkline-container { position: absolute; bottom: 0; left: 0; width: 100%; height: 30px; z-index: -1; }
        .time-text { font-size: 8px; color: #94a3b8; margin-top: 2px; font-style: italic; }
        ha-icon { --mdc-icon-size: 22px; color: ${accentColor}; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name || 'P1'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name || 'P2'}</button>
        </div>
        <div class="steps-gauge"><svg viewBox="0 0 50 50"><circle class="bg" cx="25" cy="25" r="20"/><circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0, 125.6"/></svg><div class="steps-data"><span id="step-value" class="val">--</span><span class="unit">Pas</span></div></div>
        <div class="bg-img"></div>
        <div class="rule-container">
            <div class="rule-track">
                <div class="marker-label" style="left: 0; color: #f87171;">DÉPART<br>${pData.start}kg</div>
                <div class="marker-label" style="left: 65%; color: #fbbf24;">CONFORT<br>${pData.goal}kg</div>
                <div class="marker-label" style="left: 100%; color: #4ade80;">IDÉAL<br>${pData.ideal}kg</div>
                <div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-info">--</div></div>
            </div>
        </div>
        ${(pData.sensors || []).map((s, i) => {
            const isIMC = s.name?.toLowerCase().includes('imc') || s.name?.toLowerCase().includes('corpulence');
            const w = isIMC ? this._num(this._config.imc_width, 250) : this._num(this._config.b_width, 160);
            const h = isIMC ? this._num(this._config.imc_height, 97) : this._num(this._config.b_height, 69);
            return `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%; width:${w}px; height:${h}px;">
              <div id="spark-${i}" class="sparkline-container"></div>
              <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
              <div style="font-size:10px; color:#cbd5e1; font-weight:bold;">${s.name}</div>
              <div id="value-${i}" style="font-weight:900; font-size:1.1em;">--</div>
              <div id="time-${i}" class="time-text">--</div>
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
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  render() {
    if (!this._config || !this._hass) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey] || { name: "Nouveau", sensors: [] };
    this.innerHTML = `
      <style>
        .ed-box { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; font-size: 13px; }
        .section { background: #252525; padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid #444; }
        .tab-menu { display: flex; gap: 8px; margin-bottom: 20px; }
        .t-btn { flex: 1; padding: 10px; background: #222; color: #888; border: 2px solid #444; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .t-btn.active { border-color: #38bdf8; color: white; background: #38bdf8; }
        label { color: #38bdf8; font-size: 10px; font-weight: bold; display: block; margin-top: 8px; text-transform: uppercase; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; box-sizing: border-box; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .s-card { background: #111; padding: 10px; margin-bottom: 10px; border-left: 4px solid #38bdf8; position: relative; }
        .del-btn { position: absolute; top: 5px; right: 5px; background: #f87171; color: white; border: none; border-radius: 3px; cursor: pointer; padding: 2px 6px; }
      </style>
      <div class="ed-box">
        <div class="tab-menu">
            <button class="t-btn ${pKey==='person1'?'active':''}" id="t-p1">${(this._config.person1||{}).name || 'P1'}</button>
            <button class="t-btn ${pKey==='person2'?'active':''}" id="t-p2">${(this._config.person2||{}).name || 'P2'}</button>
        </div>
        <div class="section">
            <label>NOM & OBJECTIFS</label>
            <input type="text" id="inp-name" value="${p.name || ''}">
            <div class="grid-2">
                <div><label>OBJECTIF PAS</label><input type="number" id="inp-sgoal" value="${p.step_goal || 10000}"></div>
                <div><label>IMAGE URL</label><input type="text" id="inp-img" value="${p.image || ''}"></div>
            </div>
            <div class="grid-3">
                <div><label>DÉPART (KG)</label><input type="number" id="inp-start" value="${p.start || 0}"></div>
                <div><label>CONFORT (KG)</label><input type="number" id="inp-goal" value="${p.goal || 0}"></div>
                <div><label>IDÉAL (KG)</label><input type="number" id="inp-ideal" value="${p.ideal || 0}"></div>
            </div>
        </div>
        <div class="section">
            <label>POSITIONS & DIMENSIONS</label>
            <div class="grid-2">
                <div><label>BOUTONS X %</label><input type="number" id="inp-bx" value="${this._config.btn_x || 5}"></div>
                <div><label>BOUTONS Y %</label><input type="number" id="inp-by" value="${this._config.btn_y || 3}"></div>
            </div>
            <label>HAUTEUR CARTE</label><input type="number" id="inp-ch" value="${this._config.card_height || 600}">
            <div class="grid-2">
              <div><label>LARG. STANDARD</label><input type="number" id="inp-bw" value="${this._config.b_width || 160}"></div>
              <div><label>HAUT. STANDARD</label><input type="number" id="inp-bh" value="${this._config.b_height || 69}"></div>
              <div><label>LARG. IMC/CORP.</label><input type="number" id="inp-iw" value="${this._config.imc_width || 250}"></div>
              <div><label>HAUT. IMC/CORP.</label><input type="number" id="inp-ih" value="${this._config.imc_height || 97}"></div>
            </div>
        </div>
        <div class="section">
            <label>VOS CAPTEURS</label>
            <div id="sensors-container">
            ${(p.sensors || []).map((s, i) => `
              <div class="s-card">
                <button class="del-btn" data-idx="${i}">X</button>
                <label>NOM</label><input type="text" class="s-name" data-idx="${i}" value="${s.name}">
                <label>ENTITÉ</label><input type="text" class="s-ent" data-idx="${i}" value="${s.entity}">
                <div class="grid-3">
                    <div><label>ICÔNE</label><input type="text" class="s-icon" data-idx="${i}" value="${s.icon || ''}"></div>
                    <div><label>X %</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div>
                    <div><label>Y %</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div>
                </div>
              </div>
            `).join('')}
            </div>
            <button style="width:100%; padding:10px; background:#4ade80; border:none; border-radius:4px; font-weight:bold; cursor:pointer;" id="add-sensor">➕ AJOUTER UN CAPTEUR</button>
        </div>
      </div>
    `;
    this.querySelector('#t-p1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#t-p2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
    this.querySelector('#inp-name').onchange = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#inp-sgoal').onchange = (e) => { this._config[pKey].step_goal = e.target.value; this._fire(); };
    this.querySelector('#inp-img').onchange = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    this.querySelector('#inp-start').onchange = (e) => { this._config[pKey].start = e.target.value; this._fire(); };
    this.querySelector('#inp-goal').onchange = (e) => { this._config[pKey].goal = e.target.value; this._fire(); };
    this.querySelector('#inp-ideal').onchange = (e) => { this._config[pKey].ideal = e.target.value; this._fire(); };
    this.querySelector('#inp-bx').onchange = (e) => { this._config.btn_x = e.target.value; this._fire(); };
    this.querySelector('#inp-by').onchange = (e) => { this._config.btn_y = e.target.value; this._fire(); };
    this.querySelector('#inp-ch').onchange = (e) => { this._config.card_height = e.target.value; this._fire(); };
    this.querySelector('#inp-bw').onchange = (e) => { this._config.b_width = e.target.value; this._fire(); };
    this.querySelector('#inp-bh').onchange = (e) => { this._config.b_height = e.target.value; this._fire(); };
    this.querySelector('#inp-iw').onchange = (e) => { this._config.imc_width = e.target.value; this._fire(); };
    this.querySelector('#inp-ih').onchange = (e) => { this._config.imc_height = e.target.value; this._fire(); };
    this.querySelectorAll('.s-name').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.s-ent').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.s-icon').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].icon = e.target.value; this._fire(); });
    this.querySelectorAll('.s-x').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.s-y').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].y = e.target.value; this._fire(); });
    this.querySelector('#add-sensor').onclick = () => { 
        if (!this._config[pKey].sensors) this._config[pKey].sensors = [];
        this._config[pKey].sensors.push({ name: "Nouveau", entity: "", icon: "mdi:heart", x: 50, y: 50 }); 
        this._fire(); this.render(); 
    };
    this.querySelectorAll('.del-btn').forEach(btn => btn.onclick = (e) => { this._config[pKey].sensors.splice(e.target.dataset.idx, 1); this._fire(); this.render(); });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V80.1" });
