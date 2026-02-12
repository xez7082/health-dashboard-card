// HEALTH DASHBOARD CARD – VERSION V24 (DYNAMIC IMC GAUGE)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    if (!this._config.b_width) this._config.b_width = 85;
    if (!this._config.b_height) this._config.b_height = 65;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this._config || !this.shadowRoot) return;
    const person = this._config[this._config.current_view];
    if (!person || !person.sensors) return;
    
    person.sensors.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`value-${i}`);
      const gauge = this.shadowRoot.getElementById(`gauge-container-${i}`);
      
      if (el || gauge) {
        const stateObj = this._hass.states[s.entity];
        const val = stateObj ? stateObj.state : '--';

        // Si c'est le capteur de corpulence/IMC, on anime la jauge
        if (s.entity.includes('corpulence') || s.entity.includes('imc')) {
          const poids = parseFloat(this._hass.states['sensor.withings_poids_patrick']?.state || 0);
          const taille = parseFloat(this._hass.states['input_number.taille_en_m_patrick']?.state || 1.75);
          const imc = poids > 0 ? (poids / (taille * taille)).toFixed(1) : 0;
          
          const pointer = this.shadowRoot.getElementById(`pointer-${i}`);
          if (pointer) {
            // Calcul de position : (imc - 10) * 2.5 + 5 (limité entre 5% et 95%)
            let pos = ((imc - 10) * 2.5) + 5;
            pos = Math.max(5, Math.min(95, pos));
            pointer.style.left = `${pos}%`;
            pointer.setAttribute('data-imc', imc);
          }
        } else if (el) {
          el.textContent = stateObj ? `${val}${stateObj.attributes.unit_of_measurement || ''}` : '--';
        }
      }
    });
  }

  render() {
    if (!this._config) return;
    const personKey = this._config.current_view;
    const person = this._config[personKey] || { sensors: [] };
    const bW = this._config.b_width || 85;
    const bH = this._config.b_height || 65;
    
    const imageUrl = person.image || (personKey === 'person2' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' 
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center ${this._config.img_offset || 50}% / cover no-repeat; opacity: 0.5; }
        svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
        .topbar { position: absolute; top: 12px; width: 100%; display: flex; justify-content: center; gap: 8px; z-index: 10; }
        .btn { border: none; padding: 6px 14px; border-radius: 15px; cursor: pointer; background: rgba(255,255,255,0.1); color: white; font-size: 10px; font-weight: bold; }
        .btn.active { background: #38bdf8; box-shadow: 0 0 10px #38bdf8; }
        
        .sensor { 
          position: absolute; transform: translate(-50%, -50%); 
          width: ${bW}px; height: ${bH}px; padding: 4px; border-radius: 8px; 
          text-align: center; z-index: 5; background: rgba(15, 23, 42, 0.9); 
          border: 1px solid rgba(255,255,255,0.3); display: flex; 
          flex-direction: column; justify-content: center; align-items: center;
        }

        /* STYLE SPÉCIFIQUE JAUGE IMC */
        .sensor.imc-type {
          width: 140px; height: 60px;
          background-image: url("/local/images/milcomarmy-card-alt1.png");
          background-size: cover; border: 1px solid white; box-shadow: 0 0 12px rgba(0,0,0,0.5);
        }
        .gauge-wrap { position: relative; width: 100%; height: 100%; overflow: hidden; }
        .pointer {
          position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
          width: 30px; height: 30px; transition: left 1.5s ease-in-out;
        }
        .pointer::after {
          content: attr(data-imc);
          display: block; width: 40px; color: white; font-weight: bold; font-size: 12px;
          text-shadow: 1px 1px 2px black, -1px -1px 2px black;
          background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='white' d='M7,10L12,15L17,10H7Z' stroke='black' stroke-width='0.5'/></svg>") no-repeat center bottom;
          background-size: 20px; padding-bottom: 15px;
        }
        .corp-label { position: absolute; bottom: 5px; width: 100%; font-size: 10px; color: #ddd; text-align: center; font-weight: bold; }

        .icon-box { font-size: ${Math.min(bW, bH) * 0.35}px; color: #38bdf8; }
        .label { font-size: ${Math.min(bW, bH) * 0.15}px; text-transform: uppercase; color: #cbd5e1; }
        .val { font-size: ${Math.min(bW, bH) * 0.22}px; font-weight: 800; }
      </style>
      <div class="main-container">
        <div class="bg"></div>
        <svg>${(person.sensors || []).map((s) => `<line x1="50%" y1="${this._config.img_offset || 50}%" x2="${s.x}%" y2="${s.y}%" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3" opacity="0.2"/>`).join('')}</svg>
        <div class="topbar">
          <button id="bt1" class="btn ${personKey==='person1'?'active':''}">HOMME</button>
          <button id="bt2" class="btn ${personKey==='person2'?'active':''}">FEMME</button>
        </div>
        ${(person.sensors || []).map((s, i) => {
          const isIMC = s.entity.includes('corpulence') || s.entity.includes('imc');
          if (isIMC) {
            return `
              <div class="sensor imc-type" style="left:${s.x}%; top:${s.y}%">
                <div class="gauge-wrap" id="gauge-container-${i}">
                  <div id="pointer-${i}" class="pointer" style="left: 50%;" data-imc="--"></div>
                  <div class="corp-label">${this._hass.states[s.entity]?.state || ''}</div>
                </div>
              </div>`;
          } else {
            return `
              <div class="sensor" style="left:${s.x}%; top:${s.y}%">
                <div class="icon-box"><ha-icon icon="${s.icon || 'mdi:pulse'}"></ha-icon></div>
                <div class="label">${s.name || ''}</div>
                <div id="value-${i}" class="val">--</div>
              </div>`;
          }
        }).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); };
    this.updateSensors();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

// EDITOR V24 (Sans changement majeur pour rester compatible)
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }
  render() {
    if (!this._config || !this._hass) return;
    const currentTab = this._config.current_view || 'person1';
    const person = this._config[currentTab] || { sensors: [] };
    this.innerHTML = `
      <style>
        .ed-wrap { padding: 12px; font-family: sans-serif; }
        .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
        .tab { flex: 1; padding: 10px; cursor: pointer; background: #e2e8f0; text-align:center; border-radius: 6px; font-weight: bold; }
        .tab.active { background: #38bdf8; color: white; }
        .sensor-item { border: 1px solid #cbd5e1; padding: 10px; margin-bottom: 10px; border-radius: 8px; background: #f8fafc; }
        input { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        label { font-size: 11px; font-weight: bold; }
      </style>
      <div class="ed-wrap">
        <label>↔️ Largeur / ↕️ Hauteur Bulles</label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <input type="number" id="b-width" value="${this._config.b_width}">
          <input type="number" id="b-height" value="${this._config.b_height}">
        </div>
        <div class="tabs">
          <div class="tab ${currentTab==='person1'?'active':''}" data-t="person1">♂ HOMME</div>
          <div class="tab ${currentTab==='person2'?'active':''}" data-t="person2">♀ FEMME</div>
        </div>
        <div id="sensors-list">
          ${(person.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <label>Entité (Utilisez sensor.corpulence_xxx pour la jauge)</label>
              <input type="text" class="in-search" data-idx="${i}" value="${s.entity}">
              <label>Nom</label>
              <input type="text" class="in-lab" data-idx="${i}" value="${s.name || ''}">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <input type="number" class="in-x" data-idx="${i}" value="${s.x}">
                <input type="number" class="in-y" data-idx="${i}" value="${s.y}">
              </div>
              <button class="btn-del" data-idx="${i}" style="width:100%; background:#fca5a5; border:none; padding:5px; border-radius:4px; margin-top:5px;">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button id="add-sensor" style="width:100%; padding:10px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:bold;">➕ AJOUTER CAPTEUR</button>
      </div>
    `;
    this._setupEvents();
  }
  _setupEvents() {
    this.querySelector('#b-width').onchange = (e) => { this._config.b_width = parseInt(e.target.value); this._fire(); };
    this.querySelector('#b-height').onchange = (e) => { this._config.b_height = parseInt(e.target.value); this._fire(); };
    this.querySelectorAll('.tab').forEach(t => t.onclick = () => { this._config.current_view = t.dataset.t; this._fire(); });
    const tab = this._config.current_view || 'person1';
    this.querySelectorAll('.in-search').forEach(inp => { inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].entity = e.target.value; this._fire(); }; });
    this.querySelectorAll('.in-lab').forEach(inp => { inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].name = e.target.value; this._fire(); }; });
    this.querySelectorAll('.in-x').forEach(inp => { inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].x = parseInt(e.target.value); this._fire(); }; });
    this.querySelectorAll('.in-y').forEach(inp => { inp.onchange = (e) => { this._config[tab].sensors[inp.dataset.idx].y = parseInt(e.target.value); this._fire(); }; });
    this.querySelector('#add-sensor').onclick = () => {
      if(!this._config[tab]) this._config[tab] = { sensors: [] };
      this._config[tab].sensors.push({ entity: '', name: 'Nouveau', icon: 'mdi:pulse', x: 50, y: 50 });
      this._fire();
    };
    this.querySelectorAll('.btn-del').forEach(btn => { btn.onclick = () => { this._config[tab].sensors.splice(btn.dataset.idx, 1); this._fire(); }; });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V24", description: "Jauge IMC dynamique intégrée." });
