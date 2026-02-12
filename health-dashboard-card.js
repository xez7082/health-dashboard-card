// HEALTH DASHBOARD CARD – V8 FIX FEMME + IMAGE FULL

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
      person1: { name: "Homme", gender: "male", image: "", sensors: [] },
      person2: { name: "Femme", gender: "female", image: "", sensors: [] },
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
      const state = this._hass.states[s.entity];
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
        }

        .bg {
          position:absolute;
          inset:0;
          background:url('${person.image || "/local/health-dashboard/default.png"}') center/contain no-repeat;
          background-size:contain; /* image entière visible */
          background-color:black;
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
    const person = this._config[this.currentPerson];

    person.sensors?.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      if (!el) return;

      el.onmousedown = (e) => {
        e.preventDefault();

        const move = (ev) => {
          const rect = this.shadowRoot.querySelector(".card").getBoundingClientRect();

          const x = ((ev.clientX - rect.left) / rect.width) * 100;
          const y = ((ev.clientY - rect.top) / rect.height) * 100;

          s.x = Math.max(0, Math.min(100, x));
          s.y = Math.max(0, Math.min(100, y));

          el.style.left = s.x + "%";
          el.style.top = s.y + "%";
        };

        const up = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseup", up);
        };

        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
      };
    });
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
        .tabs button { padding:6px 12px; cursor:pointer; }

        .preview {
          position:relative;
          width:100%;
          height:500px;
          background:url('${p.image || "/local/health-dashboard/default.png"}') center/contain no-repeat;
          background-color:black;
          border:1px solid #ccc;
          margin-bottom:10px;
        }

        .dot {
          position:absolute;
          transform:translate(-50%, -50%);
          background:red;
          color:white;
          padding:2px 6px;
          font-size:12px;
        }
      </style>

      <div class="tabs">
        <button id="t1">Homme</button>
        <button id="t2">Femme</button>
      </div>

      <input id="image" placeholder="/local/image.png" value="${p.image || ""}" />

      <div class="preview">
        ${(p.sensors || []).map((s, i) => `
          <div class="dot" style="left:${s.x || 50}%; top:${s.y || 50}%">${i+1}</div>
        `).join("")}
      </div>

      <button id="add">+ capteur</button>
    `;

    this.querySelector("#t1").onclick = () => { this.tab = "person1"; this.render(); };
    this.querySelector("#t2").onclick = () => { this.tab = "person2"; this.render(); };

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
