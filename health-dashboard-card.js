/**
 * HEALTH DASHBOARD CARD – V3.6.5 COMPACT (600px)
 * FIX: Boutons de navigation + Hauteur restreinte
 */

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() {
    return document.createElement('health-dashboard-card-editor');
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.update();
  }

  _setView(view) {
    this._config.current_view = view;
    // On émet l'événement pour que HA enregistre la vue actuelle
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
    this.render();
  }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view];
    if (!p) return;

    // Mise à jour des petits capteurs
    if (p.sensors) {
      p.sensors.forEach((s, i) => {
        const elV = this.shadowRoot.getElementById(`s-${i}-v`);
        if (elV && s.entity && this._hass.states[s.entity]) {
          elV.textContent = this._hass.states[s.entity].state;
        }
      });
    }

    // Mise à jour du poids en bas
    const stateW = this._hass.states[p.weight_entity];
    if (stateW) {
      const wv = this.shadowRoot.getElementById('weight-val');
      if (wv) wv.textContent = parseFloat(stateW.state).toFixed(1) + ' kg';
      
      const start = parseFloat(p.start) || 0;
      const actuel = parseFloat(stateW.state) || 0;
      const diff = (actuel - start).toFixed(1);
      const dEl = this.shadowRoot.getElementById('diff-val');
      if (dEl) {
        dEl.textContent = (diff > 0 ? '+' : '') + diff + ' kg';
        dEl.style.background = actuel <= (parseFloat(p.confort) || start) ? '#4caf50' : '#ff5252';
      }
    }
  }

  render() {
    if (!this._config) return;
    const p = this._config[this._config.current_view] || { sensors: [] };
    const cv = this._config.current_view;
    
    // Positions Y optimisées pour une carte de 600px
    const getY = (cat) => { 
      if (cat === 'sommeil') return 230; 
      if (cat === 'sante') return 380; 
      return 110; 
    };

    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 20px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg { position: absolute; inset:0; background: url('${p.image}') center/cover; opacity: 0.15; z-index:1; }
        
        /* Boutons de navigation */
        .sw-btns { position: absolute; top: 15px; left: 15px; display: flex; gap: 8px; z-index: 100; }
        .sw-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 8px 15px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 11px; backdrop-filter: blur(5px); }
        .sw-btn.active { background: #38bdf8; color: #000; border-color: #38bdf8; }

        .section-header { position: absolute; left: 20px; display: flex; align-items: center; gap: 8px; z-index: 5; width: 90%; }
        .section-header span { font-size: 9px; font-weight: 900; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; }
        .section-line { height: 1px; flex-grow: 1; background: linear-gradient(90deg, #38bdf8, transparent); opacity: 0.3; }

        /* Boîtes de capteurs compactes */
        .box { position: absolute; background: rgba(15, 23, 42, 0.85); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px); }
        .ico { color: #38bdf8; --mdc-icon-size: 20px; margin-bottom: 2px; }
        .lbl { font-size: 8px; opacity: 0.7; font-weight: bold; text-transform: uppercase; text-align: center; }
        .val { font-weight: 800; font-size: 13px; color: #fff; }

        /* Zone de poids fixe en bas */
        .weight-area { position: absolute; bottom: 15px; left: 15px; right: 15px; height: 90px; z-index: 20; background: rgba(255,255,255,0.05); border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; }
        #weight-val { font-size: 22px; font-weight: 900; color: #38bdf8; }
        #diff-val { font-size: 10px; padding: 2px 8px; border-radius: 5px; margin-top: 5px; font-weight: bold; }
        .mkr-box { display: flex; justify-content: space-between; width: 80%; margin-top: 5px; font-size: 8px; opacity: 0.5; font-weight: bold; }
      </style>

      <div class="main">
        <div class="bg"></div>
        <div class="sw-btns">
            <button class="sw-btn ${cv === 'person1' ? 'active' : ''}" id="btn-p1">PATRICK</button>
            <button class="sw-btn ${cv === 'person2' ? 'active' : ''}" id="btn-p2">SANDRA</button>
        </div>

        <div class="section-header" style="top: 70px;"><span>⚡ FORME</span><div class="section-line"></div></div>
        <div class="section-header" style="top: 195px;"><span>🌙 SOMMEIL</span><div class="section-line"></div></div>
        <div class="section-header" style="top: 345px;"><span>🏥 SANTÉ</span><div class="section-line"></div></div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${getY(s.cat)}px; width:${s.w || 90}px; height:65px; transform: translate(-50%, -50%);">
            <ha-icon icon="${s.icon || 'mdi:heart'}" class="ico"></ha-icon>
            <div class="lbl">${s.name}</div>
            <div class="val" id="s-${i}-v">--</div>
          </div>`).join('')}

        <div class="weight-area">
          <div id="weight-val">--</div>
          <div id="diff-val">--</div>
          <div class="mkr-box">
            <span>DÉPART: ${p.start}</span>
            <span>OBJ: ${p.ideal}</span>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('btn-p1').onclick = () => this._setView('person1');
    this.shadowRoot.getElementById('btn-p2').onclick = () => this._setView('person2');
  }
}

// Editeur simplifié pour garantir la stabilité
class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this.render(); }
  render() {
    this.innerHTML = `
      <div style="padding: 10px; background: #2c3e50; color: white; border-radius: 8px;">
        <strong>Mode Compact (600px) Activé</strong>
        <p style="font-size: 11px; opacity: 0.8;">Utilisez le YAML pour ajouter vos capteurs.</p>
      </div>
    `;
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard Smart V3.6.5",
  description: "Version Compacte 600px"
});
