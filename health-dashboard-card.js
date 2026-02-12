// HEALTH DASHBOARD CARD – VERSION V18 (TOTAL SYNC)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._person = 'person1'; 
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  // Cette fonction permet à l'éditeur de forcer le changement de vue
  set viewPerson(p) {
    this._person = p;
    this.render();
  }

  updateSensors() {
    if (!this._hass || !this._config || !this.shadowRoot) return;
    const person = this._config[this._person];
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
    const person = this._config[this._person];
    // URLs robustes pour les silhouettes
    const imageUrl = person.image || (this._person === 'person2' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' 
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center ${this._config.img_offset || 50}% / cover no-repeat; opacity: 0.4; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 12px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 10; }
        .btn { border: none; padding: 6px 14px; border-radius: 15px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: bold; }
        .btn.active { background: #38bdf8; box-shadow: 0 0 10px #38bdf8; }
        .sensor { position: absolute; transform: translate(-50%, -50%); padding: 6px; border-radius: 8px; width: 22%; min-width: 75px; text-align: center; z-index: 5; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.3); }
        .icon-box { font-size: 1.2em; color: #38bdf8; }
        .label { font-size: 0.6em; text-transform: uppercase; margin-top: 2px; color: #cbd5e1; }
        .val { font-size: 0.85em; font-weight: 800; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s, i) => `<line x1="50%" y1="${this._config.img_offset || 50}%" x2="${s.x}%" y2="${s.y}%" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3" opacity="0.3"/>`).join('')}</svg>
        <div class="topbar">
          <button id="b1" class="btn ${this._person==='person1'?'active':''}">HOMME</button>
          <button id="b2" class="btn ${this._person==='person2'?'active':''}">FEMME</button>
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

    this.shadowRoot.getElementById('b1').onclick = () => { this._person = 'person1'; this.render(); };
    this.shadowRoot.getElementById('b2').onclick = () => { this._person = 'person2'; this.render(); };
    this.updateSensors();
  }
}

// EDITOR V18
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._currentTab = 'person1'; }
  set hass(hass) { this._hass = hass; }
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  render() {
    if (!this._config || !this._hass) return;
    const person = this._config[this._currentTab];

    this.innerHTML = `
      <style>
        .ed-wrap { padding: 12px; font-family: sans-serif; }
        .tabs { display: flex; gap: 5px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; cursor: pointer; background: #ddd; text-align:center; border-radius: 4px; font-weight: bold; }
        .tab.active { background: #38bdf8; color: white; }
        .sensor-item { border: 1px solid #ccc; padding: 12px; margin-bottom: 15px; border-radius: 8px; background: #f9f9f9; }
        .dropdown { position: absolute; width: 100%; max-height: 150px; overflow-y: auto; background: white; border: 1px solid #ccc; z-index: 2000; color: black; display: none; }
        .dropdown-item { padding: 8px; cursor: pointer; border-bottom: 1px solid #eee; }
        input { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        .pos-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      </style>
      <div class="ed-wrap">
        <label>Hauteur Carte (px)</label>
        <input type="number" id="card-h" value="${this._config.card_height || 550}">

        <div class="tabs">
          <div class="tab ${this._currentTab==='person1'?'active':''}" data-t="person1">ONGLET HOMME</div>
          <div class="tab ${this._currentTab==='person2'?'active':''}" data-t="person2">ONGLET FEMME</div>
        </div>

        <div id="sensors-list">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <label>Rechercher Entité</label>
              <div style="position:relative">
                <input type="text" class="in-ent" data-idx="${i}" placeholder="Tapez pour chercher..." value="${s.entity}">
                <div class="dropdown" id="drop-${i}"></div>
              </div>
              <label>Nom</label><input type="text" class="in-lab" data-idx="${i}" value="${s.name || ''}">
              <div class="pos-row">
                <div><label>X (%)</label><input type="number" class="in-x" data-idx="${i}" value="${s.x}"></div>
                <div><label>Y (%)</label><input type="number" class="in-y" data-idx="${i}" value="${s.y}"></div>
              </div>
              <button class="btn-del" data-idx="${i}" style="width:100%; background:#ff4d4d; color:white; border:none; padding:5px; margin-top:8px; border-radius:4px;">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-add" style="width:100%; padding:10px; background:#10b981; color:white; border:none; border-radius:4px; font-weight:bold;">➕ Ajouter un capteur</button>
      </div>
    `;

    this._setupEvents();
  }

  _setupEvents() {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { 
      this._currentTab = t.dataset.t;
      // MAGIC LINE: On trouve la carte et on lui dit de changer de vue
      const card = this.parentElement.querySelector('health-dashboard-card') || document.querySelector('health-dashboard-card');
      if (card) card.viewPerson = t.dataset.t;
      this.render(); 
    });
    
    this.querySelector('#card-h').onchange = (e) => { this._config.card_height = parseInt(e.target.value); this._fire(); };

    this.querySelectorAll('.in-ent').forEach(inp => {
      inp.oninput = (e) => {
        const idx = e.target.dataset.idx;
        const val = e.target.value.toLowerCase();
        const drop = this.querySelector(`#drop-${idx}`);
        if (val.length < 2) { drop.style.display = 'none'; return; }
        const matches = Object.keys(this._hass.states).filter(eid => eid.includes(val)).slice(0, 5);
        if (matches.length > 0) {
          drop.innerHTML = matches.map(eid => `<div class="dropdown-item" data-eid="${eid}">${eid}</div>`).join('');
          drop.style.display = 'block';
          drop.querySelectorAll('.dropdown-item').forEach(item => {
            item.onclick = () => {
              this._config[this._currentTab].sensors[idx].entity = item.dataset.eid;
              drop.style.display = 'none';
              this.render(); this._fire();
            };
          });
        }
      };
    });

    this.querySelectorAll('.in-lab').forEach(inp => { inp.onchange = (e) => { this._config[this._currentTab].sensors[inp.dataset.idx].name = e.target.value; this._fire(); }; });
    this.querySelectorAll('.in-x').forEach(inp => { inp.onchange = (e) => { this._config[this._currentTab].sensors[inp.dataset.idx].x = parseInt(e.target.value); this._fire(); }; });
    this.querySelectorAll('.in-y').forEach(inp => { inp.onchange = (e) => { this._config[this._currentTab].sensors[inp.dataset.idx].y = parseInt(e.target.value); this._fire(); }; });
    
    this.querySelector('.btn-add').onclick = () => {
      if(!this._config[this._currentTab].sensors) this._config[this._currentTab].sensors = [];
      this._config[this._currentTab].sensors.push({ entity: '', name: 'Nouveau', icon: 'mdi:pulse', x: 50, y: 50 });
      this.render(); this._fire();
    };

    this.querySelectorAll('.btn-del').forEach(btn => {
      btn.onclick = () => { this._config[this._currentTab].sensors.splice(btn.dataset.idx, 1); this.render(); this._fire(); };
    });
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V18", description: "Synchronisation parfaite Onglet/Vue." });
