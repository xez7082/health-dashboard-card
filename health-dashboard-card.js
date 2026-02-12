class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this.currentPerson = "person1";
    this.sensorEls = [];
  }

  static getConfigElement() {
    return document.createElement("health-dashboard-card-editor");
  }

  static getStubConfig() {
    return {
      person1: { name: "Homme", gender: "male", background: "", sensors: [] },
      person2: { name: "Femme", gender: "female", background: "", sensors: [] },
    };
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateValues();
  }

  getCardSize() {
    return 6;
  }

  updateValues() {
    if (!this._hass || !this._config) return;
    const p = this._config[this.currentPerson];

    p.sensors.forEach((s, i) => {
      const st = this._hass.states[s.entity];
      if (!st || !this.sensorEls[i]) return;

      const unit = st.attributes.unit_of_measurement || "";
      this.sensorEls[i].querySelector(".val").textContent =
        st.state + " " + unit;
    });
  }

  toggle(p) {
    this.currentPerson = p;
    this.render();
  }

  render() {
    if (!this._config) return;

    const p = this._config[this.currentPerson];
    const bg =
      p.background ||
      (p.gender === "female"
        ? "/local/health-dashboard/femme.png"
        : "/local/health-dashboard/homme.png");

    this.shadowRoot.innerHTML = `
      <style>
        ha-card{height:600px;position:relative;overflow:hidden}
        .bg{position:absolute;inset:0;background:url('${bg}') center/cover no-repeat}
        .top{position:absolute;top:10px;left:10px;z-index:2;display:flex;gap:10px}
        button{border:0;padding:8px 14px;border-radius:20px;color:#fff;font-weight:bold;cursor:pointer}
        .sensor{
          position:absolute;
          background:rgba(0,0,0,.35);
          color:#fff;
          padding:6px 10px;
          border-radius:10px;
          cursor:grab;
          user-select:none;
          font-size:14px;
          text-align:center;
        }
        .val{font-weight:bold}
      </style>

      <ha-card>
        <div class="bg" id="bg"></div>

        <div class="top">
          <button id="b1">${this._config.person1.name}</button>
          <button id="b2">${this._config.person2.name}</button>
        </div>
      </ha-card>
    `;

    const b1 = this.shadowRoot.getElementById("b1");
    const b2 = this.shadowRoot.getElementById("b2");

    b1.style.background =
      this._config.person1.gender === "female" ? "red" : "blue";
    b2.style.background =
      this._config.person2.gender === "female" ? "red" : "blue";

    b1.onclick = () => this.toggle("person1");
    b2.onclick = () => this.toggle("person2");

    this.drawSensors();
    this.updateValues();
  }

  drawSensors() {
    const p = this._config[this.currentPerson];
    const bg = this.shadowRoot.getElementById("bg");

    bg.querySelectorAll(".sensor").forEach((e) => e.remove());
    this.sensorEls = [];

    p.sensors.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "sensor";
      d.style.left = (s.x ?? 40) + "px";
      d.style.top = (s.y ?? 40) + "px";
      d.innerHTML = `<div>${s.name || s.entity}</div><div class="val">--</div>`;

      d.onmousedown = (e) => {
        const rect = bg.getBoundingClientRect();
        const ox = e.offsetX;
        const oy = e.offsetY;

        const move = (ev) => {
          let x = ev.clientX - rect.left - ox;
          let y = ev.clientY - rect.top - oy;
          d.style.left = Math.max(0, x) + "px";
          d.style.top = Math.max(0, y) + "px";
        };

        const up = () => {
          s.x = parseInt(d.style.left);
          s.y = parseInt(d.style.top);
          document.removeEventListener("mousemove", move);
          document.removeEventListener("mouseup", up);
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
      };

      bg.appendChild(d);
      this.sensorEls.push(d);
    });
  }
}

/* ======================= ÉDITEUR ======================= */

class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = config;

    // garder l'onglet actif
    if (!this.tab) this.tab = "person1";

    this.render();
  }

  sensorsList(filter = "") {
    return Object.keys(this._hass.states).filter(
      (e) => e.startsWith("sensor.") && e.toLowerCase().includes(filter)
    );
  }

  render() {
    if (!this._config) return;

    const p = this._config[this.tab];
    const sensors = p.sensors || [];

    this.innerHTML = `
      <style>
        .tabs{display:flex;gap:10px;margin-bottom:10px}
        button{cursor:pointer}
        input,select{width:100%;margin:4px 0;padding:4px}
        .sensorRow{border:1px solid #ccc;padding:6px;margin-bottom:6px}
        .xy{display:flex;gap:6px}
      </style>

      <div class="tabs">
        <button id="t1">Homme</button>
        <button id="t2">Femme</button>
      </div>

      <h3>Paramètres</h3>
      <input id="name" value="${p.name}">
      <input id="bg" placeholder="Image de fond" value="${p.background || ""}">

      <h3>Capteurs</h3>
      <input id="search" placeholder="Recherche capteur">

      <div id="list">
        ${sensors
          .map(
            (s, i) => `
          <div class="sensorRow">
            <input data-i="${i}" class="sName" value="${s.name || ""}" placeholder="Nom affiché">
            <select data-i="${i}" class="sEntity">
              ${this.sensorsList()
                .map(
                  (e) =>
                    `<option value="${e}" ${
                      e === s.entity ? "selected" : ""
                    }>${e}</option>`
                )
                .join("")}
            </select>

            <div class="xy">
              <input type="number" data-i="${i}" class="sx" value="${s.x || 40}" placeholder="X">
              <input type="number" data-i="${i}" class="sy" value="${s.y || 40}" placeholder="Y">
            </div>

            <button data-del="${i}">Supprimer</button>
          </div>
        `
          )
          .join("")}
      </div>

      <button id="add">+ Ajouter capteur</button>
    `;

    this.querySelector("#t1").onclick = () => {
      this.tab = "person1";
      this.render();
    };
    this.querySelector("#t2").onclick = () => {
      this.tab = "person2";
      this.render();
    };

    this.querySelector("#add").onclick = () => {
      p.sensors.push({ entity: this.sensorsList()[0], x: 40, y: 40 });
      this.save();
      this.render();
    };

    this.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = () => {
        p.sensors.splice(b.dataset.del, 1);
        this.save();
        this.render();
      };
    });

    this.querySelectorAll("input,select").forEach((el) => {
      el.onchange = () => this.save();
    });
  }

  save() {
    const p = this._config[this.tab];
    const rows = this.querySelectorAll(".sensorRow");

    p.name = this.querySelector("#name").value;
    p.background = this.querySelector("#bg").value;

    rows.forEach((r, i) => {
      p.sensors[i].name = r.querySelector(".sName").value;
      p.sensors[i].entity = r.querySelector(".sEntity").value;
      p.sensors[i].x = parseInt(r.querySelector(".sx").value);
      p.sensors[i].y = parseInt(r.querySelector(".sy").value);
    });

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: { type: "custom:health-dashboard-card", ...this._config } },
      })
    );
  }
}

customElements.define("health-dashboard-card", HealthDashboardCard);
customElements.define("health-dashboard-card-editor", HealthDashboardCardEditor);
