// HEALTH DASHBOARD CARD – VERSION V10 (IMAGE OFFSET & LOCK)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
    this._isDragging = false;
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    // Valeurs par défaut pour le nouvel offset et le verrou
    if (this._config.img_offset === undefined) this._config.img_offset = 50; 
    if (this._config.locked === undefined) this._config.locked = false;
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
        .bg { 
          position: absolute; inset: 0; 
          background: url('${imageUrl}') center ${this._config.img_offset}% / contain no-repeat; 
          opacity: 0.4; pointer-events: none; 
          transition: background-position 0.2s;
        }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 10; }
        .btn { border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; transition: 0.3s; font-size: 11px; font-weight: bold;}
        .btn.active { background: #38bdf8; box-shadow: 0 0 10px #38bdf8; }
        .lock-indicator { position: absolute; bottom: 10px; right: 10px; font-size: 10px; opacity: 0.5; z-index: 10; }
        
        .sensor { 
          position: absolute; transform: translate(-50%, -50%); 
          padding: 6px; border-radius: 10px; width: 20%; 
          text-align: center; z-index: 5; 
          background: rgba(30, 41, 59, 0.9); backdrop-filter: blur(5px); 
          border: 1px solid rgba(255,255,255,0.2); 
          cursor: ${this._config.locked ? 'default' : 'grab'};
        }
        .sensor:active { cursor: ${this._config.locked ? 'default' : 'grabbing'}; }
        .icon-box { font-size: 1.3em; color: var(--icon-color); }
        .label { font-size: 0.65em; text-transform: uppercase; margin-top: 2px; font-weight: 600; overflow: hidden; }
        .val { font-size: 0.85em; font-weight: bold; color: #fff; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg id="svg-layer">
          ${(person.sensors || []).map((s, i) => `
            <line id="line-${i}" x1="50%" y1="${this._config.img_offset}%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1" stroke-dasharray="3" opacity="0.3"/>
          `).join('')}
        </svg>
        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">HOMME</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">FEMME</button>
        </div>
        <div class="lock-indicator">${this._config.locked ? '🔒 Verrouillé' : '🔓 Mode Édition'}</div>
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
    if (!this._config.locked) this.enableDrag();
    this.updateSensors();
  }

  enableDrag() {
    const container = this.shadowRoot.querySelector('.main-container');
    const person = this._config[this.currentPerson];
    
    (person.sensors || []).forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      const line = this.shadowRoot.getElementById(`line-${i}`);
      if (!el) return;

      el.onmousedown = (e) => {
        this._isDragging = true;
        const rect = container.getBoundingClientRect();
        const onMouseMove = (ev) => {
          s.x = Math.round(Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)));
          s.y = Math.round(Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100)));
          el.style.left = s.x + '%';
          el.style.top = s.y + '%';
          if (line) { line.setAttribute('x2', s.x + '%'); line.setAttribute('y2', s.y + '%'); }
        };
        const onMouseUp = () => {
          this._isDragging = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };
    });
  }
}

// EDITEUR V10 (AVEC SLIDER DE POSITION)
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
        .tab { flex: 1; padding: 10px; border: none; background: #eee; cursor: pointer; border-radius: 4px; }
        .tab.active { background: #38bdf8; color: white; font-weight: bold; }
        .control-group { background: #f0f7ff; padding: 10px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #cce4ff; }
        .sensor-item { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 8px; position: relative; }
        .results-list { position: absolute; width: 100%; max-height: 120px; overflow-y: auto; background: white; border: 1px solid #ccc; z-index: 1000; display: none; }
        .results-list div { padding: 8px; cursor: pointer; border-bottom: 1px solid #eee; color: #000; }
        input[type="text"], input[type="range"] { width: 100%; padding: 8px; margin: 4px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        .btn-action { width: 100%; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 5px; }
      </style>
      <div class="ed-wrap">
        <div class="control-group">
          <strong>⚙️ Réglages Globaux</strong>
          <label>Position verticale de l'image (${this._config.img_offset}%)</label>
          <input type="range" id="img-pos" min="0" max="100" value="${this._config.img_offset}">
          
          <label style="display:flex; align-items:center; gap:10px; margin-top:10px; cursor:pointer;">
            <input type="checkbox" id="lock-move" ${this._config.locked ? 'checked' : ''}> 
            Bloquer le mouvement des bulles
          </label>
        </div>

        <div class="tabs">
          <button class="tab ${this.currentTab==='person1'?'active':''}" id="t-p1">HOMME</button>
          <button class="tab ${this.currentTab==='person2'?'active':''}" id="t-p2">FEMME</button>
        </div>
        
        <input type="text" id="in-name" placeholder="Nom" value="${person.name}">
        <hr>
        
        <div id="sensor-container">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <input type="text" class="in-ent" data-idx="${i}" placeholder="Rechercher entité..." value="${s.entity}">
              <div class="results-list" id="res-${i}"></div>
              <input type="text" class="in-label" data-idx="${i}" placeholder="Label" value="${s.name}">
              <input type="text" class="in-icon" data-idx="${i}" placeholder="mdi:heart" value="${s.icon}">
              <input type="color" class="in-color" data-idx="${i}" value="${s.color}">
              <button class="btn-action" style="background:#ef4444; color:white;" data-idx="${i}" id="del-${i}">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-action" style="background:#10b981; color:white;" id="add-s">➕ Ajouter un capteur</button>
      </div>
    `;

    this._events();
  }

  _events() {
    this.querySelector('#img-pos').oninput = (e) => { this._config.img_offset = e.target.value; this._save(); };
    this.querySelector('#lock-move').onchange = (e) => { this._config.locked = e.target.checked; this._save(); };
    this.querySelector('#t-p1').onclick = () => { this.currentTab = 'person1'; this.render(); };
    this.querySelector('#t-p2').onclick = () => { this.currentTab = 'person2'; this.render(); };
    
    const person = this._config[this.currentTab];

    this.querySelector('#in-name').oninput = (e) => { person.name = e.target.value; this._save(); };

    this.querySelectorAll('.in-ent').forEach(inp => {
      inp.oninput = (e) => {
        const idx = e.target.dataset.idx;
        const val = e.target.value.toLowerCase();
        const res = this.querySelector(`#res-${idx}`);
        person.sensors[idx].entity = e.target.value; this._save();

        if (val.length < 2) { res.style.display = 'none'; return; }
        const matches = Object.keys(this._hass.states).filter(k => k.includes(val)).slice(0, 8);
        res.innerHTML = matches.map(m => `<div data-v="${m}">${m}</div>`).join('');
        res.style.display = 'block';
        res.querySelectorAll('div').forEach(d => d.onclick = () => {
          person.sensors[idx].entity = d.dataset.v; inp.value = d.dataset.v; res.style.display = 'none'; this._save();
        });
      };
    });

    this.querySelectorAll('.in-label').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].name = e.target.value; this._save(); });
    this.querySelectorAll('.in-icon').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].icon = e.target.value; this._save(); });
    this.querySelectorAll('.in-color').forEach(el => el.onchange = (e) => { person.sensors[el.dataset.idx].color = e.target.value; this._save(); });

    this.querySelector('#add-s').onclick = () => {
      person.sensors.push({ entity: '', name: 'Pouls', icon: 'mdi:heart', color: '#38bdf8', x: 50, y: 50 });
      this.render(); this._save();
    };

    this.querySelectorAll('[id^="del-"]').forEach(b => b.onclick = () => {
      person.sensors.splice(b.dataset.idx, 1); this.render(); this._save();
    });
  }

  _save() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V10", description: "Réglage d'image et verrouillage." });
