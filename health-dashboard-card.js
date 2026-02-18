class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    // SÉCURITÉ : On crée une copie propre et on vérifie chaque bloc
    this._config = JSON.parse(JSON.stringify(config));
    
    if (!this._config.person1) this._config.person1 = { name: "Patrick", sensors: [], start:0, goal:0, ideal:0 };
    if (!this._config.person2) this._config.person2 = { name: "Sandra", sensors: [], start:0, goal:0, ideal:0 };
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
    const state = this._hass.states['sensor.withings_poids' + suffix];
    const valEl = this.shadowRoot.getElementById('val-poids');
    if (state && valEl) valEl.textContent = state.state + " kg";
  }

  render() {
    const view = this._config.current_view;
    const p = this._config[view];
    this.shadowRoot.innerHTML = `
      <div style="background:#1a1a1a; padding:20px; border-radius:10px; color:white; text-align:center;">
        <h2>${p.name}</h2>
        <div id="val-poids" style="font-size:2em; font-weight:bold;">-- kg</div>
        <button id="btn-sw" style="margin-top:10px; padding:10px; cursor:pointer;">Changer de profil</button>
      </div>
    `;
    this.shadowRoot.getElementById('btn-sw').onclick = () => {
      this._config.current_view = (view === 'person1') ? 'person2' : 'person1';
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
      this.render();
    };
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  render() {
    // SÉCURITÉ : Si l'objet est vide pendant l'édition, on ne crash pas
    const n1 = this._config.person1?.name || "Patrick";
    const n2 = this._config.person2?.name || "Sandra";

    this.innerHTML = `
      <div style="padding: 20px; color: black; background: #f0f0f0;">
        <label>Nom de Patrick</label><br>
        <input id="in1" type="text" value="${n1}" style="width:100%"><br><br>
        <label>Nom de Sandra</label><br>
        <input id="in2" type="text" value="${n2}" style="width:100%">
      </div>
    `;

    this.querySelector('#in1').onchange = (e) => this._save('person1', e.target.value);
    this.querySelector('#in2').onchange = (e) => this._save('person2', e.target.value);
  }

  _save(person, val) {
    this._config[person].name = val;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard V80.7",
  description: "Carte de santé avec éditeur sécurisé"
});
