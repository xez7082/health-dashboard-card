/**
 * HEALTH DASHBOARD CARD – V70.0 (ULTIMATE VISUAL EDITOR)
 * Permet de modifier les positions X/Y et les entités sans YAML.
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

  updateSensors() {
    if (!this._hass || !this.shadowRoot) return;
    const pData = this._config[this._config.current_view];
    if (!pData || !pData.sensors) return;

    pData.sensors.forEach((s, i) => {
        const valEl = this.shadowRoot.getElementById(`value-${i}`);
        const stateObj = this._hass.states[s.entity];
        if (valEl && stateObj) {
            const isHydra = s.name && s.name.toLowerCase().includes('eau');
            valEl.textContent = `${stateObj.state}${isHydra ? '%' : (stateObj.attributes.unit_of_measurement || '')}`;
        }
    });
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view] || { sensors: [] };
    const accentColor = pData.accent_color || (view === 'person1' ? '#2196f3' : '#e91e63');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._num(this._config.card_height, 600)}px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._num(this._config.img_offset)}%; background-size: cover; opacity: 0.45; z-index: 1; background-image: url('${pData.image || ''}'); }
        .topbar { position: absolute; top: 25px; width: 100%; display: flex; justify-content: center; gap: 15px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 30px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; font-weight: bold; backdrop-filter: blur(8px); }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; }
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 16px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 5px; backdrop-filter: blur(12px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        ha-icon { --mdc-icon-size: 24px; color: ${accentColor}; }
        .val-text { font-weight: 900; font-size: 15px; }
        .label-text { font-size: 9px; color: #94a3b8; text-transform: uppercase; text-align: center; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'Patrick'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'Sandra'}</button>
        </div>
        <div class="bg-img"></div>
        ${(pData.sensors || []).map((s, i) => {
            const isIMC = s.name && s.name.toUpperCase() === 'IMC';
            const w = isIMC ? this._num(this._config.imc_width, 250) : this._num(this._config.b_width, 160);
            const h = isIMC ? this._num(this._config.imc_height, 97) : this._num(this._config.b_height, 69);
            return `
            <div class="sensor" style="left:${this._num(s.x)}%; top:${this._num(s.y)}%; width:${w}px; height:${h}px;">
              <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
              <div class="label-text">${s.name}</div>
              <div id="value-${i}" class="val-text">--</div>
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

// --- ÉDITEUR AVEC GESTION DES CAPTEURS ---
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { 
    this._config = config;
    this._selectedSensorIndex = 0;
    this.render(); 
  }

  render() {
    if (!this._config) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey] || { sensors: [] };
    const sensors = p.sensors || [];
    const s = sensors[this._selectedSensorIndex] || {};

    this.innerHTML = `
      <style>
        .ed-container { font-family: sans-serif; color: #e1e1e1; padding: 10px; }
        .section { background: #2c2c2e; padding: 12px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #38bdf8; }
        .section-title { font-weight: bold; font-size: 12px; margin-bottom: 10px; color: #38bdf8; text-transform: uppercase; }
        label { font-size: 11px; color: #8e8e93; display: block; margin-top: 8px; }
        input, select { width: 100%; padding: 8px; background: #3a3a3c; color: white; border: 1px solid #48484a; border-radius: 6px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      </style>
      <div class="ed-container">
        <div class="section">
          <div class="section-title">📍 Gestionnaire de Capteurs</div>
          <label>Choisir un capteur à régler</label>
          <select id="sensor-select">
            ${sensors.map((item, idx) => `<option value="${idx}" ${this._selectedSensorIndex == idx ? 'selected' : ''}>${item.name || item.entity}</option>`).join('')}
          </select>
          
          <div style="margin-top:15px; padding-top:15px; border-top: 1px solid #444;">
            <label>Nom du capteur</label>
            <input type="text" id="s-name" value="${s.name || ''}">
            <label>Entité (sensor.xxx)</label>
            <input type="text" id="s-entity" value="${s.entity || ''}">
            <div class="grid">
              <div><label>Position X (%)</label><input type="number" id="s-x" value="${parseFloat(s.x) || 0}"></div>
              <div><label>Position Y (%)</label><input type="number" id="s-y" value="${parseFloat(s.y) || 0}"></div>
            </div>
            <label>Icône (mdi:xxx)</label>
            <input type="text" id="s-icon" value="${s.icon || ''}">
          </div>
        </div>

        <div class="section" style="border-left-color: #f13ba6;">
          <div class="section-title">⚙️ Réglages Globaux</div>
          <div class="grid">
             <div><label>Profil actif</label>
               <select id="ed-view"><option value="person1" ${pKey==='person1'?'selected':''}>Patrick</option><option value="person2" ${pKey==='person2'?'selected':''}>Sandra</option></select>
             </div>
             <div><label>Couleur</label><input type="color" id="ed-color" value="${p.accent_color || '#2196f3'}"></div>
          </div>
        </div>
      </div>
    `;

    // Listeners Capteur
    this.querySelector('#sensor-select').addEventListener('change', (e) => { this._selectedSensorIndex = e.target.value; this.render(); });
    this.querySelector('#s-name').addEventListener('change', (e) => this._updateSensor('name', e.target.value));
    this.querySelector('#s-entity').addEventListener('change', (e) => this._updateSensor('entity', e.target.value));
    this.querySelector('#s-x').addEventListener('change', (e) => this._updateSensor('x', e.target.value));
    this.querySelector('#s-y').addEventListener('change', (e) => this._updateSensor('y', e.target.value));
    this.querySelector('#s-icon').addEventListener('change', (e) => this._updateSensor('icon', e.target.value));
    
    // Listeners Globaux
    this.querySelector('#ed-view').addEventListener('change', (e) => {
        const nc = JSON.parse(JSON.stringify(this._config));
        nc.current_view = e.target.value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: nc }, bubbles: true, composed: true }));
    });
    this.querySelector('#ed-color').addEventListener('change', (e) => {
        const nc = JSON.parse(JSON.stringify(this._config));
        nc[this._config.current_view].accent_color = e.target.value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: nc }, bubbles: true, composed: true }));
    });
  }

  _updateSensor(field, value) {
    const nc = JSON.parse(JSON.stringify(this._config));
    const pKey = nc.current_view || 'person1';
    nc[pKey].sensors[this._selectedSensorIndex][field] = value;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: nc }, bubbles: true, composed: true }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V70", preview: true });
