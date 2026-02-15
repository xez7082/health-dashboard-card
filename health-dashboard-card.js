/**
 * HEALTH DASHBOARD CARD – V67.1 SAFE MODE
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

  updateSensors() {
    if (!this._hass || !this.shadowRoot) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    if (!pData) return;

    const suffix = view === 'person2' ? '_sandra' : '_patrick';
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    if (stPoids && progPointer) {
        const actuel = parseFloat(stPoids.state);
        const depart = parseFloat(pData.start || 76);
        const ideal = parseFloat(pData.ideal || 58);
        const range = depart - ideal;
        let pct = ((depart - actuel) / range) * 100;
        progPointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        progPointer.setAttribute('data-val', `${actuel} kg`);
    }

    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (valEl && stateObj) {
                const isHydra = s.name.toLowerCase().includes('hydratation');
                valEl.textContent = `${stateObj.state}${isHydra ? '%' : (stateObj.attributes.unit_of_measurement || '')}`;
            }
        });
    }
  }

  render() {
    const view = this._config.current_view;
    const pData = this._config[view] || { sensors: [] };
    const accentColor = pData.accent_color || '#38bdf8';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 16px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center 0%; background-size: cover; opacity: 0.4; z-index: 1; }
        .topbar { position: absolute; top: 20px; width: 100%; display: flex; justify-content: center; gap: 12px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 25px; background: rgba(0,0,0,0.5); color: white; cursor: pointer; }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; }
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 85%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; z-index: 30; }
        .prog-pointer { position: absolute; top: -12px; width: 4px; height: 30px; background: ${accentColor}; border-radius: 2px; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: ${accentColor}; padding: 2px 8px; border-radius: 6px; font-size: 11px; }
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 12px; background: rgba(15, 23, 42, 0.85); padding: 8px; display: flex; flex-direction: column; align-items: center; z-index: 10; border: 1px solid rgba(255,255,255,0.1); }
        ha-icon { color: ${accentColor}; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'P1'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'P2'}</button>
        </div>
        <div class="bg-img" style="background-image: url('${pData.image || ''}')"></div>
        <div class="rule-container"><div id="progression-pointer" class="prog-pointer" data-val="--"></div></div>
        ${(pData.sensors || []).map((s, i) => `
          <div class="sensor" style="left:${s.x}%; top:${s.y}%; width:150px;">
            <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
            <div style="font-size:10px; color:#94a3b8;">${s.name}</div>
            <div id="value-${i}" style="font-weight:bold; font-size:14px;">--</div>
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

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this.render(); }
  render() {
    this.innerHTML = `
      <div style="padding: 20px;">
        <p style="color: red; font-weight: bold;">Éditeur Visuel en maintenance.</p>
        <p>Utilisez l'éditeur de code (YAML) en bas de la fenêtre pour configurer la carte.</p>
      </div>
    `;
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V67.1", preview: true });
