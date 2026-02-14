// HEALTH DASHBOARD CARD – VERSION 47 (INDIVIDUAL GOALS & ICONS)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    // Initialisation des données si absentes
    if (!this._config.person1) this._config.person1 = { name: 'Patrick', start: 156, ideal: 90, goal: 120, sensors: [] };
    if (!this._config.person2) this._config.person2 = { name: 'Sandra', start: 76, ideal: 55, goal: 60, sensors: [] };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this.shadowRoot) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';
    
    // 1. Logique de la Règle
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    const comfortMarker = this.shadowRoot.getElementById('marker-comfort');

    if (stPoids && progPointer) {
        const actuel = parseFloat(stPoids.state);
        const depart = parseFloat(pData.start);
        const ideal = parseFloat(pData.ideal);
        
        // Calcul de position (0% = Départ, 100% = Idéal)
        const totalRange = depart - ideal;
        const getPos = (val) => {
            let p = ((depart - val) / totalRange) * 100;
            return Math.max(0, Math.min(100, p));
        };

        progPointer.style.left = `${getPos(actuel)}%`;
        progPointer.setAttribute('data-val', `${actuel}kg`);
        if (comfortMarker) comfortMarker.style.left = `${getPos(parseFloat(pData.goal))}%`;
    }

    // 2. Mise à jour des Valeurs des Bulles
    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (valEl && stateObj) {
                valEl.textContent = `${stateObj.state}${stateObj.attributes.unit_of_measurement || ''}`;
            }
        });
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view];

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${pData.image || ""}') center ${this._config.img_offset || 0}% / cover no-repeat; opacity: 0.4; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.5); color: white; cursor: pointer; font-size: 11px; font-weight: bold; }
        .btn.active { background: #38bdf8; border-color: #38bdf8; }
        
        .rule-container { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 85%; height: 70px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 30px; border: 1px solid rgba(255,255,255,0.2); }
        .prog-pointer { position: absolute; top: -15px; width: 4px; height: 35px; background: #38bdf8; transition: left 1s ease; border-radius: 2px; box-shadow: 0 0 10px #38bdf8; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; white-space: nowrap; }
        .marker { position: absolute; top: 0; width: 2px; height: 12px; background: rgba(255,255,255,0.5); }
        .marker-label { position: absolute; top: 18px; font-size: 9px; text-transform: uppercase; white-space: nowrap; transform: translateX(-50%); text-align: center; font-weight: bold; }

        .sensor { position: absolute; transform: translate(-50%, -50%); width: ${this._config.b_width || 160}px; height: ${this._config.b_height || 69}px; border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
        ha-icon { --mdc-icon-size: 24px; margin-bottom: 2px; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="bg"></div>
        
        <div class="rule-container">
            <div class="rule-track">
                <div class="marker" style="left: 0;"></div>
                <div class="marker-label" style="left: 0; color: #f87171;">DÉPART<br>${pData.start}kg</div>
                
                <div id="marker-comfort" class="marker" style="background:orange;"></div>
                <div id="label-comfort" class="marker-label" style="left: 65%; color: #fbbf24;">CONFORT<br>${pData.goal}kg</div>
                
                <div class="marker" style="left: 100%;"></div>
                <div class="marker-label" style="left: 100%; color: #4ade80;">IDÉAL<br>${pData.ideal}kg</div>

                <div id="progression-pointer" class="prog-pointer" data-val="--"></div>
            </div>
        </div>

        ${(pData.sensors || []).map((s, i) => `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%; width:${s.name.includes('Corpulence') ? (this._config.imc_width||160) : (this._config.b_width||160)}px; height:${s.name.includes('Corpulence') ? (this._config.imc_height||69) : (this._config.b_height||69)}px;">
              <ha-icon icon="${s.icon || 'mdi:chart-bell-curve'}" style="color:${s.color || '#38bdf8'}"></ha-icon>
              <div style="font-size:10px; color:#cbd5e1;">${s.name}</div>
              <div id="value-${i}" style="font-weight:bold;">--</div>
            </div>
        `).join('')}
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
    this.updateSensors();
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

// EDITOR V47
class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this.render(); }
  render() {
    if (!this._config) return;
    const view = this._config.current_view || 'person1';
    const p = this._config[view];

    this.innerHTML = `
      <div style="padding:12px; color:white; background:#1c1c1c; font-family:sans-serif;">
        <h4 style="color:#38bdf8; margin:0 0 10px 0;">🎯 OBJECTIFS ${p.name.toUpperCase()}</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
            <div><label style="font-size:10px;">DÉPART</label><input type="number" id="es" value="${p.start}" style="width:100%"></div>
            <div><label style="font-size:10px;">CONFORT</label><input type="number" id="eg" value="${p.goal}" style="width:100%"></div>
            <div><label style="font-size:10px;">IDÉAL</label><input type="number" id="ei" value="${p.ideal}" style="width:100%"></div>
        </div>
        <hr style="opacity:0.1; margin:15px 0;">
        <label>LARGEUR BULLE IMC</label>
        <input type="number" id="iw" value="${this._config.imc_width || 160}" style="width:100%">
        <p style="font-size:11px; color:#aaa;">Modifiez les capteurs directement dans le YAML pour plus de précision.</p>
      </div>
    `;

    this.querySelector('#es').onchange = (e) => { this._config[view].start = e.target.value; this._fire(); };
    this.querySelector('#eg').onchange = (e) => { this._config[view].goal = e.target.value; this._fire(); };
    this.querySelector('#ei').onchange = (e) => { this._config[view].ideal = e.target.value; this._fire(); };
    this.querySelector('#iw').onchange = (e) => { this._config.imc_width = e.target.value; this._fire(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V47" });
