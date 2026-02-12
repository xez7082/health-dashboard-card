// HEALTH DASHBOARD CARD – VERSION V4 (LIGNES & ANIMATIONS)
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
      person1: { name: 'Homme', gender: 'male', image: '', sensors: [{ entity: 'sensor.heart_rate', name: 'Pouls', icon: '❤️', x: 50, y: 25, color: '#f44336' }] },
      person2: { name: 'Femme', gender: 'female', image: '', sensors: [{ entity: 'sensor.sleep_score', name: 'Sommeil', icon: '🌙', x: 70, y: 15, color: '#9c27b0' }] },
    };
  }

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
        .card { position: relative; width: 100%; height: 600px; overflow: hidden; border-radius: 16px; 
                background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); font-family: 'Segoe UI', sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center center / contain no-repeat; opacity: 0.4; z-index: 1; }
        
        /* SVG pour les lignes de connexion */
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        line { stroke-width: 1.5; stroke-dasharray: 4; opacity: 0.6; }

        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 10; }
        .btn { border: none; padding: 10px 20px; border-radius: 30px; cursor: pointer; color: white; background: rgba(255,255,255,0.1); backdrop-filter: blur(5px); transition: 0.3s; }
        .btn.active { background: #4ecca3; box-shadow: 0 0 15px #4ecca3; }

        .sensor { position: absolute; transform: translate(-50%, -50%); padding: 10px; border-radius: 15px; 
                  min-width: 100px; text-align: center; cursor: grab; z-index: 5; backdrop-filter: blur(8px);
                  box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); transition: transform 0.2s; }
        .sensor:active { transform: translate(-50%, -50%) scale(1.1); cursor: grabbing; }
        
        .icon-pulse { display: inline-block; animation: pulse 2s infinite ease-in-out; font-size: 24px; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        
        .val { font-size: 18px; font-weight: bold; display: block; margin-top: 4px; }
        .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
      </style>
      
      <div class="card">
        <div class="bg"></div>
        <svg id="lines-svg">
          ${(person.sensors || []).map((s, i) => `
            <line id="line-${i}" x1="50%" y1="50%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color || '#4ecca3'}" />
          `).join('')}
        </svg>

        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>

        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x}%; top:${s.y}%; background: ${this.hexToRgba(s.color || '#4ecca3', 0.2)};">
            <div class="icon-pulse">${s.icon || '❤️'}</div>
            <div class="label" style="color:${s.color}">${s.name}</div>
            <div class="val" id="value-${i}" style="color:white">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('p1').onclick = () => { this.currentPerson = 'person1'; this.render(); };
    this.shadowRoot.getElementById('p2').onclick = () => { this.currentPerson = 'person2'; this.render(); };
    this.enableDrag();
    this.updateSensors();
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  enableDrag() {
    const card = this.shadowRoot.querySelector('.card');
    const sensors = this._config[this.currentPerson].sensors || [];
    sensors.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      const line = this.shadowRoot.getElementById(`line-${i}`);
      if (!el) return;
      el.onmousedown = (e) => {
        const rect = card.getBoundingClientRect();
        const move = (ev) => {
          s.x = Math.round(((ev.clientX - rect.left) / rect.width) * 100);
          s.y = Math.round(((ev.clientY - rect.top) / rect.height) * 100);
          el.style.left = s.x + '%';
          el.style.top = s.y + '%';
          line.setAttribute('x2', s.x + '%');
          line.setAttribute('y2', s.y + '%');
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

// EDITEUR V4
class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  render() {
    this.innerHTML = `
      <div style="padding: 20px;">
        <p>Utilisez l'interface de la carte pour glisser-déposer les capteurs sur le corps.</p>
        <p>Paramétrez ici les noms, entités et icônes (Emoji supportés).</p>
        <hr>
        <div id="editor-content"></div>
        <button id="add-s" style="width:100%; padding:10px; margin-top:10px; background:#4ecca3; border:none; color:white; border-radius:5px;">➕ Ajouter un capteur</button>
      </div>
    `;
    this.renderSensors();
  }

  renderSensors() {
    const person = this._config.person1; // Exemple simplifié sur person1
    const container = this.querySelector('#editor-content');
    container.innerHTML = (person.sensors || []).map((s, i) => `
      <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:8px;">
        <input type="text" placeholder="Entité (sensor.xxx)" value="${s.entity}" oninput="this.updateConf(${i}, 'entity', this.value)">
        <input type="text" placeholder="Nom" value="${s.name}" oninput="this.updateConf(${i}, 'name', this.value)">
        <input type="text" placeholder="Icône (ex: ❤️)" value="${s.icon}" oninput="this.updateConf(${i}, 'icon', this.value)">
        <input type="color" value="${s.color}" onchange="this.updateConf(${i}, 'color', this.value)">
      </div>
    `).join('');
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Card V4 (Animated)",
  description: "Dashboard santé avec lignes de connexion et animations."
});
