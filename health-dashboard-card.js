// HEALTH DASHBOARD CARD – VERSION V5 (FIXED EDITOR & SENSORS)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  static getStubConfig() {
    return {
      person1: { name: 'Homme', gender: 'male', image: '', sensors: [] },
      person2: { name: 'Femme', gender: 'female', image: '', sensors: [] },
    };
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.person1.sensors) this._config.person1.sensors = [];
    if (!this._config.person2.sensors) this._config.person2.sensors = [];
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
        .card { position: relative; width: 100%; height: 600px; background: #1a1a2e; border-radius: 16px; overflow: hidden; font-family: sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center center / contain no-repeat; opacity: 0.4; pointer-events: none; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 10; }
        .btn { border: none; padding: 10px 15px; border-radius: 20px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; transition: 0.3s; }
        .btn.active { background: #4ecca3; box-shadow: 0 0 10px #4ecca3; }
        .sensor { position: absolute; transform: translate(-50%, -50%); padding: 8px; border-radius: 12px; min-width: 80px; 
                  text-align: center; cursor: grab; z-index: 5; background: rgba(255,255,255,0.05); 
                  backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        .icon-pulse { animation: pulse 2s infinite ease-in-out; display: inline-block; font-size: 20px; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        .label { font-size: 9px; text-transform: uppercase; font-weight: bold; margin: 4px 0; }
        .val { font-size: 14px; font-weight: bold; color: white; }
      </style>
      <div class="card">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s, i) => `<line id="line-${i}" x1="50%" y1="50%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1" stroke-dasharray="3" opacity="0.5"/>`).join('')}</svg>
        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x}%; top:${s.y}%;">
            <div class="icon-pulse">${s.icon}</div>
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
        e.preventDefault();
        const rect = card.getBoundingClientRect();
        const move = (ev) => {
          s.x = Math.round(Math.max(5, Math.min(95, ((ev.clientX - rect.left) / rect.width) * 100)));
          s.y = Math.round(Math.max(5, Math.min(95, ((ev.clientY - rect.top) / rect.height) * 100)));
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

// EDITEUR V5
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this.currentTab = 'person1'; }

  set hass(hass) { this._hass = hass; }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  configChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  render() {
    if (!this._config) return;
    const person = this._config[this.currentTab];
    const entities = Object.keys(this._hass.states).filter(e => e.startsWith('sensor.')).sort();

    this.innerHTML = `
      <style>
        .edit-row { margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px; border: 1px solid #ddd; }
        select, input { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
        .tabs { display: flex; gap: 5px; margin-bottom: 10px; }
        .tab { flex: 1; padding: 8px; cursor: pointer; border: 1px solid #ccc; background: #eee; text-align: center; }
        .tab.active { background: #4ecca3; color: white; border-color: #4ecca3; }
        .btn-del { background: #ff4444; color: white; border: none; padding: 5px; cursor: pointer; width: 100%; border-radius: 4px; }
        .btn-add { background: #4ecca3; color: white; border: none; padding: 10px; cursor: pointer; width: 100%; border-radius: 4px; font-weight: bold; }
      </style>
      <div class="tabs">
        <div class="tab ${this.currentTab==='person1'?'active':''}" onclick="this.getRootNode().host.switchTab('person1')">Personne 1</div>
        <div class="tab ${this.currentTab==='person2'?'active':''}" onclick="this.getRootNode().host.switchTab('person2')">Personne 2</div>
      </div>
      <div>
        <label>Nom :</label>
        <input type="text" value="${person.name}" oninput="this.getRootNode().host.updatePerson('name', this.value)">
      </div>
      <hr>
      <div id="sensors-list">
        ${(person.sensors || []).map((s, i) => `
          <div class="edit-row">
            <strong>Capteur ${i+1}</strong>
            <select onchange="this.getRootNode().host.updateSensor(${i}, 'entity', this.value)">
              <option value="">-- Choisir un Sensor --</option>
              ${entities.map(e => `<option value="${e}" ${s.entity===e?'selected':''}>${e}</option>`).join('')}
            </select>
            <input type="text" placeholder="Nom affiché" value="${s.name}" oninput="this.getRootNode().host.updateSensor(${i}, 'name', this.value)">
            <input type="text" placeholder="Icône (Emoji)" value="${s.icon}" oninput="this.getRootNode().host.updateSensor(${i}, 'icon', this.value)">
            <input type="color" value="${s.color}" onchange="this.getRootNode().host.updateSensor(${i}, 'color', this.value)">
            <button class="btn-del" onclick="this.getRootNode().host.removeSensor(${i})">Supprimer</button>
          </div>
        `).join('')}
      </div>
      <button class="btn-add" onclick="this.getRootNode().host.addSensor()">➕ Ajouter un capteur</button>
    `;
  }

  switchTab(t) { this.currentTab = t; this.render(); }
  updatePerson(key, val) { this._config[this.currentTab][key] = val; this.configChanged(); }
  updateSensor(i, key, val) { this._config[this.currentTab].sensors[i][key] = val; this.configChanged(); }
  addSensor() { 
    this._config[this.currentTab].sensors.push({ entity: '', name: 'Nouveau', icon: '❤️', color: '#4ecca3', x: 50, y: 50 }); 
    this.render(); this.configChanged(); 
  }
  removeSensor(i) { this._config[this.currentTab].sensors.splice(i, 1); this.render(); this.configChanged(); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V5", description: "Placement précis et sélecteur de sensors corrigé." });
