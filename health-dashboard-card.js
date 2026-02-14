// HEALTH DASHBOARD CARD – VERSION 44 (FULL EDITOR + 4-POINT RULE)
class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    if (!this._config.start_weight) this._config.start_weight = 156;
    if (!this._config.comfort_weight) this._config.comfort_weight = 95;
    if (!this._config.name_p1) this._config.name_p1 = 'Patrick';
    if (!this._config.name_p2) this._config.name_p2 = 'Sandra';
    if (!this._config.b_width) this._config.b_width = 160;
    if (!this._config.b_height) this._config.b_height = 69;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  updateSensors() {
    if (!this._hass || !this.shadowRoot) return;
    const person = this._config[this._config.current_view];
    const suffix = this._config.current_view === 'person2' ? '_sandra' : '_patrick';
    
    // 1. Mise à jour de la Règle de Progression
    const stPoids = this._hass.states['sensor.withings_poids' + suffix];
    const stGoal = this._hass.states['sensor.withings_weight_goal' + (this._config.current_view === 'person2' ? '_2' : '')];
    const progPointer = this.shadowRoot.getElementById('progression-pointer');
    const comfortMarker = this.shadowRoot.getElementById('marker-comfort');
    const comfortLabel = this.shadowRoot.getElementById('label-comfort');

    if (stPoids && progPointer) {
        const actuel = parseFloat(stPoids.state);
        const depart = parseFloat(this._config.start_weight);
        const confort = parseFloat(this._config.comfort_weight);
        const final = stGoal ? parseFloat(stGoal.state) : confort - 5;
        
        const totalRange = depart - final;
        const getPos = (val) => {
            let p = ((depart - val) / totalRange) * 100;
            return Math.max(0, Math.min(100, p));
        };

        progPointer.style.left = `${getPos(actuel)}%`;
        progPointer.setAttribute('data-val', `${actuel}kg`);
        
        const posComfort = getPos(confort);
        if (comfortMarker) comfortMarker.style.left = `${posComfort}%`;
        if (comfortLabel) comfortLabel.style.left = `${posComfort}%`;
    }

    // 2. Mise à jour des Capteurs (Bulles)
    if (!person || !person.sensors) return;
    person.sensors.forEach((s, i) => {
      const valEl = this.shadowRoot.getElementById(`value-${i}`);
      const iconBox = this.shadowRoot.getElementById(`icon-box-${i}`);
      const stateObj = this._hass.states[s.entity];

      if (valEl && stateObj) {
        let valText = stateObj.state;
        let unit = stateObj.attributes.unit_of_measurement || '';
        valEl.textContent = `${valText}${unit}`;
        
        let color = s.color || "white";
        if (s.entity.includes('difference')) {
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
        .bg { position: absolute; inset: 0; background: url('${imageUrl}') center ${this._config.img_offset || 0}% / cover no-repeat; opacity: 0.4; }
        .topbar { position: absolute; top: 15px; width: 100%; display: flex; justify-content: center; gap: 10px; z-index: 100; }
        .btn { border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; cursor: pointer; background: rgba(0,0,0,0.5); color: white; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .btn.active { background: #38bdf8; border-color: #38bdf8; }

        .rule-container { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); width: 85%; height: 70px; z-index: 30; }
        .rule-track { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 30px; border: 1px solid rgba(255,255,255,0.2); }
        .prog-pointer { position: absolute; top: -15px; width: 4px; height: 35px; background: #38bdf8; transition: left 1s ease; z-index: 10; border-radius: 2px; box-shadow: 0 0 10px #38bdf8; }
        .prog-pointer::after { content: attr(data-val); position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap; }
        .marker { position: absolute; top: 0; width: 2px; height: 12px; background: rgba(255,255,255,0.5); }
        .marker-label { position: absolute; top: 18px; font-size: 9px; text-transform: uppercase; white-space: nowrap; transform: translateX(-50%); text-align: center; font-weight: bold; }
        
        .sensor { position: absolute; transform: translate(-50%, -50%); width: ${this._config.b_width}px; height: ${this._config.b_height}px; border-radius: 8px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
        .val { font-size: 1.1em; font-weight: bold; }
        ha-icon { --mdc-icon-size: 28px; width: 28px; height: 28px; }
      </style>

      <div class="main-container">
        <div class="topbar">
          <button id="bt1" class="btn ${personKey==='person1'?'active':''}">${this._config.name_p1}</button>
          <button id="bt2" class="btn ${personKey==='person2'?'active':''}">${this._config.name_p2}</button>
        </div>
        <div class="bg"></div>

        <div class="rule-container">
            <div class="rule-track">
                <div class="marker" style="left: 0;"></div>
                <div class="marker-label" style="left: 0; color: #f87171;">DÉPART<br>${this._config.start_weight}kg</div>
                <div id="marker-comfort" class="marker"></div>
                <div id="label-comfort" class="marker-label" style="color: #fbbf24;">CONFORT<br>${this._config.comfort_weight}kg</div>
                <div class="marker" style="left: 100%;"></div>
                <div class="marker-label" style="left: 100%; color: #4ade80;">OBJECTIF<br>FINAL</div>
                <div id="progression-pointer" class="prog-pointer" data-val="-- kg"></div>
            </div>
        </div>

        ${(person.sensors || []).map((s, i) => `
            <div class="sensor" style="left:${s.x}%; top:${s.y}%">
              <div id="icon-box-${i}" style="color:${s.color || '#38bdf8'}"><ha-icon icon="${s.icon || 'mdi:heart-pulse'}"></ha-icon></div>
              <div style="font-size:0.8em; color:#cbd5e1;">${s.name || ''}</div>
              <div id="value-${i}" class="val">--</div>
            </div>
        `).join('')}
      </div>
    `;
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
    this.updateSensors();
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

// EDITOR V44
class HealthDashboardCardEditor extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }
  render() {
    if (!this._config || !this._hass) return;
    const tab = this._config.current_view || 'person1';
    const person = this._config[tab] || { sensors: [] };
    this.innerHTML = `
      <style>
        .ed-wrap { padding: 12px; background: #111827; color: #e5e7eb; font-family: sans-serif; }
        .section { background: #1f2937; padding: 10px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #374151; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        input, select { background: #374151; color: white; border: 1px solid #4b5563; border-radius: 4px; padding: 5px; width: 100%; box-sizing: border-box; }
        label { font-size: 10px; color: #9ca3af; text-transform: uppercase; display: block; margin-top: 5px; }
        .tab-btn { flex: 1; padding: 8px; border: none; background: #374151; color: white; cursor: pointer; font-weight: bold; }
        .tab-btn.active { background: #0284c7; }
        .s-item { background: #111827; padding: 8px; border-radius: 6px; margin-top: 8px; border-left: 3px solid #38bdf8; }
        h4 { margin: 0 0 8px 0; font-size: 12px; color: #38bdf8; }
      </style>
      <div class="ed-wrap">
        <div class="section">
          <h4>🏆 OBJECTIFS & IMAGE</h4>
          <div class="grid">
            <div><label>Départ (kg)</label><input type="number" id="sw" value="${this._config.start_weight}"></div>
            <div><label>Confort (kg)</label><input type="number" id="cw" value="${this._config.comfort_weight}"></div>
          </div>
          <div class="grid">
            <div><label>Hauteur Carte</label><input type="number" id="ch" value="${this._config.card_height || 600}"></div>
            <div><label>Offset Image %</label><input type="number" id="iof" value="${this._config.img_offset || 0}"></div>
          </div>
        </div>

        <div class="section">
          <h4>👤 PRÉNOMS</h4>
          <div class="grid">
            <div><label>Nom P1</label><input type="text" id="np1" value="${this._config.name_p1}"></div>
            <div><label>Nom P2</label><input type="text" id="np2" value="${this._config.name_p2}"></div>
          </div>
        </div>

        <div class="section">
          <h4>📐 TAILLE DES BULLES</h4>
          <div class="grid">
            <div><label>Largeur</label><input type="number" id="bw" value="${this._config.b_width}"></div>
            <div><label>Hauteur</label><input type="number" id="bh" value="${this._config.b_height}"></div>
          </div>
        </div>

        <div style="display:flex; gap:5px; margin-bottom:10px;">
          <button class="tab-btn ${tab==='person1'?'active':''}" id="t1">EDITER ${this._config.name_p1.toUpperCase()}</button>
          <button class="tab-btn ${tab==='person2'?'active':''}" id="t2">EDITER ${this._config.name_p2.toUpperCase()}</button>
        </div>

        <div id="list">
          ${person.sensors.map((s, i) => `
            <div class="s-item">
              <label>Entité</label><input type="text" class="ent" data-idx="${i}" value="${s.entity}">
              <div class="grid">
                <div><label>Titre</label><input type="text" class="lab" data-idx="${i}" value="${s.name || ''}"></div>
                <div><label>Icône MDI</label><input type="text" class="ico" data-idx="${i}" value="${s.icon || ''}"></div>
              </div>
              <div class="grid">
                <div><label>X %</label><input type="number" class="ix" data-idx="${i}" value="${s.x}"></div>
                <div><label>Y %</label><input type="number" class="iy" data-idx="${i}" value="${s.y}"></div>
              </div>
              <label>Couleur Hex (ex: #f13ba6)</label>
              <input type="text" class="col" data-idx="${i}" value="${s.color || ''}">
              <button class="del" data-idx="${i}" style="width:100%; background:#7f1d1d; color:white; border:none; padding:4px; margin-top:5px; border-radius:4px; font-size:10px;">SUPPRIMER</button>
            </div>
          `).join('')}
        </div>
        <button id="add" style="width:100%; margin-top:10px; padding:10px; background:#065f46; color:white; border:none; border-radius:4px; font-weight:bold;">+ AJOUTER UN CAPTEUR</button>
      </div>`;
    this._setup();
  }
  _setup() {
    this.querySelector('#sw').onchange = (e) => { this._config.start_weight = e.target.value; this._fire(); };
    this.querySelector('#cw').onchange = (e) => { this._config.comfort_weight = e.target.value; this._fire(); };
    this.querySelector('#ch').onchange = (e) => { this._config.card_height = e.target.value; this._fire(); };
    this.querySelector('#iof').onchange = (e) => { this._config.img_offset = e.target.value; this._fire(); };
    this.querySelector('#np1').onchange = (e) => { this._config.name_p1 = e.target.value; this._fire(); this.render(); };
    this.querySelector('#np2').onchange = (e) => { this._config.name_p2 = e.target.value; this._fire(); this.render(); };
    this.querySelector('#bw').onchange = (e) => { this._config.b_width = e.target.value; this._fire(); };
    this.querySelector('#bh').onchange = (e) => { this._config.b_height = e.target.value; this._fire(); };
    this.querySelector('#t1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#t2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };
    this.querySelector('#add').onclick = () => { this._config[this._config.current_view].sensors.push({entity:'', name:'Nouveau', x:50, y:50, icon:'', color:''}); this._fire(); this.render(); };
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
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V44" });
