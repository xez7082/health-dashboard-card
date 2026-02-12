// HEALTH DASHBOARD CARD – VERSION V21 (YAML PERSISTENCE)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    // Si aucune vue n'est définie, on initialise à person1
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this._config || !this.shadowRoot) return;
    const personKey = this._config.current_view;
    const person = this._config[personKey];
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
    const personKey = this._config.current_view;
    const person = this._config[personKey] || { sensors: [] };
    
    const imageUrl = person.image || (personKey === 'person2' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' 
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center ${this._config.img_offset || 50}% / cover no-repeat; opacity: 0.5; transition: background 0.4s ease-in-out; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 12px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 10; }
        .btn { border: none; padding: 6px 14px; border-radius: 15px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: bold; transition: 0.2s; }
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
          <button id="bt1" class="btn ${personKey==='person1'?'active':''}">HOMME</button>
          <button id="bt2" class="btn ${personKey==='person2'?'active':''}">FEMME</button>
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

    // Action des boutons sur la carte
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); };
    this.updateSensors();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

// EDITOR V21
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  render() {
    if (!this._config || !this._hass) return;
    const currentTab = this._config.current_view;
    const person = this._config[currentTab] || { sensors: [] };

    this.innerHTML = `
      <style>
        .ed-wrap { padding: 12px; font-family: sans-serif; }
        .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
        .tab { flex: 1; padding: 12px; cursor: pointer; background: #e2e8f0; text-align:center; border-radius: 6px; font-weight: bold; border: 2px solid transparent; }
        .tab.active { background: #38bdf8; color: white; border-color: #0ea5e9; }
        .sensor-item { border: 1px solid #cbd5e1; padding: 15px; margin-bottom: 15px; border-radius: 10px; background: #f8fafc; }
        .search-results { background: white; border: 1px solid #38bdf8; max-height: 150px; overflow-y: auto; margin-top: -5px; margin-bottom: 10px; border-radius: 0 0 5px 5px; display: none; }
        .search-item { padding: 8px; cursor: pointer; border-bottom: 1px solid #eee; color: #333; font-size: 12px; }
        input { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #cbd5e1; border-radius: 5px; box-sizing: border-box; }
        label { font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; }
        .btn-add { width: 100%; padding: 15px; background: #10b981; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; }
      </style>
      <div class="ed-wrap">
        <label>Hauteur Carte (px)</label>
        <input type="number" id="card-h" value="${this._config.card_height || 550}">

        <div class="tabs">
          <div class="tab ${currentTab==='person1'?'active':''}" data-t="person1">♂ CONFIG HOMME</div>
          <div class="tab ${currentTab==='person2'?'active':''}" data-t="person2">♀ CONFIG FEMME</div>
        </div>

        <div id="sensors-list">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <label>🔍 Chercher Entité</label>
              <input type="text" class="in-search" data-idx="${i}" placeholder="Tapez le nom..." value="${s.entity}">
              <div class="search-results" id="res-${i}"></div>
              
              <label>Nom</label>
              <input type="text" class="in-lab" data-idx="${i}" value="${s.name || ''}">
              
              <label>Icône MDI</label>
              <input type="text" class="in-ico" data-idx="${i}" value="${s.icon || 'mdi:pulse'}">

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div><label>X %</label><input type="number" class="in-x" data-idx="${i}" value="${s.x}"></div>
                <div><label>Y %</label><input type="number" class="in-y" data-idx="${i}" value="${s.y}"></div>
              </div>
              <button class="btn-del" data-idx="${i}" style="width:100%; margin-top:10px; background:#fee2e2; border:1px solid #ef4444; padding:5px; border-radius:4px; color:#b91c1c; cursor:pointer;">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-add">➕ AJOUTER UN CAPTEUR</button>
      </div>
    `;

    this._setupEvents();
  }

  _setupEvents() {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { 
      this._config.current_view = t.dataset.t;
      this._fire();
    });

    this.querySelector('#card-h').onchange = (e) => { this._config.card_height = parseInt(e.target.value); this._fire(); };

    const tab = this._config.current_view;
    this.querySelectorAll('.in-search').forEach(inp => {
      inp.oninput = (e) => {
        const idx = e.target.dataset.idx;
        const val = e.target.value.toLowerCase();
        const resDiv = this.querySelector(`#res-${idx}`);
        if (val.length < 2) { resDiv.style.display = 'none'; return; }
        const matches = Object.keys(this._hass.states).filter(eid => eid.includes(val)).slice(0, 8);
        if (matches.length > 0) {
          resDiv.innerHTML = matches.map(eid => `<div class="search-item" data-eid="${eid}">${eid}</div>`).join('');
          resDiv.style.display = 'block';
          resDiv.querySelectorAll('.search-item').forEach(item => {
            item.onclick = () => {
              this._config[tab].sensors[idx].entity = item.dataset.eid;
              resDiv.style.display = 'none';
              this._fire();
            };
          });
        }
      };
    });

    this.querySelectorAll('.in-lab').forEach(inp => { inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].name = e.target.value; this._fire(); }; });
    this.querySelectorAll('.in-ico').forEach(inp => { inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].icon = e.target.value; this._fire(); }; });
    this.querySelectorAll('.in-x').forEach(inp => { inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].x = parseInt(e.target.value); this._fire(); }; });
    this.querySelectorAll('.in-y').forEach(inp => { inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].y = parseInt(e.target.value); this._fire(); }; });

    this.querySelector('.btn-add').onclick = () => {
      if(!this._config[tab]) this._config[tab] = { sensors: [] };
      this._config[tab].sensors.push({ entity: '', name: 'Nouveau', icon: 'mdi:pulse', x: 50, y: 50 });
      this._fire();
    };

    this.querySelectorAll('.btn-del').forEach(btn => {
      btn.onclick = () => { this._config[tab].sensors.splice(btn.dataset.idx, 1); this._fire(); };
    });
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V21", description: "Persistance YAML totale." });
