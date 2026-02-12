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
      person1: {
        name: "Homme",
        gender: "male",
        image: "/local/health-dashboard/male-silhouette.png",
        sensors: [{ entity: "sensor.time", name: "Heure", icon: "⏰" }],
      },
      person2: {
        name: "Femme",
        gender: "female",
        image: "/local/health-dashboard/female-silhouette.png",
        sensors: [{ entity: "sensor.date", name: "Date", icon: "📅" }],
      },
    };
  }

  setConfig(config) {
    if (!config.person1 || !config.person2) {
      throw new Error("person1 et person2 requis");
    }

    config.person1.sensors ||= [];
    config.person2.sensors ||= [];

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

    person.sensors.forEach((s, i) => {
      const el = this.shadowRoot.querySelector(`#value-${i}`);
      if (!el) return;

      const state = this._hass.states[s.entity];
      el.textContent = state
        ? `${state.state} ${state.attributes.unit_of_measurement || ""}`.trim()
        : "N/A";
    });
  }

  render() {
    if (!this._config) return;

    const person = this._config[this.currentPerson];
    const imageUrl =
      person.image ||
      (person.gender === "female"
        ? "/local/health-dashboard/female-silhouette.png"
        : "/local/health-dashboard/male-silhouette.png");

    this.shadowRoot.innerHTML = `
      <style>
        .card {
          position: relative;
          height: 650px;
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(135deg,#667eea,#764ba2);
        }

        .bg {
          position: absolute;
          inset: 0;
          background: url('${imageUrl}') center/contain no-repeat;
          opacity: 0.6;
        }

        .topbar {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 12px;
          z-index: 10;
        }

        button {
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          color: white;
          font-weight: bold;
          cursor: pointer;
        }

        .male { background:#2196f3; }
        .female { background:#e91e63; }
        .active { outline:3px solid white; }

        .person-name {
          position:absolute;
          top:70px;
          left:50%;
          transform:translateX(-50%);
          font-size:28px;
          color:white;
          font-weight:bold;
        }

        .grid {
          position:absolute;
          right:20px;
          top:120px;
          width:55%;
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(140px,1fr));
          gap:12px;
        }

        .sensor {
          background:white;
          border-radius:14px;
          padding:12px;
          text-align:center;
        }

        .icon { font-size:28px; }
        .value { font-weight:bold; }
      </style>

      <div class="card">
        <div class="bg"></div>

        <div class="topbar">
          <button id="p1" class="male ${
            this.currentPerson === "person1" ? "active" : ""
          }">${this._config.person1.name}</button>
          <button id="p2" class="female ${
            this.currentPerson === "person2" ? "active" : ""
          }">${this._config.person2.name}</button>
        </div>

        <div class="person-name">${person.name}</div>

        <div class="grid">
          ${person.sensors
            .map(
              (s, i) => `
            <div class="sensor">
              <div class="icon">${s.icon || "📊"}</div>
              <div>${s.name || s.entity}</div>
              <div class="value" id="value-${i}">--</div>
            </div>`
            )
            .join("")}
        </div>
      </div>
    `;

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

/* ================= ÉDITEUR ================= */

class HealthDashboardCardEditor extends HTMLElement {
  constructor() {
    super();
    this.currentTab = "person1";
  }

  setConfig(config) {
    this._config = {
      type: "custom:health-dashboard-card",
      person1: config.person1,
      person2: config.person2,
    };
    this.render();
  }

  configChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const p = this._config[this.currentTab];

    this.innerHTML = `
      <div>
        <button id="t1">Homme</button>
        <button id="t2">Femme</button>

        <input id="name" value="${p.name || ""}" placeholder="Nom" />
        <input id="image" value="${p.image || ""}" placeholder="/local/img.png" />

        <button id="add">+ capteur</button>
      </div>
    `;

    this.querySelector("#t1").onclick = () => {
      this.currentTab = "person1";
      this.render();
    };

    this.querySelector("#t2").onclick = () => {
      this.currentTab = "person2";
      this.render();
    };

    this.querySelector("#name").oninput = (e) => {
      this._config[this.currentTab].name = e.target.value;
      this.configChanged();
    };

    this.querySelector("#image").oninput = (e) => {
      this._config[this.currentTab].image = e.target.value;
      this.configChanged();
    };

    this.querySelector("#add").onclick = () => {
      this._config[this.currentTab].sensors.push({
        entity: "",
        name: "",
        icon: "📊",
      });
      this.configChanged();
      this.render();
    };
  }
}

customElements.define("health-dashboard-card", HealthDashboardCard);
customElements.define("health-dashboard-card-editor", HealthDashboardCardEditor);
