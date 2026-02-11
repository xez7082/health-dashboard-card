class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
    this.sensorElements = [];
  }

  static getConfigElement() {
    return document.createElement('health-dashboard-card-editor');
  }

  static getStubConfig() {
    return {
      person1: { name: 'Personne 1', gender: 'male', background: '', sensors: [] },
      person2: { name: 'Personne 2', gender: 'female', background: '', sensors: [] },
    };
  }

  setConfig(config) {
    if (!config.person1 || !config.person2) {
      throw new Error('Vous devez définir person1 et person2 dans la configuration');
    }
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensorValues();
  }

  getCardSize() {
    return 6;
  }

  updateSensorValues() {
    if (!this._config || !this._hass) return;
    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    person.sensors?.forEach((sensor, index) => {
      const state = this._hass.states[sensor.entity];
      const el = this.sensorElements[index];
      if (el && state) {
        const unit = state.attributes.unit_of_measurement || '';
        el.textContent = `${state.state} ${unit}`.trim();
      }
    });
  }

  togglePerson(person) {
    if (this.currentPerson === person) return;
    this.currentPerson = person;

    this.shadowRoot.getElementById('p1').classList.toggle('active', person === 'person1');
    this.shadowRoot.getElementById('p2').classList.toggle('active', person === 'person2');

    const imgDiv = this.shadowRoot.querySelector('.image');
    const bgImage = person === 'person1' ? this._config.person1.background : this._config.person2.background;
    const defaultImage = person === 'person1' 
      ? (this._config.person1.gender === 'female' ? '/local/health-dashboard/femme.png' : '/local/health-dashboard/homme.png')
      : (this._config.person2.gender === 'female' ? '/local/health-dashboard/femme.png' : '/local/health-dashboard/homme.png');

    imgDiv.style.backgroundImage = `url('${bgImage || defaultImage}')`;

    const sensors = person === 'person1' ? this._config.person1.sensors : this._config.person2.sensors;
    if (sensors.length !== this.sensorElements.length) this.renderGrid();
    this.updateSensorValues();
  }

  renderGrid() {
    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    const sensors = person.sensors || [];
    const grid = this.shadowRoot.querySelector('.grid');
    grid.innerHTML = sensors.map((s, i) => `
      <div class="card">
        <div>${s.name || s.entity}</div>
        <div id="sensor-value-${i}" class="value">--</div>
      </div>
    `).join('');
    this.sensorElements = sensors.map((_, i) => this.shadowRoot.querySelector(`#sensor-value-${i}`));
  }

  render() {
    if (!this._config) return;

    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    const sensors = person.sensors || [];
    const bgImage = person.background || (person.gender === 'female' ? '/local/health-dashboard/femme.png' : '/local/health-dashboard/homme.png');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          position: relative;
          overflow: hidden;
          height: 600px;
          background: transparent; /* Plus de fond violet */
        }
        .header {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 8px;
        }
        button {
          border: none;
          padding: 10px 18px;
          border-radius: 20px;
          cursor: pointer;
        }
        .active { background: white; }
        .layout {
          display: flex;
          height: 100%;
        }
        .image {
          flex: 0 0 40%;
          background: url('${bgImage}') center/cover no-repeat;
          opacity: 0.35;
          transition: background-image 0.5s ease;
        }
        .grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          padding: 20px;
          overflow-y: auto;
        }
        .card {
          text-align: center;
          color: white;
          text-shadow: 0 0 4px rgba(0,0,0,0.6);
        }
        .value { font-size: 22px; font-weight: bold; }
      </style>

      <ha-card>
        <div class="header">
          <button id="p1" class="${this.currentPerson === 'person1' ? 'active' : ''}">${this._config.person1.name}</button>
          <button id="p2" class="${this.currentPerson === 'person2' ? 'active' : ''}">${this._config.person2.name}</button>
        </div>
        <div class="layout">
          <div class="image"></div>
          <div class="grid">
            ${sensors.map((s, i) => `
              <div class="card">
                <div>${s.name || s.entity}</div>
                <div id="sensor-value-${i}" class="value">--</div>
              </div>
            `).join('')}
          </div>
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById('p1').onclick = () => this.togglePerson('person1');
    this.shadowRoot.getElementById('p2').onclick = () => this.togglePerson('person2');

    this.sensorElements = sensors.map((_, i) => this.shadowRoot.querySelector(`#sensor-value-${i}`));
    this.updateSensorValues();
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  getEntities(filter='') {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter(e => e.startsWith('sensor.') && e.toLowerCase().includes(filter.toLowerCase()));
  }

  renderSensors(list, prefix, filter='') {
    const entities = this.getEntities(filter);
    return `
      <div id="${prefix}-sensors">
        ${(list || []).map((s, i) => `
          <div style="display:flex; gap:6px; margin-bottom:6px;">
            <input type="text" placeholder="Nom capteur" data-name-index="${i}" data-prefix="${prefix}" value="${s.name || ''}">
            <select data-index="${i}" data-prefix="${prefix}" class="sensor-select">
              ${entities.map(e => `<option value="${e}" ${e === s.entity ? 'selected' : ''}>${e}</option>`).join('')}
            </select>
            <button data-remove="${i}" data-prefix="${prefix}">✕</button>
          </div>
        `).join('')}
      </div>
      <button data-add="${prefix}">+ Ajouter capteur</button>
    `;
  }

  render() {
    if (!this._config) return;

    this.innerHTML = `
      <style>
        .wrap { padding: 16px; }
        select, input { width: 100%; padding: 6px; margin-bottom: 6px; }
        button { cursor: pointer; }
      </style>
      <div class="wrap">
        <h3>Personne 1</h3>
        <input id="p1name" value="${this._config.person1.name || ''}" placeholder="Nom">
        <select id="p1gender">
          <option value="male" ${this._config.person1.gender === 'male' ? 'selected' : ''}>Homme</option>
          <option value="female" ${this._config.person1.gender === 'female' ? 'selected' : ''}>Femme</option>
        </select>
        <input id="p1bg" value="${this._config.person1.background || ''}" placeholder="URL image de fond">
        <input type="text" id="p1search" placeholder="Rechercher capteur">
        <div id="p1-sensors-wrapper">
          ${this.renderSensors(this._config.person1.sensors, 'p1')}
        </div>

        <h3>Personne 2</h3>
        <input id="p2name" value="${this._config.person2.name || ''}" placeholder="Nom">
        <select id="p2gender">
          <option value="male" ${this._config.person2.gender === 'male' ? 'selected' : ''}>Homme</option>
          <option value="female" ${this._config.person2.gender === 'female' ? 'selected' : ''}>Femme</option>
        </select>
        <input id="p2bg" value="${this._config.person2.background || ''}" placeholder="URL image de fond">
        <input type="text" id="p2search" placeholder="Rechercher capteur">
        <div id="p2-sensors-wrapper">
          ${this.renderSensors(this._config.person2.sensors, 'p2')}
        </div>
      </div>
    `;

    // Gestion des boutons et inputs
    ['p1','p2'].forEach(prefix => {
      const wrapper = this.querySelector(`#${prefix}-sensors-wrapper`);
      const searchInput = this.querySelector(`#${prefix}search`);
      const renderList = () => {
        wrapper.innerHTML = this.renderSensors(this._config[prefix === 'p1' ? 'person1':'person2'].sensors, prefix, searchInput.value);
        this.attachSensorEvents(wrapper, prefix);
      };
      searchInput.oninput = renderList;
      renderList();
    });

    this.querySelectorAll('#p1name,#p2name,#p1bg,#p2bg,#p1gender,#p2gender').forEach(el => el.onchange = () => this.save());
  }

  attachSensorEvents(wrapper, prefix) {
    wrapper.querySelectorAll('[data-add]').forEach(btn => {
      btn.onclick = () => {
        const key = prefix === 'p1' ? 'person1' : 'person2';
        this._config[key].sensors.push({ entity: this.getEntities()[0], name: '' });
        this.render();
      };
    });
    wrapper.querySelectorAll('[data-remove]').forEach(btn => {
      btn.onclick = () => {
        const key = prefix === 'p1' ? 'person1' : 'person2';
        this._config[key].sensors.splice(btn.dataset.remove, 1);
        this.render();
      };
    });
    wrapper.querySelectorAll('[data-name-index]').forEach(input => {
      input.onchange = () => this.save();
    });
    wrapper.querySelectorAll('.sensor-select').forEach(sel => sel.onchange = () => this.save());
  }

  save() {
    const collect = (prefix) => {
      const key = prefix === 'p1' ? 'person1':'person2';
      const sensors = [...this.querySelectorAll(`#${prefix}-sensors-wrapper .sensor-select`)].map((sel, i) => ({
        entity: sel.value,
        name: this.querySelector(`#${prefix}-sensors-wrapper [data-name-index="${i}"]`).value
      }));
      return {
        name: this.querySelector(`#${prefix}name`).value,
        gender: this.querySelector(`#${prefix}gender`).value,
        background: this.querySelector(`#${prefix}bg`).value,
        sensors
      };
    };
    const config = {
      type: 'custom:health-dashboard-card',
      person1: collect('p1'),
      person2: collect('p2')
    };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config } }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'health-dashboard-card',
  name: 'Health Dashboard Card',
  description: 'Carte santé multi-capteurs avec éditeur visuel et recherche',
  preview: true,
});

console.info('%c HEALTH-DASHBOARD-CARD %c v3.3.0 ', 'color: white; background: #667eea; font-weight: bold;', 'color: #667eea; background: white; font-weight: bold;');
