/**
 * HEALTH DASHBOARD CARD – V81.1 (FULL VISUAL EDITION)
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
    const conf = JSON.parse(JSON.stringify(config));
    
    // Initialisation automatique des données par défaut
    const defaultPerson = { name: "Nouveau", sensors: [], start: 0, goal: 0, ideal: 0, image: "" };
    if (!conf.person1) conf.person1 = { ...defaultPerson, name: "Patrick" };
    if (!conf.person2) conf.person2 = { ...defaultPerson, name: "Sandra" };
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

    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const pointer = this.shadowRoot.getElementById('progression-pointer');
    if (stPoids && pointer) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const pct = range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0;
        pointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        const label = this.shadowRoot.getElementById('pointer-label');
        if (label) label.textContent = `${actuel} kg`;
    }

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
        .main { position: relative; width: 100%; height: ${this._num(this._config.card_height, 600)}px; background: #0f172a; border-radius: 15px; overflow: hidden; color: white; font-family: sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${pData.image}') center/cover; opacity: 0.35; z-index: 1; }
        .topbar { position: absolute; top: 20px; left: 20px; display: flex; gap: 12px; z-index: 10; }
        .btn { padding: 10px 20px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-weight: bold; }
        .btn.active { background: ${accent}; border-color: ${accent}; box-shadow: 0 0 15px ${accent}; }
        .rule-bg { position: absolute; bottom: 50px; left: 10%; width: 80%; height: 10px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 5px; z-index: 5; }
        .pointer { position: absolute; top: -12px; width: 4px; height: 34px; background: white; transition: left 1s; border-radius: 2px; }
        .label { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 8px; border-radius: 5px; font-size: 13px; font-weight: 900; white-space: nowrap; }
        .sensor-box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 12px; backdrop-filter: blur(8px); text-align: center; min-width: 90px; z-index: 5; }
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
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  render() {
    if (!this._config) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <style>
        .ed-section { background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-family: sans-serif; }
        .ed-title { color: #03a9f4; margin-top: 0; border-bottom: 2px solid #03a9f4; padding-bottom: 5px; }
        .field { margin-bottom: 12px; }
        label { display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #555; }
        input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        .sensor-card { background: #fff; border: 1px solid #eee; padding: 10px; margin-top: 10px; border-left: 4px solid #03a9f4; position: relative; }
        .btn-add { width: 100%; padding: 10px; background: #4caf50; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        .btn-del { position: absolute; top: 5px; right: 5px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; padding: 2px 5px; }
        .grid { display: flex; gap: 10px; }
      </style>

      <div class="ed-section">
        <h3 class="ed-title">Configuration Globale</h3>
        <div class="field">
          <label>Hauteur de la carte (pixels)</label>
          <input type="number" id="gl-height" value="${this._config.card_height}">
        </div>
      </div>

      <div class="ed-section">
        <h3 class="ed-title">Profil : ${p.name}</h3>
        <div class="field"><label>Nom</label><input type="text" id="p-name" value="${p.name}"></div>
        <div class="field"><label>Image URL</label><input type="text" id="p-img" value="${p.image}"></div>
        <div class="grid">
          <div class="field"><label>Poids Départ</label><input type="number" id="p-start" value="${p.start}"></div>
          <div class="field"><label>Objectif</label><input type="number" id="p-goal" value="${p.goal}"></div>
          <div class="field"><label>Idéal</label><input type="number" id="p-ideal" value="${p.ideal}"></div>
        </div>
      </div>

      <div class="ed-section">
        <h3 class="ed-title">Capteurs sur l'image</h3>
        <div id="sensors-container">
          ${(p.sensors || []).map((s, i) => `
            <div class="sensor-card">
              <button class="btn-del" data-idx="${i}">Supprimer</button>
              <div class="field"><label>Titre</label><input type="text" class="s-name" data-idx="${i}" value="${s.name}"></div>
              <div class="field"><label>Entité (sensor.xxx)</label><input type="text" class="s-ent" data-idx="${i}" value="${s.entity}"></div>
              <div class="grid">
                <div class="field"><label>Position X (%)</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div>
                <div class="field"><label>Position Y (%)</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div>
              </div>
            </div>
          `).join('')}
        </div>
        <button id="btn-add-sensor" class="btn-add">➕ Ajouter un Capteur</button>
      </div>
    `;

    // Events Globaux
    this.querySelector('#gl-height').onchange = (e) => { this._config.card_height = e.target.value; this._fire(); };
    this.querySelector('#p-name').onchange = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#p-img').onchange = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    this.querySelector('#p-start').onchange = (e) => { this._config[pKey].start = e.target.value; this._fire(); };
    this.querySelector('#p-goal').onchange = (e) => { this._config[pKey].goal = e.target.value; this._fire(); };
    this.querySelector('#p-ideal').onchange = (e) => { this._config[pKey].ideal = e.target.value; this._fire(); };

    // Events Capteurs
    this.querySelectorAll('.s-name').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.s-ent').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.s-x').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.s-y').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].y = e.target.value; this._fire(); });

    this.querySelector('#btn-add-sensor').onclick = () => {
        if(!this._config[pKey].sensors) this._config[pKey].sensors = [];
        this._config[pKey].sensors.push({ name: "Nouveau", entity: "", x: 50, y: 50 });
        this._fire(); this.render();
    };

    this.querySelectorAll('.btn-del').forEach(el => el.onclick = (e) => {
        this._config[pKey].sensors.splice(e.target.dataset.idx, 1);
        this._fire(); this.render();
    });
  }

  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V81.1" });
