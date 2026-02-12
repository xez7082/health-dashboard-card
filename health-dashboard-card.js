// HEALTH DASHBOARD CARD – VERSION V14 (MANUAL SYNC BRIDGE)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isDragging = false;
    this.currentPerson = 'person1';
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
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; touch-action: none; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center ${this._config.img_offset || 50}% / cover no-repeat; opacity: 0.4; pointer-events: none; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 12px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 10; }
        .btn { border: none; padding: 6px 14px; border-radius: 15px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: bold; }
        .btn.active { background: #38bdf8; }
        .save-btn { position: absolute; bottom: 10px; left: 10px; background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 4px; font-size: 10px; cursor: pointer; z-index: 20; display: none; }
        .sensor { position: absolute; transform: translate(-50%, -50%); padding: 6px; border-radius: 8px; width: 22%; min-width: 70px; text-align: center; z-index: 5; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.3); cursor: grab; }
        .icon-box { font-size: 1.2em; color: var(--icon-color); }
        .label { font-size: 0.6em; text-transform: uppercase; margin-top: 2px; }
        .val { font-size: 0.85em; font-weight: 800; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s, i) => `<line id="line-${i}" x1="50%" y1="${this._config.img_offset || 50}%" x2="${s.x}%" y2="${s.y}%" stroke="${s.color}" stroke-width="1" stroke-dasharray="3" opacity="0.3"/>`).join('')}</svg>
        <div class="topbar">
          <button id="p1" class="btn ${this.currentPerson==='person1'?'active':''}">HOMME</button>
          <button id="p2" class="btn ${this.currentPerson==='person2'?'active':''}">FEMME</button>
        </div>
        <button id="manual-save" class="save-btn">💾 APPLIQUER POSITIONS</button>
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
    this.shadowRoot.getElementById('manual-save').onclick = () => this._forceSync();
    
    this.enableDrag();
    this.updateSensors();
  }

  _forceSync() {
    const event = new CustomEvent("config-changed", {
      detail: { config: JSON.parse(JSON.stringify(this._config)) },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
    this.shadowRoot.getElementById('manual-save').style.display = 'none';
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
        this.shadowRoot.getElementById('manual-save').style.display = 'block';

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
          // On essaie la sync auto mais le bouton reste au cas où
          this._forceSync();
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };
    });
  }
}

// EDITOR V14
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
        .ed-wrap { padding: 12px; }
        .tabs { display: flex; gap: 4px; margin-bottom: 10px; }
        .tab { flex: 1; padding: 10px; cursor: pointer; background: #eee; text-align:center; border-radius: 4px; }
        .tab.active { background: #38bdf8; color: white; }
        .sensor-item { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 8px; }
        input { width: 100%; padding: 8px; margin: 4px 0; box-sizing: border-box; }
      </style>
      <div class="ed-wrap">
        <label>Hauteur Carte (px)</label>
        <input type="number" id="card-h" value="${this._config.card_height || 550}">
        
        <div class="tabs">
          <div class="tab ${tab==='person1'?'active':''}" data-t="person1">Homme</div>
          <div class="tab ${tab==='person2'?'active':''}" data-t="person2">Femme</div>
        </div>

        <div id="sensors-list">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <strong>${s.name || 'Sensor'} (X: ${s.x}%, Y: ${s.y}%)</strong>
              <input type="text" class="in-ent" data-idx="${i}" placeholder="Entité" value="${s.entity}">
              <input type="text" class="in-lab" data-idx="${i}" placeholder="Label" value="${s.name}">
            </div>
          `).join('')}
        </div>
        <p style="font-size: 10px; color: #666;">Note: Après avoir déplacé une bulle sur la carte, cliquez sur "Sauvegarder" dans l'éditeur HA pour figer les positions.</p>
      </div>
    `;

    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._currentTab = t.dataset.t; this.render(); });
    this.querySelector('#card-h').onchange = (e) => { this._config.card_height = e.target.value; this._fire(); };
    this.querySelectorAll('.in-ent').forEach(inp => {
      inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].entity = e.target.value; this._fire(); };
    });
    this.querySelectorAll('.in-lab').forEach(inp => {
      inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].name = e.target.value; this._fire(); };
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
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V14", description: "Bouton de sauvegarde forcée." });
