/**
 * HEALTH DASHBOARD CARD – V84.0 (PRECISION EDITION)
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config || {}));
    const base = { name: "Patrick", sensors: [], start: 90, goal: 80, ideal: 75, height: 175, image: "" };
    if (!this._config.person1) this._config.person1 = { ...base };
    if (!this._config.person2) this._config.person2 = { ...base, name: "Sandra" };
    if (!this._config.current_view) this._config.current_view = 'person1';
    if (!this._config.card_height) this._config.card_height = 600;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateData();
  }

  updateData() {
    if (!this._hass || !this.shadowRoot) return;
    const view = this._config.current_view;
    const p = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';
    const stateObj = this._hass.states['sensor.withings_poids' + suffix];

    if (stateObj) {
        const actuel = parseFloat(stateObj.state) || 0;
        const perte = (p.start - actuel).toFixed(1);
        
        // Update Perte de poids
        const perteEl = this.shadowRoot.getElementById('val-perte');
        if (perteEl) perteEl.textContent = (perte > 0 ? "-" : "+") + Math.abs(perte) + " kg";

        // Update Barre de progression (Base sur Départ -> Idéal)
        const range = p.start - p.ideal;
        const progress = p.start - actuel;
        const pct = range !== 0 ? (progress / range) * 100 : 0;
        
        const pointer = this.shadowRoot.getElementById('progression-pointer');
        if (pointer) pointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        const label = this.shadowRoot.getElementById('pointer-label');
        if (label) label.textContent = `${actuel} kg`;
    }

    // Update Capteurs
    (p.sensors || []).forEach((s, i) => {
        const sObj = this._hass.states[s.entity];
        const vEl = this.shadowRoot.getElementById(`value-${i}`);
        if (sObj && vEl) vEl.textContent = `${sObj.state} ${sObj.attributes.unit_of_measurement || ''}`;
    });
  }

  render() {
    const view = this._config.current_view;
    const p = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height}px; background: #0f172a; border-radius: 20px; color: white; overflow: hidden; font-family: sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${p.image}') center/cover; opacity: 0.3; transition: 0.5s; }
        .topbar { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 10; }
        .btn { padding: 10px 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: white; cursor: pointer; font-weight: bold; }
        .btn.active { background: ${accent}; border-color: ${accent}; box-shadow: 0 0 15px ${accent}66; }
        
        .stats-header { position: absolute; top: 80px; left: 20px; z-index: 10; display: flex; gap: 20px; }
        .stat-item { background: rgba(255,255,255,0.05); padding: 10px 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px); }
        .stat-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: bold; }
        .stat-val { font-size: 1.4em; font-weight: bold; }

        .rule-zone { position: absolute; bottom: 40px; left: 5%; width: 90%; height: 60px; z-index: 5; }
        .rule-bar { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; top: 30px; }
        .rule-fill { position: absolute; height: 100%; background: linear-gradient(to right, #f87171, #fbbf24, #4ade80); border-radius: 4px; width: 100%; opacity: 0.8; }
        .pointer { position: absolute; top: -15px; width: 4px; height: 38px; background: white; transition: left 1.5s ease-out; border-radius: 2px; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        .pointer-label { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 3px 8px; border-radius: 5px; font-size: 12px; font-weight: 900; white-space: nowrap; }
        
        .target-mark { position: absolute; top: 0; width: 2px; height: 8px; background: white; opacity: 0.5; }

        .sensor { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); padding: 12px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); text-align: center; min-width: 100px; z-index: 5; backdrop-filter: blur(10px); }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="topbar">
          <button id="b1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="b2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>

        <div class="stats-header">
            <div class="stat-item"><div class="stat-label">Départ</div><div class="stat-val">${p.start}</div></div>
            <div class="stat-item"><div class="stat-label">Objectif</div><div class="stat-val" style="color:#fbbf24">${p.goal}</div></div>
            <div class="stat-item"><div class="stat-label">Perte</div><div id="val-perte" class="stat-val" style="color:#4ade80">--</div></div>
        </div>

        <div class="rule-zone">
            <div class="rule-bar">
                <div class="rule-fill"></div>
                <div id="progression-pointer" class="pointer">
                    <div id="pointer-label" class="pointer-label">-- kg</div>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:35px; font-size:10px; color:#94a3b8; font-weight:bold;">
                <span>DÉPART (${p.start})</span>
                <span>IDÉAL (${p.ideal})</span>
            </div>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="sensor" style="left:${s.x}%; top:${s.y}%;">
            <div style="font-size:10px; color:${accent}; font-weight:bold; text-transform:uppercase;">${s.name}</div>
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
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config || {})); this.render(); }
  render() {
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];
    this.innerHTML = `
      <div style="padding: 15px; font-family: sans-serif; background: #f8fafc;">
        <h3 style="color:#0284c7; border-bottom: 2px solid #0284c7; padding-bottom:5px;">Réglages ${p.name}</h3>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-top:15px;">
            <div><label style="font-size:11px; font-weight:bold;">Poids Départ</label><input type="number" id="s" value="${p.start}" style="width:100%;"></div>
            <div><label style="font-size:11px; font-weight:bold;">Objectif</label><input type="number" id="g" value="${p.goal}" style="width:100%;"></div>
            <div><label style="font-size:11px; font-weight:bold;">Poids Idéal</label><input type="number" id="id" value="${p.ideal}" style="width:100%;"></div>
        </div>

        <div style="margin-top:15px;">
            <label style="font-size:11px; font-weight:bold;">Image de fond URL</label>
            <input type="text" id="img" value="${p.image}" style="width:100%; padding:8px; border-radius:5px; border:1px solid #ccc;">
        </div>

        <h4 style="margin-top:20px; color:#64748b;">Position des Cadres</h4>
        <div id="sensors-list">
          ${(p.sensors || []).map((s, idx) => `
            <div style="background:white; padding:10px; margin-bottom:10px; border-radius:8px; border-left:4px solid #0284c7; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <input type="text" class="sn" data-idx="${idx}" value="${s.name}" style="font-weight:bold; border:none; border-bottom:1px solid #eee; width:70%;">
                <button class="del" data-idx="${idx}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold;">Suppr.</button>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div><label style="font-size:10px;">Position X (%)</label><input type="number" class="sx" data-idx="${idx}" value="${s.x}" style="width:100%;"></div>
                <div><label style="font-size:10px;">Position Y (%)</label><input type="number" class="sy" data-idx="${idx}" value="${s.y}" style="width:100%;"></div>
              </div>
              <input type="text" class="se" data-idx="${idx}" value="${s.entity}" placeholder="Entité" style="width:100%; margin-top:8px; font-size:11px;">
            </div>
          `).join('')}
        </div>
        <button id="add" style="width:100%; padding:12px; background:#0284c7; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-top:10px;">➕ AJOUTER UN CADRE SENSOR</button>
      </div>
    `;

    // Events
    this.querySelector('#s').onchange = (e) => { this._config[pKey].start = parseFloat(e.target.value); this._fire(); };
    this.querySelector('#g').onchange = (e) => { this._config[pKey].goal = parseFloat(e.target.value); this._fire(); };
    this.querySelector('#id').onchange = (e) => { this._config[pKey].ideal = parseFloat(e.target.value); this._fire(); };
    this.querySelector('#img').onchange = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    
    this.querySelector('#add').onclick = () => {
      if(!this._config[pKey].sensors) this._config[pKey].sensors = [];
      this._config[pKey].sensors.push({ name: "Nouveau", entity: "", x: 50, y: 50 });
      this._fire(); this.render();
    };

    this.querySelectorAll('.sn').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.se').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.sx').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].x = parseFloat(e.target.value); this._fire(); });
    this.querySelectorAll('.sy').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].y = parseFloat(e.target.value); this._fire(); });
    this.querySelectorAll('.del').forEach(el => el.onclick = (e) => { this._config[pKey].sensors.splice(e.target.dataset.idx, 1); this._fire(); this.render(); });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V84.0" });
