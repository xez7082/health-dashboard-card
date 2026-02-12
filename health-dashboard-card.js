// HEALTH DASHBOARD CARD – VERSION V13 (YAML FORCE UPDATE)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isDragging = false;
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    // On travaille sur une copie propre
    this._config = JSON.parse(JSON.stringify(config));
    if (this._config.img_offset === undefined) this._config.img_offset = 50; 
    if (this._config.card_height === undefined) this._config.card_height = 550;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._isDragging) this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this._config || !this.shadowRoot) return;
    const personKey = this.currentPerson || 'person1';
    const person = this._config[personKey];
    (person.sensors || []).forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`value-${i}`);
      if (el) {
        const stateObj = this._hass.states[s.entity];
        el.textContent = stateObj ? `${stateObj.state}${stateObj.attributes.unit_of_measurement || ''}` : '--';
      }
    });
  }

  render() {
    if (!this._config) return;
    const personKey = this.currentPerson || 'person1';
    const person = this._config[personKey];
    const imageUrl = person.image || (person.gender === 'female' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' 
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; touch-action: none; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center ${this._config.img_offset}% / cover no-repeat; opacity: 0.4; pointer-events: none; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 12px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 10; }
        .btn { border: none; padding: 6px 14px; border-radius: 15px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: bold; }
        .btn.active { background: #38bdf8; }
        .sensor { position: absolute; transform: translate(-50%, -50%); padding: 6px; border-radius: 8px; width: 22%; min-width: 70px; text-align: center; z-index: 5; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.3); cursor: grab; }
        .icon-box { font-size: 1.2em; color: var(--icon-color); }
        .label { font-size: 0.6em; text-transform: uppercase; margin-top: 2px; }
        .val { font-size: 0.85em; font-weight: 800; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s, i) => `<line id="line-${i}" x1="50%" y1="${this._config.img_offset}%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1" stroke-dasharray="3" opacity="0.3"/>`).join('')}</svg>
        <div class="topbar">
          <button id="p1" class="btn ${personKey==='person1'?'active':''}">HOMME</button>
          <button id="p2" class="btn ${personKey==='person2'?'active':''}">FEMME</button>
        </div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x}%; top:${s.y}%; --icon-color:${s.color}">
            <div class="icon-box">${s.icon.includes(':') ? `<ha-icon icon="${s.icon}"></ha-icon>` : s.icon}</div>
            <div class="label" style="color:${s.color}">${s.name || '---'}</div>
            <div id="value-${i}" class="val">--</div>
          </div>
        `).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('p1').onclick = () => { this.currentPerson = 'person1'; this.render(); };
    this.shadowRoot.getElementById('p2').onclick = () => { this.currentPerson = 'person2'; this.render(); };
    this.enableDrag();
    this.updateSensors();
  }

  enableDrag() {
    const container = this.shadowRoot.querySelector('.main-container');
    const personKey = this.currentPerson || 'person1';
    
    (this._config[personKey].sensors || []).forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      if (!el) return;

      el.onmousedown = (e) => {
        this._isDragging = true;
        const rect = container.getBoundingClientRect();

        const onMouseMove = (ev) => {
          s.x = Math.round(Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)));
          s.y = Math.round(Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100)));
          el.style.left = s.x + '%';
          el.style.top = s.y + '%';
          const line = this.shadowRoot.getElementById(`line-${i}`);
          if (line) { line.setAttribute('x2', s.x + '%'); line.setAttribute('y2', s.y + '%'); }
        };

        const onMouseUp = () => {
          this._isDragging = false;
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          
          // FORCE UPDATE: On recrée l'objet config de zéro pour forcer la détection
          const newConfig = JSON.parse(JSON.stringify(this._config));
          const event = new CustomEvent("config-changed", {
            detail: { config: newConfig },
            bubbles: true,
            composed: true
          });
          this.dispatchEvent(event);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };
    });
  }
}

// EDITOR V13 (STABLE SYNC)
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); }
  set hass(hass) { this._hass = hass; }
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  render() {
    if (!this._config) return;
    const tab = this._currentTab || 'person1';
    const person = this._config[tab];

    this.innerHTML = `
      <style>
        .ed-wrap { padding: 12px; color: var(--primary-text-color); }
        .section { background: rgba(128,128,128,0.1); padding: 10px; border-radius: 8px; margin-bottom: 10px; }
        .tabs { display: flex; gap: 4px; margin-bottom: 10px; }
        .tab { flex: 1; padding: 10px; cursor: pointer; background: rgba(128,128,128,0.2); border-radius: 4px; text-align:center; }
        .tab.active { background: #38bdf8; color: white; }
        .sensor-item { border: 1px solid rgba(128,128,128,0.3); padding: 10px; margin-bottom: 10px; border-radius: 8px; position: relative; }
        input { width: 100%; padding: 8px; margin: 4px 0; box-sizing: border-box; background: var(--card-background-color); color: var(--primary-text-color); border: 1px solid #ccc; border-radius: 4px;}
        .results-list { position: absolute; width: 95%; max-height: 120px; overflow-y: auto; background: white; z-index: 1000; color: black; border: 1px solid #ccc; display:none; }
        .results-list div { padding: 8px; cursor: pointer; border-bottom: 1px solid #eee; }
      </style>
      <div class="ed-wrap">
        <div class="section">
          <label>Hauteur: ${this._config.card_height}px</label>
          <input type="range" id="card-h" min="300" max="800" step="10" value="${this._config.card_height}">
          <label>Offset Image: ${this._config.img_offset}%</label>
          <input type="range" id="img-pos" min="0" max="100" value="${this._config.img_offset}">
        </div>

        <div class="tabs">
          <div class="tab ${tab==='person1'?'active':''}" data-t="person1">Homme</div>
          <div class="tab ${tab==='person2'?'active':''}" data-t="person2">Femme</div>
        </div>

        <div id="sensors-list">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <input type="text" class="in-ent" data-idx="${i}" placeholder="Chercher entité..." value="${s.entity}">
              <div class="results-list" id="res-${i}"></div>
              <input type="text" class="in-lab" data-idx="${i}" placeholder="Label" value="${s.name}">
              <input type="text" class="in-ico" data-idx="${i}" placeholder="Icône" value="${s.icon}">
              <button class="del-btn" data-idx="${i}" style="width:100%; background:#ef4444; color:white; border:none; padding:8px; margin-top:5px; border-radius:4px; cursor:pointer;">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button id="add-s" style="width:100%; padding:12px; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">➕ Ajouter un capteur</button>
      </div>
    `;

    this._setupEvents();
  }

  _setupEvents() {
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._currentTab = t.dataset.t; this.render(); });
    this.querySelector('#card-h').onchange = (e) => { this._config.card_height = e.target.value; this._fire(); };
    this.querySelector('#img-pos').onchange = (e) => { this._config.img_offset = e.target.value; this._fire(); };
    
    const tab = this._currentTab || 'person1';

    this.querySelectorAll('.in-ent').forEach(inp => {
      inp.oninput = (e) => {
        const idx = e.target.dataset.idx;
        const val = e.target.value.toLowerCase();
        const res = this.querySelector(`#res-${idx}`);
        this._config[tab].sensors[idx].entity = e.target.value;
        this._fire();

        if (val.length < 2) { res.style.display = 'none'; return; }
        const matches = Object.keys(this._hass.states).filter(k => k.includes(val)).slice(0, 10);
        res.innerHTML = matches.map(m => `<div data-v="${m}">${m}</div>`).join('');
        res.style.display = 'block';
        res.querySelectorAll('div').forEach(d => d.onclick = () => {
          this._config[tab].sensors[idx].entity = d.dataset.v;
          inp.value = d.dataset.v;
          res.style.display = 'none';
          this._fire();
        });
      };
    });

    this.querySelectorAll('.in-lab').forEach(el => el.oninput = (e) => { this._config[tab].sensors[el.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.in-ico').forEach(el => el.oninput = (e) => { this._config[tab].sensors[el.dataset.idx].icon = e.target.value; this._fire(); });

    this.querySelector('#add-s').onclick = () => {
      if(!this._config[tab].sensors) this._config[tab].sensors = [];
      this._config[tab].sensors.push({ entity: '', name: 'Nouveau', icon: 'mdi:pulse', color: '#38bdf8', x: 50, y: 50 });
      this.render(); this._fire();
    };

    this.querySelectorAll('.del-btn').forEach(b => b.onclick = () => {
      this._config[tab].sensors.splice(b.dataset.idx, 1);
      this.render(); this._fire();
    });
  }

  _fire() {
    const newConfig = JSON.parse(JSON.stringify(this._config));
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V13", description: "Synchronisation YAML forcée." });
