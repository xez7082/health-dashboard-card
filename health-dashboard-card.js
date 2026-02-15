/**
 * HEALTH DASHBOARD CARD – V67.2 (TOTAL REPAIR)
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
        progPointer.style.left = "50%"; // Simplifié pour test
        progPointer.setAttribute('data-val', `${stPoids.state} kg`);
    }
  }

  render() {
    const view = this._config.current_view;
    const pData = this._config[view] || { sensors: [] };
    const accentColor = pData.accent_color || '#38bdf8';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 16px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-size: cover; opacity: 0.4; background-image: url('${pData.image || ''}'); }
        .topbar { position: absolute; top: 20px; width: 100%; display: flex; justify-content: center; gap: 12px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 25px; background: rgba(0,0,0,0.5); color: white; cursor: pointer; }
        .btn.active { background: ${accentColor} !important; }
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 85%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; }
        .prog-pointer { position: absolute; top: -12px; width: 4px; height: 30px; background: ${accentColor}; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 11px; white-space: nowrap; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">P1</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">P2</button>
        </div>
        <div class="bg-img"></div>
        <div class="rule-container"><div id="progression-pointer" class="prog-pointer" data-val="--"></div></div>
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

// L'ÉDITEUR - VERSION ULTRA-STABLE
class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }
  render() {
    this.innerHTML = `
      <div style="padding: 20px; color: #333;">
        <h2 style="color: #03a9f4;">Health Dashboard Editor V67.2</h2>
        <p>Si vous voyez ce message, l'éditeur fonctionne enfin !</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px;">
           <label>Nom du profil 1</label><br>
           <input type="text" id="p1-name" value="${this._config.person1?.name || ''}" style="width:100%;">
        </div>
        <p style="margin-top:10px; font-style:italic;">Utilisez le bouton "Éditeur de code" en bas pour les réglages avancés.</p>
      </div>
    `;
    this.querySelector('#p1-name').onchange = (e) => {
        const newConf = JSON.parse(JSON.stringify(this._config));
        newConf.person1.name = e.target.value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: newConf }, bubbles: true, composed: true }));
    };
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard V67.2",
  preview: true
});
