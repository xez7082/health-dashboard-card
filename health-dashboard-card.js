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

  getCardSize() {
    return 6;
  }

  updateSensorValues() {
    if (!this._config || !this._hass) return;
    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    person.sensors?.forEach((sensor, index) => {
      const state = this._hass.states[sensor.entity];
      const el = this.sensorElements[index];
      if (el && state) {
        const unit = state.attributes.unit_of_measurement || '';
        el.textContent = `${state.state} ${unit}`.trim();
      }
    });
  }

  togglePerson(person) {
    if (this.currentPerson === person) return;
    this.currentPerson = person;

    const p = this._config[person];
    const btn1 = this.shadowRoot.getElementById('p1');
    const btn2 = this.shadowRoot.getElementById('p2');
    btn1.classList.toggle('active', person === 'person1');
    btn2.classList.toggle('active', person === 'person2');

    // Couleur des boutons
    btn1.style.background = this._config.person1.gender === 'female' ? 'red' : 'blue';
    btn2.style.background = this._config.person2.gender === 'female' ? 'red' : 'blue';

    const imgDiv = this.shadowRoot.querySelector('.image');
    const bgImage = p.background || (p.gender === 'female' ? '/local/health-dashboard/femme.png' : '/local/health-dashboard/homme.png');
    imgDiv.style.backgroundImage = `url('${bgImage}')`;

    this.renderGrid();
    this.updateSensorValues();
  }

  renderGrid() {
    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    const sensors = person.sensors || [];
    const grid = this.shadowRoot.querySelector('.grid');
    grid.innerHTML = '';
    this.sensorElements = [];

    sensors.forEach((s, i) => {
      const div = document.createElement('div');
      div.classList.add('card');
      div.setAttribute('draggable', true);
      div.dataset.index = i;
      div.innerHTML = `<div>${s.name || s.entity}</div><div id="sensor-value-${i}" class="value">--</div>`;
      div.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', i);
      });
      div.addEventListener('dragover', e => e.preventDefault());
      div.addEventListener('drop', e => {
        e.preventDefault();
        const fromIndex = e.dataTransfer.getData('text');
        const toIndex = div.dataset.index;
        [person.sensors[fromIndex], person.sensors[toIndex]] = [person.sensors[toIndex], person.sensors[fromIndex]];
        this.renderGrid();
        this.updateSensorValues();
      });
      grid.appendChild(div);
      this.sensorElements.push(div.querySelector(`#sensor-value-${i}`));
    });
  }

  render() {
    if (!this._config) return;

    const person = this.currentPerson === 'person1' ? this._config.person1 : this._config.person2;
    const bgImage = person.background || (person.gender === 'female' ? '/local/health-dashboard/femme.png' : '/local/health-dashboard/homme.png');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { position: relative; overflow: hidden; height: 600px; background: transparent; }
        .header { position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; }
        button { border: none; padding: 10px 18px; border-radius: 20px; cursor: pointer; color:white; font-weight:bold; }
        .active { box-shadow: 0 0 6px #000; }
        .layout { display: flex; height: 100%; }
        .image { flex: 0 0 40%; background: url('${bgImage}') center/cover no-repeat; transition: background-image 0.5s ease; }
        .grid { flex: 1; display: flex; flex-wrap: wrap; gap: 12px; padding: 20px; overflow-y: auto; align-content: flex-start; }
        .card { text-align:center; padding:6px 12px; background: rgba(0,0,0,0.3); border-radius:10px; cursor:move; user-select:none; color:white; text-shadow:0 0 4px #000; }
        .value { font-size: 22px; font-weight:bold; }
      </style>
      <ha-card>
        <div class="header">
          <button id="p1">${this._config.person1.name}</button>
          <button id="p2">${this._config.person2.name}</button>
        </div>
        <div class="layout">
          <div class="image"></div>
          <div class="grid"></div>
        </div>
      </ha-card>
    `;

    // Couleur des boutons
    const btn1 = this.shadowRoot.getElementById('p1');
    const btn2 = this.shadowRoot.getElementById('p2');
    btn1.style.background = this._config.person1.gender === 'female' ? 'red' : 'blue';
    btn2.style.background = this._config.person2.gender === 'female' ? 'red' : 'blue';

    btn1.onclick = () => this.togglePerson('person1');
    btn2.onclick = () => this.togglePerson('person2');

    this.renderGrid();
    this.updateSensorValues();
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
