// HEALTH DASHBOARD CARD – VERSION V16 (INTELLI-SEARCH)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isDragging = false;
    this.currentPerson = 'person1';
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._isDragging) this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this._config || !this.shadowRoot) return;
    const person = this._config[this.currentPerson];
    (person.sensors || []).forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`value-${i}`);
      if (el) {
        const stateObj = this._hass.states[s.entity];
        el.textContent = stateObj ? `${stateObj.state}${stateObj.attributes.unit_of_measurement || ''}` : '--';
      }
    });
  }

  render() {
    if (!this._config) return;
    const person = this._config[this.currentPerson];
    const imageUrl = person.image || (person.gender === 'female' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' 
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; touch-action: none; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center ${this._config.img_offset || 50}% / cover no-repeat; opacity: 0.4; pointer-events: none; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 12px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 10; }
        .btn { border: none; padding: 6px 14px; border-radius: 15px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: bold; }
        .btn.active { background: #38bdf8; }
        .sensor { position: absolute; transform: translate(-50%, -50%); padding: 6px; border-radius: 8px; width: 22%; min-width: 75px; text-align: center; z-index: 5; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.3); }
        .icon-box { font-size: 1.2em; color: var(--icon-color); }
        .label { font-size: 0.6em; text-transform: uppercase; margin-top: 2px; color: #cbd5e1; }
        .val { font-size: 0.85em; font-weight: 800; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s, i) => `<line id="line-${i}" x1="50%" y1="${this._config.img_offset || 50}%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1" stroke-dasharray="3" opacity="0.3"/>`).join('')}</svg>
        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">HOMME</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">FEMME</button>
        </div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x}%; top:${s.y}%; --icon-color:${s.color}">
            <div class="icon-box"><ha-icon icon="${s.icon || 'mdi:pulse'}"></ha-icon></div>
            <div class="label">${s.name || '---'}</div>
            <div id="value-${i}" class="val">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('p1').onclick = () => { this.currentPerson = 'person1'; this.render(); };
    this.shadowRoot.getElementById('p2').onclick = () => { this.currentPerson = 'person2'; this.render(); };
    this.updateSensors();
  }
}

