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
      person1: { name: "Patrick", image: "", weight_ent: "", start: 85, ideal: 72, comfort: 78, sensors: [] },
      person2: { name: "Sandra", image: "", weight_ent: "", start: 70, ideal: 60, comfort: 65, sensors: [] }
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

    if (p.sensors) {
      p.sensors.forEach((s, i) => {
        const el = this.shadowRoot.getElementById(`val-${i}`);
        if (el && this._hass.states[s.entity]) {
          const state = this._hass.states[s.entity];
          el.textContent = `${state.state}${state.attributes.unit_of_measurement || ''}`;
        }
      });
    }

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
        .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; }
        .value { font-weight: 900; font-size: ${this._config.font_size_val}px; }
        ha-icon { --mdc-icon-size: 24px; color: ${accent}; }
        .rule-box { position: absolute; bottom: 30px; left: 5%; width: 90%; z-index: 10; }
        .rule-track { position: relative; width: 100%; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; }
        .rule-fill { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 5px; }
        .pointer { position: absolute; top: -12px; width: 4px; height: 34px; background: white; transition: left 1s; }
        .bubble { position: absolute; top: -40px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 2px 10px; border-radius: 5px; font-weight: 900; font-size: 12px; }
      </style>
      <div class="card">
        <div class="bg"></div>
        <div class="top-nav">
          <button class="btn ${view==='person1'?'active':''}" onclick="this.getRootNode().host.switch('person1')">${this._config.person1.name}</button>
          <button class="btn ${view==='person2'?'active':''}" onclick="this.getRootNode().host.switch('person2')">${this._config.person2.name}</button>
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
        </div>
      </div>
    `;
  }

  switch(v) { this._config.current_view = v; this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } })); this.render(); }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() {
    super();
    this._activeTab = 'design';
  }

  setConfig(config) { this._config = config; this.render(); }

  render() {
    const view = this._config.current_view || 'person1';
    const p = this._config[view];
    
    this.innerHTML = `
      <style>
        .ed { padding: 15px; background: #1c1c1c; color: white; font-family: sans-serif; }
        .tabs-header { display: flex; gap: 5px; margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 10px; }
        .tab-btn { flex: 1; padding: 10px; background: #333; color: #aaa; border: none; cursor: pointer; border-radius: 4px; font-weight: bold; font-size: 11px; }
        .tab-btn.active { background: #38bdf8; color: black; }
        label { display: block; font-size: 11px; color: #38bdf8; font-weight: bold; margin-top: 10px; }
        input { width: 100%; background: #222; border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; box-sizing: border-box; }
        .sensor-card { background: #252525; border-left: 4px solid #38bdf8; padding: 10px; margin-bottom: 10px; }
      </style>
      <div class="ed">
        <div class="tabs-header">
          <button class="tab-btn ${this._activeTab==='design'?'active':''}" id="t-design">DESIGN</button>
          <button class="tab-btn ${this._activeTab==='profile'?'active':''}" id="t-profile">PROFIL</button>
          <button class="tab-btn ${this._activeTab==='sensors'?'active':''}" id="t-sensors">CAPTEURS</button>
        </div>

        <div id="content">
          ${this._activeTab === 'design' ? `
            <label>Hauteur Carte (px)</label><input type="number" id="h" value="${this._config.card_height}">
            <label>Arrondi Bords</label><input type="number" id="round" value="${this._config.card_round}">
            <label>Taille Police Valeurs</label><input type="number" id="fs" value="${this._config.font_size_val}">
          ` : ''}

          ${this._activeTab === 'profile' ? `
            <label>Nom Affiché</label><input type="text" id="name" value="${p.name}">
            <label>Image de fond (URL)</label><input type="text" id="img" value="${p.image}">
            <label>Entité Poids principal</label><input type="text" id="we" value="${p.weight_ent}">
            <div style="display:flex; gap:10px;">
              <div style="flex:1"><label>Départ</label><input type="number" id="ws" value="${p.start}"></div>
              <div style="flex:1"><label>Confort</label><input type="number" id="wc" value="${p.comfort}"></div>
              <div style="flex:1"><label>Idéal</label><input type="number" id="wi" value="${p.ideal}"></div>
            </div>
          ` : ''}

          ${this._activeTab === 'sensors' ? `
            <div id="sl">
              ${(p.sensors || []).map((s, i) => `
                <div class="sensor-card">
                  <label>Nom / Icône</label>
                  <div style="display:flex; gap:5px;"><input type="text" class="sn" data-i="${i}" value="${s.name}"> <input type="text" class="si" data-i="${i}" value="${s.icon}"></div>
                  <label>Entité</label><input type="text" class="se" data-i="${i}" value="${s.entity}">
                  <div style="display:flex; gap:5px;">
                    <div style="flex:1"><label>X (%)</label><input type="number" class="sx" data-i="${i}" value="${s.x}"></div>
                    <div style="flex:1"><label>Y (%)</label><input type="number" class="sy" data-i="${i}" value="${s.y}"></div>
                    <div style="flex:1"><label>Rond ?</label><input type="checkbox" class="sc" data-i="${i}" ${s.is_circle?'checked':''}></div>
                  </div>
                </div>
              `).join('')}
            </div>
            <button id="add" style="width:100%; padding:12px; background:#4ade80; color:black; border:none; font-weight:bold; cursor:pointer; border-radius:4px;">➕ AJOUTER CAPTEUR</button>
          ` : ''}
        </div>
      </div>
    `;

    this.querySelectorAll('.tab-btn').forEach(btn => btn.onclick = () => { this._activeTab = btn.id.replace('t-',''); this.render(); });
    
    const save = () => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));

    if(this._activeTab === 'design') {
        this.querySelector('#h').onchange = (e) => { this._config.card_height = e.target.value; save(); };
        this.querySelector('#round').onchange = (e) => { this._config.card_round = e.target.value; save(); };
        this.querySelector('#fs').onchange = (e) => { this._config.font_size_val = e.target.value; save(); };
    }
    if(this._activeTab === 'profile') {
        this.querySelector('#name').onchange = (e) => { p.name = e.target.value; save(); };
        this.querySelector('#img').onchange = (e) => { p.image = e.target.value; save(); };
        this.querySelector('#we').onchange = (e) => { p.weight_ent = e.target.value; save(); };
        this.querySelector('#ws').onchange = (e) => { p.start = e.target.value; save(); };
        this.querySelector('#wc').onchange = (e) => { p.comfort = e.target.value; save(); };
        this.querySelector('#wi').onchange = (e) => { p.ideal = e.target.value; save(); };
    }
    if(this._activeTab === 'sensors') {
        this.querySelectorAll('.sn').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].name = e.target.value; save(); });
        this.querySelectorAll('.se').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].entity = e.target.value; save(); });
        this.querySelectorAll('.si').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].icon = e.target.value; save(); });
        this.querySelectorAll('.sx').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].x = e.target.value; save(); });
        this.querySelectorAll('.sy').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].y = e.target.value; save(); });
        this.querySelectorAll('.sc').forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i].is_circle = e.target.checked; save(); });
        this.querySelector('#add').onclick = () => { if(!p.sensors) p.sensors = []; p.sensors.push({name:"Nouveau", entity:"", x:50, y:50, is_circle:false, size:80, icon:"mdi:heart"}); save(); this.render(); };
    }
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V4.1", description: "Éditeur avec onglets" });
