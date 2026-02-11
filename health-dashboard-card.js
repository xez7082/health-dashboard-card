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
      // Drag & Drop
      div.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', i));
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

/* ===================== ÉDITEUR ===================== */

class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = config; this.render(); }

  getEntities(filter='') {
    if (!this._hass) return [];
    return Object.keys(this._hass.states)
      .filter(e => e.startsWith('sensor.') && e.toLowerCase().includes(filter.toLowerCase()));
  }

  renderSensors(list, prefix, filter='') {
    const entities = this.getEntities(filter);
    return `
      <div id="${prefix}-sensors">
        ${(list || []).map((s,i)=>`
          <div style="display:flex; gap:6px; margin-bottom:6px;">
            <input type="text" placeholder="Nom capteur" data-name-index="${i}" data-prefix="${prefix}" value="${s.name||''}">
            <select data-index="${i}" data-prefix="${prefix}" class="sensor-select">
              ${entities.map(e=>`<option value="${e}" ${e===s.entity?'selected':''}>${e}</option>`).join('')}
            </select>
            <button data-remove="${i}" data-prefix="${prefix}">✕</button>
          </div>
        `).join('')}
      </div>
      <button data-add="${prefix}">+ Ajouter capteur</button>
    `;
  }

  render() {
    if (!this._config) return;

    this.innerHTML = `
      <style>
        .wrap{padding:16px;}
        select,input{width:100%;padding:6px;margin-bottom:6px;}
        button{cursor:pointer;}
      </style>
      <div class="wrap">
        ${['p1','p2'].map(prefix=>{
          const p = prefix==='p1'?this._config.person1:this._config.person2;
          return `
          <h3>${prefix==='p1'?'Personne 1':'Personne 2'}</h3>
          <input id="${prefix}name" value="${p.name||''}" placeholder="Nom">
          <select id="${prefix}gender">
            <option value="male" ${p.gender==='male'?'selected':''}>Homme</option>
            <option value="female" ${p.gender==='female'?'selected':''}>Femme</option>
          </select>
          <input id="${prefix}bg" value="${p.background||''}" placeholder="URL image de fond">
          <input type="text" id="${prefix}search" placeholder="Rechercher capteur">
          <div id="${prefix}-sensors-wrapper">${this.renderSensors(p.sensors,prefix)}</div>
          `;
        }).join('')}
      </div>
    `;

    ['p1','p2'].forEach(prefix=>{
      const wrapper = this.querySelector(`#${prefix}-sensors-wrapper`);
      const searchInput = this.querySelector(`#${prefix}search`);
      const renderList = () => {
        wrapper.innerHTML = this.renderSensors(this._config[prefix==='p1'?'person1':'person2'].sensors,prefix,searchInput.value);
        this.attachSensorEvents(wrapper,prefix);
      };
      searchInput.oninput = renderList;
      renderList();
    });

    this.querySelectorAll('#p1name,#p2name,#p1bg,#p2bg,#p1gender,#p2gender').forEach(el=>el.onchange=()=>this.save());
  }

  attachSensorEvents(wrapper,prefix){
    wrapper.querySelectorAll('[data-add]').forEach(btn=>{
      btn.onclick=()=>{
        const key=prefix==='p1'?'person1':'person2';
        this._config[key].sensors.push({entity:this.getEntities()[0],name:''});
        this.render();
      };
    });
    wrapper.querySelectorAll('[data-remove]').forEach(btn=>{
      btn.onclick=()=>{
        const key=prefix==='p1'?'person1':'person2';
        this._config[key].sensors.splice(btn.dataset.remove,1);
        this.render();
      };
    });
    wrapper.querySelectorAll('[data-name-index]').forEach(input=>input.onchange=()=>this.save());
    wrapper.querySelectorAll('.sensor-select').forEach(sel=>sel.onchange=()=>this.save());
  }

  save(){
    const collect = prefix=>{
      const key=prefix==='p1'?'person1':'person2';
      const sensors=[...this.querySelectorAll(`#${prefix}-sensors-wrapper .sensor-select`)].map((sel,i)=>({
        entity:sel.value,
        name:this.querySelector(`#${prefix}-sensors-wrapper [data-name-index="${i}"]`).value
      }));
      return {
        name:this.querySelector(`#${prefix}name`).value,
        gender:this.querySelector(`#${prefix}gender`).value,
        background:this.querySelector(`#${prefix}bg`).value,
        sensors
      };
    };
    const config={type:'custom:health-dashboard-card',person1:collect('p1'),person2:collect('p2')};
    this.dispatchEvent(new CustomEvent('config-changed',{detail:{config}}));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards||[];
window.customCards.push({
  type:'health-dashboard-card',
  name:'Health Dashboard Card',
  description:'Carte santé multi-capteurs avec éditeur et drag&drop',
  preview:true,
});

console.info('%c HEALTH-DASHBOARD-CARD %c v3.4.0 ','color:white;background:#667eea;font-weight:bold;','color:#667eea;background:white;font-weight:bold;');