// EDITOR V16 (INTELLISENSE)
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); }
  set hass(hass) { this._hass = hass; }
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  render() {
    if (!this._config || !this._hass) return;
    const tab = this._currentTab || 'person1';
    const person = this._config[tab];

    this.innerHTML = `
      <style>
        .ed-wrap { padding: 12px; font-family: sans-serif; background: #fff; color: #333; }
        .section { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e2e8f0; }
        .tabs { display: flex; gap: 4px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; cursor: pointer; background: #e2e8f0; text-align:center; border-radius: 4px; font-weight: bold; }
        .tab.active { background: #38bdf8; color: white; }
        .sensor-item { border: 1px solid #cbd5e1; padding: 12px; margin-bottom: 15px; border-radius: 8px; position: relative; background: white; }
        .search-container { position: relative; }
        .dropdown { position: absolute; width: 100%; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #cbd5e1; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 4px; display: none; }
        .dropdown-item { padding: 8px; cursor: pointer; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .dropdown-item:hover { background: #f0f9ff; }
        input { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; }
        .pos-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        label { font-size: 11px; font-weight: bold; color: #64748b; }
        .btn-add { width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
        .btn-del { background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; margin-top: 8px; width: 100%; }
        .icon-link { font-size: 10px; color: #38bdf8; text-decoration: none; display: block; margin-bottom: 5px; }
      </style>
      <div class="ed-wrap">
        <div class="section">
          <label>Hauteur de la carte (px)</label>
          <input type="number" id="card-h" value="${this._config.card_height || 550}">
        </div>

        <div class="tabs">
          <div class="tab ${tab==='person1'?'active':''}" data-t="person1">Homme</div>
          <div class="tab ${tab==='person2'?'active':''}" data-t="person2">Femme</div>
        </div>

        <div id="sensors-list">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <label>Rechercher un capteur</label>
              <div class="search-container">
                <input type="text" class="in-ent" data-idx="${i}" placeholder="Tapez le nom du sensor..." value="${s.entity}">
                <div class="dropdown" id="drop-${i}"></div>
              </div>

              <label>Nom affiché</label>
              <input type="text" class="in-lab" data-idx="${i}" value="${s.name || ''}">

              <label>Icône MDI</label>
              <a href="https://pictogrammers.com/library/mdi/" target="_blank" class="icon-link">Trouver une icône ici ↗</a>
              <input type="text" class="in-ico" data-idx="${i}" placeholder="mdi:heart" value="${s.icon || ''}">

              <div class="pos-row">
                <div><label>Position X (%)</label><input type="number" class="in-x" data-idx="${i}" value="${s.x}"></div>
                <div><label>Position Y (%)</label><input type="number" class="in-y" data-idx="${i}" value="${s.y}"></div>
              </div>
              <button class="btn-del" data-idx="${i}">Supprimer ce capteur</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-add">➕ Ajouter un capteur</button>
      </div>
    `;

    this._setupEvents();
  }

  _setupEvents() {
    const tab = this._currentTab || 'person1';
    
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._currentTab = t.dataset.t; this.render(); });
    this.querySelector('#card-h').onchange = (e) => { this._config.card_height = parseInt(e.target.value); this._fire(); };

    // MOTEUR DE RECHERCHE SENSORS
    this.querySelectorAll('.in-ent').forEach(inp => {
      inp.oninput = (e) => {
        const idx = e.target.dataset.idx;
        const val = e.target.value.toLowerCase();
        const drop = this.querySelector(`#drop-${idx}`);
        
        if (val.length < 2) { drop.style.display = 'none'; return; }

        // Filtrer les entités de Home Assistant
        const matches = Object.keys(this._hass.states)
          .filter(eid => eid.includes(val) || (this._hass.states[eid].attributes.friendly_name || '').toLowerCase().includes(val))
          .slice(0, 10);

        if (matches.length > 0) {
          drop.innerHTML = matches.map(eid => {
            const state = this._hass.states[eid];
            const icon = state.attributes.icon || 'mdi:tag';
            const name = state.attributes.friendly_name || eid;
            return `<div class="dropdown-item" data-eid="${eid}"><ha-icon icon="${icon}"></ha-icon> <span>${name}</span></div>`;
          }).join('');
          drop.style.display = 'block';

          drop.querySelectorAll('.dropdown-item').forEach(item => {
            item.onclick = () => {
              this._config[tab].sensors[idx].entity = item.dataset.eid;
              // Si le nom est vide, on met le friendly name par défaut
              if (!this._config[tab].sensors[idx].name) {
                this._config[tab].sensors[idx].name = this._hass.states[item.dataset.eid].attributes.friendly_name || '';
              }
              drop.style.display = 'none';
              this.render();
              this._fire();
            };
          });
        } else {
          drop.style.display = 'none';
        }
      };
    });

    this.querySelectorAll('.in-lab').forEach(inp => {
      inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].name = e.target.value; this._fire(); };
    });

    this.querySelectorAll('.in-ico').forEach(inp => {
      inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].icon = e.target.value; this._fire(); };
    });

    this.querySelectorAll('.in-x').forEach(inp => {
      inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].x = parseInt(e.target.value); this._fire(); };
    });

    this.querySelectorAll('.in-y').forEach(inp => {
      inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].y = parseInt(e.target.value); this._fire(); };
    });

    this.querySelector('.btn-add').onclick = () => {
      if(!this._config[tab].sensors) this._config[tab].sensors = [];
      this._config[tab].sensors.push({ entity: '', name: '', icon: 'mdi:pulse', color: '#38bdf8', x: 50, y: 50 });
      this.render(); this._fire();
    };

    this.querySelectorAll('.btn-del').forEach(btn => {
      btn.onclick = () => {
        this._config[tab].sensors.splice(btn.dataset.idx, 1);
        this.render(); this._fire();
      };
    });
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V16", description: "Recherche intelligente d'entités." });
