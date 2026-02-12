// HEALTH DASHBOARD CARD – VERSION V29 (IMC TEXT & LABEL POSITIONING)
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
    if (!this._config.imc_width) this._config.imc_width = 160;
    if (!this._config.imc_height) this._config.imc_height = 60;
    if (!this._config.imc_text_size) this._config.imc_text_size = 10;
    if (!this._config.imc_label_pos) this._config.imc_label_pos = 5; // Position du titre (bottom px)
    if (!this._config.imc_val_pos) this._config.imc_val_pos = 25; // Position de la flèche/valeur (top %)
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this.shadowRoot) return;
    const person = this._config[this._config.current_view];
    if (!person || !person.sensors) return;
    
    person.sensors.forEach((s, i) => {
      const isIMC = s.entity && (s.entity.toLowerCase().includes('corpulence') || s.entity.toLowerCase().includes('imc'));
      if (isIMC) {
        const pointer = this.shadowRoot.getElementById(`pointer-${i}`);
        if (pointer) {
          const poids = parseFloat(this._hass.states['sensor.withings_poids_patrick']?.state || 0);
          const taille = parseFloat(this._hass.states['input_number.taille_en_m_patrick']?.state || 1.75);
          const imc = poids > 0 ? (poids / (taille * taille)).toFixed(1) : 0;
          let pos = ((imc - 10) * 2.5) + 5;
          pos = Math.max(5, Math.min(95, pos));
          pointer.style.left = `${pos}%`;
          pointer.setAttribute('data-imc', imc > 0 ? imc : '--');
        }
      } else {
        const el = this.shadowRoot.getElementById(`value-${i}`);
        const stateObj = this._hass.states[s.entity];
        if (el && stateObj) {
          el.textContent = `${stateObj.state}${stateObj.attributes.unit_of_measurement || ''}`;
        }
      }
    });
  }

  render() {
    if (!this._config) return;
    const personKey = this._config.current_view;
    const person = this._config[personKey] || { sensors: [] };
    
    const imageUrl = person.image || (personKey === 'person2' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' 
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center 50% / cover no-repeat; opacity: 0.5; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; cursor: pointer; background: rgba(0,0,0,0.5); color: white; font-size: 11px; font-weight: bold; }
        .btn.active { background: #38bdf8; border-color: #38bdf8; }
        
        .sensor { position: absolute; transform: translate(-50%, -50%); width: ${this._config.b_width}px; height: ${this._config.b_height}px; border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; overflow: hidden; }
        
        .sensor.imc-type { 
          width: ${this._config.imc_width}px; 
          height: ${this._config.imc_height}px; 
          background: #1e293b url("/local/images/33.png") center/cover no-repeat; 
          border: 1px solid #fff; 
        }
        
        .gauge-wrap { position: relative; width: 100%; height: 100%; }
        .pointer { position: absolute; top: ${this._config.imc_val_pos}%; width: 20px; height: 20px; transition: left 1s ease; }
        .pointer::after { 
          content: attr(data-imc); display: block; width: 40px; color: white; font-weight: bold; 
          font-size: ${this._config.imc_text_size}px; text-shadow: 1px 1px 2px #000; 
          background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='white' d='M7,10L12,15L17,10H7Z' stroke='black' stroke-width='0.5'/></svg>") no-repeat center bottom; 
          background-size: ${this._config.imc_text_size * 1.5}px; padding-bottom: 10px; transform: translateX(-25%); 
        }
        
        .corp-label { 
          position: absolute; bottom: ${this._config.imc_label_pos}px; width: 100%; 
          font-size: ${this._config.imc_text_size}px; text-align: center; color: white; 
          font-weight: bold; text-shadow: 1px 1px 2px #000; text-transform: uppercase; 
        }
        
        .icon-box { font-size: 1.5em; color: #38bdf8; }
        .label { font-size: 0.7em; color: #cbd5e1; }
        .val { font-size: 0.9em; font-weight: bold; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${personKey==='person1'?'active':''}">HOMME</button>
          <button id="bt2" class="btn ${personKey==='person2'?'active':''}">FEMME</button>
        </div>
        <div class="bg"></div>
        ${(person.sensors || []).map((s, i) => {
          const isIMC = s.entity && (s.entity.toLowerCase().includes('corpulence') || s.entity.toLowerCase().includes('imc'));
          if (isIMC) {
            return `<div class="sensor imc-type" style="left:${s.x}%; top:${s.y}%"><div class="gauge-wrap"><div id="pointer-${i}" class="pointer" data-imc="--"></div><div class="corp-label">${s.name || 'CORPULENCE'}</div></div></div>`;
          } else {
            return `<div class="sensor" style="left:${s.x}%; top:${s.y}%"><div class="icon-box"><ha-icon icon="${s.icon || 'mdi:pulse'}"></ha-icon></div><div class="label">${s.name || ''}</div><div id="value-${i}" class="val">--</div></div>`;
          }
        }).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
    this.updateSensors();
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

// EDITOR V29
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  render() {
    if (!this._config || !this._hass) return;
    const tab = this._config.current_view || 'person1';
    const person = this._config[tab] || { sensors: [] };
    this.innerHTML = `
      <style>
        .ed-wrap { padding: 12px; font-family: sans-serif; }
        .section { background: #f0f4f8; padding: 10px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #d1d5db; }
        .s-item { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 8px; background: white; }
        input[type="range"] { width: 100%; margin: 5px 0; }
        label { font-size: 10px; font-weight: bold; color: #444; text-transform: uppercase; display: block; margin-top: 5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        h4 { margin: 0 0 10px 0; font-size: 11px; color: #1e293b; border-bottom: 1px solid #38bdf8; padding-bottom: 5px; }
      </style>
      <div class="ed-wrap">
        <div class="section">
          <h4>⚖️ RÉGLAGES JAUGE IMC (33.png)</h4>
          <div class="grid">
            <div><label>Largeur</label><input type="number" id="iw" value="${this._config.imc_width}"></div>
            <div><label>Hauteur</label><input type="number" id="ih" value="${this._config.imc_height}"></div>
          </div>
          <label>Taille du texte : ${this._config.imc_text_size}px</label>
          <input type="range" id="its" min="8" max="20" value="${this._config.imc_text_size}">
          
          <label>Position verticale Titre (Bas)</label>
          <input type="range" id="ilp" min="-10" max="50" value="${this._config.imc_label_pos}">
          
          <label>Position verticale Curseur/Valeur (Haut)</label>
          <input type="range" id="ivp" min="0" max="80" value="${this._config.imc_val_pos}">
        </div>

        <div class="section">
          <h4>📏 BULLES STANDARDS</h4>
          <div class="grid">
            <input type="number" id="bw" value="${this._config.b_width}">
            <input type="number" id="bh" value="${this._config.b_height}">
          </div>
        </div>

        <div id="list">
          ${(person.sensors || []).map((s, i) => `
            <div class="s-item">
              <input type="text" class="ent" data-idx="${i}" value="${s.entity}">
              <input type="text" class="lab" data-idx="${i}" value="${s.name || ''}">
              <div class="grid">
                <input type="number" class="ix" data-idx="${i}" value="${s.x}">
                <input type="number" class="iy" data-idx="${i}" value="${s.y}">
              </div>
              <button class="del" data-idx="${i}" style="width:100%; margin-top:5px; background:#ffcfcf; border:none; padding:4px;">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button id="add" style="width:100%; padding:10px; background:#10b981; color:white; border:none; border-radius:5px;">➕ AJOUTER</button>
      </div>`;
    this._setup();
  }
  _setup() {
    this.querySelector('#iw').onchange = (e) => { this._config.imc_width = e.target.value; this._fire(); };
    this.querySelector('#ih').onchange = (e) => { this._config.imc_height = e.target.value; this._fire(); };
    this.querySelector('#its').oninput = (e) => { this._config.imc_text_size = e.target.value; this._fire(); };
    this.querySelector('#ilp').oninput = (e) => { this._config.imc_label_pos = e.target.value; this._fire(); };
    this.querySelector('#ivp').oninput = (e) => { this._config.imc_val_pos = e.target.value; this._fire(); };
    this.querySelector('#bw').onchange = (e) => { this._config.b_width = e.target.value; this._fire(); };
    this.querySelector('#bh').onchange = (e) => { this._config.b_height = e.target.value; this._fire(); };
    this.querySelector('#add').onclick = () => { 
      const t = this._config.current_view || 'person1';
      if(!this._config[t]) this._config[t] = {sensors:[]};
      this._config[t].sensors.push({entity:'', name:'Nouveau', x:50, y:50}); 
      this._fire(); this.render();
    };
    this.querySelectorAll('.ent').forEach(inp => inp.onchange = (e) => { this._config[this._config.current_view].sensors[inp.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.lab').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.ix').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.iy').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].y = e.target.value; this._fire(); });
    this.querySelectorAll('.del').forEach(b => b.onclick = () => { this._config[this._config.current_view].sensors.splice(b.dataset.idx, 1); this._fire(); this.render(); });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V29" });
