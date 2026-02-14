// HEALTH DASHBOARD CARD – VERSION 46 (RESTORATION & IMC CONTROLS)
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
    const suffix = view === 'person2' ? '_sandra' : '_patrick';
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const stGoal = this._hass.states['sensor.withings_weight_goal' + (view === 'person2' ? '_2' : '')];
    
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

    const person = this._config[view];
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
    const view = this._config.current_view;
    const person = this._config[view] || { sensors: [] };
    const p1Name = this._config.person1?.name || 'Patrick';
    const p2Name = this._config.person2?.name || 'Sandra';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${person.image || ""}') center ${this._config.img_offset || 0}% / cover no-repeat; opacity: 0.4; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.5); color: white; cursor: pointer; font-size: 11px; font-weight: bold; }
        .btn.active { background: #38bdf8; border-color: #38bdf8; }
        
        .rule-container { position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%); width: 85%; height: 70px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 30px; border: 1px solid rgba(255,255,255,0.2); }
        .prog-pointer { position: absolute; top: -15px; width: 4px; height: 35px; background: #38bdf8; transition: left 1s ease; border-radius: 2px; box-shadow: 0 0 10px #38bdf8; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; white-space: nowrap; }
        
        .marker { position: absolute; top: 0; width: 2px; height: 12px; background: rgba(255,255,255,0.5); }
        .marker-label { position: absolute; top: 18px; font-size: 9px; text-transform: uppercase; white-space: nowrap; transform: translateX(-50%); text-align: center; font-weight: bold; }

        .sensor { position: absolute; transform: translate(-50%, -50%); width: ${this._config.b_width || 160}px; height: ${this._config.b_height || 69}px; border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
        .sensor.imc-type { width: ${this._config.imc_width || 160}px; height: ${this._config.imc_height || 69}px; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${p1Name}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${p2Name}</button>
        </div>
        <div class="bg"></div>
        
        <div class="rule-container">
            <div class="rule-track">
                <div class="marker" style="left: 0;"></div>
                <div class="marker-label" style="left: 0; color: #f87171;">DÉPART<br>${this._config.start_weight || 156}kg</div>
                
                <div id="marker-comfort" class="marker" style="background:orange;"></div>
                <div id="label-comfort" class="marker-label" style="left: 65%; color: #fbbf24;">CONFORT<br>${this._config.comfort_weight || 95}kg</div>
                
                <div class="marker" style="left: 100%;"></div>
                <div class="marker-label" style="left: 100%; color: #4ade80;">OBJECTIF</div>

                <div id="progression-pointer" class="prog-pointer" data-val="--"></div>
            </div>
        </div>

        ${(person.sensors || []).map((s, i) => {
            const isIMC = s.entity?.toLowerCase().includes('corpulence') || s.name?.toLowerCase().includes('imc');
            return `
            <div class="sensor ${isIMC ? 'imc-type' : ''}" style="left:${s.x}%; top:${s.y}%">
              <ha-icon icon="${s.icon || 'mdi:heart'}" style="color:${s.color || '#38bdf8'}"></ha-icon>
              <div style="font-size:10px;">${s.name || ''}</div>
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

// EDITOR V46
class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this.render(); }
  render() {
    if (!this._config) return;
    const view = this._config.current_view || 'person1';
    const sensors = this._config[view]?.sensors || [];

    this.innerHTML = `
      <style>
        .ed-wrap { padding:12px; color:white; background:#1c1c1c; font-family:sans-serif; }
        .sec { background:#2a2a2a; padding:10px; border-radius:5px; margin-bottom:10px; border:1px solid #444; }
        input { width:100%; background:#444; color:white; border:1px solid #666; padding:5px; border-radius:3px; box-sizing:border-box; }
        label { font-size:11px; color:#aaa; display:block; margin-top:8px; text-transform:uppercase; }
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      </style>
      <div class="ed-wrap">
        <div class="sec">
            <h4 style="margin:0; color:#38bdf8">👤 PERSONNES</h4>
            <div class="grid">
                <div><label>Nom P1</label><input type="text" id="p1n" value="${this._config.person1?.name || ''}"></div>
                <div><label>Nom P2</label><input type="text" id="p2n" value="${this._config.person2?.name || ''}"></div>
            </div>
        </div>

        <div class="sec">
            <h4 style="margin:0; color:#38bdf8">📏 RÈGLE DE POIDS</h4>
            <div class="grid">
                <div><label>Départ (kg)</label><input type="number" id="sw" value="${this._config.start_weight}"></div>
                <div><label>Confort (kg)</label><input type="number" id="cw" value="${this._config.comfort_weight}"></div>
            </div>
        </div>

        <div class="sec">
            <h4 style="margin:0; color:#38bdf8">📐 DIMENSIONS BULLES</h4>
            <label>Bulles Standard (L x H)</label>
            <div class="grid">
                <input type="number" id="bw" value="${this._config.b_width}">
                <input type="number" id="bh" value="${this._config.b_height}">
            </div>
            <label>Bulle Corpulence (L x H)</label>
            <div class="grid">
                <input type="number" id="iw" value="${this._config.imc_width}">
                <input type="number" id="ih" value="${this._config.imc_height}">
            </div>
        </div>

        <h4 style="color:#38bdf8">⚙️ CAPTEURS (${view})</h4>
        ${sensors.map((s, i) => `
            <div class="sec">
                <label>Nom & Entité</label>
                <input type="text" class="e-name" data-idx="${i}" value="${s.name}">
                <input type="text" class="e-ent" data-idx="${i}" value="${s.entity}">
                <div class="grid">
                    <div><label>X%</label><input type="number" class="e-x" data-idx="${i}" value="${s.x}"></div>
                    <div><label>Y%</label><input type="number" class="e-y" data-idx="${i}" value="${s.y}"></div>
                </div>
            </div>
        `).join('')}
      </div>
    `;

    this.querySelector('#p1n').onchange = (e) => { this._config.person1.name = e.target.value; this._fire(); };
    this.querySelector('#p2n').onchange = (e) => { this._config.person2.name = e.target.value; this._fire(); };
    this.querySelector('#sw').onchange = (e) => { this._config.start_weight = e.target.value; this._fire(); };
    this.querySelector('#cw').onchange = (e) => { this._config.comfort_weight = e.target.value; this._fire(); };
    this.querySelector('#bw').onchange = (e) => { this._config.b_width = e.target.value; this._fire(); };
    this.querySelector('#bh').onchange = (e) => { this._config.b_height = e.target.value; this._fire(); };
    this.querySelector('#iw').onchange = (e) => { this._config.imc_width = e.target.value; this._fire(); };
    this.querySelector('#ih').onchange = (e) => { this._config.imc_height = e.target.value; this._fire(); };
    
    this.querySelectorAll('.e-name').forEach(el => el.onchange = (e) => { this._config[view].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.e-ent').forEach(el => el.onchange = (e) => { this._config[view].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.e-x').forEach(el => el.onchange = (e) => { this._config[view].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.e-y').forEach(el => el.onchange = (e) => { this._config[view].sensors[el.dataset.idx].y = e.target.value; this._fire(); });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V46" });
