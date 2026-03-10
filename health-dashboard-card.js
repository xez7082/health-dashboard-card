class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  static getStubConfig() {
    return {
      type: "custom:health-dashboard-card",
      card_height: 600, card_round: 20, font_size_val: 16,
      person1: { 
        name: "Patrick", image: "", weight_ent: "", start: 85, ideal: 72, comfort: 78,
        sensors: [
          { name: "IMC", entity: "", x: 25, y: 20, is_circle: true, size: 90, icon: "mdi:scale-bathroom" },
          { name: "Pas", entity: "", x: 75, y: 20, is_circle: true, size: 90, icon: "mdi:walk" }
        ]
      },
      person2: { name: "Sandra", sensors: [] }
    };
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    const p = this._config[this._config.current_view];
    if (!p || !this.shadowRoot) return;

    // Mise à jour des capteurs
    if (p.sensors) {
      p.sensors.forEach((s, i) => {
        const el = this.shadowRoot.getElementById(`val-${i}`);
        if (el && this._hass.states[s.entity]) {
          const state = this._hass.states[s.entity];
          el.textContent = `${state.state}${state.attributes.unit_of_measurement || ''}`;
        }
      });
    }

    // Mise à jour de la règle de poids
    const wEnt = this._hass.states[p.weight_ent];
    if (wEnt) {
      const cur = parseFloat(wEnt.state);
      const range = p.start - p.ideal;
      const pct = range !== 0 ? ((p.start - cur) / range) * 100 : 0;
      const ptr = this.shadowRoot.getElementById('ptr');
      if (ptr) ptr.style.left = `${Math.max(0, Math.min(100, pct))}%`;
      const lbl = this.shadowRoot.getElementById('ptr-lbl');
      if (lbl) lbl.textContent = cur + 'kg';
    }
  }

  render() {
    if (!this._config) return;
    const view = this._config.current_view;
    const p = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        .card { position: relative; width: 100%; height: ${this._config.card_height}px; background: #0f172a; border-radius: ${this._config.card_round}px; overflow: hidden; color: white; font-family: sans-serif; }
        .bg { position: absolute; inset: 0; background: url('${p.image}') center/cover; opacity: 0.4; z-index: 0; }
        .top-nav { position: absolute; top: 20px; left: 20px; display: flex; gap: 10px; z-index: 10; }
        .btn { padding: 8px 15px; border-radius: 20px; border: 1px solid white; background: rgba(0,0,0,0.5); color: white; cursor: pointer; }
        .btn.active { background: ${accent}; color: black; border-color: ${accent}; font-weight: bold; }
        
        .box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); border: 2px solid ${accent}; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 5; backdrop-filter: blur(5px); }
        .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; margin-top: 2px; }
        .value { font-weight: 900; font-size: ${this._config.font_size_val || 16}px; }
        ha-icon { --mdc-icon-size: 24px; color: ${accent}; }

        .rule-box { position: absolute; bottom: 30px; left: 5%; width: 90%; z-index: 10; }
        .rule-track { position: relative; width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; }
        .rule-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 5px; }
        .pointer { position: absolute; top: -12px; width: 4px; height: 34px; background: white; transition: left 1s; }
        .bubble { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 2px 10px; border-radius: 5px; font-weight: 900; font-size: 12px; white-space: nowrap; }
        .marks { display: flex; justify-content: space-between; margin-top: 15px; font-size: 10px; font-weight: bold; }
      </style>
      <div class="card">
        <div class="bg"></div>
        <div class="top-nav">
          <button class="btn ${view==='person1'?'active':''}" id="p1-btn">${this._config.person1.name}</button>
          <button class="btn ${view==='person2'?'active':''}" id="p2-btn">${this._config.person2.name}</button>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.is_circle ? s.size : 130}px; height:${s.is_circle ? s.size : 70}px; border-radius:${s.is_circle ? '50%' : '10px'};">
            <ha-icon icon="${s.icon}"></ha-icon>
            <div class="label">${s.name}</div>
            <div class="value" id="val-${i}">--</div>
          </div>
        `).join('')}

        <div class="rule-box">
          <div class="rule-track">
            <div class="rule-fill"></div>
            <div id="ptr" class="pointer"><div id="ptr-lbl" class="bubble">--</div></div>
          </div>
          <div class="marks">
            <span>DÉPART: ${p.start}kg</span>
            <span style="color:#fbbf24">CONFORT: ${p.comfort}kg</span>
            <span>IDÉAL: ${p.ideal}kg</span>
          </div>
        </div>
      </div>
    `;
    this.shadowRoot.getElementById('p1-btn').onclick = () => this.switch('person1');
    this.shadowRoot.getElementById('p2-btn').onclick = () => this.switch('person2');
  }

  switch(v) { this._config.current_view = v; this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } })); this.render(); }
}

