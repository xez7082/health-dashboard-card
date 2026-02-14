// HEALTH DASHBOARD CARD – VERSION 51 (SYNC FIX)
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
    if (!pData) return;

    const suffix = view === 'person2' ? '_sandra' : '_patrick';
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    
    // Règle de poids
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    if (stPoids && progPointer) {
        const actuel = parseFloat(stPoids.state);
        const depart = parseFloat(pData.start || 76);
        const ideal = parseFloat(pData.ideal || 58);
        const range = depart - ideal;
        let pct = ((depart - actuel) / range) * 100;
        progPointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        progPointer.setAttribute('data-val', `${actuel}kg`);
    }

    // Valeurs des capteurs
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
    const pData = this._config[view] || { name: 'Inconnu', start:0, ideal:0, goal:0, sensors: [] };

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${pData.image || ""}') center ${this._config.img_offset || 0}% / cover no-repeat; opacity: 0.4; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.5); color: white; cursor: pointer; font-size: 11px; font-weight: bold; }
        .btn.active { background: #38bdf8; border-color: #38bdf8; }
        
        .rule-container { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 85%; height: 70px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 30px; border: 1px solid rgba(255,255,255,0.2); }
        .prog-pointer { position: absolute; top: -15px; width: 4px; height: 35px; background: #38bdf8; transition: left 1s ease; border-radius: 2px; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .marker-label { position: absolute; top: 18px; font-size: 9px; transform: translateX(-50%); text-align: center; font-weight: bold; }

        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 5px; box-sizing: border-box; }
        ha-icon { --mdc-icon-size: 24px; color: #38bdf8; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'P1'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'P2'}</button>
        </div>
        <div class="bg"></div>
        <div class="rule-container">
            <div class="rule-track">
                <div class="marker-label" style="left: 0; color: #f87171;">DEPART<br>${pData.start}kg</div>
                <div class="marker-label" style="left: 65%; color: #fbbf24;">CONFORT<br>${pData.goal}kg</div>
                <div class="marker-label" style="left: 100%; color: #4ade80;">IDEAL<br>${pData.ideal}kg</div>
                <div id="progression-pointer" class="prog-pointer" data-val="--"></div>
            </div>
        </div>
        ${(pData.sensors || []).map((s, i) => {
          const isIMC = s.name && s.name.toLowerCase().includes('corpulence');
          const w = isIMC ? (this._config.imc_width||160) : (this._config.b_width||160);
          const h = isIMC ? (this._config.imc_height||69) : (this._config.b_height||69);
          return `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%; width:${w}px; height:${h}px;">
              <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
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

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._tab) this._tab = 'person1';
    this.render();
  }
  render() {
    const pKey = this._tab;
    const p = this._config[pKey];
    this.innerHTML = `
      <style>
        .ed-box { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tab-menu { display: flex; gap: 5px; margin-bottom: 15px; }
        .t-btn { flex: 1; padding: 10px; border: none; background: #333; color: white; cursor: pointer; font-weight: bold; border-radius: 4px; }
        .t-btn.active { background: #38bdf8; }
        .section { background: #252525; border: 1px solid #444; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; margin: 4px 0 10px 0; box-sizing: border-box; }
        label { color: #38bdf8; font-size: 11px; font-weight: bold; }
        .s-card { background: #111; padding: 8px; margin-bottom: 10px; border-left: 4px solid #38bdf8; }
      </style>
      <div class="ed-box">
        <div class="tab-menu">
            <button class="t-btn ${pKey==='person1'?'active':''}" id="t-p1">PATRICK</button>
            <button class="t-btn ${pKey==='person2'?'active':''}" id="t-p2">SANDRA</button>
        </div>

        <div class="section">
            <label>NOM</label><input type="text" id="inp-name" value="${p.name}">
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:5px;">
                <div><label>DEPART</label><input type="number" id="inp-start" value="${p.start}"></div>
                <div><label>CONFORT</label><input type="number" id="inp-goal" value="${p.goal}"></div>
                <div><label>IDEAL</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
            </div>
        </div>

        <div class="section">
            <h4 style="margin:0 0 10px 0;">CAPTEURS ${p.name.toUpperCase()}</h4>
            ${p.sensors.map((s, i) => `
              <div class="s-card">
                <label>NOM</label><input type="text" class="s-inp" data-idx="${i}" data-f="name" value="${s.name}">
                <label>ICÔNE</label><input type="text" class="s-inp" data-idx="${i}" data-f="icon" value="${s.icon || ''}">
                <label>ENTITÉ</label><input type="text" class="s-inp" data-idx="${i}" data-f="entity" value="${s.entity}">
                <div style="display:flex; gap:5px;">
                  <input type="number" class="s-inp" data-idx="${i}" data-f="x" value="${s.x}">
                  <input type="number" class="s-inp" data-idx="${i}" data-f="y" value="${s.y}">
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    `;

    this.querySelector('#t-p1').onclick = () => { this._tab = 'person1'; this.render(); };
    this.querySelector('#t-p2').onclick = () => { this._tab = 'person2'; this.render(); };
    
    this.querySelector('#inp-name').onchange = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#inp-start').onchange = (e) => { this._config[pKey].start = e.target.value; this._fire(); };
    this.querySelector('#inp-goal').onchange = (e) => { this._config[pKey].goal = e.target.value; this._fire(); };
    this.querySelector('#inp-ideal').onchange = (e) => { this._config[pKey].ideal = e.target.value; this._fire(); };

    this.querySelectorAll('.s-inp').forEach(el => el.onchange = (e) => {
        const idx = el.dataset.idx;
        const field = el.dataset.f;
        this._config[pKey].sensors[idx][field] = e.target.value;
        this._fire();
    });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V51" });
