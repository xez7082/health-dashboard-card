class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    if (!this._config.person1) {
      this._config.person1 = { name: 'Personne 1', gender: 'male', sensors: [] };
    }
    if (!this._config.person2) {
      this._config.person2 = { name: 'Personne 2', gender: 'female', sensors: [] };
    }
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  configChanged(newConfig) {
    const event = new Event('config-changed', {
      bubbles: true,
      composed: true,
    });
    event.detail = { config: newConfig };
    this.dispatchEvent(event);
  }

  render() {
    if (!this._config || !this._hass) return;

    this.innerHTML = `
      <style>
        .card-config {
          padding: 16px;
        }
        .person-section {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .person-section h3 {
          margin-top: 0;
          color: #667eea;
        }
        .config-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          align-items: center;
        }
        .config-row label {
          flex: 0 0 140px;
          font-weight: 500;
        }
        .config-row input,
        .config-row select {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        .sensor-list {
          margin-top: 12px;
        }
        .sensor-item {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
        }
        .sensor-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .sensor-item-fields {
          display: grid;
          gap: 8px;
        }
        .sensor-field {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .sensor-field label {
          flex: 0 0 80px;
          font-size: 12px;
          color: #666;
        }
        .sensor-field input {
          flex: 1;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
        }
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-add {
          background: #667eea;
          color: white;
          width: 100%;
          margin-top: 8px;
        }
        .btn-add:hover {
          background: #5568d3;
        }
        .btn-remove {
          background: #ff5252;
          color: white;
          padding: 6px 12px;
          font-size: 12px;
        }
        .btn-remove:hover {
          background: #ff1744;
        }
        .info-box {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 12px;
          margin-bottom: 16px;
          border-radius: 4px;
          font-size: 13px;
        }
        ha-entity-picker {
          width: 100%;
        }
      </style>

      <div class="card-config">
        <div class="info-box">
          💡 <strong>Astuce :</strong> Configurez les deux personnes avec leurs prénoms et leurs capteurs de santé.
        </div>

        <!-- PERSONNE 1 -->
        <div class="person-section">
          <h3>👤 Personne 1</h3>
          
          <div class="config-row">
            <label>Prénom :</label>
            <input 
              type="text" 
              id="person1-name" 
              value="${this._config.person1.name || ''}"
              placeholder="Ex: Jean"
            />
          </div>

          <div class="config-row">
            <label>Genre :</label>
            <select id="person1-gender">
              <option value="male" ${this._config.person1.gender === 'male' ? 'selected' : ''}>Homme</option>
              <option value="female" ${this._config.person1.gender === 'female' ? 'selected' : ''}>Femme</option>
            </select>
          </div>

          <div class="config-row">
            <label>Image (optionnel) :</label>
            <input 
              type="text" 
              id="person1-image" 
              value="${this._config.person1.background_image || ''}"
              placeholder="Ex: male-silhouette.png"
            />
          </div>

          <div class="sensor-list">
            <h4>Capteurs de santé</h4>
            <div id="person1-sensors">
              ${this.renderSensors(this._config.person1.sensors || [], 'person1')}
            </div>
            <button class="btn-add" onclick="window.healthDashboardEditor.addSensor('person1')">
              ➕ Ajouter un capteur
            </button>
          </div>
        </div>

        <!-- PERSONNE 2 -->
        <div class="person-section">
          <h3>👤 Personne 2</h3>
          
          <div class="config-row">
            <label>Prénom :</label>
            <input 
              type="text" 
              id="person2-name" 
              value="${this._config.person2.name || ''}"
              placeholder="Ex: Marie"
            />
          </div>

          <div class="config-row">
            <label>Genre :</label>
            <select id="person2-gender">
              <option value="male" ${this._config.person2.gender === 'male' ? 'selected' : ''}>Homme</option>
              <option value="female" ${this._config.person2.gender === 'female' ? 'selected' : ''}>Femme</option>
            </select>
          </div>

          <div class="config-row">
            <label>Image (optionnel) :</label>
            <input 
              type="text" 
              id="person2-image" 
              value="${this._config.person2.background_image || ''}"
              placeholder="Ex: female-silhouette.png"
            />
          </div>

          <div class="sensor-list">
            <h4>Capteurs de santé</h4>
            <div id="person2-sensors">
              ${this.renderSensors(this._config.person2.sensors || [], 'person2')}
            </div>
            <button class="btn-add" onclick="window.healthDashboardEditor.addSensor('person2')">
              ➕ Ajouter un capteur
            </button>
          </div>
        </div>
      </div>
    `;

    // Stocker l'instance pour les callbacks
    window.healthDashboardEditor = this;

    // Ajouter les event listeners
    this.attachEventListeners();
  }

  renderSensors(sensors, person) {
    if (!sensors || sensors.length === 0) {
      return '<p style="color: #999; font-size: 13px;">Aucun capteur configuré</p>';
    }

    return sensors.map((sensor, index) => `
      <div class="sensor-item">
        <div class="sensor-item-header">
          <strong>Capteur ${index + 1}</strong>
          <button class="btn-remove" onclick="window.healthDashboardEditor.removeSensor('${person}', ${index})">
            🗑️ Supprimer
          </button>
        </div>
        <div class="sensor-item-fields">
          <div class="sensor-field">
            <label>Entité :</label>
            <input 
              type="text" 
              data-person="${person}" 
              data-index="${index}" 
              data-field="entity"
              value="${sensor.entity || ''}"
              placeholder="sensor.poids"
            />
          </div>
          <div class="sensor-field">
            <label>Nom :</label>
            <input 
              type="text" 
              data-person="${person}" 
              data-index="${index}" 
              data-field="name"
              value="${sensor.name || ''}"
              placeholder="Poids"
            />
          </div>
          <div class="sensor-field">
            <label>Icône :</label>
            <input 
              type="text" 
              data-person="${person}" 
              data-index="${index}" 
              data-field="icon"
              value="${sensor.icon || ''}"
              placeholder="⚖️"
            />
          </div>
        </div>
      </div>
    `).join('');
  }

  attachEventListeners() {
    // Listeners pour les champs de base
    const fields = ['name', 'gender', 'image'];
    const persons = ['person1', 'person2'];

    persons.forEach(person => {
      fields.forEach(field => {
        const element = this.querySelector(`#${person}-${field}`);
        if (element) {
          element.addEventListener('input', (e) => {
            this._config[person] = this._config[person] || {};
            if (field === 'image') {
              this._config[person].background_image = e.target.value;
            } else {
              this._config[person][field] = e.target.value;
            }
            this.configChanged(this._config);
          });
        }
      });
    });

    // Listeners pour les champs de capteurs
    const sensorInputs = this.querySelectorAll('[data-person][data-index][data-field]');
    sensorInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const person = e.target.dataset.person;
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;

        if (!this._config[person].sensors) {
          this._config[person].sensors = [];
        }
        if (!this._config[person].sensors[index]) {
          this._config[person].sensors[index] = {};
        }

        this._config[person].sensors[index][field] = e.target.value;
        this.configChanged(this._config);
      });
    });
  }

  addSensor(person) {
    if (!this._config[person].sensors) {
      this._config[person].sensors = [];
    }

    this._config[person].sensors.push({
      entity: '',
      name: '',
      icon: '📊'
    });

    this.configChanged(this._config);
    this.render();
  }

  removeSensor(person, index) {
    if (this._config[person].sensors) {
      this._config[person].sensors.splice(index, 1);
      this.configChanged(this._config);
      this.render();
    }
  }
}

customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
