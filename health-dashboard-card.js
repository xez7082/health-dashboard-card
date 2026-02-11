class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
  }

  static getConfigElement() {
    return document.createElement('health-dashboard-card-editor');
  }

  static getStubConfig() {
    return {
      person1: { name: 'Personne 1', gender: 'male', sensors: [] },
      person2: { name: 'Personne 2', gender: 'female', sensors: [] },
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
      const el = this.shadowRoot.querySelector(`#sensor-value-${index}`);

      if (el && state) {
        const unit = state.attributes.unit_of_measurement || '';
        el.textContent = `${state.state} ${unit}`.trim();
      }
    });
  }

  togglePerson(person) {
    this.currentPerson = person;
    this.render();
  }

  render() {
    if (!this._config) return;

    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    const sensors = person.sensors || [];

    const image = person.gender === 'female'
      ? '/local/health-dashboard/femme.png'
      : '/local/health-dashboard/homme.png';

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }

        ha-card {
          position: relative;
          overflow: hidden;
          height: 600px;
          background: linear-gradient(135deg, #667eea, #764ba2);
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
          background: url('${image}') center/contain no-repeat;
          opacity: 0.35;
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
          background: rgba(255,255,255,0.9);
          border-radius: 14px;
          padding: 16px;
          text-align: center;
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

    this.updateSensorValues();
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  getEntities() {
    if (!this._hass) return [];
    return Object.keys(this._hass.states).filter(e => e.startsWith('sensor.'));
  }

  renderSensors(list, prefix) {
    const entities = this.getEntities();

    return `
      <div id="${prefix}-sensors">
        ${(list || []).map((s, i) => `
          <div style="display:flex; gap:6px; margin-bottom:6px;">
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
        select, input { width: 100%; padding: 6px; }
        button { cursor: pointer; }
      </style>

      <div class="wrap">
        <h3>Personne 1</h3>
        <input id="p1name" value="${this._config.person1.name || ''}">
        <select id="p1gender">
          <option value="male" ${this._config.person1.gender === 'male' ? 'selected' : ''}>Homme</option>
          <option value="female" ${this._config.person1.gender === 'female' ? 'selected' : ''}>Femme</option>
        </select>
        ${this.renderSensors(this._config.person1.sensors, 'p1')}

        <h3>Personne 2</h3>
        <input id="p2name" value="${this._config.person2.name || ''}">
        <select id="p2gender">
          <option value="male" ${this._config.person2.gender === 'male' ? 'selected' : ''}>Homme</option>
          <option value="female" ${this._config.person2.gender === 'female' ? 'selected' : ''}>Femme</option>
        </select>
        ${this.renderSensors(this._config.person2.sensors, 'p2')}
      </div>
    `;

    this.querySelectorAll('input,select').forEach(el => el.onchange = () => this.save());

    this.querySelectorAll('[data-add]').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.add === 'p1' ? 'person1' : 'person2';
        this._config[key].sensors.push({ entity: this.getEntities()[0] });
        this.render();
      };
    });

    this.querySelectorAll('[data-remove]').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.prefix === 'p1' ? 'person1' : 'person2';
        this._config[key].sensors.splice(btn.dataset.remove, 1);
        this.render();
      };
    });
  }

  save() {
    const collect = (prefix, base) => ({
      name: this.querySelector(`#${prefix}name`).value,
      gender: this.querySelector(`#${prefix}gender`).value,
      sensors: [...this.querySelectorAll(`.sensor-select[data-prefix="${prefix}"]`)].map(s => ({ entity: s.value }))
    });

    const config = {
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
  description: 'Carte santé multi-capteurs avec éditeur visuel',
  preview: true,
});

console.info('%c HEALTH-DASHBOARD-CARD %c v3.0.0 ', 'color: white; background: #667eea; font-weight: bold;', 'color: #667eea; background: white; font-weight: bold;');
