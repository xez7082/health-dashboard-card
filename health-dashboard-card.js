// HEALTH DASHBOARD CARD – VERSION V11 (NO-GAP EDITION)
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
    // Defaults
    if (this._config.img_offset === undefined) this._config.img_offset = 50; 
    if (this._config.card_height === undefined) this._config.card_height = 550;
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
        :host { display: block; }
        .main-container { 
          position: relative; width: 100%; height: ${this._config.card_height}px; 
          background: #0f172a; border-radius: 12px; overflow: hidden; 
          font-family: sans-serif; color: white; touch-action: none;
        }
        .bg { 
          position: absolute; inset: 0; 
          background: url('${imageUrl}') center ${this._config.img_offset}% / cover no-repeat; 
          opacity: 0.4; pointer-events: none; 
        }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 12px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 10; }
        .btn { border: none; padding: 6px 14px; border-radius: 15px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: bold; text-transform: uppercase;}
        .btn.active { background: #38bdf8; box-shadow: 0 0 10px #38bdf8; }
        
        .sensor { 
          position: absolute; transform: translate(-50%, -50%); 
          padding: 6px; border-radius: 8px; width: 22%; min-width: 70px;
          text-align: center; z-index: 5; 
          background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); 
          border: 1px solid rgba(255,255,255,0.15); 
          cursor: ${this._config.locked ? 'default' : 'grab'};
        }
        .icon-box { font-size: 1.2em; color: var(--icon-color); line-height: 1; }
        ha-icon { --mdc-icon-size: 20px; }
        .label { font-size: 0.6em; text-transform: uppercase; margin-top: 2px; opacity: 0.8; white-space: nowrap; overflow: hidden;}
        .val { font-size: 0.85em; font-weight: 800; color: #fff; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg>
          ${(person.sensors || []).map((s, i) => `
            <line id="line-${i}" x1="50%" y1="${this._config.img_offset}%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1" stroke-dasharray="3" opacity="0.3"/>
          `).join('')}
        </svg>
        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
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
          el.style.left = s.x + '%'; el.style.top = s.y + '%';
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

// EDITEUR V11 (FULL CONTROLS)
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
        .ed-wrap { padding: 10px; font-family: sans-serif; }
        .section { background: #f4f4f4; padding: 10px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #ddd; }
        .section-title { font-weight: bold; font-size: 12px; margin-bottom: 8px; display: block; color: #555; }
        .tabs { display: flex; gap: 4px; margin-bottom: 10px; }
        .tab { flex: 1; padding: 8px; border: none; background: #ddd; cursor: pointer; border-radius: 4px; font-size: 11px; }
        .tab.active { background: #38bdf8; color: white; }
        input[type="range"] { width: 100%; margin: 8px 0; }
        .sensor-item { border-left: 4px solid #38bdf8; padding: 8px; margin-bottom: 8px; background: #fff; border-radius: 0 4px 4px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: relative;}
        .results-list { position: absolute; width: 100%; max-height: 100px; overflow-y: auto; background: white; border: 1px solid #ccc; z-index: 100; color: #000; font-size: 12px; }
        .results-list div { padding: 6px; cursor: pointer; border-bottom: 1px solid #eee; }
        input[type="text"] { width: 100%; padding: 6px; box-sizing: border-box; margin: 3px 0; border: 1px solid #ccc; border-radius: 4px; }
        .btn { width: 100%; padding: 8px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 4px; }
      </style>
      <div class="ed-wrap">
        <div class="section">
          <span class="section-title">📐 DIMENSIONS ET AFFICHAGE</span>
          <label>Hauteur de la carte : ${this._config.card_height}px</label>
          <input type="range" id="card-h" min="300" max="800" step="10" value="${this._config.card_height}">
          
          <label>Cadrage image (Vertical) : ${this._config.img_offset}%</label>
          <input type="range" id="img-pos" min="0" max="100" value="${this._config.img_offset}">
          
          <label style="display:flex; align-items:center; gap:8px; margin-top:5px; font-size: 12px;">
            <input type="checkbox" id="lock-move" ${this._config.locked ? 'checked' : ''}> Verrouiller les bulles
          </label>
        </div>

        <div class="tabs">
          <button class="tab ${this.currentTab==='person1'?'active':''}" id="t-p1">HOMME</button>
          <button class="tab ${this.currentTab==='person2'?'active':''}" id="t-p2">FEMME</button>
        </div>
        
        <input type="text" id="in-name" placeholder="Prénom" value="${person.name}">
        
        <div id="sensor-container">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <input type="text" class="in-ent" data-idx="${i}" placeholder="Chercher entité..." value="${s.entity}">
              <div class="results-list" id="res-${i}" style="display:none"></div>
              <input type="text" class="in-label" data-idx="${i}" placeholder="Label" value="${s.name}">
              <input type="text" class="in-icon" data-idx="${i}" placeholder="Icône" value="${s.icon}">
              <input type="color" class="in-color" data-idx="${i}" value="${s.color}" style="width:100%; height:20px; border:none; padding:0;">
              <button class="btn" style="background:#ffcfcf; color:#c00; font-size:10px;" data-idx="${i}" id="del-${i}">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button class="btn" style="background:#38bdf8; color:white;" id="add-s">➕ Ajouter Capteur</button>
      </div>
    `;

    this._events();
  }

  _events() {
    this.querySelector('#card-h').oninput = (e) => { this._config.card_height = e.target.value; this._save(); };
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
      person.sensors.push({ entity: '', name: 'Tension', icon: 'mdi:gauge', color: '#38bdf8', x: 50, y: 50 });
      this.render(); this._save();
    };
    this.querySelectorAll('[id^="del-"]').forEach(b => b.onclick = () => {
      person.sensors.splice(b.dataset.idx, 1); this.render(); this._save();
    });
  }

  _save() { this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V11", description: "Format plein écran sans vides." });
