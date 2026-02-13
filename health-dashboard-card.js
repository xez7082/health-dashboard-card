// HEALTH DASHBOARD CARD – VERSION 39 (CUSTOM NAMES EDITION)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    // Valeurs par défaut pour les prénoms si non définis
    if (!this._config.name_p1) this._config.name_p1 = 'HOMME';
    if (!this._config.name_p2) this._config.name_p2 = 'FEMME';
    
    if (!this._config.b_width) this._config.b_width = 85;
    if (!this._config.b_height) this._config.b_height = 65;
    if (!this._config.imc_width) this._config.imc_width = 160;
    if (!this._config.imc_height) this._config.imc_height = 60;
    if (!this._config.imc_title_size) this._config.imc_title_size = 10;
    if (!this._config.imc_val_size) this._config.imc_val_size = 11;
    if (!this._config.imc_title_pos) this._config.imc_title_pos = 45;
    if (!this._config.imc_val_pos) this._config.imc_val_pos = 25;
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
      const entityId = s.entity ? s.entity.toLowerCase() : '';
      const isIMC = entityId.includes('corpulence') || entityId.includes('imc');
      const valEl = this.shadowRoot.getElementById(`value-${i}`);
      const iconBox = this.shadowRoot.getElementById(`icon-box-${i}`);
      const stateObj = this._hass.states[s.entity];

      if (isIMC) {
        const pointer = this.shadowRoot.getElementById(`pointer-${i}`);
        if (pointer) {
          const suffix = this._config.current_view === 'person2' ? '_sandra' : '_patrick';
          const stPoids = this._hass.states['sensor.withings_poids' + suffix];
          const stTaille = this._hass.states['input_number.taille_en_m' + suffix];
          if (stPoids && stTaille) {
            const poids = parseFloat(stPoids.state || 0);
            const taille = parseFloat(stTaille.state || 1.75);
            const imc = poids > 0 ? (poids / (taille * taille)).toFixed(1) : 0;
            let pos = ((imc - 10) * 2.5) + 5;
            pos = Math.max(5, Math.min(95, pos));
            pointer.style.left = `${pos}%`;
            pointer.setAttribute('data-imc', imc > 0 ? imc : '--');
          }
        }
      } else if (valEl && stateObj) {
        let valText = stateObj.state;
        let unit = stateObj.attributes.unit_of_measurement || '';
        if (entityId.includes('hydration')) { unit = '%'; }
        valEl.textContent = `${valText}${unit}`;
        
        let color = "white";
        if (entityId.includes('difference')) {
          const valNum = parseFloat(valText);
          if (valNum < 0) color = "#4ade80"; 
          else if (valNum > 0) color = "#f87171"; 
        }
        valEl.style.color = color;
        if (iconBox) iconBox.style.color = color === "white" ? "#38bdf8" : color;
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
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; cursor: pointer; background: rgba(0,0,0,0.5); color: white; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .btn.active { background: #38bdf8; border-color: #38bdf8; }
        .sensor { position: absolute; transform: translate(-50%, -50%); width: ${this._config.b_width}px; height: ${this._config.b_height}px; border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
        .sensor.imc-type { width: ${this._config.imc_width}px; height: ${this._config.imc_height}px; background: #1e293b url("/local/images/33.png") center/cover no-repeat; border: 1px solid #fff; overflow: visible; }
        .gauge-wrap { position: relative; width: 100%; height: 100%; overflow: visible; }
        .pointer { position: absolute; top: ${this._config.imc_val_pos}%; width: 20px; height: 20px; transition: left 1s ease; }
        .pointer::after { content: attr(data-imc); display: block; width: 40px; color: white; font-weight: bold; font-size: ${this._config.imc_val_size}px; text-shadow: 1px 1px 2px #000; background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='white' d='M7,10L12,15L17,10H7Z' stroke='black' stroke-width='0.5'/></svg>") no-repeat center bottom; background-size: ${this._config.imc_val_size * 1.4}px; padding-bottom: 10px; transform: translateX(-25%); }
        .corp-label { position: absolute; bottom: ${this._config.imc_title_pos}px; width: 100%; font-size: ${this._config.imc_title_size}px; text-align: center; color: white; font-weight: bold; text-shadow: 1px 1px 2px #000; text-transform: uppercase; }
        .icon-box { font-size: 1.4em; color: #38bdf8; display: flex; align-items: center; justify-content: center; height: 24px; }
        .label { font-size: 0.7em; color: #cbd5e1; text-transform: uppercase; text-align: center; }
        .val { font-size: 0.9em; font-weight: bold; }
        ha-icon { --mdc-icon-size: 24px; width: 24px; height: 24px; }
      </style>
      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${personKey==='person1'?'active':''}">${this._config.name_p1}</button>
          <button id="bt2" class="btn ${personKey==='person2'?'active':''}">${this._config.name_p2}</button>
        </div>
        <div class="bg"></div>
        ${(person.sensors || []).map((s, i) => {
          const isIMC = s.entity && (s.entity.toLowerCase().includes('corpulence') || s.entity.toLowerCase().includes('imc'));
          if (isIMC) {
            return `<div class="sensor imc-type" style="left:${s.x}%; top:${s.y}%"><div class="gauge-wrap"><div id="pointer-${i}" class="pointer" data-imc="--"></div><div class="corp-label">${s.name || 'CORPULENCE'}</div></div></div>`;
          } else {
            const stateObj = this._hass ? this._hass.states[s.entity] : null;
            const icon = s.icon || (stateObj ? (stateObj.attributes.icon || 'mdi:heart-pulse') : 'mdi:heart-pulse');
            return `
              <div class="sensor" style="left:${s.x}%; top:${s.y}%">
                <div class="icon-box" id="icon-box-${i}"><ha-icon icon="${icon}"></ha-icon></div>
                <div class="label">${s.name || ''}</div>
                <div id="value-${i}" class="val">--</div>
              </div>`;
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

// EDITOR V39
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  render() {
    if (!this._config || !this._hass) return;
    const tab = this._config.current_view || 'person1';
    const person = this._config[tab] || { sensors: [] };
    this.innerHTML = `
      <style>
        .ed-wrap { padding: 15px; background: #111827; color: #e5e7eb; font-family: sans-serif; border-radius: 10px; }
        .section { background: #1f2937; padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #374151; }
        .tabs { display: flex; gap: 8px; margin-bottom: 15px; }
        .tab-btn { flex: 1; padding: 10px; border-radius: 6px; border: none; background: #374151; color: white; cursor: pointer; font-weight: bold; font-size: 11px; }
        .tab-btn.active { background: #0284c7; }
        label { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold; display: block; margin-top: 8px; }
        input { background: #374151; color: white; border: 1px solid #4b5563; border-radius: 4px; padding: 6px; width: 100%; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        h4 { margin: 0 0 10px 0; font-size: 11px; color: #38bdf8; text-transform: uppercase; border-bottom: 1px solid #374151; padding-bottom: 4px; }
        .s-item { background: #111827; padding: 10px; border-radius: 6px; margin-top: 10px; border-left: 3px solid #38bdf8; }
      </style>
      <div class="ed-wrap">
        <div class="section">
          <h4>👤 PERSONNALISATION PRÉNOMS</h4>
          <div class="grid">
            <div><label>Prénom Homme</label><input type="text" id="np1" value="${this._config.name_p1 || ''}"></div>
            <div><label>Prénom Femme</label><input type="text" id="np2" value="${this._config.name_p2 || ''}"></div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab-btn ${tab==='person1'?'active':''}" id="t1">CONFIG PATRICK</button>
          <button class="tab-btn ${tab==='person2'?'active':''}" id="t2">CONFIG SANDRA</button>
        </div>

        <div class="section">
          <h4>⚖️ JAUGE CORPULENCE</h4>
          <label>Position Titre (Y) : ${this._config.imc_title_pos}px</label>
          <input type="range" id="itp" min="-20" max="250" value="${this._config.imc_title_pos}">
          <div class="grid">
            <div><label>Largeur Jauge</label><input type="number" id="iw" value="${this._config.imc_width}"></div>
            <div><label>Hauteur Jauge</label><input type="number" id="ih" value="${this._config.imc_height}"></div>
          </div>
        </div>

        <div id="list">
          ${person.sensors.map((s, i) => `
            <div class="s-item">
              <label>Entité / Titre / Icône MDI</label>
              <input type="text" class="ent" data-idx="${i}" value="${s.entity}" placeholder="sensor.xyz">
              <input type="text" class="lab" data-idx="${i}" value="${s.name || ''}" placeholder="Titre">
              <input type="text" class="ico" data-idx="${i}" value="${s.icon || ''}" placeholder="mdi:heart">
              <div class="grid">
                <div><label>X %</label><input type="number" class="ix" data-idx="${i}" value="${s.x}"></div>
                <div><label>Y %</label><input type="number" class="iy" data-idx="${i}" value="${s.y}"></div>
              </div>
              <button class="del" data-idx="${i}" style="width:100%; background:#7f1d1d; color:white; border:none; padding:6px; margin-top:8px; border-radius:4px;">SUPPRIMER</button>
            </div>
          `).join('')}
        </div>
        <button id="add" style="width:100%; margin-top:15px; padding:12px; background:#065f46; color:white; border:none; border-radius:6px; font-weight:bold;">+ AJOUTER CAPTEUR</button>
      </div>`;
    this._setup();
  }
  _setup() {
    this.querySelector('#np1').onchange = (e) => { this._config.name_p1 = e.target.value; this._fire(); this.render(); };
    this.querySelector('#np2').onchange = (e) => { this._config.name_p2 = e.target.value; this._fire(); this.render(); };
    this.querySelector('#t1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#t2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
    this.querySelector('#itp').oninput = (e) => { this._config.imc_title_pos = e.target.value; this._fire(); };
    this.querySelector('#iw').onchange = (e) => { this._config.imc_width = e.target.value; this._fire(); };
    this.querySelector('#ih').onchange = (e) => { this._config.imc_height = e.target.value; this._fire(); };
    this.querySelector('#add').onclick = () => { this._config[this._config.current_view].sensors.push({entity:'', name:'Titre', x:50, y:50, icon:''}); this._fire(); this.render(); };
    this.querySelectorAll('.ent').forEach(inp => inp.onchange = (e) => { this._config[this._config.current_view].sensors[inp.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.ico').forEach(inp => inp.onchange = (e) => { this._config[this._config.current_view].sensors[inp.dataset.idx].icon = e.target.value; this._fire(); });
    this.querySelectorAll('.lab').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.ix').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.iy').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].y = e.target.value; this._fire(); });
    this.querySelectorAll('.del').forEach(b => b.onclick = () => { this._config[this._config.current_view].sensors.splice(b.dataset.idx, 1); this._fire(); this.render(); });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V39" });
