class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  static getStubConfig() {
    return {
      type: "custom:health-dashboard-card",
      card_height: 600, card_round: 20,
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

    // Mise à jour de tous les capteurs de la liste
    if (p.sensors) {
      p.sensors.forEach((s, i) => {
        const el = this.shadowRoot.getElementById(`val-${i}`);
        if (el && this._hass.states[s.entity]) {
          const stateObj = this._hass.states[s.entity];
          el.textContent = `${stateObj.state}${s.unit || stateObj.attributes.unit_of_measurement || ''}`;
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
      if (lbl) lbl.textContent = cur + (p.weight_unit || 'kg');
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
        .btn { padding: 10px 20px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.6); color: white; cursor: pointer; backdrop-filter: blur(5px); transition: 0.3s; }
        .btn.active { background: ${accent}; color: black; border-color: ${accent}; font-weight: bold; }
        
        .sensor-box { position: absolute; transform: translate(-50%, -50%); background: rgba(15, 23, 42, 0.85); border: 2px solid ${accent}; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 5; backdrop-filter: blur(8px); text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; margin-bottom: 2px; }
        .value { font-weight: 900; }
        ha-icon { margin-bottom: 4px; }

        .weight-footer { position: absolute; bottom: 35px; left: 50%; transform: translateX(-50%); width: 90%; z-index: 10; }
        .track { position: relative; width: 100%; height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); }
        .gradient { position: absolute; inset: 0; background: linear-gradient(90deg, #f87171, #fbbf24, #4ade80); border-radius: 6px; }
        .ptr { position: absolute; top: -15px; width: 4px; height: 42px; background: white; box-shadow: 0 0 10px white; transition: left 1s cubic-bezier(0.4, 0, 0.2, 1); }
        .bubble { position: absolute; top: -45px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 12px; border-radius: 12px; font-weight: 900; font-size: 14px; border: 2px solid ${accent}; white-space: nowrap; }
        .marks { display: flex; justify-content: space-between; margin-top: 15px; font-size: 10px; font-weight: 900; text-shadow: 1px 1px 2px black; }
      </style>
      <div class="card">
        <div class="bg"></div>
        <div class="top-nav">
          <button class="btn ${view==='person1'?'active':''}" onclick="this.getRootNode().host.switch('person1')">${this._config.person1.name || 'P1'}</button>
          <button class="btn ${view==='person2'?'active':''}" onclick="this.getRootNode().host.switch('person2')">${this._config.person2.name || 'P2'}</button>
        </div>

        ${(p.sensors || []).map((s, i) => `
          <div class="sensor-box" style="
            left:${s.x}%; 
            top:${s.y}%; 
            width:${s.w || 120}px; 
            height:${s.h || 70}px; 
            border-radius:${s.round || 15}px;
            border-color: ${s.color || accent};
          ">
            <ha-icon icon="${s.icon || 'mdi:heart'}" style="--mdc-icon-size: ${s.icon_size || 24}px; color: ${s.color || accent};"></ha-icon>
            <div class="label" style="font-size: ${s.fs_label || 10}px;">${s.name}</div>
            <div class="value" id="val-${i}" style="font-size: ${s.fs_val || 16}px;">--</div>
          </div>
        `).join('')}

        <div class="weight-footer" style="display: ${p.weight_ent ? 'block' : 'none'}">
          <div class="track">
            <div class="gradient"></div>
            <div id="ptr" class="ptr"><div id="ptr-lbl" class="bubble">--</div></div>
          </div>
          <div class="marks">
            <span>DÉPART<br>${p.start}</span>
            <span style="color:#fbbf24">CONFORT<br>${p.comfort}</span>
            <span>IDÉAL<br>${p.ideal}</span>
          </div>
        </div>
      </div>
    `;
  }

  switch(v) { this._config.current_view = v; this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } })); this.render(); }
}

// --- ÉDITEUR ULTIME SANS LIMITES ---
class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'global'; }
  setConfig(config) { this._config = config; this.render(); }

  render() {
    const view = this._config.current_view || 'person1';
    const p = this._config[view];
    
    this.innerHTML = `
      <style>
        .gui { font-family: sans-serif; color: white; background: #1a1a1a; padding: 15px; }
        .tabs { display: flex; gap: 5px; margin-bottom: 20px; }
        .tab { flex: 1; padding: 10px; background: #333; border: none; color: #888; cursor: pointer; border-radius: 4px; font-weight: bold; font-size: 11px; }
        .tab.active { background: #38bdf8; color: black; }
        .sec { background: #252525; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #444; }
        label { display: block; font-size: 10px; color: #38bdf8; font-weight: bold; margin: 10px 0 5px; text-transform: uppercase; }
        input, select { width: 100%; background: #111; border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; box-sizing: border-box; }
        .s-card { background: #111; border-left: 4px solid #38bdf8; padding: 12px; margin-bottom: 15px; position: relative; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .del { color: #ff5252; font-size: 10px; cursor: pointer; text-align: right; display: block; margin-top: 5px; }
      </style>
      <div class="gui">
        <div class="tabs">
          <button class="tab ${this._tab==='global'?'active':''}" id="t-global">CARTE</button>
          <button class="tab ${this._tab==='profile'?'active':''}" id="t-profile">PROFIL</button>
          <button class="tab ${this._tab==='sensors'?'active':''}" id="t-sensors">ÉLÉMENTS</button>
        </div>

        ${this._tab === 'global' ? `
          <div class="sec">
            <label>Hauteur de la carte (pixels)</label><input type="number" id="h" value="${this._config.card_height}">
            <label>Arrondi des coins</label><input type="number" id="round" value="${this._config.card_round}">
          </div>
        ` : ''}

        ${this._tab === 'profile' ? `
          <div class="sec">
            <label>Nom de la personne</label><input type="text" id="name" value="${p.name}">
            <label>Image de fond (URL)</label><input type="text" id="img" value="${p.image}">
            <hr style="border:0; border-top:1px solid #444; margin:15px 0;">
            <label>Entité Poids (sensor.xxx)</label><input type="text" id="we" value="${p.weight_ent}">
            <div class="grid">
              <div><label>Poids Départ</label><input type="number" id="ws" value="${p.start}"></div>
              <div><label>Poids Idéal</label><input type="number" id="wi" value="${p.ideal}"></div>
              <div><label>Poids Confort</label><input type="number" id="wc" value="${p.comfort}"></div>
              <div><label>Unité</label><input type="text" id="wu" value="${p.weight_unit || 'kg'}"></div>
            </div>
          </div>
        ` : ''}

        ${this._tab === 'sensors' ? `
          <div id="sl">
            ${(p.sensors || []).map((s, i) => `
              <div class="s-card">
                <div class="grid">
                  <div><label>Nom</label><input type="text" class="sn" data-i="${i}" value="${s.name}"></div>
                  <div><label>Icône</label><input type="text" class="si" data-i="${i}" value="${s.icon}"></div>
                </div>
                <label>Entité (sensor.xxx)</label><input type="text" class="se" data-i="${i}" value="${s.entity}">
                <div class="grid">
                  <div><label>Position X (%)</label><input type="number" class="sx" data-i="${i}" value="${s.x}"></div>
                  <div><label>Position Y (%)</label><input type="number" class="sy" data-i="${i}" value="${s.y}"></div>
                  <div><label>Largeur (px)</label><input type="number" class="sw" data-i="${i}" value="${s.w}"></div>
                  <div><label>Hauteur (px)</label><input type="number" class="sh" data-i="${i}" value="${s.h}"></div>
                  <div><label>Police Val</label><input type="number" class="sfv" data-i="${i}" value="${s.fs_val}"></div>
                  <div><label>Couleur</label><input type="text" class="scol" data-i="${i}" value="${s.color || ''}"></div>
                </div>
                <span class="del" data-i="${i}">❌ Supprimer</span>
              </div>
            `).join('')}
          </div>
          <button id="add" style="width:100%; padding:15px; background:#4ade80; color:black; border:none; font-weight:bold; cursor:pointer; border-radius:8px;">➕ AJOUTER UN COMPOSANT</button>
        ` : ''}
      </div>
    `;

    // Gestion des onglets
    this.querySelectorAll('.tab').forEach(btn => btn.onclick = () => { this._tab = btn.id.replace('t-',''); this.render(); });
    
    const save = () => this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));

    // Bindings Global
    if(this._tab === 'global') {
      this.querySelector('#h').onchange = (e) => { this._config.card_height = e.target.value; save(); };
      this.querySelector('#round').onchange = (e) => { this._config.card_round = e.target.value; save(); };
    }
    // Bindings Profil
    if(this._tab === 'profile') {
      ['name','img','we','ws','wc','wi','wu'].forEach(id => {
        this.querySelector('#'+id).onchange = (e) => { 
          const key = id === 'we' ? 'weight_ent' : (id === 'ws' ? 'start' : (id === 'wi' ? 'ideal' : (id === 'wc' ? 'comfort' : (id === 'wu' ? 'weight_unit' : id))));
          p[key] = e.target.value; save(); 
        };
      });
    }
    // Bindings Capteurs
    if(this._tab === 'sensors') {
      const inputs = [
        {c:'sn', k:'name'}, {c:'se', k:'entity'}, {c:'si', k:'icon'}, 
        {c:'sx', k:'x'}, {c:'sy', k:'y'}, {c:'sw', k:'w'}, 
        {c:'sh', k:'h'}, {c:'sfv', k:'fs_val'}, {c:'scol', k:'color'}
      ];
      inputs.forEach(input => {
        this.querySelectorAll('.'+input.c).forEach(el => el.onchange = (e) => { p.sensors[el.dataset.i][input.k] = e.target.value; save(); });
      });
      this.querySelectorAll('.del').forEach(el => el.onclick = () => { p.sensors.splice(el.dataset.i, 1); save(); this.render(); });
      this.querySelector('#add').onclick = () => { 
        if(!p.sensors) p.sensors = []; 
        p.sensors.push({name:"Nouveau", entity:"", x:50, y:50, w:120, h:70, fs_val:16, icon:"mdi:heart", round:15}); 
        save(); this.render(); 
      };
    }
  }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: "health-dashboard-card", name: "Health Dashboard V5.0", description: "La version ultime sans limites" });
