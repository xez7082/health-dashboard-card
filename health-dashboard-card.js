// HEALTH DASHBOARD CARD – V3.2 STABLE (no rerender focus bug)

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
    this.updateValues();
  }

  render() {
    if (!this._config) return;

    const person = this._config[this.currentPerson];

    this.shadowRoot.innerHTML = `
      <style>
        .card { position: relative; height: 650px; border-radius: 20px; overflow: hidden; background: #111; }
        .bg { position: absolute; inset: 0; background: url('${person.image || ""}') center/contain no-repeat; opacity: 0.25; }
        .topbar { position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; }
        button { border: none; padding: 8px 14px; border-radius: 20px; cursor: pointer; color: white; font-weight: bold; }
        .male { background: #2196f3; }
        .female { background: #e91e63; }
        .active { outline: 2px solid white; }
        .sensor { position: absolute; background: white; padding: 6px 10px; border-radius: 12px; font-size: 12px; }
      </style>

      <div class="card">
        <div class="bg"></div>
        <div class="topbar">
          <button id="p1" class="male ${this.currentPerson === "person1" ? "active" : ""}">${this._config.person1.name}</button>
          <button id="p2" class="female ${this.currentPerson === "person2" ? "active" : ""}">${this._config.person2.name}</button>
        </div>

        ${(person.sensors || [])
          .map(
            (s, i) => `
          <div class="sensor" style="left:${s.x || 50}%; top:${s.y || 50}%" id="val-${i}">
            ${s.icon || "📊"} --
          </div>`
          )
          .join("")}
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

    this.updateValues();
  }

  updateValues() {
    if (!this._hass || !this._config) return;

    const sensors = this._config[this.currentPerson].sensors || [];

    sensors.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`val-${i}`);
      if (!el) return;
      const st = this._hass.states[s.entity];
      el.textContent = `${s.icon || "📊"} ${st ? st.state : "--"}`;
    });
  }
}

// ================= EDITOR =================

class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this.current = "person1";
    this.draw();
  }

  draw() {
    const p = this._config[this.current];

    this.innerHTML = `
      <style>
        .row { margin-bottom: 8px; }
        input { width: 100%; padding: 6px; }
        .sensor { border: 1px solid #ccc; padding: 8px; margin-top: 6px; }
        button { margin-top: 6px; }
      </style>

      <div class="row">
        <button id="tab1">${this._config.person1.name}</button>
        <button id="tab2">${this._config.person2.name}</button>
      </div>

      <div class="row">
        <input id="name" value="${p.name}" placeholder="Nom" />
      </div>

      <div id="sensors"></div>

      <button id="add">Ajouter capteur</button>
    `;

    this.querySelector("#tab1").onclick = () => {
      this.current = "person1";
      this.draw();
    };

    this.querySelector("#tab2").onclick = () => {
      this.current = "person2";
      this.draw();
    };

    this.querySelector("#name").oninput = (e) => {
      this._config[this.current].name = e.target.value;
      this.changed();
    };

    const box = this.querySelector("#sensors");
    box.innerHTML = "";

    (p.sensors || []).forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "sensor";
      div.innerHTML = `
        <input data-i="${i}" class="ent" value="${s.entity || ""}" placeholder="sensor.xxx" />
        <input data-i="${i}" class="icon" value="${s.icon || "📊"}" />
        X <input data-i="${i}" class="x" type="number" value="${s.x || 50}" />
        Y <input data-i="${i}" class="y" type="number" value="${s.y || 50}" />
        <button data-i="${i}" class="del">Supprimer</button>
      `;
      box.appendChild(div);
    });

    box.querySelectorAll(".ent").forEach((i) =>
      (i.oninput = (e) => {
        p.sensors[e.target.dataset.i].entity = e.target.value;
        this.changed();
      })
    );

    box.querySelectorAll(".icon").forEach((i) =>
      (i.oninput = (e) => {
        p.sensors[e.target.dataset.i].icon = e.target.value;
        this.changed();
      })
    );

    box.querySelectorAll(".x").forEach((i) =>
      (i.oninput = (e) => {
        p.sensors[e.target.dataset.i].x = Number(e.target.value);
        this.changed();
      })
    );

    box.querySelectorAll(".y").forEach((i) =>
      (i.oninput = (e) => {
        p.sensors[e.target.dataset.i].y = Number(e.target.value);
        this.changed();
      })
    );

    box.querySelectorAll(".del").forEach((b) =>
      (b.onclick = (e) => {
        p.sensors.splice(e.target.dataset.i, 1);
        this.changed();
        this.draw();
      })
    );

    this.querySelector("#add").onclick = () => {
      p.sensors.push({ entity: "", icon: "📊", x: 50, y: 50 });
      this.changed();
      this.draw();
    };
  }

  changed() {
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: this._config } })
    );
  }
}

customElements.define("health-dashboard-card", HealthDashboardCard);
customElements.define("health-dashboard-card-editor", HealthDashboardCardEditor);
