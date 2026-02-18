/**
 * HEALTH DASHBOARD CARD – V80.8 (VERSION FINALE SÉCURISÉE)
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    // Filet de sécurité pour les données manquantes
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

  async updateSensors() {
    if (!this._hass || !this.shadowRoot) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    // 1. Poids & Réglette
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    if (stPoids) {
        const actuel = this._num(stPoids.state);
        const range = this._num(pData.start) - this._num(pData.ideal);
        const pct = range !== 0 ? ((this._num(pData.start) - actuel) / range) * 100 : 0;
        const pointer = this.shadowRoot.getElementById('progression-pointer');
        if (pointer) pointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        const label = this.shadowRoot.getElementById('pointer-label');
        if (label) label.textContent = `${actuel} kg`;
    }

    // 2. Capteurs & Graphiques
    if (pData.sensors) {
        pData.sensors.forEach(async (s, i) => {
            const stateObj = this._hass.states[s.entity];
            if (stateObj) {
                const vEl = this.shadowRoot.getElementById(`value-${i}`);
                const tEl = this.shadowRoot.getElementById(`time-${i}`);
                if (vEl) vEl.textContent = `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`;
                if (tEl) tEl.textContent = this._getRelativeTime(stateObj.last_changed);
                this._renderSparkline(s.entity, i, view === 'person1' ? '#38bdf8' : '#f43f5e');
            }
        });
    }
  }

  async _renderSparkline(entity, i, color) {
    try {
      const hist = await this._hass.callApi('GET', `history/period/${new Date(Date.now()-86400000).toISOString()}?filter_entity_id=${entity}`);
      if (!hist || !hist[0] || hist[0].length < 2) return;
      const points = hist[0].map(e => parseFloat(e.state)).filter(v => !isNaN(v));
      const min = Math.min(...points); const max = Math.max(...points); const range = max - min || 1;
      const coords = points.map((p, idx) => `${(idx / (points.length - 1)) * 100},${30 - ((p - min) / range) * 30}`).join(' ');
      const spark = this.shadowRoot.getElementById(`spark-${i}`);
      if (spark) spark.innerHTML = `<svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline fill="none" stroke="${color}" stroke-width="2" opacity="0.4" points="${coords}" /></svg>`;
    } catch (e) {}
  }

  render() {
    const view = this._config.current_view;
    const pData = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .container { position: relative; width: 100%; height: ${this._num(this._config.card_height, 600)}px; background: #0f172a; border-radius: 12px; overflow: hidden; color: white; font-family: sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${pData.image}') center/cover; opacity: 0.3; }
        .topbar { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 10; }
        .btn { padding: 8px 15px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: white; cursor: pointer; font-size: 12px; }
        .btn.active { background: ${accent}; border-color: ${accent}; box-shadow: 0 0 10px ${accent}; }
        .rule { position: absolute; bottom: 40px; left: 10%; width: 80%; height: 8px; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 4px; }
        .pointer { position: absolute; top: -10px; width: 3px; height: 30px; background: white; transition: left 1s; }
        .label { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; white-space: nowrap; }
        .sensor { position: absolute; transform: translate(-50%, -50%); background: rgba(15,23,42,0.85); padding: 10px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px); text-align: center; min-width: 120px; }
        .spark { position: absolute; bottom: 0; left: 0; width: 100%; height: 30px; pointer-events: none; }
        .time { font-size: 8px; color: #94a3b8; }
      </style>
      <div class="container">
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
                <div class="spark" id="spark-${i}"></div>
                <div style="font-size:10px; font-weight:bold; color:${accent}">${s.name}</div>
                <div id="value-${i}" style="font-size:1.2em; font-weight:bold;">--</div>
                <div id="time-${i}" class="time">--</div>
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
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }

  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];
    this.innerHTML = `
      <style>
        .ed-container { padding: 15px; color: #333; }
        .row { margin-bottom: 10px; }
        label { font-size: 11px; font-weight: bold; color: #38bdf8; display: block; }
        input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        .sensor-edit { background: #f9f9f9; padding: 10px; margin-top: 10px; border-left: 3px solid #38bdf8; position: relative; }
      </style>
      <div class="ed-container">
        <h3>Configuration : ${p.name}</h3>
        <div class="row"><label>Nom</label><input type="text" id="ed-name" value="${p.name}"></div>
        <div class="row"><label>Image URL</label><input type="text" id="ed-img" value="${p.image}"></div>
        <div style="display:flex; gap:5px;" class="row">
            <div><label>Départ</label><input type="number" id="ed-start" value="${p.start}"></div>
            <div><label>Confort</label><input type="number" id="ed-goal" value="${p.goal}"></div>
            <div><label>Idéal</label><input type="number" id="ed-ideal" value="${p.ideal}"></div>
        </div>
        <div class="row"><label>Hauteur Carte (px)</label><input type="number" id="ed-h" value="${this._config.card_height || 600}"></div>
        
        <hr>
        <h4>Capteurs</h4>
        <div id="sensors-list">
            ${(p.sensors || []).map((s, i) => `
                <div class="sensor-edit">
                    <label>Nom</label><input type="text" class="s-name" data-idx="${i}" value="${s.name}">
                    <label>Entité</label><input type="text" class="s-ent" data-idx="${i}" value="${s.entity}">
                    <div style="display:flex; gap:5px;">
                        <div><label>X %</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div>
                        <div><label>Y %</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        <button id="add-sensor" style="width:100%; padding:10px; margin-top:10px; background:#4ade80; border:none; color:white; font-weight:bold; cursor:pointer;">➕ AJOUTER UN CAPTEUR</button>
      </div>
    `;

    this.querySelector('#ed-name').onchange = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#ed-img').onchange = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    this.querySelector('#ed-start').onchange = (e) => { this._config[pKey].start = e.target.value; this._fire(); };
    this.querySelector('#ed-goal').onchange = (e) => { this._config[pKey].goal = e.target.value; this._fire(); };
    this.querySelector('#ed-ideal').onchange = (e) => { this._config[pKey].ideal = e.target.value; this._fire(); };
    this.querySelector('#ed-h').onchange = (e) => { this._config.card_height = e.target.value; this._fire(); };

    this.querySelectorAll('.s-name').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.s-ent').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.s-x').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.s-y').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].y = e.target.value; this._fire(); });

    this.querySelector('#add-sensor').onclick = () => {
        if(!this._config[pKey].sensors) this._config[pKey].sensors = [];
        this._config[pKey].sensors.push({ name: "Nouveau", entity: "", x: 50, y: 50 });
        this._fire(); this.render();
    };
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V80.8" });
