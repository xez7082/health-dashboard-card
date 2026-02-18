/**
 * HEALTH DASHBOARD CARD – V81.0 (ANTI-CRASH EDITION)
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    
    // CLONAGE ET SECURISATION DES DONNEES
    const conf = JSON.parse(JSON.stringify(config));
    
    // Création automatique des blocs si absents du YAML
    if (!conf.person1) conf.person1 = { name: "Patrick", sensors: [], start: 0, goal: 0, ideal: 0, image: "" };
    if (!conf.person2) conf.person2 = { name: "Sandra", sensors: [], start: 0, goal: 0, ideal: 0, image: "" };
    if (!conf.current_view) conf.current_view = 'person1';
    if (!conf.card_height) conf.card_height = 600;

    this._config = conf;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  _num(val, def = 0) { const n = parseFloat(val); return isNaN(n) ? def : n; }

  updateSensors() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    // Mise à jour Poids
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const pointer = this.shadowRoot.getElementById('progression-pointer');
    if (stPoids && pointer) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const pct = range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0;
        pointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        this.shadowRoot.getElementById('pointer-label').textContent = `${actuel} kg`;
    }

    // Mise à jour Capteurs
    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const stateObj = this._hass.states[s.entity];
            const vEl = this.shadowRoot.getElementById(`value-${i}`);
            if (stateObj && vEl) {
                vEl.textContent = `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`;
            }
        });
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._num(this._config.card_height, 600)}px; background: #0f172a; border-radius: 15px; overflow: hidden; color: white; font-family: 'Segoe UI', sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${pData.image}') center/cover; opacity: 0.35; z-index: 1; transition: background 0.5s; }
        .topbar { position: absolute; top: 20px; left: 20px; display: flex; gap: 12px; z-index: 10; }
        .btn { padding: 10px 20px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-weight: bold; backdrop-filter: blur(5px); }
        .btn.active { background: ${accent}; border-color: ${accent}; box-shadow: 0 0 15px ${accent}; }
        .rule-bg { position: absolute; bottom: 50px; left: 10%; width: 80%; height: 10px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 5px; z-index: 5; }
        .pointer { position: absolute; top: -12px; width: 4px; height: 34px; background: white; transition: left 1s cubic-bezier(0.17, 0.67, 0.83, 0.67); border-radius: 2px; }
        .label { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 8px; border-radius: 5px; font-size: 13px; font-weight: 900; white-space: nowrap; }
        .sensor-box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 12px; backdrop-filter: blur(8px); text-align: center; min-width: 100px; z-index: 5; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="topbar">
          <button id="b1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="b2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="rule-bg">
          <div id="progression-pointer" class="pointer"><div id="pointer-label" class="label">-- kg</div></div>
        </div>
        ${(pData.sensors || []).map((s, i) => `
          <div class="sensor-box" style="left:${s.x}%; top:${s.y}%;">
            <div style="font-size:11px; color:${accent}; font-weight:bold; margin-bottom:4px;">${s.name}</div>
            <div id="value-${i}" style="font-size:1.3em; font-weight:bold;">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('b1').onclick = () => { this._config.current_view='person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('b2').onclick = () => { this._config.current_view='person2'; this._fire(); this.render(); };
  }

  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  render() {
    if (!this._config) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey] || { name: "", sensors: [] };

    this.innerHTML = `
      <div style="padding: 15px; background: #f4f4f4; color: #333; border-radius: 8px; font-family: sans-serif;">
        <h3 style="color: #03a9f4;">Modifier ${p.name}</h3>
        <div style="margin-bottom: 10px;">
          <label style="display:block; font-weight:bold;">Nom du profil</label>
          <input type="text" id="ed-name" value="${p.name}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="margin-bottom: 10px;">
          <label style="display:block; font-weight:bold;">Image de fond (URL)</label>
          <input type="text" id="ed-img" value="${p.image || ''}" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div style="display:flex; gap:10px; margin-bottom:10px;">
          <div style="flex:1;"><label style="font-size:11px;">Poids Départ</label><input type="number" id="ed-start" value="${p.start}" style="width:100%; padding:5px;"></div>
          <div style="flex:1;"><label style="font-size:11px;">Objectif</label><input type="number" id="ed-goal" value="${p.goal}" style="width:100%; padding:5px;"></div>
          <div style="flex:1;"><label style="font-size:11px;">Idéal</label><input type="number" id="ed-ideal" value="${p.ideal}" style="width:100%; padding:5px;"></div>
        </div>
        <button id="add-s" style="width:100%; padding:10px; background:#4caf50; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">➕ AJOUTER UN CAPTEUR</button>
      </div>
    `;

    this.querySelector('#ed-name').onchange = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#ed-img').onchange = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    this.querySelector('#ed-start').onchange = (e) => { this._config[pKey].start = e.target.value; this._fire(); };
    this.querySelector('#ed-goal').onchange = (e) => { this._config[pKey].goal = e.target.value; this._fire(); };
    this.querySelector('#ed-ideal').onchange = (e) => { this._config[pKey].ideal = e.target.value; this._fire(); };
    
    this.querySelector('#add-s').onclick = () => {
        if(!this._config[pKey].sensors) this._config[pKey].sensors = [];
        this._config[pKey].sensors.push({ name: "Nouveau", entity: "", x: 50, y: 50 });
        this._fire(); this.render();
    };
  }

  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V81.0" });
