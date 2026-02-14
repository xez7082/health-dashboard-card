// HEALTH DASHBOARD CARD – VERSION 45 (RECOVERY EDITION)
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

  updateSensors() {
    if (!this._hass || !this.shadowRoot) return;
    const suffix = this._config.current_view === 'person2' ? '_sandra' : '_patrick';
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const stGoal = this._hass.states['sensor.withings_weight_goal' + (this._config.current_view === 'person2' ? '_2' : '')];
    
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    const comfortMarker = this.shadowRoot.getElementById('marker-comfort');

    if (stPoids && progPointer) {
        const actuel = parseFloat(stPoids.state);
        const depart = parseFloat(this._config.start_weight || 156);
        const confort = parseFloat(this._config.comfort_weight || 95);
        const final = stGoal ? parseFloat(stGoal.state) : 80;
        
        const totalRange = depart - final;
        const getPos = (val) => {
            let p = ((depart - val) / totalRange) * 100;
            return Math.max(0, Math.min(100, p));
        };

        progPointer.style.left = `${getPos(actuel)}%`;
        progPointer.setAttribute('data-val', `${actuel}kg`);
        if (comfortMarker) comfortMarker.style.left = `${getPos(confort)}%`;
    }

    const person = this._config[this._config.current_view];
    if (person && person.sensors) {
        person.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (valEl && stateObj) valEl.textContent = `${stateObj.state}${stateObj.attributes.unit_of_measurement || ''}`;
        });
    }
  }

  render() {
    if (!this._config) return;
    const personKey = this._config.current_view;
    const person = this._config[personKey] || { sensors: [] };

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${person.image || ""}') center ${this._config.img_offset || 0}% / cover no-repeat; opacity: 0.4; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.5); color: white; cursor: pointer; font-size: 11px; }
        .btn.active { background: #38bdf8; }
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 85%; height: 70px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 30px; border: 1px solid rgba(255,255,255,0.2); }
        .prog-pointer { position: absolute; top: -15px; width: 4px; height: 35px; background: #38bdf8; transition: left 1s ease; border-radius: 2px; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
        .sensor { position: absolute; transform: translate(-50%, -50%); width: ${this._config.b_width || 160}px; height: ${this._config.b_height || 69}px; border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${personKey==='person1'?'active':''}">${this._config.person1?.name || 'P1'}</button>
          <button id="bt2" class="btn ${personKey==='person2'?'active':''}">${this._config.person2?.name || 'P2'}</button>
        </div>
        <div class="bg"></div>
        <div class="rule-container"><div class="rule-track"><div id="marker-comfort" style="position:absolute; width:2px; height:12px; background:orange;"></div><div id="progression-pointer" class="prog-pointer" data-val="--"></div></div></div>
        ${(person.sensors || []).map((s, i) => `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%">
              <ha-icon icon="${s.icon || 'mdi:heart'}" style="color:${s.color || '#38bdf8'}"></ha-icon>
              <div style="font-size:10px;">${s.name || ''}</div>
              <div id="value-${i}" style="font-weight:bold;">--</div>
            </div>
        `).join('')}
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); };
    this.updateSensors();
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

// EDITOR V45 - PLUS ROBUSTE
class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }
  render() {
    if (!this._config) return;
    const view = this._config.current_view || 'person1';
    const sensors = this._config[view]?.sensors || [];

    this.innerHTML = `
      <div style="padding:10px; color:white; background:#1c1c1c; font-family:sans-serif;">
        <h3 style="color:#38bdf8;">Configuration</h3>
        
        <label>Vue Actuelle</label>
        <select id="view-select" style="width:100%; padding:8px; margin-bottom:15px;">
            <option value="person1" ${view === 'person1' ? 'selected' : ''}>${this._config.person1?.name || 'Patrick'}</option>
            <option value="person2" ${view === 'person2' ? 'selected' : ''}>${this._config.person2?.name || 'Sandra'}</option>
        </select>

        <div style="background:#333; padding:10px; border-radius:5px; margin-bottom:15px;">
            <label>Poids Départ (kg)</label>
            <input type="number" id="sw" value="${this._config.start_weight || 156}" style="width:100%;">
            <label>Poids Confort (kg)</label>
            <input type="number" id="cw" value="${this._config.comfort_weight || 95}" style="width:100%;">
        </div>

        <h4>Capteurs (${view})</h4>
        <div id="sensor-list">
          ${sensors.map((s, i) => `
            <div style="border:1px solid #555; padding:8px; margin-bottom:10px;">
                <label>Nom</label><input type="text" class="edit-name" data-idx="${i}" value="${s.name || ''}" style="width:100%;">
                <label>Entité</label><input type="text" class="edit-ent" data-idx="${i}" value="${s.entity || ''}" style="width:100%;">
                <div style="display:flex; gap:5px;">
                    <div><label>X%</label><input type="number" class="edit-x" data-idx="${i}" value="${s.x || 0}" style="width:100%;"></div>
                    <div><label>Y%</label><input type="number" class="edit-y" data-idx="${i}" value="${s.y || 0}" style="width:100%;"></div>
                </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.querySelector('#view-select').onchange = (e) => { this._config.current_view = e.target.value; this._fire(); };
    this.querySelector('#sw').onchange = (e) => { this._config.start_weight = e.target.value; this._fire(); };
    this.querySelector('#cw').onchange = (e) => { this._config.comfort_weight = e.target.value; this._fire(); };
    
    this.querySelectorAll('.edit-name').forEach(el => el.onchange = (e) => { 
        this._config[view].sensors[el.dataset.idx].name = e.target.value; this._fire(); 
    });
    this.querySelectorAll('.edit-ent').forEach(el => el.onchange = (e) => { 
        this._config[view].sensors[el.dataset.idx].entity = e.target.value; this._fire(); 
    });
    this.querySelectorAll('.edit-x').forEach(el => el.onchange = (e) => { 
        this._config[view].sensors[el.dataset.idx].x = e.target.value; this._fire(); 
    });
    this.querySelectorAll('.edit-y').forEach(el => el.onchange = (e) => { 
        this._config[view].sensors[el.dataset.idx].y = e.target.value; this._fire(); 
    });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V45" });
