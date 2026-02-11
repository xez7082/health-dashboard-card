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
      person1: { name: 'Personne 1', sensors: [] },
      person2: { name: 'Personne 2', sensors: [] },
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

    if (person.sensors) {
      person.sensors.forEach((sensor, index) => {
        const entityId = sensor.entity;
        const state = this._hass.states[entityId];
        const valueElement = this.shadowRoot.querySelector(`#sensor-value-${index}`);

        if (valueElement && state) {
          const unit = state.attributes.unit_of_measurement || '';
          valueElement.textContent = `${state.state} ${unit}`.trim();
        }
      });
    }
  }

  togglePerson(person) {
    this.currentPerson = person;
    this.render();
  }

  render() {
    if (!this._config) return;

    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    const personName = person.name || 'Personne';
    const gender = person.gender || 'male';
    const bgImage = person.background_image || (gender === 'male' ? 'male-silhouette.png' : 'female-silhouette.png');
    const sensors = person.sensors || [];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }

        ha-card {
          position: relative;
          overflow: hidden;
          height: 600px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .card-header {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 12px;
          z-index: 10;
        }

        .person-button {
          padding: 12px 24px;
          border: none;
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .person-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .content-wrapper {
          display: flex;
          height: 100%;
          align-items: center;
          padding: 20px;
        }

        .silhouette-container {
          flex: 0 0 40%;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .silhouette {
          width: 100%;
          height: 100%;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          opacity: 0.3;
        }

        .sensors-container {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          padding: 20px;
          overflow-y: auto;
        }

        .sensor-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
        }

        .sensor-value {
          font-size: 24px;
          font-weight: bold;
        }

        .person-name {
          position: absolute;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 32px;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.9);
        }
      </style>

      <ha-card>
        <div class="card-header">
          <button class="person-button ${this.currentPerson === 'person1' ? 'active' : ''}" id="btn-person1">
            ${this._config.person1.name}
          </button>
          <button class="person-button ${this.currentPerson === 'person2' ? 'active' : ''}" id="btn-person2">
            ${this._config.person2.name}
          </button>
        </div>

        <div class="person-name">${personName}</div>

        <div class="content-wrapper">
          <div class="silhouette-container">
            <div class="silhouette" style="background-image: url('/local/health-dashboard/${bgImage}');"></div>
          </div>

          <div class="sensors-container">
            ${sensors.map((sensor, index) => `
              <div class="sensor-card">
                <div>${sensor.name || 'Sensor'}</div>
                <div class="sensor-value" id="sensor-value-${index}">--</div>
              </div>
            `).join('')}
          </div>
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById('btn-person1')?.addEventListener('click', () => this.togglePerson('person1'));
    this.shadowRoot.getElementById('btn-person2')?.addEventListener('click', () => this.togglePerson('person2'));

    this.updateSensorValues();
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  render() {
    if (!this._config) return;

    this.innerHTML = `
      <style>
        .editor { padding: 16px; }
        .field { margin-bottom: 12px; }
        label { display: block; font-weight: bold; margin-bottom: 4px; }
        input { width: 100%; padding: 8px; box-sizing: border-box; }
      </style>

      <div class="editor">
        <div class="field">
          <label>Nom Personne 1</label>
          <input id="p1name" value="${this._config.person1?.name || ''}">
        </div>

        <div class="field">
          <label>Nom Personne 2</label>
          <input id="p2name" value="${this._config.person2?.name || ''}">
        </div>
      </div>
    `;

    this.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', () => this._valueChanged());
    });
  }

  _valueChanged() {
    const newConfig = {
      ...this._config,
      person1: { ...this._config.person1, name: this.querySelector('#p1name').value },
      person2: { ...this._config.person2, name: this.querySelector('#p2name').value },
    };

    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: newConfig } }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'health-dashboard-card',
  name: 'Health Dashboard Card',
  description: 'Carte santé avec éditeur visuel',
  preview: true,
});

console.info('%c HEALTH-DASHBOARD-CARD %c v1.1.0 ', 'color: white; background: #667eea; font-weight: bold;', 'color: #667eea; background: white; font-weight: bold;');
