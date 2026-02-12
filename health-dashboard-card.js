// HEALTH DASHBOARD CARD – VERSION V3.1 OPTIMISÉE
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
  }

  static getConfigElement() {
    return document.createElement('health-dashboard-card-editor');
  }

  static getStubConfig() {
    return {
      person1: { 
        name: 'Homme', 
        gender: 'male', 
        image: '', 
        sensors: [{ entity: 'sensor.time', name: 'Pouls', icon: '❤️', x: 50, y: 20, color: '#f44336' }] 
      },
      person2: { 
        name: 'Femme', 
        gender: 'female', 
        image: '', 
        sensors: [{ entity: 'sensor.date', name: 'Sommeil', icon: '🌙', x: 50, y: 30, color: '#9c27b0' }] 
      },
    };
  }

  setConfig(config) {
    if (!config.person1 || !config.person2) {
      throw new Error('Configuration requise : person1 et person2');
    }
    this._config = JSON.parse(JSON.stringify(config)); // Deep copy
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this._config) return;
    const sensors = this._config[this.currentPerson].sensors || [];
    sensors.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`value-${i}`);
      if (el) {
        const stateObj = this._hass.states[s.entity];
        if (stateObj) {
          const val = stateObj.state;
          const unit = stateObj.attributes.unit_of_measurement || '';
          el.textContent = `${val} ${unit}`.trim();
        } else {
          el.textContent = 'Non trouvé';
        }
      }
    });
  }

  render() {
    if (!this._config) return;
    const person = this._config[this.currentPerson];
    const defaultImg = person.gender === 'female' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' // Fallback si local absent
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png';
    const imageUrl = person.image || defaultImg;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; --main-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card { position: relative; width: 100%; height: 600px; overflow: hidden; border-radius: 12px; background: var(--main-gradient); font-family: sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center center / contain no-repeat; opacity: 0.5; pointer-events: none; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 10; }
        .btn-person { border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; color: white; font-weight: bold; transition: 0.3s; background: rgba(0,0,0,0.3); }
        .btn-person.active { background: white; color: #333; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .person-name { position: absolute; top: 65px; width: 100%; text-align: center; font-size: 28px; font-weight: bold; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .sensor { position: absolute; transform: translate(-50%, -50%); border-radius: 10px; padding: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); min-width: 90px; text-align: center; cursor: grab; z-index: 5; }
        .sensor:active { cursor: grabbing; }
        .sensor-icon { font-size: 24px; }
        .sensor-name { font-size: 10px; text-transform: uppercase; opacity: 0.9; }
        .sensor-value { font-size: 16px; font-weight: bold; }
      </style>
      <div class="card">
        <div class="bg"></div>
        <div class="topbar">
          <button id="p1" class="btn-person ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn-person ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="person-name">${person.name}</div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x}%; top:${s.y}%; background:${s.color || '#2196f3'}; color:${this.getContrastColor(s.color)}">
            <div class="sensor-icon">${s.icon || '📊'}</div>
            <div class="sensor-name">${s.name}</div>
            <div class="sensor-value" id="value-${i}">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('p1').onclick = () => { this.currentPerson = 'person1'; this.render(); };
    this.shadowRoot.getElementById('p2').onclick = () => { this.currentPerson = 'person2'; this.render(); };
    this.enableDrag();
    this.updateSensors();
  }

  getContrastColor(hex = '#2196f3') {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    return ((r * 299 + g * 587 + b * 114) / 1000) > 128 ? '#000' : '#fff';
  }

  enableDrag() {
    const card = this.shadowRoot.querySelector('.card');
    const sensors = this._config[this.currentPerson].sensors || [];
    sensors.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      if (!el) return;
      el.onmousedown = (e) => {
        const rect = card.getBoundingClientRect();
        const move = (ev) => {
          let x = ((ev.clientX - rect.left) / rect.width) * 100;
          let y = ((ev.clientY - rect.top) / rect.height) * 100;
          s.x = Math.round(Math.max(5, Math.min(95, x)));
          s.y = Math.round(Math.max(5, Math.min(95, y)));
          el.style.left = s.x + '%';
          el.style.top = s.y + '%';
        };
        const up = () => {
          window.removeEventListener('mousemove', move);
          window.removeEventListener('mouseup', up);
          this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
      };
    });
  }
}

