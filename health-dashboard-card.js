/**
 * HEALTH DASHBOARD CARD – V76.0 (GRADIENT BAR EDITION)
 * Barre colorée (Rouge -> Orange -> Vert) + Sparklines + Flèches + Editeur.
 */

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

  _num(val, defaultVal = 0) {
    const n = parseFloat(val);
    return isNaN(n) ? defaultVal : n;
  }

  async _renderTrends(entity, i, color, sensorName) {
    if (!this._hass || !entity) return;
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      const history = await this._hass.callApi('GET', `history/period/${yesterday.toISOString()}?filter_entity_id=${entity}`);
      if (!history || !history[0] || history[0].length < 2) return;

      const points = history[0].map(entry => parseFloat(entry.state)).filter(val => !isNaN(val));
      const current = points[points.length - 1];
      const previous = points[points.length - 2];

      const min = Math.min(...points);
      const max = Math.max(...points);
      const range = max - min === 0 ? 1 : max - min;
      const coords = points.map((p, idx) => `${(idx / (points.length - 1)) * 100},${30 - ((p - min) / range) * 30}`).join(' ');
      
      const sparkEl = this.shadowRoot.getElementById(`spark-${i}`);
      if (sparkEl) {
        sparkEl.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none" style="opacity:0.25;"><polyline fill="none" stroke="${color}" stroke-width="2" points="${coords}" /></svg>`;
      }

      const trendEl = this.shadowRoot.getElementById(`trend-${i}`);
      if (trendEl && current !== undefined && previous !== undefined) {
        let icon = 'mdi:minus';
        let iconColor = '#94a3b8';
        if (current > previous) {
          icon = 'mdi:arrow-up-bold';
          iconColor = (sensorName.toLowerCase().includes('poids') || sensorName.toLowerCase().includes('gras')) ? '#f87171' : '#4ade80';
        } else if (current < previous) {
          icon = 'mdi:arrow-down-bold';
          iconColor = (sensorName.toLowerCase().includes('poids') || sensorName.toLowerCase().includes('gras')) ? '#4ade80' : '#f87171';
        }
        trendEl.innerHTML = `<ha-icon icon="${icon}" style="--mdc-icon-size:14px; color:${iconColor};"></ha-icon>`;
      }
    } catch (e) { console.error(e); }
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
        const actuel = this._num(stPoids.state);
        const depart = this._num(pData.start);
        const ideal = this._num(pData.ideal);
        const range = depart - ideal;
        progPointer.style.left = `${Math.max(0, Math.min(100, (range !== 0 ? ((depart - actuel) / range) * 100 : 0)))}%`;
        progPointer.setAttribute('data-val', `${actuel} kg`);

        if (stDiff) {
            const valDiff = this._num(stDiff.state);
            progPointer.setAttribute('data-diff', `${valDiff > 0 ? '+' : ''}${valDiff} kg`);
            progPointer.style.setProperty('--diff-color', valDiff <= 0 ? '#4ade80' : '#f87171');
        }
    }

    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (valEl && stateObj) {
                valEl.textContent = `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`;
                this._renderTrends(s.entity, i, view === 'person1' ? '#38bdf8' : '#e91e63', s.name || '');
            }
        });
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view] || { sensors: [] };
    const accentColor = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._num(this._config.card_height, 600)}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._num(this._config.img_offset)}%; background-size: cover; opacity: 0.4; z-index: 1; pointer-events: none; background-image: url('${pData.image || ''}'); }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 11px; font-weight: bold; }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; box-shadow: 0 0 15px ${accentColor}; }
        
        .rule-container { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 85%; height: 75px; z-index: 30; }
        /* BARRE COLOREE ICI */
        .rule-track { 
          position: relative; 
          width: 100%; 
          height: 10px; 
          background: linear-gradient(to right, #f87171 0%, #fbbf24 65%, #4ade80 100%); 
          border-radius: 5px; 
          margin-top: 30px; 
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
        }
        
        .marker-label { position: absolute; top: 20px; font-size: 9px; transform: translateX(-50%); text-align: center; font-weight: 900; text-shadow: 1px 1px 2px black; }
        .prog-pointer { position: absolute; top: -12px; width: 4px; height: 34px; background: white; transition: left 1s ease; border-radius: 2px; box-shadow: 0 0 8px rgba(0,0,0,0.8); z-index: 10; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -22px; left: 50%; transform: translateX(-50%); background: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; color: #000; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .prog-pointer::before { content: attr(data-diff); position: absolute; top: 38px; left: 50%; transform: translateX(-50%); color: var(--diff-color); font-size: 12px; font-weight: 900; text-shadow: 1px 1px 2px black; }
        
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 5px; backdrop-filter: blur(5px); overflow: hidden; }
        .sparkline-container { position: absolute; bottom: 0; left: 0; width: 100%; height: 30px; z-index: -1; }
        .trend-icon { position: absolute; top: 5px; right: 5px; }
        ha-icon { --mdc-icon-size: 22px; color: ${accentColor}; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'P1'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'P2'}</button>
        </div>
        <div class="bg-img"></div>
        <div class="rule-container">
            <div class="rule-track">
                <div class="marker-label" style="left: 0; color: #f87171;">DÉPART<br>${pData.start}kg</div>
                <div class="marker-label" style="left: 65%; color: #fbbf24;">CONFORT<br>${pData.goal}kg</div>
                <div class="marker-label" style="left: 100%; color: #4ade80;">IDÉAL<br>${pData.ideal}kg</div>
                <div id="progression-pointer" class="prog-pointer" data-val="--" data-diff=""></div>
            </div>
        </div>
        ${(pData.sensors || []).map((s, i) => {
            const isIMC = s.name && (s.name.toLowerCase().includes('corpulence') || s.name.toLowerCase().includes('imc'));
            return `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%; width:${isIMC ? this._num(this._config.imc_width, 250) : this._num(this._config.b_width, 160)}px; height:${isIMC ? this._num(this._config.imc_height, 97) : this._num(this._config.b_height, 69)}px;">
              <div id="spark-${i}" class="sparkline-container"></div>
              <div id="trend-${i}" class="trend-icon"></div>
              <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
              <div style="font-size:10px; color:#cbd5e1; font-weight:bold;">${s.name}</div>
              <div id="value-${i}" style="font-weight:900; font-size:1.1em;">--</div>
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

// L'éditeur reste identique
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
        .t-btn { flex: 1; padding: 10px; background: #222; color: #888; border: 2px solid #444; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .t-btn.active { border-color: #38bdf8; color: white; background: #38bdf8; }
        .section { background: #252525; padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid #444; }
        label { color: #38bdf8; font-size: 11px; font-weight: bold; display: block; margin-top: 5px; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; box-sizing: border-box; }
        .s-card { background: #111; padding: 10px; margin-bottom: 10px; border-left: 4px solid #38bdf8; position: relative; }
        .add-btn { width: 100%; padding: 10px; background: #4ade80; color: black; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .del-btn { position: absolute; top: 5px; right: 5px; background: #f87171; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; padding: 2px 5px; }
      </style>
      <div class="ed-box">
        <div class="tab-menu">
            <button class="t-btn ${pKey==='person1'?'active':''}" id="t-p1">PATRICK</button>
            <button class="t-btn ${pKey==='person2'?'active':''}" id="t-p2">SANDRA</button>
        </div>
        <div class="section">
            <label>NOM DU PROFIL</label><input type="text" id="inp-name" value="${p.name}">
            <label>IMAGE URL</label><input type="text" id="inp-img" value="${p.image || ''}">
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px;">
                <div><label>DÉPART</label><input type="number" id="inp-start" value="${p.start}"></div>
                <div><label>CONFORT</label><input type="number" id="inp-goal" value="${p.goal}"></div>
                <div><label>IDÉAL</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
            </div>
        </div>
        <div class="section">
            <label>HAUTEUR CARTE</label><input type="number" id="inp-ch" value="${this._config.card_height || 600}">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div><label>LARG. STD</label><input type="number" id="inp-bw" value="${this._config.b_width || 160}"></div>
              <div><label>HAUT. STD</label><input type="number" id="inp-bh" value="${this._config.b_height || 69}"></div>
              <div><label>LARG. IMC</label><input type="number" id="inp-iw" value="${this._config.imc_width || 250}"></div>
              <div><label>HAUT. IMC</label><input type="number" id="inp-ih" value="${this._config.imc_height || 97}"></div>
            </div>
        </div>
        <div class="section">
            <h4 style="margin:0 0 10px 0; color:#38bdf8;">⚙️ CAPTEURS & TENDANCES</h4>
            <div id="sensors-container">
            ${p.sensors.map((s, i) => `
              <div class="s-card">
                <button class="del-btn" data-idx="${i}">X</button>
                <label>NOM</label><input type="text" class="s-name" data-idx="${i}" value="${s.name}">
                <label>ENTITÉ</label><input type="text" class="s-ent" data-idx="${i}" value="${s.entity}">
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:5px; margin-top:5px;">
                    <div><label>ICÔNE</label><input type="text" class="s-icon" data-idx="${i}" value="${s.icon || ''}"></div>
                    <div><label>X %</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div>
                    <div><label>Y %</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div>
                </div>
              </div>
            `).join('')}
            </div>
            <button class="add-btn" id="add-sensor">➕ AJOUTER UN CAPTEUR</button>
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
    this.querySelector('#inp-bh').onchange = (e) => { this._config.b_height = e.target.value; this._fire(); };
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
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V76" });
