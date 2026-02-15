/**
 * HEALTH DASHBOARD CARD – V69.0 (FULL VISUAL EDITOR)
 * Éditeur complet pour toutes les variables de la carte.
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    if (!config) throw new Error("Configuration invalide");
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
    const view = this._config.current_view;
    const pData = this._config[view];
    if (!pData || !pData.sensors) return;

    const suffix = (view === 'person2') ? '_sandra' : '_patrick';
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    if (stPoids && progPointer) {
        const actuel = this._num(stPoids.state);
        const depart = this._num(pData.start);
        const ideal = this._num(pData.ideal);
        const range = depart - ideal;
        let pct = range !== 0 ? ((depart - actuel) / range) * 100 : 0;
        progPointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        progPointer.setAttribute('data-val', `${actuel} kg`);
    }

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
        .bg-img { position: absolute; inset: 0; background-position: center ${this._num(this._config.img_offset)}%; background-size: cover; opacity: 0.45; z-index: 1; background-image: url('${pData.image || ''}'); transition: 0.5s; }
        .topbar { position: absolute; top: 25px; width: 100%; display: flex; justify-content: center; gap: 15px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 30px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; font-weight: bold; backdrop-filter: blur(8px); }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; box-shadow: 0 0 20px ${accentColor}66; }
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 88%; height: 60px; z-index: 30; background: rgba(15, 23, 42, 0.7); border-radius: 16px; padding: 10px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .rule-track { position: relative; width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 25px; }
        .prog-pointer { position: absolute; top: -12px; width: 4px; height: 30px; background: ${accentColor}; border-radius: 2px; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: ${accentColor}; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; color: #000; white-space: nowrap; }
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
        <div class="rule-container">
            <div class="rule-track">
                <div style="position:absolute; left:0; top:12px; font-size:9px; color:#f87171;">DÉPART ${this._num(pData.start)}kg</div>
                <div style="position:absolute; right:0; top:12px; font-size:9px; color:#4ade80; text-align:right;">IDÉAL ${this._num(pData.ideal)}kg</div>
                <div id="progression-pointer" class="prog-pointer" data-val="--" data-diff=""></div>
            </div>
        </div>
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

// --- ÉDITEUR VISUEL SURVITAMINÉ ---
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = config; this.render(); }

  render() {
    if (!this._config) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey] || {};

    this.innerHTML = `
      <style>
        .ed-container { font-family: sans-serif; color: #e1e1e1; }
        .section { background: #2c2c2e; padding: 12px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196f3; }
        .section-title { font-weight: bold; font-size: 13px; margin-bottom: 10px; color: #38bdf8; text-transform: uppercase; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        label { font-size: 11px; color: #8e8e93; display: block; margin-bottom: 4px; }
        input, select { width: 100%; padding: 8px; background: #3a3a3c; color: white; border: 1px solid #48484a; border-radius: 6px; box-sizing: border-box; }
        .full { grid-column: span 2; }
      </style>
      <div class="ed-container">
        <div class="section">
          <div class="section-title">👤 Profil Actuel</div>
          <select id="ed-view">
            <option value="person1" ${pKey === 'person1' ? 'selected' : ''}>Patrick (Profil 1)</option>
            <option value="person2" ${pKey === 'person2' ? 'selected' : ''}>Sandra (Profil 2)</option>
          </select>
        </div>

        <div class="section">
          <div class="section-title">🖼️ Apparence & Fond</div>
          <div class="grid">
            <div class="full"><label>Nom Affiché</label><input type="text" id="ed-name" value="${p.name || ''}"></div>
            <div class="full"><label>URL Image</label><input type="text" id="ed-img" value="${p.image || ''}"></div>
            <div><label>Hauteur Carte (px)</label><input type="number" id="ed-h" value="${this._config.card_height || 600}"></div>
            <div><label>Offset Image (%)</label><input type="number" id="ed-off" value="${this._config.img_offset || 0}"></div>
            <div class="full"><label>Couleur d'accent</label><input type="color" id="ed-color" value="${p.accent_color || '#2196f3'}"></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">⚖️ Objectifs de Poids</div>
          <div class="grid">
            <div><label>Poids Départ</label><input type="number" id="ed-start" value="${p.start || 0}"></div>
            <div><label>Poids Idéal</label><input type="number" id="ed-ideal" value="${p.ideal || 0}"></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">🔳 Taille des Bulles</div>
          <div class="grid">
            <div><label>Largeur Standard</label><input type="number" id="ed-bw" value="${this._config.b_width || 160}"></div>
            <div><label>Hauteur Standard</label><input type="number" id="ed-bh" value="${this._config.b_height || 69}"></div>
            <div><label>Largeur IMC</label><input type="number" id="ed-imcw" value="${this._config.imc_width || 250}"></div>
            <div><label>Hauteur IMC</label><input type="number" id="ed-imch" value="${this._config.imc_height || 97}"></div>
          </div>
        </div>
      </div>
    `;

    // Listeners
    this.querySelector('#ed-view').addEventListener('change', (e) => this._updateGlobal('current_view', e.target.value));
    this.querySelector('#ed-h').addEventListener('change', (e) => this._updateGlobal('card_height', e.target.value));
    this.querySelector('#ed-off').addEventListener('change', (e) => this._updateGlobal('img_offset', e.target.value));
    this.querySelector('#ed-bw').addEventListener('change', (e) => this._updateGlobal('b_width', e.target.value));
    this.querySelector('#ed-bh').addEventListener('change', (e) => this._updateGlobal('b_height', e.target.value));
    this.querySelector('#ed-imcw').addEventListener('change', (e) => this._updateGlobal('imc_width', e.target.value));
    this.querySelector('#ed-imch').addEventListener('change', (e) => this._updateGlobal('imc_height', e.target.value));

    this.querySelector('#ed-name').addEventListener('change', (e) => this._updateLocal('name', e.target.value));
    this.querySelector('#ed-img').addEventListener('change', (e) => this._updateLocal('image', e.target.value));
    this.querySelector('#ed-color').addEventListener('change', (e) => this._updateLocal('accent_color', e.target.value));
    this.querySelector('#ed-start').addEventListener('change', (e) => this._updateLocal('start', e.target.value));
    this.querySelector('#ed-ideal').addEventListener('change', (e) => this._updateLocal('ideal', e.target.value));
  }

  _updateGlobal(field, value) {
    const newConf = JSON.parse(JSON.stringify(this._config));
    newConf[field] = value;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: newConf }, bubbles: true, composed: true }));
  }

  _updateLocal(field, value) {
    const pKey = this._config.current_view || 'person1';
    const newConf = JSON.parse(JSON.stringify(this._config));
    newConf[pKey][field] = value;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: newConf }, bubbles: true, composed: true }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V69", preview: true });
