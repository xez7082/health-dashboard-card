// HEALTH DASHBOARD CARD – VERSION V9 (SECURE POSITION LOCK)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
    this._isDragging = false; // Flag pour bloquer le rafraîchissement pendant le drag
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._isDragging) { // On n'update pas les valeurs si on est en train de déplacer
      this.updateSensors();
    }
  }

  updateSensors() {
    if (!this._hass || !this._config || !this.shadowRoot) return;
    const person = this._config[this.currentPerson];
    (person.sensors || []).forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`value-${i}`);
      if (el) {
        const stateObj = this._hass.states[s.entity];
        el.textContent = stateObj ? `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`.trim() : '--';
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
        :host { display: block; }
        .main-container { 
          position: relative; width: 100%; aspect-ratio: 4 / 5; 
          background: #0f172a; border-radius: 16px; overflow: hidden; 
          font-family: sans-serif; color: white; touch-action: none;
        }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center center / contain no-repeat; opacity: 0.3; pointer-events: none; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 10; }
        .btn { border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; transition: 0.3s; font-size: 12px;}
        .btn.active { background: #38bdf8; box-shadow: 0 0 10px #38bdf8; }
        .sensor { 
          position: absolute; transform: translate(-50%, -50%); 
          padding: 8px; border-radius: 10px; width: 22%; 
          text-align: center; cursor: grab; z-index: 5; 
          background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(5px); 
          border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        }
        .sensor:active { cursor: grabbing; z-index: 100; border-color: #38bdf8; }
        .icon-box { font-size: 1.5em; color: var(--icon-color); }
        .label { font-size: 0.7em; text-transform: uppercase; margin-top: 3px; font-weight: 600; overflow: hidden; white-space: nowrap; }
        .val { font-size: 0.9em; font-weight: bold; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg id="svg-layer">
          ${(person.sensors || []).map((s, i) => `
            <line id="line-${i}" x1="50%" y1="50%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1" stroke-dasharray="3" opacity="0.4"/>
          `).join('')}
        </svg>
        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">Homme</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">Femme</button>
        </div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x}%; top:${s.y}%; --icon-color:${s.color}">
            <div class="icon-box">${s.icon.includes(':') ? `<ha-icon icon="${s.icon}"></ha-icon>` : s.icon}</div>
            <div class="label" style="color:${s.color}">${s.name || '---'}</div>
            <div id="value-${i}" class="val">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('p1').onclick = () => { this.currentPerson = 'person1'; this.render(); };
    this.shadowRoot.getElementById('p2').onclick = () => { this.currentPerson = 'person2'; this.render(); };
    this.enableDrag();
    this.updateSensors();
  }

  enableDrag() {
    const container = this.shadowRoot.querySelector('.main-container');
    const person = this._config[this.currentPerson];
    
    (person.sensors || []).forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      const line = this.shadowRoot.getElementById(`line-${i}`);
      if (!el) return;

      const onMouseDown = (e) => {
        this._isDragging = true;
        const rect = container.getBoundingClientRect();

        const onMouseMove = (ev) => {
          let x = ((ev.clientX - rect.left) / rect.width) * 100;
          let y = ((ev.clientY - rect.top) / rect.height) * 100;
          
          // Constrain
          s.x = Math.round(Math.max(0, Math.min(100, x)));
          s.y = Math.round(Math.max(0, Math.min(100, y)));
          
          el.style.left = s.x + '%';
          el.style.top = s.y + '%';
          if (line) {
            line.setAttribute('x2', s.x + '%');
            line.setAttribute('y2', s.y + '%');
          }
        };

        const onMouseUp = () => {
          this._isDragging = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          
          // Envoi immédiat de la config finale
          this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._config },
            bubbles: true,
            composed: true
          }));
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };

      el.addEventListener('mousedown', onMouseDown);
    });
  }
}

