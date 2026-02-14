// HEALTH DASHBOARD CARD – VERSION 43 (4-POINT WEIGHT PROGRESSION)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    if (!this._config.start_weight) this._config.start_weight = 156;
    if (!this._config.comfort_weight) this._config.comfort_weight = 95;
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
    const goalMarker = this.shadowRoot.getElementById('marker-goal');

    if (stPoids && progPointer) {
        const actuel = parseFloat(stPoids.state);
        const depart = parseFloat(this._config.start_weight);
        const confort = parseFloat(this._config.comfort_weight);
        const final = stGoal ? parseFloat(stGoal.state) : confort - 5; // Fallback si pas de sensor
        
        // On définit l'échelle : Départ (0%) à Final (100%)
        const totalRange = depart - final;
        
        const getPos = (val) => {
            let p = ((depart - val) / totalRange) * 100;
            return Math.max(0, Math.min(100, p));
        };

        // Positionner le curseur actuel
        progPointer.style.left = `${getPos(actuel)}%`;
        progPointer.setAttribute('data-val', `${actuel}kg`);

        // Positionner les repères verticaux
        if (comfortMarker) comfortMarker.style.left = `${getPos(confort)}%`;
        if (goalMarker) goalMarker.style.left = `100%`;
        
        // Mise à jour des bulles standards
        const person = this._config[this._config.current_view];
        if (person && person.sensors) {
            person.sensors.forEach((s, i) => {
                const valEl = this.shadowRoot.getElementById(`value-${i}`);
                const stateObj = this._hass.states[s.entity];
                if (valEl && stateObj) valEl.textContent = `${stateObj.state}${stateObj.attributes.unit_of_measurement || ''}`;
            });
        }
    }
  }

  render() {
    if (!this._config) return;
    const personKey = this._config.current_view;
    const person = this._config[personKey] || { sensors: [] };

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${person.image || (personKey==='person2'?'/local/femme.png':'/local/homme.png')}') center ${this._config.img_offset || 0}% / cover no-repeat; opacity: 0.4; }
        
        /* Règle Multi-Points */
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 90%; height: 80px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 35px; border: 1px solid rgba(255,255,255,0.2); }
        
        /* Curseur Actuel */
        .prog-pointer { position: absolute; top: -15px; width: 4px; height: 35px; background: #38bdf8; transition: left 1s ease; z-index: 10; border-radius: 2px; box-shadow: 0 0 10px #38bdf8; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; }

        /* Repères */
        .marker { position: absolute; top: 0; width: 2px; height: 15px; background: rgba(255,255,255,0.5); }
        .marker-label { position: absolute; top: 20px; font-size: 9px; text-transform: uppercase; white-space: nowrap; transform: translateX(-50%); text-align: center; line-height: 1.1; }
        .m-start { color: #f87171; }
        .m-comfort { color: #fbbf24; }
        .m-goal { color: #4ade80; }

        .sensor { position: absolute; transform: translate(-50%, -50%); width: ${this._config.b_width || 160}px; height: ${this._config.b_height || 69}px; border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
        .val { font-size: 1.1em; font-weight: bold; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; cursor: pointer; background: rgba(0,0,0,0.5); color: white; font-size: 11px; font-weight: bold; }
        .btn.active { background: #38bdf8; }
      </style>

      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${personKey==='person1'?'active':''}">${this._config.name_p1 || 'PATRICK'}</button>
          <button id="bt2" class="btn ${personKey==='person2'?'active':''}">${this._config.name_p2 || 'SANDRA'}</button>
        </div>
        <div class="bg"></div>

        <div class="rule-container">
            <div class="rule-track">
                <div class="marker" style="left: 0;"></div>
                <div class="marker-label m-start" style="left: 0;">DÉPART<br>${this._config.start_weight}kg</div>
                
                <div id="marker-comfort" class="marker"></div>
                <div id="label-comfort" class="marker-label m-comfort" style="left: 65%;">CONFORT<br>${this._config.comfort_weight}kg</div>
                
                <div id="marker-goal" class="marker" style="left: 100%;"></div>
                <div class="marker-label m-goal" style="left: 100%;">OBJECTIF<br>FINAL</div>

                <div id="progression-pointer" class="prog-pointer" data-val="-- kg"></div>
            </div>
        </div>

        ${(person.sensors || []).map((s, i) => `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%">
              <div style="color:${s.color || '#38bdf8'}"><ha-icon icon="${s.icon || 'mdi:heart-pulse'}"></ha-icon></div>
              <div style="font-size:0.8em; color:#cbd5e1;">${s.name || ''}</div>
              <div id="value-${i}" class="val">--</div>
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

// EDITOR V43
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  render() {
    this.innerHTML = `
      <div style="padding: 15px; background: #111827; color: white;">
        <h4 style="color:#38bdf8">📏 CONFIGURATION DE LA RÈGLE</h4>
        <label>Poids de Départ (ex: 156)</label>
        <input type="number" id="sw" value="${this._config.start_weight}" style="width:100%; margin-bottom:10px;">
        <label>Poids Confort (ex: 95)</label>
        <input type="number" id="cw" value="${this._config.comfort_weight}" style="width:100%;">
        <p style="font-size:11px; color:#9ca3af; margin-top:10px;">L'Objectif Final est récupéré automatiquement depuis Withings.</p>
      </div>
    `;
    this.querySelector('#sw').onchange = (e) => { this._config.start_weight = e.target.value; this._fire(); };
    this.querySelector('#cw').onchange = (e) => { this._config.comfort_weight = e.target.value; this._fire(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
