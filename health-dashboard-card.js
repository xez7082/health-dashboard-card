// HEALTH DASHBOARD CARD – VERSION V19 (GLOBAL SYNC)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (!window.healthCardCurrentPerson) window.healthCardCurrentPerson = 'person1';
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    // On vérifie si l'éditeur a changé la personne
    if (this._lastPerson !== window.healthCardCurrentPerson) {
      this._lastPerson = window.healthCardCurrentPerson;
      this.render();
    }
    this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this._config || !this.shadowRoot) return;
    const person = this._config[window.healthCardCurrentPerson];
    if (!person || !person.sensors) return;
    person.sensors.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`value-${i}`);
      if (el) {
        const stateObj = this._hass.states[s.entity];
        el.textContent = stateObj ? `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`.trim() : '--';
      }
    });
  }

  render() {
    if (!this._config) return;
    const personKey = window.healthCardCurrentPerson;
    const person = this._config[personKey];
    
    const imageUrl = person.image || (personKey === 'person2' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' 
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center ${this._config.img_offset || 50}% / cover no-repeat; opacity: 0.5; transition: background 0.5s ease; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 12px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 10; }
        .btn { border: none; padding: 6px 14px; border-radius: 15px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .btn.active { background: #38bdf8; box-shadow: 0 0 10px #38bdf8; }
        .sensor { position: absolute; transform: translate(-50%, -50%); padding: 6px; border-radius: 8px; width: 22%; min-width: 75px; text-align: center; z-index: 5; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.3); }
        .icon-box { font-size: 1.2em; color: #38bdf8; }
        .label { font-size: 0.6em; text-transform: uppercase; margin-top: 2px; color: #cbd5e1; }
        .val { font-size: 0.85em; font-weight: 800; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s) => `<line x1="50%" y1="${this._config.img_offset || 50}%" x2="${s.x}%" y2="${s.y}%" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3" opacity="0.3"/>`).join('')}</svg>
        <div class="topbar">
          <button id="b1" class="btn ${personKey==='person1'?'active':''}">HOMME</button>
          <button id="b2" class="btn ${personKey==='person2'?'active':''}">FEMME</button>
        </div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" style="left:${s.x}%; top:${s.y}%">
            <div class="icon-box"><ha-icon icon="${s.icon || 'mdi:pulse'}"></ha-icon></div>
            <div class="label">${s.name || ''}</div>
            <div id="value-${i}" class="val">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('b1').onclick = () => { window.healthCardCurrentPerson = 'person1'; this.render(); };
    this.shadowRoot.getElementById('b2').onclick = () => { window.healthCardCurrentPerson = 'person2'; this.render(); };
    this.updateSensors();
  }
}

// EDITOR V19
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  render() {
    if (!this._config || !this._hass) return;
    const currentTab = window.healthCardCurrentPerson || 'person1';
    const person = this._config[currentTab];

    this.innerHTML = `
      <style>
        .ed-wrap { padding: 12px; font-family: sans-serif; }
        .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
        .tab { flex: 1; padding: 12px; cursor: pointer; background: #e2e8f0; text-align:center; border-radius: 6px; font-weight: 800; color: #475569; transition: 0.2s; border: 2px solid transparent; }
        .tab.active { background: #38bdf8; color: white; border-color: #0ea5e9; }
        .sensor-item { border: 1px solid #cbd5e1; padding: 15px; margin-bottom: 15px; border-radius: 10px; background: #f8fafc; }
        input { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #cbd5e1; border-radius: 5px; box-sizing: border-box; }
        .pos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f1f5f9; padding: 10px; border-radius: 5px; }
        label { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; }
      </style>
      <div class="ed-wrap">
        <label>Hauteur Globale (px)</label>
        <input type="number" id="card-h" value="${this._config.card_height || 550}">

        <div class="tabs">
          <div class="tab ${currentTab==='person1'?'active':''}" data-t="person1">♂ HOMME</div>
          <div class="tab ${currentTab==='person2'?'active':''}" data-t="person2">♀ FEMME</div>
        </div>

        <div id="sensors-list">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <label>Entité</label>
              <input type="text" class="in-ent" data-idx="${i}" value="${s.entity}" placeholder="sensor.votre_capteur">
              <label>Nom</label>
              <input type="text" class="in-lab" data-idx="${i}" value="${s.name || ''}">
              <div class="pos-grid">
                <div><label>Gauche/Droite %</label><input type="number" class="in-x" data-idx="${i}" value="${s.x}"></div>
                <div><label>Haut/Bas %</label><input type="number" class="in-y" data-idx="${i}" value="${s.y}"></div>
              </div>
              <button class="btn-del" data-idx="${i}" style="width:100%; margin-top:10px; background:#fca5a5; border:none; padding:8px; border-radius:5px; color:#991b1b; cursor:pointer; font-weight:bold;">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-add" style="width:100%; padding:15px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">➕ AJOUTER UN CAPTEUR</button>
      </div>
    `;

    this._setupEvents();
  }

  _setupEvents() {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { 
      window.healthCardCurrentPerson = t.dataset.t; 
      this.render();
      this._fire(); // Force la mise à jour de la carte
    });

    this.querySelector('#card-h').onchange = (e) => { this._config.card_height = parseInt(e.target.value); this._fire(); };
    
    const currentTab = window.healthCardCurrentPerson || 'person1';

    this.querySelectorAll('.in-ent').forEach(inp => { 
      inp.onchange = (e) => { this._config[currentTab].sensors[inp.dataset.idx].entity = e.target.value; this._fire(); }; 
    });
    this.querySelectorAll('.in-lab').forEach(inp => { 
      inp.onchange = (e) => { this._config[currentTab].sensors[inp.dataset.idx].name = e.target.value; this._fire(); }; 
    });
    this.querySelectorAll('.in-x').forEach(inp => { 
      inp.onchange = (e) => { this._config[currentTab].sensors[inp.dataset.idx].x = parseInt(e.target.value); this._fire(); }; 
    });
    this.querySelectorAll('.in-y').forEach(inp => { 
      inp.onchange = (e) => { this._config[currentTab].sensors[inp.dataset.idx].y = parseInt(e.target.value); this._fire(); }; 
    });

    this.querySelector('.btn-add').onclick = () => {
      if(!this._config[currentTab].sensors) this._config[currentTab].sensors = [];
      this._config[currentTab].sensors.push({ entity: '', name: 'Nouveau', icon: 'mdi:pulse', x: 50, y: 50 });
      this.render(); this._fire();
    };
    this.querySelectorAll('.btn-del').forEach(btn => {
      btn.onclick = () => { this._config[currentTab].sensors.splice(btn.dataset.idx, 1); this.render(); this._fire(); };
    });
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V19", description: "Bascule Homme/Femme garantie." });
