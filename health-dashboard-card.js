class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
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
        :host {
          display: block;
          padding: 0;
        }
        
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
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .person-button:hover {
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
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
          position: relative;
          height: 100%;
        }

        .silhouette {
          width: 100%;
          height: 100%;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          opacity: 0.3;
          filter: brightness(1.2);
        }

        .sensors-container {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          padding: 20px;
          overflow-y: auto;
          max-height: 100%;
        }

        .sensor-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .sensor-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .sensor-icon {
          font-size: 32px;
          margin-bottom: 12px;
          color: #667eea;
        }

        .sensor-name {
          font-size: 13px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sensor-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .person-name {
          position: absolute;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 32px;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          z-index: 5;
        }

        @media (max-width: 768px) {
          .content-wrapper {
            flex-direction: column;
          }
          
          .silhouette-container {
            flex: 0 0 30%;
          }
          
          .sensors-container {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
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
                <div class="sensor-icon">${sensor.icon || '📊'}</div>
                <div class="sensor-name">${sensor.name || 'Sensor'}</div>
                <div class="sensor-value" id="sensor-value-${index}">--</div>
              </div>
            `).join('')}
          </div>
        </div>
      </ha-card>
    `;

    // Ajouter les event listeners après le rendu
    const person1Button = this.shadowRoot.getElementById('btn-person1');
    const person2Button = this.shadowRoot.getElementById('btn-person2');
    
    if (person1Button) {
      person1Button.addEventListener('click', () => this.togglePerson('person1'));
    }
    if (person2Button) {
      person2Button.addEventListener('click', () => this.togglePerson('person2'));
    }

    // Mettre à jour les valeurs des capteurs
    this.updateSensorValues();
  }
}

// Enregistrer l'élément personnalisé
customElements.define('health-dashboard-card', HealthDashboardCard);

// Ajouter à la liste des cartes personnalisées
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'health-dashboard-card',
  name: 'Health Dashboard Card',
  description: 'Une carte personnalisée pour suivre la santé de deux personnes',
  preview: true,
});

console.info(
  '%c HEALTH-DASHBOARD-CARD %c v1.0.0 ',
  'color: white; background: #667eea; font-weight: bold;',
  'color: #667eea; background: white; font-weight: bold;'
);
