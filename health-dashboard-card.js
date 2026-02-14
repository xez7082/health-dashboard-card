// HEALTH DASHBOARD CARD – VERSION 66 (TEMPLATE COMPLIANT & FULL CONFIG)
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
    const stDiff = this._hass.states['sensor.difference_poids' + suffix];
    
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    if (stPoids && progPointer) {
        const actuel = parseFloat(stPoids.state);
        const depart = parseFloat(pData.start || 76);
        const ideal = parseFloat(pData.ideal || 58);
        
        // Calcul position règle
        const range = depart - ideal;
        let pct = ((depart - actuel) / range) * 100;
        progPointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        
        // Affichage poids actuel
        const unitPoids = stPoids.attributes.unit_of_measurement || 'kg';
        progPointer.setAttribute('data-val', `${actuel} ${unitPoids}`);

        // Affichage différence (Template Sensor)
        if (stDiff) {
            const valDiff = parseFloat(stDiff.state);
            const color = valDiff <= 0 ? '#4ade80' : '#f87171'; // Vert si <= 0, Rouge si > 0
            const sign = valDiff > 0 ? '+' : '';
            const unitDiff = stDiff.attributes.unit_of_measurement || 'kg';
            progPointer.setAttribute('data-diff', `${sign}${valDiff} ${unitDiff}`);
            progPointer.style.setProperty('--diff-color', color);
        }
    }

    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (valEl && stateObj) {
                const u = stateObj.attributes.unit_of_measurement || '';
                valEl.textContent = `${stateObj.state} ${u}`;
            }
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
        .bg-img { position: absolute; inset: 0; background-position: center ${this._config.img_offset || 0}%; background-size: cover; background-repeat: no-repeat; opacity: 0.4; z-index: 1; pointer-events: none; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 11px; font-weight: bold; transition: all 0.3s; }
        .btn.active { background: #38bdf8 !important; border-color: #38bdf8; box-shadow: 0 0 15px #38bdf8; }
        .rule-container { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 85%; height: 70px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 30px; border: 1px solid rgba(255,255,255,0.2); }
        .prog-pointer { position: absolute; top: -15px; width: 4px; height: 35px; background: #38bdf8; transition: left 1s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 2px; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; white-space: nowrap; }
        .prog-pointer::before { content: attr(data-diff); position: absolute; top: 38px; left: 50%; transform: translateX(-50%); color: var(--diff-color); font-size: 12px; font-weight: bold; transition: color 0.3s; }
        .marker-label { position: absolute; top: 18px; font-size: 9px; transform: translateX(-50%); text-align: center; font-weight: bold; }
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 5px; backdrop-filter: blur(5px); }
        ha-icon { --mdc-icon-size: 24px; color: #38bdf8; margin-bottom: 3px; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'P1'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'P2'}</button>
        </div>
        <div class="bg-img" style="background-image: url('${pData.image || ''}')"></div>
        <div class="rule-container">
            <div class="rule-track">
                <div class="marker-label" style="left: 0; color: #f87171;">DEPART<br>${pData.start}kg</div>
                <div class="marker-label" style="left: 65%; color: #fbbf24;">CONFORT<br>${pData.goal}kg</div>
                <div class="marker-label" style="left: 100%; color: #4ade80;">IDEAL<br>${pData.ideal}kg</div>
                <div id="progression-pointer" class="prog-pointer" data-val="--" data-diff=""></div>
            </div>
        </div>
        ${(pData.sensors || []).map((s, i) => {
            const isIMC = s.name && (s.name.toLowerCase().includes('corpulence') || s.name.toLowerCase().includes('imc'));
            const w = isIMC ? (this._config.imc_width||160) : (this._config.b_width||160);
            const h = isIMC ? (this._config.imc_height||69) : (this._config.b_height||69);
            return `<div class="sensor" style="left:${s.x}%; top:${s.y}%; width:${w}px; height:${h}px;">
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
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }

  render() {
    if (!this._config || !this._hass) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];
    const entities = Object.keys(this._hass.states).filter(e => e.startsWith('sensor.')).sort();

    this.innerHTML = `
      <style>
        .ed-box { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .tab-menu { display: flex; gap: 8px; margin-bottom: 20px; }
        .t-btn { flex: 1; padding: 12px; border: 2px solid #444; background: #222; color: #888; cursor: pointer; font-weight: bold; border-radius: 8px; }
        .t-btn.active { border-color: #38bdf8; background: #38bdf8; color: white; }
        .section { background: #252525; border: 1px solid #444; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; margin: 4px 0 10px 0; box-sizing: border-box; }
        label { color: #38bdf8; font-size: 11px; font-weight: bold; display: block; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .s-card { background: #111; padding: 10px; margin-bottom: 10px; border-left: 4px solid #38bdf8; position: relative; }
        .add-btn { width: 100%; padding: 10px; background: #4ade80; color: black; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .del-btn { position: absolute; top: 5px; right: 5px; background: #f87171; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; padding: 2px 5px; }
      </style>
      <div class="ed-box">
        <div class="tab-menu">
            <button class="t-btn ${pKey==='person1'?'active':''}" id="t-p1">PATRICK</button>
            <button class="t-btn ${pKey==='person2'?'active':''}" id="t-p2">SANDRA</button>
        </div>

        <datalist id="list-entities">
            ${entities.map(e => `<option value="${e}">${this._hass.states[e].attributes.friendly_name || e}</option>`).join('')}
        </datalist>

        <div class="section">
            <label>NOM</label><input type="text" id="inp-name" value="${p.name}">
            <label>IMAGE URL</label><input type="text" id="inp-img" value="${p.image || ''}">
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px;">
                <div><label>DÉPART</label><input type="number" id="inp-start" value="${p.start}"></div>
                <div><label>CONFORT</label><input type="number" id="inp-goal" value="${p.goal}"></div>
                <div><label>IDÉAL</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
            </div>
        </div>

        <div class="section">
            <h4 style="margin:0 0 10px 0; color:#38bdf8;">📏 TAILLES GLOBALES</h4>
            <div class="grid">
              <div><label>Haut. Carte</label><input type="number" id="inp-ch" value="${this._config.card_height || 600}"></div>
              <div><label>Larg. Bulles</label><input type="number" id="inp-bw" value="${this._config.b_width || 160}"></div>
            </div>
            <div class="grid">
              <div><label>Larg. IMC</label><input type="number" id="inp-iw" value="${this._config.imc_width || 160}"></div>
              <div><label>Haut. IMC</label><input type="number" id="inp-ih" value="${this._config.imc_height || 69}"></div>
            </div>
        </div>

        <div class="section">
            <h4 style="margin:0 0 10px 0; color:#38bdf8;">⚙️ CAPTEURS</h4>
            <div id="sensors-container">
            ${p.sensors.map((s, i) => `
              <div class="s-card">
                <button class="del-btn" data-idx="${i}">X</button>
                <label>NOM</label><input type="text" class="s-name" data-idx="${i}" value="${s.name}">
                <label>ENTITÉ</label>
                <input type="text" class="s-ent" list="list-entities" data-idx="${i}" value="${s.entity}" placeholder="Chercher...">
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px; margin-top:5px;">
                    <div><label>ICÔNE</label><input type="text" class="s-icon" data-idx="${i}" value="${s.icon || ''}"></div>
                    <div><label>X %</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div>
                    <div><label>Y %</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div>
                </div>
              </div>
            `).join('')}
            </div>
            <button class="add-btn" id="add-sensor">➕ AJOUTER</button>
        </div>
      </div>
    `;

    this.querySelector('#t-p1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#t-p2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
    
    this.querySelector('#inp-name').onchange = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#inp-img').onchange = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    this.querySelector('#inp-start').onchange = (e) => { this._config[pKey].start = e.target.value; this._fire(); };
    this.querySelector('#inp-goal').onchange = (e) => { this._config[pKey].goal = e.target.value; this._fire(); };
    this.querySelector('#inp-ideal').onchange = (e) => { this._config[pKey].ideal = e.target.value; this._fire(); };
    
    this.querySelector('#inp-ch').onchange = (e) => { this._config.card_height = e.target.value; this._fire(); };
    this.querySelector('#inp-bw').onchange = (e) => { this._config.b_width = e.target.value; this._fire(); };
    this.querySelector('#inp-iw').onchange = (e) => { this._config.imc_width = e.target.value; this._fire(); };
    this.querySelector('#inp-ih').onchange = (e) => { this._config.imc_height = e.target.value; this._fire(); };

    this.querySelectorAll('.s-name').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.s-ent').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.s-icon').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].icon = e.target.value; this._fire(); });
    this.querySelectorAll('.s-x').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.s-y').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[el.dataset.idx].y = e.target.value; this._fire(); });

    this.querySelector('#add-sensor').onclick = () => {
        this._config[pKey].sensors.push({ name: "Nouveau", entity: "", icon: "mdi:heart", x: 50, y: 50 });
        this._fire(); this.render();
    };
    this.querySelectorAll('.del-btn').forEach(btn => btn.onclick = (e) => {
        this._config[pKey].sensors.splice(e.target.dataset.idx, 1);
        this._fire(); this.render();
    });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V66" });
