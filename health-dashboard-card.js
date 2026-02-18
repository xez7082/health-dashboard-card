/**
 * HEALTH DASHBOARD CARD – V80.6 (ULTRA-STABLE & DESIGN)
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
    
    // Initialisation sécurisée
    const base = { name: "Nouveau", sensors: [], start: 0, goal: 0, ideal: 0, step_goal: 10000, image: "" };
    if (!this._config.person1) this._config.person1 = { ...base, name: "Patrick" };
    if (!this._config.person2) this._config.person2 = { ...base, name: "Sandra" };
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
    const diff = Math.floor((new Date() - new Date(lastChanged)) / 1000);
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

    // Mise à jour de la réglette poids
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    if (stPoids && progPointer) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const pct = range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0;
        progPointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        const labelEl = this.shadowRoot.getElementById('pointer-label');
        if (labelEl) labelEl.textContent = `${actuel} kg`;
    }

    // Mise à jour des capteurs personnalisés
    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const timeEl = this.shadowRoot.getElementById(`time-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (stateObj) {
                if (valEl) valEl.textContent = `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`;
                if (timeEl) timeEl.textContent = this._getRelativeTime(stateObj.last_changed);
            }
        });
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    const accentColor = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._num(this._config.card_height, 600)}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center center; background-size: cover; opacity: 0.4; z-index: 1; background-image: url('${pData.image}'); }
        .topbar { position: absolute; left: 5%; top: 3%; display: flex; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 11px; }
        .btn.active { background: ${accentColor} !important; box-shadow: 0 0 15px ${accentColor}; }
        .rule-container { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 85%; height: 75px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 10px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 5px; margin-top: 30px; }
        .prog-pointer { position: absolute; top: -12px; width: 3px; height: 34px; background: white; transition: left 1s ease; }
        .pointer-info { position: absolute; top: -26px; left: 50%; transform: translateX(-50%); background: white; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; color: #000; white-space: nowrap; }
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 8px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); padding: 10px; text-align: center; backdrop-filter: blur(5px); }
        .time-text { font-size: 8px; color: #94a3b8; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="bg-img"></div>
        <div class="rule-container">
            <div class="rule-track">
                <div id="progression-pointer" class="prog-pointer"><div id="pointer-label" class="pointer-info">--</div></div>
            </div>
        </div>
        ${(pData.sensors || []).map((s, i) => `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%;">
              <div style="font-size:10px; color:${accentColor}; font-weight:bold;">${s.name}</div>
              <div id="value-${i}" style="font-weight:900;">--</div>
              <div id="time-${i}" class="time-text">--</div>
            </div>`).join('')}
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }

  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];
    this.innerHTML = `
      <div style="padding: 10px; background: #222; color: white;">
        <h3>Éditeur ${p.name}</h3>
        <label>Nom</label><br><input id="ed-name" type="text" value="${p.name}" style="width:100%"><br>
        <label>Image URL</label><br><input id="ed-img" type="text" value="${p.image}" style="width:100%"><br>
        <button id="add-s" style="margin-top:10px; width:100%">➕ Ajouter un capteur</button>
      </div>
    `;
    this.querySelector('#ed-name').oninput = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#ed-img').oninput = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    this.querySelector('#add-s').onclick = () => {
        if (!this._config[pKey].sensors) this._config[pKey].sensors = [];
        this._config[pKey].sensors.push({ name: "Nouveau", entity: "", x: 50, y: 50 });
        this._fire(); this.render();
    };
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V80.6" });
