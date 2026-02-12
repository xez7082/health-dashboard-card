// HEALTH DASHBOARD CARD – VERSION V8 (FIXED RATIO & SCALE)
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
        el.textContent = stateObj ? `${stateObj.state} ${stateObj.attributes.unit_of_measurement || ''}`.trim() : '--';
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
        .main-container { 
          position: relative; 
          width: 100%; 
          aspect-ratio: 4 / 5; /* Ratio forcé pour aligner éditeur et carte */
          background: #0f172a; 
          border-radius: 16px; 
          overflow: hidden; 
          font-family: sans-serif; 
          color: white; 
        }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center center / contain no-repeat; opacity: 0.3; pointer-events: none; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 10; }
        .btn { border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; transition: 0.3s; font-size: 12px;}
        .btn.active { background: #38bdf8; box-shadow: 0 0 10px #38bdf8; }
        .sensor { 
          position: absolute; 
          transform: translate(-50%, -50%); 
          padding: 8px; 
          border-radius: 10px; 
          width: 22%; /* Taille basée sur la largeur du parent */
          text-align: center; 
          cursor: grab; 
          z-index: 5; 
          background: rgba(30, 41, 59, 0.85); 
          backdrop-filter: blur(5px); 
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 0.8em;
        }
        .icon-box { font-size: 1.5em; color: var(--icon-color); }
        ha-icon { --mdc-icon-size: 24px; }
        .label { font-size: 0.7em; text-transform: uppercase; margin-top: 3px; font-weight: 600; overflow: hidden; white-space: nowrap; }
        .val { font-size: 0.9em; font-weight: bold; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s, i) => `<line id="line-${i}" x1="50%" y1="50%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1" stroke-dasharray="3" opacity="0.4"/>`).join('')}</svg>
        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x}%; top:${s.y}%; --icon-color:${s.color}">
            <div class="icon-box">${s.icon.includes(':') ? `<ha-icon icon="${s.icon}"></ha-icon>` : s.icon}</div>
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
    const card = this.shadowRoot.querySelector('.main-container');
    const sensors = this._config[this.currentPerson].sensors || [];
    sensors.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      if (!el) return;
      el.onmousedown = (e) => {
        const rect = card.getBoundingClientRect();
        const move = (ev) => {
          s.x = Math.round(((ev.clientX - rect.left) / rect.width) * 100);
          s.y = Math.round(((ev.clientY - rect.top) / rect.height) * 100);
          s.x = Math.max(0, Math.min(100, s.x));
          s.y = Math.max(0, Math.min(100, s.y));
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

// EDITEUR V8 (AUTO-SAVE POSITION)
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this.currentTab = 'person1'; }
  set hass(hass) { this._hass = hass; }
  
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._initialized) { this.render(); this._initialized = true; }
  }

  configChanged() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  render() {
    if (!this._config || !this._hass) return;
    const person = this._config[this.currentTab];

    this.innerHTML = `
      <style>
        .ed-container { display: flex; flex-direction: column; gap: 10px; font-family: sans-serif; }
        .tabs { display: flex; gap: 2px; }
        .tab { flex: 1; padding: 8px; cursor: pointer; border: none; background: #ccc; }
        .tab.active { background: #38bdf8; color: white; }
        .sensor-card { border: 1px solid #ddd; padding: 10px; border-radius: 8px; background: #f9f9f9; margin-bottom: 8px; }
        .search-area { position: relative; }
        .search-res { position: absolute; width: 100%; max-height: 100px; overflow-y: auto; background: white; border: 1px solid #ccc; z-index: 10; display: none; color: black; }
        .search-res div { padding: 5px; cursor: pointer; border-bottom: 1px solid #eee; font-size: 12px; }
        input { width: 100%; padding: 6px; box-sizing: border-box; margin-top: 4px; border: 1px solid #ccc; border-radius: 4px; }
        .btn-add { background: #10b981; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; }
        .note { font-size: 11px; color: #666; font-style: italic; margin-bottom: 5px; }
      </style>
      <div class="ed-container">
        <div class="tabs">
          <button class="tab ${this.currentTab==='person1'?'active':''}" data-t="person1">Homme</button>
          <button class="tab ${this.currentTab==='person2'?'active':''}" data-t="person2">Femme</button>
        </div>
        
        <div class="note">Déplacez les bulles directement sur la carte à droite pour régler la position.</div>
        
        <label>Prénom:</label>
        <input type="text" id="p-name" value="${person.name}">
        
        <div id="sensor-list-edit">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-card">
              <strong>Capteur ${i+1}</strong>
              <div class="search-area">
                <input type="text" class="s-ent" data-idx="${i}" placeholder="Rechercher entité..." value="${s.entity}">
                <div class="search-res" id="r-${i}"></div>
              </div>
              <input type="text" class="s-lab" data-idx="${i}" placeholder="Label (ex: Pouls)" value="${s.name}">
              <input type="text" class="s-ico" data-idx="${i}" placeholder="Icône (mdi:xxx)" value="${s.icon}">
              <input type="color" class="s-col" data-idx="${i}" value="${s.color}">
              <button style="background:#ef4444; color:white; border:none; width:100%; margin-top:5px; border-radius:4px;" class="s-del" data-idx="${i}">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button class="btn-add">➕ Ajouter un capteur</button>
      </div>
    `;

    this._attach();
  }

  _attach() {
    this.querySelectorAll('.tab').forEach(b => b.onclick = () => { this.currentTab = b.dataset.t; this.render(); });
    const person = this._config[this.currentTab];

    this.querySelector('#p-name').oninput = (e) => { person.name = e.target.value; this.configChanged(); };

    this.querySelectorAll('.s-ent').forEach(inp => {
      inp.oninput = (e) => {
        const idx = e.target.dataset.idx;
        const val = e.target.value.toLowerCase();
        const res = this.querySelector(`#r-${idx}`);
        person.sensors[idx].entity = e.target.value;
        this.configChanged();

        if (val.length < 2) { res.style.display = 'none'; return; }
        const matches = Object.keys(this._hass.states).filter(k => k.includes(val)).slice(0, 5);
        res.innerHTML = matches.map(m => `<div data-v="${m}">${m}</div>`).join('');
        res.style.display = 'block';
        res.querySelectorAll('div').forEach(d => d.onclick = () => {
          person.sensors[idx].entity = d.dataset.v;
          inp.value = d.dataset.v;
          res.style.display = 'none';
          this.configChanged();
        });
      };
    });

    this.querySelectorAll('.s-lab').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].name = e.target.value; this.configChanged(); });
    this.querySelectorAll('.s-ico').forEach(el => el.oninput = (e) => { person.sensors[el.dataset.idx].icon = e.target.value; this.configChanged(); });
    this.querySelectorAll('.s-col').forEach(el => el.onchange = (e) => { person.sensors[el.dataset.idx].color = e.target.value; this.configChanged(); });
    this.querySelector('.btn-add').onclick = () => {
      person.sensors.push({ entity: '', name: 'Nouveau', icon: 'mdi:pulse', color: '#38bdf8', x: 50, y: 50 });
      this.render(); this.configChanged();
    };
    this.querySelectorAll('.s-del').forEach(b => b.onclick = () => {
      person.sensors.splice(b.dataset.idx, 1);
      this.render(); this.configChanged();
    });
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V8", description: "Ratio corrigé et sensors proportionnels." });
