/**
 * HEALTH DASHBOARD CARD – V2.8.0
 * REMPLACEMENT DES SÉLECTEURS PAR SAISIE MANUELLE POUR STABILITÉ MAXIMALE
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) { this._config = config; this.render(); }
  set hass(hass) { this._hass = hass; this.update(); }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const p = this._config[this._config.current_view || 'person1'];
    
    // IMC
    const imc = this.shadowRoot.getElementById('imc-v');
    if(imc && p.imc_entity && this._hass.states[p.imc_entity]) {
        imc.textContent = this._hass.states[p.imc_entity].state;
    }
    // Capteurs
    (p.sensors || []).forEach((s, i) => {
        const el = this.shadowRoot.getElementById(`s-${i}`);
        if(el && s.entity && this._hass.states[s.entity]) {
            el.textContent = this._hass.states[s.entity].state;
        }
    });
  }

  render() {
    const p = this._config[this._config.current_view || 'person1'];
    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: 12px; overflow: hidden; }
        .box { position: absolute; transform: translate(-50%, -50%); background: rgba(0,0,0,0.6); color: white; padding: 10px; border: 1px solid #fff; border-radius: 8px; text-align: center; }
      </style>
      <div class="main">
        <div class="box" style="left:${p.imc_x}%; top:${p.imc_y}%;">
            <div>${p.imc_name || 'IMC'}</div><div id="imc-v">--</div>
        </div>
        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%;">
            <div>${s.name}</div><div id="s-${i}">--</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this.render(); }

  render() {
    const v = this._config.current_view || 'person1';
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .sec { padding: 10px; border: 1px solid #444; margin-bottom: 10px; }
        input { width: 100%; padding: 8px; margin-bottom: 5px; }
      </style>
      <h3>Configuration Manuelle</h3>
      <div class="sec">
        <label>Entité IMC (Ex: sensor.imc_patrick)</label>
        <input type="text" data-f="imc_entity" value="${p.imc_entity || ''}">
        <input type="text" data-f="imc_name" value="${p.imc_name || 'IMC'}">
        <input type="number" data-f="imc_x" value="${p.imc_x || 50}">
        <input type="number" data-f="imc_y" value="${p.imc_y || 50}">
      </div>
      
      <div class="sec">
        ${(p.sensors || []).map((s, i) => `
            <div style="border-bottom:1px solid #555; margin-bottom:10px;">
                <label>Entité Sensor (Ex: sensor.temperature)</label>
                <input type="text" value="${s.entity || ''}" data-idx="${i}" data-f="entity">
                <input type="text" value="${s.name || ''}" data-idx="${i}" data-f="name">
                <button onclick="this.parentElement.remove()">SUPPRIMER</button>
            </div>
        `).join('')}
        <button id="add">Ajouter Capteur</button>
      </div>
    `;
    this._attach();
  }

  _attach() {
    this.querySelectorAll('input').forEach(el => el.onchange = (e) => {
        const p = this._config[this._config.current_view || 'person1'];
        if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = el.value;
        else p[el.dataset.f] = el.value;
        this._fire();
    });
    this.querySelector('#add').onclick = () => {
        const p = this._config[this._config.current_view || 'person1'];
        if(!p.sensors) p.sensors = [];
        p.sensors.push({name:'Nouveau', entity:''});
        this._fire(); this.render();
    };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
