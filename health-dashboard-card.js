// HEALTH DASHBOARD CARD – VERSION V6 (SEARCH & MDI ICONS)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
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

  updateSensors() {
    if (!this._hass || !this._config) return;
    const sensors = this._config[this.currentPerson].sensors || [];
    sensors.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`value-${i}`);
      if (el) {
        const stateObj = this._hass.states[s.entity];
        el.textContent = stateObj ? `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`.trim() : 'N/A';
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
        .card { position: relative; width: 100%; height: 600px; background: #111; border-radius: 16px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center center / contain no-repeat; opacity: 0.35; pointer-events: none; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 10; }
        .btn { border: none; padding: 10px 18px; border-radius: 25px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; font-weight: bold; }
        .btn.active { background: #00d2ff; box-shadow: 0 0 15px #00d2ff; }
        .sensor { position: absolute; transform: translate(-50%, -50%); padding: 10px; border-radius: 12px; min-width: 90px; 
                  text-align: center; cursor: grab; z-index: 5; background: rgba(30, 30, 30, 0.8); 
                  backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .icon-box { font-size: 24px; color: var(--icon-color); }
        ha-icon { --mdc-icon-size: 28px; }
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
        .label { font-size: 10px; text-transform: uppercase; margin-top: 5px; opacity: 0.8; }
        .val { font-size: 15px; font-weight: bold; }
      </style>
      <div class="card">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s, i) => `<line id="line-${i}" x1="50%" y1="50%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1.5" stroke-dasharray="4" opacity="0.4"/>`).join('')}</svg>
        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x}%; top:${s.y}%; --icon-color:${s.color}">
            <div class="icon-box pulse">
              ${s.icon.includes(':') ? `<ha-icon icon="${s.icon}"></ha-icon>` : s.icon}
            </div>
            <div class="label" style="color:${s.color}">${s.name}</div>
            <div id="value-${i}" class="val">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('p1').onclick = () => { this.currentPerson = 'person1'; this.render(); };
    this.shadowRoot.getElementById('p2').onclick = () => { this.currentPerson = 'person2'; this.render(); };
    this.enableDrag();
  }

  enableDrag() {
    const card = this.shadowRoot.querySelector('.card');
    const sensors = this._config[this.currentPerson].sensors || [];
    sensors.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      if (!el) return;
      el.onmousedown = (e) => {
        const rect = card.getBoundingClientRect();
        const move = (ev) => {
          s.x = Math.round(((ev.clientX - rect.left) / rect.width) * 100);
          s.y = Math.round(((ev.clientY - rect.top) / rect.height) * 100);
          el.style.left = s.x + '%';
          el.style.top = s.y + '%';
          const line = this.shadowRoot.getElementById(`line-${i}`);
          if (line) { line.setAttribute('x2', s.x + '%'); line.setAttribute('y2', s.y + '%'); }
        };
        const up = () => {
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
          this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
      };
    });
  }
}

// EDITEUR V6 AVEC RECHERCHE
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this.currentTab = 'person1'; }
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }

  configChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  render() {
    if (!this._config || !this._hass) return;
    const person = this._config[this.currentTab];

    this.innerHTML = `
      <style>
        .editor-container { font-family: sans-serif; padding: 10px; }
        .tabs { display: flex; margin-bottom: 15px; background: #eee; border-radius: 8px; overflow: hidden; }
        .tab { flex: 1; padding: 10px; text-align: center; cursor: pointer; border: none; }
        .tab.active { background: #00d2ff; color: white; font-weight: bold; }
        .sensor-block { border: 1px solid #ccc; padding: 12px; border-radius: 8px; margin-bottom: 15px; background: #fdfdfd; }
        .search-container { position: relative; }
        .results { position: absolute; width: 100%; max-height: 150px; overflow-y: auto; background: white; border: 1px solid #ccc; z-index: 100; display: none; }
        .results div { padding: 8px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 12px; }
        .results div:hover { background: #f0f0f0; }
        input { width: 100%; padding: 8px; box-sizing: border-box; margin: 5px 0; border: 1px solid #ccc; border-radius: 4px; }
        .btn-add { background: #4caf50; color: white; width: 100%; padding: 12px; border: none; border-radius: 8px; cursor: pointer; }
        .btn-del { background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 5px; }
      </style>
      <div class="editor-container">
        <div class="tabs">
          <div class="tab ${this.currentTab==='person1'?'active':''}" data-tab="person1">Homme</div>
          <div class="tab ${this.currentTab==='person2'?'active':''}" data-tab="person2">Femme</div>
        </div>
        
        <label>Nom :</label>
        <input type="text" id="main-name" value="${person.name}">
        <hr>
        
        <div id="sensors-list">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-block">
              <strong>Capteur #${i+1}</strong>
              <div class="search-container">
                <input type="text" class="search-input" data-idx="${i}" placeholder="Chercher un sensor..." value="${s.entity}">
                <div class="results" id="results-${i}"></div>
              </div>
              <input type="text" class="s-name" data-idx="${i}" placeholder="Nom (ex: Tension)" value="${s.name}">
              <input type="text" class="s-icon" data-idx="${i}" placeholder="Icon (ex: mdi:heart ou ❤️)" value="${s.icon}">
              <input type="color" class="s-color" data-idx="${i}" value="${s.color}">
              <button class="btn-del" data-idx="${i}">🗑️ Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-add">➕ Ajouter un capteur</button>
      </div>
    `;

    this._attachEvents();
  }

  _attachEvents() {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this.currentTab = t.dataset.tab; this.render(); });
    this.querySelector('#main-name').oninput = (e) => { this._config[this.currentTab].name = e.target.value; this.configChanged(); };
    
    const person = this._config[this.currentTab];

    // Logique de recherche prédictive
    this.querySelectorAll('.search-input').forEach(input => {
      input.oninput = (e) => {
        const val = e.target.value.toLowerCase();
        const idx = e.target.dataset.idx;
        const resultsDiv = this.querySelector(`#results-${idx}`);
        
        if (val.length < 2) { resultsDiv.style.display = 'none'; return; }
        
        const matches = Object.keys(this._hass.states)
          .filter(ent => ent.includes(val))
          .slice(0, 10);
        
        resultsDiv.innerHTML = matches.map(m => `<div data-val="${m}">${m}</div>`).join('');
        resultsDiv.style.display = 'block';
        
        resultsDiv.querySelectorAll('div').forEach(div => {
          div.onclick = () => {
            person.sensors[idx].entity = div.dataset.val;
            input.value = div.dataset.val;
            resultsDiv.style.display = 'none';
            this.configChanged();
          };
        });
      };
    });

    this.querySelectorAll('.s-name').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].name = e.target.value; this.configChanged(); });
    this.querySelectorAll('.s-icon').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].icon = e.target.value; this.configChanged(); });
    this.querySelectorAll('.s-color').forEach(el => el.onchange = (e) => { person.sensors[el.dataset.idx].color = e.target.value; this.configChanged(); });
    this.querySelector('.btn-add').onclick = () => {
      person.sensors.push({ entity: '', name: 'Nouveau', icon: 'mdi:pulse', color: '#00d2ff', x: 50, y: 50 });
      this.render(); this.configChanged();
    };
    this.querySelectorAll('.btn-del').forEach(btn => btn.onclick = () => {
      person.sensors.splice(btn.dataset.idx, 1);
      this.render(); this.configChanged();
    });
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V6", description: "Recherche prédictive et icônes MDI." });
