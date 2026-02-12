// HEALTH DASHBOARD CARD – VERSION CORRIGÉE ET AMÉLIORÉE

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this.currentPerson = "person1";
  }

  static getConfigElement() {
    return document.createElement("health-dashboard-card-editor");
  }

  static getStubConfig() {
    return {
      person1: { 
        name: "Homme", 
        gender: "male", 
        image: "/local/health-dashboard/male-silhouette.png", 
        sensors: [
          { entity: "sensor.time", name: "Heure", icon: "⏰", x: 70, y: 20 }
        ] 
      },
      person2: { 
        name: "Femme", 
        gender: "female", 
        image: "/local/health-dashboard/female-silhouette.png", 
        sensors: [
          { entity: "sensor.date", name: "Date", icon: "📅", x: 70, y: 20 }
        ] 
      },
    };
  }

  setConfig(config) {
    if (!config.person1 || !config.person2) {
      throw new Error("Configuration invalide : person1 et person2 requis");
    }
    
    // Initialiser les sensors si manquants
    if (!config.person1.sensors) config.person1.sensors = [];
    if (!config.person2.sensors) config.person2.sensors = [];
    
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  getCardSize() {
    return 7;
  }

  updateSensors() {
    if (!this._hass || !this._config) return;

    const person = this._config[this.currentPerson];
    
    if (!person || !person.sensors) return;

    person.sensors.forEach((s, i) => {
      const el = this.shadowRoot.querySelector(`#value-${i}`);
      if (!el) return;
      
      const state = this._hass.states[s.entity];
      if (state) {
        const unit = state.attributes.unit_of_measurement || "";
        el.textContent = `${state.state} ${unit}`.trim();
      } else {
        el.textContent = "N/A";
      }
    });
  }

  render() {
    if (!this._config) return;

    const person = this._config[this.currentPerson];
    const defaultImage = person.gender === "female" 
      ? "/local/health-dashboard/female-silhouette.png"
      : "/local/health-dashboard/male-silhouette.png";
    
    const imageUrl = person.image || defaultImage;

    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
        }

        .card {
          position: relative;
          width: 100%;
          height: 650px;
          overflow: hidden;
          border-radius: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .bg {
          position: absolute;
          inset: 0;
          background-image: url('${imageUrl}');
          background-position: left center;
          background-size: contain;
          background-repeat: no-repeat;
          opacity: 0.3;
          pointer-events: none;
        }

        .topbar {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 12px;
          z-index: 10;
        }

        .btn-person {
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          cursor: pointer;
          color: white;
          font-weight: bold;
          font-size: 14px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .btn-person:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }

        .male { 
          background: linear-gradient(135deg, #2196f3, #1976d2);
        }
        
        .female { 
          background: linear-gradient(135deg, #e91e63, #c2185b);
        }
        
        .active { 
          outline: 3px solid white;
          outline-offset: 2px;
        }

        .person-name {
          position: absolute;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 32px;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.95);
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
          z-index: 5;
        }

        .sensors-container {
          position: absolute;
          right: 20px;
          top: 120px;
          bottom: 20px;
          width: 55%;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          overflow-y: auto;
          padding: 10px;
        }

        .sensor-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: move;
          min-height: 120px;
          justify-content: center;
        }

        .sensor-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .sensor-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .sensor-name {
          font-size: 12px;
          color: #666;
          margin-bottom: 6px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sensor-value {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }

        .edit-mode-hint {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          display: none;
        }

        @media (max-width: 768px) {
          .sensors-container {
            width: 100%;
            right: 0;
            top: 140px;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }
          
          .person-name {
            font-size: 24px;
            top: 60px;
          }
        }
      </style>

      <div class="card">
        <div class="bg"></div>

        <div class="topbar">
          <button id="p1" class="btn-person male ${this.currentPerson === "person1" ? "active" : ""}">
            ${this._config.person1.name}
          </button>
          <button id="p2" class="btn-person female ${this.currentPerson === "person2" ? "active" : ""}">
            ${this._config.person2.name}
          </button>
        </div>

        <div class="person-name">${person.name}</div>

        <div class="sensors-container">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-card" data-index="${i}">
              <div class="sensor-icon">${s.icon || "📊"}</div>
              <div class="sensor-name">${s.name || s.entity}</div>
              <div class="sensor-value" id="value-${i}">--</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Event listeners pour les boutons
    this.shadowRoot.getElementById("p1").onclick = () => {
      this.currentPerson = "person1";
      this.render();
    };

    this.shadowRoot.getElementById("p2").onclick = () => {
      this.currentPerson = "person2";
      this.render();
    };

    this.updateSensors();
  }
}

// ============================================================================
// ÉDITEUR VISUEL COMPLET
// ============================================================================

class HealthDashboardCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this.currentTab = "person1";
  }

  set hass(hass) { 
    this._hass = hass;
  }

  setConfig(config) {
    // Initialiser la config si nécessaire
    this._config = {
      person1: config.person1 || { name: "Homme", gender: "male", image: "", sensors: [] },
      person2: config.person2 || { name: "Femme", gender: "female", image: "", sensors: [] }
    };
    
    this.render();
  }

  configChanged() {
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this._config) return;

    const person = this._config[this.currentTab];

    this.innerHTML = `
      <style>
        .editor {
          padding: 16px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 8px;
        }

        .tab-btn {
          padding: 10px 20px;
          border: none;
          background: #f5f5f5;
          cursor: pointer;
          border-radius: 8px 8px 0 0;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: #e0e0e0;
        }

        .tab-btn.active {
          background: #667eea;
          color: white;
        }

        .section {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 12px;
          color: #333;
        }

        .field {
          margin-bottom: 12px;
        }

        .field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 4px;
          color: #555;
        }

        .field input,
        .field select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .field input:focus,
        .field select:focus {
          outline: none;
          border-color: #667eea;
        }

        .sensor-list {
          margin-top: 12px;
        }

        .sensor-item {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
          position: relative;
        }

        .sensor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .sensor-number {
          font-weight: bold;
          color: #667eea;
        }

        .btn-remove {
          background: #ff5252;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .btn-remove:hover {
          background: #ff1744;
        }

        .btn-add {
          width: 100%;
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          margin-top: 8px;
        }

        .btn-add:hover {
          background: #5568d3;
        }

        .info-box {
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 12px;
          margin-bottom: 16px;
          border-radius: 4px;
          font-size: 13px;
        }

        .entity-picker {
          position: relative;
        }

        .entity-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-top: none;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          display: none;
        }

        .entity-suggestions.show {
          display: block;
        }

        .entity-suggestion {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
        }

        .entity-suggestion:hover {
          background: #f5f5f5;
        }

        .preview {
          background: #f0f0f0;
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          color: #666;
          font-size: 13px;
        }
      </style>

      <div class="editor">
        <div class="info-box">
          💡 <strong>Astuce :</strong> Configurez les informations et capteurs pour chaque personne. Les capteurs s'afficheront dans une grille sur le côté droit de la carte.
        </div>

        <div class="tabs">
          <button class="tab-btn ${this.currentTab === "person1" ? "active" : ""}" id="tab-person1">
            👤 ${this._config.person1.name}
          </button>
          <button class="tab-btn ${this.currentTab === "person2" ? "active" : ""}" id="tab-person2">
            👤 ${this._config.person2.name}
          </button>
        </div>

        <div class="section">
          <div class="section-title">Informations de base</div>
          
          <div class="field">
            <label>Prénom</label>
            <input 
              type="text" 
              id="name" 
              value="${person.name || ""}"
              placeholder="Ex: Jean, Marie"
            />
          </div>

          <div class="field">
            <label>Genre</label>
            <select id="gender">
              <option value="male" ${person.gender === "male" ? "selected" : ""}>Homme</option>
              <option value="female" ${person.gender === "female" ? "selected" : ""}>Femme</option>
            </select>
          </div>

          <div class="field">
            <label>Image de fond (optionnel)</label>
            <input 
              type="text" 
              id="image" 
              value="${person.image || ""}"
              placeholder="/local/health-dashboard/silhouette.png"
            />
            <small style="color: #666; font-size: 11px; display: block; margin-top: 4px;">
              Laissez vide pour utiliser l'image par défaut
            </small>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Capteurs de santé</div>
          
          <div class="sensor-list" id="sensor-list">
            ${this.renderSensors(person.sensors || [])}
          </div>

          <button class="btn-add" id="add-sensor">
            ➕ Ajouter un capteur
          </button>
        </div>

        <div class="preview">
          ${person.sensors?.length || 0} capteur(s) configuré(s)
        </div>
      </div>
    `;

    this.attachListeners();
  }

  renderSensors(sensors) {
    if (!sensors || sensors.length === 0) {
      return '<p style="color: #999; font-size: 13px; margin: 0;">Aucun capteur configuré</p>';
    }

    return sensors.map((sensor, index) => `
      <div class="sensor-item" data-index="${index}">
        <div class="sensor-header">
          <span class="sensor-number">Capteur ${index + 1}</span>
          <button class="btn-remove" data-index="${index}">🗑️ Supprimer</button>
        </div>
        
        <div class="field">
          <label>Entité Home Assistant</label>
          <input 
            type="text" 
            class="sensor-entity" 
            data-index="${index}"
            value="${sensor.entity || ""}"
            placeholder="sensor.poids"
          />
        </div>

        <div class="field">
          <label>Nom affiché</label>
          <input 
            type="text" 
            class="sensor-name" 
            data-index="${index}"
            value="${sensor.name || ""}"
            placeholder="Poids"
          />
        </div>

        <div class="field">
          <label>Icône (emoji)</label>
          <input 
            type="text" 
            class="sensor-icon" 
            data-index="${index}"
            value="${sensor.icon || ""}"
            placeholder="⚖️"
            maxlength="4"
          />
        </div>
      </div>
    `).join("");
  }

  attachListeners() {
    // Tabs
    const tab1 = this.querySelector("#tab-person1");
    const tab2 = this.querySelector("#tab-person2");
    
    if (tab1) tab1.onclick = () => { this.currentTab = "person1"; this.render(); };
    if (tab2) tab2.onclick = () => { this.currentTab = "person2"; this.render(); };

    // Champs de base
    const nameInput = this.querySelector("#name");
    const genderSelect = this.querySelector("#gender");
    const imageInput = this.querySelector("#image");

    if (nameInput) {
      nameInput.oninput = (e) => {
        this._config[this.currentTab].name = e.target.value;
        this.configChanged();
      };
    }

    if (genderSelect) {
      genderSelect.onchange = (e) => {
        this._config[this.currentTab].gender = e.target.value;
        this.configChanged();
      };
    }

    if (imageInput) {
      imageInput.oninput = (e) => {
        this._config[this.currentTab].image = e.target.value;
        this.configChanged();
      };
    }

    // Bouton ajouter capteur
    const addBtn = this.querySelector("#add-sensor");
    if (addBtn) {
      addBtn.onclick = () => {
        if (!this._config[this.currentTab].sensors) {
          this._config[this.currentTab].sensors = [];
        }
        
        this._config[this.currentTab].sensors.push({
          entity: "",
          name: "",
          icon: "📊"
        });
        
        this.configChanged();
        this.render();
      };
    }

    // Boutons supprimer
    const removeButtons = this.querySelectorAll(".btn-remove");
    removeButtons.forEach(btn => {
      btn.onclick = () => {
        const index = parseInt(btn.dataset.index);
        this._config[this.currentTab].sensors.splice(index, 1);
        this.configChanged();
        this.render();
      };
    });

    // Champs des capteurs
    const entityInputs = this.querySelectorAll(".sensor-entity");
    const nameInputs = this.querySelectorAll(".sensor-name");
    const iconInputs = this.querySelectorAll(".sensor-icon");

    entityInputs.forEach(input => {
      input.oninput = (e) => {
        const index = parseInt(e.target.dataset.index);
        this._config[this.currentTab].sensors[index].entity = e.target.value;
        this.configChanged();
      };
    });

    nameInputs.forEach(input => {
      input.oninput = (e) => {
        const index = parseInt(e.target.dataset.index);
        this._config[this.currentTab].sensors[index].name = e.target.value;
        this.configChanged();
      };
    });

    iconInputs.forEach(input => {
      input.oninput = (e) => {
        const index = parseInt(e.target.dataset.index);
        this._config[this.currentTab].sensors[index].icon = e.target.value;
        this.configChanged();
      };
    });
  }
}

// Enregistrer les custom elements
customElements.define("health-dashboard-card", HealthDashboardCard);
customElements.define("health-dashboard-card-editor", HealthDashboardCardEditor);

// Ajouter à la liste des cartes personnalisées
window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard Card",
  description: "Carte de suivi de santé pour deux personnes avec silhouettes et capteurs",
  preview: true,
});

console.info(
  "%c HEALTH-DASHBOARD-CARD %c v2.0.0 ",
  "color: white; background: #667eea; font-weight: bold;",
  "color: #667eea; background: white; font-weight: bold;"
);
