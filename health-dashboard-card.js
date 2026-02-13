// HEALTH DASHBOARD CARD – VERSION 40 (ULTIMATE EDITION)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    if (!this._config.name_p1) this._config.name_p1 = 'Patrick';
    if (!this._config.name_p2) this._config.name_p2 = 'Sandra';
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
        
        // Logique de couleur : Priorité à la config capteur, puis dynamique difference, puis blanc
        let color = s.color || "white";
        if (entityId.includes('difference')) {
          const valNum = parseFloat(valText);
          if (valNum < 0) color = "#4ade80"; 
          else if (valNum > 0) color = "#f87171"; 
        }
        valEl.style.color = color;
        if (iconBox) iconBox.style.color = (color === "white" || color === s.color) ? (s.color || "#38bdf8") : color;
      }
    });
  }

  render() {
    if (!this._config) return;
    const personKey = this._config.current_view;
    const person = this._config[personKey] || { sensors: [] };
    const imageUrl = person.image || (personKey === 'person2' ? '/local/femme.png' : '/local/homme.png');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 600}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center ${this._config.img_offset || 0}% / cover no-repeat; opacity: 0.5; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; cursor: pointer; background: rgba(0,0,0,0.5); color: white; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .btn.active { background: #38bdf8; border-color: #38bdf8; }
        
        .sensor { position: absolute; transform: translate(-50%, -50%); width: ${this._config.b_width || 160}px; height: ${this._config.b_height || 69}px; border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
        .sensor.imc-type { width: ${this._config.imc_width || 450}px; height: ${this._config.imc_height || 230}px; background: #1e293b url("/local/images/33.png") center/cover no-repeat; border: 1px solid #fff; overflow: visible; }
        
        .gauge-wrap { position: relative; width: 100%; height: 100%; overflow: visible; }
        .pointer { position: absolute; top: ${this._config.imc_val_pos || 44}%; width: 20px; height: 20px; transition: left 1s ease; }
        .pointer::after { 
            content: attr(data-imc); display: block; width: 60px; color: white; font-weight: bold; font-size: ${this._config.imc_text_size || 18}px; text-shadow: 1px 1px 2px #000; 
            background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='white' d='M7,10L12,15L17,10H7Z' stroke='black' stroke-width='0.5'/></svg>") no-repeat center bottom; 
            background-size: 20px; padding-bottom: 15px; transform: translateX(-35%); 
        }
        
        .corp-label { position: absolute; bottom: ${this._config.imc_title_pos || 200}px; width: 100%; font-size: ${this._config.imc_title_size || 18}px; text-align: center; color: white; font-weight: bold; text-shadow: 1px 1px 2px #000; text-transform: uppercase; }
        .icon-box { font-size: 1.6em; display: flex; align-items: center; justify-content: center; height: 28px; }
        .label { font-size: 0.8em; color: #cbd5e1; text-transform: uppercase; text-align: center; }
        .val { font-size: 1em; font-weight: bold; }
        ha-icon { --mdc-icon-size: 28px; width: 28px; height: 28px; }
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
                  <div class="icon-box" id="icon-box-${i}" style="color:${s.color || '#38bdf8'}"><ha-icon icon="${icon}"></ha-icon></div>
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

// EDITOR V40
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
        .tab-btn { flex: 1; padding: 10px; border-radius: 6px; border: none; background: #374151; color: white; cursor: pointer; font-weight: bold; }
        .tab-btn.active { background: #0284c7; }
        label { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold; display: block; margin-top: 8px; }
        input { background: #374151; color: white; border: 1px solid #4b5563; border-radius: 4px; padding: 6px; width: 100%; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        h4 { margin: 0 0 10px 0; font-size: 11px; color: #38bdf8; text-transform: uppercase; border-bottom: 1px solid #374151; padding-bottom: 4px; }
        .s-item { background: #111827; padding: 10px; border-radius: 6px; margin-top: 10px; border-left: 3px solid #38bdf8; }
      </style>
      <div class="ed-wrap">
        <div class="section">
          <h4>🖼️ CARTE ET IMAGE</h4>
          <div class="grid">
            <div><label>Hauteur Carte</label><input type="number" id="ch" value="${this._config.card_height}"></div>
            <div><label>Offset Image %</label><input type="number" id="iof" value="${this._config.img_offset}"></div>
          </div>
          <div class="grid">
            <div><label>Nom P1</label><input type="text" id="np1" value="${this._config.name_p1}"></div>
            <div><label>Nom P2</label><input type="text" id="np2" value="${this._config.name_p2}"></div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab-btn ${tab==='person1'?'active':''}" id="t1">CONFIG ${this._config.name_p1}</button>
          <button class="tab-btn ${tab==='person2'?'active':''}" id="t2">CONFIG ${this._config.name_p2}</button>
        </div>

        <div class="section">
          <h4>⚖️ JAUGE IMC</h4>
          <div class="grid">
            <div><label>Pos Titre (Y)</label><input type="number" id="itp" value="${this._config.imc_title_pos}"></div>
            <div><label>Taille Titre</label><input type="number" id="its" value="${this._config.imc_title_size}"></div>
          </div>
          <div class="grid">
            <div><label>Pos Valeur (Y%)</label><input type="number" id="ivp" value="${this._config.imc_val_pos}"></div>
            <div><label>Taille Valeur</label><input type="number" id="ivs" value="${this._config.imc_text_size}"></div>
          </div>
          <div class="grid">
            <div><label>Largeur</label><input type="number" id="iw" value="${this._config.imc_width}"></div>
            <div><label>Hauteur</label><input type="number" id="ih" value="${this._config.imc_height}"></div>
          </div>
        </div>

        <div class="section">
          <h4>📐 BULLES</h4>
          <div class="grid">
            <div><label>Largeur</label><input type="number" id="bw" value="${this._config.b_width}"></div>
            <div><label>Hauteur</label><input type="number" id="bh" value="${this._config.b_height}"></div>
          </div>
        </div>

        <div id="list">
          ${person.sensors.map((s, i) => `
            <div class="s-item">
              <label>Entité / Titre / Icône</label>
              <input type="text" class="ent" data-idx="${i}" value="${s.entity}">
              <input type="text" class="lab" data-idx="${i}" value="${s.name || ''}">
              <input type="text" class="ico" data-idx="${i}" value="${s.icon || ''}">
              <div class="grid">
                <div><label>X %</label><input type="number" class="ix" data-idx="${i}" value="${s.x}"></div>
                <div><label>Y %</label><input type="number" class="iy" data-idx="${i}" value="${s.y}"></div>
              </div>
              <label>Couleur (Hex)</label>
              <input type="text" class="col" data-idx="${i}" value="${s.color || ''}">
              <button class="del" data-idx="${i}" style="width:100%; background:#7f1d1d; color:white; border:none; padding:6px; margin-top:8px; border-radius:4px;">SUPPRIMER</button>
            </div>
          `).join('')}
        </div>
        <button id="add" style="width:100%; margin-top:15px; padding:12px; background:#065f46; color:white; border:none; border-radius:6px; font-weight:bold;">+ AJOUTER</button>
      </div>`;
    this._setup();
  }
  _setup() {
    this.querySelector('#ch').onchange = (e) => { this._config.card_height = e.target.value; this._fire(); };
    this.querySelector('#iof').onchange = (e) => { this._config.img_offset = e.target.value; this._fire(); };
    this.querySelector('#np1').onchange = (e) => { this._config.name_p1 = e.target.value; this._fire(); this.render(); };
    this.querySelector('#np2').onchange = (e) => { this._config.name_p2 = e.target.value; this._fire(); this.render(); };
    this.querySelector('#itp').onchange = (e) => { this._config.imc_title_pos = e.target.value; this._fire(); };
    this.querySelector('#its').onchange = (e) => { this._config.imc_title_size = e.target.value; this._fire(); };
    this.querySelector('#ivp').onchange = (e) => { this._config.imc_val_pos = e.target.value; this._fire(); };
    this.querySelector('#ivs').onchange = (e) => { this._config.imc_text_size = e.target.value; this._fire(); };
    this.querySelector('#iw').onchange = (e) => { this._config.imc_width = e.target.value; this._fire(); };
    this.querySelector('#ih').onchange = (e) => { this._config.imc_height = e.target.value; this._fire(); };
    this.querySelector('#bw').onchange = (e) => { this._config.b_width = e.target.value; this._fire(); };
    this.querySelector('#bh').onchange = (e) => { this._config.b_height = e.target.value; this._fire(); };
    this.querySelector('#t1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#t2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
    this.querySelector('#add').onclick = () => { this._config[this._config.current_view].sensors.push({entity:'', name:'Titre', x:50, y:50, icon:'', color:''}); this._fire(); this.render(); };
    this.querySelectorAll('.ent').forEach(inp => inp.onchange = (e) => { this._config[this._config.current_view].sensors[inp.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.ico').forEach(inp => inp.onchange = (e) => { this._config[this._config.current_view].sensors[inp.dataset.idx].icon = e.target.value; this._fire(); });
    this.querySelectorAll('.lab').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.col').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].color = e.target.value; this._fire(); });
    this.querySelectorAll('.ix').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.iy').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].y = e.target.value; this._fire(); });
    this.querySelectorAll('.del').forEach(b => b.onclick = () => { this._config[this._config.current_view].sensors.splice(b.dataset.idx, 1); this._fire(); this.render(); });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V40" });