// ÉDITEUR V3.1
class HealthDashboardCardEditor extends HTMLElement {
  constructor() {
    super();
    this.currentTab = 'person1';
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  configChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  render() {
    if (!this._config) return;
    const person = this._config[this.currentTab];

    this.innerHTML = `
      <style>
        .ed-container { font-family: sans-serif; color: var(--primary-text-color); }
        .tabs { display: flex; margin-bottom: 15px; border-bottom: 1px solid #ccc; }
        .tab { padding: 10px; cursor: pointer; border: none; background: none; color: var(--secondary-text-color); }
        .tab.active { color: var(--primary-color); border-bottom: 2px solid var(--primary-color); font-weight: bold; }
        .sec { background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; margin-bottom: 10px; }
        .row { display: flex; align-items: center; margin-bottom: 8px; gap: 10px; }
        label { flex: 1; font-size: 14px; }
        input, select { flex: 2; padding: 6px; border-radius: 4px; border: 1px solid #ccc; background: var(--card-background-color); color: var(--primary-text-color); }
        .sensor-card { border: 1px solid #ccc; padding: 10px; margin-top: 10px; border-radius: 5px; background: var(--card-background-color); }
        .btn-add { width: 100%; padding: 10px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .btn-del { background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
      </style>
      <div class="ed-container">
        <div class="tabs">
          <button class="tab ${this.currentTab==='person1'?'active':''}" id="t1">Personne 1</button>
          <button class="tab ${this.currentTab==='person2'?'active':''}" id="t2">Personne 2</button>
        </div>
        <div class="sec">
          <div class="row"><label>Nom</label><input type="text" id="p-name" value="${person.name}"></div>
          <div class="row"><label>Genre</label>
            <select id="p-gender">
              <option value="male" ${person.gender==='male'?'selected':''}>Homme</option>
              <option value="female" ${person.gender==='female'?'selected':''}>Femme</option>
            </select>
          </div>
          <div class="row"><label>Image (URL)</label><input type="text" id="p-image" value="${person.image}" placeholder="/local/img.png"></div>
        </div>
        <div id="sensors-zone">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-card">
              <div class="row"><strong>Capteur ${i+1}</strong> <button class="btn-del" data-idx="${i}">Supprimer</button></div>
              <div class="row"><label>Entité</label><input type="text" class="s-ent" data-idx="${i}" value="${s.entity}"></div>
              <div class="row"><label>Nom</label><input type="text" class="s-nam" data-idx="${i}" value="${s.name}"></div>
              <div class="row"><label>Icône</label><input type="text" class="s-ico" data-idx="${i}" value="${s.icon}"></div>
              <div class="row"><label>Couleur</label><input type="color" class="s-col" data-idx="${i}" value="${s.color}"></div>
            </div>
          `).join('')}
        </div>
        <button class="btn-add">➕ Ajouter un capteur</button>
      </div>
    `;

    this._attach();
  }

  _attach() {
    this.querySelector('#t1').onclick = () => { this.currentTab = 'person1'; this.render(); };
    this.querySelector('#t2').onclick = () => { this.currentTab = 'person2'; this.render(); };
    
    const person = this._config[this.currentTab];

    this.querySelector('#p-name').oninput = (e) => { person.name = e.target.value; this.configChanged(); };
    this.querySelector('#p-gender').onchange = (e) => { person.gender = e.target.value; this.configChanged(); };
    this.querySelector('#p-image').oninput = (e) => { person.image = e.target.value; this.configChanged(); };

    this.querySelectorAll('.s-ent').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].entity = e.target.value; this.configChanged(); });
    this.querySelectorAll('.s-nam').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].name = e.target.value; this.configChanged(); });
    this.querySelectorAll('.s-ico').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].icon = e.target.value; this.configChanged(); });
    this.querySelectorAll('.s-col').forEach(el => el.onchange = (e) => { person.sensors[el.dataset.idx].color = e.target.value; this.configChanged(); });

    this.querySelector('.btn-add').onclick = () => {
      if(!person.sensors) person.sensors = [];
      person.sensors.push({ entity: '', name: 'Nouveau', icon: '📊', color: '#2196f3', x: 50, y: 50 });
      this.render();
      this.configChanged();
    };

    this.querySelectorAll('.btn-del').forEach(btn => btn.onclick = () => {
      person.sensors.splice(btn.dataset.idx, 1);
      this.render();
      this.configChanged();
    });
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "health-dashboard-card",
  name: "Health Dashboard Card",
  preview: true,
  description: "Une carte de santé interactive avec silhouettes"
});
