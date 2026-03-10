class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  static getStubConfig() {
    return {
      type: "custom:health-dashboard-card",
      card_height: 600, card_round: 20,
      person1: { name: "Patrick", start: 85, ideal: 72, comfort: 78, step_goal: 10000, sensors: [{name: "IMC", entity: "", x: 20, y: 20, is_circle: true, size: 90}] },
      person2: { name: "Sandra", start: 70, ideal: 60, comfort: 65, step_goal: 8000, sensors: [] }
    };
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateValues();
  }

  updateValues() {
    if (!this._hass || !this.shadowRoot) return;
    const p = this._config[this._config.current_view || 'person1'];
    
    // Mise à jour des capteurs dynamiques
    if (p.sensors) {
      p.sensors.forEach((s, i) => {
        const el = this.shadowRoot.getElementById(`val-${i}`);
        const stateObj = this._hass.states[s.entity];
        if (el && stateObj) {
          el.textContent = `${stateObj.state}${stateObj.attributes.unit_of_measurement || ''}`;
        }
      });
    }

    // Mise à jour de la règle de poids
    const weightObj = this._hass.states[p.weight_entity];
    if (weightObj) {
        const current = parseFloat(weightObj.state);
        const range = p.start - p.ideal;
        const pct = range !== 0 ? ((p.start - current) / range) * 100 : 0;
        const ptr = this.shadowRoot.getElementById('ptr');
        if (ptr) ptr.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        const lbl = this.shadowRoot.getElementById('ptr-lbl');
        if (lbl) lbl.textContent = current + 'kg';
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view || 'person1';
    const p = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .card { position: relative; width: 100%; height: ${this._config.card_height}px; background: #0f172a; border-radius: ${this._config.card_round}px; overflow: hidden; color: white; font-family: sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${p.image}') center/cover; opacity: 0.4; }
        .tabs { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 10; }
        .tab { padding: 8px 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.5); color: white; cursor: pointer; font-weight: bold; }
        .tab.active { background: ${accent}; color: black; border-color: ${accent}; }
        
        .box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.8); border: 2px solid ${accent}; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(10px); text-align: center; }
        .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; }
        .value { font-weight: 900; font-size: 16px; }

        .rule { position: absolute; bottom: 40px; left: 5%; width: 90%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; }
        .rule-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 5px; }
        .pointer { position: absolute; top: -10px; width: 4px; height: 30px; background: white; transition: left 1s; }
        .bubble { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 2px 8px; border-radius: 5px; font-weight: bold; font-size: 12px; }
      </style>
      <div class="card">
        <div class="bg"></div>
        <div class="tabs">
            <div class="tab ${view==='person1'?'active':''}" onclick="this.getRootNode().host.setView('person1')">${this._config.person1.name}</div>
            <div class="tab ${view==='person2'?'active':''}" onclick="this.getRootNode().host.setView('person2')">${this._config.person2.name}</div>
        </div>

        ${(p.sensors || []).map((s, i) => `
            <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.is_circle ? s.size : 130}px; height:${s.is_circle ? s.size : 70}px; border-radius:${s.is_circle ? '50%' : '10px'};">
                <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
                <div class="label">${s.name}</div>
                <div class="value" id="val-${i}">--</div>
            </div>
        `).join('')}

        <div class="rule">
            <div class="rule-fill"></div>
            <div id="ptr" class="pointer"><div id="ptr-lbl" class="bubble">--</div></div>
        </div>
      </div>
    `;
  }

  setView(v) { this._config.current_view = v; this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } })); this.render(); }
}

// EDITEUR DE LA CARTE
class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  render() {
    this.innerHTML = `
      <div style="padding: 20px; background: #222; color: white;">
        <h3 style="color: #38bdf8;">⚙️ CONFIGURATION GENERALE</h3>
        <label>Hauteur Carte</label>
        <input type="number" id="h" style="width:100%;" value="${this._config.card_height}">
        
        <h3 style="color: #38bdf8; margin-top:20px;">👤 PROFIL ACTIF</h3>
        <p>Utilisez la carte pour changer de profil avant de régler les capteurs.</p>
        
        <div id="sensors-list"></div>
        <button id="add" style="width:100%; padding: 10px; margin-top:10px; background:#38bdf8; border:none; font-weight:bold;">➕ AJOUTER UN CAPTEUR</button>
      </div>
    `;

    this.querySelector('#h').onchange = (e) => { this._config.card_height = e.target.value; this.save(); };
    this.querySelector('#add').onclick = () => {
        const view = this._config.current_view || 'person1';
        if (!this._config[view].sensors) this._config[view].sensors = [];
        this._config[view].sensors.push({name: "Nouveau", entity: "", x: 50, y: 50, is_circle: false, size: 90});
        this.save();
        this.render();
    };
  }

  save() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard V3.0",
  description: "Carte de santé entièrement paramétrable"
});
