/**
 * HEALTH DASHBOARD CARD – V81.2 (ANTI-CRASH)
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = this._ensureConfig(config);
    this.render();
  }

  // Empêche l'erreur "Cannot read properties of undefined"
  _ensureConfig(config) {
    const conf = JSON.parse(JSON.stringify(config || {}));
    const base = { name: "Patrick", sensors: [], start: 0, goal: 0, ideal: 0, image: "" };
    if (!conf.person1) conf.person1 = { ...base };
    if (!conf.person2) conf.person2 = { ...base, name: "Sandra" };
    if (!conf.current_view) conf.current_view = 'person1';
    if (!conf.card_height) conf.card_height = 600;
    return conf;
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
        const actual = parseFloat(stPoids.state) || 0;
        const pointer = this.shadowRoot.getElementById('progression-pointer');
        const range = (parseFloat(pData.start) || 0) - (parseFloat(pData.ideal) || 0);
        const pct = range !== 0 ? ((parseFloat(pData.start) - actual) / range) * 100 : 0;
        if (pointer) pointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        const label = this.shadowRoot.getElementById('pointer-label');
        if (label) label.textContent = `${actual} kg`;
    }

    (pData.sensors || []).forEach((s, i) => {
        const stateObj = this._hass.states[s.entity];
        const vEl = this.shadowRoot.getElementById(`value-${i}`);
        if (stateObj && vEl) vEl.textContent = `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`;
    });
  }

  render() {
    const view = this._config.current_view;
    const pData = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height}px; background: #0f172a; border-radius: 15px; overflow: hidden; color: white; font-family: sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${pData.image}') center/cover; opacity: 0.3; }
        .topbar { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 10; }
        .btn { padding: 10px 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: white; cursor: pointer; font-size: 12px; font-weight: bold; }
        .btn.active { background: ${accent}; border-color: ${accent}; box-shadow: 0 0 10px ${accent}; }
        .rule { position: absolute; bottom: 40px; left: 10%; width: 80%; height: 8px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 4px; }
        .pointer { position: absolute; top: -10px; width: 3px; height: 30px; background: white; transition: left 1s; }
        .label { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .sensor { position: absolute; transform: translate(-50%, -50%); background: rgba(15,23,42,0.8); padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px); text-align: center; min-width: 100px; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="topbar">
          <button id="b1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="b2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="rule">
          <div id="progression-pointer" class="pointer"><div id="pointer-label" class="label">-- kg</div></div>
        </div>
        ${(pData.sensors || []).map((s, i) => `
          <div class="sensor" style="left:${s.x}%; top:${s.y}%;">
            <div style="font-size:10px; color:${accent}; font-weight:bold;">${s.name}</div>
            <div id="value-${i}" style="font-size:1.2em; font-weight:bold;">--</div>
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
    this._config = this._ensureConfig(config);
    this.render();
  }

  _ensureConfig(config) {
    const conf = JSON.parse(JSON.stringify(config || {}));
    if (!conf.person1) conf.person1 = { name: "Patrick", sensors: [], start: 0, goal: 0, ideal: 0, image: "" };
    if (!conf.person2) conf.person2 = { name: "Sandra", sensors: [], start: 0, goal: 0, ideal: 0, image: "" };
    return conf;
  }

  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <div style="padding: 10px; color: #333; font-family: sans-serif;">
        <h3 style="color:#03a9f4; border-bottom:1px solid #03a9f4;">Configuration de ${p.name}</h3>
        
        <div style="margin-top:10px;"><label>Nom</label><br><input type="text" id="n" value="${p.name}" style="width:100%; padding:5px;"></div>
        <div style="margin-top:10px;"><label>Image URL</label><br><input type="text" id="img" value="${p.image}" style="width:100%; padding:5px;"></div>
        
        <div style="display:flex; gap:10px; margin-top:10px;">
          <div><label>Départ</label><br><input type="number" id="s" value="${p.start}" style="width:100%; padding:5px;"></div>
          <div><label>Objectif</label><br><input type="number" id="g" value="${p.goal}" style="width:100%; padding:5px;"></div>
          <div><label>Idéal</label><br><input type="number" id="i" value="${p.ideal}" style="width:100%; padding:5px;"></div>
        </div>

        <h4 style="margin-top:20px; border-bottom:1px solid #ccc;">Capteurs</h4>
        <div id="sensors">
          ${(p.sensors || []).map((s, idx) => `
            <div style="background:#eee; padding:10px; margin-top:5px; border-radius:5px; position:relative;">
              <button class="del" data-idx="${idx}" style="position:absolute; right:5px; top:5px; background:red; color:white; border:none; border-radius:3px; cursor:pointer;">X</button>
              <label>Titre</label><br><input type="text" class="sn" data-idx="${idx}" value="${s.name}" style="width:100%;"><br>
              <label>Entité</label><br><input type="text" class="se" data-idx="${idx}" value="${s.entity}" style="width:100%;">
            </div>
          `).join('')}
        </div>
        <button id="add" style="width:100%; padding:10px; margin-top:10px; background:#4caf50; color:white; border:none; border-radius:5px; cursor:pointer;">➕ AJOUTER UN CAPTEUR</button>
      </div>
    `;

    // Events
    this.querySelector('#n').onchange = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#img').onchange = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    this.querySelector('#s').onchange = (e) => { this._config[pKey].start = e.target.value; this._fire(); };
    this.querySelector('#g').onchange = (e) => { this._config[pKey].goal = e.target.value; this._fire(); };
    this.querySelector('#i').onchange = (e) => { this._config[pKey].ideal = e.target.value; this._fire(); };
    
    this.querySelectorAll('.sn').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.se').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });

    this.querySelector('#add').onclick = () => {
      if(!this._config[pKey].sensors) this._config[pKey].sensors = [];
      this._config[pKey].sensors.push({ name: "Nouveau", entity: "", x: 50, y: 50 });
      this._fire(); this.render();
    };

    this.querySelectorAll('.del').forEach(el => el.onclick = (e) => {
      this._config[pKey].sensors.splice(e.target.dataset.idx, 1);
      this._fire(); this.render();
    });
  }

  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V81.2" });
