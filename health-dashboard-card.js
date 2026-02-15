/**
 * HEALTH DASHBOARD CARD – VERSION 67
 * Author: xez7082
 * License: MIT
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

  // Calcul des mini-graphiques (Sparklines)
  renderSparkline(entityId) {
    const history = this._hass.states[entityId]?.attributes?.friendly_name; // Simplifié pour l'exemple
    return `<svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0,25 Q25,5 50,20 T100,10" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/></svg>`;
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

    if (pData.sensors) {
        pData.sensors.forEach((s, i) => {
            const valEl = this.shadowRoot.getElementById(`value-${i}`);
            const trendEl = this.shadowRoot.getElementById(`trend-${i}`);
            const stateObj = this._hass.states[s.entity];
            if (valEl && stateObj) {
                // Forçage icône % pour hydratation ou si configuré
                const isHydra = s.name.toLowerCase().includes('hydratation');
                const unit = isHydra ? '%' : (stateObj.attributes.unit_of_measurement || '');
                valEl.textContent = `${stateObj.state}${unit}`;
                
                // Indicateur de tendance (Flèche)
                if (trendEl) {
                  const lastChanged = new Date(stateObj.last_changed);
                  trendEl.innerHTML = `<ha-icon icon="mdi:chevron-down" style="color:#4ade80; --mdc-icon-size:14px;"></ha-icon>`;
                }
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
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 16px; overflow: hidden; font-family: 'Segoe UI', sans-serif; color: white; transition: all 0.5s ease; }
        .bg-img { position: absolute; inset: 0; background-position: center ${this._config.img_offset || 0}%; background-size: cover; opacity: 0.4; z-index: 1; transition: background-image 0.8s ease-in-out; }
        .topbar { position: absolute; top: 20px; width: 100%; display: flex; justify-content: center; gap: 12px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 25px; background: rgba(0,0,0,0.5); color: white; cursor: pointer; font-size: 11px; font-weight: bold; backdrop-filter: blur(5px); transition: 0.3s; }
        .btn.active { background: ${accentColor} !important; border-color: ${accentColor}; box-shadow: 0 0 15px ${accentColor}; }
        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 85%; height: 80px; z-index: 30; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 10px; }
        .rule-track { position: relative; width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 35px; }
        .prog-pointer { position: absolute; top: -12px; width: 4px; height: 30px; background: ${accentColor}; transition: left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1); border-radius: 2px; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: ${accentColor}; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; white-space: nowrap; }
        .prog-pointer::before { content: attr(data-diff); position: absolute; top: 35px; left: 50%; transform: translateX(-50%); color: var(--diff-color); font-size: 13px; font-weight: 800; }
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 12px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; padding: 8px; backdrop-filter: blur(10px); overflow: hidden; }
        .sparkline { position: absolute; bottom: 0; left: 0; width: 100%; height: 30px; pointer-events: none; stroke: ${accentColor}; }
        ha-icon { --mdc-icon-size: 24px; color: ${accentColor}; margin-bottom: 2px; z-index: 2; }
        .val-row { display: flex; align-items: center; gap: 4px; z-index: 2; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${view==='person1'?'active':''}">${this._config.person1?.name || 'P1'}</button>
          <button id="bt2" class="btn ${view==='person2'?'active':''}">${this._config.person2?.name || 'P2'}</button>
        </div>
        <div class="bg-img" style="background-image: url('${pData.image || ''}')"></div>
        <div class="rule-container">
            <div class="rule-track">
                <div class="marker-label" style="position:absolute; left:0; top:15px; font-size:9px; color:#f87171;">DEPART<br>${pData.start}kg</div>
                <div class="marker-label" style="position:absolute; left:100%; top:15px; transform:translateX(-100%); font-size:9px; color:#4ade80; text-align:right;">IDEAL<br>${pData.ideal}kg</div>
                <div id="progression-pointer" class="prog-pointer" data-val="--" data-diff=""></div>
            </div>
        </div>
        ${(pData.sensors || []).map((s, i) => {
            const isIMC = s.name.toLowerCase().includes('imc') || s.name.toLowerCase().includes('corpulence');
            const w = isIMC ? (this._config.imc_width||160) : (this._config.b_width||160);
            const h = isIMC ? (this._config.imc_height||75) : (this._config.b_height||75);
            return `<div class="sensor" style="left:${s.x}%; top:${s.y}%; width:${w}px; height:${h}px;">
              ${this.renderSparkline(s.entity)}
              <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
              <div style="font-size:10px; color:#94a3b8; z-index:2;">${s.name}</div>
              <div class="val-row">
                <div id="value-${i}" style="font-weight:bold; font-size:14px;">--</div>
                <div id="trend-${i}"></div>
              </div>
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

// L'ÉDITEUR A ÉTÉ MIS À JOUR POUR INCLURE LA COULEUR D'ACCENT
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }

  render() {
    if (!this._config || !this._hass) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];

    this.innerHTML = `
      <style>
        .ed-box { padding: 12px; background: #1a1a1a; color: white; font-family: sans-serif; }
        .section { background: #252525; border: 1px solid #444; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
        label { color: #38bdf8; font-size: 11px; font-weight: bold; display: block; margin-top: 10px; }
        input { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; }
      </style>
      <div class="ed-box">
        <div class="section">
            <label>COULEUR D'ACCENT (Profil)</label>
            <input type="color" id="inp-color" value="${p.accent_color || '#38bdf8'}" style="height:40px;">
            <label>NOM</label><input type="text" id="inp-name" value="${p.name}">
            <label>URL IMAGE</label><input type="text" id="inp-img" value="${p.image || ''}">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div><label>DÉPART (kg)</label><input type="number" id="inp-start" value="${p.start}"></div>
                <div><label>IDÉAL (kg)</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
            </div>
        </div>
        <p style="font-size:10px; color:#888;">Note : L'icône % est automatique pour les capteurs nommés "Hydratation".</p>
      </div>
    `;

    this.querySelector('#inp-color').onchange = (e) => { this._config[pKey].accent_color = e.target.value; this._fire(); };
    this.querySelector('#inp-name').onchange = (e) => { this._config[pKey].name = e.target.value; this._fire(); };
    this.querySelector('#inp-img').onchange = (e) => { this._config[pKey].image = e.target.value; this._fire(); };
    this.querySelector('#inp-start').onchange = (e) => { this._config[pKey].start = e.target.value; this._fire(); };
    this.querySelector('#inp-ideal').onchange = (e) => { this._config[pKey].ideal = e.target.value; this._fire(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V67" });
