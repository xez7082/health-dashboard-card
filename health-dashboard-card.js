// HEALTH DASHBOARD CARD – VERSION V27 (FULL EDITOR & IMAGE 33.PNG)
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
    const bW = this._config.b_width;
    const bH = this._config.b_height;
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
        .sensor { position: absolute; transform: translate(-50%, -50%); width: ${bW}px; height: ${bH}px; border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.2); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; overflow: hidden; }
        .sensor.imc-type { width: 160px; height: 60px; background: #1e293b url("/local/images/33.png") center/cover no-repeat; border: 1px solid #fff; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        .gauge-wrap { position: relative; width: 100%; height: 100%; }
        .pointer { position: absolute; top: 30%; width: 20px; height: 20px; transition: left 1s ease; }
        .pointer::after { content: attr(data-imc); display: block; width: 40px; color: white; font-weight: bold; font-size: 11px; text-shadow: 1px 1px 2px #000; background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='white' d='M7,10L12,15L17,10H7Z' stroke='black' stroke-width='0.5'/></svg>") no-repeat center bottom; background-size: 15px; padding-bottom: 10px; transform: translateX(-25%); }
        .corp-label { position: absolute; bottom: 5px; width: 100%; font-size: 9px; text-align: center; color: white; font-weight: bold; text-shadow: 1px 1px 2px #000; }
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
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

// EDITOR V27 (COMPLET)
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
        .s-item { border: 1px solid #ddd; padding: 12px; margin-bottom: 10px; border-radius: 8px; background: #f9f9f9; }
        input { width: 100%; padding: 8px; margin: 4px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        label { font-size: 11px; font-weight: bold; color: #555; text-transform: uppercase; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .search-res { background: white; border: 1px solid #38bdf8; max-height: 100px; overflow-y: auto; display: none; cursor: pointer; }
        .search-item { padding: 5px; font-size: 12px; border-bottom: 1px solid #eee; }
      </style>
      <div class="ed-wrap">
        <div class="grid">
          <div><label>Largeur Bulles</label><input type="number" id="bw" value="${this._config.b_width}"></div>
          <div><label>Hauteur Bulles</label><input type="number" id="bh" value="${this._config.b_height}"></div>
        </div>
        <hr>
        <div id="list">
          ${(person.sensors || []).map((s, i) => `
            <div class="s-item">
              <label>Entité (sensor.corpulence_xxx pour jauge)</label>
              <input type="text" class="ent" data-idx="${i}" value="${s.entity}" placeholder="sensor.xxx">
              <div class="search-res" id="res-${i}"></div>
              <label>Nom Affiché</label>
              <input type="text" class="lab" data-idx="${i}" value="${s.name || ''}">
              <label>Icône MDI</label>
              <input type="text" class="ico" data-idx="${i}" value="${s.icon || 'mdi:heart'}">
              <div class="grid">
                <div><label>Position X %</label><input type="number" class="ix" data-idx="${i}" value="${s.x}"></div>
                <div><label>Position Y %</label><input type="number" class="iy" data-idx="${i}" value="${s.y}"></div>
              </div>
              <button class="del" data-idx="${i}" style="width:100%; margin-top:8px; background:#ffcfcf; border:none; padding:5px; color:#a30000; cursor:pointer; border-radius:4px;">Supprimer</button>
            </div>
          `).join('')}
        </div>
        <button id="add" style="width:100%; padding:12px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">➕ AJOUTER UN CAPTEUR</button>
      </div>`;
    this._setup();
  }
  _setup() {
    this.querySelector('#bw').onchange = (e) => { this._config.b_width = e.target.value; this._fire(); };
    this.querySelector('#bh').onchange = (e) => { this._config.b_height = e.target.value; this._fire(); };
    this.querySelector('#add').onclick = () => { 
      const t = this._config.current_view || 'person1';
      if(!this._config[t]) this._config[t] = {sensors:[]};
      this._config[t].sensors.push({entity:'', name:'Nouveau', icon:'mdi:pulse', x:50, y:50}); 
      this._fire(); this.render();
    };
    this.querySelectorAll('.ent').forEach(inp => {
      inp.oninput = (e) => {
        const idx = e.target.dataset.idx;
        const val = e.target.value.toLowerCase();
        const res = this.querySelector(`#res-${idx}`);
        if(val.length < 2) { res.style.display = 'none'; return; }
        const matches = Object.keys(this._hass.states).filter(eid => eid.includes(val)).slice(0, 5);
        res.innerHTML = matches.map(m => `<div class="search-item" data-eid="${m}">${m}</div>`).join('');
        res.style.display = 'block';
        res.querySelectorAll('.search-item').forEach(item => {
          item.onclick = () => {
            this._config[this._config.current_view].sensors[idx].entity = item.dataset.eid;
            res.style.display = 'none'; this._fire(); this.render();
          };
        });
      };
    });
    this.querySelectorAll('.lab').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].name = e.target.value; this._fire(); });
    this.querySelectorAll('.ico').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].icon = e.target.value; this._fire(); });
    this.querySelectorAll('.ix').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].x = e.target.value; this._fire(); });
    this.querySelectorAll('.iy').forEach(i => i.onchange = (e) => { this._config[this._config.current_view].sensors[i.dataset.idx].y = e.target.value; this._fire(); });
    this.querySelectorAll('.del').forEach(b => b.onclick = () => { this._config[this._config.current_view].sensors.splice(b.dataset.idx, 1); this._fire(); this.render(); });
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V27" });
