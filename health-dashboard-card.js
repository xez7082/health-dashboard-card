// HEALTH DASHBOARD CARD – VERSION V7 (FOCUS STABLE)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
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
        el.textContent = stateObj ? `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`.trim() : 'N/A';
      }
    });
  }

  render() {
    if (!this._config) return;
    const person = this._config[this.currentPerson];
    const imageUrl = person.image || (person.gender === 'female' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' 
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .card { position: relative; width: 100%; height: 600px; background: #0f172a; border-radius: 16px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center center / contain no-repeat; opacity: 0.3; pointer-events: none; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 10; }
        .btn { border: none; padding: 10px 18px; border-radius: 25px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; transition: 0.3s; }
        .btn.active { background: #38bdf8; box-shadow: 0 0 15px #38bdf8; }
        .sensor { position: absolute; transform: translate(-50%, -50%); padding: 10px; border-radius: 12px; min-width: 90px; 
                  text-align: center; cursor: grab; z-index: 5; background: rgba(30, 41, 59, 0.7); 
                  backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.1); }
        .icon-box { font-size: 24px; color: var(--icon-color); }
        ha-icon { --mdc-icon-size: 28px; }
        .pulse { animation: pulse 2s infinite ease-in-out; display: inline-block; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        .label { font-size: 10px; text-transform: uppercase; margin-top: 5px; font-weight: 600; }
        .val { font-size: 15px; font-weight: bold; }
      </style>
      <div class="card">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s, i) => `<line id="line-${i}" x1="50%" y1="50%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1.5" stroke-dasharray="4" opacity="0.4"/>`).join('')}</svg>
        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x}%; top:${s.y}%; --icon-color:${s.color}">
            <div class="icon-box pulse">
              ${s.icon.includes(':') ? `<ha-icon icon="${s.icon}"></ha-icon>` : s.icon}
            </div>
            <div class="label" style="color:${s.color}">${s.name}</div>
            <div id="value-${i}" class="val">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('p1').onclick = () => { this.currentPerson = 'person1'; this.render(); };
    this.shadowRoot.getElementById('p2').onclick = () => { this.currentPerson = 'person2'; this.render(); };
    this.enableDrag();
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
          s.x = Math.round(((ev.clientX - rect.left) / rect.width) * 100);
          s.y = Math.round(((ev.clientY - rect.top) / rect.height) * 100);
          el.style.left = s.x + '%';
          el.style.top = s.y + '%';
          const line = this.shadowRoot.getElementById(`line-${i}`);
          if (line) { line.setAttribute('x2', s.x + '%'); line.setAttribute('y2', s.y + '%'); }
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

// EDITEUR V7 ANTI-SAUT
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this.currentTab = 'person1'; }
  set hass(hass) { this._hass = hass; }
  
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._initialized) {
        this.render();
        this._initialized = true;
    }
  }

  configChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  render() {
    if (!this._config || !this._hass) return;
    const person = this._config[this.currentTab];

    this.innerHTML = `
      <style>
        .ed-body { padding: 10px; color: var(--primary-text-color); }
        .tabs { display: flex; gap: 4px; margin-bottom: 10px; }
        .tab { flex: 1; padding: 10px; cursor: pointer; background: #ddd; border-radius: 4px; border: none; text-align: center; font-weight: bold; }
        .tab.active { background: #38bdf8; color: white; }
        .s-block { border: 1px solid #ccc; padding: 12px; border-radius: 8px; margin-bottom: 15px; position: relative; background: var(--card-background-color); }
        .results { position: absolute; width: 90%; max-height: 120px; overflow-y: auto; background: white; border: 1px solid #ccc; z-index: 100; color: black; display: none; }
        .results div { padding: 8px; cursor: pointer; border-bottom: 1px solid #eee; }
        .results div:hover { background: #f0f0f0; }
        input { width: 100%; padding: 8px; box-sizing: border-box; margin: 4px 0; border: 1px solid #ccc; border-radius: 4px; }
        .btn-add { background: #10b981; color: white; width: 100%; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-del { background: #ef4444; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; margin-top: 5px; width: 100%; }
      </style>
      <div class="ed-body">
        <div class="tabs">
          <button class="tab ${this.currentTab==='person1'?'active':''}" id="btn-p1">Homme</button>
          <button class="tab ${this.currentTab==='person2'?'active':''}" id="btn-p2">Femme</button>
        </div>
        
        <label>Nom :</label>
        <input type="text" id="p-name" value="${person.name}">
        <hr>
        
        <div id="sensors-container">
          ${(person.sensors || []).map((s, i) => `
            <div class="s-block">
              <strong>Capteur ${i+1}</strong>
              <input type="text" class="s-search" data-idx="${i}" placeholder="Chercher une entité..." value="${s.entity}">
              <div class="results" id="res-${i}"></div>
              <input type="text" class="s-label" data-idx="${i}" placeholder="Label" value="${s.name}">
              <input type="text" class="s-icon" data-idx="${i}" placeholder="Icon (mdi:heart)" value="${s.icon}">
              <input type="color" class="s-color" data-idx="${i}" value="${s.color}">
              <button class="btn-del" data-idx="${i}">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-add">➕ Ajouter un capteur</button>
      </div>
    `;

    this._setupListeners();
  }

  _setupListeners() {
    this.querySelector('#btn-p1').onclick = () => { this.currentTab = 'person1'; this.render(); };
    this.querySelector('#btn-p2').onclick = () => { this.currentTab = 'person2'; this.render(); };
    
    const person = this._config[this.currentTab];

    this.querySelector('#p-name').oninput = (e) => {
        person.name = e.target.value;
        this.configChanged();
    };

    this.querySelectorAll('.s-search').forEach(input => {
      input.oninput = (e) => {
        const idx = e.target.dataset.idx;
        const val = e.target.value.toLowerCase();
        const res = this.querySelector(`#res-${idx}`);
        person.sensors[idx].entity = e.target.value;
        this.configChanged();

        if (val.length < 2) { res.style.display = 'none'; return; }
        const matches = Object.keys(this._hass.states).filter(k => k.includes(val)).slice(0, 8);
        res.innerHTML = matches.map(m => `<div data-val="${m}">${m}</div>`).join('');
        res.style.display = 'block';

        res.querySelectorAll('div').forEach(d => d.onclick = () => {
          person.sensors[idx].entity = d.dataset.val;
          input.value = d.dataset.val;
          res.style.display = 'none';
          this.configChanged();
        });
      };
    });

    this.querySelectorAll('.s-label').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].name = e.target.value; this.configChanged(); });
    this.querySelectorAll('.s-icon').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].icon = e.target.value; this.configChanged(); });
    this.querySelectorAll('.s-color').forEach(el => el.onchange = (e) => { person.sensors[el.dataset.idx].color = e.target.value; this.configChanged(); });

    this.querySelector('.btn-add').onclick = () => {
      person.sensors.push({ entity: '', name: 'Nouveau', icon: 'mdi:pulse', color: '#38bdf8', x: 50, y: 50 });
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
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V7", description: "Éditeur stable sans sauts de focus." });
