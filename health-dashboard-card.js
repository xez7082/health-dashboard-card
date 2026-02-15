/**
 * HEALTH DASHBOARD CARD – V68.0 (TOTAL YAML COMPATIBILITY)
 * Gère automatiquement les guillemets et les formats textes du YAML.
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

  // Convertit n'importe quelle valeur (texte ou nombre) en nombre pur
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
    const stDiff = this._hass.states['sensor.difference_poids' + suffix];
    
    // Mise à jour du curseur de poids
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    if (stPoids && progPointer) {
        const actuel = this._num(stPoids.state);
        const depart = this._num(pData.start);
        const ideal = this._num(pData.ideal);
        const range = depart - ideal;
        let pct = range !== 0 ? ((depart - actuel) / range) * 100 : 0;
        progPointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        progPointer.setAttribute('data-val', `${actuel} kg`);

        if (stDiff) {
            const d = this._num(stDiff.state);
            progPointer.setAttribute('data-diff', `${d > 0 ? '+' : ''}${d} kg`);
            progPointer.style.setProperty('--diff-color', d <= 0 ? '#4ade80' : '#f87171');
        }
    }

    // Mise à jour de chaque bulle
    pData.sensors.forEach((s, i) => {
        const valEl = this.shadowRoot.getElementById(`value-${i}`);
        const stateObj = this._hass.states[s.entity];
        if (valEl && stateObj) {
            const isHydra = s.name && s.name.toLowerCase().includes('eau');
            const unit = isHydra ? '%' : (stateObj.attributes.unit_of_measurement || '');
            valEl.textContent = `${stateObj.state}${unit}`;
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
        
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 88%; height: 90px; z-index: 30; background: rgba(15, 23, 42, 0.7); border-radius: 16px; padding: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 35px; }
        .prog-pointer { position: absolute; top: -14px; width: 4px; height: 36px; background: ${accentColor}; transition: left 1s ease; border-radius: 2px; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -28px; left: 50%; transform: translateX(-50%); background: ${accentColor}; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: bold; color: #000; white-space: nowrap; }
        .prog-pointer::before { content: attr(data-diff); position: absolute; top: 42px; left: 50%; transform: translateX(-50%); color: var(--diff-color); font-size: 14px; font-weight: bold; }

        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 16px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 10px; backdrop-filter: blur(12px); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        ha-icon { --mdc-icon-size: 26px; color: ${accentColor}; margin-bottom: 4px; }
        .val-text { font-weight: 900; font-size: 16px; }
        .label-text { font-size: 10px; color: #94a3b8; text-transform: uppercase; text-align: center; }
      </style>

      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'Patrick'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'Sandra'}</button>
        </div>
        <div class="bg-img"></div>
        <div class="rule-container">
            <div class="rule-track">
                <div style="position:absolute; left:0; top:18px; font-size:10px; color:#f87171;">DÉPART ${this._num(pData.start)}kg</div>
                <div style="position:absolute; right:0; top:18px; font-size:10px; color:#4ade80; text-align:right;">IDÉAL ${this._num(pData.ideal)}kg</div>
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

// ÉDITEUR SIMPLIFIÉ
class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this.render(); }
  render() {
    this.innerHTML = `
      <div style="padding: 20px; background: #1c1c1e; color: white; border-radius: 12px;">
        <h3 style="color: #2196f3;">Health Dashboard V68.0</h3>
        <p>L'affichage est maintenant synchronisé avec votre YAML.</p>
        <p style="font-size: 11px; color: #8e8e93;">Si les capteurs ne bougent pas, vérifiez que vous n'avez pas de doublons dans vos ressources Lovelace.</p>
      </div>
    `;
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V68", preview: true });
