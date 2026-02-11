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
    if (!config.person1 || !config.person2) throw new Error('Définir person1 et person2');
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
    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    person.sensors?.forEach((sensor, index) => {
      const state = this._hass.states[sensor.entity];
      const el = this.sensorElements[index];
      if (el && state) {
        const unit = state.attributes.unit_of_measurement || '';
        el.querySelector('.value').textContent = `${state.state} ${unit}`.trim();
      }
    });
  }

  togglePerson(person) {
    if (this.currentPerson === person) return;
    this.currentPerson = person;
    this.render();
  }

  render() {
    if (!this._config) return;
    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    const bgImage = person.background || (person.gender === 'female' ? '/local/health-dashboard/femme.png' : '/local/health-dashboard/homme.png');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { position: relative; height: 600px; overflow: hidden; background: transparent; }
        .header { position: absolute; top: 10px; left: 10px; display: flex; gap: 10px; z-index: 2; }
        button { border: none; padding: 10px 18px; border-radius: 20px; cursor: pointer; color: white; font-weight:bold; }
        .active { box-shadow: 0 0 8px #000; }
        .background { position: absolute; top:0; left:0; right:0; bottom:0; background: url('${bgImage}') center/cover no-repeat; }
        .sensor { position: absolute; padding: 6px 12px; background: rgba(0,0,0,0.3); color: white; border-radius: 8px; cursor: grab; user-select: none; text-align:center; text-shadow:0 0 4px #000; }
        .value { font-size: 18px; font-weight: bold; }
      </style>
      <ha-card>
        <div class="header">
          <button id="p1">${this._config.person1.name}</button>
          <button id="p2">${this._config.person2.name}</button>
        </div>
        <div class="background" id="background"></div>
      </ha-card>
    `;

    // Boutons couleur
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
    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    const bg = this.shadowRoot.getElementById('background');
    bg.querySelectorAll('.sensor')?.forEach(e => e.remove());
    this.sensorElements = [];

    person.sensors?.forEach((sensor, i) => {
      const div = document.createElement('div');
      div.classList.add('sensor');
      div.dataset.index = i;
      div.style.left = (sensor.x || 50) + 'px';
      div.style.top = (sensor.y || 50) + 'px';
      div.innerHTML = `<div>${sensor.name || sensor.entity}</div><div class="value">--</div>`;

      // Drag & Drop libre
      div.onmousedown = e => {
        e.preventDefault();
        const offsetX = e.offsetX;
        const offsetY = e.offsetY;

        const onMouseMove = ev => {
          let x = ev.clientX - bg.getBoundingClientRect().left - offsetX;
          let y = ev.clientY - bg.getBoundingClientRect().top - offsetY;
          x = Math.max(0, Math.min(bg.clientWidth - div.offsetWidth, x));
          y = Math.max(0, Math.min(bg.clientHeight - div.offsetHeight, y));
          div.style.left = x + 'px';
          div.style.top = y + 'px';
        };

        const onMouseUp = () => {
          // sauvegarde positions
          sensor.x = parseInt(div.style.left);
          sensor.y = parseInt(div.style.top);
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      bg.appendChild(div);
      this.sensorElements.push(div);
    });
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
