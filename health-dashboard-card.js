class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this.currentPerson = "person1";
    this.dragIndex = null;
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
        sensors: []
      },
      person2: {
        name: "Femme",
        gender: "female",
        image: "/local/health-dashboard/female-silhouette.png",
        sensors: []
      }
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
    if (!this._hass) return;

    const person = this._config[this.currentPerson];
    person.sensors.forEach((s, i) => {
      const el = this.shadowRoot.querySelector(`#value-${i}`);
      if (!el) return;

      const state = this._hass.states[s.entity];
      el.textContent = state
        ? `${state.state} ${state.attributes.unit_of_measurement || ""}`
        : "N/A";
    });
  }

  render() {
    if (!this._config) return;

    const person = this._config[this.currentPerson];

    this.shadowRoot.innerHTML = `
      <style>
        .card {
          position: relative;
          height: 650px;
          border-radius: 20px;
          overflow: hidden;
          background: #000;
        }

        .body {
          position: absolute;
          inset: 0;
          background: url("${person.image}") center/contain no-repeat;
        }

        .sensor {
          position: absolute;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 12px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: bold;
          cursor: move;
          box-shadow: 0 2px 6px rgba(0,0,0,.3);
          user-select: none;
        }

        .topbar {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
        }

        button {
          margin-left: 6px;
          padding: 8px 14px;
          border: none;
          border-radius: 20px;
          color: white;
          font-weight: bold;
          cursor: pointer;
        }

        .male { background:#2196f3; }
        .female { background:#e91e63; }
      </style>

      <div class="card">
        <div class="body" id="body"></div>

        <div class="topbar">
          <button class="male" id="p1">${this._config.person1.name}</button>
          <button class="female" id="p2">${this._config.person2.name}</button>
        </div>

        ${(person.sensors || []).map((s, i) => `
          <div 
            class="sensor" 
            data-index="${i}"
            style="left:${s.x || 50}%; top:${s.y || 50}%"
          >
            ${s.icon || "📊"} 
            <span id="value-${i}">--</span>
          </div>
        `).join("")}
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

    this.enableDrag();
    this.updateSensors();
  }

  enableDrag() {
    const sensors = this.shadowRoot.querySelectorAll(".sensor");
    const body = this.shadowRoot.getElementById("body");

    sensors.forEach(el => {
      el.onmousedown = e => {
        this.dragIndex = Number(el.dataset.index);

        const move = ev => {
          const rect = body.getBoundingClientRect();
          const x = ((ev.clientX - rect.left) / rect.width) * 100;
          const y = ((ev.clientY - rect.top) / rect.height) * 100;

          const person = this._config[this.currentPerson];
          person.sensors[this.dragIndex].x = Math.max(0, Math.min(100, x));
          person.sensors[this.dragIndex].y = Math.max(0, Math.min(100, y));

          this.render();
        };

        document.onmousemove = move;
        document.onmouseup = () => {
          document.onmousemove = null;
          document.onmouseup = null;

          this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: this._config },
            bubbles: true,
            composed: true
          }));
        };
      };
    });
  }
}

/* ================== ÉDITEUR SIMPLE ================== */

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.render();
  }

  configChanged() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this._config) return;

    this.innerHTML = `
      <style>
        .btn { margin-top:10px; padding:10px; width:100%; }
      </style>

      <h3>Ajouter capteur Homme</h3>
      <button class="btn" id="add1">+ capteur</button>

      <h3>Ajouter capteur Femme</h3>
      <button class="btn" id="add2">+ capteur</button>
    `;

    this.querySelector("#add1").onclick = () => {
      this._config.person1.sensors.push({ entity:"", icon:"📊", x:50, y:50 });
      this.configChanged();
    };

    this.querySelector("#add2").onclick = () => {
      this._config.person2.sensors.push({ entity:"", icon:"📊", x:50, y:50 });
      this.configChanged();
    };
  }
}

customElements.define("health-dashboard-card", HealthDashboardCard);
customElements.define("health-dashboard-card-editor", HealthDashboardCardEditor);
