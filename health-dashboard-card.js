// HEALTH DASHBOARD CARD – V9 RESTORE DISPLAY
// Fix écran noir + restore image + sensors + editor controls

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
      type: "custom:health-dashboard-card",
      person1: { name: "Homme", gender: "male", image: "/local/health-dashboard/homme.png", sensors: [] },
      person2: { name: "Femme", gender: "female", image: "/local/health-dashboard/femme.png", sensors: [] },
    };
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this._config) return;

    const person = this._config[this.currentPerson];

    person.sensors?.forEach((s, i) => {
      const el = this.shadowRoot.querySelector(`#value-${i}`);
      const state = this._hass.states?.[s.entity];
      if (el && state) {
        const unit = state.attributes.unit_of_measurement || "";
        el.textContent = `${state.state} ${unit}`.trim();
      }
    });
  }

  render() {
    if (!this._config) return;

    const person = this._config[this.currentPerson];

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }

        .card {
          position:relative;
          width:100%;
          height:650px;
          overflow:hidden;
          border-radius:20px;
          background:#000;
        }

        .bg {
          position:absolute;
          inset:0;
          background:url('${person.image}') center/contain no-repeat;
        }

        .topbar {
          position:absolute;
          top:10px;
          left:10px;
          display:flex;
          gap:10px;
          z-index:5;
        }

        button {
          border:none;
          padding:8px 14px;
          border-radius:12px;
          cursor:pointer;
          color:white;
          font-weight:bold;
        }

        .male { background:#2196f3; }
        .female { background:#e91e63; }
        .active { outline:3px solid white; }

        .sensor {
          position:absolute;
          transform:translate(-50%, -50%);
          color:white;
          font-weight:bold;
          text-shadow:0 0 6px black;
          cursor:grab;
        }
      </style>

      <div class="card">
        <div class="bg"></div>

        <div class="topbar">
          <button id="p1" class="male ${this.currentPerson === "person1" ? "active" : ""}">${this._config.person1.name}</button>
          <button id="p2" class="female ${this.currentPerson === "person2" ? "active" : ""}">${this._config.person2.name}</button>
        </div>

        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x || 50}%; top:${s.y || 50}%">
            <div>${s.name || s.entity}</div>
            <div id="value-${i}">--</div>
          </div>
        `).join("")}
      </div>
    `;

    this.shadowRoot.getElementById("p1").onclick = () => { this.currentPerson = "person1"; this.render(); };
    this.shadowRoot.getElementById("p2").onclick = () => { this.currentPerson = "person2"; this.render(); };

    this.updateSensors();
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }

  setConfig(config) {
    this._config = config;
    if (!this.tab) this.tab = "person1";
    this.render();
  }

  render() {
    if (!this._config) return;

    const p = this._config[this.tab];

    this.innerHTML = `
      <style>
        .tabs { display:flex; gap:10px; margin-bottom:10px; }
        .preview {
          width:100%;
          height:400px;
          background:url('${p.image}') center/contain no-repeat;
          background-color:black;
          border:1px solid #ccc;
          margin-bottom:10px;
        }
      </style>

      <div class="tabs">
        <button id="t1">Homme</button>
        <button id="t2">Femme</button>
      </div>

      <input id="image" value="${p.image}" placeholder="/local/image.png" />

      <div class="preview"></div>

      <button id="add">+ capteur</button>
    `;

    this.querySelector("#t1").onclick = () => { this.tab = "person1"; this.render(); };
    this.querySelector("#t2").onclick = () => { this.tab = "person2"; this.render(); };

    this.querySelector("#image").onchange = (e) => {
      this._config[this.tab].image = e.target.value;
      this.save();
    };

    this.querySelector("#add").onclick = () => {
      this._config[this.tab].sensors.push({ entity: "sensor.test", x: 50, y: 50 });
      this.save();
    };
  }

  save() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
  }
}

customElements.define("health-dashboard-card", HealthDashboardCard);
customElements.define("health-dashboard-card-editor", HealthDashboardCardEditor);