// --- EDITEUR VERSION ULTRA-SÉCURISÉE ---
class HealthDashboardCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this.render(); }

  render() {
    const view = this._config.current_view || 'person1';
    const p = this._config[view];
    
    this.innerHTML = `
      <style>
        .ed { padding: 15px; background: #1c1c1c; color: white; font-family: sans-serif; }
        .sec { border: 1px solid #444; padding: 10px; margin-bottom: 15px; border-radius: 5px; }
        label { display: block; font-size: 11px; color: #38bdf8; font-weight: bold; margin-top: 10px; }
        input { width: 100%; background: #333; border: 1px solid #555; color: white; padding: 5px; border-radius: 3px; }
        .sensor-item { background: #252525; padding: 10px; margin-top: 10px; border-left: 3px solid #38bdf8; }
      </style>
      <div class="ed">
        <h3>CONFIG GLOBALE</h3>
        <div class="sec">
          <label>Hauteur Carte (px)</label><input type="number" id="h" value="${this._config.card_height}">
          <label>Taille Police Valeurs</label><input type="number" id="fs" value="${this._config.font_size_val}">
        </div>

        <h3>PROFIL : ${view.toUpperCase()}</h3>
        <div class="sec">
          <label>Nom</label><input type="text" id="n" value="${p.name}">
          <label>Image (URL)</label><input type="text" id="img" value="${p.image}">
          <label>Entité Poids</label><input type="text" id="we" value="${p.weight_ent}">
          <div style="display:flex; gap:5px;">
            <div style="flex:1"><label>Départ</label><input type="number" id="ws" value="${p.start}"></div>
            <div style="flex:1"><label>Confort</label><input type="number" id="wc" value="${p.comfort}"></div>
            <div style="flex:1"><label>Idéal</label><input type="number" id="wi" value="${p.ideal}"></div>
          </div>
        </div>

        <h3>CAPTEURS (${p.sensors ? p.sensors.length : 0})</h3>
        <div id="sl">
          ${(p.sensors || []).map((s, i) => `
            <div class="sensor-item">
              <label>Nom / Icône</label>
              <div style="display:flex; gap:5px;"><input type="text" class="sn" data-i="${i}" value="${s.name}"> <input type="text" class="si" data-i="${i}" value="${s.icon}"></div>
              <label>Entité</label><input type="text" class="se" data-i="${i}" value="${s.entity}">
              <div style="display:flex; gap:5px;">
                <div style="flex:1"><label>X (%)</label><input type="number" class="sx" data-i="${i}" value="${s.x}"></div>
                <div style="flex:1"><label>Y (%)</label><input type="number" class="sy" data-i="${i}" value="${s.y}"></div>
                <div style="flex:1"><label>Taille</label><input type="number" class="ss" data-i="${i}" value="${s.size}"></div>
              </div>
            </div>
          `).join('')}
        </div>
        <button id="add" style="width:100%; padding:10px; margin-top:10px; background:#4ade80; color:black; border:none; font-weight:bold; cursor:pointer;">➕ AJOUTER UN CAPTEUR</button>
      </div>
    `;

    // Events de base
    const save = () => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
    
    this.querySelector('#h').onchange = (e) => { this._config.card_height = e.target.value; save(); };
    this.querySelector('#fs').onchange = (e) => { this._config.font_size_val = e.target.value; save(); };
    this.querySelector('#n').onchange = (e) => { p.name = e.target.value; save(); };
    this.querySelector('#img').onchange = (e) => { p.image = e.target.value; save(); };
    this.querySelector('#we').onchange = (e) => { p.weight_ent = e.target.value; save(); };
    this.querySelector('#ws').onchange = (e) => { p.start = e.target.value; save(); };
    this.querySelector('#wc').onchange = (e) => { p.comfort = e.target.value; save(); };
    this.querySelector('#wi').onchange = (e) => { p.ideal = e.target.value; save(); };

    // Events Capteurs
    this.querySelectorAll('.sn').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].name = e.target.value; save(); });
    this.querySelectorAll('.se').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].entity = e.target.value; save(); });
    this.querySelectorAll('.si').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].icon = e.target.value; save(); });
    this.querySelectorAll('.sx').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].x = e.target.value; save(); });
    this.querySelectorAll('.sy').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].y = e.target.value; save(); });
    this.querySelectorAll('.ss').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].size = e.target.value; save(); });

    this.querySelector('#add').onclick = () => {
      if (!p.sensors) p.sensors = [];
      p.sensors.push({ name: "Nouveau", entity: "", x: 50, y: 50, is_circle: false, size: 80, icon: "mdi:heart" });
      save();
      this.render();
    };
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V4.0", description: "Contrôle total des capteurs" });
