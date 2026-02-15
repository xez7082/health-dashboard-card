/**
 * HEALTH DASHBOARD CARD – VERSION 67.7 (COORDINATES FIX)
 * Gère les guillemets dans le YAML pour X et Y.
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

  updateSensors() {
    if (!this._hass || !this.shadowRoot) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    if (!pData) return;

    const sensors = pData.sensors || pData.entities || [];
    const suffix = (view === 'person2') ? '_sandra' : '_patrick';
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    
    // 1. Barre de progression
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

    // 2. Mise à jour des valeurs
    sensors.forEach((s, i) => {
        const valEl = this.shadowRoot.getElementById(`value-${i}`);
        const stateObj = this._hass.states[s.entity];
        if (valEl && stateObj) {
            const isHydra = s.name && s.name.toLowerCase().includes('hydratation');
            const unit = isHydra ? '%' : (stateObj.attributes.unit_of_measurement || '');
            valEl.textContent = `${stateObj.state}${unit}`;
        }
    });
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view] || {};
    const sensors = pData.sensors || pData.entities || [];
    const accentColor = pData.accent_color || '#38bdf8';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center 0%; background-size: cover; opacity: 0.4; background-image: url('${pData.image || ''}'); z-index:1; }
        .topbar { position: absolute; top: 20px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 20px; background: rgba(0,0,0,0.5); color: white; cursor: pointer; }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; }
        .rule-container { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); width: 85%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; z-index: 30; }
        .prog-pointer { position: absolute; top: -12px; width: 4px; height: 30px; background: ${accentColor}; border-radius: 2px; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: ${accentColor}; padding: 2px 8px; border-radius: 6px; font-size: 11px; color:#000; font-weight:bold; white-space:nowrap; }
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 12px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; z-index: 10; padding: 8px; min-width: 140px; }
        ha-icon { color: ${accentColor}; margin-bottom: 4px; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'P1'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'P2'}</button>
        </div>
        <div class="bg-img"></div>
        <div class="rule-container"><div id="progression-pointer" class="prog-pointer" data-val="--"></div></div>
        ${sensors.map((s, i) => {
            // NETTOYAGE DES COORDONNÉES (enlève les guillemets du YAML)
            const posX = parseFloat(s.x);
            const posY = parseFloat(s.y);
            return `
            <div class="sensor" style="left:${posX}%; top:${posY}%;">
              <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
              <div style="font-size:10px; color:#94a3b8;">${s.name || ''}</div>
              <div id="value-${i}" style="font-weight:bold; font-size:14px;">--</div>
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
  setConfig(config) { this._config = config; this.render(); }
  render() {
    const pKey = this._config.current_view || 'person1';
    this.innerHTML = `<div style="padding:20px; background:#1c1c1e; color:white;">
      <h3>Configuration ${pKey}</h3>
      <p>Modifiez le YAML pour ajuster les positions X/Y avec précision.</p>
    </div>`;
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V67.7", preview: true });
