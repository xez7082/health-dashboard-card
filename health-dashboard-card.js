class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
    this.sensorElements = [];
  }

  static getConfigElement() {
    return document.createElement('health-dashboard-card-editor');
  }

  static getStubConfig() {
    return {
      person1: { name: 'Personne 1', gender: 'male', background: '', sensors: [] },
      person2: { name: 'Personne 2', gender: 'female', background: '', sensors: [] },
    };
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensorValues();
  }

  getCardSize() { return 6; }

  updateSensorValues() {
    if (!this._config || !this._hass) return;
    const person = this._config[this.currentPerson];

    person.sensors.forEach((sensor, i) => {
      const state = this._hass.states[sensor.entity];
      const el = this.sensorElements[i];
      if (el && state) {
        const unit = state.attributes.unit_of_measurement || '';
        el.querySelector('.value').textContent = `${state.state} ${unit}`.trim();
      }
    });
  }

  togglePerson(p) {
    this.currentPerson = p;
    this.render();
  }

  render() {
    if (!this._config) return;

    const person = this._config[this.currentPerson];
    const bg = person.background || (person.gender === 'female'
      ? '/local/health-dashboard/femme.png'
      : '/local/health-dashboard/homme.png');

    this.shadowRoot.innerHTML = `
      <style>
        ha-card { height:600px; position:relative; overflow:hidden; }
        .bg { position:absolute; inset:0; background:url('${bg}') center/cover no-repeat; }
        .header { position:absolute; top:10px; left:10px; z-index:2; display:flex; gap:10px; }
        button { border:none; padding:10px 16px; border-radius:20px; color:#fff; font-weight:bold; cursor:pointer; }
        .sensor {
          position:absolute;
          background:rgba(0,0,0,0.35);
          color:#fff;
          padding:6px 10px;
          border-radius:10px;
          cursor:grab;
          user-select:none;
          text-align:center;
        }
        .value { font-weight:bold; }
      </style>

      <ha-card>
        <div class="bg" id="bg"></div>

        <div class="header">
          <button id="p1">${this._config.person1.name}</button>
          <button id="p2">${this._config.person2.name}</button>
        </div>
      </ha-card>
    `;

    const btn1 = this.shadowRoot.getElementById('p1');
    const btn2 = this.shadowRoot.getElementById('p2');

    btn1.style.background = this._config.person1.gender === 'female' ? 'red' : 'blue';
    btn2.style.background = this._config.person2.gender === 'female' ? 'red' : 'blue';

    btn1.onclick = () => this.togglePerson('person1');
    btn2.onclick = () => this.togglePerson('person2');

    this.renderSensors();
    this.updateSensorValues();
  }

  renderSensors() {
    const person = this._config[this.currentPerson];
    const bg = this.shadowRoot.getElementById('bg');

    bg.querySelectorAll('.sensor').forEach(e => e.remove());
    this.sensorElements = [];

    person.sensors.forEach((s, i) => {
      const div = document.createElement('div');
      div.className = 'sensor';
      div.style.left = (s.x ?? 50) + 'px';
      div.style.top = (s.y ?? 50) + 'px';
      div.innerHTML = `<div>${s.name || s.entity}</div><div class="value">--</div>`;

      div.onmousedown = e => {
        const rect = bg.getBoundingClientRect();
        const ox = e.offsetX, oy = e.offsetY;

        const move = ev => {
          let x = ev.clientX - rect.left - ox;
          let y = ev.clientY - rect.top - oy;
          x = Math.max(0, Math.min(bg.clientWidth - div.offsetWidth, x));
          y = Math.max(0, Math.min(bg.clientHeight - div.offsetHeight, y));
          div.style.left = x + 'px';
          div.style.top = y + 'px';
        };

        const up = () => {
          s.x = parseInt(div.style.left);
          s.y = parseInt(div.style.top);
          document.removeEventListener('mousemove', move);
          document.removeEventListener('mouseup', up);
        };

        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
      };

      bg.appendChild(div);
      this.sensorElements.push(div);
    });
  }
}


/* ===================== ÉDITEUR AVEC APERÇU ===================== */

class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = config; this.render(); }

  getSensors(filter='') {
    return Object.keys(this._hass.states)
      .filter(e => e.startsWith('sensor.') && e.toLowerCase().includes(filter.toLowerCase()));
  }

  renderPreview(prefix) {
    const p = this._config[prefix];
    const bg = p.background || '';

    return `
      <div class="preview" data-prefix="${prefix}" style="
        position:relative;height:250px;margin:10px 0;
        background:url('${bg}') center/cover no-repeat;
        border:1px solid #ccc;">
        ${(p.sensors||[]).map((s,i)=>`
          <div class="dot" data-i="${i}" style="
            position:absolute;
            left:${s.x||50}px; top:${s.y||50}px;
            background:#000a;color:#fff;
            padding:2px 6px;border-radius:6px;
            cursor:move;">●</div>
        `).join('')}
      </div>
    `;
  }

  render() {
    if (!this._config) return;

    this.innerHTML = `
      <style>
        input,select{width:100%;margin:4px 0;padding:4px;}
      </style>

      ${['person1','person2'].map(p=>`
        <h3>${this._config[p].name}</h3>
        <input id="${p}-name" value="${this._config[p].name}">
        <select id="${p}-gender">
          <option value="male">Homme</option>
          <option value="female">Femme</option>
        </select>
        <input id="${p}-bg" placeholder="Image URL" value="${this._config[p].background||''}">
        ${this.renderPreview(p)}
      `).join('')}
    `;

    this.querySelectorAll('.preview').forEach(preview => {
      const prefix = preview.dataset.prefix;
      const sensors = this._config[prefix].sensors;

      preview.querySelectorAll('.dot').forEach(dot => {
        dot.onmousedown = e => {
          const rect = preview.getBoundingClientRect();
          const i = dot.dataset.i;

          const move = ev => {
            let x = ev.clientX - rect.left;
            let y = ev.clientY - rect.top;
            dot.style.left = x + 'px';
            dot.style.top = y + 'px';
          };

          const up = () => {
            sensors[i].x = parseInt(dot.style.left);
            sensors[i].y = parseInt(dot.style.top);
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
            this.save();
          };

          document.addEventListener('mousemove', move);
          document.addEventListener('mouseup', up);
        };
      });
    });

    this.querySelectorAll('input,select').forEach(el => el.onchange = () => this.save());
  }

  save() {
    const cfg = {
      type: 'custom:health-dashboard-card',
      person1: this.collect('person1'),
      person2: this.collect('person2'),
    };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg } }));
  }

  collect(p) {
    return {
      ...this._config[p],
      name: this.querySelector(`#${p}-name`).value,
      gender: this.querySelector(`#${p}-gender`).value,
      background: this.querySelector(`#${p}-bg`).value,
    };
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
