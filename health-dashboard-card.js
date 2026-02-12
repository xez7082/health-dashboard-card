// HEALTH DASHBOARD CARD – VERSION V26 (RESTORED UI & STABLE GAUGE)
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
    if (!this._hass || !this.shadowRoot) return;
    const person = this._config[this._config.current_view];
    if (!person || !person.sensors) return;
    
    person.sensors.forEach((s, i) => {
      const stateObj = this._hass.states[s.entity];
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
    const bW = this._config.b_width;
    const bH = this._config.b_height;
    
    const imageUrl = person.image || (personKey === 'person2' 
      ? 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_female.png' 
      : 'https://raw.githubusercontent.com/home-assistant/frontend/dev/gallery/src/data/person_male.png');

    this.shadowRoot.innerHTML = `
      <style>
        .main-container { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: 12px; overflow: hidden; font-family: sans-serif; color: white; border: 1px solid #334155; }
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center 50% / cover no-repeat; opacity: 0.5; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; cursor: pointer; background: rgba(0,0,0,0.5); color: white; font-size: 11px; font-weight: bold; text-transform: uppercase; transition: 0.3s; }
        .btn.active { background: #38bdf8; border-color: #38bdf8; box-shadow: 0 0 15px rgba(56, 189, 248, 0.5); }
        
        .sensor { position: absolute; transform: translate(-50%, -50%); width: ${bW}px; height: ${bH}px; border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
        
        .sensor.imc-type { width: 160px; height: 55px; background: #1e293b url("/local/images/milcomarmy-card-alt1.png") center/cover; border: 1px solid #fff; }
        .gauge-wrap { position: relative; width: 100%; height: 100%; }
        .pointer { position: absolute; top: 35%; width: 20px; height: 20px; transition: left 1s ease; }
        .pointer::after { content: attr(data-imc); display: block; width: 40px; color: white; font-weight: bold; font-size: 11px; text-shadow: 1px 1px 2px #000; background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='white' d='M7,10L12,15L17,10H7Z' stroke='black' stroke-width='0.5'/></svg>") no-repeat center bottom; background-size: 15px; padding-bottom: 10px; transform: translateX(-25%); }
        .corp-label { position: absolute; bottom: 3px; width: 100%; font-size: 9px; text-align: center; color: #fff; font-weight: 900; }

        .icon-box { font-size: 1.5em; color: #38bdf8; margin-bottom: 2px; }
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
            return `<div class="sensor imc-type" style="left:${s.x}%; top:${s.y}%"><div class="gauge-wrap"><div id="pointer-${i}" class="pointer" style="left:50%" data-imc="--"></div><div class="corp-label">${s.name || 'CORPULENCE'}</div></div></div>`;
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

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

// EDITOR V26
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  render() {
    if (!this._config || !this._hass) return;
    const tab = this._config.current_view || 'person1';
    const person = this._config[tab] || { sensors: [] };
    this.innerHTML = `
      <div style="padding:10px;">
        <label>Largeur Bulles</label><input type="number" id="bw" value="${this._config.b_width}">
        <label>Hauteur Bulles</label><input type="number" id="bh" value="${this._config.b_height}">
        <hr>
        <div id="list">
          ${(person.sensors || []).map((s, i) => `
            <div style="border:1px solid #ccc; padding:5px; margin-bottom:5px;">
              <input type="text" class="ent" data-idx="${i}" value="${s.entity}" placeholder="Entité">
              <input type="text" class="lab" data-idx="${i}" value="${s.name || ''}" placeholder="Label">
              <div style="display:flex; gap:5px;">
                X:<input type="number" class="ix" data-idx="${i}" value="${s.x}">
                Y:<input type="number" class="iy" data-idx="${i}" value="${s.y}">
              </div>
            </div>
          `).join('')}
        </div>
        <button id="add">Ajouter Capteur</button>
      </div>`;
    this._setup();
  }
  _setup() {
    this.querySelector('#bw').onchange = (e) => { this._config.b_width = e.target.value; this._fire(); };
    this.querySelector('#bh').onchange = (e) => { this._config.b_height = e.target.value; this._fire(); };
    this.querySelector('#add').onclick = () => { 
      const tab = this._config.current_view || 'person1';
      if(!this._config[tab]) this._config[tab] = {sensors:[]};
      this._config[tab].sensors.push({entity:'', x:50, y:50}); 
      this._fire(); this.render(); 
    };
    this.querySelectorAll('.ent').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].entity = e.target.value; this._fire(); });
    this.querySelectorAll('.lab').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.ix').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.iy').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].y = e.target.value; this._fire(); });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V26" });
