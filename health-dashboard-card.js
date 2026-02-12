// HEALTH DASHBOARD CARD – VERSION V15 (DEBOUNCED & MANUAL INPUT)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isDragging = false;
    this.currentPerson = 'person1';
    this._saveTimer = null;
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._isDragging) this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this._config || !this.shadowRoot) return;
    const person = this._config[this.currentPerson];
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
    const person = this._config[this.currentPerson];
    const imageUrl = person.image || (person.gender === 'female' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' 
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; touch-action: none; border: 1px solid #334155; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center ${this._config.img_offset || 50}% / cover no-repeat; opacity: 0.4; pointer-events: none; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 12px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 10; }
        .btn { border: none; padding: 6px 14px; border-radius: 15px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: bold; }
        .btn.active { background: #38bdf8; box-shadow: 0 0 10px rgba(56, 189, 248, 0.5); }
        .sensor { position: absolute; transform: translate(-50%, -50%); padding: 6px; border-radius: 8px; width: 22%; min-width: 75px; text-align: center; z-index: 5; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.3); cursor: grab; transition: transform 0.1s; }
        .sensor:active { cursor: grabbing; transform: translate(-50%, -50%) scale(1.05); border-color: #38bdf8; }
        .icon-box { font-size: 1.2em; color: var(--icon-color); }
        .label { font-size: 0.6em; text-transform: uppercase; margin-top: 2px; color: #cbd5e1; }
        .val { font-size: 0.85em; font-weight: 800; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s, i) => `<line id="line-${i}" x1="50%" y1="${this._config.img_offset || 50}%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1" stroke-dasharray="3" opacity="0.3"/>`).join('')}</svg>
        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">HOMME</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">FEMME</button>
        </div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" style="left:${s.x}%; top:${s.y}%; --icon-color:${s.color}">
            <div class="icon-box">${s.icon.includes(':') ? `<ha-icon icon="${s.icon}"></ha-icon>` : s.icon}</div>
            <div class="label">${s.name || '---'}</div>
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
    const person = this._config[this.currentPerson];
    
    (person.sensors || []).forEach((s, i) => {
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
          
          // Debounce : on attend 500ms après le relâchement pour sauvegarder
          clearTimeout(this._saveTimer);
          this._saveTimer = setTimeout(() => {
            this.dispatchEvent(new CustomEvent("config-changed", {
              detail: { config: this._config },
              bubbles: true,
              composed: true
            }));
          }, 500);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };
    });
  }
}

// EDITOR V15 (MANUAL POSITION INPUTS)
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
        .ed-wrap { padding: 12px; font-family: sans-serif; }
        .tabs { display: flex; gap: 4px; margin-bottom: 15px; }
        .tab { flex: 1; padding: 10px; cursor: pointer; background: #eee; text-align:center; border-radius: 4px; font-weight: bold; }
        .tab.active { background: #38bdf8; color: white; }
        .sensor-item { border: 1px solid #ccc; padding: 12px; margin-bottom: 12px; border-radius: 8px; background: #fafafa; }
        .pos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; background: #e2e8f0; padding: 8px; border-radius: 4px; }
        label { font-size: 11px; font-weight: bold; color: #475569; }
        input { width: 100%; padding: 8px; margin: 4px 0; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 4px; }
        .help-text { font-size: 11px; color: #64748b; margin-top: 10px; line-height: 1.4; }
      </style>
      <div class="ed-wrap">
        <div style="margin-bottom: 15px;">
           <label>Hauteur Carte (pixels)</label>
           <input type="number" id="card-h" value="${this._config.card_height || 550}">
        </div>
        
        <div class="tabs">
          <div class="tab ${tab==='person1'?'active':''}" data-t="person1">Homme</div>
          <div class="tab ${tab==='person2'?'active':''}" data-t="person2">Femme</div>
        </div>

        <div id="sensors-list">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <strong>Capteur: ${s.name || 'Sans nom'}</strong>
              <input type="text" class="in-lab" data-idx="${i}" placeholder="Nom" value="${s.name}">
              <input type="text" class="in-ent" data-idx="${i}" placeholder="Entité" value="${s.entity}">
              
              <div class="pos-grid">
                <div>
                  <label>Position X (%)</label>
                  <input type="number" class="in-x" data-idx="${i}" value="${s.x}" min="0" max="100">
                </div>
                <div>
                  <label>Position Y (%)</label>
                  <input type="number" class="in-y" data-idx="${i}" value="${s.y}" min="0" max="100">
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="help-text">
          💡 <strong>Astuce :</strong> Si le déplacement à la souris ne s'enregistre pas, modifiez directement les chiffres X et Y ci-dessus. <br>
          X = Gauche/Droite (0 à 100) | Y = Haut/Bas (0 à 100).
        </div>
      </div>
    `;

    this._setupEvents();
  }

  _setupEvents() {
    const tab = this._currentTab || 'person1';
    
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._currentTab = t.dataset.t; this.render(); });
    
    this.querySelector('#card-h').onchange = (e) => { this._config.card_height = parseInt(e.target.value); this._fire(); };

    this.querySelectorAll('.in-lab').forEach(inp => {
      inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].name = e.target.value; this._fire(); };
    });

    this.querySelectorAll('.in-ent').forEach(inp => {
      inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].entity = e.target.value; this._fire(); };
    });

    // ÉVÉNEMENTS POUR LES CHASSIS X ET Y (FORCE LE YAML)
    this.querySelectorAll('.in-x').forEach(inp => {
      inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].x = parseInt(e.target.value); this._fire(); };
    });

    this.querySelectorAll('.in-y').forEach(inp => {
      inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].y = parseInt(e.target.value); this._fire(); };
    });
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V15", description: "Correction ultime placement." });
