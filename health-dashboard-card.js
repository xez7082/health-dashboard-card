// HEALTH DASHBOARD CARD – VERSION 48 (COMPLETE RESTORATION)
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
    const view = this._config.current_view;
    const pData = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';
    
    // Règle de poids
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    const comfortMarker = this.shadowRoot.getElementById('marker-comfort');

    if (stPoids && progPointer) {
        const actuel = parseFloat(stPoids.state);
        const depart = parseFloat(pData.start || 156);
        const ideal = parseFloat(pData.ideal || 90);
        const confort = parseFloat(pData.goal || 120);
        
        const totalRange = depart - ideal;
        const getPos = (val) => {
            let p = ((depart - val) / totalRange) * 100;
            return Math.max(0, Math.min(100, p));
        };

        progPointer.style.left = `${getPos(actuel)}%`;
        progPointer.setAttribute('data-val', `${actuel}kg`);
        if (comfortMarker) comfortMarker.style.left = `${getPos(confort)}%`;
    }

    // Sensors
    if (pData && pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (valEl && stateObj) valEl.textContent = `${stateObj.state}${stateObj.attributes.unit_of_measurement || ''}`;
        });
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view] || { sensors: [] };

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${pData.image || ""}') center ${this._config.img_offset || 0}% / cover no-repeat; opacity: 0.4; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.5); color: white; cursor: pointer; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .btn.active { background: #38bdf8; border-color: #38bdf8; }
        
        .rule-container { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 85%; height: 70px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 30px; border: 1px solid rgba(255,255,255,0.2); }
        .prog-pointer { position: absolute; top: -15px; width: 4px; height: 35px; background: #38bdf8; transition: left 1s ease; border-radius: 2px; box-shadow: 0 0 10px #38bdf8; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; white-space: nowrap; }
        .marker { position: absolute; top: 0; width: 2px; height: 12px; background: rgba(255,255,255,0.5); }
        .marker-label { position: absolute; top: 18px; font-size: 9px; text-transform: uppercase; white-space: nowrap; transform: translateX(-50%); text-align: center; font-weight: bold; }

        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
        ha-icon { --mdc-icon-size: 24px; margin-bottom: 2px; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'Patrick'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'Sandra'}</button>
        </div>
        <div class="bg"></div>
        <div class="rule-container">
            <div class="rule-track">
                <div class="marker" style="left: 0;"></div>
                <div class="marker-label" style="left: 0; color: #f87171;">DÉPART<br>${pData.start}kg</div>
                <div id="marker-comfort" class="marker" style="background:orange;"></div>
                <div class="marker-label" id="lbl-c" style="left: 65%; color: #fbbf24;">CONFORT<br>${pData.goal}kg</div>
                <div class="marker" style="left: 100%;"></div>
                <div class="marker-label" style="left: 100%; color: #4ade80;">IDÉAL<br>${pData.ideal}kg</div>
                <div id="progression-pointer" class="prog-pointer" data-val="--"></div>
            </div>
        </div>

        ${(pData.sensors || []).map((s, i) => {
          const isIMC = s.name.toLowerCase().includes('corpulence');
          const w = isIMC ? (this._config.imc_width || 160) : (this._config.b_width || 160);
          const h = isIMC ? (this._config.imc_height || 69) : (this._config.b_height || 69);
          return `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%; width:${w}px; height:${h}px;">
              <ha-icon icon="${s.icon || 'mdi:heart'}" style="color:${s.color || '#38bdf8'}"></ha-icon>
              <div style="font-size:10px; color:#cbd5e1;">${s.name}</div>
              <div id="value-${i}" style="font-weight:bold;">--</div>
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

// EDITOR V48 - L'ÉDITEUR COMPLET RETROUVÉ
class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this.render(); }
  render() {
    if (!this._config) return;
    const view = this._config.current_view || 'person1';
    const p = this._config[view];

    this.innerHTML = `
      <style>
        .ed-container { padding: 12px; color: white; background: #1c1c1c; font-family: sans-serif; }
        .ed-section { background: #2a2a2a; padding: 10px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #444; }
        .ed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        input { width: 100%; background: #333; color: white; border: 1px solid #555; padding: 6px; border-radius: 4px; box-sizing: border-box; margin-top: 4px; }
        label { font-size: 11px; color: #38bdf8; font-weight: bold; text-transform: uppercase; }
        h4 { margin: 0 0 10px 0; border-bottom: 1px solid #444; padding-bottom: 5px; color: #38bdf8; }
        .sensor-block { background: #1c1c1c; padding: 8px; border-radius: 4px; margin-top: 10px; border-left: 3px solid #38bdf8; }
      </style>
      <div class="ed-container">
        <div class="ed-section">
          <h4>👤 CONFIGURATION ${p.name.toUpperCase()}</h4>
          <label>Nom Affiché</label>
          <input type="text" id="edit-name" value="${p.name}">
          <div class="ed-grid" style="margin-top:10px;">
            <div><label>Départ (kg)</label><input type="number" id="edit-start" value="${p.start}"></div>
            <div><label>Confort (kg)</label><input type="number" id="edit-goal" value="${p.goal}"></div>
            <div><label>Idéal (kg)</label><input type="number" id="edit-ideal" value="${p.ideal}"></div>
          </div>
        </div>

        <div class="ed-section">
          <h4>📐 TAILLES BULLES & CARTE</h4>
          <div class="ed-grid">
            <div><label>Bulle Standard L</label><input type="number" id="edit-bw" value="${this._config.b_width}"></div>
            <div><label>Bulle Standard H</label><input type="number" id="edit-bh" value="${this._config.b_height}"></div>
            <div><label>Bulle IMC Largeur</label><input type="number" id="edit-iw" value="${this._config.imc_width}"></div>
            <div><label>Bulle IMC Hauteur</label><input type="number" id="edit-ih" value="${this._config.imc_height}"></div>
          </div>
        </div>

        <div class="ed-section">
          <h4>⚙️ CAPTEURS (${view})</h4>
          ${p.sensors.map((s, i) => `
            <div class="sensor-block">
              <label>Nom</label><input type="text" class="s-name" data-idx="${i}" value="${s.name}">
              <label>Entité</label><input type="text" class="s-ent" data-idx="${i}" value="${s.entity}">
              <div class="ed-grid">
                <div><label>Position X %</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div>
                <div><label>Position Y %</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Event Listeners
    this.querySelector('#edit-name').onchange = (e) => { this._config[view].name = e.target.value; this._fire(); };
    this.querySelector('#edit-start').onchange = (e) => { this._config[view].start = e.target.value; this._fire(); };
    this.querySelector('#edit-goal').onchange = (e) => { this._config[view].goal = e.target.value; this._fire(); };
    this.querySelector('#edit-ideal').onchange = (e) => { this._config[view].ideal = e.target.value; this._fire(); };
    this.querySelector('#edit-bw').onchange = (e) => { this._config.b_width = e.target.value; this._fire(); };
    this.querySelector('#edit-bh').onchange = (e) => { this._config.b_height = e.target.value; this._fire(); };
    this.querySelector('#edit-iw').onchange = (e) => { this._config.imc_width = e.target.value; this._fire(); };
    this.querySelector('#edit-ih').onchange = (e) => { this._config.imc_height = e.target.value; this._fire(); };
    
    this.querySelectorAll('.s-name').forEach(el => el.onchange = (e) => { this._config[view].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.s-ent').forEach(el => el.onchange = (e) => { this._config[view].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.s-x').forEach(el => el.onchange = (e) => { this._config[view].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.s-y').forEach(el => el.onchange = (e) => { this._config[view].sensors[el.dataset.idx].y = e.target.value; this._fire(); });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V48" });