// EDITEUR V9 (STABLE)
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this.currentTab = 'person1'; }
  set hass(hass) { this._hass = hass; }
  
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._initialized) { this.render(); this._initialized = true; }
  }

  render() {
    if (!this._config || !this._hass) return;
    const person = this._config[this.currentTab];

    this.innerHTML = `
      <style>
        .ed-wrap { padding: 12px; font-family: sans-serif; background: #fff; color: #333; }
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; }
        .tab { flex: 1; padding: 10px; border: none; background: #eee; cursor: pointer; border-radius: 4px; font-weight: bold; }
        .tab.active { background: #38bdf8; color: white; }
        .sensor-item { border: 1px solid #ddd; padding: 12px; margin-bottom: 10px; border-radius: 8px; background: #fafafa; }
        .search-box { position: relative; }
        .results-list { position: absolute; width: 100%; max-height: 120px; overflow-y: auto; background: white; border: 1px solid #ccc; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: none; }
        .results-list div { padding: 8px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 13px; color: #000; }
        .results-list div:hover { background: #f0f0f0; }
        input { width: 100%; padding: 8px; margin: 4px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        .add-btn { width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .del-btn { background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 8px; }
      </style>
      <div class="ed-wrap">
        <div class="tabs">
          <button class="tab ${this.currentTab==='person1'?'active':''}" id="t-p1">Homme</button>
          <button class="tab ${this.currentTab==='person2'?'active':''}" id="t-p2">Femme</button>
        </div>
        
        <label>Nom de la personne :</label>
        <input type="text" id="in-name" value="${person.name}">
        <hr>
        
        <div id="sensor-container">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <strong>Capteur ${i+1}</strong>
              <div class="search-box">
                <input type="text" class="in-ent" data-idx="${i}" placeholder="Rechercher entité..." value="${s.entity}">
                <div class="results-list" id="res-${i}"></div>
              </div>
              <input type="text" class="in-label" data-idx="${i}" placeholder="Label" value="${s.name}">
              <input type="text" class="in-icon" data-idx="${i}" placeholder="Icon (ex: mdi:heart)" value="${s.icon}">
              <input type="color" class="in-color" data-idx="${i}" value="${s.color}">
              <button class="del-btn" data-idx="${i}">🗑️ Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button class="add-btn">➕ Ajouter un capteur</button>
      </div>
    `;

    this._events();
  }

  _events() {
    this.querySelector('#t-p1').onclick = () => { this.currentTab = 'person1'; this.render(); };
    this.querySelector('#t-p2').onclick = () => { this.currentTab = 'person2'; this.render(); };
    
    const person = this._config[this.currentTab];

    this.querySelector('#in-name').oninput = (e) => { 
        person.name = e.target.value; 
        this._save(); 
    };

    this.querySelectorAll('.in-ent').forEach(inp => {
      inp.oninput = (e) => {
        const idx = e.target.dataset.idx;
        const val = e.target.value.toLowerCase();
        const res = this.querySelector(`#res-${idx}`);
        person.sensors[idx].entity = e.target.value;
        this._save();

        if (val.length < 2) { res.style.display = 'none'; return; }
        const matches = Object.keys(this._hass.states).filter(k => k.includes(val)).slice(0, 10);
        res.innerHTML = matches.map(m => `<div data-v="${m}">${m}</div>`).join('');
        res.style.display = 'block';

        res.querySelectorAll('div').forEach(d => d.onclick = () => {
          person.sensors[idx].entity = d.dataset.v;
          inp.value = d.dataset.v;
          res.style.display = 'none';
          this._save();
        });
      };
    });

    this.querySelectorAll('.in-label').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].name = e.target.value; this._save(); });
    this.querySelectorAll('.in-icon').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].icon = e.target.value; this._save(); });
    this.querySelectorAll('.in-color').forEach(el => el.onchange = (e) => { person.sensors[el.dataset.idx].color = e.target.value; this._save(); });

    this.querySelector('.add-btn').onclick = () => {
      person.sensors.push({ entity: '', name: 'Nouveau', icon: 'mdi:pulse', color: '#38bdf8', x: 50, y: 50 });
      this.render(); this._save();
    };

    this.querySelectorAll('.del-btn').forEach(b => b.onclick = () => {
      person.sensors.splice(b.dataset.idx, 1);
      this.render(); this._save();
    });
  }

  _save() {
    this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true
    }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V9", description: "Positionnement magnétique ultra-stable." });
