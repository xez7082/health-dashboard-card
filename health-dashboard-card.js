/**
 * HEALTH DASHBOARD CARD – VERSION 67.3 (FULL RESTORE)
 * Author: xez7082
 * Features: X/Y Positions, IMC Specific Sizing, Trend Arrows, Auto-Hydration %, Dynamic Accents.
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

  // Mise à jour temps réel des états
  updateSensors() {
    if (!this._hass || !this.shadowRoot) return;
    const view = this._config.current_view;
    const pData = this._config[view];
    if (!pData) return;

    const suffix = (view === 'person2') ? '_sandra' : '_patrick';
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const stDiff = this._hass.states['sensor.difference_poids' + suffix];
    
    // 1. Mise à jour de la barre de progression
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    if (stPoids && progPointer) {
        const actuel = parseFloat(stPoids.state);
        const depart = parseFloat(pData.start || 76);
        const ideal = parseFloat(pData.ideal || 58);
        const range = depart - ideal;
        let pct = ((depart - actuel) / range) * 100;
        progPointer.style.left = `${Math.max(0, Math.min(100, pct))}%`;
        progPointer.setAttribute('data-val', `${actuel} ${stPoids.attributes.unit_of_measurement || 'kg'}`);

        if (stDiff) {
            const valDiff = parseFloat(stDiff.state);
            const color = valDiff <= 0 ? '#4ade80' : '#f87171';
            progPointer.setAttribute('data-diff', `${valDiff > 0 ? '+' : ''}${valDiff} kg`);
            progPointer.style.setProperty('--diff-color', color);
        }
    }

    // 2. Mise à jour des bulles de capteurs
    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (valEl && stateObj) {
                // RÈGLE : Hydratation -> % automatique
                const isHydra = s.name.toLowerCase().includes('hydratation');
                const unit = isHydra ? '%' : (stateObj.attributes.unit_of_measurement || '');
                valEl.textContent = `${stateObj.state}${unit}`;
            }
        });
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const pData = this._config[view] || { sensors: [] };
    const accentColor = pData.accent_color || '#38bdf8';

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: 'Segoe UI', Roboto, sans-serif; color: white; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._config.img_offset || 0}%; background-size: cover; opacity: 0.45; z-index: 1; transition: background-image 0.6s ease-in-out; background-image: url('${pData.image || ''}'); }
        
        .topbar { position: absolute; top: 25px; width: 100%; display: flex; justify-content: center; gap: 15px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 30px; background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; font-weight: 700; backdrop-filter: blur(8px); transition: 0.3s; text-transform: uppercase; letter-spacing: 1px; }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; box-shadow: 0 0 20px ${accentColor}66; }
        
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 88%; height: 90px; z-index: 30; background: rgba(15, 23, 42, 0.6); border-radius: 16px; padding: 12px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 35px; }
        .prog-pointer { position: absolute; top: -14px; width: 4px; height: 36px; background: ${accentColor}; transition: left 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); border-radius: 2px; box-shadow: 0 0 10px ${accentColor}; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -28px; left: 50%; transform: translateX(-50%); background: ${accentColor}; padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 900; white-space: nowrap; color: #000; }
        .prog-pointer::before { content: attr(data-diff); position: absolute; top: 42px; left: 50%; transform: translateX(-50%); color: var(--diff-color); font-size: 14px; font-weight: 900; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 16px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 10px; backdrop-filter: blur(12px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .sparkline-bg { position: absolute; bottom: 0; left: 0; width: 100%; height: 35px; opacity: 0.15; pointer-events: none; }
        ha-icon { --mdc-icon-size: 26px; color: ${accentColor}; margin-bottom: 4px; filter: drop-shadow(0 0 5px ${accentColor}44); }
        .val-text { font-weight: 900; font-size: 16px; color: #fff; z-index: 2; }
        .label-text { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; z-index: 2; }
      </style>

      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'Patrick'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'Sandra'}</button>
        </div>
        <div class="bg-img"></div>
        <div class="rule-container">
            <div class="rule-track">
                <div style="position:absolute; left:0; top:18px; font-size:10px; color:#f87171; font-weight:bold;">DÉPART<br>${pData.start}kg</div>
                <div style="position:absolute; right:0; top:18px; font-size:10px; color:#4ade80; text-align:right; font-weight:bold;">IDÉAL<br>${pData.ideal}kg</div>
                <div id="progression-pointer" class="prog-pointer" data-val="--" data-diff=""></div>
            </div>
        </div>
        ${(pData.sensors || []).map((s, i) => {
            const isIMC = s.name.toLowerCase().includes('imc') || s.name.toLowerCase().includes('corpulence');
            const w = isIMC ? (this._config.imc_width||170) : (this._config.b_width||155);
            const h = isIMC ? (this._config.imc_height||85) : (this._config.b_height||80);
            return `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%; width:${w}px; height:${h}px;">
              <svg class="sparkline-bg" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0,25 Q25,5 50,20 T100,10" fill="none" stroke="${accentColor}" stroke-width="2"/></svg>
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

// --- ÉDITEUR VISUEL COMPLET ---
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = config; this.render(); }

  render() {
    if (!this._config || !this._hass) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey] || {};

    this.innerHTML = `
      <div style="padding: 15px; background: #1c1c1e; color: white; border-radius: 12px; font-family: -apple-system, sans-serif;">
        <h3 style="color: #38bdf8; margin: 0 0 15px 0;">🔧 Configuration : ${p.name || pKey}</h3>
        
        <div style="background: #2c2c2e; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
          <label style="font-size:11px; color:#8e8e93; text-transform:uppercase;">Couleur d'accent</label>
          <input type="color" id="ed-accent" value="${p.accent_color || '#38bdf8'}" style="width:100%; height:35px; border:none; margin: 8px 0 12px 0; cursor:pointer; background:transparent;">

          <label style="font-size:11px; color:#8e8e93; text-transform:uppercase;">Nom du profil</label>
          <input type="text" id="ed-name" value="${p.name || ''}" style="width:100%; padding:10px; background:#3a3a3c; color:white; border:none; border-radius:6px; margin: 8px 0 12px 0;">

          <label style="font-size:11px; color:#8e8e93; text-transform:uppercase;">URL Image de fond</label>
          <input type="text" id="ed-img" value="${p.image || ''}" style="width:100%; padding:10px; background:#3a3a3c; color:white; border:none; border-radius:6px; margin: 8px 0 12px 0;">

          <div style="display:flex; gap:10px;">
            <div style="flex:1;">
              <label style="font-size:11px; color:#8e8e93;">POIDS DÉPART</label>
              <input type="number" id="ed-start" value="${p.start || 0}" style="width:100%; padding:10px; background:#3a3a3c; color:white; border:none; border-radius:6px; margin-top:5px;">
            </div>
            <div style="flex:1;">
              <label style="font-size:11px; color:#8e8e93;">POIDS IDÉAL</label>
              <input type="number" id="ed-ideal" value="${p.ideal || 0}" style="width:100%; padding:10px; background:#3a3a3c; color:white; border:none; border-radius:6px; margin-top:5px;">
            </div>
          </div>
        </div>

        <div style="font-size: 11px; color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 10px; border-radius: 6px;">
          💡 <b>Note :</b> Pour modifier l'emplacement des bulles (X/Y) ou ajouter des capteurs, utilisez l'éditeur de code YAML ci-dessous.
        </div>
      </div>
    `;

    this.querySelector('#ed-accent').addEventListener('change', (e) => this._update('accent_color', e.target.value));
    this.querySelector('#ed-name').addEventListener('change', (e) => this._update('name', e.target.value));
    this.querySelector('#ed-img').addEventListener('change', (e) => this._update('image', e.target.value));
    this.querySelector('#ed-start').addEventListener('change', (e) => this._update('start', e.target.value));
    this.querySelector('#ed-ideal').addEventListener('change', (e) => this._update('ideal', e.target.value));
  }

  _update(field, value) {
    const pKey = this._config.current_view || 'person1';
    const newConf = JSON.parse(JSON.stringify(this._config));
    newConf[pKey][field] = value;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: newConf }, bubbles: true, composed: true }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard V67.3",
  preview: true
});
